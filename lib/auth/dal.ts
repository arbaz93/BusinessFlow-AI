import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";

export const ACTIVE_WORKSPACE_COOKIE = "businessflow_active_workspace";

function metadataString(user: SupabaseUser, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");
  return data.user;
}

export async function syncProfile(authUser: SupabaseUser) {
  if (!authUser.email) throw new Error("An email address is required for this account.");

  const name =
    metadataString(authUser, "name") ??
    metadataString(authUser, "full_name") ??
    authUser.email.split("@")[0] ??
    "Team member";
  const avatarUrl = metadataString(authUser, "avatar_url");

  return prisma.user.upsert({
    where: { authUserId: authUser.id },
    update: { name, email: authUser.email, avatarUrl },
    create: { authUserId: authUser.id, name, email: authUser.email, avatarUrl },
  });
}

export async function getOrganizationContext(authUser: SupabaseUser) {
  const profile = await syncProfile(authUser);
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: profile.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  const activeOrganizationId = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const membership =
    memberships.find((row) => row.organizationId === activeOrganizationId) ??
    memberships[0] ??
    null;

  return { authUser, profile, membership, memberships };
}

export const requireCurrentOrganization = cache(async () => {
  const authUser = await requireUser();
  const state = await resolveApplicationEntryState(authUser);

  if (state.kind === "NO_WORKSPACE") {
    redirect("/no-workspace");
  }
  if (state.kind === "INVITATION_AVAILABLE") {
    redirect("/onboarding");
  }
  if (state.kind !== "READY") {
    redirect("/login");
  }

  return {
    authUser,
    profile: state.profile,
    membership: state.membership,
    memberships: state.memberships,
    organization: state.organization,
    organizationId: state.organizationId,
  };
});

export const requireOrganization = requireCurrentOrganization;