import type { ProjectIntelligence } from "@/lib/project-ai/schemas";
import {
  AI_ANALYSIS_FEEDBACK_TARGET_TYPES,
  ANALYSIS_FEEDBACK_TARGET_ID,
  SUMMARY_FEEDBACK_TARGET_ID,
  type AIAnalysisFeedbackTargetType,
} from "@/lib/project-ai/feedback-types";

export { AI_ANALYSIS_FEEDBACK_TARGET_TYPES };
export type { AIAnalysisFeedbackTargetType };

export type ProjectAIAnalysisFeedbackTargets = {
  summaryId: string;
  requirements: string[];
  deliverables: string[];
  risks: string[];
  missingInformation: string[];
  suggestedTasks: string[];
};

function stableIdsForItems<T>(
  analysisId: string,
  targetType: AIAnalysisFeedbackTargetType,
  items: T[],
): string[] {
  return items.map((_, index) => `${analysisId}:${targetType.toLowerCase()}:${index}`);
}

export function identifyProjectAIAnalysisFeedbackTargets(
  analysisId: string,
  intelligence: ProjectIntelligence,
  suggestedTaskIds: string[],
): ProjectAIAnalysisFeedbackTargets {
  return {
    summaryId: SUMMARY_FEEDBACK_TARGET_ID,
    requirements: stableIdsForItems(analysisId, "REQUIREMENT", intelligence.requirements),
    deliverables: stableIdsForItems(analysisId, "DELIVERABLE", intelligence.deliverables),
    risks: stableIdsForItems(analysisId, "RISK", intelligence.risks),
    missingInformation: stableIdsForItems(analysisId, "MISSING_INFORMATION", intelligence.missingInformation),
    suggestedTasks: suggestedTaskIds,
  };
}

export function isValidProjectAIAnalysisFeedbackTarget(
  analysisId: string,
  intelligence: ProjectIntelligence,
  targetType: AIAnalysisFeedbackTargetType,
  targetId: string,
  suggestedTaskIds: string[],
) {
  if (targetType === "ANALYSIS") return targetId === ANALYSIS_FEEDBACK_TARGET_ID;

  const targets = identifyProjectAIAnalysisFeedbackTargets(analysisId, intelligence, suggestedTaskIds);
  if (targetType === "SUMMARY") return targetId === targets.summaryId;

  const idsByType = {
    REQUIREMENT: targets.requirements,
    DELIVERABLE: targets.deliverables,
    RISK: targets.risks,
    MISSING_INFORMATION: targets.missingInformation,
    SUGGESTED_TASK: targets.suggestedTasks,
  } satisfies Partial<Record<AIAnalysisFeedbackTargetType, string[]>>;
  return idsByType[targetType]?.includes(targetId) ?? false;
}
