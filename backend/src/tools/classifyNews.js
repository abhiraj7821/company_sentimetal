// src/tools/classifyNews.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { getLLM } from "../lib/llm.js";

/**
 * Classify a news article into one of the given categories.
 * This is a zero‑shot classification task, performed by Groq.
 */
async function classifyNews(text, labels) {
  const model = getLLM();
  const labelString = labels.join(", ");
  const prompt = `Classify the following news article into EXACTLY ONE of these categories: ${labelString}. Respond with only the category name.\n\nArticle:\n${text}\nCategory:`;
  const response = await model.invoke(prompt);
  const category = response.content.trim();
  // Ensure the response matches one of the labels (simple fallback)
  if (labels.includes(category)) return category;
  return `Unknown (best guess: ${category})`;
}

export const classifyNewsTool = tool(classifyNews, {
  name: "classify_news_category",
  description:
    "Categorize a news article into a predefined set of categories (e.g., product launch, lawsuit, earnings, partnership).",
  schema: z.object({
    text: z.string().describe("The news article content"),
    labels: z.array(z.string()).describe("List of candidate category labels"),
  }),
});
