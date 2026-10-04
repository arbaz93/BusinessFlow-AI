export default function ProjectsLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10" aria-label="Loading projects" role="status">
      <span className="sr-only">Loading projects…</span>
      <div className="space-y-3 pt-2 sm:pt-5"><div className="h-3 w-36 rounded bg-white/10" /><div className="h-9 w-44 rounded bg-white/10" /><div className="h-4 w-80 max-w-full rounded bg-white/[0.06]" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-[10px] border border-white/10 bg-[#18181b]" />)}</div>
      <div className="h-24 rounded-[10px] border border-white/10 bg-[#18181b]" />
      <div className="overflow-hidden rounded-[10px] border border-white/10 bg-[#151518]">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-[68px] border-b border-white/[0.07] last:border-0" />)}</div>
    </div>
  );
}
