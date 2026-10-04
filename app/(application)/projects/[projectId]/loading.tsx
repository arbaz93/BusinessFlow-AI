export default function ProjectDetailLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10" aria-label="Loading project" role="status">
      <span className="sr-only">Loading project workspace…</span>
      <div className="space-y-4 pt-2 sm:pt-5">
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="h-9 w-72 max-w-full rounded bg-white/10" />
        <div className="h-5 w-80 max-w-full rounded bg-white/[0.06]" />
        <div className="h-11 rounded border-b border-white/10 bg-white/[0.02]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-[10px] border border-white/10 bg-[#18181b]" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(290px,0.8fr)]">
        <div className="space-y-6"><div className="h-72 rounded-[10px] border border-white/10 bg-[#18181b]" /><div className="h-40 rounded-[10px] border border-white/10 bg-[#18181b]" /></div>
        <div className="space-y-6"><div className="h-64 rounded-[10px] border border-white/10 bg-[#18181b]" /><div className="h-48 rounded-[10px] border border-white/10 bg-[#18181b]" /></div>
      </div>
    </div>
  );
}
