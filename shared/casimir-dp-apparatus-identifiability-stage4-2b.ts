// math-stage: diagnostic
import { z } from "zod";
import {
  DynamicsSignatureInput,
  estimateVisibilityRatePower,
  evaluateDynamicsSignature,
  VisibilityPowerInput,
} from "./casimir-dp-inference";

const Finite = z.number().finite();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const CasimirDpApparatusIdentifiabilityStage4_2BInput = z.object({
  schema_version: z.literal(
    "casimir_dp_apparatus_identifiability_stage4_2b/1",
  ),
  cell_ids: z.array(z.string().min(1)).min(4),
  whitened_signatures_per_sqrt_window: z.array(z.object({
    signature_id: z.string().min(1),
    lane: z.enum([
      "intercept",
      "thermal",
      "electromagnetic",
      "vibration",
      "gas",
      "readout",
      "dp",
      "bridge",
    ]),
    values: z.array(Finite).min(4),
    source_ref: z.string().min(1),
  }).strict()).min(4),
  forecast_covariance: z.object({
    covariance_receipt_sha256: Sha256,
    whitening_receipt_sha256: Sha256,
    learned_from: z.literal("calibration_or_pilot"),
    frozen_before_confirmatory: z.literal(true),
    constructed_from_full_cross_covariance: z.literal(true),
    condition_number: z.number().finite().gte(1),
    maximum_condition_number: z.number().finite().gt(1),
  }).strict(),
  design_contract: z.object({
    design_matrix_sha256: Sha256,
    cell_order_sha256: Sha256,
    frozen_before_confirmatory: z.literal(true),
    preparation_readout_intercept_included: z.literal(true),
    nuisance_columns_profiled: z.literal(true),
  }).strict(),
  bounded_parameter_regions: z.array(z.object({
    region_id: z.string().min(1),
    r0_lower_m: z.number().finite().positive(),
    r0_upper_m: z.number().finite().positive(),
    whitened_dp_signature_per_sqrt_window: z.array(Finite).min(4),
    preregistered: z.literal(true),
    external_bound_status: z.enum([
      "contextual_not_admitted",
      "admitted_not_disfavored",
      "external_disfavored",
    ]),
    source_ref: z.string().min(1),
  }).strict()).min(1).superRefine((regions, context) => {
    const ids = regions.map((region) => region.region_id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bounded DP parameter-region IDs must be unique.",
      });
    }
    regions.forEach((region, index) => {
      if (region.r0_lower_m > region.r0_upper_m) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "r0_lower_m"],
          message: "Each bounded DP region requires r0_lower_m <= r0_upper_m.",
        });
      }
    });
  }),
  power_coverage: z.object({
    asymptotic_method_valid: z.boolean(),
    simulation_coverage_validated: z.boolean(),
    simulation_coverage_probability: z.number().gt(0).lte(1),
    simulation_receipt_sha256: Sha256.nullable(),
  }).strict().superRefine((coverage, context) => {
    if (
      coverage.simulation_coverage_validated !==
        (coverage.simulation_receipt_sha256 !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["simulation_receipt_sha256"],
        message:
          "A simulation receipt is required exactly when simulation coverage is declared validated.",
      });
    }
  }),
  planned_paired_windows: z.number().int().positive(),
  thresholds: z.object({
    minimum_signature_rank: z.number().int().min(4),
    maximum_abs_whitened_cosine: z.number().gt(0).lt(0.98),
    minimum_power: z.number().gte(0.8).lt(1),
    maximum_false_positive_rate: z.number().gt(0).lt(0.5),
    minimum_companion_snr: z.number().gte(5),
    augmented_design_condition_number_max: z.number().gt(1),
  }).strict(),
  companion: z.object({
    applicable: z.boolean(),
    independently_powered: z.boolean(),
    forecast_snr: z.number().nonnegative(),
  }).strict(),
  ordinary_physics_forecast_complete: z.boolean(),
  branch_provenance_complete: z.boolean(),
  independent_replication_planned: z.boolean(),
  legacy_rate_power_input: VisibilityPowerInput,
}).strict().superRefine((input, context) => {
  input.bounded_parameter_regions.forEach((region, index) => {
    if (
      region.whitened_dp_signature_per_sqrt_window.length !==
        input.cell_ids.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          "bounded_parameter_regions",
          index,
          "whitened_dp_signature_per_sqrt_window",
        ],
        message:
          "Every bounded region requires one frozen whitened DP signature value per cell.",
      });
    }
  });
});

export type CasimirDpApparatusIdentifiabilityStage4_2BInput = z.infer<
  typeof CasimirDpApparatusIdentifiabilityStage4_2BInput
>;

type PairwiseCosine = {
  left: string;
  right: string;
  cosine: number;
};

export type CasimirDpApparatusIdentifiabilityStage4_2BResult = {
  schema_version:
    "casimir_dp_apparatus_identifiability_stage4_2b_result/1";
  gate: "pass" | "blocked";
  feasibility_verdict:
    | "apparatus_not_powered_for_dp"
    | "ordinary_physics_closure_forecast_incomplete"
    | "signature_not_identifiable"
    | "powered_parameter_region_available"
    | "apparatus_residual_forecast_ready";
  signature_rank: number;
  normalized_gram_condition_number: number | null;
  pairwise_cosines: PairwiseCosine[];
  maximum_abs_whitened_cosine: number;
  dp_profiled_fisher_information_per_window: number;
  achieved_dp_power: number;
  required_paired_windows: number | null;
  required_windows_numerically_inaccessible: boolean;
  planned_paired_windows: number;
  forecast_covariance_gate: "pass" | "blocked";
  power_coverage_gate: "pass" | "blocked";
  power_by_parameter_region: Array<{
    region_id: string;
    r0_lower_m: number;
    r0_upper_m: number;
    external_bound_status:
      | "contextual_not_admitted"
      | "admitted_not_disfavored"
      | "external_disfavored";
    signal_norm_relative_to_frozen_prediction: number | null;
    profiled_fisher_information_per_window: number;
    achieved_power: number;
    required_paired_windows: number | null;
    powered_preregistered_region: boolean;
    null_exclusion_eligible_if_measured_null: boolean;
  }>;
  powered_preregistered_region_ids: string[];
  null_exclusion_region_ids_if_measured_null: string[];
  legacy_rate_power_reconciliation: ReturnType<
    typeof estimateVisibilityRatePower
  >;
  dynamics_signature_reconciliation: ReturnType<
    typeof evaluateDynamicsSignature
  >;
  named_dp_support_path: "blocked" | "forecast_eligible";
  blockers: string[];
  bounded_redesign_requirements: string[];
  evidence_class: "synthetic_fixture";
  measured_evidence: "not_ready";
  collapse_identification: "blocked";
  manifold_dynamics: "blocked";
  physical_viability: "not_evaluated";
};

function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function norm(values: number[]): number {
  return Math.sqrt(dot(values, values));
}

function normalize(values: number[]): number[] {
  const magnitude = norm(values);
  return magnitude === 0 ? values.map(() => 0) : values.map((v) => v / magnitude);
}

function orthonormalBasis(vectors: number[][]): number[][] {
  const basis: number[][] = [];
  for (const vector of vectors) {
    let residual = [...vector];
    for (const axis of basis) {
      const projection = dot(residual, axis);
      residual = residual.map(
        (value, index) => value - projection * axis[index],
      );
    }
    const magnitude = norm(residual);
    if (magnitude > 1e-12) {
      basis.push(residual.map((value) => value / magnitude));
    }
  }
  return basis;
}

function residualize(vector: number[], basis: number[][]): number[] {
  let residual = [...vector];
  for (const axis of basis) {
    const projection = dot(residual, axis);
    residual = residual.map(
      (value, index) => value - projection * axis[index],
    );
  }
  return residual;
}

function matrixRank(rows: number[][], tolerance = 1e-10): number {
  if (rows.length === 0) return 0;
  const matrix = rows.map((row) => [...row]);
  const rowCount = matrix.length;
  const columnCount = matrix[0].length;
  let rank = 0;
  for (let column = 0; column < columnCount && rank < rowCount; column += 1) {
    let pivot = rank;
    for (let row = rank + 1; row < rowCount; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) {
        pivot = row;
      }
    }
    if (Math.abs(matrix[pivot][column]) <= tolerance) continue;
    [matrix[rank], matrix[pivot]] = [matrix[pivot], matrix[rank]];
    const pivotValue = matrix[rank][column];
    for (let entry = column; entry < columnCount; entry += 1) {
      matrix[rank][entry] /= pivotValue;
    }
    for (let row = 0; row < rowCount; row += 1) {
      if (row === rank) continue;
      const factor = matrix[row][column];
      for (let entry = column; entry < columnCount; entry += 1) {
        matrix[row][entry] -= factor * matrix[rank][entry];
      }
    }
    rank += 1;
  }
  return rank;
}

function symmetricEigenvalues(raw: number[][]): number[] {
  const matrix = raw.map((row) => [...row]);
  const n = matrix.length;
  for (let iteration = 0; iteration < 100 * Math.max(1, n); iteration += 1) {
    let p = 0;
    let q = 0;
    let maximum = 0;
    for (let row = 0; row < n; row += 1) {
      for (let column = row + 1; column < n; column += 1) {
        if (Math.abs(matrix[row][column]) > maximum) {
          maximum = Math.abs(matrix[row][column]);
          p = row;
          q = column;
        }
      }
    }
    if (maximum < 1e-12) break;
    const angle = 0.5 * Math.atan2(
      2 * matrix[p][q],
      matrix[q][q] - matrix[p][p],
    );
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let k = 0; k < n; k += 1) {
      if (k === p || k === q) continue;
      const mkp = matrix[k][p];
      const mkq = matrix[k][q];
      matrix[k][p] = matrix[p][k] = cosine * mkp - sine * mkq;
      matrix[k][q] = matrix[q][k] = sine * mkp + cosine * mkq;
    }
    const app = matrix[p][p];
    const aqq = matrix[q][q];
    const apq = matrix[p][q];
    matrix[p][p] =
      cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
    matrix[q][q] =
      sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
    matrix[p][q] = matrix[q][p] = 0;
  }
  return matrix.map((row, index) => row[index]).sort((a, b) => a - b);
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial =
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t -
      0.284496736) * t + 0.254829592) * t;
  const erf = sign * (1 - polynomial * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

function inverseStandardNormal(probability: number): number {
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];
  const low = 0.02425;
  const high = 1 - low;
  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) *
      q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (probability > high) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) *
      q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) *
    r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) *
      r + 1);
}

export function evaluateCasimirDpApparatusIdentifiabilityStage4_2B(
  rawInput: CasimirDpApparatusIdentifiabilityStage4_2BInput,
): CasimirDpApparatusIdentifiabilityStage4_2BResult {
  const input = CasimirDpApparatusIdentifiabilityStage4_2BInput.parse(rawInput);
  const blockers: string[] = [];
  if (new Set(input.cell_ids).size !== input.cell_ids.length) {
    blockers.push("duplicate_cell_id");
  }
  const signatureIds = input.whitened_signatures_per_sqrt_window.map(
    (signature) => signature.signature_id,
  );
  if (new Set(signatureIds).size !== signatureIds.length) {
    blockers.push("duplicate_signature_id");
  }
  if (
    input.whitened_signatures_per_sqrt_window.some(
      (signature) => signature.values.length !== input.cell_ids.length,
    )
  ) {
    blockers.push("signature_cell_dimension_mismatch");
  }
  const requiredLanes = [
    "intercept",
    "thermal",
    "electromagnetic",
    "vibration",
    "gas",
    "readout",
    "dp",
  ] as const;
  for (const lane of requiredLanes) {
    const count = input.whitened_signatures_per_sqrt_window.filter(
      (signature) => signature.lane === lane,
    ).length;
    if (count !== 1) blockers.push(`lane_${lane}_count_${count}`);
  }

  const signatures = input.whitened_signatures_per_sqrt_window;
  const alignedValues = signatures.map((signature) =>
    input.cell_ids.map((_, index) => signature.values[index] ?? 0)
  );
  const normalized = alignedValues.map((values) => normalize(values));
  const designRows = input.cell_ids.map((_, cellIndex) =>
    normalized.map((signature) => signature[cellIndex] ?? 0)
  );
  const rank = blockers.includes("signature_cell_dimension_mismatch")
    ? 0
    : matrixRank(designRows);

  const pairwiseCosines: PairwiseCosine[] = [];
  for (let left = 0; left < normalized.length; left += 1) {
    for (let right = left + 1; right < normalized.length; right += 1) {
      pairwiseCosines.push({
        left: signatures[left].signature_id,
        right: signatures[right].signature_id,
        cosine: dot(normalized[left], normalized[right]),
      });
    }
  }
  const maximumCosine = pairwiseCosines.reduce(
    (maximum, row) => Math.max(maximum, Math.abs(row.cosine)),
    0,
  );

  const gram = normalized.map((left) =>
    normalized.map((right) => dot(left, right))
  );
  const eigenvalues = symmetricEigenvalues(gram);
  const positive = eigenvalues.filter((value) => value > 1e-12);
  const conditionNumber = positive.length === gram.length
    ? Math.max(...positive) / Math.min(...positive)
    : null;

  const dp = signatures.find((signature) => signature.lane === "dp");
  if (dp == null) blockers.push("missing_dp_signature");
  const dpIndex = signatures.findIndex((signature) => signature.lane === "dp");
  const dpValues = dpIndex < 0 ? null : alignedValues[dpIndex];
  const nuisanceBasis = orthonormalBasis(
    signatures.flatMap((signature, index) =>
      signature.lane !== "dp" && signature.lane !== "bridge"
        ? [alignedValues[index]]
        : []
    ),
  );
  const profiledDp =
    dpValues == null ? [] : residualize(dpValues, nuisanceBasis);
  const dpInformationPerWindow = dp == null ? 0 : squared(profiledDp);
  const totalDpInformation =
    dpInformationPerWindow * input.planned_paired_windows;
  const zAlpha = inverseStandardNormal(
    1 - input.thresholds.maximum_false_positive_rate / 2,
  );
  const zPower = inverseStandardNormal(input.thresholds.minimum_power);
  const achievedPower = normalCdf(Math.sqrt(totalDpInformation) - zAlpha);
  const targetZ = zAlpha + zPower;
  const rawRequired = dpInformationPerWindow > 0
    ? Math.ceil(targetZ ** 2 / dpInformationPerWindow)
    : Number.POSITIVE_INFINITY;
  const requiredPairedWindows = Number.isSafeInteger(rawRequired)
    ? rawRequired
    : null;
  const forecastCovariancePass =
    input.forecast_covariance.condition_number <=
      input.forecast_covariance.maximum_condition_number;
  if (!forecastCovariancePass) {
    blockers.push("forecast_covariance_not_identifiable");
  }
  const powerCoveragePass =
    input.power_coverage.asymptotic_method_valid ||
    (
      input.power_coverage.simulation_coverage_validated &&
      input.power_coverage.simulation_coverage_probability >= 0.95 &&
      input.power_coverage.simulation_receipt_sha256 !== null
    );
  if (!powerCoveragePass) {
    blockers.push("power_coverage_not_validated");
  }
  const powerByParameterRegion = input.bounded_parameter_regions.map(
    (region) => {
      const regionVector = input.cell_ids.map(
        (_, index) =>
          region.whitened_dp_signature_per_sqrt_window[index] ?? 0,
      );
      const regionProfiled = residualize(regionVector, nuisanceBasis);
      const informationPerWindow = squared(regionProfiled);
      const frozenNorm = dpValues == null ? 0 : norm(dpValues);
      const relativeNorm = frozenNorm > 0
        ? norm(regionVector) / frozenNorm
        : null;
      const totalInformation =
        informationPerWindow * input.planned_paired_windows;
      const achievedRegionPower =
        normalCdf(Math.sqrt(totalInformation) - zAlpha);
      const rawRequiredRegion = informationPerWindow > 0
        ? Math.ceil(targetZ ** 2 / informationPerWindow)
        : Number.POSITIVE_INFINITY;
      const requiredRegionWindows =
        Number.isSafeInteger(rawRequiredRegion)
          ? rawRequiredRegion
          : null;
      const powered =
        powerCoveragePass &&
        region.external_bound_status !== "external_disfavored" &&
        achievedRegionPower >= input.thresholds.minimum_power &&
        requiredRegionWindows !== null &&
        requiredRegionWindows <= input.planned_paired_windows;
      return {
        region_id: region.region_id,
        r0_lower_m: region.r0_lower_m,
        r0_upper_m: region.r0_upper_m,
        external_bound_status: region.external_bound_status,
        signal_norm_relative_to_frozen_prediction: relativeNorm,
        profiled_fisher_information_per_window: informationPerWindow,
        achieved_power: achievedRegionPower,
        required_paired_windows: requiredRegionWindows,
        powered_preregistered_region: powered,
        null_exclusion_eligible_if_measured_null: powered,
      };
    },
  );
  const poweredParameterRegionIds = powerByParameterRegion
    .filter((region) => region.powered_preregistered_region)
    .map((region) => region.region_id);

  const requiredRank = Math.max(
    input.thresholds.minimum_signature_rank,
    signatures.length,
  );
  if (rank < requiredRank) {
    blockers.push("signature_rank_below_threshold");
  }
  if (maximumCosine >= input.thresholds.maximum_abs_whitened_cosine) {
    blockers.push("signature_collinearity_above_threshold");
  }
  if (
    conditionNumber == null ||
    conditionNumber > input.thresholds.augmented_design_condition_number_max
  ) {
    blockers.push("augmented_design_condition_number_above_threshold");
  }
  if (!input.ordinary_physics_forecast_complete) {
    blockers.push("ordinary_physics_closure_forecast_incomplete");
  }
  if (!input.branch_provenance_complete) {
    blockers.push("branch_provenance_incomplete");
  }
  if (!input.independent_replication_planned) {
    blockers.push("independent_replication_not_planned");
  }
  if (
    !input.companion.applicable ||
    !input.companion.independently_powered ||
    input.companion.forecast_snr < input.thresholds.minimum_companion_snr
  ) {
    blockers.push("applicable_powered_companion_below_threshold");
  }

  const ordinaryCombined = input.cell_ids.map((_, index) =>
    signatures
      .filter((signature) => signature.lane !== "dp" && signature.lane !== "bridge")
      .reduce((sum, signature) => sum + (signature.values[index] ?? 0), 0)
  );
  const dynamicsSignature = evaluateDynamicsSignature(
    DynamicsSignatureInput.parse({
      schema_version: "casimir_dp_dynamics_signature/1",
      observable_ids: input.cell_ids,
      standard_decoherence_signature: ordinaryCombined,
      collapse_signature: dpValues,
      one_sigma_uncertainties: input.cell_ids.map(() => 1),
      collapse_signature_source_ref: dp?.source_ref ?? null,
      maximum_whitened_cosine:
        input.thresholds.maximum_abs_whitened_cosine,
    }),
  );
  const legacyPower = estimateVisibilityRatePower(input.legacy_rate_power_input);

  let feasibility:
    CasimirDpApparatusIdentifiabilityStage4_2BResult["feasibility_verdict"];
  if (!input.ordinary_physics_forecast_complete) {
    feasibility = "ordinary_physics_closure_forecast_incomplete";
  } else if (
    rank < requiredRank ||
    maximumCosine >= input.thresholds.maximum_abs_whitened_cosine ||
    conditionNumber == null ||
    conditionNumber > input.thresholds.augmented_design_condition_number_max ||
    !forecastCovariancePass ||
    !powerCoveragePass
  ) {
    feasibility = "signature_not_identifiable";
  } else if (poweredParameterRegionIds.length > 0) {
    feasibility = "powered_parameter_region_available";
  } else {
    feasibility = "apparatus_not_powered_for_dp";
  }

  const supportEligible =
    feasibility === "powered_parameter_region_available" &&
    input.branch_provenance_complete &&
    input.independent_replication_planned &&
    input.companion.applicable &&
    input.companion.independently_powered &&
    input.companion.forecast_snr >= input.thresholds.minimum_companion_snr;

  const redesign: string[] = [];
  if (
    requiredPairedWindows == null ||
    requiredPairedWindows > input.planned_paired_windows
  ) {
    redesign.push(
      requiredPairedWindows == null
        ? "The profiled DP information is numerically inaccessible; increase the frozen DP signature or reduce nuisance degeneracy without post-hoc retuning."
        : `Increase paired windows from ${input.planned_paired_windows} to at least ${requiredPairedWindows} or increase the frozen DP signature without degrading ordinary closure.`,
    );
  }
  if (rank < requiredRank) {
    redesign.push("Add independently swept cells that increase signature rank.");
  }
  if (maximumCosine >= input.thresholds.maximum_abs_whitened_cosine) {
    redesign.push(
      "Add temperature, pressure, vibration, charge, path-swap, or echo controls that decorrelate the leading signatures.",
    );
  }
  if (
    conditionNumber == null ||
    conditionNumber > input.thresholds.augmented_design_condition_number_max
  ) {
    redesign.push(
      "Reduce multivariate collinearity in the full fitted/profiled design; pairwise cosine alone is insufficient.",
    );
  }
  if (!supportEligible) {
    redesign.push(
      "Retain compatibility/exclusion-only language until branch provenance, replication, and a powered companion all pass.",
    );
  }

  return {
    schema_version:
      "casimir_dp_apparatus_identifiability_stage4_2b_result/1",
    gate: blockers.filter((code) =>
      ![
        "applicable_powered_companion_below_threshold",
        "branch_provenance_incomplete",
      ].includes(code)
    ).length === 0
      ? "pass"
      : "blocked",
    feasibility_verdict: feasibility,
    signature_rank: rank,
    normalized_gram_condition_number: conditionNumber,
    pairwise_cosines: pairwiseCosines,
    maximum_abs_whitened_cosine: maximumCosine,
    dp_profiled_fisher_information_per_window: dpInformationPerWindow,
    achieved_dp_power: achievedPower,
    required_paired_windows: requiredPairedWindows,
    required_windows_numerically_inaccessible:
      requiredPairedWindows == null,
    planned_paired_windows: input.planned_paired_windows,
    forecast_covariance_gate:
      forecastCovariancePass ? "pass" : "blocked",
    power_coverage_gate: powerCoveragePass ? "pass" : "blocked",
    power_by_parameter_region: powerByParameterRegion,
    powered_preregistered_region_ids: poweredParameterRegionIds,
    null_exclusion_region_ids_if_measured_null:
      poweredParameterRegionIds,
    legacy_rate_power_reconciliation: legacyPower,
    dynamics_signature_reconciliation: dynamicsSignature,
    named_dp_support_path: supportEligible ? "forecast_eligible" : "blocked",
    blockers,
    bounded_redesign_requirements: redesign,
    evidence_class: "synthetic_fixture",
    measured_evidence: "not_ready",
    collapse_identification: "blocked",
    manifold_dynamics: "blocked",
    physical_viability: "not_evaluated",
  };
}

function squared(values: number[]): number {
  return values.reduce((sum, value) => sum + value * value, 0);
}
