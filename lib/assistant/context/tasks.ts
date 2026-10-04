import "server-only";

import { prisma } from "@/lib/db/prisma";
import { activeTaskStatuses } from "@/lib/tasks/options";
import type { TaskStatus, TaskPriority } from "@/lib/tasks/options";
import { getTaskDateWindow } from "@/lib/tasks/timeline";
import { classifyAssistantTaskState, computeAssistantTaskAggregates } from "@/lib/assistant/context/task-classification";
import type {
  AssistantTaskContext,
  AssistantTaskAggregates,
} from "@/lib/assistant/context/types";

export {
  classifyAssistantTaskState,
  computeAssistantTaskAggregates,
  type AssistantTaskContext,
  type AssistantTaskAggregates,
};

export async function getAssistantProjectTasks(
  organizationId: string,
  projectId: string,
  now: Date,
  limit: number,
): Promise<AssistantTaskContext[]> {
  const tasks = await prisma.task.findMany({
    where: { organizationId, projectId, status: { in: activeTaskStatuses } },
    orderBy: [
      { dueDate: "asc" },
      { priority: "asc" },
      { updatedAt: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      updatedAt: true,
      assignee: {
        select: { name: true },
      },
      project: {
        select: { name: true },
      },
    },
  });

  return tasks.map((task) => {
    const classification = classifyAssistantTaskState(task.status, task.dueDate, now);
    return {
      taskId: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      timelineState: classification.status,
      dueDate: task.dueDate,
      assignee: task.assignee?.name ?? null,
      updatedAt: task.updatedAt,
      projectId,
      projectName: task.project.name,
    };
  });
}

export async function getAssistantProjectTaskAggregates(
  organizationId: string,
  projectId: string,
  now: Date,
): Promise<AssistantTaskAggregates> {
  const { overdueBefore, upcomingFrom, upcomingThrough } = getTaskDateWindow(now);

  const [open, completed, overdue, blocked, dueSoon] = await Promise.all([
    prisma.task.count({
      where: { organizationId, projectId, status: { in: ["TODO", "IN_PROGRESS"] } },
    }),
    prisma.task.count({
      where: { organizationId, projectId, status: "COMPLETED" },
    }),
    prisma.task.count({
      where: {
        organizationId,
        projectId,
        status: { in: activeTaskStatuses },
        dueDate: { lt: overdueBefore },
      },
    }),
    prisma.task.count({
      where: { organizationId, projectId, status: "BLOCKED" },
    }),
    prisma.task.count({
      where: {
        organizationId,
        projectId,
        status: { in: activeTaskStatuses },
        dueDate: { gte: upcomingFrom, lte: upcomingThrough },
      },
    }),
  ]);

  const cancelled = await prisma.task.count({
    where: { organizationId, projectId, status: "CANCELLED" },
  });

  return {
    total: open + completed + overdue + blocked + dueSoon + cancelled,
    overdue,
    dueSoon,
    blocked,
    open,
    completed,
  };
}

export async function getAssistantOrgTaskAggregates(
  organizationId: string,
  now: Date,
): Promise<AssistantTaskAggregates> {
  const { overdueBefore, upcomingFrom, upcomingThrough } = getTaskDateWindow(now);

  const [total, overdue, dueSoon, blocked, open, completed] = await Promise.all([
    prisma.task.count({ where: { organizationId } }),
    prisma.task.count({
      where: { organizationId, status: { in: activeTaskStatuses }, dueDate: { lt: overdueBefore } },
    }),
    prisma.task.count({
      where: {
        organizationId,
        status: { in: activeTaskStatuses },
        dueDate: { gte: upcomingFrom, lte: upcomingThrough },
      },
    }),
    prisma.task.count({ where: { organizationId, status: "BLOCKED" } }),
    prisma.task.count({
      where: { organizationId, status: { in: ["TODO", "IN_PROGRESS"] } },
    }),
    prisma.task.count({ where: { organizationId, status: "COMPLETED" } }),
  ]);

  return {
    total,
    overdue,
    dueSoon,
    blocked,
    open,
    completed,
  };
}

export type OrgTaskSamples = {
  overdue: AssistantTaskContext[];
  upcoming: AssistantTaskContext[];
  blocked: AssistantTaskContext[];
};

function toOrgTaskContext(
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    updatedAt: Date;
    assignee: { name: string } | null;
    project: { id: string; name: string };
  },
  now: Date,
): AssistantTaskContext {
  const classification = classifyAssistantTaskState(task.status, task.dueDate, now);
  return {
    taskId: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    timelineState: classification.status,
    dueDate: task.dueDate,
    assignee: task.assignee?.name ?? null,
    updatedAt: task.updatedAt,
    projectId: task.project.id,
    projectName: task.project.name,
  };
}

const orgTaskSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  updatedAt: true,
  assignee: { select: { name: true } },
  project: { select: { id: true, name: true } },
} as const;

export async function getAssistantOrgTaskSamples(
  organizationId: string,
  now: Date,
  limit: number,
): Promise<OrgTaskSamples> {
  const { overdueBefore, upcomingFrom, upcomingThrough } = getTaskDateWindow(now);

  const [overdue, upcoming, blocked] = await Promise.all([
    prisma.task.findMany({
      where: {
        organizationId,
        status: { in: activeTaskStatuses },
        dueDate: { lt: overdueBefore },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
      take: limit,
      select: orgTaskSelect,
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        status: { in: activeTaskStatuses },
        dueDate: { gte: upcomingFrom, lte: upcomingThrough },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
      take: limit,
      select: orgTaskSelect,
    }),
    prisma.task.findMany({
      where: { organizationId, status: { in: ["BLOCKED"] } },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      take: limit,
      select: orgTaskSelect,
    }),
  ]);

  return {
    overdue: overdue.map((task) => toOrgTaskContext(task, now)),
    upcoming: upcoming.map((task) => toOrgTaskContext(task, now)),
    blocked: blocked.map((task) => toOrgTaskContext(task, now)),
  };
}

