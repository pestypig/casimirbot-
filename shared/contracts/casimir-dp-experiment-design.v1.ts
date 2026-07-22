import { z } from "zod";

export const CASIMIR_DP_EXPERIMENT_DESIGN_VERSION = "casimir_dp_experiment_design/1" as const;
export const CASIMIR_DP_EXPERIMENT_REPORT_VERSION = "casimir_dp_experiment_design_report/1" as const;

export const EvidenceClass = z.enum([
  "measured",
  "literature_anchored",
  "design_assumption",
  "unregistered",
]);

export const GateStatus = z.enum(["pass", "review", "not_ready", "blocked"]);

const RateTerm = z.object({
  rate_s: z.number().nonnegative(),
  evidence_class: EvidenceClass,
  note: z.string().min(1),
});

const GaussianDpProxy = z.object({
  mode: z.literal("gaussian_proxy"),
  sigma_m: z.number().positive(),
  ell_m: z.number().positive(),
  grid_dim: z.number().int().min(8).max(64),
  max_voxels: z.number().int().min(512).max(262_144),
  evidence_class: EvidenceClass,
});

const UnresolvedDpProxy = z.object({
  mode: z.literal("unresolved"),
  reason: z.string().min(1),
  evidence_class: z.literal("unregistered"),
});

export const CasimirDpExperimentCandidate = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/),
  label: z.string().min(1),
  study_role: z.enum([
    "integrated_development_candidate",
    "casimir_calibration_candidate",
    "spatial_superposition_benchmark",
  ]),
  platform_class: z.enum([
    "levitated_nanoparticle",
    "nanomechanical_resonator",
    "free_flight_matter_wave",
  ]),
  boundary_actuator: z.enum([
    "electrically_gated_2d_material",
    "superconducting_transition",
    "photoexcited_semiconductor",
  ]),
  evidence_refs: z.array(z.string().min(1)).min(1),
  casimir: z.object({
    gap_m: z.number().positive(),
    active_area_m2: z.number().positive(),
    temperature_K: z.number().nonnegative(),
    symmetry_mode: z.enum(["common_mode_matched", "differential_calibration", "unmatched"]),
    branch_force_mismatch_fraction: z.number().min(0).max(1),
    force_noise_N_rms: z.number().positive(),
    material_model_status: z.enum(["measured_dielectric", "literature_model", "unregistered"]),
    geometry_model_status: z.enum(["converged_finite_geometry", "pfa_reference", "unregistered"]),
  }),
  superposition: z.object({
    mass_kg: z.number().positive(),
    branch_separation_m: z.number().positive(),
    effective_radius_m: z.number().positive(),
    observation_time_s: z.number().positive(),
    trap_stiffness_N_m: z.number().positive().nullable(),
    branch_provenance: EvidenceClass,
  }),
  switching: z.object({
    modulation_hz: z.number().nonnegative(),
    dissipated_power_W: z.number().nonnegative(),
    thermal_transfer_fraction: z.number().min(0).max(1),
    evidence_class: EvidenceClass,
  }),
  decoherence_rates: z.object({
    gas: RateTerm,
    blackbody: RateTerm,
    thermal: RateTerm,
    vibration: RateTerm,
    electromagnetic: RateTerm,
    readout: RateTerm,
    switching: RateTerm,
  }),
  dp: z.discriminatedUnion("mode", [GaussianDpProxy, UnresolvedDpProxy]),
  manifold_response: z.object({
    status: z.literal("blocked"),
    rate_s: z.null(),
    reason: z.literal("missing_registered_tensor_metric_coherence_response"),
  }),
  notes: z.array(z.string()).default([]),
});

export const CasimirDpExperimentDesignConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_EXPERIMENT_DESIGN_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/),
  evidence_cutoff: z.string().min(1),
  claim_tier: z.literal("diagnostic"),
  objective: z.string().min(1),
  thresholds: z.object({
    minimum_casimir_force_snr: z.number().positive(),
    minimum_environmental_visibility: z.number().min(0).max(1),
    maximum_unmodeled_phase_rad: z.number().positive(),
    minimum_dp_to_environment_rate_ratio: z.number().positive(),
  }),
  run_order: z.array(z.string().min(1)).min(1),
  candidates: z.array(CasimirDpExperimentCandidate).min(3),
});

export type CasimirDpExperimentDesignConfig = z.infer<typeof CasimirDpExperimentDesignConfig>;
export type CasimirDpExperimentCandidate = z.infer<typeof CasimirDpExperimentCandidate>;
export type CasimirDpExperimentGateStatus = z.infer<typeof GateStatus>;

export type CasimirDpExperimentCandidateReport = {
  candidate_id: string;
  label: string;
  study_role: CasimirDpExperimentCandidate["study_role"];
  platform_class: CasimirDpExperimentCandidate["platform_class"];
  boundary_actuator: CasimirDpExperimentCandidate["boundary_actuator"];
  evidence_refs: string[];
  reference_casimir: {
    pressure_Pa: number;
    force_N: number;
    energy_J: number;
    mass_equivalent_kg: number;
    force_snr: number;
    force_mismatch_N: number;
    unmodeled_phase_rad: number;
    trap_displacement_m: number | null;
    model_authority: "ideal_parallel_plate_reference_only";
  };
  coherence: {
    environment_rate_s: number;
    environment_visibility: number;
    environment_coherence_window_s: number | null;
    contributions_s: Record<string, number>;
    all_terms_receipt_backed: boolean;
  };
  dp: {
    status: "computed_gaussian_proxy" | "unresolved";
    rate_s: number | null;
    tau_s: number | null;
    dp_to_environment_rate_ratio: number | null;
    evidence_class: z.infer<typeof EvidenceClass>;
    fail_reason: string | null;
  };
  switching: {
    modulation_hz: number;
    dissipated_power_W: number;
    coupled_heat_W: number;
    evidence_class: z.infer<typeof EvidenceClass>;
  };
  gates: Record<string, CasimirDpExperimentGateStatus>;
  blockers: string[];
  engineering_screening_index: number;
  promotion_allowed: false;
};

export type CasimirDpExperimentDesignReport = {
  schema_version: typeof CASIMIR_DP_EXPERIMENT_REPORT_VERSION;
  study_id: string;
  campaign_id: string;
  generated_at: string;
  evidence_cutoff: string;
  claim_tier: "diagnostic";
  promotion_allowed: false;
  run_order: string[];
  candidates: CasimirDpExperimentCandidateReport[];
  ranking: Array<{
    candidate_id: string;
    engineering_screening_index: number;
    disposition: "design_candidate_only";
  }>;
  campaign_gates: {
    publication_grade_casimir_solver: "not_ready";
    measured_decoherence_budget: "not_ready";
    realistic_dp_branch_receipts: "not_ready";
    manifold_response_dynamics: "blocked";
    collapse_identifiability: "blocked";
  };
  claim_boundaries: string[];
};
