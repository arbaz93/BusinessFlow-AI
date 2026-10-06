"use client";

import { AuthShell } from "@/components/auth/auth-shell";

export default function OnboardingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AuthShell
      description="Please try again. If the problem continues, check your database connection."
      title="We couldn't load your account"
    >
      <button
        className="h-10 rounded-lg bg-[#7067e8] px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[#8178f0]"
        onClick={() => reset()}
        type="button"
      >
        Try again
      </button>
    </AuthShell>
  );
}
