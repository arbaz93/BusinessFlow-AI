import "server-only";

import { OrganizationRole } from "@/app/generated/prisma/enums";
import { requireOrganization } from "@/lib/auth/dal";

export const WORKSPACE_MANAGER_ROLES = [OrganizationRole.OWNER, OrganizationRole.ADMIN];

export function isWorkspaceManager(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export async function requireWorkspaceManager() {
  const context = await requireOrganization();
  if (
    context.membership &&
    isWorkspaceManager(context.membership.role)
  ) {
    return {
      ...context,
      authorized: true as const,
    };
  }
  return {
    ...context,
    authorized: false as const,
  };
}
