"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import {
  isValidProjectAIAnalysisFeedbackTarget,
} from "@/lib/project-ai/feedback-identities";
import {
  submitAIAnalysisFeedbackSchema,
  type AIAnalysisFeedbackType,
} from "@/lib/project-ai/feedback-schemas";
import { projectIntelligenceSchema } from "@/lib/project-ai/schemas";
import { identifySuggestedTasks } from "@/lib/project-ai/suggestion-identity";

export type SubmitProjectAIAnalysisFeedbackResult =
  | {
      success: true;
      message: string;
      feedback: {
        targetType: "ANALYSIS" | "SUMMARY" | "REQUIREMENT" | "DELIVERABLE" | "RISK" | "MISSING_INFORMATION" | "SUGGESTED_TASK";
        targetId: string;
        feedbackType: AIAnalysisFeedbackType;
        comment: string | null;
        createdAt: string;
        updatedAt: string;
        authorName: string;
        isOwn: true;
      };
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function submitProjectAIAnalysisFeedbackAction(
  _previousResult: SubmitProjectAIAnalysisFeedbackResult | null,
  formData: FormData,
): Promise<SubmitProjectAIAnalysisFeedbackResult> {
  const { organization, profile } = await requireOrganization();
  const parsed = submitAIAnalysisFeedbackSchema.safeParse({
    projectId: formData.get("projectId"),
    analysisId: formData.get("analysisId"),
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    feedbackType: formData.get("feedbackType"),
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Review the feedback details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { projectId, analysisId, targetType, targetId, feedbackType, comment } = parsed.data;
  try {
    const saved = await prisma.$transaction(async (transaction) => {
      const project = await transaction.project.findFirst({
        where: { id: projectId, organizationId: organization.id },
        select: { id: true },
      });
      if (!project) return { kind: "unavailable" as const };

      const analysis = await transaction.projectAIAnalysis.findFirst({
        where: {
          id: analysisId,
          organizationId: organization.id,
          projectId: project.id,
          status: "COMPLETED",
        },
        select: { id: true, result: true },
      });
      if (!analysis || !analysis.result) return { kind: "unavailable" as const };

      const intelligence = projectIntelligenceSchema.safeParse(analysis.result);
      const suggestedTaskIds = intelligence.success
        ? identifySuggestedTasks(analysis.id, intelligence.data).suggestedTasks.map((task) => task.suggestionId)
        : [];
      if (
        !intelligence.success ||
        !isValidProjectAIAnalysisFeedbackTarget(
          analysis.id,
          intelligence.data,
          targetType,
          targetId,
          suggestedTaskIds,
        )
      ) {
        return { kind: "invalid-target" as const };
      }

      const feedback = await transaction.aIAnalysisFeedback.upsert({
        where: {
          organizationId_analysisId_targetType_targetId_createdById: {
            organizationId: organization.id,
            analysisId: analysis.id,
            targetType,
            targetId,
            createdById: profile.id,
          },
        },
        create: {
          organizationId: organization.id,
          projectId: project.id,
          analysisId: analysis.id,
          targetType,
          targetId,
          feedbackType,
          comment: comment ?? null,
          createdById: profile.id,
        },
        update: {
          feedbackType,
          comment: comment ?? null,
        },
        select: {
          targetType: true,
          targetId: true,
          feedbackType: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return { kind: "saved" as const, feedback };
    });

    if (saved.kind === "unavailable") {
      return { success: false, error: "This completed analysis is unavailable in this project." };
    }
    if (saved.kind === "invalid-target") {
      return { success: false, error: "This result item is not part of the selected analysis." };
    }

    revalidatePath(`/projects/${projectId}/ai`);
    return {
      success: true,
      message: "Thanks — your feedback was recorded. It does not change the saved AI analysis.",
      feedback: {
        ...saved.feedback,
        createdAt: saved.feedback.createdAt.toISOString(),
        updatedAt: saved.feedback.updatedAt.toISOString(),
        authorName: profile.name,
        isOwn: true,
      },
    };
  } catch (error) {
    console.error("Project AI feedback could not be saved.", {
      organizationId: organization.id,
      projectId,
      analysisId,
      targetType,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
    });
    return { success: false, error: "We couldn't save your feedback. Please try again." };
  }
}
