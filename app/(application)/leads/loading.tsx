export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10" aria-label="Loading leads" role="status">
      <span className="sr-only">Loading leads…</span>
      <div className="space-y-3 pt-2 sm:pt-5">
        <div className="h-3 w-28 rounded bg-[var(--surface)]" />
        <div className="h-9 w-40 rounded bg-[var(--surface)]" />
        <div className="h-4 w-72 max-w-full rounded bg-[var(--surface)]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-24 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" />)}
      </div>
      <div className="h-16 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" />
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-20 rounded-[10px] border border-[var(--line)] bg-[var(--surface)]" />)}
      </div>
    </div>
  );
}