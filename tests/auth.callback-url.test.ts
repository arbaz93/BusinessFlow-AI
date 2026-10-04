import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";

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
});
