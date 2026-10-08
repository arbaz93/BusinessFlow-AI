import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

export async function verifyUserPassword(authUserId: string, email: string, password: string): Promise<boolean> {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getPublicEnv();

  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return false;

  const client = createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user?.id) return false;
    if (data.user.id !== authUserId) return false;
    return true;
  } finally {
    try {
      await client.auth.signOut({ scope: "local" });
    } catch {
      // best-effort cleanup: "local" scope only clears this throwaway client's
      // in-memory session and does NOT revoke the user's active server session.
    }
  }
}