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

function AwaitingApproval({
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
  handleApproval, // Added: passed down from SwarmInAction.jsx — the
  // Approve/Request Changes buttons used to call handleApproval()
  // without this component ever receiving it, throwing
  // "handleApproval is not defined" on click.
}) {
  return (
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
        The draft report passed the critic's fact-check and is ready for your
        sign-off before publishing.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          disabled={approvalSubmitting || !handleApproval}
          onClick={() => handleApproval && handleApproval("approved")}
          className="px-6 py-3 bg-[#2d5da1] text-white text-lg font-bold border-[3px] border-[#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-60"
          style={{ ...wobblySm, ...shadowHardSm }}
        >
          {approvalSubmitting ? "Submitting..." : "Approve & Publish"}
        </button>
        <button
          disabled={approvalSubmitting || !handleApproval}
          onClick={() => handleApproval && handleApproval("changes_requested")}
          className="px-6 py-3 bg-white text-[#2d2d2d] text-lg font-bold border-[3px] border-[#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-60"
          style={{ ...wobblySm, ...shadowHardSm }}
        >
          Request Changes
        </button>
      </div>
    </div>
  );
}

export default AwaitingApproval;
