export function getAuthCallbackUrl(
  requestHeaders: Pick<Headers, "get">,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
) {
  const origin = siteUrl || requestHeaders.get("origin");
  if (!origin) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL when the request origin is unavailable.");
  }

  const url = new URL(origin);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The application site URL must use HTTP or HTTPS.");
  }

  return new URL("/auth/callback", url.origin).toString();
}
