"use client";

export default function ApplicationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#a49bff]">BusinessFlow AI</p>
      <h1 className="mt-4 text-3xl font-semibold">We couldn’t load this workspace</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Please try again. If the problem continues, check your database connection.</p>
      <button className="mt-7 h-10 rounded-lg bg-[#695be7] px-4 text-sm font-medium text-white" onClick={() => reset()} type="button">Try again</button>
    </main>
  );
}