import { getGeminiCandidateText, normalizeGeminiJsonResponse } from "@/lib/project-ai/response";
import { assistantResponseSchema } from "@/lib/assistant/schemas";

export type AssistantProviderErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "AI_RATE_LIMITED"
  | "AI_INVALID_RESPONSE"
  | "UNKNOWN_AI_ERROR";

export function isAssistantConfigurationValid(apiKey: string | undefined, modelName: string): apiKey is string {
  return Boolean(apiKey) && /^gemini-[A-Za-z0-9.-]+$/.test(modelName);
}

export function mapAssistantProviderException(error: unknown): AssistantProviderErrorCode {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
    ? "AI_TIMEOUT"
    : "AI_PROVIDER_UNAVAILABLE";
}

export function mapAssistantProviderStatus(status: number): AssistantProviderErrorCode {
  if (status === 429) return "AI_RATE_LIMITED";
  if (status === 408 || status === 504) return "AI_TIMEOUT";
  if (status === 401 || status === 403) return "AI_NOT_CONFIGURED";
  if (status >= 500) return "AI_PROVIDER_UNAVAILABLE";
  return "UNKNOWN_AI_ERROR";
}

export function parseAssistantProviderResponse(value: unknown): string | null {
  const text = getGeminiCandidateText(value);
  if (!text) return null;

  try {
    const parsed = assistantResponseSchema.safeParse(normalizeGeminiJsonResponse(text));
    return parsed.success ? parsed.data.content : null;
  } catch {
    return null;
  }
}

export function getAssistantErrorMessage(code: AssistantProviderErrorCode) {
  switch (code) {
    case "AI_NOT_CONFIGURED":
      return "AI Assistant is not configured.";
    case "AI_PROVIDER_UNAVAILABLE":
      return "The AI service is temporarily unavailable. Please try again.";
    case "AI_TIMEOUT":
      return "The AI response took too long. Please try again.";
    case "AI_RATE_LIMITED":
      return "The AI service is temporarily busy. Please try again shortly.";
    case "AI_INVALID_RESPONSE":
      return "The AI returned an unexpected response. Please try again.";
    case "UNKNOWN_AI_ERROR":
      return "We couldn't generate a response. Please try again.";
  }
}
