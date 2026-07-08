// src/nodes/supervisor.js
import { filingGraph } from "./agents/filingAgent.js";
import { newsGraph } from "./agents/newsAgent.js";
import { sentimentGraph } from "./agents/sentimentAgent.js";
import { webScoutGraph } from "./agents/webScoutAgent.js";
import { GraphAnnotation } from "../graph/state.js";
import logger from "../lib/logger.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Small pause inserted between sequential agent calls.
 *
 * Groq's org-wide limit is 12,000 tokens/minute. A single agent call has
 * been observed to use ~1,000–3,400 tokens, and rate-limit windows have
 * been observed to take up to ~54s to fully reset. Running the four agents
 * one after another (instead of in parallel) already keeps us well under
 * the limit in steady state, but adding a short buffer between calls gives
 * the token bucket room to refill and avoids stacking calls right at a
 * window boundary.
 */
const INTER_AGENT_DELAY_MS = 2500;

/**
 * Run a single agent graph and normalize failures into a fallback value,
 * so a single agent's rate-limit/error doesn't take down the whole run.
 */
async function runAgent(label, invokeFn, outputKey, fallbackValue = "") {
  try {
    const res = await invokeFn();
    return { [outputKey]: res[outputKey] ?? fallbackValue };
  } catch (err) {
    logger.error({ error: err }, `Agent "${label}" failed`);
    return { [outputKey]: fallbackValue };
  }
}

/**
 * Supervisor node:
 * - Runs enabled agents ONE AT A TIME (not in parallel), waiting for each
 *   agent's result before starting the next. This is the key change from
 *   the previous parallel/`Promise.allSettled` version: running four LLM
 *   calls concurrently was bursting past Groq's shared TPM budget even
 *   though each individual call was small.
 * - A short delay is inserted between agents as extra headroom against
 *   the rate limit (see INTER_AGENT_DELAY_MS above).
 * - Writes each agent's output into the appropriate state field as soon
 *   as it's available, then aggregates at the end.
 */
export async function supervisor(state) {
  logger.info("Supervisor running research agents sequentially...");

  const tasks = state.task_queue || [
    "filing",
    "news",
    "sentiment",
    "web_scout",
  ]; // default all

  const baseState = {
    company: state.company,
    messages: state.messages || [],
  };

  const updates = {};

  // ── 1. Filing ──
  if (tasks.includes("filing")) {
    logger.info("Supervisor: running filing agent...");
    Object.assign(
      updates,
      await runAgent(
        "filing",
        () => filingGraph.invoke(baseState),
        "filing_data",
      ),
    );
    await sleep(INTER_AGENT_DELAY_MS);
  } else {
    updates.filing_data = "";
  }

  // ── 2. News ──
  if (tasks.includes("news")) {
    logger.info("Supervisor: running news agent...");
    Object.assign(
      updates,
      await runAgent("news", () => newsGraph.invoke(baseState), "news_data"),
    );
    await sleep(INTER_AGENT_DELAY_MS);
  } else {
    updates.news_data = "";
  }

  // ── 3. Sentiment (depends on news_data, so it must run after News anyway) ──
  if (tasks.includes("sentiment")) {
    logger.info("Supervisor: running sentiment agent...");
    Object.assign(
      updates,
      await runAgent(
        "sentiment",
        () =>
          sentimentGraph.invoke({
            ...baseState,
            news_data: updates.news_data || "No news data.",
          }),
        "sentiment_data",
      ),
    );
    await sleep(INTER_AGENT_DELAY_MS);
  } else {
    updates.sentiment_data = "";
  }

  // ── 4. Web Scout ──
  if (tasks.includes("web_scout")) {
    logger.info("Supervisor: running web scout agent...");
    const targetUrl =
      state.targetUrl || `https://www.${state.company.toLowerCase()}.com`;
    Object.assign(
      updates,
      await runAgent(
        "web_scout",
        () => webScoutGraph.invoke({ ...baseState, targetUrl }),
        "web_data",
      ),
    );
    // No trailing delay needed — this is the last agent in the sequence.
  } else {
    updates.web_data = "";
  }

  // Merge into aggregated_findings (will be finalised by aggregator, but we can pre‑fill)
  const combined = [
    updates.filing_data && `--- SEC Filings ---\n${updates.filing_data}`,
    updates.news_data && `--- News ---\n${updates.news_data}`,
    updates.sentiment_data && `--- Sentiment ---\n${updates.sentiment_data}`,
    updates.web_data && `--- Web Scout ---\n${updates.web_data}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  logger.info("Supervisor: all agents complete.");

  return {
    ...updates,
    aggregated_findings: combined,
    task_queue: [],
    messages: [...(state.messages || [])],
    research_attempts: (state.research_attempts || 0) + 1,
  };
}
