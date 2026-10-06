"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, FolderKanban, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import {
  projectPriorityLabels,
  projectPriorityTone,
  projectPriorityValues,
  projectStatusLabels,
  projectStatusTone,
  projectStatusValues,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/projects/options";
import {
  getProjectTimelineState,
  projectDueFilterLabels,
  projectDueFilterValues,
  projectSortLabels,
  projectSortValues,
  priorityRank,
  statusRank,
  type ProjectDueFilter,
  type ProjectSort,
} from "@/lib/projects/timeline";

type ProjectClient = { id: string; name: string; company: string | null };

type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string | null;
  dueDate: string | null;
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  updatedAt: string;
  createdAt: string;
};

type Props = {
  projects: ProjectSummary[];
  clients: ProjectClient[];
  statusCounts: Partial<Record<ProjectStatus, number>>;
  priorityCounts: Partial<Record<ProjectPriority, number>>;
  activeCount: number;
  totalCount: number;
  deletionComplete: boolean;
  loadError?: boolean;
};

const allStatuses = "ALL" as const;
const allPriorities = "ALL" as const;
const allClients = "ALL" as const;

export function ProjectsWorkspace({
  projects,
  clients,
  statusCounts,
  priorityCounts,
  activeCount,
  totalCount,
  deletionComplete,
  loadError,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | typeof allStatuses>(allStatuses);
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | typeof allPriorities>(allPriorities);
  const [clientFilter, setClientFilter] = useState<string>(allClients);
  const [dueFilter, setDueFilter] = useState<ProjectDueFilter>("ALL");
  const [sort, setSort] = useState<ProjectSort>("updated");
  const [showDeletionNotice, setShowDeletionNotice] = useState(deletionComplete);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const hasActiveFilters =
    deferredSearch !== "" ||
    statusFilter !== allStatuses ||
    priorityFilter !== allPriorities ||
    clientFilter !== allClients ||
    dueFilter !== "ALL" ||
    sort !== "updated";

  function resetFilters() {
    setSearch("");
    setStatusFilter(allStatuses);
    setPriorityFilter(allPriorities);
    setClientFilter(allClients);
    setDueFilter("ALL");
    setSort("updated");
  }

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      if (statusFilter !== allStatuses && project.status !== statusFilter) return false;
      if (priorityFilter !== allPriorities && project.priority !== priorityFilter) return false;
      if (clientFilter !== allClients && project.clientId !== clientFilter) return false;

      if (dueFilter === "NO_DUE_DATE" && project.dueDate) return false;
      if (dueFilter === "OVERDUE" || dueFilter === "DUE_SOON") {
        const state = getProjectTimelineState(project.status, project.startDate, project.dueDate);
        if (state !== dueFilter.toLowerCase()) return false;
      }

      if (deferredSearch) {
        const searchable = [project.name, project.clientName, project.clientCompany, project.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(deferredSearch)) return false;
      }
      return true;
    });

    // `sort` is constrained to the projectSortValues allowlist, so no user input reaches ordering.
    return filtered.sort((a, b) => {
      switch (sort) {
        case "created":
          return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
        case "name":
          return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
        case "due":
          return compareDueDates(a.dueDate, b.dueDate);
        case "priority":
          return priorityRank[a.priority] - priorityRank[b.priority] || a.name.localeCompare(b.name);
        case "status":
          return statusRank[a.status] - statusRank[b.status] || a.name.localeCompare(b.name);
        default:
          return a.updatedAt < b.updatedAt ? 1 : -1;
      }
    });
  }, [clientFilter, deferredSearch, dueFilter, priorityFilter, projects, sort, statusFilter]);

  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-end sm:justify-between sm:pt-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--info-line)]">Delivery pipeline</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[32px]">Projects</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Manage client projects, track progress, and keep delivery on course.</p>
        </div>
        <ProjectFormDialog clients={clients} triggerLabel="New Project" />
      </section>

      {showDeletionNotice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--success-border)]/20 bg-[var(--success-surface)] px-3.5 py-2.5 text-sm text-[var(--success-line)]">
          <span>Project deleted successfully.</span>
          <button type="button" onClick={() => setShowDeletionNotice(false)} aria-label="Dismiss deletion notification" className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--success-line)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--success-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]">
            <X size={15} />
          </button>
        </div>
      )}

      {loadError ? (
        <div role="alert" className="rounded-lg border border-[var(--danger-border)]/25 bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
          We couldn&apos;t load your projects. Refresh the page or try again in a moment.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Project summary">
        <SummaryMetric label="Total projects" value={totalCount} note="Across your workspace" />
        <SummaryMetric label="Active projects" value={activeCount} note="Planning, in progress, or on hold" />
        <SummaryMetric label="Completed" value={statusCounts.COMPLETED ?? 0} note="Delivered work" />
        <SummaryMetric label="Overdue" value={projects.filter((project) => getProjectTimelineState(project.status, project.startDate, project.dueDate) === "overdue").length} note="Past due and still open" />
      </section>

      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4" aria-label="Project search and filters">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects or clients…" aria-label="Search projects" className="h-10 border-[var(--line)] bg-[var(--surface)] pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[var(--surface)]" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="Client" value={clientFilter} onChange={setClientFilter} id="project-client-filter">
              <option value={allClients}>All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.company || client.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} id="project-priority-filter">
              <option value={allPriorities}>All priorities</option>
              {projectPriorityValues.map((priority) => (
                <option key={priority} value={priority}>{projectPriorityLabels[priority]}{priorityCounts[priority] ? ` (${priorityCounts[priority]})` : ""}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Due" value={dueFilter} onChange={setDueFilter} id="project-due-filter">
              {projectDueFilterValues.map((value) => (
                <option key={value} value={value}>{projectDueFilterLabels[value]}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Sort" value={sort} onChange={setSort} id="project-sort-filter">
              {projectSortValues.map((value) => (
                <option key={value} value={value}>{projectSortLabels[value]}</option>
              ))}
            </FilterSelect>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                <X size={13} /> Reset
              </button>
            )}
</div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Filter projects by status">
          {([allStatuses, ...projectStatusValues] as const).map((status) => {
            const active = statusFilter === status;
            const count = status === allStatuses ? totalCount : statusCounts[status] ?? 0;
            return (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={active} className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] ${active ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
                {status === allStatuses ? "All" : projectStatusLabels[status]}
                <span className={active ? "text-[var(--muted)]" : "text-[var(--muted)]"}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Projects" aria-live="polite">
        {visibleProjects.length ? (
          <>
            <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
              <div className="overflow-x-auto sm:overflow-visible">
                <div className="hidden min-w-[800px] grid-cols-[minmax(200px,1.5fr)_minmax(150px,0.9fr)_minmax(130px,0.75fr)_110px_110px_110px] gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] xl:grid">
                  <span>Project</span>
                  <span>Client</span>
                  <span>Priority</span>
                  <span>Status</span>
                  <span>Due</span>
                  <span>Updated</span>
                </div>
                <div className="divide-y divide-[var(--line)] min-w-[800px] sm:min-w-0">
                  {visibleProjects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3.5 transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a49bff] sm:px-4 lg:grid-cols-[minmax(200px,1.5fr)_minmax(140px,1fr)_110px_110px] xl:grid-cols-[minmax(200px,1.5fr)_minmax(150px,0.9fr)_minmax(130px,0.75fr)_110px_110px_110px] xl:gap-4">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[11px] font-semibold text-[var(--accent-muted)]"><FolderKanban size={16} /></span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{project.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--muted)] xl:hidden">{project.clientName}</span>
                        </span>
                      </span>
                      <span className="hidden min-w-0 truncate text-xs text-[var(--muted)] xl:block">{project.clientCompany || project.clientName}</span>
                      <span className={`inline-flex h-6 items-center justify-self-end rounded-full border px-2 text-[10px] font-medium xl:justify-self-start ${projectPriorityTone[project.priority]}`}>{projectPriorityLabels[project.priority]}</span>
                      <span className={`inline-flex h-6 items-center justify-self-end rounded-full border px-2 text-[10px] font-medium xl:justify-self-start ${projectStatusTone[project.status]}`}>{projectStatusLabels[project.status]}</span>
                      <span className="hidden truncate text-xs text-[var(--muted)] lg:block">{project.dueDate ? new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date"}</span>
                      <span className="hidden text-xs text-[var(--muted)] xl:block">{new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : totalCount === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-14 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"><BriefcaseBusiness size={19} /></span>
            <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">Create your first project to start organizing client work and tracking delivery.</p>
            <div className="mt-5 flex justify-center"><ProjectFormDialog clients={clients} triggerLabel="New Project" /></div>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-10 text-center">
            <p className="text-sm text-[var(--muted)]">No projects match your filters.</p>
            <button type="button" onClick={resetFilters} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--line)] px-3 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
              <SlidersHorizontal size={13} /> Reset filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function compareDueDates(a: string | null, b: string | null) {
  if (a && b) return a < b ? -1 : a > b ? 1 : 0;
  if (a) return -1;
  if (b) return 1;
  return 0;
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  children,
  id,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 max-w-full appearance-none rounded-md border border-[var(--line)] bg-[var(--surface)] py-0 pl-2.5 pr-7 text-xs font-medium text-[var(--foreground)] outline-none transition-colors hover:border-[var(--line-strong)] focus-visible:ring-2 focus-visible:ring-[#a49bff]"
      >
        {children}
      </select>
      <SlidersHorizontal size={12} aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
    </div>
  );
}

function SummaryMetric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="min-w-0 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        <CalendarDays size={14} className="shrink-0 text-[var(--muted)]" />
      </div>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{value.toLocaleString()}</p>
      <p className="mt-1 truncate text-[11px] text-[var(--muted)]">{note}</p>
    </div>
  );
}
