// src/routes/status.js
import { Router } from "express";
import { getRun } from "../graph/runStore.js";

const router = Router();

// Rough heuristic for estimatedSecondsRemaining — doesn't need to be exact
// per the routing doc, just directionally useful for a progress estimate.
const AVG_SECONDS_PER_REMAINING_AGENT = 20;

/**
 * GET /research/:runId/status
 * Pure read — never touches GraphAnnotation, only the run store.
 */
router.get("/research/:runId/status", (req, res) => {
  const run = getRun(req.params.runId);
  if (!run) {
    return res.status(404).json({
      error: { code: "RUN_NOT_FOUND", message: "No run with that id." },
    });
  }

  const remainingAgents = Object.values(run.agents).filter(
    (a) =>
      a.status === "pending" ||
      a.status === "in-progress" ||
      a.status === "active",
  ).length;

  const isTerminal = run.status === "completed" || run.status === "failed";

  res.json({
    runId: run.runId,
    status: run.status,
    company: run.company,
    progress: run.progress,
    estimatedSecondsRemaining: isTerminal
      ? 0
      : remainingAgents * AVG_SECONDS_PER_REMAINING_AGENT,
    agents: run.agents,
    logs: run.logs,
    ...(run.status === "failed" && run.error ? { error: run.error } : {}),
  });
});

export default router;
