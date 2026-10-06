import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { activeTaskStatuses } from "@/lib/tasks/options";
import { getTaskDateWindow } from "@/lib/tasks/timeline";
import { TaskStatus, TaskPriority } from "@/app/generated/prisma/enums";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date;
  assignee: { name: string } | null;
  project: {
    id: string;
    name: string;
    client: { name: string; company: string | null };
  };
};

type ProjectRow = {
  id: string;
  name: string;
  client: { name: string; company: string | null };
};

type MemberRow = {
  user: { id: string; name: string; email: string | null };
};

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const { organization } = await requireOrganization();
  const query = await searchParams;
  const taskDateWindow = getTaskDateWindow();
  const initialDueFilter = query.due === "OVERDUE" ? "OVERDUE" : "ALL";
  const initialOpenOnly = query.status === "OPEN";

  let tasks: TaskRow[] = [];
  let projects: ProjectRow[] = [];
  let teamMembers: MemberRow[] = [];
  let totalOpen = 0;
  let inProgress = 0;
  let overdue = 0;
  let completed = 0;
  let loadError = false;

  try {
    const result = await Promise.all([
      prisma.task.findMany({
        where: { organizationId: organization.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          updatedAt: true,
          createdAt: true,
          assignee: { select: { name: true } },
          project: { select: { id: true, name: true, client: { select: { name: true, company: true } } } },
        },
      }),
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
      prisma.task.count({ where: { organizationId: organization.id, status: { in: activeTaskStatuses } } }),
      prisma.task.count({ where: { organizationId: organization.id, status: "IN_PROGRESS" } }),
      prisma.task.count({
        where: {
          organizationId: organization.id,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { lt: taskDateWindow.overdueBefore },
        },
      }),
      prisma.task.count({ where: { organizationId: organization.id, status: "COMPLETED" } }),
    ]);

    [tasks, projects, teamMembers, totalOpen, inProgress, overdue, completed] = result;
  } catch (error) {
    console.error("Tasks list failed to load.", error);
    loadError = true;
  }

  return (
    <TasksWorkspace
      key={`${initialDueFilter}-${initialOpenOnly}`}
      deletionComplete={query.deleted === "1"}
      initialDueFilter={initialDueFilter}
      initialOpenOnly={initialOpenOnly}
      totalOpen={totalOpen}
      inProgress={inProgress}
      overdue={overdue}
      completed={completed}
      loadError={loadError}
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
        clientName: project.client.company || project.client.name,
      }))}
      teamMembers={teamMembers.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      }))}
      tasks={tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() ?? null,
        projectId: task.project.id,
        projectName: task.project.name,
        projectClientName: task.project.client.company || task.project.client.name,
        assigneeName: task.assignee?.name ?? null,
        updatedAt: task.updatedAt.toISOString(),
        createdAt: task.createdAt.toISOString(),
      }))}
    />
  );
}
