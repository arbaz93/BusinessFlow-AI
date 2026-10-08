import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { forgotPasswordSchema, updatePasswordSchema } from "@/lib/auth/schemas";

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.email, "test@example.com");
  });

  it("trims whitespace from email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "  test@example.com  " });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.email, "test@example.com");
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.error.issues[0]?.message.includes("valid email"));
  });

  it("rejects invalid email format", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.error.issues[0]?.message.includes("valid email"));
  });

  it("rejects missing email", () => {
    const result = forgotPasswordSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe("updatePasswordSchema", () => {
  it("accepts matching passwords of sufficient length", () => {
    const result = updatePasswordSchema.safeParse({ password: "newpassword123", confirmPassword: "newpassword123" });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.password, "newpassword123");
      assert.equal(result.data.confirmPassword, "newpassword123");
    }
  });

  it("rejects passwords that do not match", () => {
    const result = updatePasswordSchema.safeParse({ password: "newpassword123", confirmPassword: "different123" });
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.error.issues[0]?.message.includes("match"));
  });

  it("rejects password shorter than 8 characters", () => {
    const result = updatePasswordSchema.safeParse({ password: "short", confirmPassword: "short" });
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.error.issues[0]?.message.includes("8 characters"));
  });

  it("rejects empty password", () => {
    const result = updatePasswordSchema.safeParse({ password: "", confirmPassword: "" });
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.error.issues[0]?.message.includes("8 characters"));
  });

  it("rejects missing confirmPassword", () => {
    const result = updatePasswordSchema.safeParse({ password: "newpassword123" });
    assert.equal(result.success, false);
  });
});