// src/graph/buildGraph.js
import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphAnnotation } from "./state.js";
import { supervisor } from "../nodes/supervisor.js";
import { aggregator } from "../nodes/aggregator.js";
import { reportWriter } from "../nodes/reportWriter.js";
import { critic } from "../nodes/critic.js";
import { humanApproval } from "../nodes/humanApproval.js";
import { getCheckpointer } from "./checkpointer.js";
import {
  routeAfterAggregator,
  routeAfterCritic,
  routeAfterHumanApproval,
} from "./router.js";
import logger from "../lib/logger.js";

/**
 * Build and compile the SentinelSwarm research graph.
 * @returns {Promise<CompiledStateGraph>}
 */
export async function buildGraph() {
  const checkpointer = await getCheckpointer();

  // ── Create the StateGraph using the shared annotation ──
  const graph = new StateGraph(GraphAnnotation)

    // ── Add nodes ──
    .addNode("supervisor", supervisor)
    .addNode("aggregator", aggregator)
    .addNode("report_writer", reportWriter)
    .addNode("critic", critic)
    .addNode("human_approval", humanApproval)

    // ── Edges ──
    .addEdge(START, "supervisor")
    .addEdge("supervisor", "aggregator")

    // Conditional: after aggregator, either re‑run supervisor or proceed to report writer
    .addConditionalEdges("aggregator", routeAfterAggregator, {
      supervisor: "supervisor",
      report_writer: "report_writer",
    })

    .addEdge("report_writer", "critic")

    // Conditional: critic approves → human_approval; otherwise revise report
    .addConditionalEdges("critic", routeAfterCritic, {
      human_approval: "human_approval",
      report_writer: "report_writer",
    })

    // Conditional: human decision → approved ends the run; changes_requested loops back to writer
    .addConditionalEdges("human_approval", routeAfterHumanApproval, {
      __end__: END,
      report_writer: "report_writer",
    })

    // ── Compile with checkpointer for interrupt() support ──
    .compile({ checkpointer });

  logger.info("Graph compiled successfully.");
  return graph;
}
