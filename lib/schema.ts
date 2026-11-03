import { z } from "zod";

export const MAX_INPUT_CHARS = 12000;
export const MIN_INPUT_CHARS = 3;

export const BriefSchema = z.object({
  title: z.string().min(1).max(120),
  keyPoints: z.array(z.string().min(1)).min(3).max(8),
  simpleExplanation: z.string().min(20),
  terms: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).min(2).max(10),
  questions: z
    .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
    .min(3)
    .max(6),
  eli15: z.string().min(20),
});
export type Brief = z.infer<typeof BriefSchema>;

export const RequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(MIN_INPUT_CHARS, "Please enter a topic or some text.")
    .max(MAX_INPUT_CHARS, `Input is limited to ${MAX_INPUT_CHARS} characters.`),
});

export type BriefSource = "bharatcode" | "mock" | "openai-test-fallback";
export interface BriefResponse {
  brief: Brief;
  source: BriefSource;
  model: string;
  repaired: boolean;
  ms: number;
}

/** JSON Schema sent to the model (mirrors BriefSchema). */
export const briefJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "keyPoints", "simpleExplanation", "terms", "questions", "eli15"],
  properties: {
    title: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    simpleExplanation: { type: "string" },
    terms: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["term", "definition"],
        properties: { term: { type: "string" }, definition: { type: "string" } },
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["question", "answer"],
        properties: { question: { type: "string" }, answer: { type: "string" } },
      },
    },
    eli15: { type: "string" },
  },
} as const;
