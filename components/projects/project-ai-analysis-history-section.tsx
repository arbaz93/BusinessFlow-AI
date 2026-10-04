import { getProjectAIAnalysisHistory } from "@/lib/project-ai/history";
import { ProjectAIAnalysisHistory } from "@/components/projects/project-ai-analysis-history";
import type { ProjectAIAnalysisHistoryEntry } from "@/lib/project-ai/history";

export function ProjectAIAnalysisHistorySkeleton() {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-lg border border-white/10 bg-[#18181b] p-4 sm:p-5" aria-busy="true">
      <div className="h-5 w-40 animate-pulse rounded bg-white/[0.07]" />
      <div className="mt-4 space-y-3">
        <div className="h-14 animate-pulse rounded-md bg-white/[0.04]" />
        <div className="h-14 animate-pulse rounded-md bg-white/[0.04]" />
      </div>
      <span className="sr-only">Loading analysis history</span>
    </section>
  );
}

export async function ProjectAIAnalysisHistorySection({
  projectId,
  currentAnalysisId,
  currentAnalysisIsCurrent,
}: {
  projectId: string;
  currentAnalysisId: string | null;
  currentAnalysisIsCurrent: boolean;
}) {
  let analyses: ProjectAIAnalysisHistoryEntry[];
  try {
    analyses = await getProjectAIAnalysisHistory(projectId, currentAnalysisId, currentAnalysisIsCurrent);
  } catch (error) {
    console.error("Project AI analysis history query failed.", {
      projectId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
    return (
      <p role="status" className="mx-auto w-full max-w-5xl rounded-lg border border-white/10 bg-[#18181b] px-4 py-3 text-sm text-white/55">
        Analysis history is temporarily unavailable.
      </p>
    );
  }
  return <ProjectAIAnalysisHistory projectId={projectId} analyses={analyses} />;
}
