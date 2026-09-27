"use server";

import { randomUUID } from "node:crypto";
import { OrganizationRole } from "@/app/generated/prisma/enums";
import { getOrganizationContext, requireUser } from "@/lib/auth/dal";
import { workspaceSchema } from "@/lib/auth/schemas";
import type { FormState } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export async function createWorkspace(_previousState: FormState, formData: FormData): Promise<FormState> {
  const parsed = workspaceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid workspace name." };

  const authUser = await requireUser();
  let context;

  try {
    context = await getOrganizationContext(authUser);
  } catch {
    return { error: "We couldn't load your account. Please try again." };
  }

  if (context.membership) redirect("/dashboard");

  const baseSlug = parsed.data.name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "workspace";

  try {
    await prisma.$transaction((transaction) =>
      transaction.organization.create({
        data: {
          name: parsed.data.name,
          slug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
          memberships: {
            create: { userId: context.profile.id, role: OrganizationRole.OWNER },
          },
        },
      }),
    );
  } catch {
    const existingMembership = await prisma.organizationMember.findFirst({
      where: { userId: context.profile.id },
      select: { id: true },
    }).catch(() => null);

    if (existingMembership) redirect("/dashboard");
    return { error: "We couldn't create your workspace. Please try again." };
  }

  redirect("/dashboard");
}