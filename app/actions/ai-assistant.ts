"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { createAssistantConversationTitle } from "@/lib/assistant/context";
import { generateAssistantResponse } from "@/lib/assistant/generate-response";
import { resolveAssistantContext } from "@/lib/assistant/context/resolver";
import { createAssistantMessageSchema, deleteAssistantConversationSchema } from "@/lib/assistant/schemas";
import {
  getConversationMemoryState,
  regenerateConversationMemory,
  shouldUpdateMemory,
} from "@/lib/assistant/memory";
import {
  inferTaskCreationIntent,
  generateTaskProposalDraft,
  serializeTaskProposalMarkdown,
  parseTaskProposalDueDate,
} from "@/lib/assistant/proposals";
import { taskProposalEditSchema } from "@/lib/tasks/schemas";
import { createTask, revalidateTaskViews, TaskValidationError, TaskUnavailableError } from "@/lib/tasks/service";
import type { AssistantConversationMessage, AssistantMessageActionResult, ProposalFormState, TaskProposal, TaskProposalPriority } from "@/lib/assistant/types";

export type AssistantActionResult =
  | { success: true; conversationId: string }
  | { success: false; error: string };

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
  const activeConversationId = conversation.id;

  async function refreshConversationMemory() {
    try {
      const updatedMemory = await getConversationMemoryState(activeConversationId);
      if (
        updatedMemory &&
        shouldUpdateMemory(
          updatedMemory.totalMessages,
          updatedMemory.messagesSinceMemoryUpdate,
          updatedMemory.memoryUpdatedAt,
        )
      ) {
        await regenerateConversationMemory(activeConversationId);
      }
    } catch (memoryError) {
      console.error("AI Assistant conversation memory could not be updated.", {
        organizationId: organization.id,
        userId: profile.id,
        conversationId: activeConversationId,
        errorName: memoryError instanceof Error ? memoryError.name : "UnknownError",
      });
    }
  }

  async function persistAssistantTurn(
    content: string,
    replyToId: string,
    setContextProjectId?: string | null,
  ) {
    let assistantMessage;
    try {
      assistantMessage = await prisma.$transaction(async (transaction) => {
        const created = await transaction.aIConversationMessage.create({
          data: {
            conversationId: activeConversationId,
            role: "ASSISTANT",
            content,
            replyToMessageId: replyToId,
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
        const updateData: { updatedAt: Date; contextProjectId?: string } = { updatedAt: new Date() };
        if (setContextProjectId) updateData.contextProjectId = setContextProjectId;
        await transaction.aIConversation.updateMany({
          where: { id: activeConversationId },
          data: updateData,
        });
        return created;
      });
    } catch (error) {
      if (prismaErrorCode(error) !== "P2002") throw error;
      assistantMessage = await prisma.aIConversationMessage.findUnique({
        where: { replyToMessageId: replyToId },
        select: {
          id: true,
          role: true,
          content: true,
          requestId: true,
          replyToMessageId: true,
          createdAt: true,
        },
      });
    }
    return assistantMessage;
  }

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
      const assistantMessage = await persistAssistantTurn(contextResult.clarification.message, userMessage.id);
      if (!assistantMessage) throw new Error("Clarification reply was not persisted.");
      revalidatePath("/assistant");
      return {
        success: true,
        userMessage,
        assistantMessage: serializeMessage(assistantMessage),
      };
    }

    const serverDate = new Date();

    const intent = inferTaskCreationIntent(content);
    if (
      intent === "CREATE" &&
      contextResult.context.scope === "PROJECT" &&
      contextResult.context.project
    ) {
      const project = contextResult.context.project;
      const draft = await generateTaskProposalDraft(
        env.GEMINI_API_KEY ?? "",
        env.GEMINI_MODEL,
        content,
        contextResult.context,
        serverDate,
      );

      if (draft) {
        const { assigneeId, assigneeName, dueDate } = await resolveProposalFields(draft, {
          organizationId: organization.id,
          serverDate,
        });

        const markdown = serializeTaskProposalMarkdown(draft, {
          projectName: project.name,
          assigneeName,
        });

        const assistantMessage = await persistAssistantTurn(markdown, userMessage.id, project.projectId);
        if (!assistantMessage) throw new Error("Proposal message was not persisted.");

      const savedProposal = await prisma.aIAssistantTaskProposal.create({
        data: {
          organizationId: organization.id,
          conversationId: conversation.id,
          messageId: assistantMessage.id,
          projectId: project.projectId,
          title: draft.title,
          description: draft.description ?? null,
          priority: draft.priority,
          dueDate: dueDate ?? null,
          assigneeId: assigneeId ?? null,
        },
        select: { id: true, createdAt: true },
      });

        await refreshConversationMemory();
        revalidatePath("/assistant");

        return {
          success: true,
          userMessage,
          assistantMessage: serializeMessage(assistantMessage),
          proposal: toTaskProposalView(savedProposal.id, assistantMessage.id, {
            projectId: project.projectId,
            projectName: project.name,
            title: draft.title,
            description: draft.description ?? null,
            priority: draft.priority,
            dueDate,
            assigneeId,
            assigneeName,
            createdAt: savedProposal.createdAt.toISOString(),
          }),
        };
      }
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

    const assistantMessage = await persistAssistantTurn(
      response.content,
      userMessage.id,
      contextResult.context.scope === "PROJECT" ? contextResult.context.project?.projectId ?? null : null,
    );
    if (!assistantMessage) throw new Error("Assistant reply was not persisted.");

    await refreshConversationMemory();
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

interface ResolvedProposalFields {
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
}

async function resolveProposalFields(
  draft: { assignee: string | null; dueDate: string | null },
  params: { organizationId: string; serverDate: Date },
): Promise<ResolvedProposalFields> {
  const assignee = draft.assignee ? draft.assignee.trim() : null;
  let assigneeId: string | null = null;
  let assigneeName: string | null = null;

  if (assignee) {
    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId: params.organizationId,
        user: {
          OR: [
            { name: { equals: assignee, mode: "insensitive" } },
            { email: { equals: assignee, mode: "insensitive" } },
            { email: { contains: assignee, mode: "insensitive" } },
          ],
        },
      },
      include: { user: { select: { id: true, name: true } } },
      take: 5,
    });
    if (members.length === 1 && members[0].user) {
      assigneeId = members[0].user.id;
      assigneeName = members[0].user.name;
    }
  }

  return {
    assigneeId,
    assigneeName,
    dueDate: parseTaskProposalDueDate(draft.dueDate, params.serverDate),
  };
}

interface TaskProposalViewParams {
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  priority: TaskProposalPriority;
  dueDate: Date | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
}

function toTaskProposalView(
  proposalId: string,
  messageId: string | null,
  params: TaskProposalViewParams,
): TaskProposal {
  return {
    proposalId,
    messageId,
    projectId: params.projectId,
    projectName: params.projectName,
    title: params.title,
    description: params.description,
    priority: params.priority,
    dueDate: params.dueDate ? params.dueDate.toISOString() : null,
    assigneeId: params.assigneeId,
    assigneeName: params.assigneeName,
    approved: false,
    taskId: null,
    createdAt: params.createdAt,
  };
}

const approveProposedTaskInputSchema = taskProposalEditSchema;

export async function approveAssistantTaskProposal(
  _previousState: ProposalFormState | undefined,
  formData: FormData,
): Promise<ProposalFormState> {
  const { organization, profile } = await requireOrganization();

  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string" || !proposalId.trim()) {
    return { success: false, error: "Missing proposal reference.", code: "INVALID" };
  }
  const trimmedProposalId = proposalId.trim();

  const proposal = await prisma.aIAssistantTaskProposal.findUnique({
    where: { id: trimmedProposalId, organizationId: organization.id },
    select: { id: true, projectId: true, taskId: true, title: true },
  });

  if (!proposal) {
    return { success: false, error: "This task proposal is no longer available.", code: "INVALID" };
  }

  if (proposal.taskId) {
    return { success: true, taskId: proposal.taskId, title: proposal.title, proposalId: proposal.id };
  }

  const parsed = approveProposedTaskInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Review the proposal fields and try again.",
      code: "INVALID",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const created = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.aIAssistantTaskProposal.findUnique({
        where: { id: trimmedProposalId },
        select: { taskId: true },
      });
      if (existing?.taskId) {
        throw new TaskAlreadyCreatedError(proposal.taskId!, proposal.title);
      }

      const createdTask = await createTask(
        {
          organizationId: organization.id,
          createdById: profile.id,
          projectId: proposal.projectId,
          title: parsed.data.title!,
          description: parsed.data.description,
          status: "TODO",
          priority: parsed.data.priority ?? "MEDIUM",
          dueDate: parsed.data.dueDate ?? null,
          assigneeId: parsed.data.assigneeId ?? null,
        },
        { transaction },
      );

      const updated = await transaction.aIAssistantTaskProposal.updateMany({
        where: { id: trimmedProposalId, taskId: null },
        data: { taskId: createdTask.id, approvedById: profile.id, approvedAt: new Date() },
      });
      if (updated.count === 0) {
        throw new TaskAlreadyCreatedError(proposal.taskId!, proposal.title);
      }

      return createdTask;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/assistant");
    revalidateTaskViews(created.id, [proposal.projectId]);
    return { success: true, taskId: created.id, title: created.title, proposalId: proposal.id };
  } catch (error) {
    if (error instanceof TaskAlreadyCreatedError) {
      return { success: true, taskId: error.taskId, title: error.title, proposalId: proposal.id };
    }
    if (error instanceof TaskValidationError) {
      return {
        success: false,
        error: "Review the proposal fields and try again.",
        code: "INVALID",
        fieldErrors: error.fieldErrors,
      };
    }
    if (error instanceof TaskUnavailableError) {
      return { success: false, error: error.message, code: "UNAVAILABLE" };
    }
    console.error("AI Assistant task approval failed.", {
      organizationId: organization.id,
      userId: profile.id,
      proposalId: trimmedProposalId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { success: false, error: "We couldn't create the Task. Please try again.", code: "FAILED" };
  }
}

class TaskAlreadyCreatedError extends Error {
  constructor(public readonly taskId: string, public readonly title: string) {
    super(`Task proposal already produced task ${taskId}`);
    this.name = "TaskAlreadyCreatedError";
  }
}

export async function updateAssistantTaskProposal(
  _previousState: ProposalFormState | undefined,
  formData: FormData,
): Promise<ProposalFormState> {
  const { organization } = await requireOrganization();

  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string" || !proposalId.trim()) {
    return { success: false, error: "Missing proposal reference." };
  }

  const parsed = approveProposedTaskInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Review the proposal fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const proposal = await prisma.aIAssistantTaskProposal.findFirst({
    where: { id: proposalId.trim(), organizationId: organization.id, taskId: null },
    select: {
      id: true,
      conversationId: true,
      messageId: true,
      projectId: true,
      createdAt: true,
      project: { select: { name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  if (!proposal) {
    return { success: false, error: "This task proposal is no longer available." };
  }

  const updated = await prisma.aIAssistantTaskProposal.update({
    where: { id: proposal.id },
    data: {
      title: parsed.data.title!,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority ?? "MEDIUM",
      dueDate: parsed.data.dueDate ?? null,
      assigneeId: parsed.data.assigneeId ?? null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      priority: true,
      dueDate: true,
      assigneeId: true,
      createdAt: true,
      project: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });

  revalidatePath("/assistant");
  return {
    success: true,
    proposal: {
      proposalId: updated.id,
      messageId: proposal.messageId,
      projectId: proposal.projectId,
      projectName: proposal.project.name,
      title: updated.title,
      description: updated.description,
      priority: updated.priority as TaskProposalPriority,
      dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
      assigneeId: updated.assigneeId,
      assigneeName: updated.assignee?.name ?? null,
      approved: false,
      taskId: null,
      createdAt: updated.createdAt.toISOString(),
    },
  };
}

export async function getAssistantPendingProposals(conversationId: string): Promise<TaskProposal[]> {
  const { organization } = await requireOrganization();
  const proposals = await prisma.aIAssistantTaskProposal.findMany({
    where: { organizationId: organization.id, conversationId, taskId: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      messageId: true,
      projectId: true,
      title: true,
      description: true,
      priority: true,
      dueDate: true,
      assigneeId: true,
      createdAt: true,
      project: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });
  return proposals.map((proposal) => ({
    proposalId: proposal.id,
    messageId: proposal.messageId,
    projectId: proposal.projectId,
    projectName: proposal.project.name,
    title: proposal.title,
    description: proposal.description,
    priority: proposal.priority as TaskProposalPriority,
    dueDate: proposal.dueDate ? proposal.dueDate.toISOString() : null,
    assigneeId: proposal.assigneeId,
    assigneeName: proposal.assignee?.name ?? null,
    approved: false,
    taskId: null,
    createdAt: proposal.createdAt.toISOString(),
  }));
}

export async function cancelAssistantTaskProposal(previousState: ProposalFormState | undefined, formData: FormData): Promise<ProposalFormState> {
  const { organization } = await requireOrganization();  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string" || !proposalId.trim()) {
    return { success: false, error: "Missing proposal reference." };
  }
  const trimmedProposalId = proposalId.trim();

  const result = await prisma.aIAssistantTaskProposal.deleteMany({
    where: { id: trimmedProposalId, organizationId: organization.id, taskId: null },
  });

  if (result.count === 0) {
    return { success: false, error: "This task proposal is no longer available." };
  }

  revalidatePath("/assistant");
  return { success: true, proposalId: trimmedProposalId };
}

export async function getAssistantTaskProposal(proposalId: string): Promise<TaskProposal | null> {
  const { organization } = await requireOrganization();
  const proposal = await prisma.aIAssistantTaskProposal.findFirst({
    where: { id: proposalId, organizationId: organization.id },
    select: {
      id: true,
      messageId: true,
      projectId: true,
      title: true,
      description: true,
      priority: true,
      dueDate: true,
      assigneeId: true,
      taskId: true,
      approvedById: true,
      approvedAt: true,
      createdAt: true,
      project: { select: { name: true, client: { select: { name: true, company: true } } } },
      assignee: { select: { name: true } },
      task: { select: { id: true, title: true, status: true, priority: true, dueDate: true } },
    },
  });
  if (!proposal) return null;
  return {
    proposalId: proposal.id,
    messageId: proposal.messageId,
    projectId: proposal.projectId,
    projectName: proposal.project.name,
    title: proposal.title,
    description: proposal.description,
    priority: proposal.priority as TaskProposalPriority,
    dueDate: proposal.dueDate ? proposal.dueDate.toISOString() : null,
    assigneeId: proposal.assigneeId,
    assigneeName: proposal.assignee?.name ?? null,
    approved: proposal.taskId !== null && proposal.approvedAt !== null,
    taskId: proposal.taskId,
    createdAt: proposal.createdAt.toISOString(),
  };
}
