import "server-only";

import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

export interface AssistantTeamMember {
  id: string;
  name: string;
  email: string | null;
}

export async function getAssistantTeamMembers(): Promise<AssistantTeamMember[]> {
  const { organization } = await requireOrganization();
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: organization.id },
    select: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
  }));
}
