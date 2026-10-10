"use client";

import { useActionState, useState } from "react";
import { Dialog } from "radix-ui";
import { MessageSquareText, Pencil, X } from "lucide-react";
import { submitProjectAIAnalysisFeedbackAction } from "@/app/actions/project-ai-feedback";
import {
  aiAnalysisFeedbackTypeLabels,
  aiAnalysisFeedbackTypeValues,
} from "@/lib/project-ai/feedback-schemas";
import type {
  AIAnalysisFeedbackTargetType,
  ProjectAIAnalysisFeedbackView,
} from "@/lib/project-ai/feedback-types";

export function ProjectAIAnalysisFeedbackControl({
  projectId,
  analysisId,
  targetType,
  targetId,
  targetLabel,
  historical = false,
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
  const [open, setOpen] = useState(false);
  const [result, formAction, pending] = useActionState(submitProjectAIAnalysisFeedbackAction, null);
  const ownFeedback = feedback.find((item) => item.isOwn) ?? null;
  const savedFeedback = result?.success ? result.feedback : ownFeedback;

  const visibleFeedback = feedback.filter((item) => !item.isOwn);
  const statusMessage = result?.success
    ? result.message
    : savedFeedback
      ? "You submitted feedback for this result."
      : null;

  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label={`${savedFeedback ? "Edit" : "Give"} feedback on ${targetLabel}`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded px-1.5 text-xs font-medium text-ink/50 transition-colors hover:bg-[var(--surface)] hover:text-[var(--accent-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {savedFeedback ? <Pencil size={12} aria-hidden="true" /> : <MessageSquareText size={12} aria-hidden="true" />}
            {savedFeedback ? "Edit feedback" : "Give feedback"}
          </button>
        </Dialog.Trigger>
        {open && (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-[var(--foreground)] shadow-2xl outline-none sm:w-[calc(100vw-2rem)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Dialog.Title className="text-base font-semibold text-[var(--foreground)]">Give feedback</Dialog.Title>
                  <Dialog.Description className="mt-1 break-words text-sm text-[var(--foreground)]/50">
                    Feedback applies only to {historical ? "this historical analysis" : "this analysis"}. It is saved separately and does not change this result.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close feedback dialog"
                    className="grid size-8 shrink-0 place-items-center rounded-md text-[var(--foreground)]/55 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>

              <form action={formAction} className="mt-5 space-y-4">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="analysisId" value={analysisId} />
                <input type="hidden" name="targetType" value={targetType} />
                <input type="hidden" name="targetId" value={targetId} />
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-[var(--foreground)]/80">What should we review about “{targetLabel}”?</legend>
                  <label className="block text-xs text-[var(--foreground)]/55" htmlFor={`feedback-type-${analysisId}-${targetId}`}>
                    Feedback category
                  </label>
                  <select
                    id={`feedback-type-${analysisId}-${targetId}`}
                    name="feedbackType"
                    defaultValue={savedFeedback?.feedbackType ?? "INCORRECT"}
                    disabled={pending}
                    className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:opacity-60"
                  >
                    {aiAnalysisFeedbackTypeValues.map((value) => (
                      <option key={value} value={value}>{aiAnalysisFeedbackTypeLabels[value]}</option>
                    ))}
                  </select>
                </fieldset>

                <label className="block space-y-1.5" htmlFor={`feedback-comment-${analysisId}-${targetId}`}>
                  <span className="text-sm font-medium text-[var(--foreground)]/80">Optional explanation</span>
                  <textarea
                    id={`feedback-comment-${analysisId}-${targetId}`}
                    name="comment"
                    defaultValue={savedFeedback?.comment ?? ""}
                    maxLength={1000}
                    rows={4}
                    disabled={pending}
                    placeholder="Add context if helpful. An explanation is required for Other feedback."
                    className="w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--foreground)]/80 outline-none placeholder:text-[var(--foreground)]/30 focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:opacity-60"
                  />
                  <span className="block text-right text-[11px] text-[var(--foreground)]/40">Up to 1000 characters</span>
                </label>

                {!result?.success && result?.fieldErrors?.comment?.[0] && (
                  <p role="alert" className="text-xs text-[#fca5a5]">{result.fieldErrors.comment[0]}</p>
                )}
                {result && !result.success && (
                  <p role="alert" className="text-sm text-[#fca5a5]">{result.error}</p>
                )}
                {result?.success && <p role="status" className="text-sm text-emerald-300">{result.message}</p>}

                <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild>
                    <button type="button" className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--line)] px-3 text-sm text-[var(--foreground)]/70 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Saving…" : savedFeedback ? "Update feedback" : "Submit feedback"}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>

      {statusMessage && !open && <span role="status" className="text-xs text-emerald-300">{statusMessage}</span>}
      {visibleFeedback.length > 0 && (
        <details className="min-w-0">
          <summary className="min-h-8 cursor-pointer rounded px-1.5 py-1 text-xs text-[var(--foreground)]/45 hover:text-[var(--foreground)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            {visibleFeedback.length} {visibleFeedback.length === 1 ? "other response" : "other responses"}
          </summary>
          <ul className="mt-2 w-full space-y-2 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
            {visibleFeedback.map((item) => (
              <li key={`${item.targetType}-${item.targetId}-${item.authorName}-${item.createdAt}`} className="break-words text-xs text-[var(--foreground)]/55">
                <span className="font-medium text-[var(--foreground)]/75">{item.authorName}</span>
                {" · "}{aiAnalysisFeedbackTypeLabels[item.feedbackType]}
                {item.comment && <p className="mt-1 whitespace-pre-wrap text-[var(--foreground)]/45">{item.comment}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
