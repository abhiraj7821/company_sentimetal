// src/nodes/aggregator.js
import { GraphAnnotation } from "../graph/state.js";
import logger from "../lib/logger.js";

/**
 * Cap how much of any single agent's output gets forwarded into the
 * aggregated findings. Uncapped, a scraped webpage (up to 5,000 chars) or a
 * long news article list can balloon the prompts sent to the report writer
 * and critic — both of which receive this ENTIRE blob, on every run.
 */
const MAX_SECTION_CHARS = 1200;

function cap(text) {
  if (!text) return text;
  return text.length > MAX_SECTION_CHARS
    ? text.slice(0, MAX_SECTION_CHARS) + "\n…[truncated]"
    : text;
}

/**
 * Aggregator node:
 * Merges the raw agent outputs into a single structured findings string.
 * This is a pure function; it reads from state, doesn't call any external API.
 */
export async function aggregator(state) {
  logger.info("Aggregating research findings...");

  const filing = cap(state.filing_data || "");
  const news = cap(state.news_data || "");
  const sentiment = cap(state.sentiment_data || "");
  const web = cap(state.web_data || "");

  const parts = [];

  if (filing) {
    parts.push(`## SEC Filings\n${filing}`);
  }
  if (news) {
    parts.push(`## Recent News\n${news}`);
  }
  if (sentiment) {
    parts.push(`## Sentiment Analysis\n${sentiment}`);
  }
  if (web) {
    parts.push(`## Web Scout\n${web}`);
  }

  const aggregated =
    parts.length > 0 ? parts.join("\n\n") : "No research data available.";

  return {
    aggregated_findings: aggregated,
    messages: [...(state.messages || [])],
  };
}
