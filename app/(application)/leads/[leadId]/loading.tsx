export default function LeadDetailLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10" aria-label="Loading lead" role="status">
      <span className="sr-only">Loading lead details…</span>
      <div className="space-y-3 pt-2 sm:pt-5">
        <div className="h-4 w-16 rounded bg-white/10" />
        <div className="h-8 w-56 max-w-full rounded bg-white/10" />
        <div className="h-4 w-72 max-w-full rounded bg-white/[0.06]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <div className="space-y-5">
          <div className="h-56 rounded-[10px] border border-white/10 bg-[#18181b]" />
          <div className="h-36 rounded-[10px] border border-white/10 bg-[#18181b]" />
        </div>
        <div className="h-72 rounded-[10px] border border-white/10 bg-[#18181b]" />
      </div>
    </div>
  );
}