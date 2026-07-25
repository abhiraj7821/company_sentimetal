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

  // 2. Remove the BullMQ job, if it hasn't started processing yet.
  // A run can be cancelled at two different job stages, each with its
  // own jobId (see research.js / approve.js): the original "run:{runId}"
  // job, or — if cancelled after an approval cycle was already kicked
  // off — the "resume:{runId}" job. Check both; neither existing just
  // means the job already finished or is actively running (job.remove()
  // only removes queued/waiting jobs anyway, not active ones).
  try {
    const runJob = await researchQueue.getJob(`run-${runId}`);
    if (runJob) {
      await runJob.remove();
    }
    const resumeJob = await researchQueue.getJob(`resume-${runId}`);
    if (resumeJob) {
      await resumeJob.remove();
    }
  } catch (err) {
    // Job might already be gone, active (not removable), or Redis
    // unreachable – non-fatal, run status update below still proceeds.
  }

  // 3. Update the run store to reflect cancellation
  const existing = await getRun(runId);
  if (existing) {
    await updateRun(runId, {
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
