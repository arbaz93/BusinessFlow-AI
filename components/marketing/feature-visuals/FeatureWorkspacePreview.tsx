"use client";

import { FeatureVisual } from "./FeatureVisual";
import { Workflow, Building2, Users, Search, Activity } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureWorkspacePreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="Connected Workspace preview showing workspace isolation, team roles, and search" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Workspace</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20">
            Active
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="size-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <Building2 size={18} className="text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">Agency Workspace</p>
              <p className="text-[11px] text-[var(--muted)]">Organization-level isolation</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="size-10 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 flex items-center justify-center">
              <Users size={18} className="text-[var(--success)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">Team Members</p>
              <p className="text-[11px] text-[var(--muted)]">3 roles · Admin, Manager, Member</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="size-10 rounded-xl bg-[var(--info)]/10 border border-[var(--info)]/20 flex items-center justify-center">
              <Search size={18} className="text-[var(--info)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">Cross-project Search</p>
              <p className="text-[11px] text-[var(--muted)]">Global search + activity feed</p>
            </div>
          </div>
        </div>
      </div>
    </FeatureVisual>
  );
}