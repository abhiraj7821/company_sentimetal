// src/tools/stockFundamentals.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import config from "../config/index.js";

/**
 * Fetch stock fundamentals (overview) from Alpha Vantage.
 * Requires ALPHAVANTAGE_KEY in .env.
 */
async function getStockFundamentals(symbol) {
  if (!config.alphaVantageKey) {
    return "Alpha Vantage API key not configured. Cannot retrieve stock data.";
  }
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${config.alphaVantageKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }
  const data = await response.json();
  if (data.Note || data["Error Message"]) {
    return `Alpha Vantage error: ${data.Note || data["Error Message"]}`;
  }
  if (!data.Symbol) {
    return "No fundamental data found for this ticker.";
  }
  // Return a concise summary
  return (
    `🏢 ${data.Name} (${data.Symbol})\n` +
    `Sector: ${data.Sector} | Industry: ${data.Industry}\n` +
    `Market Cap: ${data.MarketCapitalization}\n` +
    `P/E Ratio: ${data.PERatio}\n` +
    `EPS: ${data.EPS}\n` +
    `Dividend Yield: ${data.DividendYield}\n` +
    `52-Week High: ${data["52WeekHigh"]} | Low: ${data["52WeekLow"]}\n` +
    `Description: ${data.Description?.slice(0, 300)}`
  );
}

export const fetchStockFundamentals = tool(getStockFundamentals, {
  name: "fetch_stock_fundamentals",
  description:
    "Get key financial metrics and company description for a stock ticker from Alpha Vantage.",
  schema: z.object({
    symbol: z.string().describe("Stock ticker symbol, e.g. AAPL"),
  }),
});
