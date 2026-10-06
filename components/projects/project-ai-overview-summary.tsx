"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FileText, LoaderCircle, Sparkles } from "lucide-react";
import { analyzeProjectBriefAction } from "@/app/actions/project-ai";
import type { ProjectAIAnalysisState } from "@/lib/project-ai/persistence";
import { getProjectAIOverviewData } from "@/lib/project-ai/overview";

function ViewAIIntelligenceLink({
  projectId,
  children,
  anchor = "",
}: {
  projectId: string;
  children: React.ReactNode;
  anchor?: string;
}) {
  return (
    <Link
      href={`/projects/${projectId}/ai${anchor}`}
      className="inline-flex min-h-8 items-center gap-1 rounded-sm text-xs font-medium text-[var(--accent-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
    >
      {children} <ArrowUpRight size={13} aria-hidden="true" />
    </Link>
  );
}

function DocumentLink({ projectId, children = "View Document" }: { projectId: string; children?: React.ReactNode }) {
  return (
    <Link
      href={`/projects/${projectId}/documents`}
      className="inline-flex min-h-8 items-center gap-1 rounded-sm text-xs font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
    >
      <FileText size={13} aria-hidden="true" />
      {children}
    </Link>
  );
}

function AnalyzeProjectForm({
  projectId,
  initialState,
  label,
}: {
  projectId: string;
  initialState: ProjectAIAnalysisState;
  label: string;
}) {
  const [state, formAction, isPending] = useActionState(analyzeProjectBriefAction, initialState);
  const currentAnalysis = state.status === "COMPLETED" && state.analysis && state.analysisIsCurrent
    ? state.analysis
    : null;
  const overview = currentAnalysis ? getProjectAIOverviewData(currentAnalysis) : null;
  const isStale = state.status === "STALE";
  const sourceUnavailable = state.status === "SOURCE_MISSING";
  const noBrief = state.status === "NO_BRIEF" || (!state.primaryBrief && state.status !== "SOURCE_MISSING");
  const isProcessing = isPending || state.status === "PROCESSING";

  if (noBrief) {
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-[var(--foreground)]/85">AI Intelligence unavailable</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--foreground)]/50">Add a primary project brief to analyze this project.</p>
        <DocumentLink projectId={projectId}>Go to Documents</DocumentLink>
        {state.analysis && (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--foreground)]/45">
            A previous analysis is available as historical context.
            <ViewAIIntelligenceLink projectId={projectId} anchor="#saved-analysis">View previous analysis</ViewAIIntelligenceLink>
          </p>
        )}
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="mt-4 space-y-3">
        <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-[#d2ccff]">
          <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
          Analyzing Project Brief...
        </p>
        <p className="text-xs text-[var(--foreground)]/50">Your previous analysis, Tasks, and Documents remain available while analysis runs.</p>
        <ViewAIIntelligenceLink projectId={projectId}>Open AI Intelligence</ViewAIIntelligenceLink>
      </div>
    );
  }

  if (sourceUnavailable) {
    return (
      <div className="mt-4">
        <p role="status" className="text-sm font-medium text-[#fbbf24]">AI analysis source unavailable</p>
        <p className="mt-1 text-xs leading-5 text-[var(--foreground)]/55">The brief used for this analysis is no longer available.</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <DocumentLink projectId={projectId}>Go to Documents</DocumentLink>
          {state.primaryBrief && (
            <form action={formAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <button type="submit" disabled={isPending} className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[var(--accent-muted)] hover:text-[var(--foreground)] disabled:opacity-60">
                {isPending && <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />}
                Analyze Updated Brief
              </button>
            </form>
          )}
          {state.analysis && <ViewAIIntelligenceLink projectId={projectId} anchor="#saved-analysis">View Previous Analysis</ViewAIIntelligenceLink>}
          {state.primaryBrief && (
            <p className="mt-2 text-[11px] leading-5 text-[var(--foreground)]/45">
              A new analysis will leave previous analyses and existing Tasks unchanged.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isStale) {
    return (
      <div className="mt-4 space-y-3">
        <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-md border border-[#f59e0b]/20 bg-[#f59e0b]/[0.04] p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#fbbf24]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-[#fbbf24]">AI analysis needs updating</p>
            <p className="mt-1 text-xs leading-5 text-[var(--foreground)]/55">
              {state.analysisStaleReason === "SOURCE_UPDATED"
                ? "The primary Project Brief was updated after this analysis was created."
                : state.analysisStaleReason === "NO_PRIMARY_BRIEF"
                  ? "The Project Brief used for this analysis is no longer selected as primary."
                  : state.analysisStaleReason === "SOURCE_MISSING"
                    ? "The Project Brief used for this analysis is no longer available."
                    : "The current primary Project Brief is different from the one used for this analysis."}
            </p>
            {state.analysis && <p className="mt-1 text-[11px] text-[var(--foreground)]/45">Previous source: {state.analysis.sourceDocumentName}</p>}
            {state.primaryBrief && <p className="mt-1 text-[11px] text-[var(--foreground)]/45">Current brief: {state.primaryBrief.originalName}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <form action={formAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button type="submit" disabled={isPending} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#a49bff] px-3 text-xs font-medium text-[#101018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:opacity-60">
              {isPending && <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />}
              {isPending ? "Analyzing..." : "Analyze Updated Brief"}
            </button>
          </form>
          <DocumentLink projectId={projectId}>View Current Brief</DocumentLink>
          <ViewAIIntelligenceLink projectId={projectId} anchor="#saved-analysis">View Previous Analysis</ViewAIIntelligenceLink>
        </div>
        <p className="text-[11px] leading-5 text-[var(--foreground)]/45">
          A new analysis will leave previous analyses and existing Tasks unchanged.
        </p>
      </div>
    );
  }

  if (state.status === "FAILED") {
    return (
      <div className="mt-4 space-y-3">
        <p role="alert" className="text-sm text-[#fbbf24]">
          {state.errorMessage ?? "AI analysis could not be completed. Please try again."}
        </p>
        {state.analysis && (
          <p className="text-xs text-[var(--foreground)]/45">The latest attempt failed. Your previous successful analysis remains available.</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <form action={formAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button type="submit" disabled={isPending} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#a49bff] px-3 text-xs font-medium text-[#101018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:opacity-60">
              {isPending && <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />}
              {isPending ? "Analyzing..." : "Try Again"}
            </button>
          </form>
          {state.analysis && <ViewAIIntelligenceLink projectId={projectId} anchor="#saved-analysis">View Previous Analysis</ViewAIIntelligenceLink>}
        </div>
      </div>
    );
  }

  if (!currentAnalysis || !overview) {
    return (
      <div className="mt-4 space-y-3">
        <h3 className="text-sm font-medium text-[var(--foreground)]/85">Ready for AI analysis</h3>
        <p className="text-xs leading-5 text-[var(--foreground)]/50">Analyze the primary brief to identify requirements, risks, and suggested work.</p>
        <p className="text-[11px] text-[var(--foreground)]/45">Primary brief: {state.primaryBrief?.originalName}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <form action={formAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button type="submit" disabled={isPending} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#a49bff] px-3 text-xs font-medium text-[#101018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:opacity-60">
              {isPending && <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />}
              {isPending ? "Analyzing..." : label}
            </button>
          </form>
          <DocumentLink projectId={projectId} />
        </div>
        {state.errorMessage && <p role="alert" className="text-xs text-[#fca5a5]">{state.errorMessage}</p>}
      </div>
    );
  }

  const riskLabel = `${overview.highRiskCount} high-priority ${overview.highRiskCount === 1 ? "risk" : "risks"}`;
  const infoLabel = `${overview.missingInformationCount} ${overview.missingInformationCount === 1 ? "question may" : "questions may"} need clarification`;
  const suggestionLabel = `${overview.pendingSuggestionCount} AI ${overview.pendingSuggestionCount === 1 ? "suggestion" : "suggestions"} ready for review`;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[var(--foreground)]/50">Analyzed from</p>
          <p className="mt-0.5 break-words text-sm font-medium text-[var(--foreground)]/85">{currentAnalysis.sourceDocumentName}</p>
        </div>
        <DocumentLink projectId={projectId} />
      </div>
      <p className="text-sm leading-6 text-[var(--foreground)]/70">{overview.summaryPreview.text}</p>
      {currentAnalysis.sourceMetadata?.truncated && (
        <p role="note" className="text-xs leading-5 text-[var(--foreground)]/50">
          The brief was truncated for analysis; omitted text may contain additional details.
        </p>
      )}
      {overview.summaryPreview.truncated && (
        <ViewAIIntelligenceLink projectId={projectId}>View full analysis</ViewAIIntelligenceLink>
      )}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <OverviewMetric label="Requirements" value={overview.requirementCount} />
        <OverviewMetric label="Deliverables" value={overview.deliverableCount} />
        <OverviewMetric label="AI-identified risks" value={overview.riskCount} />
        <OverviewMetric label="Information needed" value={overview.missingInformationCount} />
        <OverviewMetric label="Pending suggestions" value={overview.pendingSuggestionCount} />
      </dl>
      {(overview.highRiskCount > 0 || overview.missingInformationCount > 0 || overview.pendingSuggestionCount > 0) && (
        <div className="space-y-2 border-t border-[var(--line)] pt-3">
          {overview.highRiskCount > 0 && (
            <p className="text-xs text-[#fbbf24]">
              <span className="font-medium">{riskLabel}</span> <span className="text-[var(--foreground)]/45">· AI-identified; review before acting.</span>
            </p>
          )}
          {overview.missingInformationCount > 0 && (
            <p className="text-xs text-[var(--foreground)]/65">
              <span className="font-medium">Information needed</span> · {infoLabel}.
            </p>
          )}
          {overview.pendingSuggestionCount > 0 && (
            <p className="text-xs text-[var(--foreground)]/65">
              <span className="font-medium">Suggested Tasks</span> · {suggestionLabel}.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ViewAIIntelligenceLink projectId={projectId}>
          {overview.highRiskCount > 0 ? "Review AI Intelligence" : "View AI Intelligence"}
        </ViewAIIntelligenceLink>
        {overview.missingInformationCount > 0 && <ViewAIIntelligenceLink projectId={projectId} anchor="#ai-missing-information">Review questions</ViewAIIntelligenceLink>}
        {overview.pendingSuggestionCount > 0 && <ViewAIIntelligenceLink projectId={projectId} anchor="#ai-suggested-tasks">Review Suggestions</ViewAIIntelligenceLink>}
      </div>
    </div>
  );
}

function OverviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2">
      <dt className="truncate text-[10px] leading-4 text-[var(--foreground)]/45">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--foreground)]/85">{value.toLocaleString()}</dd>
    </div>
  );
}

export function ProjectAIOverviewSummary({
  projectId,
  initialState,
}: {
  projectId: string;
  initialState: ProjectAIAnalysisState | null;
}) {
  const unavailable = !initialState;

  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5" aria-labelledby="project-ai-intelligence">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[#a49bff]/20 bg-[#a49bff]/[0.06] text-[var(--accent-muted)]">
          <Sparkles size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="project-ai-intelligence" className="text-[15px] font-semibold text-[var(--foreground)]">AI Project Intelligence</h2>
          <p className="mt-1 text-xs text-[var(--foreground)]/45">Insights generated from your project brief.</p>
          {unavailable ? (
            <div className="mt-4 space-y-2">
              <p role="status" className="text-sm text-[var(--foreground)]/60">AI project intelligence is temporarily unavailable.</p>
              <ViewAIIntelligenceLink projectId={projectId}>Open AI Intelligence</ViewAIIntelligenceLink>
            </div>
          ) : (
            <AnalyzeProjectForm
              key={[
                initialState.status,
                initialState.analysis?.id ?? "",
                initialState.primaryBrief?.id ?? "",
                initialState.primaryBrief?.updatedAt ?? "",
                ...(initialState.analysis?.approvedSuggestions
                  .map(({ suggestionId, taskId }) => `${suggestionId}:${taskId ?? ""}`)
                  .sort() ?? []),
              ].join(":")}
              projectId={projectId}
              initialState={initialState}
              label={initialState.status === "STALE" || initialState.status === "SOURCE_MISSING" ? "Analyze Updated Brief" : "Analyze Project"}
            />
          )}
        </div>
      </div>
    </section>
  );
}
