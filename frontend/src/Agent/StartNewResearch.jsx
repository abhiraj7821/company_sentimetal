import React, { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Newspaper,
  Smile,
  Globe,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { startResearch } from "../lib/api.js";
import NavbarHeader from "../components/navbarHeader.jsx";

/* ───────────────────────────────────────────────────────────
   SentinelSwarm — Start New Research Screen
   Tech: React + Tailwind CSS
   Style: Hand-Drawn / Sketchbook aesthetic

   WIRING:
   - Accepts `onLaunch({ formData, runId })` from the parent flow controller.
   - On submit, calls POST /research (via lib/api.js), then hands the
     form data + returned runId up so the parent can switch to the
     SwarmInAction screen and start polling/streaming that run.
   ─────────────────────────────────────────────────────────── */

export default function StartNewResearch({ onLaunch }) {
  const [formData, setFormData] = useState({
    researchTarget: "Apple Inc. (AAPL)",
    researchObjective:
      "Provide a comprehensive competitive intelligence report covering Q1 2026 performance, recent news, market sentiment, and key competitor activities.",
    timeRange: "q1-2026",
    dataSources: {
      secFilings: true,
      newsPress: true,
      marketSentiment: true,
      webCompetitor: true,
    },
    reportDepth: "standard",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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
  const wobblyInput = {
    borderRadius: "20px 15px 25px 18px / 18px 25px 15px 20px",
  };

  const shadowHard = { boxShadow: "4px 4px 0px 0px #2d2d2d" };
  const shadowHardSm = { boxShadow: "3px 3px 0px 0px #2d2d2d" };

  const handleSourceToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      dataSources: { ...prev.dataSources, [key]: !prev.dataSources[key] },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // Real API call — POST /research (see routes/research.js).
      // Backend responds immediately with a runId once the job is queued.
      const { runId } = await startResearch(formData);
      // Hand the form data + runId up to the flow controller, which will
      // switch to the SwarmInAction (live processing) screen and start
      // polling/streaming that run.
      if (onLaunch) onLaunch({ formData, runId });
    } catch (err) {
      setSubmitError(
        err.message || "Couldn't reach the swarm. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
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
      `}</style>

      {/* ═══════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════ */}
      <NavbarHeader />

      {/* ═══════════════════════════════════════════════════
          MAIN FORM
          ═══════════════════════════════════════════════════ */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-bold text-[#2d2d2d] mb-2"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            START NEW RESEARCH <span className="text-[#2d5da1]">✦</span>
          </h1>
          <p className="text-xl text-[#2d2d2d]/70">
            Tell the swarm what to research.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-white border-[3px] border-[#2d2d2d] p-6 md:p-10"
          style={{ ...wobblyAlt, ...shadowHard }}
        >
          {/* Tape decoration */}
          <div
            className="absolute -top-3 right-12 w-20 h-6 bg-[#e5e0d8]/50 border border-[#2d2d2d]/20 rotate-[3deg]"
            style={{ borderRadius: "2px" }}
          />

          {/* Blue flower decoration (top right) */}
          <div className="absolute -top-6 -right-6 w-24 h-24 hidden md:block rotate-[15deg]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M50 20 Q55 5 50 0 Q45 5 50 20"
                fill="#2d5da1"
                opacity="0.8"
              />
              <path
                d="M50 20 Q65 10 70 15 Q65 20 50 20"
                fill="#5a8fd8"
                opacity="0.7"
              />
              <path
                d="M50 20 Q35 10 30 15 Q35 20 50 20"
                fill="#5a8fd8"
                opacity="0.7"
              />
              <path
                d="M50 20 Q60 35 65 40 Q55 35 50 20"
                fill="#8bb3e8"
                opacity="0.6"
              />
              <path
                d="M50 20 Q40 35 35 40 Q45 35 50 20"
                fill="#8bb3e8"
                opacity="0.6"
              />
              <circle cx="50" cy="20" r="5" fill="#2d5da1" />
              <path
                d="M50 25 Q52 50 50 80"
                stroke="#2d5da1"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
              <path
                d="M50 50 Q60 45 65 40"
                stroke="#2d5da1"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />
              <path
                d="M50 60 Q40 55 35 50"
                stroke="#2d5da1"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />
            </svg>
          </div>

          {/* ── 1. RESEARCH TARGET ── */}
          <div className="mb-8">
            <label
              className="block text-2xl font-bold text-[#2d2d2d] mb-3"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              1. RESEARCH TARGET
            </label>
            <input
              type="text"
              value={formData.researchTarget}
              onChange={(e) =>
                setFormData({ ...formData, researchTarget: e.target.value })
              }
              className="w-full px-4 py-3 bg-white border-[3px] border-[#2d2d2d] text-[#2d2d2d] text-xl outline-none focus:border-[#2d5da1] focus:ring-2 focus:ring-[#2d5da1]/20 transition-all"
              style={{ ...wobblyInput, fontFamily: "'Patrick Hand', cursive" }}
              placeholder="e.g., Tesla Inc. (TSLA)"
            />
            <p className="mt-2 text-base text-[#2d2d2d]/60">
              Company name, ticker symbol, or product / category
            </p>
          </div>

          {/* ── 2. RESEARCH OBJECTIVE ── */}
          <div className="mb-8">
            <label
              className="block text-2xl font-bold text-[#2d2d2d] mb-3"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              2. RESEARCH OBJECTIVE
            </label>
            <textarea
              value={formData.researchObjective}
              onChange={(e) =>
                setFormData({ ...formData, researchObjective: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 bg-white border-[3px] border-[#2d2d2d] text-[#2d2d2d] text-lg outline-none focus:border-[#2d5da1] focus:ring-2 focus:ring-[#2d5da1]/20 transition-all resize-y"
              style={{ ...wobblyInput, fontFamily: "'Patrick Hand', cursive" }}
              placeholder="What do you want to learn or analyze?"
            />
            <p className="mt-2 text-base text-[#2d2d2d]/60">
              What do you want to learn or analyze?
            </p>
          </div>

          {/* ── 3. TIME RANGE ── */}
          <div className="mb-8">
            <label
              className="block text-2xl font-bold text-[#2d2d2d] mb-3"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              3. TIME RANGE
            </label>
            <div className="relative">
              <select
                value={formData.timeRange}
                onChange={(e) =>
                  setFormData({ ...formData, timeRange: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border-[3px] border-[#2d2d2d] text-[#2d2d2d] text-xl outline-none focus:border-[#2d5da1] focus:ring-2 focus:ring-[#2d5da1]/20 transition-all appearance-none cursor-pointer"
                style={{
                  ...wobblyInput,
                  fontFamily: "'Patrick Hand', cursive",
                }}
              >
                <option value="q1-2026">Q1 2026 (Jan 1 – Mar 31, 2026)</option>
                <option value="q2-2026">Q2 2026 (Apr 1 – Jun 30, 2026)</option>
                <option value="q3-2025">Q3 2025 (Jul 1 – Sep 30, 2025)</option>
                <option value="q4-2025">Q4 2025 (Oct 1 – Dec 31, 2025)</option>
                <option value="ytd-2026">Year to Date 2026</option>
                <option value="last-12m">Last 12 Months</option>
                <option value="custom">Custom Range</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                  <path
                    d="M2 2L8 8L14 2"
                    stroke="#2d2d2d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-base text-[#2d2d2d]/60">
              Select the time period for analysis
            </p>
          </div>

          {/* ── 4. DATA SOURCES ── */}
          <div className="mb-8 relative">
            <label
              className="block text-2xl font-bold text-[#2d2d2d] mb-4"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              4. DATA SOURCES
            </label>

            <div className="space-y-3">
              {[
                {
                  key: "secFilings",
                  label: "SEC Filings (10-K / 10-Q)",
                  icon: <FileText className="w-5 h-5" strokeWidth={2.5} />,
                },
                {
                  key: "newsPress",
                  label: "News & Press",
                  icon: <Newspaper className="w-5 h-5" strokeWidth={2.5} />,
                },
                {
                  key: "marketSentiment",
                  label: "Market Sentiment",
                  icon: <Smile className="w-5 h-5" strokeWidth={2.5} />,
                },
                {
                  key: "webCompetitor",
                  label: "Web & Competitor Intel",
                  icon: <Globe className="w-5 h-5" strokeWidth={2.5} />,
                },
              ].map((source) => (
                <label
                  key={source.key}
                  className="flex items-center gap-4 p-3 bg-[#fdfbf7] border-[2px] border-[#2d2d2d] cursor-pointer hover:bg-[#fff9c4]/50 transition-colors"
                  style={{ ...wobblySm }}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.dataSources[source.key]}
                      onChange={() => handleSourceToggle(source.key)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 border-[3px] border-[#2d2d2d] flex items-center justify-center transition-all ${formData.dataSources[source.key] ? "bg-[#2d5da1]" : "bg-white"}`}
                      style={{
                        borderRadius: "4px 6px 5px 7px / 7px 5px 6px 4px",
                      }}
                    >
                      {formData.dataSources[source.key] && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  <span className="text-lg text-[#2d2d2d] font-bold">
                    {source.label}
                  </span>
                  <div className="ml-auto p-1.5 bg-white border-[2px] border-[#2d2d2d] rounded-full">
                    {source.icon}
                  </div>
                </label>
              ))}
            </div>

            {/* Sticky Note */}
            <div
              className="absolute -right-4 top-0 md:-right-16 md:top-8 bg-[#fff9c4] border-[2px] border-[#2d2d2d] p-3 max-w-[140px] text-sm text-[#2d2d2d] rotate-[4deg]"
              style={{ ...shadowHardSm, fontFamily: "'Kalam', cursive" }}
            >
              <div className="font-bold mb-1">More sources</div>
              <div className="font-bold mb-1">= deeper</div>
              <div>insights</div>
              <div className="mt-1 text-[#2d5da1]">♡</div>
            </div>
          </div>

          {/* ── 5. REPORT DEPTH ── */}
          <div className="mb-10">
            <label
              className="block text-2xl font-bold text-[#2d2d2d] mb-4"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              5. REPORT DEPTH
            </label>
            <div className="space-y-3">
              {[
                { value: "quick", label: "Quick Overview" },
                { value: "standard", label: "Standard Report" },
                { value: "deep", label: "Deep Dive Analysis" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-4 p-3 bg-[#fdfbf7] border-[2px] border-[#2d2d2d] cursor-pointer hover:bg-[#fff9c4]/50 transition-colors"
                  style={{ ...wobblySm }}
                >
                  <div className="relative">
                    <input
                      type="radio"
                      name="reportDepth"
                      value={option.value}
                      checked={formData.reportDepth === option.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reportDepth: e.target.value,
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 border-[3px] border-[#2d2d2d] rounded-full flex items-center justify-center transition-all ${formData.reportDepth === option.value ? "bg-[#2d5da1]" : "bg-white"}`}
                    >
                      {formData.reportDepth === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <span className="text-lg text-[#2d2d2d] font-bold">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── LAUNCH BUTTON ── */}
          <div className="text-center relative">
            {/* Blue flower decoration (bottom left) */}
            <div className="absolute -bottom-8 -left-8 w-20 h-20 hidden md:block -rotate-[20deg]">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path
                  d="M30 50 Q20 35 25 30 Q30 35 30 50"
                  fill="#8bb3e8"
                  opacity="0.6"
                />
                <path
                  d="M30 50 Q15 50 10 45 Q20 45 30 50"
                  fill="#5a8fd8"
                  opacity="0.7"
                />
                <path
                  d="M30 50 Q25 65 30 75 Q35 65 30 50"
                  fill="#2d5da1"
                  opacity="0.8"
                />
                <path
                  d="M30 50 Q40 60 45 55 Q40 50 30 50"
                  fill="#8bb3e8"
                  opacity="0.6"
                />
                <circle cx="30" cy="50" r="4" fill="#2d5da1" />
                <path
                  d="M30 75 Q32 85 30 95"
                  stroke="#2d5da1"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.5"
                />
              </svg>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-4 bg-[#2d5da1] text-white text-2xl font-bold border-[3px] border-[#2d2d2d] hover:bg-[#1e4a8a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-3"
              style={{ ...wobbly, ...shadowHard }}
              onMouseEnter={(e) => {
                if (!isSubmitting)
                  e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d";
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                  LAUNCHING...
                </>
              ) : (
                <>
                  LAUNCH SWARM
                  <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
                </>
              )}
            </button>

            {submitError && (
              <p
                className="mt-4 text-lg text-[#ff4d4d] font-bold"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                ⚠ {submitError}
              </p>
            )}

            <p className="mt-4 text-lg text-[#2d2d2d]/70">
              The agents will handle the rest!
              <span
                className="inline-block ml-1 text-[#ff4d4d] font-bold"
                style={{ textDecoration: "underline wavy #ff4d4d" }}
              >
                ✦
              </span>
            </p>
          </div>

          {/* Torn paper edge effect at bottom */}
          <div className="absolute -bottom-3 left-0 right-0 h-4 overflow-hidden">
            <svg
              viewBox="0 0 400 20"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <path
                d="M0,10 Q20,0 40,10 T80,10 T120,10 T160,10 T200,10 T240,10 T280,10 T320,10 T360,10 T400,10 L400,20 L0,20 Z"
                fill="#fdfbf7"
                stroke="#2d2d2d"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </form>
      </main>
    </div>
  );
}
