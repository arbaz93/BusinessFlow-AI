import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getGeminiCandidateText, mapGeminiError, normalizeGeminiJsonResponse } from "@/lib/project-ai/response";
import { projectIntelligenceProviderSchema, projectIntelligenceSchema } from "@/lib/project-ai/schemas";
import { buildProjectIntelligencePrompt } from "@/lib/project-ai/prompt";
import { requestGeminiAnalysis } from "@/lib/project-ai/gemini-provider";

describe("project intelligence schema", () => {
  it("accepts a valid structured project intelligence payload", () => {
    const payload = {
      summary: "The client needs a responsive marketing website with a homepage and contact form.",
      requirements: [
        {
          title: "Responsive experience",
          description: "The website must work well across desktop and mobile devices.",
          importance: "HIGH",
        },
      ],
      deliverables: [
        {
          title: "Marketing website",
          description: "A polished marketing website with key information and conversion points.",
        },
      ],
      risks: [
        {
          title: "Unclear content ownership",
          description: "The client has not confirmed who will provide final copy and imagery.",
          severity: "MEDIUM",
        },
      ],
      missingInformation: [
        {
          question: "What is the target launch date?",
          reason: "The brief does not specify a launch deadline.",
        },
      ],
      suggestedTasks: [
        {
          title: "Review source content",
          description: "Collect and review the required marketing content and assets.",
          priority: "HIGH",
        },
      ],
    };

    const parsed = projectIntelligenceSchema.safeParse(payload);
    assert.equal(parsed.success, true);
  });

  it("rejects malformed section values", () => {
    const parsed = projectIntelligenceSchema.safeParse({
      summary: "ok",
      requirements: [{ title: "Req", description: "Need this", importance: "CRITICAL" }],
      deliverables: [],
      risks: [],
      missingInformation: [],
      suggestedTasks: [],
    });

    assert.equal(parsed.success, false);
  });

  it("requires all provider fields and rejects extra fields", () => {
    assert.equal(projectIntelligenceProviderSchema.safeParse({
      summary: "ok",
      requirements: [],
      deliverables: [],
      risks: [],
      missingInformation: [],
    }).success, false);
    assert.equal(projectIntelligenceProviderSchema.safeParse({
      summary: "ok",
      requirements: [],
      deliverables: [],
      risks: [],
      missingInformation: [],
      suggestedTasks: [],
      extra: "unexpected",
    }).success, false);
  });

  it("rejects duplicate stable suggestion IDs in persisted analysis data", () => {
    const task = { suggestionId: "same-id", title: "Task", description: "Description", priority: "MEDIUM" };
    assert.equal(projectIntelligenceSchema.safeParse({
      summary: "ok",
      requirements: [],
      deliverables: [],
      risks: [],
      missingInformation: [],
      suggestedTasks: [task, task],
    }).success, false);
  });
});

describe("Gemini response parsing", () => {
  it("normalizes JSON fenced responses and strips markdown wrappers", () => {
    const json = normalizeGeminiJsonResponse('```json\n{"summary":"ok","requirements":[],"deliverables":[],"risks":[],"missingInformation":[],"suggestedTasks":[]}\n```');
    assert.equal(json.summary, "ok");
    assert.deepEqual(json.requirements, []);
  });

  it("maps provider errors to safe application codes", () => {
    assert.deepEqual(mapGeminiError({ status: 429 }), {
      code: "AI_RATE_LIMITED",
      message: "AI analysis is temporarily unavailable. Please try again later.",
    });
    assert.deepEqual(mapGeminiError({ status: 408 }), {
      code: "AI_TIMEOUT",
      message: "The project brief took too long to analyze. Please try again.",
    });
    assert.equal(mapGeminiError({ status: 429 }).message.includes("RESOURCE_EXHAUSTED"), false);
    assert.equal(mapGeminiError({ status: 403 }).code, "AI_NOT_CONFIGURED");
    assert.equal(mapGeminiError({ status: 503 }).code, "AI_PROVIDER_UNAVAILABLE");
  });

  it("rejects extra prose around JSON and malformed candidate structures", () => {
    assert.throws(() => normalizeGeminiJsonResponse('Here is the result: {"summary":"ok"}'));
    assert.equal(getGeminiCandidateText({ candidates: [{ content: { parts: [{ inlineData: "x" }] } }] }), null);
    assert.equal(getGeminiCandidateText({ candidates: [{ content: { parts: [{ text: '{"summary":"ok"}' }] } }] }), '{"summary":"ok"}');
  });
});

describe("Gemini request boundary", () => {
  it("uses only a mocked fetch implementation in automated tests", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const response = new Response("{}", { status: 200 });
    const mockedFetch: typeof fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return response;
    };

    const actual = await requestGeminiAnalysis("test-key", "gemini-2.5-flash", "brief prompt", mockedFetch);
    assert.equal(actual, response);
    assert.match(requestUrl, /gemini-2.5-flash:generateContent/);
    assert.match(requestUrl, /key=test-key/);
    assert.equal(requestInit?.method, "POST");
    assert.equal((requestInit?.signal as AbortSignal).aborted, false);
    assert.match(String(requestInit?.body), /brief prompt/);
  });

  it("clearly tells Gemini not to infer omitted truncated source text", () => {
    const prompt = buildProjectIntelligencePrompt({
      projectName: "Website redesign",
      clientName: null,
      briefContent: "Source excerpt",
      truncated: true,
    });
    assert.match(prompt, /truncated because it exceeded the analysis input limit/i);
    assert.match(prompt, /Do not assume omitted portions are empty/);
    assert.match(prompt, /untrusted data/);
  });
});
