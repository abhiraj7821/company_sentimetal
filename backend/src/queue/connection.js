// src/queue/connection.js
import Redis from "ioredis";
import config from "../config/index.js";

/**
 * Shared Redis connection for BullMQ.
 * BullMQ uses IORedis internally, so we export a compatible instance.
 */
export const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
});
