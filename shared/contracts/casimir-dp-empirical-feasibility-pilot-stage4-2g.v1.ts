import { z } from "zod";
import {
  CasimirDpApparatusIdentifiabilityStage4_2BInput,
} from "../casimir-dp-apparatus-identifiability-stage4-2b";

export const CASIMIR_DP_EMPIRICAL_PILOT_STAGE4_2G_VERSION =
  "casimir_dp_empirical_feasibility_pilot_stage4_2g/1" as const;

export const CASIMIR_DP_STAGE4_2G_PRODUCT_IDS = [
  "apparatus_mass_geometry",
  "material_response",
  "finite_geometry_maxwell_green",
  "state_preparation",
  "branch_hold_metrology",
  "boundary_modulation_transfer",
  "environment_backgrounds",
  "complex_coherence_response",
  "block_covariance",
  "companion_detector",
  "blind_custody_freeze",
  "independent_solver_replication",
  "complete_apparatus_stress_energy",
] as const;

export const CASIMIR_DP_STAGE4_2G_CORE_PILOT_PRODUCT_IDS =
  CASIMIR_DP_STAGE4_2G_PRODUCT_IDS.filter(
    (id) => id !== "complete_apparatus_stress_energy",
  );

export const CASIMIR_DP_STAGE4_2G_RUN_ORDER = [
  "verify_immutable_stage4_2f_authority_tuples",
  "freeze_one_apparatus_design_identity",
  "regenerate_dp_coherence_and_companion_from_one_mass_density_identity",
  "freeze_zero_casimir_to_collapse_transfer_edges",
  "validate_unacquired_and_synthetic_packet_contracts",
  "verify_packet_artifact_hashes_and_custody_ancestry",
  "separate_design_freeze_from_physical_identity_verification",
  "recompute_whitened_complex_identifiability_when_packet_present",
  "evaluate_finite_geometry_material_and_modulation_readiness",
  "evaluate_state_preparation_and_branch_metrology_readiness",
  "evaluate_background_covariance_and_companion_readiness",
  "evaluate_blinding_and_independent_replication_readiness",
  "keep_complete_stress_energy_as_separate_manifold_gate",
  "emit_pilot_go_no_go_without_empirical_promotion",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const PositiveFinite = z.number().finite().positive();
const NullableSha256 = Sha256.nullable();

const AuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

const ApparatusIdentity = z.object({
  identity_id: z.literal("silica_high_mass_identifiable_single_object_v1"),
  candidate_id: z.literal("silica_high_mass_identifiable"),
  material_id: z.literal("silica"),
  geometry: z.literal("sphere"),
  radius_m: z.literal(2.76302362398029e-7),
  mass_kg: z.literal(1.94385e-16),
  branch_separation_m: z.literal(1.6e-7),
  hold_time_s: z.literal(0.25),
  primary_sequence: z.literal("ramsey"),
  cavity_gap_m: z.literal(1.2e-6),
  boundary_modulation_Hz: z.literal(0.5),
  environment_temperature_K: z.literal(4),
  pressure_Pa: z.literal(2e-11),
  vibration_acceleration_asd_m_s2_sqrtHz: z.literal(5e-10),
  readout_power_W: z.literal(5e-9),
  readout_wavelength_m: z.literal(1.55e-6),
  polarization_program: z.literal("circular_control_pair"),
}).strict();

const AcquisitionProduct = z.object({
  product_id: z.enum(CASIMIR_DP_STAGE4_2G_PRODUCT_IDS),
  authority_class: z.enum([
    "unacquired",
    "synthetic_validation",
    "measured_empirical",
    "registered_protocol",
  ]),
  artifact_ref: z.string().min(1).nullable(),
  artifact_sha256: NullableSha256,
  calibration_ref: z.string().min(1).nullable(),
  uncertainty_model_ref: z.string().min(1).nullable(),
  custody_event_ids: z.array(z.string().min(1)),
  acquired_at: z.string().datetime().nullable(),
  operator_id: z.string().min(1).nullable(),
  instrument_ids: z.array(z.string().min(1)),
  independent_of_primary_channel: z.boolean(),
}).strict().superRefine((product, context) => {
  const bound = product.authority_class !== "unacquired";
  if (
    bound !==
      (
        product.artifact_ref !== null &&
        product.artifact_sha256 !== null &&
        product.acquired_at !== null &&
        product.operator_id !== null
      )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Acquired, synthetic, or registered products require a provenance-bound artifact, hash, timestamp, and operator; unacquired products require none.",
    });
  }
  if (
    product.authority_class === "measured_empirical" &&
    (
      product.artifact_ref?.startsWith("synthetic://") ||
      product.artifact_ref?.startsWith("unacquired://") ||
      product.custody_event_ids.length === 0 ||
      product.instrument_ids.length === 0
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Measured products cannot cite synthetic/unacquired artifacts and require custody plus instrument identity.",
    });
  }
  if (
    product.authority_class === "synthetic_validation" &&
    !product.artifact_ref?.startsWith("synthetic://")
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Synthetic validation products must use synthetic:// references.",
    });
  }
});

export const CasimirDpEmpiricalPilotPacketStage4_2G = z.object({
  schema_version: z.literal("casimir_dp_empirical_pilot_packet_stage4_2g/1"),
  campaign_id: z.literal(
    "casimir-dp-empirical-feasibility-pilot-stage4-2g-v1",
  ),
  packet_id: z.string().min(1),
  generated_at: z.string().datetime(),
  evidence_class: z.enum([
    "unacquired_template",
    "synthetic_validation",
    "measured_empirical_packet",
  ]),
  partition: z.enum([
    "calibration",
    "pilot",
    "confirmatory",
    "independent_replication",
  ]),
  blinded: z.boolean(),
  apparatus_identity: ApparatusIdentity,
  products: z.array(AcquisitionProduct).length(
    CASIMIR_DP_STAGE4_2G_PRODUCT_IDS.length,
  ),
  identifiability_input:
    CasimirDpApparatusIdentifiabilityStage4_2BInput.nullable(),
  exclusions_frozen: z.boolean(),
  covariance_frozen: z.boolean(),
  dp_model_frozen: z.literal(true),
  transfer_kernel_registered: z.literal(false),
  automatic_unblinding_allowed: z.literal(false),
  confirmatory_refit_allowed: z.literal(false),
}).strict().superRefine((packet, context) => {
  if (
    JSON.stringify(packet.products.map((row) => row.product_id)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2G_PRODUCT_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["products"],
      message: "Stage-4.2G products must preserve frozen order.",
    });
  }
  const expectedAuthority =
    packet.evidence_class === "unacquired_template"
      ? "unacquired"
      : packet.evidence_class === "synthetic_validation"
      ? "synthetic_validation"
      : null;
  if (
    expectedAuthority !== null &&
    packet.products.some(
      (row) => row.authority_class !== expectedAuthority,
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["products"],
      message:
        "Template and synthetic packets may not mix product authority classes.",
    });
  }
  if (
    packet.evidence_class === "measured_empirical_packet" &&
    packet.products.some(
      (row) =>
        row.authority_class !== "measured_empirical" &&
        row.authority_class !== "registered_protocol",
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["products"],
      message:
        "Measured packets may contain measured products and registered protocols only.",
    });
  }
  if (
    (packet.evidence_class === "unacquired_template") !==
      (packet.identifiability_input === null)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["identifiability_input"],
      message:
        "Only an unacquired template omits the identifiability input.",
    });
  }
  if (
    packet.partition === "confirmatory" &&
    (
      !packet.blinded ||
      !packet.exclusions_frozen ||
      !packet.covariance_frozen
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Confirmatory packets must remain blinded with exclusions and covariance frozen.",
    });
  }
});

export type CasimirDpEmpiricalPilotPacketStage4_2G = z.infer<
  typeof CasimirDpEmpiricalPilotPacketStage4_2G
>;

export const CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_EMPIRICAL_PILOT_STAGE4_2G_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal(
    "casimir-dp-empirical-feasibility-pilot-stage4-2g-v1",
  ),
  implementation_version: z.literal("stage4.2g-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal(
    "acquisition_readiness_and_synthetic_ingestion_validation",
  ),
  claim_ceiling: z.literal(
    "frozen_single_apparatus_prediction_and_empirical_pilot_protocol_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    path: z.literal(
      "configs/research/casimir-dp-stage4-2g-authorities.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  upstream_authorities: z.array(AuthorityTuple).length(6),
  method_authorities: z.array(AuthorityTuple).length(2),
  immutable_stage4_2f: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-v1-20260730T023000000Z",
    ),
    report_sha256: Sha256,
    campaign_receipt_sha256: Sha256,
    verification_receipt_sha256: Sha256,
    software_and_equation_recovery: z.literal("pass"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
  apparatus_identity: ApparatusIdentity,
  dp_model: z.object({
    model_id: z.literal("diosi_1989_gaussian_regularized_nondissipative"),
    R0_m: z.literal(1e-7),
    numerical_softening_m: z.literal(1e-9),
    integration_upper_u: z.literal(8),
    even_intervals: z.literal(4096),
    crosscheck_relative_tolerance: z.literal(1e-5),
    parameter_region_authority: z.literal("sensitivity_only_not_admitted"),
    boundary_variable_in_generator: z.literal(false),
    transfer_kernel_registered: z.literal(false),
  }).strict(),
  thresholds: z.object({
    maximum_abs_whitened_signature_cosine: z.literal(0.97),
    augmented_design_condition_number_max: z.literal(100),
    minimum_power: z.literal(0.8),
    maximum_false_positive_rate: z.literal(0.05),
    minimum_companion_snr: z.literal(5),
    planned_paired_windows: z.literal(1600),
    companion_independent_samples: z.literal(100),
  }).strict(),
  packets: z.object({
    unacquired_template_path: z.string().min(1),
    unacquired_template_sha256: Sha256,
    synthetic_validation_path: z.string().min(1),
    synthetic_validation_sha256: Sha256,
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2G_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2G_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_and_packet_contract: z.literal("pass"),
    design_identity_freeze: z.literal("pass"),
    dp_companion_internal_consistency: z.literal("pass"),
    physical_apparatus_identity: z.literal("not_ready"),
    finite_geometry_maxwell_authority: z.literal("not_ready"),
    measured_material_green_authority: z.literal("not_ready"),
    state_preparation_authority: z.literal("not_ready"),
    branch_hold_metrology_authority: z.literal("not_ready"),
    quasistatic_modulation_authority: z.literal("not_ready"),
    measured_background_covariance: z.literal("not_ready"),
    companion_detector_authority: z.literal("not_ready"),
    empirical_pilot_readiness: z.literal("not_ready"),
    complete_apparatus_stress_energy: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (
    JSON.stringify(config.run_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2G_RUN_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2G run order must preserve frozen order.",
    });
  }
});

export type CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig = z.infer<
  typeof CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig
>;
