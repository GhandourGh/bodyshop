/**
 * FastAI microservice URL and headers (server-side only).
 * Set AI_API_KEY to match FastAPI's AI_API_KEY when key auth is enabled.
 */

export function getAiServiceUrl() {
  return process.env.AI_SERVICE_URL || 'http://localhost:8000';
}

/**
 * @param {{ jsonContentType?: boolean }} [opts]
 * @returns {Record<string, string>}
 */
export function getAiHeaders(opts = {}) {
  const { jsonContentType = true } = opts;
  /** @type {Record<string, string>} */
  const headers = {};
  const key = process.env.AI_API_KEY;
  if (key) headers['X-API-Key'] = key;
  if (jsonContentType) headers['Content-Type'] = 'application/json';
  return headers;
}
