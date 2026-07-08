// src/tools/webScraper.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as cheerio from "cheerio";

/**
 * Scrape and clean the main textual content from a web page.
 * Uses cheerio for HTML parsing – no external scraping API needed.
 */
async function scrape(url) {
  let html;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SentinelSwarm/1.0; +sentinel@swarm.io)",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    html = await response.text();
  } catch (err) {
    return `Scraping failed: ${err.message}`;
  }
  const $ = cheerio.load(html);
  // Remove non-content elements
  $(
    "script, style, nav, footer, header, iframe, .sidebar, #sidebar, .advertisement",
  ).remove();
  const title = $("title").text().trim();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);
  return `🌐 Title: ${title}\n📝 Content: ${bodyText}`;
}

export const scrapeWebPage = tool(scrape, {
  name: "scrape_web_page",
  description:
    "Extract the main textual content from a web page (e.g., product page, pricing page).",
  schema: z.object({
    url: z.string().url().describe("The full URL to scrape"),
  }),
});
