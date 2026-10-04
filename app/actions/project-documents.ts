"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import {
  projectDocumentInputSchema,
  projectDocumentIdSchema,
  type ProjectDocumentFormState,
} from "@/lib/project-documents/schemas";

const PROJECT_DOCUMENT_BUCKET = "project-documents";
const PROJECT_DOCUMENT_SIGNED_URL_TTL_SECONDS = 600;

class ProjectDocumentUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectDocumentUploadError";
  }
}

function getStorageErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}

function getPrismaErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" && /^P\d{4}$/.test(error.code)) {
    return error.code;
  }
  return undefined;
}

function getPrismaErrorTarget(error: unknown) {
  if (typeof error !== "object" || error === null || !("meta" in error) || typeof error.meta !== "object" || error.meta === null) {
    return undefined;
  }

  const target = "target" in error.meta ? error.meta.target : undefined;
  if (typeof target === "string") return target;
  if (Array.isArray(target) && target.every((value) => typeof value === "string")) return target.join(",");
  return undefined;
}

function revalidateProjectDocumentViews(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}/documents`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/ai`);
}

function getSupabaseStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Document storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment, then restart the app.",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensurePrivateProjectDocumentBucket() {
  const supabase = getSupabaseStorageClient();
  const storage = supabase.storage;
  const bucketResult = await storage.getBucket(PROJECT_DOCUMENT_BUCKET);

  if (bucketResult.error) {
    if (bucketResult.error.statusCode !== "404") {
      console.error("Project document bucket lookup failed.", {
        statusCode: bucketResult.error.statusCode,
        code: getStorageErrorCode(bucketResult.error),
      });
      throw new ProjectDocumentUploadError(
        "Supabase could not access document storage. Verify the server-side service-role key and Supabase project URL.",
      );
    }

    const createResult = await storage.createBucket(PROJECT_DOCUMENT_BUCKET, { public: false });
    if (createResult.error) {
      const retryResult = await storage.getBucket(PROJECT_DOCUMENT_BUCKET);
      if (retryResult.error) {
        console.error("Private project document bucket creation failed.", {
          statusCode: createResult.error.statusCode,
          code: getStorageErrorCode(createResult.error),
        });
        throw new ProjectDocumentUploadError(
          "The private project-documents storage bucket could not be created. Check the service-role key and Supabase Storage availability.",
        );
      }
    }
  } else if (bucketResult.data.public) {
    throw new ProjectDocumentUploadError(
      "The project-documents bucket is public. Change it to private in Supabase Storage before uploading business documents.",
    );
  }

  return storage;
}

async function uploadToProjectStorage(file: File, projectId: string, organizationId: string, documentId: string) {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const storagePath = `organizations/${organizationId}/projects/${projectId}/documents/${documentId}/${sanitizedName}`;
  const storage = await ensurePrivateProjectDocumentBucket();

  const { error } = await storage.from(PROJECT_DOCUMENT_BUCKET).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
    cacheControl: "3600",
  });

  if (error) {
    const code = getStorageErrorCode(error);
    console.error("Project document upload failed.", {
      statusCode: error.statusCode,
      code,
    });
    if (error.statusCode === "401" || error.statusCode === "403") {
      throw new ProjectDocumentUploadError(
        "Supabase rejected access to document storage. Verify that SUPABASE_SERVICE_ROLE_KEY is the server-side service-role or secret key for this Supabase project.",
      );
    }
    if (error.statusCode === "413" || code === "FileSizeLimitExceeded") {
      throw new ProjectDocumentUploadError("This file exceeds the upload size limit configured in Supabase Storage.");
    }
    if (code === "Duplicate" || code === "ResourceAlreadyExists") {
      throw new ProjectDocumentUploadError("A file already exists at this storage location. Please try uploading again.");
    }
    throw new ProjectDocumentUploadError(
      "Supabase Storage could not save this file. Check the bucket's upload limits and allowed file types.",
    );
  }

  return { storagePath };
}

async function cleanupProjectDocumentStorageObject(storagePath: string | null) {
  if (!storagePath) return;

  try {
    const supabase = getSupabaseStorageClient();
    const { error } = await supabase.storage.from(PROJECT_DOCUMENT_BUCKET).remove([storagePath]);
    if (error) {
      console.error("Project document storage cleanup failed.", {
        statusCode: error.statusCode,
        code: getStorageErrorCode(error),
      });
    }
  } catch (error) {
    console.error("Project document storage cleanup failed.", error);
  }
}

async function deleteProjectDocumentStorageObject(storagePath: string | null) {
  if (!storagePath) return;

  const supabase = getSupabaseStorageClient();
  const { error } = await supabase.storage.from(PROJECT_DOCUMENT_BUCKET).remove([storagePath]);
  if (error) {
    const code = getStorageErrorCode(error);
    if (error.statusCode === "404" || code === "NoSuchKey" || code === "NotFound") {
      return;
    }
    console.error("Project document storage deletion failed.", {
      statusCode: error.statusCode,
      code,
    });
    throw new Error("The document file could not be deleted. Verify Supabase Storage access and try again.");
  }
}

export async function saveProjectDocument(
  _previousState: ProjectDocumentFormState,
  formData: FormData,
): Promise<ProjectDocumentFormState> {
  const { organization, profile } = await requireOrganization();
  const file = formData.get("file");
  const parsed = projectDocumentInputSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    documentType: formData.get("documentType"),
    isPrimary: formData.get("isPrimary"),
  });

  if (!parsed.success) {
    return { error: "Review the document details and try again." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a document to upload." };
  }

  let projectId: string | null = null;
  let storagePath: string | null = null;
  let failureStage = "project lookup";

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, organizationId: organization.id },
      select: { id: true, name: true },
    });

    if (!project) {
      return { error: "This project is unavailable in your workspace." };
    }
    projectId = project.id;

    const documentId = crypto.randomUUID();
    failureStage = "storage upload";
    const upload = await uploadToProjectStorage(file, project.id, organization.id, documentId);
    storagePath = upload.storagePath;

    failureStage = "database save";
    await prisma.$transaction(async (transaction) => {
      if (parsed.data.documentType === "PROJECT_BRIEF" && parsed.data.isPrimary) {
        failureStage = "primary brief update";
        await transaction.projectDocument.updateMany({
          where: { organizationId: organization.id, projectId: project.id, documentType: "PROJECT_BRIEF" },
          data: { isPrimary: false },
        });
      }

      failureStage = "document metadata insert";
      failureStage = "document metadata insert";
      const document = await transaction.projectDocument.create({
        data: {
          id: documentId,
          organizationId: organization.id,
          projectId: project.id,
          uploadedById: profile.id,
          name: parsed.data.name,
          originalName: file.name,
          documentType: parsed.data.documentType,
          mimeType: file.type || null,
          sizeBytes: file.size,
          storagePath,
          storageUrl: null,
          isPrimary: parsed.data.documentType === "PROJECT_BRIEF" && parsed.data.isPrimary,
        },
        select: { name: true },
      });

      failureStage = "upload activity insert";
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          projectId: project.id,
          type: "DOCUMENT_CREATED",
          description: `Uploaded "${document.name}" to ${project.name}.`,
        },
      });
      failureStage = "database transaction commit";
    });

    revalidateProjectDocumentViews(project.id);
    return { success: true };
  } catch (error) {
    await cleanupProjectDocumentStorageObject(storagePath);
    console.error("Project document save failed.", {
      stage: failureStage,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: getPrismaErrorCode(error),
      prismaTarget: getPrismaErrorTarget(error),
      statusCode: typeof error === "object" && error !== null && "statusCode" in error
        ? String(error.statusCode)
        : undefined,
      code: typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined,
      projectId,
    });

    if (error instanceof ProjectDocumentUploadError) {
      return { error: error.message };
    }
    if (error instanceof Error && error.message.startsWith("Document storage is not configured")) {
      return { error: error.message };
    }
    if (failureStage === "upload activity insert") {
      return {
        error: "The file uploaded, but its activity could not be recorded. The document save was rolled back; please try again.",
      };
    }
    if (failureStage === "document metadata insert" || failureStage === "database transaction commit" || failureStage === "primary brief update") {
      return {
        error: "The file uploaded, but its project document could not be saved. The upload was cleaned up; please try again.",
      };
    }
    if (failureStage === "database save") {
      return {
        error: "The file uploaded, but the database could not save its project document. The upload was cleaned up; please try again.",
      };
    }
    return { error: "The document could not be uploaded. Check the server logs for the upload stage and error code." };
  }
}

export async function getProjectDocumentAccessUrl(
  documentId: string,
  projectId: string,
  mode: "view" | "download" = "view",
): Promise<{ url?: string; error?: string }> {
  try {
    const { organization } = await requireOrganization();
    const parsedId = projectDocumentIdSchema.safeParse(documentId);
    const parsedProjectId = projectDocumentIdSchema.safeParse(projectId);

    if (!parsedId.success || !parsedProjectId.success) {
      return { error: "This document could not be opened." };
    }

    const document = await prisma.projectDocument.findFirst({
      where: { id: parsedId.data, organizationId: organization.id, projectId: parsedProjectId.data },
      select: {
        id: true,
        projectId: true,
        organizationId: true,
        storagePath: true,
        originalName: true,
      },
    });

    if (!document || !document.storagePath) {
      return { error: "The file is no longer available." };
    }

    const project = await prisma.project.findFirst({
      where: { id: parsedProjectId.data, organizationId: organization.id },
      select: { id: true },
    });

    if (!project) {
      return { error: "You don't have permission to access this document." };
    }

    const supabase = getSupabaseStorageClient();
    const { data, error } = await supabase.storage.from(PROJECT_DOCUMENT_BUCKET).createSignedUrl(
      document.storagePath,
      PROJECT_DOCUMENT_SIGNED_URL_TTL_SECONDS,
      mode === "download" ? { download: document.originalName } : undefined,
    );

    if (error || !data?.signedUrl) {
      console.error("Project document signed URL generation failed.", error);
      return { error: "This document could not be opened." };
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error("Project document access failed.", error);
    return { error: "This document could not be opened." };
  }
}

export async function deleteProjectDocument(formData: FormData): Promise<ProjectDocumentFormState> {
  const { organization, profile } = await requireOrganization();
  const documentId = formData.get("documentId");
  const projectId = formData.get("projectId");

  const parsedId = projectDocumentIdSchema.safeParse(documentId);
  const parsedProjectId = projectDocumentIdSchema.safeParse(projectId);

  if (!parsedId.success || !parsedProjectId.success) {
    return { error: "This document could not be deleted." };
  }

  let failureStage = "document lookup";
  try {
    const document = await prisma.projectDocument.findFirst({
      where: { id: parsedId.data, organizationId: organization.id, projectId: parsedProjectId.data },
      select: {
        id: true,
        name: true,
        storagePath: true,
        project: { select: { name: true } },
      },
    });

    if (!document) {
      return { error: "This document is unavailable in your workspace." };
    }

    failureStage = "storage deletion";
    await deleteProjectDocumentStorageObject(document.storagePath);

    failureStage = "document metadata deletion";
    await prisma.$transaction(async (transaction) => {
      await transaction.projectDocument.delete({
        where: { organizationId_id: { organizationId: organization.id, id: document.id } },
      });

      failureStage = "delete activity insert";
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          projectId: parsedProjectId.data,
          type: "DOCUMENT_DELETED",
          description: `Deleted "${document.name}" from ${document.project.name}.`,
        },
      });
      failureStage = "database transaction commit";
    });
  } catch (error) {
    console.error("Project document delete failed.", {
      stage: failureStage,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: getPrismaErrorCode(error),
      prismaTarget: getPrismaErrorTarget(error),
      statusCode: typeof error === "object" && error !== null && "statusCode" in error
        ? String(error.statusCode)
        : undefined,
      code: typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined,
      projectId: parsedProjectId.data,
    });
    if (failureStage === "document lookup") {
      return { error: "We couldn't load this document for deletion. Please try again." };
    }
    if (failureStage === "storage deletion" && error instanceof Error) {
      return { error: error.message };
    }
    return {
      error: failureStage === "document metadata deletion"
        ? "The file was removed, but its document record remains. Retry delete to finish cleaning it up."
        : failureStage === "delete activity insert"
          ? "The file was removed, but the deletion could not be recorded. Retry delete to finish cleaning up the document."
          : failureStage === "database transaction commit"
            ? "The file was removed, but the document changes could not be committed. Retry delete to finish cleaning up the document."
            : "The document could not be deleted. Check the server logs for the failure stage and error code.",
    };
  }

  revalidateProjectDocumentViews(parsedProjectId.data);
  return { success: true };
}

export async function setPrimaryProjectBrief(formData: FormData): Promise<ProjectDocumentFormState> {
  const { organization, profile } = await requireOrganization();
  const documentId = formData.get("documentId");
  const projectId = formData.get("projectId");

  const parsedId = projectDocumentIdSchema.safeParse(documentId);
  const parsedProjectId = projectDocumentIdSchema.safeParse(projectId);

  if (!parsedId.success || !parsedProjectId.success) {
    return { error: "This Project Brief could not be updated." };
  }

  let failureStage = "document lookup";
  try {
    const document = await prisma.projectDocument.findFirst({
      where: { organizationId: organization.id, projectId: parsedProjectId.data, id: parsedId.data },
      select: { id: true, name: true, documentType: true, isPrimary: true, project: { select: { name: true } } },
    });

    if (!document || document.documentType !== "PROJECT_BRIEF") {
      return { error: "This Project Brief is unavailable in your workspace." };
    }
    if (document.isPrimary) return { success: true };

    failureStage = "primary brief transaction";
    await prisma.$transaction(async (transaction) => {
      const updated = await transaction.projectDocument.updateMany({
        where: {
          organizationId: organization.id,
          projectId: parsedProjectId.data,
          id: document.id,
          documentType: "PROJECT_BRIEF",
          isPrimary: false,
        },
        data: { isPrimary: true },
      });
      if (updated.count !== 1) return;

      await transaction.projectDocument.updateMany({
        where: {
          organizationId: organization.id,
          projectId: parsedProjectId.data,
          documentType: "PROJECT_BRIEF",
          id: { not: document.id },
        },
        data: { isPrimary: false },
      });

      failureStage = "primary activity insert";
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          projectId: parsedProjectId.data,
          type: "DOCUMENT_PRIMARY_SET",
          description: `Set "${document.name}" as the primary brief for ${document.project.name}.`,
        },
      });
      failureStage = "primary transaction commit";
    });

    revalidateProjectDocumentViews(parsedProjectId.data);
    return { success: true };
  } catch (error) {
    console.error("Primary project brief update failed.", {
      stage: failureStage,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: getPrismaErrorCode(error),
      prismaTarget: getPrismaErrorTarget(error),
      projectId: parsedProjectId.data,
    });
    return {
      error: failureStage === "primary activity insert"
        ? "The primary brief could not be recorded. No changes were saved; please try again."
        : "The primary brief could not be updated. No changes were saved; please try again.",
    };
  }
}
