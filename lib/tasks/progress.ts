import type { TaskStatus } from "@/lib/tasks/options";

export type TaskStatusCounts = Partial<Record<TaskStatus, number>>;

export function getTaskProgress(counts: TaskStatusCounts) {
  const total = Object.entries(counts).reduce((sum, [status, count]) => {
    return status === "CANCELLED" ? sum : sum + (count ?? 0);
  }, 0);
  const completed = counts.COMPLETED ?? 0;

  return {
    total,
    completed,
    percentage: total ? Math.round((completed / total) * 100) : null,
  };
}
