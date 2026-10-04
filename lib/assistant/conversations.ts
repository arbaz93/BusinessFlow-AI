import "server-only";

import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import {
  ASSISTANT_CONVERSATION_LIST_LIMIT,
  ASSISTANT_MESSAGE_LIST_LIMIT,
} from "@/lib/assistant/schemas";
import type { AssistantConversationDetail, AssistantConversationListItem } from "@/lib/assistant/types";

export async function getAssistantConversations(): Promise<AssistantConversationListItem[]> {
  const { organization, profile } = await requireOrganization();
  const conversations = await prisma.aIConversation.findMany({
    where: { organizationId: organization.id, createdById: profile.id },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: ASSISTANT_CONVERSATION_LIST_LIMIT,
    select: { id: true, title: true, updatedAt: true },
  });

  return conversations.map((conversation) => ({
    ...conversation,
    updatedAt: conversation.updatedAt.toISOString(),
  }));
}

export async function getAssistantConversation(
  conversationId: string,
): Promise<AssistantConversationDetail | null> {
  const { organization, profile } = await requireOrganization();
  const conversation = await prisma.aIConversation.findFirst({
    where: {
      id: conversationId,
      organizationId: organization.id,
      createdById: profile.id,
    },
    select: {
      id: true,
      title: true,
      contextProjectId: true,
      updatedAt: true,
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: ASSISTANT_MESSAGE_LIST_LIMIT,
        select: {
          id: true,
          role: true,
          content: true,
          requestId: true,
          replyToMessageId: true,
          createdAt: true,
        },
      },
    },
  });
  if (!conversation) return null;

  let contextProjectLabel: string | null = null;
  if (conversation.contextProjectId) {
    const project = await prisma.project.findFirst({
      where: {
        organizationId: organization.id,
        id: conversation.contextProjectId,
      },
      select: {
        name: true,
        client: { select: { name: true, company: true } },
      },
    });
    if (project) {
      const clientPart = project.client?.company ?? project.client?.name ?? "";
      contextProjectLabel = clientPart ? `${project.name} — ${clientPart}` : project.name;
    }
  }

  return {
    id: conversation.id,
    title: conversation.title,
    contextProjectId: conversation.contextProjectId,
    contextProjectLabel,
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.reverse().map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

