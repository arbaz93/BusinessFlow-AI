"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InvitationStatus, OrganizationRole } from "@/app/generated/prisma/enums";
import {
  ACTIVE_WORKSPACE_COOKIE,
  requireCurrentOrganization,
  requireUser,
  syncProfile,
} from "@/lib/auth/dal";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import { requireWorkspaceManager } from "@/lib/auth/authorization";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";
import { inviteMemberSchema, invitationTokenSchema } from "@/lib/auth/schemas";
import type { FormState } from "@/lib/auth/types";
import { sendInvitationEmail } from "@/lib/members/invitation-email";
import {
  createInvitationToken,
  getInvitationExpiry,
  getInvitationPath,
  hashInvitationToken,
  isInvitationExpired,
  normalizeEmail,
} from "@/lib/members/invitation-tokens";
import { prisma } from "@/lib/db/prisma";

export type InvitationFormState = FormState & {
  invitationLink?: string;
};

function invitationLinkResult(
  email: string,
  invitationLink: string,
  delivery: "sent" | "unavailable" | "failed",
  operation: "created" | "refreshed",
): InvitationFormState {
  if (delivery === "sent") {
    return {
      message: `Invitation email sent to ${email}.`,
      invitationLink,
    };
  }

  if (delivery === "unavailable") {
    return {
      message: operation === "created"
        ? `Invitation created for ${email}. Email delivery isn't configured, so share this link manually.`
        : "Invitation link refreshed. Email delivery isn't configured, so share the new link manually.",
      invitationLink,
    };
  }

  return {
    message: operation === "created"
      ? `Invitation created for ${email}, but the email could not be sent. Share this link manually.`
      : "Invitation link refreshed, but the email could not be sent. Share the new link manually.",
    invitationLink,
  };
}

async function makeInvitationLinks(token: string) {
  const requestHeaders = await headers();
  const callbackUrl = getAuthCallbackUrl(requestHeaders, undefined, token);
  const origin = new URL(callbackUrl).origin;
  return {
    invitationLink: new URL(getInvitationPath(token), origin).toString(),
    callbackUrl,
  };
}

async function sendAndReturnInvitation(
  email: string,
  invitationLink: string,
  callbackUrl: string,
  operation: "created" | "refreshed",
): Promise<InvitationFormState> {
  const delivery = await sendInvitationEmail(email, callbackUrl);
  return invitationLinkResult(email, invitationLink, delivery.status, operation);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function inviteMemberAction(
  _previousState: FormState,
  formData: FormData,
): Promise<InvitationFormState> {
  const parsed = inviteMemberSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid team member email." };
  }

  const { organization, authorized, membership } = await requireWorkspaceManager();
  if (!authorized || !membership) {
    return { error: "Only workspace owners can invite members." };
  }

  const email = normalizeEmail(parsed.data.email);
  let existingMember: { id: string } | null;
  let invitation: { id: string; status: InvitationStatus } | null;
  try {
    existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: organization.id,
        user: { email: { equals: email, mode: "insensitive" } },
      },
      select: { id: true },
    });
    invitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId: organization.id,
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true, status: true },
    });
  } catch (error) {
    console.error("Workspace membership could not be checked before inviting.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't verify this invitation. Please try again." };
  }

  if (existingMember) {
    return { error: "This person is already a member of this workspace." };
  }

  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = getInvitationExpiry();
  let links: Awaited<ReturnType<typeof makeInvitationLinks>>;
  try {
    links = await makeInvitationLinks(token);
  } catch (error) {
    console.error("Invitation link could not be generated.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't create an invitation link. Check the application URL configuration and try again." };
  }

  const isPendingInvitation = invitation?.status === InvitationStatus.PENDING;

  try {
    if (invitation) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          email,
          invitedById: membership.userId,
          role: OrganizationRole.MEMBER,
          status: InvitationStatus.PENDING,
          tokenHash,
          expiresAt,
          acceptedAt: null,
        },
      });
    } else {
      await prisma.organizationInvitation.create({
        data: {
          organizationId: organization.id,
          email,
          role: OrganizationRole.MEMBER,
          invitedById: membership.userId,
          status: InvitationStatus.PENDING,
          tokenHash,
          expiresAt,
        },
      });
    }
  } catch (error) {
    if (isUniqueConstraintError(error) && !invitation) {
      invitation = await prisma.organizationInvitation.findFirst({
        where: {
          organizationId: organization.id,
          email: { equals: email, mode: "insensitive" },
        },
        select: { id: true, status: true },
      });

      if (invitation) {
        try {
          await prisma.organizationInvitation.update({
            where: { id: invitation.id },
            data: {
              email,
              invitedById: membership.userId,
              role: OrganizationRole.MEMBER,
              status: InvitationStatus.PENDING,
              tokenHash,
              expiresAt,
              acceptedAt: null,
            },
          });
        } catch (updateError) {
          console.error("Invitation record could not be refreshed.", {
            errorName: updateError instanceof Error ? updateError.name : "UnknownError",
          });
          return { error: "We couldn't create the invitation. Please try again." };
        }
      } else {
        console.error("Invitation creation hit a uniqueness conflict without a matching record.");
        return { error: "We couldn't create the invitation. Please try again." };
      }
    } else {
      console.error("Invitation record could not be created.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return { error: "We couldn't create the invitation. Please try again." };
    }
  }

  revalidatePath("/settings/members");
  return sendAndReturnInvitation(
    email,
    links.invitationLink,
    links.callbackUrl,
    isPendingInvitation ? "refreshed" : "created",
  );
}

export async function acceptInvitationAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = invitationTokenSchema.safeParse(formData.get("token"));
  if (!parsed.success) return { error: "This invitation link is not valid." };

  const authUser = await requireUser();
  const verifiedEmail = authUser.email_confirmed_at;
  if (!authUser.email || !verifiedEmail) {
    return { error: "Verify your email address before accepting this invitation." };
  }

  const tokenHash = hashInvitationToken(parsed.data);
  let invitation;
  try {
    invitation = await prisma.organizationInvitation.findFirst({
      where: { tokenHash },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        organizationId: true,
      },
    });
  } catch (error) {
    console.error("Invitation could not be loaded for acceptance.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't verify this invitation. Please try again." };
  }

  if (!invitation) {
    return { error: "This invitation is no longer valid." };
  }
  if (invitation.status === InvitationStatus.ACCEPTED) {
    return { message: "This invitation has already been accepted." };
  }
  if (invitation.status === InvitationStatus.CANCELLED) {
    return { error: "This invitation is no longer valid." };
  }
  if (invitation.status === InvitationStatus.EXPIRED) {
    return { error: "This invitation has expired. Ask a workspace owner to send a new invitation." };
  }
  if (normalizeEmail(authUser.email) !== normalizeEmail(invitation.email)) {
    return { error: `Sign in with ${invitation.email} to accept this invitation.` };
  }
  if (isInvitationExpired(invitation.expiresAt)) {
    try {
      await prisma.organizationInvitation.updateMany({
        where: {
          id: invitation.id,
          tokenHash,
          status: InvitationStatus.PENDING,
        },
        data: { status: InvitationStatus.EXPIRED },
      });
    } catch (error) {
      console.error("Expired invitation status could not be updated.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return { error: "We couldn't verify this invitation. Please try again." };
    }
    return { error: "This invitation has expired. Ask a workspace owner to send a new invitation." };
  }
  if (invitation.role !== OrganizationRole.MEMBER) {
    return { error: "This invitation role is not supported." };
  }

  let profile: Awaited<ReturnType<typeof syncProfile>>;
  try {
    profile = await syncProfile(authUser);
  } catch (error) {
    console.error("Invitation acceptance could not load the authenticated profile.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't verify your account. Please sign in again and retry." };
  }

  let result: "invalid" | "accepted" | "cancelled" | "expired" | "workspace-missing" | "already-member";
  try {
    result = await prisma.$transaction(async (transaction) => {
      const now = new Date();
      const current = await transaction.organizationInvitation.findFirst({
        where: { id: invitation.id, tokenHash },
        select: { status: true, expiresAt: true, organizationId: true, role: true },
      });

      if (!current) {
        const organization = await transaction.organization.findUnique({
          where: { id: invitation.organizationId },
          select: { id: true },
        });
        return organization ? "invalid" as const : "workspace-missing" as const;
      }
      if (current.status === InvitationStatus.ACCEPTED) return "accepted" as const;
      if (current.status === InvitationStatus.CANCELLED) return "cancelled" as const;
      if (current.status === InvitationStatus.EXPIRED) return "expired" as const;
      if (current.status !== InvitationStatus.PENDING) return "invalid" as const;
      if (isInvitationExpired(current.expiresAt, now.getTime())) {
        await transaction.organizationInvitation.updateMany({
          where: { id: invitation.id, tokenHash, status: InvitationStatus.PENDING },
          data: { status: InvitationStatus.EXPIRED },
        });
        return "expired" as const;
      }
      if (current.role !== OrganizationRole.MEMBER) return "invalid" as const;

      const organization = await transaction.organization.findUnique({
        where: { id: current.organizationId },
        select: { id: true },
      });
      if (!organization) return "workspace-missing" as const;

      const claimed = await transaction.organizationInvitation.updateMany({
        where: {
          id: invitation.id,
          tokenHash,
          status: InvitationStatus.PENDING,
          expiresAt: { gt: now },
        },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: now,
        },
      });
      if (claimed.count !== 1) return "invalid" as const;

      const existingMembership = await transaction.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: current.organizationId,
            userId: profile.id,
          },
        },
        select: { id: true },
      });

      if (existingMembership) return "already-member" as const;

      await transaction.organizationMember.create({
        data: {
          organizationId: current.organizationId,
          userId: profile.id,
          role: OrganizationRole.MEMBER,
        },
      });
      return "accepted" as const;
    });

  } catch (error) {
    console.error("Invitation acceptance transaction failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't accept this invitation. Please try again." };
  }

  if (result === "workspace-missing") {
    return { error: "This workspace is no longer available." };
  }
  if (result === "cancelled" || result === "invalid") {
    return { error: "This invitation is no longer valid." };
  }
  if (result === "expired") {
    return { error: "This invitation has expired. Ask a workspace owner to send a new invitation." };
  }
  if (result === "already-member") {
    return { message: "You already have access to this workspace." };
  }
  if (result === "accepted") {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, invitation.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return { message: "This invitation has already been accepted." };
}

export async function cancelInvitationAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { authorized, organization, membership } = await requireWorkspaceManager();
  if (!authorized || !membership) {
    return { error: "Only workspace owners can manage invitations." };
  }

  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) return { error: "Invitation not found." };

  try {
    const result = await prisma.organizationInvitation.updateMany({
      where: {
        id: invitationId,
        organizationId: organization.id,
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.CANCELLED },
    });
    if (result.count !== 1) return { error: "Only pending invitations can be cancelled." };
  } catch (error) {
    console.error("Invitation cancellation failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't cancel the invitation. Please try again." };
  }

  revalidatePath("/settings/members");
  return { message: "Invitation cancelled." };
}

export async function removeMemberAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { authorized, organization, membership } = await requireWorkspaceManager();
  if (!authorized || !membership) {
    return { error: "Only workspace owners can remove members." };
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) return { error: "Member not found." };

  let result;
  try {
    result = await prisma.organizationMember.deleteMany({
      where: {
        id: memberId,
        organizationId: organization.id,
        role: OrganizationRole.MEMBER,
        userId: { not: membership.userId },
      },
    });
  } catch (error) {
    console.error("Workspace member removal failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't remove the member. Please try again." };
  }
  if (result.count !== 1) {
    return { error: "This member could not be removed. Refresh the page and try again." };
  }

  revalidatePath("/settings/members");
  revalidatePath("/settings/workspace");
  return { message: "Member removed." };
}

export async function refreshInvitationLinkAction(
  _previousState: FormState,
  formData: FormData,
): Promise<InvitationFormState> {
  const { authorized, organization } = await requireWorkspaceManager();
  if (!authorized) return { error: "Only workspace owners can manage invitations." };

  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) return { error: "Invitation not found." };

  const existing = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: organization.id,
      status: InvitationStatus.PENDING,
    },
    select: { tokenHash: true },
  });
  if (!existing) return { error: "Only pending invitations can be shared." };

  const token = createInvitationToken();
  let links: Awaited<ReturnType<typeof makeInvitationLinks>>;
  try {
    links = await makeInvitationLinks(token);
  } catch (error) {
    console.error("Invitation link could not be generated.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't create an invitation link. Check the application URL configuration and try again." };
  }

  let result;
  try {
    result = await prisma.organizationInvitation.updateMany({
      where: {
        id: invitationId,
        organizationId: organization.id,
        status: InvitationStatus.PENDING,
        tokenHash: existing.tokenHash,
      },
      data: {
        tokenHash: hashInvitationToken(token),
        expiresAt: getInvitationExpiry(),
      },
    });
  } catch (error) {
    console.error("Invitation link could not be refreshed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't refresh the invitation link. Please try again." };
  }
  if (result.count !== 1) return { error: "Only pending invitations can be shared." };

  revalidatePath("/settings/members");
  return {
    message: "Invitation link refreshed. Copy the new link to share it.",
    invitationLink: links.invitationLink,
  };
}

export async function resendInvitationAction(
  _previousState: FormState,
  formData: FormData,
): Promise<InvitationFormState> {
  const { authorized, organization } = await requireWorkspaceManager();
  if (!authorized) return { error: "Only workspace owners can manage invitations." };

  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) return { error: "Invitation not found." };

  let invitation: { email: string; tokenHash: string | null } | null;
  try {
    invitation = await prisma.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId: organization.id,
        status: InvitationStatus.PENDING,
      },
      select: { email: true, tokenHash: true },
    });
  } catch (error) {
    console.error("Pending invitation could not be loaded for resend.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't load the invitation. Please try again." };
  }
  if (!invitation) return { error: "Only pending invitations can be resent." };

  const token = createInvitationToken();
  let links: Awaited<ReturnType<typeof makeInvitationLinks>>;
  try {
    links = await makeInvitationLinks(token);
  } catch (error) {
    console.error("Invitation link could not be generated.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't create an invitation link. Check the application URL configuration and try again." };
  }

  let updated;
  try {
    updated = await prisma.organizationInvitation.updateMany({
      where: {
        id: invitationId,
        organizationId: organization.id,
        status: InvitationStatus.PENDING,
        tokenHash: invitation.tokenHash,
      },
      data: {
        tokenHash: hashInvitationToken(token),
        expiresAt: getInvitationExpiry(),
      },
    });
  } catch (error) {
    console.error("Invitation token could not be rotated for resend.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't refresh the invitation. Please try again." };
  }
  if (updated.count !== 1) return { error: "This invitation is no longer pending." };

  revalidatePath("/settings/members");
  return sendAndReturnInvitation(
    normalizeEmail(invitation.email),
    links.invitationLink,
    links.callbackUrl,
    "refreshed",
  );
}

export async function leaveWorkspaceAction(
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;
  const { membership, organization, profile } = await requireCurrentOrganization();
  if (membership.role === OrganizationRole.OWNER) {
    let memberCount: number;
    try {
      memberCount = await prisma.organizationMember.count({
        where: { organizationId: organization.id },
      });
    } catch (error) {
      console.error("Workspace owner member count could not be loaded.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return { error: "We couldn't verify workspace ownership. Please try again." };
    }
    return {
      error: memberCount > 1
        ? "You can't leave while you own a workspace with other members. Ownership transfer is not available yet."
        : "Workspace owners can't leave. For a single-member workspace, use account deletion; that also deletes your account.",
    };
  }

  let result;
  try {
    result = await prisma.organizationMember.deleteMany({
      where: {
        organizationId: organization.id,
        userId: profile.id,
        role: OrganizationRole.MEMBER,
      },
    });
  } catch (error) {
    console.error("Workspace leave action failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't leave this workspace. Please try again." };
  }
  if (result.count !== 1) {
    return { error: "Your workspace membership could not be removed. Refresh and try again." };
  }

  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value === organization.id) {
    cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
  }

  const remaining = await prisma.organizationMember.count({
    where: { userId: profile.id },
  });

  revalidatePath("/", "layout");
  redirect(remaining > 0 ? "/dashboard" : "/no-workspace");
}

export async function switchWorkspaceAction(formData: FormData): Promise<void> {
  const authUser = await requireUser();
  const state = await resolveApplicationEntryState(authUser);
  if (state.kind !== "READY") redirect("/onboarding");

  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const membership = state.memberships.find((row) => row.organizationId === organizationId);
  if (!membership) {
    throw new Error("You are not a member of that workspace.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, membership.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
