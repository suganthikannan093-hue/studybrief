"use client";
import { useEffect, useState } from "react";
import type { BriefResponse } from "@/lib/schema";
import { createSession, decodeSessions, MAX_SESSIONS, recordReview, reviewQueue, STORAGE_KEY, type Confidence, type Session } from "@/lib/learning";

export default function RevisionLab({ incoming }: { incoming: { response: BriefResponse; notes: string } | null }) {
  const [library, setLibrary] = useState<Session[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [queue, setQueue] = useState<number[]>([]);
  const [position, setPosition] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [checked, setChecked] = useState(false);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState({ correct: 0, answered: 0, confidentMistakes: 0 });
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    try { setLibrary(decodeSessions(localStorage.getItem(STORAGE_KEY))); }
    catch { setStorageError("Saved sessions could not be read. New practice still works, but older data may be unavailable."); }
    setReady(true);
    const timer = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!incoming?.response.brief.practice?.length) return;
    const session = createSession(incoming.response, incoming.notes);
    setLibrary((previous) => [session, ...previous].slice(0, MAX_SESSIONS));
    setActive(session.id); setRunning(false);
  }, [incoming]);

  // Persist only after hydration. localStorage failures leave practice usable in memory.
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(library)); }
    catch { setStorageError("Browser storage is unavailable or full. Progress is kept only while this page stays open."); }
  }, [library, ready]);

  const session = library.find((s) => s.id === active);
  const questionIndex = queue[position];
  const question = session?.response.brief.practice?.[questionIndex];
  const dueCount = library.reduce((sum, s) => sum + reviewQueue(s, clock, true).length, 0);

  function start(s: Session, dueOnly: boolean) {
    setActive(s.id); setQueue(reviewQueue(s, Date.now(), dueOnly)); setPosition(0);
    setChoice(null); setConfidence(null); setChecked(false); setRunning(true);
    setScore({ correct: 0, answered: 0, confidentMistakes: 0 });
  }
  function check() {
    if (!session || !question || choice === null || !confidence || checked) return;
    const correct = choice === question.correctIndex;
    const review = recordReview(session.reviews[questionIndex], correct, confidence, Date.now());
    setLibrary((previous) => previous.map((s) => s.id !== session.id ? s : { ...s, reviews: { ...s.reviews, [questionIndex]: review } }));
    setScore((s) => ({ correct: s.correct + Number(correct), answered: s.answered + 1, confidentMistakes: s.confidentMistakes + Number(!correct && confidence === "high") }));
    setChecked(true); setClock(Date.now());
  }
  function next() { setPosition((p) => p + 1); setChoice(null); setConfidence(null); setChecked(false); }
  function remove(id: string) {
    setLibrary((previous) => previous.filter((s) => s.id !== id));
    if (active === id) { setActive(null); setRunning(false); }
  }

  return <section className="revision" aria-label="Revision library">
    <div className="section-heading"><div><p className="eyebrow">Your revision loop</p><h2>Find the gaps. Come back stronger.</h2></div><span className="pill">{dueCount} new or due questions</span></div>
    <p className="muted">Answer before revealing the evidence. Missed questions return in 10 minutes; correct answers return in 1–14 days, depending on confidence and streak.</p>
    <p className="meta">The latest {MAX_SESSIONS} sessions, notes and progress stay in this browser. Anyone using this browser can access them. Delete a session to remove its saved copy. Quiz scores are practice results, not a mastery estimate.</p>
    {storageError && <p role="status" className="err">{storageError}</p>}
    {ready && !library.length && <div className="empty-state">Choose “Revise my notes” above to build your first source-linked practice session.</div>}
    <div className="library">
      {library.map((s) => <article className={`card library-item ${s.id === active ? "selected-session" : ""}`} key={s.id}>
        <div><h3>{s.response.brief.title}</h3><p className="meta">{new Date(s.createdAt).toLocaleDateString()} · {reviewQueue(s, clock, true).length} new or due · {Object.keys(s.reviews).length}/{s.response.brief.practice?.length} questions attempted</p>
          {Object.entries(s.reviews).some(([, r]) => !r.lastCorrect) && <p className="gap-summary">Revisit: {Object.entries(s.reviews).filter(([, r]) => !r.lastCorrect).map(([index, r]) => `${s.response.brief.practice?.[Number(index)]?.concept ?? "Question"}${r.lastConfidence === "high" ? " (confident mistake)" : ""}`).join(" · ")}</p>}
          {s.response.source === "mock" && <span className="pill mock">Offline samples · not an assessment</span>}</div>
        <div className="actions"><button onClick={() => start(s, true)} disabled={!reviewQueue(s, clock, true).length}>Review due</button><button onClick={() => start(s, false)}>Practice all</button><button aria-label={`Delete ${s.response.brief.title}`} onClick={() => remove(s.id)}>Delete</button></div>
      </article>)}
    </div>
    {running && session && <div className="card practice-panel">
      <div className="row"><span className="eyebrow">{session.response.brief.title}</span><button onClick={() => setRunning(false)}>Close practice</button></div>
      {session.response.source === "mock" && <p className="err">Offline demonstration: these sample questions only show the workflow. Connect BharatCode for real practice.</p>}
      {question ? <>
        <p className="meta">Question {position + 1} of {queue.length} · {question.concept}</p>
        <h3>{question.question}</h3>
        <fieldset className="choice-list" disabled={checked}><legend className="sr-only">Choose an answer</legend>
          {question.choices.map((option, i) => <label key={i} className={`answer-choice ${choice === i ? "chosen" : ""} ${checked && i === question.correctIndex ? "correct-choice" : ""}`}><input type="radio" name="practice-choice" value={i} checked={choice === i} onChange={() => setChoice(i)} /><span>{option}</span></label>)}
        </fieldset>
        <fieldset className="confidence" disabled={checked}><legend>How confident are you?</legend>{(["low", "medium", "high"] as const).map((value) => <label key={value}><input type="radio" name="confidence" checked={confidence === value} onChange={() => setConfidence(value)} />{value === "low" ? "Guessing" : value === "medium" ? "Somewhat sure" : "Very sure"}</label>)}</fieldset>
        {!checked ? <button className="primary" onClick={check} disabled={choice === null || !confidence}>Check answer</button> : <div className="feedback" role="status">
          <h3>{choice === question.correctIndex ? "Correct" : confidence === "high" ? "A confident mistake — worth revisiting" : "A gap worth revisiting"}</h3>
          <p><strong>Answer:</strong> {question.choices[question.correctIndex]}</p><p>{question.explanation}</p>
          <details open><summary>Evidence from your notes</summary><blockquote>{question.sourceQuote}</blockquote><p className="meta">Quote text was checked against your notes{session.response.source === "mock" ? " in offline mode" : " on the server"}. Matching text does not prove the AI’s interpretation is correct.</p><details><summary>Read the full original notes</summary><p className="source-notes">{session.notes}</p></details></details>
          <p className="meta">Review scheduled: {new Date(session.reviews[questionIndex]?.dueAt ?? clock).toLocaleString()}</p>
          <button className="primary" onClick={next}>{position + 1 === queue.length ? "See session results" : "Next question"}</button>
        </div>}
      </> : <div role="status"><p className="eyebrow">Session complete</p><h3>{score.correct} / {score.answered} correct in this round</h3><p>{score.confidentMistakes} confident mistakes. Your missed questions are scheduled first when due. Practicing again immediately may reflect answer recall rather than lasting learning.</p><button onClick={() => start(session, false)}>Practice all again</button></div>}
    </div>}
  </section>;
}
