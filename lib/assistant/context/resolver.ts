import "server-only";

import type {
  AssistantContextResult,
  ResolvedAssistantContext,
  AssistantProjectSummary,
  AssistantContextNeeds,
} from "@/lib/assistant/context/types";
import { inferAssistantContextNeeds } from "@/lib/assistant/context/intent";
import { decideAssistantScope } from "@/lib/assistant/context/scope";
import {
  getAssistantProjectSummaries,
  getAssistantProjectDetail,
  type AssistantProjectDetail,
} from "@/lib/assistant/context/projects";
import { clientFromProjectDetail, getAssistantClientContext } from "@/lib/assistant/context/clients";
import {
  getAssistantProjectTaskAggregates,
  getAssistantProjectTasks,
} from "@/lib/assistant/context/tasks";
import {
  getAssistantProjectDocuments,
  getAssistantBriefContent,
} from "@/lib/assistant/context/documents";
import { getAssistantAIContext } from "@/lib/assistant/context/ai-intelligence";
import { getAssistantProjectActivity } from "@/lib/assistant/context/activity";
import { getAssistantOrganizationSummary } from "@/lib/assistant/context/organization";

export { type AssistantContextResult, type ResolvedAssistantContext, type AssistantContextNeeds };

export interface ResolveAssistantContextInput {
  organizationId: string;
  profileId: string;
  message: string;
  contextProjectId?: string | null;
}

export interface AssistantResolverOptions {
  projectListLimit?: number;
  taskListLimit?: number;
  documentListLimit?: number;
  activityListLimit?: number;
}

export async function resolveAssistantContext(
  input: ResolveAssistantContextInput,
  _options: AssistantResolverOptions = {},
): Promise<AssistantContextResult> {
  const now = new Date();
  const currentDateTime = now.toISOString();
  const needs = inferAssistantContextNeeds(input.message);
  const taskListLimit = _options.taskListLimit ?? 20;
  const documentListLimit = _options.documentListLimit ?? 20;
  const activityListLimit = _options.activityListLimit ?? 20;

  let summaries: AssistantProjectSummary[];
  try {
    summaries = await getAssistantProjectSummaries(input.organizationId);
  } catch {
    summaries = [];
  }

  const decision = decideAssistantScope(input.message, summaries, input.contextProjectId);

  if (decision.type === "clarification") {
    return { ready: false, clarification: decision };
  }

  if (decision.type === "organization") {
    try {
      const organizationSummary = await getAssistantOrganizationSummary(input.organizationId, now, needs);
      const context: ResolvedAssistantContext = {
        scope: "ORGANIZATION",
        currentDateTime,
        needs,
        organizationSummary,
        priorContextInvalidated: false,
      };
      return { ready: true, context };
    } catch {
      return {
        ready: false,
        clarification: {
          type: "clarification",
          candidates: [],
          message:
            "I couldn't load workspace context right now. Try again in a moment, or open a specific project and ask.",
        },
      };
    }
  }

  const projectId = decision.project.projectId;

  let detail: AssistantProjectDetail | null = null;
  try {
    detail = await getAssistantProjectDetail(input.organizationId, projectId);
  } catch {
    detail = null;
  }

  if (!detail) {
    const organizationSummary = await getAssistantOrganizationSummary(input.organizationId, now, needs);
    const context: ResolvedAssistantContext = {
      scope: "ORGANIZATION",
      currentDateTime,
      needs,
      organizationSummary,
      priorContextInvalidated: true,
    };
    return { ready: true, context };
  }

  const client = clientFromProjectDetail(detail) ?? (await safeGet(() => getAssistantClientContext(input.organizationId, detail.clientId)));

  const [taskCounts, documents, brief, aiIntelligence, activity, tasks] = await Promise.all([
    safeGet(() => getAssistantProjectTaskAggregates(input.organizationId, projectId, now)),
    needs.briefContent || needs.summary
      ? safeGet(() => getAssistantProjectDocuments(input.organizationId, projectId, documentListLimit))
      : Promise.resolve([]),
    needs.briefContent || needs.summary || needs.aiIntelligence
      ? safeGet(() => getAssistantBriefContent(projectId))
      : Promise.resolve(null),
    needs.aiIntelligence || needs.summary ? safeGet(() => getAssistantAIContext(projectId)) : Promise.resolve(null),
    needs.activity || needs.summary
      ? safeGet(() => getAssistantProjectActivity(input.organizationId, projectId, activityListLimit))
      : Promise.resolve(null),
    needs.tasks || needs.summary
      ? safeGet(() => getAssistantProjectTasks(input.organizationId, projectId, now, taskListLimit))
      : Promise.resolve(null),
  ]);

  const context: ResolvedAssistantContext = {
    scope: "PROJECT",
    currentDateTime,
    needs,
    project: detail,
    client,
    taskCounts: taskCounts ?? undefined,
    documents: documents ?? [],
    brief: brief ?? undefined,
    aiIntelligence: aiIntelligence ?? undefined,
    tasks: tasks ?? undefined,
    activity: activity ?? undefined,
    priorContextInvalidated: false,
  };

  return { ready: true, context };
}

async function safeGet<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
