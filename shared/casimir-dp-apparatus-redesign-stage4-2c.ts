import { createHash } from "node:crypto";
import { z } from "zod";
import {
  CasimirDpApparatusIdentifiabilityStage4_2BInput,
  evaluateCasimirDpApparatusIdentifiabilityStage4_2B,
} from "./casimir-dp-apparatus-identifiability-stage4-2b";
import {
  evaluateCasimirDpDpRegisteredPoint,
} from "./casimir-dp-dp-companion";
import type {
  CasimirDpDpParameterManifest,
} from "./casimir-dp-dp-companion";
import {
  CasimirDpStage4_2CApparatusCandidate,
} from "./contracts/casimir-dp-identifiability-redesign-stage4-2c.v1";
import type {
  Stage4_2CSignatureLane,
} from "./casimir-dp-control-response-stage4-2c";

const Finite = z.number().finite();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

const ControlSignature = z.object({
  signature_id: z.string().min(1),
  lane: z.enum([
    "intercept",
    "thermal",
    "electromagnetic",
    "vibration",
    "gas",
    "readout",
    "dp",
  ]),
  values: z.array(Finite).length(60),
  source_ref: z.string().min(1),
}).strict();

const DpPredictionRow = z.object({
  cell_id: z.string().min(1),
  mass_kg: Finite.positive(),
  branch_separation_m: Finite.nonnegative(),
  hold_time_s: Finite.nonnegative(),
  Gamma_DP_s: Finite.nonnegative(),
  chi_DP: Finite.nonnegative(),
  parameter_manifest_sha256: Sha256,
}).passthrough();

export const CasimirDpApparatusRedesignStage4_2CInput = z.object({
  schema_version: z.literal("casimir_dp_apparatus_redesign_stage4_2c/1"),
  evidence_class: z.literal("synthetic_fixture"),
  candidate: CasimirDpStage4_2CApparatusCandidate,
  search_bounds: z.object({
    maximum_mass_scale: Finite.positive(),
    maximum_branch_separation_scale: Finite.positive(),
    maximum_hold_time_scale: Finite.positive(),
  }).strict(),
  thresholds: z.object({
    maximum_abs_whitened_signature_cosine: Finite.gt(0).lt(1),
    augmented_design_condition_number_max: Finite.gt(1),
    minimum_power: Finite.gte(0.8).lt(1),
    maximum_false_positive_rate: Finite.gt(0).lt(0.5),
    minimum_companion_snr: Finite.gte(5),
    maximum_forecast_covariance_condition_number: Finite.gt(1),
  }).strict(),
  baseline_identifiability_input:
    CasimirDpApparatusIdentifiabilityStage4_2BInput,
  baseline_dp_rows: z.array(DpPredictionRow).min(1),
  parameter_manifest: z.custom<CasimirDpDpParameterManifest>(
    (value) => value != null && typeof value === "object",
    "A registered DP parameter manifest object is required.",
  ),
  parameter_manifest_sha256: Sha256,
  control_component_ids: z.array(z.string().min(1)).length(60),
  whitened_control_signatures: z.array(ControlSignature).length(7),
  control_covariance_receipt: z.object({
    receipt_sha256: Sha256,
    covariance_condition_upper_bound: Finite.gte(1),
    covariance_positive_definite: z.literal(true),
    shared_calibration_covariance_present: z.literal(true),
    sensor_self_noise_in_covariance: z.literal(true),
    sensor_self_noise_in_physical_signature: z.literal(false),
    measured_covariance: z.literal("not_ready"),
  }).passthrough(),
  control_response_receipt: z.object({
    receipt_sha256: Sha256,
    response_authority: z.literal("design_assumption_not_measured"),
    maximum_round_trip_error: Finite.nonnegative(),
  }).passthrough(),
  stage4_2b_report_sha256: Sha256,
}).strict();

export type CasimirDpApparatusRedesignStage4_2CInput = z.infer<
  typeof CasimirDpApparatusRedesignStage4_2CInput
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

function vectorNorm(values: number[]): number {
  return Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );
}

function sourceRefForLane(
  lane: string,
  baselineSourceRef: string,
  controlSourceRef: string,
): string {
  return [
    baselineSourceRef,
    controlSourceRef,
    `stage4_2c_lane:${lane}`,
  ].join("|");
}

function candidateAdmission(
  input: CasimirDpApparatusRedesignStage4_2CInput,
) {
  const failures: string[] = [];
  if (
    input.candidate.mass_scale_from_stage4_2b_nominal >
      input.search_bounds.maximum_mass_scale ||
    input.candidate.branch_separation_scale >
      input.search_bounds.maximum_branch_separation_scale ||
    input.candidate.hold_time_scale >
      input.search_bounds.maximum_hold_time_scale ||
    input.candidate.preparation_domain ===
      "outside_bounded_design_assumption"
  ) {
    failures.push("candidate_outside_registered_bounds");
  }
  if (
    input.candidate.material_response_authority !==
      "stage4_2b_source_backed"
  ) {
    failures.push("material_response_authority_not_admitted");
  }
  return {
    gate: failures.length === 0 ? "pass" as const : "blocked" as const,
    failures,
  };
}

function buildCandidateDpVector(
  input: CasimirDpApparatusRedesignStage4_2CInput,
): {
  values: number[];
  point_receipts: Array<{
    cell_id: string;
    baseline_chi_dp: number;
    redesigned_chi_dp: number;
    scale_ratio: number;
    E_G_J: number;
    Gamma_DP_s: number;
    crosscheck_gate: "pass" | "not_ready";
  }>;
} {
  const baselineDp = input.baseline_identifiability_input
    .whitened_signatures_per_sqrt_window
    .find((signature) => signature.lane === "dp");
  if (baselineDp == null) {
    throw new Error("stage4_2c_baseline_dp_signature_missing");
  }
  const rows = new Map(
    input.baseline_dp_rows.map((row) => [row.cell_id, row]),
  );
  const receiptByCell = new Map<string, {
    cell_id: string;
    baseline_chi_dp: number;
    redesigned_chi_dp: number;
    scale_ratio: number;
    E_G_J: number;
    Gamma_DP_s: number;
    crosscheck_gate: "pass" | "not_ready";
  }>();
  const values = input.baseline_identifiability_input.cell_ids.map(
    (componentId, index) => {
      const cellId = componentId.replace(/:(re|im)$/, "");
      const row = rows.get(cellId);
      if (row == null) {
        throw new Error(`stage4_2c_dp_row_missing:${cellId}`);
      }
      const point = evaluateCasimirDpDpRegisteredPoint({
        mass_kg:
          row.mass_kg *
          input.candidate.mass_scale_from_stage4_2b_nominal,
        branch_separation_m:
          row.branch_separation_m *
          input.candidate.branch_separation_scale,
        parameter_manifest: input.parameter_manifest,
        parameter_manifest_sha256: input.parameter_manifest_sha256,
      });
      const redesignedChi =
        point.Gamma_DP_s *
        row.hold_time_s *
        input.candidate.hold_time_scale;
      const ratio =
        row.chi_DP > 0 ? redesignedChi / row.chi_DP : 0;
      if (!receiptByCell.has(cellId)) {
        receiptByCell.set(cellId, {
          cell_id: cellId,
          baseline_chi_dp: row.chi_DP,
          redesigned_chi_dp: redesignedChi,
          scale_ratio: ratio,
          E_G_J: point.E_G_analytic_J,
          Gamma_DP_s: point.Gamma_DP_s,
          crosscheck_gate: point.E_G_crosscheck_gate,
        });
      }
      return (baselineDp.values[index] ?? 0) * ratio;
    },
  );
  return {
    values,
    point_receipts: [...receiptByCell.values()],
  };
}

export function evaluateCasimirDpApparatusRedesignStage4_2C(
  rawInput: CasimirDpApparatusRedesignStage4_2CInput,
) {
  const input = CasimirDpApparatusRedesignStage4_2CInput.parse(rawInput);
  const admission = candidateAdmission(input);
  const candidateDp = buildCandidateDpVector(input);
  const baselineDp = input.baseline_identifiability_input
    .whitened_signatures_per_sqrt_window
    .find((signature) => signature.lane === "dp");
  if (baselineDp == null) {
    throw new Error("stage4_2c_baseline_dp_signature_missing");
  }
  const controlByLane = new Map<
    Stage4_2CSignatureLane,
    z.infer<typeof ControlSignature>
  >(
    input.whitened_control_signatures.map((signature) => [
      signature.lane,
      signature,
    ]),
  );

  const extendedSignatures =
    input.baseline_identifiability_input
      .whitened_signatures_per_sqrt_window
      .map((signature) => {
        if (signature.lane === "bridge") {
          throw new Error("stage4_2c_unregistered_bridge_signature_present");
        }
        const control = controlByLane.get(signature.lane);
        if (control == null) {
          throw new Error(
            `stage4_2c_control_signature_missing:${signature.lane}`,
          );
        }
        const baselineValues =
          signature.lane === "dp"
            ? candidateDp.values
            : signature.values;
        return {
          signature_id: signature.signature_id,
          lane: signature.lane,
          values: [...baselineValues, ...control.values],
          source_ref: sourceRefForLane(
            signature.lane,
            signature.source_ref,
            control.source_ref,
          ),
        };
      });

  const combinedCellIds = [
    ...input.baseline_identifiability_input.cell_ids,
    ...input.control_component_ids,
  ];
  const candidateDpExtended = extendedSignatures.find(
    (signature) => signature.lane === "dp",
  )?.values;
  if (candidateDpExtended == null) {
    throw new Error("stage4_2c_extended_dp_signature_missing");
  }
  const combinedCovarianceCondition = Math.max(
    input.baseline_identifiability_input.forecast_covariance
      .condition_number,
    input.control_covariance_receipt.covariance_condition_upper_bound,
  );
  const boundedRegion = {
    ...input.baseline_identifiability_input.bounded_parameter_regions[0],
    region_id: input.candidate.candidate_id,
    whitened_dp_signature_per_sqrt_window: candidateDpExtended,
    source_ref: [
      "registered_dp_generator",
      input.parameter_manifest_sha256,
      input.candidate.candidate_id,
    ].join("|"),
  };
  const designReceipt = {
    stage4_2b_report_sha256: input.stage4_2b_report_sha256,
    candidate: input.candidate,
    cell_ids: combinedCellIds,
    control_covariance_receipt_sha256:
      input.control_covariance_receipt.receipt_sha256,
    control_response_receipt_sha256:
      input.control_response_receipt.receipt_sha256,
    parameter_manifest_sha256: input.parameter_manifest_sha256,
  };

  const evaluatorInput =
    CasimirDpApparatusIdentifiabilityStage4_2BInput.parse({
      ...input.baseline_identifiability_input,
      cell_ids: combinedCellIds,
      whitened_signatures_per_sqrt_window: extendedSignatures,
      forecast_covariance: {
        ...input.baseline_identifiability_input.forecast_covariance,
        covariance_receipt_sha256:
          input.control_covariance_receipt.receipt_sha256,
        whitening_receipt_sha256:
          input.control_response_receipt.receipt_sha256,
        condition_number: combinedCovarianceCondition,
        maximum_condition_number:
          input.thresholds.maximum_forecast_covariance_condition_number,
      },
      design_contract: {
        ...input.baseline_identifiability_input.design_contract,
        design_matrix_sha256: sha256(extendedSignatures),
        cell_order_sha256: sha256(combinedCellIds),
      },
      bounded_parameter_regions: [boundedRegion],
      planned_paired_windows: input.candidate.planned_paired_windows,
      thresholds: {
        ...input.baseline_identifiability_input.thresholds,
        maximum_abs_whitened_cosine:
          input.thresholds.maximum_abs_whitened_signature_cosine,
        augmented_design_condition_number_max:
          input.thresholds.augmented_design_condition_number_max,
        minimum_power: input.thresholds.minimum_power,
        maximum_false_positive_rate:
          input.thresholds.maximum_false_positive_rate,
        minimum_companion_snr: input.thresholds.minimum_companion_snr,
      },
      ordinary_physics_forecast_complete: true,
      branch_provenance_complete: false,
      independent_replication_planned: true,
    });
  const identifiability =
    evaluateCasimirDpApparatusIdentifiabilityStage4_2B(evaluatorInput);
  const poweredRegion =
    identifiability.powered_preregistered_region_ids.includes(
      input.candidate.candidate_id,
    );
  const hardGates = {
    candidate_admission: admission.gate,
    registered_dp_crosscheck:
      candidateDp.point_receipts.every(
          (row) => row.crosscheck_gate === "pass",
        )
        ? "pass" as const
        : "blocked" as const,
    control_response_round_trip:
      input.control_response_receipt.maximum_round_trip_error <= 1e-12
        ? "pass" as const
        : "blocked" as const,
    covariance:
      combinedCovarianceCondition <=
          input.thresholds.maximum_forecast_covariance_condition_number
        ? "pass" as const
        : "blocked" as const,
    signature_cosine:
      identifiability.maximum_abs_whitened_cosine <
          input.thresholds.maximum_abs_whitened_signature_cosine
        ? "pass" as const
        : "blocked" as const,
    augmented_condition:
      identifiability.normalized_gram_condition_number != null &&
          identifiability.normalized_gram_condition_number <=
            input.thresholds.augmented_design_condition_number_max
        ? "pass" as const
        : "blocked" as const,
    power:
      identifiability.achieved_dp_power >= input.thresholds.minimum_power &&
          poweredRegion
        ? "pass" as const
        : "blocked" as const,
    false_positive_rate:
      input.thresholds.maximum_false_positive_rate <= 0.05
        ? "pass" as const
        : "blocked" as const,
    companion:
      evaluatorInput.companion.forecast_snr >=
            input.thresholds.minimum_companion_snr &&
          evaluatorInput.companion.independently_powered
        ? "pass" as const
        : "blocked" as const,
  };
  const allHardGatesPass = Object.values(hardGates).every(
    (gate) => gate === "pass",
  );
  const candidateStatus =
    admission.failures.includes("candidate_outside_registered_bounds")
      ? "candidate_outside_registered_bounds" as const
      : admission.failures.includes(
          "material_response_authority_not_admitted",
        )
      ? "material_response_authority_not_admitted" as const
      : identifiability.feasibility_verdict;
  const baselineNorm = vectorNorm(baselineDp.values);
  const candidateNorm = vectorNorm(candidateDp.values);
  const resultReceipt = {
    schema_version: "casimir_dp_stage4_2c_candidate_receipt/1",
    candidate_id: input.candidate.candidate_id,
    design_receipt_sha256: sha256(designReceipt),
    dp_point_receipts_sha256: sha256(candidateDp.point_receipts),
    evaluator_input_sha256: sha256(evaluatorInput),
    hard_gates: hardGates,
    candidate_status: candidateStatus,
    selected_eligible: allHardGatesPass,
  };

  return {
    schema_version:
      "casimir_dp_apparatus_redesign_stage4_2c_result/1",
    candidate_id: input.candidate.candidate_id,
    gate: allHardGatesPass ? "pass" as const : "blocked" as const,
    candidate_status: candidateStatus,
    selection_eligible: allHardGatesPass,
    admission,
    hard_gates: hardGates,
    identifiability,
    required_paired_windows: identifiability.required_paired_windows,
    planned_paired_windows: input.candidate.planned_paired_windows,
    dp_signature_norm_ratio:
      baselineNorm === 0 ? null : candidateNorm / baselineNorm,
    dp_transport: {
      parameter_manifest_sha256: input.parameter_manifest_sha256,
      mass_scale: input.candidate.mass_scale_from_stage4_2b_nominal,
      branch_separation_scale:
        input.candidate.branch_separation_scale,
      hold_time_scale: input.candidate.hold_time_scale,
      point_receipts: candidateDp.point_receipts,
      point_receipts_sha256: sha256(candidateDp.point_receipts),
      fitted_amplitude_used: false,
      confirmatory_data_used: false,
    },
    combined_observable_space: {
      baseline_complex_components:
        input.baseline_identifiability_input.cell_ids.length,
      control_complex_components: input.control_component_ids.length,
      total_components: combinedCellIds.length,
      cell_order_sha256: sha256(combinedCellIds),
      signature_matrix_sha256: sha256(extendedSignatures),
      covariance_condition_upper_bound: combinedCovarianceCondition,
    },
    candidate_receipt: {
      ...resultReceipt,
      receipt_sha256: sha256(resultReceipt),
    },
    state_preparation: {
      evidence_class: input.candidate.state_preparation_evidence_class,
      authentic_receipt_available:
        input.candidate.authentic_state_preparation_receipt_available,
      promotion_allowed: false,
    },
    physical_pilot_readiness: "not_ready" as const,
    evidence_class: "synthetic_fixture" as const,
    measured_control_response_authority: "not_ready" as const,
    measured_covariance: "not_ready" as const,
    measured_evidence: "not_ready" as const,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    physical_viability: "not_evaluated" as const,
    promotion_allowed: false,
    observable_bridge_edges_added: 0,
  };
}

export function selectCasimirDpApparatusRedesignStage4_2C(
  results: ReturnType<
    typeof evaluateCasimirDpApparatusRedesignStage4_2C
  >[],
) {
  const eligible = results
    .filter((result) => result.selection_eligible)
    .sort((left, right) => {
      const leftWindows =
        left.required_paired_windows ?? Number.POSITIVE_INFINITY;
      const rightWindows =
        right.required_paired_windows ?? Number.POSITIVE_INFINITY;
      if (leftWindows !== rightWindows) {
        return leftWindows - rightWindows;
      }
      const leftMass = left.dp_transport.mass_scale;
      const rightMass = right.dp_transport.mass_scale;
      if (leftMass !== rightMass) return leftMass - rightMass;
      return left.candidate_id.localeCompare(right.candidate_id);
    });
  const selected = eligible[0] ?? null;
  return {
    schema_version: "casimir_dp_stage4_2c_design_selection/1",
    verdict:
      selected == null
        ? "redesign_no_go" as const
        : "bounded_powered_region_available" as const,
    selected_candidate_id: selected?.candidate_id ?? null,
    required_paired_windows: selected?.required_paired_windows ?? null,
    eligible_candidate_ids: eligible.map((result) => result.candidate_id),
    objective_order: [
      "all_hard_gates",
      "minimum_required_paired_windows",
      "minimum_mass_scale",
      "lexicographic_candidate_id",
    ] as const,
    selection_used_confirmatory_data: false,
    physical_pilot_readiness: "not_ready" as const,
    measured_evidence: "not_ready" as const,
  };
}
