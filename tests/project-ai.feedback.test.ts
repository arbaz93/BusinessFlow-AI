import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { identifyProjectAIAnalysisFeedbackTargets, isValidProjectAIAnalysisFeedbackTarget } from "@/lib/project-ai/feedback-identities";
import { ANALYSIS_FEEDBACK_TARGET_ID } from "@/lib/project-ai/feedback-types";
import { submitAIAnalysisFeedbackSchema } from "@/lib/project-ai/feedback-schemas";

const intelligence = {
  summary: "A project summary.",
  requirements: [
    { title: "Mobile checkout", description: "Support mobile checkout.", importance: "HIGH" as const },
    { title: "Account portal", description: "Provide a customer portal.", importance: "MEDIUM" as const },
    { title: "Mobile checkout", description: "Support mobile checkout.", importance: "HIGH" as const },
  ],
  deliverables: [{ title: "Website", description: "A responsive site." }],
  risks: [{ title: "Content delay", description: "Content is not final.", severity: "MEDIUM" as const }],
  missingInformation: [{ question: "What is the launch date?", reason: "No date was specified." }],
  suggestedTasks: [{ title: "Test checkout", description: "Test the purchase flow.", priority: "HIGH" as const }],
};

describe("AI analysis feedback target identity", () => {
  it("produces deterministic item IDs that belong to a single analysis", () => {
    const taskIds = ["task-a"];
    const first = identifyProjectAIAnalysisFeedbackTargets("analysis-a", intelligence, taskIds);
    const repeated = identifyProjectAIAnalysisFeedbackTargets("analysis-a", intelligence, taskIds);
    const otherAnalysis = identifyProjectAIAnalysisFeedbackTargets("analysis-b", intelligence, taskIds);

    assert.deepEqual(first, repeated);
    assert.notEqual(first.requirements[0], first.requirements[2]);
    assert.notEqual(first.requirements[0], otherAnalysis.requirements[0]);
    assert.equal(
      isValidProjectAIAnalysisFeedbackTarget("analysis-a", intelligence, "REQUIREMENT", first.requirements[0], taskIds),
      true,
    );
    assert.equal(
      isValidProjectAIAnalysisFeedbackTarget("analysis-b", intelligence, "REQUIREMENT", first.requirements[0], taskIds),
      false,
    );
    assert.equal(
      isValidProjectAIAnalysisFeedbackTarget("analysis-a", intelligence, "ANALYSIS", ANALYSIS_FEEDBACK_TARGET_ID, taskIds),
      true,
    );
    assert.equal(
      isValidProjectAIAnalysisFeedbackTarget("analysis-a", intelligence, "SUGGESTED_TASK", first.suggestedTasks[0], taskIds),
      true,
    );
  });

  it("rejects a target ID from another item category", () => {
    const targets = identifyProjectAIAnalysisFeedbackTargets("analysis-a", intelligence, ["task-a"]);
    assert.equal(
      isValidProjectAIAnalysisFeedbackTarget("analysis-a", intelligence, "RISK", targets.requirements[0], ["task-a"]),
      false,
    );
  });
});

describe("AI analysis feedback input", () => {
  const base = {
    projectId: "project-a",
    analysisId: "analysis-a",
    targetType: "ANALYSIS",
    targetId: ANALYSIS_FEEDBACK_TARGET_ID,
    feedbackType: "INCORRECT",
  };

  it("accepts analysis and item feedback with or without a comment", () => {
    assert.equal(submitAIAnalysisFeedbackSchema.safeParse(base).success, true);
    assert.equal(submitAIAnalysisFeedbackSchema.safeParse({
      ...base,
      targetType: "REQUIREMENT",
      targetId: "requirement-hash",
      feedbackType: "MISSING_INFORMATION",
      comment: "  Add the checkout requirement.  ",
    }).data?.comment, "Add the checkout requirement.");
    assert.equal(submitAIAnalysisFeedbackSchema.safeParse({
      ...base,
      feedbackType: "OTHER",
      comment: "Please review the context.",
    }).success, true);
  });

  it("rejects invalid categories, oversized comments, whitespace-only comments, and unexplained Other feedback", () => {
    assert.equal(submitAIAnalysisFeedbackSchema.safeParse({ ...base, feedbackType: "FAKE" }).success, false);
    assert.equal(submitAIAnalysisFeedbackSchema.safeParse({ ...base, comment: "x".repeat(1001) }).success, false);
    assert.equal(submitAIAnalysisFeedbackSchema.safeParse({ ...base, comment: "   " }).success, false);
    assert.equal(submitAIAnalysisFeedbackSchema.safeParse({ ...base, feedbackType: "OTHER" }).success, false);
  });
});
