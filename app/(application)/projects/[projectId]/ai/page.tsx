import { Suspense } from "react";
import { ProjectAiWorkspace } from "@/components/projects/project-ai-workspace";
import {
  ProjectAIAnalysisHistorySection,
  ProjectAIAnalysisHistorySkeleton,
} from "@/components/projects/project-ai-analysis-history-section";
import { getProjectAIAnalysisState } from "@/lib/project-ai/persistence";
import { getProjectAIAnalysisFeedback, type ProjectAIAnalysisFeedbackView } from "@/lib/project-ai/feedback";

export default async function ProjectAiPage({ params }: PageProps<"/projects/[projectId]/ai">) {
  const { projectId } = await params;
  let state;
  let feedback: ProjectAIAnalysisFeedbackView[] = [];
  try {
    state = await getProjectAIAnalysisState(projectId);
    if (state.analysis) {
      try {
        feedback = await getProjectAIAnalysisFeedback(projectId, state.analysis.id);
      } catch (error) {
        console.error("Project AI feedback could not be loaded.", {
          projectId,
          analysisId: state.analysis.id,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    }
  } catch (error) {
    console.error("Project AI page state query failed.", {
      projectId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
    state = {
      status: "FAILED" as const,
      primaryBrief: null,
      analysis: null,
      analysisIsCurrent: false,
      analysisSourceMissing: false,
      analysisStaleReason: null,
      errorMessage: "AI project intelligence is temporarily unavailable. Please refresh and try again.",
      latestFailureMessage: null,
    };
  }

  return (
    <>
      <ProjectAiWorkspace projectId={projectId} initialState={state} initialFeedback={feedback} />
      <Suspense fallback={<ProjectAIAnalysisHistorySkeleton />}>
        <ProjectAIAnalysisHistorySection
          projectId={projectId}
          currentAnalysisId={state.analysisIsCurrent ? state.analysis?.id ?? null : null}
          currentAnalysisIsCurrent={state.analysisIsCurrent}
        />
      </Suspense>
    </>
  );
}
