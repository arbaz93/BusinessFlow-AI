import { SparklesIcon } from "lucide-react";
import Link from "next/link";


type AuthShellProps = {
  children?: React.ReactNode;
  title: string;
  description: string;
};

export function AuthShell({ children, title, description }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center bg-gradient-to-br from-[var(--accent)]/10 to-[var(--muted)]/10 px-6 py-12 sm:px-8 lg:px-10">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 sm:max-lg:max-w-[640px] lg:grid-cols-2 lg:items-start lg:gap-20">
        <section className="w-full px-8 lg:px-0 max-w-xl">
          <Link
            href="/"
            aria-label="BusinessFlow AI home"
            className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface)]"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-foreground text-sm font-bold text-elevated">
              <SparklesIcon />
            </span>
            <span className="text-base font-semibold tracking-tight text-[var(--ink)]">
              BusinessFlow <span className="text-[var(--accent)]">AI</span>
            </span>
          </Link>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-1 max-w-md text-base leading-7 text-[var(--muted)]">
            {description}
          </p>
        </section>
        <div id="main-content" className="w-full lg:max-w-150 lg:justify-self-end">
          {children}
        </div>
      </div>
    </main>
  );
}
