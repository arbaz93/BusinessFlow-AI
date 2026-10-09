"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getPublicEnv();

  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}