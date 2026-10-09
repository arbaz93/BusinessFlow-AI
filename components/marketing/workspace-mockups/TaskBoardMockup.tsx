import { MockupFrame } from "./MockupFrame";
import { mockTaskBoard, priorityStyles } from "./mockupData";
import { cn } from "@/lib/utils";
import { CalendarDays, Search, CheckCheck, Sparkles } from "lucide-react";

const taskStatusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const taskStatusTone: Record<string, string> = {
  TODO: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  IN_PROGRESS: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
  BLOCKED: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  COMPLETED: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  CANCELLED: "bg-[var(--muted)]/10 text-[var(--muted)] border-[var(--muted)]/20",
};

const taskPriorityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

interface TaskBoardMockupProps {
  className?: string;
}

export function TaskBoardMockup({ className }: TaskBoardMockupProps) {
  const completedCount = mockTaskBoard.tasks.filter(t => t.status === "COMPLETED").length;
  const totalCount = mockTaskBoard.tasks.length;

  return (
    <MockupFrame title="Tasks" subtitle={`/projects/brand-website-refresh/tasks`} className={className}>
      <div className="space-y-3">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Project delivery</p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Tasks</h2>
          </div>
          <button className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-3 py-1.5 hover:opacity-80 w-full sm:w-auto flex items-center gap-2">
            <Sparkles size={14} /> Add Task
          </button>
        </section>

        <section className="grid gap-2 sm:grid-cols-3" aria-label="Project task summary">
          <Metric label="Open tasks" value={totalCount - completedCount} />
          <Metric label="Completed" value={completedCount} />
          <Metric label="In Progress" value={mockTaskBoard.tasks.filter(t => t.status === "IN_PROGRESS").length} />
        </section>

        <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-2 sm:p-3" aria-label="Task filters">
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_repeat(4,minmax(100px,auto))]">
            <div className="relative min-w-0">
              <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--foreground)]/35" />
              <input
                type="text"
                placeholder="Search tasks…"
                className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-8 pr-2 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground)]/35"
                defaultValue=""
                readOnly
              />
            </div>
            <select className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)]/80" defaultValue="ALL">
              <option>All statuses</option>
              <option>To Do</option>
              <option>In Progress</option>
              <option>Blocked</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
            <select className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)]/80" defaultValue="ALL">
              <option>All priorities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
            <select className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)]/80" defaultValue="ALL">
              <option>All assignees</option>
              <option value="">Unassigned</option>
              <option>Sarah Mitchell</option>
              <option>Marcus Webb</option>
              <option>Priya Patel</option>
            </select>
         
          </div>
        </section>

        <ul className="space-y-2">
          {mockTaskBoard.tasks.map((task) => (
            <li key={task.title} className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex max-w-full items-center gap-1 rounded-sm text-sm font-semibold text-[var(--foreground)]">
                    <span className="truncate">{task.title}</span>
                    <span className="shrink-0 text-[var(--foreground)]/35">›</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${taskStatusTone[task.status]}`}>{taskStatusLabels[task.status]}</span>
                    <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${priorityStyles[task.priority]}`}>{taskPriorityLabels[task.priority]}</span>
                    <span className="text-[10px] text-[var(--foreground)]/45">{task.assignee}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--foreground)]/45"><CalendarDays size={10} />{task.due}</span>
                    <span className="text-[10px] text-[var(--foreground)]/35">Project: Brand & Website Refresh</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <select className="h-8 w-full sm:w-auto rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)]/80" defaultValue={task.status}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button className="rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-[10px] font-medium px-2 py-1 hover:bg-[var(--background)] w-full sm:w-auto">
                    Edit
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MockupFrame>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
      <p className="text-[10px] text-[var(--foreground)]/50">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}