import "server-only";

import { NextResponse } from "next/server";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import { isInvitationToken } from "@/lib/members/invitation-tokens";
import { createClient } from "@/lib/supabase/server";

export async function completeAuthCallback(request: Request, invitationToken?: string) {
  const { searchParams, origin } = new URL(request.url);
  const safeInvitationToken = invitationToken && isInvitationToken(invitationToken)
    ? invitationToken
    : undefined;
  const code = searchParams.get("code");

  if (!code) {
    const target = safeInvitationToken
      ? `/invitations/${safeInvitationToken}`
      : "/login?notice=confirmation";
    return NextResponse.redirect(new URL(target, origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const target = safeInvitationToken
      ? `/invitations/${safeInvitationToken}`
      : "/login?notice=confirmation";
    return NextResponse.redirect(new URL(target, origin));
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", origin));

  try {
    const state = await resolveApplicationEntryState(data.user, safeInvitationToken);
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
