# Development and operations

## Runtime and installation

The complete app/test/recording toolchain was validated with **Node 26.13.0** and npm 11.20.0. Use Node 26+ for that path. Although Next.js itself supports older Node versions, the locked Vitest/jsdom dependencies have newer engine requirements; Node 20 is not sufficient for the full test toolchain.

```bash
npm ci
cp .env.example .env.local
# Add your BharatCode key privately to .env.local, or leave it empty for offline mode.
npm run dev
```

Open `http://localhost:3200`. `PORT` overrides the default port. `.env` and `.env.local` are ignored by Git. Do not prefix server credentials with `NEXT_PUBLIC_`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `BHARATCODE_API_KEY` | Empty | Server-side bearer credential; no key means mock mode unless the explicit test fallback is enabled |
| `BHARATCODE_BASE_URL` | `https://bharatcode.ai/api/model/v1` | Provider base URL, without `/chat/completions` |
| `BHARATCODE_MODEL` | `qwen-3.8-27b` | Model ID available to your provider account |
| `STUDYBRIEF_MODE` | Unset | `mock` forces offline mode even when a key exists |
| `STUDYBRIEF_RATE_LIMIT` | `8` | Requests per IP/window, including invalid requests |
| `STUDYBRIEF_RATE_WINDOW_MS` | `600000` | Rate window in milliseconds |
| `STUDYBRIEF_MAX_CONCURRENT` | `4` | Generations in flight per instance |
| `PORT` | `3200` | App listening port in the npm start/dev scripts |
| `STUDYBRIEF_TEST_FALLBACK` | Unset | Only `openai` explicitly enables the local development fallback |
| `OPENAI_API_KEY` | Empty | Used only by the explicit fallback when no BharatCode key is configured |

Use positive finite numbers for rate/concurrency settings; the current code converts them with `Number()` without additional configuration validation. Restart/redeploy after environment changes. Never use the OpenAI test fallback as evidence of BharatCode-powered hackathon functionality.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production compilation, lint/type validation and build output |
| `npm start` | Serve an existing production build |
| `npm test` | Automated behavior tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run record:demo` | Real-browser recording; see [recording prerequisites](DEMO.md#re-record) |

Development and production builds both use `.next`. Stop the development server and rebuild before running `npm start`; running dev can invalidate a prior production build.

## Production deployment

1. Configure a Node runtime compatible with the installed dependencies.
2. Install from the lockfile and build: `npm ci`, then `npm run build`.
3. Supply server-only environment settings and run `npm start`, or use a Next.js-compatible host.
4. With Vercel, import the repository using its Next.js preset, configure environment variables for the intended deployment environment, and redeploy after changing them. Runtime/timeout support depends on the hosting plan.
5. Check `GET /api/brief` for the expected configuration, then make a real POST. A provider pill alone does not prove the key works.
6. Verify notes practice, citations, reload persistence, deletion and export on the production origin. Localhost libraries do not migrate to production.

The demo route declares `maxDuration = 120`; verify that the chosen host supports the necessary duration. Requests can involve retries and a repair, so avoid assuming a deployment will always fit every worst-case attempt. The current limiter is best-effort per instance. A production service needing strict global quotas requires a shared limiter.

## Troubleshooting

| Symptom | Check |
|---|---|
| Header says offline | Key is absent, or `STUDYBRIEF_MODE=mock` is set; restart after configuration changes |
| Provider pill appears but generation fails | GET reports configuration only; test actual credentials, model entitlement and provider availability |
| HTTP 401 | Server-side provider credential/access |
| HTTP 429 | Respect `Retry-After`; inspect configured limits and trusted proxy/IP forwarding |
| Output cut short | Try shorter source notes; generated output exceeded the token budget |
| Citation/structure fails twice | Notes may be sparse or output unsuitable; improve source material and retry, rather than accepting fabricated evidence |
| Missing saved sessions | Check exact browser/profile/origin, whether site data was cleared, and the ten-session retention limit |
| Storage error | Browser storage may be blocked/full; current progress may be memory-only |
| Production build not found | Stop dev, run `npm run build`, then restart production |
| Slow/host timeout | Check upstream latency, retry/repair behavior and hosting duration limits |

## Data and credential handling

Notes go to the selected model provider during generation. The server has no application notes database, while notes-mode sessions are stored in the browser. Provider retention and host logs are separate from local deletion. Use public sample notes in shared recordings. Keep credentials out of Git, browser code, screenshots, recordings and demo logs. The recorder's intermediate artifacts are ignored under `docs/.recordings/`.

## Release checklist

- [ ] Automated checks pass; production build succeeds.
- [ ] Real notes and topic generation work on the intended host.
- [ ] Review generated questions for answer correctness and genuinely supporting source quotes.
- [ ] Verify persistence, scheduling and deletion without altering the clock to imply real elapsed learning.
- [ ] Review changed files for credentials/private notes and check the public video.
- [ ] Publish the reviewed commit; verify public source and MP4 links.
- [ ] Confirm competition account registration, rules and submission separately.

Publishing a GitHub commit is not proof of a successful website deployment or competition submission.
