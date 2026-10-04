import type { ProjectAIAnalysisState } from "@/lib/project-ai/persistence";

export type ProjectAIOverviewAnalysis = NonNullable<ProjectAIAnalysisState["analysis"]>;

export function getProjectAIOverviewData(analysis: ProjectAIOverviewAnalysis) {
  const approvedSuggestionIds = new Set(analysis.approvedSuggestions.map(({ suggestionId }) => suggestionId));
  const suggestions = analysis.intelligence.suggestedTasks;

  return {
    requirementCount: analysis.intelligence.requirements.length,
    deliverableCount: analysis.intelligence.deliverables.length,
    riskCount: analysis.intelligence.risks.length,
    highRiskCount: analysis.intelligence.risks.filter((risk) => risk.severity === "HIGH").length,
    missingInformationCount: analysis.intelligence.missingInformation.length,
    pendingSuggestionCount: suggestions.filter(({ suggestionId }) => !approvedSuggestionIds.has(suggestionId)).length,
    summaryPreview: createSummaryPreview(analysis.intelligence.summary),
  };
}

function createSummaryPreview(summary: string, maximumLength = 240) {
  const normalized = summary.trim();
  if (normalized.length <= maximumLength) {
    return { text: normalized, truncated: false };
  }

  const preview = normalized.slice(0, maximumLength);
  const lastWordBoundary = preview.lastIndexOf(" ");
  return {
    text: `${preview.slice(0, lastWordBoundary > 0 ? lastWordBoundary : maximumLength).trimEnd()}…`,
    truncated: true,
  };
}
