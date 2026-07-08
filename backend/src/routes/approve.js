// src/routes/approve.js
import express from "express";
import { researchQueue } from "../queue/researchQueue.js";
import logger from "../lib/logger.js";

const router = express.Router();

/**
 * POST /research/:jobId/approve
 * Body: { approved: boolean, feedback?: string }
 * Resumes the interrupted graph by enqueuing a resume job with the same thread_id.
 */
router.post("/:jobId/approve", async (req, res) => {
  try {
    const { approved, feedback } = req.body;
    if (typeof approved !== "boolean") {
      return res.status(400).json({ error: "approved (boolean) is required" });
    }

    const originalJob = await researchQueue.getJob(req.params.jobId);
    if (!originalJob) {
      return res.status(404).json({ error: "Original job not found" });
    }

    const progress = await originalJob.getProgress();
    const threadId = progress?.threadId;
    if (!threadId) {
      return res
        .status(400)
        .json({ error: "No threadId found in original job progress" });
    }

    // Enqueue a new job with resume payload (same thread_id)
    const resumeJob = await researchQueue.add("resume", {
      thread_id: threadId,
      resume: { approved, feedback: feedback || "" },
    });

    logger.info(
      { resumeJobId: resumeJob.id, threadId, approved },
      "Resume job enqueued",
    );
    return res.status(202).json({
      jobId: resumeJob.id,
      threadId,
      status: "resume_pending",
    });
  } catch (err) {
    logger.error({ err }, "Failed to approve");
    return res.status(500).json({ error: "Approval failed" });
  }
});

export default router;
