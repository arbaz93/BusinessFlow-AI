import "server-only";

import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import type { AssistantContextMessage } from "@/lib/assistant/context";
import { buildMemoryRequestText, parseConversationMemoryResponse, summarizeConversationMessages, shouldUpdateMemory, truncateMemory, assistantMemorySchema, ASSISTANT_MEMORY_SYSTEM_PROMPT, ASSISTANT_MEMORY_MESSAGE_THRESHOLD, ASSISTANT_MEMORY_REFRESH_INTERVAL, ASSISTANT_MEMORY_MAX_LENGTH, ASSISTANT_MEMORY_OLDER_WINDOW, buildAssistantSystemInstruction } from "@/lib/assistant/memory-context";

export {
  shouldUpdateMemory,
  truncateMemory,
  buildMemoryRequestText,
  parseConversationMemoryResponse,
  summarizeConversationMessages,
  assistantMemorySchema,
  ASSISTANT_MEMORY_SYSTEM_PROMPT,
  ASSISTANT_MEMORY_MESSAGE_THRESHOLD,
  ASSISTANT_MEMORY_REFRESH_INTERVAL,
  ASSISTANT_MEMORY_MAX_LENGTH,
  ASSISTANT_MEMORY_OLDER_WINDOW,
  buildAssistantSystemInstruction,
};

export interface ConversationMemoryState {
  memorySummary: string | null;
  memoryUpdatedAt: Date | null;
  totalMessages: number;
  messagesSinceMemoryUpdate: number;
}

export async function getConversationMemoryState(conversationId: string): Promise<ConversationMemoryState | null> {
  const { organization, profile } = await requireOrganization();
  const [conversation, totalMessages] = await Promise.all([
    prisma.aIConversation.findFirst({
      where: { id: conversationId, organizationId: organization.id, createdById: profile.id },
      select: {
        memorySummary: true,
        memoryUpdatedAt: true,
      },
    }),
    prisma.aIConversationMessage.count({
      where: {
        conversationId,
        conversation: {
          organizationId: organization.id,
          createdById: profile.id,
        },
      },
    }),
  ]);

  if (!conversation) return null;

  const messagesSinceMemoryUpdate = conversation.memoryUpdatedAt
    ? await prisma.aIConversationMessage.count({
        where: {
          conversationId,
          createdAt: { gt: conversation.memoryUpdatedAt },
          conversation: {
            organizationId: organization.id,
            createdById: profile.id,
          },
        },
      })
    : totalMessages;

  return {
    memorySummary: conversation.memorySummary,
    memoryUpdatedAt: conversation.memoryUpdatedAt,
    totalMessages,
    messagesSinceMemoryUpdate,
  };
}

export async function loadMessagesForMemory(
  conversationId: string,
  recentWindow: number,
  limit: number,
): Promise<AssistantContextMessage[]> {
  const { organization, profile } = await requireOrganization();
  const messages = await prisma.aIConversationMessage.findMany({
    where: {
      conversationId,
      conversation: {
        organizationId: organization.id,
        createdById: profile.id,
      },
    },
    orderBy: { createdAt: "desc" },
    skip: recentWindow,
    take: limit,
    select: { role: true, content: true },
  });
  return messages.reverse();
}

export async function updateAssistantConversationMemory(
  conversationId: string,
  summary: string,
  previousMemoryUpdatedAt: Date | null,
): Promise<boolean> {
  const { organization, profile } = await requireOrganization();
  const result = await prisma.aIConversation.updateMany({
    where: {
      id: conversationId,
      organizationId: organization.id,
      createdById: profile.id,
      ...(previousMemoryUpdatedAt
        ? { memoryUpdatedAt: previousMemoryUpdatedAt }
        : { memoryUpdatedAt: null }),
    },
    data: {
      memorySummary: summary,
      memoryUpdatedAt: new Date(),
    },
  });
  return result.count > 0;
}

export async function regenerateConversationMemory(
  conversationId: string,
  options?: {
    recentWindow?: number;
    olderLimit?: number;
    fetchImplementation?: typeof fetch;
  },
): Promise<string | null> {
  const apiKey = env.GEMINI_API_KEY;
  const modelName = env.GEMINI_MODEL;
  if (!apiKey || !/^gemini-[A-Za-z0-9.-]+$/.test(modelName ?? "")) {
    return null;
  }

  const recentWindow = options?.recentWindow ?? 24;
  const olderLimit = options?.olderLimit ?? ASSISTANT_MEMORY_OLDER_WINDOW;

  const [state, olderMessages] = await Promise.all([
    getConversationMemoryState(conversationId),
    loadMessagesForMemory(conversationId, recentWindow, olderLimit),
  ]);
  if (!state) return null;

  const summary = await summarizeConversationMessages(
    apiKey,
    modelName!,
    state.memorySummary,
    olderMessages,
    options?.fetchImplementation,
  );
  if (!summary) return null;

  await updateAssistantConversationMemory(conversationId, summary, state.memoryUpdatedAt);
  return summary;
}
