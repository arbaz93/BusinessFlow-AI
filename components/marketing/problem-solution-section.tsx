"use client";

import { Check, X } from "lucide-react";

const problemItems = [
  "Lead details stored separately from client work",
  "Client information disconnected from project execution",
  "Project context scattered across documents and tools",
  "Work handoffs requiring repeated manual organization",
];

const solutionItems = [
  "Leads and client relationships in one workspace",
  "Projects connected to their clients with full context",
  "Project information organized and accessible",
  "Foundation for AI-assisted brief analysis and task planning",
];

export function ProblemSolutionSection() {
  return (
    <section id="product" className="py-20 lg:py-28 px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
            The Problem
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Your client work shouldn&apos;t live across disconnected tools.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            As an agency grows, leads, client information, project details, and tasks become scattered.
            BusinessFlow AI brings the essential pieces into one connected workflow so teams spend less time
            searching for context and more time doing the work.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 lg:p-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--danger)]/10 text-[var(--danger)]">
                <X size={16} strokeWidth={2} />
              </span>
              Before BusinessFlow AI
            </h3>
            <div className="mt-6 space-y-4">
              {problemItems.map((item) => (
                <div className="flex items-start gap-3" key={item}>
                  <X size={18} strokeWidth={2.5} />
                  <span className="text-base leading-6 text-[var(--muted)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 lg:p-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--success)]/10 text-[var(--success)]">
                <Check size={16} strokeWidth={2} />
              </span>
              With BusinessFlow AI
            </h3>
            <div className="mt-6 space-y-4">
              {solutionItems.map((item) => (
                <div className="flex items-start gap-3" key={item}>
                  <Check size={18} strokeWidth={2.5} />
                  <span className="text-base leading-6 text-[var(--muted)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}