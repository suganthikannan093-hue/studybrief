# BharatCode Build League – submission notes

Sources read 3 Nov 2026: https://bharatcode.ai/hackathon (main page), https://bharatcode.ai/build (model API docs), https://bharatcode.ai/setup.
No separate rules, FAQ or submission pages exist (`/hackathon/rules`, `/hackathon/faq` return 404); all rules below are from the main hackathon page.

## Rules checklist

| Requirement | Source | Status |
|---|---|---|
| Use BharatCode's model API to solve a real problem | /hackathon | ✅ all AI calls go to `bharatcode.ai/api/model/v1` (needs your key) |
| Register (entry tied to your BharatCode account; sign in with GitHub/Google) | /hackathon | ⬜ you |
| Register **and submit by 10 Nov 2026, 11:59 PM IST** | /hackathon | ⬜ you |
| Public GitHub repo, any name | /hackathon | ⬜ push when approved |
| `BharatCode.txt` in the repo root | /hackathon | ✅ (page specifies no content; ours describes the project and API usage) |
| Submit the GitHub link on the hackathon page | /hackathon | ⬜ you |
| No secrets, tokens, private links or private user data in the repo | /hackathon | ✅ `.env` is gitignored, only `.env.example` |
| Keep API keys server-side, not in browser bundles | /build | ✅ only `app/api/brief/route.ts` uses the key |
| Format: website, app, bot, CLI or integration; any field | /hackathon | ✅ website (Learning & education / Research & discovery) |

No video or hosted link is required by the page. A hosted demo helps voters "try it", so it is recommended.

### Judging
First prize ₹10,000. Judging considers three inputs: **GitHub stars**, **BharatCode website votes** (one per registered account, changeable while voting is open) and **judges' evaluation**. The community score = stars + votes; judges review the project alongside the community response. No weights are published.

## Demo script (≈90 s)
1. (0-10s) "Students drown in notes. StudyBrief turns any topic or notes into a revision-ready brief, powered by BharatCode's Qwen 3.8 27B."
2. (10-30s) Show the pill "BharatCode model API · qwen-3.8-27b". Click the French Revolution notes example → Generate.
3. (30-60s) Key points, simple explanation, terms. Flip two quiz cards.
4. (60-75s) Toggle Explain like I'm 15.
5. (75-90s) Download .md. Close: "Open source, MIT, star it on GitHub and vote on bharatcode.ai."

## Submission description draft
**StudyBrief – AI Research & Study Companion.** Paste a topic, an article or class notes and get a structured study brief: key points, a plain-language explanation, key terms with definitions, a flip-card practice quiz and an "Explain like I'm 15" version. Export it as Markdown for revision. Built with Next.js and TypeScript; every AI call goes server-side to the BharatCode model API (`qwen-3.8-27b`, OpenAI-compatible chat completions) with JSON-schema output, Zod validation and one automatic repair retry, so the cards never break on a malformed reply. Runs in a labelled offline demo mode without a key. MIT licensed.

## Steps only you can do
1. Sign in at bharatcode.ai and register for the Build League.
2. Create a developer API key at https://bharatcode.ai/account (needs Lite, Pro or verified student access) and share it through a secure field so it can be added to `.env` and tested live.
3. Approve creating and pushing the public GitHub repo.
4. (Optional) approve a hosted deployment, e.g. Vercel, with `BHARATCODE_API_KEY` as a server env var.
5. Submit the repo link on https://bharatcode.ai/hackathon before 10 Nov 2026, 11:59 PM IST; then share it to collect stars and votes.
