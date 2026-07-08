// src/queue/worker.js
import { Worker } from "bullmq";
import { connection } from "./connection.js";
import { buildGraph } from "../graph/buildGraph.js";
import logger from "../lib/logger.js";
import { researchEvents } from "./events.js"; // new import

// ... keep the processor function

async function processor(job) {
  const { company, task_queue, thread_id, resume } = job.data;

  const graph = await buildGraph();
  const threadId = thread_id || uuidv4();
  const config = { configurable: { thread_id: threadId } };

  // Helper to emit progress with jobId
  const emitProgress = (progress) => {
    job.updateProgress(progress);
    researchEvents.emit("progress", { jobId: job.id, ...progress });
  };

  if (resume) {
    logger.info({ threadId }, "Resuming graph after human approval...");
    await emitProgress({ status: "resuming", threadId });
    const finalState = await graph.invoke(null, { ...config, resume });
    await emitProgress({ status: "completed", threadId });
    return {
      threadId,
      approval_status: finalState.approval_status,
      draft_report: finalState.draft_report,
    };
  }

  // Initial run
  logger.info({ threadId, company }, "Starting new research run...");
  await emitProgress({ status: "running", threadId, company });

  const initialState = {
    company,
    task_queue: task_queue || ["filing", "news", "sentiment", "web_scout"],
    messages: [],
  };

  try {
    const result = await graph.invoke(initialState, config);
    await emitProgress({ status: "completed", threadId });
    return {
      threadId,
      approval_status: result.approval_status,
      draft_report: result.draft_report,
    };
  } catch (error) {
    if (
      error.name === "GraphInterrupt" ||
      error.message?.includes("interrupt")
    ) {
      logger.info({ threadId }, "Graph paused for human approval.");
      const interruptedState = error.state || {};
      await emitProgress({ status: "awaiting_approval", threadId });
      return {
        threadId,
        approval_status: interruptedState.approval_status,
        aggregated_findings: interruptedState.aggregated_findings,
        draft_report: interruptedState.draft_report,
      };
    }
    logger.error({ error, threadId }, "Graph execution failed.");
    await emitProgress({ status: "failed", threadId, error: error.message });
    throw error;
  }
}

// ... rest (Worker instantiation)
const worker = new Worker("research", processor, {
  connection,
  concurrency: 1,
});
worker.on("completed", (job, result) => {
  logger.info({ jobId: job.id, threadId: result?.threadId }, "Job completed");
});
worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err }, "Job failed");
});

export { worker };
