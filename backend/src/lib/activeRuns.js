// src/lib/activeRuns.js
/**
 * Shared registry of abort controllers for in‑flight research runs.
 * The worker creates an AbortController when it starts processing a job,
 * and the DELETE /research/:runId route calls controller.abort() to
 * cancel the LangGraph stream immediately.
 */
export const activeControllers = new Map(); // runId → AbortController
