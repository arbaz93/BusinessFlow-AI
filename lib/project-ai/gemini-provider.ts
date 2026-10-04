export const GEMINI_REQUEST_TIMEOUT_MS = 60_000;

const GEMINI_GENERATE_CONTENT_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiRequestPayload = {
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
  };
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
};

export function createGeminiRequest(payload: GeminiRequestPayload): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(GEMINI_REQUEST_TIMEOUT_MS),
    body: JSON.stringify(payload),
  };
}

export function createGeminiGenerateContentRequest(prompt: string): RequestInit {
  return createGeminiRequest({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
  });
}

async function requestGemini(
  apiKey: string,
  modelName: string,
  payload: GeminiRequestPayload,
  fetchImplementation: typeof fetch = fetch,
) {
  const url = `${GEMINI_GENERATE_CONTENT_URL}/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  return fetchImplementation(url, createGeminiRequest(payload));
}

export function requestGeminiAnalysis(
  apiKey: string,
  modelName: string,
  prompt: string,
  fetchImplementation: typeof fetch = fetch,
) {
  return requestGemini(apiKey, modelName, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  }, fetchImplementation);
}

export function requestGeminiAssistant(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  contents: GeminiRequestPayload["contents"],
  fetchImplementation: typeof fetch = fetch,
) {
  return requestGemini(apiKey, modelName, {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { responseMimeType: "application/json" },
  }, fetchImplementation);
}
