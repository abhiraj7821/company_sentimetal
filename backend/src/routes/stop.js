// src/routes/stop.js
import { Router } from "express";
import { activeControllers } from "../lib/activeRuns.js";
import { researchQueue } from "../queue/researchQueue.js";
import { updateRun, getRun } from "../graph/runStore.js";

const router = Router();

/**
 * DELETE /research/:runId
 * Stops a running research job immediately (graph abort + queue removal).
 */
router.delete("/research/:runId", async (req, res) => {
  const { runId } = req.params;

  // 1. Abort the graph execution if it's still running
  const controller = activeControllers.get(runId);
  if (controller) {
    controller.abort();
    activeControllers.delete(runId);
  }

  // 2. Remove the BullMQ job (if it hasn't started processing yet)
  try {
    const job = await researchQueue.getJob(runId);
    if (job) {
      await job.remove();
    }
  } catch (err) {
    // Job might already be gone or Redis unreachable – non‑fatal
  }

  // 3. Update the run store to reflect cancellation
  const existing = getRun(runId);
  if (existing) {
    updateRun(runId, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: {
        code: "CANCELLED",
        message: "Run cancelled by user",
        occurredAt: new Date().toISOString(),
      },
    });
    return res.json({ runId, status: "cancelled" });
  }

  res.status(404).json({
    error: { code: "RUN_NOT_FOUND", message: "No run with that id." },
  });
});

export default router;
