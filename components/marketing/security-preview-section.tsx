"use client";

import Link from "next/link";
import { ArrowRight, Check, Lock, Server, Shield, UserCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const securityFeatures = [
  {
    icon: Shield,
    title: "Workspace Isolation",
    description: "Each organization operates within its own authorized business context. Data never crosses workspace boundaries.",
  },
  {
    icon: Server,
    title: "Server-Side Authorization",
    description: "Sensitive operations are enforced on the server — not just hidden in the UI. Every request is validated against workspace membership.",
  },
  {
    icon: Lock,
    title: "Private Documents",
    description: "Project documents and briefs remain in private storage, accessed only through controlled, authenticated authorization.",
  },
  {
    icon: UserCheck,
    title: "Human Approval for AI Tasks",
    description: "AI-suggested tasks require explicit human review and approval before entering the workspace as real work items.",
  },
];

export function SecurityPreviewSection() {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl text-center mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
            <Shield size={14} />
            Security & Trust
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Built on a foundation of operational discipline.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Security isn&apos;t a feature checkbox &mdash; it&apos;s embedded in how BusinessFlow handles data, authorization, and AI boundaries.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {securityFeatures.map((feature, index) => (
            <article
              key={index}
              className="relative flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 transition-colors hover:border-[var(--line-strong)]"
            >
              <div className="flex items-start gap-4">
                <span className="mt-0.5 shrink-0 grid size-11 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                  <feature.icon size={22} strokeWidth={1.8} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{feature.title}</h3>
                  <p className="mt-2 text-base leading-7 text-[var(--muted)]">{feature.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-base leading-7 text-[var(--muted)] max-w-2xl mx-auto mb-6">
            These are implemented capabilities — not aspirational claims. See the full security architecture and operational safeguards.
          </p>
          <Link
            href="/security"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-[var(--line)] bg-transparent hover:bg-[var(--surface)] group"
            )}
          >
            View Security Details
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}