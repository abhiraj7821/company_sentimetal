// tests/graph/buildGraph.test.js
import assert from "node:assert/strict";
import { buildGraph } from "../../src/graph/buildGraph.js";
import { GraphAnnotation } from "../../src/graph/state.js";
import { getCheckpointer } from "../../src/graph/checkpointer.js";
import pool from "../../src/db/pool.js";
import { v4 as uuidv4 } from "uuid"; // you can use any unique id generator

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * End‑to‑end graph test on real company data.
 * Runs the full swarm + critic + human approval loop.
 */
async function testGraphE2E() {
  console.log("\n🧪 Starting end‑to‑end graph test for Apple (AAPL)...\n");

  // 1. Build the graph (singleton checkpointer already available)
  const graph = await buildGraph();
  const threadId = uuidv4();
  const config = {
    configurable: { thread_id: threadId },
    recursionLimit: 1000,
  };

  // 2. Define the initial state
  const initialState = {
    company: "AAPL",
    task_queue: ["filing", "news", "sentiment", "web_scout"],
    messages: [],
  };

  console.log(`▶ Invoking graph for thread: ${threadId}`);
  console.log("  Initial state:", JSON.stringify(initialState, null, 2));

  let stateAfterResearch;

  // 3. First invoke – this will run supervisor → aggregator → (maybe loop) → report_writer → critic → human_approval
  //    The human_approval node calls interrupt() and will throw a GraphInterrupt error.
  try {
    stateAfterResearch = await graph.invoke(initialState, config);
    console.log(
      "✅ Graph completed without human interrupt (unexpected for this flow).",
    );
  } catch (err) {
    if (err.name === "GraphInterrupt" || err.message?.includes("interrupt")) {
      console.log(
        "⏸ Graph paused for human approval. Interrupt details:",
        err.message,
      );
      // The state up to the interrupt point is usually attached to the error (err.state)
      stateAfterResearch = err.state || {};
    } else {
      console.error("❌ Unexpected error during invoke:", err);
      throw err;
    }
  }

  console.log("\n📊 State after research phase (before human resume):");
  console.log(
    "  - aggregated_findings length:",
    stateAfterResearch.aggregated_findings?.length || 0,
  );
  console.log(
    "  - draft_report length:",
    stateAfterResearch.draft_report?.length || 0,
  );
  console.log(
    "  - critic_feedback:",
    stateAfterResearch.critic_feedback?.slice(0, 120),
  );
  console.log("  - approval_status:", stateAfterResearch.approval_status);

  // 4. Simulate human approval
  console.log("\n▶ Simulating human approval (approved)...");
  const resumeCommand = { approved: true, feedback: "Looks good." };

  let finalState;
  try {
    finalState = await graph.invoke(null, {
      ...config,
      resume: resumeCommand,
    });
  } catch (err) {
    console.error("❌ Error resuming graph:", err);
    throw err;
  }

  console.log("\n🎯 Final graph state after human approval:");
  console.log("  - approval_status:", finalState.approval_status);
  console.log(
    "  - draft_report preview:",
    finalState.draft_report?.slice(0, 300) + "...",
  );
  console.log("  - messages count:", finalState.messages?.length || 0);

  // ── Assertions ──
  assert.ok(finalState, "Final state must exist");
  assert.equal(
    finalState.approval_status,
    "approved",
    "Human should have approved",
  );
  assert.ok(
    finalState.draft_report && finalState.draft_report.length > 100,
    "Draft report should be substantial",
  );
  assert.ok(
    finalState.messages && finalState.messages.length > 0,
    "Should have message history",
  );

  console.log("\n✅ End‑to‑end graph test passed.");
}

// ── Run the test ──
(async () => {
  try {
    await testGraphE2E();
    // Optional: small delay to let any async cleanup happen
    await sleep(500);
  } catch (err) {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
  } finally {
    // Close DB pool gracefully
    await pool.end();
  }
})();
