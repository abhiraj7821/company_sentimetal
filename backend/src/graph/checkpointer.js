// src/graph/checkpointer.js
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { MemorySaver } from "@langchain/langgraph";
import pool from "../db/pool.js";
import logger from "../lib/logger.js";
import config from "../config/index.js";

let checkpointer = null;

export async function getCheckpointer() {
  if (checkpointer) return checkpointer;

  const useMemory = config.checkpointer === "memory";

  if (useMemory) {
    logger.info("Using in-memory checkpointer (test/dev mode)");
    checkpointer = new MemorySaver();
    return checkpointer;
  }

  // Try SQLite if Postgres fails (or explicitly configured)
  if (config.checkpointer === "sqlite" || !config.databaseUrl) {
    // sqlite-saver requires a db file path; default to ':memory:' for ephemeral
    const dbPath = config.checkpointerPath || ":memory:";
    logger.info(`Using Sqlite checkpointer at ${dbPath}`);
    const sqliteDb = await import("better-sqlite3").then((m) => m.default);
    const db = new sqliteDb(dbPath);
    checkpointer = new SqliteSaver(db);
    await checkpointer.setup();
    return checkpointer;
  }

  // Default: PostgreSQL
  try {
    logger.info("Initializing Postgres checkpointer...");
    checkpointer = new PostgresSaver(pool);
    await checkpointer.setup();
    logger.info("Postgres checkpointer ready.");
  } catch (err) {
    logger.warn(
      { err },
      "Postgres checkpointer failed, falling back to Sqlite in-memory",
    );
    // Fallback to Sqlite memory
    const sqliteDb = await import("better-sqlite3").then((m) => m.default);
    const db = new sqliteDb(":memory:");
    checkpointer = new SqliteSaver(db);
    await checkpointer.setup();
  }

  return checkpointer;
}
