// src/tools/newsApi.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import https from "node:https";
import config from "../config/index.js";

const NEWSDATA_API_KEY = config.newsdata_api_key;

// Free tier: 200 credits/day, 30 requests per 15 min window
// 1 credit = 1 request (except archive = 5 credits)
// Default page size: 10 articles for free, 50 for paid
const MIN_INTERVAL_MS = 30_000; // 30s between requests (safe for free tier: 2/min)
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_COOLDOWNS_MS = [30_000, 60_000, 120_000]; // escalating backoff

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestTime = 0;

async function waitForRateLimit() {
  const now = Date.now();
  const wait = lastRequestTime + MIN_INTERVAL_MS - now;
  if (wait > 0) await sleep(wait);
  lastRequestTime = Date.now();
}

function httpsGetJson(url, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { Accept: "application/json" },
        family: 4,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            const data = JSON.parse(text);
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              data,
              raw: text,
            });
          } catch {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              data: null,
              raw: text,
            });
          }
        });
      },
    );
    req.on("timeout", () =>
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`)),
    );
    req.on("error", reject);
  });
}

/**
 * Build a NewsData.io query URL.
 * Uses the "latest" endpoint for recent news (up to past 48 hours).
 * For company news, we use the "market" endpoint if available, but
 * the "latest" endpoint works great for general company news.
 */
function buildNewsDataUrl(params) {
  const base = "https://newsdata.io/api/1/market";
  const searchParams = new URLSearchParams();

  // Required — pass the key directly, it's already a string
  searchParams.append("apikey", config.newsdata_api_key);

  // Optional params passed in
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  return `${base}?${searchParams.toString()}`;
}

/**
 * Sanitize a company query for NewsData.io.
 * NewsData.io supports AND, OR, NOT, parentheses, and quotes.
 * Max 512 characters for q/qInTitle/qInMeta.
 * We keep the company name clean and use qInTitle for relevance.
 */
function sanitizeQuery(rawQuery) {
  return rawQuery
    .replace(
      /\b(inc|incorporated|corp|corporation|co|company|ltd|limited|llc|plc)\.?\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 512);
}

async function getNews({
  query,
  language = "en",
  size = 10,
  prioritydomain = "medium",
}) {
  // ─── Validate API Key ───────────────────────────────────────────────
  if (!NEWSDATA_API_KEY || NEWSDATA_API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error(
      "NewsData.io API key is missing. Set NEWSDATA_API_KEY environment variable or update the constant in newsApi.js. Get a free key at https://newsdata.io/register",
    );
  }

  const sanitizedQuery = sanitizeQuery(query);

  // Build parameters for NewsData.io
  const params = {
    qInTitle: sanitizedQuery, // search in titles only for relevance
    language, // e.g., "en"
    size: Math.min(Math.max(size, 1), 10), // free tier max 10
    prioritydomain, // top | medium | low
    removeduplicate: 1, // filter duplicates
    sort: "relevancy", // most relevant first
  };

  const url = buildNewsDataUrl(params);

  console.log("[newsApi] NewsData.io query:", sanitizedQuery);
  console.log("[newsApi] full URL:", url.replace(NEWSDATA_API_KEY, "REDACTED"));

  let lastError = new Error("No attempts were made");

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await waitForRateLimit();

    try {
      const { status, statusText, data, raw } = await httpsGetJson(url);

      // ─── Rate Limit Handling ──────────────────────────────────────
      if (status === 429) {
        const cooldown =
          RATE_LIMIT_COOLDOWNS_MS[attempt] ?? RATE_LIMIT_COOLDOWNS_MS.at(-1);
        lastError = new Error(`NewsData.io rate limited (status ${status})`);
        console.warn(
          `NewsData.io rate limited — cooling down ${cooldown}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS})`,
        );
        lastRequestTime = Date.now() + cooldown - MIN_INTERVAL_MS;
        continue;
      }

      // ─── Auth / Bad Request Errors ────────────────────────────────
      if (status === 401 || status === 403) {
        throw new Error(
          `NewsData.io authentication failed (${status} ${statusText}). Check your API key.`,
        );
      }
      if (status === 400 || status === 422) {
        throw new Error(
          `NewsData.io rejected the query (${status} ${statusText}): ${raw?.slice(0, 200)}`,
        );
      }
      if (status < 200 || status >= 300) {
        throw new Error(`NewsData.io API error: ${status} ${statusText}`);
      }

      // ─── Parse Response ───────────────────────────────────────────
      if (!data) {
        throw new Error(
          `NewsData.io returned non-JSON (not retryable): ${raw?.slice(0, 200)}`,
        );
      }

      // Check API-level errors
      if (data.status === "error") {
        const msg = data.message || data.code || "Unknown API error";
        throw new Error(`NewsData.io API error: ${msg}`);
      }

      const articles = data.results || [];
      if (articles.length === 0) return "No recent news articles found.";

      return articles
        .map(
          (a, i) =>
            `📰 [${i + 1}] ${a.title}\n   Date: ${a.pubDate}\n   Source: ${a.source_name || a.source_id || "Unknown"}\n   URL: ${a.link}`,
        )
        .join("\n\n");
    } catch (err) {
      lastError = err;
      if (
        err.message.includes("not retryable") ||
        err.message.includes("authentication failed")
      ) {
        break;
      }
      if (attempt < MAX_ATTEMPTS - 1) {
        console.warn(
          `NewsData.io request failed (${err.message}) — retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})`,
        );
        continue;
      }
    }
  }

  throw new Error(
    `NewsData.io API: all ${MAX_ATTEMPTS} attempts failed. Last error: ${lastError.message}`,
  );
}

export const fetchNews = tool(getNews, {
  name: "fetch_news",
  description:
    "Fetch recent news articles about a company from NewsData.io (latest news endpoint, up to 48 hours back).",
  schema: z.object({
    query: z.string().describe("Company name or ticker to search for"),
    language: z
      .string()
      .optional()
      .default("en")
      .describe("Language code (e.g., 'en', 'es', 'fr')"),
    size: z
      .number()
      .optional()
      .default(10)
      .describe("Number of articles to return (1-10 for free tier)"),
    prioritydomain: z
      .enum(["top", "medium", "low"])
      .optional()
      .default("medium")
      .describe(
        "Source quality filter: top=top 10%, medium=top 30%, low=top 50%",
      ),
  }),
});
