"use client";

import { FeatureVisual } from "./FeatureVisual";
import { CalendarDays, TrendingUp } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureProjectPreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="Project Management preview showing project status, priority, and progress" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Project</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20">
            PLANNING
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">Brand & Website Refresh</h3>
          <p className="text-sm text-[var(--muted)]">Northstar Studio</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20">
            HIGH
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--muted)]">
            <CalendarDays size={12} />
            Oct 30
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted)]">Task progress</span>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">4 of 7</span>
        </div>
        <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent)] w-[57%]" />
        </div>
      </div>
    </FeatureVisual>
  );
}