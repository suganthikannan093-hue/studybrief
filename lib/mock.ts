import type { Brief, StudyMode } from "./schema";

/** Deterministic offline brief so the app is demoable without a key. Clearly labelled in the UI. */
export function mockBrief(text: string, mode: StudyMode = "topic"): Brief {
  const clean = text.replace(/\s+/g, " ").trim();
  const first = clean.split(/[.!?\n]/)[0];
  const topic = (first.length > 48 ? first.slice(0, 48).replace(/\s+\S*$/, "") + "…" : first) || "Your topic";
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  const words = Array.from(new Set(clean.match(/\b[A-Za-z][A-Za-z-]{6,}\b/g) ?? []));
  const pts = sentences.slice(0, 5);
  while (pts.length < 3) pts.push(`[Offline demo] Key idea ${pts.length + 1} about ${topic} would appear here.`);
  const terms = (words.length >= 2 ? words.slice(0, 4) : ["Concept", "Example"]).map((w) => ({
    term: w,
    definition: `[Offline demo] A model-written definition of "${w}" appears here with a BharatCode key.`,
  }));
  const practice = mode === "notes" ? [0, 1, 2].map((index) => {
    // Offline mode only demonstrates mechanics; it does not pretend to generate a real assessment.
    const quote = clean.slice(0, 180);
    const answer = quote || "No source text";
    const choices = ["This is not stated in the notes.", "The notes provide no information.", "This is an unrelated claim."];
    choices.splice(index, 0, answer);
    return { concept: `Demo source recall ${index + 1}`, question: `[Offline demo] Which passage appears in your notes? (Sample ${index + 1})`, choices, correctIndex: index,
      explanation: "Offline sample only. Connect BharatCode for meaningful questions and explanations.", sourceQuote: quote };
  }) : undefined;
  return {
    ...(practice ? { practice } : {}),
    title: `${topic} (offline demo)`,
    keyPoints: pts,
    simpleExplanation: `[Offline demo] This is placeholder text. Add BHARATCODE_API_KEY to .env to get a real explanation of "${topic}" from the BharatCode model API.`,
    terms,
    questions: [1, 2, 3].map((n) => ({
      question: `[Offline demo] Practice question ${n} about ${topic}?`,
      answer: `[Offline demo] The answer to question ${n} is revealed here.`,
    })),
    eli15: `[Offline demo] Imagine explaining "${topic}" to a 15-year-old with a simple everyday analogy. The real version comes from the BharatCode model.`,
  };
}
