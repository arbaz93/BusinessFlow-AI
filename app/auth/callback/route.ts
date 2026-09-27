import { NextResponse } from "next/server";
import { getOrganizationContext } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) return NextResponse.redirect(new URL("/login?notice=confirmation", origin));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?notice=confirmation", origin));

  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", origin));

  try {
    const context = await getOrganizationContext(data.user);
    return NextResponse.redirect(new URL(context.membership ? "/dashboard" : "/onboarding", origin));
  } catch {
    return NextResponse.redirect(new URL("/login?notice=setup", origin));
  }
}