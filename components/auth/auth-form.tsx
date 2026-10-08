"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, resendConfirmation, signup } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { getAuthPathForReturnTo } from "@/lib/members/invitation-tokens";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "signup";
  notice?: string;
  returnTo?: string;
};

type ActionState = {
  error?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

const noticeMessages: Record<string, string> = {
  confirmation: "That confirmation link could not be used. Try signing in or request a new link.",
  setup: "Your account is confirmed, but we couldn't finish setting it up. Please sign in again.",
  signout: "We couldn't complete sign out. Please try again.",
};

export function AuthForm({ mode, notice, returnTo }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(isSignup ? signup : login, {} as ActionState);
  const [resendState, resendAction, resendPending] = useActionState(resendConfirmation, {} as ActionState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordMismatch =
    isSignup && confirmPassword.length > 0 && password.length > 0 && password !== confirmPassword;
  const successMessage = state.message ? String(state.message) : undefined;
  const submitDisabled =
    pending ||
    Boolean(successMessage) ||
    Boolean(state.actionLabel) ||
    (isSignup
      ? !name.trim() || !email.trim() || password.length < 8 || !confirmPassword.trim() || passwordMismatch
      : !email.trim() || !password);

  const error = state.error ?? (notice ? noticeMessages[notice] : undefined);
  const alternateAuthPath = getAuthPathForReturnTo(returnTo, isSignup ? "login" : "signup");

  const showResendForm =
    state.actionLabel === "Resend confirmation" ||
    state.actionLabel === "Resend confirmation email";

  const resendError = resendState.error;
  const resendMessage = resendState.message;

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
          <form action={action} aria-busy={pending || Boolean(successMessage)} className="space-y-5">
            {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
            {isSignup && (
              <TextField
                autoComplete="name"
                id="name"
                label="Full name"
                minLength={2}
                name="name"
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Jane Doe"
                required
                value={name}
              />
            )}
            <TextField
              autoComplete="email"
              id="email"
              label="Work email"
              name="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="you@youragency.com"
              required
              type="email"
              value={email}
            />
            <TextField
              autoComplete={isSignup ? "new-password" : "current-password"}
              error={
                isSignup && passwordMismatch
                  ? "Your passwords do not match."
                  : undefined
              }
              hint={isSignup ? "Use at least 8 characters." : undefined}
              id="password"
              label="Password"
              minLength={isSignup ? 8 : 1}
              name="password"
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              required
              type="password"
              value={password}
            />
            {isSignup && (
              <TextField
                autoComplete="new-password"
                error={passwordMismatch ? "Your passwords do not match." : undefined}
                id="confirmPassword"
                label="Confirm password"
                minLength={8}
                name="confirmPassword"
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                placeholder="Re-enter your password"
                required
                type="password"
                value={confirmPassword}
              />
            )}

            {error ? <Alert aria-live="assertive" role="alert">{error}</Alert> : null}
            {successMessage ? (
              <Alert aria-live="polite" role="status" tone="success">
                {successMessage}
              </Alert>
            ) : null}

            <button
              aria-busy={pending}
              className={cn(buttonVariants({ size: "lg", variant: "primary" }), "w-full")}
              disabled={submitDisabled}
              type="submit"
            >
              {pending ? "Please wait..." : successMessage ? "Check your email" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          {state.actionLabel && state.actionHref && !showResendForm ? (
            <div className="mt-4">
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
                href={state.actionHref}
              >
                {state.actionLabel}
              </Link>
            </div>
          ) : null}

          {showResendForm && email ? (
            <form action={resendAction} className="mt-4 space-y-3">
              <input type="hidden" name="email" value={email} />
              <button
                aria-busy={resendPending}
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
                disabled={resendPending}
                type="submit"
              >
                {resendPending ? "Sending..." : "Resend confirmation email"}
              </button>
              {resendError ? (
                <Alert aria-live="assertive" role="alert">{resendError}</Alert>
              ) : null}
              {resendMessage ? (
                <Alert aria-live="polite" role="status" tone="success">
                  {resendMessage}
                </Alert>
              ) : null}
            </form>
          ) : null}

          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">
            <p>
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <Link
                className="font-medium text-[var(--accent)] underline underline-offset-4 transition-colors hover:text-[var(--ink)]"
                href={alternateAuthPath}
              >
                {isSignup ? "Log in" : "Sign up"}
              </Link>
            </p>
            {!isSignup && (
              <p>
                <Link
                  className="font-medium text-[var(--accent)] underline underline-offset-4 transition-colors hover:text-[var(--ink)]"
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
              </p>
            )}
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
