import "server-only";

import { prisma } from "@/lib/db/prisma";
import { extractProjectBriefContent } from "@/lib/project-ai/brief-content";
import type {
  AssistantDocumentSummary,
  AssistantBriefContext,
} from "@/lib/assistant/context/types";

export { type AssistantDocumentSummary, type AssistantBriefContext };

function toDocumentSummary(document: {
  id: string;
  name: string;
  originalName: string;
  documentType: string;
  mimeType: string | null;
  sizeBytes: number | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AssistantDocumentSummary {
  return {
    documentId: document.id,
    name: document.name,
    originalName: document.originalName,
    type: document.documentType,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    isPrimary: document.isPrimary,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function getAssistantProjectDocuments(
  organizationId: string,
  projectId: string,
  limit: number,
): Promise<AssistantDocumentSummary[]> {
  const documents = await prisma.projectDocument.findMany({
    where: { organizationId, projectId },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      originalName: true,
      documentType: true,
      mimeType: true,
      sizeBytes: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return documents.map(toDocumentSummary);
}

export async function getAssistantBriefContent(
  projectId: string,
  expectedDocumentId?: string,
): Promise<AssistantBriefContext | null> {
  const result = await extractProjectBriefContent(projectId, expectedDocumentId);
  if (!result || !result.ok) return null;

  return {
    documentId: result.sourceDocumentId,
    name: result.sourceDocumentName,
    originalName: result.source,
    truncated: result.truncated || result.originalCharacterCount > result.finalCharacterCount,
    sourceDocumentUpdatedAt: new Date(result.sourceDocumentUpdatedAt),
    content: result.content,
  };
}
