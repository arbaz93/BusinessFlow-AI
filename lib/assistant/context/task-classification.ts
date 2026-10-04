import type { TaskStatus } from "@/lib/tasks/options";
import { getTaskTimelineState } from "@/lib/tasks/timeline";
import type {
  AssistantTaskClassification,
  AssistantTaskStatusLabel,
  AssistantTaskAggregates,
} from "@/lib/assistant/context/types";

export {
  type AssistantTaskClassification,
  type AssistantTaskStatusLabel,
  type AssistantTaskAggregates,
};

export const assistantTaskStatusPriority: Record<AssistantTaskStatusLabel, number> = {
  OVERDUE: 0,
  BLOCKED: 1,
  UPCOMING: 2,
  OPEN: 3,
  COMPLETED: 4,
};

export function classifyAssistantTaskState(
  status: TaskStatus,
  dueDate: Date | string | null | undefined,
  now = new Date(),
): AssistantTaskClassification {
  const timeline = getTaskTimelineState(status, dueDate, now);

  if (timeline === "completed") return { status: "COMPLETED" };
  if (timeline === "cancelled") return { status: "COMPLETED", reason: "cancelled" };

  if (status === "BLOCKED") return { status: "BLOCKED", reason: "task is blocked" };

  let classification: AssistantTaskStatusLabel;
  let reason: string | undefined;

  switch (timeline) {
    case "overdue":
      classification = "OVERDUE";
      reason = "past due date";
      break;
    case "due_soon":
      classification = "UPCOMING";
      reason = "due within 7 days";
      break;
    case "no_due_date":
      classification = "OPEN";
      reason = "no due date set";
      break;
    default:
      classification = "OPEN";
      break;
  }

  return {
    status: classification,
    ...(reason ? { reason } : {}),
  };
}

export function computeAssistantTaskAggregates(
  classified: AssistantTaskClassification[],
): AssistantTaskAggregates {
  const aggregates: AssistantTaskAggregates = {
    total: classified.length,
    overdue: 0,
    dueSoon: 0,
    blocked: 0,
    open: 0,
    completed: 0,
  };

  for (const item of classified) {
    switch (item.status) {
      case "OVERDUE":
        aggregates.overdue += 1;
        break;
      case "UPCOMING":
        aggregates.dueSoon += 1;
        break;
      case "BLOCKED":
        aggregates.blocked += 1;
        break;
      case "COMPLETED":
        aggregates.completed += 1;
        break;
      case "OPEN":
        aggregates.open += 1;
        break;
    }
  }

  return aggregates;
}
