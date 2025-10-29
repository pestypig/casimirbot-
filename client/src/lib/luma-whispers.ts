// lib/luma-whispers.ts - Collection of zen whispers for different contexts
import { publish } from "./luma-bus";
import type { ModeKey } from "@/hooks/use-energy-pipeline";

// Zen whispers for different operational modes
export const MODE_WHISPERS = {
  'Hover': "Form first. Speed follows.",
  'Near-Zero': "Center your split; climb with patience.",
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

export function publishWhisper(topic: string, payload: any) {
  publish(topic, payload);
}

export function sendDriveNudge(command: any) {
  publish("drive:nudge", command);
}

// Get wisdom for mode changes
export function getModeWisdom(mode: ModeKey): string {
  const modeWisdom = {
    hover: "Form first. Speed follows.",
    nearzero: "Hold the split at half; lift comes with patience.",
    cruise: "Steady rhythm creates distance.",
    emergency: "Power serves purpose, not pride.",
    standby: "In stillness, all possibilities rest.",
    taxi: "Ground pace finds the seam before the leap."
  };
  
  return modeWisdom[mode] || "Balance in all things.";
}
