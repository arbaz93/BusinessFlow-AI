"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import { loginSchema, signupSchema } from "@/lib/auth/schemas";
import {
  getAuthPathForReturnTo,
  getInvitationTokenFromReturnTo,
} from "@/lib/members/invitation-tokens";
import type { FormState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export async function login(_previousState: FormState, formData: FormData): Promise<FormState> {
  const returnTo = String(formData.get("returnTo") ?? "");
  const invitationReturnTo = getInvitationTokenFromReturnTo(returnTo)
    ? returnTo
    : undefined;
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  let destination: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.user) return { error: "Email or password is incorrect." };

    const state = await resolveApplicationEntryState(data.user);
    destination = invitationReturnTo ?? (state.kind === "READY" ? "/dashboard" : state.kind === "NO_WORKSPACE" ? "/no-workspace" : "/onboarding");
  } catch {
    return { error: "We couldn't sign you in right now. Please try again." };
  }

  redirect(destination);
}

export async function signup(_previousState: FormState, formData: FormData): Promise<FormState> {
  const returnTo = String(formData.get("returnTo") ?? "");
  const invitationToken = getInvitationTokenFromReturnTo(returnTo);
  const invitationReturnTo = invitationToken ? returnTo : undefined;
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  let destination: string | undefined;
  try {
    const supabase = await createClient();
    const requestHeaders = await headers();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: getAuthCallbackUrl(requestHeaders, undefined, invitationToken),
      },
    });

    if (error) {
      console.error("Supabase sign-up request failed.", {
        code: error.code,
        status: error.status,
      });
      if (error.code === "over_email_send_rate_limit") {
        return {
          error: "Supabase has temporarily limited confirmation emails. Please try again later or configure a custom SMTP provider.",
        };
      }
      const isDuplicate = error.code === "user_already_exists" || error.message.toLowerCase().includes("already registered");
      return { error: isDuplicate ? "An account with this email already exists. Try signing in." : "We couldn't create your account. Please try again." };
    }

    if (data.user && data.session) {
      destination = invitationReturnTo ?? "/no-workspace";
    } else {
      return { message: "Check your email to confirm your account, then return here to sign in." };
    }
  } catch (error) {
    console.error("Account sign-up could not be completed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "We couldn't create your account right now. Please try again." };
  }

  if (destination) redirect(destination);
  return { error: "We couldn't create your account right now. Please try again." };
}

export async function signOut(formData?: FormData) {
  const returnTo = String(formData?.get("returnTo") ?? "");
  const signInRedirect = getAuthPathForReturnTo(returnTo, "login");
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) redirect("/dashboard?notice=signout");
  redirect(signInRedirect);
}