import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifySupabaseError,
  mapAuthErrorToMessage,
  type AuthErrorCategory,
} from "@/lib/auth/errors";

describe("classifySupabaseError - password recovery", () => {
  const cases: { label: string; code?: string; status?: number; message?: string; expected: AuthErrorCategory }[] = [
    { label: "flow_state_not_found code", code: "flow_state_not_found", expected: "RECOVERY_SESSION_INVALID" },
    { label: "refresh_token_not_found code", code: "refresh_token_not_found", expected: "RECOVERY_SESSION_INVALID" },
    { label: "invalid refresh token message", message: "Invalid refresh token", expected: "RECOVERY_SESSION_INVALID" },
    { label: "flow state not found message", message: "Flow state not found", expected: "RECOVERY_SESSION_INVALID" },
    { label: "token_expired code", code: "token_expired", expected: "RECOVERY_SESSION_EXPIRED" },
    { label: "refresh_token_expired code", code: "refresh_token_expired", expected: "RECOVERY_SESSION_EXPIRED" },
    { label: "token has expired message", message: "Token has expired", expected: "RECOVERY_SESSION_EXPIRED" },
    { label: "refresh token expired message", message: "Refresh token expired", expected: "RECOVERY_SESSION_EXPIRED" },
  ];

  for (const c of cases) {
    it(c.label, () => {
      assert.equal(classifySupabaseError(c.code, c.status, c.message), c.expected);
    });
  }
});

describe("mapAuthErrorToMessage - password recovery", () => {
  const recoveryCategories: AuthErrorCategory[] = [
    "RECOVERY_SESSION_INVALID",
    "RECOVERY_SESSION_EXPIRED",
    "PASSWORD_UPDATE_FAILED",
    "PASSWORD_RESET_RATE_LIMITED",
  ];

  it("returns a non-empty string for every recovery category", () => {
    for (const category of recoveryCategories) {
      const message = mapAuthErrorToMessage(category);
      assert.equal(typeof message, "string");
      assert.ok(message.length > 0, `Empty message for ${category}`);
    }
  });

  it("maps RECOVERY_SESSION_INVALID to user-friendly message", () => {
    assert.equal(
      mapAuthErrorToMessage("RECOVERY_SESSION_INVALID"),
      "This password reset link is invalid or has expired."
    );
  });

  it("maps RECOVERY_SESSION_EXPIRED to user-friendly message", () => {
    assert.equal(
      mapAuthErrorToMessage("RECOVERY_SESSION_EXPIRED"),
      "This password reset link has expired. Request a new one."
    );
  });

  it("maps PASSWORD_UPDATE_FAILED to user-friendly message", () => {
    assert.equal(
      mapAuthErrorToMessage("PASSWORD_UPDATE_FAILED"),
      "We couldn't update your password. Please try again."
    );
  });

  it("maps PASSWORD_RESET_RATE_LIMITED to user-friendly message", () => {
    assert.equal(
      mapAuthErrorToMessage("PASSWORD_RESET_RATE_LIMITED"),
      "Too many reset requests. Please try again later."
    );
  });
});