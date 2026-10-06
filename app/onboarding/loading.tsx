import { AuthShell } from "@/components/auth/auth-shell";

export default function OnboardingLoading() {
  return (
    <AuthShell
      description="Checking your workspace status…"
      title="Loading"
    >
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-white/5" />
        <div className="h-10 animate-pulse rounded-lg bg-white/5" />
        <div className="h-10 animate-pulse rounded-lg bg-[#7067e8]/20" />
      </div>
    </AuthShell>
  );
}
