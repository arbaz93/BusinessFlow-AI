import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import { getPublicEnv } from "@/lib/env";

const protectedRoutes = ["/dashboard", "/leads", "/clients", "/projects", "/assistant", "/settings", "/onboarding", "/no-workspace"];
const authRoutes = ["/login", "/signup", "/forgot-password"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function copySessionResponse(source: NextResponse, destination: NextResponse) {
  source.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) destination.headers.set(header, value);
  }
}

export async function proxy(request: NextRequest) {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getPublicEnv();

  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;

  if (matchesRoute(pathname, protectedRoutes) && !isAuthenticated) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    copySessionResponse(response, redirectResponse);
    return redirectResponse;
  }

  if (matchesRoute(pathname, authRoutes) && isAuthenticated) {
    let destination = "/dashboard";
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const state = await resolveApplicationEntryState(userData.user);
        if (state.kind !== "READY") destination = "/onboarding";
      }
    } catch {
      // DB query failed — fall through to default redirect to /dashboard.
      // The page-level guard (requireOrganization) will still resolve state.
    }
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
    copySessionResponse(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/assistant/:path*",
    "/settings/:path*",
    "/onboarding",
    "/no-workspace",
    "/login",
    "/login/:path*",
    "/signup",
    "/signup/:path*",
    "/forgot-password",
    "/forgot-password/:path*",
    "/update-password",
    "/update-password/:path*",
    "/auth/callback/:path*",
  ],
};