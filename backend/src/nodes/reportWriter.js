// src/nodes/reportWriter.js
import { getLLM } from "../lib/llm.js";
import { GraphAnnotation } from "../graph/state.js";
import logger from "../lib/logger.js";

const MAX_FINDINGS_CHARS = 5000;

function truncate(text, max) {
  if (!text) return text;
  return text.length > max ? text.slice(0, max) + "\n…[truncated]" : text;
}

/**
 * Report Writer node:
 * Takes aggregated findings and writes a concise analyst‑style report with citations.
 */
export async function reportWriter(state) {
  logger.info("Writing draft report...");

  const model = getLLM();
  const findings = truncate(
    state.aggregated_findings || "No findings provided.",
    MAX_FINDINGS_CHARS,
  );

  const prompt = `
You are a senior equity research analyst. Based on the following collected research, write a
structured, analyst‑grade report. Use markdown. Include:
- Executive Summary
- Key Findings (with direct references to sources if possible)
- Risks / Contradictions
- Sentiment Overview
- Conclusion

Research data:
${findings}

Now produce the report.
`;

  const response = await model.invoke(prompt);
  const draft = response.content.trim();

  return {
    draft_report: draft,
    messages: [
      ...(state.messages || []),
      { role: "assistant", content: draft },
    ],
  };
}
