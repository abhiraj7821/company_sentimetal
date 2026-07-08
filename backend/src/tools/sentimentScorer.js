// src/tools/sentimentScorer.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { getLLM } from "../lib/llm.js";

/**
 * Score the sentiment of a text (news, social media post, etc.)
 * Returns a JSON with sentiment and confidence score.
 */
async function scoreSentiment(text) {
  const model = getLLM();
  const prompt = `Analyze the sentiment of the following text regarding the company mentioned. Output ONLY a valid JSON object with keys: "sentiment" (one of "positive", "negative", "neutral"), "score" (confidence 0 to 1), and "explanation" (one short sentence).\n\nText:\n${text}\nJSON:`;
  const response = await model.invoke(prompt);
  try {
    const result = JSON.parse(response.content.trim());
    return JSON.stringify(result);
  } catch {
    // Fallback: return raw string
    return response.content.trim();
  }
}

export const sentimentScorerTool = tool(scoreSentiment, {
  name: "score_sentiment",
  description:
    "Determine the sentiment (positive/negative/neutral) of a news article or text, along with a confidence score.",
  schema: z.object({
    text: z.string().describe("The text to analyze for sentiment"),
  }),
});
