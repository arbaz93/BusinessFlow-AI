import "server-only";

import { NextResponse } from "next/server";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import { isInvitationToken } from "@/lib/members/invitation-tokens";
import { classifySupabaseError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

export async function completeAuthCallback(request: Request, invitationToken?: string) {
  const { searchParams, origin } = new URL(request.url);
  const safeInvitationToken = invitationToken && isInvitationToken(invitationToken)
    ? invitationToken
    : undefined;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (!code) {
    const target = safeInvitationToken
      ? `/invitations/${safeInvitationToken}`
      : "/login?notice=confirmation";
    return NextResponse.redirect(new URL(target, origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const category = classifySupabaseError(error.code, error.status, error.message);
    const notice =
      category === "CALLBACK_ERROR" || category === "CONFIRMATION_EXPIRED"
        ? "confirmation"
        : category === "EMAIL_NOT_CONFIRMED"
          ? "confirmation"
          : undefined;
    const target = safeInvitationToken
      ? `/invitations/${safeInvitationToken}`
      : notice
        ? `/login?notice=${notice}`
        : "/login";
    return NextResponse.redirect(new URL(target, origin));
  }

  const authUser = data.user ?? (await supabase.auth.getUser()).data.user;
  if (!authUser) return NextResponse.redirect(new URL("/login", origin));

  // Password recovery flow — redirect to update-password page
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/update-password", origin));
  }

  try {
    const state = await resolveApplicationEntryState(authUser, safeInvitationToken);
    const target =
      state.kind === "READY"
        ? "/dashboard"
        : state.kind === "INVITATION_AVAILABLE"
          ? `/invitations/${safeInvitationToken}`
          : "/onboarding";
    return NextResponse.redirect(new URL(target, origin));
  } catch {
    return NextResponse.redirect(new URL("/login?notice=setup", origin));
  }
}
