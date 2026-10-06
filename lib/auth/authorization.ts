import "server-only";

import { OrganizationRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireOrganization, requireUser } from "@/lib/auth/dal";

export class UnauthorizedResourceError extends Error {
  constructor(message = "You do not have access to this workspace.") {
    super(message);
    this.name = "UnauthorizedResourceError";
  }
}

export const WORKSPACE_MANAGER_ROLES = [OrganizationRole.OWNER];

export function isWorkspaceManager(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}

export async function requireAuthenticatedUser() {
  return requireUser();
}

export async function requireCurrentOrganization() {
  return requireOrganization();
}

export async function requireOrganizationAccess(organizationId: string) {
  const context = await requireCurrentOrganization();
  if (context.organization.id !== organizationId) {
    throw new UnauthorizedResourceError("You do not have access to this workspace.");
  }
  return context;
}

export async function requireProjectAccess(projectId: string, organizationId?: string) {
  const context = await requireCurrentOrganization();
  const currentOrganizationId = organizationId ?? context.organization.id;
  if (context.organization.id !== currentOrganizationId) {
    throw new UnauthorizedResourceError("You do not have access to this workspace.");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: context.organization.id },
    select: { id: true, organizationId: true },
  });

  if (!project) {
    throw new UnauthorizedResourceError("You do not have access to this project.");
  }

  return { ...context, project };
}

export async function requireClientAccess(clientId: string, organizationId?: string) {
  const context = await requireCurrentOrganization();
  const currentOrganizationId = organizationId ?? context.organization.id;
  if (context.organization.id !== currentOrganizationId) {
    throw new UnauthorizedResourceError("You do not have access to this workspace.");
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: context.organization.id },
    select: { id: true, organizationId: true },
  });

  if (!client) {
    throw new UnauthorizedResourceError("You do not have access to this client.");
  }

  return { ...context, client };
}

export async function requireTaskAccess(taskId: string, organizationId?: string) {
  const context = await requireCurrentOrganization();
  const currentOrganizationId = organizationId ?? context.organization.id;
  if (context.organization.id !== currentOrganizationId) {
    throw new UnauthorizedResourceError("You do not have access to this workspace.");
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId: context.organization.id },
    select: { id: true, organizationId: true },
  });

  if (!task) {
    throw new UnauthorizedResourceError("You do not have access to this task.");
  }

  return { ...context, task };
}

export async function requireDocumentAccess(documentId: string, organizationId?: string) {
  const context = await requireCurrentOrganization();
  const currentOrganizationId = organizationId ?? context.organization.id;
  if (context.organization.id !== currentOrganizationId) {
    throw new UnauthorizedResourceError("You do not have access to this workspace.");
  }

  const document = await prisma.projectDocument.findFirst({
    where: { id: documentId, organizationId: context.organization.id },
    select: { id: true, organizationId: true },
  });

  if (!document) {
    throw new UnauthorizedResourceError("You do not have access to this document.");
  }

  return { ...context, document };
}

export async function requireConversationAccess(conversationId: string, organizationId?: string) {
  const context = await requireCurrentOrganization();
  const currentOrganizationId = organizationId ?? context.organization.id;
  if (context.organization.id !== currentOrganizationId) {
    throw new UnauthorizedResourceError("You do not have access to this workspace.");
  }

  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, organizationId: context.organization.id },
    select: { id: true, organizationId: true },
  });

  if (!conversation) {
    throw new UnauthorizedResourceError("You do not have access to this conversation.");
  }

  return { ...context, conversation };
}

export async function requireWorkspaceManager() {
  const context = await requireCurrentOrganization();
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
