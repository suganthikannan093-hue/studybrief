import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession, decodeSessions, recordReview, reviewQueue, validateGrounding } from "@/lib/learning";
import { mockBrief } from "@/lib/mock";
import { BriefSchema, RequestSchema, type BriefResponse } from "@/lib/schema";
import { generateBrief } from "@/lib/llm";
import { briefToMarkdown } from "@/lib/markdown";

const notes = "Binary search needs a sorted list. It compares the target with the middle element and discards half of the remaining search space each step. Its time complexity is O(log n).";
const brief = mockBrief(notes, "notes");
const response: BriefResponse = { brief, mode: "notes", source: "mock", model: "offline-mock", repaired: false, ms: 0 };

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("source-linked practice", () => {
  it("validates notes independently of legacy topic requests", () => {
    expect(RequestSchema.safeParse({ text: "Gravity" }).success).toBe(true);
    expect(RequestSchema.safeParse({ text: "Gravity", mode: "notes" }).success).toBe(false);
    expect(RequestSchema.safeParse({ text: notes, mode: "notes" }).success).toBe(true);
  });
  it("rejects fabricated quotes but allows formatting whitespace", () => {
    expect(validateGrounding(brief, notes.replaceAll(" ", "\n"))).toBeNull();
    const forged = structuredClone(brief);
    forged.practice![0].sourceQuote = "Binary search works on any unsorted array.";
    expect(validateGrounding(forged, notes)).toMatch(/copied exactly/);
    expect(validateGrounding({ ...brief, practice: undefined }, notes)).toMatch(/requires/);
  });
  it("rejects invalid answers and duplicate distractors", () => {
    const invalid = structuredClone(brief); invalid.practice![0].correctIndex = 4;
    expect(BriefSchema.safeParse(invalid).success).toBe(false);
    invalid.practice![0].correctIndex = 0; invalid.practice![0].choices = ["same", "SAME", "other", "third"];
    expect(BriefSchema.safeParse(invalid).success).toBe(false);
  });
  it("exports evidence and correct answer", () => {
    const md = briefToMarkdown(brief);
    expect(md).toContain("## Source-linked practice");
    expect(md).toContain(brief.practice![0].sourceQuote);
  });
  it("repairs a fabricated citation using the model, then validates the repair", async () => {
    vi.stubEnv("BHARATCODE_API_KEY", "test-not-a-real-key"); vi.stubEnv("STUDYBRIEF_MODE", "live");
    const forged = structuredClone(brief); forged.practice![0].sourceQuote = "This sentence was invented by the model.";
    const completion = (value: unknown) => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(value) } }] }));
    const fetcher = vi.fn().mockResolvedValueOnce(completion(forged)).mockResolvedValueOnce(completion(brief));
    vi.stubGlobal("fetch", fetcher);
    const result = await generateBrief(notes, "notes");
    expect(result.repaired).toBe(true); expect(result.mode).toBe("notes"); expect(fetcher).toHaveBeenCalledTimes(2);
    const request = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(request.messages.at(-1).content).toContain("copied exactly");
    expect(request.response_format.json_schema.schema.required).toContain("practice");
  });
  it("refuses fabricated evidence after the one repair attempt", async () => {
    vi.stubEnv("BHARATCODE_API_KEY", "test-not-a-real-key"); vi.stubEnv("STUDYBRIEF_MODE", "live");
    const forged = structuredClone(brief); forged.practice![0].sourceQuote = "Never present in the student's actual notes.";
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(forged) } }] })));
    vi.stubGlobal("fetch", fetcher);
    await expect(generateBrief(notes, "notes")).rejects.toThrow(/failed validation twice/);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("personal review queue", () => {
  const now = 1_800_000_000_000;
  it("schedules mistakes in ten minutes and confident successes later", () => {
    const wrong = recordReview(undefined, false, "high", now);
    expect(wrong.confidentMistakes).toBe(1); expect(wrong.streak).toBe(0);
    expect(wrong.dueAt).toBe(now + 600_000);
    const right = recordReview(wrong, true, "high", now);
    expect(right.dueAt).toBe(now + 3 * 86_400_000); expect(right.confidentMistakes).toBe(1);
    const guessed = recordReview(undefined, true, "low", now);
    expect(guessed.dueAt).toBe(now + 86_400_000);
  });
  it("prioritizes due confident mistakes, and excludes future reviews", () => {
    const session = createSession(response, notes, now);
    session.reviews[0] = recordReview(undefined, true, "high", now);
    session.reviews[2] = recordReview(undefined, false, "high", now - 600_001);
    expect(reviewQueue(session, now, true)).toEqual([2, 1]);
    expect(reviewQueue(session, now)).toEqual([2, 1, 0]);
    expect(reviewQueue(session, now + 3 * 86_400_000, true)).toEqual([2, 1, 0]);
  });
  it("persists notes, progress and scheduling across JSON round trips", () => {
    const session = createSession(response, notes, now);
    session.reviews[0] = recordReview(undefined, false, "high", now);
    expect(decodeSessions(JSON.stringify([session]))).toEqual([session]);
    expect(decodeSessions(null)).toEqual([]);
    expect(() => decodeSessions('{"not":"a library"}')).toThrow();
    expect(() => decodeSessions('[{"response":{}}]')).toThrow();
    expect(decodeSessions(JSON.stringify(Array.from({ length: 15 }, () => session)))).toHaveLength(10);
  });
  it("caps successful intervals and resets the streak on a miss", () => {
    let review = recordReview(undefined, true, "high", now);
    for (let i = 0; i < 100; i++) review = recordReview(review, true, "high", now);
    expect(review.dueAt).toBe(now + 14 * 86_400_000);
    expect(recordReview(review, false, "medium", now).streak).toBe(0);
  });
});
