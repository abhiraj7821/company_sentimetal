import { ArrowLeft, Sparkles } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

function NavbarHeader() {
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
  return (
    <header className="border-b-[3px] border-[#2d2d2d] bg-[#fdfbf7]/95 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center gap-2 rotate-[-1deg]" to={"/"}>
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
        </Link>

        {/* Back Button */}
        <Link
          to={"/"}
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
  );
}

export default NavbarHeader;
