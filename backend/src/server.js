// src/server.js
import express from "express";
import researchRoute from "./routes/research.js";
import statusRoute from "./routes/status.js";
import approveRoute from "./routes/approve.js";
import streamRoute from "./routes/stream.js";
import logger from "./lib/logger.js";

const app = express();

// Middleware
app.use(express.json());

// Mount routes
app.use("/research", researchRoute);
app.use("/research", statusRoute); // GET /research/:jobId
app.use("/research", approveRoute); // POST /research/:jobId/approve
app.use("/research", streamRoute); // GET /research/:jobId/stream

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
