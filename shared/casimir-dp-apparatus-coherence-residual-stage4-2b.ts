// math-stage: diagnostic
import { z } from "zod";

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Finite = z.number().finite();

const Observation = z.object({
  cell_id: z.string().min(1),
  pair_id: z.string().min(1),
  joint_state_receipt_sha256: Sha256,
  analysis_role: z.enum(["pilot", "held_out", "replication"]),
  boundary_state: z.enum(["on", "off"]),
  hold_time_s: z.number().nonnegative(),
  visibility: z.number().nonnegative().lte(1),
  reference_visibility: z.number().gt(0).lte(1),
  phase_rad: Finite,
  real_coherence: Finite,
  imaginary_coherence: Finite,
  ordinary_chi: z.number().nonnegative(),
  ordinary_phase_rad: Finite,
  dp_chi: z.number().nonnegative(),
  bridge_chi: z.number().nonnegative().nullable(),
  complete_joint_system_equivalence: z.boolean(),
}).strict();

export const CasimirDpApparatusCoherenceResidualStage4_2BInput = z.object({
  schema_version: z.literal(
    "casimir_dp_apparatus_coherence_residual_stage4_2b/1",
  ),
  evidence_class: z.literal("synthetic_fixture"),
  observations: z.array(Observation).min(8),
  residual_covariance: z.array(z.array(Finite)).min(8),
  complex_covariance: z.array(z.array(Finite)).nullable(),
  covariance_receipt: z.object({
    row_ids: z.array(z.string().min(1)).min(8),
    complex_row_ids: z.array(z.string().min(1)).nullable(),
    row_order_sha256: Sha256,
    constructed_from_full_cross_covariance: z.literal(true),
    jacobian_receipt_sha256: Sha256,
    cross_covariance_receipt_sha256: Sha256,
    condition_number_max: z.number().gt(1),
    shrinkage_or_jitter_frozen_from_pilot: z.literal(true),
  }).strict(),
  likelihood: z.object({
    mode: z.enum(["raw_complex", "gaussian_log_visibility"]),
    gaussian_coverage_validated: z.boolean(),
    minimum_covered_visibility: z.number().gt(0).lte(1),
    coverage_probability: z.number().gt(0).lte(1),
    coherence_consistency_tolerance: z.number().positive().lt(0.1),
  }).strict(),
  design_grid: z.object({
    minimum_distinct_hold_times: z.number().int().min(4),
    minimum_positive_hold_time_span_ratio: z.number().gte(4),
    zero_time_intercept_required: z.literal(true),
  }).strict(),
  replication_partition: z.object({
    partition_id: z.string().min(1),
    replication_id: z.string().min(1),
    independently_operated: z.literal(true),
    planned: z.literal(true),
    measured_evidence: z.literal("not_ready"),
    scored_with_primary_confirmatory: z.literal(false),
    nuisance_refit_allowed: z.literal(false),
    receipt_sha256: Sha256,
  }).strict(),
  freeze: z.object({
    pilot_fit_completed_at: z.string().datetime(),
    analysis_frozen_at: z.string().datetime(),
    confirmatory_acquired_at: z.string().datetime(),
    nuisance_parameters_frozen: z.literal(true),
    sensor_model_frozen: z.literal(true),
    covariance_frozen: z.literal(true),
    exclusions_frozen: z.literal(true),
    predictions_frozen: z.literal(true),
    cell_order_frozen: z.literal(true),
    scoring_code_sha256: Sha256,
    prediction_vector_sha256: Sha256,
    automatic_unblinding_allowed: z.literal(false),
    synthetic_contract_only: z.literal(true),
  }).strict(),
  dp_predictor: z.object({
    manifest_sha256: z.literal(
      "4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6",
    ),
    generator: z.literal(
      "nonrelativistic_markovian_mass_density_dp",
    ),
    boundary_variable_in_unmodified_generator: z.literal(false),
    fitted_amplitude_allowed: z.literal(false),
    fitted_amplitude: z.literal(1),
    r0_retuned_after_freeze: z.literal(false),
    branch_provenance_complete: z.boolean(),
    boundary_identity_absolute_tolerance: z.number().nonnegative(),
  }).strict(),
  bridge: z.object({
    role: z.enum(["none", "replacement", "dp_modifier"]),
    admitted: z.boolean(),
    kernel_sha256: Sha256.nullable(),
  }).strict(),
}).strict();

export type CasimirDpApparatusCoherenceResidualStage4_2BInput = z.infer<
  typeof CasimirDpApparatusCoherenceResidualStage4_2BInput
>;

export type CasimirDpApparatusCoherenceResidualStage4_2BFailure = {
  code: string;
  reason: string;
};

type ModelScore = {
  model_id: "M0" | "M0_plus_DP" | "M0_plus_bridge" | "M0_plus_DP_plus_bridge";
  likelihood_space: "raw_complex" | "gaussian_log_visibility";
  q: number;
  delta_q_from_m0: number;
  confirmatory_amplitude_fitted: false;
};

export type CasimirDpApparatusCoherenceResidualStage4_2BResult = {
  schema_version:
    "casimir_dp_apparatus_coherence_residual_stage4_2b_result/1";
  gate: "pass" | "blocked";
  first_failure: CasimirDpApparatusCoherenceResidualStage4_2BFailure | null;
  failures: CasimirDpApparatusCoherenceResidualStage4_2BFailure[];
  likelihood_gate: "pass" | "blocked";
  covariance_gate: "positive_definite" | "not_identifiable";
  covariance_condition_number: number | null;
  covariance_condition_metric:
    | "jacobi_eigenvalue_ratio"
    | "conservative_infinity_norm_upper_bound";
  confirmatory_data_leakage_gate: "pass" | "blocked";
  pilot_partition_gate: "pass" | "blocked";
  hold_time_grid_gate: "pass" | "blocked";
  replication_partition_gate: "planned_not_measured" | "blocked";
  residuals: Array<{
    cell_id: string;
    pair_id: string;
    boundary_state: "on" | "off";
    hold_time_s: number;
    coherence_exponent: number | null;
    residual_exponent: number | null;
    log_residual_status:
      | "resolved"
      | "undefined_at_zero_visibility_raw_complex";
    phase_residual_rad: number | null;
    phase_residual_status:
      | "resolved"
      | "undefined_at_zero_visibility_raw_complex";
    dp_signature: number;
    bridge_signature: number | null;
  }>;
  cholesky_lower: number[][] | null;
  whitened_residual: number[] | null;
  boundary_contrasts: Array<{
    pair_id: string;
    on_minus_off_residual: number | null;
    log_residual_status:
      | "resolved"
      | "undefined_at_zero_visibility_raw_complex";
    registered_dp_conditional_null_applicable: boolean;
    dp_on_minus_off: number;
  }>;
  model_scores: ModelScore[];
  strict_dp_score: number | null;
  bridge_score: number | null;
  unblinded: false;
  evidence_class: "synthetic_fixture";
  measured_evidence: "not_ready";
  collapse_identification: "blocked";
  manifold_dynamics: "blocked";
  physical_viability: "not_evaluated";
};

function fail(
  code: string,
  reason: string,
): CasimirDpApparatusCoherenceResidualStage4_2BFailure {
  return { code, reason };
}

function cholesky(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  if (n === 0 || matrix.some((row) => row.length !== n)) return null;
  const scale = matrix.reduce(
    (maximum, row) => row.reduce(
      (rowMaximum, value) => Math.max(rowMaximum, Math.abs(value)),
      maximum,
    ),
    Number.MIN_VALUE,
  );
  const lower = Array.from({ length: n }, () => Array(n).fill(0));
  for (let row = 0; row < n; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = matrix[row][column];
      for (let k = 0; k < column; k += 1) {
        sum -= lower[row][k] * lower[column][k];
      }
      if (row === column) {
        if (
          !Number.isFinite(sum) ||
          sum <= Number.EPSILON * 64 * scale
        ) {
          return null;
        }
        lower[row][column] = Math.sqrt(sum);
      } else {
        lower[row][column] = sum / lower[column][column];
      }
    }
  }
  return lower;
}

function solveLower(lower: number[][], vector: number[]): number[] {
  const output = Array(vector.length).fill(0);
  for (let row = 0; row < vector.length; row += 1) {
    let value = vector[row];
    for (let column = 0; column < row; column += 1) {
      value -= lower[row][column] * output[column];
    }
    output[row] = value / lower[row][row];
  }
  return output;
}

function squaredNorm(values: number[]): number {
  return values.reduce((sum, value) => sum + value * value, 0);
}

function modelQ(
  lower: number[][],
  observed: number[],
  predicted: number[],
): number {
  return squaredNorm(
    solveLower(
      lower,
      observed.map((value, index) => value - predicted[index]),
    ),
  );
}

function symmetric(matrix: number[][]): boolean {
  if (
    matrix.length === 0 ||
    matrix.some((row) => row.length !== matrix.length)
  ) {
    return false;
  }
  const scale = matrix.reduce(
    (maximum, row) => row.reduce(
      (rowMaximum, value) => Math.max(rowMaximum, Math.abs(value)),
      maximum,
    ),
    Number.MIN_VALUE,
  );
  return matrix.every((row, i) =>
    row.every((value, j) =>
      Number.isFinite(value) &&
      Math.abs(value - matrix[j]?.[i]) <=
        1e-12 * scale
    )
  );
}

function eigenvaluesSymmetric(raw: number[][]): number[] {
  const scale = raw.reduce(
    (maximum, row) => row.reduce(
      (rowMaximum, value) => Math.max(rowMaximum, Math.abs(value)),
      maximum,
    ),
    Number.MIN_VALUE,
  );
  const matrix = raw.map((row) => row.map((value) => value / scale));
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
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    for (let k = 0; k < n; k += 1) {
      if (k === p || k === q) continue;
      const kp = matrix[k][p];
      const kq = matrix[k][q];
      matrix[k][p] = matrix[p][k] = c * kp - s * kq;
      matrix[k][q] = matrix[q][k] = s * kp + c * kq;
    }
    const pp = matrix[p][p];
    const qq = matrix[q][q];
    const pq = matrix[p][q];
    matrix[p][p] = c * c * pp - 2 * s * c * pq + s * s * qq;
    matrix[q][q] = s * s * pp + 2 * s * c * pq + c * c * qq;
    matrix[p][q] = matrix[q][p] = 0;
  }
  return matrix.map((row, index) => row[index] * scale);
}

function conditionNumber(matrix: number[][]): number | null {
  if (
    matrix.length === 0 ||
    matrix.some((row) => row.length !== matrix.length)
  ) {
    return null;
  }
  if (matrix.length > 96) {
    const maximumAbsoluteRowSum = matrix.reduce(
      (maximum, row) => Math.max(
        maximum,
        row.reduce((sum, value) => sum + Math.abs(value), 0),
      ),
      0,
    );
    const minimumDiagonalDominanceMargin = matrix.reduce(
      (minimum, row, rowIndex) => {
        const offDiagonalSum = row.reduce(
          (sum, value, columnIndex) =>
            columnIndex === rowIndex ? sum : sum + Math.abs(value),
          0,
        );
        return Math.min(
          minimum,
          Math.abs(row[rowIndex]) - offDiagonalSum,
        );
      },
      Number.POSITIVE_INFINITY,
    );
    let inverseInfinityNormUpperBound: number | null = null;
    if (minimumDiagonalDominanceMargin > 0) {
      inverseInfinityNormUpperBound =
        1 / minimumDiagonalDominanceMargin;
    } else {
      const lower = cholesky(matrix);
      if (lower != null) {
        const inverseAbsoluteRowSums = Array(matrix.length).fill(0);
        for (let column = 0; column < matrix.length; column += 1) {
          const basis = Array(matrix.length).fill(0);
          basis[column] = 1;
          const intermediate = solveLower(lower, basis);
          const inverseColumn = Array(matrix.length).fill(0);
          for (let row = matrix.length - 1; row >= 0; row -= 1) {
            let value = intermediate[row];
            for (
              let upperColumn = row + 1;
              upperColumn < matrix.length;
              upperColumn += 1
            ) {
              value -= lower[upperColumn][row] *
                inverseColumn[upperColumn];
            }
            inverseColumn[row] = value / lower[row][row];
          }
          inverseColumn.forEach((value, row) => {
            inverseAbsoluteRowSums[row] += Math.abs(value);
          });
        }
        inverseInfinityNormUpperBound =
          inverseAbsoluteRowSums.reduce(
            (maximum, value) => Math.max(maximum, value),
            0,
          );
      }
    }
    const upperBound = inverseInfinityNormUpperBound == null
      ? Number.NaN
      : maximumAbsoluteRowSum * inverseInfinityNormUpperBound;
    return Number.isFinite(upperBound) ? upperBound : null;
  }
  const values = eigenvaluesSymmetric(matrix);
  if (values.some((value) => !Number.isFinite(value))) return null;
  const minimum = values.reduce(
    (current, value) => Math.min(current, value),
    Number.POSITIVE_INFINITY,
  );
  const maximum = values.reduce(
    (current, value) => Math.max(current, value),
    Number.NEGATIVE_INFINITY,
  );
  const value = minimum > 0 ? maximum / minimum : Number.NaN;
  return Number.isFinite(value) ? value : null;
}

function phaseDistance(left: number, right: number): number {
  return Math.atan2(Math.sin(left - right), Math.cos(left - right));
}

function predictedComplex(
  rows: ReturnType<typeof buildResiduals>,
  signature: number[],
): number[] {
  return rows.flatMap((row, index) => {
    const visibility = row.reference_visibility *
      Math.exp(-(row.ordinary_chi + signature[index]));
    return [
      visibility * Math.cos(row.ordinary_phase_rad),
      visibility * Math.sin(row.ordinary_phase_rad),
    ];
  });
}

function buildResiduals(
  heldOut: CasimirDpApparatusCoherenceResidualStage4_2BInput["observations"],
) {
  return heldOut.map((row) => {
    const coherenceExponent = row.visibility > 0
      ? -Math.log(row.visibility / row.reference_visibility)
      : null;
    return {
      ...row,
      coherence_exponent: coherenceExponent,
      residual_exponent: coherenceExponent == null
        ? null
        : coherenceExponent - row.ordinary_chi,
      log_residual_status: coherenceExponent == null
        ? "undefined_at_zero_visibility_raw_complex" as const
        : "resolved" as const,
      phase_residual_rad: row.visibility > 0
        ? phaseDistance(
          row.phase_rad,
          row.ordinary_phase_rad,
        )
        : null,
      phase_residual_status: row.visibility > 0
        ? "resolved" as const
        : "undefined_at_zero_visibility_raw_complex" as const,
      dp_signature: row.dp_chi,
      bridge_signature: row.bridge_chi,
    };
  });
}

export function evaluateCasimirDpApparatusCoherenceResidualStage4_2B(
  rawInput: CasimirDpApparatusCoherenceResidualStage4_2BInput,
): CasimirDpApparatusCoherenceResidualStage4_2BResult {
  const input = CasimirDpApparatusCoherenceResidualStage4_2BInput.parse(rawInput);
  const pilot = input.observations.filter(
    (row) => row.analysis_role === "pilot",
  );
  const heldOut = input.observations.filter(
    (row) => row.analysis_role === "held_out",
  );
  const failures: CasimirDpApparatusCoherenceResidualStage4_2BFailure[] = [];

  const pilotPartitionPass = pilot.length > 0;
  if (!pilotPartitionPass) {
    failures.push(fail(
      "pilot_partition_missing",
      "At least one explicit pilot row is required to substantiate the pre-confirmatory fit-and-freeze partition.",
    ));
  }

  const cellIds = heldOut.map((row) => row.cell_id);
  if (new Set(cellIds).size !== cellIds.length) {
    failures.push(fail("duplicate_cell_id", "Held-out cell ids must be unique."));
  }
  if (
    input.covariance_receipt.row_ids.length !== cellIds.length ||
    input.covariance_receipt.row_ids.some((id, index) => id !== cellIds[index])
  ) {
    failures.push(fail(
      "covariance_row_order_mismatch",
      "The covariance receipt row ids must exactly match the frozen held-out cell ordering.",
    ));
  }
  const expectedComplexRowIds = cellIds.flatMap((id) => [`${id}:re`, `${id}:im`]);
  if (
    input.likelihood.mode === "raw_complex" &&
    (
      input.covariance_receipt.complex_row_ids == null ||
      input.covariance_receipt.complex_row_ids.length !==
        expectedComplexRowIds.length ||
      input.covariance_receipt.complex_row_ids.some(
        (id, index) => id !== expectedComplexRowIds[index],
      )
    )
  ) {
    failures.push(fail(
      "complex_covariance_row_order_mismatch",
      "Raw-complex covariance rows must follow the frozen cell_id:re, cell_id:im ordering.",
    ));
  }

  const pilotAt = Date.parse(input.freeze.pilot_fit_completed_at);
  const frozenAt = Date.parse(input.freeze.analysis_frozen_at);
  const acquiredAt = Date.parse(input.freeze.confirmatory_acquired_at);
  const leakagePass = pilotAt <= frozenAt && frozenAt < acquiredAt;
  if (!leakagePass) {
    failures.push(fail(
      "confirmatory_data_leakage",
      "Pilot fitting must finish before analysis freeze and confirmatory acquisition must follow it.",
    ));
  }

  const distinctTimes = [...new Set(heldOut.map((row) => row.hold_time_s))]
    .sort((a, b) => a - b);
  const positiveTimes = distinctTimes.filter((time) => time > 0);
  const holdGridPass =
    distinctTimes.length >= input.design_grid.minimum_distinct_hold_times &&
    distinctTimes[0] === 0 &&
    positiveTimes.length >= 2 &&
    positiveTimes[positiveTimes.length - 1] / positiveTimes[0] >=
      input.design_grid.minimum_positive_hold_time_span_ratio;
  if (!holdGridPass) {
    failures.push(fail(
      "hold_time_grid_not_identifiable",
      "The held-out grid requires a zero-time intercept, four distinct times, and the frozen positive-time span.",
    ));
  }
  const replicationPartitionPass =
    input.replication_partition.independently_operated &&
    input.replication_partition.planned &&
    input.replication_partition.measured_evidence === "not_ready" &&
    !input.replication_partition.scored_with_primary_confirmatory &&
    !input.replication_partition.nuisance_refit_allowed;
  if (!replicationPartitionPass) {
    failures.push(fail(
      "replication_partition_contract_failure",
      "Independent replication must be planned, remain unmeasured, stay outside primary confirmatory scoring, and prohibit nuisance refitting.",
    ));
  }

  if (
    input.bridge.role === "none" &&
    (
      input.bridge.admitted ||
      input.bridge.kernel_sha256 != null ||
      heldOut.some((row) => (row.bridge_chi ?? 0) !== 0)
    )
  ) {
    failures.push(fail(
      "unregistered_bridge_signature",
      "Bridge role none forbids a bridge kernel and every nonzero bridge prediction.",
    ));
  }
  if (
    input.bridge.role !== "none" &&
    (!input.bridge.admitted || input.bridge.kernel_sha256 == null)
  ) {
    failures.push(fail(
      "bridge_kernel_not_admitted",
      "A replacement or DP-modifier bridge requires one admitted hashed kernel.",
    ));
  }

  for (const row of heldOut) {
    const magnitude = Math.hypot(row.real_coherence, row.imaginary_coherence);
    const phase = Math.atan2(row.imaginary_coherence, row.real_coherence);
    if (
      Math.abs(magnitude - row.visibility) >
        input.likelihood.coherence_consistency_tolerance ||
      (
        magnitude > 0 &&
        Math.abs(phaseDistance(phase, row.phase_rad)) >
        input.likelihood.coherence_consistency_tolerance
      )
    ) {
      failures.push(fail(
        "complex_coherence_component_mismatch",
        `Cell ${row.cell_id} has inconsistent Re/Im, visibility, or phase values.`,
      ));
      break;
    }
  }

  const residualRows = buildResiduals(heldOut);
  const pairMap = new Map<string, typeof residualRows>();
  for (const row of residualRows) {
    const values = pairMap.get(row.pair_id) ?? [];
    values.push(row);
    pairMap.set(row.pair_id, values);
  }
  const boundaryContrasts: CasimirDpApparatusCoherenceResidualStage4_2BResult[
    "boundary_contrasts"
  ] = [];
  for (const [pairId, values] of pairMap) {
    const on = values.filter((row) => row.boundary_state === "on");
    const off = values.filter((row) => row.boundary_state === "off");
    if (values.length !== 2 || on.length !== 1 || off.length !== 1) {
      failures.push(fail(
        "boundary_pair_not_exact",
        `Pair ${pairId} must contain exactly one on and one off row.`,
      ));
      continue;
    }
    const dpDifference = on[0].dp_chi - off[0].dp_chi;
    if (
      on[0].hold_time_s !== off[0].hold_time_s ||
      on[0].joint_state_receipt_sha256 !== off[0].joint_state_receipt_sha256
    ) {
      failures.push(fail(
        "boundary_pair_axis_or_receipt_mismatch",
        `Pair ${pairId} must bind equal hold time and one shared complete-joint-system state receipt.`,
      ));
    }
    const equivalent = values.every(
      (row) => row.complete_joint_system_equivalence,
    ) &&
      on[0].hold_time_s === off[0].hold_time_s &&
      on[0].joint_state_receipt_sha256 === off[0].joint_state_receipt_sha256;
    if (
      equivalent &&
      Math.abs(dpDifference) >
        input.dp_predictor.boundary_identity_absolute_tolerance
    ) {
      failures.push(fail(
        "conditional_dp_boundary_identity_failure",
        `Pair ${pairId} is marked equivalent but its registered DP prediction changes with boundary state.`,
      ));
    }
    const onMinusOffResidual =
      on[0].residual_exponent == null ||
        off[0].residual_exponent == null
        ? null
        : on[0].residual_exponent - off[0].residual_exponent;
    boundaryContrasts.push({
      pair_id: pairId,
      on_minus_off_residual: onMinusOffResidual,
      log_residual_status: onMinusOffResidual == null
        ? "undefined_at_zero_visibility_raw_complex"
        : "resolved",
      registered_dp_conditional_null_applicable: equivalent &&
        Math.abs(dpDifference) <=
          input.dp_predictor.boundary_identity_absolute_tolerance,
      dp_on_minus_off: dpDifference,
    });
  }

  const minimumVisibility = heldOut.reduce(
    (minimum, row) => Math.min(minimum, row.visibility),
    1,
  );
  const likelihoodPass =
    input.likelihood.mode !== "gaussian_log_visibility" ||
    (
      minimumVisibility > 0 &&
      input.likelihood.gaussian_coverage_validated &&
      input.likelihood.coverage_probability >= 0.95 &&
      minimumVisibility >= input.likelihood.minimum_covered_visibility
    );
  if (!likelihoodPass) {
    failures.push(fail(
      "log_visibility_likelihood_coverage_failure",
      "Gaussian log-visibility scoring is outside its validated coverage domain.",
    ));
  }

  const residualDimensionPass =
    input.residual_covariance.length === heldOut.length &&
    input.residual_covariance.every((row) => row.length === heldOut.length);
  const residualLower = residualDimensionPass &&
      symmetric(input.residual_covariance)
    ? cholesky(input.residual_covariance)
    : null;
  if (residualLower == null) {
    failures.push(fail(
      "residual_covariance_not_positive_definite",
      "The frozen residual covariance must be symmetric, correctly ordered, and positive definite.",
    ));
  }

  const selectedCovariance = input.likelihood.mode === "raw_complex"
    ? input.complex_covariance
    : input.residual_covariance;
  const selectedDimension = input.likelihood.mode === "raw_complex"
    ? heldOut.length * 2
    : heldOut.length;
  const selectedLower =
    selectedCovariance != null &&
      selectedCovariance.length === selectedDimension &&
      selectedCovariance.every((row) => row.length === selectedDimension) &&
      symmetric(selectedCovariance)
      ? cholesky(selectedCovariance)
      : null;
  const selectedCondition = selectedCovariance == null
    ? null
    : conditionNumber(selectedCovariance);
  if (
    selectedLower == null ||
    selectedCondition == null ||
    selectedCondition > input.covariance_receipt.condition_number_max
  ) {
    failures.push(fail(
      "scoring_covariance_not_identifiable",
      "The selected likelihood covariance must be positive definite and below the pilot-frozen condition threshold.",
    ));
  }

  const residualVector = residualRows.map(
    (row) => row.residual_exponent ?? Number.NaN,
  );
  const observedComplex = residualRows.flatMap((row) => [
    row.real_coherence,
    row.imaginary_coherence,
  ]);
  const dp = residualRows.map((row) => row.dp_signature);
  const bridge = residualRows.map((row) => row.bridge_signature ?? 0);
  const zero = residualRows.map(() => 0);
  const modelScores: ModelScore[] = [];
  let whitenedResidual: number[] | null = null;
  let strictDpScore: number | null = null;
  let bridgeScore: number | null = null;

  if (
    failures.length === 0 &&
    selectedLower != null &&
    selectedCondition != null &&
    selectedCondition <= input.covariance_receipt.condition_number_max
  ) {
    const score = (signature: number[]) =>
      input.likelihood.mode === "raw_complex"
        ? modelQ(
          selectedLower,
          observedComplex,
          predictedComplex(residualRows, signature),
        )
        : modelQ(selectedLower, residualVector, signature);
    const q0 = score(zero);
    strictDpScore = score(dp);
    modelScores.push({
      model_id: "M0",
      likelihood_space: input.likelihood.mode,
      q: q0,
      delta_q_from_m0: 0,
      confirmatory_amplitude_fitted: false,
    }, {
      model_id: "M0_plus_DP",
      likelihood_space: input.likelihood.mode,
      q: strictDpScore,
      delta_q_from_m0: strictDpScore - q0,
      confirmatory_amplitude_fitted: false,
    });
    if (input.bridge.role !== "none") {
      const target = input.bridge.role === "replacement"
        ? bridge
        : bridge.map((value, index) => value + dp[index]);
      bridgeScore = score(target);
      modelScores.push({
        model_id: input.bridge.role === "replacement"
          ? "M0_plus_bridge"
          : "M0_plus_DP_plus_bridge",
        likelihood_space: input.likelihood.mode,
        q: bridgeScore,
        delta_q_from_m0: bridgeScore - q0,
        confirmatory_amplitude_fitted: false,
      });
    }
    whitenedResidual = input.likelihood.mode === "raw_complex"
      ? solveLower(
        selectedLower,
        observedComplex.map(
          (value, index) =>
            value - predictedComplex(residualRows, zero)[index],
        ),
      )
      : solveLower(selectedLower, residualVector);
  }

  return {
    schema_version:
      "casimir_dp_apparatus_coherence_residual_stage4_2b_result/1",
    gate: failures.length === 0 ? "pass" : "blocked",
    first_failure: failures[0] ?? null,
    failures,
    likelihood_gate: likelihoodPass ? "pass" : "blocked",
    covariance_gate: selectedLower != null &&
        selectedCondition != null &&
        selectedCondition <= input.covariance_receipt.condition_number_max
      ? "positive_definite"
      : "not_identifiable",
    covariance_condition_number: selectedCondition,
    covariance_condition_metric: selectedDimension > 96
      ? "conservative_infinity_norm_upper_bound"
      : "jacobi_eigenvalue_ratio",
    confirmatory_data_leakage_gate: leakagePass ? "pass" : "blocked",
    pilot_partition_gate: pilotPartitionPass ? "pass" : "blocked",
    hold_time_grid_gate: holdGridPass ? "pass" : "blocked",
    replication_partition_gate:
      replicationPartitionPass ? "planned_not_measured" : "blocked",
    residuals: residualRows.map((row) => ({
      cell_id: row.cell_id,
      pair_id: row.pair_id,
      boundary_state: row.boundary_state,
      hold_time_s: row.hold_time_s,
      coherence_exponent: row.coherence_exponent,
      residual_exponent: row.residual_exponent,
      log_residual_status: row.log_residual_status,
      phase_residual_rad: row.phase_residual_rad,
      phase_residual_status: row.phase_residual_status,
      dp_signature: row.dp_signature,
      bridge_signature: row.bridge_signature,
    })),
    cholesky_lower: selectedLower,
    whitened_residual: whitenedResidual,
    boundary_contrasts: boundaryContrasts,
    model_scores: modelScores,
    strict_dp_score: strictDpScore,
    bridge_score: bridgeScore,
    unblinded: false,
    evidence_class: "synthetic_fixture",
    measured_evidence: "not_ready",
    collapse_identification: "blocked",
    manifold_dynamics: "blocked",
    physical_viability: "not_evaluated",
  };
}
