import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getProjectAIAnalysisSourceAssessment,
  getProjectAIAnalysisSourceState,
  isCurrentProjectAIAnalysis,
  preferCurrentSourceProjectAIAnalysis,
  shouldRetryProjectAIAnalysis,
} from "@/lib/project-ai/currentness";

const timestamp = new Date("2026-10-04T06:00:00.000Z");

describe("project AI analysis source currentness", () => {
  it("marks only the latest completed analysis with a current source as current", () => {
    assert.equal(isCurrentProjectAIAnalysis({
      analysisId: "analysis-current",
      currentAnalysisId: "analysis-current",
      sourceState: "CURRENT",
    }), true);
    assert.equal(isCurrentProjectAIAnalysis({
      analysisId: "analysis-older",
      currentAnalysisId: "analysis-current",
      sourceState: "CURRENT",
    }), false);
    assert.equal(isCurrentProjectAIAnalysis({
      analysisId: "analysis-current",
      currentAnalysisId: "analysis-current",
      sourceState: "STALE",
    }), false);
  });

  it("treats a matching primary document and version as current", () => {
    assert.equal(getProjectAIAnalysisSourceState({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: true,
      currentPrimaryDocumentId: "brief-1",
      currentPrimaryDocumentUpdatedAt: new Date(timestamp),
    }), "CURRENT");
  });

  it("treats a replacement primary document as stale", () => {
    assert.equal(getProjectAIAnalysisSourceState({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: true,
      currentPrimaryDocumentId: "brief-2",
      currentPrimaryDocumentUpdatedAt: timestamp,
    }), "STALE");
  });

  it("treats a changed document version as stale", () => {
    assert.equal(getProjectAIAnalysisSourceState({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: true,
      currentPrimaryDocumentId: "brief-1",
      currentPrimaryDocumentUpdatedAt: new Date(timestamp.getTime() + 1000),
    }), "STALE");
  });

  it("treats a removed primary designation as stale while retaining the source", () => {
    assert.equal(getProjectAIAnalysisSourceState({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: true,
      currentPrimaryDocumentId: null,
      currentPrimaryDocumentUpdatedAt: null,
    }), "STALE");
  });

  it("marks deleted source documents unavailable", () => {
    assert.equal(getProjectAIAnalysisSourceState({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: false,
      currentPrimaryDocumentId: null,
      currentPrimaryDocumentUpdatedAt: null,
    }), "SOURCE_MISSING");
  });

  it("explains why a saved analysis is no longer current", () => {
    const primaryChanged = getProjectAIAnalysisSourceAssessment({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: true,
      currentPrimaryDocumentId: "brief-2",
      currentPrimaryDocumentUpdatedAt: timestamp,
    });
    assert.deepEqual(primaryChanged, { state: "STALE", staleReason: "PRIMARY_BRIEF_CHANGED" });

    const sourceUpdated = getProjectAIAnalysisSourceAssessment({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: true,
      currentPrimaryDocumentId: "brief-1",
      currentPrimaryDocumentUpdatedAt: new Date(timestamp.getTime() + 1000),
    });
    assert.deepEqual(sourceUpdated, { state: "STALE", staleReason: "SOURCE_UPDATED" });

    const primaryUnselected = getProjectAIAnalysisSourceAssessment({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: true,
      currentPrimaryDocumentId: null,
      currentPrimaryDocumentUpdatedAt: null,
    });
    assert.deepEqual(primaryUnselected, { state: "STALE", staleReason: "NO_PRIMARY_BRIEF" });

    const sourceDeleted = getProjectAIAnalysisSourceAssessment({
      sourceDocumentId: "brief-1",
      sourceDocumentUpdatedAt: timestamp,
      sourceDocumentExists: false,
      currentPrimaryDocumentId: "brief-2",
      currentPrimaryDocumentUpdatedAt: timestamp,
    });
    assert.deepEqual(sourceDeleted, { state: "SOURCE_MISSING", staleReason: "SOURCE_MISSING" });
  });

  it("allows retries after a failed attempt but prevents duplicate current analyses", () => {
    assert.equal(shouldRetryProjectAIAnalysis({
      latestCompletedAttemptAt: timestamp,
      latestFailureAt: null,
    }), false);
    assert.equal(shouldRetryProjectAIAnalysis({
      latestCompletedAttemptAt: timestamp,
      latestFailureAt: new Date(timestamp.getTime() - 1000),
    }), false);
    assert.equal(shouldRetryProjectAIAnalysis({
      latestCompletedAttemptAt: timestamp,
      latestFailureAt: new Date(timestamp.getTime() + 1000),
    }), true);
    assert.equal(shouldRetryProjectAIAnalysis({
      latestCompletedAttemptAt: null,
      latestFailureAt: timestamp,
    }), true);
  });

  it("prefers a completed result for the current source over a newer stale-source result", () => {
    const currentSourceResult = { id: "brief-c-analysis", sourceDocumentId: "brief-c" };
    const newerStaleResult = { id: "brief-b-analysis", sourceDocumentId: "brief-b" };
    assert.equal(
      preferCurrentSourceProjectAIAnalysis(currentSourceResult, newerStaleResult),
      currentSourceResult,
    );
    assert.equal(
      preferCurrentSourceProjectAIAnalysis(null, newerStaleResult),
      newerStaleResult,
    );
  });
});
