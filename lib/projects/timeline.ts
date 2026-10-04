import type { ProjectPriority, ProjectStatus } from "@/lib/projects/options";
/** Statuses that count as active work across the Dashboard, Clients, and Projects surfaces. */
export const activeProjectStatuses: ProjectStatus[] = ["PLANNING", "IN_PROGRESS", "ON_HOLD"];

export type TimelineState = "not_started" | "on_track" | "due_soon" | "overdue" | "completed" | "cancelled" | "no_schedule";

export const projectTimelineLabels: Record<TimelineState, string> = {
  not_started: "Not started",
  on_track: "In progress",
  due_soon: "Due soon",
  overdue: "Overdue",
  completed: "Completed",
  cancelled: "Cancelled",
  no_schedule: "No schedule",
};

/** Days before a due date at which a project is considered due soon. */
export const DUE_SOON_DAYS = 7;

export function isActiveProjectStatus(status: ProjectStatus) {
  return activeProjectStatuses.includes(status);
}

export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function endOfToday(now = new Date()) {
  const today = startOfToday(now);
  return new Date(today.getTime() + 86_400_000 - 1);
}

/**
 * Derives a presentation-only timeline state from real dates and the current status.
 * Never treats a project without a due date as overdue.
 */
export function getProjectTimelineState(
  status: ProjectStatus,
  startDate: Date | string | null | undefined,
  dueDate: Date | string | null | undefined,
  now = new Date(),
): TimelineState {
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "cancelled";
  if (!startDate && !dueDate) return "no_schedule";

  const today = startOfToday(now);
  const due = dueDate ? new Date(dueDate) : null;
  const start = startDate ? new Date(startDate) : null;

  if (start && today.getTime() < startOfToday(start).getTime()) return "not_started";

  if (!due) return "on_track";

  const dueTime = endOfToday(new Date(due.getFullYear(), due.getMonth(), due.getDate())).getTime();
  if (dueTime < today.getTime()) return "overdue";
  if (dueTime <= today.getTime() + DUE_SOON_DAYS * 86_400_000) return "due_soon";
  return "on_track";
}

export const projectSortValues = ["updated", "created", "name", "due", "priority", "status"] as const;
export type ProjectSort = (typeof projectSortValues)[number];

export const projectSortLabels: Record<ProjectSort, string> = {
  updated: "Recently updated",
  created: "Recently created",
  name: "Project name",
  due: "Due date",
  priority: "Priority",
  status: "Status",
};

export const projectDueFilterValues = ["ALL", "OVERDUE", "DUE_SOON", "NO_DUE_DATE"] as const;
export type ProjectDueFilter = (typeof projectDueFilterValues)[number];

export const projectDueFilterLabels: Record<ProjectDueFilter, string> = {
  ALL: "All dates",
  OVERDUE: "Overdue",
  DUE_SOON: "Due soon",
  NO_DUE_DATE: "No due date",
};

export const priorityRank: Record<ProjectPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const statusRank: Record<ProjectStatus, number> = {
  IN_PROGRESS: 0,
  PLANNING: 1,
  ON_HOLD: 2,
  COMPLETED: 3,
  CANCELLED: 4,
};
