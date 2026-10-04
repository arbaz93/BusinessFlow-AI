import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { activeProjectStatuses } from "@/lib/projects/timeline";

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const { organization } = await requireOrganization();
  const query = await searchParams;

  const [projects, clients, statusGroups, priorityGroups, totalCount] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: organization.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        updatedAt: true,
        createdAt: true,
        client: { select: { id: true, name: true, company: true } },
      },
    }),
    prisma.client.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: { organizationId: organization.id },
      _count: { _all: true },
    }),
    prisma.project.groupBy({
      by: ["priority"],
      where: { organizationId: organization.id },
      _count: { _all: true },
    }),
    prisma.project.count({ where: { organizationId: organization.id } }),
  ]);

  const statusCounts = Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all]));
  const priorityCounts = Object.fromEntries(priorityGroups.map((group) => [group.priority, group._count._all]));

  return (
    <ProjectsWorkspace
      deletionComplete={query.deleted === "1"}
      statusCounts={statusCounts}
      priorityCounts={priorityCounts}
      activeCount={statusGroups
        .filter((group) => (activeProjectStatuses as string[]).includes(group.status))
        .reduce((sum, group) => sum + group._count._all, 0)}
      totalCount={totalCount}
      clients={clients}
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate?.toISOString() ?? null,
        dueDate: project.dueDate?.toISOString() ?? null,
        clientId: project.client.id,
        clientName: project.client.name,
        clientCompany: project.client.company,
        updatedAt: project.updatedAt.toISOString(),
        createdAt: project.createdAt.toISOString(),
      }))}
    />
  );
}
