"use client";

import { Building2, CheckCheck, Sparkles, Users } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Set up your workspace",
    description: "Create your workspace and establish a home for your agency's operations. Define your business type and invite team members.",
    details: [
      "Workspace creation with business type",
      "Team member invitations",
      "Organization settings",
    ],
  },
  {
    number: "02",
    icon: Users,
    title: "Organize clients and projects",
    description: "Add your leads and clients, then connect projects to the right client relationships. Track status, priority, and timelines in one place.",
    details: [
      "Lead capture and qualification",
      "Lead-to-client conversion",
      "Project creation linked to clients",
    ],
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Manage work in context",
    description: "Keep project details organized and build toward a connected delivery workflow. AI-assisted brief analysis and task planning are coming next.",
    details: [
      "Project dashboard with metrics",
      "Activity timeline",
      "AI Intelligence (planned)",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl text-center mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Get your agency organized in three steps.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            From empty workspace to connected operations — no complicated setup required.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className="relative flex flex-col gap-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 lg:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="shrink-0 text-4xl font-semibold tracking-[-0.04em] text-[var(--accent)]/30">
                  {step.number}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                      <step.icon size={22} strokeWidth={1.8} />
                    </span>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-base leading-7 text-[var(--muted)]">{step.description}</p>
                </div>
              </div>

              <ul className="space-y-3 pt-4 border-t border-[var(--line)]" role="list">
                {step.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start gap-3">
                    <CheckCheck size={18} className="mt-0.5 shrink-0 text-[var(--success)]" strokeWidth={2.5} />
                    <span className="text-sm leading-6 text-[var(--muted)]">{detail}</span>
                  </li>
                ))}
              </ul>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-linear-to-r from-[var(--accent)]/30 to-transparent" aria-hidden="true" />
              )}
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}