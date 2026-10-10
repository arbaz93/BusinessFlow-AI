import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDemoEmail, getDemoOwnerCredentials, DEMO_USER_EMAILS, DEMO_MODE_ENABLED } from "@/lib/demo/config";

describe("demo configuration", () => {
  describe("isDemoEmail", () => {
    it("identifies the demo owner email as a demo email", () => {
      assert.equal(isDemoEmail("demo-owner@example.test"), true);
    });

    it("identifies the demo member email as a demo email", () => {
      assert.equal(isDemoEmail("demo-member@example.test"), true);
    });

    it("matches demo emails case-insensitively", () => {
      assert.equal(isDemoEmail("DEMO-OWNER@EXAMPLE.TEST"), true);
      assert.equal(isDemoEmail("Demo-Owner@Example.Test"), true);
    });

    it("trims whitespace before matching", () => {
      assert.equal(isDemoEmail("  demo-owner@example.test  "), true);
    });

    it("returns false for non-demo emails", () => {
      assert.equal(isDemoEmail("user@example.com"), false);
      assert.equal(isDemoEmail("test@businessflow.ai"), false);
      assert.equal(isDemoEmail("admin@example.test"), false);
    });

    it("returns false for null and undefined", () => {
      assert.equal(isDemoEmail(null), false);
      assert.equal(isDemoEmail(undefined), false);
    });
  });

  describe("getDemoOwnerCredentials", () => {
    it("returns the demo owner credentials with all expected fields", () => {
      const credentials = getDemoOwnerCredentials();
      assert.equal(credentials.email, "demo-owner@example.test");
      assert.equal(credentials.password, "DemoPass123!");
      assert.equal(credentials.name, "Demo Owner");
      assert.equal(credentials.authUserId, "demo_owner_auth_uid");
    });

    it("returns a password meeting minimum length requirement", () => {
      const credentials = getDemoOwnerCredentials();
      assert.ok(credentials.password.length >= 8);
    });
  });

  describe("DEMO_USER_EMAILS", () => {
    it("contains exactly the two demo emails", () => {
      assert.deepEqual(DEMO_USER_EMAILS.length, 2);
      assert.ok(DEMO_USER_EMAILS.includes("demo-owner@example.test"));
      assert.ok(DEMO_USER_EMAILS.includes("demo-member@example.test"));
    });
  });

  describe("DEMO_MODE_ENABLED", () => {
    it("is a boolean value", () => {
      assert.equal(typeof DEMO_MODE_ENABLED, "boolean");
    });
  });
});
