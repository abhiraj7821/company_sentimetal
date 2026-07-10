// src/queue/researchQueue.js
import { Queue } from "bullmq";
import IORedis from "ioredis";
import config from "../config/index.js";

// BullMQ requires this option on the connection it's handed.
export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const researchQueue = new Queue("research", {
  connection: redisConnection,
});
