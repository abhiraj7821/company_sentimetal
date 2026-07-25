// test/graph.test.mjs
//
// Offline smoke/regression test for SentinelSwarm's agents + graph.
//
// STRATEGY: rather than mocking every individual tool (fetchSecFilings,
// fetchNews, sentimentScorerTool, classifyNewsTool, scrapeWebPage), this
// mocks ONE thing — src/lib/llm.js's getLLM() — with a fake model whose
// .invoke() never returns tool_calls. Every agent graph's routing
// function (shouldUseTools in filingAgent.js/newsAgent.js/etc.) sends the
// flow straight to write_output when there are no tool_calls, so the
// ToolNode branch (and therefore the real tools/real network) is never
// reached. That's sufficient to exercise 100% of the graph topology with
// zero network calls and zero API keys.
//
// REQUIREMENTS:
//   - Node >= 22.3 (this uses node:test's `mock.module`, which needs the
//     --experimental-test-module-mocks flag). Your package.json currently
//     declares "engines": { "node": ">=20" } — on Node 20/21 this script
//     will throw "mock.module is not a function" at the mock.module()
//     call below. Check with `node -v` before running.
//   - Run from the project root:
//       node --experimental-test-module-mocks --test test/graph.test.mjs
//     (or add a package.json script — see bottom of this file's comments)
//
// CAVEAT I can't verify from the files I've seen: src/db/pool.js is
// imported unconditionally at the top of src/graph/checkpointer.js, even
// on the "memory" checkpointer branch. If pool.js eagerly opens a
// Postgres connection at import time (rather than lazily on first query),
// this script may hang or throw despite CHECKPOINTER=memory below. If
// that happens, that's a real bug in checkpointer.js worth fixing
// separately (lazy-init the pool), not a problem with this test script.

import { test, mock, before, describe } from "node:test";
import assert from "node:assert/strict";

// ── Force safe, offline-friendly config BEFORE any src/ file is imported ──
// (config/index.js reads these via process.env at import time.)
process.env.CHECKPOINTER = "memory";
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "warn"; // quiet pino noise
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "test-key";
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-key";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-key";

// ── Dummy content the fake model returns, matched by prompt content ──
const DUMMY = {
  filing: "📄 10-K filed 2024-01-15 (Accession: 0000123456)\n📄 10-Q filed 2024-06-30 (Accession: 0000123999)",
  news: "📰 [1] Acme Corp beats Q2 earnings estimates\nURL: https://example-news.test/acme-q2\nDate: 2024-07-01",
  sentiment: "Overall sentiment: Positive (score 0.72). Coverage skews favorable following the earnings beat.",
  web: "🌐 Title: Acme Corp Pricing\nStarter plan: $99/month. Enterprise plan: custom pricing.",
  criticApproved: "APPROVED\nAll claims are supported by the underlying research data.",
  report: `# Acme Corp Intelligence Report

## Executive Summary
Acme Corp posted a strong Q2, beating earnings estimates with positive market sentiment.

## Key Findings
- 10-K and 10-Q filings are current and show no red flags.
- News coverage is favorable following the earnings beat.

## Risks / Contradictions
- No material contradictions found in the available data.

## Sentiment Overview
Overall sentiment is positive (0.72), driven by the earnings beat.

## Conclusion
Acme Corp appears fundamentally sound based on available research.`,
};

/**
 * Fake chat model. Mimics the subset of the LangChain chat-model interface
 * this codebase actually uses: .bindTools() (returns itself, ignoring the
 * tools — since we never emit tool_calls, ToolNode is never invoked) and
 * .invoke(input) -> { content: string }, where input is either a single
 * prompt string (critic.js, reportWriter.js) or a messages array
 * ([systemMsg, ...humanTurn], used by all four research agents).
 */
function createFakeModel() {
  const fakeModel = {
    bindTools() {
      return fakeModel;
    },
    async invoke(input) {
      const text = Array.isArray(input)
        ? input.map((m) => (typeof m?.content === "string" ? m.content : "")).join("\n")
        : String(input);

      let content;
      if (text.includes("meticulous fact")) {
        content = DUMMY.criticApproved;
      } else if (text.includes("senior equity research analyst")) {
        content = DUMMY.report;
      } else if (text.includes("SEC filing analyst")) {
        content = DUMMY.filing;
      } else if (text.includes("financial news researcher")) {
        content = DUMMY.news;
      } else if (text.includes("sentiment analyst")) {
        content = DUMMY.sentiment;
      } else if (text.includes("web research scout")) {
        content = DUMMY.web;
      } else {
        content = "Mock LLM response (no matcher hit — check prompt wording).";
      }

      // No tool_calls on the returned object -> every agent's
      // shouldUseTools() routes straight to write_output.
      return { content };
    },
  };
  return fakeModel;
}

const fakeModel = createFakeModel();

// Mock src/lib/llm.js BEFORE anything that imports it is loaded. Every
// module under test is therefore imported dynamically (below), never via
// a static top-level `import`, since static imports are hoisted above
// this call and would load the real module first.
mock.module(new URL("../src/lib/llm.js", import.meta.url), {
  namedExports: {
    getLLM: () => fakeModel,
  },
});

// ── Dynamic imports (after the mock is registered) ──
const { routeAfterAggregator, routeAfterCritic, routeAfterHumanApproval } =
  await import("../src/graph/router.js");
const { projectAgentStatuses, projectReport } = await import(
  "../src/graph/projector.js"
);
const { aggregator } = await import("../src/nodes/aggregator.js");
const { critic } = await import("../src/nodes/critic.js");
const { reportWriter } = await import("../src/nodes/reportWriter.js");
const { filingGraph } = await import("../src/nodes/agents/filingAgent.js");
const { newsGraph } = await import("../src/nodes/agents/newsAgent.js");
const { sentimentGraph } = await import(
  "../src/nodes/agents/sentimentAgent.js"
);
const { webScoutGraph } = await import(
  "../src/nodes/agents/webScoutAgent.js"
);
const { buildGraph } = await import("../src/graph/buildGraph.js");
const { Command } = await import("@langchain/langgraph");

/** Fully drains an async graph.stream() iterator (ignoring chunks). */
async function drain(stream) {
  for await (const _chunk of stream) {
    // no-op — we only care about final state via graph.getState()
  }
}

// ─────────────────────────────────────────────────────────────────────────
describe("pure functions: router.js", () => {
  test("routeAfterAggregator loops back when findings are too thin", () => {
    assert.equal(
      routeAfterAggregator({ aggregated_findings: "", research_attempts: 0 }),
      "supervisor",
    );
  });

  test("routeAfterAggregator proceeds once findings are substantial", () => {
    assert.equal(
      routeAfterAggregator({
        aggregated_findings: "x".repeat(200),
        research_attempts: 1,
      }),
      "report_writer",
    );
  });

  test("routeAfterAggregator gives up after max attempts even with thin findings", () => {
    assert.equal(
      routeAfterAggregator({ aggregated_findings: "", research_attempts: 2 }),
      "report_writer",
    );
  });

  test("routeAfterCritic routes on critic_verdict, NOT approval_status", () => {
    // Regression test for the critic_verdict/approval_status split: this
    // must route to human_approval based on the critic's OWN verdict, and
    // must NOT be fooled by approval_status (which is human-only).
    assert.equal(
      routeAfterCritic({ critic_verdict: "approved", approval_status: "pending" }),
      "human_approval",
    );
    assert.equal(
      routeAfterCritic({ critic_verdict: "revise", approval_status: "approved" }),
      "report_writer",
      "approval_status alone must never trigger this route",
    );
  });

  test("routeAfterHumanApproval ends on approval, loops on changes_requested", () => {
    assert.equal(
      routeAfterHumanApproval({ approval_status: "approved" }),
      "__end__",
    );
    assert.equal(
      routeAfterHumanApproval({ approval_status: "changes_requested" }),
      "report_writer",
    );
  });
});

describe("pure functions: aggregator.js", () => {
  test("merges and labels each section", async () => {
    const result = await aggregator({
      filing_data: DUMMY.filing,
      news_data: DUMMY.news,
      sentiment_data: DUMMY.sentiment,
      web_data: DUMMY.web,
      messages: [],
    });
    assert.match(result.aggregated_findings, /## SEC Filings/);
    assert.match(result.aggregated_findings, /## Recent News/);
    assert.match(result.aggregated_findings, /## Sentiment Analysis/);
    assert.match(result.aggregated_findings, /## Web Scout/);
  });

  test("falls back to placeholder text when everything is empty", async () => {
    const result = await aggregator({ messages: [] });
    assert.equal(result.aggregated_findings, "No research data available.");
  });

  test("caps an oversized section at 1200 chars + truncation marker", async () => {
    const huge = "y".repeat(5000);
    const result = await aggregator({ filing_data: huge, messages: [] });
    assert.ok(result.aggregated_findings.includes("[truncated]"));
    assert.ok(result.aggregated_findings.length < 5000);
  });
});

describe("pure functions: projector.js", () => {
  test("projectAgentStatuses: critic card follows critic_verdict, human card follows approval_status", () => {
    const statuses = projectAgentStatuses({
      filing_data: DUMMY.filing,
      news_data: DUMMY.news,
      sentiment_data: DUMMY.sentiment,
      web_data: DUMMY.web,
      aggregated_findings: "some findings",
      draft_report: DUMMY.report,
      critic_feedback: "looks good",
      critic_verdict: "approved",
      approval_status: "pending",
    });
    assert.equal(statuses.critic.status, "completed");
    assert.equal(
      statuses.humanApproval.status,
      "active",
      "critic approved but no human decision yet -> awaiting human",
    );
  });

  test("projectReport: produces sections + citations from dummy state", () => {
    const payload = projectReport(
      {
        draft_report: DUMMY.report,
        aggregated_findings: "line one\nline two that is long enough to count\n",
        critic_feedback: "Draft report is factually grounded.",
        approval_status: "approved",
        revision_attempts: 0,
        company: "ACME",
        messages: [{ role: "human", content: "Approved by human." }],
      },
      { researchTarget: "Acme Corp (ACME)" },
      { runId: "test-run-1", startedAt: "2024-01-01T00:00:00.000Z", finishedAt: "2024-01-01T00:05:00.000Z" },
    );
    assert.equal(payload.company.ticker, "ACME");
    assert.ok(payload.sections.length > 0);
    assert.equal(payload.approval.reviewer, "human");
    assert.equal(payload.stats.runTimeSeconds, 300);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("individual research agent graphs (dummy company, mocked LLM)", () => {
  const dummyInput = { company: "Acme Corp", messages: [] };

  test("filingGraph populates filing_data without touching real SEC tools", async () => {
    const result = await filingGraph.invoke(dummyInput);
    assert.ok(result.filing_data?.length > 0);
    assert.match(result.filing_data, /10-K|10-Q/);
  });

  test("newsGraph populates news_data", async () => {
    const result = await newsGraph.invoke(dummyInput);
    assert.ok(result.news_data?.length > 0);
  });

  test("sentimentGraph populates sentiment_data given dummy news_data", async () => {
    const result = await sentimentGraph.invoke({
      ...dummyInput,
      news_data: DUMMY.news,
    });
    assert.ok(result.sentiment_data?.length > 0);
  });

  test("webScoutGraph populates web_data", async () => {
    const result = await webScoutGraph.invoke({
      ...dummyInput,
      targetUrl: "https://www.acme.test",
    });
    assert.ok(result.web_data?.length > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("individual pipeline nodes (dummy state, mocked LLM)", () => {
  test("reportWriter produces a non-empty markdown draft", async () => {
    const result = await reportWriter({
      aggregated_findings: "## SEC Filings\n" + DUMMY.filing,
      messages: [],
    });
    assert.ok(result.draft_report.length > 0);
    assert.match(result.draft_report, /Executive Summary/);
  });

  test("critic approves a grounded draft and sets critic_verdict (not approval_status)", async () => {
    const result = await critic({
      draft_report: DUMMY.report,
      aggregated_findings: DUMMY.filing + "\n" + DUMMY.news,
      revision_attempts: 0,
      messages: [],
    });
    assert.equal(result.critic_verdict, "approved");
    assert.equal(
      "approval_status" in result,
      false,
      "critic.js must not write approval_status — that field is human-only",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("full graph: buildGraph() end-to-end through interrupt + resume", () => {
  test("happy path: run pauses at human_approval, then approves and completes", async () => {
    const graph = await buildGraph();
    const threadId = `test-thread-${Date.now()}`;
    const config = { configurable: { thread_id: threadId }, recursionLimit: 50 };

    const initialState = {
      company: "Acme Corp",
      task_queue: ["filing", "news", "sentiment", "web_scout"],
      messages: [],
    };

    // Runs supervisor -> aggregator -> report_writer -> critic, then
    // suspends at human_approval's interrupt(). Real setTimeout delays
    // inside supervisor.js (INTER_AGENT_DELAY_MS = 2500ms x3) mean this
    // step alone takes ~7.5s — that's supervisor.js's existing behavior,
    // not something this test introduces.
    await drain(await graph.stream(initialState, { ...config, streamMode: "updates" }));

    const pausedState = await graph.getState(config);
    assert.ok(
      (pausedState.next || []).includes("human_approval"),
      "graph should be paused at human_approval awaiting a resume Command",
    );
    assert.equal(pausedState.values.critic_verdict, "approved");
    assert.ok(pausedState.values.draft_report.length > 0);

    // Resume as if a human approved via POST /research/:runId/approve.
    const resumeCommand = new Command({
      resume: { approved: true, feedback: null },
    });
    await drain(await graph.stream(resumeCommand, { ...config, streamMode: "updates" }));

    const finalState = await graph.getState(config);
    assert.equal((finalState.next || []).length, 0, "graph should have reached END");
    assert.equal(finalState.values.approval_status, "approved");
  });

  test("changes-requested path: loops back to report_writer, then approves on retry", async () => {
    const graph = await buildGraph();
    const threadId = `test-thread-revise-${Date.now()}`;
    const config = { configurable: { thread_id: threadId }, recursionLimit: 50 };

    await drain(
      await graph.stream(
        { company: "Acme Corp", task_queue: ["filing", "news"], messages: [] },
        { ...config, streamMode: "updates" },
      ),
    );

    let state = await graph.getState(config);
    assert.ok((state.next || []).includes("human_approval"));

    // Human requests changes.
    await drain(
      await graph.stream(
        new Command({ resume: { approved: false, feedback: "Add more risk detail." } }),
        { ...config, streamMode: "updates" },
      ),
    );

    state = await graph.getState(config);
    assert.ok(
      (state.next || []).includes("human_approval"),
      "after changes_requested, graph should loop report_writer -> critic -> human_approval again",
    );
    assert.equal(state.values.approval_status, "changes_requested");

    // Human approves on the second pass.
    await drain(
      await graph.stream(new Command({ resume: { approved: true } }), {
        ...config,
        streamMode: "updates",
      }),
    );

    state = await graph.getState(config);
    assert.equal((state.next || []).length, 0);
    assert.equal(state.values.approval_status, "approved");
  });
});
