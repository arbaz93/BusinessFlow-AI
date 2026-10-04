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
  PLANNING: "border-white/10 bg-white/[0.04] text-white/70",
  IN_PROGRESS: "border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]",
  ON_HOLD: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]",
  COMPLETED: "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac]",
  CANCELLED: "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]",
};

export const projectPriorityTone: Record<ProjectPriority, string> = {
  LOW: "border-white/10 bg-white/[0.04] text-white/65",
  MEDIUM: "border-[#93c5fd]/20 bg-[#93c5fd]/10 text-[#bfdbfe]",
  HIGH: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]",
  URGENT: "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]",
};
