export default function ApplicationLoading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true" aria-live="polite" role="status">
      <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-end sm:justify-between sm:pt-5">
        <div className="space-y-3">
          <div className="h-3 w-28 rounded bg-[var(--line)]" />
          <div className="h-9 w-60 rounded bg-[var(--line)]" />
          <div className="h-4 w-72 rounded bg-[var(--surface)]" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-[var(--line)]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="h-3 w-24 rounded bg-[var(--line)]" />
            <div className="mt-5 h-7 w-16 rounded bg-[var(--line)]" />
            <div className="mt-4 h-3 w-32 rounded bg-[var(--surface)]" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(290px,1fr)]">
        <div className="h-80 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4" />
        <div className="h-80 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4" />
      </div>
    </div>
  );
}
