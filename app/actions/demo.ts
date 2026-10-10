"use server";

import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { isSeedEnvironmentAllowed } from "@/prisma/seed/env-guard";
import { seedDemoWorkspace, deleteDemoWorkspaceData, DEMO_USER_EMAIL } from "@/prisma/seed/factories";
import { isDemoModeEnabled, getDemoOwnerCredentials } from "@/lib/demo/config";
import { isDemoEmail } from "@/lib/demo/guard";
import {
  checkRateLimit,
  getClientIdentifier,
  DEMO_SIGNIN_RATE_LIMIT_CONFIG,
  DEMO_RESET_RATE_LIMIT_CONFIG,
} from "@/lib/security/rate-limiter";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth/dal";

export type DemoSignInResult = { success: boolean; error?: string };

export async function demoSignIn(): Promise<DemoSignInResult> {
  if (!isDemoModeEnabled()) {
    return { success: false, error: "Demo mode is not available." };
  }

  const clientIp = await getClientIdentifier();
  const rateLimit = await checkRateLimit(clientIp, DEMO_SIGNIN_RATE_LIMIT_CONFIG);
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many demo sign-in attempts. Please try again later." };
  }

  const credentials = getDemoOwnerCredentials();

  try {
    const admin = getSupabaseAdminClient();
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true,
      user_metadata: { name: credentials.name },
    });

    let authUserId: string | undefined;

    if (createData?.user?.id) {
      authUserId = createData.user.id;
    }

    if (createError && createError.code !== "user_already_exists" && createError.code !== "email_exists") {
      console.error("Demo auth user creation failed.", {
        email: credentials.email,
        code: createError.code,
        errorName: createError.name,
      });
      return {
        success: false,
        error: "We couldn't set up the demo workspace right now. Please try again.",
      };
    }

    if (!authUserId) {
      const { data: listData, error: listError } = await admin.auth.admin.listUsers();
      if (listError ?? !listData?.users) {
        console.error("Failed to list users for demo sign-in.", {
          errorName: listError instanceof Error ? listError.name : "UnknownError",
        });
        return {
          success: false,
          error: "We couldn't set up the demo workspace right now. Please try again.",
        };
      }
      const existingUser = listData.users.find((u) => u.email === credentials.email);
      if (!existingUser?.id) {
        return {
          success: false,
          error: "We couldn't set up the demo workspace right now. Please try again.",
        };
      }
      authUserId = existingUser.id;
    }

    await prisma.user.updateMany({
      where: { email: credentials.email },
      data: { authUserId },
    });

    const serverSupabase = await createClient();
    const { data, error } = await serverSupabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user) {
      console.error("Demo sign-in failed.", {
        email: credentials.email,
        errorName: error instanceof Error ? error.name : "UnknownError",
        supabaseCode: error?.code,
      });
      return {
        success: false,
        error: "We couldn't sign you into the demo workspace right now. Please try again.",
      };
    }
  } catch (error) {
    console.error("Demo sign-in flow failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false,
      error: "We couldn't sign you into the demo workspace right now. Please try again.",
    };
  }

  redirect("/dashboard");
}

export type DemoResetResult = { success: boolean; error?: string };

export async function resetDemoWorkspace(): Promise<DemoResetResult> {
  if (!isDemoModeEnabled()) {
    return { success: false, error: "Demo mode is not available." };
  }

  if (!isSeedEnvironmentAllowed()) {
    return { success: false, error: "Demo workspace reset is not available in this environment." };
  }

  const clientIp = await getClientIdentifier();
  const rateLimit = await checkRateLimit(clientIp, DEMO_RESET_RATE_LIMIT_CONFIG);
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many reset attempts. Please try again later." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) {
    return { success: false, error: "You must be signed in to reset the demo workspace." };
  }

  const demo = await isDemoEmail(data.user.email);
  if (!demo) {
    return { success: false, error: "This action is only available in the demo workspace." };
  }

  try {
    await deleteDemoWorkspaceData(prisma);
    await seedDemoWorkspace(prisma);
    await prisma.user.updateMany({
      where: { email: DEMO_USER_EMAIL },
      data: { authUserId: data.user.id },
    });

    const cookieStore = await cookies();
    cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
  } catch (error) {
    console.error("Demo workspace reset failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error ? (error as { code?: string }).code : undefined,
      meta: error instanceof Error ? (error as { meta?: unknown }).meta : undefined,
    });
    return { success: false, error: "We couldn't reset the demo workspace right now. Please try again." };
  }

  redirect("/dashboard?notice=demo-reset");
}
