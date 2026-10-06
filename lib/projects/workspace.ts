import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { requireCurrentOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

export const getProjectWorkspace = cache(async (projectId: string) => {
  const { organization } = await requireCurrentOrganization();
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: organization.id },
    select: {
      id: true,
      name: true,
      description: true,
      notes: true,
      status: true,
      priority: true,
      clientId: true,
      startDate: true,
      dueDate: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      client: {
        select: {
          id: true,
          name: true,
          company: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  if (!project) notFound();
  return { organizationId: organization.id, project };
});
