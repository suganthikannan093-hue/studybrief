/**
 * Simple in-memory, per-IP sliding-window rate limit plus a global concurrency guard.
 * Serverless-friendly: no external store; state lives per warm instance (best effort on Vercel).
 */
export const RATE_LIMIT = Number(process.env.STUDYBRIEF_RATE_LIMIT ?? 8);
export const RATE_WINDOW_MS = Number(process.env.STUDYBRIEF_RATE_WINDOW_MS ?? 10 * 60 * 1000);
export const MAX_CONCURRENT = Number(process.env.STUDYBRIEF_MAX_CONCURRENT ?? 4);
const MAX_TRACKED_IPS = 5000;

const hits = new Map<string, number[]>();
let inFlight = 0;

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRate(ip: string, now = Date.now(), limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return { ok: false as const, retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > MAX_TRACKED_IPS) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] >= windowMs) hits.delete(k);
    if (hits.size > MAX_TRACKED_IPS) hits.delete(hits.keys().next().value as string);
  }
  return { ok: true as const, remaining: limit - recent.length };
}

export function tryAcquire(max = MAX_CONCURRENT): boolean {
  if (inFlight >= max) return false;
  inFlight++;
  return true;
}
export function release() {
  inFlight = Math.max(0, inFlight - 1);
}
export function _resetRateLimit() {
  hits.clear();
  inFlight = 0;
}
