"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { taskIdSchema, taskInputSchema, taskStatusSchema, type TaskFormState } from "@/lib/tasks/schemas";
import { taskStatusLabels } from "@/lib/tasks/options";
import { createTask, revalidateTaskViews } from "@/lib/tasks/service";


function describeTaskUpdate({
  title,
  status,
  priorityChanged,
  projectChanged,
}: {
  title: string;
  status: string | null;
  priorityChanged: boolean;
  projectChanged: boolean;
}) {
  if (status) return `Task "${title}" status changed to ${status}.`;
  if (projectChanged) return `Task "${title}" was moved to a different project.`;
  if (priorityChanged) return `Task "${title}" priority was updated.`;
  return `Task "${title}" details were updated.`;
}

export async function saveTask(previousState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  return saveTaskInternal(undefined, previousState, formData);
}

export async function saveProjectTask(projectId: string, previousState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  return saveTaskInternal(projectId, previousState, formData);
}

async function saveTaskInternal(
  fixedProjectId: string | undefined,
  _previousState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { organization, profile } = await requireOrganization();
  const parsed = taskInputSchema.safeParse({
    title: formData.get("title"),
    projectId: fixedProjectId ?? formData.get("projectId"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    assigneeId: formData.get("assigneeId"),
  });

  if (!parsed.success) {
    return {
      error: "Review the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const rawTaskId = formData.get("taskId");
  const taskId = typeof rawTaskId === "string" && rawTaskId.trim() ? rawTaskId.trim() : undefined;
  const rawExpectedUpdatedAt = formData.get("expectedUpdatedAt");
  const expectedUpdatedAt = typeof rawExpectedUpdatedAt === "string" ? new Date(rawExpectedUpdatedAt) : null;

  if (taskId && (!expectedUpdatedAt || !Number.isFinite(expectedUpdatedAt.getTime()))) {
    return { error: "This task changed while you were editing it. Refresh and try again." };
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, organizationId: organization.id },
    select: { id: true },
  });

  if (!project) {
    return { error: "This project is unavailable in your workspace." };
  }

  if (parsed.data.assigneeId) {
    const member = await prisma.organizationMember.findFirst({
      where: { organizationId: organization.id, userId: parsed.data.assigneeId },
      select: { userId: true },
    });
    if (!member) {
      return { error: "Choose a valid team member as the assignee." };
    }
  }

  const persistedTaskData = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate ?? null,
    assigneeId: parsed.data.assigneeId ?? null,
    organizationId: organization.id,
    projectId: parsed.data.projectId,
  };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      if (taskId) {
        const validId = taskIdSchema.safeParse(taskId);
        if (!validId.success) return { kind: "unavailable" as const };

        const current = await transaction.task.findFirst({
          where: { id: validId.data, organizationId: organization.id },
          select: { id: true, status: true, priority: true, projectId: true, title: true, updatedAt: true },
        });

        if (!current || (fixedProjectId && current.projectId !== fixedProjectId)) return { kind: "unavailable" as const };
        if (current.updatedAt.getTime() !== expectedUpdatedAt?.getTime()) return { kind: "changed" as const };

        const updated = await transaction.task.updateMany({
          where: { id: current.id, organizationId: organization.id, updatedAt: expectedUpdatedAt },
          data: {
            ...persistedTaskData,
            completedAt: parsed.data.status === "COMPLETED" && current.status !== "COMPLETED" ? new Date() : parsed.data.status === "COMPLETED" ? current.updatedAt : null,
          },
        });

        if (updated.count !== 1) return { kind: "changed" as const };

        const statusChanged = current.status !== parsed.data.status;
        const priorityChanged = current.priority !== parsed.data.priority;
        const projectChanged = current.projectId !== parsed.data.projectId;

        await transaction.activity.create({
          data: {
            organizationId: organization.id,
            actorId: profile.id,
            taskId: current.id,
            projectId: parsed.data.projectId,
            type: statusChanged ? "TASK_STATUS_CHANGED" : "TASK_UPDATED",
            description: describeTaskUpdate({
              title: current.title,
              status: statusChanged ? taskStatusLabels[parsed.data.status] : null,
              priorityChanged,
              projectChanged,
            }),
          },
        });

        return { kind: "saved" as const, id: current.id, previousProjectId: projectChanged ? current.projectId : null };
      }

      const created = await createTask(
        {
          organizationId: organization.id,
          createdById: profile.id,
          projectId: parsed.data.projectId,
          title: parsed.data.title,
          description: parsed.data.description,
          status: parsed.data.status,
          priority: parsed.data.priority,
          dueDate: parsed.data.dueDate,
          assigneeId: parsed.data.assigneeId,
        },
        { transaction },
      );

      return { kind: "saved" as const, id: created.id, previousProjectId: null };
    });

    if (result.kind === "unavailable") return { error: "This task is unavailable in your workspace." };
    if (result.kind === "changed") return { error: "This task changed while you were editing it. Refresh and try again." };

    revalidateTaskViews(
      result.id,
      [fixedProjectId ?? parsed.data.projectId, result.previousProjectId].filter((id): id is string => Boolean(id)),
    );
    return { success: true };
  } catch (error) {
    console.error("Task save failed.", error);
    return { error: "We couldn't save this task. Please try again." };
  }
}

export async function changeTaskStatus(taskId: string, value: string, expectedStatus: string) {
  const { organization, profile } = await requireOrganization();
  const parsedId = taskIdSchema.safeParse(taskId);
  const parsedStatus = taskStatusSchema.safeParse(value);
  const parsedExpectedStatus = taskStatusSchema.safeParse(expectedStatus);

  if (!parsedId.success || !parsedStatus.success || !parsedExpectedStatus.success) {
    return { error: "Choose a valid task and status." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const task = await transaction.task.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: { id: true, status: true, title: true, projectId: true },
      });

      if (!task) return "unavailable" as const;
      if (task.status !== parsedExpectedStatus.data) return "changed" as const;
      if (task.status === parsedStatus.data) return "unchanged" as const;

      const updated = await transaction.task.updateMany({
        where: { id: task.id, organizationId: organization.id, status: parsedExpectedStatus.data },
        data: {
          status: parsedStatus.data,
          completedAt: parsedStatus.data === "COMPLETED" ? new Date() : null,
        },
      });

      if (updated.count !== 1) return "changed" as const;

      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          taskId: task.id,
          projectId: task.projectId,
          type: "TASK_STATUS_CHANGED",
          description: `Task "${task.title}" status changed to ${taskStatusLabels[parsedStatus.data]}.`,
        },
      });

      return { kind: "updated" as const, projectId: task.projectId };
    });

    if (result === "unavailable") return { error: "This task is unavailable in your workspace." };
    if (result === "changed") return { error: "This task changed while you were editing it. Refresh and try again." };
    if (result === "unchanged") return { success: true };

    revalidateTaskViews(taskId, [result.projectId]);
    return { success: true };
  } catch (error) {
    console.error("Task status update failed.", error);
    return { error: "We couldn't update this task status. Please try again." };
  }
}

export async function deleteTask(taskId: string) {
  const { organization, profile } = await requireOrganization();
  const parsedId = taskIdSchema.safeParse(taskId);

  if (!parsedId.success) {
    return { error: "Choose a valid task." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const task = await transaction.task.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: { id: true, projectId: true, title: true },
      });
      if (!task) return null;
      const deleted = await transaction.task.deleteMany({
        where: { id: task.id, organizationId: organization.id },
      });
      if (deleted.count !== 1) return null;
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          projectId: task.projectId,
          type: "TASK_DELETED",
          description: `Task "${task.title}" was deleted.`,
        },
      });
      return task.projectId;
    });

    if (!result) return { error: "This task is unavailable in your workspace." };

    revalidateTaskViews(undefined, [result]);
    return { success: true };
  } catch (error) {
    console.error("Task deletion failed.", error);
    return { error: "We couldn't delete this task. Please try again." };
  }
}
