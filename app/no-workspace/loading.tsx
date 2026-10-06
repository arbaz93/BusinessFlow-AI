import { AuthShell } from "@/components/auth/auth-shell";

export default function NoWorkspaceLoading() {
  return (
    <AuthShell
      description="Checking your workspace access…"
      title="Loading"
    >
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-[var(--surface)]" />
        <div className="h-10 animate-pulse rounded-lg bg-[var(--surface)]" />
        <div className="h-10 animate-pulse rounded-lg bg-[var(--panel)]" />
      </div>
    </AuthShell>
  );
}
