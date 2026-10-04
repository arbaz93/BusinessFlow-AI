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
  TODO: "border-white/10 bg-white/[0.04] text-white/70",
  IN_PROGRESS: "border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]",
  BLOCKED: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]",
  COMPLETED: "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac]",
  CANCELLED: "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]",
};

export const taskPriorityTone: Record<TaskPriority, string> = {
  LOW: "border-white/10 bg-white/[0.04] text-white/65",
  MEDIUM: "border-[#93c5fd]/20 bg-[#93c5fd]/10 text-[#bfdbfe]",
  HIGH: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]",
  URGENT: "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]",
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
