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
} from "../lib/api.js";

import { Link } from "react-router-dom";
import NavbarHeader from "../components/NavbarHeader.jsx";

/* ───────────────────────────────────────────────────────────
   SentinelSwarm — Swarm In Action (Live Processing Screen)
   Tech: React + Tailwind CSS
   Style: Hand-Drawn / Sketchbook aesthetic

   WIRING (real backend):
   - Accepts `runId` (returned by POST /research in StartNewResearch)
     and `formData` (just for the "Researching <company>..." label).
   - Opens an SSE connection to GET /research/:runId/stream and renders
     whatever the server pushes — `agents`, `logs`, `progress` are
     already shaped exactly like this component's local state used to
     be, so no client-side remapping is needed (see the API contract
     doc + routes/status.js's projector).
   - Falls back to polling GET /research/:runId/status every 2s if the
     SSE connection errors out (e.g. behind a proxy that buffers).
   - status === "completed"  → fetch GET /research/:runId/report once,
     then call `onComplete(reportPayload)`.
   - status === "awaiting_approval" → show inline Approve / Request
     Changes buttons that call POST /research/:runId/approve.
   - status === "failed" → show the error and let the user go back via
     `onStop()`.
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

  const hasFetchedReportRef = useRef(false);
  const pollIntervalRef = useRef(null);

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

  // Live updates: SSE first, polling fallback if the stream errors out.
  useEffect(() => {
    if (!runId) return;

    let source = null;
    let cancelled = false;

    const startPollingFallback = () => {
      if (pollIntervalRef.current) return; // already polling
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
          // SSE dropped — switch to polling instead of failing silently.
          if (source) source.close();
          startPollingFallback();
        },
      );
    } catch {
      // EventSource unsupported / blocked — go straight to polling.
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
    setApprovalSubmitting(true);
    try {
      await approveRun(runId, decision);
      // The next SSE/poll update will reflect the new status; no local
      // state mutation needed here.
    } catch (err) {
      setRunError(err.message || "Couldn't submit your decision.");
    } finally {
      setApprovalSubmitting(false);
    }
  };

  // ── Design Token Helpers ──
  const paperBg = {
    backgroundColor: "#fdfbf7",
    backgroundImage: "radial-gradient(#e5e0d8 1px, transparent 1px)",
    backgroundSize: "24px 24px",
  };

  const wobbly = {
    borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
  };
  const wobblyAlt = {
    borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px",
  };
  const wobblySm = {
    borderRadius: "235px 20px 215px 20px / 20px 215px 20px 235px",
  };

  const shadowHard = { boxShadow: "4px 4px 0px 0px #2d2d2d" };
  const shadowHardSm = { boxShadow: "3px 3px 0px 0px #2d2d2d" };

  // agents[key] is `{ status, label }` (see routes/status.js's projector);
  // this just guards against a key being briefly absent on the first tick.
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
      <NavbarHeader />

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#2d2d2d] mb-2"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              SWARM IN ACTION <span className="text-[#2d5da1]">✦</span>
            </h1>
            <p className="text-xl text-[#2d2d2d]/70">
              Researching <span className="font-bold">{companyLabel}</span>...
            </p>
          </div>

          {/* Live Badge */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-100 border-[2px] border-green-600 text-green-700 text-sm font-bold rotate-1"
            style={{ ...wobblySm }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ARCHITECTURE FLOW DIAGRAM
            ═══════════════════════════════════════════════════ */}
        <div className="relative mb-10">
          {/* Sticky Note */}
          <div
            className="absolute -top-4 right-0 md:right-8 bg-[#fff9c4] border-[2px] border-[#2d2d2d] p-3 max-w-[140px] text-sm text-[#2d2d2d] rotate-[3deg] z-20"
            style={{ ...shadowHardSm, fontFamily: "'Kalam', cursive" }}
          >
            <div className="font-bold mb-1">Live updates</div>
            <div className="font-bold mb-1">from each</div>
            <div>agent</div>
            <div className="mt-1 text-[#2d5da1]">→</div>
          </div>

          {/* Flow Container */}
          <div
            className="bg-white border-[3px] border-[#2d2d2d] p-6 md:p-8 relative"
            style={{ ...wobblyAlt, ...shadowHard }}
          >
            {/* Tape */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#e5e0d8]/60 border border-[#2d2d2d]/20 rotate-[-2deg]"
              style={{ borderRadius: "2px" }}
            />

            {/* Supervisor */}
            <div className="flex justify-center mb-6">
              <div
                className="px-6 py-3 bg-white border-[3px] border-[#2d2d2d] text-center relative"
                style={{ ...wobblySm, ...shadowHardSm }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Bot className="w-5 h-5 text-[#2d5da1]" strokeWidth={2.5} />
                  <span
                    className="font-bold text-[#2d2d2d] text-lg"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    SUPERVISOR
                  </span>
                </div>
                <div className="text-sm text-[#2d2d2d]/60">
                  Orchestrating tasks
                </div>
                {/* Status dot */}
                <div
                  className="absolute -right-2 -top-2 flex items-center gap-1 px-2 py-0.5 bg-green-100 border-[2px] border-green-600 text-green-700 text-xs font-bold"
                  style={{ ...wobblySm }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>

            {/* Dashed arrow down */}
            <div className="flex justify-center mb-6">
              <svg width="40" height="30" viewBox="0 0 40 30">
                <path
                  d="M20 0 L20 20 M12 12 L20 22 L28 12"
                  stroke="#2d2d2d"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  fill="none"
                  className="animate-dash"
                />
              </svg>
            </div>

            {/* Agent Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  key: "filing",
                  icon: <FileText className="w-6 h-6" strokeWidth={2.5} />,
                  label: "FILING AGENT",
                  sub: agents.filing?.label || "10-K / 10-Q",
                  status: statusOf("filing"),
                },
                {
                  key: "news",
                  icon: <Newspaper className="w-6 h-6" strokeWidth={2.5} />,
                  label: "NEWS AGENT",
                  sub: agents.news?.label || "Collecting news",
                  status: statusOf("news"),
                },
                {
                  key: "sentiment",
                  icon: <Smile className="w-6 h-6" strokeWidth={2.5} />,
                  label: "SENTIMENT AGENT",
                  sub: agents.sentiment?.label || "Analyzing sentiment",
                  status: statusOf("sentiment"),
                },
                {
                  key: "webScout",
                  icon: <Globe className="w-6 h-6" strokeWidth={2.5} />,
                  label: "WEB SCOUT AGENT",
                  sub: agents.webScout?.label || "Exploring web",
                  status: statusOf("webScout"),
                },
              ].map((agent) => (
                <div
                  key={agent.key}
                  className={`px-3 py-4 bg-white border-[3px] border-[#2d2d2d] text-center relative hover:rotate-1 transition-transform duration-100 ${agent.status === "completed" ? "bg-green-50" : ""}`}
                  style={{ ...wobblySm, ...shadowHardSm }}
                >
                  <div className="flex justify-center mb-2 p-2 bg-[#fdfbf7] border-[2px] border-[#2d2d2d] rounded-full w-12 h-12 mx-auto">
                    {agent.icon}
                  </div>
                  <div
                    className="font-bold text-[#2d2d2d] text-sm"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    {agent.label}
                  </div>
                  <div className="text-xs text-[#2d2d2d]/60 mb-2">
                    {agent.sub}
                  </div>
                  <div
                    className={`flex items-center justify-center gap-1 text-xs font-bold ${statusConfig[agent.status].color}`}
                  >
                    {statusConfig[agent.status].icon}
                    {getStatusLabel(agent.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Dashed arrows up from agents to critic */}
            <div className="hidden md:flex justify-center mb-4">
              <svg
                width="600"
                height="25"
                viewBox="0 0 600 25"
                className="max-w-full"
              >
                {/* Left arrow */}
                <path
                  d="M100 25 L100 5 L300 5"
                  stroke="#2d2d2d"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                  fill="none"
                />
                <path
                  d="M300 5 L300 15"
                  stroke="#2d2d2d"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                  fill="none"
                />
                {/* Right arrow */}
                <path
                  d="M500 25 L500 5 L300 5"
                  stroke="#2d2d2d"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                  fill="none"
                />
                {/* Center arrow */}
                <path
                  d="M300 25 L300 15"
                  stroke="#2d2d2d"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                  fill="none"
                />
              </svg>
            </div>

            {/* Critic Agent */}
            <div className="flex justify-center mb-4">
              <div
                className={`px-6 py-3 bg-white border-[3px] border-[#2d2d2d] text-center relative ${statusOf("critic") === "in-progress" ? "bg-[#2d5da1]/5" : ""}`}
                style={{ ...wobblySm, ...shadowHardSm }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield
                    className="w-5 h-5 text-[#2d5da1]"
                    strokeWidth={2.5}
                  />
                  <span
                    className="font-bold text-[#2d2d2d] text-lg"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    CRITIC AGENT
                  </span>
                </div>
                <div className="text-sm text-[#2d2d2d]/60 mb-1">
                  Verifying facts
                </div>
                <div
                  className={`flex items-center justify-center gap-1 text-xs font-bold ${statusConfig[statusOf("critic")].color}`}
                >
                  {statusConfig[statusOf("critic")].icon}
                  {getStatusLabel(statusOf("critic"))}
                </div>
              </div>
            </div>

            {/* Arrow down */}
            <div className="flex justify-center mb-4">
              <svg width="30" height="25" viewBox="0 0 30 25">
                <path
                  d="M15 0 L15 15 M8 8 L15 18 L22 8"
                  stroke="#2d2d2d"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  fill="none"
                />
              </svg>
            </div>

            {/* Report Writer */}
            <div className="flex justify-center mb-4">
              <div
                className={`px-6 py-3 bg-white border-[3px] border-[#2d2d2d] text-center relative ${statusOf("reportWriter") === "in-progress" ? "bg-[#2d5da1]/5" : ""}`}
                style={{ ...wobblySm, ...shadowHardSm }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <PenTool
                    className="w-5 h-5 text-[#2d5da1]"
                    strokeWidth={2.5}
                  />
                  <span
                    className="font-bold text-[#2d2d2d] text-lg"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    REPORT WRITER
                  </span>
                </div>
                <div className="text-sm text-[#2d2d2d]/60 mb-1">
                  Drafting report
                </div>
                <div
                  className={`flex items-center justify-center gap-1 text-xs font-bold ${statusConfig[statusOf("reportWriter")].color}`}
                >
                  {statusConfig[statusOf("reportWriter")].icon}
                  {getStatusLabel(statusOf("reportWriter"))}
                </div>
              </div>
            </div>

            {/* Arrow down */}
            <div className="flex justify-center mb-4">
              <svg width="30" height="25" viewBox="0 0 30 25">
                <path
                  d="M15 0 L15 15 M8 8 L15 18 L22 8"
                  stroke="#2d2d2d"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  fill="none"
                />
              </svg>
            </div>

            {/* Human Approval */}
            <div className="flex justify-center">
              <div
                className={`px-6 py-3 bg-[#fff9c4] border-[3px] border-[#2d2d2d] text-center relative ${statusOf("humanApproval") === "pending" ? "opacity-70" : ""}`}
                style={{ ...wobblyAlt, ...shadowHardSm }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <UserCheck
                    className="w-5 h-5 text-[#2d2d2d]"
                    strokeWidth={2.5}
                  />
                  <span
                    className="font-bold text-[#2d2d2d] text-lg"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    HUMAN APPROVAL
                  </span>
                </div>
                <div className="text-sm text-[#2d2d2d]/60 mb-1">
                  Review & approve
                </div>
                <div
                  className={`flex items-center justify-center gap-1 text-xs font-bold ${statusConfig[statusOf("humanApproval")].color}`}
                >
                  {statusConfig[statusOf("humanApproval")].icon}
                  {getStatusLabel(statusOf("humanApproval"))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            AGENT ACTIVITY LOG
            ═══════════════════════════════════════════════════ */}
        <div
          className="bg-white border-[3px] border-[#2d2d2d] p-6 mb-8 relative"
          style={{ ...wobbly, ...shadowHard }}
        >
          {/* Tape */}
          <div
            className="absolute -top-3 left-8 w-14 h-5 bg-[#e5e0d8]/60 border border-[#2d2d2d]/20 rotate-[-3deg]"
            style={{ borderRadius: "2px" }}
          />

          <h2
            className="text-2xl font-bold text-[#2d2d2d] mb-5"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            AGENT ACTIVITY LOG
          </h2>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-[#fdfbf7] border-[2px] border-[#2d2d2d]/20 hover:border-[#2d2d2d] hover:bg-[#fff9c4]/30 transition-all"
                style={{ ...wobblySm }}
              >
                {/* Status dot */}
                <div
                  className={`w-3 h-3 rounded-full border-[2px] border-[#2d2d2d] shrink-0 ${log.status === "completed" ? "bg-green-500" : log.status === "in-progress" ? "bg-[#2d5da1] animate-pulse" : "bg-[#e5e0d8]"}`}
                />

                {/* Time */}
                <span className="text-sm text-[#2d2d2d]/60 font-mono w-16 shrink-0">
                  {log.time}
                </span>

                {/* Agent name */}
                <span
                  className="font-bold text-[#2d2d2d] text-base w-32 shrink-0"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {log.agent}
                </span>

                {/* Arrow */}
                <span className="text-[#2d2d2d]/40">→</span>

                {/* Action */}
                <span className="text-[#2d2d2d]/80 text-base truncate">
                  {log.action}
                </span>

                {/* Status icon */}
                <div className="ml-auto">
                  {log.status === "completed" ? (
                    <CheckCircle
                      className="w-5 h-5 text-green-600"
                      strokeWidth={2.5}
                    />
                  ) : log.status === "in-progress" ? (
                    <Loader2
                      className="w-5 h-5 text-[#2d5da1] animate-spin"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Clock
                      className="w-5 h-5 text-[#e5e0d8]"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            OVERALL PROGRESS
            ═══════════════════════════════════════════════════ */}
        <div className="relative">
          {/* Blue flower decoration */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 hidden md:block rotate-[10deg]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M50 15 Q55 0 50 0 Q45 0 50 15"
                fill="#2d5da1"
                opacity="0.8"
              />
              <path
                d="M50 15 Q65 5 70 10 Q65 15 50 15"
                fill="#5a8fd8"
                opacity="0.7"
              />
              <path
                d="M50 15 Q35 5 30 10 Q35 15 50 15"
                fill="#5a8fd8"
                opacity="0.7"
              />
              <path
                d="M50 15 Q60 30 65 35 Q55 30 50 15"
                fill="#8bb3e8"
                opacity="0.6"
              />
              <path
                d="M50 15 Q40 30 35 35 Q45 30 50 15"
                fill="#8bb3e8"
                opacity="0.6"
              />
              <circle cx="50" cy="15" r="5" fill="#2d5da1" />
              <path
                d="M50 20 Q52 45 50 75"
                stroke="#2d5da1"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
              <path
                d="M50 45 Q60 40 65 35"
                stroke="#2d5da1"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />
              <path
                d="M50 55 Q40 50 35 45"
                stroke="#2d5da1"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />
            </svg>
          </div>

          <div
            className="bg-white border-[3px] border-[#2d2d2d] p-6"
            style={{ ...wobblyAlt, ...shadowHard }}
          >
            <h2
              className="text-2xl font-bold text-[#2d2d2d] mb-4"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              OVERALL PROGRESS
            </h2>

            {/* Progress Bar Container */}
            <div className="flex items-center gap-4 mb-3">
              <div
                className="flex-1 h-8 bg-[#e5e0d8]/50 border-[3px] border-[#2d2d2d] relative overflow-hidden"
                style={{ ...wobblySm }}
              >
                {/* Progress fill */}
                <div
                  className="h-full bg-[#2d5da1] transition-all duration-500 ease-out relative"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  {/* Striped pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 20px)",
                    }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <span
                className="text-3xl font-bold text-[#2d2d2d] w-20 text-right"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                {Math.round(progress)}%
              </span>
            </div>

            {/* Estimated time */}
            <p className="text-lg text-[#2d2d2d]/70">
              {runStatus === "completed" ? (
                <>Wrapping up — handing off to your report...</>
              ) : estimatedSecondsRemaining != null ? (
                <>
                  Estimated time remaining:{" "}
                  <span className="font-bold text-[#2d2d2d]">
                    {formatSeconds(estimatedSecondsRemaining)}
                  </span>
                </>
              ) : (
                <>Working...</>
              )}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            HUMAN APPROVAL (only shown when the graph is paused
            at the human_approval interrupt())
            ═══════════════════════════════════════════════════ */}
        {runStatus === "awaiting_approval" && (
          <div
            className="mt-8 bg-[#fff9c4] border-[3px] border-[#2d2d2d] p-6"
            style={{ ...wobblyAlt, ...shadowHard }}
          >
            <h2
              className="text-2xl font-bold text-[#2d2d2d] mb-2"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              WAITING ON YOUR REVIEW
            </h2>
            <p className="text-lg text-[#2d2d2d]/80 mb-4">
              The draft report passed the critic's fact-check and is ready for
              your sign-off before publishing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={approvalSubmitting}
                onClick={() => handleApproval("approved")}
                className="px-6 py-3 bg-[#2d5da1] text-white text-lg font-bold border-[3px] border-[#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-60"
                style={{ ...wobblySm, ...shadowHardSm }}
              >
                {approvalSubmitting ? "Submitting..." : "Approve & Publish"}
              </button>
              <button
                disabled={approvalSubmitting}
                onClick={() => handleApproval("changes_requested")}
                className="px-6 py-3 bg-white text-[#2d2d2d] text-lg font-bold border-[3px] border-[#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-60"
                style={{ ...wobblySm, ...shadowHardSm }}
              >
                Request Changes
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            FAILURE STATE
            ═══════════════════════════════════════════════════ */}
        {(runStatus === "failed" || runError) && (
          <div
            className="mt-8 bg-white border-[3px] border-[#ff4d4d] p-6 flex items-start gap-4"
            style={{ ...wobblyAlt, ...shadowHard }}
          >
            <AlertTriangle
              className="w-8 h-8 text-[#ff4d4d] shrink-0"
              strokeWidth={2.5}
            />
            <div className="flex-1">
              <h2
                className="text-xl font-bold text-[#2d2d2d] mb-1"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Something went wrong
              </h2>
              <p className="text-lg text-[#2d2d2d]/70 mb-4">
                {runError || "The run failed unexpectedly. Please try again."}
              </p>
              <Link
                to={"/agent"}
                onClick={() => onStop && onStop()}
                className="px-5 py-2.5 bg-white text-[#2d2d2d] text-base font-bold border-[3px] border-[#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                style={{ ...wobblySm, ...shadowHardSm }}
              >
                Back to Start
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Small formatting helper for estimatedSecondsRemaining (a number,
   per the API contract) → "3-5 minutes" style text.
   ─────────────────────────────────────────────────────────── */
function formatSeconds(totalSeconds) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `~${minutes} minute${minutes === 1 ? "" : "s"}`;
}
