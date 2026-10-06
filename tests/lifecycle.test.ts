import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrganizationRole } from "@/app/generated/prisma/enums";
import { computeEntryState, type MembershipRow, type ApplicationInvitation } from "@/lib/auth/lifecycle-state";

function membershipRow(
  overrides: Partial<MembershipRow> = {},
): MembershipRow {
  return {
    id: "mem_1",
    userId: "user_1",
    role: OrganizationRole.OWNER,
    organizationId: "org_1",
    organization: {
      id: "org_1",
      name: "Acme",
      businessType: "SOFTWARE_DEVELOPMENT",
      slug: "acme",
    },
    ...overrides,
  };
}

function profile(overrides: { id?: string; name?: string; email?: string; avatarUrl?: string | null } = {}) {
  return {
    id: "user_1",
    name: overrides.name ?? "Jane Doe",
    email: overrides.email ?? "jane@example.com",
    avatarUrl: overrides.avatarUrl ?? null,
  };
}

function invitation(overrides: Partial<ApplicationInvitation> = {}): ApplicationInvitation {
  return {
    id: "inv_1",
    organizationId: "org_2",
    organizationName: "Beta Corp",
    email: "jane@example.com",
    expiresAt: new Date(Date.now() + 7 * 86_400_000),
    ...overrides,
  };
}

describe("computeEntryState", () => {
  it("returns NO_WORKSPACE when the user has no memberships and no invitation", () => {
    const state = computeEntryState(profile(), [], undefined, null);

    if (state.kind !== "NO_WORKSPACE") {
      throw new Error("Expected NO_WORKSPACE state");
    }
    assert.equal(state.profile.id, "user_1");
    assert.equal(state.profile.name, "Jane Doe");
  });

  it("returns INVITATION_AVAILABLE when the user has no memberships but a valid invitation exists", () => {
    const state = computeEntryState(profile(), [], undefined, invitation());

    assert.equal(state.kind, "INVITATION_AVAILABLE");
    assert.equal(state.invitation.organizationName, "Beta Corp");
    assert.equal(state.invitation.email, "jane@example.com");
  });

  it("returns READY with the cookie-selected membership when the cookie matches a membership", () => {
    const rows = [
      membershipRow({ organizationId: "org_1", organization: { id: "org_1", name: "Acme", businessType: "CREATIVE_AGENCY", slug: "acme" } }),
      membershipRow({ id: "mem_2", organizationId: "org_2", role: OrganizationRole.MEMBER, organization: { id: "org_2", name: "Beta", businessType: "MARKETING_AGENCY", slug: "beta" } }),
    ];

    const state = computeEntryState(profile(), rows, "org_2", null);

    assert.equal(state.kind, "READY");
    assert.equal(state.organization.id, "org_2");
    assert.equal(state.organization.name, "Beta");
    assert.equal(state.organizationId, "org_2");
    assert.equal(state.membership.role, OrganizationRole.MEMBER);
    assert.equal(state.memberships.length, 2);
  });

  it("falls back to the first membership when the cookie does not match", () => {
    const rows = [
      membershipRow({ organizationId: "org_1", organization: { id: "org_1", name: "Acme", businessType: "SOFTWARE_DEVELOPMENT", slug: "acme" } }),
      membershipRow({ id: "mem_2", organizationId: "org_2", role: OrganizationRole.MEMBER, organization: { id: "org_2", name: "Beta", businessType: "MARKETING_AGENCY", slug: "beta" } }),
    ];

    const state = computeEntryState(profile(), rows, "stale_org_id" as string, null);

    assert.equal(state.kind, "READY");
    assert.equal(state.organization.id, "org_1");
    assert.equal(state.membership.role, OrganizationRole.OWNER);
  });

  it("falls back to the first membership when the cookie is undefined", () => {
    const rows = [
      membershipRow({ organizationId: "org_1", organization: { id: "org_1", name: "Acme", businessType: "SOFTWARE_DEVELOPMENT", slug: "acme" } }),
    ];

    const state = computeEntryState(profile(), rows, undefined, null);

    assert.equal(state.kind, "READY");
    assert.equal(state.organization.id, "org_1");
  });

  it("includes role labels for each workspace in the READY state", () => {
    const rows = [
      membershipRow({ organizationId: "org_1", role: OrganizationRole.OWNER, organization: { id: "org_1", name: "Acme", businessType: "CONSULTING", slug: "acme" } }),
      membershipRow({ id: "mem_2", organizationId: "org_2", role: OrganizationRole.MEMBER, organization: { id: "org_2", name: "Beta", businessType: "MARKETING_AGENCY", slug: "beta" } }),
    ];

    const state = computeEntryState(profile(), rows, "org_1", null);

    assert.equal(state.kind, "READY");
    assert.equal(state.memberships[0].role, OrganizationRole.OWNER);
    assert.equal(state.memberships[1].role, OrganizationRole.MEMBER);
  });

  it("returns READY even when a valid invitation exists but the user already has a membership", () => {
    const rows = [
      membershipRow({ organizationId: "org_1", organization: { id: "org_1", name: "Acme", businessType: "SOFTWARE_DEVELOPMENT", slug: "acme" } }),
    ];

    const state = computeEntryState(profile(), rows, undefined, invitation());

    assert.equal(state.kind, "READY");
    assert.equal(state.organization.id, "org_1");
  });
});

describe("workspace schema max length", () => {
  it("enforces a 100-character maximum for workspace names", async () => {
    const { workspaceSchema } = await import("@/lib/auth/schemas");
    const name = "a".repeat(100);
    const valid = workspaceSchema.safeParse({ name, businessType: "OTHER" });
    assert.equal(valid.success, true);

    const tooLong = workspaceSchema.safeParse({ name: "a".repeat(101), businessType: "OTHER" });
    assert.equal(tooLong.success, false);
  });
});
