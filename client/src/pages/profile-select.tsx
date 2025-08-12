import * as React from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeProvider";
import { MISSION_PROFILES } from "@/lib/mission-profiles";

export default function ProfileSelect() {
  const [, setLocation] = useLocation();
  const { setProfile } = useTheme();

  return (
    <div className="theme-bg theme-text min-h-screen flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-semibold mb-2">Choose Your Mission View</h1>
        <p className="opacity-80 mb-8">
          These profiles change tone and highlights only — physics stays live and identical.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MISSION_PROFILES.map(p => (
            <button
              key={p.id}
              className="theme-panel rounded-2xl p-5 text-left group hover:translate-y-[-2px] transition-all ring-1 ring-transparent hover:ring-[var(--accent)]"
              onClick={() => { 
                setProfile(p.id); 
                setLocation("/helix-core");
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl" aria-hidden>{p.icon}</div>
                <div className="text-xl font-medium">{p.name}</div>
              </div>
              <div className="text-sm opacity-90">{p.tagline}</div>

              <div className="mt-4 text-xs opacity-70">
                <span className="theme-chip px-2 py-1 rounded-md mr-2">Zen</span>
                {p.zen}
              </div>
              <div className="mt-2 text-xs opacity-70">
                <span className="theme-chip px-2 py-1 rounded-md mr-2">Theory</span>
                {p.theory}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-xs opacity-70">
          *No account is created. Your choice is remembered for this session only.
        </div>
      </div>
    </div>
  );
}