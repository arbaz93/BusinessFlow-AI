import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  FolderKanban,
  MessageSquareMore,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

const metrics = (leadCount: number, clientCount: number) => [
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
    value: "8",
    note: "Projects in delivery",
    icon: FolderKanban,
    tone: "border-white/10 bg-[#18181b]",
    accent: "bg-[#22c55e]/10 text-[#86efac]",
  },
  {
    href: "/projects",
    label: "Overdue Tasks",
    value: "3",
    note: "Tasks requiring attention",
    icon: CircleAlert,
    tone: "border-[#ef4444]/20 bg-[#18181b]",
    accent: "bg-[#ef4444]/10 text-[#fca5a5]",
  },
];

const activeProjects = [
  { name: "Acme Fitness", project: "Website Redesign", status: "In Progress", progress: 72, deadline: "October 15, 2026", tasks: "14 of 19 completed" },
  { name: "Northstar Coffee", project: "E-commerce Website", status: "In Review", progress: 85, deadline: "October 8, 2026", tasks: "17 of 20 completed" },
  { name: "BrightPath Consulting", project: "Brand & Marketing Website", status: "Planning", progress: 25, deadline: "October 28, 2026", tasks: "3 of 12 completed" },
];

const attentionItems = [
  { type: "overdue", title: "Homepage wireframe approval", subtitle: "Acme Fitness Website Redesign • Due 2 days ago", priority: "High", href: "/projects" },
  { type: "risk", title: "E-commerce Website", subtitle: "Deadline approaching with incomplete tasks", priority: "Warning", href: "/projects" },
  { type: "follow-up", title: "Follow up with Sarah Johnson", subtitle: "Qualified lead awaiting next step", priority: "Normal", href: "/leads" },
];

const upcomingTasks = [
  { title: "Finalize homepage wireframes", project: "Acme Fitness Website Redesign", due: "Today", priority: "High", href: "/projects" },
  { title: "Review product photography", project: "Northstar Coffee E-commerce", due: "Tomorrow", priority: "Medium", href: "/projects" },
  { title: "Prepare homepage content", project: "BrightPath Consulting Website", due: "Sep 30", priority: "Medium", href: "/projects" },
  { title: "Confirm mobile navigation design", project: "Acme Fitness Website Redesign", due: "Oct 2", priority: "Low", href: "/projects" },
];

const recentActivity = [
  { description: "Arbaz created a new project", entity: "Acme Fitness Website Redesign", time: "10 minutes ago", type: "human" },
  { description: "Sarah Johnson was converted into a client", entity: "Acme Fitness", time: "2 hours ago", type: "human" },
  { description: "Homepage wireframes were marked complete", entity: "Acme Fitness Website Redesign", time: "Yesterday", type: "system" },
  { description: "A client brief was analyzed by AI", entity: "Acme Fitness Website Redesign", time: "Yesterday", type: "ai" },
];

const assistantPrompts = ["Which tasks are overdue?", "What projects need attention?", "Which leads need follow-up?"];

const statusStyles: Record<string, string> = {
  Planning: "border-white/10 bg-white/5 text-white/70",
  "In Progress": "border-[#3b82f6]/25 bg-[#3b82f6]/10 text-[#93c5fd]",
  "In Review": "border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]",
  Completed: "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac]",
  "On Hold": "border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#fbbf24]",
};

const priorityStyles: Record<string, string> = {
  High: "text-[#fca5a5]",
  Warning: "text-[#fbbf24]",
  Normal: "text-[#93c5fd]",
  Medium: "text-[#fbbf24]",
  Low: "text-white/55",
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 18 || hour < 5) return "Good evening";
  if (hour >= 12) return "Good afternoon";
  return "Good morning";
}

export default async function DashboardPage() {
  const { profile, organization } = await requireOrganization();
  const [leadCount, clientCount] = await Promise.all([
    prisma.lead.count({ where: { organizationId: organization.id } }),
    prisma.client.count({ where: { organizationId: organization.id, status: "ACTIVE" } }),
  ]);
  const firstName = profile.name.trim().split(/\s+/)[0] || null;
  const greeting = getGreeting();
  const workspaceName = organization?.name?.trim() || "your workspace";

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
              className: "h-10 rounded-lg border border-[#8b5cf6]/35 bg-[#8b5cf6]/12 px-4 text-sm font-medium text-[#f4f4f5] hover:bg-[#8b5cf6]/18",
            })}
          >
            <Plus size={16} strokeWidth={2.2} />
            New Lead
          </Link>
          <Link
            href="/projects"
            className={buttonVariants({
              variant: "outline",
              className: "h-10 rounded-lg border border-white/10 bg-[#18181b] px-4 text-sm font-medium text-[#f4f4f5] hover:bg-white/[0.04]",
            })}
          >
            <Plus size={16} strokeWidth={2.2} />
            New Project
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace metrics">
        {metrics(leadCount, clientCount).map(({ href, label, value, note, icon: Icon, tone, accent }) => (
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
              <p className="mt-1 text-[12px] text-white/50">Track progress and keep delivery moving.</p>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-[#c4b5fd] hover:text-white">
              View all projects
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="mb-3 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/50 w-fit">
            Demo data
          </div>

          <div className="space-y-3">
            {activeProjects.map((project) => (
              <Link
                key={project.project}
                href="/projects"
                className="group block rounded-xl border border-white/10 bg-[#111113] p-3 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-semibold text-[#f4f4f5]">{project.project}</p>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles[project.status]}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-white/50">{project.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-white/55">
                    <span>{project.tasks}</span>
                    <span className="text-white/25">•</span>
                    <span>{project.deadline}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-white/55">
                    <span>Progress</span>
                    <span className="font-medium text-white/75">{project.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-[#8b5cf6]" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Attention Required</h2>
            <p className="mt-1 text-[12px] text-white/50">Items that may need your attention.</p>
          </div>

          <div className="space-y-3">
            {attentionItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-3 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
              >
                <span
                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border ${
                    item.type === "overdue"
                      ? "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]"
                      : item.type === "risk"
                        ? "border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#fbbf24]"
                        : "border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#93c5fd]"
                  }`}
                >
                  {item.type === "overdue" ? <AlertCircle size={14} /> : item.type === "risk" ? <Clock3 size={14} /> : <MessageSquareMore size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-[#f4f4f5]">{item.title}</p>
                    <span className={`text-[10px] font-medium ${priorityStyles[item.priority]}`}>{item.priority}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-white/55">{item.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Upcoming Tasks</h2>
              <p className="mt-1 text-[12px] text-white/50">See what needs to be completed next.</p>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-[#c4b5fd] hover:text-white">
              View tasks
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <Link
                key={task.title}
                href={task.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111113] px-3 py-3 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#f4f4f5]">{task.title}</p>
                  <p className="mt-1 text-[11px] text-white/50">{task.project}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] text-white/55">
                  <span>{task.due}</span>
                  <span className={`font-medium ${priorityStyles[task.priority]}`}>{task.priority}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Recent Activity</h2>
            <p className="mt-1 text-[12px] text-white/50">A snapshot of what&apos;s been happening in your workspace.</p>
          </div>

          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={`${item.description}-${item.time}`} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-3">
                <span
                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border ${
                    item.type === "ai"
                      ? "border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]"
                      : item.type === "system"
                        ? "border-white/10 bg-white/5 text-white/75"
                        : "border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#93c5fd]"
                  }`}
                >
                  {item.type === "ai" ? <Sparkles size={12} /> : <CheckCheck size={12} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-relaxed text-white/80">{item.description}</p>
                  <p className="mt-1 text-[11px] text-white/45">{item.entity}</p>
                  <p className="mt-1 text-[11px] text-white/40">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
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
            <span className="rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/8 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#c4b5fd]">
              AI-powered
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111113] p-3">
            <p className="text-[14px] font-medium text-[#f4f4f5]">Acme Fitness Website Redesign</p>
            <p className="mt-1 text-[12px] text-white/55">Project brief analyzed</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                <p className="text-[11px] text-white/45">Requirements identified</p>
                <p className="mt-1 text-[20px] font-semibold text-[#f4f4f5]">12</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                <p className="text-[11px] text-white/45">Task suggestions</p>
                <p className="mt-1 text-[20px] font-semibold text-[#f4f4f5]">8</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[12px] text-white/60">
              <span>3 risks flagged</span>
              <span>2 questions pending</span>
            </div>

            <Link href="/projects" className={buttonVariants({ className: "mt-4 w-full bg-[#8b5cf6] text-white hover:bg-[#8b83f5]" })}>
              View AI Insights
            </Link>
          </div>
        </Card>

        <Card className="border border-white/10 bg-[#18181b] p-4 text-white shadow-none sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 text-[#c4b5fd]">
              <MessageSquareMore size={15} />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">Ask your business</h2>
              <p className="mt-1 text-[12px] text-white/55">Get answers about your leads, projects, and tasks.</p>
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

          <Link href="/assistant" className={buttonVariants({ variant: "outline", className: "mt-4 w-full justify-center border border-white/10 bg-[#111113] text-white hover:bg-white/[0.04]" })}>
            Open assistant
          </Link>
        </Card>
      </section>
    </div>
  );
}