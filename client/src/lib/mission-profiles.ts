export type MissionProfileId = "optimist" | "engineer" | "diplomat" | "strategist";

export type MissionProfile = {
  id: MissionProfileId;
  name: string;
  icon: string;          // emoji or path to png/svg
  tagline: string;
  zen: string;
  theory: string;
  colors: {
    bg: string;          // page background
    panel: string;       // cards/panels
    panelAlt: string;    // HUD/darker cards
    text: string;
    accent: string;      // highlights, buttons
    accentSoft: string;  // meters, chips
  };
};

export const MISSION_PROFILES: MissionProfile[] = [
  {
    id: "optimist",
    name: "Radiant Optimist",
    icon: "🌞",
    tagline: "The light we save today will shine for a billion tomorrows.",
    zen: "Move gently, amplify wisely. Let energy serve life.",
    theory:
      "Highlights Ford–Roman compliance and net positive balance in the Casimir lattice.",
    colors: {
      bg: "#0b1220",
      panel: "#111a2e",
      panelAlt: "#0d1627",
      text: "#e6f2ff",
      accent: "#ffd166",
      accentSoft: "rgba(255,209,102,.25)",
    },
  },
  {
    id: "engineer",
    name: "The Engineer",
    icon: "⚙️",
    tagline: "Every equation is a bridge; every weld, a promise.",
    zen: "Precision is compassion measured in microns and femtoseconds.",
    theory:
      "Surfaces sector strobing, γ_geo, γ_VdB, and Q_cavity trade-offs.",
    colors: {
      bg: "#070b12",
      panel: "#0e1524",
      panelAlt: "#0a101d",
      text: "#cfe6ff",
      accent: "#4cc9f0",
      accentSoft: "rgba(76,201,240,.25)",
    },
  },
  {
    id: "diplomat",
    name: "The Diplomat",
    icon: "🐼",
    tagline: "In harmony, the cosmos folds itself around us.",
    zen: "Tune frames gently; separate time-scales with care.",
    theory:
      "Emphasizes time-scale separation (TS), environmental stability for solar rescue.",
    colors: {
      bg: "#0a1110",
      panel: "#101a17",
      panelAlt: "#0c1513",
      text: "#e8fff5",
      accent: "#77e6b6",
      accentSoft: "rgba(119,230,182,.22)",
    },
  },
  {
    id: "strategist",
    name: "The Strategist",
    icon: "🛰️",
    tagline: "Even the smallest stone changes the course of the river.",
    zen: "Position precisely; spend curvature where it matters.",
    theory:
      "Focuses bubble curvature, sector optimization, and route planners.",
    colors: {
      bg: "#0c0d15",
      panel: "#141524",
      panelAlt: "#101223",
      text: "#e9e9ff",
      accent: "#c77dff",
      accentSoft: "rgba(199,125,255,.22)",
    },
  },
];