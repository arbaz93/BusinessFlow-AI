import type { AssistantProjectSummary } from "@/lib/assistant/context/types";
import { matchProjectReferences } from "@/lib/assistant/context/match";
import { triggersOrgScope } from "@/lib/assistant/context/intent";

export type AssistantScopeDecision =
  | {
      type: "project";
      project: AssistantProjectSummary;
      switched: boolean;
      priorContextInvalidated: boolean;
    }
  | {
      type: "organization";
      priorContextInvalidated: boolean;
    }
  | {
      type: "clarification";
      candidates: AssistantProjectSummary[];
      message: string;
    };

export function hasProjectInSummaries(
  summaries: AssistantProjectSummary[],
  projectId: string | null | undefined,
): boolean {
  return Boolean(projectId) && summaries.some((project) => project.projectId === projectId);
}

export function decideAssistantScope(
  message: string,
  summaries: AssistantProjectSummary[],
  existingProjectId: string | null | undefined,
): AssistantScopeDecision {
  const match = matchProjectReferences(summaries, message);

  if (match.kind === "ambiguous") {
    const candidateNames = match.candidates
      .map((project) => `${project.name} — ${project.clientCompany || project.clientName}`)
      .join("\n");
    return {
      type: "clarification",
      candidates: match.candidates,
      message:
        "I found multiple projects matching your reference:\n" +
        candidateNames +
        "\n\nWhich one would you like me to use? Reply with the project name or client name to clarify.",
    };
  }

  if (match.kind === "single") {
    const switched = match.project.projectId !== existingProjectId;
    return {
      type: "project",
      project: match.project,
      switched,
      priorContextInvalidated: false,
    };
  }

  const existingValid = existingProjectId && hasProjectInSummaries(summaries, existingProjectId);

  if (triggersOrgScope(message)) {
    return {
      type: "organization",
      priorContextInvalidated: Boolean(existingProjectId && !existingValid),
    };
  }

  if (existingValid) {
    return {
      type: "project",
      project: summaries.find((project) => project.projectId === existingProjectId)!,
      switched: false,
      priorContextInvalidated: false,
    };
  }

  return {
    type: "organization",
    priorContextInvalidated: Boolean(existingProjectId),
  };
}
