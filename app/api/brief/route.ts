import { NextResponse } from "next/server";
import { RequestSchema } from "@/lib/schema";
import { generateBrief, LlmError, resolveProvider } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  const p = resolveProvider();
  return NextResponse.json({ source: p?.source ?? "mock", model: p?.model ?? "offline-mock" });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    return NextResponse.json(await generateBrief(parsed.data.text));
  } catch (e) {
    const status = e instanceof LlmError ? e.status : 500;
    console.error("[studybrief]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unexpected error" }, { status });
  }
}
