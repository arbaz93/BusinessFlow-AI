"use client";

import { FeatureVisual } from "./FeatureVisual";
import { Shield, Lock, Server, Database, UserCheck } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureSecurityPreview({ className }: FeaturePreviewProps) {
  const items = [
    { icon: Database, label: "Workspace Isolation", desc: "Database-level enforcement" },
    { icon: Server, label: "Server Auth", desc: "Authorization on every mutation" },
    { icon: Lock, label: "Private Storage", desc: "Controlled document access" },
    { icon: UserCheck, label: "Human-in-the-loop", desc: "AI within controlled boundaries" },
  ];

  return (
    <FeatureVisual aria-label="Security Architecture preview showing isolation, auth, storage, and AI controls" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Security</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20">
            Enforced
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
              <div className="size-9 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-2">
                <item.icon size={18} className="text-[var(--accent)]" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </FeatureVisual>
  );
}