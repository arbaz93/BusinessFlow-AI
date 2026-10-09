export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10" aria-label="Loading dashboard" role="status">
      <span className="sr-only">Loading workspace overview…</span>

      <section className="flex flex-col gap-5 pt-2 sm:gap-6 lg:flex-row lg:items-end lg:justify-between lg:pt-5">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded bg-[var(--line)]" />
          <div className="h-9 w-64 max-w-full rounded bg-[var(--line)]" />
          <div className="h-4 w-80 max-w-full rounded bg-[var(--surface)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-[var(--line)]" />
          <div className="hidden h-10 w-36 rounded-lg bg-[var(--surface)] sm:block" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex min-h-[120px] flex-col justify-between rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-[var(--line)]" />
              <div className="size-8 rounded-md bg-[var(--surface)]" />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="h-7 w-12 rounded bg-[var(--line)]" />
              <div className="h-3 w-32 max-w-[55%] rounded bg-[var(--surface)]" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(290px,1fr)]" aria-hidden="true">
        <div className="space-y-4 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-[var(--line)]" />
            <div className="h-3 w-64 max-w-full rounded bg-[var(--surface)]" />
          </div>
          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-44 max-w-[55vw] rounded bg-[var(--line)]" />
                  <div className="h-3 w-32 rounded bg-[var(--surface)]" />
                </div>
                <div className="h-4 w-24 rounded bg-[var(--surface)]" />
              </div>
              <div className="h-2 rounded-full bg-[var(--surface)]" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-[var(--line)]" />
            <div className="h-3 w-52 max-w-full rounded bg-[var(--surface)]" />
          </div>
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
              <div className="size-7 shrink-0 rounded-md bg-[var(--elevated)]" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-full rounded bg-[var(--line)]" />
                <div className="h-3 w-3/4 rounded bg-[var(--surface)]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" aria-hidden="true">
        {[0, 1].map((item) => (
          <div key={item} className="space-y-4 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-[var(--line)]" />
              <div className="h-3 w-60 max-w-full rounded bg-[var(--surface)]" />
            </div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-12 rounded-lg border border-[var(--line)] bg-[var(--surface)]" />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}