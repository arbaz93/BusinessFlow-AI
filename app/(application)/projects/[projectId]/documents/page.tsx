import { prisma } from "@/lib/db/prisma";
import { ProjectDocumentsWorkspace } from "@/components/projects/project-documents-workspace";
import { getProjectWorkspace } from "@/lib/projects/workspace";

export default async function ProjectDocumentsPage({ params }: PageProps<"/projects/[projectId]/documents">) {
  const { projectId } = await params;
  const { organizationId, project } = await getProjectWorkspace(projectId);

  let documents: Array<{
    id: string;
    name: string;
    originalName: string;
    documentType: "PROJECT_BRIEF" | "CLIENT_ASSET" | "REFERENCE" | "DESIGN" | "DELIVERABLE" | "OTHER";
    mimeType: string | null;
    sizeBytes: number | null;
    storagePath: string | null;
    isPrimary: boolean;
    createdAt: Date;
  }> = [];
  let loadError = false;

  try {
    documents = await prisma.projectDocument.findMany({
      where: { organizationId, projectId: project.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        originalName: true,
        documentType: true,
        mimeType: true,
        sizeBytes: true,
        storagePath: true,
        isPrimary: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Project documents page failed to load.", { projectId, error });
    loadError = true;
  }

  return (
    <ProjectDocumentsWorkspace
      projectId={project.id}
      projectName={project.name}
      loadError={loadError}
      documents={documents.map((document) => ({
        id: document.id,
        name: document.name,
        originalName: document.originalName,
        documentType: document.documentType,
        mimeType: document.mimeType ?? null,
        sizeBytes: document.sizeBytes ?? null,
        hasFile: document.storagePath !== null,
        isPrimary: document.isPrimary,
        createdAt: document.createdAt.toISOString(),
      }))}
    />
  );
}
