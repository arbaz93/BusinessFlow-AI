import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatProjectAIAnalysisDate } from "@/lib/project-ai/history-format";

describe("Project AI source timestamps", () => {
  it("formats source version timestamps with an explicit timezone", () => {
    assert.equal(
      formatProjectAIAnalysisDate(new Date("2026-10-04T06:00:00.000Z")),
      "October 4, 2026 at 6:00 AM UTC",
    );
  });
});
