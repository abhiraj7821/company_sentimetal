import React from "react";
import { wobblySm, shadowHardSm } from "../styles/styles.js";
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

function SwarmHeader({
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
  handleStopRun,
}) {
  return (
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

      <div className="flex items-center gap-3">
        {/* Live Badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-100 border-[2px] border-green-600 text-green-700 text-sm font-bold rotate-1"
          style={{ ...wobblySm }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </div>

        {/* Stop Run Button */}
        <button
          onClick={handleStopRun}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#ff4d4d] text-white text-sm font-bold border-[2px] border-[#2d2d2d] hover:bg-[#e53e3e] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100 rotate-[-1deg]"
          style={{ ...wobblySm, ...shadowHardSm }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "3px 3px 0px 0px #2d2d2d")
          }
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
          Stop Run
        </button>
      </div>
    </div>
  );
}

export default SwarmHeader;
