export const projectStatusValues = [
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ProjectStatus = (typeof projectStatusValues)[number];

export const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const projectPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type ProjectPriority = (typeof projectPriorityValues)[number];

export const projectPriorityLabels: Record<ProjectPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const projectStatusTone: Record<ProjectStatus, string> = {
  PLANNING: "border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]",
  IN_PROGRESS: "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent-muted)]",
  ON_HOLD: "border-[var(--warning)]/25 bg-[var(--warning-surface)] text-[var(--warning-line)]",
  COMPLETED: "border-[var(--success)]/20 bg-[var(--success-surface)] text-[var(--success-line)]",
  CANCELLED: "border-[var(--danger)]/20 bg-[var(--danger-surface)] text-[var(--danger-line)]",
};

export const projectPriorityTone: Record<ProjectPriority, string> = {
  LOW: "border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]",
  MEDIUM: "border-[var(--info)]/20 bg-[var(--info-surface)] text-[var(--info-line)]",
  HIGH: "border-[var(--warning)]/25 bg-[var(--warning-surface)] text-[var(--warning-line)]",
  URGENT: "border-[var(--danger)]/20 bg-[var(--danger-surface)] text-[var(--danger-line)]",
};
