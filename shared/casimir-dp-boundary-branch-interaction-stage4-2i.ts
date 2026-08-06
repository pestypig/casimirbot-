// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  CasimirDpBoundaryBranchFixtureStage4_2I,
  type CasimirDpBoundaryBranchFixtureStage4_2I as Stage4IFixture,
  type CasimirDpBoundaryBranchInteractionStage4_2IConfig,
} from "./contracts/casimir-dp-boundary-branch-interaction-stage4-2i.v1";

type Complex = { re: number; im: number };
type Matrix = number[][];

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

export function sha256CasimirDpBoundaryBranchStage4_2I(
  value: unknown,
): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function subtract(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

function multiply(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function divide(a: Complex, b: Complex): Complex {
  const denominator = b.re * b.re + b.im * b.im;
  if (!(denominator > 0)) {
    throw new Error("stage4_2i_complex_division_by_zero");
  }
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator,
  };
}

function magnitude(value: Complex): number {
  return Math.hypot(value.re, value.im);
}

function phase(value: Complex): number {
  return Math.atan2(value.im, value.re);
}

function wrapPhase(value: number): number {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function normalizedCells(
  cells: Stage4IFixture["observed_cells"],
): Complex[] {
  return cells.map((cell) => divide(cell.coherence_t, cell.coherence_t0));
}

function linearInteraction(values: Complex[]): Complex {
  return add(subtract(subtract(values[3], values[1]), values[2]), values[0]);
}

function crossRatio(values: Complex[]): Complex {
  return divide(
    multiply(values[3], values[0]),
    multiply(values[1], values[2]),
  );
}

function vectorNorm(values: number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

function maxAbs(values: number[]): number {
  return Math.max(...values.map((value) => Math.abs(value)));
}

function flatten(matrix: number[][]): number[] {
  return matrix.flatMap((row) => row);
}

function transpose(matrix: Matrix): Matrix {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function multiplyMatrices(a: Matrix, b: Matrix): Matrix {
  const bt = transpose(b);
  return a.map((row) =>
    bt.map((column) =>
      row.reduce((sum, value, index) => sum + value * column[index], 0)
    )
  );
}

function multiplyMatrixVector(matrix: Matrix, vector: number[]): number[] {
  return matrix.map((row) =>
    row.reduce((sum, value, index) => sum + value * vector[index], 0)
  );
}

function invertMatrix(input: Matrix): Matrix | null {
  const n = input.length;
  if (n === 0 || input.some((row) => row.length !== n)) return null;
  const augmented = input.map((row, index) => [
    ...row,
    ...Array.from({ length: n }, (_, column) =>
      column === index ? 1 : 0
    ),
  ]);
  for (let column = 0; column < n; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) {
        pivotRow = row;
      }
    }
    if (Math.abs(augmented[pivotRow][column]) <= 1e-30) return null;
    [augmented[column], augmented[pivotRow]] = [
      augmented[pivotRow],
      augmented[column],
    ];
    const pivot = augmented[column][column];
    augmented[column] = augmented[column].map((value) => value / pivot);
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map(
        (value, index) => value - factor * augmented[column][index],
      );
    }
  }
  return augmented.map((row) => row.slice(n));
}

function cholesky(
  matrix: Matrix,
  minimumPivot: number,
): Matrix | null {
  const n = matrix.length;
  const lower = Array.from({ length: n }, () => Array(n).fill(0));
  for (let row = 0; row < n; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = matrix[row][column];
      for (let k = 0; k < column; k += 1) {
        sum -= lower[row][k] * lower[column][k];
      }
      if (row === column) {
        if (!(sum > minimumPivot)) return null;
        lower[row][column] = Math.sqrt(sum);
      } else {
        lower[row][column] = sum / lower[column][column];
      }
    }
  }
  return lower;
}

function covarianceFromJacobian(
  jacobian: Matrix,
  covariance: Matrix,
): Matrix {
  return multiplyMatrices(
    multiplyMatrices(jacobian, covariance),
    transpose(jacobian),
  );
}

function logMagnitudeGradient(value: Complex, coefficient: number): number[] {
  const denominator = value.re * value.re + value.im * value.im;
  return [
    coefficient * value.re / denominator,
    coefficient * value.im / denominator,
  ];
}

function phaseGradient(value: Complex, coefficient: number): number[] {
  const denominator = value.re * value.re + value.im * value.im;
  return [
    -coefficient * value.im / denominator,
    coefficient * value.re / denominator,
  ];
}

function buildInteractionJacobian(
  observed: Complex[],
  ordinary: Complex[],
): Matrix {
  // I = -ln|R_obs| + ln|R_ord|. Phi = arg(R_obs)-arg(R_ord).
  const logCoefficients = [-1, 1, 1, -1];
  const phaseCoefficients = [1, -1, -1, 1];
  const amplitude: number[] = [];
  const phaseRow: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    amplitude.push(...logMagnitudeGradient(observed[index], logCoefficients[index]));
    phaseRow.push(...phaseGradient(observed[index], phaseCoefficients[index]));
  }
  for (let index = 0; index < 4; index += 1) {
    amplitude.push(...logMagnitudeGradient(ordinary[index], -logCoefficients[index]));
    phaseRow.push(...phaseGradient(ordinary[index], -phaseCoefficients[index]));
  }
  return [amplitude, phaseRow];
}

function buildCorrectedLossCovarianceJacobian(
  observed: Complex[],
  ordinary: Complex[],
): Matrix {
  return Array.from({ length: 4 }, (_, rowIndex) => {
    const row = Array(16).fill(0);
    const observedGradient = logMagnitudeGradient(observed[rowIndex], -1);
    const ordinaryGradient = logMagnitudeGradient(ordinary[rowIndex], 1);
    row[rowIndex * 2] = observedGradient[0];
    row[rowIndex * 2 + 1] = observedGradient[1];
    row[8 + rowIndex * 2] = ordinaryGradient[0];
    row[8 + rowIndex * 2 + 1] = ordinaryGradient[1];
    return row;
  });
}

function generalizedFactorialInteraction(
  correctedLoss: number[],
  covariance: Matrix,
): number | null {
  const design = [
    [1, 0, 0, 0],
    [1, 1, 0, 0],
    [1, 0, 1, 0],
    [1, 1, 1, 1],
  ];
  const inverseCovariance = invertMatrix(covariance);
  if (inverseCovariance == null) return null;
  const xt = transpose(design);
  const normal = multiplyMatrices(multiplyMatrices(xt, inverseCovariance), design);
  const normalInverse = invertMatrix(normal);
  if (normalInverse == null) return null;
  const rhs = multiplyMatrixVector(
    multiplyMatrices(xt, inverseCovariance),
    correctedLoss,
  );
  return multiplyMatrixVector(normalInverse, rhs)[3];
}

function wavepacketDiagnostics(
  fixture: Stage4IFixture,
  config: CasimirDpBoundaryBranchInteractionStage4_2IConfig,
) {
  const map = new Map(
    fixture.wavepacket_states.map((state) => [
      `${state.boundary_state}__${state.branch_state}`,
      state,
    ]),
  );
  const referenceControl = map.get("reference__branch_control")!;
  const referenceSeparated = map.get("reference__separated")!;
  const activeControl = map.get("active__branch_control")!;
  const activeSeparated = map.get("active__separated")!;
  const displacement = (state: typeof referenceControl) =>
    state.center_b_m.map((value, index) => value - state.center_a_m[index]);
  const sigma = (matrix: number[][]) =>
    Math.sqrt((matrix[0][0] + matrix[1][1] + matrix[2][2]) / 3);
  const stateCovarianceGate = fixture.wavepacket_states.every((state) =>
    cholesky(state.covariance_a_m2, 0) != null &&
    cholesky(state.covariance_b_m2, 0) != null
  );
  const controlSeparationMax = Math.max(
    vectorNorm(displacement(referenceControl)),
    vectorNorm(displacement(activeControl)),
  );
  const separatedDistances = [referenceSeparated, activeSeparated].map(
    (state) => vectorNorm(displacement(state)),
  );
  const targetSeparationError = Math.max(
    ...separatedDistances.map((value) =>
      Math.abs(value - fixture.apparatus_identity.separated_branch_distance_m)
    ),
  );
  const relativeCenterError = maxAbs(
    displacement(referenceSeparated).map(
      (value, index) => value - displacement(activeSeparated)[index],
    ),
  );
  const absoluteCenterError = maxAbs([
    ...referenceControl.center_a_m.map(
      (value, index) => value - activeControl.center_a_m[index],
    ),
    ...referenceControl.center_b_m.map(
      (value, index) => value - activeControl.center_b_m[index],
    ),
    ...referenceSeparated.center_a_m.map(
      (value, index) => value - activeSeparated.center_a_m[index],
    ),
    ...referenceSeparated.center_b_m.map(
      (value, index) => value - activeSeparated.center_b_m[index],
    ),
  ]);
  const covarianceError = Math.max(
    maxAbs(flatten(referenceControl.covariance_a_m2).map(
      (value, index) => value - flatten(activeControl.covariance_a_m2)[index]
    )),
    maxAbs(flatten(referenceControl.covariance_b_m2).map(
      (value, index) => value - flatten(activeControl.covariance_b_m2)[index]
    )),
    maxAbs(flatten(referenceSeparated.covariance_a_m2).map(
      (value, index) => value - flatten(activeSeparated.covariance_a_m2)[index]
    )),
    maxAbs(flatten(referenceSeparated.covariance_b_m2).map(
      (value, index) => value - flatten(activeSeparated.covariance_b_m2)[index]
    )),
  );
  const overlapError = Math.max(
    Math.abs(referenceControl.overlap_abs - activeControl.overlap_abs),
    Math.abs(referenceSeparated.overlap_abs - activeSeparated.overlap_abs),
  );
  const holdError = Math.max(
    Math.abs(referenceControl.hold_time_s - activeControl.hold_time_s),
    Math.abs(referenceSeparated.hold_time_s - activeSeparated.hold_time_s),
  );
  const momentumError = Math.max(
    maxAbs(referenceControl.momentum_difference_kg_m_s.map(
      (value, index) => value - activeControl.momentum_difference_kg_m_s[index]
    )),
    maxAbs(referenceSeparated.momentum_difference_kg_m_s.map(
      (value, index) => value - activeSeparated.momentum_difference_kg_m_s[index]
    )),
  );
  const tolerances = config.tolerances;
  const gate = stateCovarianceGate &&
    controlSeparationMax <= tolerances.branch_center_equivalence_m &&
    targetSeparationError <= tolerances.branch_center_equivalence_m &&
    relativeCenterError <= tolerances.branch_center_equivalence_m &&
    absoluteCenterError <= tolerances.branch_center_equivalence_m &&
    covarianceError <= tolerances.packet_covariance_equivalence_m2 &&
    overlapError <= tolerances.overlap_equivalence_absolute &&
    holdError <= tolerances.hold_time_equivalence_s &&
    momentumError <= tolerances.momentum_equivalence_kg_m_s;
  return {
    gate: gate ? "pass" as const : "blocked" as const,
    covariance_positive_definite: stateCovarianceGate,
    branch_control_kind: "identical_branches" as const,
    control_separation_max_m: controlSeparationMax,
    separated_distances_m: separatedDistances,
    target_separation_error_m: targetSeparationError,
    relative_center_error_m: relativeCenterError,
    absolute_center_error_m: absoluteCenterError,
    covariance_error_m2: covarianceError,
    overlap_error_absolute: overlapError,
    hold_time_error_s: holdError,
    momentum_error_kg_m_s: momentumError,
    sigma_cm_m: fixture.wavepacket_states.map((state) => ({
      wavepacket_id: state.wavepacket_id,
      sigma_a_m: sigma(state.covariance_a_m2),
      sigma_b_m: sigma(state.covariance_b_m2),
    })),
    semantic_scales: {
      sphere_radius_m: fixture.apparatus_identity.sphere_radius_m,
      dp_regularization_length_m:
        fixture.apparatus_identity.dp_regularization_length_m,
      center_of_mass_packet_widths_m:
        fixture.wavepacket_states.flatMap((state) => [
          sigma(state.covariance_a_m2),
          sigma(state.covariance_b_m2),
        ]),
      rule: "R_sphere_R0_and_sigma_cm_are_distinct_model_objects",
    },
    empirical_authority:
      fixture.wavepacket_states.every(
        (state) => state.authority_class === "measured_empirical",
      ) ? "ready" as const : "not_ready" as const,
  };
}

export function evaluateCasimirDpBoundaryBranchInteractionStage4_2I(args: {
  config: CasimirDpBoundaryBranchInteractionStage4_2IConfig;
  fixture: Stage4IFixture;
}) {
  const fixture = CasimirDpBoundaryBranchFixtureStage4_2I.parse(args.fixture);
  const { config } = args;
  const observed = normalizedCells(fixture.observed_cells);
  const ordinary = normalizedCells(fixture.ordinary_prediction_cells);
  const allMagnitudes = [...observed, ...ordinary].map(magnitude);
  const coveragePass = allMagnitudes.every(
    (value) => value >= config.tolerances.minimum_coherence_magnitude,
  );
  const covariance = fixture.joint_observed_ordinary_covariance;
  const symmetryError = Math.max(
    ...covariance.flatMap((row, rowIndex) =>
      row.map((value, columnIndex) =>
        Math.abs(value - covariance[columnIndex][rowIndex])
      )
    ),
  );
  const covarianceSymmetric =
    symmetryError <= config.tolerances.covariance_symmetry_absolute;
  const covariancePositiveDefinite = covarianceSymmetric &&
    cholesky(covariance, config.tolerances.cholesky_positive_pivot) != null;
  const wavepacket = wavepacketDiagnostics(fixture, config);
  const dpBoundaryDifference = Math.abs(
    fixture.dp_loss_exponent_by_boundary.active -
      fixture.dp_loss_exponent_by_boundary.reference,
  );
  const dpCancellationGate =
    dpBoundaryDifference <= config.tolerances.dp_boundary_exponent_absolute;
  const observedLinear = linearInteraction(observed);
  const ordinaryLinear = linearInteraction(ordinary);
  const correctedLinear = subtract(observedLinear, ordinaryLinear);

  const observedRatio = coveragePass ? crossRatio(observed) : null;
  const ordinaryRatio = coveragePass ? crossRatio(ordinary) : null;
  const correctedRatio =
    observedRatio != null && ordinaryRatio != null
      ? divide(observedRatio, ordinaryRatio)
      : null;
  const correctedAmplitude = correctedRatio == null
    ? null
    : -Math.log(magnitude(correctedRatio));
  const correctedPhase = correctedRatio == null
    ? null
    : wrapPhase(phase(correctedRatio));

  let propagated: null | {
    covariance_amplitude_phase: Matrix;
    amplitude_standard_uncertainty: number;
    phase_standard_uncertainty_rad: number;
    amplitude_phase_correlation: number | null;
    amplitude_z: number | null;
    phase_z: number | null;
  } = null;
  let projection: null | {
    simple_double_difference: number;
    covariance_weighted_factorial_interaction: number;
    absolute_difference: number;
    gate: "pass" | "blocked";
    scope: "four_cell_saturated_special_case_only";
  } = null;
  if (
    coveragePass && covariancePositiveDefinite && correctedRatio != null &&
    correctedAmplitude != null && correctedPhase != null
  ) {
    const interactionJacobian = buildInteractionJacobian(observed, ordinary);
    const interactionCovariance = covarianceFromJacobian(
      interactionJacobian,
      covariance,
    );
    const amplitudeUncertainty = Math.sqrt(interactionCovariance[0][0]);
    const phaseUncertainty = Math.sqrt(interactionCovariance[1][1]);
    propagated = {
      covariance_amplitude_phase: interactionCovariance,
      amplitude_standard_uncertainty: amplitudeUncertainty,
      phase_standard_uncertainty_rad: phaseUncertainty,
      amplitude_phase_correlation:
        amplitudeUncertainty > 0 && phaseUncertainty > 0
          ? interactionCovariance[0][1] /
            (amplitudeUncertainty * phaseUncertainty)
          : null,
      amplitude_z:
        amplitudeUncertainty > 0
          ? correctedAmplitude / amplitudeUncertainty
          : null,
      phase_z:
        phaseUncertainty > 0 ? correctedPhase / phaseUncertainty : null,
    };
    const observedLoss = observed.map((value) => -Math.log(magnitude(value)));
    const ordinaryLoss = ordinary.map((value) => -Math.log(magnitude(value)));
    const correctedLoss = observedLoss.map(
      (value, index) => value - ordinaryLoss[index],
    );
    const contrast = [1, -1, -1, 1];
    const simple = correctedLoss.reduce(
      (sum, value, index) => sum + contrast[index] * value,
      0,
    );
    const lossJacobian = buildCorrectedLossCovarianceJacobian(
      observed,
      ordinary,
    );
    const lossCovariance = covarianceFromJacobian(lossJacobian, covariance);
    const gls = generalizedFactorialInteraction(correctedLoss, lossCovariance);
    if (gls != null) {
      const difference = Math.abs(simple - gls);
      projection = {
        simple_double_difference: simple,
        covariance_weighted_factorial_interaction: gls,
        absolute_difference: difference,
        gate:
          difference <= config.tolerances.projection_equivalence_absolute
            ? "pass"
            : "blocked",
        scope: "four_cell_saturated_special_case_only",
      };
    }
  }

  const maximumInteractionZ = propagated == null
    ? null
    : Math.max(
      Math.abs(propagated.amplitude_z ?? 0),
      Math.abs(propagated.phase_z ?? 0),
    );
  const interactionResolved =
    maximumInteractionZ != null &&
    maximumInteractionZ >= config.tolerances.interaction_z_threshold;
  const diagnosticGate = coveragePass && covariancePositiveDefinite &&
    wavepacket.gate === "pass" && dpCancellationGate &&
    projection?.gate === "pass";

  return {
    schema_version:
      "casimir_dp_boundary_branch_interaction_stage4_2i_result/1",
    fixture_id: fixture.fixture_id,
    evidence_class: fixture.evidence_class,
    claim_ceiling: config.claim_ceiling,
    promotion_allowed: false,
    coordinate_contract: {
      cell_order: fixture.cell_order,
      covariance_order: fixture.joint_covariance_coordinate_order,
      normalized_complex_coherence:
        "C_bar_beta_q=C_beta_q(t)/C_beta_q(0)",
    },
    wavepacket_custody: wavepacket,
    covariance_gate: {
      gate: covariancePositiveDefinite ? "pass" as const : "blocked" as const,
      symmetry_error: symmetryError,
      symmetric: covarianceSymmetric,
      positive_definite: covariancePositiveDefinite,
    },
    standard_dp_boundary_null: {
      reference_exponent: fixture.dp_loss_exponent_by_boundary.reference,
      active_exponent: fixture.dp_loss_exponent_by_boundary.active,
      absolute_difference: dpBoundaryDifference,
      gate: dpCancellationGate ? "pass" as const : "blocked" as const,
      interpretation:
        "standard_boundary_independent_dp_cancels_from_the_factorial_interaction",
    },
    raw_complex_interaction: {
      observed: observedLinear,
      ordinary_prediction: ordinaryLinear,
      corrected: correctedLinear,
      available_when_log_coverage_fails: true,
    },
    cross_ratio_interaction: {
      coverage_gate: coveragePass ? "pass" as const : "raw_complex_only" as const,
      minimum_cell_magnitude: Math.min(...allMagnitudes),
      observed_ratio: observedRatio,
      ordinary_prediction_ratio: ordinaryRatio,
      corrected_ratio: correctedRatio,
      corrected_log_visibility_interaction: correctedAmplitude,
      corrected_phase_interaction_rad: correctedPhase,
      propagated_covariance: propagated,
    },
    factorial_projection_recovery: projection,
    outcome: {
      diagnostic_gate: diagnosticGate ? "pass" as const : "blocked" as const,
      interaction_resolved_in_synthetic_case: interactionResolved,
      maximum_absolute_z: maximumInteractionZ,
      interpretation:
        interactionResolved
          ? "synthetic_boundary_branch_nonfactorization_recovered_not_collapse_evidence"
          : coveragePass
          ? "no_resolved_synthetic_boundary_branch_interaction"
          : "log_cross_ratio_withheld_raw_complex_diagnostic_only",
      first_physics_consequence_of_nonzero_measured_result:
        "challenge_H0_or_complete_joint_system_equivalence",
      collapse_attribution_allowed: false,
    },
    hypothesis_separation: {
      ordinary_physics_null:
        "registered_measured_boundary_branch_response_and_covariance",
      frozen_dp:
        "boundary_independent_mass_separation_hold_time_signature",
      speculative_extension:
        "requires_separately_registered_sourced_transfer_kernel",
      transfer_kernel_registered: fixture.registered_transfer_kernel,
      observable_bridge_edges_added: 0,
    },
    bounded_status: {
      software_contract: "pass" as const,
      synthetic_recovery: diagnosticGate ? "pass" as const : "blocked" as const,
      branch_control_empirical_authority: "not_ready" as const,
      wavepacket_custody_empirical_authority: wavepacket.empirical_authority,
      ordinary_interaction_model_empirical_authority: "not_ready" as const,
      measured_interaction_contrast: "not_ready" as const,
      transfer_kernel: "not_registered" as const,
      measured_evidence: "not_ready" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      physical_viability: "not_evaluated" as const,
    },
  };
}
