import Link from "next/link";
import { CalendarDays, CheckCheck, ChevronRight, Clock3, ExternalLink, FolderKanban, UserRound } from "lucide-react";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { ProjectAIOverviewSummary } from "@/components/projects/project-ai-overview-summary";
import { prisma } from "@/lib/db/prisma";
import { projectPriorityLabels } from "@/lib/projects/options";
import { activeTaskStatuses, taskPriorityLabels, taskPriorityTone, taskStatusLabels, taskStatusTone } from "@/lib/tasks/options";
import { getTaskProgress } from "@/lib/tasks/progress";
import { formatTaskDueDate, getTaskDateWindow, getTaskTimelineState, taskTimelineLabels } from "@/lib/tasks/timeline";
import { getProjectTimelineState, projectTimelineLabels } from "@/lib/projects/timeline";
import { getProjectWorkspace } from "@/lib/projects/workspace";
import { getProjectAIAnalysisState } from "@/lib/project-ai/persistence";

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function ProjectOverviewPage({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const { organizationId, project } = await getProjectWorkspace(projectId);
  const { overdueBefore } = getTaskDateWindow();

  let taskStatusCounts: Array<{ status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED"; _count: { _all: number } }> = [];
  let openTaskCount = 0;
  let overdueTaskCount = 0;
  let recentTasks: Array<{ id: string; title: string; status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED"; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; dueDate: Date | null; assignee: { name: string } | null }> = [];
  let activities: Array<{ id: string; description: string; createdAt: Date; actor: { name: string } | null }> = [];
  let teamMembers: Array<{ user: { id: string; name: string; email: string } }> = [];

  try {
    [taskStatusCounts, openTaskCount, overdueTaskCount, recentTasks, activities, teamMembers] = await Promise.all([
      prisma.task.groupBy({
        by: ["status"],
        where: { organizationId, projectId: project.id },
        _count: { _all: true },
      }),
      prisma.task.count({ where: { organizationId, projectId: project.id, status: { in: activeTaskStatuses } } }),
      prisma.task.count({
        where: {
          organizationId,
          projectId: project.id,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { lt: overdueBefore },
        },
      }),
      prisma.task.findMany({
        where: { organizationId, projectId: project.id, status: { not: "CANCELLED" } },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { name: true } },
        },
      }),
      prisma.activity.findMany({
        where: { organizationId, projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          description: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      }),
      prisma.organizationMember.findMany({
        where: { organizationId },
        orderBy: { user: { name: "asc" } },
        select: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);
  } catch (error) {
    console.error("Project overview failed to load.", { projectId, error });
    throw error;
  }

  const progress = getTaskProgress(Object.fromEntries(taskStatusCounts.map(({ status, _count }) => [status, _count._all])));
  const { total: eligibleTaskCount, completed: completedTaskCount } = progress;
  const timeline = getProjectTimelineState(project.status, project.startDate, project.dueDate);
  const projectChoice = [{
    id: project.id,
    name: project.name,
    clientName: project.client.company || project.client.name,
  }];
  let aiState = null;
  try {
    aiState = await getProjectAIAnalysisState(project.id);
  } catch (error) {
    console.error("Project Overview AI summary query failed.", {
      projectId: project.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Project task metrics">
        <Metric label="Eligible tasks" value={eligibleTaskCount} note="Cancelled tasks excluded" />
        <Metric label="Open tasks" value={openTaskCount} note="To do, in progress, or blocked" />
        <Metric label="Completed" value={completedTaskCount} note="Completed tasks" />
        <Metric label="Overdue" value={overdueTaskCount} note="Past due and still open" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(290px,0.8fr)]">
        <div className="space-y-6">

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5" aria-labelledby="project-progress">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="project-progress" className="text-[16px] font-semibold text-[var(--foreground)]">Task progress</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {eligibleTaskCount ? `${completedTaskCount} of ${eligibleTaskCount} tasks completed` : "No tasks yet"}
                </p>
              </div>
              <span className="text-lg font-semibold text-[var(--foreground)]">{progress.percentage !== null ? `${progress.percentage}%` : "—"}</span>
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel)]"
              role="progressbar"
              aria-label="Project task completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percentage ?? 0}
            >
              {progress.percentage !== null && <div className="h-full rounded-full bg-[var(--accent)] transition-[width]" style={{ width: `${progress.percentage}%` }} />}
            </div>
            {!eligibleTaskCount && (
              <p className="mt-4 text-sm text-[var(--muted)]">Add tasks to organize this project&apos;s work and track progress.</p>
            )}
          </section>

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5" aria-labelledby="project-summary">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="project-summary" className="text-[16px] font-semibold text-[var(--foreground)]">Project summary</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{project.description || "No project description yet."}</p>
              </div>
              <span className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-xs text-[var(--muted)]">
                {projectTimelineLabels[timeline]}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info label="Client" icon={FolderKanban}>
                <Link href={`/clients/${project.client.id}`} className="text-[var(--accent-muted)] hover:text-[var(--foreground)]">{project.client.company || project.client.name}</Link>
              </Info>
              <Info label="Project priority" icon={FolderKanban}>{projectPriorityLabels[project.priority]}</Info>
              <Info label="Start date" icon={CalendarDays}>{project.startDate ? formatDate(project.startDate) : "Not set"}</Info>
              <Info label="Due date" icon={CalendarDays}>{project.dueDate ? formatDate(project.dueDate) : "Not set"}</Info>
              <Info label="Created" icon={Clock3}>{formatDate(project.createdAt)}</Info>
              <Info label="Last updated" icon={Clock3}>{formatDate(project.updatedAt)}</Info>
            </div>
            {project.notes && (
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <h3 className="text-xs font-medium text-[var(--muted)]">Notes</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{project.notes}</p>
              </div>
            )}
          </section>

          <section>
            <ProjectAIOverviewSummary projectId={project.id} initialState={aiState} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5" aria-labelledby="project-recent-tasks">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="project-recent-tasks" className="text-[16px] font-semibold text-[var(--foreground)]">Recent tasks</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Priority work and upcoming deadlines.</p>
              </div>
              <Link href={`/projects/${project.id}/tasks`} className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[var(--accent-muted)] hover:text-[var(--foreground)]">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {recentTasks.length ? (
              <ul className="mt-4 space-y-2.5">
                {recentTasks.map((task) => {
                  const dueState = getTaskTimelineState(task.status, task.dueDate);
                  return (
                    <li key={task.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
                      <Link href={`/tasks/${task.id}`} className="block rounded-sm text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">{task.title}</Link>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${taskStatusTone[task.status]}`}>{taskStatusLabels[task.status]}</span>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${taskPriorityTone[task.priority]}`}>{taskPriorityLabels[task.priority]}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-[var(--muted)]">
                        {task.assignee?.name ?? "Unassigned"}
                        <span className="mx-1.5 text-[var(--muted-foreground)]">·</span>
                        {task.dueDate ? `${taskTimelineLabels[dueState]} ${formatTaskDueDate(task.dueDate)}` : "No due date"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel)] px-4 py-7 text-center">
                <CheckCheck size={18} className="mx-auto text-[var(--muted)]" aria-hidden="true" />
                <h3 className="mt-2 text-sm font-medium text-[var(--foreground)]">No tasks yet</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">Add tasks to organize this project&apos;s work and track progress.</p>
                <div className="mt-4">
                  <TaskFormDialog projects={projectChoice} teamMembers={teamMembers.map(({ user }) => ({ id: user.id, name: user.name, email: user.email }))} fixedProjectId={project.id} triggerLabel="Add Task" />
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5" aria-labelledby="project-activity">
            <div className="flex items-center gap-2">
              <Clock3 size={15} className="text-[var(--muted)]" aria-hidden="true" />
              <h2 id="project-activity" className="text-[16px] font-semibold text-[var(--foreground)]">Recent activity</h2>
            </div>
            {activities.length ? (
              <ol className="mt-4 space-y-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--accent)]/70" />
                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-[var(--foreground)]">{activity.description}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">{activity.actor?.name ?? "System"} · {activity.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">No activity has been recorded yet.</p>
            )}
          </section>

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
            <h2 className="text-[16px] font-semibold text-[var(--foreground)]">Client contact</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Project client details.</p>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-[var(--foreground)]"><UserRound size={14} className="text-[var(--muted)]" />{project.client.name}</p>
              {project.client.email && <a href={`mailto:${project.client.email}`} className="block text-[var(--accent-muted)] hover:text-[var(--foreground)]">{project.client.email}</a>}
              {project.client.phone && <a href={`tel:${project.client.phone}`} className="block text-[var(--accent-muted)] hover:text-[var(--foreground)]">{project.client.phone}</a>}
              <Link href={`/clients/${project.client.id}`} className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[var(--accent-muted)] hover:text-[var(--foreground)]">Open client <ExternalLink size={12} /></Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{value.toLocaleString()}</p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{note}</p>
    </div>
  );
}

function Info({ label, icon: Icon, children }: { label: string; icon: typeof CalendarDays; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]"><Icon size={15} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
        <div className="mt-1 truncate text-sm capitalize text-[var(--foreground)]">{children}</div>
      </div>
    </div>
  );
}
