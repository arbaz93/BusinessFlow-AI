import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <header className="border-b border-[var(--line)] bg-white/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="BusinessFlow AI home">
            <span className="grid size-9 place-items-center rounded-lg bg-[var(--ink)] text-sm font-bold text-white">B</span>
            <span className="text-base font-semibold tracking-tight text-[var(--ink)]">BusinessFlow <span className="text-[var(--accent)]">AI</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[var(--muted)] sm:flex" aria-label="Main navigation">
            <a href="#approach" className="transition-colors hover:text-[var(--ink)]">Approach</a>
            <a href="#foundation" className="transition-colors hover:text-[var(--ink)]">Foundation</a>
          </nav>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white transition-transform hover:-translate-y-0.5">Get started</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-32 lg:pt-28">
        <div className="flex max-w-2xl flex-col justify-center">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Operations, with a clearer view</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--ink)] sm:text-6xl">Make agency work easier to move forward.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[var(--muted)]">AI-powered project and client operations for digital agencies. A focused foundation for the work that comes next.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="rounded-lg bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">Create your workspace</Link>
            <Link href="/login" className="text-sm font-medium text-[var(--muted)] underline underline-offset-4 hover:text-[var(--ink)]">Sign in</Link>
          </div>
        </div>

        <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(23,35,38,0.08)]" aria-label="BusinessFlow AI workspace preview">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(222,239,232,0.7),transparent_48%),linear-gradient(315deg,rgba(247,226,194,0.55),transparent_55%)]" />
          <div className="relative w-full max-w-md rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div><p className="text-xs font-medium text-[var(--muted)]">Workspace overview</p><p className="mt-1 text-lg font-semibold tracking-tight text-[var(--ink)]">A calmer operating rhythm</p></div>
              <span className="size-2.5 rounded-full bg-[var(--accent)]" />
            </div>
            <div className="grid grid-cols-3 gap-3 py-5">
              <div className="rounded-lg bg-[var(--surface)] p-3"><p className="text-xs text-[var(--muted)]">Active work</p><p className="mt-2 text-2xl font-semibold text-[var(--ink)]">--</p></div>
              <div className="rounded-lg bg-[var(--surface)] p-3"><p className="text-xs text-[var(--muted)]">Clients</p><p className="mt-2 text-2xl font-semibold text-[var(--ink)]">--</p></div>
              <div className="rounded-lg bg-[var(--surface)] p-3"><p className="text-xs text-[var(--muted)]">Next step</p><p className="mt-2 text-2xl font-semibold text-[var(--ink)]">--</p></div>
            </div>
            <div className="rounded-lg border border-dashed border-[var(--line-strong)] p-4 text-sm text-[var(--muted)]">Your workspace will take shape here.</div>
          </div>
        </div>
      </section>

      <section id="foundation" className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">A solid starting point</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Built to grow without getting in the way.</h2></div>
          <div id="approach" className="grid gap-8 sm:grid-cols-3">
            <div><p className="text-sm font-semibold text-[var(--ink)]">Clear by default</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">A server-first Next.js foundation keeps the product direct and maintainable.</p></div>
            <div><p className="text-sm font-semibold text-[var(--ink)]">Ready for depth</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Prisma, PostgreSQL, and Supabase are prepared for later phases.</p></div>
            <div><p className="text-sm font-semibold text-[var(--ink)]">Private by design</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Authenticated workspace routes are verified on the server.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
