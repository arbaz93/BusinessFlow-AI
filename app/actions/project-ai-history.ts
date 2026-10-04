"use server";

import { z } from "zod";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { getProjectAIAnalysisSourceState, isCurrentProjectAIAnalysis } from "@/lib/project-ai/currentness";
import { formatProjectAIAnalysisDate } from "@/lib/project-ai/history-format";
import { getProjectAIAnalysisState } from "@/lib/project-ai/persistence";
import { getProjectAIAnalysisFeedback, type ProjectAIAnalysisFeedbackView } from "@/lib/project-ai/feedback";
import { projectIntelligenceSchema } from "@/lib/project-ai/schemas";
import { identifySuggestedTasks } from "@/lib/project-ai/suggestion-identity";

const projectIdSchema = z.string().trim().min(1).max(64);
const analysisIdSchema = z.string().trim().min(1).max(64);

export type ProjectAIAnalysisDetailResult =
  | {
      success: true;
      analysis: {
        id: string;
        intelligence: ReturnType<typeof identifySuggestedTasks>;
        sourceDocumentId: string | null;
        sourceDocumentName: string | null;
        sourceDocumentAvailable: boolean;
        sourceDocumentUpdatedAt: string;
        sourceDocumentUpdatedAtLabel: string;
        createdAt: string;
        completedAt: string | null;
        analyzedAt: string;
        analyzedAtLabel: string;
        analysisVersion: number;
        isCurrent: boolean;
        isStale: boolean;
        feedback: ProjectAIAnalysisFeedbackView[];
      };
    }
  | { success: false; error: string };

export async function getProjectAIAnalysisDetail(
  rawProjectId: string,
  rawAnalysisId: string,
): Promise<ProjectAIAnalysisDetailResult> {
  const { organization } = await requireOrganization();
  const projectId = projectIdSchema.safeParse(rawProjectId);
  const analysisId = analysisIdSchema.safeParse(rawAnalysisId);
  if (!projectId.success || !analysisId.success) {
    return { success: false, error: "This analysis could not be displayed." };
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId.data, organizationId: organization.id },
      select: { id: true },
    });
    if (!project) return { success: false, error: "This analysis is unavailable in this project." };

    const [analysis, currentState] = await Promise.all([
      prisma.projectAIAnalysis.findFirst({
        where: {
          id: analysisId.data,
          organizationId: organization.id,
          projectId: project.id,
          status: "COMPLETED",
        },
        select: {
          id: true,
          result: true,
          sourceDocumentId: true,
          sourceDocumentName: true,
          sourceDocumentUpdatedAt: true,
          createdAt: true,
          completedAt: true,
          analysisVersion: true,
        },
      }),
      getProjectAIAnalysisState(project.id),
    ]);
    if (!analysis || !analysis.result) {
      return { success: false, error: "This analysis could not be displayed." };
    }

    const parsedResult = projectIntelligenceSchema.safeParse(analysis.result);
    if (!parsedResult.success) {
      console.error("Historical project AI analysis failed schema validation.", {
        projectId: project.id,
        analysisId: analysis.id,
      });
      return { success: false, error: "This analysis could not be displayed." };
    }

    const [sourceDocument, primaryBrief] = await Promise.all([
      analysis.sourceDocumentId
        ? prisma.projectDocument.findFirst({
            where: {
              id: analysis.sourceDocumentId,
              organizationId: organization.id,
              projectId: project.id,
              documentType: "PROJECT_BRIEF",
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      currentState.primaryBrief
        ? prisma.projectDocument.findFirst({
            where: {
              id: currentState.primaryBrief.id,
              organizationId: organization.id,
              projectId: project.id,
              documentType: "PROJECT_BRIEF",
              isPrimary: true,
            },
            select: { id: true, updatedAt: true },
          })
        : Promise.resolve(null),
    ]);
    const sourceState = getProjectAIAnalysisSourceState({
      sourceDocumentId: analysis.sourceDocumentId,
      sourceDocumentUpdatedAt: analysis.sourceDocumentUpdatedAt,
      sourceDocumentExists: Boolean(sourceDocument),
      currentPrimaryDocumentId: primaryBrief?.id ?? null,
      currentPrimaryDocumentUpdatedAt: primaryBrief?.updatedAt ?? null,
    });
    const isCurrent = currentState.analysisIsCurrent && isCurrentProjectAIAnalysis({
      analysisId: analysis.id,
      currentAnalysisId: currentState.analysis?.id ?? null,
      sourceState,
    });
    const analyzedAt = analysis.completedAt ?? analysis.createdAt;
    let feedback: ProjectAIAnalysisFeedbackView[] = [];
    try {
      feedback = await getProjectAIAnalysisFeedback(project.id, analysis.id);
    } catch (error) {
      console.error("Historical project AI feedback could not be loaded.", {
        projectId: project.id,
        analysisId: analysis.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return {
      success: true,
      analysis: {
        id: analysis.id,
        intelligence: identifySuggestedTasks(analysis.id, parsedResult.data),
        sourceDocumentId: sourceDocument?.id ?? null,
        sourceDocumentName: analysis.sourceDocumentName || null,
        sourceDocumentAvailable: sourceDocument !== null,
        sourceDocumentUpdatedAt: analysis.sourceDocumentUpdatedAt.toISOString(),
        sourceDocumentUpdatedAtLabel: formatProjectAIAnalysisDate(analysis.sourceDocumentUpdatedAt),
        createdAt: analysis.createdAt.toISOString(),
        completedAt: analysis.completedAt?.toISOString() ?? null,
        analyzedAt: analyzedAt.toISOString(),
        analyzedAtLabel: formatProjectAIAnalysisDate(analyzedAt),
        analysisVersion: analysis.analysisVersion,
        isCurrent,
        isStale: sourceState === "STALE",
        feedback,
      },
    };
  } catch (error) {
    console.error("Historical project AI analysis could not be loaded.", {
      projectId: projectId.data,
      analysisId: analysisId.data,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
    return { success: false, error: "This analysis could not be displayed." };
  }
}
