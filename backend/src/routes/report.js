// src/routes/report.js
import { Router } from "express";
import { getRun } from "../graph/runStore.js";

const router = Router();

/**
 * GET /research/:runId/report
 * Zero computation here — reportPayload was already built once by
 * projector.js's projectReport() when the run completed, and cached on
 * the run record by streamHandlers.js.
 */
router.get("/research/:runId/report", async (req, res) => {
  // report.js — inside the handler:
  const run = await getRun(req.params.runId);
  if (!run) {
    return res.status(404).json({
      error: { code: "RUN_NOT_FOUND", message: "No run with that id." },
    });
  }

  if (run.status === "failed") {
    return res.status(200).json({
      runId: run.runId,
      status: "failed",
      error: run.error,
    });
  }

  if (run.status !== "completed" || !run.reportPayload) {
    return res.status(409).json({
      runId: run.runId,
      status: run.status,
      message: "Report is not ready yet.",
    });
  }

  res.json(run.reportPayload);
});

export default router;
