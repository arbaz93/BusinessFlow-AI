"use client";

import Link from "next/link";
import {
  CheckCheck,
  Target,
  Users,
  FolderKanban,
  FileText,
  Sparkles,
  Workflow,
  Shield,
  ChevronRight,
} from "lucide-react";
import {
  FeatureLeadPreview,
  FeatureClientPreview,
  FeatureProjectPreview,
  FeatureBriefsPreview,
  FeatureAIIntelligencePreview,
  FeatureTasksPreview,
  FeatureWorkspacePreview,
  FeatureSecurityPreview,
  FeatureAssistantPreview,
  FeatureSearchActivityPreview,
} from "@/components/marketing/feature-visuals";

const features = [
  {
    id: "leads",
    icon: Target,
    title: "Lead Management",
    description:
      "Organize prospective clients, track lead status through custom stages, and preserve sales context from first contact to conversion.",
    details: [
      "Custom lead stages tailored to your sales process",
      "Lead-to-client conversion with context preservation",
      "Source tracking and lead scoring",
      "Activity timeline for every lead",
    ],
    Visual: FeatureLeadPreview,
  },
  {
    id: "clients",
    icon: Users,
    title: "Client Management",
    description:
      "Keep client details, contact information, and relationship history organized in one place — connected to their originating leads.",
    details: [
      "Centralized client profiles with contact details",
      "Relationship history and communication log",
      "View all projects for a client at a glance",
      "Lead origin preserved after conversion",
    ],
    Visual: FeatureClientPreview,
  },
  {
    id: "projects",
    icon: FolderKanban,
    title: "Project Management",
    description:
      "Connect projects to the clients they serve. Track status, priority, timelines, and progress with a clear project overview.",
    details: [
      "Projects linked to client relationships",
      "Status, priority, and timeline tracking",
      "Project dashboard with key metrics",
      "Team visibility into active work",
    ],
    Visual: FeatureProjectPreview,
  },
  {
    id: "briefs",
    icon: FileText,
    title: "Project Briefs",
    description:
      "Attach and organize project requirements, objectives, and key documents directly on each project for easy reference.",
    details: [
      "Rich text briefs with structured sections",
      "File attachments and document references",
      "Version history for brief changes",
      "Connected to AI intelligence analysis",
    ],
    Visual: FeatureBriefsPreview,
  },
  {
    id: "ai-intelligence",
    icon: Sparkles,
    title: "AI Project Intelligence",
    description:
      "Analyze project briefs to surface summaries, extract requirements, identify missing information, and suggest next steps — with human review before action.",
    details: [
      "Requirements extraction from briefs",
      "Risk identification and gap detection",
      "Suggested task breakdown with context",
      "Human approval required for every task",
    ],
    Visual: FeatureAIIntelligencePreview,
  },
  {
    id: "tasks",
    icon: CheckCheck,
    title: "Task Management",
    description:
      "Turn approved AI suggestions and manual input into trackable tasks with status, priority, assignees, and project context.",
    details: [
      "Tasks connected to projects and briefs",
      "Status, priority, and assignment tracking",
      "Activity timeline per task",
      "AI-suggested tasks clearly marked",
    ],
    Visual: FeatureTasksPreview,
  },
  {
    id: "workspace",
    icon: Workflow,
    title: "Connected Workspace",
    description:
      "Keep core business information — leads, clients, projects, tasks, and activity — organized within an organization-specific workspace.",
    details: [
      "Organization-level data isolation",
      "Team member roles and permissions",
      "Cross-project search and activity feed",
      "Workspace switching for multi-org users",
    ],
    Visual: FeatureWorkspacePreview,
  },
  {
    id: "security",
    icon: Shield,
    title: "Security Architecture",
    description:
      "Server-side authorization, private document storage, and human-in-the-loop AI controls built into the foundation.",
    details: [
      "Workspace isolation enforced at the database level",
      "Server-side authorization on every mutation",
      "Private document storage with controlled access",
      "AI operates within controlled context boundaries",
    ],
    Visual: FeatureSecurityPreview,
  },
  {
    id: "assistant",
    icon: Sparkles,
    title: "AI Assistant",
    description:
      "Ask questions about your workspace and get contextual answers — from project status to task details and document lookups.",
    details: [
      "Workspace-aware conversational interface",
      "Answers questions using project context",
      "Finds information across all workspace data",
      "Reduces context switching for common queries",
    ],
    Visual: FeatureAssistantPreview,
  },
  {
    id: "search-activity",
    icon: Workflow,
    title: "Search & Activity",
    description:
      "Find anything across your workspace instantly and stay informed with a real-time activity feed of all changes.",
    details: [
      "Global search across projects, tasks, documents, and clients",
      "Real-time activity feed per project and workspace",
      "Quick navigation between related items",
      "Keyboard shortcut for instant access",
    ],
    Visual: FeatureSearchActivityPreview,
  },
];

function FeatureDetail({ feature }: { feature: typeof features[0] }) {
  const isEvenIndex = features.findIndex(f => f.id === feature.id) % 2 === 0;

  return (
    <article
      id={feature.id}
      className={`py-16 lg:py-24 px-6 lg:px-10 border-t border-[var(--line)] ${isEvenIndex ? "bg-[var(--background)]" : "bg-[var(--surface)]"}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {isEvenIndex ? (
            <>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
                  <feature.icon size={14} />
                  Feature
                </span>
                <h2 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
                  {feature.title}
                </h2>
                <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
                  {feature.description}
                </p>
                <ul className="mt-8 space-y-4" role="list">
                  {feature.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 grid size-5 place-items-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                        <CheckCheck size={14} strokeWidth={2.5} />
                      </span>
                      <span className="text-base leading-7 text-[var(--muted)]">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <feature.Visual className="w-full" />
            </>
          ) : (
            <>
              <feature.Visual className="w-full" />
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
                  <feature.icon size={14} />
                  Feature
                </span>
                <h2 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
                  {feature.title}
                </h2>
                <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
                  {feature.description}
                </p>
                <ul className="mt-8 space-y-4" role="list">
                  {feature.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-3">
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
  );
}

export function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
            Features that connect your workflow.
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl leading-8 text-[var(--muted)]">
            BusinessFlow AI provides focused capabilities for agency operations — from the first lead to project delivery.
            Every feature is designed to keep context connected across your work.
          </p>
        </div>
      </section>

      <nav className="border-y border-[var(--line)] bg-[var(--surface)] px-6 lg:px-10" aria-label="Feature navigation">
        <div className="mx-auto max-w-7xl py-4 flex flex-wrap gap-2 justify-center">
          {features.map((feature) => (
            <Link
              key={feature.id}
              href={`#${feature.id}`}
              className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--panel)]"
            >
              {feature.title}
            </Link>
          ))}
        </div>
      </nav>

      <div className="flex-1">
        {features.map((feature) => (
          <FeatureDetail key={feature.id} feature={feature} />
        ))}
      </div>

      <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Ready to connect your operations?
          </h2>
          <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
            Set up your workspace and start organizing your client work in minutes.
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