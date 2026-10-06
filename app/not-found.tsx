import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-muted)]">BusinessFlow AI</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          The page you requested could not be located. It may have moved or no longer exist.
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)]"
            href="/login"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
