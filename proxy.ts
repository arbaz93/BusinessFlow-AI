import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/leads", "/clients", "/projects", "/assistant", "/settings", "/onboarding"];
const authRoutes = ["/login", "/signup"];

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
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
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
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
    "/login",
    "/signup",
    "/auth/callback",
  ],
};