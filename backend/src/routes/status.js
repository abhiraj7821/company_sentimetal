// src/routes/status.js
import express from "express";
import { researchQueue } from "../queue/researchQueue.js";
import logger from "../lib/logger.js";

const router = express.Router();

/**
 * GET /research/:jobId
 * Returns job status and current state snapshot.
 */
router.get("/:jobId", async (req, res) => {
  try {
    const job = await researchQueue.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const state = await job.getState();
    const progress = await job.getProgress();
    const result = job.returnvalue || null;

    // Build response with useful fields
    const response = {
      jobId: job.id,
      state,
      progress,
      result,
      ...(progress?.threadId ? { threadId: progress.threadId } : {}),
    };
    return res.json(response);
  } catch (err) {
    logger.error({ err }, "Failed to get job status");
    return res.status(500).json({ error: "Failed to get status" });
  }
});

export default router;
