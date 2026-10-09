"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { OrganizationRole } from "@/app/generated/prisma/enums";
import { ACTIVE_WORKSPACE_COOKIE, requireUser } from "@/lib/auth/dal";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import { workspaceSchema } from "@/lib/auth/schemas";
import type { FormState } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export async function createWorkspace(_previousState: FormState, formData: FormData): Promise<FormState> {
  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid workspace name." };

  const authUser = await requireUser();

  try {
    const state = await resolveApplicationEntryState(authUser);
    if (state.kind === "UNAUTHENTICATED") redirect("/login");
    if (state.kind === "READY") redirect("/dashboard");
  } catch {
    return { error: "We couldn't load your account. Please try again." };
  }

  const baseSlug = parsed.data.name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "workspace";

  let organizationId: string;
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const profile = await transaction.user.findUnique({
        where: { authUserId: authUser.id },
        select: { id: true },
      });

      const organization = await transaction.organization.create({
        data: {
          name: parsed.data.name,
          businessType: parsed.data.businessType,
          slug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
          memberships: {
            create: { userId: profile!.id, role: OrganizationRole.OWNER },
          },
        },
        select: { id: true },
      });

      return organization;
    });
    organizationId = result.id;
  } catch {
    const state = await resolveApplicationEntryState(authUser).catch(() => null);
    if (state?.kind === "READY") redirect("/dashboard");
    return { error: "We couldn't create your workspace. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect("/dashboard");
}
