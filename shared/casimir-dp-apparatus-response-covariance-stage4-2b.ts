// math-stage: diagnostic
import { z } from "zod";
import { HBAR, PI } from "./physics-const";

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Finite = z.number().finite();
const NonnegativeFinite = Finite.nonnegative();
const PositiveFinite = Finite.positive();

const Complex = z.object({
  re: Finite,
  im: Finite,
}).strict();

type ComplexValue = z.infer<typeof Complex>;
type ComplexMatrix = ComplexValue[][];

const ComplexMatrixSchema = z.array(z.array(Complex).min(1)).min(1);
const RealMatrixSchema = z.array(z.array(Finite).min(1)).min(1);

const HashedReceipt = z.object({
  source_ref: z.string().min(1),
  expected_sha256: Sha256,
  actual_sha256: Sha256,
  integrity_verified: z.boolean(),
}).strict();

const SpectralSample = z.object({
  omega_rad_s: Finite,
  response: ComplexMatrixSchema,
  observed_cross_spectrum: ComplexMatrixSchema,
  sensor_self_noise_cross_spectrum: ComplexMatrixSchema,
  physical_sensor_noise_cross_spectrum: ComplexMatrixSchema,
}).strict();

const GaussianCell = z.object({
  cell_id: z.string().min(1),
  hold_time_s: NonnegativeFinite,
  energy_transfer_J_per_physical_unit: z.array(
    z.array(Complex).min(1),
  ).min(3),
  sequence_filter_abs2_s2: z.array(NonnegativeFinite).min(3),
  coherent_trace: z.object({
    time_s: z.array(NonnegativeFinite).min(1),
    branch_a_energy_J: z.array(Finite).min(1),
    branch_b_energy_J: z.array(Finite).min(1),
  }).strict(),
  non_gaussian_contributions: z.array(z.object({
    contribution_id: z.string().min(1),
    process: z.enum([
      "gas_collision",
      "thermal_photon_emission",
      "thermal_photon_absorption",
      "thermal_photon_scattering",
      "optical_recoil",
      "registered_jump_process",
    ]),
    chi: NonnegativeFinite,
    coherent_phase_rad: Finite,
    diffusion_limit_used: z.boolean(),
    diffusion_limit_validated: z.boolean(),
    receipt: HashedReceipt,
  }).strict()),
}).strict();

const CovarianceRegularization = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("none"),
  }).strict(),
  z.object({
    kind: z.literal("diagonal_jitter"),
    jitter_variance: PositiveFinite,
    learned_from: z.enum(["pilot", "confirmatory"]),
    frozen_before_confirmatory: z.boolean(),
    coverage_validated: z.boolean(),
    receipt: HashedReceipt,
  }).strict(),
]);

const OwnershipRow = z.object({
  contribution_id: z.string().min(1),
  category: z.enum([
    "thermal",
    "near_field_em_fdt",
    "static_qed_phase",
    "charge_stray_field",
    "patch_potential",
    "vibration_inertial",
    "residual_gas",
    "optical",
    "readout",
    "switching",
  ]),
  owner_runtime: z.string().min(1),
  process_class: z.enum(["gaussian_spectral", "jump_localization", "coherent"]),
  source_kind: z.enum([
    "measured_transfer",
    "calibrated_injection",
    "source_backed_model",
    "mean_casimir_pressure_proxy",
  ]),
  shared_term_rule: z.string().min(1).nullable(),
}).strict();

const InjectionCheck = z.object({
  injection_id: z.string().min(1),
  kind: z.enum(["spectral_line", "correlated_channels"]),
  expected_frequency_rad_s: Finite,
  recovered_frequency_rad_s: Finite,
  maximum_frequency_error_rad_s: NonnegativeFinite,
  expected_amplitude: Finite,
  recovered_amplitude: Finite,
  maximum_relative_amplitude_error: NonnegativeFinite,
  expected_correlation: Finite,
  recovered_correlation: Finite,
  maximum_absolute_correlation_error: NonnegativeFinite,
}).strict();

export const CasimirDpApparatusResponseCovarianceStage4_2BInput = z.object({
  schema_version: z.literal(
    "casimir_dp_apparatus_response_covariance_stage4_2b/1",
  ),
  evidence_class: z.enum([
    "synthetic_fixture",
    "measured_calibration",
    "design_assumption",
  ]),
  acquisition_audit: z.object({
    clocks_synchronized: z.boolean(),
    anti_alias_filter_verified: z.boolean(),
    bandwidth_coverage_verified: z.boolean(),
    response_phase_calibrated: z.boolean(),
    response_phase_max_error_rad: NonnegativeFinite,
    response_phase_tolerance_rad: NonnegativeFinite,
    calibration_age_s: NonnegativeFinite,
    maximum_calibration_age_s: PositiveFinite,
    audit_receipt: HashedReceipt,
  }).strict(),
  sensor_forward_model: z.object({
    learned_from: z.enum(["calibration_or_pilot", "confirmatory"]),
    frozen_before_confirmatory: z.boolean(),
    forward_model_receipt: HashedReceipt,
    channel_ids: z.array(z.string().min(1)).min(1),
    physical_units: z.array(z.string().min(1)).min(1),
    spectrum_convention: z.literal("two_sided_angular_frequency"),
    cross_covariances_explicit: z.boolean(),
    physical_sensor_cross_disposition: z.enum([
      "measured",
      "bounded_zero_with_receipt",
    ]),
    physical_sensor_cross_receipt: HashedReceipt,
    hermiticity_relative_tolerance: PositiveFinite,
    psd_relative_tolerance: PositiveFinite,
    two_sided_frequency_absolute_tolerance_rad_s: NonnegativeFinite,
    two_sided_relative_tolerance: PositiveFinite,
    forward_recovery_relative_tolerance: PositiveFinite,
    samples: z.array(SpectralSample).min(3),
  }).strict(),
  predecessor_reconciliation: z.object({
    qed_green_noise: z.object({
      module_id: z.literal("shared/casimir-dp-qed-green-noise.ts"),
      role: z.literal(
        "upstream_green_fdt_phase_noise_and_heating_prediction",
      ),
      output_receipt: HashedReceipt,
    }).strict(),
    radiative_thermal_closure: z.object({
      module_id: z.literal("shared/casimir-dp-radiative-thermal-closure.ts"),
      role: z.literal(
        "upstream_non_gaussian_thermal_localization_prediction",
      ),
      output_receipt: HashedReceipt,
    }).strict(),
    scalar_predecessor_psd_used_as_full_covariance: z.literal(false),
    duplicate_kernel_vote_counting_allowed: z.literal(false),
  }).strict(),
  gaussian_cells: z.array(GaussianCell).min(1),
  covariance: z.object({
    row_cell_ids: z.array(z.string().min(1)).min(1),
    measured_coherence_covariance: RealMatrixSchema,
    ordinary_input_covariance: RealMatrixSchema,
    measured_ordinary_cross_covariance: RealMatrixSchema,
    ordinary_measured_cross_covariance: RealMatrixSchema,
    ordinary_jacobian: RealMatrixSchema,
    omitted_cross_covariance: z.literal(false),
    common_calibration_ancestry_receipt: HashedReceipt,
    maximum_condition_number: PositiveFinite,
    symmetry_relative_tolerance: PositiveFinite,
    positive_definite_relative_tolerance: PositiveFinite,
    regularization: CovarianceRegularization,
  }).strict(),
  channel_ownership: z.array(OwnershipRow).min(1),
  injection_checks: z.array(InjectionCheck).min(2),
}).strict().superRefine((input, context) => {
  const channels = input.sensor_forward_model.channel_ids.length;
  if (
    input.sensor_forward_model.physical_units.length !== channels ||
    new Set(input.sensor_forward_model.channel_ids).size !== channels
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sensor_forward_model", "channel_ids"],
      message: "Channel IDs must be unique and have one physical unit each.",
    });
  }

  const squareComplex = (
    matrix: ComplexMatrix,
    path: Array<string | number>,
  ) => {
    if (
      matrix.length !== channels ||
      matrix.some((row) => row.length !== channels)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: "Spectral matrices must be square with one row per channel.",
      });
    }
  };
  for (const [sampleIndex, sample] of input.sensor_forward_model.samples.entries()) {
    squareComplex(sample.response, [
      "sensor_forward_model",
      "samples",
      sampleIndex,
      "response",
    ]);
    squareComplex(sample.observed_cross_spectrum, [
      "sensor_forward_model",
      "samples",
      sampleIndex,
      "observed_cross_spectrum",
    ]);
    squareComplex(sample.sensor_self_noise_cross_spectrum, [
      "sensor_forward_model",
      "samples",
      sampleIndex,
      "sensor_self_noise_cross_spectrum",
    ]);
    squareComplex(sample.physical_sensor_noise_cross_spectrum, [
      "sensor_forward_model",
      "samples",
      sampleIndex,
      "physical_sensor_noise_cross_spectrum",
    ]);
    if (
      sampleIndex > 0 &&
      sample.omega_rad_s <=
        input.sensor_forward_model.samples[sampleIndex - 1].omega_rad_s
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sensor_forward_model", "samples", sampleIndex, "omega_rad_s"],
        message: "Angular frequencies must be strictly increasing.",
      });
    }
  }

  const frequencyCount = input.sensor_forward_model.samples.length;
  for (const [cellIndex, cell] of input.gaussian_cells.entries()) {
    if (
      cell.energy_transfer_J_per_physical_unit.length !== frequencyCount ||
      cell.sequence_filter_abs2_s2.length !== frequencyCount ||
      cell.energy_transfer_J_per_physical_unit.some(
        (row) => row.length !== channels,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gaussian_cells", cellIndex],
        message:
          "Every cell needs one filter and one channel-complete transfer vector per spectral sample.",
      });
    }
    const trace = cell.coherent_trace;
    if (
      trace.branch_a_energy_J.length !== trace.time_s.length ||
      trace.branch_b_energy_J.length !== trace.time_s.length ||
      trace.time_s[0] !== 0 ||
      trace.time_s[trace.time_s.length - 1] !== cell.hold_time_s ||
      (
        cell.hold_time_s === 0
          ? trace.time_s.length !== 1
          : trace.time_s.length < 2
      ) ||
      trace.time_s.some(
        (time, index) => index > 0 && time <= trace.time_s[index - 1],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gaussian_cells", cellIndex, "coherent_trace"],
        message:
          "Coherent traces must have aligned arrays; a zero-time cell is exactly [0], while a positive-time cell starts at zero, ends at hold time, and is strictly increasing.",
      });
    }
  }

  const cellIds = input.gaussian_cells.map((cell) => cell.cell_id);
  if (new Set(cellIds).size !== cellIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gaussian_cells"],
      message: "Cell IDs must be unique.",
    });
  }
  if (
    input.covariance.row_cell_ids.length !== cellIds.length ||
    input.covariance.row_cell_ids.some((id, index) => id !== cellIds[index])
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["covariance", "row_cell_ids"],
      message:
        "Covariance row order must exactly match the frozen Gaussian-cell order.",
    });
  }

  const n = cellIds.length;
  const matrixShape = (
    matrix: number[][],
    rows: number,
    columns: number,
    path: string,
  ) => {
    if (matrix.length !== rows || matrix.some((row) => row.length !== columns)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["covariance", path],
        message: `${path} must have shape ${rows}x${columns}.`,
      });
    }
  };
  matrixShape(input.covariance.measured_coherence_covariance, n, n,
    "measured_coherence_covariance");
  matrixShape(input.covariance.ordinary_input_covariance, n, n,
    "ordinary_input_covariance");
  matrixShape(input.covariance.measured_ordinary_cross_covariance, n, n,
    "measured_ordinary_cross_covariance");
  matrixShape(input.covariance.ordinary_measured_cross_covariance, n, n,
    "ordinary_measured_cross_covariance");
  matrixShape(input.covariance.ordinary_jacobian, n, n, "ordinary_jacobian");
});

export type CasimirDpApparatusResponseCovarianceStage4_2BInput = z.infer<
  typeof CasimirDpApparatusResponseCovarianceStage4_2BInput
>;

export type CasimirDpApparatusResponseCovarianceStage4_2BFailure = {
  code: string;
  reason: string;
};

export type CasimirDpApparatusResponseCovarianceStage4_2BResult = ReturnType<
  typeof evaluateCasimirDpApparatusResponseCovarianceStage4_2B
>;

const c = (re = 0, im = 0): ComplexValue => ({ re, im });
const add = (a: ComplexValue, b: ComplexValue): ComplexValue =>
  c(a.re + b.re, a.im + b.im);
const subtract = (a: ComplexValue, b: ComplexValue): ComplexValue =>
  c(a.re - b.re, a.im - b.im);
const multiply = (a: ComplexValue, b: ComplexValue): ComplexValue =>
  c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const conjugate = (a: ComplexValue): ComplexValue => c(a.re, -a.im);
const divide = (a: ComplexValue, b: ComplexValue): ComplexValue => {
  const denominator = b.re * b.re + b.im * b.im;
  return c(
    (a.re * b.re + a.im * b.im) / denominator,
    (a.im * b.re - a.re * b.im) / denominator,
  );
};
const magnitude = (value: ComplexValue): number =>
  Math.hypot(value.re, value.im);

function zeros(rows: number, columns = rows): ComplexMatrix {
  return Array.from(
    { length: rows },
    () => Array.from({ length: columns }, () => c()),
  );
}

function dagger(matrix: ComplexMatrix): ComplexMatrix {
  return matrix[0].map((_, column) =>
    matrix.map((row) => conjugate(row[column]))
  );
}

function complexMatrixAdd(
  left: ComplexMatrix,
  right: ComplexMatrix,
  sign = 1,
): ComplexMatrix {
  return left.map((row, i) =>
    row.map((value, j) =>
      sign === 1 ? add(value, right[i][j]) : subtract(value, right[i][j])
    )
  );
}

function complexMatrixMultiply(
  left: ComplexMatrix,
  right: ComplexMatrix,
): ComplexMatrix {
  const output = zeros(left.length, right[0].length);
  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right[0].length; j += 1) {
      for (let k = 0; k < right.length; k += 1) {
        output[i][j] = add(
          output[i][j],
          multiply(left[i][k], right[k][j]),
        );
      }
    }
  }
  return output;
}

function complexInverse(matrix: ComplexMatrix): ComplexMatrix | null {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row.map((value) => ({ ...value })),
    ...Array.from({ length: n }, (_, j) => c(i === j ? 1 : 0)),
  ]);
  const scale = Math.max(
    ...matrix.flat().map(magnitude),
    Number.MIN_VALUE,
  );
  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) {
      if (
        magnitude(augmented[row][column]) >
        magnitude(augmented[pivot][column])
      ) {
        pivot = row;
      }
    }
    if (magnitude(augmented[pivot][column]) <= scale * 1e-13) return null;
    [augmented[column], augmented[pivot]] =
      [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    augmented[column] = augmented[column].map((value) =>
      divide(value, divisor)
    );
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) =>
        subtract(value, multiply(factor, augmented[column][index]))
      );
    }
  }
  return augmented.map((row) => row.slice(n));
}

function maximumComplexScale(matrix: ComplexMatrix): number {
  return Math.max(...matrix.flat().map(magnitude), Number.MIN_VALUE);
}

function hermiticityRelativeError(matrix: ComplexMatrix): number {
  const adjoint = dagger(matrix);
  const scale = maximumComplexScale(matrix);
  return Math.max(
    ...matrix.flatMap((row, i) =>
      row.map((value, j) => magnitude(subtract(value, adjoint[i][j])) / scale)
    ),
  );
}

function frobeniusRelativeError(
  left: ComplexMatrix,
  right: ComplexMatrix,
): number {
  const numerator = Math.sqrt(left.flatMap((row, i) =>
    row.map((value, j) => magnitude(subtract(value, right[i][j])) ** 2)
  ).reduce((sum, value) => sum + value, 0));
  const denominator = Math.max(
    Math.sqrt(right.flat().reduce(
      (sum, value) => sum + magnitude(value) ** 2,
      0,
    )),
    Number.MIN_VALUE,
  );
  return numerator / denominator;
}

function realSymmetricEigenvalues(matrix: number[][]): number[] {
  const n = matrix.length;
  const scale = Math.max(
    ...matrix.flat().map((value) => Math.abs(value)),
    Number.MIN_VALUE,
  );
  const work = matrix.map((row) => row.map((value) => value / scale));
  for (let iteration = 0; iteration < 80 * Math.max(1, n * n); iteration += 1) {
    let p = 0;
    let q = 0;
    let maximum = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        if (Math.abs(work[i][j]) > maximum) {
          maximum = Math.abs(work[i][j]);
          p = i;
          q = j;
        }
      }
    }
    if (maximum <= 1e-14) break;
    const angle = 0.5 * Math.atan2(
      2 * work[p][q],
      work[q][q] - work[p][p],
    );
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const app = work[p][p];
    const aqq = work[q][q];
    const apq = work[p][q];
    work[p][p] =
      cosine * cosine * app - 2 * sine * cosine * apq +
      sine * sine * aqq;
    work[q][q] =
      sine * sine * app + 2 * sine * cosine * apq +
      cosine * cosine * aqq;
    work[p][q] = 0;
    work[q][p] = 0;
    for (let k = 0; k < n; k += 1) {
      if (k === p || k === q) continue;
      const akp = work[k][p];
      const akq = work[k][q];
      work[k][p] = cosine * akp - sine * akq;
      work[p][k] = work[k][p];
      work[k][q] = sine * akp + cosine * akq;
      work[q][k] = work[k][q];
    }
  }
  return work.map((row, index) => row[index] * scale);
}

function minimumHermitianEigenvalue(matrix: ComplexMatrix): number {
  const n = matrix.length;
  const block = Array.from({ length: 2 * n }, () =>
    Array(2 * n).fill(0)
  );
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      block[i][j] = matrix[i][j].re;
      block[i][j + n] = -matrix[i][j].im;
      block[i + n][j] = matrix[i][j].im;
      block[i + n][j + n] = matrix[i][j].re;
    }
  }
  return Math.min(...realSymmetricEigenvalues(block));
}

function matrixMultiply(left: number[][], right: number[][]): number[][] {
  return left.map((row) =>
    right[0].map((_, column) =>
      row.reduce(
        (sum, value, index) => sum + value * right[index][column],
        0,
      )
    )
  );
}

function matrixTranspose(matrix: number[][]): number[][] {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function matrixAdd(
  left: number[][],
  right: number[][],
  sign = 1,
): number[][] {
  return left.map((row, i) =>
    row.map((value, j) => value + sign * right[i][j])
  );
}

function covarianceSymmetryError(matrix: number[][]): number {
  const scale = Math.max(
    ...matrix.flat().map((value) => Math.abs(value)),
    Number.MIN_VALUE,
  );
  return Math.max(...matrix.flatMap((row, i) =>
    row.map((value, j) => Math.abs(value - matrix[j][i]) / scale)
  ));
}

function relativeMatrixDifference(
  left: number[][],
  right: number[][],
): number {
  const scale = Math.max(
    ...left.flat().map((value) => Math.abs(value)),
    ...right.flat().map((value) => Math.abs(value)),
    Number.MIN_VALUE,
  );
  return Math.max(...left.flatMap((row, i) =>
    row.map((value, j) => Math.abs(value - right[i][j]) / scale)
  ));
}

function cholesky(matrix: number[][], relativeTolerance: number): number[][] | null {
  const n = matrix.length;
  const scale = Math.max(
    ...matrix.flat().map((value) => Math.abs(value)),
    Number.MIN_VALUE,
  );
  const lower = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let residual = matrix[i][j];
      for (let k = 0; k < j; k += 1) {
        residual -= lower[i][k] * lower[j][k];
      }
      if (i === j) {
        if (residual <= relativeTolerance * scale) return null;
        lower[i][j] = Math.sqrt(residual);
      } else {
        lower[i][j] = residual / lower[j][j];
      }
    }
  }
  return lower;
}

function trapezoid(grid: number[], values: number[]): number {
  let integral = 0;
  for (let i = 0; i < grid.length - 1; i += 1) {
    integral +=
      0.5 * (grid[i + 1] - grid[i]) * (values[i] + values[i + 1]);
  }
  return integral;
}

function receiptPass(receipt: z.infer<typeof HashedReceipt>): boolean {
  return receipt.integrity_verified &&
    receipt.expected_sha256 === receipt.actual_sha256;
}

function quadraticForm(
  vector: ComplexValue[],
  matrix: ComplexMatrix,
): ComplexValue {
  let result = c();
  for (let i = 0; i < vector.length; i += 1) {
    for (let j = 0; j < vector.length; j += 1) {
      result = add(
        result,
        multiply(conjugate(vector[i]), multiply(matrix[i][j], vector[j])),
      );
    }
  }
  return result;
}

function relativeDifference(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function failure(
  code: string,
  reason: string,
): CasimirDpApparatusResponseCovarianceStage4_2BFailure {
  return { code, reason };
}

export function evaluateCasimirDpApparatusResponseCovarianceStage4_2B(
  rawInput: CasimirDpApparatusResponseCovarianceStage4_2BInput,
) {
  const input =
    CasimirDpApparatusResponseCovarianceStage4_2BInput.parse(rawInput);
  const failures: CasimirDpApparatusResponseCovarianceStage4_2BFailure[] = [];
  const audit = input.acquisition_audit;
  if (
    !audit.clocks_synchronized ||
    !audit.anti_alias_filter_verified ||
    !audit.bandwidth_coverage_verified
  ) {
    failures.push(failure(
      "apparatus_timing_or_bandwidth_not_ready",
      "Clock, anti-alias, and bandwidth audits must all pass.",
    ));
  }
  if (
    !audit.response_phase_calibrated ||
    audit.response_phase_max_error_rad > audit.response_phase_tolerance_rad
  ) {
    failures.push(failure(
      "response_phase_not_calibrated",
      "The complex response phase exceeds its frozen calibration tolerance.",
    ));
  }
  if (audit.calibration_age_s > audit.maximum_calibration_age_s) {
    failures.push(failure(
      "calibration_stale",
      "Apparatus calibration is older than the registered maximum age.",
    ));
  }
  if (!receiptPass(audit.audit_receipt)) {
    failures.push(failure(
      "acquisition_audit_receipt_invalid",
      "The acquisition-audit receipt failed hash integrity.",
    ));
  }

  const forward = input.sensor_forward_model;
  if (
    forward.learned_from !== "calibration_or_pilot" ||
    !forward.frozen_before_confirmatory
  ) {
    failures.push(failure(
      "confirmatory_trained_sensor_model",
      "The sensor/noise forward model must be learned from calibration or pilot data and frozen before confirmatory acquisition.",
    ));
  }
  if (
    !receiptPass(forward.forward_model_receipt) ||
    !receiptPass(forward.physical_sensor_cross_receipt)
  ) {
    failures.push(failure(
      "sensor_forward_model_receipt_invalid",
      "The sensor response or physical/noise cross-spectrum receipt failed integrity.",
    ));
  }
  if (!forward.cross_covariances_explicit) {
    failures.push(failure(
      "omitted_sensor_cross_covariance",
      "Physical/sensor-noise cross-covariances cannot be silently set to zero.",
    ));
  }
  if (
    !receiptPass(
      input.predecessor_reconciliation.qed_green_noise.output_receipt,
    ) ||
    !receiptPass(
      input.predecessor_reconciliation.radiative_thermal_closure.output_receipt,
    )
  ) {
    failures.push(failure(
      "ordinary_predecessor_receipt_invalid",
      "The Green/FDT and radiative-thermal predecessor outputs must be hash-bound rather than reimplemented or vote-counted.",
    ));
  }

  const omega = forward.samples.map((sample) => sample.omega_rad_s);
  const maximumFrequencyMismatch = Math.max(...omega.map(
    (value, index) => Math.abs(value + omega[omega.length - 1 - index]),
  ));
  if (
    maximumFrequencyMismatch >
      forward.two_sided_frequency_absolute_tolerance_rad_s
  ) {
    failures.push(failure(
      "two_sided_frequency_grid_mismatch",
      "The angular-frequency grid does not recover the frozen two-sided convention.",
    ));
  }

  const physicalSpectra: Array<ComplexMatrix | null> =
    Array.from({ length: forward.samples.length }, () => null);
  const spectralDiagnostics = forward.samples.map((sample, index) => {
    const observedHermiticity =
      hermiticityRelativeError(sample.observed_cross_spectrum);
    const noiseHermiticity =
      hermiticityRelativeError(sample.sensor_self_noise_cross_spectrum);
    const observedMinimumEigenvalue =
      minimumHermitianEigenvalue(sample.observed_cross_spectrum);
    const noiseMinimumEigenvalue =
      minimumHermitianEigenvalue(sample.sensor_self_noise_cross_spectrum);
    const observedScale =
      maximumComplexScale(sample.observed_cross_spectrum);
    const noiseScale =
      maximumComplexScale(sample.sensor_self_noise_cross_spectrum);
    const inverse = complexInverse(sample.response);
    if (inverse == null) {
      return {
        omega_rad_s: sample.omega_rad_s,
        response_invertible: false,
        observed_hermiticity_relative_error: observedHermiticity,
        self_noise_hermiticity_relative_error: noiseHermiticity,
        observed_minimum_eigenvalue: observedMinimumEigenvalue,
        self_noise_minimum_eigenvalue: noiseMinimumEigenvalue,
        physical_hermiticity_relative_error: null,
        physical_minimum_eigenvalue: null,
        forward_recovery_relative_error: null,
        gate: "not_ready" as const,
      };
    }
    const responseCross = complexMatrixMultiply(
      sample.response,
      sample.physical_sensor_noise_cross_spectrum,
    );
    const physicalObserved = complexMatrixAdd(
      complexMatrixAdd(
        sample.observed_cross_spectrum,
        sample.sensor_self_noise_cross_spectrum,
        -1,
      ),
      complexMatrixAdd(responseCross, dagger(responseCross)),
      -1,
    );
    const physical = complexMatrixMultiply(
      complexMatrixMultiply(inverse, physicalObserved),
      dagger(inverse),
    );
    physicalSpectra[index] = physical;
    const physicalHermiticity = hermiticityRelativeError(physical);
    const minimumEigenvalue = minimumHermitianEigenvalue(physical);
    const physicalScale = maximumComplexScale(physical);
    const recoveredObserved = complexMatrixAdd(
      complexMatrixAdd(
        complexMatrixMultiply(
          complexMatrixMultiply(sample.response, physical),
          dagger(sample.response),
        ),
        sample.sensor_self_noise_cross_spectrum,
      ),
      complexMatrixAdd(responseCross, dagger(responseCross)),
    );
    const recovery = frobeniusRelativeError(
      recoveredObserved,
      sample.observed_cross_spectrum,
    );
    const gate =
      observedHermiticity <= forward.hermiticity_relative_tolerance &&
      noiseHermiticity <= forward.hermiticity_relative_tolerance &&
      observedMinimumEigenvalue >=
        -forward.psd_relative_tolerance * observedScale &&
      noiseMinimumEigenvalue >=
        -forward.psd_relative_tolerance * noiseScale &&
      physicalHermiticity <= forward.hermiticity_relative_tolerance &&
      minimumEigenvalue >= -forward.psd_relative_tolerance * physicalScale &&
      recovery <= forward.forward_recovery_relative_tolerance
        ? "pass" as const
        : "not_ready" as const;
    return {
      omega_rad_s: sample.omega_rad_s,
      response_invertible: true,
      observed_hermiticity_relative_error: observedHermiticity,
      self_noise_hermiticity_relative_error: noiseHermiticity,
      observed_minimum_eigenvalue: observedMinimumEigenvalue,
      self_noise_minimum_eigenvalue: noiseMinimumEigenvalue,
      physical_hermiticity_relative_error: physicalHermiticity,
      physical_minimum_eigenvalue: minimumEigenvalue,
      forward_recovery_relative_error: recovery,
      gate,
    };
  });

  if (
    physicalSpectra.some((spectrum) => spectrum == null) ||
    spectralDiagnostics.some((row) => row.gate !== "pass")
  ) {
    failures.push(failure(
      "physical_disturbance_spectrum_not_recovered",
      "Sensor response, self-noise, cross-correlation, Hermiticity, PSD, or forward-recovery checks failed.",
    ));
  }

  let maximumTwoSidedSpectrumError = 0;
  if (physicalSpectra.every(
    (spectrum): spectrum is ComplexMatrix => spectrum != null,
  )) {
    for (let index = 0; index < physicalSpectra.length; index += 1) {
      maximumTwoSidedSpectrumError = Math.max(
        maximumTwoSidedSpectrumError,
        frobeniusRelativeError(
          physicalSpectra[index],
          physicalSpectra[physicalSpectra.length - 1 - index].map((row) =>
            row.map(conjugate)
          ),
        ),
      );
    }
    if (
      maximumTwoSidedSpectrumError > forward.two_sided_relative_tolerance
    ) {
      failures.push(failure(
        "two_sided_spectrum_recovery_failed",
        "The inferred physical spectrum does not satisfy S(-omega)=S(omega)* within tolerance.",
      ));
    }
  }

  const ownershipCounts = new Map<string, typeof input.channel_ownership>();
  for (const row of input.channel_ownership) {
    const rows = ownershipCounts.get(row.contribution_id) ?? [];
    rows.push(row);
    ownershipCounts.set(row.contribution_id, rows);
    if (row.source_kind === "mean_casimir_pressure_proxy") {
      failures.push(failure(
        "mean_casimir_pressure_is_not_noise_psd",
        "Mean Casimir pressure cannot be substituted for a fluctuation spectrum.",
      ));
    }
  }
  for (const [contributionId, rows] of ownershipCounts) {
    if (
      rows.length > 1 &&
      rows.some((row) => row.shared_term_rule == null)
    ) {
      failures.push(failure(
        "ordinary_channel_double_count",
        `Contribution ${contributionId} has multiple owners without a shared-term rule.`,
      ));
    }
  }

  const cellPredictions = input.gaussian_cells.map((cell) => {
    const spectrumReady = physicalSpectra.every(
      (spectrum): spectrum is ComplexMatrix => spectrum != null,
    );
    const usableSpectra = spectrumReady
      ? physicalSpectra as ComplexMatrix[]
      : null;
    const spectralEnergy = spectrumReady
      ? usableSpectra!.map((spectrum, index) =>
        Math.max(0, quadraticForm(
          cell.energy_transfer_J_per_physical_unit[index],
          spectrum,
        ).re)
      )
      : null;
    if (spectralEnergy == null) {
      return {
        cell_id: cell.cell_id,
        hold_time_s: cell.hold_time_s,
        gaussian_chi: null,
        non_gaussian_chi: null,
        total_ordinary_chi: null,
        ordinary_coherent_phase_rad: null,
        energy_difference_psd_J2_s: null,
        per_channel_gaussian_chi: forward.channel_ids.map((channelId) => ({
          channel_id: channelId,
          chi: null,
        })),
        cross_channel_gaussian_chi: null,
        non_gaussian_contribution_rows:
          cell.non_gaussian_contributions.map((row) => ({
            contribution_id: row.contribution_id,
            process: row.process,
            chi: row.chi,
            coherent_phase_rad: row.coherent_phase_rad,
            receipt_source_ref: row.receipt.source_ref,
            receipt_sha256: row.receipt.actual_sha256,
            receipt_gate: receiptPass(row.receipt)
              ? "pass" as const
              : "not_ready" as const,
          })),
      };
    }
    const channelIntegrands = forward.channel_ids.map((_, channel) =>
      spectralEnergy.map((_value, index) => {
        const transfer =
          cell.energy_transfer_J_per_physical_unit[index][channel];
        return magnitude(transfer) ** 2 *
          usableSpectra![index][channel][channel].re *
          cell.sequence_filter_abs2_s2[index];
      })
    );
    const prefactor = 1 / (4 * PI * HBAR ** 2);
    const perChannelChi = channelIntegrands.map(
      (integrand) => prefactor * trapezoid(omega, integrand),
    );
    const gaussianChi = prefactor * trapezoid(
      omega,
      spectralEnergy.map(
        (value, index) => value * cell.sequence_filter_abs2_s2[index],
      ),
    );
    const diagonalChi = perChannelChi.reduce(
      (sum, value) => sum + value,
      0,
    );
    const trace = cell.coherent_trace;
    const deltaEnergy = trace.branch_a_energy_J.map(
      (value, index) => value - trace.branch_b_energy_J[index],
    );
    const phase = -trapezoid(trace.time_s, deltaEnergy) / HBAR +
      cell.non_gaussian_contributions.reduce(
        (sum, row) => sum + row.coherent_phase_rad,
        0,
      );
    const invalidJumpKernel = cell.non_gaussian_contributions.some(
      (row) =>
        !receiptPass(row.receipt) ||
        (row.diffusion_limit_used && !row.diffusion_limit_validated),
    );
    if (invalidJumpKernel) {
      failures.push(failure(
        "non_gaussian_kernel_not_validated",
        `Cell ${cell.cell_id} has an invalid receipt or an unvalidated diffusion approximation.`,
      ));
    }
    const jumpChi = cell.non_gaussian_contributions.reduce(
      (sum, row) => sum + row.chi,
      0,
    );
    return {
      cell_id: cell.cell_id,
      hold_time_s: cell.hold_time_s,
      gaussian_chi: gaussianChi,
      non_gaussian_chi: jumpChi,
      total_ordinary_chi: gaussianChi + jumpChi,
      ordinary_coherent_phase_rad: phase,
      energy_difference_psd_J2_s: spectralEnergy,
      per_channel_gaussian_chi: forward.channel_ids.map(
        (channelId, index) => ({
          channel_id: channelId,
          chi: perChannelChi[index],
        }),
      ),
      cross_channel_gaussian_chi: gaussianChi - diagonalChi,
      non_gaussian_contribution_rows:
        cell.non_gaussian_contributions.map((row) => ({
          contribution_id: row.contribution_id,
          process: row.process,
          chi: row.chi,
          coherent_phase_rad: row.coherent_phase_rad,
          receipt_source_ref: row.receipt.source_ref,
          receipt_sha256: row.receipt.actual_sha256,
          receipt_gate: receiptPass(row.receipt)
            ? "pass" as const
            : "not_ready" as const,
        })),
    };
  });

  const injectionPredictions = input.injection_checks.map((check) => {
    const frequencyError = Math.abs(
      check.recovered_frequency_rad_s - check.expected_frequency_rad_s,
    );
    const amplitudeError = relativeDifference(
      check.recovered_amplitude,
      check.expected_amplitude,
    );
    const correlationError = Math.abs(
      check.recovered_correlation - check.expected_correlation,
    );
    return {
      injection_id: check.injection_id,
      kind: check.kind,
      frequency_error_rad_s: frequencyError,
      relative_amplitude_error: amplitudeError,
      absolute_correlation_error: correlationError,
      gate:
        frequencyError <= check.maximum_frequency_error_rad_s &&
          amplitudeError <= check.maximum_relative_amplitude_error &&
          correlationError <= check.maximum_absolute_correlation_error
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  for (const kind of ["spectral_line", "correlated_channels"] as const) {
    if (
      !injectionPredictions.some((row) => row.kind === kind) ||
      injectionPredictions.some(
        (row) => row.kind === kind && row.gate !== "pass",
      )
    ) {
      failures.push(failure(
        "nuisance_injection_recovery_failed",
        `A passing ${kind} recovery fixture is required.`,
      ));
    }
  }

  const covariance = input.covariance;
  for (const receipt of [covariance.common_calibration_ancestry_receipt]) {
    if (!receiptPass(receipt)) {
      failures.push(failure(
        "covariance_ancestry_receipt_invalid",
        "Shared calibration ancestry failed receipt integrity.",
      ));
    }
  }
  const jacobianTimesInputCovariance = matrixMultiply(
    covariance.ordinary_jacobian,
    covariance.ordinary_input_covariance,
  );
  let residualCovariance = matrixAdd(
    covariance.measured_coherence_covariance,
    matrixMultiply(
      jacobianTimesInputCovariance,
      matrixTranspose(covariance.ordinary_jacobian),
    ),
  );
  residualCovariance = matrixAdd(
    residualCovariance,
    matrixMultiply(
      covariance.measured_ordinary_cross_covariance,
      matrixTranspose(covariance.ordinary_jacobian),
    ),
    -1,
  );
  residualCovariance = matrixAdd(
    residualCovariance,
    matrixMultiply(
      covariance.ordinary_jacobian,
      covariance.ordinary_measured_cross_covariance,
    ),
    -1,
  );

  const crossTransposeError = relativeMatrixDifference(
    covariance.ordinary_measured_cross_covariance,
    matrixTranspose(covariance.measured_ordinary_cross_covariance),
  );
  if (
    covariance.omitted_cross_covariance ||
    crossTransposeError > covariance.symmetry_relative_tolerance
  ) {
    failures.push(failure(
      "residual_cross_covariance_invalid",
      "Sigma_xy and Sigma_yx must be explicitly supplied transpose pairs.",
    ));
  }

  const regularization = covariance.regularization;
  if (regularization.kind === "diagonal_jitter") {
    if (
      regularization.learned_from !== "pilot" ||
      !regularization.frozen_before_confirmatory ||
      !regularization.coverage_validated ||
      !receiptPass(regularization.receipt)
    ) {
      failures.push(failure(
        "confirmatory_trained_covariance_rescue",
        "Covariance jitter must be pilot-frozen, receipt-bound, and coverage validated.",
      ));
    } else {
      residualCovariance = residualCovariance.map((row, i) =>
        row.map((value, j) =>
          value + (i === j ? regularization.jitter_variance : 0)
        )
      );
    }
  }

  const residualSymmetryError = covarianceSymmetryError(residualCovariance);
  const eigenvalues = realSymmetricEigenvalues(residualCovariance);
  const maximumEigenvalue = Math.max(...eigenvalues);
  const minimumEigenvalue = Math.min(...eigenvalues);
  const rawConditionNumber = minimumEigenvalue > 0
    ? maximumEigenvalue / minimumEigenvalue
    : Number.POSITIVE_INFINITY;
  const conditionNumber = Number.isFinite(rawConditionNumber)
    ? rawConditionNumber
    : null;
  const residualScale = Math.max(
    ...residualCovariance.flat().map((value) => Math.abs(value)),
    Number.MIN_VALUE,
  );
  const covariancePositiveDefinite =
    residualSymmetryError <= covariance.symmetry_relative_tolerance &&
    minimumEigenvalue >
      covariance.positive_definite_relative_tolerance * residualScale;
  const covarianceConditioned =
    covariancePositiveDefinite &&
    conditionNumber != null &&
    conditionNumber <= covariance.maximum_condition_number;
  const whiteningFactor = covarianceConditioned
    ? cholesky(
      residualCovariance,
      covariance.positive_definite_relative_tolerance,
    )
    : null;
  const covarianceGate =
    covarianceConditioned && whiteningFactor != null
      ? "pass" as const
      : "not_identifiable" as const;
  if (covarianceGate !== "pass") {
    failures.push(failure(
      "residual_covariance_not_identifiable",
      "The scored residual covariance must be symmetric, positive definite, Cholesky-factorable, and below the registered condition threshold.",
    ));
  }

  const status = covarianceGate !== "pass"
    ? "not_identifiable" as const
    : failures.length === 0
      ? "pass" as const
      : "blocked" as const;
  return {
    schema_version:
      "casimir_dp_apparatus_response_covariance_stage4_2b_result/1" as const,
    status,
    first_failure: failures[0] ?? null,
    failures,
    spectral_convention: "two_sided_angular_frequency" as const,
    physical_disturbance_separation: {
      gate:
        spectralDiagnostics.every((row) => row.gate === "pass") &&
          physicalSpectra.every((spectrum) => spectrum != null)
          ? "pass" as const
          : "not_ready" as const,
      sensor_self_noise_subtracted: true as const,
      physical_sensor_cross_terms_included:
        forward.cross_covariances_explicit,
      maximum_two_sided_frequency_mismatch_rad_s: maximumFrequencyMismatch,
      maximum_two_sided_spectrum_relative_error:
        maximumTwoSidedSpectrumError,
      diagnostics: spectralDiagnostics,
      spectra: physicalSpectra.map((spectrum, index) => ({
        omega_rad_s: omega[index],
        cross_spectrum: spectrum,
      })),
    },
    cell_predictions: cellPredictions,
    residual_covariance: {
      gate: covarianceGate,
      matrix: residualCovariance,
      symmetry_relative_error: residualSymmetryError,
      cross_transpose_relative_error: crossTransposeError,
      minimum_eigenvalue: minimumEigenvalue,
      maximum_eigenvalue: maximumEigenvalue,
      condition_number: conditionNumber,
      whitening_cholesky_lower: whiteningFactor,
      regularization,
      formula:
        "Sigma_r=Sigma_yy+J Sigma_xx J^T-Sigma_yx J^T-J Sigma_xy" as const,
    },
    channel_ownership_ledger: input.channel_ownership,
    predecessor_reconciliation: input.predecessor_reconciliation,
    nuisance_injection_predictions: injectionPredictions,
    evidence_class: input.evidence_class,
    maximum_claim:
      input.evidence_class === "synthetic_fixture"
        ? "synthetic_response_and_covariance_validation_only" as const
        : status === "pass"
          ? "apparatus_response_and_covariance_characterization" as const
          : "not_ready" as const,
    measured_evidence: "not_ready" as const,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    physical_viability: "not_evaluated" as const,
  };
}
