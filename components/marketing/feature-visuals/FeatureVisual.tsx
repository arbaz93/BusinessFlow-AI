"use client";

import { cn } from "@/lib/utils";

interface FeatureVisualProps {
  children: React.ReactNode;
  className?: string;
}

export function FeatureVisual({ children, className }: FeatureVisualProps) {
  return (
    <div
      className={cn(
        "relative w-full max-w-[420px] rounded-2xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden",
        className
      )}
      role="img"
      aria-hidden="true"
    >
      <div className="inset-0 p-5 lg:p-6 flex flex-col justify-center min-w-0">
        {children}
      </div>
    </div>
  );
}