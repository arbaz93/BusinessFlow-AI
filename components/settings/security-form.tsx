"use client";

import { useState, useActionState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { updateEmail, updatePassword } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";

const inputClass =
  "h-10 w-full rounded-lg border border-[#27272a] bg-[#111113] px-3.5 text-sm text-white placeholder:text-white/30 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 focus-visible:ring-2 disabled:cursor-not-allowed";

export function SecurityForm({ email }: { email: string }) {
  const [emailState, emailAction, emailPending] = useActionState(updateEmail, {});
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, {});
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const emailDisabled =
    emailPending ||
    newEmail.trim() === "" ||
    newEmail.trim().toLowerCase() === email.toLowerCase();

  const passwordDisabled =
    passwordPending ||
    !currentPassword ||
    !newPassword ||
    newPassword !== confirmPassword;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Email address</h3>
          <p className="text-sm text-[#a1a1ab]">
            Your confirmed email (<span className="text-white">{email}</span>) is your account identity.
            Changing it may require confirmation.
          </p>
        </div>

        <form action={emailAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="security-email" className="block text-sm font-medium text-[#f4f4f5]">
              New email address
            </label>
            <Input
              id="security-email"
              type="email"
              placeholder="you@example.com"
              value={newEmail}
              onChange={(event) => setNewEmail(event.currentTarget.value)}
              disabled={emailPending}
              className={inputClass}
              aria-invalid={Boolean(emailState.error)}
              aria-describedby={emailState.error ? "security-email-error" : undefined}
            />
            {emailState.error ? (
              <p id="security-email-error" className="mt-1 text-xs text-[#fca5a5]" role="alert">
                {emailState.error}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={emailDisabled}
            className="mt-4 h-10 rounded-lg bg-[#7067e8] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8178f0] disabled:cursor-not-allowed disabled:opacity-55 sm:ml-3 sm:mt-0"
          >
            {emailPending ? "Sending…" : "Update email"}
          </button>
        </form>

        {emailState.message ? (
          <p className="text-sm text-[#86efac]" role="status">
            {emailState.message}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Password</h3>
          <p className="text-sm text-[#a1a1ab]">
            You will be asked for your current password to confirm changes to it.
          </p>
        </div>

        <form action={passwordAction} className="space-y-4">
          <div>
            <label
              htmlFor="password-current"
              className="flex items-center gap-2 text-sm font-medium text-[#f4f4f5]"
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
            <label htmlFor="password-new" className="block text-sm font-medium text-[#f4f4f5]">
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
            <label htmlFor="password-confirm" className="block text-sm font-medium text-[#f4f4f5]">
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
            <p className="text-sm text-[#86efac]" role="status">
              {passwordState.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={passwordDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7067e8] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8178f0] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {passwordPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="space-y-4 border-t border-[#27272a] pt-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Sign out</h3>
          <p className="text-sm text-[#a1a1ab]">Sign out of this browser session.</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#27272a] px-4 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
