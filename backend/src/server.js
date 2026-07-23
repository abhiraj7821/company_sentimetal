// src/server.js
import express from "express";
import cors from "cors";
import config from "./config/index.js";
import logger from "./lib/logger.js";

import researchRoutes from "./routes/research.js";
import statusRoutes from "./routes/status.js";
import reportRoutes from "./routes/report.js";
import streamRoutes from "./routes/stream.js";
import approveRoutes from "./routes/approve.js";
import stopRoutes from "./routes/stop.js";

import { researchLimiter } from "./middleware/rateLimiter.js";

const app = express();
app.set("trust proxy", 1); // Required for proper IP detection behind proxies
app.use(cors());
app.use(express.json());

// Apply rate limiter ONLY to the research creation endpoint
app.use("/research", researchLimiter);
app.use(researchRoutes);

app.use(statusRoutes);
app.use(reportRoutes);
app.use(streamRoutes);
app.use(approveRoutes);
app.use(stopRoutes);

app.listen(config.port, () => {
  logger.info(`SentinelSwarm API listening on port ${config.port}`);
});
