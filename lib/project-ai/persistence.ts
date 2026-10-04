import "server-only";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { analyzeProjectBrief } from "@/lib/project-ai/analysis";
import { getPrimaryProjectBriefForAnalysis } from "@/lib/project-ai/brief-content";
import { projectIntelligenceSchema, type AnalyzeProjectBriefResult, type ProjectBriefSourceMetadata } from "@/lib/project-ai/schemas";
import {
  currentProjectAIAnalysisOrderBy,
  getProjectAIAnalysisSourceAssessment,
  preferCurrentSourceProjectAIAnalysis,
  shouldRetryProjectAIAnalysis,
  type ProjectAIAnalysisStaleReason,
} from "@/lib/project-ai/currentness";
import { getProjectAIErrorMessage } from "@/lib/project-ai/errors";
import { env } from "@/lib/env";
import { getProjectWorkspace } from "@/lib/projects/workspace";
import { identifySuggestedTasks, type IdentifiedProjectIntelligence } from "@/lib/project-ai/suggestion-identity";

const PROJECT_AI_ANALYSIS_VERSION = 1;
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

type ProjectAIAnalysisStateStatus = "NO_BRIEF" | "READY" | "PROCESSING" | "COMPLETED" | "STALE" | "FAILED" | "SOURCE_MISSING";

type ProjectAIAnalysisSummary = {
  id: string;
  intelligence: IdentifiedProjectIntelligence;
  approvedSuggestions: Array<{ suggestionId: string; taskId: string | null }>;
  sourceDocumentId: string | null;
  sourceDocumentUpdatedAt: string;
  sourceDocumentName: string;
  sourceMetadata: ProjectBriefSourceMetadata | null;
  model: string;
  analysisVersion: number;
  createdAt: string;
  completedAt: string | null;
};

export type ProjectAIAnalysisState = {
  status: ProjectAIAnalysisStateStatus;
  primaryBrief: {
    id: string;
    name: string;
    originalName: string;
    mimeType: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  analysis: ProjectAIAnalysisSummary | null;
  analysisIsCurrent: boolean;
  analysisSourceMissing: boolean;
  analysisStaleReason: ProjectAIAnalysisStaleReason | null;
  errorMessage: string | null;
  latestFailureMessage: string | null;
};

function failedAIState(errorMessage: string): ProjectAIAnalysisState {
  return {
    status: "FAILED",
    primaryBrief: null,
    analysis: null,
    analysisIsCurrent: false,
    analysisSourceMissing: false,
    analysisStaleReason: null,
    errorMessage,
    latestFailureMessage: errorMessage,
  };
}

async function stateAfterPersistenceFailure(projectId: string): Promise<ProjectAIAnalysisState> {
  try {
    const state = await getProjectAIAnalysisState(projectId);
    const errorMessage = getProjectAIErrorMessage("AI_PERSISTENCE_FAILED");
    return { ...state, status: "FAILED", errorMessage, latestFailureMessage: errorMessage };
  } catch {
    return failedAIState(getProjectAIErrorMessage("AI_PERSISTENCE_FAILED"));
  }
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function toAnalysisSummary(analysis: {
  id: string;
  result: Prisma.JsonValue | null;
  sourceDocumentId: string | null;
  sourceDocumentName: string;
  sourceDocumentUpdatedAt: Date;
  model: string;
  analysisVersion: number;
  createdAt: Date;
  completedAt: Date | null;
}): ProjectAIAnalysisSummary | null {
  const parsed = projectIntelligenceSchema.safeParse(analysis.result);
  if (!parsed.success) {
    console.error("Stored project AI analysis failed schema validation.", { analysisId: analysis.id });
    return null;
  }

  const intelligence = identifySuggestedTasks(analysis.id, parsed.data);
  return {
    id: analysis.id,
    intelligence,
    approvedSuggestions: [],
    sourceDocumentId: analysis.sourceDocumentId,
    sourceDocumentUpdatedAt: analysis.sourceDocumentUpdatedAt.toISOString(),
    sourceDocumentName: analysis.sourceDocumentName,
    sourceMetadata: parsed.data.sourceMetadata ?? null,
    model: analysis.model,
    analysisVersion: analysis.analysisVersion,
    createdAt: analysis.createdAt.toISOString(),
    completedAt: analysis.completedAt?.toISOString() ?? null,
  };
}

export async function getProjectAIAnalysisState(projectId: string): Promise<ProjectAIAnalysisState> {
  const { organizationId, project } = await getProjectWorkspace(projectId);
  const primaryBrief = await prisma.projectDocument.findFirst({
    where: { organizationId, projectId: project.id, documentType: "PROJECT_BRIEF", isPrimary: true },
    select: { id: true, name: true, originalName: true, mimeType: true, createdAt: true, updatedAt: true },
  });
  const staleProcessingBefore = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
  const expiredProcessing = await prisma.projectAIAnalysis.updateMany({
    where: {
      organizationId,
      projectId: project.id,
      status: "PROCESSING",
      updatedAt: { lt: staleProcessingBefore },
    },
    data: { status: "FAILED", errorCode: "AI_TIMEOUT" },
  });
  if (expiredProcessing.count > 0) {
    console.warn("Expired project AI analysis attempts were marked failed.", {
      organizationId,
      projectId: project.id,
      count: expiredProcessing.count,
    });
  }
  const analysisSelect = {
    id: true,
    result: true,
    sourceDocumentId: true,
    sourceDocumentName: true,
    sourceDocumentUpdatedAt: true,
    model: true,
    analysisVersion: true,
    createdAt: true,
    completedAt: true,
    suggestionApprovals: {
      select: { suggestionId: true, taskId: true },
    },
  } as const;
  const [currentSourceCompleted, mostRecentCompleted, processing, latestFailure] = await Promise.all([
    primaryBrief
      ? prisma.projectAIAnalysis.findFirst({
          where: {
            organizationId,
            projectId: project.id,
            sourceDocumentId: primaryBrief.id,
            sourceDocumentUpdatedAt: primaryBrief.updatedAt,
            status: "COMPLETED",
          },
          orderBy: currentProjectAIAnalysisOrderBy,
          select: analysisSelect,
        })
      : Promise.resolve(null),
    prisma.projectAIAnalysis.findFirst({
      where: { organizationId, projectId: project.id, status: "COMPLETED" },
      orderBy: currentProjectAIAnalysisOrderBy,
      select: analysisSelect,
    }),
    primaryBrief
      ? prisma.projectAIAnalysis.findFirst({
          where: {
            organizationId,
            projectId: project.id,
            sourceDocumentId: primaryBrief.id,
            sourceDocumentUpdatedAt: primaryBrief.updatedAt,
            status: "PROCESSING",
            updatedAt: { gte: new Date(Date.now() - PROCESSING_TIMEOUT_MS) },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.projectAIAnalysis.findFirst({
      where: {
        organizationId,
        projectId: project.id,
        status: "FAILED",
        ...(primaryBrief
          ? {
              sourceDocumentId: primaryBrief.id,
              sourceDocumentUpdatedAt: primaryBrief.updatedAt,
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { errorCode: true, createdAt: true },
    }),
  ]);

  const completed = preferCurrentSourceProjectAIAnalysis(currentSourceCompleted, mostRecentCompleted);
  const analysis = completed ? toAnalysisSummary(completed) : null;
  if (analysis && completed) {
    analysis.approvedSuggestions = completed.suggestionApprovals;
  }
  const sourceDocument = completed?.sourceDocumentId
    ? await prisma.projectDocument.findFirst({
        where: {
          id: completed.sourceDocumentId,
          organizationId,
          projectId: project.id,
          documentType: "PROJECT_BRIEF",
        },
        select: { id: true, updatedAt: true, isPrimary: true },
      })
    : null;
  const sourceAssessment = completed
    ? getProjectAIAnalysisSourceAssessment({
        sourceDocumentId: completed.sourceDocumentId,
        sourceDocumentUpdatedAt: completed.sourceDocumentUpdatedAt,
        sourceDocumentExists: Boolean(sourceDocument),
        currentPrimaryDocumentId: primaryBrief?.id ?? null,
        currentPrimaryDocumentUpdatedAt: primaryBrief?.updatedAt ?? null,
      })
    : null;
  const sourceState = sourceAssessment?.state ?? null;
  const sourceIsCurrent = sourceState === "CURRENT";
  const analysisSourceMissing = Boolean(completed && !sourceDocument);
  const analysisStaleReason = sourceAssessment?.staleReason ?? null;
  const latestFailureMessage = latestFailure?.errorCode
    ? getProjectAIErrorMessage(latestFailure.errorCode)
    : null;
  const latestAttemptFailed = Boolean(
    latestFailure &&
    (!completed || latestFailure.createdAt.getTime() > completed.createdAt.getTime()),
  );

  let status: ProjectAIAnalysisStateStatus;
  let errorMessage: string | null = null;

  if (!primaryBrief) {
    status = analysisSourceMissing || sourceState === "SOURCE_MISSING" ? "SOURCE_MISSING" : "NO_BRIEF";
    if (analysisSourceMissing) {
      errorMessage = "The Project Brief used for this analysis is no longer available.";
    }
  } else if (processing) {
    status = "PROCESSING";
  } else if (completed && !analysis) {
    status = "FAILED";
    errorMessage = "The saved project analysis could not be validated.";
  } else if (latestAttemptFailed) {
    status = "FAILED";
    errorMessage = latestFailure?.errorCode
      ? getProjectAIErrorMessage(latestFailure.errorCode)
      : "We couldn't generate project intelligence from the current brief.";
  } else if (analysis) {
    status = sourceIsCurrent ? "COMPLETED" : sourceDocument ? "STALE" : "SOURCE_MISSING";
    if (status === "STALE") errorMessage = "This analysis is based on an older project brief.";
    if (status === "SOURCE_MISSING") errorMessage = "The Project Brief used for this analysis is no longer available.";
  } else if (latestFailure) {
    status = "FAILED";
    errorMessage = getProjectAIErrorMessage(latestFailure?.errorCode);
  } else {
    status = "READY";
  }

  return {
    status,
    primaryBrief: primaryBrief
      ? {
          id: primaryBrief.id,
          name: primaryBrief.name,
          originalName: primaryBrief.originalName,
          mimeType: primaryBrief.mimeType,
          createdAt: primaryBrief.createdAt.toISOString(),
          updatedAt: primaryBrief.updatedAt.toISOString(),
        }
      : null,
    analysis,
    analysisIsCurrent: sourceIsCurrent,
    analysisSourceMissing,
    analysisStaleReason,
    errorMessage,
    latestFailureMessage,
  };
}

async function failAnalysis(analysisId: string, organizationId: string, projectId: string, code: string) {
  await prisma.projectAIAnalysis.updateMany({
    where: { id: analysisId, organizationId, projectId, status: "PROCESSING" },
    data: { status: "FAILED", errorCode: code },
  });
}

export async function runAndPersistProjectAnalysis(
  projectId: string,
): Promise<ProjectAIAnalysisState> {
  const { organizationId, project } = await getProjectWorkspace(projectId);
  const { profile, organization } = await requireOrganization();

  if (organization.id !== organizationId) {
    return getProjectAIAnalysisState(project.id);
  }

  const { document } = await getPrimaryProjectBriefForAnalysis(project.id);
  if (!document || !document.isPrimary) {
    return getProjectAIAnalysisState(project.id);
  }

  const [alreadyCompleted, latestFailure] = await Promise.all([
    prisma.projectAIAnalysis.findFirst({
      where: {
        organizationId,
        projectId: project.id,
        sourceDocumentId: document.id,
        sourceDocumentUpdatedAt: document.updatedAt,
        status: "COMPLETED",
      },
      orderBy: currentProjectAIAnalysisOrderBy,
      select: { createdAt: true },
    }),
    prisma.projectAIAnalysis.findFirst({
      where: {
        organizationId,
        projectId: project.id,
        sourceDocumentId: document.id,
        sourceDocumentUpdatedAt: document.updatedAt,
        status: "FAILED",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  const shouldRetry = shouldRetryProjectAIAnalysis({
    latestCompletedAttemptAt: alreadyCompleted?.createdAt ?? null,
    latestFailureAt: latestFailure?.createdAt ?? null,
  });
  if (!shouldRetry) return getProjectAIAnalysisState(project.id);

  const staleProcessingBefore = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
  await prisma.projectAIAnalysis.updateMany({
    where: {
      organizationId,
      projectId: project.id,
      sourceDocumentId: document.id,
      sourceDocumentUpdatedAt: document.updatedAt,
      status: "PROCESSING",
      updatedAt: { lt: staleProcessingBefore },
    },
    data: { status: "FAILED", errorCode: "AI_TIMEOUT" },
  });

  const processingAnalysis = await prisma.projectAIAnalysis.findFirst({
    where: {
      organizationId,
      projectId: project.id,
      sourceDocumentId: document.id,
      sourceDocumentUpdatedAt: document.updatedAt,
      status: "PROCESSING",
    },
    select: { id: true },
  });
  if (processingAnalysis) return getProjectAIAnalysisState(project.id);

  let analysisId: string;
  try {
    const created = await prisma.projectAIAnalysis.create({
      data: {
        organizationId,
        projectId: project.id,
        sourceDocumentId: document.id,
        sourceDocumentName: document.originalName,
        sourceDocumentUpdatedAt: document.updatedAt,
        status: "PROCESSING",
        model: env.GEMINI_MODEL,
        analysisVersion: PROJECT_AI_ANALYSIS_VERSION,
      },
      select: { id: true },
    });
    analysisId = created.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) return getProjectAIAnalysisState(project.id);
    console.error("Project AI analysis attempt could not be created.", {
      organizationId,
      projectId: project.id,
      documentId: document.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
    return stateAfterPersistenceFailure(project.id);
  }

  let result: AnalyzeProjectBriefResult;
  try {
    result = await analyzeProjectBrief(project.id, document.id);
  } catch (error) {
    console.error("Project AI analysis request failed unexpectedly.", {
      projectId: project.id,
      analysisId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    await safelyFailAnalysis(analysisId, organizationId, project.id, "UNKNOWN_AI_ERROR");
    revalidateProjectAIViews(project.id);
    return getProjectAIAnalysisState(project.id);
  }

  if (!result.success) {
    await safelyFailAnalysis(analysisId, organizationId, project.id, result.code);
    revalidateProjectAIViews(project.id);
    return getProjectAIAnalysisState(project.id);
  }

  if (
    result.sourceDocumentId !== document.id ||
    new Date(result.sourceDocumentUpdatedAt).getTime() !== document.updatedAt.getTime()
  ) {
    await safelyFailAnalysis(analysisId, organizationId, project.id, "AI_ANALYSIS_STALE");
    revalidateProjectAIViews(project.id);
    return getProjectAIAnalysisState(project.id);
  }

  try {
    const persisted = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.projectAIAnalysis.updateMany({
        where: { id: analysisId, organizationId, projectId: project.id, status: "PROCESSING" },
        data: {
          sourceDocumentName: result.sourceDocumentName,
          model: result.model,
          result: {
            ...identifySuggestedTasks(analysisId, result.intelligence),
            sourceMetadata: result.sourceMetadata,
          } as Prisma.InputJsonValue,
          status: "COMPLETED",
          errorCode: null,
          completedAt: new Date(),
        },
      });
      if (updated.count !== 1) return false;
      await transaction.activity.create({
        data: {
          organizationId,
          actorId: profile.id,
          projectId: project.id,
          type: "PROJECT_AI_ANALYZED",
          description: `Analyzed "${result.sourceDocumentName}" for ${project.name}.`,
        },
      });
      return true;
    });
    if (!persisted) {
      console.warn("Project AI analysis result was not persisted because its processing attempt was no longer active.", {
        organizationId,
        projectId: project.id,
        analysisId,
        documentId: result.sourceDocumentId,
      });
      revalidateProjectAIViews(project.id);
      return getProjectAIAnalysisState(project.id);
    }
  } catch (error) {
    console.error("Project AI analysis could not be persisted.", {
      organizationId,
      projectId: project.id,
      analysisId,
      documentId: result.sourceDocumentId,
      errorCode: "AI_PERSISTENCE_FAILED",
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
    await safelyFailAnalysis(analysisId, organizationId, project.id, "AI_PERSISTENCE_FAILED");
  }

  revalidateProjectAIViews(project.id);
  return getProjectAIAnalysisState(project.id);
}

async function safelyFailAnalysis(analysisId: string, organizationId: string, projectId: string, code: string) {
  try {
    await failAnalysis(analysisId, organizationId, projectId, code);
  } catch (error) {
    console.error("Project AI analysis attempt could not be marked failed.", {
      organizationId,
      projectId,
      analysisId,
      errorCode: code,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
  }
}

function revalidateProjectAIViews(projectId: string) {
  revalidatePath(`/projects/${projectId}/ai`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}
