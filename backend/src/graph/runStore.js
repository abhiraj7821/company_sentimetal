// src/graph/runStore.js
import { EventEmitter } from "node:events";

/**
 * In-memory run store: runId -> projected run record.
 * MVP implementation uses a Map; swap for Redis later without changing
 * the exported function signatures below (createRun/getRun/updateRun/appendLog).
 *
 * `runEvents` is a shared EventEmitter that `updateRun`/`appendLog` fire on
 * every write. `routes/stream.js` subscribes to this per-runId to push SSE
 * updates without any Redis pub/sub — fine for a single-process MVP.
 */
const runs = new Map();
export const runEvents = new EventEmitter();
runEvents.setMaxListeners(0); // many concurrent SSE clients is expected

const MAX_LOG_ENTRIES = 50;

function initialAgents() {
  return {
    supervisor: { status: "pending", label: "Orchestrating tasks" },
    filing: { status: "pending", label: "10-K / 10-Q" },
    news: { status: "pending", label: "Collecting news" },
    sentiment: { status: "pending", label: "Analyzing sentiment" },
    webScout: { status: "pending", label: "Exploring web" },
    critic: { status: "pending", label: "Verifying facts" },
    reportWriter: { status: "pending", label: "Drafting report" },
    humanApproval: { status: "pending", label: "Review & approve" },
  };
}

/**
 * Seed a new run record. Called by routes/research.js right after a runId
 * is generated, before the job is even enqueued, so GET /status never 404s
 * for a run that's technically "queued" but not yet picked up by a worker.
 */
export function createRun(runId, formData) {
  const run = {
    runId,
    status: "queued",
    company: formData?.researchTarget || "",
    threadId: runId, // == runId by design; used as the LangGraph checkpointer thread_id
    formData: formData || {},
    agents: initialAgents(),
    logs: [],
    progress: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
    reportPayload: null,
  };
  runs.set(runId, run);
  return run;
}

export function getRun(runId) {
  return runs.get(runId) || null;
}

/**
 * Shallow-merge a patch into the run record. `agents` is expected to be
 * passed as a COMPLETE object by projector.js's projectAgentStatuses() on
 * every call, so a shallow merge (patch.agents replaces the whole map) is
 * correct here — there's no need for a deep per-agent merge.
 */
export function updateRun(runId, patch) {
  const existing = runs.get(runId);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  runs.set(runId, updated);
  runEvents.emit(runId, updated);
  return updated;
}

/**
 * Append one log entry, capped at MAX_LOG_ENTRIES (oldest entries drop off
 * the front, matching the contract's "capped array" note).
 */
export function appendLog(runId, entry) {
  const existing = runs.get(runId);
  if (!existing) return null;
  const nextId = (existing.logs[existing.logs.length - 1]?.id || 0) + 1;
  const logEntry = {
    id: nextId,
    time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    ...entry,
  };
  const logs = [...existing.logs, logEntry].slice(-MAX_LOG_ENTRIES);
  const updated = { ...existing, logs };
  runs.set(runId, updated);
  runEvents.emit(runId, updated);
  return updated;
}

export function deleteRun(runId) {
  runs.delete(runId);
}
