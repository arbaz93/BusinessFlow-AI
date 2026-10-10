"use client";

import { AiDocumentScanner, AiAnalysisMarker } from "@/components/ai/ai-loading-primitives";

export function AiAnalysisLoader({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <AiDocumentScanner compact={compact} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]/90">
            Analyzing project brief
          </p>
          {!compact && (
            <p className="mt-0.5 max-w-sm text-xs leading-5 text-[var(--foreground)]/50">
              Organizing requirements, deliverables, risks, and open questions.
            </p>
          )}
        </div>
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          <AiAnalysisMarker delay={0} color="info" label="Requirements" />
          <AiAnalysisMarker delay={0.3} color="warning" label="Risks" />
          <AiAnalysisMarker delay={0.6} color="success" label="Deliverables" />
          <AiAnalysisMarker delay={0.9} color="accent" label="Open questions" />
        </div>
      )}
    </div>
  );
}
