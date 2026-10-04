import type {
  ResolvedAssistantContext,
  AssistantProjectSummary,
  AssistantProjectDetail,
  AssistantClientContext,
  AssistantTaskContext,
  AssistantTaskAggregates,
  AssistantDocumentSummary,
  AssistantBriefContext,
  AssistantAIIntelligence,
  AssistantActivityEntry,
  OrganizationSummary,
} from "@/lib/assistant/context/types";

function formatUtcDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

function truncateValue(value: string | null | undefined, limit: number, label: string): string | null {
  if (!value) return null;
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit)).trimEnd()}… [truncated: source ${label} was longer than the supplied ${label}]`;
}

function formatProjectDetail(project: AssistantProjectDetail): string {
  const lines = [
    `name: ${project.name}`,
    `status: ${formatStatus(project.status)}`,
    `priority: ${formatStatus(project.priority)}`,
    `description: ${project.description ?? "(none)"}`,
    `startDate: ${project.startDate ? formatUtcDate(project.startDate) : "(none)"}`,
    `dueDate: ${project.dueDate ? formatUtcDate(project.dueDate) : "(none)"}`,
    `createdAt: ${formatUtcDate(project.createdAt)}`,
    `updatedAt: ${formatUtcDate(project.updatedAt)}`,
    `clientName: ${project.clientName}`,
    `clientCompany: ${project.clientCompany ?? "(none)"}`,
    `taskCount: ${project.taskCount} (completed: ${project.completedTaskCount}, open: ${project.openTaskCount})`,
  ];
  return lines.join("\n");
}

function formatClient(client: AssistantClientContext): string {
  return [
    `clientName: ${client.clientName}`,
    `company: ${client.company ?? "(none)"}`,
    `status: ${formatStatus(client.status)}`,
  ].join("\n");
}

function formatTask(task: AssistantTaskContext): string {
  return [
    `title: ${task.title}`,
    `status: ${formatStatus(task.status)}`,
    `timelineState: ${task.timelineState}`,
    `priority: ${formatStatus(task.priority)}`,
    `dueDate: ${task.dueDate ? formatUtcDate(task.dueDate) : "(none)"}`,
    `assignee: ${task.assignee ?? "(unassigned)"}`,
    `updatedAt: ${formatUtcDate(task.updatedAt)}`,
    `projectName: ${task.projectName}`,
  ].join("\n");
}

function formatTaskAggregates(aggregates: AssistantTaskAggregates): string {
  return [
    `total: ${aggregates.total}`,
    `overdue: ${aggregates.overdue}`,
    `dueSoon: ${aggregates.dueSoon}`,
    `blocked: ${aggregates.blocked}`,
    `open: ${aggregates.open}`,
    `completed: ${aggregates.completed}`,
  ].join("\n");
}

function formatDocuments(documents: AssistantDocumentSummary[]): string {
  if (!documents.length) return "(no documents)";
  return documents
    .map((document) => [
      `name: ${document.name}`,
      `originalName: ${document.originalName}`,
      `type: ${document.type}`,
      `mimeType: ${document.mimeType ?? "(unknown)"}`,
      `sizeBytes: ${document.sizeBytes ?? "(unknown)"}`,
      `isPrimary: ${document.isPrimary}`,
      `createdAt: ${formatUtcDate(document.createdAt)}`,
      `updatedAt: ${formatUtcDate(document.updatedAt)}`,
    ].join("\n"))
    .join("\n---\n");
}

function formatBrief(brief: AssistantBriefContext): string {
  const content = truncateValue(brief.content, 8000, "brief content");
  return [
    `name: ${brief.name}`,
    `originalName: ${brief.originalName}`,
    `truncated: ${brief.truncated}`,
    `sourceDocumentUpdatedAt: ${formatUtcDate(brief.sourceDocumentUpdatedAt)}`,
    `content:`,
    `<brief_content>${content}</brief_content>`,
  ].join("\n");
}

function formatAIIntelligence(ai: AssistantAIIntelligence): string {
  const header = ai.isCurrent
    ? "AI-GENERATED Project Intelligence (current and valid):"
    : `AI-GENERATED Project Intelligence (OUTDATED — ${ai.staleReason ?? "based on an older brief"}):`;

  const risks =
    ai.risks.length === 0
      ? "(no AI-identified risks)"
      : ai.risks
          .map((risk) => `- [${risk.severity}] ${risk.title}: ${risk.description}`)
          .join("\n");

  const missing =
    ai.missingInformation.length === 0
      ? "(no missing information identified)"
      : ai.missingInformation
          .map((item) => `- Q: ${item.question} — ${item.reason}`)
          .join("\n");

  const deliverables =
    ai.deliverablesCount > 0 ? `${ai.deliverablesCount} deliverables` : "(no deliverables)";
  const requirements =
    ai.requirementsCount > 0 ? `${ai.requirementsCount} requirements` : "(no requirements)";
  const suggestedTasks =
    ai.suggestedTasks.length > 0
      ? `${ai.suggestedTasks.length} suggested work items`
      : "(no suggested work items)";

  return [
    header,
    `analyzedAt: ${ai.analyzedAtLabel} (${ai.analyzedAt})`,
    `summary: ${truncateValue(ai.summary, 600, "summary") ?? "(none)"}`,
    `requirements: ${requirements}`,
    `deliverables: ${deliverables}`,
    `risks:\n${risks}`,
    `missingInformation:\n${missing}`,
    `suggestedTasks: ${suggestedTasks}`,
    `sourceDocument: ${ai.sourceDocumentName ?? "(unknown)"}`,
    `truncatedAnalysisInput: ${ai.sourceMetadataTruncated}`,
  ].join("\n");
}

function formatActivity(entries: AssistantActivityEntry[]): string {
  if (!entries.length) return "(no recent activity)";
  return entries
    .map((entry) => {
      const who = entry.actorName ? ` by ${entry.actorName}` : "";
      return `${formatUtcDate(entry.createdAt)} — ${entry.description}${who}`;
    })
    .join("\n");
}

function formatOrganizationSummary(summary: OrganizationSummary): string {
  const lines = [
    `leadCount: ${summary.leadCount}`,
    `activeClientCount: ${summary.activeClientCount}`,
    `projectCount: ${summary.projectCount}`,
    `activeProjectCount: ${summary.activeProjectCount}`,
    `overdueTaskCount: ${summary.overdueTaskCount}`,
    `upcomingTaskCount: ${summary.upcomingTaskCount}`,
    `blockedTaskCount: ${summary.blockedTaskCount}`,
  ];
  return lines.join("\n");
}

function formatProjectSummaries(projects: AssistantProjectSummary[]): string {
  if (!projects.length) return "(no projects)";
  return projects
    .map((project) => [
      `name: ${project.name}`,
      `status: ${formatStatus(project.status)}`,
      `priority: ${project.priority ? formatStatus(project.priority) : "(none)"}`,
      `dueDate: ${project.dueDate ? formatUtcDate(project.dueDate) : "(none)"}`,
      `clientName: ${project.clientName}`,
      `clientCompany: ${project.clientCompany ?? "(none)"}`,
    ].join("\n"))
    .join("\n---\n");
}

export function serializeAssistantContext(context: ResolvedAssistantContext): string {
  const blocks: string[] = [];

  blocks.push(`CURRENT_APPLICATION_DATE_TIME: ${formatUtcDate(context.currentDateTime)}`);

  if (context.scope === "ORGANIZATION") {
    blocks.push("");
    blocks.push("ORGANIZATION_SUMMARY");
    blocks.push(formatOrganizationSummary(context.organizationSummary!));

    const summary = context.organizationSummary!;
    if (summary.activeProjects.length > 0) {
      blocks.push("");
      blocks.push("PROJECT_LIST (active projects, read-only)");
      blocks.push(formatProjectSummaries(summary.activeProjects));
    }
    if (summary.overdueTasks.length > 0) {
      blocks.push("");
      blocks.push("TASK_DATA (overdue, workspace-wide)");
      blocks.push(summary.overdueTasks.map(formatTask).join("\n---\n"));
    }
    if (summary.upcomingTasks.length > 0) {
      blocks.push("");
      blocks.push("TASK_DATA (due soon, workspace-wide)");
      blocks.push(summary.upcomingTasks.map(formatTask).join("\n---\n"));
    }
    if (summary.blockedTasks.length > 0) {
      blocks.push("");
      blocks.push("TASK_DATA (blocked, workspace-wide)");
      blocks.push(summary.blockedTasks.map(formatTask).join("\n---\n"));
    }
    return blocks.join("\n");
  }

  if (context.project) {
    blocks.push("");
    blocks.push("PROJECT_DATA");
    blocks.push(formatProjectDetail(context.project));
  }

  if (context.client) {
    blocks.push("");
    blocks.push("CLIENT_DATA");
    blocks.push(formatClient(context.client));
  }

  if (context.taskCounts) {
    blocks.push("");
    blocks.push("TASK_DATA_AGGREGATES");
    blocks.push(formatTaskAggregates(context.taskCounts));
  }

  if (context.tasks && context.tasks.length > 0) {
    blocks.push("");
    blocks.push("TASK_DATA");
    blocks.push(context.tasks.map(formatTask).join("\n---\n"));
  }

  if (context.documents && context.documents.length > 0) {
    blocks.push("");
    blocks.push("DOCUMENT_DATA");
    blocks.push(formatDocuments(context.documents));
  }

  if (context.brief) {
    blocks.push("");
    blocks.push("DOCUMENT_DATA (PRIMARY PROJECT BRIEF CONTENT)");
    blocks.push(formatBrief(context.brief));
  }

  if (context.priorContextInvalidated) {
    blocks.push("");
    blocks.push("NOTE: The project you were previously discussing is no longer accessible in this workspace. Starting from current workspace data.");
  }

  if (context.aiIntelligence) {
    blocks.push("");
    blocks.push("AI_INTELLIGENCE");
    const intelligence = context.aiIntelligence.intelligence;
    if (!intelligence) {
      if (context.aiIntelligence.errorMessage) {
        blocks.push(`No current AI analysis available. ${context.aiIntelligence.errorMessage}`);
      } else if (context.aiIntelligence.status === "NO_BRIEF") {
        blocks.push("This project does not currently have a primary Project Brief.");
      } else if (context.aiIntelligence.status === "READY" || context.aiIntelligence.status === "PROCESSING") {
        blocks.push("This project hasn't been analyzed by AI yet.");
      } else {
        blocks.push("No current AI analysis is available for this project.");
      }
    } else {
      blocks.push(formatAIIntelligence(intelligence));
    }
  }

  if (context.activity && context.activity.length > 0) {
    blocks.push("");
    blocks.push("PROJECT_ACTIVITY (most recent first)");
    blocks.push(formatActivity(context.activity));
  }

  return blocks.join("\n");
}
