"use client";

import { BriefcaseBusiness, Code, Layers, Users, Target, FileText, FolderKanban, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

const solutions = [
  {
    icon: BriefcaseBusiness,
    title: "Digital Agencies",
    description: "Manage multiple clients and active projects without losing operational context.",
    challenges: [
      "Juggling multiple client relationships simultaneously",
      "Keeping project details organized across engagements",
      "Maintaining context when handing off between team members",
      "Tracking lead pipeline alongside active delivery",
    ],
    howItHelps: [
      "Leads, clients, and projects connected in one workspace",
      "Client-specific project views with full context",
      "Activity timelines preserve handoff context",
      "Pipeline visibility alongside delivery work",
    ],
    keyFeatures: ["Lead Management", "Client Management", "Project Management", "Activity Timeline"],
  },
  {
    icon: Users,
    title: "Freelancers",
    description: "Manage prospects, clients, and project context without building a complicated operating system.",
    challenges: [
      "Tracking prospects without a heavy CRM",
      "Keeping client work organized and accessible",
      "Maintaining project context between engagements",
      "Balancing administrative work with delivery",
    ],
    howItHelps: [
      "Lightweight lead tracking with custom stages",
      "Simple client profiles connected to projects",
      "Project briefs keep requirements accessible",
      "AI intelligence reduces planning overhead",
    ],
    keyFeatures: ["Lead Management", "Client Management", "Project Briefs", "AI Project Intelligence"],
  },
  {
    icon: Layers,
    title: "Small Service Businesses",
    description: "Bring customer relationships and ongoing work into a consistent, repeatable workflow.",
    challenges: [
      "Customer information scattered across tools",
      "Project details hard to find when needed",
      "Inconsistent process across engagements",
      "Difficulty scaling operations",
    ],
    howItHelps: [
      "Centralized customer and project workspace",
      "Structured briefs standardize project setup",
      "Connected workflow from lead to delivery",
      "Team collaboration with clear context",
    ],
    keyFeatures: ["Lead Management", "Client Management", "Project Management", "Connected Workspace"],
  },
  {
    icon: Code,
    title: "Boutique Studios & Consultants",
    description: "Keep project requirements, client context, and delivery work connected as you scale.",
    challenges: [
      "Complex project requirements need structure",
      "Client context critical for quality delivery",
      "Team growth requires better knowledge sharing",
      "AI assistance without losing control",
    ],
    howItHelps: [
      "Detailed briefs capture complex requirements",
      "Client context preserved at every step",
      "AI intelligence with human approval",
      "Search and activity keep team aligned",
    ],
    keyFeatures: ["Project Briefs", "AI Project Intelligence", "Human Control", "Search & Activity"],
  },
];

function SolutionCard({ solution }: { solution: typeof solutions[0] }) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 lg:p-8 transition-colors hover:border-[var(--line-strong)]">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 shrink-0 grid size-11 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
          <solution.icon size={22} strokeWidth={1.8} />
        </span>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-[var(--foreground)]">{solution.title}</h3>
          <p className="mt-2 text-base leading-7 text-[var(--muted)]">{solution.description}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Common challenges</h4>
          <ul className="mt-4 space-y-2" role="list">
            {solution.challenges.map((challenge, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                <span className="mt-0.5 shrink-0 size-1.5 rounded-full bg-[var(--muted-foreground)]" aria-hidden="true" />
                {challenge}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">How BusinessFlow helps</h4>
          <ul className="mt-4 space-y-2" role="list">
            {solution.howItHelps.map((help, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                <span className="mt-0.5 shrink-0 grid size-5 place-items-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                  <CheckCheck size={12} strokeWidth={2.5} />
                </span>
                {help}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {solution.keyFeatures.map((feature, index) => (
          <span
            key={index}
            className="inline-flex rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]"
          >
            {feature}
          </span>
        ))}
      </div>
    </article>
  );
}

import { CheckCheck } from "lucide-react";

export function SolutionsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
            <Target size={14} />
            Solutions
          </span>
          <h1 className="mt-4 text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
            Built for teams that deliver client work.
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl leading-8 text-[var(--muted)]">
            BusinessFlow AI is designed for agencies, freelancers, consultants, and small service teams that manage ongoing client engagements.
            See how it fits your workflow.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {solutions.map((solution) => (
              <SolutionCard key={solution.title} solution={solution} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl text-center mx-auto">
            <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
              The same connected workflow for every team.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Whether you&apos;re a solo freelancer or a growing agency, BusinessFlow AI provides the same core workflow:
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { icon: Target, label: "Leads", desc: "Capture & qualify" },
              { icon: Users, label: "Clients", desc: "Relationships" },
              { icon: FolderKanban, label: "Projects", desc: "Engagements" },
              { icon: FileText, label: "Briefs", desc: "Requirements" },
              { icon: Sparkles, label: "AI Intel", desc: "Analysis & tasks" },
              { icon: CheckCheck, label: "Delivery", desc: "Execute & track" },
            ].map((step, index) => (
              <div key={index} className="relative flex flex-col items-center gap-3 text-center p-4">
                <span className="grid size-12 place-items-center rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--accent)]">
                  <step.icon size={22} strokeWidth={1.8} />
                </span>
                <h3 className="font-semibold text-[var(--foreground)]">{step.label}</h3>
                <p className="text-sm text-[var(--muted)]">{step.desc}</p>
                {index < 5 && (
                  <span className="absolute top-[50%] -mt-px -right-3 w-6 h-0.5 bg-gradient-to-r from-[var(--accent)]/30 to-transparent lg:block hidden" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Start organizing your client work today.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
            Set up your workspace in minutes. No credit card required.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 bg-[var(--accent)] text-white hover:opacity-80 h-11 px-6 group"
            >
              Get Started
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--panel)] h-11 px-6"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}