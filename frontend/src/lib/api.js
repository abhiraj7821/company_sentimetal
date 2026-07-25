/**
 * SentinelSwarm API client
 * ────────────────────────
 * One function per backend route in `backend_frontend_backend_routes.md`.
 * Every component talks to the backend ONLY through this file — if the
 * base URL, auth, or error handling ever changes, this is the one place
 * to touch.
 *
 * Requires an env var pointing at the backend:
 *   Vite:                VITE_API_BASE_URL=http://localhost:3000
 *   Create React App:    REACT_APP_API_BASE_URL=http://localhost:3000
 *   Next.js (client):    NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
 *
 * This file defaults to Vite's `import.meta.env`. If you're on CRA or
 * Next.js, swap the constant below for `process.env.REACT_APP_API_BASE_URL`
 * or `process.env.NEXT_PUBLIC_API_BASE_URL`.
 */

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";

async function handleResponse(res) {
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch {
      body = { error: { message: res.statusText } };
    }
    const message = body?.error?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

/**
 * POST /research — kicks off a run.
 * @param {object} formData - StartNewResearch's form state, sent as-is.
 * @returns {Promise<{runId, status, pollUrl, streamUrl}>}
 */
export async function startResearch(formData) {
  const res = await fetch(`${API_BASE_URL}/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return handleResponse(res);
}

/**
 * GET /research/:runId/status — one-shot status read (used for polling
 * fallback, or for a single "did it finish?" check).
 */
export async function getRunStatus(runId) {
  const res = await fetch(`${API_BASE_URL}/research/${runId}/status`);
  return handleResponse(res);
}

/**
 * GET /research/:runId/report — final report payload. 409s if the run
 * isn't completed yet, so only call this once status === "completed".
 */
export async function getRunReport(runId) {
  const res = await fetch(`${API_BASE_URL}/research/${runId}/report`);
  return handleResponse(res);
}

/**
 * POST /research/:runId/approve — resumes a graph paused at the
 * human_approval interrupt().
 * @param {string} runId
 * @param {"approved"|"changes_requested"} decision
 * @param {string} [comment]
 */
export async function approveRun(runId, decision, comment) {
  const res = await fetch(`${API_BASE_URL}/research/${runId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, comment }),
  });
  return handleResponse(res);
}

// src/lib/api.js  ← add this export alongside your other helpers
export async function cancelRun(runId) {
  const res = await fetch(`${API_BASE_URL}/research/${runId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Failed to cancel run (${res.status})`);
  }
  return res.json();
}

/**
 * GET /research/:runId/stream (SSE) — live push updates. Returns the
 * EventSource so the caller can close it (e.g. in a useEffect cleanup).
 *
 * @param {string} runId
 * @param {(run: object) => void} onUpdate - called with the full run record on every event
 * @param {(err: Event) => void} [onError]
 * @returns {EventSource}
 */
export function subscribeToRunStream(runId, onUpdate, onError) {
  const source = new EventSource(`${API_BASE_URL}/research/${runId}/stream`);

  source.onmessage = (event) => {
    try {
      const run = JSON.parse(event.data);
      onUpdate(run);
    } catch (err) {
      console.error("Failed to parse SSE payload", err);
    }
  };

  source.onerror = (event) => {
    if (onError) onError(event);
  };

  return source;
}

export { API_BASE_URL };
