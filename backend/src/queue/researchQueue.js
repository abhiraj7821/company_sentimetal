// src/queue/researchQueue.js
import { Queue } from "bullmq";
import { connection } from "./connection.js";

/**
 * BullMQ queue for background research runs.
 * Jobs are enqueued by the POST /research endpoint and processed
 * by the worker (worker.js).
 */
export const researchQueue = new Queue("research", { connection });
