import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { AssistantClientContext, AssistantProjectDetail } from "@/lib/assistant/context/types";

export { type AssistantClientContext };

export function clientFromProjectDetail(project: AssistantProjectDetail): AssistantClientContext | null {
  if (!project.clientId) return null;
  return {
    clientId: project.clientId,
    clientName: project.clientName || "(unnamed client)",
    company: project.clientCompany ?? null,
    status: project.clientName ? "ACTIVE" : "UNKNOWN",
  };
}

export async function getAssistantClientContext(
  organizationId: string,
  clientId: string,
): Promise<AssistantClientContext | null> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId },
    select: {
      id: true,
      name: true,
      company: true,
      status: true,
    },
  });

  if (!client) return null;

  return {
    clientId: client.id,
    clientName: client.name,
    company: client.company ?? null,
    status: client.status,
  };
}
