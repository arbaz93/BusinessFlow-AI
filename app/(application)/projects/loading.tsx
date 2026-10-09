export default function ProjectsLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10" aria-label="Loading projects" role="status">
      <span className="sr-only">Loading projects…</span>
      <div className="space-y-3 pt-2 sm:pt-5"><div className="h-3 w-36 rounded bg-[var(--surface)]" /><div className="h-9 w-44 rounded bg-[var(--surface)]" /><div className="h-4 w-80 max-w-full rounded bg-[var(--surface)]" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" />)}</div>
      <div className="h-24 rounded-[10px] border border-[var(--line)] bg-[var(--panel)]" />
      <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-[68px] border-b border-[var(--line)] last:border-0" />)}</div>
    </div>
  );
}
