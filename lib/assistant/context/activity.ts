import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { ActivityType } from "@/app/generated/prisma/client";
import type { AssistantActivityEntry } from "@/lib/assistant/context/types";

export { type AssistantActivityEntry };

export const assistantActivityLabels: Record<ActivityType, string> = {
  LEAD_CREATED: "created lead",
  LEAD_UPDATED: "updated lead",
  LEAD_STATUS_CHANGED: "changed lead status",
  LEAD_CONVERTED: "converted lead to client",
  LEAD_DELETED: "deleted lead",
  CLIENT_CREATED: "created client",
  CLIENT_UPDATED: "updated client",
  CLIENT_STATUS_CHANGED: "changed client status",
  PROJECT_CREATED: "created project",
  PROJECT_UPDATED: "updated project",
  PROJECT_STATUS_CHANGED: "changed project status",
  PROJECT_DELETED: "deleted project",
  TASK_CREATED: "created task",
  TASK_UPDATED: "updated task",
  TASK_STATUS_CHANGED: "changed task status",
  TASK_DELETED: "deleted task",
  DOCUMENT_CREATED: "created document",
  DOCUMENT_DELETED: "deleted document",
  DOCUMENT_PRIMARY_SET: "set primary document",
  PROJECT_AI_ANALYZED: "ran AI analysis",
};

export async function getAssistantProjectActivity(
  organizationId: string,
  projectId: string,
  limit: number,
): Promise<AssistantActivityEntry[]> {
  const activities = await prisma.activity.findMany({
    where: {
      organizationId,
      projectId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      createdAt: true,
      type: true,
      description: true,
      actor: {
        select: { name: true },
      },
    },
  });

  return activities
    .filter((activity) => activity.type in assistantActivityLabels)
    .map((activity) => ({
      createdAt: activity.createdAt,
      description: activity.description ?? assistantActivityLabels[activity.type],
      actorName: activity.actor?.name ?? null,
    }));
}
