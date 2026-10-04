"use client";

import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const workflowSteps = [
  {
    icon: Target,
    title: "Lead",
    description: "Capture and organize potential client opportunities.",
    href: "/leads",
  },
  {
    icon: Users,
    title: "Client",
    description: "Keep contact details and relationship context together.",
    href: "/clients",
  },
  {
    icon: FolderKanban,
    title: "Project",
    description: "Create a clear home for each client engagement.",
    href: "/projects",
  },
  {
    icon: FileText,
    title: "Brief",
    description: "Keep project objectives and requirements organized.",
    href: "#",
    disabled: true,
  },
  {
    icon: Sparkles,
    title: "AI Intelligence",
    description: "Analyze project info to surface requirements, risks, and suggested tasks.",
    href: "#",
    disabled: true,
    badge: "Planned",
  },
  {
    icon: BriefcaseBusiness,
    title: "Delivery",
    description: "Keep project context and progress connected as work moves forward.",
    href: "#",
    disabled: true,
  },
];

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl text-center mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            A connected flow from prospect to delivery.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Move from an initial inquiry to organized client work with each step connected to the next.
          </p>
        </div>

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" aria-hidden="true" />

          <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-0">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className={cn(
                  "relative flex flex-col items-center gap-4 w-full lg:w-auto",
                  index < workflowSteps.length - 1 && "lg:pr-4"
                )}
              >
                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                  <span className="grid size-14 place-items-center rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--accent)]">
                    <step.icon size={24} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">{step.title}</h3>
                    {step.badge && (
                      <span className="mt-1 inline-flex rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <p className="max-w-xs text-sm leading-6 text-[var(--muted)]">{step.description}</p>

                </div>

                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-1/2 h-0.5 bg-gradient-to-r from-[var(--accent)]/30 to-transparent" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 lg:hidden">
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x" role="region" aria-label="Workflow steps">
            {workflowSteps.map((step) => (
              <div
                key={step.title}
                className="flex min-w-[280px] max-w-[300px] shrink-0 flex-col items-center gap-4 snap-center p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] text-center"
              >
                <span className="grid size-12 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--accent)]">
                  <step.icon size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{step.title}</h3>
                  {step.badge && (
                    <span className="mt-1 inline-flex rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
                      {step.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-6 text-[var(--muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}