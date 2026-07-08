import assert from "node:assert/strict";
import { filingGraph } from "../../src/nodes/agents/filingAgent.js";
import { newsGraph } from "../../src/nodes/agents/newsAgent.js";
import { sentimentGraph } from "../../src/nodes/agents/sentimentAgent.js";
import { webScoutGraph } from "../../src/nodes/agents/webScoutAgent.js";

// ── Helper: sleep ──
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Invoke with exponential backoff for 429 ──
async function invokeWithRetry(graph, input, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await graph.invoke(input);
    } catch (err) {
      if (err.message?.includes("429") && attempt < maxRetries) {
        const wait = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
        console.warn(
          `   ⚠️ Rate limited. Waiting ${wait / 1000}s before retry...`,
        );
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

// ── Test wrapper ──
async function testAgent(graph, input, outputKey, label) {
  console.log(`\n🧪 Testing ${label}...`);
  const start = Date.now();
  let result;
  try {
    result = await invokeWithRetry(graph, input);
  } catch (err) {
    console.error(`❌ ${label} threw:`, err.message);
    throw err;
  }
  console.log(`   Full state keys:`, Object.keys(result));
  console.log(`   ${outputKey} present:`, outputKey in result);
  if (outputKey in result) {
    console.log(
      `   ${outputKey} value:`,
      result[outputKey].slice(0, 150) + "...",
    );
  }

  const elapsed = Date.now() - start;
  assert.ok(
    typeof result === "object" && result !== null,
    `${label}: result must be an object`,
  );
  assert.ok(
    outputKey in result,
    `${label}: result must contain '${outputKey}'`,
  );
  const val = result[outputKey];
  assert.ok(
    typeof val === "string" && val.length > 0,
    `${label}: '${outputKey}' should be a non‑empty string`,
  );
  console.log(`✅ ${label} passed (${elapsed}ms)`);
}

// ── Main test sequence with pauses ──
(async () => {
  try {
    // Base state
    const baseState = { company: "AAPL", messages: [] };

    // Filing Agent
    await testAgent(filingGraph, baseState, "filing_data", "Filing Agent");
    console.log("   ⏳ Cooling down 30s to stay under rate limit...");
    await sleep(30_000);

    // News Agent
    await testAgent(newsGraph, baseState, "news_data", "News Agent");
    console.log("   ⏳ Cooling down 30s...");
    await sleep(30_000);

    // Sentiment Agent (needs news_data pre‑filled)
    await testAgent(
      sentimentGraph,
      {
        ...baseState,
        news_data:
          "Apple stock reaches all‑time high after strong earnings report.",
      },
      "sentiment_data",
      "Sentiment Agent",
    );
    console.log("   ⏳ Cooling down 30s...");
    await sleep(30_000);

    // Web Scout Agent
    const webState = {
      ...baseState,
      targetUrl: "https://www.apple.com/investor/",
    };
    await testAgent(webScoutGraph, webState, "web_data", "Web Scout Agent");

    console.log("\n🎉 All agent output checks passed.");
  } catch (err) {
    console.error("\n❌ Agent check failed:", err.message);
    process.exit(1);
  }
})();
