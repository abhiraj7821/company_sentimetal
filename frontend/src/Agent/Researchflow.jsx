import React, { useState } from "react";
import StartNewResearch from "./StartNewResearch";
import SwarmInAction from "./SwarmInAction";
import ResearchComplete from "./ResearchComplete";

/* ───────────────────────────────────────────────────────────
   SentinelSwarm — Research Flow Controller
   Tech: React (JS)

   Wires the three screens into one flow, backed by the real API
   (see lib/api.js + backend_frontend_backend_routes.md):

     StartNewResearch ──(POST /research)──▶ SwarmInAction ──(GET /report)──▶ ResearchComplete
            ▲                                     │                                │
            └────────────(stop run)────────────────┘                                │
            └────────────────────────(run another research)─────────────────────────┘

   - `step` tracks which screen is showing: "form" | "processing" | "complete".
   - `formData` + `runId` come from StartNewResearch once POST /research
     responds — `runId` is what SwarmInAction subscribes to (SSE/poll).
   - `reportData` is the real report payload from GET /research/:runId/report,
     handed up by SwarmInAction once the run completes.
   ─────────────────────────────────────────────────────────── */

export default function ResearchFlow() {
  const [step, setStep] = useState("form"); // "form" | "processing" | "complete"
  const [formData, setFormData] = useState(null);
  const [runId, setRunId] = useState(null);
  const [reportData, setReportData] = useState(null);

  const handleLaunch = ({ formData, runId }) => {
    setFormData(formData);
    setRunId(runId);
    setStep("processing");
  };

  const handleComplete = (report) => {
    setReportData(report);
    setStep("complete");
  };

  const handleStop = () => {
    setRunId(null);
    setStep("form");
  };

  const handleNewResearch = () => {
    setFormData(null);
    setRunId(null);
    setReportData(null);
    setStep("form");
  };

  if (step === "processing") {
    return (
      <SwarmInAction
        formData={formData}
        runId={runId}
        onComplete={handleComplete}
        onStop={handleStop}
      />
    );
  }

  if (step === "complete") {
    return (
      <ResearchComplete
        reportData={reportData}
        onNewResearch={handleNewResearch}
      />
    );
  }

  return <StartNewResearch onLaunch={handleLaunch} />;
  // return <SwarmInAction onLaunch={handleLaunch} />;
}
