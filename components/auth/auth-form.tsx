"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";

type AuthFormProps = {
  mode: "login" | "signup";
  notice?: string;
};

const fieldClassName = "mt-2 h-12 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";
const noticeMessages: Record<string, string> = {
  confirmation: "That confirmation link could not be used. Try signing in or request a new link.",
  setup: "Your account is confirmed, but we couldn't finish setting it up. Please sign in again.",
  signout: "We couldn't complete sign out. Please try again.",
};

export function AuthForm({ mode, notice }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(isSignup ? signup : login, {});

  return (
    <main className="min-h-screen bg-white px-6 py-14 sm:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-16">
      <section className="mx-auto w-full max-w-xl lg:justify-self-end">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">BusinessFlow AI</Link>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-[var(--muted)]">
          {isSignup ? "Start organizing your agency with BusinessFlow AI." : "Sign in to your workspace."}
        </p>
      </section>

      <form action={action} className="mx-auto mt-12 w-full max-w-xl space-y-5 lg:mt-0 lg:justify-self-start">
        {isSignup && (
          <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="name">
            Full name
            <input className={fieldClassName} id="name" name="name" autoComplete="name" placeholder="Jane Doe" required minLength={2} />
          </label>
        )}
        <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="email">
          Work email
          <input className={fieldClassName} id="email" name="email" type="email" autoComplete="email" placeholder="you@youragency.com" required />
        </label>
        <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="password">
          Password
          <input className={fieldClassName} id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "At least 8 characters" : "Your password"} required minLength={isSignup ? 8 : 1} />
        </label>
        {isSignup && (
          <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="confirmPassword">
            Confirm password
            <input className={fieldClassName} id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter your password" required minLength={8} />
          </label>
        )}

        {(state.error || noticeMessages[notice ?? ""]) && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {state.error ?? noticeMessages[notice ?? ""]}
          </p>
        )}
        {state.message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">{state.message}</p>}

        <button className="h-12 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 max-lg:w-full" type="submit" disabled={pending}>
          {pending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
        </button>

        <p className="text-sm text-[var(--muted)]">
          {isSignup ? "Already have an account? " : "Don’t have an account? "}
          <Link className="font-medium text-[var(--ink)] underline underline-offset-4" href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </form>
    </main>
  );
}