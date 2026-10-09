"use client";

import { FeatureVisual } from "./FeatureVisual";
import { Sparkles, User } from "lucide-react";

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureAssistantPreview({ className }: FeaturePreviewProps) {
  return (
    <FeatureVisual aria-label="AI Assistant preview showing a contextual Q&A interaction" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">AI Assistant</span>
          <div className="size-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <Sparkles size={16} className="text-[var(--accent)]" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 justify-end">
            <div className="flex-1 min-w-0 max-w-[85%]">
              <div className="ml-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm leading-6 text-[var(--foreground)]/85 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <pre className="whitespace-pre-wrap font-inherit">What needs attention on this project?</pre>
              </div>
            </div>
            <div className="size-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--panel)] border border-[var(--line)]">
              <User size={14} className="text-[var(--accent)]" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="size-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--accent)]/10 border border-[var(--accent)]/20">
              <Sparkles size={16} className="text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-[var(--foreground)]/45">
                <span className="inline-flex size-4 items-center justify-center rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent-muted)]">
                  <Sparkles size={10} aria-hidden="true" />
                </span>
                BusinessFlow AI
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] text-[var(--foreground)] px-4 py-2 text-sm leading-6 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <pre className="whitespace-pre-wrap font-inherit">Two items need attention:
• Define homepage structure (In Progress)
• Awaiting client content requirements

All other tasks are on track.</pre>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-[var(--line)] flex items-center gap-2 text-sm">
          <span className="text-[var(--muted)]">Context-aware responses</span>
          <span className="text-[var(--accent)] font-medium">Uses workspace data</span>
        </div>
      </div>
    </FeatureVisual>
  );
}