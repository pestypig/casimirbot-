// client/src/lib/deepMixingPreset.ts
import { vrSetpoint } from "./deepMixingPhysics";

export type DeepMixingGuardrails = {
  dLogL_per_Myr_max: number;
  dLogTc_per_Myr_max: number;
};

export type DeepMixingFleetSplit = {
  actuators: number;
  diagnostics: number;
};

export type DeepMixingPreset = {
  name: string;
  targetDeltaT_Myr: number;
  epsilon: number;
  areaFraction: number;
  cadenceDays: number;
  duty: number;
  guardrails: DeepMixingGuardrails;
  fleet: DeepMixingFleetSplit;
};

export type DeepMixingAutopilotState = "PLAN" | "PROXOPS" | "ACTUATE" | "FEEDBACK" | "SAFE";

export const DEEP_MIXING_AUTOPILOT_STATES: DeepMixingAutopilotState[] = [
  "PLAN",
  "PROXOPS",
  "ACTUATE",
  "FEEDBACK",
  "SAFE",
];

export type DeepMixingTelemetry = {
  dLogL_per_Myr: number;
  dLogTc_per_Myr: number;
  seismicGrowth: number;
  neutrinoDelta: number;
  achievedEpsilon: number;
};

export const DEEP_MIXING_TARGETS = [
  { index: 0, label: "+10 Myr", deltaT_Myr: 10, epsilon: 1e-3 },
  { index: 1, label: "+50 Myr", deltaT_Myr: 50, epsilon: 5e-3 },
  { index: 2, label: "+0.6 Gyr", deltaT_Myr: 600, epsilon: 1e-2 },
] as const;

export const DeepMixingAutopilot: DeepMixingPreset = {
  name: "Deep Mixing (Sun) — Autopilot",
  targetDeltaT_Myr: 600,
  epsilon: 1e-2,
  areaFraction: 0.1,
  cadenceDays: 27.3,
  duty: 0.18,
  guardrails: { dLogL_per_Myr_max: 1e-3, dLogTc_per_Myr_max: 1e-3 },
  fleet: { actuators: 20000, diagnostics: 5000 },
};

export const DEEP_MIXING_DEFAULT_TELEMETRY: DeepMixingTelemetry = {
  dLogL_per_Myr: 0,
  dLogTc_per_Myr: 0,
  seismicGrowth: 0,
  neutrinoDelta: 0,
  achievedEpsilon: 0,
};

export function epsilonForDeltaT(deltaT_Myr: number): number {
  const sorted = [...DEEP_MIXING_TARGETS].sort((a, b) => a.deltaT_Myr - b.deltaT_Myr);
  for (const option of sorted) {
    if (deltaT_Myr <= option.deltaT_Myr + 1e-6) return option.epsilon;
  }
  return sorted[sorted.length - 1]?.epsilon ?? DeepMixingAutopilot.epsilon;
}

export function deltaTIndexFromValue(deltaT_Myr: number): number {
  const option = DEEP_MIXING_TARGETS.reduce((closest, candidate) => {
    const diff = Math.abs(candidate.deltaT_Myr - deltaT_Myr);
    return diff < Math.abs(candidate.deltaT_Myr - closest.deltaT_Myr) ? candidate : closest;
  }, DEEP_MIXING_TARGETS[0]);
  return option.index;
}

export function vrSetpointForPreset(preset: DeepMixingPreset): number {
  return vrSetpoint(preset.epsilon, preset.areaFraction);
}

export function controlStep(
  preset: DeepMixingPreset,
  telem: DeepMixingTelemetry
): { duty: number; cadenceDays: number; enteredSafe?: boolean } {
  let duty = preset.duty;
  let cadenceDays = preset.cadenceDays;
  let enteredSafe = false;

  const guardrailBreach =
    telem.dLogL_per_Myr > preset.guardrails.dLogL_per_Myr_max ||
    telem.dLogTc_per_Myr > preset.guardrails.dLogTc_per_Myr_max ||
    telem.seismicGrowth > 0 ||
    telem.neutrinoDelta > 0;

  if (guardrailBreach) {
    duty = Math.max(0.02, duty * 0.6);
    cadenceDays = Math.min(90, cadenceDays * 1.05);
    enteredSafe = true;
  } else if (telem.achievedEpsilon < preset.epsilon * 0.9) {
    duty = Math.min(0.4, duty * 1.1);
    cadenceDays = Math.max(20, cadenceDays * 0.98);
  } else if (telem.achievedEpsilon > preset.epsilon * 1.2) {
    duty = Math.max(0.02, duty * 0.85);
    cadenceDays = Math.min(90, cadenceDays * 1.02);
  }

  return { duty, cadenceDays, enteredSafe };
}
