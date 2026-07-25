// src/graph/router.js

export function routeAfterAggregator(state) {
  const findings = state.aggregated_findings || "";
  const attempts = state.research_attempts || 0;
  const maxAttempts = 2;

  if (
    (!findings ||
      findings.startsWith("No research data") ||
      findings.length < 50) &&
    attempts < maxAttempts
  ) {
    return "supervisor";
  }
  return "report_writer";
}

/**
 * After critic review:
 * - Routes on critic_verdict (the critic's OWN opinion), not
 *   approval_status — approval_status is reserved for the human's
 *   decision and won't be set to "approved" until humanApproval.js runs,
 *   so routing on it here would never advance past the critic step.
 */
export function routeAfterCritic(state) {
  return state.critic_verdict === "approved"
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
