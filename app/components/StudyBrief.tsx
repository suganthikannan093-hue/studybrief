"use client";
import { useEffect, useState } from "react";
import { MAX_INPUT_CHARS, type BriefResponse } from "@/lib/schema";
import { briefToMarkdown, slugify } from "@/lib/markdown";

const EXAMPLES = [
  { label: "Photosynthesis", text: "Photosynthesis" },
  { label: "How UPI works", text: "How does UPI (Unified Payments Interface) work in India?" },
  { label: "Binary search", text: "Binary search algorithm and its time complexity" },
  {
    label: "Notes: French Revolution",
    text: "The French Revolution (1789-1799) began with a fiscal crisis and the calling of the Estates-General. The Third Estate formed the National Assembly and took the Tennis Court Oath. The storming of the Bastille on 14 July 1789 became a symbol of the revolt. The Declaration of the Rights of Man set out liberty and equality. The monarchy was abolished in 1792, the Reign of Terror followed under Robespierre, and Napoleon took power in 1799.",
  },
];

const SOURCE_LABEL: Record<string, string> = {
  bharatcode: "BharatCode model API",
  mock: "Offline demo (no API key)",
  "openai-test-fallback": "TEST FALLBACK (OpenAI, not for submission)",
};

export default function StudyBrief() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BriefResponse | null>(null);
  const [eli15, setEli15] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<{ source: string; model: string } | null>(null);

  useEffect(() => {
    fetch("/api/brief").then((r) => r.json()).then(setMode).catch(() => {});
  }, []);

  const tooLong = text.length > MAX_INPUT_CHARS;

  async function generate() {
    if (!text.trim() || tooLong) return;
    setLoading(true);
    setError(null);
    setFlipped({});
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const md = data ? briefToMarkdown(data.brief) : "";
  async function copy() {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  function download() {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(data.brief.title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="wrap">
      <header className="hero">
        <div className="logo">📘 StudyBrief</div>
        <p className="tag">Paste a topic, article or notes. Get key points, a simple explanation, terms, a practice quiz and an ELI15 version.</p>
        {mode && (
          <span className={`pill ${mode.source}`} data-testid="mode-pill">
            {SOURCE_LABEL[mode.source]} · {mode.model}
          </span>
        )}
      </header>

      <section className="card input">
        <div className="examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} className="chip" onClick={() => setText(ex.text)}>{ex.label}</button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. 'Newton's laws of motion' or paste an article / your class notes…"
          rows={7}
          aria-label="Topic or text"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
        />
        <div className="row">
          <span className={`count ${tooLong ? "bad" : ""}`}>{text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}</span>
          <button className="primary" onClick={generate} disabled={loading || !text.trim() || tooLong}>
            {loading ? "Generating…" : "Generate study brief"}
          </button>
        </div>
        {tooLong && <p className="err">Input is too long. Trim it to {MAX_INPUT_CHARS.toLocaleString()} characters.</p>}
        {error && <p className="err" role="alert">⚠️ {error}</p>}
      </section>

      {loading && (
        <section className="grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card skeleton" />)}
        </section>
      )}

      {data && !loading && (
        <>
          <div className="toolbar">
            <h1>{data.brief.title}</h1>
            <div className="actions">
              <label className="toggle">
                <input type="checkbox" checked={eli15} onChange={(e) => setEli15(e.target.checked)} /> Explain like I&apos;m 15
              </label>
              <button onClick={copy}>{copied ? "Copied ✓" : "Copy Markdown"}</button>
              <button onClick={download}>Download .md</button>
            </div>
          </div>
          <p className="meta">
            Source: <b>{SOURCE_LABEL[data.source]}</b> · {data.model} · {(data.ms / 1000).toFixed(1)}s
            {data.repaired && " · repaired once after validation"}
          </p>

          {eli15 && (
            <section className="card eli">
              <h2>🧒 Explain like I&apos;m 15</h2>
              <p>{data.brief.eli15}</p>
            </section>
          )}

          <section className="grid">
            <div className="card">
              <h2>🔑 Key points</h2>
              <ul>{data.brief.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
            <div className="card">
              <h2>💡 Simple explanation</h2>
              <p>{data.brief.simpleExplanation}</p>
            </div>
            <div className="card wide">
              <h2>📖 Important terms</h2>
              <dl className="terms">
                {data.brief.terms.map((t, i) => (
                  <div key={i}><dt>{t.term}</dt><dd>{t.definition}</dd></div>
                ))}
              </dl>
            </div>
            <div className="card wide">
              <h2>📝 Practice quiz <small>click a card to reveal the answer</small></h2>
              <div className="quiz">
                {data.brief.questions.map((q, i) => (
                  <button
                    key={i}
                    className={`flip ${flipped[i] ? "on" : ""}`}
                    onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                    aria-pressed={!!flipped[i]}
                  >
                    <div className="inner">
                      <div className="face front"><span>Q{i + 1}</span>{q.question}</div>
                      <div className="face back"><span>Answer</span>{q.answer}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <footer>Built for the BharatCode Build League · AI calls via the BharatCode model API · MIT licensed</footer>
    </main>
  );
}
