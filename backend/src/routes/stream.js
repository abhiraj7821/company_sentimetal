// src/routes/stream.js
import express from "express";
import { researchEvents } from "../queue/events.js";
import logger from "../lib/logger.js";

const router = express.Router();

/**
 * GET /research/:jobId/stream
 * Opens an SSE connection that pushes job progress updates.
 */
router.get("/:jobId/stream", (req, res) => {
  const jobId = req.params.jobId;

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ event: "connected", jobId })}\n\n`);

  // Handler for progress events for this job
  const handler = (progress) => {
    if (progress.jobId === jobId) {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    }
  };

  researchEvents.on("progress", handler);

  // Cleanup on client disconnect
  req.on("close", () => {
    researchEvents.removeListener("progress", handler);
    logger.info({ jobId }, "SSE client disconnected");
  });
});

export default router;
