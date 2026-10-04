import "server-only";

import type {
  AssistantAIIntelligence,
  AssistantAIContextState,
  AssistantRisk,
  AssistantMissingInformation,
  AssistantSuggestedTask,
} from "@/lib/assistant/context/types";
import { getProjectAIAnalysisState } from "@/lib/project-ai/persistence";
import type { IdentifiedProjectIntelligence } from "@/lib/project-ai/suggestion-identity";
import type { ProjectAIAnalysisState } from "@/lib/project-ai/persistence";

export {
  type AssistantAIIntelligence,
  type AssistantAIContextState,
  type AssistantRisk,
  type AssistantMissingInformation,
  type AssistantSuggestedTask,
  type IdentifiedProjectIntelligence,
  type ProjectAIAnalysisState,
};

const staleReasonLabels: Record<string, string> = {
  PRIMARY_BRIEF_CHANGED: "the project brief has changed since this analysis was generated",
  SOURCE_UPDATED: "the project brief has been updated since this analysis was generated",
  NO_PRIMARY_BRIEF: "the project brief is no longer available",
  SOURCE_MISSING: "the project brief used for this analysis is no longer available",
};

function toRiskSeverity(severity: string): AssistantRisk["severity"] {
  const value = severity.toLowerCase();
  if (value === "high" || value === "medium" || value === "low") return value;
  return "low";
}

function formatAnalyzedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function mapAssistantAIIntelligence(
  intelligence: IdentifiedProjectIntelligence,
  meta: {
    analyzedAt: string;
    isCurrent: boolean;
    staleReason: string | null;
    sourceDocumentName: string | null;
    sourceMetadataTruncated: boolean;
  },
): AssistantAIIntelligence {
  return {
    analyzedAt: meta.analyzedAt,
    analyzedAtLabel: formatAnalyzedAt(meta.analyzedAt),
    summary: intelligence.summary,
    risks: intelligence.risks.map((risk) => ({
      title: risk.title,
      description: risk.description,
      severity: toRiskSeverity(risk.severity),
    })),
    missingInformation: intelligence.missingInformation.map((item) => ({
      question: item.question,
      reason: item.reason,
    })),
    deliverablesCount: intelligence.deliverables.length,
    requirementsCount: intelligence.requirements.length,
    suggestedTasks: intelligence.suggestedTasks.map(
      (task): AssistantSuggestedTask => ({
        title: task.title,
        description: task.description,
      }),
    ),
    sourceDocumentName: meta.sourceDocumentName,
    sourceMetadataTruncated: meta.sourceMetadataTruncated,
    isCurrent: meta.isCurrent,
    staleReason: meta.staleReason ? staleReasonLabels[meta.staleReason] ?? meta.staleReason : null,
  };
}

export async function getAssistantAIContext(projectId: string): Promise<AssistantAIContextState> {
  const state = await getProjectAIAnalysisState(projectId);

  const sourceMetadataTruncated = Boolean(state.analysis?.intelligence.sourceMetadata?.truncated);
  const isCurrent = state.analysisIsCurrent;
  const staleReason: string | null = state.analysisStaleReason
    ? staleReasonLabels[state.analysisStaleReason] ?? state.analysisStaleReason
    : null;

  switch (state.status) {
    case "NO_BRIEF":
      return { status: "NO_BRIEF" };
    case "PROCESSING":
      return { status: "PROCESSING" };
    case "COMPLETED":
    case "STALE":
      if (!state.analysis?.intelligence) {
        return { status: "ERROR", errorMessage: "The saved project analysis could not be validated." };
      }
      return {
        status: "READY",
        intelligence: mapAssistantAIIntelligence(state.analysis.intelligence, {
          analyzedAt: state.analysis.completedAt ?? state.analysis.createdAt,
          isCurrent,
          staleReason,
          sourceDocumentName: state.analysis.sourceDocumentName,
          sourceMetadataTruncated,
        }),
      };
    case "FAILED":
      return {
        status: "ERROR",
        errorMessage: state.errorMessage ?? state.latestFailureMessage ?? "Project intelligence is unavailable.",
      };
    case "SOURCE_MISSING":
      return { status: "NO_BRIEF", errorMessage: "The Project Brief used for this analysis is no longer available." };
    default:
      return { status: "ERROR", errorMessage: "Project intelligence is unavailable." };
  }
}
