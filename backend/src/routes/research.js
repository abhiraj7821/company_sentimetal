// src/routes/research.js
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { createRun } from "../graph/runStore.js";
import { researchQueue } from "../queue/researchQueue.js";
import logger from "../lib/logger.js";

const router = Router();

/**
 * POST /research
 * Body: StartNewResearch's formData, unchanged (see §1 of the contract).
 * Does NOT call the graph directly — enqueues a job and returns
 * immediately so the request thread never blocks on a multi-minute run.
 */
router.post("/research", async (req, res) => {
  try {
    const runId = uuidv4();
    createRun(runId, req.body);

    await researchQueue.add("run", { runId, formData: req.body });

    res.status(202).json({
      runId,
      status: "queued",
      pollUrl: `/research/${runId}/status`,
      streamUrl: `/research/${runId}/stream`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to enqueue research run");
    res.status(500).json({
      error: {
        code: "ENQUEUE_FAILED",
        message: err.message || "Failed to start research run.",
      },
    });
  }
});

export default router;
