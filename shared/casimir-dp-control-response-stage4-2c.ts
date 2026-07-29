import { createHash } from "node:crypto";
import { z } from "zod";
import {
  CasimirDpStage4_2CControlAxis,
  CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES,
} from "./contracts/casimir-dp-identifiability-redesign-stage4-2c.v1";

const Finite = z.number().finite();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

const ControlCell = z.object({
  cell_id: z.string().min(1),
  boundary_or_control_state_id: z.string().min(1),
  nuisance_control_axis_id: z.string().min(1),
  nuisance_control_level_id: z.string().min(1),
  control_role: z.enum([
    "nuisance_oaat",
    "sham_switch",
    "detuned_boundary",
  ]),
  measured_evidence: z.literal("not_ready"),
}).passthrough();

export const CasimirDpControlResponseStage4_2CInput = z.object({
  schema_version: z.literal("casimir_dp_control_response_stage4_2c/1"),
  evidence_class: z.literal("synthetic_fixture"),
  control_cells: z.array(ControlCell).length(30),
  control_axes: z.array(CasimirDpStage4_2CControlAxis).length(
    CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES.length,
  ),
  sham_switch: z.object({
    raw_response_log_coherence: Finite.nonnegative(),
    response_standard_uncertainty_log_coherence: Finite.positive(),
    primary_lane: z.literal("readout"),
    measured_response_available: z.literal(false),
  }).strict(),
  detuned_boundary: z.object({
    raw_response_log_coherence: Finite.nonnegative(),
    response_standard_uncertainty_log_coherence: Finite.positive(),
    primary_lane: z.literal("electromagnetic"),
    measured_response_available: z.literal(false),
  }).strict(),
  sensor_self_noise: z.object({
    admitted_as_physical_decoherence_lane: z.literal(false),
    admitted_in_covariance: z.literal(true),
    raw_standard_uncertainty_log_coherence: Finite.positive(),
    source_ref: z.string().min(1),
    source_sha256: Sha256,
  }).strict(),
  response_gain: Finite.positive(),
  cross_axis_leakage_fraction: Finite.gte(0).lt(1),
  covariance_jitter: Finite.nonnegative(),
}).strict();

export type CasimirDpControlResponseStage4_2CInput = z.infer<
  typeof CasimirDpControlResponseStage4_2CInput
>;

export type Stage4_2CSignatureLane =
  | "intercept"
  | "thermal"
  | "electromagnetic"
  | "vibration"
  | "gas"
  | "readout"
  | "dp";

type SignatureVector = {
  signature_id: string;
  lane: Stage4_2CSignatureLane;
  values: number[];
  source_ref: string;
};

const LANES: Stage4_2CSignatureLane[] = [
  "intercept",
  "thermal",
  "electromagnetic",
  "vibration",
  "gas",
  "readout",
  "dp",
];

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

function zeroMatrix(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function cholesky(matrix: number[][]): number[][] {
  const size = matrix.length;
  const lower = zeroMatrix(size);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = matrix[row][column] ?? 0;
      for (let k = 0; k < column; k += 1) {
        sum -= (lower[row][k] ?? 0) * (lower[column][k] ?? 0);
      }
      if (row === column) {
        if (!(sum > 0) || !Number.isFinite(sum)) {
          throw new Error(
            `stage4_2c_control_covariance_not_positive_definite:${row}:${sum}`,
          );
        }
        lower[row][column] = Math.sqrt(sum);
      } else {
        lower[row][column] = sum / (lower[column][column] ?? 1);
      }
    }
  }
  return lower;
}

function solveLowerTriangular(
  lower: number[][],
  values: number[],
): number[] {
  const result = Array(values.length).fill(0);
  for (let row = 0; row < values.length; row += 1) {
    let value = values[row] ?? 0;
    for (let column = 0; column < row; column += 1) {
      value -= (lower[row][column] ?? 0) * (result[column] ?? 0);
    }
    result[row] = value / (lower[row][row] ?? 1);
  }
  return result;
}

function multiplyLower(lower: number[][], values: number[]): number[] {
  return lower.map((row, rowIndex) =>
    row
      .slice(0, rowIndex + 1)
      .reduce(
        (sum, coefficient, column) =>
          sum + coefficient * (values[column] ?? 0),
        0,
      )
  );
}

function maximumAbsoluteDifference(left: number[], right: number[]): number {
  return left.reduce(
    (maximum, value, index) =>
      Math.max(maximum, Math.abs(value - (right[index] ?? 0))),
    0,
  );
}

function covarianceConditionUpperBound(matrix: number[][]): number {
  let maximumUpper = 0;
  let minimumLower = Number.POSITIVE_INFINITY;
  for (let row = 0; row < matrix.length; row += 1) {
    const diagonal = Math.abs(matrix[row][row] ?? 0);
    const offDiagonal = matrix[row].reduce(
      (sum, value, column) =>
        column === row ? sum : sum + Math.abs(value),
      0,
    );
    maximumUpper = Math.max(maximumUpper, diagonal + offDiagonal);
    minimumLower = Math.min(minimumLower, diagonal - offDiagonal);
  }
  if (!(minimumLower > 0)) return Number.POSITIVE_INFINITY;
  return maximumUpper / minimumLower;
}

function levelSign(
  cell: z.infer<typeof ControlCell>,
  axis: z.infer<typeof CasimirDpStage4_2CControlAxis>,
): number {
  if (cell.nuisance_control_level_id === axis.low_level_id) return -1;
  if (cell.nuisance_control_level_id === axis.high_level_id) return 1;
  throw new Error(
    `stage4_2c_unknown_control_level:${cell.cell_id}:${cell.nuisance_control_level_id}`,
  );
}

function axisForCell(
  input: CasimirDpControlResponseStage4_2CInput,
  cell: z.infer<typeof ControlCell>,
) {
  return input.control_axes.find(
    (axis) => axis.axis_id === cell.nuisance_control_axis_id,
  );
}

function sigmaForCell(
  input: CasimirDpControlResponseStage4_2CInput,
  cell: z.infer<typeof ControlCell>,
): {
  sigma: number;
  sharedFraction: number;
  correlation: number;
  ancestryId: string;
} {
  const axis = axisForCell(input, cell);
  if (axis != null) {
    return {
      sigma: axis.response_standard_uncertainty_log_coherence,
      sharedFraction: axis.shared_calibration_fraction,
      correlation: axis.re_im_correlation,
      ancestryId: `axis:${axis.axis_id}`,
    };
  }
  if (cell.control_role === "sham_switch") {
    return {
      sigma: input.sham_switch.response_standard_uncertainty_log_coherence,
      sharedFraction: 0.05,
      correlation: 0,
      ancestryId: "independent:sham_switch",
    };
  }
  if (cell.control_role === "detuned_boundary") {
    return {
      sigma:
        input.detuned_boundary.response_standard_uncertainty_log_coherence,
      sharedFraction: 0.05,
      correlation: 0,
      ancestryId: "independent:detuned_boundary",
    };
  }
  throw new Error(`stage4_2c_control_sigma_missing:${cell.cell_id}`);
}

function rawLaneResponse(args: {
  input: CasimirDpControlResponseStage4_2CInput;
  cell: z.infer<typeof ControlCell>;
  lane: Stage4_2CSignatureLane;
}): [number, number] {
  const { input, cell, lane } = args;
  const axis = axisForCell(input, cell);
  if (axis != null) {
    const sign = levelSign(cell, axis);
    const magnitude =
      axis.raw_level_contrast_magnitude_log_coherence *
      input.response_gain;
    if (lane === "intercept") {
      return [magnitude * 0.05, 0];
    }
    if (lane === "dp") return [0, 0];
    const isPrimary = lane === axis.primary_lane;
    const leakage =
      !isPrimary && lane !== "intercept"
        ? input.cross_axis_leakage_fraction
        : 1;
    if (!isPrimary && input.cross_axis_leakage_fraction === 0) {
      return [0, 0];
    }
    const response = sign * magnitude * leakage;
    return axis.response_quadrature === "real"
      ? [response, 0]
      : [0, response];
  }
  if (cell.control_role === "sham_switch") {
    if (lane === "intercept") {
      return [input.sham_switch.raw_response_log_coherence * 0.05, 0];
    }
    return lane === input.sham_switch.primary_lane
      ? [
        0,
        input.sham_switch.raw_response_log_coherence * input.response_gain,
      ]
      : [0, 0];
  }
  if (cell.control_role === "detuned_boundary") {
    if (lane === "intercept") {
      return [input.detuned_boundary.raw_response_log_coherence * 0.05, 0];
    }
    return lane === input.detuned_boundary.primary_lane
      ? [
        input.detuned_boundary.raw_response_log_coherence *
          input.response_gain,
        0,
      ]
      : [0, 0];
  }
  return [0, 0];
}

export function compileCasimirDpControlResponseStage4_2C(
  rawInput: CasimirDpControlResponseStage4_2CInput,
) {
  const input = CasimirDpControlResponseStage4_2CInput.parse(rawInput);
  const componentIds = input.control_cells.flatMap((cell) => [
    `${cell.cell_id}:re`,
    `${cell.cell_id}:im`,
  ]);
  if (new Set(componentIds).size !== componentIds.length) {
    throw new Error("stage4_2c_duplicate_control_component_id");
  }

  const cellNoise = input.control_cells.map((cell) =>
    sigmaForCell(input, cell)
  );
  const size = componentIds.length;
  const covariance = zeroMatrix(size);
  const sensorVariance =
    input.sensor_self_noise.raw_standard_uncertainty_log_coherence ** 2;
  input.control_cells.forEach((cell, cellIndex) => {
    const noise = cellNoise[cellIndex];
    const re = 2 * cellIndex;
    const im = re + 1;
    const baseVariance = noise.sigma ** 2 + sensorVariance;
    covariance[re][re] = baseVariance + input.covariance_jitter;
    covariance[im][im] = baseVariance + input.covariance_jitter;
    const reIm = noise.correlation * noise.sigma ** 2;
    covariance[re][im] = reIm;
    covariance[im][re] = reIm;
  });

  for (let left = 0; left < input.control_cells.length; left += 1) {
    for (
      let right = left + 1;
      right < input.control_cells.length;
      right += 1
    ) {
      const leftNoise = cellNoise[left];
      const rightNoise = cellNoise[right];
      if (leftNoise.ancestryId !== rightNoise.ancestryId) continue;
      const shared =
        leftNoise.sharedFraction *
        rightNoise.sharedFraction *
        leftNoise.sigma *
        rightNoise.sigma;
      covariance[2 * left][2 * right] = shared;
      covariance[2 * right][2 * left] = shared;
      covariance[2 * left + 1][2 * right + 1] = shared;
      covariance[2 * right + 1][2 * left + 1] = shared;
    }
  }

  const lower = cholesky(covariance);
  const rawSignatures: SignatureVector[] = LANES.map((lane) => ({
    signature_id: `stage4_2c_control_signature_${lane}`,
    lane,
    values: input.control_cells.flatMap((cell) =>
      rawLaneResponse({ input, cell, lane })
    ),
    source_ref:
      lane === "dp"
        ? "registered_dp_generator_zero_on_nuisance_controls"
        : "stage4_2c_frozen_numeric_control_response_authority",
  }));
  const whitenedSignatures = rawSignatures.map((signature) => ({
    ...signature,
    values: solveLowerTriangular(lower, signature.values),
  }));
  const maximumRoundTripError = whitenedSignatures.reduce(
    (maximum, signature, index) =>
      Math.max(
        maximum,
        maximumAbsoluteDifference(
          multiplyLower(lower, signature.values),
          rawSignatures[index].values,
        ),
      ),
    0,
  );
  const conditionUpperBound = covarianceConditionUpperBound(covariance);
  const covarianceReceipt = {
    schema_version: "casimir_dp_stage4_2c_control_covariance_receipt/1",
    dimension: size,
    component_ids_sha256: sha256(componentIds),
    covariance_sha256: sha256(covariance),
    cholesky_sha256: sha256(lower),
    shared_calibration_covariance_present: covariance.some(
      (row, rowIndex) =>
        row.some(
          (value, column) =>
            column !== rowIndex && Math.abs(value) > 0,
        ),
    ),
    sensor_self_noise_in_covariance: true,
    sensor_self_noise_in_physical_signature: false,
    covariance_condition_upper_bound: conditionUpperBound,
    covariance_positive_definite: true,
    evidence_class: "synthetic_fixture" as const,
    measured_covariance: "not_ready" as const,
  };
  const responseReceipt = {
    schema_version: "casimir_dp_stage4_2c_control_response_receipt/1",
    response_gain: input.response_gain,
    cross_axis_leakage_fraction: input.cross_axis_leakage_fraction,
    raw_signatures_sha256: sha256(rawSignatures),
    whitened_signatures_sha256: sha256(whitenedSignatures),
    maximum_round_trip_error: maximumRoundTripError,
    response_authority: "design_assumption_not_measured" as const,
    control_cells: input.control_cells.length,
    complex_components: size,
    observable_bridge_edges_added: 0,
  };

  return {
    schema_version: "casimir_dp_control_response_stage4_2c_result/1",
    gate:
      Number.isFinite(conditionUpperBound) &&
        maximumRoundTripError <= 1e-12
        ? "pass" as const
        : "blocked" as const,
    status:
      maximumRoundTripError <= 1e-12
        ? "response_and_whitening_round_trip_recovered" as const
        : "response_whitening_round_trip_failed" as const,
    component_ids: componentIds,
    raw_signatures: rawSignatures,
    whitened_signatures: whitenedSignatures,
    covariance,
    cholesky_lower: lower,
    covariance_receipt: {
      ...covarianceReceipt,
      receipt_sha256: sha256(covarianceReceipt),
    },
    response_receipt: {
      ...responseReceipt,
      receipt_sha256: sha256(responseReceipt),
    },
    axis_authority_ledger: input.control_axes.map((axis) => ({
      axis_id: axis.axis_id,
      low_level_id: axis.low_level_id,
      high_level_id: axis.high_level_id,
      low_numeric_value: axis.low_numeric_value,
      high_numeric_value: axis.high_numeric_value,
      unit: axis.unit,
      primary_lane: axis.primary_lane,
      source_ref: axis.source_ref,
      source_sha256: axis.source_sha256,
      authority_class: axis.authority_class,
      measured_response_available: axis.measured_response_available,
    })),
    sensor_self_noise_ledger: {
      admitted_as_physical_decoherence_lane: false,
      admitted_in_covariance: true,
      source_ref: input.sensor_self_noise.source_ref,
      source_sha256: input.sensor_self_noise.source_sha256,
    },
    evidence_class: "synthetic_fixture" as const,
    measured_response_authority: "not_ready" as const,
    measured_covariance: "not_ready" as const,
    measured_evidence: "not_ready" as const,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    physical_viability: "not_evaluated" as const,
    promotion_allowed: false,
    observable_bridge_edges_added: 0,
  };
}
