// src/tools/newsApi.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Fetch recent news articles using the free GDELT Doc API.
 * No API key required.
 */
async function getNews(query) {
  const base = "https://api.gdeltproject.org/api/v2/doc/doc?query=";
  const url = `${base}${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=10`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GDELT API error: ${response.status}`);
  }
  const data = await response.json();
  const articles = data.articles || [];
  if (articles.length === 0) return "No recent news articles found.";
  return articles
    .map(
      (a, i) =>
        `📰 [${i + 1}] ${a.title}\n   Date: ${a.seendate}\n   URL: ${a.url}`,
    )
    .join("\n\n");
}

export const fetchNews = tool(getNews, {
  name: "fetch_news",
  description: "Fetch recent news articles about a company from GDELT.",
  schema: z.object({
    query: z.string().describe("Company name or ticker to search for"),
  }),
});
