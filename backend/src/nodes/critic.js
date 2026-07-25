// src/nodes/critic.js
import { getLLM } from "../lib/llm.js";
import { GraphAnnotation } from "../graph/state.js";
import logger from "../lib/logger.js";

const MAX_SOURCES_CHARS = 2000;
const MAX_DRAFT_CHARS = 3000;

function truncate(text, max) {
  if (!text) return text;
  return text.length > max ? text.slice(0, max) + "\n…[truncated]" : text;
}

function isApprovedVerdict(text) {
  const normalized = text.trim().toUpperCase();
  return (
    normalized.startsWith("APPROVED") ||
    normalized.startsWith("**APPROVED") ||
    normalized.includes("VERDICT: APPROVED") ||
    (normalized.includes("APPROVED") && !normalized.includes("REVISE"))
  );
}

export async function critic(state) {
  logger.info("Critic reviewing draft report...");
  const model = getLLM();
  const draft = truncate(state.draft_report || "", MAX_DRAFT_CHARS);
  const sources = truncate(state.aggregated_findings || "", MAX_SOURCES_CHARS);

  const prompt = `
You are a meticulous fact‑checker. Review the following draft analyst report.
Compare it against the raw research data provided below.
Check for:
- Factual accuracy (does every claim have a basis in the data?)
- Contradictions within the report
- Missing important information
- Overly speculative statements

Respond with EXACTLY ONE WORD on the first line: either "APPROVED" or "REVISE".
If REVISE, follow it with a brief explanation of what needs to be fixed.
Do not use any markdown formatting (no asterisks, no headers) on the first line.

Raw research data (excerpt):
${sources}

Draft Report:
${draft}

Your judgement:
`;

  const response = await model.invoke(prompt);
  const judgement = response.content.trim();

  const priorRevisions = state.revision_attempts || 0;
  const MAX_REVISIONS = 2;

  let isApproved = isApprovedVerdict(judgement);
  let feedback = isApproved ? "Draft report is factually grounded." : judgement;

  const nextRevisionCount = isApproved ? priorRevisions : priorRevisions + 1;
  if (!isApproved && nextRevisionCount > MAX_REVISIONS) {
    logger.warn(
      { priorRevisions },
      "Critic reached max revision attempts; forcing approval to break the loop.",
    );
    isApproved = true;
    feedback = `Auto-approved after ${MAX_REVISIONS} revision attempts. Last critic feedback: ${judgement}`;
  }

  return {
    critic_feedback: feedback,
    // This is the critic's OWN verdict — approval_status is left
    // untouched here; only humanApproval.js writes that field now.
    critic_verdict: isApproved ? "approved" : "revise",
    revision_attempts: nextRevisionCount,
    messages: [
      ...(state.messages || []),
      { role: "assistant", content: feedback },
    ],
  };
}
