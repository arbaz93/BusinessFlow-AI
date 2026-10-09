"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { inviteMemberAction } from "@/app/actions/members";
import { InvitationLinkShare } from "@/components/invitations/invitation-link-share";

export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMemberAction, {});
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="colleague@company.com"
          required
          disabled={pending}
          className="h-10 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 focus-visible:ring-2 disabled:cursor-not-allowed"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "invite-email-error" : undefined}
        />
        <button
          type="submit"
          disabled={pending || !email.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Plus size={15} />
          {pending ? "Creating invitation..." : "Invite member"}
        </button>
      </div>
      {state.error ? (
        <p id="invite-email-error" className="text-xs text-[var(--danger-line)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-xs text-[var(--success-line)]" role="status">
          {state.message}
        </p>
      ) : null}
      {state.invitationLink ? (
        <InvitationLinkShare key={state.invitationLink} url={state.invitationLink} />
      ) : null}
    </form>
  );
}
