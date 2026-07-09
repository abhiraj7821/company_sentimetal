import React, { useState } from "react";
import {
  Search,
  Newspaper,
  Smile,
  Globe,
  Shield,
  PenTool,
  UserCheck,
  ArrowRight,
  Play,
  Send,
  // Twitter,
  FileText,
  Zap,
  Layers,
  Cpu,
  Database,
  Mail,
  ChevronRight,
  Star,
  Heart,
  CheckCircle,
  Activity,
  Sparkles,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ───────────────────────────────────────────────────────────
   SentinelSwarm Landing Page
   Tech: React + Tailwind CSS
   Style: Hand-Drawn / Sketchbook aesthetic
   ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [email, setEmail] = useState("");

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
  const shadowHardLg = { boxShadow: "6px 6px 0px 0px #2d2d2d" };
  const shadowRed = { boxShadow: "4px 4px 0px 0px #ff4d4d" };

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
          NAVBAR
          ═══════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b-[3px] border-[#2d2d2d] bg-[#fdfbf7]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 rotate-[-1deg]">
            <Sparkles className="w-6 h-6 text-[#2d5da1]" strokeWidth={2.5} />
            <span
              className="text-2xl font-bold text-[#2d2d2d]"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              SentinelSwarm
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6 text-lg text-[#2d2d2d]">
            {[
              "HOME",
              "AGENTS",
              "FEATURES",
              "HOW IT WORKS",
              "PRICING",
              "DOCS",
            ].map((item, i) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="relative hover:text-[#ff4d4d] transition-colors duration-100"
                style={{ transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}
              >
                {item}
                {item === "HOME" && (
                  <span
                    className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#2d2d2d]"
                    style={{ borderRadius: "2px" }}
                  />
                )}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link
            className="hidden md:flex items-center gap-2 px-5 py-2 bg-[#2d5da1] text-white text-lg border-[3px] border-[#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 cursor-pointer"
            style={{
              ...wobblyAlt,
              ...shadowHard,
              boxShadow: "4px 4px 0px 0px #2d2d2d",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d")
            }
            to={"/agent"}
          >
            LAUNCH DASHBOARD
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="space-y-6">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1 bg-white border-[3px] border-[#2d2d2d] text-[#2d5da1] font-bold text-sm rotate-[-1deg]"
              style={{ ...wobblySm, ...shadowHardSm }}
            >
              <Star
                className="w-4 h-4 fill-[#2d5da1] text-[#2d5da1]"
                strokeWidth={2.5}
              />
              AI AGENT SWARM
            </div>

            {/* Headline */}
            <h1
              className="text-5xl md:text-6xl font-bold leading-[1.1] text-[#2d2d2d]"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              COMPETITIVE
              <br />
              INTELLIGENCE,
              <br />
              <span className="text-[#ff4d4d]">AUTOMATED.</span>
            </h1>

            {/* Subhead */}
            <p className="text-xl md:text-2xl text-[#2d2d2d]/80 max-w-md leading-relaxed">
              Autonomous AI agents research filings, news, sentiment, and the
              web to deliver accurate, cited intelligence reports—so you can
              make smarter decisions, faster.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                className="px-6 py-3 bg-[#2d2d2d] text-white text-xl border-[3px] border-[#2d2d2d] hover:bg-[#ff4d4d] hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                style={{ ...wobbly, ...shadowHard }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d";
                  e.currentTarget.style.transform = "translate(2px, 2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d";
                  e.currentTarget.style.transform = "translate(0, 0)";
                }}
              >
                START RESEARCHING →
              </button>
              <button
                className="px-6 py-3 bg-white text-[#2d2d2d] text-xl border-[3px] border-[#2d2d2d] hover:bg-[#e5e0d8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center gap-2"
                style={{ ...wobblyAlt, ...shadowHard }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d")
                }
              >
                <Play className="w-5 h-5 fill-[#2d2d2d]" strokeWidth={2.5} />
                SEE LIVE DEMO
              </button>
            </div>

            {/* Built With */}
            <div className="pt-4 flex items-center gap-4 text-[#2d2d2d]/60 text-lg">
              <span className="font-bold">BUILT WITH</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Layers className="w-4 h-4" strokeWidth={2.5} /> LangGraph
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" strokeWidth={2.5} /> GROQ
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-4 h-4" strokeWidth={2.5} /> PostgreSQL
                </span>
              </div>
            </div>
          </div>

          {/* Right: Architecture Diagram */}
          <div className="relative hidden md:block">
            {/* Notebook Paper */}
            <div
              className="relative bg-white border-[3px] border-[#2d2d2d] p-6 pt-10"
              style={{ ...wobblySm, ...shadowHardLg }}
            >
              {/* Thumbtack */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#ff4d4d] border-[2px] border-[#2d2d2d]"
                style={{ boxShadow: "2px 2px 0px #2d2d2d" }}
              />

              {/* Paper holes */}
              <div className="absolute left-2 top-8 bottom-8 flex flex-col justify-between py-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-[#e5e0d8] border border-[#2d2d2d]/20"
                  />
                ))}
              </div>

              <div className="pl-8">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-xl font-bold text-[#2d2d2d]"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    SWARM ARCHITECTURE
                  </h3>
                  <span className="flex items-center gap-1 text-sm text-[#2d2d2d]">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Diagram Flow */}
                <div className="flex flex-col items-center gap-3 text-sm">
                  {/* Supervisor */}
                  <div
                    className="px-4 py-2 bg-[#fff9c4] border-[3px] border-[#2d2d2d] font-bold rotate-[-1deg]"
                    style={{ ...wobblySm, ...shadowHardSm }}
                  >
                    🤖 SUPERVISOR
                    <div className="text-xs font-normal text-[#2d2d2d]/70">
                      Orchestrating tasks
                    </div>
                  </div>

                  {/* Arrow */}
                  <div
                    className="h-4 w-[2px] bg-[#2d2d2d] border-dashed"
                    style={{ borderLeft: "2px dashed #2d2d2d" }}
                  />

                  {/* Agents Row */}
                  <div className="grid grid-cols-4 gap-2 w-full">
                    {[
                      { icon: "📄", label: "FILING AGENT", sub: "10-K / 10-Q" },
                      {
                        icon: "📰",
                        label: "NEWS AGENT",
                        sub: "Collecting news",
                      },
                      {
                        icon: "🙂",
                        label: "SENTIMENT AGENT",
                        sub: "Analyzing sentiment",
                      },
                      {
                        icon: "🌐",
                        label: "WEB SCOUT AGENT",
                        sub: "Exploring the web",
                      },
                    ].map((a) => (
                      <div
                        key={a.label}
                        className="px-2 py-2 bg-white border-[2px] border-[#2d2d2d] text-center text-xs font-bold hover:rotate-1 transition-transform duration-100"
                        style={{
                          ...wobblySm,
                          borderRadius:
                            "20px 15px 25px 18px / 18px 25px 15px 20px",
                        }}
                      >
                        <div className="text-lg">{a.icon}</div>
                        <div>{a.label}</div>
                        <div className="text-[10px] font-normal text-[#2d2d2d]/70">
                          {a.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="h-4 w-[2px] border-l-2 border-dashed border-[#2d2d2d]" />

                  {/* Critic */}
                  <div
                    className="px-4 py-2 bg-white border-[3px] border-[#2d2d2d] font-bold rotate-[1deg]"
                    style={{ ...wobblyAlt, ...shadowHardSm }}
                  >
                    🛡️ CRITIC AGENT
                    <div className="text-xs font-normal text-[#2d2d2d]/70">
                      Verifying facts
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="h-4 w-[2px] border-l-2 border-dashed border-[#2d2d2d]" />

                  {/* Report Writer */}
                  <div
                    className="px-4 py-2 bg-white border-[3px] border-[#2d2d2d] font-bold rotate-[-1deg]"
                    style={{ ...wobblySm, ...shadowHardSm }}
                  >
                    ✏️ REPORT WRITER
                    <div className="text-xs font-normal text-[#2d2d2d]/70">
                      Drafting report
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="h-4 w-[2px] border-l-2 border-dashed border-[#2d2d2d]" />

                  {/* Human Approval */}
                  <div
                    className="px-4 py-2 bg-[#fff9c4] border-[3px] border-[#2d2d2d] font-bold rotate-[1deg]"
                    style={{ ...wobblyAlt, ...shadowHardSm }}
                  >
                    👤 HUMAN APPROVAL
                    <div className="text-xs font-normal text-[#2d2d2d]/70">
                      Review & approve
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Note */}
            <div
              className="absolute -right-4 top-20 bg-[#fff9c4] border-[2px] border-[#2d2d2d] p-3 max-w-[140px] text-sm text-[#2d2d2d] rotate-[3deg]"
              style={{ ...shadowHardSm, fontFamily: "'Kalam', cursive" }}
            >
              <div className="font-bold mb-1">Facts Checked.</div>
              <div className="font-bold mb-1">Bias Reduced.</div>
              <div>You're in Control.</div>
              <div className="mt-1 text-[#ff4d4d]">✦</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          THE SWARM — AGENT CARDS
          ═══════════════════════════════════════════════════ */}
      <section id="agents" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div
            className="inline-block px-4 py-1 bg-[#2d5da1]/10 border-[3px] border-[#2d5da1] text-[#2d5da1] font-bold text-lg mb-4 rotate-[-1deg]"
            style={{ ...wobblySm, ...shadowHardSm }}
          >
            THE SWARM
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2d2d2d]"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            SPECIALIZED AGENTS.{" "}
            <span className="text-[#2d5da1]">ONE MISSION.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: (
                <FileText
                  className="w-8 h-8 text-[#2d5da1]"
                  strokeWidth={2.5}
                />
              ),
              title: "FILING AGENT",
              desc: "Searches SEC EDGAR filings and extracts key financial insights.",
              rotate: "-rotate-1",
            },
            {
              icon: (
                <Newspaper
                  className="w-8 h-8 text-[#2d5da1]"
                  strokeWidth={2.5}
                />
              ),
              title: "NEWS AGENT",
              desc: "Monitors real-time news from trusted sources worldwide.",
              rotate: "rotate-1",
            },
            {
              icon: (
                <Smile className="w-8 h-8 text-[#2d5da1]" strokeWidth={2.5} />
              ),
              title: "SENTIMENT AGENT",
              desc: "Analyzes sentiment and market perception across news and social data.",
              rotate: "-rotate-1",
            },
            {
              icon: (
                <Globe className="w-8 h-8 text-[#2d5da1]" strokeWidth={2.5} />
              ),
              title: "WEB SCOUT AGENT",
              desc: "Explores product pages, pricing, and competitor web presence.",
              rotate: "rotate-1",
            },
          ].map((agent, i) => (
            <div
              key={agent.title}
              className={`relative bg-white border-[3px] border-[#2d2d2d] p-6 pt-8 hover:rotate-1 transition-transform duration-100 ${agent.rotate}`}
              style={{ ...wobbly, ...shadowHard }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "6px 6px 0px 0px #2d2d2d")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d")
              }
            >
              {/* Tape */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#e5e0d8]/60 border border-[#2d2d2d]/20 rotate-[-2deg]"
                style={{ borderRadius: "2px" }}
              />
              <div className="mb-4 p-3 bg-[#fdfbf7] border-[2px] border-[#2d2d2d] inline-block rounded-full">
                {agent.icon}
              </div>
              <h3
                className="text-xl font-bold text-[#2d2d2d] mb-2"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                {agent.title}
              </h3>
              <p className="text-[#2d2d2d]/80 text-lg leading-snug mb-4">
                {agent.desc}
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-[#2d5da1] font-bold hover:text-[#ff4d4d] transition-colors"
              >
                LEARN MORE{" "}
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES BAR
          ═══════════════════════════════════════════════════ */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Layers className="w-6 h-6" strokeWidth={2.5} />,
              title: "MULTI-AGENT ORCHESTRATION",
              desc: "Agents work together in parallel to save time.",
            },
            {
              icon: <Shield className="w-6 h-6" strokeWidth={2.5} />,
              title: "FACT-CHECKED & VERIFIED",
              desc: "Critic agent cross-checks every claim.",
            },
            {
              icon: <CheckCircle className="w-6 h-6" strokeWidth={2.5} />,
              title: "CITED & TRACEABLE",
              desc: "Every insight is linked to verifiable sources.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 bg-white border-[3px] border-[#2d2d2d] p-5 rotate-[-1deg] hover:rotate-0 transition-transform duration-100"
              style={{ ...wobblyAlt, ...shadowHardSm }}
            >
              <div className="p-2 bg-[#fff9c4] border-[2px] border-[#2d2d2d] rounded-full shrink-0">
                {f.icon}
              </div>
              <div>
                <h4
                  className="font-bold text-[#2d2d2d] text-lg"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {f.title}
                </h4>
                <p className="text-[#2d2d2d]/70 text-base">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════ */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div
            className="inline-block px-4 py-1 bg-[#2d5da1]/10 border-[3px] border-[#2d5da1] text-[#2d5da1] font-bold text-lg mb-4 rotate-[1deg]"
            style={{ ...wobblySm, ...shadowHardSm }}
          >
            HOW IT WORKS
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-4 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-[#2d2d2d]/30" />

          {[
            {
              num: "01",
              icon: <Search className="w-6 h-6" strokeWidth={2.5} />,
              title: "DEFINE YOUR QUERY",
              desc: "Enter a company, ticker, or topic you want to research.",
            },
            {
              num: "02",
              icon: <Cpu className="w-6 h-6" strokeWidth={2.5} />,
              title: "AGENTS GET TO WORK",
              desc: "The swarm runs in parallel to gather data from all sources.",
            },
            {
              num: "03",
              icon: <Shield className="w-6 h-6" strokeWidth={2.5} />,
              title: "VERIFY & ANALYZE",
              desc: "Critic agent verifies facts and synthesizes key insights.",
            },
            {
              num: "04",
              icon: <FileText className="w-6 h-6" strokeWidth={2.5} />,
              title: "REPORT GENERATED",
              desc: "A comprehensive report is drafted with citations and summaries.",
            },
            {
              num: "05",
              icon: <UserCheck className="w-6 h-6" strokeWidth={2.5} />,
              title: "HUMAN APPROVAL",
              desc: "Review, edit, and approve before sharing or publishing.",
            },
          ].map((step, i) => (
            <div
              key={step.num}
              className="relative flex flex-col items-center text-center z-10"
            >
              <div
                className="w-12 h-12 flex items-center justify-center bg-white border-[3px] border-[#2d2d2d] text-lg font-bold text-[#2d2d2d] mb-4"
                style={{
                  ...wobblySm,
                  ...shadowHardSm,
                  borderRadius: "50% 45% 55% 40% / 40% 55% 45% 50%",
                }}
              >
                {step.num}
              </div>
              <div className="p-3 bg-[#fff9c4] border-[2px] border-[#2d2d2d] rounded-full mb-3">
                {step.icon}
              </div>
              <h4
                className="font-bold text-[#2d2d2d] text-lg mb-1"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                {step.title}
              </h4>
              <p className="text-[#2d2d2d]/70 text-base px-2">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            className="px-6 py-3 bg-[#2d5da1] text-white text-lg border-[3px] border-[#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
            style={{ ...wobblyAlt, ...shadowHard }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d")
            }
          >
            EXPLORE THE FULL FLOW →
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATS + QUOTE
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        {/* System Status */}
        <div
          className="bg-white border-[3px] border-[#2d2d2d] p-8 rotate-[-1deg]"
          style={{ ...wobbly, ...shadowHardLg }}
        >
          <h3
            className="text-2xl font-bold text-[#2d2d2d] mb-6"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            SYSTEM STATUS
          </h3>
          <div className="space-y-4">
            {[
              { label: "Agents Online", value: "4", color: "text-green-600" },
              {
                label: "Tasks Completed",
                value: "1,287",
                color: "text-[#2d5da1]",
              },
              {
                label: "Reports Generated",
                value: "342",
                color: "text-[#2d5da1]",
              },
              { label: "Accuracy", value: "98.7%", color: "text-[#ff4d4d]" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between border-b-2 border-dashed border-[#e5e0d8] pb-2"
              >
                <span className="text-lg text-[#2d2d2d]/80">{stat.label}:</span>
                <span
                  className={`text-2xl font-bold ${stat.color}`}
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Sparkles
              className="w-6 h-6 text-[#2d5da1] rotate-12"
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Quote */}
        <div className="relative text-center md:text-left">
          <div
            className="text-6xl text-[#2d5da1] leading-none mb-2"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            “
          </div>
          <blockquote
            className="text-2xl md:text-3xl text-[#2d2d2d] font-bold leading-relaxed mb-4"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            The best competitive advantage is the insight others miss.
          </blockquote>
          <div className="text-xl text-[#2d2d2d]/70">— SentinelSwarm</div>
          <div className="mt-6">
            <Sparkles
              className="w-8 h-8 text-[#ff4d4d] rotate-[-12deg]"
              strokeWidth={2.5}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA / EMAIL SIGNUP
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div
          className="bg-[#fff9c4] border-[3px] border-[#2d2d2d] p-8 md:p-12 text-center rotate-[1deg]"
          style={{ ...wobblyAlt, ...shadowHardLg }}
        >
          <h3
            className="text-3xl md:text-4xl font-bold text-[#2d2d2d] mb-4"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            STAY UPDATED
          </h3>
          <p className="text-xl text-[#2d2d2d]/80 mb-6 max-w-lg mx-auto">
            Get updates on new features and research insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border-[3px] border-[#2d2d2d] text-[#2d2d2d] text-lg placeholder:text-[#2d2d2d]/40 outline-none focus:border-[#2d5da1] focus:ring-2 focus:ring-[#2d5da1]/20"
              style={{ ...wobblySm, fontFamily: "'Patrick Hand', cursive" }}
            />
            <button
              className="px-5 py-3 bg-[#2d2d2d] text-white border-[3px] border-[#2d2d2d] hover:bg-[#ff4d4d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
              style={{ ...wobblySm, ...shadowHard }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2d2d2d")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "4px 4px 0px 0px #2d2d2d")
              }
            >
              <Send className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="border-t-[3px] border-[#2d2d2d] bg-[#fdfbf7]">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[#2d2d2d]/70 text-lg">© 2024 SentinelSwarm</div>
          <div className="flex items-center gap-6 text-[#2d2d2d] text-lg">
            <a
              href="#"
              className="hover:text-[#ff4d4d] transition-colors flex items-center gap-1"
            >
              {/* <Twitter className="w-4 h-4" strokeWidth={2.5} /> TWITTER */}
            </a>
            <a
              href="#"
              className="hover:text-[#ff4d4d] transition-colors flex items-center gap-1"
            ></a>
            <a href="#" className="hover:text-[#ff4d4d] transition-colors">
              DOCS
            </a>
            <a href="#" className="hover:text-[#ff4d4d] transition-colors">
              PRIVACY
            </a>
            <a href="#" className="hover:text-[#ff4d4d] transition-colors">
              TERMS
            </a>
            <Heart
              className="w-4 h-4 text-[#ff4d4d] fill-[#ff4d4d]"
              strokeWidth={2.5}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
