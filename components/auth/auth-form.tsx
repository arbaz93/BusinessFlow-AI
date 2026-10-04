"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "signup";
  notice?: string;
};

const noticeMessages: Record<string, string> = {
  confirmation: "That confirmation link could not be used. Try signing in or request a new link.",
  setup: "Your account is confirmed, but we couldn't finish setting it up. Please sign in again.",
  signout: "We couldn't complete sign out. Please try again.",
};

export function AuthForm({ mode, notice }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(isSignup ? signup : login, {});
  const error = state.error ?? (notice ? noticeMessages[notice] : undefined);

  return (
    <AuthShell
      description={
        isSignup
          ? "Start organizing your agency with BusinessFlow AI."
          : "Sign in to your workspace."
      }
      title={isSignup ? "Create your account" : "Welcome back"}
    >
      <Card className="bg-transparent border-0">
        <CardContent className="px-6 sm:px-8">
          <form action={action} className="space-y-5">
            {isSignup && (
              <TextField
                autoComplete="name"
                id="name"
                label="Full name"
                minLength={2}
                name="name"
                placeholder="Jane Doe"
                required
              />
            )}
            <TextField
              autoComplete="email"
              id="email"
              label="Work email"
              name="email"
              placeholder="you@youragency.com"
              required
              type="email"
            />
            <TextField
              autoComplete={isSignup ? "new-password" : "current-password"}
              hint={isSignup ? "Use at least 8 characters." : undefined}
              id="password"
              label="Password"
              minLength={isSignup ? 8 : 1}
              name="password"
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              required
              type="password"
            />
            {isSignup && (
              <TextField
                autoComplete="new-password"
                id="confirmPassword"
                label="Confirm password"
                minLength={8}
                name="confirmPassword"
                placeholder="Re-enter your password"
                required
                type="password"
              />
            )}

            {error ? <Alert role="alert">{error}</Alert> : null}
            {state.message ? <Alert role="status" tone="success">{state.message}</Alert> : null}

            <button
              className={cn(buttonVariants({ size: "lg", variant: "primary" }), "w-full")}
              disabled={pending}
              type="submit"
            >
              {pending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">
            <p>
              {isSignup ? "Already have an account? " : "Don’t have an account? "}
              <Link
                className="font-medium text-[var(--accent)] underline underline-offset-4 transition-colors hover:text-[var(--ink)]"
                href={isSignup ? "/login" : "/signup"}
              >
                {isSignup ? "Log in" : "Sign up"}
              </Link>
            </p>
            {!isSignup && <p>Forgot password?</p>}
            {isSignup && (
              <p className="text-xs leading-5">
                By creating an account, you agree to our Terms and Privacy Policy.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
