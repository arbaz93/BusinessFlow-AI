"use client";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface)] px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold text-[var(--ink)]">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Please try again. If the problem continues, check your application and database configuration.</p>
        <button className="mt-6 h-10 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--foreground)]" onClick={() => reset()} type="button">Try again</button>
      </div>
    </main>
  );
}