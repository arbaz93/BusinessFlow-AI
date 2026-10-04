import "server-only";

import { prisma } from "@/lib/db/prisma";
import { activeTaskStatuses } from "@/lib/tasks/options";
import { getTaskDateWindow } from "@/lib/tasks/timeline";

export async function getDashboardTaskData(organizationId: string, now = new Date()) {
  const { overdueBefore, upcomingFrom, upcomingThrough } = getTaskDateWindow(now);

  try {
    const [overdueCount, overdueTasks, upcomingTasks] = await Promise.all([
      prisma.task.count({
        where: {
          organizationId,
          status: { in: activeTaskStatuses },
          dueDate: { lt: overdueBefore },
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          status: { in: activeTaskStatuses },
          dueDate: { lt: overdueBefore },
        },
        orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
        take: 4,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              name: true,
              client: { select: { id: true, name: true, company: true } },
            },
          },
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          status: { in: activeTaskStatuses },
          dueDate: { gte: upcomingFrom, lte: upcomingThrough },
        },
        orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
        take: 4,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { name: true } },
          project: {
            select: {
              id: true,
              name: true,
              client: { select: { id: true, name: true, company: true } },
            },
          },
        },
      }),
    ]);

    return { status: "success" as const, overdueCount, overdueTasks, upcomingTasks };
  } catch (error) {
    console.error("Dashboard task data failed to load.", error);
    return { status: "error" as const };
  }
}
