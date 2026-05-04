/** In-memory rate limit for public portal estimate (per IP). */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 40;

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

function prune(now) {
  if (buckets.size < 8000) return;
  for (const [ip, b] of buckets) {
    if (now > b.resetAt) buckets.delete(ip);
  }
}

export function checkPortalRateLimit(ip) {
  const now = Date.now();
  prune(now);
  let b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, b);
  }
  b.count += 1;
  return b.count <= MAX_REQUESTS;
}
