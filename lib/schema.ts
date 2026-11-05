import { z } from "zod";

export const MAX_INPUT_CHARS = 12000;
export const MIN_INPUT_CHARS = 3;

export const PracticeSchema = z.object({
  concept: z.string().min(1).max(120),
  question: z.string().min(1).max(500),
  choices: z.array(z.string().trim().min(1).max(400)).length(4)
    .refine((choices) => new Set(choices.map((c) => c.toLowerCase())).size === 4, "Choices must be distinct"),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(1000),
  sourceQuote: z.string().min(12).max(1500),
});
export type Practice = z.infer<typeof PracticeSchema>;
export type StudyMode = "topic" | "notes";

export const BriefSchema = z.object({
  practice: z.array(PracticeSchema).min(3).max(6).optional(),
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
  mode: z.enum(["topic", "notes"]).default("topic"),
  text: z
    .string()
    .trim()
    .min(MIN_INPUT_CHARS, "Please enter a topic or some text.")
    .max(MAX_INPUT_CHARS, `Input is limited to ${MAX_INPUT_CHARS} characters.`),
}).superRefine((value, ctx) => {
  if (value.mode === "notes" && value.text.length < 80) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["text"], message: "Paste at least 80 characters of notes for source-linked practice, or use Explore a topic." });
});

export type BriefSource = "bharatcode" | "mock" | "openai-test-fallback";
export interface BriefResponse {
  mode?: StudyMode;
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
    practice: {
      type: "array", minItems: 3, maxItems: 6,
      items: {
        type: "object", additionalProperties: false,
        required: ["concept", "question", "choices", "correctIndex", "explanation", "sourceQuote"],
        properties: {
          concept: { type: "string" }, question: { type: "string" },
          choices: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" }, sourceQuote: { type: "string" },
        },
      },
    },
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
