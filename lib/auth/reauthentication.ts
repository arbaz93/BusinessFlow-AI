import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function verifyUserPassword(authUserId: string, email: string, password: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return false;

  const client = createSupabaseClient(supabaseUrl, publishableKey, {
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
