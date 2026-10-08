import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPublicEnv, getServerEnv } from "@/lib/env";

export type InvitationEmailResult =
  | { status: "sent" }
  | { status: "unavailable" }
  | { status: "failed" };

function hasExistingAuthUser(error: { code?: string; message?: string }) {
  return (
    error.code === "email_exists" ||
    error.code === "user_already_exists" ||
    error.message?.toLowerCase().includes("already been registered") === true
  );
}

export async function sendInvitationEmail(
  email: string,
  redirectTo: string,
): Promise<InvitationEmailResult> {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getPublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return { status: "unavailable" };
  }

  try {
    const admin = getSupabaseAdminClient();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (!inviteError) return { status: "sent" };

    if (!hasExistingAuthUser(inviteError)) {
      console.warn("Supabase invitation email could not be submitted.", {
        code: inviteError.code,
        status: inviteError.status,
      });
      return { status: "failed" };
    }

    const client = createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (!signInError) return { status: "sent" };

    console.warn("Supabase invitation sign-in email could not be submitted.", {
      code: signInError.code,
      status: signInError.status,
    });
    return { status: "failed" };
  } catch (error) {
    console.warn("Supabase invitation email delivery is unavailable.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: "failed" };
  }
}