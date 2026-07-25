// src/graph/runStore.js
import { redisClient } from "../queue/connection.js";

/**
 * Redis-backed run store: run:{runId} -> JSON-serialized run record.
 *
 * Replaces the previous in-memory Map. That version only worked because
 * server.js and worker.js were assumed to be the same process — they are
 * actually launched as two separate `node` processes (`npm run api` /
 * `npm start` vs `npm run worker`), each with its own module-level Map,
 * so writes from the worker were invisible to the API process. Redis is
 * the shared source of truth now; every function below is async.
 *
 * Updates are published on a per-run pub/sub channel so routes/stream.js
 * can push live SSE updates without polling.
 */

const RUN_KEY_PREFIX = "run:";
const CHANNEL_PREFIX = "run-updates:";
const MAX_LOG_ENTRIES = 50;

// Runs expire after 6h of inactivity so Redis doesn't grow unbounded.
// Every write refreshes the TTL, so an active run never expires mid-flight.
const RUN_TTL_SECONDS = 6 * 60 * 60;

function runKey(runId) {
  return `${RUN_KEY_PREFIX}${runId}`;
}

/**
 * Exported so routes/stream.js subscribes to the exact same channel name
 * this module publishes on, without duplicating the naming scheme.
 */
export function channelForRun(runId) {
  return `${CHANNEL_PREFIX}${runId}`;
}

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

async function persistAndPublish(runId, run) {
  const payload = JSON.stringify(run);
  await redisClient.set(runKey(runId), payload, "EX", RUN_TTL_SECONDS);
  await redisClient.publish(channelForRun(runId), payload);
  return run;
}

/**
 * Seed a new run record. Called by routes/research.js right after a runId
 * is generated, before the job is even enqueued, so GET /status never 404s
 * for a run that's technically "queued" but not yet picked up by a worker.
 */
export async function createRun(runId, formData) {
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
  await persistAndPublish(runId, run);
  return run;
}

export async function getRun(runId) {
  const raw = await redisClient.get(runKey(runId));
  return raw ? JSON.parse(raw) : null;
}

/**
 * Shallow-merge a patch into the run record. `agents` is expected to be
 * passed as a COMPLETE object by projector.js's projectAgentStatuses() on
 * every call, so a shallow merge (patch.agents replaces the whole map) is
 * correct here — there's no need for a deep per-agent merge.
 *
 * NOTE: read-modify-write isn't atomic against Redis (no WATCH/MULTI
 * here). Fine for this app: writes to a given runId only ever come from
 * one worker job at a time (a run isn't processed by two jobs
 * concurrently), so there's no real concurrent-writer race in practice.
 */
export async function updateRun(runId, patch) {
  const existing = await getRun(runId);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await persistAndPublish(runId, updated);
  return updated;
}

/**
 * Append one log entry, capped at MAX_LOG_ENTRIES (oldest entries drop off
 * the front, matching the contract's "capped array" note).
 */
export async function appendLog(runId, entry) {
  const existing = await getRun(runId);
  if (!existing) return null;
  const nextId = (existing.logs[existing.logs.length - 1]?.id || 0) + 1;
  const logEntry = {
    id: nextId,
    time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    ...entry,
  };
  const logs = [...existing.logs, logEntry].slice(-MAX_LOG_ENTRIES);
  const updated = { ...existing, logs };
  await persistAndPublish(runId, updated);
  return updated;
}

export async function deleteRun(runId) {
  await redisClient.del(runKey(runId));
}
