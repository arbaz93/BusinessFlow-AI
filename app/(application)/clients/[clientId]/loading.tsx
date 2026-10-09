export default function ClientDetailLoading() {
  return (
    <div className="animate-pulse space-y-7 pb-10" aria-label="Loading client" role="status">
      <span className="sr-only">Loading client workspace…</span>
      <div className="space-y-3 pt-2 sm:pt-5"><div className="h-4 w-16 rounded bg-[var(--surface)]" /><div className="h-9 w-64 max-w-full rounded bg-[var(--surface)]" /><div className="h-4 w-80 max-w-full rounded bg-[var(--surface)]" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" />)}</div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]"><div className="space-y-6"><div className="h-52 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" /><div className="h-64 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" /></div><div className="space-y-6"><div className="h-72 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" /><div className="h-36 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" /></div></div>
    </div>
  );
}