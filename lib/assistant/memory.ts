import "server-only";

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
  const [conversation, totalMessages] = await Promise.all([
    prisma.aIConversation.findUnique({
      where: { id: conversationId },
      select: {
        memorySummary: true,
        memoryUpdatedAt: true,
      },
    }),
    prisma.aIConversationMessage.count({ where: { conversationId } }),
  ]);

  if (!conversation) return null;

  const messagesSinceMemoryUpdate = conversation.memoryUpdatedAt
    ? await prisma.aIConversationMessage.count({
        where: { conversationId, createdAt: { gt: conversation.memoryUpdatedAt } },
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
  const messages = await prisma.aIConversationMessage.findMany({
    where: { conversationId },
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
  const result = await prisma.aIConversation.updateMany({
    where: {
      id: conversationId,
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
