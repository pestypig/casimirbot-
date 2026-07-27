// math-stage: exploratory
import { z } from "zod";
import { HBAR, PI } from "./physics-const";

const SHA256 = /^[a-f0-9]{64}$/;

const Vector3 = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);
const NonnegativeVector3 = z.tuple([
  z.number().nonnegative(),
  z.number().nonnegative(),
  z.number().nonnegative(),
]);
const Matrix3 = z.tuple([Vector3, Vector3, Vector3]);
const ElementwiseNonnegativeMatrix3 = z.tuple([
  NonnegativeVector3,
  NonnegativeVector3,
  NonnegativeVector3,
]);
const NonnegativeMatrix3 = z.tuple([
  z.tuple([
    z.number().nonnegative(),
    z.number().finite(),
    z.number().finite(),
  ]),
  z.tuple([
    z.number().finite(),
    z.number().nonnegative(),
    z.number().finite(),
  ]),
  z.tuple([
    z.number().finite(),
    z.number().finite(),
    z.number().nonnegative(),
  ]),
]);

const HashedReceipt = z.object({
  source_ref: z.string().min(1),
  expected_sha256: z.string().regex(SHA256),
  actual_sha256: z.string().regex(SHA256),
  integrity_verified: z.boolean(),
});

const GreenSample = z.object({
  omega_rad_s: z.number().positive(),
  real_m_inv: Matrix3,
  imaginary_m_inv: Matrix3,
});

const SensitivityRun = z.object({
  parameter: z.enum([
    "material_loss",
    "temperature",
    "surface_distance",
    "geometry",
  ]),
  parameter_value: z.number().finite(),
  phase_rad: z.number().finite(),
  ramsey_chi: z.number().nonnegative(),
  model_binding_sha256: z.string().regex(SHA256),
});

export const CasimirDpQedGreenNoiseInput = z.object({
  schema_version: z.literal("casimir_dp_qed_green_noise/1"),
  evidence_class: z.enum(["measured", "literature_anchored", "synthetic_fixture"]),
  model_domain: z.enum(["finite_geometry", "planar_reduced_order"]),
  model_binding_sha256: z.string().regex(SHA256),
  coupling_limit_case: z.enum([
    "registered_coupling",
    "zero_coupling",
    "infinite_distance",
  ]),
  zero_limit_absolute_tolerance: z.number().nonnegative(),
  green_tensor: z.object({
    source_kind: z.enum([
      "finite_geometry_table",
      "source_backed_solver",
      "planar_reduced_order",
    ]),
    receipt: HashedReceipt,
    solver_name: z.string().min(1),
    solver_version: z.string().min(1),
    model_binding_sha256: z.string().regex(SHA256),
    reciprocity_required: z.boolean(),
    reciprocity_relative_tolerance: z.number().nonnegative(),
    interpolation_relative_error: z.number().nonnegative(),
    maximum_interpolation_relative_error: z.number().nonnegative(),
    samples: z.array(GreenSample).min(2),
  }),
  material: z.object({
    material_id: z.string().min(1),
    evidence_class: z.enum(["measured", "literature_anchored", "synthetic_fixture"]),
    response_kind: z.enum([
      "complex_permittivity_permeability",
      "surface_impedance",
    ]),
    receipt: HashedReceipt,
    measured_response_over_required_band: z.boolean(),
    loss_parameter: z.number().nonnegative(),
    extrapolation_ref: z.string().min(1).nullable(),
    kramers_kronig: z.object({
      maximum_relative_error: z.number().nonnegative(),
      standard_uncertainty: z.number().nonnegative(),
      tolerance: z.number().nonnegative(),
      receipt_ref: z.string().min(1),
    }),
  }),
  geometry: z.object({
    evidence_class: z.enum(["measured", "design_assumption", "synthetic_fixture"]),
    receipt: HashedReceipt,
    gap_m: z.number().positive(),
    surface_distance_m: z.number().positive(),
    roughness_rms_m: z.number().nonnegative(),
    coating_thickness_m: z.number().nonnegative(),
    alignment_standard_uncertainty_rad: z.number().nonnegative(),
    temperature_K: z.number().positive(),
    measured_geometry_and_alignment: z.boolean(),
  }),
  probe: z.object({
    state_ref: z.string().min(1),
    response_receipt: HashedReceipt,
    polarizability_SI: Matrix3,
  }),
  branch_trace: z.object({
    model_binding_sha256: z.string().regex(SHA256),
    time_s: z.array(z.number().nonnegative()).min(2),
    branch_a_potential_J: z.array(z.number().finite()).min(2),
    branch_b_potential_J: z.array(z.number().finite()).min(2),
    branch_a_potential_standard_uncertainty_J:
      z.array(z.number().nonnegative()).min(2),
    branch_b_potential_standard_uncertainty_J:
      z.array(z.number().nonnegative()).min(2),
    branch_a_force_N: z.array(Vector3).min(2),
    branch_b_force_N: z.array(Vector3).min(2),
    branch_a_force_standard_uncertainty_N:
      z.array(NonnegativeVector3).min(2),
    branch_b_force_standard_uncertainty_N:
      z.array(NonnegativeVector3).min(2),
    differential_force_gradient_N_m:
      z.array(z.number().finite()).min(2),
    differential_force_gradient_standard_uncertainty_N_m:
      z.array(z.number().nonnegative()).min(2),
    path_swap: z.boolean(),
  }),
  noise: z.object({
    model_binding_sha256: z.string().regex(SHA256),
    receipt: HashedReceipt,
    spectrum_convention: z.literal("two_sided_angular_frequency"),
    source_kind: z.enum([
      "measured_spectrum",
      "explicit_fluctuation_dissipation_model",
      "mean_pressure_proxy",
    ]),
    fluctuation_dissipation_ref: z.string().min(1).nullable(),
    includes_material_loss: z.boolean(),
    includes_temperature: z.boolean(),
    includes_geometry: z.boolean(),
    two_sided_frequency_absolute_tolerance_rad_s: z.number().nonnegative(),
    two_sided_relative_tolerance: z.number().nonnegative(),
    omega_rad_s: z.array(z.number().finite()).min(3),
    energy_difference_psd_J2_s: z.array(z.number().nonnegative()).min(3),
    energy_difference_psd_standard_uncertainty_J2_s:
      z.array(z.number().nonnegative()).min(3),
    force_noise_psd_N2_s: z.array(NonnegativeMatrix3).min(3),
    force_noise_psd_standard_uncertainty_N2_s:
      z.array(ElementwiseNonnegativeMatrix3).min(3),
    ramsey_filter_abs2_s2: z.array(z.number().nonnegative()).min(3),
    echo_filter_abs2_s2: z.array(z.number().nonnegative()).min(3),
    linearized_check: z.object({
      enabled: z.boolean(),
      linear_response_domain_confirmed: z.boolean(),
      branch_displacement_m: Vector3,
      maximum_relative_error: z.number().nonnegative(),
    }),
  }),
  heating_model: z.object({
    formula_id: z.literal(
      "harmonic_oscillator_two_sided_force_psd_n_dot/1",
    ),
    source_ref: z.string().min(1),
    source_sha256: z.string().regex(SHA256),
    oscillator_mass_kg: z.number().positive(),
    oscillator_omega_rad_s: z.number().positive(),
    coupling_direction: Vector3,
  }).nullable(),
  sensitivity_runs: z.array(SensitivityRun),
}).superRefine((input, context) => {
  const timeLength = input.branch_trace.time_s.length;
  for (const field of [
    "branch_a_potential_J",
    "branch_b_potential_J",
    "branch_a_potential_standard_uncertainty_J",
    "branch_b_potential_standard_uncertainty_J",
    "branch_a_force_N",
    "branch_b_force_N",
    "branch_a_force_standard_uncertainty_N",
    "branch_b_force_standard_uncertainty_N",
    "differential_force_gradient_N_m",
    "differential_force_gradient_standard_uncertainty_N_m",
  ] as const) {
    if (input.branch_trace[field].length !== timeLength) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch_trace", field],
        message: `${field} must match time_s length.`,
      });
    }
  }
  for (let index = 1; index < timeLength; index += 1) {
    if (input.branch_trace.time_s[index] <= input.branch_trace.time_s[index - 1]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch_trace", "time_s", index],
        message: "time_s must be strictly increasing.",
      });
    }
  }

  const noiseLength = input.noise.omega_rad_s.length;
  for (const field of [
    "energy_difference_psd_J2_s",
    "energy_difference_psd_standard_uncertainty_J2_s",
    "force_noise_psd_N2_s",
    "force_noise_psd_standard_uncertainty_N2_s",
    "ramsey_filter_abs2_s2",
    "echo_filter_abs2_s2",
  ] as const) {
    if (input.noise[field].length !== noiseLength) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["noise", field],
        message: `${field} must match omega_rad_s length.`,
      });
    }
  }
  for (let index = 1; index < noiseLength; index += 1) {
    if (input.noise.omega_rad_s[index] <= input.noise.omega_rad_s[index - 1]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["noise", "omega_rad_s", index],
        message: "Noise angular frequencies must be strictly increasing.",
      });
    }
  }
  for (let index = 1; index < input.green_tensor.samples.length; index += 1) {
    if (
      input.green_tensor.samples[index].omega_rad_s <=
      input.green_tensor.samples[index - 1].omega_rad_s
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["green_tensor", "samples", index, "omega_rad_s"],
        message: "Green-tensor angular frequencies must be strictly increasing.",
      });
    }
  }
});

export type CasimirDpQedGreenNoiseInput = z.infer<
  typeof CasimirDpQedGreenNoiseInput
>;

type Matrix3Value = z.infer<typeof Matrix3>;

function trapezoidWeights(grid: number[]): number[] {
  const weights = new Array<number>(grid.length).fill(0);
  for (let index = 0; index < grid.length - 1; index += 1) {
    const halfWidth = (grid[index + 1] - grid[index]) / 2;
    weights[index] += halfWidth;
    weights[index + 1] += halfWidth;
  }
  return weights;
}

function integrate(grid: number[], values: number[]): number {
  const weights = trapezoidWeights(grid);
  return values.reduce(
    (sum, value, index) => sum + value * weights[index],
    0,
  );
}

function receiptPass(receipt: z.infer<typeof HashedReceipt>): boolean {
  return receipt.expected_sha256 === receipt.actual_sha256 &&
    receipt.integrity_verified;
}

function relativeDifference(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function maximumReciprocityError(
  samples: z.infer<typeof GreenSample>[],
): number {
  let maximum = 0;
  for (const sample of samples) {
    for (const matrix of [sample.real_m_inv, sample.imaginary_m_inv]) {
      for (let row = 0; row < 3; row += 1) {
        for (let column = row + 1; column < 3; column += 1) {
          const scale = Math.max(
            Math.abs(matrix[row][column]),
            Math.abs(matrix[column][row]),
            Number.MIN_VALUE,
          );
          maximum = Math.max(
            maximum,
            Math.abs(matrix[row][column] - matrix[column][row]) / scale,
          );
        }
      }
    }
  }
  return maximum;
}

function matrixSymmetryError(matrix: Matrix3Value): number {
  let maximum = 0;
  for (let row = 0; row < 3; row += 1) {
    for (let column = row + 1; column < 3; column += 1) {
      const scale = Math.max(
        Math.abs(matrix[row][column]),
        Math.abs(matrix[column][row]),
        Number.MIN_VALUE,
      );
      maximum = Math.max(
        maximum,
        Math.abs(matrix[row][column] - matrix[column][row]) / scale,
      );
    }
  }
  return maximum;
}

function maximumTwoSidedFrequencyMismatch(grid: number[]): number {
  let maximum = 0;
  for (let index = 0; index < grid.length; index += 1) {
    maximum = Math.max(
      maximum,
      Math.abs(grid[index] + grid[grid.length - 1 - index]),
    );
  }
  return maximum;
}

function maximumTwoSidedScalarError(values: number[]): number {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    maximum = Math.max(
      maximum,
      relativeDifference(values[index], values[values.length - 1 - index]),
    );
  }
  return maximum;
}

function maximumTwoSidedMatrixError(matrices: Matrix3Value[]): number {
  let maximum = 0;
  for (let index = 0; index < matrices.length; index += 1) {
    const mirror = matrices[matrices.length - 1 - index];
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        maximum = Math.max(
          maximum,
          relativeDifference(
            matrices[index][row][column],
            mirror[column][row],
          ),
        );
      }
    }
  }
  return maximum;
}

function positiveSemidefinite(matrix: Matrix3Value): boolean {
  const tolerance = 1e-12;
  const diagonalScale = Math.max(
    Math.abs(matrix[0][0]),
    Math.abs(matrix[1][1]),
    Math.abs(matrix[2][2]),
    Number.MIN_VALUE,
  );
  const normalized = matrix.map((row) =>
    row.map((value) => value / diagonalScale)
  );
  const lower = Array.from({ length: 3 }, () => new Array<number>(3).fill(0));
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let residual = normalized[row][column];
      for (let inner = 0; inner < column; inner += 1) {
        residual -= lower[row][inner] * lower[column][inner];
      }
      if (row === column) {
        if (residual < -tolerance) return false;
        lower[row][column] = Math.sqrt(Math.max(0, residual));
      } else if (lower[column][column] > tolerance) {
        lower[row][column] = residual / lower[column][column];
      } else if (Math.abs(residual) > tolerance) {
        return false;
      }
    }
  }
  return true;
}

function quadraticForm(vector: readonly number[], matrix: Matrix3Value): number {
  let value = 0;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      value += vector[row] * matrix[row][column] * vector[column];
    }
  }
  return value;
}

function interpolateMatrix(
  grid: number[],
  matrices: Matrix3Value[],
  target: number,
): Matrix3Value | null {
  if (target < grid[0] || target > grid[grid.length - 1]) return null;
  let upper = grid.findIndex((value) => value >= target);
  if (upper < 0) return null;
  if (grid[upper] === target || upper === 0) return matrices[upper];
  const lower = upper - 1;
  const fraction = (target - grid[lower]) / (grid[upper] - grid[lower]);
  return matrices[lower].map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      value +
      fraction * (matrices[upper][rowIndex][columnIndex] - value)
    )
  ) as Matrix3Value;
}

function vectorNorm(vector: readonly number[]): number {
  return Math.hypot(...vector);
}

export function evaluateCasimirDpQedGreenNoise(
  rawInput: CasimirDpQedGreenNoiseInput,
) {
  const input = CasimirDpQedGreenNoiseInput.parse(rawInput);
  if (input.noise.source_kind === "mean_pressure_proxy") {
    throw new Error(
      "casimir_dp_qed_mean_pressure_is_not_a_noise_spectrum",
    );
  }

  const bindings = [
    input.green_tensor.model_binding_sha256,
    input.branch_trace.model_binding_sha256,
    input.noise.model_binding_sha256,
    ...input.sensitivity_runs.map((run) => run.model_binding_sha256),
  ];
  const sharedBinding = bindings.every(
    (binding) => binding === input.model_binding_sha256,
  );

  const time = input.branch_trace.time_s;
  const timeWeights = trapezoidWeights(time);
  const duration = time[time.length - 1] - time[0];
  const energyDifference = input.branch_trace.branch_a_potential_J.map(
    (value, index) => value - input.branch_trace.branch_b_potential_J[index],
  );
  const actionDifference = energyDifference.reduce(
    (sum, value, index) => sum + value * timeWeights[index],
    0,
  );
  const rawBasePhase = -actionDifference / HBAR;
  const basePhase = Object.is(rawBasePhase, -0) ? 0 : rawBasePhase;
  const phaseSamplingVariance = timeWeights.reduce((sum, weight, index) =>
    sum + weight ** 2 * (
      input.branch_trace.branch_a_potential_standard_uncertainty_J[index] ** 2 +
      input.branch_trace.branch_b_potential_standard_uncertainty_J[index] ** 2
    ), 0) / HBAR ** 2;
  const kkCombinedRelativeUncertainty = Math.hypot(
    input.material.kramers_kronig.maximum_relative_error,
    input.material.kramers_kronig.standard_uncertainty,
  );
  const phaseStandardUncertainty = Math.sqrt(
    phaseSamplingVariance +
    (Math.abs(basePhase) * kkCombinedRelativeUncertainty) ** 2,
  );

  const averagePotentialA =
    integrate(time, input.branch_trace.branch_a_potential_J) / duration;
  const averagePotentialB =
    integrate(time, input.branch_trace.branch_b_potential_J) / duration;
  const averageScalarUncertainty = (uncertainties: number[]) =>
    Math.sqrt(uncertainties.reduce(
      (sum, uncertainty, index) =>
        sum + (timeWeights[index] * uncertainty) ** 2,
      0,
    )) / duration;
  const averagePotentialAStandardUncertainty = Math.hypot(
    averageScalarUncertainty(
      input.branch_trace.branch_a_potential_standard_uncertainty_J,
    ),
    Math.abs(averagePotentialA) * kkCombinedRelativeUncertainty,
  );
  const averagePotentialBStandardUncertainty = Math.hypot(
    averageScalarUncertainty(
      input.branch_trace.branch_b_potential_standard_uncertainty_J,
    ),
    Math.abs(averagePotentialB) * kkCombinedRelativeUncertainty,
  );
  const averageForce = (branch: Matrix3Value[number][]) =>
    [0, 1, 2].map((component) =>
      branch.reduce(
        (sum, vector, index) =>
          sum + vector[component] * timeWeights[index],
        0,
      ) / duration
    ) as [number, number, number];
  const averageVectorUncertainty = (
    branch: [number, number, number][],
    mean: [number, number, number],
  ) =>
    [0, 1, 2].map((component) =>
      Math.hypot(
        Math.sqrt(branch.reduce(
          (sum, vector, index) =>
            sum + (timeWeights[index] * vector[component]) ** 2,
          0,
        )) / duration,
        Math.abs(mean[component]) * kkCombinedRelativeUncertainty,
      )
    ) as [number, number, number];
  const meanForceA = averageForce(input.branch_trace.branch_a_force_N);
  const meanForceB = averageForce(input.branch_trace.branch_b_force_N);
  const meanForceAStandardUncertainty = averageVectorUncertainty(
    input.branch_trace.branch_a_force_standard_uncertainty_N,
    meanForceA,
  );
  const meanForceBStandardUncertainty = averageVectorUncertainty(
    input.branch_trace.branch_b_force_standard_uncertainty_N,
    meanForceB,
  );
  const differentialForce = meanForceA.map(
    (value, index) => value - meanForceB[index],
  ) as [number, number, number];
  const differentialForceStandardUncertainty = meanForceAStandardUncertainty.map(
    (value, index) => Math.hypot(value, meanForceBStandardUncertainty[index]),
  ) as [number, number, number];
  const meanForceGradient =
    integrate(time, input.branch_trace.differential_force_gradient_N_m) /
    duration;
  const meanForceGradientStandardUncertainty = Math.hypot(
    averageScalarUncertainty(
      input.branch_trace
        .differential_force_gradient_standard_uncertainty_N_m,
    ),
    Math.abs(meanForceGradient) * kkCombinedRelativeUncertainty,
  );

  const omega = input.noise.omega_rad_s;
  const spectralPrefactor = 0.5 / (HBAR ** 2 * 2 * PI);
  const ramseyIntegrand = input.noise.energy_difference_psd_J2_s.map(
    (value, index) => value * input.noise.ramsey_filter_abs2_s2[index],
  );
  const echoIntegrand = input.noise.energy_difference_psd_J2_s.map(
    (value, index) => value * input.noise.echo_filter_abs2_s2[index],
  );
  const ramseyChi = spectralPrefactor * integrate(omega, ramseyIntegrand);
  const echoChi = spectralPrefactor * integrate(omega, echoIntegrand);
  const omegaWeights = trapezoidWeights(omega);
  const chiVariance = input.noise
    .energy_difference_psd_standard_uncertainty_J2_s
    .reduce((sum, uncertainty, index) => {
      const coefficient =
        spectralPrefactor *
        omegaWeights[index] *
        input.noise.ramsey_filter_abs2_s2[index];
      return sum + (coefficient * uncertainty) ** 2;
    }, 0);
  const echoChiVariance = input.noise
    .energy_difference_psd_standard_uncertainty_J2_s
    .reduce((sum, uncertainty, index) => {
      const coefficient =
        spectralPrefactor *
        omegaWeights[index] *
        input.noise.echo_filter_abs2_s2[index];
      return sum + (coefficient * uncertainty) ** 2;
    }, 0);
  const ramseyEchoChiCovariance = input.noise
    .energy_difference_psd_standard_uncertainty_J2_s
    .reduce((sum, uncertainty, index) => {
      const common =
        spectralPrefactor * omegaWeights[index] * uncertainty;
      return sum +
        common ** 2 *
          input.noise.ramsey_filter_abs2_s2[index] *
          input.noise.echo_filter_abs2_s2[index];
    }, 0);

  const reciprocityError = maximumReciprocityError(
    input.green_tensor.samples,
  );
  const reciprocityPass =
    !input.green_tensor.reciprocity_required ||
    reciprocityError <= input.green_tensor.reciprocity_relative_tolerance;
  const interpolationPass =
    input.green_tensor.interpolation_relative_error <=
    input.green_tensor.maximum_interpolation_relative_error;
  const noiseHermitianPass = input.noise.force_noise_psd_N2_s.every(
    (matrix) => matrixSymmetryError(matrix) <= 1e-12,
  );
  const noisePsdPass = input.noise.force_noise_psd_N2_s.every(
    (matrix) => positiveSemidefinite(matrix),
  );
  const maximumFrequencyMismatch = maximumTwoSidedFrequencyMismatch(omega);
  const twoSidedFrequencyPass =
    maximumFrequencyMismatch <=
      input.noise.two_sided_frequency_absolute_tolerance_rad_s;
  const twoSidedErrors = {
    energy_difference_psd: maximumTwoSidedScalarError(
      input.noise.energy_difference_psd_J2_s,
    ),
    energy_difference_psd_uncertainty: maximumTwoSidedScalarError(
      input.noise.energy_difference_psd_standard_uncertainty_J2_s,
    ),
    force_noise_psd: maximumTwoSidedMatrixError(
      input.noise.force_noise_psd_N2_s,
    ),
    force_noise_psd_uncertainty: maximumTwoSidedMatrixError(
      input.noise.force_noise_psd_standard_uncertainty_N2_s,
    ),
    ramsey_filter: maximumTwoSidedScalarError(
      input.noise.ramsey_filter_abs2_s2,
    ),
    echo_filter: maximumTwoSidedScalarError(
      input.noise.echo_filter_abs2_s2,
    ),
  };
  const maximumTwoSidedRelativeError = Math.max(
    ...Object.values(twoSidedErrors),
  );
  const twoSidedSpectrumPass =
    maximumTwoSidedRelativeError <= input.noise.two_sided_relative_tolerance;
  const fluctuationMetadataPass =
    input.noise.source_kind === "measured_spectrum" ||
    (
      input.noise.fluctuation_dissipation_ref != null &&
      input.noise.includes_material_loss &&
      input.noise.includes_temperature &&
      input.noise.includes_geometry
    );
  const kkPass =
    input.material.kramers_kronig.maximum_relative_error +
      input.material.kramers_kronig.standard_uncertainty <=
    input.material.kramers_kronig.tolerance;

  let maximumLinearizedRelativeError: number | null = null;
  let linearizedGate: "pass" | "not_ready" | "not_applied" = "not_applied";
  if (input.noise.linearized_check.enabled) {
    const errors = input.noise.force_noise_psd_N2_s.map((matrix, index) => {
      const predicted = quadraticForm(
        input.noise.linearized_check.branch_displacement_m,
        matrix,
      );
      const direct = input.noise.energy_difference_psd_J2_s[index];
      return Math.abs(predicted - direct) /
        Math.max(Math.abs(direct), Math.abs(predicted), Number.MIN_VALUE);
    });
    maximumLinearizedRelativeError = Math.max(...errors);
    linearizedGate =
      input.noise.linearized_check.linear_response_domain_confirmed &&
        maximumLinearizedRelativeError <=
          input.noise.linearized_check.maximum_relative_error
        ? "pass"
        : "not_ready";
  }

  let heating: {
    gate: "pass" | "not_ready";
    occupation_heating_rate_s: number | null;
    occupation_heating_rate_standard_uncertainty_s: number | null;
    projected_force_psd_N2_s: number | null;
    projected_force_psd_standard_uncertainty_N2_s: number | null;
    formula_id: string | null;
    source_ref: string | null;
  };
  if (input.heating_model == null) {
    heating = {
      gate: "not_ready",
      occupation_heating_rate_s: null,
      occupation_heating_rate_standard_uncertainty_s: null,
      projected_force_psd_N2_s: null,
      projected_force_psd_standard_uncertainty_N2_s: null,
      formula_id: null,
      source_ref: null,
    };
  } else {
    const directionNorm = vectorNorm(input.heating_model.coupling_direction);
    const positiveGrid = omega.filter((value) => value >= 0);
    const firstPositive = omega.findIndex((value) => value >= 0);
    const positiveMatrices = firstPositive < 0
      ? []
      : input.noise.force_noise_psd_N2_s.slice(firstPositive);
    const positiveUncertaintyMatrices = firstPositive < 0
      ? []
      : input.noise.force_noise_psd_standard_uncertainty_N2_s.slice(
        firstPositive,
      );
    const matrix = positiveGrid.length === positiveMatrices.length
      ? interpolateMatrix(
        positiveGrid,
        positiveMatrices,
        input.heating_model.oscillator_omega_rad_s,
      )
      : null;
    const uncertaintyMatrix =
      positiveGrid.length === positiveUncertaintyMatrices.length
        ? interpolateMatrix(
          positiveGrid,
          positiveUncertaintyMatrices,
          input.heating_model.oscillator_omega_rad_s,
        )
        : null;
    if (directionNorm <= 0 || matrix == null || uncertaintyMatrix == null) {
      heating = {
        gate: "not_ready",
        occupation_heating_rate_s: null,
        occupation_heating_rate_standard_uncertainty_s: null,
        projected_force_psd_N2_s: null,
        projected_force_psd_standard_uncertainty_N2_s: null,
        formula_id: input.heating_model.formula_id,
        source_ref: input.heating_model.source_ref,
      };
    } else {
      const unitDirection = input.heating_model.coupling_direction.map(
        (value) => value / directionNorm,
      );
      const projected = quadraticForm(unitDirection, matrix);
      let projectedVariance = 0;
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          projectedVariance += (
            unitDirection[row] *
            unitDirection[column] *
            uncertaintyMatrix[row][column]
          ) ** 2;
        }
      }
      const projectedStandardUncertainty = Math.sqrt(projectedVariance);
      const heatingDenominator =
        2 *
        input.heating_model.oscillator_mass_kg *
        HBAR *
        input.heating_model.oscillator_omega_rad_s;
      heating = {
        gate:
          projected >= 0 && noiseHermitianPass && noisePsdPass &&
            twoSidedFrequencyPass && twoSidedSpectrumPass
            ? "pass"
            : "not_ready",
        occupation_heating_rate_s:
          projected / heatingDenominator,
        occupation_heating_rate_standard_uncertainty_s:
          projectedStandardUncertainty / heatingDenominator,
        projected_force_psd_N2_s: projected,
        projected_force_psd_standard_uncertainty_N2_s:
          projectedStandardUncertainty,
        formula_id: input.heating_model.formula_id,
        source_ref: input.heating_model.source_ref,
      };
    }
  }

  const limitMagnitude = Math.max(
    ...input.branch_trace.branch_a_potential_J.map(Math.abs),
    ...input.branch_trace.branch_b_potential_J.map(Math.abs),
    ...input.branch_trace.branch_a_force_N.flat().map(Math.abs),
    ...input.branch_trace.branch_b_force_N.flat().map(Math.abs),
    ...input.branch_trace.differential_force_gradient_N_m.map(Math.abs),
    ...input.noise.energy_difference_psd_J2_s.map(Math.abs),
    ...input.noise.force_noise_psd_N2_s.flat(2).map(Math.abs),
  );
  const limitGate = input.coupling_limit_case === "registered_coupling"
    ? "not_applied" as const
    : limitMagnitude <= input.zero_limit_absolute_tolerance
      ? "pass" as const
      : "not_ready" as const;

  const sensitivityParameters = new Set(
    input.sensitivity_runs.map((run) => run.parameter),
  );
  const requiredSensitivityParameters = [
    "material_loss",
    "temperature",
    "surface_distance",
    "geometry",
  ] as const;
  const sensitivityPass = requiredSensitivityParameters.every(
    (parameter) => sensitivityParameters.has(parameter),
  ) && input.sensitivity_runs.every(
    (run) => run.model_binding_sha256 === input.model_binding_sha256,
  );
  const sensitivity = input.sensitivity_runs.map((run) => ({
    ...run,
    delta_phase_rad: run.phase_rad - basePhase,
    delta_ramsey_chi: run.ramsey_chi - ramseyChi,
  }));

  const greenReceiptPass = receiptPass(input.green_tensor.receipt);
  const materialReceiptPass = receiptPass(input.material.receipt);
  const geometryReceiptPass = receiptPass(input.geometry.receipt);
  const probeReceiptPass = receiptPass(input.probe.response_receipt);
  const noiseReceiptPass = receiptPass(input.noise.receipt);
  const finiteGeometry =
    input.model_domain === "finite_geometry" &&
    input.green_tensor.source_kind !== "planar_reduced_order";
  const measuredReady =
    input.evidence_class === "measured" &&
    input.material.evidence_class === "measured" &&
    input.material.measured_response_over_required_band &&
    input.geometry.evidence_class === "measured" &&
    input.geometry.measured_geometry_and_alignment &&
    finiteGeometry &&
    sharedBinding &&
    greenReceiptPass &&
    materialReceiptPass &&
    geometryReceiptPass &&
    probeReceiptPass &&
    noiseReceiptPass &&
    reciprocityPass &&
    interpolationPass &&
    noiseHermitianPass &&
    noisePsdPass &&
    twoSidedFrequencyPass &&
    twoSidedSpectrumPass &&
    fluctuationMetadataPass &&
    kkPass &&
    sensitivityPass &&
    (linearizedGate === "pass" || linearizedGate === "not_applied") &&
    (input.heating_model == null || heating.gate === "pass");

  return {
    schema_version: "casimir_dp_qed_green_noise_result/1" as const,
    mean_interaction: {
      branch_a_mean_potential_J: averagePotentialA,
      branch_b_mean_potential_J: averagePotentialB,
      branch_a_mean_potential_standard_uncertainty_J:
        averagePotentialAStandardUncertainty,
      branch_b_mean_potential_standard_uncertainty_J:
        averagePotentialBStandardUncertainty,
      branch_action_difference_J_s: actionDifference,
      phase_rad: basePhase,
      phase_standard_uncertainty_rad: phaseStandardUncertainty,
      path_swap: input.branch_trace.path_swap,
      branch_a_mean_force_N: meanForceA,
      branch_b_mean_force_N: meanForceB,
      branch_a_mean_force_standard_uncertainty_N:
        meanForceAStandardUncertainty,
      branch_b_mean_force_standard_uncertainty_N:
        meanForceBStandardUncertainty,
      differential_mean_force_N: differentialForce,
      differential_mean_force_standard_uncertainty_N:
        differentialForceStandardUncertainty,
      mean_differential_force_gradient_N_m: meanForceGradient,
      mean_differential_force_gradient_standard_uncertainty_N_m:
        meanForceGradientStandardUncertainty,
    },
    green_tensor_diagnostics: {
      source_kind: input.green_tensor.source_kind,
      artifact_integrity: greenReceiptPass ? "pass" as const : "not_ready" as const,
      shared_material_geometry_binding:
        sharedBinding ? "pass" as const : "not_ready" as const,
      reciprocity_maximum_relative_error: reciprocityError,
      reciprocity_gate: reciprocityPass ? "pass" as const : "not_ready" as const,
      interpolation_relative_error:
        input.green_tensor.interpolation_relative_error,
      interpolation_gate:
        interpolationPass ? "pass" as const : "not_ready" as const,
      model_domain: input.model_domain,
    },
    material_diagnostics: {
      artifact_integrity:
        materialReceiptPass ? "pass" as const : "not_ready" as const,
      kramers_kronig_combined_relative_uncertainty:
        kkCombinedRelativeUncertainty,
      kramers_kronig_gate: kkPass ? "pass" as const : "not_ready" as const,
      measured_response_gate:
        input.material.evidence_class === "measured" &&
          input.material.measured_response_over_required_band &&
          materialReceiptPass
          ? "pass" as const
          : "not_ready" as const,
      extrapolation_gate:
        input.material.extrapolation_ref != null
          ? "registered" as const
          : "not_ready" as const,
    },
    noise: {
      spectrum_convention: input.noise.spectrum_convention,
      energy_difference_psd_J2_s:
        input.noise.energy_difference_psd_J2_s,
      energy_difference_psd_standard_uncertainty_J2_s:
        input.noise.energy_difference_psd_standard_uncertainty_J2_s,
      force_noise_psd_N2_s: input.noise.force_noise_psd_N2_s,
      force_noise_psd_standard_uncertainty_N2_s:
        input.noise.force_noise_psd_standard_uncertainty_N2_s,
      hermitian_real_covariance_gate:
        noiseHermitianPass ? "pass" as const : "not_ready" as const,
      nonnegative_covariance_gate:
        noisePsdPass ? "pass" as const : "not_ready" as const,
      fluctuation_dissipation_metadata_gate:
        fluctuationMetadataPass ? "pass" as const : "not_ready" as const,
      two_sided_frequency_grid: {
        maximum_absolute_mismatch_rad_s: maximumFrequencyMismatch,
        tolerance_rad_s:
          input.noise.two_sided_frequency_absolute_tolerance_rad_s,
        gate: twoSidedFrequencyPass ? "pass" as const : "not_ready" as const,
      },
      two_sided_spectrum_symmetry: {
        component_maximum_relative_errors: twoSidedErrors,
        maximum_relative_error: maximumTwoSidedRelativeError,
        tolerance: input.noise.two_sided_relative_tolerance,
        gate: twoSidedSpectrumPass ? "pass" as const : "not_ready" as const,
      },
      linearized_energy_force_check: {
        maximum_relative_error: maximumLinearizedRelativeError,
        gate: linearizedGate,
      },
    },
    decoherence: {
      ramsey_chi: ramseyChi,
      echo_chi: echoChi,
      ramsey_visibility_factor: Math.exp(-ramseyChi),
      echo_visibility_factor: Math.exp(-echoChi),
      ramsey_chi_standard_uncertainty: Math.sqrt(chiVariance),
      echo_chi_standard_uncertainty: Math.sqrt(echoChiVariance),
      echo_filter_suppression_gate:
        echoChi <= ramseyChi ? "pass" as const : "not_ready" as const,
    },
    heating,
    sensitivity: {
      rows: sensitivity,
      gate: sensitivityPass ? "pass" as const : "not_ready" as const,
    },
    residual_covariance: {
      observable_order: ["phase_rad", "ramsey_chi", "echo_chi"] as const,
      covariance: [
        [phaseStandardUncertainty ** 2, 0, 0],
        [0, chiVariance, ramseyEchoChiCovariance],
        [0, ramseyEchoChiCovariance, echoChiVariance],
      ] as [
        [number, number, number],
        [number, number, number],
        [number, number, number],
      ],
      authority:
        "registered independent phase uncertainty plus shared-PSD Ramsey/echo covariance propagation" as const,
    },
    limits: {
      coupling_limit_case: input.coupling_limit_case,
      maximum_supplied_coupling_magnitude: limitMagnitude,
      gate: limitGate,
    },
    readiness: {
      finite_geometry_gate: finiteGeometry ? "pass" as const : "not_ready" as const,
      measured_geometry_gate:
        input.geometry.evidence_class === "measured" &&
          input.geometry.measured_geometry_and_alignment &&
          geometryReceiptPass
          ? "pass" as const
          : "not_ready" as const,
      measured_qed_lane:
        measuredReady ? "ready_for_scientific_comparison" as const : "not_ready" as const,
      evidence_class: input.evidence_class,
      maximum_claim: measuredReady
        ? "measurement_constrained_qed_prediction" as const
        : input.evidence_class === "synthetic_fixture"
          ? "synthetic_pipeline_validation" as const
          : "diagnostic_reduced_order_prediction" as const,
    },
    promotion_allowed:
      input.evidence_class !== "synthetic_fixture" && measuredReady,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    claim_boundaries: [
      "Measured optical or impedance data constrain a computed Green tensor; they do not make the tensor directly measured.",
      "Mean Casimir or Lifshitz pressure is not a force-noise spectrum.",
      "A planar reduced-order result is diagnostic and cannot close the finite-apparatus QED lane.",
      "QED phase, decoherence, and heating predictions do not identify objective collapse or manifold dynamics.",
    ],
  };
}
