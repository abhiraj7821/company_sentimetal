// src/queue/worker.js
import { Worker } from "bullmq";
import { Command } from "@langchain/langgraph";
import { redisConnection } from "./researchQueue.js";
import { runGraphAndProject } from "../graph/streamHandlers.js";
import { updateRun } from "../graph/runStore.js";
import logger from "../lib/logger.js";

/**
 * Translates the frontend's POST /research body (§1 of the API contract)
 * into GraphAnnotation's initial state shape. This is the one place that
 * knows about both shapes, kept separate from projector.js (which handles
 * the reverse direction: graph state -> contract JSON).
 */
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
 * BullMQ (unlike Bull v3) doesn't have per-job-name `.process(name, fn)`
 * registration on a single queue — one Worker's processor function
 * receives every job on the queue and switches on `job.name` instead.
 * This replaces the pseudocode's two separate `worker.process(...)` calls.
 */
const worker = new Worker(
  "research",
  async (job) => {
    const { runId } = job.data;

    if (job.name === "run") {
      const { formData } = job.data;
      const initialState = mapFormDataToGraphState(formData);
      updateRun(runId, { status: "running" });
      await runGraphAndProject(runId, initialState);
      return;
    }

    if (job.name === "resume") {
      const { decision, comment } = job.data;
      // Matches the shape humanApproval.js already expects:
      // const { approved, feedback } = decision || {};
      const resumeCommand = new Command({
        resume: { approved: decision === "approved", feedback: comment },
      });
      await runGraphAndProject(runId, resumeCommand);
      return;
    }

    logger.warn(
      { jobName: job.name },
      "Unknown job type received on research queue",
    );
  },
  { connection: redisConnection },
);

worker.on("failed", (job, err) => {
  const runId = job?.data?.runId;
  logger.error({ err, runId, jobName: job?.name }, "Research job failed");
  if (runId) {
    updateRun(runId, {
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
