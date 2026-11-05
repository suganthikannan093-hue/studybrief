import { validateGrounding } from "./learning";
import { parseBrief } from "./parse";
import { SYSTEM_PROMPT, NOTES_PROMPT, repairPrompt, userPrompt } from "./prompt";
import { mockBrief } from "./mock";
import { briefJsonSchema, type BriefResponse, type BriefSource, type StudyMode } from "./schema";

type Msg = { role: "system" | "user" | "assistant"; content: string };

interface Provider {
  source: BriefSource;
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** BharatCode by default; mock when no key; OpenAI only when explicitly enabled for local testing. */
export function resolveProvider(env: NodeJS.ProcessEnv = process.env): Provider | null {
  if (env.STUDYBRIEF_MODE === "mock") return null;
  if (env.BHARATCODE_API_KEY) {
    return {
      source: "bharatcode",
      baseUrl: (env.BHARATCODE_BASE_URL || "https://bharatcode.ai/api/model/v1").replace(/\/$/, ""),
      apiKey: env.BHARATCODE_API_KEY,
      model: env.BHARATCODE_MODEL || "qwen-3.8-27b",
    };
  }
  if (env.STUDYBRIEF_TEST_FALLBACK === "openai" && env.OPENAI_API_KEY) {
    return { source: "openai-test-fallback", baseUrl: "https://api.openai.com/v1", apiKey: env.OPENAI_API_KEY, model: "gpt-4o-mini" };
  }
  return null;
}

export class LlmError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

async function chat(p: Provider, messages: Msg[], mode: StudyMode): Promise<string> {
  const body: Record<string, unknown> = {
    model: p.model,
    messages,
    max_tokens: 4000,
    temperature: 0.3,
    response_format: { type: "json_schema", json_schema: { name: "study_brief", schema: { ...briefJsonSchema, required: mode === "notes" ? [...briefJsonSchema.required, "practice"] : briefJsonSchema.required } } },
  };
  // BharatCode docs: reasoning_effort:"none" avoids spending the output budget on reasoning.
  if (p.source === "bharatcode") body.reasoning_effort = "none";

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${p.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    if (res.status === 503 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); // docs: 503 = busy, wait and retry
      continue;
    }
    if (!res.ok) {
      const reqId = res.headers.get("x-request-id");
      const detail = (await res.text()).slice(0, 300);
      throw new LlmError(`Model API error ${res.status}${reqId ? ` (x-request-id ${reqId})` : ""}: ${detail}`, res.status === 401 ? 401 : 502);
    }
    const json = await res.json();
    const choice = json?.choices?.[0];
    if (choice?.finish_reason === "length") throw new LlmError("Model output was cut short (finish_reason: length). Try shorter input.");
    return String(choice?.message?.content ?? "");
  }
  throw new LlmError("Model is busy (503). Please try again in a few seconds.", 503);
}

export async function generateBrief(text: string, mode: StudyMode = "topic"): Promise<BriefResponse> {
  const t0 = Date.now();
  const p = resolveProvider();
  if (!p) return { brief: mockBrief(text, mode), mode, source: "mock", model: "offline-mock", repaired: false, ms: Date.now() - t0 };

  const messages: Msg[] = [
    { role: "system", content: mode === "notes" ? NOTES_PROMPT : SYSTEM_PROMPT },
    { role: "user", content: userPrompt(text) },
  ];
  const first = await chat(p, messages, mode);
  let parsed = parseBrief(first);
  if (parsed.ok && mode === "notes") {
    const error = validateGrounding(parsed.brief, text);
    if (error) parsed = { ok: false, error };
  }
  let repaired = false;
  if (!parsed.ok) {
    repaired = true; // exactly one repair retry
    const second = await chat(p, [...messages, { role: "assistant", content: first }, { role: "user", content: repairPrompt(parsed.error) }], mode);
    parsed = parseBrief(second);
    if (parsed.ok && mode === "notes") {
      const error = validateGrounding(parsed.brief, text);
      if (error) parsed = { ok: false, error };
    }
    if (!parsed.ok) throw new LlmError(`The model's reply failed validation twice: ${parsed.error}`);
  }
  return { brief: parsed.brief, mode, source: p.source, model: p.model, repaired, ms: Date.now() - t0 };
}
