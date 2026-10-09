"use client";

import { FileText, Shield, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const aiCapabilities = [
  {
    icon: Target,
    title: "Requirements Extraction",
    description: "AI reads your project briefs and documents to identify explicit and implicit requirements, deliverables, and acceptance criteria.",
  },
  {
    icon: FileText,
    title: "Risk Identification",
    description: "Surface potential risks, dependencies, and gaps before work begins — so your team can plan mitigation proactively.",
  },
  {
    icon: Shield,
    title: "Missing Information Detection",
    description: "Flag what's not in the brief: undefined scope, missing assets, unclear timelines, or ambiguous success criteria.",
  },
  {
    icon: Sparkles,
    title: "Suggested Task Breakdown",
    description: "Receive a structured task list derived from the brief — each with context, priority, and suggested ownership.",
  },
];

const workflowSteps = [
  "Upload or write your project brief in BusinessFlow.",
  "AI analyzes the content in the context of the project and client.",
  "Review the AI-generated analysis: requirements, risks, gaps, and suggested tasks.",
  "Approve, modify, or reject each suggested task before it enters your workspace.",
  "Approved tasks become real, trackable work items connected to the project.",
];

export function AIProjectIntelligenceSection() {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl text-center mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
            <Sparkles size={14} />
            AI Project Intelligence
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Turn project briefs into structured operational insight.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            BusinessFlow AI analyzes your project documents to surface requirements, risks, missing information, and suggested tasks — all before work begins.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {workflowSteps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-sm">
                  {index + 1}
                </span>
                <p className="mt-1 text-base leading-7 text-[var(--muted)]">{step}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 lg:p-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                <Sparkles size={16} strokeWidth={2} />
              </span>
              What the AI analyzes
            </h3>
            <div className="mt-6 space-y-4">
              {aiCapabilities.map((cap, index) => (
                <div key={index} className="flex gap-4">
                  <span className="mt-0.5 shrink-0 grid size-11 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                    <cap.icon size={22} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">{cap.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-base leading-7 text-[var(--muted)] max-w-2xl mx-auto">
            AI Project Intelligence works from your actual project context — not generic templates.
            Every analysis is grounded in the briefs, documents, and client information already in your workspace.
          </p>
        </div>
      </div>
    </section>
  );
}