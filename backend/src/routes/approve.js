// src/routes/approve.js
import { Router } from "express";
import { getRun, updateRun } from "../graph/runStore.js";
import { researchQueue } from "../queue/researchQueue.js";

const router = Router();

const VALID_DECISIONS = ["approved", "changes_requested"];

/**
 * POST /research/:runId/approve
 * Enqueues a RESUME job (not a new run) — worker.js's "resume" handler
 * turns this into `new Command({ resume: {...} })` against the same
 * thread_id, continuing the graph from its interrupt() checkpoint.
 */
router.post("/research/:runId/approve", async (req, res) => {
  const { runId } = req.params;
  const run = getRun(runId);
  if (!run) {
    return res.status(404).json({
      error: { code: "RUN_NOT_FOUND", message: "No run with that id." },
    });
  }
  if (run.status !== "awaiting_approval") {
    return res.status(409).json({
      runId,
      status: run.status,
      message: "Run is not currently awaiting approval.",
    });
  }

  const { decision, comment } = req.body || {};
  if (!VALID_DECISIONS.includes(decision)) {
    return res.status(400).json({
      error: {
        code: "INVALID_DECISION",
        message: `decision must be one of: ${VALID_DECISIONS.join(", ")}`,
      },
    });
  }

  updateRun(runId, { status: "running" }); // optimistic, matches the contract's response
  await researchQueue.add("resume", {
    runId,
    decision,
    comment: comment || null,
  });

  res.json({ runId, status: "running", approval_status: decision });
});

export default router;
