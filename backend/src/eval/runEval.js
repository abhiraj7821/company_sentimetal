// src/eval/runEval.js
import fs from "fs/promises";
import path from "path";
import { buildGraph } from "../graph/buildGraph.js";
import { scoreGroundedness } from "./groundednessScorer.js";
import { writeEvalReport } from "./report.js";
import logger from "../lib/logger.js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load golden dataset
async function loadDataset() {
  const raw = await fs.readFile(
    path.join(__dirname, "goldenDataset.json"),
    "utf-8",
  );
  return JSON.parse(raw);
}

async function runSingle(company, facts) {
  logger.info(`Evaluating company: ${company}`);
  const graph = await buildGraph();
  const threadId = `eval-${company}-${Date.now()}`;
  const config = { configurable: { thread_id: threadId } };

  const initialState = {
    company,
    task_queue: ["filing", "news", "sentiment", "web_scout"],
    messages: [],
  };

  // Run the graph up to human approval (interrupt) – we don't need final human sign-off
  let finalState;
  try {
    finalState = await graph.invoke(initialState, config);
  } catch (err) {
    if (err.name === "GraphInterrupt" || err.message?.includes("interrupt")) {
      // Collect state before interrupt
      finalState = err.state || {};
    } else {
      logger.error({ err }, "Graph execution failed");
      throw err;
    }
  }

  const report = finalState.draft_report || "";
  const sources = finalState.aggregated_findings || "";

  // Score groundedness (not fact accuracy vs golden facts – that's another metric)
  const groundedness = await scoreGroundedness(report, sources);

  // For this example, we only use groundedness score; you can later add a fact-accuracy scorer.
  return {
    company,
    facts,
    report,
    groundedness,
  };
}

async function main() {
  const dataset = await loadDataset();
  const results = [];

  for (const entry of dataset.companies) {
    try {
      const result = await runSingle(entry.company, entry.facts);
      results.push(result);
      // Wait a bit between runs to avoid rate limits
      await new Promise((r) => setTimeout(r, 10_000));
    } catch (err) {
      logger.error({ company: entry.company, err }, "Skipping due to error");
    }
  }

  // Write results
  await writeEvalReport(results);
  logger.info("Evaluation complete. Results written to eval/results/");
}

main().catch(console.error);
