import type { Brief } from "./schema";

export function briefToMarkdown(b: Brief, includeEli15 = true): string {
  const out: string[] = [`# ${b.title}`, "", "## Key points", ...b.keyPoints.map((p) => `- ${p}`), ""];
  out.push("## Simple explanation", b.simpleExplanation, "");
  out.push("## Important terms", ...b.terms.map((t) => `- **${t.term}**: ${t.definition}`), "");
  out.push("## Practice questions");
  b.questions.forEach((q, i) => out.push(`${i + 1}. ${q.question}`, `   - *Answer:* ${q.answer}`));
  out.push("");
  if (includeEli15) out.push("## Explain like I'm 15", b.eli15, "");
  out.push("---", "_Generated with StudyBrief, built for the BharatCode Build League._", "");
  return out.join("\n");
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "study-brief";
}
