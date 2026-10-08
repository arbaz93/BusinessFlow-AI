"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";

interface UpdatePasswordFormProps {
  supabaseClient: SupabaseClient;
}

export function UpdatePasswordForm({ supabaseClient }: UpdatePasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password.length > 0 && password !== confirmPassword;
  const submitDisabled =
    pending ||
    success ||
    password.length < 8 ||
    !confirmPassword.trim() ||
    passwordMismatch;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitDisabled) return;

    setPending(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        const message = error.message;
        if (message.includes("Invalid refresh token") || message.includes("Flow state not found")) {
          setError("This password reset link is invalid or has expired. Request a new reset link.");
        } else if (message.includes("weak_password") || message.includes("Password should be at least")) {
          setError("Use at least 8 characters for your password.");
        } else if (message.includes("rate_limit") || message.includes("Too many")) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError("We couldn't update your password right now. Please try again.");
        }
        setPending(false);
        return;
      }

      setSuccess(true);
      setMessage("Your password has been updated successfully. You can now sign in with your new password.");
      
      // Sign out the recovery session and redirect to login
      await supabaseClient.auth.signOut();
      router.push("/login?notice=password-updated");
    } catch {
      setError("We couldn't update your password right now. Please try again.");
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          autoComplete="new-password"
          error={passwordMismatch ? "Your passwords do not match." : undefined}
          hint="Use at least 8 characters."
          id="password"
          label="New password"
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder="At least 8 characters"
          required
          type="password"
          value={password}
        />
        <TextField
          autoComplete="new-password"
          error={passwordMismatch ? "Your passwords do not match." : undefined}
          id="confirmPassword"
          label="Confirm new password"
          minLength={8}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          placeholder="Re-enter your password"
          required
          type="password"
          value={confirmPassword}
        />

        {error ? <Alert aria-live="assertive" role="alert">{error}</Alert> : null}
        {message && !success ? (
          <Alert aria-live="polite" role="status" tone="success">
            {message}
          </Alert>
        ) : null}

        <button
          aria-busy={pending}
          className={cn(buttonVariants({ size: "lg", variant: "primary" }), "w-full")}
          disabled={submitDisabled}
          type="submit"
        >
          {pending ? "Updating..." : success ? "Password updated" : "Update password"}
        </button>
      </form>

      <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">
        <p>
          <a
            className="font-medium text-[var(--accent)] underline underline-offset-4 transition-colors hover:text-[var(--ink)]"
            href="/login"
          >
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}