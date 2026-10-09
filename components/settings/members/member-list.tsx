"use client";

import { useActionState } from "react";
import { UserMinus, ShieldCheck } from "lucide-react";
import { removeMemberAction } from "@/app/actions/members";
import { OrganizationRole } from "@/app/generated/prisma/enums";

export type OrganizationMemberRow = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  role: OrganizationRole;
};

export function MemberList({
  members,
  canManage,
}: {
  members: OrganizationMemberRow[];
  canManage: boolean;
}) {
  const [state, action] = useActionState(removeMemberAction, {});

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          No workspace members yet.
        </div>
      ) : (
        members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-[var(--panel)] text-sm font-semibold text-[var(--foreground)]">
                {member.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                  <span className="truncate">{member.user.name}</span>
                  {member.role === OrganizationRole.OWNER ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#a49bff]/30 bg-[#a49bff]/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[var(--accent-muted)]">
                      <ShieldCheck size={10} /> owner
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{member.user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[#d4d4d8]">
                {member.role === OrganizationRole.OWNER ? "Owner" : "Member"}
              </span>
              {member.role === OrganizationRole.OWNER || !canManage ? null : (
                <form action={action} className="contents">
                  <input type="hidden" name="memberId" value={member.id} />
                  <button
                    type="submit"
                    onClick={(event) => {
                      if (!window.confirm(`Remove ${member.user.name} from this workspace?`)) {
                        event.preventDefault();
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--danger-border)]/30 bg-[var(--danger)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--danger)] transition-colors hover:border-[var(--danger-border)]/50 hover:bg-[var(--danger)]/20"
                    aria-label={`Remove ${member.user.name}`}
                  >
                    <UserMinus size={12} />
                    Remove
                  </button>
                </form>
              )}
            </div>
          </div>
        ))
      )}
      {state.error ? <p className="text-xs text-[var(--danger-line)]" role="alert">{state.error}</p> : null}
      {state.message ? <p className="text-xs text-[var(--success-line)]" role="status">{state.message}</p> : null}
    </div>
  );
}
