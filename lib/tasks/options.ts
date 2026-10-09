export const taskStatusValues = ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"] as const;

export type TaskStatus = (typeof taskStatusValues)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskPriority = (typeof taskPriorityValues)[number];

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const taskStatusTone: Record<TaskStatus, string> = {
  TODO: "border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]",
  IN_PROGRESS: "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent-muted)]",
  BLOCKED: "border-[var(--warning)]/25 bg-[var(--warning-surface)] text-[var(--warning-line)]",
  COMPLETED: "border-[var(--success)]/20 bg-[var(--success-surface)] text-[var(--success-line)]",
  CANCELLED: "border-[var(--danger)]/20 bg-[var(--danger-surface)] text-[var(--danger-line)]",
};

export const taskPriorityTone: Record<TaskPriority, string> = {
  LOW: "border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]",
  MEDIUM: "border-[var(--info)]/20 bg-[var(--info-surface)] text-[var(--info-line)]",
  HIGH: "border-[var(--warning)]/25 bg-[var(--warning-surface)] text-[var(--warning-line)]",
  URGENT: "border-[var(--danger)]/20 bg-[var(--danger-surface)] text-[var(--danger-line)]",
};

export const taskSortValues = ["updated", "due", "priority", "status", "project", "title"] as const;
export type TaskSort = (typeof taskSortValues)[number];

export const taskSortLabels: Record<TaskSort, string> = {
  updated: "Recently updated",
  due: "Due date",
  priority: "Priority",
  status: "Status",
  project: "Project",
  title: "Task name",
};

export const taskDueFilterValues = ["ALL", "OVERDUE", "DUE_SOON", "NO_DUE_DATE"] as const;
export type TaskDueFilter = (typeof taskDueFilterValues)[number];

export const taskDueFilterLabels: Record<TaskDueFilter, string> = {
  ALL: "All dates",
  OVERDUE: "Overdue",
  DUE_SOON: "Due soon",
  NO_DUE_DATE: "No due date",
};

export const activeTaskStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED"];

export const priorityRank: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const statusRank: Record<TaskStatus, number> = {
  IN_PROGRESS: 0,
  TODO: 1,
  BLOCKED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
};
