"use server";

import { revalidatePath } from "next/cache";
import { organizationUpdateSchema } from "@/lib/auth/schemas";
import { requireWorkspaceManager } from "@/lib/auth/authorization";
import type { FormState } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";

export async function updateOrganization(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = organizationUpdateSchema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Review the workspace details and try again." };
  }

  const { organization, authorized, membership } = await requireWorkspaceManager();
  if (!authorized) {
    return { error: "Only workspace owners and admins can manage workspace settings." };
  }

  void membership;

  try {
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        name: parsed.data.name,
        businessType: parsed.data.businessType,
      },
    });
  } catch {
    return { error: "We couldn't save the workspace settings. Please try again." };
  }

  revalidatePath("/settings/workspace");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { message: "Workspace settings saved." };
}
