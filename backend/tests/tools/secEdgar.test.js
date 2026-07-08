import assert from "node:assert/strict";
import { fetchSecFilings } from "../../src/tools/secEdgar.js";

async function testSecEdgar() {
  console.log("Testing SEC EDGAR tool with ticker AAPL...");
  const result = await fetchSecFilings.invoke({ ticker: "AAPL" });

  console.log(`\nResult for AAPL:\n${result}\n`);

  assert.ok(result, "Result should not be empty");
  assert.ok(
    result.includes("10-K") ||
      result.includes("10-Q") ||
      result.includes("No recent"),
    "Result should mention 10-K or 10-Q or a clear 'no filings' message",
  );

  // Optional: direct API check
  const res = await fetch(
    "https://data.sec.gov/submissions/CIK0000320193.json",
    {
      headers: { "User-Agent": "SentinelSwarm/1.0 (test)" },
    },
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.filings, "JSON should contain filings");

  console.log("✅ All SEC EDGAR tool tests passed.");
}

testSecEdgar().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
