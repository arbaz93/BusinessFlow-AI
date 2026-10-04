export type AssistantContextNeeds = {
  projects: boolean;
  tasks: boolean;
  aiIntelligence: boolean;
  briefContent: boolean;
  activity: boolean;
  summary: boolean;
};

export type AssistantProjectSummary = {
  projectId: string;
  name: string;
  status: string;
  clientName: string;
  clientCompany?: string | null;
  dueDate?: Date | null;
  priority?: string;
  description?: string | null;
};

export type AssistantProjectDetail = {
  projectId: string;
  name: string;
  status: string;
  priority: string;
  description?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  clientName: string;
  clientCompany?: string | null;
  taskCount: number;
  completedTaskCount: number;
  openTaskCount: number;
};

export type AssistantClientContext = {
  clientId: string;
  clientName: string;
  company?: string | null;
  status: string;
};

export type AssistantTaskStatusLabel = "OVERDUE" | "UPCOMING" | "BLOCKED" | "OPEN" | "COMPLETED";

export type AssistantTaskClassification = {
  status: AssistantTaskStatusLabel;
  reason?: string;
};

export type AssistantTaskContext = {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  timelineState: AssistantTaskStatusLabel;
  dueDate?: Date | null;
  assignee?: string | null;
  updatedAt: Date;
  projectId: string;
  projectName: string;
};

export type AssistantDocumentSummary = {
  documentId: string;
  name: string;
  originalName: string;
  type: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AssistantBriefContext = {
  documentId: string;
  name: string;
  originalName: string;
  truncated: boolean;
  sourceDocumentUpdatedAt: Date;
  content?: string | null;
};

export type AssistantRisk = {
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
};

export type AssistantMissingInformation = {
  question: string;
  reason: string;
};

export type AssistantSuggestedTask = {
  title: string;
  description?: string;
};

export type AssistantAIIntelligence = {
  analyzedAt: string;
  analyzedAtLabel: string;
  summary?: string | null;
  risks: AssistantRisk[];
  missingInformation: AssistantMissingInformation[];
  deliverablesCount: number;
  requirementsCount: number;
  suggestedTasks: AssistantSuggestedTask[];
  sourceDocumentName?: string | null;
  sourceMetadataTruncated: boolean;
  isCurrent: boolean;
  staleReason?: string | null;
};

export type AssistantAIContextState = {
  status: "NO_BRIEF" | "READY" | "PROCESSING" | "ERROR";
  errorMessage?: string | null;
  intelligence?: AssistantAIIntelligence | null;
};

export type AssistantActivityEntry = {
  createdAt: Date;
  description: string;
  actorName?: string | null;
};

export type OrganizationSummary = {
  leadCount: number;
  activeClientCount: number;
  projectCount: number;
  activeProjectCount: number;
  overdueTaskCount: number;
  upcomingTaskCount: number;
  blockedTaskCount: number;
  activeProjects: AssistantProjectSummary[];
  overdueTasks: AssistantTaskContext[];
  upcomingTasks: AssistantTaskContext[];
  blockedTasks: AssistantTaskContext[];
};

export type AssistantTaskAggregates = {
  total: number;
  overdue: number;
  dueSoon: number;
  blocked: number;
  open: number;
  completed: number;
};

export type ResolvedAssistantContext =
  | {
      scope: "ORGANIZATION";
      organizationSummary: OrganizationSummary;
      currentDateTime: string;
      needs?: AssistantContextNeeds;
      priorContextInvalidated: boolean;
    }
  | {
      scope: "PROJECT";
      currentDateTime: string;
      needs?: AssistantContextNeeds;
      project?: AssistantProjectDetail | null;
      client?: AssistantClientContext | null;
      taskCounts?: AssistantTaskAggregates | null;
      tasks?: AssistantTaskContext[] | null;
      documents?: AssistantDocumentSummary[] | null;
      brief?: AssistantBriefContext | null;
      aiIntelligence?: AssistantAIContextState | null;
      activity?: AssistantActivityEntry[] | null;
      priorContextInvalidated: boolean;
    };

export type AssistantClarification = {
  type: "clarification";
  message: string;
  candidates: AssistantProjectSummary[];
};

export type AssistantContextResult =
  | { ready: true; context: ResolvedAssistantContext }
  | { ready: false; clarification: AssistantClarification };
