// src/tools/secEdgar.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Simple ticker → CIK mapping (can be extended / fetched dynamically)
const TICKER_CIK_MAP = {
  AAPL: "0000320193",
  GOOGL: "0001652044",
  MSFT: "0000789019",
  AMZN: "0001018724",
  TSLA: "0001318605",
};

/**
 * Fetch recent 10‑K/10‑Q filings for a stock ticker using SEC's EDGAR submissions API.
 * No API key required.
 */
async function fetchFilings({ ticker }) {
  // Ensure ticker is a string and uppercase
  if (typeof ticker !== "string") {
    return `Invalid input: ticker must be a string, received ${typeof ticker}`;
  }
  const normalized = ticker.toUpperCase().trim();
  const cik = TICKER_CIK_MAP[normalized];
  if (!cik) {
    return `Ticker "${normalized}" not found in local CIK map. Try AAPL, MSFT, etc.`;
  }

  const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SentinelSwarm/1.0 (contact@sentinel.swarm)" },
  });
  if (!res.ok) throw new Error(`SEC API error: ${res.status}`);
  const data = await res.json();
  const recent = data.filings?.recent || {};
  const forms = recent.form || [];
  const dates = recent.filingDate || [];
  const accessions = recent.accessionNumber || [];

  // Filter for 10‑K and 10‑Q
  const relevant = [];
  for (let i = 0; i < forms.length; i++) {
    if (forms[i] === "10-K" || forms[i] === "10-Q") {
      relevant.push(
        `📄 ${forms[i]} filed ${dates[i]} | Accession: ${accessions[i].replace(/-/g, "")}`,
      );
    }
  }

  if (relevant.length === 0) return "No recent 10-K or 10-Q filings found.";
  return relevant.slice(0, 5).join("\n");
}

export const fetchSecFilings = tool(fetchFilings, {
  name: "fetch_sec_filings",
  description:
    "Retrieve recent 10-K/10-Q filings for a stock ticker from SEC EDGAR.",
  schema: z.object({
    ticker: z.string().describe("Stock ticker, e.g. AAPL"),
  }),
});
