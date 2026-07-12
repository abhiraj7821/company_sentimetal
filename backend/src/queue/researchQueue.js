// src/queue/researchQueue.js
import { Queue } from "bullmq";
import IORedis from "ioredis";
import config from "../config/index.js";
import logger from "../lib/logger.js";

// TEMPORARY diagnostic — confirms whether REDIS_URL actually made it into
// this environment, without printing the real credentials.
logger.info(
  {
    redisUrlSet: Boolean(process.env.REDIS_URL),
    redisUrlHost: config.redisUrl
      ? new URL(config.redisUrl).hostname
      : "MISSING",
  },
  "Redis connection target",
);

let hasWarnedDown = false;

export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 10) {
      if (!hasWarnedDown) {
        logger.error(
          { redisUrl: config.redisUrl },
          "Redis unreachable after 10 attempts. Check REDIS_URL is set correctly on this service.",
        );
        hasWarnedDown = true;
      }
      return null;
    }
    return Math.min(times * 500, 5000);
  },
});

redisConnection.on("connect", () => {
  hasWarnedDown = false;
  logger.info("Connected to Redis");
});

redisConnection.on("error", (err) => {
  if (err.code !== "ECONNREFUSED" || !hasWarnedDown) {
    logger.error({ err }, "Redis connection error");
  }
});

export const researchQueue = new Queue("research", {
  connection: redisConnection,
});
