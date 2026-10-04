import { OrganizationRole } from "@/app/generated/prisma/enums";

export type WorkspaceOwnership = {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
  memberCount: number;
};

export type DeletionEligibility =
  | {
      eligible: true;
      ownedWorkspaceIds: string[];
    }
  | {
      eligible: false;
      blockedWorkspace: {
        name: string;
        memberCount: number;
      } | null;
      reason: string;
    };

export const ACCOUNT_DELETION_CONFIRMATION_PHRASE = "DELETE ACCOUNT";

export function evaluateDeletionEligibility(
  ownership: WorkspaceOwnership[],
): DeletionEligibility {
  const blocked = ownership.find(
    (membership) =>
      membership.role === OrganizationRole.OWNER && membership.memberCount > 1,
  );

  if (blocked) {
    return {
      eligible: false,
      blockedWorkspace: {
        name: blocked.organizationName,
        memberCount: blocked.memberCount,
      },
      reason:
        "Your account currently owns a workspace with other members. Account deletion is unavailable until workspace ownership is resolved or the other members are removed.",
    };
  }

  const ownedWorkspaceIds = ownership
    .filter(
      (membership) =>
        membership.role === OrganizationRole.OWNER && membership.memberCount === 1,
    )
    .map((membership) => membership.organizationId);

  return { eligible: true, ownedWorkspaceIds };
}
