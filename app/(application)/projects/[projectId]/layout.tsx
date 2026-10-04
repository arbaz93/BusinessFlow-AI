import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { ProjectDeleteDialog } from "@/components/projects/project-delete-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectStatusControl } from "@/components/projects/project-status-control";
import { ProjectWorkspaceTabs } from "@/components/projects/project-workspace-tabs";
import { prisma } from "@/lib/db/prisma";
import { projectPriorityLabels, projectPriorityTone, projectStatusLabels, projectStatusTone } from "@/lib/projects/options";
import { getProjectWorkspace } from "@/lib/projects/workspace";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { organizationId, project } = await getProjectWorkspace(projectId);
  const clients = await prisma.client.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });
  const clientName = project.client.company || project.client.name;
  const projectDraft = {
    id: project.id,
    name: project.name,
    clientId: project.clientId,
    description: project.description ?? undefined,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate ?? undefined,
    dueDate: project.dueDate ?? undefined,
    notes: project.notes ?? undefined,
    updatedAt: project.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-4 pt-2 sm:pt-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-white/45">
          <Link href="/projects" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">Projects</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page" className="max-w-[min(55vw,28rem)] truncate text-white/75">{project.name}</span>
        </nav>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93c5fd]">Project workspace</p>
            <h1 className="mt-2 truncate text-[30px] font-semibold tracking-[-0.04em] text-[#f4f4f5] sm:text-[32px]">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link href={`/clients/${project.client.id}`} className="inline-flex min-h-7 items-center gap-1.5 rounded-sm text-sm text-[#c4b5fd] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                {clientName}<ExternalLink size={12} aria-hidden="true" />
              </Link>
              <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium ${projectStatusTone[project.status]}`}>{projectStatusLabels[project.status]}</span>
              <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium ${projectPriorityTone[project.priority]}`}>{projectPriorityLabels[project.priority]} priority</span>
              {project.dueDate && <span className="text-xs text-white/45">Due {project.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusControl projectId={project.id} initialStatus={project.status} />
            <ProjectFormDialog project={projectDraft} clients={clients} defaultClientId={project.clientId} />
            <ProjectDeleteDialog projectId={project.id} name={project.name} clientName={clientName} />
          </div>
        </div>
      </header>

      <ProjectWorkspaceTabs projectId={project.id} />
      <div>{children}</div>
    </div>
  );
}
