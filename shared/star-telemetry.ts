import { z } from "zod";

/**
 * InformationEvent encodes the “mass noise” payload sent to the star coherence service.
 * It stays language-agnostic: only bits/complexity/alignment metadata are captured here.
 */
export const InformationEvent = z.object({
  session_id: z.string(),
  session_type: z.string().default("debate"),
  host_id: z.string().optional(),
  host_mass_norm: z.number().min(0).max(1).optional(),
  host_radius_norm: z.number().min(0).max(1).optional(),
  host_mode: z
    .enum(["sun_like", "brain_like", "lab", "other"])
    .or(z.string())
    .optional(),
  origin: z.enum(["user", "model", "tool", "system"]).default("model"),
  bytes: z.number().int().nonnegative(),
  complexity_score: z.number().min(0).max(1).default(0.5),
  branch_id: z.string().optional(),
  environment_tags: z.array(z.string()).default([]),
  alignment: z.number().min(-1).max(1).default(0),
  gamma_sync_z: z.number().optional(),
  phase_dispersion: z.number().min(0).max(1).optional(),
  artifact_flags: z.record(z.number().min(0).max(1)).optional(),
  phase_5min: z.number().optional(),
  timestamp: z.number().int().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TInformationEvent = z.infer<typeof InformationEvent>;

export const TelemetryLevels = z
  .object({
    micro: z.number().min(0).max(1).optional(),
    meso: z.number().min(0).max(1).optional(),
    macro: z.number().min(0).max(1).optional(),
    rope: z.number().min(0).max(1).optional(),
  })
  .default({});

export const TelemetrySnapshot = z.object({
  session_id: z.string(),
  session_type: z.string().default("debate"),
  host_id: z.string().optional(),
  host_mass_norm: z.number().min(0).max(1).optional(),
  host_radius_norm: z.number().min(0).max(1).optional(),
  host_mode: z
    .enum(["sun_like", "brain_like", "lab", "other"])
    .or(z.string())
    .optional(),
  dp_energy_norm: z.number().min(0).max(1).optional(),
  dp_tau_estimate_ms: z.number().min(0).optional(),
  bands: z
    .object({
      micro_freq_hz: z.number().positive().optional(),
      meso_freq_hz: z.number().positive().optional(),
      macro_freq_hz: z.number().positive().optional(),
      rope_beat_hz: z.number().min(0).optional(),
    })
    .optional(),
  global_coherence: z.number().min(0).max(1).default(0.5),
  levels: TelemetryLevels,
  phase_dispersion: z.number().min(0).max(1).optional(),
  gamma_sync_z: z.number().optional(),
  artifact_flags: z.record(z.number().min(0).max(1)).optional(),
  equilibrium: z.boolean().optional(),
  equilibrium_hold_ms: z.number().min(0).optional(),
  equilibrium_r_star: z.number().optional(),
  equilibrium_dispersion_max: z.number().min(0).max(1).optional(),
  equilibrium_hold_ms_threshold: z.number().min(0).optional(),
  collapse_pressure: z.number().min(0).max(1).optional(),
  multi_fractal_index: z.number().min(0).max(1).optional(),
  resonance_score: z.number().min(0).max(1).optional(),
  flare_score: z.number().min(0).max(1).optional(),
  search_regime: z.enum(["ballistic", "diffusive", "mixed"]).optional(),
  singularity_score: z.number().min(0).max(1).optional(),
  phase_5min: z.number().optional(),
  p_mode_driver: z.number().optional(),
  driver_history_len: z.number().int().nonnegative().optional(),
  driver_history_required: z.number().int().positive().optional(),
  phase_dispersion_ready: z.boolean().optional(),
  p_mode_ready: z.boolean().optional(),
  recommended_action: z
    .enum(["explore_more", "collapse", "branch", "ask_clarification"])
    .optional(),
  energy_budget: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
  updated_at: z.number().int().optional(),
});

export type TTelemetrySnapshot = z.infer<typeof TelemetrySnapshot>;

export const CollapseDecision = z.object({
  session_id: z.string(),
  session_type: z.string().default("debate"),
  branch_id: z.string().optional(),
  reason: z.string().optional(),
  telemetry: TelemetrySnapshot.optional(),
});

export type TCollapseDecision = z.infer<typeof CollapseDecision>;
