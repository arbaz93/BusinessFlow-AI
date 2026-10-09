"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskStatusControl } from "@/components/tasks/task-status-control";
import {
  activeTaskStatuses,
  taskDueFilterLabels,
  taskDueFilterValues,
  taskPriorityLabels,
  taskPriorityTone,
  taskPriorityValues,
  taskSortLabels,
  taskSortValues,
  taskStatusLabels,
  taskStatusTone,
  type TaskDueFilter,
  type TaskPriority,
  type TaskSort,
  type TaskStatus,
} from "@/lib/tasks/options";
import { formatTaskDueDate, getTaskTimelineState } from "@/lib/tasks/timeline";

type ProjectChoice = { id: string; name: string; clientName: string | null };
type TeamMember = { id: string; name: string; email: string | null };

type TaskSummary = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string;
  projectName: string;
  projectClientName: string | null;
  assigneeName: string | null;
  updatedAt: string;
  createdAt: string;
};

type StatusFilter = TaskStatus | "ALL" | "OPEN";

type Props = {
  tasks: TaskSummary[];
  projects: ProjectChoice[];
  teamMembers: TeamMember[];
  totalOpen: number;
  inProgress: number;
  overdue: number;
  completed: number;
  deletionComplete: boolean;
  initialDueFilter: TaskDueFilter;
  initialOpenOnly: boolean;
  loadError?: boolean;
};

const allStatuses = "ALL" as const;
const allPriorities = "ALL" as const;
const allProjects = "ALL" as const;

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return formatTaskDueDate(value);
}

function compareDueDates(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}

export function TasksWorkspace({
  tasks,
  projects,
  teamMembers,
  totalOpen,
  inProgress,
  overdue,
  completed,
  deletionComplete,
  initialDueFilter,
  initialOpenOnly,
  loadError,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialOpenOnly ? "OPEN" : allStatuses);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | typeof allPriorities>(allPriorities);
  const [projectFilter, setProjectFilter] = useState<string>(allProjects);
  const [dueFilter, setDueFilter] = useState<TaskDueFilter>(initialDueFilter);
  const [sort, setSort] = useState<TaskSort>("updated");
  const [showDeletionNotice, setShowDeletionNotice] = useState(deletionComplete);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const hasActiveFilters =
    deferredSearch !== "" ||
    statusFilter !== allStatuses ||
    priorityFilter !== allPriorities ||
    projectFilter !== allProjects ||
    dueFilter !== "ALL" ||
    sort !== "updated";

  function resetFilters() {
    setSearch("");
    setStatusFilter(allStatuses);
    setPriorityFilter(allPriorities);
    setProjectFilter(allProjects);
    setDueFilter("ALL");
    setSort("updated");
  }

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (statusFilter === "OPEN" && !activeTaskStatuses.includes(task.status)) return false;
      if (statusFilter !== allStatuses && statusFilter !== "OPEN" && task.status !== statusFilter) return false;
      if (priorityFilter !== allPriorities && task.priority !== priorityFilter) return false;
      if (projectFilter !== allProjects && task.projectId !== projectFilter) return false;

      if (dueFilter === "NO_DUE_DATE" && task.dueDate) return false;
      if (dueFilter === "OVERDUE" || dueFilter === "DUE_SOON") {
        const state = getTaskTimelineState(task.status, task.dueDate);
        if (state !== dueFilter.toLowerCase()) return false;
      }

      if (deferredSearch) {
        const searchable = [task.title, task.projectName, task.projectClientName, task.description, task.assigneeName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(deferredSearch)) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sort) {
        case "due":
          return compareDueDates(a.dueDate, b.dueDate);
        case "priority":
          return (a.priority === "URGENT" ? 0 : a.priority === "HIGH" ? 1 : a.priority === "MEDIUM" ? 2 : 3) - (b.priority === "URGENT" ? 0 : b.priority === "HIGH" ? 1 : b.priority === "MEDIUM" ? 2 : 3) || a.title.localeCompare(b.title);
        case "status":
          return (a.status === "IN_PROGRESS" ? 0 : a.status === "TODO" ? 1 : a.status === "BLOCKED" ? 2 : a.status === "COMPLETED" ? 3 : 4) - (b.status === "IN_PROGRESS" ? 0 : b.status === "TODO" ? 1 : b.status === "BLOCKED" ? 2 : b.status === "COMPLETED" ? 3 : 4) || a.title.localeCompare(b.title);
        case "project":
          return a.projectName.localeCompare(b.projectName) || a.title.localeCompare(b.title);
        case "title":
          return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [deferredSearch, dueFilter, priorityFilter, projectFilter, sort, statusFilter, tasks]);

  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-end sm:justify-between sm:pt-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--info-line)]">Delivery workflow</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[32px]">Tasks</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Track work across your projects, manage priorities, and stay on top of deadlines.</p>
        </div>
        <TaskFormDialog projects={projects} teamMembers={teamMembers} triggerLabel="New Task" />
      </section>

      {showDeletionNotice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--success-border)]/20 bg-[var(--success-surface)] px-3.5 py-2.5 text-sm text-[var(--success-line)]">
          <span>Task deleted successfully.</span>
          <button type="button" onClick={() => setShowDeletionNotice(false)} aria-label="Dismiss deletion notification" className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--success-line)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--success-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]">
            <X size={15} />
          </button>
        </div>
      )}

      {loadError ? (
        <div role="alert" className="rounded-lg border border-[var(--danger-border)]/25 bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
          We couldn&apos;t load your tasks. Refresh the page or try again in a moment.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Task summary">
        <SummaryMetric label="Total open tasks" value={totalOpen} note="To do, in progress, or blocked" />
        <SummaryMetric label="In progress" value={inProgress} note="Currently active" />
        <SummaryMetric label="Overdue" value={overdue} note="Past due and still open" />
        <SummaryMetric label="Completed" value={completed} note="Closed tasks" />
      </section>

      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4" aria-label="Task search and filters">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or projects…" aria-label="Search tasks" className="h-10 border-[var(--line)] bg-[var(--surface)] pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[var(--surface)]" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="Project" value={projectFilter} onChange={setProjectFilter} id="task-project-filter">
              <option value={allProjects}>All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} id="task-priority-filter">
              <option value={allPriorities}>All priorities</option>
              {taskPriorityValues.map((priority) => (
                <option key={priority} value={priority}>{taskPriorityLabels[priority]}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} id="task-status-filter">
              <option value={allStatuses}>All status</option>
              <option value="OPEN">Open tasks</option>
              {Object.keys(taskStatusLabels).map((status) => (
                <option key={status} value={status}>{taskStatusLabels[status as TaskStatus]}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Due" value={dueFilter} onChange={setDueFilter} id="task-due-filter">
              {taskDueFilterValues.map((filter) => (
                <option key={filter} value={filter}>{taskDueFilterLabels[filter]}</option>
              ))}
            </FilterSelect>
            <select value={sort} onChange={(event) => setSort(event.target.value as TaskSort)} aria-label="Sort tasks" className="h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--foreground)] outline-none focus-visible:border-[#a49bff] focus-visible:ring-[3px] focus-visible:ring-[#a49bff]/20">
              {taskSortValues.map((value) => (
                <option key={value} value={value}>{taskSortLabels[value]}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]" aria-label="Reset task filters">
                <SlidersHorizontal size={14} /> Reset
              </button>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Task list" aria-live="polite">
        {visibleTasks.length > 0 ? (
          <div className="space-y-2.5">
            {visibleTasks.map((task) => {
              const timeline = getTaskTimelineState(task.status, task.dueDate);
              return (
                <article key={task.id} className="flex flex-col gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 transition-colors hover:border-[var(--line)] sm:flex-row sm:items-center sm:gap-4 sm:px-4">
                  <div className="grid min-w-0 flex-1 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3">
                    <Link href={`/tasks/${task.id}`} className="col-span-2 flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent-muted)]">
                        <CheckCircle2 size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="max-w-full truncate text-sm font-semibold text-[var(--foreground)]">{task.title}</span>
                          <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium ${taskStatusTone[task.status]}`}>{taskStatusLabels[task.status]}</span>
                          <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium ${taskPriorityTone[task.priority]}`}>{taskPriorityLabels[task.priority]}</span>
                        </span>
                      </span>
                    </Link>
                    <Link href={`/projects/${task.projectId}/tasks`} className="col-start-2 mt-1 block w-fit max-w-full truncate rounded-sm text-xs text-[var(--muted)] hover:text-[var(--accent-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                      {task.projectName}{task.projectClientName ? ` · ${task.projectClientName}` : ""}
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 sm:justify-end sm:border-0 sm:pt-0">
                    <div className="min-w-0 text-xs text-[var(--muted)] sm:w-52 sm:text-right">
                      <span className="block">{task.assigneeName || "Unassigned"}</span>
                      <span className="mt-1 block font-medium text-[var(--muted)]">{timeline === "overdue" ? "Overdue" : timeline === "due_soon" ? "Due soon" : timeline === "no_due_date" ? "No due date" : "On track"}</span>
                      <span className="mt-1 block">{formatDate(task.dueDate)}</span>
                    </div>
                    <TaskStatusControl taskId={task.id} initialStatus={task.status} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--muted)]">
            No tasks match the current filters.
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryMetric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)]">
      <p className="text-[11px] font-medium tracking-[0.01em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.05em] text-[var(--foreground)]">{value}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">{note}</p>
    </div>
  );
}

function FilterSelect<T extends string>({ label, value, onChange, id, children }: { label: string; value: T; onChange: (value: T) => void; id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs text-[var(--muted)]">
      <span className="sr-only">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 border-0 bg-transparent pr-2 text-sm text-[var(--foreground)] outline-none"
      >
        {children}
      </select>
    </label>
  );
}
