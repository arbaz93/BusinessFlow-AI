import { z } from "zod";
import { taskPrioritySchema } from "@/lib/tasks/schemas";

export const approveSuggestedTasksInputSchema = z.object({
  projectId: z.string().trim().min(1).max(64),
  analysisId: z.string().trim().min(1).max(64),
  tasks: z.array(z.object({
    suggestionId: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000),
    priority: taskPrioritySchema,
  })).min(1).max(30),
}).superRefine((value, context) => {
  const ids = new Set<string>();
  value.tasks.forEach((task, index) => {
    if (ids.has(task.suggestionId)) {
      context.addIssue({
        code: "custom",
        path: ["tasks", index, "suggestionId"],
        message: "A suggestion may only be selected once.",
      });
    }
    ids.add(task.suggestionId);
  });
});

export type ApproveSuggestedTasksInput = z.infer<typeof approveSuggestedTasksInputSchema>;

export type ApproveSuggestedTasksResult =
  | { success: true; createdTasks: Array<{ suggestionId: string; taskId: string; title: string }> }
  | { success: false; error: string; code?: "STALE_ANALYSIS" | "FAILED_ANALYSIS" | "ALREADY_APPROVED" | "INVALID_SUGGESTION" | "INVALID_TASK" };
