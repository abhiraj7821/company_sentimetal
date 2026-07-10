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

/**
 * Robustly detect an "approved" verdict. Models don't always open with the
 * exact literal string "APPROVED" (e.g. "**APPROVED**", or a lead-in
 * sentence) — matching only feedback.startsWith("APPROVED") caused the
 * report_writer <-> critic loop to run forever whenever the model phrased
 * its verdict slightly differently.
 */
function isApprovedVerdict(text) {
  const normalized = text.trim().toUpperCase();
  return (
    normalized.startsWith("APPROVED") ||
    normalized.startsWith("**APPROVED") ||
    normalized.includes("VERDICT: APPROVED") ||
    (normalized.includes("APPROVED") && !normalized.includes("REVISE"))
  );
}

/**
 * Critic node:
 * Checks the draft report for factual grounding, contradictions, and completeness.
 * Returns critic_feedback and can be used to decide whether to revise.
 */
export async function critic(state) {
  logger.info("Critic reviewing draft report...");
  // TODO:
  // const model = getLLM("claude-haiku-4-5-20251001", { temperature: 0 });
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

  const revisionAttempts = state.research_attempts || 0; // unused, kept for clarity
  const priorRevisions = state.revision_attempts || 0;
  const MAX_REVISIONS = 2;

  let isApproved = isApprovedVerdict(judgement);
  let feedback = isApproved ? "Draft report is factually grounded." : judgement;

  // Hard cap: if we've already revised MAX_REVISIONS times and the critic
  // still won't approve, stop looping and force it through to human review
  // rather than spinning forever. The human can reject it themselves.
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
    approval_status: isApproved ? "approved" : "pending",
    revision_attempts: nextRevisionCount,
    messages: [
      ...(state.messages || []),
      { role: "assistant", content: feedback },
    ],
  };
}
