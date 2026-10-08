import "server-only";

import { extractProjectBriefContent, getPrimaryProjectBriefForAnalysis } from "@/lib/project-ai/brief-content";
import { getGeminiCandidateText, mapGeminiError, normalizeGeminiJsonResponse } from "@/lib/project-ai/response";
import { projectIntelligenceProviderSchema, type AnalyzeProjectBriefResult } from "@/lib/project-ai/schemas";
import { getProjectWorkspace } from "@/lib/projects/workspace";
import { buildProjectIntelligencePrompt } from "@/lib/project-ai/prompt";
import { requestGeminiAnalysis } from "@/lib/project-ai/gemini-provider";
import { getServerEnv } from "@/lib/env";

export async function analyzeProjectBrief(projectId: string, expectedDocumentId?: string): Promise<AnalyzeProjectBriefResult> {
  const { project } = await getProjectWorkspace(projectId);

  const primaryBrief = await getPrimaryProjectBriefForAnalysis(projectId);
  if (!primaryBrief.document || !primaryBrief.document.isPrimary) {
    return {
      success: false,
      code: "NO_PRIMARY_BRIEF",
      message: "Add a primary project brief before analyzing this project.",
    };
  }

  const { GEMINI_API_KEY, GEMINI_MODEL } = getServerEnv();
  if (!GEMINI_API_KEY || !/^gemini-[A-Za-z0-9.-]+$/.test(GEMINI_MODEL)) {
    return {
      success: false,
      code: "AI_NOT_CONFIGURED",
      message: "AI analysis is not configured correctly. Contact your workspace administrator.",
    };
  }

  const extraction = await extractProjectBriefContent(projectId, expectedDocumentId);
  if (!extraction.ok) {
    return {
      success: false,
      code: extraction.errorCode,
      message: extraction.errorCode === "UNSUPPORTED_DOCUMENT_TYPE"
        ? "This document format isn't supported for AI analysis. Choose a PDF, DOCX, TXT, or Markdown brief."
        : extraction.errorCode === "DOCUMENT_NO_TEXT"
          ? "We couldn't extract readable text from this brief. Check that it contains selectable text and try again."
          : extraction.errorCode === "DOCUMENT_TOO_LARGE"
            ? "This document is too large to analyze. Choose a smaller Project Brief."
            : extraction.errorCode === "DOCUMENT_ACCESS_DENIED"
              ? "The Project Brief could not be accessed. Contact your workspace administrator."
              : extraction.errorCode === "DOCUMENT_STORAGE_UNAVAILABLE"
                ? "Document storage is temporarily unavailable. Please try again shortly."
                : extraction.errorCode === "NO_PRIMARY_BRIEF"
                  ? "Add a primary Project Brief in Documents before analyzing."
                  : extraction.errorCode === "DOCUMENT_NOT_FOUND"
                    ? "The Project Brief changed while analysis was starting. Refresh and try again."
                    : "We couldn't read this Project Brief. Check the document and try again.",
    };
  }

  const startedAt = Date.now();
  let response: Response;
  try {
    response = await requestGeminiAnalysis(
      GEMINI_API_KEY,
      GEMINI_MODEL,
      buildProjectIntelligencePrompt({
        projectName: project.name,
        clientName: project.client.company || project.client.name,
        briefContent: extraction.content,
        truncated: extraction.truncated,
      }),
    );
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    console.error("Gemini project analysis request failed.", {
      projectId,
      documentId: extraction.sourceDocumentId,
      model: GEMINI_MODEL,
      errorCode: timedOut ? "AI_TIMEOUT" : "AI_PROVIDER_UNAVAILABLE",
      errorName: error instanceof Error ? error.name : "UnknownError",
      durationMs: Date.now() - startedAt,
      truncated: extraction.truncated,
      characterCount: extraction.finalCharacterCount,
    });
    return {
      success: false,
      code: timedOut ? "AI_TIMEOUT" : "AI_PROVIDER_UNAVAILABLE",
      message: timedOut
        ? "The project brief took too long to analyze. Please try again."
        : "We couldn't analyze this project right now. Please try again.",
    };
  }

  if (!response.ok) {
    const errorEntry = mapGeminiError(response);
    console.error("Gemini project analysis failed.", {
      projectId,
      documentId: extraction.sourceDocumentId,
      model: GEMINI_MODEL,
      status: response.status,
      code: errorEntry.code,
      durationMs: Date.now() - startedAt,
      truncated: extraction.truncated,
      characterCount: extraction.finalCharacterCount,
    });
    return {
      success: false,
      code: errorEntry.code,
      message: errorEntry.message,
    };
  }

  try {
    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      console.error("Gemini response body could not be read.", {
        projectId,
        documentId: extraction.sourceDocumentId,
        model: GEMINI_MODEL,
        errorCode: timedOut ? "AI_TIMEOUT" : "AI_INVALID_RESPONSE",
        errorName: error instanceof Error ? error.name : "UnknownError",
        durationMs: Date.now() - startedAt,
      });
      return {
        success: false,
        code: timedOut ? "AI_TIMEOUT" : "AI_INVALID_RESPONSE",
        message: timedOut
          ? "The AI analysis took too long to complete. Please try again."
          : "The AI returned an unexpected result. Your existing analysis was not replaced; please try again.",
      };
    }
    const text = getGeminiCandidateText(data);

    if (!text) {
      return {
        success: false,
        code: "AI_INVALID_RESPONSE",
        message: "The AI returned an invalid analysis.",
      };
    }

    const parsed = normalizeGeminiJsonResponse(text);
    const intelligence = projectIntelligenceProviderSchema.parse(parsed);

    return {
      success: true,
      intelligence,
      sourceDocumentId: extraction.sourceDocumentId,
      sourceDocumentName: extraction.sourceDocumentName,
      sourceDocumentUpdatedAt: extraction.sourceDocumentUpdatedAt,
      model: GEMINI_MODEL,
      sourceMetadata: {
        truncated: extraction.truncated,
        originalCharacterCount: extraction.originalCharacterCount,
        finalCharacterCount: extraction.finalCharacterCount,
      },
    };
  } catch (error) {
    console.error("Gemini project analysis validation failed.", {
      projectId,
      documentId: extraction.sourceDocumentId,
      model: GEMINI_MODEL,
      durationMs: Date.now() - startedAt,
      truncated: extraction.truncated,
      characterCount: extraction.finalCharacterCount,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    const reason = error instanceof Error && error.message.includes("valid JSON")
      ? "AI_INVALID_RESPONSE"
      : error instanceof SyntaxError
        ? "AI_INVALID_RESPONSE"
        : "AI_VALIDATION_FAILED";

    return {
      success: false,
      code: reason,
      message: reason === "AI_INVALID_RESPONSE"
        ? "The AI returned an invalid analysis."
        : "The project analysis could not be validated.",
    };
  }
}