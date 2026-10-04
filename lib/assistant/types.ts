export type AssistantConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
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

