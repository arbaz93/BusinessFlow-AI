export function normalizeGeminiJsonResponse(rawText: string) {
  const trimmed = rawText.trim();

  if (!trimmed) {
    throw new Error("AI response was empty.");
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const normalized = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(normalized);
  } catch {
    throw new Error("AI response was not valid JSON.");
  }
}

export function getGeminiCandidateText(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("candidates" in value) || !Array.isArray(value.candidates)) return null;
  const first = value.candidates[0];
  if (!first || typeof first !== "object" || !("content" in first) || !first.content || typeof first.content !== "object") return null;
  if (!("parts" in first.content) || !Array.isArray(first.content.parts)) return null;
  const textPart = first.content.parts.find(
    (part: unknown): part is { text: string } => Boolean(part && typeof part === "object" && "text" in part && typeof part.text === "string"),
  );
  return textPart?.text ?? null;
}

export function mapGeminiError(response: Pick<Response, "status">) {
  if (response.status === 429) {
    return { code: "AI_RATE_LIMITED", message: "AI analysis is temporarily unavailable. Please try again later." } as const;
  }

  if (response.status === 408 || response.status === 504) {
    return { code: "AI_TIMEOUT", message: "The project brief took too long to analyze. Please try again." } as const;
  }

  if (response.status === 401 || response.status === 403) {
    return { code: "AI_NOT_CONFIGURED", message: "AI analysis is not configured correctly. Contact your workspace administrator." } as const;
  }

  if (response.status >= 500) {
    return { code: "AI_PROVIDER_UNAVAILABLE", message: "AI analysis is temporarily unavailable. Please try again shortly." } as const;
  }

  if (response.status >= 400) {
    return { code: "AI_PROVIDER_ERROR", message: "We couldn't analyze this project right now. Please try again." } as const;
  }

  return { code: "AI_PROVIDER_ERROR", message: "We couldn't analyze this project right now. Please try again." } as const;
}
