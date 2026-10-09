import "server-only";

import { getPublicEnv, getServerEnv } from "@/lib/env";

export type AuthErrorCategory =
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_EXISTS"
  | "EMAIL_NOT_CONFIRMED"
  | "EXISTING_UNCONFIRMED"
  | "SIGNUP_DISABLED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "AUTH_PROVIDER_ERROR"
  | "CALLBACK_ERROR"
  | "CONFIRMATION_EXPIRED"
  | "RECOVERY_SESSION_INVALID"
  | "RECOVERY_SESSION_EXPIRED"
  | "PASSWORD_UPDATE_FAILED"
  | "PASSWORD_RESET_RATE_LIMITED"
  | "UNKNOWN";

export interface AuthError {
  category: AuthErrorCategory;
  message: string;
}

export function classifySupabaseError(
  code?: string,
  status?: number,
  message?: string,
): AuthErrorCategory {
  if (code === "user_already_exists" || message?.toLowerCase().includes("already registered") || message?.toLowerCase().includes("already been registered")) {
    return "EMAIL_ALREADY_EXISTS";
  }
  if (code === "email_exists") {
    return "EMAIL_ALREADY_EXISTS";
  }
  if (message?.toLowerCase().includes("email not confirmed")) {
    return "EMAIL_NOT_CONFIRMED";
  }
  if (code === "email_not_confirmed") {
    return "EMAIL_NOT_CONFIRMED";
  }
  if (code === "over_email_send_rate_limit" || message?.toLowerCase().includes("rate limit") || message?.toLowerCase().includes("too many requests")) {
    return "RATE_LIMITED";
  }
  if (code === "email_provider_disabled" || code === "signup_disabled") {
    return "SIGNUP_DISABLED";
  }
  if (code === "weak_password") {
    return "INVALID_INPUT";
  }
  if (code === "flow_state_not_found" || code === "refresh_token_not_found" || message?.toLowerCase().includes("invalid refresh token") || message?.toLowerCase().includes("flow state not found")) {
    return "RECOVERY_SESSION_INVALID";
  }
  if (code === "token_expired" || code === "refresh_token_expired" || message?.toLowerCase().includes("token has expired") || message?.toLowerCase().includes("refresh token expired")) {
    return "RECOVERY_SESSION_EXPIRED";
  }
  if (status && status >= 500) {
    return "AUTH_PROVIDER_ERROR";
  }
  if (status === 0 || message?.toLowerCase().includes("fetch failed") || message?.toLowerCase().includes("network")) {
    return "NETWORK_ERROR";
  }
  return "UNKNOWN";
}

export function mapAuthErrorToMessage(category: AuthErrorCategory): string {
  switch (category) {
    case "INVALID_INPUT":
      return "Please check your details and try again.";
    case "INVALID_CREDENTIALS":
      return "Email or password is incorrect.";
    case "EMAIL_ALREADY_EXISTS":
      return "An account with this email already exists. Sign in instead.";
    case "EMAIL_NOT_CONFIRMED":
      return "Your email hasn't been confirmed yet. Check your inbox or request a new confirmation email.";
    case "EXISTING_UNCONFIRMED":
      return "An account with this email already exists but hasn't been confirmed yet.";
    case "SIGNUP_DISABLED":
      return "New sign-ups are currently unavailable. Please try again later.";
    case "RATE_LIMITED":
      return "Too many attempts. Please try again later.";
    case "NETWORK_ERROR":
      return "We couldn't complete the request right now. Please try again.";
    case "AUTH_PROVIDER_ERROR":
      return "Authentication is temporarily unavailable. Please try again.";
    case "CALLBACK_ERROR":
      return "This confirmation link is invalid or has expired.";
    case "CONFIRMATION_EXPIRED":
      return "This confirmation link has expired.";
    case "RECOVERY_SESSION_INVALID":
      return "This password reset link is invalid or has expired.";
    case "RECOVERY_SESSION_EXPIRED":
      return "This password reset link has expired. Request a new one.";
    case "PASSWORD_UPDATE_FAILED":
      return "We couldn't update your password. Please try again.";
    case "PASSWORD_RESET_RATE_LIMITED":
      return "Too many reset requests. Please try again later.";
    case "UNKNOWN":
    default:
      return "We couldn't complete the request. Please try again.";
  }
}