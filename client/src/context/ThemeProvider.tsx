import React from "react";
import { MISSION_PROFILES, MissionProfile, MissionProfileId } from "@/lib/mission-profiles";

type Ctx = {
  profile: MissionProfile;
  setProfile: (id: MissionProfileId) => void;
};

const ThemeCtx = React.createContext<Ctx | null>(null);

function applyVars(p: MissionProfile) {
  const r = document.documentElement;
  r.style.setProperty("--bg", p.colors.bg);
  r.style.setProperty("--panel", p.colors.panel);
  r.style.setProperty("--panelAlt", p.colors.panelAlt);
  r.style.setProperty("--text", p.colors.text);
  r.style.setProperty("--accent", p.colors.accent);
  r.style.setProperty("--accentSoft", p.colors.accentSoft);
}

const DEFAULT = MISSION_PROFILES[0];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = React.useState<MissionProfile>(() => {
    const stored = sessionStorage.getItem("missionProfileId") as MissionProfileId | null;
    const found = MISSION_PROFILES.find(p => p.id === stored) ?? DEFAULT;
    return found;
  });

  const setProfile = (id: MissionProfileId) => {
    const next = MISSION_PROFILES.find(p => p.id === id) ?? DEFAULT;
    sessionStorage.setItem("missionProfileId", next.id);
    setProfileState(next);
  };

  React.useEffect(() => applyVars(profile), [profile]);

  return (
    <ThemeCtx.Provider value={{ profile, setProfile }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}