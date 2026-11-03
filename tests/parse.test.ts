import { describe, expect, it } from "vitest";
import { extractJson, parseBrief } from "@/lib/parse";
import { BriefSchema, RequestSchema, MAX_INPUT_CHARS } from "@/lib/schema";
import { mockBrief } from "@/lib/mock";
import { briefToMarkdown, slugify } from "@/lib/markdown";
import { resolveProvider } from "@/lib/llm";

const good = {
  title: "Photosynthesis",
  keyPoints: ["Plants make food", "Uses sunlight", "Releases oxygen"],
  simpleExplanation: "Plants turn light, water and CO2 into sugar and oxygen.",
  terms: [{ term: "Chlorophyll", definition: "Green pigment" }, { term: "Glucose", definition: "A sugar" }],
  questions: [
    { question: "What gas is released?", answer: "Oxygen" },
    { question: "Where does it happen?", answer: "Chloroplasts" },
    { question: "What is the energy source?", answer: "Sunlight" },
  ],
  eli15: "Leaves are tiny solar kitchens that cook sugar from air and water.",
};

describe("extractJson / parseBrief", () => {
  it("parses plain JSON", () => expect(parseBrief(JSON.stringify(good)).ok).toBe(true));
  it("strips code fences", () => expect(parseBrief("```json\n" + JSON.stringify(good) + "\n```").ok).toBe(true));
  it("strips <think> blocks and prose", () => {
    expect(parseBrief(`<think>hmm {not json}</think>Sure! ${JSON.stringify(good)} hope it helps`).ok).toBe(true);
  });
  it("returns null when no object", () => expect(extractJson("no json here")).toBeNull());
  it("reports invalid JSON", () => {
    const r = parseBrief("{ title: oops }");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Invalid JSON/);
  });
  it("reports schema errors with paths", () => {
    const r = parseBrief(JSON.stringify({ ...good, questions: [] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/questions/);
  });
});

describe("request limits", () => {
  it("rejects empty and too-long input", () => {
    expect(RequestSchema.safeParse({ text: "  " }).success).toBe(false);
    expect(RequestSchema.safeParse({ text: "x".repeat(MAX_INPUT_CHARS + 1) }).success).toBe(false);
    expect(RequestSchema.safeParse({ text: "Gravity" }).success).toBe(true);
  });
});

describe("mock + markdown", () => {
  it("mock output satisfies the schema and is labelled", () => {
    const b = mockBrief("Gravity");
    expect(BriefSchema.safeParse(b).success).toBe(true);
    expect(b.title).toMatch(/offline demo/);
  });
  it("renders markdown with every section", () => {
    const md = briefToMarkdown(good);
    for (const h of ["# Photosynthesis", "## Key points", "## Important terms", "## Practice questions", "Explain like I'm 15"]) expect(md).toContain(h);
    expect(slugify("Hello, World!")).toBe("hello-world");
  });
});

describe("provider selection", () => {
  it("defaults to mock with no key", () => expect(resolveProvider({} as NodeJS.ProcessEnv)).toBeNull());
  it("uses BharatCode defaults when key is set", () => {
    const p = resolveProvider({ BHARATCODE_API_KEY: "k" } as unknown as NodeJS.ProcessEnv);
    expect(p).toMatchObject({ source: "bharatcode", baseUrl: "https://bharatcode.ai/api/model/v1", model: "qwen-3.8-27b" });
  });
  it("never uses OpenAI unless the test fallback is explicitly enabled", () => {
    expect(resolveProvider({ OPENAI_API_KEY: "o" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(resolveProvider({ OPENAI_API_KEY: "o", STUDYBRIEF_TEST_FALLBACK: "openai" } as unknown as NodeJS.ProcessEnv)?.source).toBe("openai-test-fallback");
  });
  it("prefers BharatCode over the test fallback", () => {
    expect(resolveProvider({ BHARATCODE_API_KEY: "k", OPENAI_API_KEY: "o", STUDYBRIEF_TEST_FALLBACK: "openai" } as unknown as NodeJS.ProcessEnv)?.source).toBe("bharatcode");
  });
});
