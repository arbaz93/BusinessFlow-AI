import Link from "next/link";
import { Check } from "lucide-react";

export const metadata = {
  title: "Account deleted | BusinessFlow AI",
  description: "Your BusinessFlow account has been deleted.",
};

export default function AccountDeletedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/15 text-[#22c55e]">
          <Check size={24} strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
          Your account has been deleted.
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          We&#39;re sorry to see you go. Your workspace and business data have been permanently
          removed, your authentication identity has been deleted, and your sessions have been
          invalidated.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Create a new account
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--foreground)]/75 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Back to BusinessFlow
          </Link>
        </div>
      </div>
    </main>
  );
}
