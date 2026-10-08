"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl, getPasswordRecoveryUrl } from "@/lib/auth/callback-url";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import {
  classifySupabaseError,
  detectExistingAccount,
  mapAuthErrorToMessage,
  type AuthErrorCategory,
} from "@/lib/auth/errors";
import { loginSchema, signupSchema, forgotPasswordSchema, updatePasswordSchema } from "@/lib/auth/schemas";
import {
  getAuthPathForReturnTo,
  getInvitationTokenFromReturnTo,
} from "@/lib/members/invitation-tokens";
import type { FormState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

function authErrorResponse(
  category: AuthErrorCategory,
  overrides?: Partial<FormState>,
): FormState {
  return {
    error: mapAuthErrorToMessage(category),
    ...overrides,
  };
}

export async function login(_previousState: FormState, formData: FormData): Promise<FormState> {
  const returnTo = String(formData.get("returnTo") ?? "");
  const invitationReturnTo = getInvitationTokenFromReturnTo(returnTo)
    ? returnTo
    : undefined;
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  let destination: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.user) {
      const category = classifySupabaseError(error?.code, error?.status, error?.message);
      if (category === "EMAIL_NOT_CONFIRMED") {
        return {
          error: "Your email hasn't been confirmed yet. Check your inbox or request a new confirmation email.",
          actionLabel: "Resend confirmation email",
          actionHref: undefined,
        };
      }
      return authErrorResponse(category);
    }

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

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  let destination: string | undefined;
  try {
    const supabase = await createClient();
    const requestHeaders = await headers();

    const existing = await detectExistingAccount(normalizedEmail);
    if (existing.exists) {
      if (existing.confirmed) {
        return {
          error: "An account with this email already exists. Sign in instead.",
          actionLabel: "Sign in",
          actionHref: getAuthPathForReturnTo(returnTo, "login"),
        };
      }
      return {
        error: "An account with this email already exists but hasn't been confirmed yet. Check your email for the confirmation link, or request a new one.",
        actionLabel: "Resend confirmation",
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
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
      const category = classifySupabaseError(error.code, error.status, error.message);
      if (category === "EMAIL_ALREADY_EXISTS") {
        return {
          error: "An account with this email already exists. Sign in instead.",
          actionLabel: "Sign in",
          actionHref: getAuthPathForReturnTo(returnTo, "login"),
        };
      }
      if (category === "RATE_LIMITED") {
        return {
          error: "Supabase has temporarily limited confirmation emails. Please try again later or configure a custom SMTP provider.",
        };
      }
      return authErrorResponse(category);
    }

    if (data.user && data.session) {
      destination = invitationReturnTo ?? "/no-workspace";
    } else if (data.user) {
      return {
        message: "Check your email to confirm your account, then return here to sign in.",
      };
    } else {
      return { error: "We couldn't create your account right now. Please try again." };
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

export async function resendConfirmation(_previousState: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Enter your email address." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      console.error("Supabase confirmation resend failed.", {
        code: error.code,
        status: error.status,
      });
      const category = classifySupabaseError(error.code, error.status, error.message);
      if (category === "EMAIL_ALREADY_EXISTS" || category === "RATE_LIMITED") {
        return authErrorResponse(category);
      }
      return { error: "We couldn't resend the confirmation email. Please try again." };
    }

    return { message: "Confirmation email sent. Check your inbox." };
  } catch {
    return { error: "We couldn't resend the confirmation email. Please try again." };
  }
}

export async function signOut(formData?: FormData) {
  const returnTo = String(formData?.get("returnTo") ?? "");
  const signInRedirect = getAuthPathForReturnTo(returnTo, "login");
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) redirect("/dashboard?notice=signout");
  redirect(signInRedirect);
}

export async function forgotPassword(_previousState: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const supabase = await createClient();
    const requestHeaders = await headers();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordRecoveryUrl(requestHeaders),
    });

    if (error) {
      console.error("Supabase password reset request failed.", {
        code: error.code,
        status: error.status,
      });
      const category = classifySupabaseError(error.code, error.status, error.message);
      if (category === "RATE_LIMITED") {
        return { error: "Too many reset requests. Please try again later." };
      }
      return authErrorResponse(category);
    }

    return {
      message:
        "If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.",
    };
  } catch {
    return { error: "We couldn't process your request right now. Please try again." };
  }
}

export async function updatePassword(_previousState: FormState, formData: FormData): Promise<FormState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      console.error("Supabase password update failed.", {
        code: error.code,
        status: error.status,
      });
      const category = classifySupabaseError(error.code, error.status, error.message);
      if (category === "RECOVERY_SESSION_INVALID" || category === "RECOVERY_SESSION_EXPIRED") {
        return {
          error: "This password reset link is invalid or has expired. Request a new reset link.",
          actionLabel: "Request new reset link",
          actionHref: "/forgot-password",
        };
      }
      if (category === "INVALID_INPUT") {
        return { error: "Use at least 8 characters for your password." };
      }
      if (category === "RATE_LIMITED") {
        return { error: "Too many attempts. Please try again later." };
      }
      return authErrorResponse(category, { actionLabel: "Request new reset link", actionHref: "/forgot-password" });
    }

    return { message: "Your password has been updated successfully. You can now sign in with your new password." };
  } catch {
    return { error: "We couldn't update your password right now. Please try again." };
  }
}
