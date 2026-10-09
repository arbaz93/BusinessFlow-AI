import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";

export function getSupabaseAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Server-side Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment, then restart the app.",
    );
  }

  return createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}