"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { ArrowUpRight, FileClock, FileText, LoaderCircle, X } from "lucide-react";
import {
  getProjectAIAnalysisDetail,
  type ProjectAIAnalysisDetailResult,
} from "@/app/actions/project-ai-history";
import { getProjectDocumentAccessUrl } from "@/app/actions/project-documents";
import { AnalysisSections } from "@/components/projects/project-ai-workspace";
import type { ProjectAIAnalysisHistoryEntry } from "@/lib/project-ai/history";

function HistoryBadge({ children, tone = "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]/65" }: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}>{children}</span>;
}

function statusLabel(status: ProjectAIAnalysisHistoryEntry["status"]) {
  if (status === "COMPLETED") return "Completed";
  if (status === "FAILED") return "Analysis failed";
  return "Processing";
}

function AnalysisHistoryLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <p className="text-sm text-[var(--foreground)]/55">Loading saved analysis…</p>
      <div className="h-16 animate-pulse rounded-md bg-[var(--surface)]" />
      <div className="h-24 animate-pulse rounded-md bg-[var(--surface)]" />
      <span className="sr-only">Loading historical analysis details</span>
    </div>
  );
}

export function ProjectAIAnalysisHistory({
  projectId,
  analyses,
}: {
  projectId: string;
  analyses: ProjectAIAnalysisHistoryEntry[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Extract<ProjectAIAnalysisDetailResult, { success: true }>["analysis"] | null>(null);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [openingSourceId, setOpeningSourceId] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);

  async function openAnalysis(analysisId: string) {
    setDialogOpen(true);
    setSelectedAnalysis(null);
    setDetailError(null);
    setLoadingAnalysisId(analysisId);
    try {
      const result = await getProjectAIAnalysisDetail(projectId, analysisId);
      if (result.success) setSelectedAnalysis(result.analysis);
      else setDetailError(result.error);
    } catch {
      setDetailError("This analysis could not be displayed.");
    } finally {
      setLoadingAnalysisId(null);
    }
  }

  async function openSourceBrief(documentId: string) {
    setOpeningSourceId(documentId);
    setSourceError(null);
    try {
      const result = await getProjectDocumentAccessUrl(documentId, projectId, "view");
      if (!result.url) {
        setSourceError(result.error ?? "This document could not be opened.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      setSourceError("This document could not be opened.");
    } finally {
      setOpeningSourceId(null);
    }
  }

  if (!analyses.length) return null;
  const onlyCurrentAnalysis = analyses.length === 1 && analyses[0].isCurrent;

  return (
    <section className="mx-auto w-full max-w-5xl rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5" aria-labelledby="analysis-history-heading">
      <div className="flex items-center gap-2">
        <FileClock size={16} className="text-[var(--accent-muted)]" aria-hidden="true" />
        <h2 id="analysis-history-heading" className="text-base font-semibold text-[var(--foreground)]">Analysis History</h2>
      </div>
      {onlyCurrentAnalysis ? (
        <p className="mt-3 text-sm text-[var(--foreground)]/50">No previous analyses yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--line)]">
          {analyses.map((analysis) => {
            const status = statusLabel(analysis.status);
            return (
              <li key={analysis.id} className="flex min-w-0 flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]/85">{status}</span>
                    {analysis.isCurrent && <HistoryBadge tone="border-[#34d399]/20 bg-[#34d399]/[0.07] text-[#a7f3d0]">Current</HistoryBadge>}
                    {!analysis.isCurrent && analysis.isStale && <HistoryBadge tone="border-[#f59e0b]/25 bg-[#f59e0b]/[0.08] text-[#fbbf24]">Stale</HistoryBadge>}
                    {analysis.status === "COMPLETED" && !analysis.sourceDocumentAvailable && (
                      <HistoryBadge>Source unavailable</HistoryBadge>
                    )}
                  </div>
                  <p className="break-words text-sm text-[var(--foreground)]/65">
                    {analysis.sourceDocumentName ?? "Source document no longer available"}
                  </p>
                  <time dateTime={analysis.analyzedAt} className="block text-xs text-[var(--foreground)]/40">
                    {analysis.analyzedAtLabel}
                  </time>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {analysis.status === "COMPLETED" && !analysis.isCurrent && (
                    <button
                      type="button"
                      onClick={() => void openAnalysis(analysis.id)}
                      disabled={loadingAnalysisId !== null}
                      aria-label={`View analysis from ${analysis.sourceDocumentName ?? "unavailable source"}, ${analysis.analyzedAtLabel}`}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--foreground)]/75 transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      View analysis
                    </button>
                  )}
                  {analysis.sourceDocumentAvailable && analysis.sourceDocumentId && (
                    <button
                      type="button"
                      onClick={() => void openSourceBrief(analysis.sourceDocumentId!)}
                      disabled={openingSourceId !== null}
                      aria-label={`View source brief ${analysis.sourceDocumentName ?? ""}`}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--foreground)]/75 transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {openingSourceId === analysis.sourceDocumentId
                        ? <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
                        : <FileText size={13} aria-hidden="true" />}
                      View source
                      <ArrowUpRight size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {sourceError && <p role="status" className="mt-3 text-xs text-[#fbbf24]">{sourceError}</p>}

      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedAnalysis(null);
            setDetailError(null);
          }
        }}
      >
        {dialogOpen && (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100vw-1rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-[var(--foreground)] shadow-2xl outline-none sm:w-[calc(100vw-2rem)] sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
                <div className="min-w-0">
                  <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                    Historical AI analysis
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[var(--foreground)]/50">
                    Saved project intelligence for reference only.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close historical analysis"
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--foreground)]/55 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-5 space-y-5">
                {loadingAnalysisId ? (
                  <AnalysisHistoryLoading />
                ) : detailError ? (
                  <p role="alert" className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--foreground)]/65">
                    {detailError}
                  </p>
                ) : selectedAnalysis ? (
                  <>
                    <div role="note" className="rounded-md border border-[#a49bff]/20 bg-[#a49bff]/[0.05] px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <HistoryBadge tone="border-[#a49bff]/25 bg-[#a49bff]/10 text-[var(--accent-muted)]">Reference only</HistoryBadge>
                        {selectedAnalysis.isStale && <HistoryBadge tone="border-[#f59e0b]/25 bg-[#f59e0b]/[0.08] text-[#fbbf24]">Stale</HistoryBadge>}
                      </div>
                      <p className="mt-2 break-words text-sm leading-6 text-[var(--foreground)]/75">
                        {selectedAnalysis.sourceDocumentName
                          ? <>Based on “{selectedAnalysis.sourceDocumentName}” at the time of analysis on {selectedAnalysis.analyzedAtLabel}.</>
                          : <>Generated on {selectedAnalysis.analyzedAtLabel}. The source Project Brief name is unavailable.</>}
                      </p>
                      {!selectedAnalysis.sourceDocumentAvailable && (
                        <p className="mt-1 text-xs leading-5 text-[var(--foreground)]/50">The source document is no longer available.</p>
                      )}
                      <p className="mt-1 text-xs leading-5 text-[var(--foreground)]/40">
                        Source document update marker at analysis: {selectedAnalysis.sourceDocumentUpdatedAtLabel}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--foreground)]/50">
                        {selectedAnalysis.isStale
                          ? "This analysis is no longer based on the current primary Project Brief. The current file may differ from the version analyzed."
                          : "This saved result does not change the current project intelligence."}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--foreground)]/40">
                        Attribution is document-level; reliable page or section locations were not preserved by extraction.
                      </p>
                      {selectedAnalysis.sourceDocumentId && selectedAnalysis.sourceDocumentAvailable && (
                        <button
                          type="button"
                          onClick={() => void openSourceBrief(selectedAnalysis.sourceDocumentId!)}
                          disabled={openingSourceId !== null}
                          className="mt-3 inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-[var(--accent-muted)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-50"
                        >
                          View source Project Brief <ArrowUpRight size={12} aria-hidden="true" />
                        </button>
                      )}
                      {sourceError && <p role="status" className="mt-2 text-xs text-[#fbbf24]">{sourceError}</p>}
                    </div>
                    {selectedAnalysis.intelligence.sourceMetadata?.truncated && (
                      <p role="note" className="rounded-md border border-[#f59e0b]/15 bg-[#f59e0b]/[0.03] px-3 py-2 text-xs leading-5 text-[var(--foreground)]/55">
                        This analysis used {selectedAnalysis.intelligence.sourceMetadata.finalCharacterCount.toLocaleString()} of {selectedAnalysis.intelligence.sourceMetadata.originalCharacterCount.toLocaleString()} extracted characters. References, if available, would only apply to the supplied portion.
                      </p>
                    )}
                    <AnalysisSections
                      intelligence={selectedAnalysis.intelligence}
                      projectId={projectId}
                      analysisId={selectedAnalysis.id}
                      approvedSuggestions={[]}
                      canApprove={false}
                      mode="historical"
                      feedback={selectedAnalysis.feedback}
                    />
                  </>
                ) : null}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </section>
  );
}
