// src/graph/projector.js

/**
 * Pure translation layer: GraphAnnotation state -> contract-shaped JSON.
 * No I/O, no side effects — everything here is a plain function of its
 * arguments so it can be unit-tested with a hand-built fake state object,
 * exactly as step 2 of the build order recommends.
 */

function hasContent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// ─────────────────────────────────────────────────────────────────────────
// projectAgentStatuses
// ─────────────────────────────────────────────────────────────────────────

/**
 * IMPORTANT CAVEAT (read before wiring this into streamHandlers.js):
 *
 * filing/news/sentiment/webScout are NOT separate top-level LangGraph
 * nodes — they run sequentially *inside* the single `supervisor` node
 * (src/nodes/supervisor.js calls each agent graph with a plain `await` in
 * a loop). `graph.stream(..., { streamMode: "updates" })` only emits a
 * chunk once a top-level node finishes, so you will only ever see ONE
 * "supervisor" update, and at that point ALL FOUR of filing_data/news_data/
 * sentiment_data/web_data are already populated together.
 *
 * Practical effect: with the current graph structure, the UI's four
 * research-agent cards will jump from "pending" to "completed" all at
 * once when the supervisor step finishes, not one-by-one every ~2s like
 * the contract's example `logs[]` timestamps suggest. That demo pacing
 * would require either (a) supervisor.js emitting progress events itself
 * (a node-file change, which the routing doc explicitly said not to make),
 * or (b) restructuring the four agents into their own top-level graph
 * nodes. Flagging this now rather than silently faking granularity you
 * don't actually have.
 */
export function projectAgentStatuses(graphState = {}) {
  const {
    filing_data,
    news_data,
    sentiment_data,
    web_data,
    aggregated_findings,
    draft_report,
    critic_feedback,
    critic_verdict,
    approval_status,
  } = graphState;

  const researchDone = hasContent(aggregated_findings);
  const supervisorStatus = researchDone ? "completed" : "active";

  const draftExists = hasContent(draft_report);
  const criticHasRun = hasContent(critic_feedback);

  let reportWriterStatus = "pending";
  if (draftExists && !criticHasRun) reportWriterStatus = "in-progress";
  else if (draftExists && criticHasRun) reportWriterStatus = "completed";

  // Critic card reflects the CRITIC's own verdict now, not the human's
  // decision. "in-progress" covers both "critic hasn't run yet on this
  // draft" mid-cycle states and "critic sent it back for revision".
  let criticStatus = "pending";
  if (critic_verdict === "approved") {
    criticStatus = "completed";
  } else if (criticHasRun) {
    criticStatus = "in-progress";
  }

  // Human approval card is driven purely by approval_status. It becomes
  // "active" (awaiting a human) once the critic has approved but no
  // human decision has been recorded yet.
  let humanApprovalStatus = "pending";
  if (approval_status === "approved") {
    humanApprovalStatus = "completed";
  } else if (approval_status === "changes_requested") {
    humanApprovalStatus = "in-progress";
  } else if (critic_verdict === "approved") {
    humanApprovalStatus = "active";
  }

  return {
    supervisor: { status: supervisorStatus, label: "Orchestrating tasks" },
    filing: {
      status: hasContent(filing_data) ? "completed" : "pending",
      label: "10-K / 10-Q",
    },
    news: {
      status: hasContent(news_data) ? "completed" : "pending",
      label: "Collecting news",
    },
    sentiment: {
      status: hasContent(sentiment_data) ? "completed" : "pending",
      label: "Analyzing sentiment",
    },
    webScout: {
      status: hasContent(web_data) ? "completed" : "pending",
      label: "Exploring web",
    },
    critic: { status: criticStatus, label: "Verifying facts" },
    reportWriter: { status: reportWriterStatus, label: "Drafting report" },
    humanApproval: { status: humanApprovalStatus, label: "Review & approve" },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// projectReport
// ─────────────────────────────────────────────────────────────────────────

/**
 * Splits draft_report's markdown into sections by `##`/`#` headings.
 *
 * NOTE: reportWriter.js's prompt asks for 5 sections (Executive Summary,
 * Key Findings, Risks/Contradictions, Sentiment Overview, Conclusion) —
 * not the 7 exact ids the contract's example shows (financial_highlights,
 * key_developments, competitor_intelligence, etc. aren't requested by the
 * current prompt). Rather than hardcode ids that the LLM was never asked
 * to produce, this splitter is generic: it slugifies whatever headings
 * actually come back. If you want the exact 7-section shape from the
 * contract, update reportWriter.js's prompt to request those specific
 * headings — that's a one-line prompt change, not a projector change.
 */
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function splitIntoSections(draftReport) {
  if (!hasContent(draftReport)) return [];

  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const matches = [...draftReport.matchAll(headingRegex)];

  if (matches.length === 0) {
    // No markdown headings found — return the whole draft as one section
    // rather than silently dropping content.
    return [
      {
        id: "report",
        title: "Report",
        content: draftReport.trim(),
        citationIds: [],
      },
    ];
  }

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end =
      i + 1 < matches.length ? matches[i + 1].index : draftReport.length;
    const content = draftReport.slice(start, end).trim();
    sections.push({
      id: slugify(title) || `section_${i + 1}`,
      title,
      content,
      citationIds: [],
    });
  }
  return sections;
}

/**
 * Best-effort citation extraction from the raw tool output text.
 * fetchSecFilings/fetchNews return semi-structured text (accession
 * numbers, "URL: ..." lines); scrapeWebPage does not return the URL it
 * fetched in its output string, so web citations are synthesized with a
 * placeholder URL. If you want reliable web citations, the simplest fix
 * is having webScraper.js's return value include the source URL it was
 * given — a small, additive change to that tool's output string.
 */
function extractCitations(graphState) {
  const citations = [];
  let counter = 1;
  const nextId = () => `src_${counter++}`;

  const { filing_data, news_data, web_data, company } = graphState;

  if (hasContent(filing_data)) {
    const filingLines = filing_data.split("\n").filter((l) => l.trim());
    for (const line of filingLines) {
      const accessionMatch = line.match(/Accession:\s*(\d+)/);
      const formMatch = line.match(/📄\s*(10-K|10-Q)\s*filed\s*([\d-]+)/);
      if (formMatch) {
        citations.push({
          id: nextId(),
          type: "sec_filing",
          title: `${company || "Company"} ${formMatch[1]} filed ${formMatch[2]}`,
          url: accessionMatch
            ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&filenum=${accessionMatch[1]}`
            : "https://www.sec.gov/",
          publishedAt: formMatch[2],
        });
      }
    }
  }

  if (hasContent(news_data)) {
    const urlMatches = [...news_data.matchAll(/URL:\s*(\S+)/g)];
    const titleMatches = [...news_data.matchAll(/📰\s*\[\d+\]\s*(.+)/g)];
    const dateMatches = [...news_data.matchAll(/Date:\s*(\S+)/g)];
    urlMatches.forEach((m, i) => {
      citations.push({
        id: nextId(),
        type: "news",
        title: titleMatches[i]?.[1]?.trim() || "News article",
        url: m[1],
        publishedAt: dateMatches[i]?.[1] || null,
      });
    });
  }

  if (hasContent(web_data)) {
    const titleMatch = web_data.match(/🌐\s*Title:\s*(.+)/);
    citations.push({
      id: nextId(),
      type: "web",
      title: titleMatch?.[1]?.trim() || `${company || "Company"} web research`,
      url: null, // scrapeWebPage's output doesn't retain the source URL — see comment above
      publishedAt: null,
    });
  }

  return citations;
}

/**
 * Only called once, when a run transitions to "completed". Result gets
 * cached in run.reportPayload so GET /report never recomputes it.
 *
 * `meta` is an addition beyond the routing doc's 2-arg signature
 * (`projectReport(graphState, formData)`) — timing/runId aren't part of
 * GraphAnnotation, so they have to come from the run store. Passed in as
 * an optional third argument rather than smuggled into formData.
 */
export function projectReport(graphState = {}, formData = {}, meta = {}) {
  const { runId, startedAt, finishedAt } = meta;
  const {
    draft_report,
    aggregated_findings,
    critic_feedback,
    approval_status,
    revision_attempts,
    messages,
  } = graphState;

  const sections = splitIntoSections(draft_report);
  const citations = extractCitations(graphState);

  const runTimeSeconds =
    startedAt && finishedAt
      ? Math.max(
          0,
          Math.round((new Date(finishedAt) - new Date(startedAt)) / 1000),
        )
      : 0;

  // Heuristic stats — there's no ground-truth accuracy score coming out of
  // the graph, so this is a documented approximation, not a real metric.
  const sourcesAnalyzed = citations.length;
  const insightsFound = hasContent(aggregated_findings)
    ? aggregated_findings.split("\n").filter((l) => l.trim().length > 20).length
    : 0;
  const revisionCount = revision_attempts || 0;
  const factAccuracy =
    approval_status === "approved"
      ? Math.max(0.85, 0.98 - revisionCount * 0.03)
      : 0.7;

  const tickerMatch = formData?.researchTarget?.match(/\(([^)]+)\)/);
  const companyName =
    formData?.researchTarget?.replace(/\s*\([^)]*\)\s*/, "").trim() ||
    graphState.company ||
    "";
  const ticker = tickerMatch?.[1] || graphState.company || "";

  const reviewedByHuman =
    Array.isArray(messages) && messages.some((m) => m?.role === "human");

  return {
    runId: runId || null,
    status: "completed",

    company: { name: companyName, ticker },
    title: `${companyName || ticker} – Intelligence Report`,
    generatedAt: finishedAt || new Date().toISOString(),
    timeRange: formData?.timeRange || null,
    reportDepth: formData?.reportDepth || null,

    stats: {
      sourcesAnalyzed,
      insightsFound,
      factAccuracy,
      runTimeSeconds,
    },

    sections,
    citations,

    critic: {
      verdict: approval_status === "approved" ? "grounded" : "needs_revision",
      revisionCount,
      notes: critic_feedback || "",
    },

    approval: {
      status: approval_status || "pending",
      reviewer: reviewedByHuman ? "human" : "auto",
      decidedAt: finishedAt || new Date().toISOString(),
      comment: null,
    },

    downloadUrl: runId ? `/research/${runId}/report.pdf` : null,
  };
}
