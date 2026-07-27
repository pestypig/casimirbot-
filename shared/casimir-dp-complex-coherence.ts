// math-stage: diagnostic
import { z } from "zod";

const SHA256 = /^[a-f0-9]{64}$/;
const TWO_PI = 2 * Math.PI;

const QuadratureCount = z.object({
  analysis_phase_rad: z.number().finite(),
  plus_count: z.number().int().nonnegative(),
  minus_count: z.number().int().nonnegative(),
}).superRefine((value, context) => {
  if (value.plus_count + value.minus_count === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Each analysis quadrature must contain at least one event.",
    });
  }
});

const NuisanceChannels = z.object({
  surface_distance_m: z.number().positive(),
  material_id: z.string().min(1),
  temperature_K: z.number().positive(),
  net_charge_C: z.number().finite(),
  pressure_Pa: z.number().nonnegative(),
  vibration_rms_m: z.number().nonnegative(),
  laser_phase_rad: z.number().finite(),
});

const CoherenceBlock = z.object({
  block_id: z.string().min(1),
  blind_boundary_state: z.string().min(1),
  hold_time_s: z.number().nonnegative(),
  cluster_id: z.string().min(1),
  analysis_role: z.enum(["training", "principal", "held_out"]),
  path_orientation: z.union([z.literal(1), z.literal(-1)]),
  path_swap: z.boolean(),
  echo_pair_id: z.string().min(1).nullable(),
  echo_sequence_id: z.string().min(1).nullable(),
  toggling_function_ref: z.string().min(1).nullable(),
  toggling_function_sha256: z.string().regex(SHA256).nullable(),
  static_boundary_confirmed: z.boolean(),
  phase_predictor_rad: z.number().finite().nullable(),
  nuisances: NuisanceChannels,
  quadratures: z.array(QuadratureCount).min(2),
}).superRefine((block, context) => {
  const echoMetadataPresent =
    block.echo_sequence_id != null &&
    block.echo_pair_id != null &&
    block.toggling_function_ref != null &&
    block.toggling_function_sha256 != null;
  const echoMetadataAbsent =
    block.echo_sequence_id == null &&
    block.toggling_function_ref == null &&
    block.toggling_function_sha256 == null;
  if (!echoMetadataPresent && !echoMetadataAbsent) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["echo_sequence_id"],
      message:
        "Echo blocks require a pair id and hashed toggling-function receipt; non-echo blocks must not carry an echo receipt.",
    });
  }
});

const Provenance = z.object({
  evidence_class: z.enum(["measured", "literature_anchored", "synthetic_fixture"]),
  raw_expected_sha256: z.string().regex(SHA256),
  raw_actual_sha256: z.string().regex(SHA256),
  calibration_expected_sha256: z.string().regex(SHA256),
  calibration_actual_sha256: z.string().regex(SHA256),
  covariance_expected_sha256: z.string().regex(SHA256),
  covariance_actual_sha256: z.string().regex(SHA256),
  receipt_integrity_verified: z.boolean(),
});

export const CasimirDpComplexCoherenceInput = z.object({
  schema_version: z.literal("casimir_dp_complex_coherence/1"),
  primary_boundary_state: z.string().min(1),
  object_receipt: z.object({
    campaign_id: z.string().min(1),
    object_id: z.string().min(1),
    mass_kg: z.number().positive(),
    density_profile_ref: z.string().min(1),
    density_profile_sha256: z.string().regex(SHA256),
    branch_separation_m: z.number().positive(),
    branch_receipt_ref: z.string().min(1),
    branch_receipt_sha256: z.string().regex(SHA256),
  }),
  phase_calibration: z.object({
    source_ref: z.string().min(1),
    standard_uncertainty_rad: z.number().nonnegative(),
  }),
  phase_conditioner: z.object({
    mode: z.enum(["none", "independently_measured", "cross_validated"]),
    source_ref: z.string().min(1).nullable(),
    artifact_sha256: z.string().regex(SHA256).nullable(),
    trained_block_ids: z.array(z.string().min(1)),
  }),
  decay_shape_gate: z.object({
    minimum_distinct_hold_times: z.number().int().min(4),
    minimum_time_span_s: z.number().positive(),
    minimum_signal_to_noise: z.number().positive(),
    maximum_basis_correlation: z.number().gt(0).lt(1),
  }),
  uncertainty_model: z.object({
    method: z.literal("binomial_plus_cluster_sandwich"),
    interval_standard_deviations: z.number().positive(),
    minimum_clusters_per_cell: z.number().int().min(2),
  }),
  nuisance_gate: z.object({
    minimum_blocks: z.number().int().min(3),
    minimum_distinct_values: z.number().int().min(2),
    required_numeric_channels: z.array(z.enum([
      "surface_distance_m",
      "temperature_K",
      "net_charge_C",
      "pressure_Pa",
      "vibration_rms_m",
      "laser_phase_rad",
    ])).min(1),
  }),
  decision_thresholds: z.object({
    coherent_phase_rad: z.number().positive(),
    phase_conditioning_visibility_gain: z.number().positive(),
    echo_visibility_gain: z.number().positive(),
    visibility_loss_fraction: z.number().gt(0).lt(1),
    path_swap_phase_error_rad: z.number().positive(),
    path_swap_visibility_error: z.number().positive(),
  }),
  provenance: Provenance,
  blocks: z.array(CoherenceBlock).min(1),
}).superRefine((input, context) => {
  const ids = input.blocks.map((block) => block.block_id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blocks"],
      message: "block_id values must be unique.",
    });
  }
  if (!input.blocks.some(
    (block) => block.blind_boundary_state === input.primary_boundary_state,
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["primary_boundary_state"],
      message: "The primary boundary state must be represented by at least one block.",
    });
  }
  if (input.phase_conditioner.mode !== "none") {
    if (
      input.phase_conditioner.source_ref == null ||
      input.phase_conditioner.artifact_sha256 == null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phase_conditioner"],
        message: "A phase conditioner requires a source and artifact hash.",
      });
    }
    for (let index = 0; index < input.blocks.length; index += 1) {
      if (input.blocks[index].phase_predictor_rad == null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blocks", index, "phase_predictor_rad"],
          message: "Every analyzed block requires an out-of-sample phase predictor.",
        });
      }
    }
  }
});

export type CasimirDpComplexCoherenceInput = z.infer<
  typeof CasimirDpComplexCoherenceInput
>;

type Matrix2 = [[number, number], [number, number]];

type NumericNuisanceKey =
  keyof Pick<z.infer<typeof NuisanceChannels>,
    | "surface_distance_m"
    | "temperature_K"
    | "net_charge_C"
    | "pressure_Pa"
    | "vibration_rms_m"
    | "laser_phase_rad"
  >;

function wrapPhase(value: number): number {
  let wrapped = value % TWO_PI;
  if (wrapped > Math.PI) wrapped -= TWO_PI;
  if (wrapped <= -Math.PI) wrapped += TWO_PI;
  return wrapped;
}

function uniqueAnalysisPhases(
  quadratures: z.infer<typeof QuadratureCount>[],
): number {
  return new Set(quadratures.map((quadrature) =>
    wrapPhase(quadrature.analysis_phase_rad).toFixed(9)
  )).size;
}

function inverse2(matrix: Matrix2): Matrix2 | null {
  const determinant =
    matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  const scale = Math.max(
    Math.abs(matrix[0][0] * matrix[1][1]),
    Math.abs(matrix[0][1] * matrix[1][0]),
    Number.MIN_VALUE,
  );
  if (Math.abs(determinant) <= 1e-12 * scale) return null;
  return [
    [matrix[1][1] / determinant, -matrix[0][1] / determinant],
    [-matrix[1][0] / determinant, matrix[0][0] / determinant],
  ];
}

function multiply2(left: Matrix2, right: Matrix2): Matrix2 {
  return [
    [
      left[0][0] * right[0][0] + left[0][1] * right[1][0],
      left[0][0] * right[0][1] + left[0][1] * right[1][1],
    ],
    [
      left[1][0] * right[0][0] + left[1][1] * right[1][0],
      left[1][0] * right[0][1] + left[1][1] * right[1][1],
    ],
  ];
}

function transpose2(matrix: Matrix2): Matrix2 {
  return [
    [matrix[0][0], matrix[1][0]],
    [matrix[0][1], matrix[1][1]],
  ];
}

function add2(left: Matrix2, right: Matrix2): Matrix2 {
  return [
    [left[0][0] + right[0][0], left[0][1] + right[0][1]],
    [left[1][0] + right[1][0], left[1][1] + right[1][1]],
  ];
}

function phaseCalibrationCovariance(
  real: number,
  imaginary: number,
  standardUncertaintyRad: number,
): Matrix2 {
  const variance = standardUncertaintyRad ** 2;
  // A common analysis-phase calibration error rotates (Re C, Im C). The
  // first-order derivative with respect to that angle is (-Im C, Re C).
  return [
    [imaginary ** 2 * variance, -real * imaginary * variance],
    [-real * imaginary * variance, real ** 2 * variance],
  ];
}

function coherenceUncertainties(
  real: number,
  imaginary: number,
  covariance: Matrix2,
) {
  const visibility = Math.hypot(real, imaginary);
  const phase = Math.atan2(imaginary, real);
  const visibilityVariance = visibility > 0
    ? (
      real ** 2 * covariance[0][0] +
      2 * real * imaginary * covariance[0][1] +
      imaginary ** 2 * covariance[1][1]
    ) / visibility ** 2
    : covariance[0][0] + covariance[1][1];
  const phaseVariance = visibility > 0
    ? (
      imaginary ** 2 * covariance[0][0] -
      2 * real * imaginary * covariance[0][1] +
      real ** 2 * covariance[1][1]
    ) / visibility ** 4
    : Number.POSITIVE_INFINITY;
  return {
    visibility,
    phase,
    visibilityStandardUncertainty:
      Math.sqrt(Math.max(0, visibilityVariance)),
    phaseStandardUncertainty:
      Math.sqrt(Math.max(0, phaseVariance)),
  };
}

function rotateCoherence(
  real: number,
  imaginary: number,
  covariance: Matrix2,
  phaseCorrection: number,
) {
  const cosine = Math.cos(phaseCorrection);
  const sine = Math.sin(phaseCorrection);
  const rotation: Matrix2 = [
    [cosine, sine],
    [-sine, cosine],
  ];
  return {
    real: cosine * real + sine * imaginary,
    imaginary: cosine * imaginary - sine * real,
    covariance: multiply2(
      multiply2(rotation, covariance),
      transpose2(rotation),
    ),
  };
}

function estimateBlock(
  block: z.infer<typeof CoherenceBlock>,
  phaseCalibrationStandardUncertaintyRad: number,
  intervalStandardDeviations: number,
) {
  const normal: Matrix2 = [[0, 0], [0, 0]];
  let rhsReal = 0;
  let rhsImaginary = 0;
  const rows = block.quadratures.map((quadrature) => {
    const total = quadrature.plus_count + quadrature.minus_count;
    const response = (quadrature.plus_count - quadrature.minus_count) / total;
    const designReal = Math.cos(quadrature.analysis_phase_rad);
    const designImaginary = -Math.sin(quadrature.analysis_phase_rad);
    normal[0][0] += total * designReal * designReal;
    normal[0][1] += total * designReal * designImaginary;
    normal[1][0] += total * designImaginary * designReal;
    normal[1][1] += total * designImaginary * designImaginary;
    rhsReal += total * designReal * response;
    rhsImaginary += total * designImaginary * response;
    return {
      total,
      response,
      designReal,
      designImaginary,
      plusProbability: quadrature.plus_count / total,
    };
  });
  const inverseNormal = inverse2(normal);
  const phaseCoverage = uniqueAnalysisPhases(block.quadratures) >= 4;
  if (inverseNormal == null) {
    return {
      block_id: block.block_id,
      quadrature_coverage: phaseCoverage ? "pass" as const : "not_ready" as const,
      estimator_gate: "not_ready" as const,
      real: null,
      imaginary: null,
      visibility: null,
      phase_rad: null,
      covariance: null,
      statistical_covariance: null,
      visibility_standard_uncertainty: null,
      phase_standard_uncertainty_rad: null,
      visibility_interval: null,
      phase_interval_rad: null,
    };
  }
  const real =
    inverseNormal[0][0] * rhsReal + inverseNormal[0][1] * rhsImaginary;
  const imaginary =
    inverseNormal[1][0] * rhsReal + inverseNormal[1][1] * rhsImaginary;

  const scoreCovariance: Matrix2 = [[0, 0], [0, 0]];
  for (const row of rows) {
    // Jeffreys smoothing prevents an exact 0/1 synthetic count from claiming
    // zero estimator uncertainty.
    const smoothedProbability =
      (row.plusProbability * row.total + 0.5) / (row.total + 1);
    const responseVariance =
      4 * smoothedProbability * (1 - smoothedProbability) / row.total;
    const factor = row.total ** 2 * responseVariance;
    scoreCovariance[0][0] += factor * row.designReal ** 2;
    scoreCovariance[0][1] += factor * row.designReal * row.designImaginary;
    scoreCovariance[1][0] += factor * row.designImaginary * row.designReal;
    scoreCovariance[1][1] += factor * row.designImaginary ** 2;
  }
  const statisticalCovariance = multiply2(
    multiply2(inverseNormal, scoreCovariance),
    transpose2(inverseNormal),
  );
  const covariance = add2(
    statisticalCovariance,
    phaseCalibrationCovariance(
      real,
      imaginary,
      phaseCalibrationStandardUncertaintyRad,
    ),
  );
  const uncertainties = coherenceUncertainties(real, imaginary, covariance);
  return {
    block_id: block.block_id,
    quadrature_coverage: phaseCoverage ? "pass" as const : "not_ready" as const,
    estimator_gate: phaseCoverage ? "pass" as const : "not_ready" as const,
    real,
    imaginary,
    visibility: uncertainties.visibility,
    phase_rad: uncertainties.phase,
    covariance,
    statistical_covariance: statisticalCovariance,
    visibility_standard_uncertainty:
      uncertainties.visibilityStandardUncertainty,
    phase_standard_uncertainty_rad:
      uncertainties.phaseStandardUncertainty,
    visibility_interval: {
      lower: Math.max(
        0,
        uncertainties.visibility -
          intervalStandardDeviations *
            uncertainties.visibilityStandardUncertainty,
      ),
      upper: Math.min(
        1,
        uncertainties.visibility +
          intervalStandardDeviations *
            uncertainties.visibilityStandardUncertainty,
      ),
      standard_deviations: intervalStandardDeviations,
    },
    phase_interval_rad: {
      lower_unwrapped:
        uncertainties.phase -
        intervalStandardDeviations * uncertainties.phaseStandardUncertainty,
      upper_unwrapped:
        uncertainties.phase +
        intervalStandardDeviations * uncertainties.phaseStandardUncertainty,
      modulo_2pi: true as const,
      standard_deviations: intervalStandardDeviations,
    },
  };
}

type EstimatedBlock = ReturnType<typeof estimateBlock> & {
  source: z.infer<typeof CoherenceBlock>;
};

function meanAndCovariance(
  blocks: EstimatedBlock[],
  applyConditioning: boolean,
  phaseCalibrationStandardUncertaintyRad: number,
  intervalStandardDeviations: number,
  minimumClustersPerCell: number,
) {
  const valid = blocks.filter(
    (block): block is EstimatedBlock & {
      real: number;
      imaginary: number;
      covariance: Matrix2;
      statistical_covariance: Matrix2;
    } =>
      block.real != null &&
      block.imaginary != null &&
      block.covariance != null &&
      block.statistical_covariance != null,
  );
  if (valid.length === 0) return null;
  const rotatedBlocks = valid.map((block) => {
    const rotated = applyConditioning
      ? rotateCoherence(
        block.real,
        block.imaginary,
        block.statistical_covariance,
        block.source.phase_predictor_rad ?? 0,
      )
      : {
        real: block.real,
        imaginary: block.imaginary,
        covariance: block.statistical_covariance,
      };
    return {
      ...rotated,
      cluster_id: block.source.cluster_id,
    };
  });
  let real = 0;
  let imaginary = 0;
  const measurementCovariance: Matrix2 = [[0, 0], [0, 0]];
  const phases: number[] = [];
  for (const rotated of rotatedBlocks) {
    real += rotated.real;
    imaginary += rotated.imaginary;
    measurementCovariance[0][0] += rotated.covariance[0][0];
    measurementCovariance[0][1] += rotated.covariance[0][1];
    measurementCovariance[1][0] += rotated.covariance[1][0];
    measurementCovariance[1][1] += rotated.covariance[1][1];
    phases.push(Math.atan2(rotated.imaginary, rotated.real));
  }
  real /= valid.length;
  imaginary /= valid.length;
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      measurementCovariance[row][column] /= valid.length ** 2;
    }
  }

  const clusterScores = new Map<string, [number, number]>();
  for (const block of rotatedBlocks) {
    const score = clusterScores.get(block.cluster_id) ?? [0, 0];
    score[0] += block.real - real;
    score[1] += block.imaginary - imaginary;
    clusterScores.set(block.cluster_id, score);
  }
  const clusterCovariance: Matrix2 = [[0, 0], [0, 0]];
  const clusterCount = clusterScores.size;
  if (clusterCount >= 2) {
    const correction = clusterCount / (clusterCount - 1) / valid.length ** 2;
    for (const score of clusterScores.values()) {
      clusterCovariance[0][0] += correction * score[0] ** 2;
      clusterCovariance[0][1] += correction * score[0] * score[1];
      clusterCovariance[1][0] += correction * score[1] * score[0];
      clusterCovariance[1][1] += correction * score[1] ** 2;
    }
  }
  const calibrationCovariance = phaseCalibrationCovariance(
    real,
    imaginary,
    phaseCalibrationStandardUncertaintyRad,
  );
  const covariance = add2(
    add2(measurementCovariance, clusterCovariance),
    calibrationCovariance,
  );
  const uncertainties = coherenceUncertainties(real, imaginary, covariance);
  const circularReal =
    phases.reduce((sum, value) => sum + Math.cos(value), 0) / phases.length;
  const circularImaginary =
    phases.reduce((sum, value) => sum + Math.sin(value), 0) / phases.length;
  const circularResultant = Math.hypot(circularReal, circularImaginary);
  return {
    real,
    imaginary,
    visibility: uncertainties.visibility,
    phase_rad: uncertainties.phase,
    covariance,
    covariance_components: {
      binomial_measurement: measurementCovariance,
      cluster_sandwich: clusterCovariance,
      common_phase_calibration: calibrationCovariance,
      method: "binomial_plus_cluster_sandwich" as const,
      cluster_count: clusterCount,
      cluster_gate:
        clusterCount >= minimumClustersPerCell
          ? "pass" as const
          : "not_ready" as const,
    },
    visibility_standard_uncertainty:
      uncertainties.visibilityStandardUncertainty,
    phase_standard_uncertainty_rad:
      uncertainties.phaseStandardUncertainty,
    visibility_interval: {
      lower: Math.max(
        0,
        uncertainties.visibility -
          intervalStandardDeviations *
            uncertainties.visibilityStandardUncertainty,
      ),
      upper: Math.min(
        1,
        uncertainties.visibility +
          intervalStandardDeviations *
            uncertainties.visibilityStandardUncertainty,
      ),
      standard_deviations: intervalStandardDeviations,
    },
    phase_interval_rad: {
      lower_unwrapped:
        uncertainties.phase -
        intervalStandardDeviations * uncertainties.phaseStandardUncertainty,
      upper_unwrapped:
        uncertainties.phase +
        intervalStandardDeviations * uncertainties.phaseStandardUncertainty,
      modulo_2pi: true as const,
      standard_deviations: intervalStandardDeviations,
    },
    phase_distribution: {
      circular_mean_rad: Math.atan2(circularImaginary, circularReal),
      circular_resultant: circularResultant,
      circular_standard_deviation_rad:
        Math.sqrt(Math.max(0, -2 * Math.log(Math.max(circularResultant, 1e-15)))),
      block_count: phases.length,
    },
  };
}

function pearson(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length < 2) return 1;
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftSquare = 0;
  let rightSquare = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] - leftMean;
    const b = right[index] - rightMean;
    numerator += a * b;
    leftSquare += a ** 2;
    rightSquare += b ** 2;
  }
  return numerator / Math.max(
    Math.sqrt(leftSquare * rightSquare),
    Number.MIN_VALUE,
  );
}

function pearsonOrNull(left: number[], right: number[]): number | null {
  if (left.length !== right.length || left.length < 3) return null;
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftSquare = 0;
  let rightSquare = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftResidual = left[index] - leftMean;
    const rightResidual = right[index] - rightMean;
    numerator += leftResidual * rightResidual;
    leftSquare += leftResidual ** 2;
    rightSquare += rightResidual ** 2;
  }
  if (leftSquare <= Number.MIN_VALUE || rightSquare <= Number.MIN_VALUE) {
    return null;
  }
  return numerator / Math.sqrt(leftSquare * rightSquare);
}

type DecayPoint = {
  hold_time_s: number;
  analysis_role: "training" | "principal" | "held_out" | "mixed";
  block_ids: string[];
  visibility: number;
  visibility_standard_uncertainty: number;
  chi: number;
  chi_standard_uncertainty: number;
};

function fitPowerLawDecay(
  trainingPoints: DecayPoint[],
  heldOutPoints: DecayPoint[],
  exponent: number,
  parameterCount: number,
) {
  const positive = trainingPoints.filter((point) => point.hold_time_s > 0);
  let numerator = 0;
  let denominator = 0;
  for (const point of positive) {
    const basis = point.hold_time_s ** exponent;
    const weight = 1 / Math.max(point.chi_standard_uncertainty ** 2, 1e-18);
    numerator += weight * basis * point.chi;
    denominator += weight * basis ** 2;
  }
  const amplitude = numerator / Math.max(denominator, Number.MIN_VALUE);
  const residuals = positive.map(
    (point) => point.chi - amplitude * point.hold_time_s ** exponent,
  );
  const weightedSse = residuals.reduce((sum, residual, index) =>
    sum + residual ** 2 /
      Math.max(positive[index].chi_standard_uncertainty ** 2, 1e-18), 0);
  const heldOutErrors = heldOutPoints
    .filter((point) => point.hold_time_s > 0)
    .map((heldOut) =>
      Math.abs(
        heldOut.chi - amplitude * heldOut.hold_time_s ** exponent,
      ) / Math.max(heldOut.chi_standard_uncertainty, 1e-12)
    );
  const heldOutScore = heldOutErrors.length === 0
    ? null
    : Math.sqrt(
      heldOutErrors.reduce((sum, value) => sum + value ** 2, 0) /
        heldOutErrors.length,
    );
  const count = Math.max(1, positive.length);
  return {
    exponent,
    amplitude,
    weighted_sse: weightedSse,
    bic: count * Math.log(Math.max(weightedSse / count, 1e-18)) +
      parameterCount * Math.log(count),
    held_out_standardized_error: heldOutScore,
    training_point_count: positive.length,
    held_out_point_count: heldOutErrors.length,
  };
}

function groupKey(block: z.infer<typeof CoherenceBlock>): string {
  return [
    block.blind_boundary_state,
    block.hold_time_s.toPrecision(15),
    block.path_orientation,
    block.analysis_role,
    block.echo_pair_id ?? "no-pair",
    block.echo_sequence_id ?? "no-echo",
  ].join("|");
}

export function evaluateCasimirDpComplexCoherence(
  rawInput: CasimirDpComplexCoherenceInput,
) {
  const input = CasimirDpComplexCoherenceInput.parse(rawInput);
  const trained = new Set(input.phase_conditioner.trained_block_ids);
  const heldOutLeakage = input.blocks.some(
    (block) => block.analysis_role === "held_out" && trained.has(block.block_id),
  );
  const conditioningAllowed =
    input.phase_conditioner.mode !== "none" &&
    input.phase_conditioner.source_ref != null &&
    input.phase_conditioner.artifact_sha256 != null &&
    !heldOutLeakage;

  const estimatedBlocks: EstimatedBlock[] = input.blocks.map((source) => ({
    ...estimateBlock(
      source,
      input.phase_calibration.standard_uncertainty_rad,
      input.uncertainty_model.interval_standard_deviations,
    ),
    source,
  }));
  const grouped = new Map<string, EstimatedBlock[]>();
  for (const block of estimatedBlocks) {
    const key = groupKey(block.source);
    const values = grouped.get(key) ?? [];
    values.push(block);
    grouped.set(key, values);
  }
  const summaries = [...grouped.values()].map((blocks) => {
    const source = blocks[0].source;
    return {
      blind_boundary_state: source.blind_boundary_state,
      hold_time_s: source.hold_time_s,
      path_orientation: source.path_orientation,
      path_swap: source.path_swap,
      analysis_role: source.analysis_role,
      echo_pair_id: source.echo_pair_id,
      echo_sequence_id: source.echo_sequence_id,
      raw: meanAndCovariance(
        blocks,
        false,
        input.phase_calibration.standard_uncertainty_rad,
        input.uncertainty_model.interval_standard_deviations,
        input.uncertainty_model.minimum_clusters_per_cell,
      ),
      phase_conditioned: meanAndCovariance(
        blocks,
        conditioningAllowed,
        input.phase_calibration.standard_uncertainty_rad,
        input.uncertainty_model.interval_standard_deviations,
        input.uncertainty_model.minimum_clusters_per_cell,
      ),
      block_ids: blocks.map((block) => block.block_id),
    };
  });

  const pathSwap = summaries.flatMap((forward) => {
    if (forward.path_orientation !== 1 || forward.path_swap) return [];
    const reverse = summaries.find((candidate) =>
      candidate.blind_boundary_state === forward.blind_boundary_state &&
      candidate.hold_time_s === forward.hold_time_s &&
      candidate.path_orientation === -1 &&
      candidate.path_swap &&
      candidate.analysis_role === forward.analysis_role &&
      candidate.echo_sequence_id === forward.echo_sequence_id &&
      candidate.echo_pair_id === forward.echo_pair_id
    );
    const forwardValue = conditioningAllowed
      ? forward.phase_conditioned
      : forward.raw;
    const reverseValue = reverse == null
      ? null
      : conditioningAllowed
        ? reverse.phase_conditioned
        : reverse.raw;
    if (forwardValue == null || reverseValue == null) return [];
    const phaseError = Math.abs(wrapPhase(
      forwardValue.phase_rad + reverseValue.phase_rad,
    ));
    const visibilityError = Math.abs(
      forwardValue.visibility - reverseValue.visibility,
    );
    return [{
      forward_block_ids: forward.block_ids,
      reverse_block_ids: reverse!.block_ids,
      phase_sign_reversal_error_rad: phaseError,
      visibility_difference: visibilityError,
      gate:
        phaseError <= input.decision_thresholds.path_swap_phase_error_rad &&
          visibilityError <=
            input.decision_thresholds.path_swap_visibility_error
          ? "pass" as const
          : "not_ready" as const,
    }];
  });

  const echoRecovery = summaries.flatMap((withoutEcho) => {
    if (withoutEcho.echo_sequence_id != null || withoutEcho.echo_pair_id == null) {
      return [];
    }
    const withEcho = summaries.find((candidate) =>
      candidate.echo_pair_id === withoutEcho.echo_pair_id &&
      candidate.echo_sequence_id != null &&
      candidate.blind_boundary_state === withoutEcho.blind_boundary_state &&
      candidate.hold_time_s === withoutEcho.hold_time_s &&
      candidate.path_orientation === withoutEcho.path_orientation &&
      candidate.analysis_role === withoutEcho.analysis_role
    );
    const baseline = conditioningAllowed
      ? withoutEcho.phase_conditioned
      : withoutEcho.raw;
    const echoed = withEcho == null
      ? null
      : conditioningAllowed
        ? withEcho.phase_conditioned
        : withEcho.raw;
    if (baseline == null || echoed == null) return [];
    const gain = echoed.visibility - baseline.visibility;
    return [{
      echo_pair_id: withoutEcho.echo_pair_id,
      no_echo_visibility: baseline.visibility,
      echo_visibility: echoed.visibility,
      visibility_gain: gain,
      recovery_gate:
        gain >= input.decision_thresholds.echo_visibility_gain
          ? "recovered" as const
          : "not_recovered" as const,
      interpretation:
        "Echo recovery is a reversibility discriminator; non-recovery is not an objective-collapse label.",
    }];
  });

  const primaryNoEcho = summaries.filter((summary) =>
    summary.blind_boundary_state === input.primary_boundary_state &&
    summary.path_orientation === 1 &&
    summary.echo_sequence_id == null
  );
  const byTime = new Map<number, typeof primaryNoEcho>();
  for (const summary of primaryNoEcho) {
    const rows = byTime.get(summary.hold_time_s) ?? [];
    rows.push(summary);
    byTime.set(summary.hold_time_s, rows);
  }
  const timeRows = [...byTime.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([holdTime, rows]) => {
      const values = rows.map((row) =>
        conditioningAllowed ? row.phase_conditioned : row.raw
      ).filter((value): value is NonNullable<typeof value> => value != null);
      if (values.length === 0) return [];
      const visibility =
        values.reduce((sum, value) => sum + value.visibility, 0) / values.length;
      const variance =
        values.reduce(
          (sum, value) => sum + value.visibility_standard_uncertainty ** 2,
          0,
        ) / values.length ** 2;
      const roles = new Set(rows.map((row) => row.analysis_role));
      return [{
        hold_time_s: holdTime,
        analysis_role:
          roles.size === 1
            ? rows[0].analysis_role
            : "mixed" as const,
        block_ids: rows.flatMap((row) => row.block_ids),
        visibility,
        visibility_standard_uncertainty: Math.sqrt(variance),
      }];
    });
  const reference = timeRows.find((row) =>
    row.hold_time_s === 0 && row.analysis_role !== "held_out" &&
    row.analysis_role !== "mixed"
  );
  const decayPoints: DecayPoint[] = reference == null
    ? []
    : timeRows.map((row) => {
      const safeVisibility = Math.max(row.visibility, 1e-15);
      const safeReference = Math.max(reference.visibility, 1e-15);
      return {
        ...row,
        chi: -Math.log(safeVisibility / safeReference),
        chi_standard_uncertainty: Math.sqrt(
          (row.visibility_standard_uncertainty / safeVisibility) ** 2 +
          (reference.visibility_standard_uncertainty / safeReference) ** 2,
        ),
      };
    });
  const decayRoleLeakage = decayPoints.some(
    (point) => point.analysis_role === "mixed",
  );
  const trainingDecayPoints = decayPoints.filter(
    (point) => point.analysis_role !== "held_out" &&
      point.analysis_role !== "mixed",
  );
  const heldOutDecayPoints = decayPoints.filter(
    (point) => point.analysis_role === "held_out",
  );
  const positiveTimes = decayPoints
    .map((point) => point.hold_time_s)
    .filter((time) => time > 0);
  const basisCorrelation = pearson(
    positiveTimes,
    positiveTimes.map((time) => time ** 2),
  );
  const signalToNoise = decayPoints.reduce(
    (maximum, point) => Math.max(
      maximum,
      Math.abs(point.chi) /
        Math.max(point.chi_standard_uncertainty, Number.MIN_VALUE),
    ),
    0,
  );
  const timeSpan = decayPoints.length < 2
    ? 0
    : decayPoints[decayPoints.length - 1].hold_time_s -
      decayPoints[0].hold_time_s;
  const allQuadraturesReady = estimatedBlocks.every(
    (block) => block.estimator_gate === "pass",
  );
  const identifiabilityReady =
    allQuadraturesReady &&
    decayPoints.length >= input.decay_shape_gate.minimum_distinct_hold_times &&
    decayPoints[0]?.hold_time_s === 0 &&
    timeSpan >= input.decay_shape_gate.minimum_time_span_s &&
    signalToNoise >= input.decay_shape_gate.minimum_signal_to_noise &&
    Math.abs(basisCorrelation) <=
      input.decay_shape_gate.maximum_basis_correlation &&
    trainingDecayPoints.filter((point) => point.hold_time_s > 0).length >= 2 &&
    heldOutDecayPoints.filter((point) => point.hold_time_s > 0).length >= 1 &&
    !decayRoleLeakage;

  const exponential = decayPoints.length >= 2
    ? fitPowerLawDecay(trainingDecayPoints, heldOutDecayPoints, 1, 1)
    : null;
  const gaussian = decayPoints.length >= 2
    ? fitPowerLawDecay(trainingDecayPoints, heldOutDecayPoints, 2, 1)
    : null;
  let stretched = null as ReturnType<typeof fitPowerLawDecay> | null;
  if (decayPoints.length >= 2) {
    for (let exponent = 0.5; exponent <= 2.5 + 1e-12; exponent += 0.05) {
      const candidate = fitPowerLawDecay(
        trainingDecayPoints,
        heldOutDecayPoints,
        exponent,
        2,
      );
      if (stretched == null || candidate.weighted_sse < stretched.weighted_sse) {
        stretched = candidate;
      }
    }
  }
  const models = [
    exponential == null ? null : { model: "exponential" as const, ...exponential },
    gaussian == null ? null : { model: "gaussian" as const, ...gaussian },
    stretched == null
      ? null
      : { model: "stretched_exponential" as const, ...stretched },
  ].filter((model): model is NonNullable<typeof model> => model != null);
  const bestModel = identifiabilityReady && models.length > 0
    ? [...models].sort((left, right) => left.bic - right.bic)[0].model
    : null;

  const maximumConditioningGain = summaries.reduce((maximum, summary) => {
    if (summary.raw == null || summary.phase_conditioned == null) return maximum;
    return Math.max(
      maximum,
      summary.phase_conditioned.visibility - summary.raw.visibility,
    );
  }, 0);
  const maximumEchoGain = echoRecovery.reduce(
    (maximum, row) => Math.max(maximum, row.visibility_gain),
    0,
  );
  const maximumPathPhase = summaries.reduce((maximum, summary) => {
    const value = conditioningAllowed ? summary.phase_conditioned : summary.raw;
    return Math.max(maximum, Math.abs(value?.phase_rad ?? 0));
  }, 0);
  const visibilityLoss = decayPoints.length < 2
    ? 0
    : 1 -
      decayPoints[decayPoints.length - 1].visibility /
        Math.max(decayPoints[0].visibility, Number.MIN_VALUE);
  const evidenceClass = !identifiabilityReady
    ? "not_identifiable" as const
    : maximumConditioningGain >=
        input.decision_thresholds.phase_conditioning_visibility_gain
      ? "conditionable_dephasing" as const
      : pathSwap.some((row) => row.gate === "pass") &&
          maximumPathPhase >= input.decision_thresholds.coherent_phase_rad
        ? "coherent_phase" as const
        : visibilityLoss >=
              input.decision_thresholds.visibility_loss_fraction &&
            maximumEchoGain < input.decision_thresholds.echo_visibility_gain
           ? "unrecovered_visibility_loss" as const
           : "not_identifiable" as const;

  const nuisanceBlocks = estimatedBlocks.filter(
    (block): block is EstimatedBlock & {
      real: number;
      imaginary: number;
      visibility: number;
      phase_rad: number;
    } =>
      block.estimator_gate === "pass" &&
      block.real != null &&
      block.imaginary != null &&
      block.visibility != null &&
      block.phase_rad != null,
  );
  const nuisanceRows = input.nuisance_gate.required_numeric_channels.map(
    (channel) => {
      const key = channel as NumericNuisanceKey;
      const nuisanceValues = nuisanceBlocks.map(
        (block) => block.source.nuisances[key],
      );
      const distinctValues = new Set(
        nuisanceValues.map((value) => value.toPrecision(15)),
      ).size;
      return {
        channel,
        block_count: nuisanceBlocks.length,
        distinct_values: distinctValues,
        correlation_with_visibility: pearsonOrNull(
          nuisanceValues,
          nuisanceBlocks.map((block) => block.visibility),
        ),
        correlation_with_phase_rad: pearsonOrNull(
          nuisanceValues,
          nuisanceBlocks.map((block) => block.phase_rad),
        ),
        gate:
          nuisanceBlocks.length >= input.nuisance_gate.minimum_blocks &&
            distinctValues >=
              input.nuisance_gate.minimum_distinct_values
            ? "pass" as const
            : "not_ready" as const,
      };
    },
  );
  const nuisanceGate = nuisanceRows.every((row) => row.gate === "pass");
  const clusterCovarianceReady = summaries
    .filter((summary) => summary.analysis_role !== "held_out")
    .every((summary) =>
      summary.raw != null &&
      summary.raw.covariance_components.cluster_gate === "pass"
    );

  const provenanceIntegrity =
    input.provenance.raw_expected_sha256 ===
      input.provenance.raw_actual_sha256 &&
    input.provenance.calibration_expected_sha256 ===
      input.provenance.calibration_actual_sha256 &&
    input.provenance.covariance_expected_sha256 ===
      input.provenance.covariance_actual_sha256 &&
    input.provenance.receipt_integrity_verified;
  const structurallyReady =
    allQuadraturesReady &&
    input.blocks.every((block) => block.static_boundary_confirmed) &&
    !heldOutLeakage;
  const measuredReady =
    input.provenance.evidence_class === "measured" &&
    provenanceIntegrity &&
    structurallyReady &&
    identifiabilityReady &&
    clusterCovarianceReady &&
    nuisanceGate;

  return {
    schema_version: "casimir_dp_complex_coherence_result/1" as const,
    object_receipt: input.object_receipt,
    blocks: estimatedBlocks.map(({ source, ...estimate }) => ({
      ...estimate,
      blind_boundary_state: source.blind_boundary_state,
      hold_time_s: source.hold_time_s,
      analysis_role: source.analysis_role,
      cluster_id: source.cluster_id,
    })),
    summaries,
    phase_conditioning: {
      mode: input.phase_conditioner.mode,
      gate: input.phase_conditioner.mode === "none"
        ? "not_applied" as const
        : conditioningAllowed
          ? "pass" as const
          : "not_ready" as const,
      held_out_training_leakage: heldOutLeakage,
      maximum_visibility_gain: maximumConditioningGain,
    },
    path_swap: pathSwap,
    echo_recovery: echoRecovery,
    decay_shape: {
      points: decayPoints,
      models,
      best_model: bestModel,
      held_out_score_authority:
        "analysis_role=held_out points scored after fitting only non-held-out registered times" as const,
      identifiability: {
        gate: identifiabilityReady ? "pass" as const : "not_ready" as const,
        distinct_hold_times: decayPoints.length,
        includes_zero_time: decayPoints[0]?.hold_time_s === 0,
        time_span_s: timeSpan,
        exponential_gaussian_basis_correlation: basisCorrelation,
        signal_to_noise: signalToNoise,
        training_positive_time_count:
          trainingDecayPoints.filter((point) => point.hold_time_s > 0).length,
        held_out_positive_time_count:
          heldOutDecayPoints.filter((point) => point.hold_time_s > 0).length,
        role_leakage: decayRoleLeakage,
      },
    },
    nuisance_correlations: {
      rows: nuisanceRows,
      material_id: {
        status: "categorical_hierarchical_factor_not_estimated_here" as const,
        distinct_materials:
          new Set(nuisanceBlocks.map((block) => block.source.nuisances.material_id))
            .size,
      },
      gate: nuisanceGate ? "pass" as const : "not_ready" as const,
      interpretation:
        "Diagnostic Pearson correlations are nuisance screens, not causal corrections or collapse discriminators." as const,
    },
    discriminator_class: evidenceClass,
    evidence_class: input.provenance.evidence_class,
    covariance_gate:
      clusterCovarianceReady ? "pass" as const : "not_ready" as const,
    provenance_gate: provenanceIntegrity ? "pass" as const : "not_ready" as const,
    measured_evidence_gate: measuredReady ? "pass" as const : "not_ready" as const,
    maximum_claim: measuredReady
      ? "diagnostic_coherence_characterization" as const
      : input.provenance.evidence_class === "synthetic_fixture"
        ? "synthetic_pipeline_validation" as const
        : "not_ready" as const,
    promotion_allowed:
      input.provenance.evidence_class !== "synthetic_fixture" && measuredReady,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    claim_boundaries: [
      "Complex coherence, phase conditioning, path swap, echo, and decay shape discriminate mechanisms but do not uniquely identify objective collapse.",
      "Unrecovered visibility loss is not labeled collapse.",
      "Synthetic recovery validates software behavior only and cannot promote measured evidence.",
      "Nuisance correlations are diagnostic screens; promotion additionally requires the registered cluster-covariance and nuisance-variation gates.",
    ],
  };
}
