import type { AssistantContextNeeds } from "@/lib/assistant/context/types";

export { type AssistantContextNeeds };

const projectTokens = ["project", "projects", "in progress", "status"];
const taskTokens = [
  "task",
  "tasks",
  "overdue",
  "due",
  "late",
  "behind",
  "blocked",
  "blocking",
  "assignee",
  "assigned",
  "todo",
  "to-do",
  "to do",
];

const aiIntelligenceTokens = [
  "risk",
  "risks",
  "analy",
  "intelligence",
  "deliverable",
  "deliverables",
  "missing information",
  "missing info",
  "requirement",
  "requirements",
  "suggested task",
  "suggested work",
  "gaps",
  "gap",
];

const briefTokens = ["brief", "in the brief", "project brief"];

const activityTokens = [
  "recent",
  "recently",
  "history",
  "happened",
  "activity",
  "changed",
  "updated",
  "modified",
  "last",
  "since",
  "newly",
];

const summaryTokens = [
  "summar",
  "status",
  "overview",
  "state",
  "how is",
  "how's",
  "update on",
  "progress",
  "where is",
  "attention",
];

const orgScopeTokens = ["workspace", "across", "overall", "organization", "all projects", "in total", "every project"];

function includesAny(text: string, tokens: string[]): boolean {
  for (const token of tokens) {
    if (text.includes(token)) return true;
  }
  return false;
}

export function inferAssistantContextNeeds(message: string): AssistantContextNeeds {
  const normalized = message.toLowerCase();
  return {
    projects: includesAny(normalized, projectTokens),
    tasks: includesAny(normalized, taskTokens),
    aiIntelligence: includesAny(normalized, aiIntelligenceTokens),
    briefContent: includesAny(normalized, briefTokens),
    activity: includesAny(normalized, activityTokens),
    summary: includesAny(normalized, summaryTokens),
  };
}

export function triggersOrgScope(message: string): boolean {
  const normalized = message.toLowerCase();
  return includesAny(normalized, orgScopeTokens);
}
