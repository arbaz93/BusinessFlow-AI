"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { forgotPassword } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, { error: undefined, message: undefined });
  const [email, setEmail] = useState("");

  const successMessage = state.message ? String(state.message) : undefined;
  const submitDisabled = pending || Boolean(successMessage) || !email.trim();

  return (
    <AuthShell
      description="Enter your email address and we'll send you a password reset link."
      title="Forgot your password?"
    >
      <Card className="bg-transparent border-0">
        <CardContent className="px-6 sm:px-8">
          <form action={action} aria-busy={pending || Boolean(successMessage)} className="space-y-5">
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

            {state.error ? <Alert aria-live="assertive" role="alert">{state.error}</Alert> : null}
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
              {pending ? "Sending..." : successMessage ? "Check your email" : "Send reset link"}
            </button>
          </form>

          {state.actionLabel && state.actionHref && !successMessage ? (
            <div className="mt-4">
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
                href={state.actionHref}
              >
                {state.actionLabel}
              </Link>
            </div>
          ) : null}

          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">
            <p>
              <Link
                className="font-medium text-[var(--accent)] underline underline-offset-4 transition-colors hover:text-[var(--ink)]"
                href="/login"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}