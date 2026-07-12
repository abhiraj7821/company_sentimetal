// src/graph/checkpointer.js
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
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

  // SqliteSaver/better-sqlite3 are dynamically imported ONLY when actually
  // needed. Both are native-module dependencies that require compiling
  // against Python/node-gyp if no prebuilt binary matches the deploy
  // target — a static top-level import would force npm to install (and
  // potentially fail to build) them even in a Postgres-only deployment
  // that never takes this code path. Move them to devDependencies in
  // package.json to match — see accompanying notes.
  if (config.checkpointer === "sqlite" || !config.databaseUrl) {
    const dbPath = config.checkpointerPath || ":memory:";
    logger.info(`Using Sqlite checkpointer at ${dbPath}`);
    const { SqliteSaver } =
      await import("@langchain/langgraph-checkpoint-sqlite");
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
    const { SqliteSaver } =
      await import("@langchain/langgraph-checkpoint-sqlite");
    const sqliteDb = await import("better-sqlite3").then((m) => m.default);
    const db = new sqliteDb(":memory:");
    checkpointer = new SqliteSaver(db);
    await checkpointer.setup();
  }

  return checkpointer;
}
