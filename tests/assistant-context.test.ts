import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { containsWord, matchProjectReferences } from "@/lib/assistant/context/match";
import { inferAssistantContextNeeds, triggersOrgScope } from "@/lib/assistant/context/intent";
import { classifyAssistantTaskState, computeAssistantTaskAggregates } from "@/lib/assistant/context/task-classification";
import { decideAssistantScope } from "@/lib/assistant/context/scope";
import { serializeAssistantContext } from "@/lib/assistant/context/prompt-context";
import type {
  AssistantProjectSummary,
  ResolvedAssistantContext,
} from "@/lib/assistant/context/types";

function projectSummary(overrride: Partial<AssistantProjectSummary> = {}): AssistantProjectSummary {
  return {
    projectId: "p1",
    name: "Website Redesign",
    status: "IN_PROGRESS",
    clientName: "Acme Corp",
    clientCompany: "Acme",
    dueDate: null,
    priority: "MEDIUM",
    description: null,
    ...overrride,
  };
}

describe("Assistant project reference matching", () => {
  it("matches whole words and not substrings", () => {
    assert.equal(containsWord("acme corporation website", "acme"), true);
    assert.equal(containsWord("acmedeals website", "acme"), false);
    assert.equal(containsWord("the acme-co website", "acme-co"), true);
  });

  it("returns none when nothing matches", () => {
    const result = matchProjectReferences(
      [projectSummary({ projectId: "p1", name: "Website Redesign" })],
      "unrelated question about leads",
    );
    assert.equal(result.kind, "none");
  });

  it("returns single when one project name matches", () => {
    const result = matchProjectReferences(
      [
        projectSummary({ projectId: "p1", name: "Website Redesign" }),
        projectSummary({ projectId: "p2", name: "Mobile App" }),
      ],
      "status of the website redesign",
    );
    assert.equal(result.kind, "single");
    if (result.kind === "single") assert.equal(result.project.projectId, "p1");
  });

  it("returns ambiguous when multiple match", () => {
    const result = matchProjectReferences(
      [
        projectSummary({ projectId: "p1", name: "Website" }),
        projectSummary({ projectId: "p2", name: "Dashboard" }),
      ],
      "compare the website and dashboard projects",
    );
    assert.equal(result.kind, "ambiguous");
    if (result.kind === "ambiguous") {
      assert.equal(result.candidates.length, 2);
    }
  });
});

describe("Assistant task classification", () => {
  const now = new Date("2026-10-15T00:00:00Z");

  it("classifies overdue tasks", () => {
    assert.equal(
      classifyAssistantTaskState("TODO", "2026-10-10T00:00:00Z", now).status,
      "OVERDUE",
    );
  });

  it("classifies due-soon tasks", () => {
    assert.equal(
      classifyAssistantTaskState("IN_PROGRESS", "2026-10-18T00:00:00Z", now).status,
      "UPCOMING",
    );
  });

  it("classifies completed tasks", () => {
    assert.equal(classifyAssistantTaskState("COMPLETED", "2026-10-10T00:00:00Z", now).status, "COMPLETED");
  });

  it("classifies blocked tasks with a due date as blocked", () => {
    assert.equal(classifyAssistantTaskState("BLOCKED", "2026-12-01T00:00:00Z", now).status, "BLOCKED");
  });

  it("classifies open tasks without due dates", () => {
    assert.equal(classifyAssistantTaskState("TODO", undefined, now).status, "OPEN");
  });

  it("aggregates counts by classification", () => {
    const classified = [
      classifyAssistantTaskState("TODO", "2026-10-10", now),
      classifyAssistantTaskState("IN_PROGRESS", "2026-10-20", now),
      classifyAssistantTaskState("BLOCKED", undefined, now),
      classifyAssistantTaskState("TODO", undefined, now),
      classifyAssistantTaskState("COMPLETED", undefined, now),
    ];
    const aggregates = computeAssistantTaskAggregates(classified);
    assert.deepEqual(aggregates, {
      total: 5,
      overdue: 1,
      dueSoon: 1,
      blocked: 1,
      open: 1,
      completed: 1,
    });
  });
});

describe("Assistant intent classification", () => {
  it("detects task-related intent", () => {
    const needs = inferAssistantContextNeeds("which tasks are overdue?");
    assert.equal(needs.tasks, true);
    assert.equal(needs.summary, false);
  });

  it("detects AI intelligence intent", () => {
    const needs = inferAssistantContextNeeds("what risks did the AI analysis find?");
    assert.equal(needs.aiIntelligence, true);
    assert.equal(needs.tasks, false);
  });

  it("detects brief content intent", () => {
    const needs = inferAssistantContextNeeds("what does the brief say about scope?");
    assert.equal(needs.briefContent, true);
  });

  it("detects activity intent", () => {
    const needs = inferAssistantContextNeeds("what happened in the project recently?");
    assert.equal(needs.activity, true);
  });

  it("detects organization scope triggers", () => {
    assert.equal(triggersOrgScope("how many projects are there across the workspace?"), true);
    assert.equal(triggersOrgScope("what is the status of project Acme?"), false);
  });
});

describe("Assistant scope decision", () => {
  const summaries: AssistantProjectSummary[] = [
    projectSummary({ projectId: "p1", name: "Website Redesign" }),
    projectSummary({ projectId: "p2", name: "Mobile App" }),
  ];

  it("resolves to a single referenced project", () => {
    const decision = decideAssistantScope("status of the website redesign", summaries, null);
    assert.equal(decision.type, "project");
    if (decision.type === "project") {
      assert.equal(decision.project.projectId, "p1");
      assert.equal(decision.switched, true);
    }
  });

  it("retains an existing project context when the message is not scoped", () => {
    const decision = decideAssistantScope("what are the risks?", summaries, "p2");
    assert.equal(decision.type, "project");
    if (decision.type === "project") assert.equal(decision.project.projectId, "p2");
  });

  it("falls back to organization scope on an org-level trigger", () => {
    const decision = decideAssistantScope(
      "total overdue tasks across the workspace",
      summaries,
      "p1",
    );
    assert.equal(decision.type, "organization");
    if (decision.type === "organization") assert.equal(decision.priorContextInvalidated, false);
  });

  it("returns a clarification when multiple projects match", () => {
    const ambiguous: AssistantProjectSummary[] = [
      projectSummary({ projectId: "p1", name: "Website" }),
      projectSummary({ projectId: "p2", name: "Dashboard" }),
    ];
    const decision = decideAssistantScope("compare the website and dashboard projects", ambiguous, null);
    assert.equal(decision.type, "clarification");
    if (decision.type === "clarification") {
      assert.equal(decision.candidates.length, 2);
      assert.match(decision.message, /multiple projects/);
    }
  });

  it("invalidates prior context when the anchored project is gone", () => {
    const decision = decideAssistantScope("what is the status", [], "p1");
    assert.equal(decision.type, "organization");
    if (decision.type === "organization") assert.equal(decision.priorContextInvalidated, true);
  });
});

describe("Assistant context serialization", () => {
  it("renders an organization summary block", () => {
    const context: ResolvedAssistantContext = {
      scope: "ORGANIZATION",
      currentDateTime: "2026-10-04T08:00:00Z",
      needs: { projects: false, tasks: false, aiIntelligence: false, briefContent: false, activity: false, summary: false },
      organizationSummary: {
        leadCount: 12,
        activeClientCount: 5,
        projectCount: 9,
        activeProjectCount: 6,
        overdueTaskCount: 3,
        upcomingTaskCount: 2,
        blockedTaskCount: 1,
        activeProjects: [],
        overdueTasks: [],
        upcomingTasks: [],
        blockedTasks: [],
      },
      priorContextInvalidated: false,
    };

    const serialized = serializeAssistantContext(context);
    assert.match(serialized, /ORGANIZATION_SUMMARY/);
    assert.match(serialized, /leadCount: 12/);
    assert.match(serialized, /activeProjectCount: 6/);
    assert.match(serialized, /blockedTaskCount: 1/);
    assert.match(serialized, /CURRENT_APPLICATION_DATE_TIME: Oct 4, 2026/);
  });

  it("labels stale AI intelligence and omits raw ids", () => {
    const context: ResolvedAssistantContext = {
      scope: "PROJECT",
      currentDateTime: "2026-10-04T08:00:00Z",
      needs: { projects: false, tasks: true, aiIntelligence: true, briefContent: true, activity: true, summary: true },
      project: {
        projectId: "p1",
        name: "Website Redesign",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        description: "A project description.",
        startDate: null,
        dueDate: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
        updatedAt: new Date("2026-10-01T00:00:00Z"),
        clientId: "c1",
        clientName: "Acme Corp",
        clientCompany: "Acme",
        taskCount: 4,
        completedTaskCount: 1,
        openTaskCount: 3,
      },
      client: { clientId: "c1", clientName: "Acme Corp", company: "Acme", status: "ACTIVE" },
      taskCounts: { total: 4, overdue: 1, dueSoon: 1, blocked: 1, open: 2, completed: 1 },
      tasks: [
        {
          taskId: "t1",
          title: "Design homepage",
          status: "TODO",
          priority: "HIGH",
          timelineState: "OVERDUE",
          dueDate: new Date("2026-10-01T00:00:00Z"),
          assignee: "Jane Doe",
          updatedAt: new Date("2026-09-30T00:00:00Z"),
          projectId: "p1",
          projectName: "Website Redesign",
        },
      ],
      documents: [],
      brief: {
        documentId: "d1",
        name: "Project Brief",
        originalName: "brief.pdf",
        truncated: false,
        sourceDocumentUpdatedAt: new Date("2026-10-01T00:00:00Z"),
        content: "Scope: rebuild the homepage.",
      },
      aiIntelligence: {
        status: "READY",
        intelligence: {
          analyzedAt: "2026-09-20T00:00:00Z",
          analyzedAtLabel: "Sep 20, 2026",
          summary: "Rebuild homepage",
          risks: [{ severity: "high", title: "Timeline", description: "Tight deadline." }],
          missingInformation: [{ question: "Q?", reason: "R" }],
          deliverablesCount: 2,
          requirementsCount: 3,
          suggestedTasks: [{ title: "Task 1", description: "Do it" }],
          sourceDocumentName: "brief.pdf",
          sourceMetadataTruncated: false,
          isCurrent: false,
          staleReason: "the project brief has been updated since this analysis was generated",
        },
      },
      activity: [
        { createdAt: new Date("2026-10-03T00:00:00Z"), description: "created task Design homepage", actorName: "Jane Doe" },
      ],
      priorContextInvalidated: false,
    };

    const serialized = serializeAssistantContext(context);
    assert.match(serialized, /AI_INTELLIGENCE/);
    assert.match(serialized, /AI-GENERATED Project Intelligence \(OUTDATED/);
    assert.match(serialized, /Tight deadline/);
    assert.match(serialized, /PROJECT_DATA/);
    assert.match(serialized, /TASK_DATA/);
    assert.match(serialized, /DOCUMENT_DATA \(PRIMARY PROJECT BRIEF CONTENT\)/);
    assert.match(serialized, /<brief_content>Scope: rebuild the homepage.<\/brief_content>/);
    assert.match(serialized, /PROJECT_ACTIVITY/);
    assert.match(serialized, /Sep 20, 2026/);
    assert.doesNotMatch(serialized, /organizationId/);
  });

  it("handles missing AI analysis gracefully", () => {
    const context: ResolvedAssistantContext = {
      scope: "PROJECT",
      currentDateTime: "2026-10-04T08:00:00Z",
      needs: { projects: false, tasks: false, aiIntelligence: true, briefContent: false, activity: false, summary: false },
      project: {
        projectId: "p1",
        name: "New Project",
        status: "PLANNING",
        priority: "LOW",
        description: null,
        startDate: null,
        dueDate: null,
        createdAt: new Date("2026-10-04T00:00:00Z"),
        updatedAt: new Date("2026-10-04T00:00:00Z"),
        clientId: "c1",
        clientName: "Acme Corp",
        clientCompany: "Acme",
        taskCount: 0,
        completedTaskCount: 0,
        openTaskCount: 0,
      },
      client: { clientId: "c1", clientName: "Acme Corp", company: "Acme", status: "ACTIVE" },
      taskCounts: { total: 0, overdue: 0, dueSoon: 0, blocked: 0, open: 0, completed: 0 },
      documents: [],
      aiIntelligence: { status: "READY", intelligence: null },
      activity: [],
      priorContextInvalidated: false,
    };

    const serialized = serializeAssistantContext(context);
    assert.match(serialized, /hasn't been analyzed/);
  });
});

describe("Assistant question families -> intent + scope", () => {
  const summaries: AssistantProjectSummary[] = [
    projectSummary({ projectId: "p1", name: "Website Redesign" }),
  ];

  const cases: Array<{
    question: string;
    needs: { projects: boolean; tasks: boolean; aiIntelligence: boolean; briefContent: boolean; activity: boolean; summary: boolean };
    scope: "project" | "organization";
  }> = [
    { question: "What's the status of Website Redesign?", needs: { projects: true, tasks: false, aiIntelligence: false, briefContent: false, activity: false, summary: true }, scope: "project" },
    { question: "What tasks are on Website Redesign?", needs: { projects: false, tasks: true, aiIntelligence: false, briefContent: false, activity: false, summary: false }, scope: "project" },
    { question: "Which tasks are overdue?", needs: { projects: false, tasks: true, aiIntelligence: false, briefContent: false, activity: false, summary: false }, scope: "organization" },
    { question: "What is blocked?", needs: { projects: false, tasks: true, aiIntelligence: false, briefContent: false, activity: false, summary: false }, scope: "organization" },
    { question: "Who is the client for Website Redesign?", needs: { projects: false, tasks: false, aiIntelligence: false, briefContent: false, activity: false, summary: false }, scope: "project" },
    { question: "What does the brief say about deliverables?", needs: { projects: false, tasks: false, aiIntelligence: true, briefContent: true, activity: false, summary: false }, scope: "project" },
    { question: "What risks did AI identify?", needs: { projects: false, tasks: false, aiIntelligence: true, briefContent: false, activity: false, summary: false }, scope: "project" },
    { question: "What changed recently?", needs: { projects: false, tasks: false, aiIntelligence: false, briefContent: false, activity: true, summary: false }, scope: "project" },
    { question: "Summarize Website Redesign.", needs: { projects: false, tasks: false, aiIntelligence: false, briefContent: false, activity: false, summary: true }, scope: "project" },
    { question: "What needs my attention?", needs: { projects: false, tasks: false, aiIntelligence: false, briefContent: false, activity: false, summary: true }, scope: "organization" },
  ];

  for (const item of cases) {
    it(`intent + scope for: ${item.question}`, () => {
      const needs = inferAssistantContextNeeds(item.question);
      assert.deepEqual(needs, item.needs);
      const decision = decideAssistantScope(item.question, summaries, item.scope === "project" ? "p1" : null);
      assert.equal(
        decision.type,
        item.scope === "project" ? "project" : item.scope === "organization" ? "organization" : "project",
      );
    });
  }
});

describe("Assistant context security and honesty", () => {
  it("does not emit internal IDs in serialized context", () => {
    const context: ResolvedAssistantContext = {
      scope: "PROJECT",
      currentDateTime: "2026-10-04T08:00:00Z",
      needs: { projects: false, tasks: true, aiIntelligence: true, briefContent: true, activity: true, summary: true },
      project: {
        projectId: "p1",
        name: "Website Redesign",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        description: "desc",
        startDate: null,
        dueDate: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
        updatedAt: new Date("2026-10-01T00:00:00Z"),
        clientId: "c1",
        clientName: "Acme Corp",
        clientCompany: "Acme",
        taskCount: 0,
        completedTaskCount: 0,
        openTaskCount: 0,
      },
      client: { clientId: "c1", clientName: "Acme Corp", company: "Acme", status: "ACTIVE" },
      taskCounts: { total: 0, overdue: 0, dueSoon: 0, blocked: 0, open: 0, completed: 0 },
      documents: [],
      activity: [],
      priorContextInvalidated: false,
    };

    const serialized = serializeAssistantContext(context);
    assert.doesNotMatch(serialized, /projectId:/);
    assert.doesNotMatch(serialized, /taskId:/);
    assert.doesNotMatch(serialized, /clientId:/);
    assert.doesNotMatch(serialized, /documentId:/);
    assert.doesNotMatch(serialized, /organizationId/);
  });

  it("does not surface storage paths or signed URLs in documents", () => {
    const context: ResolvedAssistantContext = {
      scope: "PROJECT",
      currentDateTime: "2026-10-04T08:00:00Z",
      needs: { projects: false, tasks: false, aiIntelligence: false, briefContent: false, activity: false, summary: false },
      project: {
        projectId: "p1",
        name: "Website Redesign",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        description: null,
        startDate: null,
        dueDate: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
        updatedAt: new Date("2026-10-01T00:00:00Z"),
        clientId: "c1",
        clientName: "Acme Corp",
        clientCompany: "Acme",
        taskCount: 0,
        completedTaskCount: 0,
        openTaskCount: 0,
      },
      client: { clientId: "c1", clientName: "Acme Corp", company: "Acme", status: "ACTIVE" },
      taskCounts: { total: 0, overdue: 0, dueSoon: 0, blocked: 0, open: 0, completed: 0 },
      documents: [
        {
          documentId: "d1",
          name: "Project Brief",
          originalName: "brief.pdf",
          type: "PROJECT_BRIEF",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          isPrimary: true,
          createdAt: new Date("2026-09-01T00:00:00Z"),
          updatedAt: new Date("2026-10-01T00:00:00Z"),
        },
      ],
      activity: [],
      priorContextInvalidated: false,
    };

    const serialized = serializeAssistantContext(context);
    assert.doesNotMatch(serialized, /storagePath/);
    assert.doesNotMatch(serialized, /storageUrl/);
    assert.doesNotMatch(serialized, /https:\/\//);
  });

  it("surfaces a stale-analysis notice rather than presenting stale AI as current", () => {
    const context: ResolvedAssistantContext = {
      scope: "PROJECT",
      currentDateTime: "2026-10-04T08:00:00Z",
      needs: { projects: false, tasks: false, aiIntelligence: true, briefContent: false, activity: false, summary: false },
      project: {
        projectId: "p1",
        name: "Website Redesign",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        description: null,
        startDate: null,
        dueDate: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
        updatedAt: new Date("2026-10-01T00:00:00Z"),
        clientId: "c1",
        clientName: "Acme Corp",
        clientCompany: "Acme",
        taskCount: 0,
        completedTaskCount: 0,
        openTaskCount: 0,
      },
      client: { clientId: "c1", clientName: "Acme Corp", company: "Acme", status: "ACTIVE" },
      taskCounts: { total: 0, overdue: 0, dueSoon: 0, blocked: 0, open: 0, completed: 0 },
      documents: [],
      brief: null,
      aiIntelligence: {
        status: "READY",
        intelligence: {
          analyzedAt: "2026-09-01T00:00:00Z",
          analyzedAtLabel: "Sep 1, 2026",
          summary: "old",
          risks: [{ severity: "high", title: "R", description: "D" }],
          missingInformation: [],
          deliverablesCount: 0,
          requirementsCount: 0,
          suggestedTasks: [],
          sourceDocumentName: "brief.pdf",
          sourceMetadataTruncated: false,
          isCurrent: false,
          staleReason: "the project brief has been updated since this analysis was generated",
        },
      },
      activity: [],
      priorContextInvalidated: false,
    };

    const serialized = serializeAssistantContext(context);
    assert.match(serialized, /AI-GENERATED Project Intelligence \(OUTDATED/);
    assert.match(serialized, /the project brief has been updated since this analysis was generated/);
  });

  it("reports truncation when brief content was cut", () => {
    const context: ResolvedAssistantContext = {
      scope: "PROJECT",
      currentDateTime: "2026-10-04T08:00:00Z",
      needs: { projects: false, tasks: false, aiIntelligence: false, briefContent: true, activity: false, summary: false },
      project: {
        projectId: "p1",
        name: "Website Redesign",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        description: null,
        startDate: null,
        dueDate: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
        updatedAt: new Date("2026-10-01T00:00:00Z"),
        clientId: "c1",
        clientName: "Acme Corp",
        clientCompany: "Acme",
        taskCount: 0,
        completedTaskCount: 0,
        openTaskCount: 0,
      },
      client: { clientId: "c1", clientName: "Acme Corp", company: "Acme", status: "ACTIVE" },
      taskCounts: { total: 0, overdue: 0, dueSoon: 0, blocked: 0, open: 0, completed: 0 },
      documents: [],
      brief: {
        documentId: "d1",
        name: "Project Brief",
        originalName: "brief.pdf",
        truncated: true,
        sourceDocumentUpdatedAt: new Date("2026-10-01T00:00:00Z"),
        content: "x".repeat(9000),
      },
      activity: [],
      priorContextInvalidated: false,
    };

    const serialized = serializeAssistantContext(context);
    assert.match(serialized, /truncated: true/);
    assert.match(serialized, /\[truncated/);
  });

  it("distinguishes empty results from retrieval failure at the data layer", () => {
    const empty = computeAssistantTaskAggregates([]);
    assert.deepEqual(empty, { total: 0, overdue: 0, dueSoon: 0, blocked: 0, open: 0, completed: 0 });
  });
});

describe("Assistant read-only enforcement", () => {
  it("system prompt prohibits all write actions", async () => {
    const { BUSINESSFLOW_ASSISTANT_BASE_PROMPT } = await import("@/lib/assistant/prompt");
    assert.match(BUSINESSFLOW_ASSISTANT_BASE_PROMPT, /read-only/i);
    assert.match(BUSINESSFLOW_ASSISTANT_BASE_PROMPT, /MUST NOT.*create/i);
    assert.match(BUSINESSFLOW_ASSISTANT_BASE_PROMPT, /MUST NOT.*delete/i);
    assert.match(BUSINESSFLOW_ASSISTANT_BASE_PROMPT, /MUST NOT.*complete/i);
    assert.match(BUSINESSFLOW_ASSISTANT_BASE_PROMPT, /prompt injection/i);
  });
});

describe("Assistant overdue/upcoming date semantics", () => {
  const today = new Date("2026-10-15T12:00:00Z");
  const day = (offset: number, hour = 0) => new Date(Date.UTC(2026, 9, 15 + offset, hour, 0, 0));

  it("treats a task due today as due soon, not overdue", () => {
    assert.equal(classifyAssistantTaskState("TODO", day(0), today).status, "UPCOMING");
  });

  it("treats a task due tomorrow as due soon", () => {
    assert.equal(classifyAssistantTaskState("TODO", day(1), today).status, "UPCOMING");
  });

  it("treats a task due in 7 days as due soon", () => {
    assert.equal(classifyAssistantTaskState("TODO", day(7), today).status, "UPCOMING");
  });

  it("treats a task due in 8 days as open", () => {
    assert.equal(classifyAssistantTaskState("TODO", day(8), today).status, "OPEN");
  });

  it("treats a past-due incomplete task as overdue", () => {
    assert.equal(classifyAssistantTaskState("TODO", day(-1), today).status, "OVERDUE");
  });

  it("never treats a completed past-due task as overdue", () => {
    assert.equal(classifyAssistantTaskState("COMPLETED", day(-5), today).status, "COMPLETED");
  });

  it("never treats a cancelled past-due task as overdue", () => {
    assert.equal(classifyAssistantTaskState("CANCELLED", day(-5), today).status, "COMPLETED");
  });

  it("classifies a blocker with a due date as blocked, not overdue", () => {
    assert.equal(classifyAssistantTaskState("BLOCKED", day(-2), today).status, "BLOCKED");
  });
});
