import { createHash } from "node:crypto";
import { z } from "zod";
import {
  CasimirDpStage4_2CApparatusCandidate,
} from "./contracts/casimir-dp-identifiability-redesign-stage4-2c.v1";

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const CasimirDpAcquisitionPacketsStage4_2CInput = z.object({
  schema_version: z.literal("casimir_dp_acquisition_packets_stage4_2c/1"),
  evidence_class: z.literal("synthetic_fixture"),
  selected_candidate: CasimirDpStage4_2CApparatusCandidate,
  selected_candidate_receipt_sha256: Sha256,
  control_response_receipt_sha256: Sha256,
  control_covariance_receipt_sha256: Sha256,
  stage4_2b_report_sha256: Sha256,
  baseline_primary_cell_ids: z.array(z.string().min(1)).length(216),
  control_cell_ids: z.array(z.string().min(1)).length(30),
  required_paired_windows: z.number().int().positive(),
  packet_policy: z.object({
    partitions: z.tuple([
      z.literal("calibration"),
      z.literal("pilot"),
      z.literal("confirmatory"),
      z.literal("independent_replication"),
    ]),
    freeze_before_confirmatory_ingestion: z.literal(true),
    confirmatory_data_available: z.boolean(),
    automatic_unblinding_allowed: z.literal(false),
    independent_replication_required: z.literal(true),
    exclusions_frozen_from_calibration_and_pilot_only: z.literal(true),
  }).strict(),
  freeze_completed: z.boolean(),
  custodian_authorization_present: z.literal(false),
}).strict();

export type CasimirDpAcquisitionPacketsStage4_2CInput = z.infer<
  typeof CasimirDpAcquisitionPacketsStage4_2CInput
>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") {
    return Object.is(value, -0) ? 0 : value;
  }
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  );
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

const REQUIRED_FIELDS = [
  "packet_id",
  "partition_id",
  "window_id",
  "replication_id",
  "cell_id",
  "blind_boundary_label",
  "sequence_kind",
  "timestamp_utc",
  "complex_coherence_real",
  "complex_coherence_imag",
  "complex_covariance_block_ref",
  "particle_temperature_K",
  "boundary_temperature_K",
  "pressure_Pa",
  "vibration_channel_ref",
  "charge_state_ref",
  "distance_channel_ref",
  "polarization_stokes_ref",
  "readout_power_W",
  "sensor_dark_channel_ref",
  "calibration_ancestry_ref",
  "exclusion_code",
  "source_artifact_sha256",
] as const;

export function generateCasimirDpAcquisitionPacketsStage4_2C(
  rawInput: CasimirDpAcquisitionPacketsStage4_2CInput,
) {
  const input = CasimirDpAcquisitionPacketsStage4_2CInput.parse(rawInput);
  const failures: string[] = [];
  if (
    input.packet_policy.confirmatory_data_available &&
    !input.freeze_completed
  ) {
    failures.push("confirmatory_ingestion_before_freeze_rejected");
  }
  if (input.packet_policy.automatic_unblinding_allowed) {
    failures.push("automatic_unblinding_forbidden");
  }
  const freezeAuthority = {
    stage4_2b_report_sha256: input.stage4_2b_report_sha256,
    candidate_id: input.selected_candidate.candidate_id,
    selected_candidate_receipt_sha256:
      input.selected_candidate_receipt_sha256,
    control_response_receipt_sha256:
      input.control_response_receipt_sha256,
    control_covariance_receipt_sha256:
      input.control_covariance_receipt_sha256,
    exclusions_learned_from: ["calibration", "pilot"],
    confirmatory_data_used: false,
    score_refitting_after_freeze_allowed: false,
    dp_parameter_retuning_after_freeze_allowed: false,
    bridge_registration_after_freeze_allowed: false,
  };
  const freezeReceipt = {
    schema_version: "casimir_dp_stage4_2c_freeze_receipt/1",
    freeze_authority_sha256: sha256(freezeAuthority),
    frozen_before_confirmatory_ingestion:
      input.freeze_completed &&
      !input.packet_policy.confirmatory_data_available,
    required_fields_sha256: sha256(REQUIRED_FIELDS),
    candidate_design_sha256: sha256(input.selected_candidate),
  };
  const pilotWindows = Math.max(
    200,
    Math.ceil(input.required_paired_windows / 4),
  );
  const confirmatoryWindows = Math.max(
    input.required_paired_windows,
    input.selected_candidate.planned_paired_windows,
  );
  const packetSpecs = [
    {
      partition_id: "calibration" as const,
      packet_id: "stage4_2c_calibration_packet_v1",
      cell_ids: input.control_cell_ids,
      planned_paired_windows: 200,
      response_fitting_allowed: true,
      covariance_fitting_allowed: true,
      candidate_selection_allowed: false,
      confirmatory_scoring_allowed: false,
      independent_replication: false,
    },
    {
      partition_id: "pilot" as const,
      packet_id: "stage4_2c_pilot_packet_v1",
      cell_ids: [
        ...input.baseline_primary_cell_ids,
        ...input.control_cell_ids,
      ],
      planned_paired_windows: pilotWindows,
      response_fitting_allowed: true,
      covariance_fitting_allowed: true,
      candidate_selection_allowed: true,
      confirmatory_scoring_allowed: false,
      independent_replication: false,
    },
    {
      partition_id: "confirmatory" as const,
      packet_id: "stage4_2c_confirmatory_packet_v1",
      cell_ids: [
        ...input.baseline_primary_cell_ids,
        ...input.control_cell_ids,
      ],
      planned_paired_windows: confirmatoryWindows,
      response_fitting_allowed: false,
      covariance_fitting_allowed: false,
      candidate_selection_allowed: false,
      confirmatory_scoring_allowed: true,
      independent_replication: false,
    },
    {
      partition_id: "independent_replication" as const,
      packet_id: "stage4_2c_independent_replication_packet_v1",
      cell_ids: [
        ...input.baseline_primary_cell_ids,
        ...input.control_cell_ids,
      ],
      planned_paired_windows: confirmatoryWindows,
      response_fitting_allowed: false,
      covariance_fitting_allowed: false,
      candidate_selection_allowed: false,
      confirmatory_scoring_allowed: true,
      independent_replication: true,
    },
  ];
  const packets = packetSpecs.map((spec) => {
    const packet = {
      schema_version: "casimir_dp_stage4_2c_acquisition_packet/1",
      ...spec,
      replication_id:
        spec.partition_id === "independent_replication"
          ? "independent_replication"
          : "primary",
      required_fields: REQUIRED_FIELDS,
      blind_boundary_labels_required: true,
      blind_mapping_available_to_analysis: false,
      automatic_unblinding_allowed: false,
      custodian_authorization_present:
        input.custodian_authorization_present,
      freeze_receipt_sha256: sha256(freezeReceipt),
      template_rows: spec.cell_ids.length,
      data_available: false,
      measured_evidence: "not_ready" as const,
    };
    return {
      ...packet,
      packet_sha256: sha256(packet),
    };
  });
  const partitionOrder = packets.map((packet) => packet.partition_id);
  if (
    JSON.stringify(partitionOrder) !==
      JSON.stringify(input.packet_policy.partitions)
  ) {
    failures.push("partition_order_mismatch");
  }
  const confirmatory = packets.find(
    (packet) => packet.partition_id === "confirmatory",
  );
  const replication = packets.find(
    (packet) => packet.partition_id === "independent_replication",
  );
  if (
    confirmatory == null ||
    replication == null ||
    confirmatory.response_fitting_allowed ||
    confirmatory.covariance_fitting_allowed ||
    replication.response_fitting_allowed ||
    replication.covariance_fitting_allowed
  ) {
    failures.push("held_out_packet_refit_policy_invalid");
  }
  const packetSetReceipt = {
    schema_version: "casimir_dp_stage4_2c_packet_set_receipt/1",
    packet_hashes: packets.map((packet) => ({
      partition_id: packet.partition_id,
      packet_sha256: packet.packet_sha256,
    })),
    freeze_receipt_sha256: sha256(freezeReceipt),
    partition_order: partitionOrder,
    confirmatory_data_used: false,
    automatic_unblinding_allowed: false,
    independent_replication_required: true,
  };

  return {
    schema_version: "casimir_dp_acquisition_packets_stage4_2c_result/1",
    gate: failures.length === 0 ? "pass" as const : "blocked" as const,
    status:
      failures.length === 0
        ? "blinded_packet_templates_ready" as const
        : failures[0],
    failures,
    freeze_authority: freezeAuthority,
    freeze_receipt: {
      ...freezeReceipt,
      receipt_sha256: sha256(freezeReceipt),
    },
    packets,
    packet_set_receipt: {
      ...packetSetReceipt,
      receipt_sha256: sha256(packetSetReceipt),
    },
    acquisition_budget: {
      calibration_paired_windows: 200,
      pilot_paired_windows: pilotWindows,
      confirmatory_paired_windows: confirmatoryWindows,
      independent_replication_paired_windows: confirmatoryWindows,
      minimum_power_required_paired_windows:
        input.required_paired_windows,
    },
    custody: {
      mode: "synthetic_template_only" as const,
      custodian_authorization_present:
        input.custodian_authorization_present,
      automatic_unblinding_allowed: false,
      unblinded: false,
    },
    physical_pilot_readiness: "not_ready" as const,
    measured_evidence: "not_ready" as const,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    physical_viability: "not_evaluated" as const,
    promotion_allowed: false,
  };
}
