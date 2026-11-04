import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimit, checkRate, clientIp, release, tryAcquire } from "@/lib/ratelimit";

vi.mock("@/lib/llm", () => ({
  generateBrief: vi.fn(async () => ({ title: "t" })),
  resolveProvider: () => null,
  LlmError: class extends Error { status = 502; },
}));

describe("rate limit", () => {
  beforeEach(() => _resetRateLimit());
  it("allows 8 per window then blocks, then recovers", () => {
    for (let i = 0; i < 8; i++) expect(checkRate("1.1.1.1", 1000).ok).toBe(true);
    const r = checkRate("1.1.1.1", 1000);
    expect(r.ok).toBe(false);
    expect(checkRate("2.2.2.2", 1000).ok).toBe(true);
    expect(checkRate("1.1.1.1", 1000 + 10 * 60 * 1000).ok).toBe(true);
  });
  it("reads first x-forwarded-for hop", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" } }))).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
  it("concurrency guard", () => {
    expect(tryAcquire(1)).toBe(true);
    expect(tryAcquire(1)).toBe(false);
    release();
    expect(tryAcquire(1)).toBe(true);
  });
  it("route returns 429 with friendly message after limit", async () => {
    const { POST } = await import("@/app/api/brief/route");
    const mk = () => new Request("http://x/api/brief", { method: "POST", headers: { "x-forwarded-for": "5.5.5.5", "content-type": "application/json" }, body: "{}" });
    for (let i = 0; i < 8; i++) expect((await POST(mk())).status).not.toBe(429);
    const res = await POST(mk());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect((await res.json()).error).toMatch(/wait/);
  });
});
