export const AI_ANALYSIS_FEEDBACK_TARGET_TYPES = [
  "ANALYSIS",
  "SUMMARY",
  "REQUIREMENT",
  "DELIVERABLE",
  "RISK",
  "MISSING_INFORMATION",
  "SUGGESTED_TASK",
] as const;

export type AIAnalysisFeedbackTargetType = (typeof AI_ANALYSIS_FEEDBACK_TARGET_TYPES)[number];

export const ANALYSIS_FEEDBACK_TARGET_ID = "analysis";
export const SUMMARY_FEEDBACK_TARGET_ID = "summary";

export const aiAnalysisFeedbackTypeValues = [
  "INCORRECT",
  "MISSING_INFORMATION",
  "NOT_RELEVANT",
  "DUPLICATE",
  "NOT_ACTIONABLE",
  "TOO_GENERIC",
  "OTHER",
] as const;

export type AIAnalysisFeedbackType = (typeof aiAnalysisFeedbackTypeValues)[number];

export type ProjectAIAnalysisFeedbackView = {
  targetType: AIAnalysisFeedbackTargetType;
  targetId: string;
  feedbackType: AIAnalysisFeedbackType;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  isOwn: boolean;
};
