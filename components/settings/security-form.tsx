"use client";

import { useState, useActionState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { updatePassword } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 focus-visible:ring-2 disabled:cursor-not-allowed";

export function SecurityForm() {
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, {});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordDisabled =
    passwordPending ||
    !currentPassword ||
    !newPassword ||
    newPassword !== confirmPassword;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Password</h3>
          <p className="text-sm text-[#a1a1ab]">
            You will be asked for your current password to confirm changes to it.
          </p>
        </div>

        <form action={passwordAction} className="space-y-4">
          <div>
            <label
              htmlFor="password-current"
              className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"
            >
              <KeyRound size={15} aria-hidden="true" />
              Current password
            </label>
            <Input
              id="password-current"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="Your current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.currentTarget.value)}
              disabled={passwordPending}
              className={inputClass}
              aria-describedby={passwordState.error ? "password-error" : undefined}
            />
          </div>

          <div>
            <label htmlFor="password-new" className="block text-sm font-medium text-[var(--foreground)]">
              New password
            </label>
            <Input
              id="password-new"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
              disabled={passwordPending}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-[var(--foreground)]">
              Confirm new password
            </label>
            <Input
              id="password-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
              disabled={passwordPending}
              className={inputClass}
            />
          </div>

          {passwordState.error ? (
            <p id="password-error" className="text-xs text-[#fca5a5]" role="alert">
              {passwordState.error}
            </p>
          ) : null}

          {passwordState.message ? (
            <p className="text-sm text-[var(--success-line)]" role="status">
              {passwordState.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={passwordDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {passwordPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="space-y-4 border-t border-[var(--line)] pt-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Sign out</h3>
          <p className="text-sm text-[#a1a1ab]">Sign out of this browser session.</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--foreground)]/75 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
