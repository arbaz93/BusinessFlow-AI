import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrganizationRole } from "@/app/generated/prisma/enums";
import {
  evaluateDeletionEligibility,
  ACCOUNT_DELETION_CONFIRMATION_PHRASE,
} from "@/lib/organizations/deletion-eligibility";
import type { WorkspaceOwnership } from "@/lib/organizations/deletion-eligibility";

function ownership(
  overrides: Partial<WorkspaceOwnership> = {},
): WorkspaceOwnership {
  return {
    organizationId: "org_1",
    organizationName: "Acme",
    role: OrganizationRole.OWNER,
    memberCount: 1,
    ...overrides,
  };
}

describe("Account deletion eligibility", () => {
  it("is eligible when the user solely owns a single-member workspace", () => {
    const result = evaluateDeletionEligibility([ownership()]);
    assert.equal(result.eligible, true);
    if (result.eligible) {
      assert.deepEqual(result.ownedWorkspaceIds, ["org_1"]);
    }
  });

  it("is eligible when the user owns one workspace and is a member elsewhere", () => {
    const result = evaluateDeletionEligibility([
      ownership({ organizationId: "org_a", memberCount: 1, role: OrganizationRole.OWNER }),
      ownership({ organizationId: "org_b", memberCount: 5, role: OrganizationRole.MEMBER }),
    ]);
    assert.equal(result.eligible, true);
    if (result.eligible) {
      assert.deepEqual(result.ownedWorkspaceIds, ["org_a"]);
    }
  });

  it("is blocked when the user owns a workspace with other members", () => {
    const result = evaluateDeletionEligibility([
      ownership({ organizationId: "org_big", organizationName: "Big Co", memberCount: 4 }),
    ]);
    assert.equal(result.eligible, false);
    if (!result.eligible) {
      assert.equal(result.blockedWorkspace?.name, "Big Co");
      assert.equal(result.blockedWorkspace?.memberCount, 4);
      assert.match(
        result.reason,
        /workspace with other members/i,
      );
    }
  });

  it("is blocked even when the user also owns a single-member workspace elsewhere", () => {
    const result = evaluateDeletionEligibility([
      ownership({ organizationId: "org_big", organizationName: "Big Co", memberCount: 3, role: OrganizationRole.OWNER }),
      ownership({ organizationId: "org_solo", memberCount: 1, role: OrganizationRole.OWNER }),
    ]);
    assert.equal(result.eligible, false);
    if (!result.eligible) {
      assert.equal(result.blockedWorkspace?.name, "Big Co");
    }
  });

  it("is eligible (no owned workspaces) when the user is only a member, never an owner", () => {
    const result = evaluateDeletionEligibility([
      ownership({ organizationId: "org_b", memberCount: 5, role: OrganizationRole.MEMBER }),
    ]);
    assert.equal(result.eligible, true);
    if (result.eligible) {
      assert.deepEqual(result.ownedWorkspaceIds, []);
    }
  });

  it("is not blocked for member-only ownership of a shared workspace", () => {
    const result = evaluateDeletionEligibility([
      ownership({ memberCount: 4, role: OrganizationRole.MEMBER }),
    ]);
    assert.equal(result.eligible, true);
    if (result.eligible) {
      assert.deepEqual(result.ownedWorkspaceIds, []);
    }
  });
});

describe("Account deletion confirmation phrase", () => {
  it("exports the phrase the UI must require", () => {
    assert.equal(ACCOUNT_DELETION_CONFIRMATION_PHRASE, "DELETE ACCOUNT");
  });
});
