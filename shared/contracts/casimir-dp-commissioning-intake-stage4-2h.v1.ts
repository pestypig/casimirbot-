import { z } from "zod";
import {
  CasimirDpApparatusIdentifiabilityStage4_2BInput,
} from "../casimir-dp-apparatus-identifiability-stage4-2b";
import {
  CASIMIR_DP_STAGE4_2G_PRODUCT_IDS,
} from "./casimir-dp-empirical-feasibility-pilot-stage4-2g.v1";

export const CASIMIR_DP_COMMISSIONING_INTAKE_STAGE4_2H_VERSION =
  "casimir_dp_commissioning_intake_stage4_2h/1" as const;

export const CASIMIR_DP_STAGE4_2H_INSTRUMENT_ROLES = [
  "mass_metrology",
  "dimensional_metrology",
  "material_response_spectrometer",
  "finite_geometry_field_solver",
  "preparation_fidelity_monitor",
  "branch_hold_metrology",
  "boundary_modulation_monitor",
  "environment_sensor_array",
  "complex_coherence_readout",
  "covariance_pipeline",
  "companion_detector",
  "independent_replication_solver",
] as const;

export const CASIMIR_DP_STAGE4_2H_PARTITION_ORDER = [
  "calibration",
  "pilot",
  "confirmatory",
  "independent_replication",
] as const;

export const CASIMIR_DP_STAGE4_2H_RAW_COLUMNS = [
  "packet_id",
  "partition_id",
  "replication_id",
  "window_id",
  "cell_id",
  "blind_boundary_label",
  "sequence_kind",
  "timestamp_utc",
  "complex_coherence_real",
  "complex_coherence_imag",
  "complex_covariance_block_ref",
  "preparation_fidelity",
  "branch_separation_m",
  "hold_time_s",
  "particle_temperature_K",
  "boundary_temperature_K",
  "pressure_Pa",
  "vibration_channel_ref",
  "charge_state_ref",
  "cavity_gap_channel_ref",
  "polarization_stokes_ref",
  "readout_power_W",
  "sensor_dark_channel_ref",
  "companion_channel_ref",
  "calibration_ancestry_ref",
  "custody_event_id",
  "exclusion_code",
  "source_artifact_sha256",
] as const;

export const CASIMIR_DP_STAGE4_2H_RUN_ORDER = [
  "verify_immutable_stage4_2g_authority_tuples",
  "load_frozen_single_apparatus_identity",
  "validate_blank_commissioning_dossier",
  "generate_synthetic_dry_run_without_empirical_authority",
  "freeze_instrument_role_and_product_slot_order",
  "freeze_partition_and_raw_column_order",
  "validate_calibration_and_custody_ancestry",
  "validate_local_artifact_hashes_for_measured_dossiers",
  "compile_stage4_2g_packet_only_when_complete",
  "recompute_stage4_2g_gates_without_refit",
  "preserve_zero_casimir_to_collapse_transfer_edges",
  "write_content_addressed_report_trace_and_receipt",
] as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const NullableSha256 = Sha256.nullable();

const AuthorityTuple = z.object({
  role: z.string().min(1),
  path: z.string().min(1),
  sha256: Sha256,
  required_at_runtime: z.literal(true),
}).strict();

const InstrumentRecord = z.object({
  role: z.enum(CASIMIR_DP_STAGE4_2H_INSTRUMENT_ROLES),
  authority_class: z.enum([
    "unassigned",
    "synthetic_dry_run",
    "commissioned_measured",
  ]),
  instrument_id: z.string().min(1).nullable(),
  manufacturer: z.string().min(1).nullable(),
  model: z.string().min(1).nullable(),
  serial_number: z.string().min(1).nullable(),
  calibration_artifact_ref: z.string().min(1).nullable(),
  calibration_artifact_sha256: NullableSha256,
  calibration_valid_from: z.string().datetime().nullable(),
  calibration_valid_until: z.string().datetime().nullable(),
  calibration_operator_id: z.string().min(1).nullable(),
  custody_event_ids: z.array(z.string().min(1)),
}).strict().superRefine((record, context) => {
  const unassigned = record.authority_class === "unassigned";
  const bound = [
    record.instrument_id,
    record.manufacturer,
    record.model,
    record.serial_number,
    record.calibration_artifact_ref,
    record.calibration_artifact_sha256,
    record.calibration_valid_from,
    record.calibration_valid_until,
    record.calibration_operator_id,
  ].every((value) => value !== null);
  if (unassigned === bound) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Unassigned instruments require empty identity/calibration fields; synthetic and commissioned instruments require every field.",
    });
  }
  if (unassigned !== (record.custody_event_ids.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Assigned instruments require custody events; unassigned instruments may not claim custody.",
    });
  }
  if (
    record.authority_class === "synthetic_dry_run" &&
    !record.calibration_artifact_ref?.startsWith("synthetic://")
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Synthetic instrument calibrations require synthetic:// refs.",
    });
  }
  if (
    record.authority_class === "commissioned_measured" &&
    (
      record.calibration_artifact_ref?.startsWith("synthetic://") ||
      record.calibration_artifact_ref?.startsWith("unacquired://")
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Commissioned instruments require non-synthetic calibration refs.",
    });
  }
});

const ProductSlot = z.object({
  product_id: z.enum(CASIMIR_DP_STAGE4_2G_PRODUCT_IDS),
  authority_class: z.enum([
    "unacquired",
    "synthetic_dry_run",
    "measured_empirical",
    "registered_protocol",
  ]),
  artifact_ref: z.string().min(1).nullable(),
  artifact_sha256: NullableSha256,
  uncertainty_model_ref: z.string().min(1).nullable(),
  calibration_ancestry_refs: z.array(z.string().min(1)),
  custody_event_ids: z.array(z.string().min(1)),
  acquired_at: z.string().datetime().nullable(),
  operator_id: z.string().min(1).nullable(),
  instrument_roles: z.array(
    z.enum(CASIMIR_DP_STAGE4_2H_INSTRUMENT_ROLES),
  ).min(1),
  independent_of_primary_channel: z.boolean(),
}).strict().superRefine((slot, context) => {
  const unacquired = slot.authority_class === "unacquired";
  const bound = [
    slot.artifact_ref,
    slot.artifact_sha256,
    slot.uncertainty_model_ref,
    slot.acquired_at,
    slot.operator_id,
  ].every((value) => value !== null);
  if (unacquired === bound) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Unacquired slots require empty artifact fields; every other slot requires an artifact, hash, uncertainty model, timestamp, and operator.",
    });
  }
  if (
    unacquired !==
      (
        slot.calibration_ancestry_refs.length === 0 &&
        slot.custody_event_ids.length === 0
      )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Bound product slots require calibration ancestry and custody; unacquired slots may claim neither.",
    });
  }
  if (
    slot.authority_class === "synthetic_dry_run" &&
    !slot.artifact_ref?.startsWith("synthetic://")
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Synthetic product slots require synthetic:// refs.",
    });
  }
  if (
    (slot.authority_class === "measured_empirical" ||
      slot.authority_class === "registered_protocol") &&
    (
      slot.artifact_ref?.startsWith("synthetic://") ||
      slot.artifact_ref?.startsWith("unacquired://")
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Measured/protocol product slots require non-synthetic refs.",
    });
  }
});

const PartitionPlan = z.object({
  partition_id: z.enum(CASIMIR_DP_STAGE4_2H_PARTITION_ORDER),
  planned_paired_windows: z.number().int().positive(),
  response_fitting_allowed: z.boolean(),
  covariance_fitting_allowed: z.boolean(),
  confirmatory_scoring_allowed: z.boolean(),
  independent_replication: z.boolean(),
  blind_mapping_available_to_analysis: z.literal(false),
}).strict();

export const CasimirDpCommissioningDossierStage4_2H = z.object({
  schema_version: z.literal(
    "casimir_dp_commissioning_dossier_stage4_2h/1",
  ),
  campaign_id: z.literal(
    "casimir-dp-commissioning-intake-stage4-2h-v1",
  ),
  dossier_id: z.string().min(1),
  generated_at: z.string().datetime(),
  evidence_class: z.enum([
    "blank_commissioning_template",
    "synthetic_dry_run",
    "measured_commissioning_dossier",
  ]),
  stage4_2g_identity_ref: z.object({
    identity_id: z.literal(
      "silica_high_mass_identifiable_single_object_v1",
    ),
    unacquired_packet_path: z.literal(
      "configs/research/fixtures/casimir-dp-stage4-2g-pilot-unacquired.v1.json",
    ),
    unacquired_packet_sha256: Sha256,
  }).strict(),
  instrument_registry: z.array(InstrumentRecord).length(
    CASIMIR_DP_STAGE4_2H_INSTRUMENT_ROLES.length,
  ),
  product_slots: z.array(ProductSlot).length(
    CASIMIR_DP_STAGE4_2G_PRODUCT_IDS.length,
  ),
  partition_plan: z.array(PartitionPlan).length(
    CASIMIR_DP_STAGE4_2H_PARTITION_ORDER.length,
  ),
  raw_columns: z.array(z.enum(CASIMIR_DP_STAGE4_2H_RAW_COLUMNS)).length(
    CASIMIR_DP_STAGE4_2H_RAW_COLUMNS.length,
  ),
  cell_order_ref: z.string().min(1).nullable(),
  cell_order_sha256: NullableSha256,
  identifiability_input:
    CasimirDpApparatusIdentifiabilityStage4_2BInput.nullable(),
  custody: z.object({
    custodian_id: z.string().min(1).nullable(),
    blind_map_commitment_sha256: NullableSha256,
    freeze_receipt_ref: z.string().min(1).nullable(),
    freeze_receipt_sha256: NullableSha256,
    event_ids: z.array(z.string().min(1)),
    exclusions_frozen: z.boolean(),
    covariance_frozen: z.boolean(),
    automatic_unblinding_allowed: z.literal(false),
    confirmatory_refit_allowed: z.literal(false),
  }).strict(),
  independent_replication: z.object({
    primary_group_id: z.string().min(1).nullable(),
    replication_group_id: z.string().min(1).nullable(),
    implementation_independence_declared: z.boolean(),
    shared_raw_data_before_lock: z.literal(false),
  }).strict(),
  dp_model_frozen: z.literal(true),
  transfer_kernel_registered: z.literal(false),
  observable_bridge_edges_added: z.literal(0),
}).strict().superRefine((dossier, context) => {
  if (
    JSON.stringify(dossier.instrument_registry.map((row) => row.role)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2H_INSTRUMENT_ROLES)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["instrument_registry"],
      message: "Instrument roles must preserve frozen Stage-4.2H order.",
    });
  }
  if (
    JSON.stringify(dossier.product_slots.map((row) => row.product_id)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2G_PRODUCT_IDS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["product_slots"],
      message: "Product slots must preserve Stage-4.2G order.",
    });
  }
  if (
    JSON.stringify(dossier.partition_plan.map((row) => row.partition_id)) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2H_PARTITION_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["partition_plan"],
      message: "Partition plan must preserve frozen order.",
    });
  }
  if (
    JSON.stringify(dossier.raw_columns) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2H_RAW_COLUMNS)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["raw_columns"],
      message: "Raw columns must preserve frozen order.",
    });
  }

  const expectedInstrumentAuthority =
    dossier.evidence_class === "blank_commissioning_template"
      ? "unassigned"
      : dossier.evidence_class === "synthetic_dry_run"
      ? "synthetic_dry_run"
      : "commissioned_measured";
  if (
    dossier.instrument_registry.some(
      (row) => row.authority_class !== expectedInstrumentAuthority,
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["instrument_registry"],
      message: "Instrument authority must match the dossier evidence class.",
    });
  }

  const expectedProductAuthority =
    dossier.evidence_class === "blank_commissioning_template"
      ? "unacquired"
      : dossier.evidence_class === "synthetic_dry_run"
      ? "synthetic_dry_run"
      : null;
  if (
    expectedProductAuthority !== null &&
    dossier.product_slots.some(
      (row) => row.authority_class !== expectedProductAuthority,
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["product_slots"],
      message: "Blank and synthetic dossier product authority may not mix.",
    });
  }
  if (
    dossier.evidence_class === "measured_commissioning_dossier" &&
    dossier.product_slots.some(
      (row) =>
        row.authority_class !== "measured_empirical" &&
        row.authority_class !== "registered_protocol",
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["product_slots"],
      message:
        "Measured commissioning dossiers require measured or registered-protocol product slots.",
    });
  }
  const protocolOnlyProductIds = new Set([
    "blind_custody_freeze",
    "independent_solver_replication",
  ]);
  if (
    dossier.evidence_class === "measured_commissioning_dossier" &&
    dossier.product_slots.some(
      (row) =>
        row.authority_class === "registered_protocol" &&
        !protocolOnlyProductIds.has(row.product_id),
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["product_slots"],
      message:
        "Registered-protocol authority is limited to blind custody/freeze and independent replication; all physical, coherence, covariance, and metrology products require measured empirical authority.",
    });
  }

  const hasDataBindings =
    dossier.cell_order_ref !== null &&
    dossier.cell_order_sha256 !== null &&
    dossier.identifiability_input !== null;
  if (
    (dossier.evidence_class !== "blank_commissioning_template") !==
      hasDataBindings
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Synthetic and measured dossiers require cell order plus identifiability input; blank templates require neither.",
    });
  }
  if (
    dossier.evidence_class === "measured_commissioning_dossier" &&
    (
      dossier.custody.custodian_id === null ||
      dossier.custody.blind_map_commitment_sha256 === null ||
      dossier.custody.freeze_receipt_ref === null ||
      dossier.custody.freeze_receipt_sha256 === null ||
      dossier.custody.event_ids.length === 0 ||
      !dossier.custody.exclusions_frozen ||
      !dossier.custody.covariance_frozen ||
      dossier.independent_replication.primary_group_id === null ||
      dossier.independent_replication.replication_group_id === null ||
      !dossier.independent_replication.implementation_independence_declared
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Measured dossiers require blind commitment, freeze receipt, custody, frozen exclusions/covariance, and declared independent replication.",
    });
  }
});

export type CasimirDpCommissioningDossierStage4_2H = z.infer<
  typeof CasimirDpCommissioningDossierStage4_2H
>;

export const CasimirDpCommissioningIntakeStage4_2HConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_COMMISSIONING_INTAKE_STAGE4_2H_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study-v1"),
  campaign_id: z.literal(
    "casimir-dp-commissioning-intake-stage4-2h-v1",
  ),
  implementation_version: z.literal("stage4.2h-v1"),
  evidence_cutoff: z.string().datetime(),
  evidence_class: z.literal(
    "commissioning_template_and_synthetic_dry_run_only",
  ),
  claim_ceiling: z.literal(
    "commissioning_intake_and_stage4_2g_packet_compilation_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: z.object({
    path: z.literal(
      "configs/research/casimir-dp-stage4-2h-authorities.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  upstream_authorities: z.array(AuthorityTuple).length(6),
  method_authorities: z.array(AuthorityTuple).length(1),
  immutable_stage4_2g: z.object({
    campaign_run_id: z.literal(
      "casimir-dp-empirical-feasibility-pilot-stage4-2g-v1-20260730T030000000Z",
    ),
    report_sha256: Sha256,
    campaign_receipt_sha256: Sha256,
    verification_receipt_sha256: Sha256,
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
  blank_dossier: z.object({
    path: z.literal(
      "configs/research/fixtures/casimir-dp-stage4-2h-commissioning-blank.v1.json",
    ),
    sha256: Sha256,
  }).strict(),
  partition_windows: z.object({
    calibration: z.literal(200),
    pilot: z.literal(400),
    confirmatory: z.literal(1600),
    independent_replication: z.literal(1600),
  }).strict(),
  run_order: z.array(z.enum(CASIMIR_DP_STAGE4_2H_RUN_ORDER)).length(
    CASIMIR_DP_STAGE4_2H_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    commissioning_contract: z.literal("pass"),
    synthetic_dry_run: z.literal("pass"),
    instrument_registry: z.literal("not_ready"),
    calibration_ancestry: z.literal("not_ready"),
    custody_and_blind_freeze: z.literal("not_ready"),
    raw_data_availability: z.literal("not_ready"),
    stage4_2g_packet_compilation: z.literal("not_ready"),
    empirical_pilot_readiness: z.literal("not_ready"),
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
  }).strict(),
}).strict().superRefine((config, context) => {
  if (
    JSON.stringify(config.run_order) !==
      JSON.stringify(CASIMIR_DP_STAGE4_2H_RUN_ORDER)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["run_order"],
      message: "Stage-4.2H run order must preserve frozen order.",
    });
  }
});

export type CasimirDpCommissioningIntakeStage4_2HConfig = z.infer<
  typeof CasimirDpCommissioningIntakeStage4_2HConfig
>;
