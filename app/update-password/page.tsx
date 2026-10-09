"use client";

import { useEffect, useState, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { cn } from "@/lib/utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are not configured.");
}

function getInitialError(): string | null {
  if (typeof window === "undefined") return null;
  const searchParams = new URLSearchParams(window.location.search);
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
    return "This password reset link has expired. Please request a new reset link.";
  }
  if (errorCode === "access_denied") {
    return "This password reset link is invalid. Please request a new reset link.";
  }
  return null;
}

export default function UpdatePasswordPage() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const initializedRef = useRef(false);
  const [initialError] = useState<string | null>(() => getInitialError());

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const client = createClient(
      supabaseUrl!,
      supabaseKey!,
      {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
        },
      }
    );

    setSupabase(client);

    // First, check for PKCE code in URL and exchange it
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    if (code) {
      client.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          // Session established, will be caught by onAuthStateChange or getSession
          setIsRecovering(true);
        }
      });
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
      } else if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setIsRecovering(false);
      } else if (event === "INITIAL_SESSION" && session) {
        setIsRecovering(true);
      } else if (event === "SIGNED_IN" && session) {
        // Also handle SIGNED_IN for PKCE flow
        setIsRecovering(true);
      }
    });

    client.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsRecovering(true);
      }
      setSessionChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!sessionChecked) {
    return (
      <AuthShell
        description="Please wait while we verify your recovery session."
        title="Set a new password"
      >
        <div className="flex h-20 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </AuthShell>
    );
  }

  if (!isRecovering) {
    return (
      <AuthShell
        description={initialError ?? "Your password reset session was not found. Request a new reset link below."}
        title="Set a new password"
      >
        <div className="space-y-6">
          <Alert role="alert" aria-live="assertive">
            {initialError ?? "Your password reset session is no longer valid. Request a new reset link."}
          </Alert>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:opacity-90",
                "w-full sm:w-auto"
              )}
              href="/forgot-password"
            >
              Request new reset link
            </Link>
            <Link
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--foreground)]/75 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                "w-full sm:w-auto"
              )}
              href="/login"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return <UpdatePasswordForm supabaseClient={supabase!} />;
}