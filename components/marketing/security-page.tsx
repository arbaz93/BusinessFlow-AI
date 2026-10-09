"use client";

import { Lock, Server, Shield, UserCheck, FileLock2, Database, Key, CheckCheck, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const securitySections = [
  {
    icon: Database,
    title: "Workspace Isolation",
    description: "Each organization operates within its own authorized business context. Data never crosses workspace boundaries.",
    details: [
      "Database-level row-level security enforces workspace boundaries",
      "Organization membership required for all data access",
      "No shared tables or cross-workspace queries",
      "Workspace switching requires explicit user action",
    ],
  },
  {
    icon: Server,
    title: "Server-Side Authorization",
    description: "Sensitive operations are enforced on the server — not just hidden in the UI. Every request is validated against workspace membership.",
    details: [
      "All mutations validated server-side before execution",
      "API routes check organization membership on every request",
      "No client-side permission bypassing possible",
      "Authorization logic co-located with data operations",
    ],
  },
  {
    icon: FileLock2,
    title: "Private Documents",
    description: "Project documents and briefs remain in private storage, accessed only through controlled, authenticated authorization.",
    details: [
      "Documents stored in private Supabase storage buckets",
      "Signed URLs with short expiration for access",
      "Access requires workspace membership and project permissions",
      "No public URLs or direct file access",
    ],
  },
  {
    icon: Shield,
    title: "AI Boundaries",
    description: "AI receives controlled BusinessFlow context and cannot independently redefine application permissions or take autonomous actions.",
    details: [
      "AI context limited to explicitly provided project data",
      "No access to workspace-wide data or other projects",
      "AI cannot create, modify, or delete workspace data",
      "All AI-suggested actions require human approval",
    ],
  },
  {
    icon: UserCheck,
    title: "Human Approval for AI Tasks",
    description: "AI-suggested tasks require explicit human review and approval before entering the workspace as real work items.",
    details: [
      "Suggested tasks appear in a dedicated review queue",
      "Full context shown: requirements, risks, source brief sections",
      "Approve, modify, or reject each suggestion individually",
      "Approved tasks carry audit trail of AI origin",
    ],
  },
  {
    icon: Key,
    title: "Authentication & Session Security",
    description: "Secure authentication with email confirmation, password reset, and session management built on Supabase Auth.",
    details: [
      "Email confirmation required for account creation",
      "Secure password reset with time-limited tokens",
      "HttpOnly cookies for session management",
      "Automatic session refresh and secure logout",
    ],
  },
];

const operationalDiscipline = [
  {
    title: "Migration Discipline",
    description: "Database changes follow a structured migration process with rollback procedures and production deployment safeguards.",
  },
  {
    title: "Recovery Procedures",
    description: "Documented recovery runbooks for database, authentication, and service disruptions with tested restore procedures.",
  },
  {
    title: "Production Configuration",
    description: "Environment validation, health checks, and deployment verification ensure consistent production behavior.",
  },
];

export function SecurityPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
            <Lock size={14} />
            Security
          </span>
          <h1 className="mt-4 text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
            Security built into the foundation.
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl leading-8 text-[var(--muted)]">
            BusinessFlow AI embeds security at every layer — from database isolation to AI boundaries.
            These are implemented capabilities, not aspirational claims.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {securitySections.map((section, index) => (
              <article key={section.title} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 lg:p-8">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 grid size-12 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                    <section.icon size={24} strokeWidth={1.8} />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">{section.title}</h2>
                    <p className="mt-2 text-base leading-7 text-[var(--muted)]">{section.description}</p>
                    <ul className="mt-6 space-y-3" role="list">
                      {section.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-3">
                          <span className="mt-0.5 shrink-0 grid size-5 place-items-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                            <CheckCheck size={12} strokeWidth={2.5} />
                          </span>
                          <span className="text-sm leading-6 text-[var(--muted)]">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl text-center mx-auto">
            <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
              Operational discipline.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Security extends beyond code to how we build, deploy, and operate the platform.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {operationalDiscipline.map((item, index) => (
              <article key={item.title} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 transition-colors hover:border-[var(--line-strong)]">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-2 text-base leading-7 text-[var(--muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            What we don&apos;t claim (yet).
          </h2>
          <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
            We believe in honest marketing. BusinessFlow AI does not currently have:
          </p>
          <ul className="mt-8 space-y-3 text-left max-w-xl mx-auto" role="list">
            {[
              "SOC 2, ISO 27001, or other formal certifications",
              "Third-party penetration test reports",
              "Bug bounty program",
              "HIPAA or GDPR compliance attestation",
              "Data processing agreements (DPAs) for enterprise",
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-[var(--muted)]">
                <span className="mt-0.5 shrink-0 grid size-5 place-items-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
                  <X size={12} strokeWidth={2.5} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-[var(--muted-foreground)]">
            As the product matures, we will pursue relevant certifications and publish verified artifacts.
            This page will be updated to reflect verified capabilities.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Ready to get started?
          </h2>
          <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
            Create your workspace and see how BusinessFlow AI keeps your client work secure and connected.
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