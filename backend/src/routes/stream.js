// src/routes/stream.js
import { Router } from "express";
import { getRun, channelForRun } from "../graph/runStore.js";
import { subClient } from "../queue/connection.js";

const router = Router();

/**
 * GET /research/:runId/stream (SSE)
 * Sends the current run record immediately, then pushes the full record
 * again every time runStore.js publishes an update for this runId's
 * channel on Redis. Replaces the old local-EventEmitter version, which
 * only ever saw updates written by the SAME process — worker.js writes
 * never reached the API process's SSE clients.
 */
router.get("/research/:runId/stream", async (req, res) => {
  const { runId } = req.params;
  const run = await getRun(runId);
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

  const channel = channelForRun(runId);

  // subClient is shared across all concurrent SSE connections (see
  // connection.js), so filter by channel name on every message rather
  // than assuming this listener only ever fires for our runId.
  const onMessage = (chan, message) => {
    if (chan !== channel) return;
    try {
      send(JSON.parse(message));
    } catch (err) {
      // Malformed payload — skip rather than crash the SSE stream.
    }
  };

  subClient.on("message", onMessage);
  await subClient.subscribe(channel);

  // Heartbeat keeps some proxies/load balancers from closing an idle SSE
  // connection during long stretches between updates.
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    subClient.off("message", onMessage);
    subClient.unsubscribe(channel).catch(() => {});
    res.end();
  });
});

export default router;
