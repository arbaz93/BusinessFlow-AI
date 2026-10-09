"use client";

import { FeatureVisual } from "./FeatureVisual";
import { Search, Activity, FileText, CheckCheck } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureSearchActivityPreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="Search & Activity preview showing search results and recent activity" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Search & Activity</span>
          <div className="size-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <Search size={16} className="text-[var(--accent)]" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
              <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--panel)] border border-[var(--line)] rounded">⌘K</kbd>
              <span>Global search</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--background)] transition-colors">
                <div className="size-7 rounded-lg bg-[var(--background)] flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-[var(--accent)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">Brand & Website Refresh</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">Project · Northstar Studio</p>
                </div>
                <span className="text-[10px] font-medium text-[var(--muted)]">PROJECT</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--background)] transition-colors">
                <div className="size-7 rounded-lg bg-[var(--background)] flex items-center justify-center flex-shrink-0">
                  <CheckCheck size={14} className="text-[var(--success)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">Define homepage structure</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">Task · Medium · In Progress</p>
                </div>
                <span className="text-[10px] font-medium text-[var(--muted)]">TASK</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--muted)]">
              <Activity size={14} className="text-[var(--accent)]" />
              <span>Recent Activity</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="text-[var(--foreground)]"><span className="font-medium">Task completed</span> — Review brand positioning</p>
              <p className="text-[var(--foreground)]"><span className="font-medium">Brief updated</span> — Brand & Website Refresh Brief</p>
              <p className="text-[var(--foreground)]"><span className="font-medium">AI analysis run</span> — Project Intelligence</p>
            </div>
          </div>
        </div>
      </div>
    </FeatureVisual>
  );
}