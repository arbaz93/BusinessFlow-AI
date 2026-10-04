import type { ProjectAnalysisFailureCode } from "@/lib/project-ai/schemas";

export function getProjectAIErrorMessage(code: string | null | undefined) {
  const messages: Record<ProjectAnalysisFailureCode, string> = {
    NO_PRIMARY_BRIEF: "Add or choose a primary Project Brief in Documents before analyzing.",
    DOCUMENT_NOT_FOUND: "The selected Project Brief is no longer available. Check Documents and try again.",
    DOCUMENT_STORAGE_UNAVAILABLE: "Document storage is temporarily unavailable. Please try again shortly.",
    DOCUMENT_ACCESS_DENIED: "The Project Brief could not be accessed. Contact your workspace administrator.",
    UNSUPPORTED_DOCUMENT_TYPE: "This document format isn't supported for AI analysis. Choose a PDF, DOCX, TXT, or Markdown brief.",
    DOCUMENT_EXTRACTION_FAILED: "We couldn't read this Project Brief. Check the document and try again.",
    DOCUMENT_NO_TEXT: "We couldn't extract readable text from this brief. Check that it contains selectable text and try again.",
    DOCUMENT_TOO_LARGE: "This document is too large to analyze. Choose a smaller Project Brief.",
    AI_NOT_CONFIGURED: "AI analysis is not configured correctly. Contact your workspace administrator.",
    AI_PERSISTENCE_FAILED: "The analysis could not be saved. Your previous analysis is unchanged; please try again.",
    AI_ANALYSIS_ALREADY_RUNNING: "An analysis is already running for this brief. Wait for it to finish before retrying.",
    AI_ANALYSIS_STALE: "The primary brief changed during analysis. Analyze the current brief to get an up-to-date result.",
    AI_PROVIDER_UNAVAILABLE: "AI analysis is temporarily unavailable. Please try again shortly.",
    AI_PROVIDER_ERROR: "We couldn't analyze this project right now. Please try again.",
    AI_RATE_LIMITED: "AI analysis is temporarily busy. Please try again shortly.",
    AI_TIMEOUT: "The AI analysis took too long to complete. Please try again.",
    AI_INVALID_RESPONSE: "The AI returned an unexpected result. Your existing analysis was not replaced; please try again.",
    AI_VALIDATION_FAILED: "The analysis result could not be validated. Your existing analysis was not replaced; please try again.",
    UNKNOWN_AI_ERROR: "AI analysis couldn't be completed. Please try again.",
  };

  return code && code in messages
    ? messages[code as ProjectAnalysisFailureCode]
    : messages.UNKNOWN_AI_ERROR;
}
