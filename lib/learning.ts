import { z } from "zod";
import { BriefSchema, type Brief, type BriefResponse } from "./schema";

const normalized = (text: string) => text.replace(/\s+/g, " ").trim();

/** Exact source membership, not a semantic truth/entailment check. */
export function validateGrounding(brief: Brief, notes: string): string | null {
  if (!brief.practice?.length) return "Notes mode requires at least 3 source-linked practice questions.";
  const source = normalized(notes);
  for (const [index, q] of brief.practice.entries()) {
    if (!source.includes(normalized(q.sourceQuote))) return `practice.${index}.sourceQuote must be copied exactly from the notes; do not invent evidence.`;
  }
  return null;
}

const ReviewSchema = z.object({
  attempts: z.number().int().min(0), correct: z.number().int().min(0), streak: z.number().int().min(0),
  confidentMistakes: z.number().int().min(0), dueAt: z.number().finite().min(0),
  lastCorrect: z.boolean(), lastConfidence: z.enum(["low", "medium", "high"]),
});
export type Review = z.infer<typeof ReviewSchema>;
export type Confidence = Review["lastConfidence"];
export const SessionSchema = z.object({
  id: z.string().min(1).max(120), createdAt: z.number().finite().min(0),
  notes: z.string().max(12000),
  response: z.object({ brief: BriefSchema, source: z.enum(["bharatcode", "mock", "openai-test-fallback"]),
    model: z.string(), repaired: z.boolean(), ms: z.number(), mode: z.enum(["topic", "notes"]).optional() }),
  reviews: z.record(z.string(), ReviewSchema),
});
export type Session = z.infer<typeof SessionSchema>;
export const STORAGE_KEY = "studybrief.revision.v1";
export const MAX_SESSIONS = 10;

export function createSession(response: BriefResponse, notes: string, now = Date.now()): Session {
  return { id: globalThis.crypto.randomUUID(), createdAt: now, notes, response, reviews: {} };
}

/** Transparent scheduling heuristic; intervals are not a validated mastery estimate. */
export function recordReview(previous: Review | undefined, correct: boolean, confidence: Confidence, now: number): Review {
  const streak = correct ? (previous?.streak ?? 0) + 1 : 0;
  const days = confidence === "high" ? Math.min(14, 3 * 2 ** Math.min(streak - 1, 3)) : 1;
  return {
    attempts: (previous?.attempts ?? 0) + 1, correct: (previous?.correct ?? 0) + Number(correct), streak,
    confidentMistakes: (previous?.confidentMistakes ?? 0) + Number(!correct && confidence === "high"),
    dueAt: now + (correct ? days * 86_400_000 : 10 * 60_000),
    lastCorrect: correct, lastConfidence: confidence,
  };
}

export function reviewQueue(session: Session, now: number, dueOnly = false): number[] {
  return (session.response.brief.practice ?? []).map((_, i) => i)
    .filter((i) => !dueOnly || !session.reviews[i] || session.reviews[i].dueAt <= now)
    .sort((a, b) => {
      const rank = (i: number) => {
        const r = session.reviews[i];
        if (r && r.dueAt <= now && !r.lastCorrect && r.lastConfidence === "high") return 0;
        if (r && r.dueAt <= now && !r.lastCorrect) return 1;
        if (!r) return 2;
        return r.dueAt <= now ? 3 : 4;
      };
      return rank(a) - rank(b) || (session.reviews[a]?.dueAt ?? 0) - (session.reviews[b]?.dueAt ?? 0) || a - b;
    });
}

export function decodeSessions(raw: string | null): Session[] {
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Invalid saved library");
  return data.slice(0, MAX_SESSIONS).map((item) => SessionSchema.parse(item));
}
