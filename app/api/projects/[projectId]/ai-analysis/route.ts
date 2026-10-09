import { requireOrganization } from "@/lib/auth/dal";
import { getProjectAIErrorMessage } from "@/lib/project-ai/errors";
import { runAndPersistProjectAnalysis } from "@/lib/project-ai/persistence";
import { projectAiAnalysisInputSchema } from "@/lib/project-ai/schemas";
import { checkRateLimit, getClientIdentifier, AI_ANALYSIS_RATE_LIMIT_CONFIG } from "@/lib/security/rate-limiter";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const parsed = projectAiAnalysisInputSchema.safeParse({ projectId });
  if (!parsed.success) {
    return Response.json(
      { errorMessage: "This project is not ready for AI analysis yet." },
      { status: 400 },
    );
  }

  const clientIp = await getClientIdentifier();
  const rateLimit = await checkRateLimit(clientIp, AI_ANALYSIS_RATE_LIMIT_CONFIG);
  if (!rateLimit.allowed) {
    return Response.json(
      { errorMessage: "Too many analysis requests. Please try again later." },
      { status: 429 },
    );
  }

  const { organization } = await requireOrganization();
  try {
    await runAndPersistProjectAnalysis(parsed.data.projectId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Project AI analysis request failed unexpectedly.", {
      organizationId: organization.id,
      projectId: parsed.data.projectId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      prismaCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    });
    return Response.json(
      { errorMessage: getProjectAIErrorMessage("UNKNOWN_AI_ERROR") },
      { status: 500 },
    );
  }
}
