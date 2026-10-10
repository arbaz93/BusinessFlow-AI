"use client";

import { cn } from "@/lib/utils";

export function AiProcessingDots({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.75", className)}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-muted)]/60 ai-thinking-dot"
          style={{
            animation: "ai-pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </span>
  );
}

export function AiDocumentScanner({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-md border border-[var(--line)] bg-[var(--surface)]/30",
        compact ? "h-8 w-20" : "h-14 w-32",
        className,
      )}
      aria-hidden="true"
      style={{ animation: "ai-fade-in-up 0.2s ease-out" }}
    >
      <div className="h-full p-1 space-y-1">
        {!compact && (
          <>
            <div className="h-2 w-full rounded-sm bg-[var(--foreground)]/10" />
            <div className="h-2 w-3/4 rounded-sm bg-[var(--foreground)]/10" />
          </>
        )}
        <div
          className={cn(
            "h-2 rounded-sm bg-[var(--foreground)]/10",
            compact ? "w-4/5" : "w-full",
          )}
        />
        <div
          className={cn(
            "h-2 rounded-sm bg-[var(--foreground)]/10",
            compact ? "w-1/2" : "w-2/5",
          )}
        />
      </div>
      <div
        className="absolute left-0 top-0 h-3 w-full bg-gradient-to-b from-transparent via-[var(--accent)]/50 to-transparent blur-[1px] ai-doc-scan-line"
        style={{ animation: "ai-doc-scan 2.8s ease-in-out 0.4s infinite" }}
        aria-hidden="true"
      />
    </div>
  );
}

const markerTones = {
  info: "bg-[var(--info)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  accent: "bg-[var(--accent-muted)]",
} as const;

type MarkerColor = keyof typeof markerTones;

export function AiAnalysisMarker({
  delay = 0,
  color = "accent",
  label,
}: {
  delay?: number;
  color?: MarkerColor;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full ai-analysis-marker",
          markerTones[color],
        )}
        style={{
          animation: "ai-pulse 1.5s ease-in-out infinite",
          animationDelay: `${delay}s`,
        }}
      />
      <span className="text-[9px] font-medium text-[var(--foreground)]/40">
        {label}
      </span>
    </span>
  );
}
