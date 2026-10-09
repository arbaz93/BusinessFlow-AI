import { getInvitationCallbackPath, isInvitationToken } from "@/lib/members/invitation-tokens";
import { getPublicEnv } from "@/lib/env";

export function getAuthCallbackUrl(
  requestHeaders: Pick<Headers, "get">,
  siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL,
  invitationToken?: string,
) {
  const origin = siteUrl || requestHeaders.get("origin");
  if (!origin) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL when the request origin is unavailable.");
  }

  const url = new URL(origin);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The application site URL must use HTTP or HTTPS.");
  }

  const callbackPath = invitationToken && isInvitationToken(invitationToken)
    ? getInvitationCallbackPath(invitationToken)
    : "/auth/callback";
  return new URL(callbackPath, url.origin).toString();
}

export function getPasswordRecoveryUrl(
  requestHeaders: Pick<Headers, "get">,
  siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL,
) {
  const origin = siteUrl || requestHeaders.get("origin");
  if (!origin) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL when the request origin is unavailable.");
  }

  const url = new URL(origin);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The application site URL must use HTTP or HTTPS.");
  }

  return new URL("/update-password", url.origin).toString();
}