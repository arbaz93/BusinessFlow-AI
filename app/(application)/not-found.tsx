import Link from "next/link";

export default function ApplicationNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-muted)]">BusinessFlow AI</p>
      <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground)]">This page isn’t available</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        The requested workspace item could not be found, or it no longer exists.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)]"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--foreground)]"
          href="/projects"
        >
          Go to projects
        </Link>
      </div>
    </main>
  );
}
