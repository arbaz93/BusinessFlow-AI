import { notFound } from "next/navigation";
import { AssistantWorkspace } from "@/components/assistant/assistant-workspace";
import { getAssistantConversation, getAssistantConversations } from "@/lib/assistant/conversations";
import { conversationIdSchema } from "@/lib/assistant/schemas";

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const { conversationId: rawConversationId } = await searchParams;
  const [conversations, conversation] = await Promise.all([
    getAssistantConversations(),
    rawConversationId
      ? (async () => {
          const parsed = conversationIdSchema.safeParse(rawConversationId);
          if (!parsed.success) notFound();
          return getAssistantConversation(parsed.data);
        })()
      : Promise.resolve(null),
  ]);

  if (rawConversationId && !conversation) notFound();

  return <AssistantWorkspace conversations={conversations} initialConversation={conversation} />;
}