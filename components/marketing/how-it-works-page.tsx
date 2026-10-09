"use client";

import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Sparkles,
  Target,
  Users,
  CheckCheck,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  LeadsListMockup,
  LeadConvertMockup,
  ProjectCreateMockup,
  BriefEditorMockup,
  AIAnalysisMockup,
  TaskApprovalMockup,
  TaskBoardMockup,
  SearchAssistantMockup,
} from "@/components/marketing/workspace-mockups";

const steps = [
  {
    number: "01",
    icon: Target,
    title: "Capture the Lead",
    description: "Add new opportunities with custom stages, source tracking, and all the context you need to qualify them effectively.",
    details: [
      "Create leads with custom status stages",
      "Track lead source and initial context",
      "Preserve sales notes and communication history",
      "Move leads through your qualification process",
    ],
    Mockup: LeadsListMockup,
  },
  {
    number: "02",
    icon: Users,
    title: "Convert to Client",
    description: "When a prospect becomes a customer, convert the lead to a client — preserving all original context and creating a relationship record.",
    details: [
      "One-click lead-to-client conversion",
      "Original lead record preserved for reference",
      "Client profile with contact details and history",
      "Relationship timeline starts automatically",
    ],
    Mockup: LeadConvertMockup,
  },
  {
    number: "03",
    icon: FolderKanban,
    title: "Create the Project",
    description: "Establish a clear home for the engagement. Link the project to the client, set status, priority, timeline, and team visibility.",
    details: [
      "Projects connected to client relationships",
      "Status, priority, and due date tracking",
      "Project dashboard with metrics and activity",
      "Team members see relevant project context",
    ],
    Mockup: ProjectCreateMockup,
  },
  {
    number: "04",
    icon: FileText,
    title: "Add the Brief",
    description: "Document project requirements, objectives, and key information in a structured brief. Attach files and reference materials.",
    details: [
      "Rich text briefs with structured sections",
      "File attachments and external references",
      "Version history for brief evolution",
      "Foundation for AI intelligence analysis",
    ],
    Mockup: BriefEditorMockup,
  },
  {
    number: "05",
    icon: Sparkles,
    title: "Analyze with AI",
    description: "Run AI Project Intelligence on the brief to surface requirements, identify risks, detect gaps, and generate suggested tasks.",
    details: [
      "Requirements extracted from brief content",
      "Risks and dependencies identified",
      "Missing information flagged proactively",
      "Suggested task breakdown with context",
    ],
    Mockup: AIAnalysisMockup,
  },
  {
    number: "06",
    icon: CheckCheck,
    title: "Review & Approve Tasks",
    description: "Review each AI-suggested task in context. Approve, modify, or reject — only approved tasks become real work in your project.",
    details: [
      "Dedicated review queue for AI suggestions",
      "Full context: linked requirements and risks",
      "Modify tasks before approval",
      "Approved tasks enter standard workflow",
    ],
    Mockup: TaskApprovalMockup,
  },
  {
    number: "07",
    icon: FolderKanban,
    title: "Execute the Project",
    description: "Manage tasks, track progress, and maintain visibility. All work stays connected to the project, client, and original brief context.",
    details: [
      "Task status, priority, and assignment tracking",
      "Activity timeline for every task and project",
      "Search across projects, tasks, and documents",
      "Context preserved from lead through delivery",
    ],
    Mockup: TaskBoardMockup,
  },
  {
    number: "08",
    icon: ArrowRight,
    title: "Stay Oriented",
    description: "Use global search, activity feeds, and the AI Assistant to find information, understand what changed, and ask questions about your work.",
    details: [
      "Global search across all workspace content",
      "Real-time activity feed per project and workspace",
      "AI Assistant answers questions using workspace context",
      "Quick navigation between related items",
    ],
    Mockup: SearchAssistantMockup,
  },
];

export function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
            <Sparkles size={14} />
            How It Works
          </span>
          <h1 className="mt-4 text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
            From prospect to delivery in eight steps.
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl leading-8 text-[var(--muted)]">
            BusinessFlow AI connects the entire operational workflow — so context flows naturally from lead capture through project delivery.
          </p>
        </div>
      </section>

      <div className="flex-1">
        {steps.map((step, index) => (
          <article
            key={step.number}
            className={`py-16 lg:py-24 px-6 lg:px-10 ${index % 2 === 0 ? "bg-[var(--background)]" : "bg-[var(--surface)]"} border-t border-[var(--line)]`}
          >
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                {index % 2 === 0 ? (
                  <>
                    <div>
                      <span className="text-4xl font-semibold tracking-[-0.04em] text-[var(--accent)]/30">{step.number}</span>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="grid size-12 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                          <step.icon size={24} strokeWidth={1.8} />
                        </span>
                        <h2 className="text-3xl md:text-4xl font-semibold leading-[1.1] text-[var(--foreground)]">{step.title}</h2>
                      </div>
                      <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{step.description}</p>
                      <ul className="mt-8 space-y-4" role="list">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-3">
                            <span className="mt-0.5 shrink-0 grid size-5 place-items-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                              <CheckCheck size={14} strokeWidth={2.5} />
                            </span>
                            <span className="text-base leading-7 text-[var(--muted)]">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <step.Mockup className="w-full" />
                  </>
                ) : (
                  <>
                    <step.Mockup className="w-full" />
                    <div>
                      <span className="text-4xl font-semibold tracking-[-0.04em] text-[var(--accent)]/30">{step.number}</span>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="grid size-12 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                          <step.icon size={24} strokeWidth={1.8} />
                        </span>
                        <h2 className="text-3xl md:text-4xl font-semibold leading-[1.1] text-[var(--foreground)]">{step.title}</h2>
                      </div>
                      <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{step.description}</p>
                      <ul className="mt-8 space-y-4" role="list">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-3">
                            <span className="mt-0.5 shrink-0 grid size-5 place-items-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                              <CheckCheck size={14} strokeWidth={2.5} />
                            </span>
                            <span className="text-base leading-7 text-[var(--muted)]">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Ready to see it in action?
          </h2>
          <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
            Create your workspace and start connecting your client work today.
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