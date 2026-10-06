import { requireOrganization } from "@/lib/auth/dal";
import { isWorkspaceManager } from "@/lib/auth/authorization";
import { InvitationStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { InviteMemberForm } from "@/components/settings/members/invite-member-form";
import { MemberList } from "@/components/settings/members/member-list";
import { InvitationList } from "@/components/settings/members/invitation-list";
import { isInvitationExpired } from "@/lib/members/invitation-tokens";

export default async function MembersSettingsPage() {
  const { organization, membership } = await requireOrganization();
  const canManage = membership !== null && isWorkspaceManager(membership.role);

  const [members, invitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: organization.id },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    }),
    prisma.organizationInvitation.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        invitedBy: { select: { name: true } },
      },
    }),
  ]);

  const invitationRows = invitations.map((invitation) => {
    const isPending = invitation.status === InvitationStatus.PENDING;
    const expired = isPending && isInvitationExpired(invitation.expiresAt);
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: expired ? InvitationStatus.EXPIRED : invitation.status,
      isPending,
      invitedBy: { name: invitation.invitedBy.name },
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt?.toISOString() ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Workspace members</h2>
        <p className="text-sm text-[var(--muted)]">
          Manage teammates and invitations for this workspace.
        </p>
      </div>

      {canManage ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Invite a team member</h3>
          </div>
          <InviteMemberForm />
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Members</h3>
          <span className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {members.length} total
          </span>
        </div>
        <MemberList canManage={canManage} members={members.map((member) => ({
          id: member.id,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl,
          },
          role: member.role,
        }))} />
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Invitations</h3>
          <span className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {invitationRows.filter((invitation) => invitation.status === InvitationStatus.PENDING).length} pending
          </span>
        </div>
        <InvitationList canManage={canManage} invitations={invitationRows} />
      </div>
    </div>
  );
}
