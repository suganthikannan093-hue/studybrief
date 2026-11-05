# Changelog

## 2026-11-05 — source-linked revision and feature demo

### Added

- Separate notes-revision and topic-exploration modes.
- 3–6 four-choice practice questions with concept labels, explanations and source quotations.
- Server-side source-membership checks and one model repair for invalid structure/citations.
- Pre-answer confidence checks, deterministic grading and confident-mistake feedback.
- Personal review scheduling, due filtering and missed-concept tracking.
- Browser-local persistence for ten notes sessions, including original notes and per-question review history; individual deletion.
- Source-linked practice in Markdown export.
- Learning and interaction tests; suite now contains 29 tests.
- Repeatable Playwright feature recorder, captioned MP4 and chapter documentation.
- Feature, architecture, API, operations and testing guides.

### Preserved

Topic briefs, key points, simple explanations, terms, ELI15, flip cards, Markdown copy/download, labelled offline mode and rate/concurrency controls.

### Validation

29 tests, lint, TypeScript and production build passed. Live BharatCode notes/topic generation, browser interaction checks, persistence/deletion, clipboard/download checks, and full MP4 decoding passed. The public MP4 was downloaded and its hash matched the local artifact.

### Known limits

Source matching is not semantic verification. Scheduling is a heuristic, not a mastery estimate. There is no account sync, background notification service, file ingestion or student learning-outcome study. Legacy screenshots show the old interface; the current video is the complete updated walkthrough. Competition registration/submission remains separate from publishing code.
