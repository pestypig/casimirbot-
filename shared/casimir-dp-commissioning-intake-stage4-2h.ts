// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G,
} from "./casimir-dp-empirical-feasibility-pilot-stage4-2g";
import {
  CasimirDpCommissioningDossierStage4_2H,
  type CasimirDpCommissioningDossierStage4_2H as Stage4HDossier,
  type CasimirDpCommissioningIntakeStage4_2HConfig,
} from "./contracts/casimir-dp-commissioning-intake-stage4-2h.v1";
import {
  CasimirDpEmpiricalPilotPacketStage4_2G,
  type CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig,
  type CasimirDpEmpiricalPilotPacketStage4_2G,
} from "./contracts/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1";

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

export function sha256CasimirDpCommissioningStage4_2H(
  value: unknown,
): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

export function buildSyntheticCommissioningDryRunStage4_2H(args: {
  blankDossier: Stage4HDossier;
  stage4gSyntheticPacket: CasimirDpEmpiricalPilotPacketStage4_2G;
  generatedAt?: string;
}): Stage4HDossier {
  const { blankDossier, stage4gSyntheticPacket } = args;
  const generatedAt =
    args.generatedAt ?? "2026-07-30T05:00:00.000Z";
  if (
    blankDossier.evidence_class !== "blank_commissioning_template" ||
    stage4gSyntheticPacket.evidence_class !== "synthetic_validation"
  ) {
    throw new Error(
      "Stage-4.2H dry-run construction requires the blank dossier and the frozen Stage-4.2G synthetic packet.",
    );
  }

  const dossier: Stage4HDossier = {
    ...blankDossier,
    dossier_id: "casimir-dp-stage4-2h-synthetic-dry-run-v1",
    generated_at: generatedAt,
    evidence_class: "synthetic_dry_run",
    instrument_registry: blankDossier.instrument_registry.map((row) => ({
      ...row,
      authority_class: "synthetic_dry_run" as const,
      instrument_id: `synthetic-${row.role}`,
      manufacturer: "synthetic-only",
      model: "stage4-2h-dry-run",
      serial_number: `synthetic-${row.role}-v1`,
      calibration_artifact_ref:
        `synthetic://stage4-2h/calibration/${row.role}`,
      calibration_artifact_sha256:
        sha256CasimirDpCommissioningStage4_2H({
          role: row.role,
          class: "synthetic_calibration",
        }),
      calibration_valid_from: generatedAt,
      calibration_valid_until: "2027-07-30T05:00:00.000Z",
      calibration_operator_id: "synthetic-validator",
      custody_event_ids: [`synthetic-custody-${row.role}`],
    })),
    product_slots: blankDossier.product_slots.map((slot, index) => {
      const upstream = stage4gSyntheticPacket.products[index];
      if (upstream.product_id !== slot.product_id) {
        throw new Error(
          `Stage-4.2G product order mismatch at ${slot.product_id}.`,
        );
      }
      return {
        ...slot,
        authority_class: "synthetic_dry_run" as const,
        artifact_ref: upstream.artifact_ref,
        artifact_sha256: upstream.artifact_sha256,
        uncertainty_model_ref: upstream.uncertainty_model_ref,
        calibration_ancestry_refs: [
          "synthetic://stage4-2h/calibration-ancestry",
        ],
        custody_event_ids: [`synthetic-product-${slot.product_id}`],
        acquired_at: generatedAt,
        operator_id: "synthetic-validator",
      };
    }),
    cell_order_ref: "synthetic://stage4-2h/frozen-cell-order",
    cell_order_sha256: sha256CasimirDpCommissioningStage4_2H(
      stage4gSyntheticPacket.identifiability_input?.cell_ids ?? [],
    ),
    identifiability_input: stage4gSyntheticPacket.identifiability_input,
    custody: {
      custodian_id: "synthetic-custodian",
      blind_map_commitment_sha256:
        sha256CasimirDpCommissioningStage4_2H("synthetic-blind-map"),
      freeze_receipt_ref: "synthetic://stage4-2h/freeze-receipt",
      freeze_receipt_sha256:
        sha256CasimirDpCommissioningStage4_2H("synthetic-freeze-receipt"),
      event_ids: ["synthetic-freeze-event"],
      exclusions_frozen: true,
      covariance_frozen: true,
      automatic_unblinding_allowed: false,
      confirmatory_refit_allowed: false,
    },
    independent_replication: {
      primary_group_id: "synthetic-primary-group",
      replication_group_id: "synthetic-independent-group",
      implementation_independence_declared: true,
      shared_raw_data_before_lock: false,
    },
  };
  return CasimirDpCommissioningDossierStage4_2H.parse(dossier);
}

export function compileStage4GPacketFromCommissioningDossierStage4_2H(
  dossier: Stage4HDossier,
  stage4gUnacquiredPacket: CasimirDpEmpiricalPilotPacketStage4_2G,
): CasimirDpEmpiricalPilotPacketStage4_2G | null {
  if (dossier.evidence_class === "blank_commissioning_template") {
    return null;
  }
  const synthetic = dossier.evidence_class === "synthetic_dry_run";
  const instrumentIds = new Map(
    dossier.instrument_registry.map((row) => [
      row.role,
      row.instrument_id as string,
    ]),
  );
  const packet: CasimirDpEmpiricalPilotPacketStage4_2G = {
    schema_version:
      "casimir_dp_empirical_pilot_packet_stage4_2g/1",
    campaign_id:
      "casimir-dp-empirical-feasibility-pilot-stage4-2g-v1",
    packet_id: `${dossier.dossier_id}-compiled-stage4-2g-pilot`,
    generated_at: dossier.generated_at,
    evidence_class:
      synthetic ? "synthetic_validation" : "measured_empirical_packet",
    partition: "pilot",
    blinded: false,
    apparatus_identity: stage4gUnacquiredPacket.apparatus_identity,
    products: dossier.product_slots.map((slot) => ({
      product_id: slot.product_id,
      authority_class: synthetic
        ? "synthetic_validation"
        : slot.authority_class === "registered_protocol"
        ? "registered_protocol"
        : "measured_empirical",
      artifact_ref: slot.artifact_ref,
      artifact_sha256: slot.artifact_sha256,
      calibration_ref: slot.calibration_ancestry_refs[0] ?? null,
      uncertainty_model_ref: slot.uncertainty_model_ref,
      custody_event_ids: slot.custody_event_ids,
      acquired_at: slot.acquired_at,
      operator_id: slot.operator_id,
      instrument_ids: slot.instrument_roles.map(
        (role) => instrumentIds.get(role) as string,
      ),
      independent_of_primary_channel:
        slot.independent_of_primary_channel,
    })),
    identifiability_input: dossier.identifiability_input,
    exclusions_frozen: dossier.custody.exclusions_frozen,
    covariance_frozen: dossier.custody.covariance_frozen,
    dp_model_frozen: true,
    transfer_kernel_registered: false,
    automatic_unblinding_allowed: false,
    confirmatory_refit_allowed: false,
  };
  return CasimirDpEmpiricalPilotPacketStage4_2G.parse(packet);
}

export function evaluateCasimirDpCommissioningIntakeStage4_2H(args: {
  config: CasimirDpCommissioningIntakeStage4_2HConfig;
  dossier: Stage4HDossier;
  stage4gConfig: CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig;
  stage4gUnacquiredPacket: CasimirDpEmpiricalPilotPacketStage4_2G;
  artifactIntegrityPass: boolean;
}) {
  const {
    config,
    dossier,
    stage4gConfig,
    stage4gUnacquiredPacket,
    artifactIntegrityPass,
  } = args;
  const parsedDossier =
    CasimirDpCommissioningDossierStage4_2H.parse(dossier);
  const identityMatches =
    parsedDossier.stage4_2g_identity_ref.identity_id ===
      stage4gUnacquiredPacket.apparatus_identity.identity_id &&
    parsedDossier.stage4_2g_identity_ref.unacquired_packet_path ===
      config.blank_dossier.path.replace(
        "casimir-dp-stage4-2h-commissioning-blank.v1.json",
        "casimir-dp-stage4-2g-pilot-unacquired.v1.json",
      ) &&
    parsedDossier.stage4_2g_identity_ref.unacquired_packet_sha256 ===
      config.upstream_authorities.find(
        (row) => row.role === "stage4_2g_unacquired_packet",
      )?.sha256;
  const isMeasured =
    parsedDossier.evidence_class === "measured_commissioning_dossier";
  const isSynthetic =
    parsedDossier.evidence_class === "synthetic_dry_run";
  const allInstrumentsCommissioned =
    parsedDossier.instrument_registry.every(
      (row) => row.authority_class === "commissioned_measured",
    );
  const allPhysicalProductsMeasured =
    parsedDossier.product_slots.every(
      (row) =>
        row.authority_class === "measured_empirical" ||
        (
          row.authority_class === "registered_protocol" &&
          (
            row.product_id === "blind_custody_freeze" ||
            row.product_id === "independent_solver_replication"
          )
        ),
    );
  const custodyReady =
    parsedDossier.custody.custodian_id !== null &&
    parsedDossier.custody.blind_map_commitment_sha256 !== null &&
    parsedDossier.custody.freeze_receipt_ref !== null &&
    parsedDossier.custody.freeze_receipt_sha256 !== null &&
    parsedDossier.custody.event_ids.length > 0 &&
    parsedDossier.custody.exclusions_frozen &&
    parsedDossier.custody.covariance_frozen;
  const replicationReady =
    parsedDossier.independent_replication.primary_group_id !== null &&
    parsedDossier.independent_replication.replication_group_id !== null &&
    parsedDossier.independent_replication.implementation_independence_declared;
  const compiledPacket =
    compileStage4GPacketFromCommissioningDossierStage4_2H(
      parsedDossier,
      stage4gUnacquiredPacket,
    );
  const stage4gResult = compiledPacket == null
    ? null
    : evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G({
      config: stage4gConfig,
      packet: compiledPacket,
      artifactIntegrityPass,
    });
  const empiricalPilotReady =
    isMeasured &&
    identityMatches &&
    artifactIntegrityPass &&
    allInstrumentsCommissioned &&
    allPhysicalProductsMeasured &&
    custodyReady &&
    replicationReady &&
    stage4gResult?.readiness.empirical_pilot_readiness === "ready";

  return {
    schema_version:
      "casimir_dp_commissioning_intake_stage4_2h_result/1",
    evidence_class: config.evidence_class,
    dossier_evidence_class: parsedDossier.evidence_class,
    claim_ceiling: config.claim_ceiling,
    promotion_allowed: false,
    frozen_upstream: {
      stage4_2g_campaign_run_id:
        config.immutable_stage4_2g.campaign_run_id,
      apparatus_identity_id:
        stage4gUnacquiredPacket.apparatus_identity.identity_id,
      identity_gate: identityMatches ? "pass" : "blocked",
      dp_model_frozen: parsedDossier.dp_model_frozen,
    },
    commissioning_contract: {
      gate: identityMatches ? "pass" : "blocked",
      instrument_roles:
        parsedDossier.instrument_registry.map((row) => row.role),
      product_ids:
        parsedDossier.product_slots.map((row) => row.product_id),
      partition_ids:
        parsedDossier.partition_plan.map((row) => row.partition_id),
      raw_columns: parsedDossier.raw_columns,
      synthetic_dry_run_gate: isSynthetic ? "pass" : "not_applicable",
      synthetic_has_empirical_authority: false,
    },
    intake_readiness: {
      instrument_registry:
        isMeasured && allInstrumentsCommissioned && artifactIntegrityPass
          ? "ready"
          : "not_ready",
      calibration_ancestry:
        isMeasured && allPhysicalProductsMeasured && artifactIntegrityPass
          ? "ready"
          : "not_ready",
      custody_and_blind_freeze:
        isMeasured && custodyReady && replicationReady
          ? "ready"
          : "not_ready",
      raw_data_availability:
        isMeasured &&
          allPhysicalProductsMeasured &&
          parsedDossier.identifiability_input !== null &&
          parsedDossier.cell_order_ref !== null &&
          artifactIntegrityPass
          ? "ready"
          : "not_ready",
      stage4_2g_packet_compilation:
        isMeasured && compiledPacket !== null && artifactIntegrityPass
          ? "ready"
          : "not_ready",
      empirical_pilot_readiness:
        empiricalPilotReady ? "ready" : "not_ready",
    },
    compiled_stage4_2g_packet: compiledPacket,
    compiled_stage4_2g_result: stage4gResult,
    hypothesis_separation: {
      gate:
        parsedDossier.dp_model_frozen &&
          !parsedDossier.transfer_kernel_registered &&
          parsedDossier.observable_bridge_edges_added === 0
          ? "pass"
          : "blocked",
      ordinary_physics_null:
        "measured_maxwell_material_environment_and_instrument_response",
      frozen_dp_prediction:
        "diosi_1989_gaussian_regularized_nondissipative",
      speculative_extension:
        "requires_separate_registered_casimir_to_collapse_transfer_kernel",
      observable_bridge_edges_added: 0,
    },
    bounded_status: {
      commissioning_contract: identityMatches ? "pass" : "blocked",
      synthetic_dry_run:
        isSynthetic ? "pass" : "not_applicable",
      empirical_pilot_readiness:
        empiricalPilotReady ? "ready" : "not_ready",
      measured_evidence:
        empiricalPilotReady
          ? "pilot_inputs_available_not_confirmatory_evidence"
          : "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    },
  } as const;
}
