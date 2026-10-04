import "server-only";

import { env } from "@/lib/env";
import { buildRecentAssistantContext, type AssistantContextMessage } from "@/lib/assistant/context";
import {
  getAssistantErrorMessage,
  isAssistantConfigurationValid,
  mapAssistantProviderException,
  mapAssistantProviderStatus,
  parseAssistantProviderResponse,
} from "@/lib/assistant/provider-response";
import type { AssistantProviderErrorCode } from "@/lib/assistant/provider-response";
import { ASSISTANT_RESPONSE_MAX_LENGTH } from "@/lib/assistant/schemas";
import { requestGeminiAssistant } from "@/lib/project-ai/gemini-provider";
import { buildAssistantSystemInstruction } from "@/lib/assistant/memory-context";
import type { ResolvedAssistantContext } from "@/lib/assistant/context/types";

export { buildAssistantSystemInstruction as buildSystemInstruction };

export type GenerateAssistantResponseResult =
  | { success: true; content: string }
  | { success: false; code: AssistantProviderErrorCode; error: string };

export async function generateAssistantResponse(
  messages: AssistantContextMessage[],
  diagnosticContext: { organizationId: string; conversationId: string; userId: string },
  options?: { trustedContext?: ResolvedAssistantContext; memorySummary?: string | null },
): Promise<GenerateAssistantResponseResult> {
  const apiKey = env.GEMINI_API_KEY;
  const modelName = env.GEMINI_MODEL;
  if (!isAssistantConfigurationValid(apiKey, modelName)) {
    return { success: false, code: "AI_NOT_CONFIGURED", error: getAssistantErrorMessage("AI_NOT_CONFIGURED") };
  }

  const context = buildRecentAssistantContext(messages);
  const startedAt = Date.now();
  try {
    const response = await requestGeminiAssistant(
      apiKey,
      modelName,
       buildAssistantSystemInstruction(options?.trustedContext, options?.memorySummary),
      context.map((message) => ({
        role: message.role === "ASSISTANT" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    );
    if (!response.ok) {
      const code = mapAssistantProviderStatus(response.status);
      console.error("AI Assistant provider request failed.", {
        ...diagnosticContext,
        model: modelName,
        status: response.status,
        errorCode: code,
        durationMs: Date.now() - startedAt,
      });
      return { success: false, code, error: getAssistantErrorMessage(code) };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      const code = mapAssistantProviderException(error) === "AI_TIMEOUT" ? "AI_TIMEOUT" : "AI_INVALID_RESPONSE";
      console.error("AI Assistant provider response could not be read.", {
        ...diagnosticContext,
        model: modelName,
        errorCode: code,
        errorName: error instanceof Error ? error.name : "UnknownError",
        durationMs: Date.now() - startedAt,
      });
      return { success: false, code, error: getAssistantErrorMessage(code) };
    }

    const content = parseAssistantProviderResponse(payload);
    if (!content || content.length > ASSISTANT_RESPONSE_MAX_LENGTH) {
      console.error("AI Assistant provider response failed validation.", {
        ...diagnosticContext,
        model: modelName,
        errorCode: "AI_INVALID_RESPONSE",
        durationMs: Date.now() - startedAt,
      });
      return {
        success: false,
        code: "AI_INVALID_RESPONSE",
        error: getAssistantErrorMessage("AI_INVALID_RESPONSE"),
      };
    }

    return { success: true, content };
  } catch (error) {
    const code: AssistantProviderErrorCode = mapAssistantProviderException(error);
    console.error("AI Assistant provider request could not be completed.", {
      ...diagnosticContext,
      model: modelName,
      errorCode: code,
      errorName: error instanceof Error ? error.name : "UnknownError",
      durationMs: Date.now() - startedAt,
    });
    return { success: false, code, error: getAssistantErrorMessage(code) };
  }
}
