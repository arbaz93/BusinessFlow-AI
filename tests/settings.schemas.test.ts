import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  profileUpdateSchema,
  passwordUpdateSchema,
  deleteAccountSchema,
} from "@/lib/auth/schemas";
import { ACCOUNT_DELETION_CONFIRMATION_PHRASE } from "@/lib/organizations/deletion-eligibility";

describe("Settings schemas", () => {
  describe("profileUpdateSchema", () => {
    it("accepts a valid name", () => {
      const result = profileUpdateSchema.safeParse({ name: "Ada Lovelace" });
      assert.equal(result.success, true);
    });

    it("rejects a name that is too short", () => {
      const result = profileUpdateSchema.safeParse({ name: "A" });
      assert.equal(result.success, false);
      assert.equal(
        result.error?.issues[0]?.message,
        "Enter your full name.",
      );
    });

    it("rejects a name over the max length", () => {
      const result = profileUpdateSchema.safeParse({ name: "x".repeat(101) });
      assert.equal(result.success, false);
    });

    it("trims whitespace", () => {
      const result = profileUpdateSchema.safeParse({ name: "  Ada  " });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.name, "Ada");
    });
  });

  describe("passwordUpdateSchema", () => {
    it("accepts matching passwords of sufficient length", () => {
      const result = passwordUpdateSchema.safeParse({
        currentPassword: "current-pass",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      });
      assert.equal(result.success, true);
    });

    it("requires the current password", () => {
      const result = passwordUpdateSchema.safeParse({
        currentPassword: "",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      });
      assert.equal(result.success, false);
    });

    it("rejects a new password shorter than 8 characters", () => {
      const result = passwordUpdateSchema.safeParse({
        currentPassword: "current-pass",
        newPassword: "short",
        confirmPassword: "short",
      });
      assert.equal(result.success, false);
    });

    it("rejects mismatched confirmation", () => {
      const result = passwordUpdateSchema.safeParse({
        currentPassword: "current-pass",
        newPassword: "new-password-123",
        confirmPassword: "different-password",
      });
      assert.equal(result.success, false);
      assert.equal(
        result.error?.issues[0]?.message,
        "Your passwords do not match.",
      );
    });
  });

  describe("deleteAccountSchema", () => {
    it("accepts the exact confirmation phrase (case-insensitive) and a password", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "delete account",
        password: "some-password",
      });
      assert.equal(result.success, true);
    });

    it("rejects an incorrect confirmation phrase", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "delete",
        password: "some-password",
      });
      assert.equal(result.success, false);
      assert.equal(
        result.error?.issues[0]?.message,
        "Type DELETE ACCOUNT to confirm.",
      );
    });

    it("rejects a missing password", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: ACCOUNT_DELETION_CONFIRMATION_PHRASE,
        password: "",
      });
      assert.equal(result.success, false);
    });

    it("is case-normalized and trimmed", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "  delete account  ",
        password: "some-password",
      });
      assert.equal(result.success, true);
    });
  });
});
