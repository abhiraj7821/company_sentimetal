// src/routes/stream.js
import { Router } from "express";
import { getRun, runEvents } from "../graph/runStore.js";

const router = Router();

/**
 * GET /research/:runId/stream (SSE)
 * Sends the current run record immediately, then pushes the full record
 * again every time runStore emits an update for this runId. No Redis
 * pub/sub needed at this scale — see runStore.js's comment on `runEvents`.
 */
router.get("/research/:runId/stream", (req, res) => {
  const { runId } = req.params;
  const run = getRun(runId);
  if (!run) {
    return res.status(404).json({
      error: { code: "RUN_NOT_FOUND", message: "No run with that id." },
    });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    // Needed if the frontend dev server runs on a different origin.
    "Access-Control-Allow-Origin": req.headers.origin || "*",
  });
  res.flushHeaders?.();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send(run);

  const onUpdate = (updatedRun) => send(updatedRun);
  runEvents.on(runId, onUpdate);

  // Heartbeat keeps some proxies/load balancers from closing an idle SSE
  // connection during long stretches between updates.
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    runEvents.off(runId, onUpdate);
    res.end();
  });
});

export default router;
