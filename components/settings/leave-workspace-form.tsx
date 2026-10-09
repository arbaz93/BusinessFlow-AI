"use client";

import { useActionState } from "react";
import { leaveWorkspaceAction } from "@/app/actions/members";

export function LeaveWorkspaceForm({ workspaceName }: { workspaceName: string }) {
  const [state, action, pending] = useActionState(leaveWorkspaceAction, {});

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        if (!window.confirm(
          `Leave ${workspaceName}?\n\nYou will lose access to this workspace's projects, clients, tasks, documents, and AI data. Your account will not be deleted.`,
        )) {
          event.preventDefault();
        }
      }}
    >
      <p className="text-sm leading-6 text-[var(--muted)]">
        You will lose access to this workspace&apos;s projects, clients, tasks, documents, and AI data. Your account and any other workspace memberships will remain.
      </p>
      {state.error ? <p className="text-sm text-[#fca5a5]" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-[#fca5a5]/30 bg-[#fca5a5]/10 px-4 text-sm font-semibold text-[#fca5a5] hover:bg-[#fca5a5]/20 disabled:cursor-wait disabled:opacity-55"
      >
        {pending ? "Leaving workspace…" : "Leave workspace"}
      </button>
    </form>
  );
}
