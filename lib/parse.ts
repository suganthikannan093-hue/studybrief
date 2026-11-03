import { BriefSchema, type Brief } from "./schema";

export type ParseResult = { ok: true; brief: Brief } | { ok: false; error: string };

/** Pull a JSON object out of model text: strips <think> blocks, code fences and prose. */
export function extractJson(raw: string): string | null {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

export function parseBrief(raw: string): ParseResult {
  const json = extractJson(raw);
  if (!json) return { ok: false, error: "No JSON object found in model output." };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  const r = BriefSchema.safeParse(data);
  if (!r.success) {
    return {
      ok: false,
      error: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "),
    };
  }
  return { ok: true, brief: r.data };
}
