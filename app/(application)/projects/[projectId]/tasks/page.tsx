import { prisma } from "@/lib/db/prisma";
import { activeTaskStatuses } from "@/lib/tasks/options";
import { getTaskDateWindow } from "@/lib/tasks/timeline";
import { ProjectTasksWorkspace } from "@/components/projects/project-tasks-workspace";
import { getProjectWorkspace } from "@/lib/projects/workspace";

export default async function ProjectTasksPage({
  params,
  searchParams,
}: PageProps<"/projects/[projectId]/tasks">) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { organizationId, project } = await getProjectWorkspace(projectId);
  const { overdueBefore } = getTaskDateWindow();

  const [tasks, members, openCount, completedCount, overdueCount] = await Promise.all([
    prisma.task.findMany({
      where: { organizationId, projectId: project.id },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        updatedAt: true,
        createdAt: true,
        projectId: true,
        assignee: { select: { name: true } },
      },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId },
      orderBy: { user: { name: "asc" } },
      select: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.task.count({ where: { organizationId, projectId: project.id, status: { in: activeTaskStatuses } } }),
    prisma.task.count({ where: { organizationId, projectId: project.id, status: "COMPLETED" } }),
    prisma.task.count({
      where: {
        organizationId,
        projectId: project.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueDate: { lt: overdueBefore },
      },
    }),
  ]);

  return (
    <ProjectTasksWorkspace
      projectId={project.id}
      projectName={project.name}
      projectClientName={project.client.company || project.client.name}
      tasks={tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate?.toISOString() ?? null,
        updatedAt: task.updatedAt.toISOString(),
        createdAt: task.createdAt.toISOString(),
        assigneeName: task.assignee?.name ?? null,
      }))}
      teamMembers={members.map(({ user }) => ({ id: user.id, name: user.name, email: user.email }))}
      openCount={openCount}
      completedCount={completedCount}
      overdueCount={overdueCount}
      deletionComplete={query.deleted === "1"}
    />
  );
}
