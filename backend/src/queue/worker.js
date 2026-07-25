// src/queue/worker.js
import { Worker } from "bullmq";
import { Command } from "@langchain/langgraph";
import { redisConnection } from "./researchQueue.js";
import { runGraphAndProject } from "../graph/streamHandlers.js";
import { updateRun } from "../graph/runStore.js";
import { activeControllers } from "../lib/activeRuns.js";
import logger from "../lib/logger.js";

function mapFormDataToGraphState(formData) {
  const tickerMatch = formData?.researchTarget?.match(/\(([^)]+)\)/);
  const company = tickerMatch ? tickerMatch[1] : formData?.researchTarget || "";

  const tasks = [];
  if (formData?.dataSources?.secFilings) tasks.push("filing");
  if (formData?.dataSources?.newsPress) tasks.push("news");
  if (formData?.dataSources?.marketSentiment) tasks.push("sentiment");
  if (formData?.dataSources?.webCompetitor) tasks.push("web_scout");

  return {
    company,
    task_queue:
      tasks.length > 0 ? tasks : ["filing", "news", "sentiment", "web_scout"],
    messages: [],
  };
}

/**
 * Registers an AbortController for this runId so DELETE /research/:runId
 * can actually interrupt an in-flight node, then guarantees cleanup so a
 * completed/failed run doesn't leave a stale controller behind that a
 * LATER run with a reused... (runIds are uuids, so reuse won't happen,
 * but leaking Map entries indefinitely still isn't fine) — always
 * deleted in `finally` regardless of outcome.
 */
async function withAbortController(runId, fn) {
  const controller = new AbortController();
  activeControllers.set(runId, controller);
  try {
    return await fn(controller.signal);
  } finally {
    activeControllers.delete(runId);
  }
}

const worker = new Worker(
  "research",
  async (job) => {
    const { runId } = job.data;

    if (job.name === "run") {
      const { formData } = job.data;
      const initialState = mapFormDataToGraphState(formData);
      await updateRun(runId, { status: "running" });
      await withAbortController(runId, (signal) =>
        runGraphAndProject(runId, initialState, { signal }),
      );
      return;
    }

    if (job.name === "resume") {
      const { decision, comment } = job.data;
      const resumeCommand = new Command({
        resume: { approved: decision === "approved", feedback: comment },
      });
      await withAbortController(runId, (signal) =>
        runGraphAndProject(runId, resumeCommand, { signal }),
      );
      return;
    }

    logger.warn(
      { jobName: job.name },
      "Unknown job type received on research queue",
    );
  },
  { connection: redisConnection },
);

worker.on("failed", async (job, err) => {
  const runId = job?.data?.runId;
  // Deliberate cancellations already have their final "failed"/CANCELLED
  // status written by routes/stop.js — don't let this generic handler
  // overwrite that with AGENT_TOOL_ERROR.
  if (/abort/i.test(err?.message || "") || err?.name === "AbortError") {
    logger.info({ runId, jobName: job?.name }, "Job aborted by cancellation.");
    return;
  }

  logger.error({ err, runId, jobName: job?.name }, "Research job failed");
  if (runId) {
    await updateRun(runId, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: {
        code: "AGENT_TOOL_ERROR",
        agent: "unknown",
        message: err?.message || String(err),
        occurredAt: new Date().toISOString(),
      },
    });
  }
});

worker.on("error", (err) => {
  logger.error({ err }, "Research worker error");
});

export default worker;
