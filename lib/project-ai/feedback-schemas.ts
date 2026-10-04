import { z } from "zod";
import {
  AI_ANALYSIS_FEEDBACK_TARGET_TYPES,
  aiAnalysisFeedbackTypeValues,
} from "@/lib/project-ai/feedback-types";
import type { AIAnalysisFeedbackType } from "@/lib/project-ai/feedback-types";

export const aiAnalysisFeedbackTypeLabels = {
  INCORRECT: "Incorrect",
  MISSING_INFORMATION: "Missing information",
  NOT_RELEVANT: "Not relevant",
  DUPLICATE: "Duplicate",
  NOT_ACTIONABLE: "Not actionable",
  TOO_GENERIC: "Too generic",
  OTHER: "Other",
} as const;

export { aiAnalysisFeedbackTypeValues };

const submitAIAnalysisFeedbackBaseSchema = z.object({
  projectId: z.string().trim().min(1).max(64),
  analysisId: z.string().trim().min(1).max(64),
  targetType: z.enum(AI_ANALYSIS_FEEDBACK_TARGET_TYPES),
  targetId: z.string().trim().min(1).max(100),
  feedbackType: z.enum(aiAnalysisFeedbackTypeValues),
  comment: z.string().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.comment !== undefined && value.comment.trim().length === 0) {
    context.addIssue({
      code: "custom",
      path: ["comment"],
      message: "Enter a comment or leave the field empty.",
    });
  }
  if (value.feedbackType === "OTHER" && !value.comment?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["comment"],
      message: "Add a short explanation for Other feedback.",
    });
  }
});

export const submitAIAnalysisFeedbackSchema = submitAIAnalysisFeedbackBaseSchema.transform((value) => ({
  ...value,
  comment: value.comment?.trim() || undefined,
}));

export type { AIAnalysisFeedbackType };
