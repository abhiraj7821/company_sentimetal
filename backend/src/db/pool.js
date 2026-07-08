// src/db/pool.js
import pg from "pg";
import config from "../config/index.js";
import logger from "../lib/logger.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle database client");
});

// Helper to run a query with logging
export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ query: text, duration, rows: res.rowCount }, "Executed query");
  return res;
}

// Graceful shutdown
export async function closePool() {
  await pool.end();
  logger.info("Database pool closed");
}

export default pool;
