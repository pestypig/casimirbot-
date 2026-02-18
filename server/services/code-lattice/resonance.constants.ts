import type { ResonancePatchMode } from "@shared/code-lattice";
import { RESONANCE_WEIGHT_DEFAULTS, readResonanceWeightsFromEnv, type ResonanceWeightConfig } from "@shared/code-lattice";

export const RESONANCE_WEIGHTS: ResonanceWeightConfig = readResonanceWeightsFromEnv();
export const RESONANCE_EVENT_RATE_CAP = 60;

export const CASIMIR_BLUEPRINT_BY_BAND: Record<string, ResonancePatchMode> = {
  mhz: "local",
  ghz: "module",
  hz: "ideology",
  khz: "ideology",
  optical: "ideology",
};

export const CASIMIR_BAND_BIAS: Record<ResonancePatchMode, number> = {
  local: 1.15,
  module: 1.1,
  ideology: 1.12,
};

export const CASIMIR_LOW_SIGNAL = {
  occupancy: 0.001,
  coherence: 0.2,
  damp: 0.35,
};

export const CASIMIR_PROMOTION_THRESHOLDS = {
  plumbingShare: 0.7,
  totalCoherence: 0.6,
};

export const RESONANCE_RECENCY_TAU_MS = RESONANCE_WEIGHTS.tauMs ?? RESONANCE_WEIGHT_DEFAULTS.tauMs;

export const RESONANCE_DEFAULT_PROVENANCE = {
  provenance_class: "inferred",
  claim_tier: "diagnostic",
  certifying: false,
} as const;

export const RESONANCE_STRICT_PROVENANCE_FAIL_REASON = "RESONANCE_SOURCE_PROVENANCE_MISSING" as const;
