"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCheck, ChevronRight, Search } from "lucide-react";
import { TaskDeleteDialog } from "@/components/tasks/task-delete-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskStatusControl } from "@/components/tasks/task-status-control";
import { Input } from "@/components/ui/input";
import {
  taskPriorityLabels,
  taskPriorityTone,
  taskPriorityValues,
  taskStatusLabels,
  taskStatusTone,
  taskStatusValues,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/options";
import { formatTaskDueDate, getTaskTimelineState } from "@/lib/tasks/timeline";

type ProjectTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  projectId: string;
  updatedAt: string;
  createdAt: string;
};

type TeamMember = { id: string; name: string; email: string | null };

export function ProjectTasksWorkspace({
  projectId,
  projectName,
  projectClientName,
  tasks,
  teamMembers,
  openCount,
  completedCount,
  overdueCount,
  deletionComplete,
  loadError,
}: {
  projectId: string;
  projectName: string;
  projectClientName: string;
  tasks: ProjectTask[];
  teamMembers: TeamMember[];
  openCount: number;
  completedCount: number;
  overdueCount: number;
  deletionComplete: boolean;
  loadError?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "ALL">("ALL");
  const [priority, setPriority] = useState<TaskPriority | "ALL">("ALL");
  const [assignee, setAssignee] = useState("ALL");
  const [due, setDue] = useState("ALL");

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (status !== "ALL" && task.status !== status) return false;
      if (priority !== "ALL" && task.priority !== priority) return false;
      if (assignee !== "ALL" && task.assigneeId !== assignee) return false;
      const timeline = getTaskTimelineState(task.status, task.dueDate);
      if (due === "OVERDUE" && timeline !== "overdue") return false;
      if (due === "DUE_SOON" && timeline !== "due_soon") return false;
      if (due === "NO_DUE_DATE" && task.dueDate) return false;
      if (query && !`${task.title} ${task.description ?? ""} ${task.assigneeName ?? ""}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [assignee, due, priority, search, status, tasks]);

  const projects = [{ id: projectId, name: projectName, clientName: projectClientName }];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--info-line)]">Project delivery</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Tasks</h2>
          <p className="mt-1 text-sm text-[var(--foreground)]/50">Organize and track the work for this project.</p>
        </div>
        <TaskFormDialog projects={projects} teamMembers={teamMembers} fixedProjectId={projectId} triggerLabel="Add Task" />
      </section>

      {deletionComplete && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--success-border)]/20 bg-[#22c55e]/8 px-3.5 py-2.5 text-sm text-[var(--success-line)]">
          Task deleted successfully.
          <Link href={`/projects/${projectId}/tasks`} className="rounded-sm underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]">Dismiss</Link>
        </div>
      )}

      {loadError ? (
        <div role="alert" className="rounded-xl border border-[var(--danger-border)]/25 bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
          We couldn&apos;t load this project&apos;s tasks. Refresh and try again.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Project task summary">
        <Metric label="Open tasks" value={openCount} />
        <Metric label="Completed" value={completedCount} />
        <Metric label="Overdue" value={overdueCount} />
      </section>

      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4" aria-label="Task filters">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_repeat(4,minmax(120px,auto))]">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/35" />
            <Input value={search} onChange={(event) => setSearch(event.currentTarget.value)} aria-label="Search project tasks" placeholder="Search tasks…" className="h-10 border-[var(--line)] bg-[var(--surface)] pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 dark:bg-[var(--surface)]" />
          </div>
          <Filter id="project-task-status" label="Status" value={status} onChange={(value) => setStatus(value as TaskStatus | "ALL")}>
            <option value="ALL">All statuses</option>
            {taskStatusValues.map((value) => <option key={value} value={value}>{taskStatusLabels[value]}</option>)}
          </Filter>
          <Filter id="project-task-priority" label="Priority" value={priority} onChange={(value) => setPriority(value as TaskPriority | "ALL")}>
            <option value="ALL">All priorities</option>
            {taskPriorityValues.map((value) => <option key={value} value={value}>{taskPriorityLabels[value]}</option>)}
          </Filter>
          <Filter id="project-task-assignee" label="Assignee" value={assignee} onChange={setAssignee}>
            <option value="ALL">All assignees</option>
            <option value="">Unassigned</option>
            {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </Filter>
          <Filter id="project-task-due" label="Due date" value={due} onChange={setDue}>
            <option value="ALL">All dates</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DUE_SOON">Due soon</option>
            <option value="NO_DUE_DATE">No due date</option>
          </Filter>
        </div>
      </section>

      {tasks.length ? visibleTasks.length ? (
        <ul className="space-y-3">
          {visibleTasks.map((task) => (
            <li key={task.id} className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <Link href={`/tasks/${task.id}`} className="inline-flex max-w-full items-center gap-1 rounded-sm text-sm font-semibold text-[var(--foreground)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                    <span className="truncate">{task.title}</span><ChevronRight size={15} className="shrink-0 text-[var(--foreground)]/35" />
                  </Link>
                  {task.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--foreground)]/50">{task.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${taskStatusTone[task.status]}`}>{taskStatusLabels[task.status]}</span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${taskPriorityTone[task.priority]}`}>{taskPriorityLabels[task.priority]}</span>
                    <span className="text-[11px] text-[var(--foreground)]/45">{task.assigneeName ?? "Unassigned"}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--foreground)]/45"><CalendarDays size={12} />{task.dueDate ? formatTaskDueDate(task.dueDate) : "No due date"}</span>
                    <span className="text-[11px] text-[var(--foreground)]/35">Updated {formatDate(task.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStatusControl taskId={task.id} initialStatus={task.status} />
                  <TaskFormDialog
                    task={{
                      id: task.id,
                      title: task.title,
                      projectId: task.projectId,
                      description: task.description ?? undefined,
                      status: task.status,
                      priority: task.priority,
                      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                      assigneeId: task.assigneeId ?? undefined,
                      updatedAt: task.updatedAt,
                    }}
                    projects={projects}
                    teamMembers={teamMembers}
                    fixedProjectId={projectId}
                  />
                  <TaskDeleteDialog taskId={task.id} title={task.title} projectName={projectName} redirectTo={`/projects/${projectId}/tasks?deleted=1`} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--foreground)]/45">No tasks match these filters.</p>
      ) : (
        <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--panel)] px-4 py-12 text-center">
          <CheckCheck size={22} className="mx-auto text-[var(--foreground)]/35" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]/80">No tasks yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--foreground)]/45">Create tasks to break this project into manageable work.</p>
          <div className="mt-4"><TaskFormDialog projects={projects} teamMembers={teamMembers} fixedProjectId={projectId} triggerLabel="Add Task" /></div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
      <p className="text-xs text-[var(--foreground)]/50">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function Filter({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.currentTarget.value)} className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]/80 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
        {children}
      </select>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
