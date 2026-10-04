import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { activeTaskStatuses } from "@/lib/tasks/options";
import { getTaskDateWindow } from "@/lib/tasks/timeline";

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const { organization } = await requireOrganization();
  const query = await searchParams;
  const taskDateWindow = getTaskDateWindow();
  const initialDueFilter = query.due === "OVERDUE" ? "OVERDUE" : "ALL";
  const initialOpenOnly = query.status === "OPEN";

  const [tasks, projects, teamMembers, totalOpen, inProgress, overdue, completed] = await Promise.all([
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
