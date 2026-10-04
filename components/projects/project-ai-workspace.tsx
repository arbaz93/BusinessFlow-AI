"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FileText, LoaderCircle, Sparkles } from "lucide-react";
import { analyzeProjectBriefAction } from "@/app/actions/project-ai";
import { approveProjectSuggestedTasksAction } from "@/app/actions/project-ai-approvals";
import { getProjectDocumentAccessUrl } from "@/app/actions/project-documents";
import { ProjectAIAnalysisFeedbackControl } from "@/components/projects/project-ai-feedback-control";
import { formatProjectAIAnalysisDate } from "@/lib/project-ai/history-format";
import {
  identifyProjectAIAnalysisFeedbackTargets,
} from "@/lib/project-ai/feedback-identities";
import {
  ANALYSIS_FEEDBACK_TARGET_ID,
  type AIAnalysisFeedbackTargetType,
} from "@/lib/project-ai/feedback-types";
import type { ProjectAIAnalysisFeedbackView } from "@/lib/project-ai/feedback";
import type { ApproveSuggestedTasksResult } from "@/lib/project-ai/approval-schemas";
import type { ProjectAIAnalysisState } from "@/lib/project-ai/persistence";
import type { IdentifiedProjectIntelligence } from "@/lib/project-ai/suggestion-identity";
import { taskPriorityValues, type TaskPriority } from "@/lib/tasks/options";
import { taskPrioritySchema } from "@/lib/tasks/schemas";

const badgeTones = {
  LOW: "border-white/10 bg-white/[0.04] text-white/65",
  MEDIUM: "border-[#93c5fd]/20 bg-[#93c5fd]/[0.08] text-[#bfdbfe]",
  HIGH: "border-[#f59e0b]/25 bg-[#f59e0b]/[0.08] text-[#fbbf24]",
  URGENT: "border-[#ef4444]/25 bg-[#ef4444]/[0.08] text-[#fca5a5]",
} as const;

function getFileTypeLabel(mimeType: string | null, originalName: string) {
  if (mimeType?.startsWith("application/pdf")) return "PDF";
  if (mimeType?.includes("wordprocessingml")) return "DOCX";
  if (mimeType?.startsWith("text/")) return "Text";
  const extension = originalName.split(".").pop()?.toUpperCase();
  return extension && extension !== originalName.toUpperCase() ? extension : "Document";
}

function Badge({ children, tone = badgeTones.LOW }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}>{children}</span>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-white/10 bg-[#111113] px-3 py-4 text-sm text-white/50">{children}</p>;
}

type SuggestionDraft = {
  suggestionId: string;
  title: string;
  description: string;
  priority: TaskPriority;
};

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
    <section aria-labelledby="ai-suggested-tasks">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="ai-suggested-tasks" className="text-base font-semibold text-[#f4f4f5]">Suggested Tasks</h3>
          <p className="mt-1 text-sm text-white/50">Review and edit suggestions. Nothing is added until you confirm.</p>
        </div>
        <Badge>{canApprove ? "AI suggestions · Review required" : "AI suggestions · Approval unavailable"}</Badge>
      </div>
      {suggestions.length ? (
        <div className="mt-3 space-y-3">
          {canApprove && eligibleSuggestions.length > 0 && (
            <label className="inline-flex min-h-8 items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={selectedIds.length === eligibleSuggestions.length && eligibleSuggestions.length > 0}
                onChange={selectAll}
                className="size-4 accent-[#a49bff]"
              />
              Select all suggestions
            </label>
          )}
          <ul className="grid gap-3 md:grid-cols-2">
            {suggestions.map((item) => {
              const taskId = approvedById.get(item.suggestionId);
              const approved = approvedById.has(item.suggestionId);
              const draft = drafts.find((value) => value.suggestionId === item.suggestionId)!;
              return (
                <li key={item.suggestionId} className="min-w-0 rounded-lg border border-white/10 bg-[#111113] p-4">
                  <div className="flex items-start gap-3">
                    {canApprove && !approved && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.title}`}
                        checked={selectedIds.includes(item.suggestionId)}
                        onChange={() => toggleSelected(item.suggestionId)}
                        className="mt-1 size-4 shrink-0 accent-[#a49bff]"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <label className="min-w-0 flex-1">
                          <span className="sr-only">Task title</span>
                          <input
                            value={draft.title}
                            disabled={!canApprove || approved}
                            onChange={(event) => updateDraft(item.suggestionId, "title", event.target.value)}
                            maxLength={160}
                            className="w-full rounded border border-white/10 bg-[#18181b] px-2 py-1.5 text-sm font-medium text-white/90 disabled:border-transparent disabled:bg-transparent disabled:px-0"
                          />
                        </label>
                        <Badge tone={badgeTones[draft.priority]}>{draft.priority} priority</Badge>
                      </div>
                      <label className="block">
                        <span className="sr-only">Task description</span>
                        <textarea
                          value={draft.description}
                          disabled={!canApprove || approved}
                          onChange={(event) => updateDraft(item.suggestionId, "description", event.target.value)}
                          maxLength={2000}
                          rows={3}
                          className="w-full resize-y rounded border border-white/10 bg-[#18181b] px-2 py-1.5 text-sm leading-6 text-white/60 disabled:border-transparent disabled:bg-transparent disabled:px-0"
                        />
                      </label>
                      <ProjectAIAnalysisFeedbackControl
                        projectId={projectId}
                        analysisId={analysisId}
                        targetType="SUGGESTED_TASK"
                        targetId={item.suggestionId}
                        targetLabel={item.title}
                        feedback={feedback.filter((entry) => entry.targetType === "SUGGESTED_TASK" && entry.targetId === item.suggestionId)}
                      />
                      {canApprove && !approved && (
                        <label className="flex items-center gap-2 text-xs text-white/60">
                          Priority
                          <select
                            value={draft.priority}
                            onChange={(event) => {
                              const priority = taskPrioritySchema.safeParse(event.target.value);
                              if (priority.success) updatePriority(item.suggestionId, priority.data);
                            }}
                            className="rounded border border-white/10 bg-[#18181b] px-2 py-1.5 text-xs text-white/80"
                          >
                            {taskPriorityValues.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                          </select>
                        </label>
                      )}
                      {approved ? (
                        taskId
                          ? <Link href={`/tasks/${taskId}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#c4b5fd] hover:underline">Approved · View task <ArrowUpRight size={12} aria-hidden="true" /></Link>
                          : <p className="text-xs text-white/50">Previously approved</p>
                      ) : (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c4b5fd]">AI suggestion · Not yet a Task</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {canApprove && eligibleSuggestions.length > 0 && (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="analysisId" value={analysisId} />
              <input type="hidden" name="tasks" value={JSON.stringify(selectedTasks)} />
              {result && !result.success && <p role="alert" className="text-sm text-[#fca5a5]">{result.error}</p>}
              {confirming ? (
                <div className="rounded-md border border-[#a49bff]/20 bg-[#a49bff]/[0.05] p-4" aria-live="polite">
                  <p className="text-sm font-medium text-white/90">Create {selectedTasks.length} reviewed task{selectedTasks.length === 1 ? "" : "s"}?</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-white/65">
                    {selectedTasks.map((task) => <li key={task.suggestionId} className="break-words">{task.title}</li>)}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="submit" disabled={isPending} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#a49bff] px-3 text-xs font-medium text-[#101018] disabled:opacity-60">
                      {isPending && <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />}
                      Confirm and create tasks
                    </button>
                    <button type="button" disabled={isPending} onClick={() => setConfirming(false)} className="min-h-9 rounded-md border border-white/10 px-3 text-xs text-white/70">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={selectedTasks.length === 0 || isPending}
                  onClick={() => setConfirming(true)}
                  className="inline-flex min-h-9 items-center justify-center rounded-md bg-[#a49bff] px-3 text-xs font-medium text-[#101018] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Review {selectedTasks.length || ""} selected task{selectedTasks.length === 1 ? "" : "s"}
                </button>
              )}
              {result?.success && <p role="status" className="text-sm text-emerald-300">Approved tasks were created successfully.</p>}
            </form>
          )}
          {!canApprove && <p className="text-xs text-[#fbbf24]">Only a completed analysis of the current primary brief can be approved.</p>}
        </div>
      ) : <div className="mt-3"><EmptyState>No suggested work items were identified.</EmptyState></div>}
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
    <section aria-labelledby="historical-ai-suggested-tasks">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="historical-ai-suggested-tasks" className="text-base font-semibold text-[#f4f4f5]">Suggested Tasks</h3>
          <p className="mt-1 text-sm text-white/50">These suggestions are preserved for reference and are not eligible for approval.</p>
        </div>
        <Badge>Historical suggestions · Reference only</Badge>
      </div>
      {suggestions.length ? (
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {suggestions.map((item) => (
            <li key={item.suggestionId} className="min-w-0 rounded-lg border border-white/10 bg-[#111113] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="min-w-0 break-words text-sm font-medium text-white/90">{item.title}</h4>
                <Badge tone={badgeTones[item.priority]}>{item.priority} priority</Badge>
              </div>
              <p className="mt-2 break-words text-sm leading-6 text-white/60">{item.description}</p>
              <p className="mt-3 text-[11px] font-medium text-white/45">From this analysis · Historical suggestion</p>
              <ProjectAIAnalysisFeedbackControl
                projectId={projectId}
                analysisId={analysisId}
                targetType="SUGGESTED_TASK"
                targetId={item.suggestionId}
                targetLabel={item.title}
                historical
                feedback={feedback.filter((entry) => entry.targetType === "SUGGESTED_TASK" && entry.targetId === item.suggestionId)}
              />
            </li>
          ))}
        </ul>
      ) : <div className="mt-3"><EmptyState>No suggested work items were identified.</EmptyState></div>}
    </section>
  );
}

export function AnalysisSections({
  intelligence,
  projectId,
  analysisId,
  approvedSuggestions,
  canApprove,
  mode = "current",
  feedback = [],
}: {
  intelligence: IdentifiedProjectIntelligence;
  projectId: string;
  analysisId: string;
  approvedSuggestions: Array<{ suggestionId: string; taskId: string | null }>;
  canApprove: boolean;
  mode?: "current" | "historical";
  feedback?: ProjectAIAnalysisFeedbackView[];
}) {
  const idPrefix = mode === "historical" ? "historical-" : "";
  const feedbackTargets = identifyProjectAIAnalysisFeedbackTargets(
    analysisId,
    intelligence,
    intelligence.suggestedTasks.map((task) => task.suggestionId),
  );
  const feedbackFor = (targetType: AIAnalysisFeedbackTargetType, targetId: string) =>
    feedback.filter((item) => item.targetType === targetType && item.targetId === targetId);

  return (
    <div className="space-y-7">
      <section aria-labelledby={`${idPrefix}ai-summary`}>
        <h3 id={`${idPrefix}ai-summary`} className="text-lg font-semibold text-[#f4f4f5]">Project Summary</h3>
        <p className="mt-3 max-w-4xl whitespace-pre-wrap break-words text-sm leading-7 text-white/75">{intelligence.summary}</p>
        <ProjectAIAnalysisFeedbackControl
          projectId={projectId}
          analysisId={analysisId}
          targetType="SUMMARY"
          targetId={feedbackTargets.summaryId}
          targetLabel="Project Summary"
          historical={mode === "historical"}
          feedback={feedbackFor("SUMMARY", feedbackTargets.summaryId)}
        />
      </section>

      <section aria-labelledby={`${idPrefix}ai-requirements`}>
        <h3 id={`${idPrefix}ai-requirements`} className="text-base font-semibold text-[#f4f4f5]">Requirements</h3>
        {intelligence.requirements.length ? (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {intelligence.requirements.map((item, index) => (
              <li key={`${item.title}-${index}`} className="min-w-0 rounded-lg border border-white/10 bg-[#111113] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="min-w-0 break-words text-sm font-medium text-white/90">{item.title}</h4>
                  <Badge tone={badgeTones[item.importance]}>{item.importance} importance</Badge>
                </div>
                <p className="mt-2 break-words text-sm leading-6 text-white/60">{item.description}</p>
                <ProjectAIAnalysisFeedbackControl
                  projectId={projectId}
                  analysisId={analysisId}
                  targetType="REQUIREMENT"
                  targetId={feedbackTargets.requirements[index]}
                  targetLabel={item.title}
                  historical={mode === "historical"}
                  feedback={feedbackFor("REQUIREMENT", feedbackTargets.requirements[index])}
                />
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState>No specific requirements were identified in the brief.</EmptyState></div>}
      </section>

      <section aria-labelledby={`${idPrefix}ai-deliverables`}>
        <h3 id={`${idPrefix}ai-deliverables`} className="text-base font-semibold text-[#f4f4f5]">Deliverables</h3>
        {intelligence.deliverables.length ? (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {intelligence.deliverables.map((item, index) => (
              <li key={`${item.title}-${index}`} className="min-w-0 rounded-lg border border-white/10 bg-[#111113] p-4">
                <h4 className="break-words text-sm font-medium text-white/90">{item.title}</h4>
                <p className="mt-2 break-words text-sm leading-6 text-white/60">{item.description}</p>
                <ProjectAIAnalysisFeedbackControl
                  projectId={projectId}
                  analysisId={analysisId}
                  targetType="DELIVERABLE"
                  targetId={feedbackTargets.deliverables[index]}
                  targetLabel={item.title}
                  historical={mode === "historical"}
                  feedback={feedbackFor("DELIVERABLE", feedbackTargets.deliverables[index])}
                />
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState>No explicit deliverables were identified.</EmptyState></div>}
      </section>

      <section aria-labelledby={`${idPrefix}ai-risks`}>
        <h3 id={`${idPrefix}ai-risks`} className="text-base font-semibold text-[#f4f4f5]">Risks</h3>
        {intelligence.risks.length ? (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {intelligence.risks.map((item, index) => (
              <li key={`${item.title}-${index}`} className="min-w-0 rounded-lg border border-[#f59e0b]/15 bg-[#f59e0b]/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="min-w-0 break-words text-sm font-medium text-white/90">{item.title}</h4>
                  <Badge tone={badgeTones[item.severity]}>{item.severity} severity</Badge>
                </div>
                <p className="mt-2 break-words text-sm leading-6 text-white/60">{item.description}</p>
                <ProjectAIAnalysisFeedbackControl
                  projectId={projectId}
                  analysisId={analysisId}
                  targetType="RISK"
                  targetId={feedbackTargets.risks[index]}
                  targetLabel={item.title}
                  historical={mode === "historical"}
                  feedback={feedbackFor("RISK", feedbackTargets.risks[index])}
                />
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState>No significant risks were identified in the brief.</EmptyState></div>}
      </section>

      <section aria-labelledby={`${idPrefix}ai-missing-information`}>
        <h3 id={`${idPrefix}ai-missing-information`} className="text-base font-semibold text-[#f4f4f5]">Missing Information</h3>
        <p className="mt-1 text-sm text-white/50">AI-identified gaps that may need clarification; these are not direct source citations.</p>
        {intelligence.missingInformation.length ? (
          <ul className="mt-3 space-y-3">
            {intelligence.missingInformation.map((item, index) => (
              <li key={`${item.question}-${index}`} className="min-w-0 rounded-lg border border-white/10 bg-[#111113] p-4">
                <h4 className="break-words text-sm font-medium text-white/90">{item.question}</h4>
                <p className="mt-2 break-words text-sm leading-6 text-white/60">{item.reason}</p>
                <ProjectAIAnalysisFeedbackControl
                  projectId={projectId}
                  analysisId={analysisId}
                  targetType="MISSING_INFORMATION"
                  targetId={feedbackTargets.missingInformation[index]}
                  targetLabel={item.question}
                  historical={mode === "historical"}
                  feedback={feedbackFor("MISSING_INFORMATION", feedbackTargets.missingInformation[index])}
                />
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState>No missing information was identified.</EmptyState></div>}
      </section>

      {mode === "historical" ? (
        <HistoricalSuggestedTasks
          suggestions={intelligence.suggestedTasks}
          projectId={projectId}
          analysisId={analysisId}
          feedback={feedback}
        />
      ) : (
        <SuggestedTasksReview
          key={analysisId}
          projectId={projectId}
          analysisId={analysisId}
          suggestions={intelligence.suggestedTasks}
          approvedSuggestions={approvedSuggestions}
          canApprove={canApprove}
          feedback={feedback}
        />
      )}
    </div>
  );
}

export function ProjectAiWorkspace({
  projectId,
  initialState,
  initialFeedback = [],
}: {
  projectId: string;
  initialState: ProjectAIAnalysisState;
  initialFeedback?: ProjectAIAnalysisFeedbackView[];
}) {
  const [state, formAction, isPending] = useActionState(analyzeProjectBriefAction, initialState);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [documentAccessError, setDocumentAccessError] = useState<string | null>(null);
  const { primaryBrief, analysis } = state;
  const isProcessing = isPending || state.status === "PROCESSING";
  const isStale = state.status === "STALE" || state.status === "SOURCE_MISSING" || Boolean(analysis && !state.analysisIsCurrent);
  const canStartAnalysis = Boolean(primaryBrief) && !isProcessing &&
    (state.status === "READY" || state.status === "FAILED" || isStale);
  const actionLabel = state.status === "FAILED"
    ? "Try Again"
    : isStale
      ? "Analyze Updated Brief"
      : "Analyze Project";
  const staleReason = state.analysisStaleReason === "PRIMARY_BRIEF_CHANGED"
    ? "The current primary Project Brief is different from the one used for this analysis."
    : state.analysisStaleReason === "SOURCE_UPDATED"
      ? "The primary Project Brief was updated after this analysis was created."
      : state.analysisStaleReason === "NO_PRIMARY_BRIEF"
        ? "The Project Brief used for this analysis is no longer selected as primary."
        : state.analysisStaleReason === "SOURCE_MISSING"
          ? "The Project Brief used for this analysis is no longer available."
          : "This analysis does not match the current primary Project Brief.";

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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">Project workspace</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#f4f4f5] sm:text-[28px]">AI Project Intelligence</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Turn your project brief into structured insights, requirements, risks, and actionable work.</p>
        </div>
        {canStartAnalysis && !isStale && (
          <form action={formAction} className="shrink-0">
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#a49bff] px-4 text-sm font-medium text-[#101018] transition-colors hover:bg-[#b3a8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isProcessing && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
              {actionLabel}
            </button>
          </form>
        )}
      </header>

      {!primaryBrief ? (
        <section className="rounded-lg border border-dashed border-white/10 bg-[#18181b] p-6 sm:p-8" aria-labelledby="no-primary-brief">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">
            {state.status === "SOURCE_MISSING" ? "Source unavailable" : "Source brief required"}
          </p>
          <h3 id="no-primary-brief" className="mt-2 text-xl font-semibold text-[#f4f4f5]">
            {state.status === "SOURCE_MISSING"
              ? "AI analysis source unavailable"
              : state.status === "FAILED"
                ? "AI analysis unavailable"
                : "No primary project brief"}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
            {state.status === "SOURCE_MISSING"
              ? "The brief used for this analysis is no longer available."
              : state.status === "FAILED"
                ? state.errorMessage ?? "AI project intelligence is temporarily unavailable."
                : "Add a primary project brief before analyzing this project."}
          </p>
          <Link
            href={`/projects/${projectId}/documents`}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-[#a49bff]/25 bg-[#a49bff]/10 px-4 text-sm font-medium text-[#c4b5fd] transition-colors hover:bg-[#a49bff]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
          >
            Go to Documents
          </Link>
        </section>
      ) : (
        <section className="rounded-lg border border-white/10 bg-[#18181b] p-4 sm:p-5" aria-labelledby="analysis-source">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-white/65">
                <FileText size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="analysis-source" className="text-sm font-semibold text-white/90">Current primary brief</h3>
                  <Badge tone="border-[#a49bff]/25 bg-[#a49bff]/10 text-[#c4b5fd]">Primary Brief</Badge>
                </div>
                <p className="mt-1 break-words text-sm text-white/75">{primaryBrief.originalName}</p>
                <p className="mt-1 text-xs text-white/45">
                  Project Brief · {getFileTypeLabel(primaryBrief.mimeType, primaryBrief.originalName)} · Updated {formatProjectAIAnalysisDate(primaryBrief.updatedAt)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void openProjectBrief(primaryBrief.id)}
              disabled={openingDocumentId !== null}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-white/70 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {openingDocumentId === primaryBrief.id
                ? <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
                : <FileText size={13} aria-hidden="true" />}
              View Project Brief <ArrowUpRight size={13} aria-hidden="true" />
            </button>
          </div>
          {documentAccessError && <p role="status" className="mt-3 text-xs text-[#fbbf24]">{documentAccessError}</p>}
          <p className="mt-3 text-xs leading-5 text-white/40">
            Source attribution is document-level. Text extraction does not preserve reliable page or section locations for this analysis.
          </p>
        </section>
      )}

      {primaryBrief && (state.status === "READY" || state.status === "FAILED") && !analysis && (
        <section className="rounded-lg border border-white/10 bg-[#18181b] px-4 py-5 sm:px-5" aria-labelledby="analysis-ready">
          <h3 id="analysis-ready" className="text-base font-semibold text-[#f4f4f5]">
            {state.status === "FAILED" ? "Analysis couldn't be completed" : "Ready to analyze"}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            {state.status === "FAILED"
              ? "We couldn't generate project intelligence from the current brief. Try again when you're ready."
              : "BusinessFlow AI can analyze the primary brief to identify requirements, deliverables, risks, missing information, and suggested work."}
          </p>
          {state.status === "FAILED" && state.errorMessage && (
            <p role="alert" className="mt-3 text-sm text-[#fca5a5]">{state.errorMessage}</p>
          )}
        </section>
      )}

      {isProcessing && (
        <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-lg border border-[#a49bff]/20 bg-[#a49bff]/[0.06] px-4 py-3 text-sm text-[#d2ccff]">
          <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden="true" />
          <div>
            <p className="font-medium">Analyzing Project Brief...</p>
            <p className="mt-0.5 text-xs text-white/55">BusinessFlow AI is reviewing the primary project brief.</p>
          </div>
        </div>
      )}

      {isStale && (
        <div role="status" aria-live="polite" className="rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/[0.04] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#fbbf24]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#fbbf24]">
                {state.analysisSourceMissing ? "Analysis source unavailable" : "This analysis is out of date"}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/60">{staleReason}</p>
              {analysis && <p className="mt-2 text-xs text-white/50">Previous source: {analysis.sourceDocumentName}</p>}
              {primaryBrief && <p className="mt-1 text-xs text-white/50">Current primary brief: {primaryBrief.originalName}</p>}
              <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                {canStartAnalysis && (
                  <form action={formAction} className="w-full sm:w-auto">
                    <input type="hidden" name="projectId" value={projectId} />
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-[#a49bff] px-3 text-xs font-medium text-[#101018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:opacity-60 sm:w-auto"
                    >
                      {isProcessing && <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />}
                      {isProcessing ? "Analyzing..." : state.status === "FAILED" ? "Try Again" : "Analyze Updated Brief"}
                    </button>
                  </form>
                )}
                {primaryBrief ? (
                  <button
                    type="button"
                    onClick={() => void openProjectBrief(primaryBrief.id)}
                    className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[#c4b5fd] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
                  >
                    View Current Brief
                  </button>
                ) : (
                  <Link href={`/projects/${projectId}/documents`} className="inline-flex min-h-8 items-center text-xs font-medium text-[#c4b5fd] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                    Choose a primary Project Brief
                  </Link>
                )}
                {analysis && <a href="#saved-analysis" className="inline-flex min-h-8 items-center text-xs font-medium text-[#c4b5fd] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">View Previous Analysis</a>}
              </div>
              {canStartAnalysis && (
                <p className="mt-2 text-xs leading-5 text-white/45">
                  This creates a new analysis. Previous analyses and existing Tasks stay unchanged; suggested Tasks are added only if you approve them.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <section className={`space-y-5 rounded-lg border p-4 sm:p-6 ${isStale ? "border-white/[0.07] bg-[#151517]" : "border-white/10 bg-[#18181b]"}`} aria-labelledby="saved-analysis">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="saved-analysis" className="text-base font-semibold text-[#f4f4f5]">
                  {isStale || isProcessing ? "Previous analysis" : state.status === "FAILED" ? "Previous successful analysis" : "Project Summary"}
                </h3>
                <Badge tone={isStale || isProcessing ? badgeTones.MEDIUM : "border-[#34d399]/20 bg-[#34d399]/[0.07] text-[#a7f3d0]"}>
                  {isStale ? "Historical analysis" : isProcessing ? "Previous saved result" : state.status === "FAILED" ? "Last successful result" : "Current analysis"}
                </Badge>
              </div>
              <p className="mt-1 break-words text-xs text-white/50">Analyzed {formatProjectAIAnalysisDate(analysis.completedAt ?? analysis.createdAt)}</p>
              <p className="mt-1 break-words text-xs text-white/50">
                Analysis source: {analysis.sourceDocumentName}
              </p>
              <p className="mt-1 break-words text-xs text-white/40">Brief updated {formatProjectAIAnalysisDate(analysis.sourceDocumentUpdatedAt)}</p>
              {analysis.sourceDocumentId && !state.analysisSourceMissing && (
                <button
                  type="button"
                  onClick={() => void openProjectBrief(analysis.sourceDocumentId!)}
                  disabled={openingDocumentId !== null}
                  className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-[#c4b5fd] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-50"
                >
                  {openingDocumentId === analysis.sourceDocumentId
                    ? <LoaderCircle size={12} className="animate-spin" aria-hidden="true" />
                    : <FileText size={12} aria-hidden="true" />}
                  Open analyzed Project Brief <ArrowUpRight size={12} aria-hidden="true" />
                </button>
              )}
              {documentAccessError && <p role="status" className="mt-2 text-xs text-[#fbbf24]">{documentAccessError}</p>}
            </div>
            <p className="inline-flex shrink-0 items-center gap-1.5 text-xs text-white/45">
              <Sparkles size={13} aria-hidden="true" /> AI-generated
            </p>
          </div>

          <ProjectAIAnalysisFeedbackControl
            projectId={projectId}
            analysisId={analysis.id}
            targetType="ANALYSIS"
            targetId={ANALYSIS_FEEDBACK_TARGET_ID}
            targetLabel="this full analysis"
            feedback={initialFeedback.filter((item) => item.targetType === "ANALYSIS" && item.targetId === ANALYSIS_FEEDBACK_TARGET_ID)}
          />

          {state.status === "FAILED" && state.errorMessage && (
            <div role="status" className="rounded-md border border-[#f59e0b]/20 bg-[#f59e0b]/[0.05] px-3 py-2 text-sm text-[#fbbf24]">
              {state.errorMessage} {analysis ? "Showing the last successful analysis." : ""}
            </div>
          )}
          {isProcessing && analysis && (
            <p role="status" className="text-sm text-[#c4b5fd]">A new analysis is running. This is the previous saved result.</p>
          )}
          <p className="text-xs leading-5 text-white/45">Generated from the analysis source shown above. Review insights before using them for project decisions; suggested Tasks require your approval.</p>
          {analysis.sourceMetadata?.truncated && (
            <p role="note" className="rounded-md border border-[#f59e0b]/15 bg-[#f59e0b]/[0.03] px-3 py-2 text-xs leading-5 text-white/55">
              This analysis used {analysis.sourceMetadata.finalCharacterCount.toLocaleString()} of {analysis.sourceMetadata.originalCharacterCount.toLocaleString()} extracted characters from the source brief. Omitted text may contain additional details.
            </p>
          )}
          <AnalysisSections
            intelligence={analysis.intelligence}
            projectId={projectId}
            analysisId={analysis.id}
            approvedSuggestions={analysis.approvedSuggestions}
            canApprove={state.status === "COMPLETED" && state.analysisIsCurrent && !isProcessing}
            feedback={initialFeedback}
          />
        </section>
      )}
    </div>
  );
}
