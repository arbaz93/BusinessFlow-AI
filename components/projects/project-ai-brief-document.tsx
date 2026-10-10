"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, LoaderCircle, Sparkles, AlertTriangle } from "lucide-react";
import { formatProjectAIAnalysisDate } from "@/lib/project-ai/history-format";
import { ProjectAIAnalysisFeedbackControl } from "@/components/projects/project-ai-feedback-control";
import {
  identifyProjectAIAnalysisFeedbackTargets,
} from "@/lib/project-ai/feedback-identities";
import {
  ANALYSIS_FEEDBACK_TARGET_ID,
  type AIAnalysisFeedbackTargetType,
} from "@/lib/project-ai/feedback-types";
import type { ProjectAIAnalysisFeedbackView } from "@/lib/project-ai/feedback";
import type { IdentifiedProjectIntelligence } from "@/lib/project-ai/suggestion-identity";
import type { ApproveSuggestedTasksResult } from "@/lib/project-ai/approval-schemas";
import type { ProjectAIAnalysisState, ProjectAIAnalysisSummary } from "@/lib/project-ai/persistence";
import { taskPriorityValues, type TaskPriority } from "@/lib/tasks/options";
import { taskPrioritySchema } from "@/lib/tasks/schemas";
import { approveProjectSuggestedTasksAction } from "@/app/actions/project-ai-approvals";
import { getProjectDocumentAccessUrl } from "@/app/actions/project-documents";
import { useActionState, useState } from "react";

const importanceTone: Record<string, string> = {
  LOW: "text-[var(--muted-ink)]",
  MEDIUM: "text-[var(--warning)]",
  HIGH: "text-[var(--danger)]",
};

const severityTone: Record<string, string> = {
  LOW: "text-[var(--muted-ink)]",
  MEDIUM: "text-[var(--warning)]",
  HIGH: "text-[var(--danger)]",
};

const priorityTone: Record<string, string> = {
  LOW: "text-[var(--muted-ink)]",
  MEDIUM: "text-[var(--warning)]",
  HIGH: "text-[var(--danger)]",
  URGENT: "text-[var(--danger)]",
};

const priorityBg: Record<string, string> = {
  LOW: "bg-[var(--surface)]/50",
  MEDIUM: "bg-[var(--warning-surface)]/20",
  HIGH: "bg-[var(--danger-surface)]/20",
  URGENT: "bg-[var(--danger-surface)]/30",
};

function DocumentBadge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "neutral" | "success" | "warning" | "info" | "danger" }) {
  const variantClasses = {
    neutral: "border-[var(--line)] bg-[var(--elevated)] text-ink/65",
    success: "border-[var(--success-border)]/30 bg-[var(--success-surface)]/20 text-[var(--success)]",
    warning: "border-[var(--warning-border)]/30 bg-[var(--warning-surface)]/20 text-[var(--warning)]",
    info: "border-[var(--info-border)]/30 bg-[var(--info-surface)]/20 text-[var(--info)]",
    danger: "border-[var(--danger-border)]/30 bg-[var(--danger-surface)]/20 text-[var(--danger)]",
  };
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-0.5 text-[10px] font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

function SeverityLabel({ severity }: { severity: "LOW" | "MEDIUM" | "HIGH" }) {
  const label = severity.charAt(0) + severity.slice(1).toLowerCase();
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${severityTone[severity]}`}>
      {label}
    </span>
  );
}

function ImportanceLabel({ importance }: { importance: "LOW" | "MEDIUM" | "HIGH" }) {
  const label = importance.charAt(0) + importance.slice(1).toLowerCase();
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${importanceTone[importance]}`}>
      {label} importance
    </span>
  );
}

function PriorityLabel({ priority }: { priority: TaskPriority }) {
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${priorityTone[priority]} ${priorityBg[priority]}`}>
      {label}
    </span>
  );
}

function DocumentSectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-10 mb-5 border-b border-[var(--line-strong)]/40 pb-2 text-ink">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]/60 block mb-1">Section</span>
      <span className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
        {children}
      </span>
    </h2>
  );
}

function EmptySectionNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-sm italic text-ink/45">
      {children}
    </p>
  );
}

function AnalysisFeedbackWrapper({
  projectId,
  analysisId,
  targetType,
  targetId,
  targetLabel,
  historical,
  feedback,
}: {
  projectId: string;
  analysisId: string;
  targetType: AIAnalysisFeedbackTargetType;
  targetId: string;
  targetLabel: string;
  historical?: boolean;
  feedback: ProjectAIAnalysisFeedbackView[];
}) {
  return (
    <ProjectAIAnalysisFeedbackControl
      projectId={projectId}
      analysisId={analysisId}
      targetType={targetType}
      targetId={targetId}
      targetLabel={targetLabel}
      historical={historical}
      feedback={feedback}
    />
  );
}

function SuggestedTasksReview({
  projectId,
  analysisId,
  suggestions,
  approvedSuggestions,
  canApprove,
  feedback,
}: {
  projectId: string;
  analysisId: string;
  suggestions: IdentifiedProjectIntelligence["suggestedTasks"];
  approvedSuggestions: Array<{ suggestionId: string; taskId: string | null }>;
  canApprove: boolean;
  feedback: ProjectAIAnalysisFeedbackView[];
}) {
  const [result, formAction, isPending] = useActionState<ApproveSuggestedTasksResult | null, FormData>(
    approveProjectSuggestedTasksAction,
    null,
  );
  const [drafts, setDrafts] = useState<SuggestionDraft[]>(() => suggestions.map((item) => ({
    suggestionId: item.suggestionId,
    title: item.title,
    description: item.description,
    priority: item.priority,
  })));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const approvedById = new Map(approvedSuggestions.map((item) => [item.suggestionId, item.taskId]));
  if (result?.success) {
    for (const item of result.createdTasks) approvedById.set(item.suggestionId, item.taskId);
  }
  const eligibleSuggestions = suggestions.filter((item) => !approvedById.has(item.suggestionId));
  const eligibleIds = new Set(eligibleSuggestions.map((item) => item.suggestionId));
  const selectedTasks = drafts.filter((item) => selectedIds.includes(item.suggestionId) && eligibleIds.has(item.suggestionId));
  const updateDraft = (suggestionId: string, key: "title" | "description", value: string) => {
    setDrafts((current) => current.map((item) => item.suggestionId === suggestionId ? { ...item, [key]: value } : item));
  };
  const updatePriority = (suggestionId: string, priority: TaskPriority) => {
    setDrafts((current) => current.map((item) => item.suggestionId === suggestionId ? { ...item, priority } : item));
  };
  const toggleSelected = (suggestionId: string) => {
    setSelectedIds((current) => current.includes(suggestionId)
      ? current.filter((id) => id !== suggestionId)
      : [...current, suggestionId]);
  };
  const selectAll = () => {
    setSelectedIds((current) => current.length === eligibleSuggestions.length
      ? []
      : eligibleSuggestions.map((item) => item.suggestionId));
  };

  return (
    <section className="mt-12" aria-labelledby="ai-suggested-tasks">
      <div className="mb-6 border-b border-[var(--line-strong)]/40 pb-3">
        <h2 id="ai-suggested-tasks" className="text-xl font-semibold text-ink sm:text-2xl">Suggested Tasks</h2>
      </div>
      <div className="mb-4 rounded-md border border-[var(--accent-muted)]/15 bg-[var(--accent-muted)]/[0.04] px-4 py-2.5 text-sm text-ink/70">
        These are AI-generated suggestions only. No Task is created until you review and approve.
      </div>
      {suggestions.length ? (
        <div className="space-y-4">
          {canApprove && eligibleSuggestions.length > 0 && (
            <label className="flex min-h-8 items-center gap-2 text-xs text-ink/60 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === eligibleSuggestions.length && eligibleSuggestions.length > 0}
                onChange={selectAll}
                className="size-4 accent-[var(--accent-muted)]"
                aria-label="Select all suggestions"
              />
              Select all suggestions
            </label>
          )}
          <ul className="space-y-3">
            {suggestions.map((item) => {
              const taskId = approvedById.get(item.suggestionId);
              const approved = approvedById.has(item.suggestionId);
              const draft = drafts.find((value) => value.suggestionId === item.suggestionId)!;
              return (
                <li key={item.suggestionId} className="rounded-lg border border-[var(--line)] bg-[var(--surface)]/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <label className="block">
                        <span className="sr-only">Task title</span>
                        <input
                          value={draft.title}
                          disabled={!canApprove || approved}
                          onChange={(event) => updateDraft(item.suggestionId, "title", event.target.value)}
                          maxLength={160}
                          className="w-full border-none bg-transparent px-0 text-sm font-medium text-ink/80 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-muted)]"
                        />
                      </label>
                      <label className="mt-1 block">
                        <span className="sr-only">Task description</span>
                        <textarea
                          value={draft.description}
                          disabled={!canApprove || approved}
                          onChange={(event) => updateDraft(item.suggestionId, "description", event.target.value)}
                          maxLength={2000}
                          rows={3}
                          className="w-full resize-y border-none bg-transparent px-0 text-sm leading-6 text-ink/60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-muted)]"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <PriorityLabel priority={draft.priority} />
                      {canApprove && !approved && (
                        <div className="mt-0 sm:mt-1">
                          <select
                            value={draft.priority}
                            onChange={(event) => {
                              const priority = taskPrioritySchema.safeParse(event.target.value);
                              if (priority.success) updatePriority(item.suggestionId, priority.data);
                            }}
                            disabled
                            className="rounded border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs text-ink/80"
                          >
                            {taskPriorityValues.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  {canApprove && !approved && (
                    <label className="mt-3 flex items-center gap-2 text-xs text-ink/50 cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.title}`}
                        checked={selectedIds.includes(item.suggestionId)}
                        onChange={() => toggleSelected(item.suggestionId)}
                        className="size-4 accent-[var(--accent-muted)]"
                      />
                      Include in review
                    </label>
                  )}
                  <div className="mt-3">
                    <AnalysisFeedbackWrapper
                      projectId={projectId}
                      analysisId={analysisId}
                      targetType="SUGGESTED_TASK"
                      targetId={item.suggestionId}
                      targetLabel={item.title}
                      historical={false}
                      feedback={feedback.filter((entry) => entry.targetType === "SUGGESTED_TASK" && entry.targetId === item.suggestionId)}
                    />
                  </div>
                  {approved && (
                    taskId
                      ? <Link href={`/tasks/${taskId}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-muted)] hover:underline">Approved · View task <ArrowUpRight size={12} aria-hidden="true" /></Link>
                      : <p className="mt-2 text-xs text-ink/50">Previously approved</p>
                  )}
                  {!approved && (
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-ink/35">AI suggestion · Not yet a Task</p>
                  )}
                </li>
              );
            })}
          </ul>
          {canApprove && eligibleSuggestions.length > 0 && (
            <form action={formAction} className="mt-5 space-y-3">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="analysisId" value={analysisId} />
              <input type="hidden" name="tasks" value={JSON.stringify(selectedTasks)} />
              {result && !result.success && <p role="alert" className="text-sm text-[var(--danger)]">{result.error}</p>}
              {confirming ? (
                <div className="rounded-md border border-[var(--accent-muted)]/20 bg-[var(--accent-muted)]/[0.05] p-4" aria-live="polite">
                  <p className="text-sm font-medium text-ink/90">Create {selectedTasks.length} reviewed task{selectedTasks.length === 1 ? "" : "s"}?</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-ink/65">
                    {selectedTasks.map((task) => <li key={task.suggestionId} className="break-words">{task.title}</li>)}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="submit" disabled={isPending} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[var(--accent-muted)] px-4 text-xs font-medium text-[var(--background)] disabled:opacity-60">
                      {isPending && <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />}
                      Confirm and create tasks
                    </button>
                    <button type="button" disabled={isPending} onClick={() => setConfirming(false)} className="min-h-9 rounded-md border border-[var(--line)] px-4 text-xs text-ink/70">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={selectedTasks.length === 0 || !canApprove || isPending}
                    onClick={() => canApprove && setConfirming(true)}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[var(--accent-muted)] px-4 text-xs font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Review {selectedTasks.length || ""} selected task{selectedTasks.length === 1 ? "" : "s"}
                  </button>
                  {!canApprove && <p className="text-xs text-[var(--warning)]">Only a completed analysis of the current primary brief can be approved.</p>}
                </div>
              )}
              {result?.success && <p role="status" className="text-sm text-[var(--success)]">Approved tasks were created successfully.</p>}
            </form>
          )}
        </div>
      ) : (
        <EmptySectionNote>No suggested work items were identified in this analysis.</EmptySectionNote>
      )}
    </section>
  );
}

function HistoricalSuggestedTasks({
  suggestions,
  projectId,
  analysisId,
  feedback,
}: {
  suggestions: IdentifiedProjectIntelligence["suggestedTasks"];
  projectId: string;
  analysisId: string;
  feedback: ProjectAIAnalysisFeedbackView[];
}) {
  return (
    <section className="mt-12" aria-labelledby="historical-ai-suggested-tasks">
      <div className="mb-4 rounded-md border border-[var(--line)] bg-[var(--surface)]/30 px-4 py-2.5 text-sm text-ink/60">
        These suggestions are preserved for reference and are not eligible for approval.
      </div>
      {suggestions.length ? (
        <ul className="space-y-3">
          {suggestions.map((item) => (
            <li key={item.suggestionId} className="rounded-lg border border-[var(--line)] bg-[var(--surface)]/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 break-words text-sm font-medium text-ink/85">{item.title}</h3>
                <PriorityLabel priority={item.priority} />
              </div>
              <p className="mt-2 break-words text-sm leading-6 text-ink/60">{item.description}</p>
              <p className="mt-3 text-[11px] font-medium text-ink/35">From this analysis · Historical suggestion</p>
              <div className="mt-2">
                <AnalysisFeedbackWrapper
                  projectId={projectId}
                  analysisId={analysisId}
                  targetType="SUGGESTED_TASK"
                  targetId={item.suggestionId}
                  targetLabel={item.title}
                  historical
                  feedback={feedback.filter((entry) => entry.targetType === "SUGGESTED_TASK" && entry.targetId === item.suggestionId)}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptySectionNote>No suggested work items were identified.</EmptySectionNote>
      )}
    </section>
  );
}

type SuggestionDraft = {
  suggestionId: string;
  title: string;
  description: string;
  priority: TaskPriority;
};

interface AIProjectBriefDocumentProps {
  projectId: string;
  state: ProjectAIAnalysisState;
  analysis: ProjectAIAnalysisSummary;
  feedback: ProjectAIAnalysisFeedbackView[];
}

export function AIProjectBriefDocument({ projectId, state, analysis, feedback }: AIProjectBriefDocumentProps) {
  const isStale = state.status === "STALE" || state.status === "SOURCE_MISSING" || Boolean(analysis && !state.analysisIsCurrent);
  const isProcessing = state.status === "PROCESSING";
  const isFailed = state.status === "FAILED";
  const intelligence = analysis.intelligence;

  const feedbackTargets = identifyProjectAIAnalysisFeedbackTargets(
    analysis.id,
    intelligence,
    intelligence.suggestedTasks.map((task) => task.suggestionId),
  );
  const feedbackFor = (targetType: AIAnalysisFeedbackTargetType, targetId: string) =>
    feedback.filter((item) => item.targetType === targetType && item.targetId === targetId);

  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [documentAccessError, setDocumentAccessError] = useState<string | null>(null);

  async function openProjectBrief(documentId: string) {
    setOpeningDocumentId(documentId);
    setDocumentAccessError(null);
    try {
      const result = await getProjectDocumentAccessUrl(documentId, projectId, "view");
      if (!result.url) {
        setDocumentAccessError(result.error ?? "This document could not be opened.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      setDocumentAccessError("This document could not be opened.");
    } finally {
      setOpeningDocumentId(null);
    }
  }

  const statusColor = isStale ? "warning" : isFailed ? "danger" : "success";
  const statusBadgeText = isStale ? "Stale" : isFailed ? "Last successful result" : "Current analysis";

  return (
    <section
      className="ai-project-brief-document mx-auto w-full max-w-4xl"
      aria-labelledby="ai-brief-document-heading"
    >
      <div>
        <div className="mx-auto max-w-3xl px-6 py-5">
          <div className="mb-2 flex items-center gap-2 text-[var(--accent-muted)]">
            <Sparkles size={16} aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">AI Project Intelligence</span>
          </div>

          <h1 id="ai-brief-document-heading" className="text-3xl font-thin tracking-[-0.03em] sm:text-4xl">
            AI-Generated Project Brief
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/55">
            A structured analysis of the project brief, requirements, deliverables, risks, and outstanding questions.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink/50">
            <span className="flex items-center gap-1">
              Source: {analysis.sourceDocumentName ?? "Unknown"}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              Analyzed: {formatProjectAIAnalysisDate(analysis.completedAt ?? analysis.createdAt)}
            </span>
          </div>

          {isStale && (
            <div className="mt-4 rounded-md border border-[var(--warning-border)]/30 bg-[var(--warning-surface)]/15 px-4 py-3 text-sm">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
                <div>
                  <p className="font-medium text-[var(--warning)]">This analysis is out of date</p>
                  <p className="mt-1 leading-6 text-ink/65">
                    {state.analysisStaleReason === "PRIMARY_BRIEF_CHANGED"
                      ? "The current primary Project Brief is different from the one used for this analysis."
                      : state.analysisStaleReason === "SOURCE_UPDATED"
                        ? "The primary Project Brief was updated after this analysis was created."
                        : state.analysisStaleReason === "NO_PRIMARY_BRIEF"
                          ? "The Project Brief used for this analysis is no longer selected as primary."
                          : state.analysisStaleReason === "SOURCE_MISSING"
                            ? "The Project Brief used for this analysis is no longer available."
                            : "This analysis does not match the current primary Project Brief."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isProcessing && analysis && (
            <div className="mt-4 rounded-md border border-[var(--info-border)]/30 bg-[var(--info-surface)]/15 px-4 py-3 text-sm text-[var(--info)]">
              A new analysis is running. This is the previous saved result.
            </div>
          )}

          {isFailed && state.errorMessage && (
            <div className="mt-4 rounded-md border border-[var(--warning-border)]/30 bg-[var(--warning-surface)]/15 px-4 py-3 text-sm text-[var(--warning)]">
              {state.errorMessage} {analysis ? "Showing the last successful analysis." : ""}
            </div>
          )}

          {analysis.sourceMetadata?.truncated && (
            <div className="mt-4 rounded-md border border-[var(--warning-border)]/20 bg-[var(--warning-surface)]/[0.08] px-4 py-3 text-xs leading-5 text-ink/60">
              This analysis used {analysis.sourceMetadata.finalCharacterCount.toLocaleString()} of {analysis.sourceMetadata.originalCharacterCount.toLocaleString()} extracted characters from the source brief. Omitted text may contain additional details.
            </div>
          )}

          <div className="mt-4 inline-flex items-center gap-1.5">
            <DocumentBadge variant={statusColor}>{statusBadgeText}</DocumentBadge>
          </div>

          <div className="mt-1 text-xs leading-5 text-ink/40">
            Generated from analysis of: {analysis.sourceDocumentName ?? "Unknown source"}
            {" · "}Analysis source updated: {formatProjectAIAnalysisDate(analysis.sourceDocumentUpdatedAt)}
          </div>

          {analysis.sourceDocumentId && !state.analysisSourceMissing && (
            <button
              type="button"
              onClick={() => void openProjectBrief(analysis.sourceDocumentId!)}
              disabled={openingDocumentId !== null}
              className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-[var(--accent-muted)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)] disabled:opacity-50"
            >
              {openingDocumentId === analysis.sourceDocumentId
                ? <LoaderCircle size={12} className="animate-spin" aria-hidden="true" />
                : <FileText size={12} aria-hidden="true" />}
              Open analyzed Project Brief <ArrowUpRight size={12} aria-hidden="true" />
            </button>
          )}
          {documentAccessError && <p role="status" className="mt-2 text-xs text-[var(--danger)]">{documentAccessError}</p>}

          <div className="mt-1">
            <ProjectAIAnalysisFeedbackControl
              projectId={projectId}
              analysisId={analysis.id}
              targetType="ANALYSIS"
              targetId={ANALYSIS_FEEDBACK_TARGET_ID}
              targetLabel="this full analysis"
              feedback={feedback.filter((item) => item.targetType === "ANALYSIS" && item.targetId === ANALYSIS_FEEDBACK_TARGET_ID)}
            />
          </div>

          <p className="mt-1 text-xs leading-5 text-ink/45">
            Generated from the analysis source shown above. Review insights before using them for project decisions; suggested Tasks require your approval.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]/60">Executive Summary</span>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/75">
            {intelligence.summary}
          </p>
          <div className="mt-4">
            <AnalysisFeedbackWrapper
              projectId={projectId}
              analysisId={analysis.id}
              targetType="SUMMARY"
              targetId={feedbackTargets.summaryId}
              targetLabel="Project Summary"
              feedback={feedbackFor("SUMMARY", feedbackTargets.summaryId)}
            />
          </div>
        </div>

        <div className="mb-8">
          <DocumentSectionHeading id="ai-requirements">Project Requirements</DocumentSectionHeading>
          {intelligence.requirements.length ? (
            <ul className="space-y-6">
              {intelligence.requirements.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-medium text-ink/90">
                      <span className="text-[var(--accent-muted)]/60 mr-2" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.title}
                    </h3>
                    <ImportanceLabel importance={item.importance} />
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
                    {item.description}
                  </p>
                  <div className="mt-3">
                    <AnalysisFeedbackWrapper
                      projectId={projectId}
                      analysisId={analysis.id}
                      targetType="REQUIREMENT"
                      targetId={feedbackTargets.requirements[index]}
                      targetLabel={item.title}
                      feedback={feedbackFor("REQUIREMENT", feedbackTargets.requirements[index])}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptySectionNote>No specific requirements were identified in the brief.</EmptySectionNote>
          )}
        </div>

        <div className="mb-8">
          <DocumentSectionHeading id="ai-deliverables">Expected Deliverables</DocumentSectionHeading>
          {intelligence.deliverables.length ? (
            <ul className="space-y-4">
              {intelligence.deliverables.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex gap-3">
                  <span className="mt-0.5 text-[var(--accent-muted)]/60" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-ink/85">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/60">{item.description}</p>
                  </div>
                  <div className="self-start">
                    <AnalysisFeedbackWrapper
                      projectId={projectId}
                      analysisId={analysis.id}
                      targetType="DELIVERABLE"
                      targetId={feedbackTargets.deliverables[index]}
                      targetLabel={item.title}
                      feedback={feedbackFor("DELIVERABLE", feedbackTargets.deliverables[index])}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptySectionNote>No explicit deliverables were identified.</EmptySectionNote>
          )}
        </div>

        <div className="mb-8">
          <DocumentSectionHeading id="ai-risks">Risks & Considerations</DocumentSectionHeading>
          {intelligence.risks.length ? (
            <ul className="space-y-4">
              {intelligence.risks.map((item, index) => (
                <li
                  key={`${item.title}-${index}`}
                  className="border-l-2 border-[var(--line-strong)]/30 pl-4 py-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium text-ink/85">{item.title}</h3>
                    <SeverityLabel severity={item.severity} />
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/65">
                    {item.description}
                  </p>
                  <div className="mt-2">
                    <AnalysisFeedbackWrapper
                      projectId={projectId}
                      analysisId={analysis.id}
                      targetType="RISK"
                      targetId={feedbackTargets.risks[index]}
                      targetLabel={item.title}
                      feedback={feedbackFor("RISK", feedbackTargets.risks[index])}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptySectionNote>No significant risks were identified in the brief.</EmptySectionNote>
          )}
        </div>

        <div className="mb-8">
          <DocumentSectionHeading id="ai-missing-information">Open Questions</DocumentSectionHeading>
          <p className="mt-1 text-sm text-ink/55">AI-identified gaps that may need clarification before work can proceed.</p>
          {intelligence.missingInformation.length ? (
            <ol className="mt-4 space-y-5">
              {intelligence.missingInformation.map((item, index) => (
                <li key={`${item.question}-${index}`}>
                  <div className="flex gap-3">
                    <span className="text-sm font-semibold text-[var(--accent-muted)]/60" aria-hidden="true">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-ink/85">{item.question}</h3>
                      <p className="mt-1 text-sm leading-6 text-ink/60">{item.reason}</p>
                      <div className="mt-2">
                        <AnalysisFeedbackWrapper
                          projectId={projectId}
                          analysisId={analysis.id}
                          targetType="MISSING_INFORMATION"
                          targetId={feedbackTargets.missingInformation[index]}
                          targetLabel={item.question}
                          feedback={feedbackFor("MISSING_INFORMATION", feedbackTargets.missingInformation[index])}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm italic text-ink/45">
              No outstanding questions were identified in this analysis.
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-10">
        {state.status === "PROCESSING" ? (
          <HistoricalSuggestedTasks
            suggestions={intelligence.suggestedTasks}
            projectId={projectId}
            analysisId={analysis.id}
            feedback={feedback}
          />
        ) : state.status === "FAILED" || isStale ? (
          <HistoricalSuggestedTasks
            suggestions={intelligence.suggestedTasks}
            projectId={projectId}
            analysisId={analysis.id}
            feedback={feedback}
          />
        ) : (
          <SuggestedTasksReview
            projectId={projectId}
            analysisId={analysis.id}
            suggestions={intelligence.suggestedTasks}
            approvedSuggestions={analysis.approvedSuggestions}
            canApprove={state.status === "COMPLETED" && state.analysisIsCurrent && !isProcessing}
            feedback={feedback}
          />
        )}
      </div>
    </section>
  );
}
