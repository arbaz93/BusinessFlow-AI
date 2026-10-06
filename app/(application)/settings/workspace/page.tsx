import { WorkspaceForm } from "@/components/settings/workspace-form";
import { LeaveWorkspaceForm } from "@/components/settings/leave-workspace-form";
import { requireOrganization } from "@/lib/auth/dal";
import { isWorkspaceManager } from "@/lib/auth/authorization";
import { OrganizationRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import type { BusinessType } from "@/lib/organizations/options";

export default async function WorkspaceSettingsPage() {
  const { organization, membership } = await requireOrganization();
  const canManage = membership !== null && isWorkspaceManager(membership.role);

  const memberCount = await prisma.organizationMember.count({
    where: { organizationId: organization.id },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Workspace settings</h2>
        <p className="text-sm text-[var(--muted)]">
          Workspace name and business type are shown across the application.
        </p>
      </div>

      <WorkspaceForm
        initialName={organization.name}
        initialBusinessType={organization.businessType as BusinessType}
        slug={organization.slug}
        memberCount={memberCount}
        canManage={canManage}
      />
      {membership.role === OrganizationRole.MEMBER ? (
        <section className="space-y-3 rounded-2xl border border-[#fca5a5]/20 bg-[var(--surface)] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Leave workspace</h2>
          <LeaveWorkspaceForm workspaceName={organization.name} />
        </section>
      ) : memberCount === 1 ? (
        <section className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Workspace ownership</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            You are the sole owner. Leaving is unavailable; account deletion is the existing option that also removes this single-member workspace.
          </p>
        </section>
      ) : (
        <section className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Workspace ownership</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            You can&apos;t leave while you own a workspace with other members. Ownership transfer is not available yet.
          </p>
        </section>
      )}
    </div>
  );
}
