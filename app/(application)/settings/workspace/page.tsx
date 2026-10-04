import { WorkspaceForm } from "@/components/settings/workspace-form";
import { requireOrganization } from "@/lib/auth/dal";
import { isWorkspaceManager } from "@/lib/auth/authorization";
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
        <h2 className="text-sm font-semibold text-white">Workspace settings</h2>
        <p className="text-sm text-[#a1a1aa]">
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
    </div>
  );
}
