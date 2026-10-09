"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, FolderKanban, Sparkles, Users, BriefcaseBusiness, MoveRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const projectData = [
  { name: "Website Redesign", client: "PixelForge Studio", status: "In Progress", priority: "High", due: "Sep 15" },
  { name: "Brand Identity", client: "Northstar Coffee", status: "Planning", priority: "Medium", due: "Oct 3" },
  { name: "Mobile App UI", client: "BrightPath Consulting", status: "On Hold", priority: "Low", due: "—" },
];

const metricData = [
  { label: "Total Leads", value: "24", note: "Across all stages", icon: Users, tone: "bg-[var(--accent)]/10 text-[var(--accent)]" },
  { label: "Active Clients", value: "8", note: "Active relationships", icon: BriefcaseBusiness, tone: "bg-[var(--info-surface)] text-[#3b82f6]" },
  { label: "Active Projects", value: "5", note: "In delivery", icon: FolderKanban, tone: "bg-[var(--success-surface)] text-[#22c55e]" },
  { label: "Overdue Projects", value: "1", note: "Past due", icon: Sparkles, tone: "bg-[#ef4444]/10 text-[#ef4444]" },
];

function MetricCard({ label, value, note, icon: Icon, tone }: typeof metricData[0]) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
        <span className={`grid size-8 place-items-center rounded-md border border-[var(--line)] ${tone}`}>
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[22px] font-semibold leading-none tracking-[-0.05em] text-[var(--foreground)]">{value}</p>
        <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">{note}</p>
      </div>
    </div>
  );
}

function ProjectRow({ name, client, status, priority, due }: typeof projectData[0]) {
  const statusTone = {
    "In Progress": "border-[var(--info-border)]/25 bg-[var(--info-surface)] text-[var(--info-line)]",
    "Planning": "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent-muted)]",
    "On Hold": "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]",
  };
  const priorityTone = {
    "High": "border-[var(--danger-border)]/20 bg-[#ef4444]/10 text-[#fca5a5]",
    "Medium": "border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#fbbf24]",
    "Low": "border-[#3b82f6]/20 bg-[var(--info-surface)] text-[var(--info-line)]",
  };

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 hover:border-[var(--line-strong)] transition-colors">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {name}
          </p>
          <p className="text-[12px] text-[var(--muted-foreground)]">{client}</p>
        </div>

        <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--muted-foreground)] md:min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone[status as keyof typeof statusTone] || "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]/60"}`}
            >
              {status}
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityTone[priority as keyof typeof priorityTone] || "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]/60"}`}
            >
              {priority}
            </span>
          </div>
          <span>Due {due}</span>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex flex-col mx-auto max-w-7xl px-6 py-20 lg:py-28 lg:px-10">
      <div className="w-full text-center lg:text-left lg:max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium text-[var(--accent)]">
          <Sparkles size={14} />
          New: Lead<MoveRight style={{width: '1rem'}} /> Client<MoveRight style={{width: '1rem'}} /> Project workflow now live
        </span>
        <h1 className="mt-6 max-w-4xl text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
          From first lead to final delivery.{" "}
          <br />
          <span className="text-[var(--accent)]">One connected workspace.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl leading-8 text-[var(--muted)]">
          BusinessFlow AI helps agencies organize leads, manage client relationships, run projects, and turn project information into actionable work — all in one connected workspace.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "group"
            )}
          >
            Get Started
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href="/how-it-works"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-[var(--line)] bg-transparent hover:bg-[var(--surface)]"
            )}
          >
            See How It Works
          </Link>
        </div>
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          Built for digital agencies, freelancers, and small service teams.
        </p>
      </div>

      <div className="mt-12 w-full" aria-label="BusinessFlow AI workspace preview">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--line)]">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-[var(--line-strong)]" />
              <div className="size-3 rounded-full bg-[var(--line-strong)]" />
              <div className="size-3 rounded-full bg-[var(--line-strong)]" />
            </div>
            <div className="ml-4 flex min-w-0 flex-1 items-center gap-2 text-sm text-[var(--muted)]">
              <span className="truncate font-medium text-[var(--foreground)]">PixelForge Studio — Dashboard</span>
              <span className="text-[var(--muted-foreground)]">/</span>
              <span className="font-medium text-[var(--foreground)]">Overview</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[11px] font-medium text-[var(--accent)] border border-[var(--accent)]/30">
              <Sparkles size={12} />
              Demo data
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metricData.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Active Projects</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Projects in planning, delivery, or on hold.</p>
                </div>
                <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-muted)] transition-colors">
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {projectData.map((project) => (
                  <ProjectRow key={project.name} {...project} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}