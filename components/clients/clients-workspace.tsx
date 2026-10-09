"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Mail, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import type { ClientInput } from "@/lib/clients/schemas";

type ClientSummary = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  status: ClientInput["status"];
  createdAtLabel: string;
  lastActivityLabel: string | null;
};

const statusFilters = ["ALL", "ACTIVE", "INACTIVE"] as const;

export function ClientsWorkspace({ clients, deletionComplete, loadError }: { clients: ClientSummary[]; deletionComplete: boolean; loadError?: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("ALL");
  const [showDeletionNotice, setShowDeletionNotice] = useState(deletionComplete);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const activeCount = clients.filter((client) => client.status === "ACTIVE").length;
  const inactiveCount = clients.length - activeCount;
  const visibleClients = clients.filter((client) => {
    const matchesStatus = statusFilter === "ALL" || client.status === statusFilter;
    const searchable = [client.name, client.company, client.email].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && (!deferredSearch || searchable.includes(deferredSearch));
  });

  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-end sm:justify-between sm:pt-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--info-line)]">Relationships & delivery</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[32px]">Clients</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Manage your client relationships and active work.</p>
        </div>
        <ClientFormDialog />
      </section>

      {showDeletionNotice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--success-border)]/20 bg-[var(--success-surface)] px-3.5 py-2.5 text-sm text-[var(--success-line)]">
          <span>Client deleted successfully.</span>
          <button type="button" onClick={() => setShowDeletionNotice(false)} aria-label="Dismiss deletion notification" className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--success-line)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--success-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]">
            <X size={15} />
          </button>
        </div>
      )}

      {loadError ? (
        <div role="alert" className="rounded-lg border border-[var(--danger-border)]/25 bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
          We couldn&apos;t load your clients. Refresh the page or try again in a moment.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Client summary">
        <SummaryMetric label="Active clients" value={activeCount} note="Currently working with you" tone="text-[var(--success-line)]" />
        <SummaryMetric label="Inactive clients" value={inactiveCount} note="Relationship history retained" tone="text-[var(--muted)]" />
      </section>

      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4" aria-label="Client search and filters">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, email…" aria-label="Search clients" className="h-10 border-[var(--line)] bg-[var(--surface)] pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 dark:bg-[var(--surface)]" />
          </div>
          <div className="flex gap-1" role="group" aria-label="Filter clients by status">
            {statusFilters.map((status) => {
              const count = status === "ALL" ? clients.length : status === "ACTIVE" ? activeCount : inactiveCount;
              const active = statusFilter === status;
              return (
                <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={active} className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${active ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
                  {status === "ALL" ? "All clients" : status === "ACTIVE" ? "Active" : "Inactive"}<span className={active ? "text-[var(--muted)]" : "text-[var(--muted)]"}>{count}</span>
                </button>
              );
            })}
</div>
          </div>
        </section>

      <section aria-label="Clients" aria-live="polite">
        {visibleClients.length ? (
          <>
            <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
              <div className="overflow-x-auto sm:overflow-visible">
                <div className="hidden min-w-[900px] grid-cols-[minmax(200px,1.35fr)_minmax(150px,1fr)_minmax(160px,1fr)_112px_145px_118px] gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] xl:grid">
                  <span>Client</span><span>Company</span><span>Email</span><span>Status</span><span>Last Activity</span><span>Created</span>
                </div>
                <div className="divide-y divide-[var(--line)]  sm:min-w-0">
                  {visibleClients.map((client) => (
                    <Link key={client.id} href={`/clients/${client.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3.5 transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:grid-cols-[minmax(200px,1.4fr)_minmax(160px,1fr)_112px_145px] xl:grid-cols-[minmax(200px,1.35fr)_minmax(150px,1fr)_minmax(160px,1fr)_112px_145px_118px] xl:gap-4">
                      <span className="flex w-min items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent-muted)]">{initials(client.name)}</span>
                        <span>
                          <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{client.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--muted)] xl:hidden">{client.company || client.email || "Individual client"}</span>
                        </span>
                      </span>
                      <span className="hidden min-w-0 truncate text-xs text-[var(--muted)] xl:block">{client.company || "—"}</span>
                      <span className="hidden min-w-0 items-center gap-1.5 truncate text-xs text-[var(--muted)] md:flex xl:block">{client.email ? <><Mail size={13} className="inline-block xl:hidden" />{client.email}</> : "—"}</span>
                      <span className={`inline-flex h-6 items-center justify-self-end rounded-full border px-2 text-[10px] font-medium xl:justify-self-start ${client.status === "ACTIVE" ? "border-[var(--success-border)]/20 bg-[var(--success-surface)] text-[var(--success-line)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}>{client.status === "ACTIVE" ? "Active" : "Inactive"}</span>
                      <span className="hidden truncate text-xs text-[var(--muted)] lg:block">{client.lastActivityLabel || "No activity"}</span>
                      <span className="hidden text-xs text-[var(--muted)] xl:block">{client.createdAtLabel}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : clients.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-14 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"><BriefcaseBusiness size={19} /></span>
            <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">No clients yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[var(--muted)]">Clients will appear here when you create one or convert a lead.</p>
            <div className="mt-5 flex justify-center"><ClientFormDialog label="Create Client" /></div>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-12 text-center">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">No matching clients</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Try another search or clear the status filter.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("ALL"); }} className="mt-4 rounded-md px-3 py-2 text-sm font-medium text-[var(--accent-muted)] hover:bg-[var(--surface)]">Clear filters</button>
          </div>
        )}
      </section>
    </div>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function SummaryMetric({ label, value, note, tone }: { label: string; value: number; note: string; tone: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3.5">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2"><p className={`text-[24px] font-semibold leading-none tracking-[-0.04em] ${tone}`}>{value}</p><p className="text-[11px] text-[var(--muted)]">{note}</p></div>
    </div>
  );
}