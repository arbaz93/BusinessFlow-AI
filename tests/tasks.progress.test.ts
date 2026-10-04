import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTaskProgress } from "@/lib/tasks/progress";
import { getTaskDateWindow, getTaskTimelineState } from "@/lib/tasks/timeline";

describe("getTaskProgress", () => {
  it("excludes cancelled tasks from the total", () => {
    assert.deepEqual(
      getTaskProgress({ TODO: 2, IN_PROGRESS: 1, COMPLETED: 1, CANCELLED: 3 }),
      { total: 4, completed: 1, percentage: 25 },
    );
  });

  it("does not imply completion when there are no eligible tasks", () => {
    assert.deepEqual(getTaskProgress({ CANCELLED: 2 }), {
      total: 0,
      completed: 0,
      percentage: null,
    });
  });

  it("returns complete progress when all eligible tasks are completed", () => {
    assert.deepEqual(getTaskProgress({ COMPLETED: 3, CANCELLED: 1 }), {
      total: 3,
      completed: 3,
      percentage: 100,
    });
  });
});

describe("task due-date window", () => {
  const now = new Date("2026-10-02T17:00:00.000Z");

  it("treats a due date today as due soon, not overdue", () => {
    const { overdueBefore, upcomingFrom, upcomingThrough } = getTaskDateWindow(now);
    const today = new Date("2026-10-02T00:00:00.000Z");

    assert.equal(today < overdueBefore, false);
    assert.equal(today >= upcomingFrom && today <= upcomingThrough, true);
    assert.equal(getTaskTimelineState("TODO", today, now), "due_soon");
  });

  it("marks only dates before today as overdue", () => {
    assert.equal(getTaskTimelineState("TODO", "2026-10-01", now), "overdue");
    assert.equal(getTaskTimelineState("COMPLETED", "2026-10-01", now), "completed");
    assert.equal(getTaskTimelineState("CANCELLED", "2026-10-01", now), "cancelled");
  });
});
