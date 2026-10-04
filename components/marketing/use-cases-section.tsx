"use client";

import { BriefcaseBusiness, Code, Layers, Users } from "lucide-react";

const useCases = [
  {
    icon: BriefcaseBusiness,
    title: "Digital agencies",
    description: "Keep multiple client relationships and project engagements organized in one workspace — from lead capture through delivery.",
  },
  {
    icon: Users,
    title: "Freelancers",
    description: "Manage prospects, clients, and project context without building a complicated operating system.",
  },
  {
    icon: Layers,
    title: "Small service businesses",
    description: "Bring customer relationships and ongoing work into a consistent, repeatable workflow.",
  },
  {
    icon: Code,
    title: "Boutique studios & consultants",
    description: "Keep project requirements, client context, and delivery work connected as you scale.",
  },
];

export function UseCasesSection() {
  return (
    <section id="for-agencies" className="py-20 lg:py-28 px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl text-center mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Built for teams that deliver client work.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            BusinessFlow AI is designed for agencies, freelancers, and small service teams that manage ongoing client engagements.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase, index) => (
            <article
              key={index}
              className="relative flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 transition-colors hover:border-[var(--line-strong)]"
            >
              <span className="grid size-11 place-items-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
                <useCase.icon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{useCase.title}</h3>
              <p className="text-base leading-7 text-[var(--muted)]">{useCase.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}