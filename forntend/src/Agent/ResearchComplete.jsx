import React, { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  CheckCircle,
  Download,
  ArrowRight,
  Star,
  User,
  Lightbulb,
  Smile,
  Clock,
  Heart,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ───────────────────────────────────────────────────────────
   SentinelSwarm — Research Complete (Results Screen)
   Tech: React + Tailwind CSS
   Style: Hand-Drawn / Sketchbook aesthetic

   WIRING (real backend):
   - Accepts `reportData` — the exact payload from
     GET /research/:runId/report (see the API contract doc + routes/report.js),
     handed down from SwarmInAction once the run completes.
   - `stats.factAccuracy` arrives as a 0–1 float and `stats.runTimeSeconds`
     as a number, so formatting (%, "12m 34s") happens here, client-side.
   - Accepts `onNewResearch()` — called when the user clicks
     "New Research", so the parent flow can switch back to the
     Start New Research screen.
   ─────────────────────────────────────────────────────────── */

const DEFAULT_REPORT = {
  company: { name: "Apple Inc.", ticker: "AAPL" },
  title: "Apple Inc. – Q1 2024 Intelligence Report",
  generatedAt: "2024-05-27T10:32:00Z",
  stats: {
    sourcesAnalyzed: 42,
    insightsFound: 128,
    factAccuracy: 0.987,
    runTimeSeconds: 754,
  },
  sections: [
    { id: "executive_summary", title: "Executive Summary" },
    { id: "financial_highlights", title: "Q1 2024 Financial Highlights" },
    { id: "key_developments", title: "Key Developments & News" },
    { id: "market_sentiment", title: "Market Sentiment Analysis" },
    { id: "competitor_intelligence", title: "Competitor Intelligence" },
    { id: "risks_opportunities", title: "Risks & Opportunities" },
    { id: "sources_references", title: "Sources & References" },
  ],
  downloadUrl: null,
};

function formatGeneratedAt(isoString) {
  try {
    return new Date(isoString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function formatRunTime(totalSeconds) {
  if (typeof totalSeconds !== "number") return totalSeconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

function formatFactAccuracy(value) {
  if (typeof value !== "number") return value;
  return `${(value * 100).toFixed(1)}%`;
}

export default function ResearchComplete({ reportData, onNewResearch }) {
  const report = reportData || DEFAULT_REPORT;
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showFullReport, setShowFullReport] = useState(false);

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

  const reportSections = report.sections || [];

  const stats = [
    {
      icon: <User className="w-6 h-6" strokeWidth={2.5} />,
      value: String(report.stats.sourcesAnalyzed),
      label: "Sources Analyzed",
    },
    {
      icon: <Lightbulb className="w-6 h-6" strokeWidth={2.5} />,
      value: String(report.stats.insightsFound),
      label: "Insights Found",
    },
    {
      icon: <Smile className="w-6 h-6" strokeWidth={2.5} />,
      value: formatFactAccuracy(report.stats.factAccuracy),
      label: "Fact Accuracy",
    },
    {
      icon: <Clock className="w-6 h-6" strokeWidth={2.5} />,
      value: formatRunTime(report.stats.runTimeSeconds),
      label: "Run Time",
    },
  ];

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
      <header className="border-b-[3px] border-[#2d2d2d] bg-[#fdfbf7]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 rotate-[-1deg]">
            <Sparkles className="w-6 h-6 text-[#2d5da1]" strokeWidth={2.5} />
            <div>
              <span
                className="text-2xl font-bold text-[#2d2d2d]"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                SentinelSwarm
              </span>
              <div className="text-sm text-[#2d2d2d]/60 -mt-1">
                AI Agent Swarm
              </div>
            </div>
          </div>

          {/* Back Button */}
          <Link
            to={"/agent"}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#2d2d2d] text-lg border-[3px] border-[#2d2d2d] hover:bg-[#e5e0d8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
            style={{ ...wobblySm, ...shadowHardSm }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "3px 3px 0px 0px #2d2d2d")
            }
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════ */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8 relative">
          <h1
            className="text-4xl md:text-5xl font-bold text-[#2d2d2d] mb-2"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            RESEARCH COMPLETE <span className="text-[#2d5da1]">✦</span>
          </h1>
          <p className="text-xl text-[#2d2d2d]/70">
            Your competitive intelligence report is ready!
          </p>

          {/* Confetti dots decoration */}
          <div className="absolute -top-2 right-20 hidden md:block">
            <div className="flex gap-1 rotate-12">
              <div className="w-2 h-2 bg-[#ff4d4d] rotate-45" />
              <div className="w-1.5 h-1.5 bg-[#2d5da1] rotate-12" />
            </div>
            <div className="flex gap-1 mt-1 rotate-[-8deg]">
              <div className="w-1.5 h-1.5 bg-[#ff4d4d]" />
              <div className="w-2 h-2 bg-[#2d5da1] rotate-45" />
            </div>
          </div>

          {/* Blue flower */}
          <div className="absolute -top-4 right-0 w-20 h-20 hidden md:block rotate-[15deg]">
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
            </svg>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            REPORT CARD
            ═══════════════════════════════════════════════════ */}
        <div
          className="bg-white border-[3px] border-[#2d2d2d] p-6 md:p-8 mb-8 relative"
          style={{ ...wobblyAlt, ...shadowHard }}
        >
          {/* Paperclip decoration */}
          <div className="absolute -top-4 -left-3 w-8 h-12 rotate-[-15deg]">
            <svg viewBox="0 0 30 50" className="w-full h-full">
              <path
                d="M8 15 L8 40 Q8 48 15 48 Q22 48 22 40 L22 12 Q22 5 15 5 Q8 5 8 12 L8 35"
                stroke="#c0392b"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M8 15 L8 12"
                stroke="#c0392b"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Report Header */}
          <div className="flex items-start gap-4 mb-6 pl-4">
            <div
              className="p-3 bg-[#e8f0fe] border-[3px] border-[#2d2d2d] rotate-[-2deg]"
              style={{ ...wobblySm }}
            >
              <FileText className="w-8 h-8 text-[#2d5da1]" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2
                className="text-2xl font-bold text-[#2d2d2d] mb-1"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                {report.title}
              </h2>
              <div className="flex items-center gap-3 text-base text-[#2d2d2d]/60">
                <span>
                  Generated on {formatGeneratedAt(report.generatedAt)}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 border-[2px] border-green-600 text-green-700 text-sm font-bold"
                  style={{ ...wobblySm }}
                >
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-dashed border-[#e5e0d8] mb-6" />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="text-center p-4 bg-[#fdfbf7] border-[2px] border-[#2d2d2d]/20 hover:border-[#2d2d2d] hover:bg-[#fff9c4]/30 transition-all"
                style={{ ...wobblySm }}
              >
                <div className="flex justify-center mb-2 p-2 bg-white border-[2px] border-[#2d2d2d] rounded-full w-12 h-12 mx-auto">
                  {stat.icon}
                </div>
                <div
                  className="text-3xl font-bold text-[#2d2d2d] mb-1"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-[#2d2d2d]/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ACTION BUTTONS
            ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            onClick={() => setShowFullReport((v) => !v)}
            className="flex-1 px-6 py-4 bg-[#2d5da1] text-white text-xl font-bold border-[3px] border-[#2d2d2d] hover:bg-[#1e4a8a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center justify-center gap-3"
            style={{ ...wobbly, ...shadowHard }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d")
            }
          >
            {showFullReport ? "HIDE FULL REPORT" : "VIEW FULL REPORT"}
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>

          {report.downloadUrl ? (
            <a
              href={report.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 px-6 py-4 bg-white text-[#2d2d2d] text-xl font-bold border-[3px] border-[#2d2d2d] hover:bg-[#e5e0d8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center justify-center gap-3"
              style={{ ...wobblyAlt, ...shadowHard }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d")
              }
            >
              <Download className="w-5 h-5" strokeWidth={2.5} />
              DOWNLOAD PDF
            </a>
          ) : (
            <button
              disabled
              title="PDF not available for this run"
              className="flex-1 px-6 py-4 bg-white text-[#2d2d2d]/40 text-xl font-bold border-[3px] border-[#2d2d2d]/30 cursor-not-allowed flex items-center justify-center gap-3"
              style={{ ...wobblyAlt }}
            >
              <Download className="w-5 h-5" strokeWidth={2.5} />
              DOWNLOAD PDF
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            FULL REPORT (toggled) — renders section content
            straight from GET /research/:runId/report
            ═══════════════════════════════════════════════════ */}
        {showFullReport && (
          <div
            className="bg-white border-[3px] border-[#2d2d2d] p-6 md:p-8 mb-10 space-y-6"
            style={{ ...wobbly, ...shadowHard }}
          >
            {reportSections.map((section) => (
              <div key={section.id || section.title}>
                <h3
                  className="text-xl font-bold text-[#2d2d2d] mb-1"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {section.title}
                </h3>
                <p className="text-lg text-[#2d2d2d]/80 leading-relaxed">
                  {section.content || "No content for this section yet."}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            WHAT'S INSIDE + STICKY NOTE
            ═══════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* What's Inside */}
          <div
            className="bg-white border-[3px] border-[#2d2d2d] p-6 relative"
            style={{ ...wobbly, ...shadowHard }}
          >
            {/* Tape */}
            <div
              className="absolute -top-3 left-6 w-24 h-6 bg-[#2d5da1]/20 border border-[#2d2d2d]/30 rotate-[-2deg]"
              style={{ borderRadius: "2px" }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#2d5da1]"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                WHAT'S INSIDE?
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {reportSections.map((section) => (
                <div
                  key={section.id || section.title}
                  className="flex items-center gap-3 text-lg text-[#2d2d2d]"
                >
                  <span className="text-[#2d5da1] font-bold text-xl">✓</span>
                  <span>{section.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Note */}
          <div className="relative">
            <div
              className="bg-[#fff9c4] border-[2px] border-[#2d2d2d] p-6 rotate-[2deg]"
              style={{ ...shadowHardSm, fontFamily: "'Kalam', cursive" }}
            >
              {/* Tape */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 bg-[#e5e0d8]/60 border border-[#2d2d2d]/20 rotate-[3deg]"
                style={{ borderRadius: "2px" }}
              />

              <div className="text-xl text-[#2d2d2d] leading-relaxed">
                <div className="font-bold mb-1">Insights</div>
                <div className="font-bold mb-1">you can trust.</div>
                <div className="mb-1">Decisions</div>
                <div className="mb-2">you can make.</div>
                <div className="text-[#2d5da1] text-2xl">♡</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            RATING + NEW RESEARCH
            ═══════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Rating Card */}
          <div
            className="bg-white border-[3px] border-[#2d2d2d] p-6 text-center"
            style={{ ...wobblyAlt, ...shadowHardSm }}
          >
            <h3
              className="text-xl font-bold text-[#2d2d2d] mb-4"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              WAS THIS REPORT HELPFUL?
            </h3>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform duration-100 hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredStar || rating)
                        ? "fill-[#ff4d4d] text-[#ff4d4d]"
                        : "fill-transparent text-[#2d2d2d]/30"
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
              ))}
            </div>

            <p className="text-base text-[#2d2d2d]/60">Rate your experience</p>
          </div>

          {/* Run Another Research */}
          <div
            className="bg-white border-[3px] border-[#2d2d2d] p-6 text-center flex flex-col items-center justify-center"
            style={{ ...wobbly, ...shadowHardSm }}
          >
            <h3
              className="text-xl font-bold text-[#2d2d2d] mb-4"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              RUN ANOTHER RESEARCH
            </h3>

            <button
              onClick={() => onNewResearch && onNewResearch()}
              className="px-6 py-3 bg-white text-[#2d5da1] text-lg font-bold border-[3px] border-[#2d2d2d] hover:bg-[#2d5da1] hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 inline-flex items-center gap-2"
              style={{ ...wobblySm, ...shadowHardSm }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "3px 3px 0px 0px #2d2d2d")
              }
            >
              New Research
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            FOOTER DECORATION
            ═══════════════════════════════════════════════════ */}
        <div className="relative flex items-center justify-center py-6">
          {/* Dashed line left */}
          <div className="hidden md:block absolute left-0 right-1/2 top-1/2 -translate-y-1/2 mr-8">
            <svg height="20" width="100%" className="overflow-visible">
              <path
                d="M0,10 Q30,0 60,10 T120,10 T180,10 T240,10"
                stroke="#2d2d2d"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                fill="none"
              />
              <path
                d="M200,5 L220,10 L200,15"
                stroke="#2d2d2d"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Paper plane */}
          <div className="rotate-[-10deg] mx-4">
            <Send className="w-8 h-8 text-[#2d5da1]" strokeWidth={2} />
          </div>

          {/* Text */}
          <span
            className="text-lg text-[#2d2d2d]/70 font-bold mx-2"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            The swarm is always ready!
          </span>

          {/* Dashed line right */}
          <div className="hidden md:block absolute left-1/2 right-0 top-1/2 -translate-y-1/2 ml-8">
            <svg height="20" width="100%" className="overflow-visible">
              <path
                d="M0,10 Q30,0 60,10 T120,10 T180,10 T240,10"
                stroke="#2d2d2d"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                fill="none"
              />
            </svg>
          </div>

          {/* Blue flower bottom right */}
          <div className="absolute -bottom-4 -right-4 w-16 h-16 hidden md:block rotate-[-10deg]">
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
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
