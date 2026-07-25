// src/graph/streamHandlers.js
import { buildGraph } from "./buildGraph.js";
import { updateRun, appendLog, getRun } from "./runStore.js";
import { projectAgentStatuses, projectReport } from "./projector.js";
import logger from "../lib/logger.js";

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

function deriveRunStatus(fullState) {
  const next = fullState.next || [];
  if (next.length === 0) return "completed";
  if (next.includes("human_approval")) return "awaiting_approval";
  return "running";
}

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

/**
 * True for both the DOMException an AbortController produces and for any
 * error LangGraph wraps around it — we only need "was this deliberately
 * cancelled" vs "did something actually go wrong".
 */
function isAbortError(err) {
  return err?.name === "AbortError" || /abort/i.test(err?.message || "");
}

let graphSingleton;
async function getGraph() {
  if (!graphSingleton) graphSingleton = await buildGraph();
  return graphSingleton;
}

/**
 * @param {string} runId
 * @param {object|Command} input
 * @param {{ signal?: AbortSignal }} [options] - AbortSignal from the
 *   AbortController worker.js registers in activeControllers, so
 *   DELETE /research/:runId can actually stop an in-flight node instead
 *   of only removing a not-yet-started queue job.
 */
export async function runGraphAndProject(runId, input, { signal } = {}) {
  const graph = await getGraph();
  const config = { configurable: { thread_id: runId }, recursionLimit: 1000 };

  try {
    const stream = await graph.stream(input, {
      ...config,
      streamMode: "updates",
      ...(signal ? { signal } : {}),
    });

    for await (const chunk of stream) {
      const entry = Object.entries(chunk)[0];
      if (!entry) continue;
      const [nodeName] = entry;

      const fullState = await graph.getState(config);

      await updateRun(runId, {
        status: deriveRunStatus(fullState),
        agents: projectAgentStatuses(fullState.values),
        progress: computeProgress(fullState.values),
      });

      await appendLog(runId, buildLogEntry(nodeName));

      if ((fullState.next || []).length === 0) {
        const run = await getRun(runId);
        const finishedAt = new Date().toISOString();
        await updateRun(runId, {
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

    const run = await getRun(runId);
    if (run && run.status !== "completed" && run.status !== "failed") {
      const finalState = await graph.getState(config);
      const finishedAt = new Date().toISOString();
      await updateRun(runId, {
        status: "completed",
        finishedAt,
        reportPayload: projectReport(finalState.values, run.formData, {
          runId,
          startedAt: run.startedAt,
          finishedAt,
        }),
      });
    }
  } catch (err) {
    if (isAbortError(err)) {
      // Deliberate cancellation via DELETE /research/:runId. That route
      // already wrote the "failed"/CANCELLED status+error to the run
      // record BEFORE calling controller.abort() — overwriting it here
      // with a generic AGENT_TOOL_ERROR would stomp that message. Just
      // log and stop; don't rethrow (worker.js's 'failed' handler would
      // otherwise also try to overwrite the run record a second time).
      logger.info({ runId }, "Graph run aborted by cancellation request.");
      return;
    }

    logger.error({ err, runId }, "Graph run failed");
    await updateRun(runId, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: {
        code: "AGENT_TOOL_ERROR",
        agent: "unknown",
        message: err.message || String(err),
        occurredAt: new Date().toISOString(),
      },
    });
    throw err;
  }
}
