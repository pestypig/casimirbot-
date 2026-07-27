import { z } from "zod";

export const CASIMIR_DP_EVIDENCE_MAP_STAGE3_VERSION =
  "casimir_dp_evidence_map_stage3/1" as const;

export const CASIMIR_DP_EVIDENCE_MAP_STAGE3_RUN_ORDER = [
  "freeze_sources_conventions_models_and_upstream_hashes",
  "validate_blind_provenance_randomization_and_control_coverage",
  "estimate_complex_coherence",
  "evaluate_phase_conditioning_path_swap_and_echo",
  "evaluate_decay_shape_and_time_grid_identifiability",
  "validate_material_green_noise_and_technical_sidecars",
  "predict_qed_phase_noise_heating_and_decoherence",
  "validate_named_or_dp_models_and_parameter_manifest",
  "predict_dp_coherence_and_applicable_companions",
  "validate_complete_apparatus_energy_and_stress_ledger",
  "compute_mass_weight_weak_field_and_ordinary_gravity_phase_bounds",
  "preflight_manifold_kernel_registry",
  "freeze_signatures_likelihoods_priors_criteria_and_falsifiers",
  "run_blinded_held_out_joint_model_comparison",
  "populate_outcome_to_claim_ledger",
  "write_hash_backed_receipt_report_and_evidence_state",
] as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const NonEmpty = z.string().min(1);
const RunOrderStage = z.enum(CASIMIR_DP_EVIDENCE_MAP_STAGE3_RUN_ORDER);

export const CasimirDpStage3EvidenceClass = z.enum([
  "synthetic",
  "measured",
  "design_assumption",
  "source_backed_calculation",
]);

export const CasimirDpStage3ClaimCeiling = z.literal("diagnostic");

const AuthorityRef = z.object({
  role: NonEmpty,
  path: NonEmpty,
  sha256: Sha256,
  tracked: z.boolean(),
  required_at_runtime: z.boolean(),
});

const FixtureRef = z.object({
  path: NonEmpty,
  sha256: Sha256,
  schema_version: NonEmpty,
  evidence_class: CasimirDpStage3EvidenceClass,
});

const SourceRef = z.object({
  source_id: NonEmpty,
  url: z.string().url(),
  supports: NonEmpty,
  does_not_support: NonEmpty,
});

const FrozenModel = z.object({
  model_id: NonEmpty,
  lane: z.enum([
    "qed_hamiltonian",
    "technical_dephasing",
    "qed_environmental_decoherence",
    "penrose_or_heuristic",
    "named_dynamical_dp",
    "ordinary_gravity",
    "registered_bridge",
  ]),
  role: z.enum(["baseline_component", "diagnostic_envelope", "nested_extension"]),
  source_ids: z.array(NonEmpty).min(1),
  equation_ids: z.array(NonEmpty).min(1),
  parameter_domain: z.record(z.unknown()),
  prediction_axes: z.array(NonEmpty).min(1),
  companion_observable: NonEmpty.nullable(),
  maximum_claim: NonEmpty,
  requires_registered_bridge: z.boolean(),
});

const ProperPrior = z.object({
  prior_id: NonEmpty,
  model_id: NonEmpty,
  proper: z.literal(true),
  distribution: NonEmpty,
  parameters: z.record(z.number()),
  frozen_before_unblinding: z.literal(true),
});

const DecisionRule = z.object({
  rule_id: NonEmpty,
  metric: NonEmpty,
  operator: z.enum(["lt", "lte", "gt", "gte", "between"]),
  threshold: z.union([z.number(), z.tuple([z.number(), z.number()])]),
  interpretation: NonEmpty,
});

const Falsifier = z.object({
  falsifier_id: NonEmpty,
  model_id: NonEmpty,
  observable: NonEmpty,
  criterion: NonEmpty,
  requires_power: z.boolean(),
  independent: z.boolean(),
});

export const CasimirDpEvidenceMapStage3Config = z.object({
  schema_version: z.literal(CASIMIR_DP_EVIDENCE_MAP_STAGE3_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal("casimir-dp-evidence-map-stage3-v1"),
  implementation_version: NonEmpty,
  evidence_cutoff: NonEmpty,
  claim_ceiling: CasimirDpStage3ClaimCeiling,
  promotion_allowed: z.literal(false),
  authority_manifest: AuthorityRef,
  upstream_authorities: z.array(AuthorityRef).min(7).superRefine(
    (authorities, context) => {
      const roles = authorities.map((authority) => authority.role);
      if (new Set(roles).size !== roles.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-3 upstream authority roles must be unique",
        });
      }
    },
  ),
  source_registry: z.array(SourceRef).min(8).superRefine(
    (sources, context) => {
      const ids = sources.map((source) => source.source_id);
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-3 source ids must be unique",
        });
      }
    },
  ),
  conventions: z.object({
    units: z.literal("SI"),
    coordinate_frame: NonEmpty,
    metric_signature: z.enum(["-+++", "+---"]),
    phase_sign: z.literal("phase_a_minus_b"),
    boundary_contrast: z.literal("on_minus_off"),
    fourier_transform: NonEmpty,
    angular_frequency_relation: z.literal("omega=2*pi*f"),
    psd_sidedness: z.literal("two_sided"),
    psd_normalization: NonEmpty,
  }),
  evidence_policy: z.object({
    synthetic_can_validate_software_only: z.literal(true),
    synthetic_can_satisfy_measured_gate: z.literal(false),
    unexplained_residual_is_collapse: z.literal(false),
    unexplained_residual_is_manifold_evidence: z.literal(false),
    null_excludes_only_powered_region: z.literal(true),
    compatibility_label: z.literal("not_disfavored_within_powered_region"),
  }),
  blinding: z.object({
    blind_labels: z.array(NonEmpty).length(2),
    mapping_stored_in_repository: z.literal(false),
    custodian_receipt_status: z.literal("sealed"),
    custodian_mapping_sha256: Sha256,
    preregistration_timestamp: z.string().datetime(),
    unblinding_timestamp: z.null(),
    automatic_unblinding_allowed: z.literal(false),
  }),
  preregistration: z.object({
    composite_null_model_id: z.literal("M0_ordinary_physics"),
    composite_null_components: z.tuple([
      z.literal("M_qed_phase"),
      z.literal("M_technical_dephasing"),
      z.literal("M_qed_environmental_decoherence"),
      z.literal("M_ordinary_gravity"),
    ]),
    frozen_models: z.array(FrozenModel).min(6),
    proper_priors: z.array(ProperPrior).min(1),
    nuisance_registry: z.array(z.object({
      nuisance_id: NonEmpty,
      measured_channel: NonEmpty,
      allowed_range: z.tuple([z.number(), z.number()]),
      covariance_source: NonEmpty,
    })).min(3),
    decision_rules: z.array(DecisionRule).min(3),
    falsifiers: z.array(Falsifier).min(6),
    thresholds: z.object({
      minimum_power: z.number().gt(0.5).lte(1),
      maximum_false_positive_rate: z.number().positive().lt(0.5),
      maximum_signature_correlation: z.number().gt(0).lt(1),
      minimum_signature_rank: z.number().int().min(2),
      minimum_distinct_hold_times: z.number().int().min(4),
      minimum_hold_time_span_ratio: z.number().gt(1),
      fixed_delta_rho_relative_tolerance: z.number().positive().lt(1),
      minimum_companion_signal_to_noise: z.number().positive(),
      maximum_green_interpolation_relative_error: z.number().positive().lt(1),
      maximum_green_convergence_relative_error: z.number().positive().lt(1),
      maximum_kramers_kronig_relative_error: z.number().positive().lt(1),
    }),
    fixed_delta_rho_equivalence: z.object({
      required: z.literal(true),
      wavepacket_receipt_required: z.literal(true),
      branch_trajectory_receipt_required: z.literal(true),
      tolerance_source: NonEmpty,
      boundary_induced_state_change_is_confound: z.literal(true),
    }),
    confirmatory_support_requires: z.object({
      independent_replication: z.literal(true),
      applicable_powered_companion_observable: z.literal(true),
      held_out_prediction: z.literal(true),
    }),
  }),
  runtime_fixtures: z.object({
    complex_coherence: FixtureRef,
    qed_green_noise: FixtureRef,
    dp_companion: FixtureRef,
    gravity_upper_bound: FixtureRef,
    model_comparison: FixtureRef,
    manifold_kernel_registry: FixtureRef,
  }),
  deterministic_seeds: z.object({
    synthetic: z.number().int().nonnegative(),
    bootstrap: z.number().int().nonnegative(),
    resampling: z.number().int().nonnegative(),
  }),
  software: z.object({
    runtime: z.literal("typescript"),
    runner: NonEmpty,
    module_ids: z.array(NonEmpty).length(7),
  }),
  run_order: z.array(RunOrderStage).length(
    CASIMIR_DP_EVIDENCE_MAP_STAGE3_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    registry_may_complete_blocked: z.literal(true),
  }),
});

export type CasimirDpEvidenceMapStage3Config = z.infer<
  typeof CasimirDpEvidenceMapStage3Config
>;
