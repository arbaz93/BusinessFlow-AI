import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inviteMemberSchema } from "@/lib/auth/schemas";
import {
  createInvitationToken,
  getInvitationCallbackPath,
  getInvitationExpiry,
  getInvitationPath,
  hashInvitationToken,
  isInvitationExpired,
  isInvitationToken,
  normalizeEmail,
  getInvitationTokenFromReturnTo,
} from "@/lib/members/invitation-tokens";

describe("Workspace invitation tokens", () => {
  it("generates cryptographically random URL-safe tokens and stores only their hash", () => {
    const first = createInvitationToken();
    const second = createInvitationToken();

    assert.equal(isInvitationToken(first), true);
    assert.notEqual(first, second);
    assert.notEqual(hashInvitationToken(first), first);
    assert.equal(hashInvitationToken(first), hashInvitationToken(first));
    assert.equal(hashInvitationToken(first).length, 64);
  });

  it("uses path-based invitation and authentication callback URLs", () => {
    const token = createInvitationToken();
    assert.equal(getInvitationPath(token), `/invitations/${token}`);
    assert.equal(
      getInvitationCallbackPath(token),
      `/auth/callback/invitations/${token}`,
    );
    assert.equal(isInvitationToken("not-a-token"), false);
  });

  it("expires invitations after seven days", () => {
    const createdAt = new Date("2026-10-05T00:00:00.000Z");
    const expiresAt = getInvitationExpiry(createdAt, 7);
    assert.equal(expiresAt.toISOString(), "2026-10-12T00:00:00.000Z");
    assert.equal(isInvitationExpired(expiresAt, Date.parse("2026-10-12T00:00:00.000Z")), true);
    assert.equal(isInvitationExpired(expiresAt, Date.parse("2026-10-11T23:59:59.000Z")), false);
  });

  it("normalizes invite emails before storage and comparison", () => {
    const parsed = inviteMemberSchema.safeParse({ email: "  John@Example.com " });
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal(parsed.data.email, "john@example.com");
    assert.equal(normalizeEmail(" John@Example.com "), "john@example.com");
  });

  it("accepts only the exact local invitation return path", () => {
    const token = createInvitationToken();
    assert.equal(getInvitationTokenFromReturnTo(`/invitations/${token}`), token);
    assert.equal(getInvitationTokenFromReturnTo("https://example.com"), undefined);
    assert.equal(getInvitationTokenFromReturnTo(`/invitations/${token}?next=/settings`), undefined);
  });
});
