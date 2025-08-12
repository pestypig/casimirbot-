import * as React from "react";
import { useLocation } from "wouter";

type ProfileKey = "optimist" | "engineer" | "diplomat" | "strategist";

const PROFILES: Record<ProfileKey, {
  icon: string;
  name: string;
  zen: string;
  physics: string;
}> = {
  optimist: {
    icon: "🌞",
    name: "Radiant Optimist",
    zen: "\"The light we save today will shine for a billion tomorrows.\"",
    physics:
      "Energy-positivity balance; emphasizes Ford–Roman compliance as a guiding constraint.",
  },
  engineer: {
    icon: "⚙️",
    name: "The Engineer",
    zen: "\"Every equation is a bridge; every weld, a promise.\"",
    physics:
      "Sector strobing, γ_geo, γ_VdB, Q_cavity; trade-offs and tolerances explained.",
  },
  diplomat: {
    icon: "🐼",
    name: "The Diplomat",
    zen: "\"In harmony, the cosmos folds itself around us.\"",
    physics:
      "Time-scale separation (TS); environment & stability cues for the solar rescue.",
  },
  strategist: {
    icon: "🐒",
    name: "The Strategist",
    zen: "\"Even the smallest stone changes the course of the river.\"",
    physics:
      "Bubble placement, curvature max, sector optimization & routing visuals.",
  },
};

export default function StartPortal() {
  const [selected, setSelected] = React.useState<ProfileKey | null>(null);
  const [location, setLocation] = useLocation();

  const pick = (k: ProfileKey) => setSelected(k);
  const enter = () => setLocation("/");

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100 grid place-items-center">
      <div className="w-full max-w-5xl px-4 py-10">
        <header className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Choose Your Mission View
          </h1>
          <p className="text-slate-300/80 text-sm mt-1">
            A quiet beginning. Same physics. Your preferred lens.
          </p>
        </header>

        {/* ICONS ONLY until a choice is made */}
        <section
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          role="list"
          aria-label="Profiles"
        >
          {(Object.keys(PROFILES) as ProfileKey[]).map((k) => {
            const p = PROFILES[k];
            const isSel = selected === k;
            return (
              <button
                key={k}
                role="listitem"
                className={[
                  "aspect-square rounded-2xl bg-white/5 hover:bg-white/7.5",
                  "border border-white/10 shadow-sm",
                  "flex flex-col items-center justify-center",
                  "transition-transform focus:outline-none focus:ring-2 focus:ring-sky-400/40",
                  isSel ? "scale-[1.04]" : "",
                ].join(" ")}
                onClick={() => pick(k)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(k);
                  }
                }}
              >
                <div className="text-5xl md:text-6xl mb-2">{p.icon}</div>
                <div className="text-sm md:text-base font-medium opacity-90">
                  {p.name}
                </div>
              </button>
            );
          })}
        </section>

        {/* Detail panel appears ONLY after selection */}
        {selected && (
          <section
            className="mt-6 md:mt-8"
            aria-live="polite"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="text-3xl md:text-4xl">{PROFILES[selected].icon}</div>
                <div className="flex-1">
                  <h2 className="text-base md:text-lg font-semibold">
                    {PROFILES[selected].name}
                  </h2>
                  <p className="text-slate-200/90 text-sm md:text-[15px] mt-1">
                    {PROFILES[selected].zen}
                  </p>
                  <p className="text-slate-300/80 text-xs md:text-sm mt-2 leading-relaxed">
                    {PROFILES[selected].physics}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      className="px-3.5 py-2 rounded-lg bg-sky-500/90 hover:bg-sky-500 text-white text-sm font-medium"
                      onClick={enter}
                    >
                      Enter HELIX-CORE
                    </button>
                    <button
                      className="px-3.5 py-2 rounded-lg bg-white/7 hover:bg-white/10 text-slate-100 text-sm"
                      onClick={() => setSelected(null)}
                    >
                      Change choice
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                No account is created. Your choice is for this visit only.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}