import "server-only";

import { prisma } from "@/lib/db/prisma";
import { activeProjectStatuses } from "@/lib/projects/timeline";
import { getProjectWorkspace } from "@/lib/projects/workspace";
import type { ProjectStatus, ProjectPriority } from "@/lib/projects/options";
import type { AssistantProjectSummary, AssistantProjectDetail } from "@/lib/assistant/context/types";

export { type AssistantProjectSummary, type AssistantProjectDetail };

export type { ProjectStatus, ProjectPriority };

export async function getAssistantProjectSummaries(
  organizationId: string,
): Promise<AssistantProjectSummary[]> {
  const projects = await prisma.project.findMany({
    where: { organizationId, status: { in: activeProjectStatuses } },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      dueDate: true,
      client: {
        select: {
          name: true,
          company: true,
        },
      },
    },
  });

  return projects.map((project) => ({
    projectId: project.id,
    name: project.name,
    status: project.status,
    priority: project.priority,
    dueDate: project.dueDate,
    clientName: project.client.name,
    clientCompany: project.client.company,
    description: null,
  }));
}

export type ProjectCounts = {
  leadCount: number;
  activeClientCount: number;
  projectCount: number;
  activeProjectCount: number;
};

export async function getActiveProjectAndClientCounts(
  organizationId: string,
): Promise<ProjectCounts> {
  const [leadCount, activeClientCount, projectCount, activeProjectCount] = await Promise.all([
    prisma.lead.count({ where: { organizationId } }),
    prisma.client.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.project.count({ where: { organizationId } }),
    prisma.project.count({ where: { organizationId, status: { in: activeProjectStatuses } } }),
  ]);

  return { leadCount, activeClientCount, projectCount, activeProjectCount };
}

export async function getAssistantProjectDetail(
  organizationId: string,
  projectId: string,
): Promise<AssistantProjectDetail | null> {
  try {
    const { organizationId: resolvedOrganizationId, project } = await getProjectWorkspace(projectId);
    if (resolvedOrganizationId !== organizationId) {
      return null;
    }

    const statusCounts = await prisma.task.groupBy({
      by: ["status"],
      where: { organizationId, projectId: project.id },
      _count: { _all: true },
    });
    const countByStatus = Object.fromEntries(statusCounts.map((g) => [g.status, g._count._all]));
    const taskCount = Object.values(countByStatus).reduce((sum, n) => sum + n, 0);
    const completedTaskCount = countByStatus.COMPLETED ?? 0;
    const openTaskCount = (countByStatus.TODO ?? 0) + (countByStatus.IN_PROGRESS ?? 0) + (countByStatus.BLOCKED ?? 0);

    return {
      projectId: project.id,
      name: project.name,
      status: project.status,
      priority: project.priority,
      description: project.description,
      startDate: project.startDate,
      dueDate: project.dueDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      clientId: project.clientId,
      clientName: project.client.name,
      clientCompany: project.client.company,
      taskCount,
      completedTaskCount,
      openTaskCount,
    };
  } catch {
    return null;
  }
}
