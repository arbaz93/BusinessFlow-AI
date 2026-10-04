import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeProjectStatuses,
  DUE_SOON_DAYS,
  getProjectTimelineState,
  isActiveProjectStatus,
  priorityRank,
  statusRank,
} from "@/lib/projects/timeline";

const now = new Date("2026-03-10T12:00:00Z");

describe("active project definition", () => {
  it("treats planning, in progress, and on hold as active", () => {
    assert.deepEqual([...activeProjectStatuses].sort(), ["IN_PROGRESS", "ON_HOLD", "PLANNING"]);
    assert.equal(isActiveProjectStatus("PLANNING"), true);
    assert.equal(isActiveProjectStatus("IN_PROGRESS"), true);
    assert.equal(isActiveProjectStatus("ON_HOLD"), true);
  });

  it("excludes completed and cancelled from active", () => {
    assert.equal(isActiveProjectStatus("COMPLETED"), false);
    assert.equal(isActiveProjectStatus("CANCELLED"), false);
  });
});

describe("getProjectTimelineState", () => {
  it("never treats a project without a due date as overdue", () => {
    assert.equal(getProjectTimelineState("IN_PROGRESS", "2026-01-01", null, now), "on_track");
    assert.equal(getProjectTimelineState("IN_PROGRESS", null, null, now), "no_schedule");
  });

  it("reports overdue only when the due date has passed", () => {
    assert.equal(getProjectTimelineState("IN_PROGRESS", null, "2026-03-01", now), "overdue");
    assert.equal(getProjectTimelineState("IN_PROGRESS", null, "2026-03-09", now), "overdue");
  });

  it("does not report completed or cancelled projects as overdue", () => {
    assert.equal(getProjectTimelineState("COMPLETED", null, "2026-01-01", now), "completed");
    assert.equal(getProjectTimelineState("CANCELLED", null, "2026-01-01", now), "cancelled");
  });

  it("reports due soon inside the due-soon window", () => {
    const soon = new Date(now.getTime() + 2 * 86_400_000).toISOString();
    const later = new Date(now.getTime() + (DUE_SOON_DAYS + 5) * 86_400_000).toISOString();
    assert.equal(getProjectTimelineState("IN_PROGRESS", null, soon, now), "due_soon");
    assert.equal(getProjectTimelineState("IN_PROGRESS", null, later, now), "on_track");
  });

  it("reports not started for a future start date", () => {
    const future = new Date(now.getTime() + 5 * 86_400_000).toISOString();
    assert.equal(getProjectTimelineState("PLANNING", future, null, now), "not_started");
  });
});

describe("sort ordering ranks", () => {
  it("orders priority from urgent to low", () => {
    assert.ok(priorityRank.URGENT < priorityRank.HIGH);
    assert.ok(priorityRank.HIGH < priorityRank.MEDIUM);
    assert.ok(priorityRank.MEDIUM < priorityRank.LOW);
  });

  it("orders status with in-progress first and cancelled last", () => {
    assert.equal(statusRank.IN_PROGRESS, 0);
    assert.equal(statusRank.CANCELLED, 4);
  });
});
