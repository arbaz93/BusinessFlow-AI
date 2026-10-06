"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { Search, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadStatusControl, type LeadStatusValue } from "@/components/leads/lead-status-control";
import { leadSourceLabels, leadStatusLabels } from "@/lib/leads/options";

type LeadSummary = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatusValue;
  estimatedValue: string | null;
  currency: string;
  createdAtLabel: string;
  converted: boolean;
};

const filters: { value: "ALL" | LeadStatusValue; label: string }[] = [
  { value: "ALL", label: "All leads" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

const statusTone: Record<LeadStatusValue, string> = {
  NEW: "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
  CONTACTED: "border-[var(--info-border)]/25 bg-[var(--info-surface)] text-[var(--info-line)]",
  QUALIFIED: "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent-muted)]",
  PROPOSAL_SENT: "border-[var(--info-border)]/25 bg-[var(--info-surface)] text-[var(--info-line)]",
  WON: "border-[var(--success-border)]/20 bg-[var(--success-surface)] text-[var(--success-line)]",
  LOST: "border-[var(--danger-border)]/20 bg-[#ef4444]/10 text-[#fca5a5]",
};

export function LeadsWorkspace({
  leads,
  qualifiedCount,
  convertedCount,
  deletionComplete,
}: {
  leads: LeadSummary[];
  qualifiedCount: number;
  convertedCount: number;
  deletionComplete: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof filters)[number]["value"]>("ALL");
  const [showDeletionNotice, setShowDeletionNotice] = useState(deletionComplete);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const visibleLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    const searchable = [lead.name, lead.company, lead.email, lead.phone, lead.source].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && (!deferredSearch || searchable.includes(deferredSearch));
  });

  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-end sm:justify-between sm:pt-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-muted)]">Sales pipeline</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[32px]">Leads</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Manage new opportunities and keep the next step moving.</p>
        </div>
        <LeadFormDialog />
      </section>

      {showDeletionNotice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--success-border)]/20 bg-[var(--success-surface)] px-3.5 py-2.5 text-sm text-[var(--success-line)]">
          <span>Lead deleted successfully.</span>
          <button type="button" onClick={() => setShowDeletionNotice(false)} aria-label="Dismiss deletion notification" className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--success-line)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--success-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]">
            <X size={15} />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Lead summary">
        <SummaryMetric label="Total leads" value={leads.length} note="In your workspace" tone="text-[var(--foreground)]" />
        <SummaryMetric label="Qualified" value={qualifiedCount} note="Ready for a decision" tone="text-[var(--accent-muted)]" />
        <SummaryMetric label="Converted" value={convertedCount} note="Now active clients" tone="text-[var(--success-line)]" />
      </section>

      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4" aria-label="Lead search and filters">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, company, email…"
              aria-label="Search leads"
              className="h-10 border-[var(--line)] bg-[var(--surface)] pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[var(--surface)]"
            />
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto pb-0.5" role="group" aria-label="Filter leads by status">
            {filters.map((filter) => {
              const count = filter.value === "ALL" ? leads.length : leads.filter((lead) => lead.status === filter.value).length;
              const active = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  aria-pressed={active}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] ${active ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}
                >
                  {filter.label}<span className={active ? "text-[var(--muted)]" : "text-[var(--muted)]"}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="Leads" aria-live="polite">
        {visibleLeads.length > 0 ? (
          <div className="space-y-2.5">
            {visibleLeads.map((lead) => (
              <article key={lead.id} className="flex flex-col gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 transition-colors hover:border-[var(--line)] sm:flex-row sm:items-center sm:gap-4 sm:px-4">
                <Link href={`/leads/${lead.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent-muted)]">
                    {lead.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="max-w-full truncate text-sm font-semibold text-[var(--foreground)]">{lead.name}</span>
                      <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium ${statusTone[lead.status]}`}>{leadStatusLabels[lead.status]}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-[var(--muted)]">{lead.company || lead.email || "No company or email"}</span>
                  </span>
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 sm:justify-end sm:border-0 sm:pt-0">
                  <div className="min-w-0 text-xs text-[var(--muted)] sm:w-28 sm:text-right">
                    <span className="block">{getSourceLabel(lead.source)}</span>
                    {lead.estimatedValue !== null && <span className="mt-1 block font-medium text-[var(--muted)]">{formatEstimate(lead.estimatedValue, lead.currency)}</span>}
                    <span className="mt-1 block">{lead.createdAtLabel}</span>
                  </div>
                  <LeadStatusControl key={`${lead.id}-${lead.status}`} leadId={lead.id} initialStatus={lead.status} readOnly={lead.converted} />
                </div>
              </article>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-14 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"><Users size={19} /></span>
            <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">No leads yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[var(--muted)]">Add your first lead to start tracking potential clients.</p>
            <div className="mt-5 flex justify-center"><LeadFormDialog /></div>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-12 text-center">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">No matching leads</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Try another search or clear the status filter.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("ALL"); }} className="mt-4 rounded-md px-3 py-2 text-sm font-medium text-[var(--accent-muted)] hover:bg-[var(--surface)]">Clear filters</button>
          </div>
        )}
      </section>
    </div>
  );
}

function getSourceLabel(source: string | null) {
  if (!source) return "Direct";
  return source in leadSourceLabels ? leadSourceLabels[source as keyof typeof leadSourceLabels] : source;
}

function formatEstimate(value: string, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}

function SummaryMetric({ label, value, note, tone }: { label: string; value: number; note: string; tone: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3.5">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className={`text-[24px] font-semibold leading-none tracking-[-0.04em] ${tone}`}>{value}</p>
        <p className="text-[11px] text-[var(--muted)]">{note}</p>
      </div>
    </div>
  );
}