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

function AgentActivityLog({
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
}) {
  return (
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
                <Clock className="w-5 h-5 text-[#e5e0d8]" strokeWidth={2.5} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentActivityLog;
