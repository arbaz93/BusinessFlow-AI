import { z } from "zod";

export const ASSISTANT_PROJECT_LIST_LIMIT = 50;
export const ASSISTANT_TASK_LIST_LIMIT = 20;
export const ASSISTANT_DOCUMENT_LIST_LIMIT = 20;
export const ASSISTANT_ACTIVITY_LIST_LIMIT = 20;
export const ASSISTANT_ORG_TASK_SAMPLE_LIMIT = 8;

export const assistantProjectReferenceSchema = z.string().trim().min(1).max(120);

export const assistantClarificationSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  clientQualifier: z.string(),
});

export type AssistantClarificationCandidate = z.infer<typeof assistantClarificationSchema>;
