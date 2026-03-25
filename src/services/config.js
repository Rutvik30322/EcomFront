

const PRIMARY_API   = 'https://ecombackend-krq1.onrender.com/api';
const FALLBACK_API  = 'http://172.20.10.5:5001/app';

/**
 * Resolves the API base URL.
 * Tries the primary (Render) URL first; if it is unreachable within 5 s,
 * falls back to the local network server.
 */
export async function getAPIBaseURL() {
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 5000);

    // A lightweight HEAD/GET to the health endpoint (adjust path if needed)
    const res = await fetch(`${PRIMARY_API}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok || res.status < 500) {
      return PRIMARY_API;
    }
    return FALLBACK_API;
  } catch {
    // Network error or timeout → use local fallback
    return FALLBACK_API;
  }
}

// Resolved once at startup so all services share the same value
export const API_BASE_URL_PROMISE = getAPIBaseURL();

// Synchronous export kept for legacy imports; resolves to primary by default.
// For reliable fallback behaviour, prefer await API_BASE_URL_PROMISE.
export const API_BASE_URL = PRIMARY_API;

export const REQUEST_DEBOUNCE_MS = 500;

export const DEFAULT_TIMEOUT_MS = 60_000;  // 60s  (general)
export const UPLOAD_TIMEOUT_MS = 60_000;  // 60s  (file uploads)
export const PDF_TIMEOUT_MS = 120_000; // 2min (PDF parsing)
export const AI_TIMEOUT_MS = 300_000; // 5min (AI processing)
