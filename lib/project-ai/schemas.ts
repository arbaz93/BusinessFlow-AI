import { z } from "zod";

export const projectAiAnalysisInputSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required.").max(64),
});

export const projectBriefContentResultSchema = z.object({
  ok: z.literal(true),
  content: z.string(),
  source: z.string(),
  sourceDocumentId: z.string(),
  sourceDocumentName: z.string(),
  sourceDocumentUpdatedAt: z.string().datetime(),
  truncated: z.boolean(),
  originalCharacterCount: z.number().int().nonnegative(),
  finalCharacterCount: z.number().int().nonnegative(),
}).or(z.object({
  ok: z.literal(false),
  errorCode: z.enum([
    "NO_PRIMARY_BRIEF",
    "DOCUMENT_NOT_FOUND",
    "DOCUMENT_STORAGE_UNAVAILABLE",
    "DOCUMENT_ACCESS_DENIED",
    "UNSUPPORTED_DOCUMENT_TYPE",
    "DOCUMENT_EXTRACTION_FAILED",
    "DOCUMENT_NO_TEXT",
    "DOCUMENT_TOO_LARGE",
  ]),
  truncated: z.literal(false),
}));

export const projectBriefSourceMetadataSchema = z.object({
  truncated: z.boolean(),
  originalCharacterCount: z.number().int().nonnegative(),
  finalCharacterCount: z.number().int().nonnegative(),
}).strict();

export type ProjectBriefSourceMetadata = z.infer<typeof projectBriefSourceMetadataSchema>;

export const projectIntelligenceRequirementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  importance: z.enum(["LOW", "MEDIUM", "HIGH"]),
}).strict();

export const projectIntelligenceDeliverableSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
}).strict();

export const projectIntelligenceRiskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
}).strict();

export const projectIntelligenceMissingInformationSchema = z.object({
  question: z.string().trim().min(1).max(300),
  reason: z.string().trim().min(1).max(1200),
}).strict();

export const projectIntelligenceSuggestedTaskSchema = z.object({
  suggestionId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/).optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
}).strict();

export const projectIntelligenceSchema = z.object({
  summary: z.string().trim().min(1).max(4000),
  requirements: z.array(projectIntelligenceRequirementSchema).default([]),
  deliverables: z.array(projectIntelligenceDeliverableSchema).default([]),
  risks: z.array(projectIntelligenceRiskSchema).default([]),
  missingInformation: z.array(projectIntelligenceMissingInformationSchema).default([]),
  suggestedTasks: z.array(projectIntelligenceSuggestedTaskSchema).default([]),
  sourceMetadata: projectBriefSourceMetadataSchema.optional(),
}).strict().superRefine((value, context) => {
  const ids = new Set<string>();
  value.suggestedTasks.forEach((task, index) => {
    if (!task.suggestionId) return;
    if (ids.has(task.suggestionId)) {
      context.addIssue({
        code: "custom",
        path: ["suggestedTasks", index, "suggestionId"],
        message: "Suggestion IDs must be unique within an analysis.",
      });
    }
    ids.add(task.suggestionId);
  });
});

export const projectIntelligenceProviderSchema = z.object({
  summary: z.string().trim().min(1).max(4000),
  requirements: z.array(projectIntelligenceRequirementSchema),
  deliverables: z.array(projectIntelligenceDeliverableSchema),
  risks: z.array(projectIntelligenceRiskSchema),
  missingInformation: z.array(projectIntelligenceMissingInformationSchema),
  suggestedTasks: z.array(z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(2000),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  }).strict()),
}).strict();

export type ProjectAiAnalysisInput = z.infer<typeof projectAiAnalysisInputSchema>;
export type ProjectBriefContentResult = z.infer<typeof projectBriefContentResultSchema>;
export type ProjectIntelligence = z.infer<typeof projectIntelligenceSchema>;
export type ProjectAnalysisFailureCode =
  | "NO_PRIMARY_BRIEF"
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_STORAGE_UNAVAILABLE"
  | "DOCUMENT_ACCESS_DENIED"
  | "UNSUPPORTED_DOCUMENT_TYPE"
  | "DOCUMENT_EXTRACTION_FAILED"
  | "DOCUMENT_NO_TEXT"
  | "DOCUMENT_TOO_LARGE"
  | "AI_NOT_CONFIGURED"
  | "AI_PERSISTENCE_FAILED"
  | "AI_ANALYSIS_ALREADY_RUNNING"
  | "AI_ANALYSIS_STALE"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_ERROR"
  | "AI_RATE_LIMITED"
  | "AI_TIMEOUT"
  | "AI_INVALID_RESPONSE"
  | "AI_VALIDATION_FAILED"
  | "UNKNOWN_AI_ERROR";

export type AnalyzeProjectBriefResult =
  | {
      success: true;
      intelligence: ProjectIntelligence;
      sourceDocumentId: string;
      sourceDocumentName: string;
      sourceDocumentUpdatedAt: string;
      model: string;
      sourceMetadata: ProjectBriefSourceMetadata;
    }
  | {
      success: false;
      code: ProjectAnalysisFailureCode;
      message: string;
    };
