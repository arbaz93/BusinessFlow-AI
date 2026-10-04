import { z } from "zod";

export const ASSISTANT_MESSAGE_MAX_LENGTH = 8_000;
export const ASSISTANT_RESPONSE_MAX_LENGTH = 12_000;
export const ASSISTANT_CONVERSATION_LIST_LIMIT = 50;
export const ASSISTANT_MESSAGE_LIST_LIMIT = 100;
export const ASSISTANT_CONTEXT_MESSAGE_LIMIT = 24;
export const ASSISTANT_CONTEXT_CHARACTER_LIMIT = 36_000;

export const conversationIdSchema = z.string().trim().min(1).max(64);

export const createAssistantMessageSchema = z.object({
  conversationId: conversationIdSchema,
  requestId: z.string().uuid(),
  content: z.string().trim().min(1, "Enter a message before sending.").max(
    ASSISTANT_MESSAGE_MAX_LENGTH,
    `Messages must be ${ASSISTANT_MESSAGE_MAX_LENGTH.toLocaleString()} characters or fewer.`,
  ),
});

export const deleteAssistantConversationSchema = z.object({
  conversationId: conversationIdSchema,
});

export const assistantResponseSchema = z.object({
  content: z.string().trim().min(1).max(ASSISTANT_RESPONSE_MAX_LENGTH),
}).strict();

export type AssistantMessageInput = z.infer<typeof createAssistantMessageSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

