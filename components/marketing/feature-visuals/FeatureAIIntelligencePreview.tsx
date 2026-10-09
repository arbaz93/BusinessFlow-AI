"use client";

import { FeatureVisual } from "./FeatureVisual";
import { Sparkles, AlertTriangle, HelpCircle, CheckCheck } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureAIIntelligencePreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="AI Project Intelligence preview showing requirements, risks, gaps, and suggested tasks" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">AI Intelligence</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--success)] font-medium">
            <Sparkles size={12} /> Complete
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="size-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[11px] font-medium text-[var(--foreground)]">Requirements</span>
            </div>
            <span className="text-2xl font-semibold text-[var(--foreground)]">4</span>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} className="text-[var(--warning)]" />
              <span className="text-[11px] font-medium text-[var(--foreground)]">Risks</span>
            </div>
            <span className="text-2xl font-semibold text-[var(--foreground)]">2</span>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle size={12} className="text-[var(--info)]" />
              <span className="text-[11px] font-medium text-[var(--foreground)]">Gaps</span>
            </div>
            <span className="text-2xl font-semibold text-[var(--foreground)]">3</span>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCheck size={12} className="text-[var(--success)]" />
              <span className="text-[11px] font-medium text-[var(--foreground)]">Suggested</span>
            </div>
            <span className="text-2xl font-semibold text-[var(--foreground)]">5</span>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 space-y-1.5">
          <p className="text-[11px] font-medium text-[var(--muted)]">Suggested Tasks</p>
          <p className="text-sm text-[var(--foreground)] truncate">Review brand positioning</p>
          <p className="text-sm text-[var(--foreground)] truncate">Audit current website</p>
          <p className="text-sm text-[var(--foreground)] truncate">Define homepage structure</p>
        </div>
      </div>
    </FeatureVisual>
  );
}