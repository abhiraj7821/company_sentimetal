// src/eval/report.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");

async function ensureDir() {
  await fs.mkdir(resultsDir, { recursive: true });
}

/**
 * Writes evaluation results to a timestamped JSON file and a summary CSV.
 * @param {Array} results - array of per-company evaluation objects
 */
export async function writeEvalReport(results) {
  await ensureDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonFile = path.join(resultsDir, `eval-${timestamp}.json`);
  await fs.writeFile(jsonFile, JSON.stringify(results, null, 2));

  // Also produce a CSV summary
  const header = "company,total_claims,grounded_claims,score";
  const rows = results.map((r) => {
    const g = r.groundedness || { score: 0, claims: [] };
    return [
      r.company,
      g.claims.length,
      g.claims.filter((c) => c.isTrue).length,
      g.score.toFixed(2),
    ].join(",");
  });

  const csvContent = [header, ...rows].join("\n");
  const csvFile = path.join(resultsDir, `eval-summary-${timestamp}.csv`);
  await fs.writeFile(csvFile, csvContent);

  console.log(`Report written to ${jsonFile} and ${csvFile}`);
}
