import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  FolderKanban,
  FileText,
  MessageSquareMore,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { projectPriorityLabels, projectStatusLabels, projectStatusTone } from "@/lib/projects/options";
import { activeProjectStatuses, DUE_SOON_DAYS, endOfToday, getProjectTimelineState, projectTimelineLabels, startOfToday, type TimelineState } from "@/lib/projects/timeline";
import { taskPriorityLabels, taskPriorityTone, taskStatusLabels, taskStatusTone } from "@/lib/tasks/options";
import { getDashboardTaskData } from "@/lib/tasks/dashboard-data";
import { formatTaskDueDate } from "@/lib/tasks/timeline";
import { getProjectAIAnalysisState } from "@/lib/project-ai/persistence";

const timelineAttentionTone: Record<TimelineState, string> = {
  not_started: "border-white/10 bg-white/[0.04] text-white/60",
  on_track: "border-[#3b82f6]/25 bg-[#3b82f6]/10 text-[#93c5fd]",
  due_soon: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]",
  overdue: "border-[#ef4444]/25 bg-[#ef4444]/10 text-[#fca5a5]",
  completed: "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac]",
  cancelled: "border-white/10 bg-white/[0.04] text-white/45",
  no_schedule: "border-white/10 bg-white/[0.04] text-white/45",
};

const metrics = (
  leadCount: number,
  clientCount: number,
  activeProjectCount: number,
  overdueTaskCount: number | null,
) => [
  {
    href: "/leads",
    label: "Total Leads",
    value: leadCount.toLocaleString(),
    note: "Across all lead stages",
    icon: Users,
    tone: "border-white/10 bg-[#18181b]",
    accent: "bg-[#8b5cf6]/10 text-[#c4b5fd]",
  },
  {
    href: "/clients",
    label: "Active Clients",
    value: clientCount.toLocaleString(),
    note: "Active client relationships",
    icon: BriefcaseBusiness,
    tone: "border-white/10 bg-[#18181b]",
    accent: "bg-[#3b82f6]/10 text-[#93c5fd]",
  },
  {
    href: "/projects",
    label: "Active Projects",
    value: activeProjectCount.toLocaleString(),
    note: "Projects in delivery",
    icon: FolderKanban,
    tone: "border-white/10 bg-[#18181b]",
    accent: "bg-[#22c55e]/10 text-[#86efac]",
  },
  {
    href: "/tasks?due=OVERDUE&status=OPEN",
    label: "Overdue Tasks",
    value: overdueTaskCount === null ? "—" : overdueTaskCount.toLocaleString(),
    note: overdueTaskCount === null ? "Unable to load task data" : "Past due and still open",
    icon: CircleAlert,
    tone: overdueTaskCount !== null && overdueTaskCount > 0 ? "border-[#ef4444]/20 bg-[#18181b]" : "border-white/10 bg-[#18181b]",
    accent: "bg-[#ef4444]/10 text-[#fca5a5]",
  },
];

const assistantPrompts = [
  "Help me plan a productive workday.",
  "How can I prepare for a client kickoff?",
  "Suggest a clear project status update.",
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 18 || hour < 5) return "Good evening";
  if (hour >= 12) return "Good afternoon";
  return "Good morning";
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  const { profile, organization } = await requireOrganization();
  const now = new Date();

  const [leadCount, clientCount, activeProjectCount, activeProjects, attentionProjects, recentActivity, taskData] = await Promise.all([
    prisma.lead.count({ where: { organizationId: organization.id } }),
    prisma.client.count({ where: { organizationId: organization.id, status: "ACTIVE" } }),
    prisma.project.count({ where: { organizationId: organization.id, status: { in: activeProjectStatuses } } }),
    prisma.project.findMany({
      where: { organizationId: organization.id, status: { in: activeProjectStatuses } },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
      take: 4,
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        client: { select: { name: true, company: true } },
      },
    }),
    prisma.project.findMany({
      where: {
        organizationId: organization.id,
        status: { in: activeProjectStatuses },
        dueDate: { lte: endOfToday(new Date(startOfToday(now).getTime() + DUE_SOON_DAYS * 86_400_000)) },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        client: { select: { name: true, company: true } },
      },
    }),
    prisma.activity.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        actor: { select: { name: true } },
        project: { select: { id: true } },
        client: { select: { id: true, name: true, company: true } },
        task: { select: { id: true } },
      },
    }).catch((error: unknown) => {
      console.error("Dashboard recent activity query failed.", error);
      return [];
    }),
    getDashboardTaskData(organization.id, now),
  ]);
  const projectAIStates = await Promise.all(activeProjects.map(async (project) => {
    try {
      return { projectId: project.id, state: await getProjectAIAnalysisState(project.id) };
    } catch (error) {
      console.error("Dashboard project AI state query failed.", {
        projectId: project.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return { projectId: project.id, state: null };
    }
  }));

  const firstName = profile.name.trim().split(/\s+/)[0] || null;
  const greeting = getGreeting();
  const workspaceName = organization?.name?.trim() || "your workspace";
  const overdueAttentionTasks = taskData.status === "success" ? taskData.overdueTasks.slice(0, 5) : [];
  const attentionProjectLimit = Math.max(0, 5 - overdueAttentionTasks.length);
  const visibleAttentionProjects = attentionProjects.slice(0, attentionProjectLimit);

  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col gap-5 pt-2 sm:gap-6 lg:flex-row lg:items-end lg:justify-between lg:pt-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b5cf6]">Workspace overview</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#f4f4f5] sm:text-[32px]">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Here&apos;s what&apos;s happening with <span className="font-medium text-white/80">{workspaceName}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
          <Link
            href="/leads"
            className={buttonVariants({
              size: "default",
              className: "h-10 rounded-lg border border-[#8b5cf6]/35 bg-[#8b5cf6]/12 px-4 text-sm font-medium text-[#f4f4f5] hover:bg-muted",
            })}
          >
            <Plus size={16} strokeWidth={2.2} />
            New Lead
          </Link>
          <Link
            href="/projects"
            className={buttonVariants({
              variant: "primary",
              className: "h-10 rounded-lg border border-white/10  px-4 text-sm font-medium text-[#f4f4f5] hover:bg-accent/80",
            })}
          >
            <Plus size={16} strokeWidth={2.2} />
            New Project
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace metrics">
        {metrics(leadCount, clientCount, activeProjectCount, taskData.status === "success" ? taskData.overdueCount : null).map(({ href, label, value, note, icon: Icon, tone, accent }) => (
          <Link
            key={label}
            href={href}
            className="group block rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
          >
            <Card className={`flex min-h-[120px] flex-col justify-between border text-white transition-colors duration-200 group-hover:border-white/20 ${tone}`}>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 p-4 pb-0">
                <CardTitle className="text-[12px] font-medium tracking-[0.01em] text-white/65">{label}</CardTitle>
                <span className={`grid size-8 place-items-center rounded-md border border-white/10 ${accent}`}>
                  <Icon size={16} strokeWidth={2} />
                </span>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-3 p-4 pt-0">
                <p className="text-[26px] font-semibold leading-none tracking-[-0.05em] text-[#f4f4f5]">{value}</p>
                <p className="text-[11px] leading-relaxed text-white/45">{note}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(290px,1fr)]">
        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Active Projects</h2>
              <p className="mt-1 text-[12px] text-white/50">Projects in planning, delivery, or on hold.</p>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-[#c4b5fd] hover:text-white">
              View all projects
              <ChevronRight size={15} />
            </Link>
          </div>

          {activeProjects.length ? (
            <div className="space-y-3">
              {activeProjects.map((project) => {
                const timeline = getProjectTimelineState(project.status, project.startDate, project.dueDate, now);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block rounded-xl border border-white/10 bg-[#111113] p-3 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[14px] font-semibold text-[#f4f4f5]">{project.name}</p>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${projectStatusTone[project.status]}`}>
                            {projectStatusLabels[project.status]}
                          </span>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${timelineAttentionTone[timeline]}`}>
                            {projectTimelineLabels[timeline]}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-white/50">{project.client.company || project.client.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-white/55">
                        <span>{projectPriorityLabels[project.priority]} priority</span>
                        <span className="text-white/25">•</span>
                        <span>{project.dueDate ? `Due ${formatShortDate(project.dueDate)}` : "No due date"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/12 bg-[#111113] px-4 py-8 text-center text-sm text-white/45">
              No active projects yet.
            </p>
          )}
        </Card>

        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Attention Required</h2>
            <p className="mt-1 text-[12px] text-white/50">Overdue tasks and projects needing attention.</p>
          </div>

          {visibleAttentionProjects.length || overdueAttentionTasks.length ? (
            <div className="space-y-3">
              {overdueAttentionTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-start gap-3 rounded-xl border border-[#ef4444]/15 bg-[#111113] p-3 transition-colors hover:border-[#ef4444]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]">
                    <AlertCircle size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-medium text-[#f4f4f5]">{task.title}</p>
                      <span className="shrink-0 text-[10px] font-medium text-[#fca5a5]">{taskPriorityLabels[task.priority]}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                      {task.project.client.company || task.project.client.name} · {task.project.name} · Due {task.dueDate ? formatTaskDueDate(task.dueDate) : ""}
                    </p>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${taskStatusTone[task.status]}`}>{taskStatusLabels[task.status]}</span>
                  </div>
                </Link>
              ))}
              {visibleAttentionProjects.map((project) => {
                const timeline = getProjectTimelineState(project.status, project.startDate, project.dueDate, now);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-3 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                  >
                    <span
                      className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border ${
                        timeline === "overdue"
                          ? "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]"
                          : "border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#fbbf24]"
                      }`}
                    >
                      {timeline === "overdue" ? <AlertCircle size={14} /> : <Clock3 size={14} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-medium text-[#f4f4f5]">{project.name}</p>
                        <span className={`shrink-0 text-[10px] font-medium ${timeline === "overdue" ? "text-[#fca5a5]" : "text-[#fbbf24]"}`}>
                          {projectPriorityLabels[project.priority]}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                        {project.client.company || project.client.name} · {timeline === "overdue" ? "Overdue" : "Due soon"}
                        {project.dueDate ? ` — ${formatShortDate(project.dueDate)}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            taskData.status === "error" ? (
              <p role="status" className="rounded-xl border border-dashed border-white/12 bg-[#111113] px-4 py-8 text-center text-sm text-white/45">
                Task attention data is temporarily unavailable.
              </p>
            ) : (
              <p className="rounded-xl border border-dashed border-white/12 bg-[#111113] px-4 py-8 text-center text-sm text-white/45">
                Nothing needs attention right now.
              </p>
            )
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-white/50">
              <FolderKanban size={15} />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Upcoming Tasks</h2>
              <p className="mt-1 text-[12px] text-white/50">See what needs to be completed next.</p>
            </div>
          </div>
          {taskData.status === "error" ? (
            <p role="status" className="rounded-xl border border-dashed border-white/12 bg-[#111113] px-4 py-8 text-center text-sm text-white/45">
              Unable to load upcoming tasks.
            </p>
          ) : taskData.upcomingTasks.length ? (
            <div className="space-y-3">
              {taskData.upcomingTasks.map((task) => (
                <article
                  key={task.id}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-3 transition-colors hover:border-white/15"
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 text-[#c4b5fd]">
                    <CheckCheck size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/tasks/${task.id}`} className="truncate rounded-sm text-[13px] font-medium text-[#f4f4f5] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]">{task.title}</Link>
                      <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${taskStatusTone[task.status]}`}>
                        {taskStatusLabels[task.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                      <Link href={`/projects/${task.project.id}`} className="rounded-sm hover:text-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]">
                        {task.project.name}
                      </Link>
                      {" · "}{task.project.client.company || task.project.client.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                      <span className={`inline-flex rounded-full border px-1.5 py-0.5 ${taskPriorityTone[task.priority]}`}>
                        {taskPriorityLabels[task.priority]}
                      </span>
                      {task.assignee ? <span>Assigned to {task.assignee.name}</span> : <span>Unassigned</span>}
                      {task.dueDate ? <span>Due {formatTaskDueDate(task.dueDate)}</span> : <span>No due date</span>}
                    </div>
                  </div>
                </article>
              ))}
              <Link href="/tasks" className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[#c4b5fd] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]">
                View all tasks <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/12 bg-[#111113] px-4 py-8 text-center">
              <p className="text-sm text-white/60">No upcoming tasks</p>
              <p className="mt-1 text-xs text-white/40">You&apos;re clear for now. New tasks with upcoming deadlines will appear here.</p>
              <Link href="/tasks" className="mt-3 inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[#c4b5fd] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]">
                View Tasks <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </Card>

        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Recent Activity</h2>
            <p className="mt-1 text-[12px] text-white/50">A snapshot of what&apos;s been happening in your workspace.</p>
          </div>

          {recentActivity.length ? (
            <div className="space-y-3">
              {recentActivity.map((item) => {
                const href = item.type.startsWith("DOCUMENT") && item.project
                  ? `/projects/${item.project.id}/documents`
                  : item.task
                  ? `/tasks/${item.task.id}`
                  : item.project
                  ? `/projects/${item.project.id}`
                  : item.client
                    ? `/clients/${item.client.id}`
                    : item.type.startsWith("LEAD")
                      ? "/leads"
                      : null;
                const entity = item.task?.id ?? item.project?.id ?? item.client?.name ?? null;
                const body = (
                  <>
                    <span
                      className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border ${
                        item.type.startsWith("TASK")
                          ? "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac]"
                          : item.type.startsWith("PROJECT") || item.type.startsWith("DOCUMENT")
                          ? "border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]"
                          : "border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#93c5fd]"
                      }`}
                    >
                      {item.type.startsWith("DOCUMENT")
                        ? <FileText size={12} />
                        : item.type.startsWith("PROJECT")
                          ? <FolderKanban size={12} />
                          : <CheckCheck size={12} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] leading-relaxed text-white/80">{item.description}</p>
                      <p className="mt-1 text-[11px] text-white/45">{item.actor.name}</p>
                      <p className="mt-1 text-[11px] text-white/40">{formatShortDate(item.createdAt)}</p>
                    </div>
                  </>
                );

                return href ? (
                  <Link key={`${entity}-${item.id}`} href={href} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-3 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]">
                    {body}
                  </Link>
                ) : (
                  <div key={`${entity}-${item.id}`} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-3">
                    {body}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/12 bg-[#111113] px-4 py-8 text-center text-sm text-white/45">
              No activity recorded yet.
            </p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="border border-white/10 bg-[#151518] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 text-[#c4b5fd]">
                <Sparkles size={15} />
              </span>
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">AI Project Intelligence</h2>
                <p className="mt-1 text-[12px] text-white/55">Turn client briefs into structured project insights.</p>
              </div>
            </div>
            <Link href="/projects" className="inline-flex min-h-8 items-center gap-1 rounded-sm text-xs font-medium text-[#c4b5fd] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]">
              Projects <ChevronRight size={13} aria-hidden="true" />
            </Link>
          </div>

            {projectAIStates.length ? (
              <ul className="space-y-2">
                {projectAIStates.map(({ projectId, state }) => {
                  const project = activeProjects.find((item) => item.id === projectId);
                  if (!project) return null;
                  const statusLabel = !state
                    ? "AI status unavailable"
                    : state.status === "COMPLETED" && state.analysisIsCurrent
                      ? "Analyzed"
                      : state.status === "READY"
                        ? "Ready for analysis"
                        : state.status === "PROCESSING"
                          ? "Analyzing"
                          : state.status === "STALE"
                            ? "Analysis needs updating"
                            : state.status === "SOURCE_MISSING"
                              ? "Analysis source unavailable"
                              : state.status === "NO_BRIEF"
                                ? "Primary brief needed"
                                : "Analysis needs attention";

                  return (
                    <li key={projectId}>
                      <Link
                        href={`/projects/${projectId}/ai`}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/8 bg-[#111113] px-3 py-2 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-white/80">{project.name}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-white/45">
                            {state?.status === "COMPLETED" && state.analysisIsCurrent
                              ? `Analyzed · ${state.analysis?.sourceDocumentName ?? "Primary brief"}`
                              : statusLabel}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-[#c4b5fd]">Open <ChevronRight size={12} className="inline" aria-hidden="true" /></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-white/12 bg-[#111113] px-4 py-8 text-center text-sm text-white/45">
                No active projects yet.
              </p>
            )}
        </Card>

        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 text-[#c4b5fd]">
              <MessageSquareMore size={15} />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">AI Assistant</h2>
              <p className="mt-1 text-[12px] text-white/55">Explore general business questions and ideas.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {assistantPrompts.map((suggestion) => (
              <Link
                key={suggestion}
                href="/assistant"
                className="rounded-full border border-white/10 bg-[#111113] px-3 py-1.5 text-[11px] text-white/75 transition-colors hover:border-[#8b5cf6]/30 hover:text-white"
              >
                {suggestion}
              </Link>
            ))}
          </div>

          <Link href="/assistant" className={buttonVariants({ variant: "primary", className: "mt-4 w-full justify-center border border-white/10 bg-accent text-white hover:bg-white/[0.04]" })}>
            Open assistant
          </Link>
        </Card>
      </section>
    </div>
  );
}