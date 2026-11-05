# StudyBrief full feature walkthrough

[Watch or download the MP4](demo.mp4) · 1 minute 58 seconds · 1440 × 1000 · H.264 · silent with on-screen captions.

Recorded on 2026-11-05 against a local production build. Notes and topic generation use the real BharatCode API (`qwen-3.8-27b`). The offline chapter uses a separate server explicitly forced to mock mode. Public sample notes are used; no API keys appear in the browser or video. Two model-waiting sections (40 seconds total) were removed. No question responses, scores, storage values, clocks or review dates were fabricated or accelerated.

The walkthrough deliberately selects one wrong answer with high confidence. It verifies that progress survives a page reload, that all completed questions have future review dates, and that deletion removes the saved session. Clipboard copy, file download and input-limit feedback are also exercised. Browser diagnostics reported no uncaught page errors.

## Chapters

- **00:00** — StudyBrief · notes to lasting recall. A real browser walkthrough: source-linked practice, confidence, evidence and saved reviews.
- **00:05** — 1 · Bring your class notes. Notes mode stays tied to your source. The overview is AI-generated; practice quotes are checked against your notes.
- **00:15** — 2 · A personal revision session. 5 questions generated live with BharatCode. Your notes and progress are saved in this browser.
- **00:19** — 3 · Confidence before feedback. For this demonstration, we deliberately choose a wrong answer with high confidence.
- **00:23** — 4 · Reveal the misconception and evidence. The exact quote is present in the notes. Quote matching helps inspection; it does not prove the AI’s interpretation.
- **00:32** — Answer correctly, but admit uncertainty. Confidence changes the next review interval. Every question can be scored only once per round.
- **00:44** — 5 · A transparent round result. A practice score and confident-mistake count, without claiming mastery or improved learning.
- **00:50** — 6 · Reload: your progress survives. Missed concepts remain visible. Wrong answers return in 10 minutes; correct answers return in 1–14 days.
- **00:55** — Review due respects the schedule. The button is disabled until a question is due. No clock or saved due dates are altered in this recording.
- **00:59** — 7 · Explore a topic. General-knowledge briefs remain available. Topic mode does not claim source verification or create a review session.
- **01:07** — 8 · A readable study brief. Key points, a simple explanation and important terms, powered by the live BharatCode model.
- **01:15** — Explain like I’m 15. An everyday analogy helps make an unfamiliar topic more approachable.
- **01:20** — 9 · Flip-card practice. Explore the original question-and-answer cards. Saved confidence-based revision is available in notes mode.
- **01:24** — 10 · Copy or download your brief. Markdown export includes key points, terms, questions, ELI15 and source-linked practice when available.
- **01:29** — 11 · Delete saved notes and progress. Remove a session from browser storage. There is no account or cross-device sync.
- **01:34** — Input limits with clear feedback. Long inputs are rejected before generation. Notes mode also requires enough material to create questions.
- **01:37** — StudyBrief · attempt → inspect → revisit. Open source · BharatCode Build League · source-linked practice and a personal review loop.
- **01:42** — 12 · Clearly labelled offline mode. A separate server has no live generation enabled. Offline samples demonstrate mechanics, not model quality.
- **01:47** — Offline samples stay visibly labelled. Students can try the workflow without a key. Real assessments require live BharatCode generation.
- **01:52** — StudyBrief · attempt → inspect → revisit. Open source · BharatCode Build League · source-linked practice and a personal review loop.

## Re-record

Install dependencies and browser binaries:

```bash
npm ci
npx playwright install chromium ffmpeg
npm run build
```

Start a production server on port 3201 with `BHARATCODE_API_KEY` supplied securely in its environment. In a second terminal, start the labelled offline server:

```bash
PORT=3202 STUDYBRIEF_MODE=mock npm start
```

Then record:

```bash
STUDYBRIEF_DEMO_URL=http://localhost:3201 \
STUDYBRIEF_OFFLINE_URL=http://localhost:3202 npm run record:demo
```

The recorder writes raw WebM, chapter timings, a generated-response check, exported Markdown, and browser diagnostics under ignored `docs/.recordings/`. It intentionally chooses answers for the demonstration using the genuine model response. The live run fails if generation is not powered by BharatCode. Convert the resulting WebM to MP4 with FFmpeg (H.264, yuv420p, faststart); generation waiting sections may be trimmed as disclosed above. The checked-in MP4 combines the main recording with the offline chapter.

## Limits

This demonstrates working features, not a student study or measured learning improvement. Exact source-quote validation does not prove semantic correctness. Due review is shown honestly as disabled until a real scheduled time, rather than faking the passage of ten minutes. The video has captions rather than narration. Account registration, voting, and competition submission are separate actions.
