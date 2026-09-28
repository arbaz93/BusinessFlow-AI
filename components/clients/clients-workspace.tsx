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

export function ClientsWorkspace({ clients, deletionComplete }: { clients: ClientSummary[]; deletionComplete: boolean }) {
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93c5fd]">Relationships & delivery</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#f4f4f5] sm:text-[32px]">Clients</h1>
          <p className="mt-2 text-sm text-white/55">Manage your client relationships and active work.</p>
        </div>
        <ClientFormDialog />
      </section>

      {showDeletionNotice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/[0.08] px-3.5 py-2.5 text-sm text-[#86efac]">
          <span>Client deleted successfully.</span>
          <button type="button" onClick={() => setShowDeletionNotice(false)} aria-label="Dismiss deletion notification" className="grid size-7 shrink-0 place-items-center rounded-md text-[#86efac]/70 transition-colors hover:bg-white/[0.06] hover:text-[#86efac] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]">
            <X size={15} />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Client summary">
        <SummaryMetric label="Active clients" value={activeCount} note="Currently working with you" tone="text-[#86efac]" />
        <SummaryMetric label="Inactive clients" value={inactiveCount} note="Relationship history retained" tone="text-white/70" />
      </section>

      <section className="rounded-[10px] border border-white/10 bg-[#18181b] p-3 sm:p-4" aria-label="Client search and filters">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, email…" aria-label="Search clients" className="h-10 border-white/10 bg-[#111113] pl-9 text-sm text-white placeholder:text-white/35 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[#111113]" />
          </div>
          <div className="flex gap-1" role="group" aria-label="Filter clients by status">
            {statusFilters.map((status) => {
              const count = status === "ALL" ? clients.length : status === "ACTIVE" ? activeCount : inactiveCount;
              const active = statusFilter === status;
              return (
                <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={active} className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] ${active ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"}`}>
                  {status === "ALL" ? "All clients" : status === "ACTIVE" ? "Active" : "Inactive"}<span className={active ? "text-white/55" : "text-white/30"}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="Clients" aria-live="polite">
        {visibleClients.length ? (
          <div className="overflow-hidden rounded-[10px] border border-white/10 bg-[#151518]">
            <div className="hidden grid-cols-[minmax(200px,1.35fr)_minmax(150px,1fr)_minmax(160px,1fr)_112px_145px_118px] gap-4 border-b border-white/10 bg-white/[0.025] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 xl:grid">
              <span>Client</span><span>Company</span><span>Email</span><span>Status</span><span>Last Activity</span><span>Created</span>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {visibleClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3.5 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a49bff] sm:px-4 lg:grid-cols-[minmax(200px,1.4fr)_minmax(160px,1fr)_112px_145px] xl:grid-cols-[minmax(200px,1.35fr)_minmax(150px,1fr)_minmax(160px,1fr)_112px_145px_118px] xl:gap-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[11px] font-semibold text-[#93c5fd]">{initials(client.name)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#f4f4f5]">{client.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-white/45 xl:hidden">{client.company || client.email || "Individual client"}</span>
                    </span>
                  </span>
                  <span className="hidden min-w-0 truncate text-xs text-white/65 xl:block">{client.company || "—"}</span>
                  <span className="hidden min-w-0 items-center gap-1.5 truncate text-xs text-white/55 md:flex xl:block">{client.email ? <><Mail size={13} className="inline-block xl:hidden" />{client.email}</> : "—"}</span>
                  <span className={`inline-flex h-6 items-center justify-self-end rounded-full border px-2 text-[10px] font-medium xl:justify-self-start ${client.status === "ACTIVE" ? "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac]" : "border-white/10 bg-white/[0.04] text-white/55"}`}>{client.status === "ACTIVE" ? "Active" : "Inactive"}</span>
                  <span className="hidden truncate text-xs text-white/45 lg:block">{client.lastActivityLabel || "No activity"}</span>
                  <span className="hidden text-xs text-white/45 xl:block">{client.createdAtLabel}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-white/15 bg-[#151518] px-5 py-14 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60"><BriefcaseBusiness size={19} /></span>
            <h2 className="mt-4 text-base font-semibold text-[#f4f4f5]">No clients yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-white/50">Clients will appear here when you create one or convert a lead.</p>
            <div className="mt-5 flex justify-center"><ClientFormDialog label="Create Client" /></div>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-white/15 bg-[#151518] px-5 py-12 text-center">
            <h2 className="text-sm font-semibold text-[#f4f4f5]">No matching clients</h2>
            <p className="mt-1 text-sm text-white/50">Try another search or clear the status filter.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("ALL"); }} className="mt-4 rounded-md px-3 py-2 text-sm font-medium text-[#c4b5fd] hover:bg-white/[0.05]">Clear filters</button>
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
    <div className="rounded-[10px] border border-white/10 bg-[#18181b] px-4 py-3.5">
      <p className="text-xs font-medium text-white/55">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2"><p className={`text-[24px] font-semibold leading-none tracking-[-0.04em] ${tone}`}>{value}</p><p className="text-[11px] text-white/35">{note}</p></div>
    </div>
  );
}