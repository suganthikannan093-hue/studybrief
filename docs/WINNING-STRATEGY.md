# Competition strategy: demonstrate a repeatable learning workflow

## Product bet

Serve students revising their own class notes. The promise is a short, repeatable loop: attempt, inspect evidence, identify a confident mistake, and return for review. Summary generation remains useful supporting functionality.

The new workflow differentiates this implementation from a single prompt and output screen. It does not establish a defensible market moat or guarantee a competition win.

## Implemented locally

- Two distinct modes: notes revision and general topic exploration.
- 3–6 structured questions with four distinct choices and source quotations.
- Server checks quote membership; rejects invalid output after one repair attempt.
- Confidence captured before answers/evidence are shown.
- Deterministic grading and per-question scheduling without additional model calls.
- Missed concepts and confident mistakes visible in the saved library.
- Ten browser-local sessions, with notes, progress, due queue and deletion.
- Clearly labelled offline samples; topic mode and export retained.

## Evidence to gather before claiming impact

Have 3–5 students revise their own notes. Record task completion, questions with incorrect/irrelevant evidence, explanation errors, time to first practice and whether they return to a due session. Ask which step they would use again. Do not fabricate user counts, learning gains or testimonials. Answer correctness still needs human review.

A persuasive demo deliberately chooses a wrong answer with high confidence, reveals its source evidence, then reloads to show that progress survives. The new docs/demo.mp4 uses real BharatCode generation; the older screenshots still need refreshing before submission. One live French Revolution sample was checked for usable question structure and source quotes; this is not a broad quality evaluation or a student trial.

## Next priorities

1. Manually evaluate generated questions on history, science and computing notes with the real BharatCode API.
2. Fix issues exposed by student trials before adding more surface area.
3. Publish the tested version and record the new demo; confirm account registration and submit the public repo link.
4. Share the useful demo with relevant student communities for authentic stars/votes. Community response is part of judging; no published weighting was found.

Official event page checked 2026-11-05: https://bharatcode.ai/hackathon . Submission/registration deadline: 2026-11-10 23:59 IST. First prize ₹10,000. Judging considers stars, registered website votes and judges' evaluation.

No deployment, submission, account creation, or public promotion is performed by this local implementation.
