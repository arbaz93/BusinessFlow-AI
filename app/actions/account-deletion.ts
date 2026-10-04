"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteAccountSchema } from "@/lib/auth/schemas";
import { verifyUserPassword } from "@/lib/auth/reauthentication";
import { requireOrganization } from "@/lib/auth/dal";
import {
  deleteAccount,
  getAccountDeletionEligibility,
  type AccountDeletionEligibility,
} from "@/lib/organizations/deletion";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountFormState = {
  error?: string;
  message?: string;
  blocked?: boolean;
};

export async function getAccountDeletionState(): Promise<AccountDeletionEligibility> {
  const { profile } = await requireOrganization();
  return getAccountDeletionEligibility(profile.id);
}

export async function deleteAccountAction(
  _previousState: DeleteAccountFormState,
  formData: FormData,
): Promise<DeleteAccountFormState> {
  const { authUser, profile } = await requireOrganization();
  if (!authUser.email) {
    return { error: "We couldn't process your request. Please sign in again." };
  }

  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confirm the deletion to continue." };
  }

  const verified = await verifyUserPassword(
    authUser.id,
    authUser.email,
    parsed.data.password,
  );
  if (!verified) {
    return { error: "Your password is incorrect." };
  }

  const result = await deleteAccount({
    profileId: profile.id,
    authUserId: authUser.id,
  });

  if (!result.success) {
    return { error: result.error, blocked: result.blocked };
  }

  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => {
    // The auth identity was already removed; clearing the local session is best-effort.
  });

  revalidatePath("/dashboard");
  redirect("/account-deleted");
}
