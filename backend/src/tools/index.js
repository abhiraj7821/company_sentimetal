// src/tools/index.js

// First-party tools (free APIs / scraping)
import { fetchSecFilings } from "./secEdgar.js";
import { fetchNews } from "./newsApi.js";
import { fetchStockFundamentals } from "./stockFundamentals.js";
import { scrapeWebPage } from "./webScraper.js";

// RAG-backed tool
import { vectorSearchTool } from "./vectorSearch.js";

// LLM-powered analysis tools (Groq, free tier)
import { documentQATool } from "./documentQA.js";
import { tableQATool } from "./tableQA.js";
import { classifyNewsTool } from "./classifyNews.js";
import { sentimentScorerTool } from "./sentimentScorer.js";

/**
 * All tools available to agents.
 * Add new tools here to make them automatically available throughout the swarm.
 */
export const allTools = [
  fetchSecFilings,
  fetchNews,
  fetchStockFundamentals,
  scrapeWebPage,
  vectorSearchTool,
  documentQATool,
  tableQATool,
  classifyNewsTool,
  sentimentScorerTool,
];
