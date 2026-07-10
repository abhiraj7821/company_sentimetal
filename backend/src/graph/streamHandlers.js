// src/graph/streamHandlers.js
import { buildGraph } from "./buildGraph.js";
import { updateRun, appendLog, getRun } from "./runStore.js";
import { projectAgentStatuses, projectReport } from "./projector.js";
import logger from "../lib/logger.js";

// Maps top-level graph node names to human-readable log lines. Notice this
// list only has 5 entries (supervisor, aggregator, report_writer, critic,
// human_approval) — filing/news/sentiment/web_scout are NOT separate
// top-level nodes (see the caveat in projector.js), so they can't get
// their own log lines from graph.stream() alone.
const NODE_LOG_META = {
  supervisor: { agent: "Supervisor", action: "Running research agents..." },
  aggregator: { agent: "Aggregator", action: "Merging research findings..." },
  report_writer: {
    agent: "Report Writer",
    action: "Compiling insights into report...",
  },
  critic: {
    agent: "Critic Agent",
    action: "Cross-checking facts & sources...",
  },
  human_approval: {
    agent: "Human Approval",
    action: "Awaiting review & approval...",
  },
};

function buildLogEntry(nodeName) {
  const meta = NODE_LOG_META[nodeName] || {
    agent: nodeName,
    action: `Running ${nodeName}...`,
  };
  return { agent: meta.agent, action: meta.action, status: "completed" };
}

/**
 * status values: "queued" | "running" | "awaiting_approval" | "completed" | "failed"
 */
function deriveRunStatus(fullState) {
  const next = fullState.next || [];
  if (next.length === 0) return "completed";
  if (next.includes("human_approval")) return "awaiting_approval";
  return "running";
}

/**
 * Simple 7-step progress heuristic. Not weighted by actual agent runtime —
 * good enough for a progress bar, not meant to be exact.
 */
function computeProgress(graphState) {
  const steps = [
    Boolean(graphState.filing_data),
    Boolean(graphState.news_data),
    Boolean(graphState.sentiment_data),
    Boolean(graphState.web_data),
    Boolean(graphState.draft_report),
    Boolean(graphState.critic_feedback),
    graphState.approval_status === "approved",
  ];
  const done = steps.filter(Boolean).length;
  return Math.round((done / steps.length) * 100);
}

// Compiled graph is stateless w.r.t. individual runs (per-run state lives
// in the checkpointer, keyed by thread_id), so one compiled instance is
// safely reused across every run rather than rebuilding it per request.
let graphSingleton;
async function getGraph() {
  if (!graphSingleton) graphSingleton = await buildGraph();
  return graphSingleton;
}

/**
 * Drives one graph execution (a fresh run OR a resume-after-interrupt) and
 * projects every node transition into the run store in real time. This is
 * the ONLY place besides projector.js that touches GraphAnnotation — every
 * route file only ever reads runStore.
 *
 * @param {string} runId - also used as the LangGraph checkpointer thread_id
 * @param {object|Command} input - initial state object for a fresh run, or
 *   a `new Command({ resume: decision })` to continue past human_approval
 */
export async function runGraphAndProject(runId, input) {
  const graph = await getGraph();
  const config = { configurable: { thread_id: runId }, recursionLimit: 1000 };

  try {
    const stream = await graph.stream(input, {
      ...config,
      streamMode: "updates",
    });

    for await (const chunk of stream) {
      const entry = Object.entries(chunk)[0];
      if (!entry) continue;
      const [nodeName] = entry;

      const fullState = await graph.getState(config);

      updateRun(runId, {
        status: deriveRunStatus(fullState),
        agents: projectAgentStatuses(fullState.values),
        progress: computeProgress(fullState.values),
      });

      appendLog(runId, buildLogEntry(nodeName));

      if ((fullState.next || []).length === 0) {
        const run = getRun(runId);
        const finishedAt = new Date().toISOString();
        updateRun(runId, {
          status: "completed",
          finishedAt,
          reportPayload: projectReport(fullState.values, run?.formData, {
            runId,
            startedAt: run?.startedAt,
            finishedAt,
          }),
        });
      }
    }

    // After the stream loop, handle cases where the graph finished without
    // emitting any more node updates (e.g., a resume that immediately ends).

    const run = getRun(runId);
    if (run && run.status !== "completed" && run.status !== "failed") {
      const finalState = await graph.getState(config);
      const finishedAt = new Date().toISOString();
      updateRun(runId, {
        status: "completed",
        finishedAt,
        reportPayload: projectReport(finalState.values, run.formData, {
          runId,
          startedAt: run.startedAt,
          finishedAt,
        }),
      });
    }
    // If the loop ends because human_approval called interrupt(), the last
    // updateRun() call above already set status to "awaiting_approval" —
    // nothing further to do here. graph.stream() does not throw on
    // interrupt() the way graph.invoke() does.
  } catch (err) {
    logger.error({ err, runId }, "Graph run failed");
    updateRun(runId, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: {
        code: "AGENT_TOOL_ERROR",
        agent: "unknown", // the doc's failure shape wants a specific agent name; graph.stream()
        // doesn't surface which node threw once the error propagates out of
        // the for-await loop, so this stays generic unless you wrap each
        // node's own try/catch to tag the error before it bubbles up.
        message: err.message || String(err),
        occurredAt: new Date().toISOString(),
      },
    });
    throw err;
  }
}
