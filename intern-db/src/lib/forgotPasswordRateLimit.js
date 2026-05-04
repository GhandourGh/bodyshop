/** In-memory rate limit for forgot-password (per email). */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX = 5;

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

export function checkForgotPasswordRateLimit(emailKey) {
  const key = emailKey.toLowerCase().trim();
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  return b.count <= MAX;
}
