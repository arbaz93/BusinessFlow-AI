"use client";

import { AuthShell } from "@/components/auth/auth-shell";

export default function NoWorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AuthShell
      description="Please try again. If the problem continues, check your database connection."
      title="We couldn't load your account"
    >
      <button
        className="h-10 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] hover:opacity-90"
        onClick={() => reset()}
        type="button"
      >
        Try again
      </button>
    </AuthShell>
  );
}
