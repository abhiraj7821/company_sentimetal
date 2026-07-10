// src/eval/groundednessScorer.js
import { getLLM } from "../lib/llm.js";
import logger from "../lib/logger.js";

/**
 * Splits text into individual factual claims using simple heuristics
 * (splits on bullet points, numbered lists, and full stops).
 */
function splitClaims(text) {
  if (!text) return [];
  // Split on lines that look like bullet points or numbers
  const lines = text.split(/\n\s*[-*•]|\n\s*\d+\.\s*/);
  if (lines.length > 1) return lines.map((l) => l.trim()).filter(Boolean);

  // Otherwise split by sentences
  return text
    .split(/\.\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Uses LLM to judge if a single claim is supported by the provided sources.
 * Returns true/false and a brief explanation.
 */
async function judgeClaim(claim, sources) {
  // TODO:
  // const model = getLLM("claude-haiku-4-5-20251001", { temperature: 0 });
  const model = getLLM();
  const prompt = `
You are a strict fact-checker. Given the following claim and the research data,
determine if the claim is fully supported by the data.

Claim:
${claim}

Research data (excerpt):
${sources.slice(0, 3000)}

Answer with ONLY "TRUE" or "FALSE" followed by a very short explanation.
If the claim is not mentioned or only partially supported, say FALSE.
`;
  const response = await model.invoke(prompt);
  const answer = response.content.trim();
  const isTrue = answer.toUpperCase().startsWith("TRUE");
  return { isTrue, explanation: answer };
}

/**
 * Evaluates groundedness: what fraction of factual claims in the report
 * can be traced back to the research sources.
 *
 * @param {string} report - the final analyst report
 * @param {string} sources - the aggregated research findings
 * @returns {{ score: number, claims: Array<{claim, isTrue, explanation}> }}
 */
export async function scoreGroundedness(report, sources) {
  const claims = splitClaims(report).slice(0, 12); // max 12 claims to keep costs down
  if (claims.length === 0) return { score: 1, claims: [] };

  const results = [];
  for (const claim of claims) {
    const { isTrue, explanation } = await judgeClaim(claim, sources);
    results.push({ claim, isTrue, explanation });
  }

  const trueCount = results.filter((r) => r.isTrue).length;
  const score = trueCount / results.length;
  return { score, claims: results };
}
