"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { createAssistantConversationTitle } from "@/lib/assistant/context";
import { generateAssistantResponse } from "@/lib/assistant/generate-response";
import { resolveAssistantContext } from "@/lib/assistant/context/resolver";
import { createAssistantMessageSchema, deleteAssistantConversationSchema } from "@/lib/assistant/schemas";
import {
  getConversationMemoryState,
  regenerateConversationMemory,
  shouldUpdateMemory,
} from "@/lib/assistant/memory";
import type { AssistantConversationMessage } from "@/lib/assistant/types";

export type AssistantActionResult =
  | { success: true; conversationId: string }
  | { success: false; error: string };

export type AssistantMessageActionResult =
  | {
      success: true;
      userMessage: AssistantConversationMessage;
      assistantMessage: AssistantConversationMessage;
    }
  | {
      success: false;
      error: string;
      requestId?: string;
      userMessage?: AssistantConversationMessage;
    };

function serializeMessage(message: {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  requestId: string | null;
  replyToMessageId: string | null;
  createdAt: Date;
}): AssistantConversationMessage {
  return { ...message, createdAt: message.createdAt.toISOString() };
}

function prismaErrorCode(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
}

export async function createAssistantConversation(): Promise<AssistantActionResult> {
  const { organization, profile } = await requireOrganization();
  try {
    const conversation = await prisma.aIConversation.create({
      data: { organizationId: organization.id, createdById: profile.id },
      select: { id: true },
    });
    revalidatePath("/assistant");
    return { success: true, conversationId: conversation.id };
  } catch (error) {
    console.error("AI Assistant conversation could not be created.", {
      organizationId: organization.id,
      userId: profile.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: prismaErrorCode(error),
    });
    return { success: false, error: "A new conversation could not be started. Please try again." };
  }
}

export async function deleteAssistantConversation(
  rawConversationId: string,
): Promise<AssistantActionResult> {
  const { organization, profile } = await requireOrganization();
  const parsed = deleteAssistantConversationSchema.safeParse({ conversationId: rawConversationId });
  if (!parsed.success) return { success: false, error: "This conversation is unavailable." };

  try {
    const deleted = await prisma.aIConversation.deleteMany({
      where: {
        id: parsed.data.conversationId,
        organizationId: organization.id,
        createdById: profile.id,
      },
    });
    if (deleted.count !== 1) return { success: false, error: "This conversation is unavailable." };
    revalidatePath("/assistant");
    return { success: true, conversationId: parsed.data.conversationId };
  } catch (error) {
    console.error("AI Assistant conversation could not be deleted.", {
      organizationId: organization.id,
      userId: profile.id,
      conversationId: parsed.data.conversationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: prismaErrorCode(error),
    });
    return { success: false, error: "This conversation could not be deleted. Please try again." };
  }
}

export async function submitAssistantMessage(rawInput: unknown): Promise<AssistantMessageActionResult> {
  const { organization, profile } = await requireOrganization();
  const parsed = createAssistantMessageSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Review your message and try again.",
    };
  }

  const { conversationId, requestId, content } = parsed.data;
  const conversation = await prisma.aIConversation.findFirst({
    where: {
      id: conversationId,
      organizationId: organization.id,
      createdById: profile.id,
    },
    select: { id: true, contextProjectId: true },
  });
  if (!conversation) return { success: false, error: "This conversation is unavailable." };

  let userMessage: AssistantConversationMessage;
  try {
    let savedUserMessage = await prisma.aIConversationMessage.findUnique({
      where: { conversationId_requestId: { conversationId: conversation.id, requestId } },
      select: {
        id: true,
        role: true,
        content: true,
        requestId: true,
        replyToMessageId: true,
        createdAt: true,
      },
    });

    if (savedUserMessage) {
      if (savedUserMessage.role !== "USER" || savedUserMessage.content !== content) {
        return { success: false, error: "This message could not be retried. Start a new message." };
      }
    } else {
      savedUserMessage = await prisma.$transaction(async (transaction) => {
        const created = await transaction.aIConversationMessage.create({
          data: {
            conversationId: conversation.id,
            role: "USER",
            content,
            requestId,
          },
          select: {
            id: true,
            role: true,
            content: true,
            requestId: true,
            replyToMessageId: true,
            createdAt: true,
          },
        });
        await transaction.aIConversation.updateMany({
          where: {
            id: conversation.id,
            organizationId: organization.id,
            createdById: profile.id,
            title: "New conversation",
          },
          data: { title: createAssistantConversationTitle(content) },
        });
        await transaction.aIConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
        return created;
      });
    }
    userMessage = serializeMessage(savedUserMessage);
  } catch (error) {
    if (prismaErrorCode(error) === "P2002") {
      const existing = await prisma.aIConversationMessage.findUnique({
        where: { conversationId_requestId: { conversationId: conversation.id, requestId } },
        select: {
          id: true,
          role: true,
          content: true,
          requestId: true,
          replyToMessageId: true,
          createdAt: true,
        },
      });
      if (existing?.role === "USER" && existing.content === content) {
        userMessage = serializeMessage(existing);
      } else {
        console.error("AI Assistant idempotency key collision.", {
          organizationId: organization.id,
          userId: profile.id,
          conversationId: conversation.id,
        });
        return { success: false, error: "This message could not be saved. Please try again." };
      }
    } else {
      console.error("AI Assistant user message could not be saved.", {
        organizationId: organization.id,
        userId: profile.id,
        conversationId: conversation.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
        prismaCode: prismaErrorCode(error),
      });
      return { success: false, error: "Your message could not be saved. Please try again." };
    }
  }

  const existingReply = await prisma.aIConversationMessage.findUnique({
    where: { replyToMessageId: userMessage.id },
    select: {
      id: true,
      role: true,
      content: true,
      requestId: true,
      replyToMessageId: true,
      createdAt: true,
    },
  });
  if (existingReply) {
    return {
      success: true,
      userMessage,
      assistantMessage: serializeMessage(existingReply),
    };
  }

  try {
    const recentMessages = await prisma.aIConversationMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 24,
      select: { role: true, content: true },
    });

    const contextResult = await resolveAssistantContext({
      organizationId: organization.id,
      profileId: profile.id,
      message: content,
      contextProjectId: conversation.contextProjectId,
    });

    const memoryState = await getConversationMemoryState(conversation.id);

    if (!contextResult.ready) {
      let assistantMessage;
      try {
        assistantMessage = await prisma.$transaction(async (transaction) => {
          const created = await transaction.aIConversationMessage.create({
            data: {
              conversationId: conversation.id,
              role: "ASSISTANT",
              content: contextResult.clarification.message,
              replyToMessageId: userMessage.id,
            },
            select: {
              id: true,
              role: true,
              content: true,
              requestId: true,
              replyToMessageId: true,
              createdAt: true,
            },
          });
          await transaction.aIConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });
          return created;
        });
      } catch (error) {
        if (prismaErrorCode(error) === "P2002") {
          assistantMessage = await prisma.aIConversationMessage.findFirst({
            where: { replyToMessageId: userMessage.id, role: "ASSISTANT" },
            select: {
              id: true,
              role: true,
              content: true,
              requestId: true,
              replyToMessageId: true,
              createdAt: true,
            },
          });
        } else {
          throw error;
        }
      }

      if (!assistantMessage) throw new Error("Clarification reply was not persisted.");

      revalidatePath("/assistant");
      return {
        success: true,
        userMessage,
        assistantMessage: serializeMessage(assistantMessage),
      };
    }

    const response = await generateAssistantResponse(
      recentMessages.reverse().map((message) => ({ role: message.role, content: message.content })),
      { organizationId: organization.id, conversationId: conversation.id, userId: profile.id },
      { trustedContext: contextResult.context, memorySummary: memoryState?.memorySummary },
    );
    if (!response.success) {
      revalidatePath("/assistant");
      return { success: false, error: response.error, requestId, userMessage };
    }

    let assistantMessage;
    try {
      assistantMessage = await prisma.$transaction(async (transaction) => {
        const created = await transaction.aIConversationMessage.create({
          data: {
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: response.content,
            replyToMessageId: userMessage.id,
          },
          select: {
            id: true,
            role: true,
            content: true,
            requestId: true,
            replyToMessageId: true,
            createdAt: true,
          },
        });
        await transaction.aIConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        if (
          contextResult.context.scope === "PROJECT" &&
          contextResult.context.project?.projectId !== conversation.contextProjectId
        ) {
          await transaction.aIConversation.update({
            where: { id: conversation.id },
            data: { contextProjectId: contextResult.context.project!.projectId },
          });
        }

         return created;
       });
     } catch (error) {
       if (prismaErrorCode(error) !== "P2002") throw error;
       const winner = await prisma.aIConversationMessage.findUnique({
         where: { replyToMessageId: userMessage.id },
         select: {
           id: true,
           role: true,
           content: true,
           requestId: true,
           replyToMessageId: true,
           createdAt: true,
         },
       });
       if (!winner) throw error;
       assistantMessage = winner;
     }

    try {
      const updatedMemory = await getConversationMemoryState(conversation.id);
      if (
        updatedMemory &&
        shouldUpdateMemory(
          updatedMemory.totalMessages,
          updatedMemory.messagesSinceMemoryUpdate,
          updatedMemory.memoryUpdatedAt,
        )
      ) {
        await regenerateConversationMemory(conversation.id);
      }
    } catch (memoryError) {
      console.error("AI Assistant conversation memory could not be updated.", {
        organizationId: organization.id,
        userId: profile.id,
        conversationId: conversation.id,
        errorName: memoryError instanceof Error ? memoryError.name : "UnknownError",
      });
    }

    revalidatePath("/assistant");
    return {
      success: true,
      userMessage,
      assistantMessage: serializeMessage(assistantMessage),
    };
  } catch (error) {
    console.error("AI Assistant response could not be completed.", {
      organizationId: organization.id,
      userId: profile.id,
      conversationId: conversation.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: prismaErrorCode(error),
    });
    revalidatePath("/assistant");
    return {
      success: false,
      error: "We couldn't generate a response. Please try again.",
      requestId,
      userMessage,
    };
  }
}
