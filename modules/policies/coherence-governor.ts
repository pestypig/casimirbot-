import { TelemetrySnapshot, TTelemetrySnapshot } from "../../shared/star-telemetry";

export type CoherenceAction = "explore_more" | "collapse" | "branch" | "ask_clarification";

export interface CoherenceGovernorOptions {
  collapsePressureThreshold: number;
  lowCoherenceThreshold: number;
  highDispersionThreshold: number;
  energyBudgetCeiling: number;
}

const DEFAULTS: CoherenceGovernorOptions = {
  collapsePressureThreshold: 0.7,
  lowCoherenceThreshold: 0.35,
  highDispersionThreshold: 0.55,
  energyBudgetCeiling: 0.85,
};

const SESSION_PROFILES = {
  debate: { collapseMult: 1.0, branchBias: 0 },
  lab: { collapseMult: 1.5, branchBias: 0.3 },
  planner: { collapseMult: 1.2, branchBias: 0.1 },
  agent: { collapseMult: 0.8, branchBias: -0.1 },
};

/**
 * Decide the next coarse action to take based on telemetry returned by the star backend.
 * Keeps the policy lightweight and declarative so other modules can reuse it.
 */
export const decideCoherenceAction = (
  snapshot: TTelemetrySnapshot,
  options: Partial<CoherenceGovernorOptions> = {},
): CoherenceAction => {
  const cfg = { ...DEFAULTS, ...options };
  const parsed = TelemetrySnapshot.parse(snapshot);
  const collapsePressure = parsed.collapse_pressure ?? 0;
  const coherence = parsed.global_coherence ?? 0.5;
  const dispersion = parsed.phase_dispersion ?? 0;
  const energy = parsed.energy_budget ?? 0;

  if (parsed.recommended_action) return parsed.recommended_action;
  if (collapsePressure >= cfg.collapsePressureThreshold) return "collapse";
  if (coherence < cfg.lowCoherenceThreshold && dispersion > cfg.highDispersionThreshold)
    return "ask_clarification";
  if (energy > cfg.energyBudgetCeiling && coherence < 0.6) return "branch";
  return "explore_more";
};

export const collapseConfidence = (snapshot: TTelemetrySnapshot): number => {
  const parsed = TelemetrySnapshot.parse(snapshot);
  const pressure = parsed.collapse_pressure ?? 0;
  const coherence = parsed.global_coherence ?? 0.5;
  const dispersion = parsed.phase_dispersion ?? 0;
  const score = pressure * 0.6 + coherence * 0.3 + (1 - dispersion) * 0.1;
  return Math.max(0, Math.min(1, score));
};

export interface ToolBudgetHints {
  maxToolsPerRound: number;
  branchFactor: number;
}

export interface CoherenceGovernorDecision {
  action: "continue" | "branch" | "collapse" | "ask_clarification";
  confidence: number;
  adjustedCollapseThreshold: number;
  maxAdditionalRounds: number;
  toolBudgetHints: ToolBudgetHints;
}

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

/**
 * Higher-level governor: map raw telemetry into an action plus
 * soft limits for rounds and tools. Pure function so it is easy
 * to exercise in unit tests.
 */
export const governFromTelemetry = (
  snapshot: TTelemetrySnapshot,
  options: Partial<CoherenceGovernorOptions> = {},
): CoherenceGovernorDecision => {
  const cfg = { ...DEFAULTS, ...options };
  const parsed = TelemetrySnapshot.parse(snapshot);

  const sessionTypeKey = (parsed.session_type ?? "debate") as keyof typeof SESSION_PROFILES;
  const profile = SESSION_PROFILES[sessionTypeKey] ?? SESSION_PROFILES.debate;

  const coarse = decideCoherenceAction(parsed, cfg);
  const collapsePressure = parsed.collapse_pressure ?? 0;
  const coherence = parsed.global_coherence ?? 0.5;
  const dispersion = parsed.phase_dispersion ?? 0.5;
  const energy = parsed.energy_budget ?? 0.5;
  const dpTau = parsed.dp_tau_estimate_ms;
  const multiFractal = clamp01(parsed.multi_fractal_index ?? 0);
  const flareScore = clamp01(parsed.flare_score ?? 0);
  const singularityScore = clamp01(parsed.singularity_score ?? 0);
  const searchRegime = parsed.search_regime ?? "mixed";
  const collapsePressureThreshold = cfg.collapsePressureThreshold * profile.collapseMult;

  let confidence = collapseConfidence(parsed);
  if (multiFractal > 0.6) confidence -= 0.05;
  if (singularityScore > 0.7) confidence -= 0.05;
  confidence = clamp01(confidence);

  // Start from a neutral collapse threshold and adapt per session profile.
  let adjustedCollapseThreshold = clamp01(0.6 * profile.collapseMult);

  if (collapsePressure >= collapsePressureThreshold && dispersion <= cfg.highDispersionThreshold) {
    adjustedCollapseThreshold -= 0.1;
  }
  if (collapsePressure >= collapsePressureThreshold + 0.15 && dispersion <= cfg.highDispersionThreshold - 0.1) {
    adjustedCollapseThreshold -= 0.05;
  }
  if (dispersion >= cfg.highDispersionThreshold + 0.1) {
    adjustedCollapseThreshold += 0.1;
  }

  if (typeof dpTau === "number") {
    const tauNorm = Math.min(2, Math.max(0, dpTau / 100));
    adjustedCollapseThreshold *= 0.8 + 0.2 * tauNorm;
  }
  if (multiFractal > 0.6) {
    adjustedCollapseThreshold += 0.05; // delay collapse in turbulent regime
  }
  adjustedCollapseThreshold = clamp01(adjustedCollapseThreshold);

  // Per-round tool budget and branching hints.
  const baseToolsPerRound = 4;
  let maxToolsPerRound = baseToolsPerRound;
  let branchFactor = 1;
  let action: CoherenceGovernorDecision["action"] =
    coarse === "explore_more" ? "continue" : coarse;

  if (multiFractal > 0.6) {
    if (action === "collapse") {
      action = "branch";
    } else if (action === "continue") {
      action = "branch";
    }
  }

  if (searchRegime === "ballistic" && action === "continue" && energy > 0.5) {
    action = "branch";
  } else if (searchRegime === "diffusive") {
    if (action === "branch") action = "ask_clarification";
    if (action === "continue" && coherence < 0.6) action = "ask_clarification";
  }

  if (flareScore > 0.6 && coherence < 0.8) {
    action = "branch";
  }

  if (singularityScore > 0.7 && coherence < 0.5) {
    action = "ask_clarification";
  }

  if (profile.branchBias > 0 && action === "continue" && energy > 0.7) {
    action = "branch";
  } else if (profile.branchBias < 0 && action === "branch" && energy < 0.7) {
    action = "continue";
  }

  if (action === "collapse") {
    maxToolsPerRound = 2;
    branchFactor = 1;
  } else if (action === "ask_clarification") {
    maxToolsPerRound = 2;
    branchFactor = 1;
  } else if (action === "branch") {
    if (energy < 0.4) {
      // Star recommends branching but the energy budget is low:
      // prefer a conservative branch with fewer tools.
      branchFactor = 1;
      maxToolsPerRound = baseToolsPerRound - 1; // e.g. 3
    } else {
      branchFactor = energy > cfg.energyBudgetCeiling ? 3 : 2;
      maxToolsPerRound = energy > cfg.energyBudgetCeiling ? baseToolsPerRound + 2 : baseToolsPerRound + 1;
    }
  } else {
    // explore_more
    branchFactor = dispersion > cfg.highDispersionThreshold ? 2 : 1;
    maxToolsPerRound = baseToolsPerRound;
    // When coherence is low, permit a small bump in
    // tool budget so verifiers can explore more options.
    const exploreCoherenceThreshold = 0.45;
    if (coherence < exploreCoherenceThreshold) {
      maxToolsPerRound = baseToolsPerRound + 1;
    }
  }

  if (searchRegime === "ballistic" && action !== "collapse") {
    branchFactor = Math.max(branchFactor, 2);
    maxToolsPerRound += 1;
  } else if (searchRegime === "diffusive") {
    branchFactor = Math.max(1, branchFactor - 1);
    maxToolsPerRound = Math.max(1, maxToolsPerRound - 1);
  }

  if (flareScore > 0.6 && action === "branch") {
    branchFactor = Math.max(branchFactor, 3);
    maxToolsPerRound = Math.max(maxToolsPerRound, baseToolsPerRound + 2);
  }

  if (multiFractal > 0.6 && action !== "collapse") {
    maxToolsPerRound = Math.max(maxToolsPerRound, baseToolsPerRound + 1);
  }

  if (profile.branchBias > 0 && action === "branch") {
    branchFactor += profile.branchBias > 0.2 ? 1 : 0;
  }

  if (singularityScore > 0.7 && action === "ask_clarification") {
    maxToolsPerRound = Math.min(maxToolsPerRound, 2);
  }

  // Map into a soft cap on how many additional rounds
  // we should tolerate beyond the current one.
  let maxAdditionalRounds = 2;

  if (action === "collapse") {
    maxAdditionalRounds = confidence >= adjustedCollapseThreshold ? 0 : 1;
  } else if (action === "ask_clarification") {
    maxAdditionalRounds = 1;
  } else if (action === "branch") {
    maxAdditionalRounds = multiFractal > 0.6 ? 4 : 3;
  } else {
    maxAdditionalRounds = coherence < cfg.lowCoherenceThreshold ? 3 : 2;
    if (searchRegime === "diffusive") {
      maxAdditionalRounds = 1;
    }
  }

  return {
    action,
    confidence: clamp01(confidence),
    adjustedCollapseThreshold,
    maxAdditionalRounds,
    toolBudgetHints: {
      maxToolsPerRound,
      branchFactor,
    },
  };
};
