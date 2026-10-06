import { createHash, randomBytes } from "node:crypto";

export const DEFAULT_INVITATION_EXPIRY_DAYS = 7;

function configuredExpiryDays() {
  const configuredValue = process.env.WORKSPACE_INVITATION_EXPIRY_DAYS;
  if (!configuredValue) return DEFAULT_INVITATION_EXPIRY_DAYS;

  const days = Number(configuredValue);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error("WORKSPACE_INVITATION_EXPIRY_DAYS must be an integer from 1 to 90.");
  }
  return days;
}

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getInvitationExpiry(now = new Date(), days = configuredExpiryDays()) {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export function isInvitationExpired(expiresAt: Date | null, now = Date.now()) {
  return !expiresAt || expiresAt.getTime() <= now;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isInvitationToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function getInvitationPath(token: string) {
  return `/invitations/${token}`;
}

export function getInvitationCallbackPath(token: string) {
  return `/auth/callback/invitations/${token}`;
}

export function getInvitationTokenFromReturnTo(returnTo: string | null | undefined) {
  const match = returnTo?.match(/^\/invitations\/([A-Za-z0-9_-]{43})$/);
  return match?.[1] ?? (typeof returnTo === "string" && /^[A-Za-z0-9_-]{43}$/.test(returnTo) ? returnTo : undefined);
}

export function getAuthPathForReturnTo(returnTo: string | null | undefined, mode: "login" | "signup") {
  const token = getInvitationTokenFromReturnTo(returnTo);
  return token ? `/${mode}/invitations/${token}` : `/${mode}`;
}
