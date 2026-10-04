import "server-only";

import type { OrganizationSummary } from "@/lib/assistant/context/types";
import type { AssistantProjectSummary } from "@/lib/assistant/context/types";
import { getActiveProjectAndClientCounts } from "@/lib/assistant/context/projects";
import { getAssistantProjectSummaries } from "@/lib/assistant/context/projects";
import { getAssistantOrgTaskAggregates, getAssistantOrgTaskSamples } from "@/lib/assistant/context/tasks";
import type { OrgTaskSamples } from "@/lib/assistant/context/tasks";
import type { AssistantContextNeeds } from "@/lib/assistant/context/types";

export { type OrganizationSummary, type AssistantContextNeeds, type OrgTaskSamples };

const ORG_TASK_SAMPLE_LIMIT = 8;

export async function getAssistantOrganizationSummary(
  organizationId: string,
  now: Date,
  needs: AssistantContextNeeds,
): Promise<OrganizationSummary> {
  const [counts, taskAggregates] = await Promise.all([
    getActiveProjectAndClientCounts(organizationId),
    getAssistantOrgTaskAggregates(organizationId, now),
  ]);

  const aggregates = taskAggregates ?? {
    total: 0,
    overdue: 0,
    dueSoon: 0,
    blocked: 0,
    open: 0,
    completed: 0,
  };

  const includeSamples = needs.tasks || needs.summary;
  const samples: OrgTaskSamples = includeSamples
    ? await getAssistantOrgTaskSamples(organizationId, now, ORG_TASK_SAMPLE_LIMIT)
    : { overdue: [], upcoming: [], blocked: [] };

  const includeProjects = needs.projects || needs.summary;
  const activeProjects: AssistantProjectSummary[] = includeProjects
    ? await getAssistantProjectSummaries(organizationId)
    : [];

  return {
    leadCount: counts.leadCount,
    activeClientCount: counts.activeClientCount,
    projectCount: counts.projectCount,
    activeProjectCount: counts.activeProjectCount,
    overdueTaskCount: aggregates.overdue,
    upcomingTaskCount: aggregates.dueSoon,
    blockedTaskCount: aggregates.blocked,
    activeProjects,
    overdueTasks: samples.overdue,
    upcomingTasks: samples.upcoming,
    blockedTasks: samples.blocked,
  };
}
