"use client";

import { FeatureVisual } from "./FeatureVisual";
import { FileText, File, FileImage } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureBriefsPreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="Project Briefs preview showing primary brief and supporting documents" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Documents</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20">
            Brief
          </span>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-8 rounded-lg bg-[var(--background)] flex items-center justify-center">
                <FileText size={16} className="text-[var(--accent)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">Brand & Website Refresh Brief</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">Primary · PDF · 2.4 MB</p>
              </div>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 shrink-0">
              PRIMARY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[var(--background)] flex items-center justify-center">
              <FileImage size={16} className="text-[var(--muted)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[var(--foreground)] truncate">Brand References</p>
              <p className="text-[11px] text-[var(--muted-foreground)]">Reference · FIG · 1.8 MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[var(--background)] flex items-center justify-center">
              <File size={16} className="text-[var(--muted)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[var(--foreground)] truncate">Content Notes</p>
              <p className="text-[11px] text-[var(--muted-foreground)]">Reference · TXT · 24 KB</p>
            </div>
          </div>
        </div>
      </div>
    </FeatureVisual>
  );
}