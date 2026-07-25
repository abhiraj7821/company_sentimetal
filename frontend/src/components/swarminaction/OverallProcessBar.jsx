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

function OverallProcessBar({
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
  formatSeconds, // Added: passed down from SwarmInAction.jsx — this
  // component used to call formatSeconds() without ever receiving it,
  // which threw "formatSeconds is not defined" as soon as
  // estimatedSecondsRemaining was a number, crashing the whole tree.
}) {
  return (
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
          ) : typeof estimatedSecondsRemaining === "number" &&
            typeof formatSeconds === "function" ? (
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
  );
}

export default OverallProcessBar;
