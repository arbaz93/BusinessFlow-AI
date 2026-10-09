"use client";

import { Check, Sparkles, UserCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

const controlPrinciples = [
  {
    icon: UserCheck,
    title: "AI Suggests, Humans Decide",
    description: "AI-generated tasks never enter your workspace automatically. Every suggestion requires explicit human review and approval before becoming real work.",
  },
  {
    icon: Check,
    title: "Approval Before Action",
    description: "Suggested tasks appear in a dedicated review queue. You can approve, modify, or reject each one — maintaining full control over what becomes actionable work.",
  },
  {
    icon: Sparkles,
    title: "Context Preserved",
    description: "Approved tasks carry the full context from the AI analysis: linked requirements, identified risks, and the original brief section that generated them.",
  },
  {
    icon: X,
    title: "No Autonomous Execution",
    description: "BusinessFlow AI does not create, assign, or complete work on its own. It provides structured intelligence; your team owns the decisions and the delivery.",
  },
];

const reviewFlow = [
  { step: "AI analyzes brief", description: "Reads project documents and extracts structured intelligence." },
  { step: "Suggestions generated", description: "Requirements, risks, gaps, and proposed tasks are surfaced." },
  { step: "Human reviews", description: "Team reviews each suggested task in context." },
  { step: "Human approves", description: "Approved tasks become real work items in the project." },
  { step: "Delivery continues", description: "Tasks enter the same workflow as manually created work." },
];

export function HumanControlSection() {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl text-center mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
            <UserCheck size={14} />
            Human Control
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            AI provides intelligence. Your team owns the decisions.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            BusinessFlow AI is designed with a clear boundary: it analyzes and suggests, but never acts autonomously. Every AI-generated task requires human approval.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {reviewFlow.map((flow, index) => (
              <div key={index} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-sm">
                    {index + 1}
                  </span>
                  {index < reviewFlow.length - 1 && (
                    <span className="absolute top-10 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[var(--accent)]/30 to-transparent" aria-hidden="true" />
                  )}
                </div>
                <div className="mt-1 flex-1">
                  <h4 className="font-semibold text-[var(--foreground)]">{flow.step}</h4>
                  <p className="mt-0.5 text-sm leading-6 text-[var(--muted)]">{flow.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {controlPrinciples.map((principle, index) => (
              <div key={index} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 transition-colors hover:border-[var(--line-strong)]">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 grid size-11 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                    <principle.icon size={22} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">{principle.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{principle.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}