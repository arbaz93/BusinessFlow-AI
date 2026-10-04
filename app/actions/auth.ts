"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";
import { getOrganizationContext } from "@/lib/auth/dal";
import { loginSchema, signupSchema } from "@/lib/auth/schemas";
import type { FormState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export async function login(_previousState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  let destination: "/dashboard" | "/onboarding";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.user) return { error: "Email or password is incorrect." };

    const context = await getOrganizationContext(data.user);
    destination = context.membership ? "/dashboard" : "/onboarding";
  } catch {
    return { error: "We couldn't sign you in right now. Please try again." };
  }

  redirect(destination);
}

export async function signup(_previousState: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  let destination: "/dashboard" | "/onboarding" | undefined;
  try {
    const supabase = await createClient();
    const requestHeaders = await headers();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: getAuthCallbackUrl(requestHeaders),
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
      destination = "/onboarding";
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

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) redirect("/dashboard?notice=signout");
  redirect("/login");
}