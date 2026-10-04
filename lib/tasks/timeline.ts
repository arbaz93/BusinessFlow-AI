import type { TaskStatus } from "@/lib/tasks/options";

export type TaskTimelineState = "overdue" | "due_soon" | "on_track" | "completed" | "cancelled" | "no_due_date";

export const taskTimelineLabels: Record<TaskTimelineState, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  on_track: "On track",
  completed: "Completed",
  cancelled: "Cancelled",
  no_due_date: "No due date",
};

export const DUE_SOON_DAYS = 7;

export function startOfToday(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function endOfToday(now = new Date()) {
  const today = startOfToday(now);
  return new Date(today.getTime() + 86_400_000 - 1);
}

export function getTaskDateWindow(now = new Date()) {
  const today = startOfToday(now);

  return {
    overdueBefore: today,
    upcomingFrom: today,
    upcomingThrough: endOfToday(new Date(today.getTime() + DUE_SOON_DAYS * 86_400_000)),
  };
}

export function formatTaskDueDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function getTaskTimelineState(
  status: TaskStatus,
  dueDate: Date | string | null | undefined,
  now = new Date(),
): TaskTimelineState {
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "cancelled";
  if (!dueDate) return "no_due_date";

  const due = new Date(dueDate);
  const { overdueBefore, upcomingThrough } = getTaskDateWindow(now);
  const dueDay = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()));

  if (dueDay < overdueBefore) return "overdue";
  if (dueDay <= startOfToday(upcomingThrough)) return "due_soon";
  return "on_track";
}
