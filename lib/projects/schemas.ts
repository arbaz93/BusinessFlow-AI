import { z } from "zod";
import { projectPriorityValues, projectStatusValues } from "@/lib/projects/options";

function optionalText(maximum: number) {
  return z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.string().max(maximum).optional(),
  );
}

export const projectStatusSchema = z.enum(projectStatusValues);
export const projectPrioritySchema = z.enum(projectPriorityValues);

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(120, "Project name must be 120 characters or fewer."),
  clientId: z.string().trim().min(1, "Choose a client.").max(64),
  description: optionalText(2000),
  status: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "PLANNING" : value,
    projectStatusSchema,
  ),
  priority: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "MEDIUM" : value,
    projectPrioritySchema,
  ),
  startDate: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.date().optional(),
  ),
  dueDate: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.date().optional(),
  ),
  notes: optionalText(5000),
}).refine(
  (value) => !value.startDate || !value.dueDate || value.dueDate.getTime() >= value.startDate.getTime(),
  { message: "Due date must be on or after the start date.", path: ["dueDate"] },
);

export const projectIdSchema = z.string().trim().min(1).max(64);

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ProjectInput, string[]>>;
  success?: boolean;
};
