"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { approveSuggestedTasksInputSchema, type ApproveSuggestedTasksResult } from "@/lib/project-ai/approval-schemas";
import { projectIntelligenceSchema } from "@/lib/project-ai/schemas";
import { identifySuggestedTasks } from "@/lib/project-ai/suggestion-identity";
import {
  currentProjectAIAnalysisOrderBy,
  getProjectAIAnalysisSourceState,
  isCurrentProjectAIAnalysis,
} from "@/lib/project-ai/currentness";
import { taskInputSchema } from "@/lib/tasks/schemas";

export async function approveProjectSuggestedTasksAction(
  _previousResult: ApproveSuggestedTasksResult | null,
  formData: FormData,
): Promise<ApproveSuggestedTasksResult> {
  const { organization, profile } = await requireOrganization();
  const rawTasks = formData.get("tasks");
  let tasks: unknown;
  try {
    tasks = typeof rawTasks === "string" ? JSON.parse(rawTasks) : undefined;
  } catch {
    return { success: false, error: "The reviewed task list is invalid.", code: "INVALID_TASK" };
  }

  const parsed = approveSuggestedTasksInputSchema.safeParse({
    projectId: formData.get("projectId"),
    analysisId: formData.get("analysisId"),
    tasks,
  });
  if (!parsed.success) {
    return { success: false, error: "Review each task and correct any invalid fields.", code: "INVALID_TASK" };
  }

  const validatedTasks = parsed.data.tasks.map((task) => {
    const validated = taskInputSchema.safeParse({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "TODO",
      projectId: parsed.data.projectId,
    });
    return validated.success ? { suggestionId: task.suggestionId, task: validated.data } : null;
  });
  if (validatedTasks.some((task) => task === null)) {
    return { success: false, error: "Task details don't match the Task requirements. Review the title and description.", code: "INVALID_TASK" };
  }

  const createApprovedTasks = () => prisma.$transaction(async (transaction) => {
      const project = await transaction.project.findFirst({
        where: { id: parsed.data.projectId, organizationId: organization.id },
        select: { id: true, name: true },
      });
      if (!project) return { kind: "stale" as const };

      const analysis = await transaction.projectAIAnalysis.findFirst({
        where: {
          id: parsed.data.analysisId,
          organizationId: organization.id,
          projectId: project.id,
          status: "COMPLETED",
        },
        select: {
          id: true,
          result: true,
          sourceDocumentId: true,
          sourceDocumentUpdatedAt: true,
          completedAt: true,
        },
      });
      if (!analysis?.sourceDocumentId) return { kind: "stale" as const };
      if (!analysis.completedAt) return { kind: "invalid-suggestions" as const };

      const latestCompleted = await transaction.projectAIAnalysis.findFirst({
        where: {
          organizationId: organization.id,
          projectId: project.id,
          status: "COMPLETED",
        },
        orderBy: currentProjectAIAnalysisOrderBy,
        select: { id: true },
      });

      const [source, primary] = await Promise.all([
        transaction.projectDocument.findFirst({
          where: {
            id: analysis.sourceDocumentId,
            organizationId: organization.id,
            projectId: project.id,
            documentType: "PROJECT_BRIEF",
          },
          select: { id: true, updatedAt: true },
        }),
        transaction.projectDocument.findFirst({
          where: {
            organizationId: organization.id,
            projectId: project.id,
            documentType: "PROJECT_BRIEF",
            isPrimary: true,
          },
          select: { id: true, updatedAt: true },
        }),
      ]);
      const sourceState = getProjectAIAnalysisSourceState({
        sourceDocumentId: analysis.sourceDocumentId,
        sourceDocumentUpdatedAt: analysis.sourceDocumentUpdatedAt,
        sourceDocumentExists: Boolean(source),
        currentPrimaryDocumentId: primary?.id ?? null,
        currentPrimaryDocumentUpdatedAt: primary?.updatedAt ?? null,
      });
      if (!isCurrentProjectAIAnalysis({
        analysisId: analysis.id,
        currentAnalysisId: latestCompleted?.id ?? null,
        sourceState,
      }) || !source || !primary) {
        return { kind: "stale" as const };
      }

      const newerFailure = await transaction.projectAIAnalysis.findFirst({
        where: {
          organizationId: organization.id,
          projectId: project.id,
          sourceDocumentId: source.id,
          sourceDocumentUpdatedAt: source.updatedAt,
          status: "FAILED",
          createdAt: { gt: analysis.completedAt },
        },
        select: { id: true },
      });
      if (newerFailure) return { kind: "failed-analysis" as const };

      const intelligence = projectIntelligenceSchema.safeParse(analysis.result);
      if (!intelligence.success) return { kind: "invalid-suggestions" as const };
      const identified = identifySuggestedTasks(analysis.id, intelligence.data);
      const suggestions = new Map(identified.suggestedTasks.map((suggestion) => [suggestion.suggestionId, suggestion]));
      if (parsed.data.tasks.some((task) => !suggestions.has(task.suggestionId))) {
        return { kind: "invalid-suggestions" as const };
      }

      const approvals = await transaction.aISuggestedTaskApproval.findMany({
        where: {
          analysisId: analysis.id,
          suggestionId: { in: parsed.data.tasks.map((task) => task.suggestionId) },
        },
        select: { suggestionId: true },
      });
      if (approvals.length) return { kind: "already-approved" as const };

      const tasksToCreate = validatedTasks.flatMap((reviewed) => reviewed ? [{
        id: randomUUID(),
        suggestionId: reviewed.suggestionId,
        title: reviewed.task.title,
        description: reviewed.task.description ?? null,
        priority: reviewed.task.priority,
      }] : []);
      if (tasksToCreate.length !== parsed.data.tasks.length) return { kind: "invalid-task" as const };

      await transaction.task.createMany({
        data: tasksToCreate.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: "TODO",
          priority: task.priority,
          organizationId: organization.id,
          projectId: project.id,
          createdById: profile.id,
        })),
      });
      await transaction.aISuggestedTaskApproval.createMany({
        data: tasksToCreate.map((task) => ({
          id: randomUUID(),
          organizationId: organization.id,
          projectId: project.id,
          analysisId: analysis.id,
          suggestionId: task.suggestionId,
          taskId: task.id,
          approvedById: profile.id,
        })),
      });
      await transaction.activity.createMany({
        data: tasksToCreate.map((task) => ({
          id: randomUUID(),
          organizationId: organization.id,
          actorId: profile.id,
          taskId: task.id,
          projectId: project.id,
          type: "TASK_CREATED" as const,
          description: `Task "${task.title}" was created from an approved AI suggestion.`,
        })),
      });

      const createdTasks = tasksToCreate.map((task) => ({
        suggestionId: task.suggestionId,
        taskId: task.id,
        title: task.title,
      }));
      return { kind: "created" as const, projectId: project.id, createdTasks };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 30_000,
  });
  let result: Awaited<ReturnType<typeof createApprovedTasks>>;
  try {
    result = await createApprovedTasks();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { success: false, error: "One or more selected suggestions were just approved in another session. Refresh to see the saved tasks.", code: "ALREADY_APPROVED" };
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return { success: false, error: "The project changed while these tasks were being approved. Refresh and review the current analysis.", code: "STALE_ANALYSIS" };
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2028") {
      console.error("AI task approval transaction timed out.", {
        projectId: parsed.data.projectId,
        analysisId: parsed.data.analysisId,
      });
      return { success: false, error: "Task approval took too long. No tasks were added; please retry with fewer selected suggestions." };
    }
    console.error("Approving AI-suggested tasks failed.", {
      projectId: parsed.data.projectId,
      analysisId: parsed.data.analysisId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined,
      prismaTarget: typeof error === "object" && error !== null && "meta" in error && typeof error.meta === "object" && error.meta !== null && "target" in error.meta
        ? error.meta.target
        : undefined,
    });
    return { success: false, error: "We couldn't create these tasks. No tasks were added; please try again." };
  }

  if (result.kind === "stale") {
    return { success: false, error: "This analysis is no longer current. Analyze the current primary brief before approving tasks.", code: "STALE_ANALYSIS" };
  }
  if (result.kind === "failed-analysis") {
    return { success: false, error: "A newer analysis attempt failed. Retry or refresh the current analysis before approving suggestions.", code: "FAILED_ANALYSIS" };
  }
  if (result.kind === "already-approved") {
    return { success: false, error: "One or more selected suggestions have already been approved. Refresh the analysis to see the saved tasks.", code: "ALREADY_APPROVED" };
  }
  if (result.kind === "invalid-suggestions") {
    return { success: false, error: "One or more selected suggestions don't belong to this analysis.", code: "INVALID_SUGGESTION" };
  }
  if (result.kind === "invalid-task") {
    return { success: false, error: "Task details don't match the Task requirements. Review the title and description.", code: "INVALID_TASK" };
  }

  revalidatePath(`/projects/${result.projectId}/ai`);
  revalidatePath(`/projects/${result.projectId}`);
  revalidatePath(`/projects/${result.projectId}/tasks`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/clients/[clientId]", "page");
  for (const task of result.createdTasks) revalidatePath(`/tasks/${task.taskId}`);
  return { success: true, createdTasks: result.createdTasks };
}
