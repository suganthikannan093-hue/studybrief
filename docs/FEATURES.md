# Feature guide

StudyBrief helps students revise their own class notes through an attempt → evidence → review loop. [Watch the full walkthrough](demo.mp4) or follow these steps.

## Choose a mode

| | Revise my notes | Explore a topic |
|---|---|---|
| Input | 80–12,000 trimmed characters of source notes | 3–12,000 trimmed characters; a topic, article or notes |
| Generated content | Overview, terms, flashcards, ELI15, plus 3–6 source-linked multiple-choice questions | Overview, terms, flashcards and ELI15 |
| Evidence checks | Every practice quote must occur in the notes, allowing whitespace differences | No source-membership check |
| Saved library | Yes, including notes and question-level progress | No new saved review session |

The UI starts in notes mode. Selecting a topic example switches to topic mode; **Notes: French Revolution** switches back to notes mode. The API defaults to topic mode for compatibility when `mode` is omitted.

## Build a revision session

1. Select **Revise my notes** and paste notes with enough facts to support several questions.
2. Click **Build revision session**, or use Ctrl/⌘+Enter.
3. The new session appears in your library. A study brief appears below it.
4. Select **Practice all** to attempt all questions, or **Review due** for only new and currently due questions.

Each question has four distinct choices, a concept label, a model-selected correct answer, an explanation and a source quote. The server requests one repair if the response has invalid structure or a quote absent from the notes. If repair fails, the UI shows an error instead of accepting that response.

A matching quote does not prove the correct answer or explanation follows from it. Check the full notes when an answer seems questionable. Overview text, terms, ELI15 and original flashcards are not independently source-validated.

## Practice and confidence

Choose an answer and select **Guessing**, **Somewhat sure** or **Very sure** before **Check answer** becomes enabled. Feedback appears after submission. It shows:

- The model's correct choice and explanation.
- The quoted passage, plus an expandable view of the original notes.
- The next scheduled review date.
- A confident-mistake label when a wrong answer was marked **Very sure**.

An answer can be recorded only once per question in a round. **Practice all again** starts another round and updates question-level review history. Immediate repetition can reflect remembered answers rather than durable learning.

The completed-round score counts answers in that round only. The saved session retains cumulative attempts, correct answers, correct streak, confident-mistake count, and the latest result/confidence/due date per question. It does not retain a full answer transcript.

## Scheduling and gap tracking

| Result | Confidence | Next review |
|---|---|---|
| Incorrect | Any | 10 minutes; reset the correct streak |
| Correct | Guessing / Somewhat sure | 1 day |
| Correct | Very sure | 3, 6, 12, then 14 days, based on the consecutive correct streak |

Every correct answer increments the streak, regardless of confidence. The interval for a later **Very sure** answer uses that complete streak. Intervals are calculated from the answer time; they are a simple heuristic, not a validated estimate of mastery.

**Review due** includes unseen questions and reviews whose due time has arrived. It prioritizes due confident mistakes, then other due mistakes, unseen questions, and other due questions. **Practice all** includes future reviews too, after due/unseen work. The library refreshes its due counts approximately every 30 seconds while open. No emails, push notifications or calendar reminders are sent.

The library's **Revisit** line lists concepts whose latest recorded answer was wrong. A subsequent correct answer removes that concept from the line; its historical confident-mistake count is retained internally.

## Saved sessions and deletion

The latest ten notes sessions are saved in this browser profile and origin. Creating an eleventh removes the oldest saved session. Progress survives a reload. A different device, browser profile, hostname or port has a separate library.

**Delete** removes the session's saved notes, response and progress from the local library. Clearing browser site data also removes the library. There is no cloud account, backup, library import/export or cross-device sync. If storage is unavailable/full, an error explains that current practice may remain only in memory.

## Briefs and exports

- **Key points**, **Simple explanation** and **Important terms** provide a reading overview.
- **Explain like I'm 15** shows an everyday analogy.
- **Practice quiz** cards flip to show their model-written answers. These original flashcards do not record confidence or affect review scheduling.
- **Copy Markdown** copies the current brief to the clipboard.
- **Download .md** exports the current brief, including source-linked questions, their answers and quotes when available. It does not export saved scheduling/progress.

## Offline and error states

Without a BharatCode key, or when forced into mock mode, the app uses labelled deterministic placeholders/sample questions. Those samples demonstrate interactions, not a real assessment. The header identifies the configured provider; it is not a model-service health check.

Inputs beyond 12,000 characters show an error and disable the generation button. Short notes require more material or topic mode. Invalid/model-failed requests and rate limits produce visible messages; prior saved sessions remain available.

## Not currently included

PDF/file uploads, live web research, multilingual controls, open-answer grading, account sync, custom exam dates, reminders and proven learning-outcome measurements are not implemented. See [the evaluation plan](WINNING-STRATEGY.md) for priorities before expanding scope.
