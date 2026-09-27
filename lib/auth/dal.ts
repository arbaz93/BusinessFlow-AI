import "server-only";

import { cache } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

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
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: profile.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  return { authUser, profile, membership };
}

export const requireOrganization = cache(async () => {
  const authUser = await requireUser();
  const context = await getOrganizationContext(authUser);

  if (!context.membership) redirect("/onboarding");
  return { ...context, organization: context.membership.organization };
});