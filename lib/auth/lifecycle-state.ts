import type { OrganizationRole } from "@/app/generated/prisma/enums";

export type ApplicationProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type ApplicationOrganization = {
  id: string;
  name: string;
  businessType: string;
  slug: string;
};

export type ApplicationMembership = {
  id: string;
  role: OrganizationRole;
  userId: string;
  organizationId: string;
};

export type ApplicationWorkspace = {
  id: string;
  name: string;
  role: OrganizationRole;
  organizationId: string;
};

export type ApplicationInvitation = {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  expiresAt: Date | null;
};

export type ApplicationEntryState =
  | { kind: "UNAUTHENTICATED" }
  | { kind: "NO_WORKSPACE"; profile: ApplicationProfile }
  | { kind: "INVITATION_AVAILABLE"; profile: ApplicationProfile; invitation: ApplicationInvitation }
  | {
      kind: "READY";
      profile: ApplicationProfile;
      organization: ApplicationOrganization;
      membership: ApplicationMembership;
      memberships: ApplicationWorkspace[];
      organizationId: string;
    };

export type MembershipRow = {
  id: string;
  userId: string;
  role: OrganizationRole;
  organizationId: string;
  organization: { id: string; name: string; businessType: string; slug: string };
};

export function computeEntryState(
  profile: { id: string; name: string; email: string; avatarUrl: string | null },
  memberships: MembershipRow[],
  activeWorkspaceCookie: string | undefined,
  invitation: ApplicationInvitation | null,
): Exclude<ApplicationEntryState, { kind: "UNAUTHENTICATED" }> {
  const hasCookieMembership =
    activeWorkspaceCookie &&
    memberships.some((row) => row.organizationId === activeWorkspaceCookie);

  const activeMembership =
    (hasCookieMembership
      ? memberships.find((row) => row.organizationId === activeWorkspaceCookie)
      : null) ?? memberships[0] ?? null;

  const appProfile: ApplicationProfile = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
  };

  if (!activeMembership) {
    if (invitation) {
      return { kind: "INVITATION_AVAILABLE", profile: appProfile, invitation };
    }
    return { kind: "NO_WORKSPACE", profile: appProfile };
  }

  return {
    kind: "READY",
    profile: appProfile,
    organization: {
      id: activeMembership.organization.id,
      name: activeMembership.organization.name,
      businessType: activeMembership.organization.businessType,
      slug: activeMembership.organization.slug,
    },
    membership: {
      id: activeMembership.id,
      role: activeMembership.role,
      userId: activeMembership.userId,
      organizationId: activeMembership.organizationId,
    },
    memberships: memberships.map((row) => ({
      id: row.organization.id,
      name: row.organization.name,
      role: row.role,
      organizationId: row.organizationId,
    })),
    organizationId: activeMembership.organizationId,
  };
}
