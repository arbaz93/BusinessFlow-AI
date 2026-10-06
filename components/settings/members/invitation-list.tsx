"use client";

import { useActionState } from "react";
import { Clock3, Mail, RefreshCw, Trash2 } from "lucide-react";
import {
  cancelInvitationAction,
  refreshInvitationLinkAction,
  resendInvitationAction,
} from "@/app/actions/members";
import { InvitationStatus, OrganizationRole } from "@/app/generated/prisma/enums";
import { InvitationLinkShare } from "@/components/invitations/invitation-link-share";

export type OrganizationInvitationRow = {
  id: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  invitedBy: {
    name: string;
  };
  createdAt: string;
  expiresAt: string | null;
  isPending: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function statusLabel(status: InvitationStatus) {
  switch (status) {
    case InvitationStatus.PENDING:
      return "Pending";
    case InvitationStatus.ACCEPTED:
      return "Accepted";
    case InvitationStatus.CANCELLED:
      return "Cancelled";
    case InvitationStatus.EXPIRED:
      return "Expired";
  }
}

export function InvitationList({
  invitations,
  canManage,
}: {
  invitations: OrganizationInvitationRow[];
  canManage: boolean;
}) {
  const [cancelState, cancelAction] = useActionState(cancelInvitationAction, {});
  const [resendState, resendAction] = useActionState(resendInvitationAction, {});
  const [linkState, linkAction] = useActionState(refreshInvitationLinkAction, {});

  return (
    <div className="space-y-3">
      {invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          No pending invitations.
        </div>
      ) : (
        invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <Mail size={14} className="text-[var(--accent-muted)]" />
                <span className="truncate">{invitation.email}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--panel)] px-1.5 py-0.5">
                  <Clock3 size={10} /> {statusLabel(invitation.status)}
                </span>
                <span>Invited by {invitation.invitedBy.name}</span>
                <span>•</span>
                <span>{formatDate(invitation.createdAt)}</span>
                {invitation.expiresAt ? (
                  <>
                    <span>•</span>
                    <span>Expires {formatDate(invitation.expiresAt)}</span>
                  </>
                ) : null}
              </div>
            </div>

            {canManage && invitation.isPending ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <form action={linkAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-[#a49bff]/60 hover:text-[var(--foreground)]">
                    Copy link
                  </button>
                </form>
                <form action={resendAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-[#a49bff]/60 hover:text-[var(--foreground)]" aria-label={`Resend invitation to ${invitation.email}`}>
                    <RefreshCw size={12} /> Resend invitation
                  </button>
                </form>
                <form action={cancelAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-[var(--danger-border)]/30 bg-[var(--danger)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--danger)] hover:border-[var(--danger-border)]/50 hover:bg-[var(--danger)]/20" aria-label={`Cancel invitation for ${invitation.email}`}>
                    <Trash2 size={12} /> Cancel
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ))
      )}
      {linkState.error ? <p className="text-xs text-[var(--danger-line)]" role="alert">{linkState.error}</p> : null}
      {linkState.message ? <p className="text-xs text-[var(--success-line)]" role="status">{linkState.message}</p> : null}
      {linkState.invitationLink ? (
        <InvitationLinkShare key={linkState.invitationLink} url={linkState.invitationLink} />
      ) : null}
      {cancelState.error ? <p className="text-xs text-[var(--danger-line)]" role="alert">{cancelState.error}</p> : null}
      {resendState.error ? <p className="text-xs text-[var(--danger-line)]" role="alert">{resendState.error}</p> : null}
      {cancelState.message ? <p className="text-xs text-[var(--success-line)]" role="status">{cancelState.message}</p> : null}
      {resendState.message ? <p className="text-xs text-[var(--success-line)]" role="status">{resendState.message}</p> : null}
    </div>
  );
}
