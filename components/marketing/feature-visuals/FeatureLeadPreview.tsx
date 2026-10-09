"use client";

import { FeatureVisual } from "./FeatureVisual";
import { Target, CircleDollarSign } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureLeadPreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="Lead Management preview showing a qualified lead card" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Lead</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20">
            QUALIFIED
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">Northstar Studio</h3>
          <p className="text-sm text-[var(--muted)]">Referral · Sarah Mitchell</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Target size={14} className="text-[var(--accent)]" />
          <span className="text-sm text-[var(--muted)]">Source: Referral</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span className="flex-1 truncate">Est. value</span>
          <span className="font-semibold text-[var(--foreground)]">
            <CircleDollarSign size={14} className="inline-block align-middle mr-1" />
            $8,500
          </span>
        </div>
        <div className="pt-2 border-t border-[var(--line)] flex items-center gap-2 text-sm">
          <span className="flex-1 text-[var(--muted)]">Lead → Client</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            Convert
          </span>
        </div>
      </div>
    </FeatureVisual>
  );
}