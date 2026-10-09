import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCheck, FolderKanban, Mail, MessageSquareText, UserRound } from "lucide-react";
import { TaskDeleteDialog } from "@/components/tasks/task-delete-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskStatusControl } from "@/components/tasks/task-status-control";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { taskPriorityLabels, taskPriorityTone, taskStatusLabels, taskStatusTone } from "@/lib/tasks/options";
import { formatTaskDueDate } from "@/lib/tasks/timeline";

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function TaskDetailPage({ params }: PageProps<"/tasks/[taskId]">) {
  const { taskId } = await params;
  const { organization } = await requireOrganization();

  let task;
  try {
    task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: organization.id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, client: { select: { id: true, name: true, company: true, email: true, phone: true } } } },
        activities: {
          where: { organizationId: organization.id },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, description: true, createdAt: true, actor: { select: { name: true } } },
        },
      },
    });
  } catch (error) {
    console.error("Task detail failed to load.", { taskId, error });
    throw error;
  }

  if (!task) notFound();

  const [projects, teamMembers, activityCount] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, client: { select: { name: true, company: true } } },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: organization.id },
      orderBy: { user: { name: "asc" } },
      select: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activity.count({ where: { organizationId: organization.id, taskId: task.id } }),
  ]);

  const draft = {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    projectId: task.project.id,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? undefined,
    assigneeId: task.assignee?.id ?? undefined,
    updatedAt: task.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="pt-2 sm:pt-5">
        <Link href="/tasks" className="inline-flex h-8 items-center gap-1.5 rounded-md pr-2 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <ArrowLeft size={14} /> Tasks
        </Link>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-muted)]">Task details</p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[32px]">{task.title}</h1>
              <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium ${taskStatusTone[task.status]}`}>{taskStatusLabels[task.status]}</span>
              <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium ${taskPriorityTone[task.priority]}`}>{taskPriorityLabels[task.priority]}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              <Link href={`/projects/${task.project.id}/tasks`} className="inline-flex items-center gap-1 text-[var(--accent-muted)] hover:text-[var(--foreground)]">
                {task.project.name} <span className="text-[var(--muted-foreground)]">·</span> {task.project.client.company || task.project.client.name}
              </Link>
              <span className="mx-1.5 text-[var(--muted-foreground)]">·</span> Created {formatDate(task.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusControl taskId={task.id} initialStatus={task.status} />
            <TaskFormDialog task={draft} projects={projects.map((project) => ({ id: project.id, name: project.name, clientName: project.client.company || project.client.name }))} teamMembers={teamMembers.map((member) => ({ id: member.user.id, name: member.user.name, email: member.user.email }))} />
            <TaskDeleteDialog taskId={task.id} title={task.title} projectName={task.project.name} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
        <section className="space-y-6">
          <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-[var(--foreground)]">Task information</h2>
            <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <ContactItem icon={FolderKanban} label="Project" value={task.project.name} href={`/projects/${task.project.id}`} />
              <ContactItem icon={UserRound} label="Assignee" value={task.assignee?.name ?? "Unassigned"} />
              <ContactItem icon={CalendarDays} label="Status" value={taskStatusLabels[task.status]} />
              <ContactItem icon={CalendarDays} label="Priority" value={taskPriorityLabels[task.priority]} />
              <ContactItem icon={CalendarDays} label="Due date" value={task.dueDate ? formatTaskDueDate(task.dueDate) : null} />
              <ContactItem icon={CalendarDays} label="Created" value={formatDate(task.createdAt)} />
              <ContactItem icon={CalendarDays} label="Last updated" value={formatDate(task.updatedAt)} />
              {task.completedAt && <ContactItem icon={CheckCheck} label="Completed" value={formatDate(task.completedAt)} />}
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-[var(--foreground)]">Description</h2>
            {task.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{task.description}</p> : <p className="mt-3 text-sm text-[var(--muted)]">No task description yet.</p>}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--foreground)]">Project details</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Connected client and delivery context.</p>
              </div>
              <Link href={`/projects/${task.project.id}/tasks`} className="inline-flex py-2.5 items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                Back to Project Tasks
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              <ContactItem icon={UserRound} label="Client" value={task.project.client.company || task.project.client.name} href={`/clients/${task.project.client.id}`} />
              <ContactItem icon={Mail} label="Client email" value={task.project.client.email} href={task.project.client.email ? `mailto:${task.project.client.email}` : undefined} />
              <ContactItem icon={MessageSquareText} label="Created by" value={task.createdBy?.name ?? "Unknown"} />
            </div>
          </section>

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5" aria-labelledby="task-activity-heading">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="task-activity-heading" className="text-[15px] font-semibold text-[var(--foreground)]">Activity</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Recent changes to this task.</p>
              </div>
              <span className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-[11px] text-[var(--muted)]">{activityCount}</span>
            </div>
            {task.activities.length ? (
              <ol className="mt-5 space-y-0">
                {task.activities.map((activity, index) => (
                  <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < task.activities.length - 1 && <span aria-hidden="true" className="absolute left-[5px] top-3 h-full w-px bg-[var(--line)]" />}
                    <span aria-hidden="true" className="relative mt-1 size-3 shrink-0 rounded-full border-2 border-[var(--accent)]/50 bg-[var(--surface)]" />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-5 text-[var(--foreground)]">{activity.description}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">{activity.actor.name} <span className="mx-1 text-[var(--muted-foreground)]">·</span> {activity.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted)]">No activity has been recorded yet.</p>
            )}
            {activityCount > task.activities.length && <p className="mt-4 border-t border-[var(--line)] pt-3 text-[11px] text-[var(--muted)]">Showing the 20 most recent events.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value, href }: { icon: typeof CalendarDays; label: string; value: string | null; href?: string }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]"><Icon size={15} /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
        {href && value ? <a href={href} className="mt-1 block truncate text-sm text-[var(--accent-muted)] hover:text-[var(--foreground)]">{value}</a> : <p className="mt-1 truncate text-sm text-[var(--foreground)]">{value || "Not set"}</p>}
      </div>
    </div>
  );
}
