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
} from "../styles/styles";
import { Link } from "react-router-dom";

function AgentFailScreen({
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
  onStop, // Added: passed down from SwarmInAction.jsx — the
  // "Back to Start" link used to call onStop() without this
  // component ever receiving it, so the run was never actually
  // cancelled when a user bailed out from a failed run.
}) {
  return (
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
  );
}

export default AgentFailScreen;
