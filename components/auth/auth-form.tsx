"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";

type AuthFormProps = {
  mode: "login" | "signup";
  notice?: string;
};

const fieldClassName = "mt-2 h-11 w-full rounded-md border border-[var(--line-strong)] bg-transparent px-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";
const noticeMessages: Record<string, string> = {
  confirmation: "That confirmation link could not be used. Try signing in or request a new link.",
  setup: "Your account is confirmed, but we couldn't finish setting it up. Please sign in again.",
  signout: "We couldn't complete sign out. Please try again.",
};

export function AuthForm({ mode, notice }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(isSignup ? signup : login, {});

  return (
    <main className="auth-page flex min-h-screen items-center px-6 py-12 sm:px-10 lg:px-12">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 sm:max-lg:max-w-[640px] lg:grid-cols-2 lg:items-start lg:gap-20">
      <section className="w-full max-w-xl">
        <Link href="/" className="text-sm font-semibold uppercase text-[var(--accent)]">BusinessFlow AI</Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-7 max-w-md text-base leading-6 text-[var(--muted)]">
          {isSignup ? "Start organizing your agency with BusinessFlow AI." : "Sign in to your workspace."}
        </p>
      </section>

      <form action={action} className="w-full lg:max-w-[600px] space-y-6 lg:justify-self-end">
        {isSignup && (
          <label className="block text-[15px] font-normal text-[var(--muted)]" htmlFor="name">
            Full name
            <input className={fieldClassName} id="name" name="name" autoComplete="name" placeholder="Jane Doe" required minLength={2} />
          </label>
        )}
        <label className="block text-[15px] font-normal text-[var(--muted)]" htmlFor="email">
          Work email
          <input className={fieldClassName} id="email" name="email" type="email" autoComplete="email" placeholder="you@youragency.com" required />
        </label>
        <label className="block text-[15px] font-normal text-[var(--muted)]" htmlFor="password">
          Password
          <input className={fieldClassName} id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "At least 8 characters" : "Your password"} required minLength={isSignup ? 8 : 1} />
        </label>
        {isSignup && (
          <label className="block text-[15px] font-normal text-[var(--muted)]" htmlFor="confirmPassword">
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

        <button className="h-11 rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 max-lg:w-full" type="submit" disabled={pending}>
          {pending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
        </button>

        {!isSignup && <p className="text-sm text-[var(--muted)]">Forgot password?</p>}
        <p className="text-sm text-[var(--muted)]">
          {isSignup ? "Already have an account? " : "Don’t have an account? "}
          <Link className="text-[var(--muted)] underline underline-offset-2" href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
        {isSignup && <p className="text-sm leading-6 text-[var(--muted)]">By creating an account, you agree to our Terms and Privacy Policy.</p>}
      </form>
      </div>
    </main>
  );
}