import "server-only";

import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import type { ProjectAIAnalysisFeedbackView } from "@/lib/project-ai/feedback-types";
import { getProjectWorkspace } from "@/lib/projects/workspace";
export type { ProjectAIAnalysisFeedbackView } from "@/lib/project-ai/feedback-types";

export async function getProjectAIAnalysisFeedback(
  projectId: string,
  analysisId: string,
): Promise<ProjectAIAnalysisFeedbackView[]> {
  const [{ organizationId, project }, { profile }] = await Promise.all([
    getProjectWorkspace(projectId),
    requireOrganization(),
  ]);
  const analysis = await prisma.projectAIAnalysis.findFirst({
    where: {
      id: analysisId,
      organizationId,
      projectId: project.id,
      status: "COMPLETED",
    },
    select: { id: true },
  });
  if (!analysis) return [];

  const feedback = await prisma.aIAnalysisFeedback.findMany({
    where: {
      organizationId,
      projectId: project.id,
      analysisId: analysis.id,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      targetType: true,
      targetId: true,
      feedbackType: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
      createdBy: { select: { name: true } },
    },
  });

  return feedback.map((item) => ({
    targetType: item.targetType,
    targetId: item.targetId,
    feedbackType: item.feedbackType,
    comment: item.comment,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    authorName: item.createdBy.name,
    isOwn: item.createdById === profile.id,
  }));
}
