import { NextResponse } from "next/server";
import { RequestSchema } from "@/lib/schema";
import { generateBrief, LlmError, resolveProvider } from "@/lib/llm";
import { checkRate, clientIp, release, tryAcquire } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  const p = resolveProvider();
  return NextResponse.json({ source: p?.source ?? "mock", model: p?.model ?? "offline-mock" });
}

export async function POST(req: Request) {
  const rate = checkRate(clientIp(req));
  if (!rate.ok) {
    const mins = Math.ceil(rate.retryAfterSec / 60);
    return NextResponse.json(
      { error: `You've made a lot of briefs in a short time. Please wait about ${mins} minute${mins === 1 ? "" : "s"} and try again.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  if (!tryAcquire()) {
    return NextResponse.json(
      { error: "StudyBrief is busy with other students right now. Please try again in a few seconds." },
      { status: 429, headers: { "Retry-After": "10" } },
    );
  }
  try {
    return NextResponse.json(await generateBrief(parsed.data.text, parsed.data.mode));
  } catch (e) {
    const status = e instanceof LlmError ? e.status : 500;
    console.error("[studybrief]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unexpected error" }, { status });
  } finally {
    release();
  }
}
