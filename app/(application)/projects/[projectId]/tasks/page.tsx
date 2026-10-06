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

  let tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate: Date | null;
    assigneeId: string | null;
    updatedAt: Date;
    createdAt: Date;
    projectId: string;
    assignee: { name: string } | null;
  }> = [];
  let members: Array<{ user: { id: string; name: string; email: string } }> = [];
  let openCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let loadError = false;

  try {
    const result = await Promise.all([
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

    [tasks, members, openCount, completedCount, overdueCount] = result;
  } catch (error) {
    console.error("Project tasks page failed to load.", { projectId, error });
    loadError = true;
  }

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
      loadError={loadError}
    />
  );
}
