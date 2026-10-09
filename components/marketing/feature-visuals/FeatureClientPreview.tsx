"use client";

import { FeatureVisual } from "./FeatureVisual";
import { Building2 } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureClientPreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="Client Management preview showing a client profile with linked project" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Client</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20">
            ACTIVE
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">Northstar Studio</h3>
          <p className="text-sm text-[var(--muted)]">Sarah Mitchell · sarah@northstar.example</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Building2 size={14} className="text-[var(--muted-foreground)]" />
          <span>1 project connected</span>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[var(--muted)]">Linked Project</span>
            <span className="text-[10px] text-[var(--accent)] font-medium">VIEW</span>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)] truncate">Brand & Website Refresh</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">Planning · High priority</p>
        </div>
      </div>
    </FeatureVisual>
  );
}