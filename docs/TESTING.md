# Testing and validation

## Automated checks

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

Use the [supported toolchain](OPERATIONS.md#runtime-and-installation). Vitest runs all `tests/**/*.test.ts`; the revision interaction suite uses jsdom and React Testing Library. Provider calls in tests are mocked, so these checks need no real API key and do not consume model credits.

The current suite has **29 passing tests across four files**:

| Suite | Coverage |
|---|---|
| `parse.test.ts` | JSON extraction, schema failures, input bounds, offline output, Markdown and provider selection |
| `ratelimit.test.ts` | IP windows, expiry, forwarded IP, concurrency and route 429 responses |
| `learning.test.ts` | Notes minimum length, fabricated quote rejection, whitespace tolerance, distinct options, answer bounds, repair/rejection, export, scheduling boundaries, queue ordering and session serialization |
| `revision.test.ts` | Answer/confidence gating, feedback reveal, one grade per round, confident-mistake persistence after remount, due filtering and deletion |

Tests validate implementation behavior; they do not establish semantic question quality, learning gains or all hosting/browser combinations.

## Real-provider smoke check

1. Supply a real BharatCode key privately to the server and start the app.
2. Confirm GET metadata, then generate a notes session with the French Revolution sample.
3. Verify the response source is `bharatcode`, and inspect questions for ambiguous options or answers not supported by their quotes.
4. Generate a topic brief too; confirm it does not create a saved notes session.
5. Do not pass off offline placeholders or the explicitly labelled OpenAI test fallback as a BharatCode result.

A live French Revolution check on 2026-11-05 produced five source-linked questions without repair. The recorded walkthrough also used real notes/topic generations. This is a smoke check, not a systematic evaluation.

## Browser acceptance walkthrough

The repeatable [recording script](../scripts/record-demo.mjs) exercises real UI interactions and fails on generation errors, a non-BharatCode main response, unexpected due behavior, a missing Markdown clipboard payload, or uncaught page errors.

- Paste sample notes and build a session.
- Deliberately select a wrong answer with high confidence; inspect explanation and original source.
- Answer remaining questions and inspect the round result.
- Reload; verify progress and the missed concept remain.
- Confirm **Review due** is disabled when every answered question has a future due date. Do not fabricate elapsed time for the video.
- Generate a general topic, inspect overview/terms/ELI15 and flip a flashcard.
- Copy Markdown, save a download, and delete the saved notes session.
- Enter excessive input to check visible limits.
- Show a separately labelled offline server if demonstrating no-key behavior.

See [Demo](DEMO.md) for the published recording and exact reproduction setup. Its MP4 was fully decoded without errors and its downloaded public copy was checked against the local SHA-256.

## Student/question-quality evaluation still needed

Trial notes from several subjects with 3–5 students. Record unsupported answers, misleading quotes, ambiguous distractors, time to first practice, successful task completion, and whether students return to due work. Inspect confidence feedback for confusion. Do not claim measured learning improvements without a suitable evaluation; immediate repeated-question scores are not evidence of long-term retention.
