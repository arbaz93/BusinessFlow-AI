export type AssistantConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export type TaskProposalPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskProposal = {
  proposalId: string;
  messageId: string | null;
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  priority: TaskProposalPriority;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  approved: boolean;
  taskId: string | null;
  createdAt: string;
};

export type ProposalFormState = {
  success?: boolean;
  proposal?: TaskProposal;
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  taskId?: string;
  title?: string;
  proposalId?: string;
};

export type AssistantMessageActionResult =
  | {
      success: true;
      userMessage: AssistantConversationMessage;
      assistantMessage: AssistantConversationMessage;
      proposal?: TaskProposal;
    }
  | {
      success: false;
      error: string;
      requestId?: string;
      userMessage?: AssistantConversationMessage;
    };

export type AssistantConversationMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  requestId: string | null;
  replyToMessageId: string | null;
  createdAt: string;
};

export type AssistantConversationDetail = AssistantConversationListItem & {
  messages: AssistantConversationMessage[];
  contextProjectId?: string | null;
  contextProjectLabel?: string | null;
};

