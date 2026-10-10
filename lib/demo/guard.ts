import "server-only";

import { cache } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ORGANIZATION_SLUG, DEMO_USER_EMAILS, isDemoModeEnabled } from "@/lib/demo/config";

export interface DemoSessionInfo {
  isDemo: true;
  organizationSlug: string;
  ownerEmail: string;
}

export interface NonDemoSessionInfo {
  isDemo: false;
}

export type SessionInfo = DemoSessionInfo | NonDemoSessionInfo;

export async function isDemoEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return DEMO_USER_EMAILS.includes(normalized);
}

export async function getSessionDemoStatus(): Promise<SessionInfo> {
  if (!isDemoModeEnabled()) return { isDemo: false };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) return { isDemo: false };

  const demo = await isDemoEmail(data.user.email);
  if (!demo) return { isDemo: false };

  return {
    isDemo: true,
    organizationSlug: DEMO_ORGANIZATION_SLUG,
    ownerEmail: data.user.email,
  };
}

export const getCachedDemoStatus = cache(getSessionDemoStatus);

export async function clearDemoAuthSession(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export type { SupabaseUser };
