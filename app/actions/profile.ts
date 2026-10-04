"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/dal";
import { profileUpdateSchema, emailUpdateSchema, passwordUpdateSchema } from "@/lib/auth/schemas";
import { verifyUserPassword } from "@/lib/auth/reauthentication";
import type { FormState } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = profileUpdateSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "We couldn't update your profile." };
  }

  const { authUser, profile } = await requireOrganization();
  if (!authUser.email) {
    return { error: "We couldn't update your profile. Please try again." };
  }

  const newName = parsed.data.name;
  const metadata = {
    name: newName,
    full_name: newName,
  };

  try {
    const supabase = await createClient();
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (updateUserError) {
      console.error("Profile name update failed in Supabase Auth.", {
        userId: authUser.id,
        errorName: updateUserError instanceof Error ? updateUserError.name : "UnknownError",
      });
      return { error: "We couldn't update your profile. Please try again." };
    }

    await prisma.user.update({
      where: { id: profile.id },
      data: { name: newName },
    });
  } catch {
    return { error: "We couldn't update your profile. Please try again." };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/settings/security");
  return { message: "Your profile has been updated." };
}

export async function updateEmail(
  previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailUpdateSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const { authUser, profile } = await requireOrganization();
  if (!authUser.email) {
    return { error: "We couldn't update your email. Please try again." };
  }

  if (parsed.data.email.toLowerCase() === authUser.email.toLowerCase()) {
    return { message: "This is already your email address." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
    if (error) {
      console.error("Email update failed in Supabase Auth.", {
        userId: authUser.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return {
        error:
          "We couldn't update your email. If this email is already in use, try signing in or use another address.",
      };
    }
  } catch {
    return { error: "We couldn't update your email. Please try again." };
  }

  void profile;
  revalidatePath("/settings/security");
  return {
    message:
      "If the new email is not already in use, a confirmation email has been sent. Your address will update once you confirm it.",
  };
}

export async function updatePassword(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = passwordUpdateSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Review your password and try again." };
  }

  const { authUser } = await requireOrganization();
  if (!authUser.email) {
    return { error: "We couldn't update your password. Please try again." };
  }

  const verified = await verifyUserPassword(authUser.id, authUser.email, parsed.data.currentPassword);
  if (!verified) {
    return { error: "Your current password is incorrect." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.newPassword,
    });
    if (error) {
      console.error("Password update failed in Supabase Auth.", {
        userId: authUser.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return { error: "We couldn't update your password. Please try again." };
    }
  } catch {
    return { error: "We couldn't update your password. Please try again." };
  }

  revalidatePath("/settings/security");
  return { message: "Your password has been updated." };
}
