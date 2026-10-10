"use client";

import { Sparkles } from "lucide-react";

export function AssistantThinkingIndicator({
  status = "Preparing your response…",
}: {
  status?: string;
}) {
  return (
    <article
      role="status"
      aria-live="polite"
      className="flex min-w-0 flex-col items-start"
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[var(--foreground)]/45">
        <span className="inline-flex size-5 items-center justify-center rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/8 text-[var(--accent-muted)]">
          <Sparkles size={11} aria-hidden="true" />
        </span>
        BusinessFlow AI
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-muted)]/60 ai-thinking-dot"
            style={{ animation: "ai-pulse 1.5s ease-in-out infinite" }}
            aria-hidden="true"
          />
          <span className="text-xs text-[var(--foreground)]/55">{status}</span>
        </div>
      </div>
    </article>
  );
}
