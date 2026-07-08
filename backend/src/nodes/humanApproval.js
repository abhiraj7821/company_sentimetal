// src/nodes/humanApproval.js
import { interrupt } from "@langchain/langgraph";
import { GraphAnnotation } from "../graph/state.js";
import logger from "../lib/logger.js";

/**
 * Human‑in‑the‑loop approval node.
 * Pauses execution via LangGraph interrupt(), waits for a human decision,
 * and returns the updated approval status.
 *
 * The graph must be compiled with a checkpointer and use .invoke() with a thread id.
 * To resume, call graph.invoke() with the same thread id and a Command that
 * contains { resume: <decision> }, where decision is { approved: true/false, feedback: "..." }.
 */
export async function humanApproval(state) {
  logger.info("Awaiting human approval...");

  // This will pause the graph and wait for a resume command.
  const decision = await interrupt("Please approve or request changes.");

  // decision is whatever the human sends back via the resume Command.
  const { approved, feedback } = decision || {};

  if (approved) {
    return {
      approval_status: "approved",
      messages: [
        ...(state.messages || []),
        { role: "human", content: "Approved by human." },
      ],
    };
  } else {
    // Request changes – go back to report writer
    return {
      approval_status: "changes_requested",
      critic_feedback: feedback || "Human requested revisions.",
      messages: [
        ...(state.messages || []),
        { role: "human", content: feedback || "Requested changes." },
      ],
    };
  }
}
