"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";
import { resetDemoWorkspace, type DemoResetResult } from "@/app/actions/demo";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

type DemoBannerProps = {
  onReset?: () => void;
};

export function DemoBanner({ onReset }: DemoBannerProps) {
  const [state, action, pending] = useActionState<DemoResetResult, FormData>(resetDemoWorkspace, { success: false });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--accent-border)]/20 bg-[var(--accent-surface)]/20 px-3.5 py-2.5 text-sm text-[var(--accent-line)]">
        <div className="flex items-center gap-2">
          <Sparkles size={15} />
          <span className="font-medium">
            You are exploring the demo workspace. Your changes are temporary and can be reset at any time.
          </span>
        </div>
        <form action={action}>
          <button
            type="submit"
            aria-label="Reset demo workspace"
            disabled={pending}
            onClick={() => onReset?.()}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "border-[var(--accent-border)]/40 text-[var(--accent-muted)] hover:bg-[var(--accent-border)]/20")}
          >
            {pending ? "Resetting…" : "Reset sandbox"}
          </button>
        </form>
      </div>
      {state.error ? (
        <Alert aria-live="assertive" role="alert" tone="error">
          {state.error}
        </Alert>
      ) : null}
    </div>
  );
}
