"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowUpRight, Check, Copy, LoaderCircle, MessageSquareText, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import {
  cancelAssistantTaskProposal,
  createAssistantConversation,
  deleteAssistantConversation,
  submitAssistantMessage,
} from "@/app/actions/ai-assistant";
import { AssistantMessageContent } from "@/components/assistant/assistant-message-content";
import { TaskProposalCard } from "@/components/assistant/task-proposal-card";
import { Textarea } from "@/components/ui/textarea";
import type {
  AssistantConversationDetail,
  AssistantConversationListItem,
  AssistantConversationMessage,
  TaskProposal,
} from "@/lib/assistant/types";
import type { AssistantTeamMember } from "@/lib/assistant/team";
import { ASSISTANT_MESSAGE_MAX_LENGTH } from "@/lib/assistant/schemas";

type AssistantWorkspaceProps = {
  conversations: AssistantConversationListItem[];
  initialConversation: AssistantConversationDetail | null;
  pendingProposals: TaskProposal[];
  teamMembers: AssistantTeamMember[];
};

type RetryRequest = { requestId: string; content: string };

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function conversationHref(conversationId: string) {
  return `/assistant?conversationId=${encodeURIComponent(conversationId)}`;
}

function ConversationLinks({
  conversations,
  selectedId,
  onSelect,
  onDelete,
}: {
  conversations: AssistantConversationListItem[];
  selectedId: string | null;
  onSelect?: () => void;
  onDelete: (conversation: AssistantConversationListItem) => void;
}) {
  if (!conversations.length) {
    return <p className="px-3 py-6 text-center text-xs leading-5 text-[var(--foreground)]/40">No conversations yet. Start a new conversation with BusinessFlow AI.</p>;
  }

  return (
    <ul className="space-y-1">
      {conversations.map((conversation) => (
        <li key={conversation.id} className="group flex min-w-0 items-center gap-1">
          <Link
            href={conversationHref(conversation.id)}
            onClick={onSelect}
            aria-current={selectedId === conversation.id ? "page" : undefined}
            className={`min-h-12 min-w-0 flex-1 rounded-md px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] ${
              selectedId === conversation.id ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground)]/65 hover:bg-[var(--surface)] hover:text-[var(--foreground)]/90"
            }`}
          >
            <span className="block truncate text-xs font-medium">{conversation.title}</span>
            <time dateTime={conversation.updatedAt} className="mt-1 block text-[10px] text-[var(--foreground)]/35">
              {formatConversationDate(conversation.updatedAt)}
            </time>
          </Link>
          <button
            type="button"
            aria-label={`Delete conversation: ${conversation.title}`}
            onClick={() => {
              if (!window.confirm(`Delete "${conversation.title}"? This removes the conversation and its messages from this workspace.`)) {
                return;
              }
              onDelete(conversation);
            }}
            className="grid size-9 shrink-0 place-items-center rounded-md text-[var(--foreground)]/35 opacity-100 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function mergeMessage(
  messages: AssistantConversationMessage[],
  message: AssistantConversationMessage,
) {
  const existingIndex = messages.findIndex((item) =>
    item.id === message.id ||
    (message.role === "USER" && message.requestId !== null && item.requestId === message.requestId),
  );
  if (existingIndex < 0) return [...messages, message];
  return messages.map((item, index) => index === existingIndex ? message : item);
}

function latestUnansweredRequest(messages: AssistantConversationMessage[]): RetryRequest | null {
  const answered = new Set(messages.flatMap((message) =>
    message.role === "ASSISTANT" && message.replyToMessageId ? [message.replyToMessageId] : [],
  ));
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "USER" && message.requestId && !answered.has(message.id)) {
      return { requestId: message.requestId, content: message.content };
    }
  }
  return null;
}

const SUGGESTED_STARTERS = [
  "What needs my attention?",
  "What tasks are overdue?",
  "What is the status of Website Redesign?",
  "What tasks are blocked?",
  "What risks did AI identify?",
];

function ConversationPanel({
  conversation,
  pendingProposals,
  teamMembers,
}: {
  conversation: AssistantConversationDetail;
  pendingProposals: TaskProposal[];
  teamMembers: AssistantTeamMember[];
}) {
  const [messages, setMessages] = useState(conversation.messages);
  const [proposalsByMessage, setProposalsByMessage] = useState<Record<string, TaskProposal>>(
    () => Object.fromEntries(pendingProposals.map((proposal) => proposal.messageId ? [proposal.messageId, proposal] : [])),
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(
    () => latestUnansweredRequest(conversation.messages),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const sendingRef = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (container && shouldFollowRef.current) container.scrollTop = container.scrollHeight;
  }, [messages]);

  function handleScroll() {
    const container = scrollRef.current;
    if (container) {
      shouldFollowRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 96;
    }
  }

  async function send(request: RetryRequest) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setRetryRequest(request);
    const isRetry = messages.some((message) => message.requestId === request.requestId);

    if (!isRetry) {
      shouldFollowRef.current = true;
      setMessages((current) => [...current, {
        id: `local-${request.requestId}`,
        role: "USER",
        content: request.content,
        requestId: request.requestId,
        replyToMessageId: null,
        createdAt: new Date().toISOString(),
      }]);
    }

    try {
      const result = await submitAssistantMessage({
        conversationId: conversation.id,
        requestId: request.requestId,
        content: request.content,
      });
      if (!result.success) {
        const failedUserMessage = result.userMessage;
        if (failedUserMessage) {
          setMessages((current) => mergeMessage(current, failedUserMessage));
        }
        setError(result.error);
        setRetryRequest({ requestId: result.requestId ?? request.requestId, content: request.content });
        return;
      }

        setMessages((current) => {
          const withoutOptimistic = current.filter((message) => message.id !== `local-${request.requestId}`);
          const withUser = mergeMessage(withoutOptimistic, result.userMessage);
          return mergeMessage(withUser, result.assistantMessage);
        });
        const newProposal = result.proposal;
        if (newProposal) {
          setProposalsByMessage((current) => {
            const next: Record<string, TaskProposal> = { ...current };
            next[result.assistantMessage.id] = newProposal;
            return next;
          });
        }
        setRetryRequest(null);
        setError(null);
    } catch {
      setError("We couldn't generate a response. Your message is still available to retry.");
      setRetryRequest(request);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    void send({ requestId: crypto.randomUUID(), content });
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function copyMessage(message: AssistantConversationMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((current) => current === message.id ? null : current), 1500);
    } catch {
      setError("This response couldn't be copied. Select the text and copy it manually.");
    }
  }

  const answeredMessageIds = new Set(messages.flatMap((message) =>
    message.role === "ASSISTANT" && message.replyToMessageId ? [message.replyToMessageId] : [],
  ));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6"
        aria-label="Conversation messages"
      >
         {messages.length === 0 ? (
           <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center py-8 text-center">
             <span className="grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--accent-muted)]">
               <MessageSquareText size={19} aria-hidden="true" />
             </span>
             <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]/90">Start a conversation</h2>
             <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/50">
               Ask about your Projects, Tasks, Clients, Documents, AI Intelligence, and recent Activity. Reference a project by name to scope your question.
             </p>
             <ul className="mt-5 flex flex-wrap justify-center gap-2">
               {SUGGESTED_STARTERS.map((prompt) => (
                 <li key={prompt}>
                   <button
                     type="button"
                     disabled={sending}
                     onClick={() => void send({ requestId: crypto.randomUUID(), content: prompt })}
                     className="inline-flex items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--foreground)]/75 hover:border-[var(--line-strong)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:cursor-not-allowed disabled:opacity-50"
                   >
                     {prompt}
                   </button>
                 </li>
               ))}
             </ul>
           </div>
         ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {messages.map((message) => {
              const isUser = message.role === "USER";
              const retryable = isUser && retryRequest?.requestId === message.requestId &&
                !answeredMessageIds.has(message.id);
              return (
                <article
                  key={message.id}
                  className={`flex min-w-0 flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {isUser ? (
                    <p className="max-w-[92%] whitespace-pre-wrap break-words rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]/85 [overflow-wrap:anywhere] sm:max-w-[82%]">
                      {message.content}
                    </p>
                  ) : (
                    <div className="w-full min-w-0">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[var(--foreground)]/45">
                        <Sparkles size={13} className="text-[var(--accent-muted)]" aria-hidden="true" />
                        BusinessFlow AI
                      </div>
                      <AssistantMessageContent content={message.content} />
                      {proposalsByMessage[message.id] && (
                        <TaskProposalCard
                          key={proposalsByMessage[message.id].proposalId}
                          proposal={proposalsByMessage[message.id]}
                          teamMembers={teamMembers}
                          onUpdate={(updated) =>
                            setProposalsByMessage((current) => ({ ...current, [message.id]: updated }))
                          }
                          onCreated={(proposal, taskId, title) => {
                            setProposalsByMessage((current) => {
                              const next: Record<string, TaskProposal> = {};
                              for (const key of Object.keys(current)) {
                                if (key !== message.id) next[key] = current[key];
                              }
                              return next;
                            });
                            setDraft("");
                            void navigator.clipboard.writeText(title).catch(() => {});
                          }}
                          onCancel={() => {
                            const form = new FormData();
                            form.set("proposalId", proposalsByMessage[message.id].proposalId);
                            void cancelAssistantTaskProposal(undefined, form).then((result) => {
                              if (result.success) {
                                setProposalsByMessage((current) => {
                                  const next: Record<string, TaskProposal> = {};
                                  for (const key of Object.keys(current)) {
                                    if (key !== message.id) next[key] = current[key];
                                  }
                                  return next;
                                });
                              }
                            });
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => void copyMessage(message)}
                        className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded px-2 text-[11px] text-[var(--foreground)]/40 hover:bg-[var(--surface)] hover:text-[var(--foreground)]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
                      >
                        {copiedId === message.id ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                        {copiedId === message.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}
                  {retryable && !sending && !error && (
                    <button
                      type="button"
                      onClick={() => void send(retryRequest!)}
                      className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded px-2 text-xs font-medium text-[var(--accent-muted)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
                    >
                      Retry response <ArrowUpRight size={12} aria-hidden="true" />
                    </button>
                  )}
                </article>
              );
            })}
            {sending && (
              <p role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-[var(--foreground)]/45">
                <LoaderCircle size={13} className="animate-spin text-[var(--accent-muted)]" aria-hidden="true" />
                Preparing a response…
              </p>
            )}
            <div aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--line)] bg-[#151517] p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div role="alert" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#ef4444]/15 bg-[#ef4444]/[0.04] px-3 py-2">
              <p className="text-xs leading-5 text-[#fca5a5]">{error}</p>
              {retryRequest && (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void send(retryRequest)}
                  className="inline-flex min-h-8 shrink-0 items-center rounded px-2 text-xs font-medium text-[#fca5a5] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fca5a5] disabled:opacity-50"
                >
                  Try again
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 focus-within:border-[#a49bff]/45 focus-within:ring-2 focus-within:ring-[#a49bff]/15">
            <label className="sr-only" htmlFor={`assistant-composer-${conversation.id}`}>Message BusinessFlow AI</label>
            <Textarea
              id={`assistant-composer-${conversation.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, ASSISTANT_MESSAGE_MAX_LENGTH))}
              onKeyDown={handleComposerKeyDown}
              maxLength={ASSISTANT_MESSAGE_MAX_LENGTH}
              rows={2}
              disabled={sending}
              placeholder="Ask BusinessFlow AI…"
              className="max-h-40 min-h-12 resize-y border-0 bg-transparent text-sm leading-6 text-[var(--foreground)]/85 shadow-none placeholder:text-[var(--foreground)]/35 focus-visible:border-0 focus-visible:ring-0 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send message"
              title={draft.length > ASSISTANT_MESSAGE_MAX_LENGTH ? `Messages are limited to ${ASSISTANT_MESSAGE_MAX_LENGTH.toLocaleString()} characters` : undefined}
              className="grid size-10 shrink-0 place-items-center rounded-md bg-[#a49bff] text-[#111113] transition-colors hover:bg-[#b3a8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {sending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            </button>
          </form>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-[var(--foreground)]/35">
            <span>Enter to send · Shift+Enter for a new line · Read-only workspace context</span>
            <span>{draft.length.toLocaleString()}/{ASSISTANT_MESSAGE_MAX_LENGTH.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssistantWorkspace({ conversations, initialConversation, pendingProposals, teamMembers }: AssistantWorkspaceProps) {
  const router = useRouter();
  const [createPending, startCreate] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssistantConversationListItem | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  function handleNewConversation() {
    startCreate(async () => {
      const result = await createAssistantConversation();
      if (!result.success) {
        setWorkspaceError(result.error);
        return;
      }
      setMobileListOpen(false);
      router.push(conversationHref(result.conversationId));
    });
  }

  function handleDeleteConversation() {
    if (!deleteTarget) return;
    startDelete(async () => {
      const result = await deleteAssistantConversation(deleteTarget.id);
      if (!result.success) {
        setWorkspaceError(result.error);
        return;
      }
      const wasSelected = initialConversation?.id === deleteTarget.id;
      setDeleteTarget(null);
      setWorkspaceError(null);
      if (wasSelected) router.replace("/assistant");
      router.refresh();
    });
  }

  function requestDelete(conversation: AssistantConversationListItem) {
    setWorkspaceError(null);
    setDeleteTarget(conversation);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-7xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--info-line)]">Intelligence</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">AI Assistant</h1>
            <p className="mt-1 text-xs text-[var(--foreground)]/45">
              Read-only workspace context. Reference a project by name to scope your question.
            </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Dialog.Root open={mobileListOpen} onOpenChange={setMobileListOpen}>
            <Dialog.Trigger asChild>
              <button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--foreground)]/70 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] md:hidden">
                <MessageSquareText size={14} aria-hidden="true" />
                Conversations
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 md:hidden" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(21rem,calc(100vw-1.5rem))] flex-col border-r border-[var(--line)] bg-[var(--panel)] p-4 text-[var(--foreground)] outline-none md:hidden">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                  <Dialog.Title className="text-sm font-semibold">Conversations</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" aria-label="Close conversations" className="grid size-9 place-items-center rounded-md text-[var(--foreground)]/55 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                      <X size={16} aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                  <ConversationLinks
                    conversations={conversations}
                    selectedId={initialConversation?.id ?? null}
                    onSelect={() => setMobileListOpen(false)}
                    onDelete={(conversation) => {
                      setMobileListOpen(false);
                      requestDelete(conversation);
                    }}
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <button
            type="button"
            onClick={handleNewConversation}
            disabled={createPending}
            className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#a49bff] px-3 text-xs font-semibold text-[#111113] transition-colors hover:bg-[#b3a8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:cursor-wait disabled:opacity-60"
          >
            {createPending ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
            New conversation
          </button>
        </div>
      </header>

      {workspaceError && !deleteTarget && <p role="alert" className="text-sm text-[#fca5a5]">{workspaceError}</p>}

      <div className="flex min-h-[34rem] flex-1 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] md:min-h-[36rem]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[#151517] md:flex">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-3">
            <h2 className="text-xs font-semibold text-[var(--foreground)]/65">Your conversations</h2>
            <span className="text-[10px] text-[var(--foreground)]/35">{conversations.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <ConversationLinks
              conversations={conversations}
              selectedId={initialConversation?.id ?? null}
              onDelete={requestDelete}
            />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="min-w-0 truncate text-sm font-medium text-[var(--foreground)]/80">
                {initialConversation?.title ?? "New conversation"}
              </h2>
              {initialConversation?.contextProjectLabel && (
                <span
                  title={initialConversation.contextProjectLabel}
                  className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[#a49bff]/25 bg-[#a49bff]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-muted)]"
                >
                  <span className="truncate">Anchored to {initialConversation.contextProjectLabel}</span>
                </span>
              )}
            </div>
            {initialConversation && (
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(`Delete "${initialConversation.title}"? This removes the conversation and its messages from this workspace.`)) {
                    return;
                  }
                  requestDelete(initialConversation);
                }}
                aria-label="Delete this conversation"
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded px-2 text-xs text-[var(--foreground)]/40 hover:bg-[var(--surface)] hover:text-[var(--foreground)]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] md:hidden"
              >
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
          {initialConversation ? (
            <ConversationPanel
              key={initialConversation.id}
              conversation={initialConversation}
              pendingProposals={pendingProposals}
              teamMembers={teamMembers}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="grid size-12 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--accent-muted)]">
                <MessageSquareText size={20} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]/90">
                {conversations.length ? "Choose a conversation" : "No conversations yet"}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--foreground)]/50">
                {conversations.length
                  ? "Select one from your conversation list, or start a new conversation."
                  : "Start a new conversation with BusinessFlow AI. Your chats are private to you in this workspace."}
              </p>
              <button
                type="button"
                onClick={handleNewConversation}
                disabled={createPending}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#a49bff] px-4 text-sm font-medium text-[#111113] hover:bg-[#b3a8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:opacity-60"
              >
                {createPending ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                Start a conversation
              </button>
            </div>
          )}
        </main>
      </div>

      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletePending) {
            setDeleteTarget(null);
            setWorkspaceError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--foreground)] shadow-2xl outline-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">Delete this conversation?</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--foreground)]/55">
                  This permanently deletes the conversation and its messages. Projects, Tasks, and other workspace records are not affected.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button type="button" disabled={deletePending} aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--foreground)]/55 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-50">
                  <X size={17} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
            {deleteTarget && <p className="mt-4 truncate rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]/75">{deleteTarget.title}</p>}
            {workspaceError && <p role="alert" className="mt-3 text-sm text-[#fca5a5]">{workspaceError}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button type="button" disabled={deletePending} className="min-h-10 rounded-md px-4 text-sm text-[var(--foreground)]/65 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-50">Cancel</button>
              </Dialog.Close>
              <button type="button" onClick={handleDeleteConversation} disabled={deletePending || !deleteTarget} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#b91c1c] px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[#dc2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fca5a5] disabled:cursor-wait disabled:opacity-55">
                {deletePending && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
                Delete conversation
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
