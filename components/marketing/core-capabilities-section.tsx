"use client";

import {
  FileText,
  FolderKanban,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const capabilities = [
  {
    icon: Target,
    title: "Lead Management",
    description: "Organize prospective clients, track lead status through custom stages, and preserve sales context from first contact to conversion.",
    available: true,
    href: "/leads",
  },
  {
    icon: Users,
    title: "Client Management",
    description: "Keep client details, contact information, and relationship history organized in one place — connected to their originating leads.",
    available: true,
    href: "/clients",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    description: "Connect projects to the clients they serve. Track status, priority, timelines, and progress with a clear project overview.",
    available: true,
    href: "/projects",
  },
  {
    icon: FileText,
    title: "Project Briefs",
    description: "Attach and organize project requirements, objectives, and key documents directly on each project for easy reference.",
    available: false,
    badge: "Planned",
  },
  {
    icon: Sparkles,
    title: "AI Project Intelligence",
    description: "Analyze project briefs to surface summaries, extract requirements, identify missing information, and suggest next steps — with human review before action.",
    available: false,
    badge: "Planned",
  },
  {
    icon: Workflow,
    title: "Connected Workspace",
    description: "Keep core business information — leads, clients, projects, and activity — organized within an organization-specific workspace.",
    available: true,
  },
];

export function CoreCapabilitiesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl text-center mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Core capabilities for agency operations.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Focused features that connect your client acquisition and delivery workflows.
            Planned capabilities are clearly labeled.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability, index) => (
            <article
              key={index}
              className={cn(
                "relative flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 transition-colors hover:border-[var(--line-strong)]",
                !capability.available && "opacity-70"
              )}
            >
              <div className="flex items-start gap-4">
                <span className="mt-0.5 shrink-0 grid size-11 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                  <capability.icon size={22} strokeWidth={1.8} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">{capability.title}</h3>
                    {capability.badge && (
                      <span className="rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--warning)]">
                        {capability.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base leading-7 text-[var(--muted)]">{capability.description}</p>
                </div>
              </div>

            
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}