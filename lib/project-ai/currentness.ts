export type ProjectAIAnalysisSourceState = "CURRENT" | "STALE" | "SOURCE_MISSING";
export type ProjectAIAnalysisStaleReason =
  | "PRIMARY_BRIEF_CHANGED"
  | "SOURCE_UPDATED"
  | "NO_PRIMARY_BRIEF"
  | "SOURCE_MISSING";
export type ProjectAIAnalysisSourceInput = {
  sourceDocumentId: string | null;
  sourceDocumentUpdatedAt: Date;
  sourceDocumentExists: boolean;
  currentPrimaryDocumentId: string | null;
  currentPrimaryDocumentUpdatedAt: Date | null;
};

export const currentProjectAIAnalysisOrderBy = [
  { completedAt: "desc" as const },
  { createdAt: "desc" as const },
];

export function isCurrentProjectAIAnalysis({
  analysisId,
  currentAnalysisId,
  sourceState,
}: {
  analysisId: string;
  currentAnalysisId: string | null;
  sourceState: ProjectAIAnalysisSourceState;
}) {
  return analysisId === currentAnalysisId && sourceState === "CURRENT";
}

export function preferCurrentSourceProjectAIAnalysis<T>(
  currentSourceAnalysis: T | null,
  mostRecentSuccessfulAnalysis: T | null,
): T | null {
  return currentSourceAnalysis ?? mostRecentSuccessfulAnalysis;
}

export function getProjectAIAnalysisSourceAssessment({
  sourceDocumentId,
  sourceDocumentUpdatedAt,
  sourceDocumentExists,
  currentPrimaryDocumentId,
  currentPrimaryDocumentUpdatedAt,
}: ProjectAIAnalysisSourceInput): {
  state: ProjectAIAnalysisSourceState;
  staleReason: ProjectAIAnalysisStaleReason | null;
} {
  let staleReason: ProjectAIAnalysisStaleReason | null = null;
  if (!sourceDocumentId || !sourceDocumentExists) {
    staleReason = "SOURCE_MISSING";
  } else if (!currentPrimaryDocumentId || !currentPrimaryDocumentUpdatedAt) {
    staleReason = "NO_PRIMARY_BRIEF";
  } else if (sourceDocumentId !== currentPrimaryDocumentId) {
    staleReason = "PRIMARY_BRIEF_CHANGED";
  } else if (sourceDocumentUpdatedAt.getTime() !== currentPrimaryDocumentUpdatedAt.getTime()) {
    staleReason = "SOURCE_UPDATED";
  }

  return {
    state: staleReason === null
      ? "CURRENT"
      : staleReason === "SOURCE_MISSING"
        ? "SOURCE_MISSING"
        : "STALE",
    staleReason,
  };
}

export function getProjectAIAnalysisSourceState(input: ProjectAIAnalysisSourceInput) {
  return getProjectAIAnalysisSourceAssessment(input).state;
}

export function getProjectAIAnalysisStaleReason(input: ProjectAIAnalysisSourceInput) {
  return getProjectAIAnalysisSourceAssessment(input).staleReason;
}

export function shouldRetryProjectAIAnalysis({
  latestCompletedAttemptAt,
  latestFailureAt,
}: {
  latestCompletedAttemptAt: Date | null;
  latestFailureAt: Date | null;
}) {
  return latestCompletedAttemptAt === null ||
    (latestFailureAt !== null && latestFailureAt.getTime() > latestCompletedAttemptAt.getTime());
}
