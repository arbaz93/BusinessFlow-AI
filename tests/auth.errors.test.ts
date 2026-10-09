import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifySupabaseError,
  mapAuthErrorToMessage,
  type AuthErrorCategory,
} from "@/lib/auth/errors";

describe("classifySupabaseError", () => {
  const cases: { label: string; code?: string; status?: number; message?: string; expected: AuthErrorCategory }[] = [
    { label: "user_already_exists code", code: "user_already_exists", expected: "EMAIL_ALREADY_EXISTS" },
    { label: "email_exists code", code: "email_exists", expected: "EMAIL_ALREADY_EXISTS" },
    { label: "already registered message", message: "User already registered", expected: "EMAIL_ALREADY_EXISTS" },
    { label: "already been registered message", message: "The email has already been registered", expected: "EMAIL_ALREADY_EXISTS" },
    { label: "email_not_confirmed code", code: "email_not_confirmed", expected: "EMAIL_NOT_CONFIRMED" },
    { label: "email not confirmed message", message: "Email not confirmed", expected: "EMAIL_NOT_CONFIRMED" },
    { label: "rate limit code", code: "over_email_send_rate_limit", expected: "RATE_LIMITED" },
    { label: "rate limit message", message: "Too many requests", expected: "RATE_LIMITED" },
    { label: "email_provider_disabled code", code: "email_provider_disabled", expected: "SIGNUP_DISABLED" },
    { label: "signup_disabled code", code: "signup_disabled", expected: "SIGNUP_DISABLED" },
    { label: "weak_password code", code: "weak_password", expected: "INVALID_INPUT" },
    { label: "server error status", status: 500, message: "Internal server error", expected: "AUTH_PROVIDER_ERROR" },
    { label: "network error status 0", status: 0, message: "fetch failed", expected: "NETWORK_ERROR" },
    { label: "unknown error", message: "Something went wrong", expected: "UNKNOWN" },
    { label: "no error info", expected: "UNKNOWN" },
  ];

  for (const c of cases) {
    it(c.label, () => {
      assert.equal(classifySupabaseError(c.code, c.status, c.message), c.expected);
    });
  }
});

describe("mapAuthErrorToMessage", () => {
  const categories: AuthErrorCategory[] = [
    "INVALID_INPUT",
    "INVALID_CREDENTIALS",
    "EMAIL_ALREADY_EXISTS",
    "EMAIL_NOT_CONFIRMED",
    "EXISTING_UNCONFIRMED",
    "SIGNUP_DISABLED",
    "RATE_LIMITED",
    "NETWORK_ERROR",
    "AUTH_PROVIDER_ERROR",
    "CALLBACK_ERROR",
    "CONFIRMATION_EXPIRED",
    "UNKNOWN",
  ];

  it("returns a non-empty string for every category", () => {
    for (const category of categories) {
      const message = mapAuthErrorToMessage(category);
      assert.equal(typeof message, "string");
      assert.ok(message.length > 0, `Empty message for ${category}`);
    }
  });

  it("does not leak raw Supabase error text for EMAIL_ALREADY_EXISTS", () => {
    const message = mapAuthErrorToMessage("EMAIL_ALREADY_EXISTS");
    assert.equal(message, "An account with this email already exists. Sign in instead.");
    assert.equal(message.includes("Supabase"), false);
  });
});
