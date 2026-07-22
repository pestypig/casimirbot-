import { z } from "zod";

export const CASIMIR_DP_PROPOSAL_CLOSURE_VERSION = "casimir_dp_proposal_closure/1" as const;

const EvidenceStatus = z.enum([
  "demonstrated_subsystem",
  "literature_model",
  "design_target",
  "missing",
]);

const SystematicFamily = z.enum([
  "particle_charge_and_stray_electric_field",
  "surface_patch_potential",
  "gate_leakage_and_electromagnetic_pickup",
  "boundary_switching_heat",
  "mechanical_vibration_and_acoustic_coupling",
  "optical_recoil_and_readout_backaction",
  "trap_alignment_and_state_expansion_noise",
  "gas_collisions",
  "blackbody_exchange",
  "casimir_polder_force_and_surface_gradient",
  "lateral_surface_inhomogeneity",
  "analysis_drift_and_label_leakage",
]);

export const REQUIRED_CASIMIR_DP_SYSTEMATICS = SystematicFamily.options;

const SystematicControl = z.object({
  family: SystematicFamily,
  sensor_or_channel: z.string().min(1),
  calibration_method: z.string().min(1),
  negative_control: z.string().min(1),
  acceptance_metric: z.string().min(1),
  threshold: z.number().nonnegative(),
  unit: z.string().min(1),
  evidence_status: EvidenceStatus,
});

const CommissioningStage = z.object({
  stage_id: z.string().min(1),
  order: z.number().int().nonnegative(),
  objective: z.string().min(1),
  required_artifacts: z.array(z.string().min(1)).min(1),
  acceptance_tests: z.array(z.string().min(1)).min(1),
  depends_on: z.array(z.string().min(1)),
  claim_ceiling: z.enum(["instrument_only", "systematics_only", "coherence_residual", "model_comparison"]),
});

const ModelLane = z.object({
  model_id: z.string().min(1),
  role: z.enum([
    "ordinary_decoherence",
    "casimir_open_system",
    "dp_rate_only",
    "collapse_dynamics",
    "manifold_response",
  ]),
  status: z.enum(["registered", "diagnostic_only", "blocked"]),
  source_ref: z.string().min(1).nullable(),
  predicted_observables: z.array(z.string().min(1)),
  claim_ceiling: z.string().min(1),
});

const DecisionOutcome = z.object({
  outcome_id: z.enum([
    "integrity_failure",
    "null_consistent",
    "environment_explained_residual",
    "unexplained_residual",
    "model_discriminating_residual",
  ]),
  condition: z.string().min(1),
  permitted_statement: z.string().min(1),
  forbidden_statement: z.string().min(1),
});

const SignalContract = z.object({
  primary_observable: z.literal("boundary_conditioned_coherence_decay_residual_s^-1"),
  paired_contrast_definition: z.string().min(1),
  estimator: z.literal("paired_block_mixed_effects"),
  sign_convention: z.literal("boundary_on_minus_boundary_off"),
  observation_window_s: z.number().positive(),
  secondary_observables: z.array(z.string().min(1)).min(4),
  preprocessing_freeze_required: z.literal(true),
});

const FiniteGeometryMaterialContract = z.object({
  primary_solver: z.literal("finite_geometry_scattering_or_boundary_element"),
  asymptotic_crosscheck: z.literal("proximity_force_and_retarded_cp_limits"),
  distance_grid_m: z.array(z.number().positive()).min(4),
  required_material_receipts: z.array(z.string().min(1)).min(5),
  required_surface_receipts: z.array(z.string().min(1)).min(4),
  boundary_state_optical_response_required: z.literal(true),
  independent_force_calibrator_required: z.literal(true),
  maximum_kk_relative_error: z.number().positive().lte(1e-6),
  minimum_force_contrast_significance_sigma: z.number().positive(),
  maximum_force_contrast_fractional_repeatability: z.number().positive().lte(1),
  maximum_geometry_uncertainty_fraction: z.number().positive().lte(1),
  maximum_model_residual_fraction: z.number().positive().lte(1),
  model_authority: z.literal("prediction_only_until_receipts_and_force_contrast_pass"),
});

const CalibrationContract = z.object({
  cadence: z.literal("before_and_after_each_acquisition_block"),
  particle_charge_method: z.literal("single_electron_charge_stepping"),
  distance_method: z.literal("surface_referenced_interferometric_and_trap_shift_crosscheck"),
  force_method: z.literal("cofabricated_nanomechanical_reference"),
  phase_method: z.literal("known_force_impulse_and_dark_sequence"),
  temperature_method: z.literal("dual_sensor_cryostat_and_boundary_thermometry"),
  calibration_sidecar_hash_required: z.literal(true),
  traceability_chain_required: z.literal(true),
});

const SynchronizationContract = z.object({
  master_timebase: z.literal("single_disciplined_acquisition_clock"),
  trigger_topology: z.literal("hardware_fanout_with_independent_loopback"),
  maximum_clock_skew_s: z.number().positive(),
  timestamped_channels: z.array(z.string().min(1)).min(6),
  raw_trigger_edges_recorded: z.literal(true),
  clock_audit_required_before_unblinding: z.literal(true),
  dropped_or_duplicated_record_policy: z.literal("invalidate_pair_and_retain_audit_record"),
});

const BlindingContract = z.object({
  randomization_unit: z.literal("paired_acquisition_window"),
  allocation: z.literal("balanced_permuted_blocks_with_custodian_seed"),
  blind_custodian_role: z.string().min(1),
  blinded_roles: z.array(z.string().min(1)).min(3),
  label_prediction_accuracy_maximum: z.number().min(0.5).max(0.55),
  freeze_artifacts: z.array(z.string().min(1)).min(6),
  emergency_unblinding_rule: z.string().min(1),
  ordinary_unblinding_rule: z.string().min(1),
});

const CovarianceContract = z.object({
  primary_estimator: z.literal("block_cluster_robust_sandwich"),
  nuisance_estimator: z.literal("pilot_fitted_prewhitened_shrinkage_covariance"),
  cluster_unit: z.literal("randomization_block"),
  required_channels: z.array(z.string().min(1)).min(8),
  normalized_psd_tolerance: z.number().nonnegative().lte(1e-8),
  maximum_condition_number: z.number().positive(),
  missing_data_policy: z.literal("no_primary_imputation_retain_missingness_and_exclusion_receipts"),
  pilot_estimation_only: z.literal(true),
  freeze_before_main_run: z.literal(true),
});

const StatisticalDecisionContract = z.object({
  primary_model: z.literal("paired_block_mixed_effects_with_registered_nuisance_reentry"),
  primary_model_formula: z.string().min(1),
  inference_framework: z.literal("frequentist_confirmatory"),
  prior_policy: z.literal("none"),
  confidence_interval_method: z.literal("cluster_robust_wald_with_permutation_crosscheck"),
  primary_parameter: z.literal("beta_boundary_s^-1"),
  null_value: z.literal(0),
  alternative: z.literal("two_sided"),
  multiplicity_method: z.literal("holm_familywise"),
  multiplicity_family_size: z.number().int().min(2),
  familywise_alpha: z.number().positive().lt(0.5),
  target_power: z.number().gt(0.5).lt(1),
  pilot_paired_windows: z.number().int().positive(),
  minimum_main_paired_windows: z.number().int().positive(),
  sequential_peeking_allowed: z.literal(false),
  exclusion_policy: z.literal("preregistered_machine_auditable_no_post_unblinding_changes"),
  sensitivity_analyses: z.array(z.string().min(1)).min(4),
  decision_table_binding: z.literal("decision_table"),
});

export const CasimirDpProposalClosureConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_PROPOSAL_CLOSURE_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  proposal_id: z.string().min(1),
  evidence_cutoff: z.string().min(1),
  claim_tier: z.literal("diagnostic"),
  run_order: z.array(z.string().min(1)).min(1),
  architecture: z.object({
    architecture_id: z.literal("transverse-branch-sample-hold-2d-boundary"),
    status: z.literal("frozen_for_proposal"),
    particle_material: z.literal("silica"),
    particle_radius_m: z.number().positive(),
    particle_density_kg_m3: z.number().positive(),
    nominal_surface_distance_m: z.number().positive(),
    commissioning_distance_range_m: z.tuple([z.number().positive(), z.number().positive()]),
    branch_separation_m: z.number().positive(),
    branch_orientation: z.literal("transverse_to_surface_normal"),
    observation_time_s: z.number().positive(),
    operating_temperature_K: z.number().positive(),
    boundary_class: z.literal("electrically_tunable_2d_material_on_substrate"),
    boundary_operation: z.literal("randomized_sample_and_hold_between_shots"),
    minimum_settle_time_s: z.number().positive(),
    force_calibrator: z.literal("independent_cofabricated_nanomechanical_reference"),
    normal_force_role: z.literal("common_mode_monitored_nuisance"),
    primary_estimand: z.literal("boundary_conditioned_coherence_decay_residual_s^-1"),
    secondary_estimands: z.array(z.string().min(1)).min(3),
    evidence_refs: z.array(z.string().min(1)).min(4),
  }),
  casimir_polder_reference: z.object({
    model: z.literal("retarded_silica_sphere_near_silicon_C4_reference"),
    c4_coefficient_J_m: z.number().positive(),
    source_ref: z.string().min(1),
    authority: z.literal("literature_anchored_reference_only"),
  }),
  phase_stability: z.object({
    maximum_phase_noise_rad: z.number().positive(),
    maximum_clock_skew_s: z.number().positive(),
    maximum_label_prediction_accuracy: z.number().min(0.5).max(1),
  }),
  signal_contract: SignalContract,
  finite_geometry_material_contract: FiniteGeometryMaterialContract,
  calibration_contract: CalibrationContract,
  synchronization_contract: SynchronizationContract,
  blinding_contract: BlindingContract,
  covariance_contract: CovarianceContract,
  statistical_decision_contract: StatisticalDecisionContract,
  acquisition: z.object({
    pilot_paired_windows: z.number().int().positive(),
    main_paired_windows: z.number().int().positive(),
    registered_smallest_correlation: z.number().positive().lt(1),
    required_paired_windows_for_smallest_correlation: z.number().int().positive(),
    familywise_alpha: z.number().positive().lt(0.5),
    target_power: z.number().gt(0.5).lt(1),
    blind_custodian_role: z.string().min(1),
    unblinding_rule: z.string().min(1),
    preregistration_freeze_required: z.literal(true),
  }),
  systematics: z.array(SystematicControl).min(REQUIRED_CASIMIR_DP_SYSTEMATICS.length),
  commissioning: z.array(CommissioningStage).min(4),
  model_lanes: z.array(ModelLane).min(5),
  decision_table: z.array(DecisionOutcome).min(5),
  proposal_nonclaims: z.array(z.string().min(1)).min(5),
}).superRefine((config, context) => {
  const [near, far] = config.architecture.commissioning_distance_range_m;
  if (near >= far) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["architecture", "commissioning_distance_range_m"], message: "Distance range must be [near, far]." });
  }
  if (config.architecture.nominal_surface_distance_m < near || config.architecture.nominal_surface_distance_m > far) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["architecture", "nominal_surface_distance_m"], message: "Nominal distance must lie inside the commissioning range." });
  }
  const consistent = (condition: boolean, path: (string | number)[], message: string) => {
    if (!condition) context.addIssue({ code: z.ZodIssueCode.custom, path, message });
  };
  consistent(
    config.signal_contract.observation_window_s === config.architecture.observation_time_s,
    ["signal_contract", "observation_window_s"],
    "Signal observation window must equal the architecture observation time.",
  );
  consistent(
    config.signal_contract.primary_observable === config.architecture.primary_estimand,
    ["signal_contract", "primary_observable"],
    "Signal primary observable must equal the frozen architecture estimand.",
  );
  consistent(
    config.synchronization_contract.maximum_clock_skew_s === config.phase_stability.maximum_clock_skew_s,
    ["synchronization_contract", "maximum_clock_skew_s"],
    "Synchronization skew must equal the phase-stability limit.",
  );
  consistent(
    config.blinding_contract.blind_custodian_role === config.acquisition.blind_custodian_role,
    ["blinding_contract", "blind_custodian_role"],
    "Blinding custodian must match the acquisition contract.",
  );
  consistent(
    config.blinding_contract.label_prediction_accuracy_maximum === config.phase_stability.maximum_label_prediction_accuracy,
    ["blinding_contract", "label_prediction_accuracy_maximum"],
    "Label-leakage thresholds must match.",
  );
  consistent(
    config.blinding_contract.ordinary_unblinding_rule === config.acquisition.unblinding_rule,
    ["blinding_contract", "ordinary_unblinding_rule"],
    "Unblinding rules must match.",
  );
  consistent(
    config.statistical_decision_contract.familywise_alpha === config.acquisition.familywise_alpha &&
      config.statistical_decision_contract.target_power === config.acquisition.target_power &&
      config.statistical_decision_contract.pilot_paired_windows === config.acquisition.pilot_paired_windows &&
      config.statistical_decision_contract.minimum_main_paired_windows === config.acquisition.main_paired_windows,
    ["statistical_decision_contract"],
    "Statistical decision and acquisition parameters must match.",
  );
  consistent(
    config.finite_geometry_material_contract.distance_grid_m.includes(near) &&
      config.finite_geometry_material_contract.distance_grid_m.includes(config.architecture.nominal_surface_distance_m) &&
      config.finite_geometry_material_contract.distance_grid_m.includes(far),
    ["finite_geometry_material_contract", "distance_grid_m"],
    "Finite-geometry grid must include the near, nominal, and far commissioned distances.",
  );
});

export type CasimirDpProposalClosureConfig = z.infer<typeof CasimirDpProposalClosureConfig>;
