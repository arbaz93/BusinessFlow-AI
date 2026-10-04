"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import {
  projectIdSchema,
  projectInputSchema,
  projectStatusSchema,
  type ProjectFormState,
} from "@/lib/projects/schemas";
import { projectStatusLabels } from "@/lib/projects/options";

function revalidateProjectViews(projectId?: string, clientId?: string) {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/tasks`);
  }
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function saveProject(_previousState: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { organization, profile } = await requireOrganization();
  const parsed = projectInputSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      error: "Review the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const rawProjectId = formData.get("projectId");
  const projectId = typeof rawProjectId === "string" && rawProjectId.trim() ? rawProjectId.trim() : undefined;
  const rawExpectedUpdatedAt = formData.get("expectedUpdatedAt");
  const expectedUpdatedAt = typeof rawExpectedUpdatedAt === "string" ? new Date(rawExpectedUpdatedAt) : null;
  if (projectId && (!expectedUpdatedAt || !Number.isFinite(expectedUpdatedAt.getTime()))) {
    return { error: "This project changed while you were editing it. Refresh and try again." };
  }

  // Never trust a browser-supplied clientId: verify it belongs to the active organization.
  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, organizationId: organization.id },
    select: { id: true },
  });

  if (!client) {
    return { error: "This client is unavailable in your workspace." };
  }

  const persistedProjectData = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    startDate: parsed.data.startDate ?? null,
    dueDate: parsed.data.dueDate ?? null,
    notes: parsed.data.notes ?? null,
    clientId: parsed.data.clientId,
    organizationId: organization.id,
  };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      if (projectId) {
        const validId = projectIdSchema.safeParse(projectId);
        if (!validId.success) return { kind: "unavailable" as const };

        const current = await transaction.project.findFirst({
          where: { id: validId.data, organizationId: organization.id },
          select: { id: true, status: true, priority: true, clientId: true, name: true, updatedAt: true },
        });

        if (!current) return { kind: "unavailable" as const };
        if (current.updatedAt.getTime() !== expectedUpdatedAt?.getTime()) return { kind: "changed" as const };

        const updated = await transaction.project.updateMany({
          where: { id: current.id, organizationId: organization.id, updatedAt: expectedUpdatedAt },
          data: {
            ...persistedProjectData,
            // createdById is intentionally preserved: an edit must not reassign authorship.
            completedAt: parsed.data.status === "COMPLETED" ? (current.status === "COMPLETED" ? current.updatedAt : new Date()) : null,
          },
        });

        if (updated.count !== 1) return { kind: "changed" as const };

        const statusChanged = current.status !== parsed.data.status;
        const priorityChanged = current.priority !== parsed.data.priority;
        const clientChanged = current.clientId !== parsed.data.clientId;

        await transaction.activity.create({
          data: {
            organizationId: organization.id,
            actorId: profile.id,
            projectId: current.id,
            clientId: parsed.data.clientId,
            type: statusChanged ? "PROJECT_STATUS_CHANGED" : "PROJECT_UPDATED",
            description: describeProjectUpdate({
              name: current.name,
              status: statusChanged ? projectStatusLabels[parsed.data.status] : null,
              priorityChanged,
              clientChanged,
            }),
          },
        });

        return { kind: "saved" as const, id: current.id, previousClientId: clientChanged ? current.clientId : null };
      }

      const created = await transaction.project.create({
        data: {
          ...persistedProjectData,
          createdById: profile.id,
          completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
        },
        select: { id: true },
      });

      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          projectId: created.id,
          clientId: parsed.data.clientId,
          type: "PROJECT_CREATED",
          description: `Project "${parsed.data.name}" was created.`,
        },
      });

      return { kind: "saved" as const, id: created.id, previousClientId: null };
    });

    if (result.kind === "unavailable") return { error: "This project is unavailable in your workspace." };
    if (result.kind === "changed") return { error: "This project changed while you were editing it. Refresh and try again." };

    revalidateProjectViews(result.id, result.previousClientId ?? parsed.data.clientId);
    return { success: true };
  } catch (error) {
    console.error("Project save failed.", error);
    return { error: "We couldn't save this project. Please try again." };
  }
}

function describeProjectUpdate({
  name,
  status,
  priorityChanged,
  clientChanged,
}: {
  name: string;
  status: string | null;
  priorityChanged: boolean;
  clientChanged: boolean;
}) {
  if (status) return `Project "${name}" status changed to ${status}.`;
  if (clientChanged) return `Project "${name}" was reassigned to a different client.`;
  if (priorityChanged) return `Project "${name}" priority was updated.`;
  return `Project "${name}" details were updated.`;
}

export async function changeProjectStatus(projectId: string, value: string, expectedStatus: string) {
  const { organization, profile } = await requireOrganization();
  const parsedId = projectIdSchema.safeParse(projectId);
  const parsedStatus = projectStatusSchema.safeParse(value);
  const parsedExpectedStatus = projectStatusSchema.safeParse(expectedStatus);

  if (!parsedId.success || !parsedStatus.success || !parsedExpectedStatus.success) {
    return { error: "Choose a valid project and status." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const project = await transaction.project.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: { id: true, status: true, name: true, clientId: true },
      });

      if (!project) return "unavailable" as const;
      if (project.status !== parsedExpectedStatus.data) return "changed" as const;
      if (project.status === parsedStatus.data) return "unchanged" as const;

      const updated = await transaction.project.updateMany({
        where: { id: project.id, organizationId: organization.id, status: parsedExpectedStatus.data },
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
          projectId: project.id,
          clientId: project.clientId,
          type: "PROJECT_STATUS_CHANGED",
          description: `Project "${project.name}" status changed to ${projectStatusLabels[parsedStatus.data]}.`,
        },
      });

      return "updated" as const;
    });

    if (result === "unavailable") return { error: "This project is unavailable in your workspace." };
    if (result === "changed") return { error: "This project changed while you were updating it. Refresh and try again." };
    if (result === "unchanged") return { success: true };

    revalidateProjectViews(parsedId.data);
    return { success: true };
  } catch (error) {
    console.error("Project status update failed.", error);
    return { error: "We couldn't update the project status. Please try again." };
  }
}

export async function deleteProject(projectId: string) {
  const { organization } = await requireOrganization();
  const parsedId = projectIdSchema.safeParse(projectId);
  if (!parsedId.success) return { error: "This project is unavailable in your workspace." };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const project = await transaction.project.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: {
          id: true,
          name: true,
          clientId: true,
          _count: { select: { activities: true } },
        },
      });

      if (!project) return { kind: "unavailable" as const };

      // Activity history is meaningful business history and is never cascade-deleted.
      if (project._count.activities > 0) {
        return { kind: "dependent" as const, dependencyCount: project._count.activities };
      }

      const deleted = await transaction.project.deleteMany({
        where: { id: project.id, organizationId: organization.id, activities: { none: {} } },
      });

      if (deleted.count !== 1) return { kind: "changed" as const };
      return { kind: "deleted" as const, clientId: project.clientId };
    });

    if (result.kind === "unavailable") return { error: "This project is unavailable in your workspace." };
    if (result.kind === "changed") return { error: "This project changed while you were deleting it. Refresh and try again." };
    if (result.kind === "dependent") {
      return {
        error: `This project has ${result.dependencyCount} recorded ${result.dependencyCount === 1 ? "activity event" : "activity events"} and cannot be permanently deleted. Update the project status instead to preserve its history.`,
        dependencyCount: result.dependencyCount,
      };
    }

    revalidateProjectViews(undefined, result.clientId);
    return { success: true };
  } catch (error) {
    console.error("Project deletion failed.", error);
    return { error: "We couldn't delete this project. No changes were saved; please try again." };
  }
}
