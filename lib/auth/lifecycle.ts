import "server-only";

import { cookies } from "next/headers";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { ACTIVE_WORKSPACE_COOKIE, syncProfile } from "@/lib/auth/dal";
import {
  hashInvitationToken,
  isInvitationExpired,
  isInvitationToken,
} from "@/lib/members/invitation-tokens";
import { InvitationStatus } from "@/app/generated/prisma/enums";
import type {
  ApplicationEntryState,
  ApplicationInvitation,
} from "@/lib/auth/lifecycle-state";
import { computeEntryState } from "@/lib/auth/lifecycle-state";

export async function resolveApplicationEntryState(
  authUser: SupabaseUser | null | undefined,
  invitationToken?: string,
): Promise<ApplicationEntryState> {
  if (!authUser) return { kind: "UNAUTHENTICATED" };

  const profile = await syncProfile(authUser);

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: profile.id },
    select: {
      id: true,
      userId: true,
      role: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true, businessType: true, slug: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  if (cookieValue && !memberships.some((row) => row.organizationId === cookieValue)) {
    try {
      cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
    } catch {
      // Server Component context — cookie clearing is best-effort
    }
  }

  let invitation: ApplicationInvitation | null = null;
  if (invitationToken && isInvitationToken(invitationToken)) {
    const found = await prisma.organizationInvitation.findFirst({
      where: {
        tokenHash: hashInvitationToken(invitationToken),
        status: InvitationStatus.PENDING,
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        expiresAt: true,
        organization: { select: { name: true } },
      },
    });

    if (found && !isInvitationExpired(found.expiresAt)) {
      invitation = {
        id: found.id,
        organizationId: found.organizationId,
        organizationName: found.organization.name,
        email: found.email,
        expiresAt: found.expiresAt,
      };
    }
  }

  return computeEntryState(profile, memberships, cookieValue, invitation);
}
