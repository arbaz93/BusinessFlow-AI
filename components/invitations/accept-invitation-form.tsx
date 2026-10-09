"use client";

import { useActionState } from "react";
import { acceptInvitationAction } from "@/app/actions/members";

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="text-sm text-[#fca5a5]" role="alert">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-[var(--success-line)]" role="status">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-55"
      >
        {pending ? "Accepting invitation…" : "Accept invitation"}
      </button>
    </form>
  );
}
