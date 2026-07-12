// src/server.example.js
//
// I don't have your actual src/index.js / app entrypoint, so this is a
// reference wiring — merge the relevant parts into your real entrypoint
// rather than dropping this in wholesale (route mount order, existing
// middleware, CORS config, etc. may already exist there).
import express from "express";
import cors from "cors";
import config from "./config/index.js";
import logger from "./lib/logger.js";

import researchRoutes from "./routes/research.js";
import statusRoutes from "./routes/status.js";
import reportRoutes from "./routes/report.js";
import streamRoutes from "./routes/stream.js";
import approveRoutes from "./routes/approve.js";

// Side-effect import: this starts the BullMQ worker process. In a real
// deployment you likely want this as a SEPARATE process/dyno from the
// HTTP server (`node src/queue/worker.js` run independently), not
// bundled into the same process as the API — importing it here is fine
// for local dev only.
import "./queue/worker.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(researchRoutes);
app.use(statusRoutes);
app.use(reportRoutes);
app.use(streamRoutes);
app.use(approveRoutes);

app.listen(config.port, () => {
  logger.info(`SentinelSwarm API listening on port ${config.port}`);
});
