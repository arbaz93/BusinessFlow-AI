import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveSuggestedTasksInputSchema } from "@/lib/project-ai/approval-schemas";
import { identifySuggestedTasks } from "@/lib/project-ai/suggestion-identity";
import { getProjectAIOverviewData } from "@/lib/project-ai/overview";

const intelligence = {
  summary: "A project summary.",
  requirements: [],
  deliverables: [],
  risks: [],
  missingInformation: [],
  suggestedTasks: [
    { title: "Review content", description: "Review the supplied content.", priority: "MEDIUM" as const },
    { title: "Review content", description: "Review the supplied content.", priority: "MEDIUM" as const },
  ],
};

describe("AI suggestion identity", () => {
  it("produces stable unique IDs for stored suggestions, including identical suggestions", () => {
    const first = identifySuggestedTasks("analysis-1", intelligence);
    const second = identifySuggestedTasks("analysis-1", intelligence);

    assert.deepEqual(
      first.suggestedTasks.map((task) => task.suggestionId),
      second.suggestedTasks.map((task) => task.suggestionId),
    );
    assert.notEqual(first.suggestedTasks[0].suggestionId, first.suggestedTasks[1].suggestionId);
    assert.notEqual(first.suggestedTasks[0].suggestionId, identifySuggestedTasks("analysis-2", intelligence).suggestedTasks[0].suggestionId);
  });

  it("does not trust suggestion IDs provided in the stored model payload", () => {
    const identified = identifySuggestedTasks("analysis-1", {
      ...intelligence,
      suggestedTasks: [{ ...intelligence.suggestedTasks[0], suggestionId: "untrusted-id" }],
    });

    assert.notEqual(identified.suggestedTasks[0].suggestionId, "untrusted-id");
  });
});

describe("AI task approval input", () => {
  const task = {
    suggestionId: "suggestion-1",
    title: "Review content",
    description: "Review the supplied content.",
    priority: "MEDIUM",
  };

  it("accepts reviewed task drafts", () => {
    assert.equal(approveSuggestedTasksInputSchema.safeParse({
      projectId: "project-1",
      analysisId: "analysis-1",
      tasks: [task],
    }).success, true);
  });

  it("rejects duplicate suggestion IDs in a batch", () => {
    assert.equal(approveSuggestedTasksInputSchema.safeParse({
      projectId: "project-1",
      analysisId: "analysis-1",
      tasks: [task, task],
    }).success, false);
  });
});

describe("Project AI Overview summary", () => {
  it("reports persisted insight counts and excludes approved suggestions from pending", () => {
    const identified = identifySuggestedTasks("analysis-1", {
      summary: "A project summary.",
      requirements: [
        { title: "Requirement", description: "A requirement.", importance: "HIGH" },
      ],
      deliverables: [
        { title: "Deliverable", description: "A deliverable." },
        { title: "Second deliverable", description: "Another deliverable." },
      ],
      risks: [
        { title: "High risk", description: "Important risk.", severity: "HIGH" },
        { title: "Low risk", description: "Minor risk.", severity: "LOW" },
      ],
      missingInformation: [
        { question: "When?", reason: "No date was provided." },
      ],
      suggestedTasks: intelligence.suggestedTasks,
    });
    const data = getProjectAIOverviewData({
      id: "analysis-1",
      intelligence: identified,
      approvedSuggestions: [{ suggestionId: identified.suggestedTasks[0].suggestionId, taskId: "task-1" }],
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: new Date().toISOString(),
      sourceDocumentName: "Brief.pdf",
      sourceMetadata: null,
      model: "test",
      analysisVersion: 1,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });

    assert.equal(data.requirementCount, 1);
    assert.equal(data.deliverableCount, 2);
    assert.equal(data.riskCount, 2);
    assert.equal(data.highRiskCount, 1);
    assert.equal(data.missingInformationCount, 1);
    assert.equal(data.pendingSuggestionCount, 1);
    assert.deepEqual(data.summaryPreview, { text: "A project summary.", truncated: false });
  });

  it("shortens long summaries and marks the preview as incomplete", () => {
    const longSummary = `The project requires ${"careful planning and review ".repeat(20)}`;
    const identified = identifySuggestedTasks("analysis-1", {
      summary: longSummary,
      requirements: [],
      deliverables: [],
      risks: [],
      missingInformation: [],
      suggestedTasks: [],
    });
    const data = getProjectAIOverviewData({
      id: "analysis-1",
      intelligence: identified,
      approvedSuggestions: [],
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: new Date().toISOString(),
      sourceDocumentName: "Brief.pdf",
      sourceMetadata: null,
      model: "test",
      analysisVersion: 1,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });

    assert.equal(data.summaryPreview.truncated, true);
    assert.ok(data.summaryPreview.text.length <= 241);
    assert.ok(data.summaryPreview.text.endsWith("…"));
  });
});
