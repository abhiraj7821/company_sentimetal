import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Bot,
  FileText,
  Newspaper,
  Smile,
  Globe,
  Shield,
  PenTool,
  UserCheck,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  subscribeToRunStream,
  getRunStatus,
  getRunReport,
  approveRun,
  cancelRun,
} from "../lib/api.js";

import { Link } from "react-router-dom";
import NavBarHeader from "../components/NavBarHeader.jsx";
import SwarmHeader from "../components/swarminaction/SwarmHeader.jsx";
import {
  wobblySm,
  shadowHardSm,
  wobblyAlt,
  wobbly,
  paperBg,
  shadowHard,
} from "../components/styles/styles.js";
import AwaitingApproval from "../components/swarminaction/AwaitingApproval.jsx";
import AgentFailScreen from "../components/swarminaction/AgentFailScreen.jsx";
import ArchitectureFlow from "../components/swarminaction/ArchitectureFlow.jsx";
import AgentActivityLog from "../components/swarminaction/AgentActivityLog.jsx";
import OverallProcessBar from "../components/swarminaction/OverallProcessBar.jsx";

/* ───────────────────────────────────────────────────────────
   SentinelSwarm — Swarm In Action (Live Processing Screen)
   Tech: React + Tailwind CSS
   Style: Hand-Drawn / Sketchbook aesthetic

   WIRING (real backend):
   - Accepts `runId` (returned by POST /research in StartNewResearch)
     and `formData` (just for the "Researching <company>..." label).
   - Opens an SSE connection to GET /research/:runId/stream and renders
     whatever the server pushes.
   - Falls back to polling GET /research/:runId/status every 2s if the
     SSE connection errors out.
   - status === "completed"  → fetch GET /research/:runId/report once,
     then call `onComplete(reportPayload)`.
   - status === "awaiting_approval" → show inline Approve / Request
     Changes buttons that call POST /research/:runId/approve.
   - status === "failed" → show the error and let the user go back via
     `onStop()`.

   FIX NOTES (this revision):
   - Approval-submission errors (e.g. a 409 from POST /approve) used to
     be written into the SAME `runError` state that drives
     <AgentFailScreen />, via the render condition
     `(runStatus === "failed" || runError)`. That meant a rejected
     approval — which says nothing about whether the run itself is
     still fine — hijacked the entire screen into a terminal-looking
     "Something went wrong" dead end, with no way back except leaving
     the page. Approval errors now live in their own `approvalError`
     state, passed down to <AwaitingApproval /> to show inline, right
     next to the buttons the person just used — `runError` /
     <AgentFailScreen /> is now reserved for the run itself actually
     failing (`runStatus === "failed"`).
   ─────────────────────────────────────────────────────────── */

const AGENT_SEQUENCE = [
  "filing",
  "news",
  "sentiment",
  "webScout",
  "critic",
  "reportWriter",
  "humanApproval",
];

const INITIAL_AGENTS = {
  supervisor: { status: "active", label: "Orchestrating tasks" },
  filing: { status: "pending", label: "10-K / 10-Q" },
  news: { status: "pending", label: "Collecting news" },
  sentiment: { status: "pending", label: "Analyzing sentiment" },
  webScout: { status: "pending", label: "Exploring web" },
  critic: { status: "pending", label: "Verifying facts" },
  reportWriter: { status: "pending", label: "Drafting report" },
  humanApproval: { status: "pending", label: "Review & approve" },
};

export default function SwarmInAction({ formData, runId, onComplete, onStop }) {
  const companyLabel = formData?.researchTarget || "Apple Inc. (AAPL)";

  const [runStatus, setRunStatus] = useState("queued");
  const [progress, setProgress] = useState(2);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [logs, setLogs] = useState([]);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] =
    useState(null);
  const [runError, setRunError] = useState(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  // FIX: separate from runError — see FIX NOTES above.
  const [approvalError, setApprovalError] = useState(null);

  const hasFetchedReportRef = useRef(false);
  const pollIntervalRef = useRef(null);
  const hasCancelledRef = useRef(false);

  const applyRunUpdate = (run) => {
    if (!run) return;
    setRunStatus(run.status);
    if (typeof run.progress === "number") setProgress(run.progress);
    if (run.agents) setAgents(run.agents);
    if (run.logs) setLogs(run.logs);
    if (typeof run.estimatedSecondsRemaining === "number") {
      setEstimatedSecondsRemaining(run.estimatedSecondsRemaining);
    }
    if (run.status === "failed" && run.error) {
      setRunError(run.error.message || "The run failed unexpectedly.");
    }
    // A fresh status update means whatever approval error was showing
    // is now stale (e.g. the run has since moved on) — clear it so it
    // doesn't linger next to buttons that may no longer even be shown.
    if (run.status !== "awaiting_approval") {
      setApprovalError(null);
    }
    if (run.status === "completed" && !hasFetchedReportRef.current) {
      hasFetchedReportRef.current = true;
      getRunReport(runId)
        .then((report) => {
          if (onComplete) onComplete(report);
        })
        .catch((err) => {
          setRunError(err.message || "Couldn't load the finished report.");
        });
    }
  };

  const handleStopRun = async () => {
    if (hasCancelledRef.current) return;
    hasCancelledRef.current = true;
    try {
      await cancelRun(runId);
    } catch (err) {
      console.error("Failed to cancel run:", err);
    } finally {
      if (onStop) onStop();
    }
  };

  const runStatusRef = useRef(runStatus);
  useEffect(() => {
    runStatusRef.current = runStatus;
  }, [runStatus]);

  // Cleanup on actual unmount (not when dependencies change)
  useEffect(() => {
    if (!runId) return;

    const handleBeforeUnload = () => {
      if (hasCancelledRef.current) return;
      fetch(`/research/${runId}`, { method: "DELETE", keepalive: true });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const currentStatus = runStatusRef.current;
      if (
        !hasCancelledRef.current &&
        currentStatus !== "completed" &&
        currentStatus !== "failed"
      ) {
        hasCancelledRef.current = true;
        cancelRun(runId).catch(() => {});
      }
    };
  }, [runId]);

  // Live updates: SSE first, polling fallback if the stream errors out.
  useEffect(() => {
    if (!runId) return;

    let source = null;
    let cancelled = false;

    const startPollingFallback = () => {
      if (pollIntervalRef.current) return;
      pollIntervalRef.current = setInterval(async () => {
        try {
          const run = await getRunStatus(runId);
          if (!cancelled) applyRunUpdate(run);
          if (run.status === "completed" || run.status === "failed") {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } catch (err) {
          if (!cancelled)
            setRunError(err.message || "Lost connection to the swarm.");
        }
      }, 2000);
    };

    try {
      source = subscribeToRunStream(
        runId,
        (run) => {
          if (!cancelled) applyRunUpdate(run);
        },
        () => {
          if (source) source.close();
          startPollingFallback();
        },
      );
    } catch {
      startPollingFallback();
    }

    return () => {
      cancelled = true;
      if (source) source.close();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const handleApproval = async (decision) => {
    if (approvalSubmitting) return; // guard against a rapid double-click
    setApprovalSubmitting(true);
    setApprovalError(null);
    try {
      await approveRun(runId, decision);
      // The next SSE/poll update will reflect the new status; no local
      // state mutation needed here.
    } catch (err) {
      // FIX: this used to call setRunError(...), which — combined with
      // the `(runStatus === "failed" || runError)` render condition
      // below — swapped the entire screen to <AgentFailScreen />, even
      // though the run itself may still be sitting fine at
      // "awaiting_approval". Now scoped to approvalError, shown inline
      // by <AwaitingApproval /> instead, so the person can just try
      // again (or the screen will move on if a fresher status update
      // arrives and clears it).
      setApprovalError(
        err.message || "Couldn't submit your decision. Please try again.",
      );
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const statusOf = (key) => agents[key]?.status || "pending";

  const statusConfig = {
    completed: {
      color: "text-green-600",
      bg: "bg-green-100",
      icon: <CheckCircle className="w-4 h-4" strokeWidth={2.5} />,
    },
    "in-progress": {
      color: "text-[#2d5da1]",
      bg: "bg-[#2d5da1]/10",
      icon: <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />,
    },
    pending: {
      color: "text-[#e5e0d8]",
      bg: "bg-[#e5e0d8]/30",
      icon: <Clock className="w-4 h-4" strokeWidth={2.5} />,
    },
    active: {
      color: "text-green-600",
      bg: "bg-green-100",
      icon: <Activity className="w-4 h-4 animate-pulse" strokeWidth={2.5} />,
    },
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "✓ Active";
      case "in-progress":
        return "● In Progress";
      case "pending":
        return "○ Pending";
      case "active":
        return "● Live";
      default:
        return status;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ ...paperBg, fontFamily: "'Patrick Hand', cursive" }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Patrick+Hand&display=swap');
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════ */}
      <NavBarHeader />

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <SwarmHeader
          companyLabel={companyLabel}
          runStatus={runStatus}
          progress={progress}
          agents={agents}
          logs={logs}
          estimatedSecondsRemaining={estimatedSecondsRemaining}
          runError={runError}
          approvalSubmitting={approvalSubmitting}
          hasFetchedReportRef={hasFetchedReportRef}
          pollIntervalRef={pollIntervalRef}
          hasCancelledRef={hasCancelledRef}
          handleStopRun={handleStopRun}
        />

        {/* ═══════════════════════════════════════════════════
            ARCHITECTURE FLOW DIAGRAM
            ═══════════════════════════════════════════════════ */}
        <ArchitectureFlow
          companyLabel={companyLabel}
          runStatus={runStatus}
          progress={progress}
          agents={agents}
          logs={logs}
          estimatedSecondsRemaining={estimatedSecondsRemaining}
          runError={runError}
          approvalSubmitting={approvalSubmitting}
          hasFetchedReportRef={hasFetchedReportRef}
          pollIntervalRef={pollIntervalRef}
          hasCancelledRef={hasCancelledRef}
          statusOf={statusOf}
          statusConfig={statusConfig}
          getStatusLabel={getStatusLabel}
        />

        {/* ═══════════════════════════════════════════════════
            AGENT ACTIVITY LOG
            ═══════════════════════════════════════════════════ */}
        <AgentActivityLog
          companyLabel={companyLabel}
          runStatus={runStatus}
          progress={progress}
          agents={agents}
          logs={logs}
          estimatedSecondsRemaining={estimatedSecondsRemaining}
          runError={runError}
          approvalSubmitting={approvalSubmitting}
          hasFetchedReportRef={hasFetchedReportRef}
          pollIntervalRef={pollIntervalRef}
          hasCancelledRef={hasCancelledRef}
        />

        {/* ═══════════════════════════════════════════════════
            OVERALL PROGRESS
            ═══════════════════════════════════════════════════ */}
        <OverallProcessBar
          companyLabel={companyLabel}
          runStatus={runStatus}
          progress={progress}
          agents={agents}
          logs={logs}
          estimatedSecondsRemaining={estimatedSecondsRemaining}
          runError={runError}
          approvalSubmitting={approvalSubmitting}
          hasFetchedReportRef={hasFetchedReportRef}
          pollIntervalRef={pollIntervalRef}
          hasCancelledRef={hasCancelledRef}
          formatSeconds={formatSeconds}
        />

        {/* ═══════════════════════════════════════════════════
            HUMAN APPROVAL (only shown when the graph is paused
            at the human_approval interrupt())
            ═══════════════════════════════════════════════════ */}
        {runStatus === "awaiting_approval" && (
          <AwaitingApproval
            companyLabel={companyLabel}
            runStatus={runStatus}
            progress={progress}
            agents={agents}
            logs={logs}
            estimatedSecondsRemaining={estimatedSecondsRemaining}
            runError={runError}
            approvalSubmitting={approvalSubmitting}
            hasFetchedReportRef={hasFetchedReportRef}
            pollIntervalRef={pollIntervalRef}
            hasCancelledRef={hasCancelledRef}
            handleApproval={handleApproval}
            approvalError={approvalError}
          />
        )}

        {/* ═══════════════════════════════════════════════════
            FAILURE STATE — the run itself has failed. No longer
            triggered by approvalError (see FIX NOTES above).
            ═══════════════════════════════════════════════════ */}
        {(runStatus === "failed" ||
          (runError && runStatus !== "awaiting_approval")) && (
          <AgentFailScreen
            companyLabel={companyLabel}
            runStatus={runStatus}
            progress={progress}
            agents={agents}
            logs={logs}
            estimatedSecondsRemaining={estimatedSecondsRemaining}
            runError={runError}
            approvalSubmitting={approvalSubmitting}
            hasFetchedReportRef={hasFetchedReportRef}
            pollIntervalRef={pollIntervalRef}
            hasCancelledRef={hasCancelledRef}
            onStop={onStop}
          />
        )}
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Small formatting helper for estimatedSecondsRemaining (a number,
   per the API contract) → "3-5 minutes" style text. Passed down
   explicitly as a prop to <OverallProcessBar /> since the child lives
   in its own file/module and can't see this one otherwise.
   ─────────────────────────────────────────────────────────── */
function formatSeconds(totalSeconds) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `~${minutes} minute${minutes === 1 ? "" : "s"}`;
}
