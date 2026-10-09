import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { getProjectWorkspace } from "@/lib/projects/workspace";
import { extractProjectBriefText, isSupportedProjectBrief } from "@/lib/project-ai/extraction";
import type { ProjectBriefContentResult } from "@/lib/project-ai/schemas";
import { getPublicEnv, getServerEnv } from "@/lib/env";

export const MAX_PROJECT_BRIEF_EXTRACTED_CHARS = 200000;
export const MAX_PROJECT_BRIEF_FILE_BYTES = 20 * 1024 * 1024;
export const PROJECT_BRIEF_STORAGE_TIMEOUT_MS = 20_000;

const PROJECT_DOCUMENT_BUCKET = "project-documents";

function getSupabaseStorageClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Project document storage configuration is missing.");
  }

  return createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function storageErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

function storageErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;
  const value = "status" in error ? error.status : "statusCode" in error ? error.statusCode : undefined;
  return typeof value === "number" || typeof value === "string" ? String(value) : undefined;
}

function classifyStorageError(error: unknown) {
  const status = storageErrorStatus(error);
  const code = storageErrorCode(error);
  if (status === "404" || code === "NoSuchKey" || code === "NotFound" || code === "ObjectNotFound") {
    return "DOCUMENT_NOT_FOUND" as const;
  }
  if (status === "401" || status === "403" || code === "AccessDenied" || code === "Unauthorized") {
    return "DOCUMENT_ACCESS_DENIED" as const;
  }
  return "DOCUMENT_STORAGE_UNAVAILABLE" as const;
}

function extractionFailure(errorCode: Extract<ProjectBriefContentResult, { ok: false }>["errorCode"]): ProjectBriefContentResult {
  return { ok: false, errorCode, truncated: false };
}

export async function getPrimaryProjectBriefForAnalysis(projectId: string) {
  const { organizationId, project } = await getProjectWorkspace(projectId);
  const document = await prisma.projectDocument.findFirst({
    where: {
      organizationId,
      projectId: project.id,
      documentType: "PROJECT_BRIEF",
      isPrimary: true,
    },
    select: {
      id: true,
      name: true,
      originalName: true,
      documentType: true,
      mimeType: true,
      sizeBytes: true,
      storagePath: true,
      createdAt: true,
      updatedAt: true,
      isPrimary: true,
    },
  });
  return { organizationId, project, document };
}

export async function extractProjectBriefContent(projectId: string, expectedDocumentId?: string): Promise<ProjectBriefContentResult> {
  let document: Awaited<ReturnType<typeof getPrimaryProjectBriefForAnalysis>>["document"];
  let organizationId: string;
  try {
    const primary = await getPrimaryProjectBriefForAnalysis(projectId);
    document = primary.document;
    organizationId = primary.organizationId;
  } catch (error) {
    console.error("Project brief metadata lookup failed.", {
      projectId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return extractionFailure("DOCUMENT_EXTRACTION_FAILED");
  }

  if (!document || !document.isPrimary) return extractionFailure("NO_PRIMARY_BRIEF");
  if (expectedDocumentId && document.id !== expectedDocumentId) return extractionFailure("DOCUMENT_NOT_FOUND");
  if (!document.storagePath) return extractionFailure("DOCUMENT_NOT_FOUND");
  if (!isSupportedProjectBrief(document.originalName, document.mimeType)) {
    return extractionFailure("UNSUPPORTED_DOCUMENT_TYPE");
  }
  if (document.sizeBytes === 0) return extractionFailure("DOCUMENT_NO_TEXT");
  if (document.sizeBytes !== null && document.sizeBytes > MAX_PROJECT_BRIEF_FILE_BYTES) {
    return extractionFailure("DOCUMENT_TOO_LARGE");
  }

  let supabase;
  try {
    supabase = getSupabaseStorageClient();
  } catch (error) {
    console.error("Project brief storage is not configured.", {
      organizationId,
      projectId,
      documentId: document.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return extractionFailure("DOCUMENT_STORAGE_UNAVAILABLE");
  }

  let data: Blob | null;
  try {
    const result = await supabase.storage
      .from(PROJECT_DOCUMENT_BUCKET)
      .download(document.storagePath, {}, { signal: AbortSignal.timeout(PROJECT_BRIEF_STORAGE_TIMEOUT_MS) });
    if (result.error || !result.data) {
      const errorCode = classifyStorageError(result.error);
      console.error("Project brief storage download failed.", {
        organizationId,
        projectId,
        documentId: document.id,
        errorCode,
        status: storageErrorStatus(result.error),
        storageCode: storageErrorCode(result.error),
      });
      return extractionFailure(errorCode);
    }
    data = result.data;
  } catch (error) {
    const errorCode = error instanceof Error && error.name === "TimeoutError"
      ? "DOCUMENT_STORAGE_UNAVAILABLE"
      : classifyStorageError(error);
    console.error("Project brief storage request failed.", {
      organizationId,
      projectId,
      documentId: document.id,
      errorCode,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return extractionFailure(errorCode);
  }

  if (data.size > MAX_PROJECT_BRIEF_FILE_BYTES) return extractionFailure("DOCUMENT_TOO_LARGE");
  if (data.size === 0) return extractionFailure("DOCUMENT_NO_TEXT");

  let extraction: Awaited<ReturnType<typeof extractProjectBriefText>>;
  try {
    const buffer = Buffer.from(await data.arrayBuffer());
    extraction = await extractProjectBriefText(buffer, document.originalName, document.mimeType);
  } catch (error) {
    console.error("Project brief text extraction failed.", {
      organizationId,
      projectId,
      documentId: document.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return extractionFailure("DOCUMENT_EXTRACTION_FAILED");
  }

  if (!extraction.supported) return extractionFailure("UNSUPPORTED_DOCUMENT_TYPE");
  if (extraction.failed) return extractionFailure("DOCUMENT_EXTRACTION_FAILED");
  if (!extraction.content || !extraction.content.trim()) return extractionFailure("DOCUMENT_NO_TEXT");

  const originalCharacterCount = extraction.content.length;
  const content = extraction.content.slice(0, MAX_PROJECT_BRIEF_EXTRACTED_CHARS);
  return {
    ok: true,
    content,
    source: document.originalName,
    sourceDocumentId: document.id,
    sourceDocumentName: document.originalName,
    sourceDocumentUpdatedAt: document.updatedAt.toISOString(),
    truncated: originalCharacterCount > content.length,
    originalCharacterCount,
    finalCharacterCount: content.length,
  };
}