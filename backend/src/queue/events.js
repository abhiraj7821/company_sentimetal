// src/queue/events.js
import { EventEmitter } from "node:events";

/**
 * Shared event emitter used to broadcast job progress to SSE clients.
 */
export const researchEvents = new EventEmitter();
