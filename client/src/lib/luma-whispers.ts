// lib/luma-whispers.ts - Collection of zen whispers for different contexts
import { publish } from "./luma-bus";

// Zen whispers for different operational modes
export const MODE_WHISPERS = {
  'Hover': "Form first. Speed follows.",
  'Cruise': "Timing matched. Take the interval; apply thrust.",
  'Emergency': "Breathe once. Choose the useful distance.",
  'Standby': "Meet change with correct posture. The rest aligns."
} as const;

// Navigation whispers
export const NAVIGATION_WHISPERS = {
  solarInit: "Solar navigation initialized. Near-space trajectory computed.",
  galacticInit: "Galactic coordinates engaged. Interstellar passage mapped.",
  waypointSolar: "Waypoint selected. Route updated.",
  waypointGalactic: "Galactic destination set. Navigation computed.",
  stellarTarget: "Stellar target acquired. Course adjusted."
} as const;

// System whispers
export const SYSTEM_WHISPERS = {
  diagnostics: "System pulse taken. All flows nominal.",
  energyUpdate: "Energy cascade balanced. Efficiency optimal.",
  configChange: "Configuration updated. Harmonics stable."
} as const;

// Helper functions
export function whisperMode(mode: keyof typeof MODE_WHISPERS) {
  publish("luma:whisper", { text: MODE_WHISPERS[mode] });
}

export function whisperNav(context: keyof typeof NAVIGATION_WHISPERS) {
  publish("luma:whisper", { text: NAVIGATION_WHISPERS[context] });
}

export function whisperSystem(context: keyof typeof SYSTEM_WHISPERS) {
  publish("luma:whisper", { text: SYSTEM_WHISPERS[context] });
}

export function whisperCustom(text: string) {
  publish("luma:whisper", { text });
}