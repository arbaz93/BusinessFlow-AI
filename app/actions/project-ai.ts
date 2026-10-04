"use server";

import { requireOrganization } from "@/lib/auth/dal";
import { runAndPersistProjectAnalysis, type ProjectAIAnalysisState } from "@/lib/project-ai/persistence";
import { projectAiAnalysisInputSchema } from "@/lib/project-ai/schemas";
import { getProjectAIErrorMessage } from "@/lib/project-ai/errors";

export async function analyzeProjectBriefAction(
  _previousState: ProjectAIAnalysisState,
  formData: FormData,
): Promise<ProjectAIAnalysisState> {
  const parsed = projectAiAnalysisInputSchema.safeParse({
    projectId: formData.get("projectId"),
  });

  if (!parsed.success) {
    return {
      status: "FAILED",
      primaryBrief: null,
      analysis: null,
      analysisIsCurrent: false,
      analysisSourceMissing: false,
      analysisStaleReason: null,
      errorMessage: "This project is not ready for AI analysis yet.",
      latestFailureMessage: null,
    };
  }

  const { organization } = await requireOrganization();
  try {
    return await runAndPersistProjectAnalysis(parsed.data.projectId);
  } catch (error) {
    console.error("Project AI analysis action failed unexpectedly.", {
      organizationId: organization.id,
      projectId: parsed.data.projectId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
    const errorMessage = getProjectAIErrorMessage("UNKNOWN_AI_ERROR");
    return {
      status: "FAILED",
      primaryBrief: null,
      analysis: null,
      analysisIsCurrent: false,
      analysisSourceMissing: false,
      analysisStaleReason: null,
      errorMessage,
      latestFailureMessage: errorMessage,
    };
  }
}
