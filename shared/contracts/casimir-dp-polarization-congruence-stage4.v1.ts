import { z } from "zod";

export const CASIMIR_DP_POLARIZATION_CONGRUENCE_STAGE4_VERSION =
  "casimir_dp_polarization_congruence_stage4/1" as const;

export const CASIMIR_DP_POLARIZATION_CONGRUENCE_STAGE4_RUN_ORDER = [
  "hash_link_immutable_stage3_authorities",
  "freeze_units_frequency_psd_frame_handedness_and_mirror_conventions",
  "freeze_polarization_states_randomization_blinding_and_calibration",
  "validate_jones_stokes_mueller_and_matched_control_sidecars",
  "run_polarization_resolved_macroscopic_qed_control",
  "run_planck_fdt_and_stefan_boltzmann_thermal_closure",
  "run_tensor_dimensional_and_semantic_congruence",
  "freeze_helicity_mirror_material_temperature_and_companion_signatures",
  "version_expanded_null_unchanged_dp_and_registered_bridge_comparator",
  "run_blinded_synthetic_prediction_comparison",
  "populate_stage4_outcome_falsifier_and_nonclaim_ledger",
  "write_hash_backed_stage4_receipt_report_and_evidence_state",
] as const;

const NonEmpty = z.string().min(1);
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const RunOrderStage = z.enum(
  CASIMIR_DP_POLARIZATION_CONGRUENCE_STAGE4_RUN_ORDER,
);

export const CasimirDpStage4EvidenceClass = z.enum([
  "synthetic",
  "measured",
  "design_assumption",
  "source_backed_calculation",
]);

const AuthorityRef = z.object({
  role: NonEmpty,
  path: NonEmpty,
  sha256: Sha256,
  tracked: z.boolean(),
  required_at_runtime: z.boolean(),
});

const RequiredSourceAuthority = <
  Role extends string,
  Path extends string,
  Tracked extends boolean,
>(
  role: Role,
  path: Path,
  tracked: Tracked,
) =>
  AuthorityRef.extend({
    role: z.literal(role),
    path: z.literal(path),
    tracked: z.literal(tracked),
    required_at_runtime: z.literal(true),
  });

const FixtureRef = z.object({
  path: NonEmpty,
  sha256: Sha256,
  schema_version: NonEmpty,
  evidence_class: z.literal("synthetic"),
});

const SourceRef = z.object({
  source_id: NonEmpty,
  url: z.string().url(),
  supports: NonEmpty,
  does_not_support: NonEmpty,
});

const PredictionAxis = z.object({
  axis_id: NonEmpty,
  ordinary_physics_signature: NonEmpty,
  unchanged_dp_signature: NonEmpty,
  bridge_signature: NonEmpty,
  required_control: NonEmpty,
  falsifier: NonEmpty,
});

export const CasimirDpStage4SyntheticBlindingState = z.object({
  lane_status: z.literal("synthetic_contract_only"),
  blind_labels: z.tuple([
    z.literal("POLARIZATION_CELL_ALPHA"),
    z.literal("POLARIZATION_CELL_BETA"),
  ]),
  mapping_stored_in_repository: z.literal(false),
  custodian_receipt_status: z.literal("not_created"),
  custodian_receipt_path: z.null(),
  custodian_mapping_sha256: z.null(),
  preregistration_timestamp: z.string().datetime(),
  measured_comparison_allowed: z.literal(false),
  unblinding_timestamp: z.null(),
  automatic_unblinding_allowed: z.literal(false),
}).strict();

export const CasimirDpStage4BlindingState = z.discriminatedUnion(
  "lane_status",
  [CasimirDpStage4SyntheticBlindingState],
);

export const CasimirDpPolarizationCongruenceStage4Config = z.object({
  schema_version: z.literal(
    CASIMIR_DP_POLARIZATION_CONGRUENCE_STAGE4_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal(
    "casimir-dp-polarization-congruence-stage4-v1",
  ),
  implementation_version: NonEmpty,
  evidence_cutoff: NonEmpty,
  claim_ceiling: z.literal("diagnostic"),
  promotion_allowed: z.literal(false),
  stage3_authority_manifest: RequiredSourceAuthority(
    "stage4_authority_manifest",
    "configs/research/casimir-dp-stage4-authorities.v1.json",
    false,
  ),
  upstream_authorities: z.tuple([
    RequiredSourceAuthority(
      "stage3_config",
      "configs/research/casimir-dp-evidence-map-stage3.v1.json",
      false,
    ),
    RequiredSourceAuthority(
      "stage3_immutable_report_json",
      "artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-report.json",
      false,
    ),
    RequiredSourceAuthority(
      "stage3_immutable_report_markdown",
      "artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-report.md",
      false,
    ),
    RequiredSourceAuthority(
      "stage3_immutable_receipt",
      "artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-receipt.json",
      false,
    ),
    RequiredSourceAuthority(
      "stage3_downstream_verification_receipt",
      "docs/research/casimir-dp-evidence-map-stage3-verification-receipt.json",
      false,
    ),
  ]),
  source_registry: z.array(SourceRef).min(8).superRefine(
    (sources, context) => {
      const sourceIds = sources.map((source) => source.source_id);
      if (new Set(sourceIds).size !== sourceIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-4 source ids must be unique",
        });
      }
    },
  ),
  conventions: z.object({
    units: z.literal("SI"),
    coordinate_frame: NonEmpty,
    metric_signature: z.literal("-+++"),
    angular_frequency_relation: z.literal("omega=2*pi*nu"),
    frequency_density_conversion: z.literal(
      "S_omega(omega)=S_nu(nu)/(2*pi)",
    ),
    psd_sidedness: z.literal("two_sided"),
    polarization_basis: z.literal("transverse_jones_stokes"),
    handedness_reference: z.literal("right_handed_relative_to_plus_k"),
    stokes_v_convention: z.literal("V=2*Im(E_x*conj(E_y))"),
    mirror_transform: z.literal("helicity_flips_under_active_mirror"),
    cavity_contrast: z.literal("on_minus_off"),
    helicity_contrast: z.literal("R_minus_L"),
    double_contrast: z.literal(
      "(R_minus_L)_cavity_on-(R_minus_L)_cavity_off",
    ),
  }),
  evidence_policy: z.object({
    synthetic_can_validate_software_only: z.literal(true),
    synthetic_can_satisfy_measured_gate: z.literal(false),
    same_dimension_implies_connection: z.literal(false),
    polarization_residual_is_collapse: z.literal(false),
    polarization_residual_is_manifold_evidence: z.literal(false),
    standard_dp_is_polarization_blind_at_fixed_delta_rho: z.literal(true),
    bridge_requires_registered_numerical_kernel: z.literal(true),
    blackbody_closure_is_collapse_bridge: z.literal(false),
  }),
  blinding: CasimirDpStage4BlindingState,
  preregistration: z.object({
    expanded_null_model_id: z.literal("M0_prime_ordinary_physics"),
    expanded_null_components: z.tuple([
      z.literal("M_qed_phase"),
      z.literal("M_technical_dephasing"),
      z.literal("M_qed_environmental_decoherence"),
      z.literal("M_ordinary_gravity"),
      z.literal("M_polarization_resolved_qed"),
      z.literal("M_thermal_radiative_fdt"),
    ]),
    named_dp_model_id: z.literal("M_dp_regularized_synthetic_v1"),
    named_dp_parameter_manifest_sha256: z.literal(
      "4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6",
    ),
    named_dp_reuse_policy: z.literal("reused_without_mutation"),
    named_dp_boundary_rule: z.literal(
      "no_polarization_or_boundary_term_at_fixed_delta_rho",
    ),
    bridge_registry_model_id: z.literal("M_bridge_tensor_noise_v1"),
    bridge_admission_rule: z.literal(
      "registered_numeric_kernel_frozen_before_unblinding",
    ),
    compatibility_wording: z.literal(
      "not_disfavored_within_powered_region",
    ),
    prediction_axes: z.array(PredictionAxis).min(5),
  }),
  runtime_fixtures: z.object({
    polarization_qed: FixtureRef.extend({
      schema_version: z.literal("casimir_dp_polarization_qed_control/1"),
    }),
    thermal_radiative: FixtureRef.extend({
      schema_version: z.literal("casimir_dp_radiative_thermal_closure/1"),
    }),
    tensor_congruence: FixtureRef.extend({
      schema_version: z.literal(
        "casimir_dp_tensor_dimensional_congruence/1",
      ),
    }),
  }),
  deterministic_seeds: z.object({
    synthetic: z.number().int().nonnegative(),
    randomization: z.number().int().nonnegative(),
    resampling: z.number().int().nonnegative(),
  }),
  software: z.object({
    runtime: z.literal("typescript"),
    runner: z.literal(
      "scripts/research/run-casimir-dp-polarization-congruence-stage4.ts",
    ),
    module_ids: z.tuple([
      z.literal("shared/casimir-dp-polarization-qed-control.ts"),
      z.literal("shared/casimir-dp-radiative-thermal-closure.ts"),
      z.literal("shared/casimir-dp-tensor-dimensional-congruence.ts"),
      z.literal("shared/casimir-dp-polarization-congruence-stage4.ts"),
    ]),
    source_authorities: z.tuple([
      RequiredSourceAuthority(
        "polarization_qed_runtime",
        "shared/casimir-dp-polarization-qed-control.ts",
        false,
      ),
      RequiredSourceAuthority(
        "thermal_radiative_runtime",
        "shared/casimir-dp-radiative-thermal-closure.ts",
        false,
      ),
      RequiredSourceAuthority(
        "thermal_physics_constants",
        "shared/physics-const.ts",
        true,
      ),
      RequiredSourceAuthority(
        "tensor_congruence_runtime",
        "shared/casimir-dp-tensor-dimensional-congruence.ts",
        false,
      ),
      RequiredSourceAuthority(
        "stage4_orchestrator",
        "shared/casimir-dp-polarization-congruence-stage4.ts",
        false,
      ),
      RequiredSourceAuthority(
        "stage4_contract",
        "shared/contracts/casimir-dp-polarization-congruence-stage4.v1.ts",
        false,
      ),
      RequiredSourceAuthority(
        "stage4_runner",
        "scripts/research/run-casimir-dp-polarization-congruence-stage4.ts",
        false,
      ),
    ]),
    source_snapshot: z.object({
      git_head: z.string().regex(/^[a-f0-9]{40}$/),
      worktree_state: z.literal(
        "dirty_uncommitted_source_hashes_authoritative",
      ),
      authority_mode: z.literal("content_hashes"),
    }),
  }),
  run_order: z.array(RunOrderStage).length(
    CASIMIR_DP_POLARIZATION_CONGRUENCE_STAGE4_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_and_synthetic_predictions: z.literal("pass"),
    measured_evidence: z.literal("not_ready"),
    ordinary_physics_closure: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    publication_claim: z.literal("diagnostic_protocol_only"),
  }),
});

export type CasimirDpPolarizationCongruenceStage4Config = z.infer<
  typeof CasimirDpPolarizationCongruenceStage4Config
>;
