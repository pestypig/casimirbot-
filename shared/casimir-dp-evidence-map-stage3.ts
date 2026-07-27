// math-stage: diagnostic
import type {
  CasimirDpEvidenceMapStage3Config,
} from "./contracts/casimir-dp-evidence-map-stage3.v1";
import {
  CASIMIR_DP_EVIDENCE_MAP_STAGE3_RUN_ORDER,
} from "./contracts/casimir-dp-evidence-map-stage3.v1";

export type Stage3GateStatus =
  | "pass"
  | "diagnostic"
  | "not_ready"
  | "blocked";

export type Stage3RuntimeEnvelope = {
  schema_version?: string;
  status?: string;
  evidence_class?: string;
  maximum_claim?: string;
  [key: string]: unknown;
};

export type Stage3RuntimeBundle = {
  complex_coherence: Stage3RuntimeEnvelope;
  qed_green_noise: Stage3RuntimeEnvelope;
  dp_companion: Stage3RuntimeEnvelope;
  gravity_upper_bound: Stage3RuntimeEnvelope;
  model_comparison: Stage3RuntimeEnvelope;
  manifold_kernel_registry: Stage3RuntimeEnvelope;
};

export type Stage3IntegrityRow = {
  role: string;
  path: string;
  expected_sha256: string;
  actual_sha256: string | null;
  gate: "pass" | "not_ready";
  required_at_runtime: boolean;
};

export const CASIMIR_DP_STAGE3_OUTCOME_TO_CLAIM_MAP = [
  {
    outcome_id: "integrity_failure",
    observation:
      "Hash, calibration, randomization, or blind-integrity failure",
    establishes: "The campaign cannot support confirmatory inference.",
    disfavors:
      "No physics model; the run is invalid or exploratory.",
    does_not_establish: "Any physical null or anomaly.",
    maximum_claim: "invalid_or_exploratory",
  },
  {
    outcome_id: "reversible_boundary_phase",
    observation:
      "Boundary-conditioned phase reverses under path swap and recovers under conditioning or echo",
    establishes:
      "A controlled boundary-dependent Hamiltonian/QED phase when the material and Green model closes.",
    disfavors:
      "Models predicting a larger irreducible loss in the powered region.",
    does_not_establish:
      "Objective collapse, manifold dynamics, or negative gravitational mass.",
    maximum_claim: "controlled_qed_phase",
  },
  {
    outcome_id: "conditioned_visibility_recovery",
    observation: "Raw visibility loss is removed by independent phase conditioning",
    establishes: "Conditionable phase noise or dephasing.",
    disfavors:
      "A model assigning the removed component to irreducible collapse.",
    does_not_establish: "Absence of all environmental decoherence.",
    maximum_claim: "conditionable_dephasing",
  },
  {
    outcome_id: "ordinary_channel_closure",
    observation:
      "Unrecovered loss is quantitatively tracked by calibrated QED, heating, gas, charge, vibration, or other nuisance channels",
    establishes: "Ordinary open-system decoherence within uncertainty.",
    disfavors:
      "Intrinsic models predicting a powered minimum excess beyond the closed budget.",
    does_not_establish: "A universal exclusion of OR or DP.",
    maximum_claim: "ordinary_decoherence",
  },
  {
    outcome_id: "powered_null_residual",
    observation:
      "No residual remains after ordinary closure and demonstrated sensitivity",
    establishes: "An upper bound on preregistered excess terms.",
    disfavors: "Only the covered DP or bridge parameter region.",
    does_not_establish: "That objective collapse never occurs.",
    maximum_claim: "parameter_region_exclusion",
  },
  {
    outcome_id: "eg_scaling_without_companion",
    observation:
      "Boundary-independent excess follows preregistered E_G scaling without a required dynamical-DP companion",
    establishes:
      "Compatibility with the tested Penrose lifetime envelope.",
    disfavors:
      "A named dynamical-DP parameter set when its companion channel was applicable and powered.",
    does_not_establish: "Penrose OR, a unique dynamics, or a spacetime ontology.",
    maximum_claim: "heuristic_compatibility",
  },
  {
    outcome_id: "named_dp_joint_signature",
    observation:
      "Boundary-independent coherence plus powered companion observables follow one frozen named-DP parameter manifest",
    establishes:
      "Substantive, replication-contingent support for that named dynamical-DP implementation.",
    disfavors:
      "Registered alternatives that fail the held-out joint prediction.",
    does_not_establish:
      "Every DP variant, Penrose's broader interpretation, or manifold dynamics.",
    maximum_claim: "named_model_support",
  },
  {
    outcome_id: "unregistered_boundary_anomaly",
    observation:
      "Boundary-dependent residual persists at fixed delta_rho without a registered bridge",
    establishes:
      "A reproducible unexplained boundary-correlated anomaly after replication.",
    disfavors:
      "Unextended OR/DP as the explanation if ordinary channels and branch matching close.",
    does_not_establish:
      "Collapse, a gravitational mechanism, quantum foam, or manifold dynamics.",
    maximum_claim: "unexplained_anomaly",
  },
  {
    outcome_id: "registered_bridge_joint_signature",
    observation:
      "A boundary-dependent residual matches a preregistered causal stress/noise kernel over held-out axes",
    establishes:
      "Evidence for that specific registered extension after independent replication.",
    disfavors:
      "Registered alternatives that fail the joint held-out prediction.",
    does_not_establish: "A generic proof of manifold dynamics.",
    maximum_claim: "specific_bridge_support",
  },
  {
    outcome_id: "independent_gravity_response",
    observation:
      "An independent vacuum-weight or multi-probe metric response matches a complete-apparatus source",
    establishes:
      "Ordinary or model-specific gravitational coupling, depending on the registered prediction.",
    disfavors:
      "Models predicting no such response in the powered region.",
    does_not_establish:
      "Objective collapse without a separately discriminating coherence channel.",
    maximum_claim: "gravitational_response",
  },
  {
    outcome_id: "frequency_coincidence",
    observation:
      "Numerical coincidence among Compton, E_G/h, and cavity frequencies",
    establishes: "No physical correspondence by itself.",
    disfavors: "Nothing.",
    does_not_establish:
      "Resonance, transfer, collapse, or a causal bridge.",
    maximum_claim: "none",
  },
  {
    outcome_id: "decay_shape_only",
    observation: "Non-exponential visibility decay without mechanism closure",
    establishes: "A decay-shape observation requiring model comparison.",
    disfavors:
      "Only preregistered line shapes rejected with adequate power.",
    does_not_establish: "Objective collapse.",
    maximum_claim: "decay_shape_diagnostic",
  },
] as const;

export const CASIMIR_DP_STAGE3_CROSS_AXIS_SIGNATURES = [
  {
    lane: "qed_hamiltonian",
    mass_density_geometry: "probe_response_dependent",
    branch_separation: "branch_potential_difference",
    hold_time: "unitary_phase_accumulation",
    boundary: "strong_material_green_dependence",
    temperature_noise: "thermal_material_response",
    path_swap: "phase_sign_reversal",
    echo: "static_phase_may_refocus",
    companion: "mean_force_or_gradient",
  },
  {
    lane: "technical_dephasing",
    mass_density_geometry: "apparatus_dependent",
    branch_separation: "nuisance_coupling_dependent",
    hold_time: "often_quasistatic_or_non_markovian",
    boundary: "may_correlate_through_controls",
    temperature_noise: "often_strong",
    path_swap: "nuisance_specific",
    echo: "often_partly_recovers",
    companion: "measured_technical_psd",
  },
  {
    lane: "qed_environmental_decoherence",
    mass_density_geometry: "probe_response_dependent",
    branch_separation: "which_path_filter_dependent",
    hold_time: "model_specific_chi",
    boundary: "green_loss_distance_dependent",
    temperature_noise: "strong_model_dependence",
    path_swap: "no_hamiltonian_sign_flip",
    echo: "filter_dependent_suppression",
    companion: "force_noise_heating_or_loss",
  },
  {
    lane: "penrose_or_heuristic",
    mass_density_geometry: "delta_rho_and_E_G",
    branch_separation: "E_G_scaling",
    hold_time: "tau_approximately_hbar_over_E_G",
    boundary: "null_at_fixed_delta_rho",
    temperature_noise: "no_standard_boundary_term",
    path_swap: "intrinsic_rate_invariant",
    echo: "no_unique_law",
    companion: "none_unique",
  },
  {
    lane: "named_dynamical_dp",
    mass_density_geometry: "registered_density_functional",
    branch_separation: "registered_model_behavior",
    hold_time: "master_equation_prediction",
    boundary: "null_at_fixed_delta_rho_unless_extended",
    temperature_noise: "variant_specific",
    path_swap: "intrinsic_rate_invariant",
    echo: "model_specific",
    companion: "diffusion_heating_or_radiation",
  },
  {
    lane: "ordinary_gravity",
    mass_density_geometry: "complete_delta_T_munu",
    branch_separation: "probe_potential_difference",
    hold_time: "unitary_phase_accumulation",
    boundary: "complete_state_energy_difference",
    temperature_noise: "apparatus_energy_ledger",
    path_swap: "geometry_sign",
    echo: "unitary_phase_may_refocus",
    companion: "vacuum_weight_or_metric_probe",
  },
  {
    lane: "registered_bridge",
    mass_density_geometry: "frozen_kernel_only",
    branch_separation: "frozen_kernel_only",
    hold_time: "frozen_dynamics_only",
    boundary: "required_held_out_dependence",
    temperature_noise: "registered_noise_or_FDT_dependence",
    path_swap: "registered_falsifier",
    echo: "registered_falsifier",
    companion: "independent_registered_observable",
  },
] as const;

function runtimeStatus(runtime: Stage3RuntimeEnvelope): string {
  return typeof runtime.status === "string"
    ? runtime.status
    : "diagnostic";
}

function nestedString(
  runtime: Stage3RuntimeEnvelope,
  objectKey: string,
  valueKey: string,
): string | null {
  const object = runtime[objectKey];
  if (object == null || typeof object !== "object" || Array.isArray(object)) {
    return null;
  }
  const value = (object as Record<string, unknown>)[valueKey];
  return typeof value === "string" ? value : null;
}

export function buildCasimirDpEvidenceMapStage3Report(args: {
  config: CasimirDpEvidenceMapStage3Config;
  authorityIntegrity: Stage3IntegrityRow[];
  fixtureIntegrity: Stage3IntegrityRow[];
  runtimes: Stage3RuntimeBundle;
  registryPreflightIncludedBridge: boolean;
  now?: Date;
}) {
  const allRequiredAuthoritiesPass = args.authorityIntegrity.every(
    (row) => !row.required_at_runtime || row.gate === "pass",
  );
  const allFixturesPass = args.fixtureIntegrity.every(
    (row) => row.gate === "pass",
  );
  const provenanceGate =
    allRequiredAuthoritiesPass && allFixturesPass ? "pass" : "not_ready";
  const registryStatus = runtimeStatus(args.runtimes.manifold_kernel_registry);
  const comparisonStatus = runtimeStatus(args.runtimes.model_comparison);
  const complexProvenancePass =
    args.runtimes.complex_coherence.provenance_gate === "pass";
  const complexControlsReady =
    args.runtimes.complex_coherence.covariance_gate === "pass" &&
    nestedString(
      args.runtimes.complex_coherence,
      "nuisance_correlations",
      "gate",
    ) === "pass";
  const phaseConditioningApplied =
    nestedString(
      args.runtimes.complex_coherence,
      "phase_conditioning",
      "gate",
    ) === "pass";
  const decayIdentifiable =
    nestedString(
      args.runtimes.complex_coherence,
      "decay_shape",
      "identifiability",
    ) === "pass" ||
    (
      (
        args.runtimes.complex_coherence.decay_shape as
          | Record<string, unknown>
          | undefined
      )?.identifiability as Record<string, unknown> | undefined
    )?.gate === "pass";
  const materialSidecarsMeasured =
    nestedString(
      args.runtimes.qed_green_noise,
      "material_diagnostics",
      "measured_response_gate",
    ) === "pass" &&
    nestedString(
      args.runtimes.qed_green_noise,
      "readiness",
      "measured_geometry_gate",
    ) === "pass";

  const stageStatus: Record<
    (typeof CASIMIR_DP_EVIDENCE_MAP_STAGE3_RUN_ORDER)[number],
    Stage3GateStatus
  > = {
    freeze_sources_conventions_models_and_upstream_hashes: provenanceGate,
    validate_blind_provenance_randomization_and_control_coverage:
      provenanceGate === "pass" &&
          complexProvenancePass &&
          complexControlsReady
        ? "diagnostic"
        : "not_ready",
    estimate_complex_coherence: "diagnostic",
    evaluate_phase_conditioning_path_swap_and_echo:
      phaseConditioningApplied ? "diagnostic" : "not_ready",
    evaluate_decay_shape_and_time_grid_identifiability:
      decayIdentifiable ? "diagnostic" : "not_ready",
    validate_material_green_noise_and_technical_sidecars:
      materialSidecarsMeasured ? "diagnostic" : "not_ready",
    predict_qed_phase_noise_heating_and_decoherence: "diagnostic",
    validate_named_or_dp_models_and_parameter_manifest: "diagnostic",
    predict_dp_coherence_and_applicable_companions: "diagnostic",
    validate_complete_apparatus_energy_and_stress_ledger: "diagnostic",
    compute_mass_weight_weak_field_and_ordinary_gravity_phase_bounds:
      "diagnostic",
    preflight_manifold_kernel_registry:
      registryStatus === "registered" ? "diagnostic" : "blocked",
    freeze_signatures_likelihoods_priors_criteria_and_falsifiers:
      provenanceGate === "pass" ? "pass" : "not_ready",
    run_blinded_held_out_joint_model_comparison:
      comparisonStatus === "blocked"
        ? "blocked"
        : comparisonStatus === "not_ready"
        ? "not_ready"
        : "diagnostic",
    populate_outcome_to_claim_ledger: "pass",
    write_hash_backed_receipt_report_and_evidence_state: "pass",
  };

  return {
    schema_version: "casimir_dp_evidence_map_stage3_report/1",
    study_id: args.config.study_id,
    campaign_id: args.config.campaign_id,
    generated_at: (args.now ?? new Date()).toISOString(),
    evidence_cutoff: args.config.evidence_cutoff,
    claim_ceiling: args.config.claim_ceiling,
    promotion_allowed: false,
    scientific_question:
      "Which preregistered mechanism survives ordinary-physics closure and held-out joint discrimination?",
    authority_integrity: args.authorityIntegrity,
    fixture_integrity: args.fixtureIntegrity,
    run_order: args.config.run_order.map((stage, index) => ({
      index: index + 1,
      stage,
      gate: stageStatus[stage],
    })),
    preregistration: {
      composite_null_model_id:
        args.config.preregistration.composite_null_model_id,
      composite_null_components:
        args.config.preregistration.composite_null_components,
      nested_extensions: args.config.preregistration.frozen_models
        .filter((model) => model.role === "nested_extension")
        .map((model) => ({
          model_id: model.model_id,
          requires_registered_bridge: model.requires_registered_bridge,
          admitted_to_comparison:
            !model.requires_registered_bridge ||
            args.registryPreflightIncludedBridge,
        })),
      fixed_delta_rho_equivalence:
        args.config.preregistration.fixed_delta_rho_equivalence,
      thresholds: args.config.preregistration.thresholds,
      compatibility_wording:
        args.config.evidence_policy.compatibility_label,
    },
    runtimes: args.runtimes,
    registry_preflight: {
      status: registryStatus,
      bridge_schema_registered: registryStatus === "registered",
      bridge_admitted_to_comparison: args.registryPreflightIncludedBridge,
      registration_is_empirical_validation: false,
    },
    outcome_to_claim_map: CASIMIR_DP_STAGE3_OUTCOME_TO_CLAIM_MAP,
    cross_axis_signature_matrix: CASIMIR_DP_STAGE3_CROSS_AXIS_SIGNATURES,
    final_gates: {
      software_and_synthetic_diagnostics:
        provenanceGate === "pass" && allFixturesPass ? "pass" : "not_ready",
      measured_evidence: "not_ready",
      ordinary_decoherence_closure: "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      bridge_registration:
        registryStatus === "registered" ? "registered_not_validated" : "blocked",
      model_comparison: comparisonStatus,
      publication_claim: "diagnostic_protocol_only",
    },
    claim_boundaries: [
      "Synthetic fixtures validate software recovery and fail-closed logic only.",
      "A residual is an anomaly until ordinary channels, provenance, power, and a registered model jointly close.",
      "Penrose's lifetime heuristic is not a generative stochastic dynamics.",
      "A named DP result applies only to its frozen implementation and parameter manifest.",
      "A scalar Casimir energy or pressure is not a tensor-to-coherence bridge.",
      "Registry completeness is not empirical validation.",
      "No Stage-3 output proves objective collapse, quantum foam, or manifold dynamics.",
      "A null excludes only the preregistered region with demonstrated sensitivity.",
    ],
  };
}
