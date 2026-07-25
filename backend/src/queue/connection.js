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

/**
 * General-purpose client for runStore.js's CRUD against `run:*` keys
 * (GET/SET/PUBLISH). Deliberately a separate connection from `connection`
 * above (which BullMQ owns) and from `subClient` below.
 *
 * PUBLISH is safe to issue from this client — it's SUBSCRIBE that changes
 * a connection's mode, not PUBLISH — so runStore.js's writes and its
 * "notify subscribers" step can share this one client.
 */
export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

/**
 * Dedicated subscriber client, used ONLY by routes/stream.js.
 *
 * Once an ioredis connection issues SUBSCRIBE, that connection can only
 * run pub/sub commands until it unsubscribes from everything — it can no
 * longer GET/SET. Keeping this client exclusively for subscribing (never
 * used for runStore reads/writes) avoids "ERR only (P)SUBSCRIBE / (P)
 * UNSUBSCRIBE ... are allowed in this context" errors.
 *
 * One shared client is fine even with many concurrent SSE connections:
 * ioredis lets a single connection SUBSCRIBE to many channels, and
 * dispatches incoming messages via the channel name on the 'message'
 * event — routes/stream.js filters by channel per request.
 */
export const subClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});
