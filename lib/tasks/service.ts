import "server-only";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { taskInputSchema, type TaskInput } from "@/lib/tasks/schemas";
import { taskStatusLabels } from "@/lib/tasks/options";
import type { TaskPriority, TaskStatus } from "@/app/generated/prisma/client";

export interface CreateTaskParams {
  organizationId: string;
  createdById: string;
  projectId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
}

export interface CreateTaskResult {
  id: string;
  projectId: string;
  title: string;
}

export class TaskValidationError extends Error {
  readonly fieldErrors?: Record<string, string[]>;
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "TaskValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class TaskUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskUnavailableError";
  }
}

export function revalidateTaskViews(taskId?: string, projectIds: string[] = []) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/clients/[clientId]", "page");
  if (taskId) revalidatePath(`/tasks/${taskId}`);
  for (const projectId of new Set(projectIds)) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/tasks`);
  }
}

export async function createTask(
  params: CreateTaskParams,
  options?: { transaction?: Prisma.TransactionClient },
): Promise<CreateTaskResult> {
  const { organizationId, createdById, projectId, title, description, status, priority, dueDate, assigneeId } = params;

  const parsed = taskInputSchema.safeParse({
    title,
    projectId,
    description,
    status,
    priority,
    dueDate,
    assigneeId,
  });
  if (!parsed.success) {
    throw new TaskValidationError("Review the highlighted fields and try again.", parsed.error.flatten().fieldErrors);
  }

  const run = async (transaction: Prisma.TransactionClient): Promise<CreateTaskResult> => {
    const project = await transaction.project.findFirst({
      where: { id: parsed.data.projectId, organizationId },
      select: { id: true },
    });
    if (!project) {
      throw new TaskUnavailableError("This project is unavailable in your workspace.");
    }

    if (parsed.data.assigneeId) {
      const member = await transaction.organizationMember.findFirst({
        where: { organizationId, userId: parsed.data.assigneeId },
        select: { userId: true },
      });
      if (!member) {
        throw new TaskUnavailableError("Choose a valid team member as the assignee.");
      }
    }

    const completedAt =
      parsed.data.status === "COMPLETED" ? new Date() : null;

    const created = await transaction.task.create({
      data: {
        organizationId,
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: parsed.data.status,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ?? null,
        assigneeId: parsed.data.assigneeId ?? null,
        createdById,
        completedAt,
      },
      select: { id: true, projectId: true, title: true },
    });

    await transaction.activity.create({
      data: {
        organizationId,
        actorId: createdById,
        taskId: created.id,
        projectId: created.projectId,
        type: "TASK_CREATED",
        description: `Task "${created.title}" was created.`,
      },
    });

    return { id: created.id, projectId: created.projectId, title: created.title };
  };

  if (options?.transaction) {
    return run(options.transaction);
  }

  return prisma.$transaction(async (transaction) => {
    const result = await run(transaction);
    revalidateTaskViews(result.id, [result.projectId]);
    return result;
  });
}
