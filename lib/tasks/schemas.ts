import { z } from "zod";
import { taskPriorityValues, taskStatusValues } from "@/lib/tasks/options";

function optionalText(maximum: number) {
  return z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.string().max(maximum).optional(),
  );
}

export const taskStatusSchema = z.enum(taskStatusValues);
export const taskPrioritySchema = z.enum(taskPriorityValues);

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Task title is required.").max(160, "Task title must be 160 characters or fewer."),
  projectId: z.string().trim().min(1, "Choose a project.").max(64),
  description: optionalText(2000),
  status: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "TODO" : value,
    taskStatusSchema,
  ),
  priority: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "MEDIUM" : value,
    taskPrioritySchema,
  ),
  dueDate: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.date().optional(),
  ),
  assigneeId: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(64).optional(),
  ),
}).refine((value) => !value.dueDate || value.dueDate instanceof Date && Number.isFinite(value.dueDate.getTime()), {
  message: "Choose a valid due date.",
  path: ["dueDate"],
});

export const taskIdSchema = z.string().trim().min(1).max(64);

export const taskProposalEditSchema = z.object({
  title: z.string().trim().min(1, "Task title is required.").max(160, "Task title must be 160 characters or fewer."),
  description: optionalText(2000),
  priority: z.preprocess(
    (value) => (value === null || value === undefined || value === "" ? "MEDIUM" : value),
    taskPrioritySchema,
  ),
  dueDate: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  assigneeId: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(64).optional(),
  ),
}).strict();

export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof TaskInput, string[]>>;
  success?: boolean;
};
