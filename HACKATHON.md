# BharatCode Build League – submission notes

Sources read 3 Nov 2026: https://bharatcode.ai/hackathon (main page), https://bharatcode.ai/build (model API docs), https://bharatcode.ai/setup.
No separate rules, FAQ or submission pages exist (`/hackathon/rules`, `/hackathon/faq` return 404); all rules below are from the main hackathon page.

## Rules checklist

| Requirement | Source | Status |
|---|---|---|
| Use BharatCode's model API to solve a real problem | /hackathon | ✅ all AI calls go to `bharatcode.ai/api/model/v1` (needs your key) |
| Register (entry tied to your BharatCode account; sign in with GitHub/Google) | /hackathon | ⬜ you |
| Register **and submit by 10 Nov 2026, 11:59 PM IST** | /hackathon | ⬜ you |
| Public GitHub repo, any name | /hackathon | ✅ existing public repository |
| `BharatCode.txt` in the repo root | /hackathon | ✅ (page specifies no content; ours describes the project and API usage) |
| Submit the GitHub link on the hackathon page | /hackathon | ⬜ you |
| No secrets, tokens, private links or private user data in the repo | /hackathon | ✅ `.env` is gitignored, only `.env.example` |
| Keep API keys server-side, not in browser bundles | /build | ✅ only `app/api/brief/route.ts` uses the key |
| Format: website, app, bot, CLI or integration; any field | /hackathon | ✅ website (Learning & education / Research & discovery) |

No video or hosted link is required by the page. A hosted demo helps voters "try it", so it is recommended.

### Judging
First prize ₹10,000. Judging considers three inputs: **GitHub stars**, **BharatCode website votes** (one per registered account, changeable while voting is open) and **judges' evaluation**. The community score = stars + votes; judges review the project alongside the community response. No weights are published.

## Demo script (≈90 s)

Use the current walkthrough in README.md: notes → practice → a confident mistake → evidence → persisted review queue. The new docs/demo.mp4 records the complete workflow with real BharatCode generation and a separately labelled offline section. See docs/DEMO.md. Existing screenshots still show the earlier summary interface; the video is the current feature walkthrough.

## Submission description draft

**StudyBrief — notes to lasting recall.** Turn class notes into source-linked practice, check your confidence before seeing the answer, and build a personal review queue that prioritizes missed concepts. BharatCode generates structured questions and explanations; the server checks that every quoted passage occurs in the notes and requests one repair for invalid evidence. Deterministic scoring and review scheduling run without additional model calls. Progress and the latest ten sessions stay in the browser, with per-session deletion. Includes topic briefs, ELI15 and Markdown export. Quote matching is not semantic verification, and practice scores are not mastery estimates. MIT licensed.

See docs/WINNING-STRATEGY.md for evaluation and release priorities.

## Steps only you can do
1. Sign in at bharatcode.ai and register for the Build League.
2. Create a developer API key at https://bharatcode.ai/account (needs Lite, Pro or verified student access) and share it through a secure field so it can be added to `.env` and tested live.
3. Review and publish the new revision to the existing public repository.
4. (Optional) approve a hosted deployment, e.g. Vercel, with `BHARATCODE_API_KEY` as a server env var.
5. Submit the repo link on https://bharatcode.ai/hackathon before 10 Nov 2026, 11:59 PM IST; then share it to collect stars and votes.
