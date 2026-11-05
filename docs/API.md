# HTTP API

The app exposes `/api/brief` on its own origin. Client requests never include the model API key; the server reads it from its environment. There is no end-user authentication layer. Use trusted hosting/proxy configuration and appropriate limits when exposing this public endpoint.

## GET /api/brief

Returns the configured provider and model without calling the model service:

```json
{"source":"bharatcode","model":"qwen-3.8-27b"}
```

`source` is `bharatcode`, `mock`, or explicitly enabled `openai-test-fallback`. A successful GET confirms configuration only, not key validity, provider availability or generation quality.

## POST /api/brief

Content type: `application/json`.

| Field | Type | Validation |
|---|---|---|
| `text` | string, required | Trimmed length 3–12,000 characters |
| `mode` | `topic` or `notes` | Optional; defaults to `topic`. Notes mode requires at least 80 trimmed characters. |

Example notes-mode request:

```bash
curl http://localhost:3200/api/brief \
  -H 'Content-Type: application/json' \
  --data '{"mode":"notes","text":"Binary search requires a sorted list. It compares the target with the middle element and discards half of the remaining search space at each step. Its time complexity is O(log n)."}'
```

Topic example: `{"text":"Photosynthesis","mode":"topic"}`. No-key requests use labelled offline output, rather than silently routing to another live provider.

## Successful response

The response has this shape (TypeScript notation, not literal JSON):

```ts
{
  brief: {
    title: string;
    keyPoints: string[]; // 3–8
    simpleExplanation: string;
    terms: { term: string; definition: string }[]; // 2–10
    questions: { question: string; answer: string }[]; // 3–6 original flashcards
    eli15: string;
    practice?: { // required by notes-mode generation; 3–6 items
      concept: string;
      question: string;
      choices: string[]; // exactly 4 distinct choices
      correctIndex: number; // integer 0–3
      explanation: string;
      sourceQuote: string; // 12–1,500 characters
    }[];
  };
  mode: "topic" | "notes";
  source: "bharatcode" | "mock" | "openai-test-fallback";
  model: string;
  repaired: boolean;
  ms: number;
}
```

`ms` measures generation duration on the server; it excludes the browser/network round trip. `repaired` means one extra generation was used to fix structure or citation membership. It is not a confidence score. `practice` is optional in the shared brief type for legacy/topic compatibility. Notes mode validates its presence and source membership for live output; offline mode returns labelled sample practice.

The overview/flashcards and source-linked practice are different arrays. Markdown export includes correct answers; it is intended as study material, not a sealed assessment.

## Errors

Errors return `{"error":"Human-readable message"}`.

| HTTP status | Typical cause |
|---|---|
| `400` | Invalid JSON, missing/invalid text or mode, excessive input, or too-short notes |
| `401` | Model provider rejects its configured API credential |
| `429` | Per-IP request window or instance concurrency limit reached; includes `Retry-After` in seconds |
| `502` | Provider failure, cut-short model output, or invalid structure/citations after repair |
| `500` | Unexpected failure, including errors not classified as `LlmError` |

The IP window is consumed before JSON validation, so malformed requests count toward it. Defaults are eight requests per ten minutes per IP and four concurrent generations per instance. Invalid/failed generation does not erase an existing saved library. There is no progress streaming or cancellation endpoint.

Provider 503 responses are retried within the model client; repeated provider errors are normally mapped to 502. A deployment timeout can instead produce a host-generated response outside this JSON contract.

## Versioning

There is no versioned public API guarantee. Schemas live in `lib/schema.ts`; consumers should tolerate additive response fields. Client-side persistence uses its own `studybrief.revision.v1` storage key and is not an HTTP session API.
