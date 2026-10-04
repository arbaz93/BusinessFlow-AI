import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectInputSchema, projectStatusSchema, projectPrioritySchema } from "@/lib/projects/schemas";

function parse(overrides = {}) {
  return projectInputSchema.safeParse({
    name: "Website Redesign",
    clientId: "client-1",
    status: "PLANNING",
    priority: "MEDIUM",
    ...overrides,
  });
}

describe("projectInputSchema", () => {
  it("accepts a valid project with defaults for optional fields", () => {
    const result = parse();
    assert.equal(result.success, true);
    assert.equal(result.data.status, "PLANNING");
    assert.equal(result.data.priority, "MEDIUM");
    assert.equal(result.data.description, undefined);
  });

  it("trims the project name and stores the trimmed value", () => {
    const result = parse({ name: "  Website Redesign  " });
    assert.equal(result.success, true);
    assert.equal(result.data.name, "Website Redesign");
  });

  it("rejects a missing or whitespace-only name", () => {
    assert.equal(parse({ name: undefined }).success, false);
    assert.equal(parse({ name: "" }).success, false);
    assert.equal(parse({ name: "   " }).success, false);
  });

  it("rejects a name longer than 120 characters", () => {
    assert.equal(parse({ name: "a".repeat(121) }).success, false);
    assert.equal(parse({ name: "a".repeat(120) }).success, true);
  });

  it("rejects a missing client id", () => {
    assert.equal(parse({ clientId: undefined }).success, false);
    assert.equal(parse({ clientId: "   " }).success, false);
  });

  it("rejects an invalid status", () => {
    assert.equal(parse({ status: "ARCHIVED" }).success, false);
    assert.equal(parse({ status: "in_progress" }).success, false);
  });

  it("rejects an invalid priority", () => {
    assert.equal(parse({ priority: "CRITICAL" }).success, false);
  });

  it("normalizes empty optional text to undefined", () => {
    const result = parse({ description: "   ", notes: "" });
    assert.equal(result.success, true);
    assert.equal(result.data.description, undefined);
    assert.equal(result.data.notes, undefined);
  });

  it("enforces maximum lengths on description and notes", () => {
    assert.equal(parse({ description: "a".repeat(2001) }).success, false);
    assert.equal(parse({ notes: "a".repeat(5001) }).success, false);
  });

  it("rejects invalid dates", () => {
    assert.equal(parse({ startDate: "not-a-date" }).success, false);
    assert.equal(parse({ dueDate: "2026-13-45" }).success, false);
  });

  it("accepts a due date on or after the start date", () => {
    assert.equal(parse({ startDate: "2026-01-10", dueDate: "2026-01-10" }).success, true);
    assert.equal(parse({ startDate: "2026-01-10", dueDate: "2026-02-01" }).success, true);
  });

  it("rejects a due date earlier than the start date", () => {
    const result = parse({ startDate: "2026-02-01", dueDate: "2026-01-10" });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path[0] === "dueDate"));
  });

  it("allows a due date without a start date", () => {
    assert.equal(parse({ dueDate: "2026-01-10" }).success, true);
  });
});

describe("controlled enums", () => {
  it("accepts every defined project status", () => {
    for (const status of ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]) {
      assert.equal(projectStatusSchema.safeParse(status).success, true, status);
    }
  });

  it("rejects any other status string", () => {
    for (const status of ["DONE", "ARCHIVED", "planning", ""]) {
      assert.equal(projectStatusSchema.safeParse(status).success, false, status);
    }
  });

  it("accepts every defined priority and rejects the rest", () => {
    for (const priority of ["LOW", "MEDIUM", "HIGH", "URGENT"]) {
      assert.equal(projectPrioritySchema.safeParse(priority).success, true, priority);
    }
    for (const priority of ["CRITICAL", "medium", ""]) {
      assert.equal(projectPrioritySchema.safeParse(priority).success, false, priority);
    }
  });
});
