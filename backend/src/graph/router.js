// src/graph/router.js

/**
 * After aggregation:
 * - If the aggregated findings are empty or a fallback string, loop back to
 *   supervisor for more research (capped at `MAX_RESEARCH_ATTEMPTS`).
 * - Otherwise proceed to the report writer.
 */
export function routeAfterAggregator(state) {
  const findings = state.aggregated_findings || "";
  const attempts = state.research_attempts || 0;
  const maxAttempts = 2; // allow at most 2 research rounds

  // If findings are insufficient and we haven't exceeded max attempts, try again
  if (
    (!findings ||
      findings.startsWith("No research data") ||
      findings.length < 50) &&
    attempts < maxAttempts
  ) {
    return "supervisor";
  }
  // Otherwise proceed to writer (even with minimal data)
  return "report_writer";
}

/**
 * After critic review:
 * - The critic node sets `approval_status` to "approved" if the draft is
 *   factually grounded, or after the revision cap is hit.
 * - Otherwise it stays "pending" (or ""), meaning a REVISE loop.
 */
export function routeAfterCritic(state) {
  // Use the explicit approval_status flag set by the critic node.
  // This eliminates the fragile feedback string matching that caused
  // infinite loops when the model's phrasing changed.
  return state.approval_status === "approved"
    ? "human_approval"
    : "report_writer";
}

/**
 * After human approval:
 * - If human approved, finish.
 * - If changes requested, loop back to report writer with the feedback.
 */
export function routeAfterHumanApproval(state) {
  const status = state.approval_status;
  return status === "approved" ? "__end__" : "report_writer";
}
