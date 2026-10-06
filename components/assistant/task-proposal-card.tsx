"use client";

import { useState } from "react";
import { Edit, LoaderCircle, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import type { TaskProposal } from "@/lib/assistant/types";
import { approveAssistantTaskProposal, updateAssistantTaskProposal } from "@/app/actions/ai-assistant";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorityLabels, taskPriorityValues } from "@/lib/tasks/options";
import type { TaskProposalPriority } from "@/lib/assistant/types";

type TeamMember = { id: string; name: string; email: string | null };

const inputClass =
  "h-10 border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[var(--surface)]";
const selectClass =
  "h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[#a49bff] focus-visible:ring-[3px] focus-visible:ring-[#a49bff]/20";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted)]";
const rowClass = "rounded-lg border border-[var(--line)] bg-[var(--panel)]";

export function TaskProposalCard({
  proposal,
  teamMembers,
  onUpdate,
  onCreated,
  onCancel,
}: {
  proposal: TaskProposal;
  teamMembers: TeamMember[];
  onUpdate: (proposal: TaskProposal) => void;
  onCreated: (proposal: TaskProposal, taskId: string, title: string) => void;
  onCancel: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(proposalFormValues(proposal));
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [approvePending, setApprovePending] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editPending) return;
    setEditPending(true);
    setEditError(null);
    const form = new FormData(event.currentTarget);
    form.set("proposalId", proposal.proposalId);
    const result = await updateAssistantTaskProposal(undefined, form);
    setEditPending(false);
    if (result.success && result.proposal) {
      onUpdate(result.proposal);
    } else if (!result.success) {
      setEditError(result.error ?? null);
    }
  }

  async function handleApprove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (approvePending) return;
    setApprovePending(true);
    setApproveError(null);
    const form = new FormData(event.currentTarget);
    form.set("proposalId", proposal.proposalId);
    const result = await approveAssistantTaskProposal(undefined, form);
    setApprovePending(false);
    if (result.success) {
      onCreated(proposal, result.taskId ?? "", result.title ?? proposal.title);
    } else {
      setApproveError(result.error ?? null);
    }
  }

  const pending = editPending || approvePending;

  if (proposal.approved && proposal.taskId) {
    return (
      <div className={`${rowClass} p-4`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--info-line)]">Task created</p>
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{proposal.title}</p>
        <Link
          href={`/tasks/${proposal.taskId}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-muted)] underline-offset-4 hover:underline focus-visible:outline-none"
        >
          Open Task
        </Link>
      </div>
    );
  }

  return (
    <div className={`${rowClass} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--info-line)]">Task proposal</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{proposal.title}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setEditError(null);
            }}
            className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
            aria-label="Edit proposal"
            disabled={pending}
          >
            <Edit size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <form key="edit" onSubmit={submitEdit} className="mt-3 space-y-4">
          <div>
            <label className={labelClass}>Title <span className="text-[#fca5a5]">*</span></label>
            <Input
              name="title"
              maxLength={160}
              value={values.title}
              onChange={(event) => setValues({ ...values, title: event.currentTarget.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <Textarea
              name="description"
              rows={4}
              value={values.description}
              onChange={(event) => setValues({ ...values, description: event.currentTarget.value })}
              className="min-h-[100px] border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] dark:bg-[var(--surface)]"
              placeholder="What should this task cover?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Priority</label>
              <select
                name="priority"
                value={values.priority}
                onChange={(event) => setValues({ ...values, priority: event.currentTarget.value as TaskProposalPriority })}
                className={selectClass}
              >
                {taskPriorityValues.map((priority) => (
                  <option key={priority} value={priority}>{taskPriorityLabels[priority]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Due date</label>
              <Input
                name="dueDate"
                type="date"
                value={values.dueDate}
                onChange={(event) => setValues({ ...values, dueDate: event.currentTarget.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Assignee</label>
            <select
              name="assigneeId"
              value={values.assigneeId}
              onChange={(event) => setValues({ ...values, assigneeId: event.currentTarget.value })}
              className={selectClass}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          {editError && <p role="alert" className="text-xs text-[#fca5a5]">{editError}</p>}

          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] pt-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={editPending}
              className="h-9 rounded-md px-3 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-50"
            >
              Back to review
            </button>
            <button
              type="submit"
              disabled={editPending}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#7067e8] px-3 text-xs font-semibold text-[var(--foreground)] hover:bg-[#8178f0] disabled:opacity-55"
            >
              {editPending ? <LoaderCircle size={13} className="animate-spin" /> : <X size={13} />} Save draft
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-3 grid gap-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Project</dt>
            <dd className="text-[var(--foreground)]">{proposal.projectName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Priority</dt>
            <dd className="text-[var(--foreground)]">{taskPriorityLabels[proposal.priority] ?? proposal.priority}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Due</dt>
            <dd className="text-[var(--foreground)]">{proposal.dueDate ? formatDate(proposal.dueDate) : "None"}</dd>
          </div>
          {proposal.assigneeName ? (
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Assignee</dt>
              <dd className="text-[var(--foreground)]">{proposal.assigneeName}</dd>
            </div>
          ) : null}
          {proposal.description ? (
            <div>
              <dt className="text-[var(--muted)]">Description</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-[var(--foreground)]">{proposal.description}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <p className="mt-2 text-[10px] text-[var(--muted)]">
        {editing ? "Editing proposal" : "Awaiting approval. No Task will be created until you confirm."}
      </p>

      {!editing && (
        <form key="approve" onSubmit={handleApprove} className="mt-2 flex items-center justify-end gap-2 border-t border-[var(--line)] pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-50"
          >
            <Trash2 size={13} /> Discard
          </button>
          <button
            type="submit"
            disabled={approvePending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#7067e8] px-4 text-xs font-semibold text-[var(--foreground)] hover:bg-[#8178f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-55"
          >
            {approvePending ? <LoaderCircle size={13} className="animate-spin" /> : <Send size={13} />} Create Task
          </button>
        </form>
      )}
      {approveError && !editing && <p role="alert" className="mt-2 text-xs text-[#fca5a5]">{approveError}</p>}
    </div>
  );
}

function proposalFormValues(proposal: TaskProposal) {
  return {
    title: proposal.title,
    description: proposal.description ?? "",
    priority: proposal.priority,
    dueDate: proposal.dueDate ? proposal.dueDate.slice(0, 10) : "",
    assigneeId: proposal.assigneeId ?? "",
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
