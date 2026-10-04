import {
  ASSISTANT_CONTEXT_CHARACTER_LIMIT,
  ASSISTANT_CONTEXT_MESSAGE_LIMIT,
} from "@/lib/assistant/schemas";

export type AssistantContextMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
};

export function buildRecentAssistantContext(
  messages: AssistantContextMessage[],
  {
    maximumMessages = ASSISTANT_CONTEXT_MESSAGE_LIMIT,
    maximumCharacters = ASSISTANT_CONTEXT_CHARACTER_LIMIT,
  }: {
    maximumMessages?: number;
    maximumCharacters?: number;
  } = {},
): AssistantContextMessage[] {
  const recent: AssistantContextMessage[] = [];
  let characters = 0;

  for (let index = messages.length - 1; index >= 0 && recent.length < maximumMessages; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    if (recent.length > 0 && characters + message.content.length > maximumCharacters) break;

    const content = recent.length === 0 && message.content.length > maximumCharacters
      ? message.content.slice(-maximumCharacters)
      : message.content;
    recent.push({ role: message.role, content });
    characters += content.length;
  }

  return recent.reverse();
}

export function createAssistantConversationTitle(content: string, maximumLength = 64) {
  const title = content.trim().replace(/\s+/g, " ");
  if (title.length <= maximumLength) return title || "New conversation";
  return `${title.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
}

