export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10" aria-label="Loading dashboard" role="status">
      <span className="sr-only">Loading workspace overview…</span>

      <section className="flex flex-col gap-5 pt-2 sm:gap-6 lg:flex-row lg:items-end lg:justify-between lg:pt-5">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded bg-white/10" />
          <div className="h-9 w-64 max-w-full rounded bg-white/10" />
          <div className="h-4 w-80 max-w-full rounded bg-white/[0.06]" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-white/10" />
          <div className="hidden h-10 w-36 rounded-lg bg-white/[0.06] sm:block" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex min-h-[120px] flex-col justify-between rounded-[10px] border border-white/10 bg-[#18181b] p-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="size-8 rounded-md bg-white/[0.07]" />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="h-7 w-12 rounded bg-white/10" />
              <div className="h-3 w-32 max-w-[55%] rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(290px,1fr)]" aria-hidden="true">
        <div className="space-y-4 rounded-[10px] border border-white/10 bg-[#18181b] p-4 sm:p-5">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-white/10" />
            <div className="h-3 w-64 max-w-full rounded bg-white/[0.06]" />
          </div>
          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-4 rounded-xl border border-white/10 bg-[#111113] p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-44 max-w-[55vw] rounded bg-white/10" />
                  <div className="h-3 w-32 rounded bg-white/[0.06]" />
                </div>
                <div className="h-4 w-24 rounded bg-white/[0.06]" />
              </div>
              <div className="h-2 rounded-full bg-white/[0.06]" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-[10px] border border-white/10 bg-[#18181b] p-4 sm:p-5">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-3 w-52 max-w-full rounded bg-white/[0.06]" />
          </div>
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-[#111113] p-3">
              <div className="size-7 shrink-0 rounded-md bg-white/[0.07]" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-full rounded bg-white/[0.08]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" aria-hidden="true">
        {[0, 1].map((item) => (
          <div key={item} className="space-y-4 rounded-[10px] border border-white/10 bg-[#18181b] p-4 sm:p-5">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-white/10" />
              <div className="h-3 w-60 max-w-full rounded bg-white/[0.06]" />
            </div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-12 rounded-lg border border-white/10 bg-[#111113]" />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}