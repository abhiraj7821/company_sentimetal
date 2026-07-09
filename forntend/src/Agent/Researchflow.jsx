import React, { useState } from "react";
import SwarmInAction from "./SwarmInAction";
import ResearchComplete from "./ResearchComplete";
import StartNewResearch from "./StartNewResearch";

/* ───────────────────────────────────────────────────────────
   SentinelSwarm — Research Flow Controller
   Tech: React (JS)

   Wires the three screens into one flow:

     StartNewResearch ──(launch)──▶ SwarmInAction ──(complete)──▶ ResearchComplete
            ▲                              │                              │
            └──────────────(stop run)──────┘                              │
            └───────────────────────(run another research)────────────────┘

   How it works:
   - `step` tracks which screen is showing: "form" | "processing" | "complete".
   - `formData` is what the user entered on the Start New Research screen —
     passed down to SwarmInAction so it can reference the research target.
   - `reportData` is the demo report object built once the simulated swarm
     run finishes — passed down to ResearchComplete to render.

   Swap in a real API call:
   - In `handleLaunch`, replace the pass-through with your real
     `POST /research` call (e.g. via routes/research.js), store the
     returned `runId`, and have SwarmInAction poll `GET /research/:runId`
     (routes/status.js) or subscribe to the SSE stream (routes/stream.js)
     instead of the local setInterval simulation.
   - When the run completes, replace the demo `reportData` with the real
     report payload from the backend.
   ─────────────────────────────────────────────────────────── */

export default function ResearchFlow() {
  const [step, setStep] = useState("form"); // "form" | "processing" | "complete"
  const [formData, setFormData] = useState(null);
  const [reportData, setReportData] = useState(null);

  const handleLaunch = (data) => {
    setFormData(data);
    setStep("processing");
  };

  const handleComplete = (demoReport) => {
    setReportData(demoReport);
    setStep("complete");
  };

  const handleStop = () => {
    setStep("form");
  };

  const handleNewResearch = () => {
    setFormData(null);
    setReportData(null);
    setStep("form");
  };

  if (step === "processing") {
    return (
      <SwarmInAction
        formData={formData}
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
}
