import React from "react";
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
  wobblySm,
  shadowHardSm,
  wobblyAlt,
  wobbly,
  paperBg,
  shadowHard,
} from "../styles/styles.js";

function ArchitectureFlow({
  companyLabel,
  runStatus,
  progress,
  agents,
  logs,
  estimatedSecondsRemaining,
  runError,
  approvalSubmitting,
  hasFetchedReportRef,
  pollIntervalRef,
  hasCancelledRef,
  statusOf,
  statusConfig,
  getStatusLabel,
}) {
  return (
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
            <div className="text-sm text-[#2d2d2d]/60">Orchestrating tasks</div>
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
              <div className="text-xs text-[#2d2d2d]/60 mb-2">{agent.sub}</div>
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
              <Shield className="w-5 h-5 text-[#2d5da1]" strokeWidth={2.5} />
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
              <PenTool className="w-5 h-5 text-[#2d5da1]" strokeWidth={2.5} />
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
              <UserCheck className="w-5 h-5 text-[#2d2d2d]" strokeWidth={2.5} />
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
  );
}

export default ArchitectureFlow;
