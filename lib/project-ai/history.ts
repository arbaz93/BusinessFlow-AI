import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getProjectAIAnalysisSourceState, isCurrentProjectAIAnalysis } from "@/lib/project-ai/currentness";
import { formatProjectAIAnalysisDate } from "@/lib/project-ai/history-format";
import { getProjectWorkspace } from "@/lib/projects/workspace";

export const PROJECT_AI_ANALYSIS_HISTORY_LIMIT = 10;

export type ProjectAIAnalysisHistoryEntry = {
  id: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  sourceDocumentId: string | null;
  sourceDocumentName: string | null;
  sourceDocumentAvailable: boolean;
  sourceDocumentUpdatedAt: string;
  createdAt: string;
  completedAt: string | null;
  analyzedAt: string;
  analyzedAtLabel: string;
  analysisVersion: number;
  isCurrent: boolean;
  isStale: boolean;
};

export async function getProjectAIAnalysisHistory(
  projectId: string,
  currentAnalysisId: string | null,
  currentAnalysisIsCurrent: boolean,
): Promise<ProjectAIAnalysisHistoryEntry[]> {
  const { organizationId, project } = await getProjectWorkspace(projectId);
  const [analyses, primaryBrief] = await Promise.all([
    prisma.projectAIAnalysis.findMany({
      where: { organizationId, projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: PROJECT_AI_ANALYSIS_HISTORY_LIMIT,
      select: {
        id: true,
        status: true,
        sourceDocumentName: true,
        sourceDocumentId: true,
        sourceDocumentUpdatedAt: true,
        createdAt: true,
        completedAt: true,
        analysisVersion: true,
      },
    }),
    prisma.projectDocument.findFirst({
      where: {
        organizationId,
        projectId: project.id,
        documentType: "PROJECT_BRIEF",
        isPrimary: true,
      },
      select: { id: true, updatedAt: true },
    }),
  ]);

  if (!analyses.length) return [];

  const sourceDocumentIds = analyses.flatMap((analysis) =>
    analysis.sourceDocumentId ? [analysis.sourceDocumentId] : [],
  );
  const sourceDocuments = sourceDocumentIds.length
    ? await prisma.projectDocument.findMany({
        where: {
          organizationId,
          projectId: project.id,
          documentType: "PROJECT_BRIEF",
          id: { in: sourceDocumentIds },
        },
        select: { id: true },
      })
    : [];
  const sourceDocumentById = new Map(sourceDocuments.map((document) => [document.id, document]));

  return analyses.map((analysis) => {
    const sourceDocument = analysis.sourceDocumentId
      ? sourceDocumentById.get(analysis.sourceDocumentId) ?? null
      : null;
    const sourceState = getProjectAIAnalysisSourceState({
      sourceDocumentId: analysis.sourceDocumentId,
      sourceDocumentUpdatedAt: analysis.sourceDocumentUpdatedAt,
      sourceDocumentExists: Boolean(sourceDocument),
      currentPrimaryDocumentId: primaryBrief?.id ?? null,
      currentPrimaryDocumentUpdatedAt: primaryBrief?.updatedAt ?? null,
    });
    const isCurrent = analysis.status === "COMPLETED" &&
      currentAnalysisIsCurrent &&
      isCurrentProjectAIAnalysis({
        analysisId: analysis.id,
        currentAnalysisId,
        sourceState,
      });
    const analyzedAt = analysis.completedAt ?? analysis.createdAt;

    return {
      id: analysis.id,
      status: analysis.status,
      sourceDocumentId: sourceDocument?.id ?? null,
      sourceDocumentName: analysis.sourceDocumentName || null,
      sourceDocumentAvailable: sourceDocument !== null,
      sourceDocumentUpdatedAt: analysis.sourceDocumentUpdatedAt.toISOString(),
      createdAt: analysis.createdAt.toISOString(),
      completedAt: analysis.completedAt?.toISOString() ?? null,
      analyzedAt: analyzedAt.toISOString(),
      analyzedAtLabel: formatProjectAIAnalysisDate(analyzedAt),
      analysisVersion: analysis.analysisVersion,
      isCurrent,
      isStale: analysis.status === "COMPLETED" && sourceState === "STALE",
    };
  });
}
