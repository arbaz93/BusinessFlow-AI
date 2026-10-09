import { MockupFrame } from "./MockupFrame";
import { mockProject, stageStyles, priorityStyles } from "./mockupData";
import { CalendarDays, Building2, FileText, Sparkles, CheckCheck } from "lucide-react";

interface ProjectCreateMockupProps {
  className?: string;
}

export function ProjectCreateMockup({ className }: ProjectCreateMockupProps) {
  return (
    <MockupFrame title="Project Overview" subtitle={`/projects/brand-website-refresh`} className={className}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Project</p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{mockProject.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--muted)]">Client:</span>
            <span className="font-medium text-[var(--foreground)]">{mockProject.client}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Status</p>
            <p className="mt-1 flex items-center gap-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${stageStyles[mockProject.status]}`}>
                {mockProject.status}
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Priority</p>
            <p className="mt-1 flex items-center gap-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${priorityStyles[mockProject.priority]}`}>
                {mockProject.priority}
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Due Date</p>
            <p className="mt-1 text-sm flex items-center gap-1 text-[var(--foreground)]">
              <CalendarDays size={12} />
              {mockProject.due}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Progress</p>
            <p className="mt-1 text-sm flex items-center gap-1 text-[var(--foreground)]">
              <CheckCheck size={12} />
              {mockProject.progress.completed} of {mockProject.progress.total} tasks
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="space-y-4 flex-2">
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <h4 className="text-[15px] font-semibold text-[var(--foreground)]">Project Details</h4>
              <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <DetailItem icon={Building2} label="Client" value={mockProject.client} />
                <DetailItem icon={CalendarDays} label="Status" value={mockProject.status} />
                <DetailItem icon={CalendarDays} label="Priority" value={mockProject.priority} />
                <DetailItem icon={CalendarDays} label="Due Date" value={mockProject.due} />
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <h4 className="text-[15px] font-semibold text-[var(--foreground)]">Team Visibility</h4>
              <p className="mt-2 text-sm text-[var(--muted)]">Team members with access to this project can view tasks, documents, and AI analysis.</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="size-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--accent)]">SM</span>
                </div>
                <div className="size-8 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--warning)]">MW</span>
                </div>
                <div className="size-8 rounded-full bg-[var(--info)]/10 border border-[var(--info)]/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--info)]">PP</span>
                </div>
                <div className="size-8 rounded-full -ml-2 border-2 border-[var(--background)] bg-[var(--muted)]/10 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-[var(--muted)]">+2</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 flex-1">
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <h4 className="text-[15px] font-semibold text-[var(--foreground)]">Quick Actions</h4>
              <div className="mt-3 space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-left hover:bg-[var(--background)] transition-colors">
                  <FileText size={18} className="text-[var(--accent)] flex-shrink-0" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Add Brief</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-left hover:bg-[var(--background)] transition-colors">
                  <Sparkles size={18} className="text-[var(--accent)] flex-shrink-0" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Run AI Analysis</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-left hover:bg-[var(--background)] transition-colors">
                  <CheckCheck size={18} className="text-[var(--success)] flex-shrink-0" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Add Task</span>
                </button>
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <h4 className="text-[15px] font-semibold text-[var(--foreground)]">Navigation</h4>
              <div className="mt-3 space-y-1">
                <NavLink active>Overview</NavLink>
                <NavLink>Tasks</NavLink>
                <NavLink>Documents</NavLink>
                <NavLink>AI Intelligence</NavLink>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MockupFrame>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"><Icon size={15} /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
        <p className="mt-1 truncate text-sm text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}

function NavLink({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm font-medium transition-colors ${active ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
      {active && <span className="size-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
}

