import { notFound } from "next/navigation";
import { AssistantWorkspace } from "@/components/assistant/assistant-workspace";
import { getAssistantConversation, getAssistantConversations } from "@/lib/assistant/conversations";
import { conversationIdSchema } from "@/lib/assistant/schemas";
import { getAssistantPendingProposals } from "@/app/actions/ai-assistant";
import { getAssistantTeamMembers } from "@/lib/assistant/team";

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const { conversationId: rawConversationId } = await searchParams;
  let parsedConversationId: string | null = null;
  if (rawConversationId) {
    const parsed = conversationIdSchema.safeParse(rawConversationId);
    if (!parsed.success) notFound();
    parsedConversationId = parsed.data;
  }

  const [conversations, conversation, pendingProposals, teamMembers] = await Promise.all([
    getAssistantConversations(),
    parsedConversationId ? getAssistantConversation(parsedConversationId) : Promise.resolve(null),
    parsedConversationId ? getAssistantPendingProposals(parsedConversationId) : Promise.resolve([]),
    getAssistantTeamMembers(),
  ]);

  if (parsedConversationId && !conversation) notFound();

  return <AssistantWorkspace conversations={conversations} initialConversation={conversation} pendingProposals={pendingProposals} teamMembers={teamMembers} />;
}