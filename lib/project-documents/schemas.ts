import { z } from "zod";
import { projectDocumentTypeValues } from "@/lib/project-documents/options";

export const projectDocumentTypeSchema = z.enum(projectDocumentTypeValues);
export const projectDocumentIdSchema = z.string().trim().min(1).max(64);

export const projectDocumentInputSchema = z.object({
  projectId: z.string().trim().min(1, "Choose a project.").max(64),
  name: z.string().trim().min(1, "Document name is required.").max(160, "Document names must be 160 characters or fewer."),
  documentType: projectDocumentTypeSchema,
  isPrimary: z.preprocess(
    (value) => value === "true" || value === "on" || value === "1" || value === true,
    z.boolean().default(false),
  ),
});

export type ProjectDocumentInput = z.infer<typeof projectDocumentInputSchema>;

export type ProjectDocumentFormState = {
  error?: string;
  success?: boolean;
};
