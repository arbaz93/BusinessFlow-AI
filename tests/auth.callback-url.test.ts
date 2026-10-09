import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";
import { getAuthPathForReturnTo } from "@/lib/members/invitation-tokens";

describe("getAuthCallbackUrl", () => {
  it("uses the configured canonical site origin", () => {
    assert.equal(
      getAuthCallbackUrl(new Headers({ origin: "https://preview.example.com" }), "https://app.example.com/base"),
      "https://app.example.com/auth/callback",
    );
  });

  it("uses the request origin when no canonical site URL is configured", () => {
    assert.equal(
      getAuthCallbackUrl(new Headers({ origin: "https://app.example.com" }), ""),
      "https://app.example.com/auth/callback",
    );
  });

  it("requires a configured site URL when the request has no origin", () => {
    assert.throws(
      () => getAuthCallbackUrl(new Headers(), ""),
      /NEXT_PUBLIC_SITE_URL/,
    );
  });

  it("rejects non-HTTP protocols", () => {
    assert.throws(() => getAuthCallbackUrl(new Headers(), "ftp://app.example.com"));
  });

  it("preserves a valid invitation token in the callback path", () => {
    const token = "A".repeat(43);
    assert.equal(
      getAuthCallbackUrl(new Headers(), "https://app.example.com", token),
      `https://app.example.com/auth/callback/invitations/${token}`,
    );
  });

  it("falls back to the standard callback for an invalid invitation token", () => {
    assert.equal(
      getAuthCallbackUrl(new Headers(), "https://app.example.com", "not-valid"),
      "https://app.example.com/auth/callback",
    );
  });
});

describe("getAuthPathForReturnTo", () => {
  it("keeps a valid invitation path on the login flow", () => {
    const token = "A".repeat(43);
    assert.equal(getAuthPathForReturnTo(`/invitations/${token}`, "login"), `/login/invitations/${token}`);
  });

  it("accepts a bare invitation token from a sign-out redirect", () => {
    const token = "B".repeat(43);
    assert.equal(getAuthPathForReturnTo(token, "login"), `/login/invitations/${token}`);
  });

  it("falls back to the standard auth page when there is no invitation", () => {
    assert.equal(getAuthPathForReturnTo("", "signup"), "/signup");
  });
});
