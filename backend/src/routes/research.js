// src/routes/research.js
import express from "express";
import { researchQueue } from "../queue/researchQueue.js";
import logger from "../lib/logger.js";

const router = express.Router();

/**
 * POST /research
 * Body: { company, task_queue? }
 * Enqueues a new research job and returns jobId + threadId.
 */
router.post("/", async (req, res) => {
  try {
    const { company, task_queue } = req.body;
    if (!company) {
      return res.status(400).json({ error: "company is required" });
    }

    const job = await researchQueue.add("research", { company, task_queue });
    logger.info({ jobId: job.id, company }, "Research job enqueued");
    return res.status(202).json({
      jobId: job.id,
      threadId: job.id, // we can use job.id as thread_id if not provided elsewhere
      status: "pending",
    });
  } catch (err) {
    logger.error({ err }, "Failed to enqueue research job");
    return res.status(500).json({ error: "Failed to start research" });
  }
});

export default router;
