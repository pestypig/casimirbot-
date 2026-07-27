// math-stage: diagnostic
import { z } from "zod";
import { C, PI } from "./physics-const";
import {
  BOLTZMANN_J_K,
  PLANCK_J_S,
} from "./casimir-dp-radiative-thermal-closure";

export const CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_INPUT_VERSION =
  "casimir_dp_apparatus_spectral_thermometry_stage4_2b_input/1" as const;

export const CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_RESULT_VERSION =
  "casimir_dp_apparatus_spectral_thermometry_stage4_2b_result/1" as const;

export const CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_FAILURE_ORDER = [
  "SPB_FORBIDDEN_SOLAR_INPUT",
  "SPB_CONFIRMATORY_PARTITION_FORBIDDEN",
  "SPB_SPECTRAL_FREEZE_INVALID",
  "SPB_ARTIFACT_INTEGRITY_INVALID",
  "SPB_COVARIANCE_INVALID",
  "SPB_NONBLACKBODY_RESPONSE_MISSING",
  "SPB_THERMAL_STATE_MODEL_INVALID",
  "SPB_TEMPERATURE_BAND_INCOMPLETE",
  "SPB_SIGNAL_BACKGROUND_INSUFFICIENT",
  "SPB_TEMPERATURE_NOT_IDENTIFIABLE",
  "SPB_BOUNDARY_RESPONSE_INVALID",
  "SPB_CHANNEL_OWNERSHIP_INVALID",
  "SPB_JUMP_KERNEL_INVALID",
  "SPB_DIFFUSION_LIMIT_INVALID",
  "SPB_BLACKBODY_RECOVERY_FAILED",
] as const;

export type CasimirDpApparatusSpectralThermometryStage4_2BFailureCode =
  typeof CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_FAILURE_ORDER[number];

const SHA256 = /^[a-f0-9]{64}$/;
const NonEmpty = z.string().min(1);
const Finite = z.number().finite();
const PositiveFinite = Finite.positive();
const NonnegativeFinite = Finite.nonnegative();

const HashedReceipt = z.object({
  receipt_id: NonEmpty,
  artifact_path: NonEmpty,
  evidence_class: z.enum([
    "measured",
    "literature_anchored",
    "synthetic_fixture",
  ]),
  expected_sha256: z.string().regex(SHA256),
  actual_sha256: z.string().regex(SHA256),
  integrity_verified: z.boolean(),
}).strict();

const ThermalTarget = z.object({
  target_id: NonEmpty,
  target_kind: z.enum(["particle_internal", "boundary_surface"]),
  spectrum_receipt: HashedReceipt,
  detector_response_receipt: HashedReceipt,
  spectral_covariance_receipt: HashedReceipt,
  material_response_receipt: HashedReceipt,
  geometry_receipt: HashedReceipt,
  field_response_receipt: HashedReceipt,
  wavelength_m: z.array(PositiveFinite).min(4),
  source_bin_width_m: z.array(PositiveFinite).min(4),
  source_bin_mask: z.array(z.boolean()).min(4),
  detector_power_W: z.array(Finite).min(4),
  detector_bin_mask: z.array(z.boolean()).min(4),
  detector_response_matrix: z.array(
    z.array(Finite).min(4),
  ).min(4),
  spectral_covariance_W2: z.array(
    z.array(Finite).min(4),
  ).min(4),
  source_reflected_power_W: z.array(NonnegativeFinite).min(4),
  source_stray_power_W: z.array(NonnegativeFinite).min(4),
  detector_background_W: z.array(Finite).min(4),
  collection_solid_angle_sr: PositiveFinite,
  emission_area_response_m2: z.array(PositiveFinite).min(4),
  absorption_cross_section_m2: z.array(NonnegativeFinite).min(4),
  scattering_cross_section_m2: z.array(NonnegativeFinite).min(4),
  wavelength_calibration: z.object({
    frozen: z.boolean(),
    coverage_frozen: z.boolean(),
    masks_frozen: z.boolean(),
    response_frozen: z.boolean(),
    line_spread_function_included: z.boolean(),
    throughput_included: z.boolean(),
    polarization_response_included: z.boolean(),
    gain_drift_model_included: z.boolean(),
  }).strict(),
  material_response: z.object({
    model_kind: z.enum([
      "complex_permittivity_mie",
      "tabulated_absorption_cross_section",
      "finite_geometry_emissivity",
      "ideal_blackbody",
    ]),
    non_blackbody_response_present: z.boolean(),
    complex_response_or_cross_section_uncertainty_included:
      z.boolean(),
  }).strict(),
  thermal_state_model: z.object({
    model_kind: z.enum([
      "local_thermal_equilibrium",
      "registered_non_equilibrium",
      "unregistered",
    ]),
    valid_over_fit_window: z.boolean(),
    model_receipt: HashedReceipt.nullable(),
  }).strict(),
  field_response: z.object({
    regime: z.enum(["near_boundary", "free_space_recovery"]),
    model_kind: z.enum([
      "boundary_inclusive_dyadic_green_fdt",
      "finite_geometry_boundary_response",
      "free_space_mie",
      "scalar_blackbody",
    ]),
    boundary_included: z.boolean(),
    free_space_recovery_demonstrated: z.boolean(),
    free_space_recovery_relative_error: NonnegativeFinite.nullable(),
    free_space_recovery_tolerance: NonnegativeFinite,
  }).strict(),
  fit_contract: z.object({
    minimum_temperature_K: PositiveFinite,
    maximum_temperature_K: PositiveFinite,
    temperature_grid_steps: z.number().int().min(5),
    required_planck_x_interval: z.tuple([
      PositiveFinite,
      PositiveFinite,
    ]),
    minimum_signal_to_background: NonnegativeFinite,
    minimum_fisher_information_per_K2: PositiveFinite,
  }).strict(),
}).strict().superRefine((target, context) => {
  const sourceLength = target.wavelength_m.length;
  const detectorLength = target.detector_power_W.length;
  const sourceVectors = [
    target.source_bin_width_m,
    target.source_bin_mask,
    target.source_reflected_power_W,
    target.source_stray_power_W,
    target.emission_area_response_m2,
    target.absorption_cross_section_m2,
    target.scattering_cross_section_m2,
  ];
  if (sourceVectors.some((vector) => vector.length !== sourceLength)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["wavelength_m"],
      message: "Every source-domain vector must match the wavelength grid.",
    });
  }
  if (
    target.detector_bin_mask.length !== detectorLength ||
    target.detector_background_W.length !== detectorLength ||
    target.detector_response_matrix.length !== detectorLength ||
    target.detector_response_matrix.some(
      (row) => row.length !== sourceLength,
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["detector_response_matrix"],
      message: "Detector vectors and response rows must have consistent dimensions.",
    });
  }
  if (
    target.spectral_covariance_W2.length !== detectorLength ||
    target.spectral_covariance_W2.some(
      (row) => row.length !== detectorLength,
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["spectral_covariance_W2"],
      message: "Spectral covariance must be square in detector-bin order.",
    });
  }
  for (let index = 1; index < sourceLength; index += 1) {
    if (target.wavelength_m[index] <= target.wavelength_m[index - 1]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wavelength_m", index],
        message: "Wavelengths must be strictly increasing.",
      });
    }
  }
  if (
    target.fit_contract.maximum_temperature_K <=
      target.fit_contract.minimum_temperature_K
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fit_contract", "maximum_temperature_K"],
      message: "Maximum fit temperature must exceed the minimum.",
    });
  }
  if (
    target.fit_contract.required_planck_x_interval[1] <=
      target.fit_contract.required_planck_x_interval[0]
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fit_contract", "required_planck_x_interval"],
      message: "The required Planck-x interval must be increasing.",
    });
  }
});

const OwnershipTerm = z.object({
  term_id: NonEmpty,
  owners: z.array(
    z.enum(["far_field", "near_field"]),
  ).min(1).max(2),
  allocation_fractions: z.array(z.number().min(0).max(1)).min(1).max(2),
  treatment: z.enum([
    "exclusive_owner",
    "shared_partitioned",
    "unpartitioned_addition",
  ]),
}).strict();

export const CasimirDpApparatusSpectralThermometryStage4_2BInput =
  z.object({
    schema_version: z.literal(
      CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_INPUT_VERSION,
    ),
    campaign_id: z.literal(
      "casimir-dp-apparatus-spectral-thermometry-stage4-2b-v1",
    ),
    evidence_class: z.enum([
      "synthetic_fixture",
      "design_forecast",
      "measured_calibration",
    ]),
    claim_ceiling: z.literal(
      "response_corrected_apparatus_thermometry_and_thermal_coherence_forecast_only",
    ),
    promotion_allowed: z.literal(false),
    acquisition_partition: z.enum([
      "calibration",
      "pilot",
      "confirmatory",
    ]),
    freeze_contract: z.object({
      frozen_before_confirmatory_acquisition: z.boolean(),
      candidate_exclusions_frozen: z.boolean(),
      temperature_fit_code_sha256: z.string().regex(SHA256),
      row_order_sha256: z.string().regex(SHA256),
    }).strict(),
    targets: z.array(ThermalTarget).min(2),
    ownership_ledger: z.object({
      unified_model_id: NonEmpty,
      far_field_registered: z.boolean(),
      near_field_registered: z.boolean(),
      terms: z.array(OwnershipTerm).min(2),
    }).strict(),
    kinetics: z.object({
      particle_target_id: NonEmpty,
      boundary_target_id: NonEmpty,
      branch_separation_m: NonnegativeFinite,
      hold_times_s: z.array(NonnegativeFinite).min(1),
      boundary_to_particle_solid_angle_sr:
        z.number().min(0).max(4 * PI),
      environment_incident_photon_flux_per_m2_s_m:
        z.array(NonnegativeFinite).min(4),
      emission_kernel: z.enum([
        "jump_localization",
        "gaussian_spectral_dephasing",
      ]),
      absorption_kernel: z.enum([
        "jump_localization",
        "gaussian_spectral_dephasing",
      ]),
      scattering_kernel: z.enum([
        "jump_localization",
        "gaussian_spectral_dephasing",
      ]),
      gaussian_diffusion_requested: z.boolean(),
      diffusion_limit_validation: z.object({
        status: z.enum(["not_requested", "validated", "not_validated"]),
        maximum_relative_error: NonnegativeFinite.nullable(),
        tolerance: NonnegativeFinite,
        pilot_only: z.boolean(),
      }).strict(),
    }).strict(),
    tolerances: z.object({
      covariance_symmetry_relative: NonnegativeFinite,
      covariance_psd_relative: NonnegativeFinite,
      ownership_fraction_absolute: NonnegativeFinite,
      blackbody_recovery_relative: NonnegativeFinite,
    }).strict(),
  }).strict().superRefine((input, context) => {
    const targetIds = input.targets.map((target) => target.target_id);
    if (new Set(targetIds).size !== targetIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targets"],
        message: "Thermometry target ids must be unique.",
      });
    }
    const particleTargets = input.targets.filter(
      (target) => target.target_kind === "particle_internal",
    );
    const boundaryTargets = input.targets.filter(
      (target) => target.target_kind === "boundary_surface",
    );
    if (
      particleTargets.length !== 1 ||
      boundaryTargets.length !== 1 ||
      particleTargets[0]?.target_id !== input.kinetics.particle_target_id ||
      boundaryTargets[0]?.target_id !== input.kinetics.boundary_target_id
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kinetics"],
        message: "Exactly one particle and one boundary target must match the kinetic target ids.",
      });
    }
    if (
      particleTargets[0] !== undefined &&
      input.kinetics.environment_incident_photon_flux_per_m2_s_m.length !==
        particleTargets[0].wavelength_m.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          "kinetics",
          "environment_incident_photon_flux_per_m2_s_m",
        ],
        message: "Environmental photon flux must use the particle wavelength grid.",
      });
    }
  });

export type CasimirDpApparatusSpectralThermometryStage4_2BInput =
  z.infer<
    typeof CasimirDpApparatusSpectralThermometryStage4_2BInput
  >;

type Failure = {
  code: CasimirDpApparatusSpectralThermometryStage4_2BFailureCode;
  path: string;
  message: string;
};

type TargetValue = z.infer<typeof ThermalTarget>;
type ReceiptValue = z.infer<typeof HashedReceipt>;

function findForbiddenSolarField(
  value: unknown,
  path: string[] = [],
): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenSolarField(value[index], [
        ...path,
        String(index),
      ]);
      if (found !== null) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const childPath = [...path, key];
    if (/(?:solar|sun|photosphere|tsis)/iu.test(key)) {
      return childPath.join(".");
    }
    const found = findForbiddenSolarField(child, childPath);
    if (found !== null) return found;
  }
  return null;
}

function addFailure(
  failures: Failure[],
  condition: boolean,
  code: CasimirDpApparatusSpectralThermometryStage4_2BFailureCode,
  path: string,
  message: string,
): void {
  if (condition) failures.push({ code, path, message });
}

function sortFailures(failures: Failure[]): Failure[] {
  const order = new Map(
    CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_FAILURE_ORDER.map(
      (code, index) => [code, index],
    ),
  );
  return [...failures].sort((left, right) => {
    const difference =
      (order.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.code) ?? Number.MAX_SAFE_INTEGER);
    return difference === 0
      ? left.path.localeCompare(right.path)
      : difference;
  });
}

function receiptPass(receipt: ReceiptValue): boolean {
  return receipt.integrity_verified &&
    receipt.expected_sha256 === receipt.actual_sha256;
}

function planckRadianceLambda(
  wavelengthM: number,
  temperatureK: number,
): number {
  if (temperatureK <= 0) return 0;
  const exponent =
    PLANCK_J_S * C /
    (wavelengthM * BOLTZMANN_J_K * temperatureK);
  if (exponent > 700) return 0;
  return 2 * PLANCK_J_S * C ** 2 /
    wavelengthM ** 5 /
    Math.expm1(exponent);
}

function matVec(matrix: readonly number[][], vector: readonly number[]) {
  return matrix.map((row) =>
    row.reduce((sum, value, index) => sum + value * vector[index], 0)
  );
}

function normalizedSymmetricEigenvalues(matrix: readonly number[][]) {
  const dimension = matrix.length;
  const scale = Math.max(
    0,
    ...matrix.flatMap((row) => row.map((value) => Math.abs(value))),
  );
  if (scale === 0) return new Array<number>(dimension).fill(0);
  const work = matrix.map((row, rowIndex) =>
    row.map(
      (value, columnIndex) =>
        (value + matrix[columnIndex][rowIndex]) / (2 * scale),
    )
  );
  const maximumIterations = Math.max(32, dimension ** 2 * 16);
  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    let pivotRow = 0;
    let pivotColumn = 0;
    let largest = 0;
    for (let row = 0; row < dimension; row += 1) {
      for (let column = row + 1; column < dimension; column += 1) {
        const magnitude = Math.abs(work[row][column]);
        if (magnitude > largest) {
          largest = magnitude;
          pivotRow = row;
          pivotColumn = column;
        }
      }
    }
    if (largest <= Number.EPSILON * 32) break;
    const app = work[pivotRow][pivotRow];
    const aqq = work[pivotColumn][pivotColumn];
    const apq = work[pivotRow][pivotColumn];
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let index = 0; index < dimension; index += 1) {
      if (index === pivotRow || index === pivotColumn) continue;
      const aip = work[index][pivotRow];
      const aiq = work[index][pivotColumn];
      const rotatedP = cosine * aip - sine * aiq;
      const rotatedQ = sine * aip + cosine * aiq;
      work[index][pivotRow] = rotatedP;
      work[pivotRow][index] = rotatedP;
      work[index][pivotColumn] = rotatedQ;
      work[pivotColumn][index] = rotatedQ;
    }
    work[pivotRow][pivotRow] =
      cosine ** 2 * app -
      2 * sine * cosine * apq +
      sine ** 2 * aqq;
    work[pivotColumn][pivotColumn] =
      sine ** 2 * app +
      2 * sine * cosine * apq +
      cosine ** 2 * aqq;
    work[pivotRow][pivotColumn] = 0;
    work[pivotColumn][pivotRow] = 0;
  }
  return work.map((row, index) => row[index]);
}

function covarianceDiagnostics(
  matrix: readonly number[][],
  symmetryTolerance: number,
  psdTolerance: number,
) {
  const scale = Math.max(
    0,
    ...matrix.flatMap((row) => row.map((value) => Math.abs(value))),
  );
  const normalizationScale = scale === 0 ? 1 : scale;
  let maximumSymmetryRelativeError = 0;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = row + 1; column < matrix.length; column += 1) {
      maximumSymmetryRelativeError = Math.max(
        maximumSymmetryRelativeError,
        Math.abs(matrix[row][column] - matrix[column][row]) /
          normalizationScale,
      );
    }
  }
  const eigenvalues = normalizedSymmetricEigenvalues(matrix);
  const minimumNormalizedEigenvalue = Math.min(...eigenvalues);
  const finite = matrix.every((row) => row.every(Number.isFinite));
  const symmetric =
    finite && maximumSymmetryRelativeError <= symmetryTolerance;
  const positiveSemidefinite =
    symmetric &&
    Number.isFinite(minimumNormalizedEigenvalue) &&
    minimumNormalizedEigenvalue >= -psdTolerance;
  return {
    normalization_scale_W2: normalizationScale,
    maximum_symmetry_relative_error: maximumSymmetryRelativeError,
    minimum_normalized_eigenvalue: minimumNormalizedEigenvalue,
    symmetry_tolerance: symmetryTolerance,
    psd_tolerance: psdTolerance,
    finite_gate: finite ? "pass" as const : "not_ready" as const,
    symmetry_gate: symmetric ? "pass" as const : "not_ready" as const,
    positive_semidefinite_gate:
      positiveSemidefinite ? "pass" as const : "not_ready" as const,
    pass: finite && symmetric && positiveSemidefinite,
  };
}

function cholesky(matrix: readonly number[][]): number[][] | null {
  const dimension = matrix.length;
  const lower = Array.from(
    { length: dimension },
    () => new Array<number>(dimension).fill(0),
  );
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let residual = matrix[row][column];
      for (let index = 0; index < column; index += 1) {
        residual -= lower[row][index] * lower[column][index];
      }
      if (row === column) {
        if (!(residual > 0) || !Number.isFinite(residual)) return null;
        lower[row][column] = Math.sqrt(residual);
      } else {
        lower[row][column] = residual / lower[column][column];
      }
    }
  }
  return lower;
}

function solveCholesky(lower: readonly number[][], vector: readonly number[]) {
  const dimension = lower.length;
  const forward = new Array<number>(dimension).fill(0);
  for (let row = 0; row < dimension; row += 1) {
    let residual = vector[row];
    for (let column = 0; column < row; column += 1) {
      residual -= lower[row][column] * forward[column];
    }
    forward[row] = residual / lower[row][row];
  }
  const solution = new Array<number>(dimension).fill(0);
  for (let row = dimension - 1; row >= 0; row -= 1) {
    let residual = forward[row];
    for (let column = row + 1; column < dimension; column += 1) {
      residual -= lower[column][row] * solution[column];
    }
    solution[row] = residual / lower[row][row];
  }
  return solution;
}

function quadraticWithInverse(
  lower: readonly number[][],
  vector: readonly number[],
): number {
  const solved = solveCholesky(lower, vector);
  return vector.reduce(
    (sum, value, index) => sum + value * solved[index],
    0,
  );
}

function activeSubmatrix(
  matrix: readonly number[][],
  indices: readonly number[],
) {
  return indices.map((row) =>
    indices.map((column) => matrix[row][column])
  );
}

function modelComponents(target: TargetValue, temperatureK: number) {
  const thermalSource = target.wavelength_m.map(
    (wavelength, index) =>
      target.source_bin_mask[index]
        ? target.collection_solid_angle_sr *
          target.emission_area_response_m2[index] *
          planckRadianceLambda(wavelength, temperatureK) *
          target.source_bin_width_m[index]
        : 0,
  );
  const sourceTotal = thermalSource.map(
    (value, index) =>
      target.source_bin_mask[index]
        ? value +
          target.source_reflected_power_W[index] +
          target.source_stray_power_W[index]
        : 0,
  );
  const detectorThermal = matVec(
    target.detector_response_matrix,
    thermalSource,
  );
  const detectorModel = matVec(
    target.detector_response_matrix,
    sourceTotal,
  ).map(
    (value, index) => value + target.detector_background_W[index],
  );
  const detectorBackground = detectorModel.map(
    (value, index) => value - detectorThermal[index],
  );
  return {
    thermal_source_W: thermalSource,
    detector_thermal_W: detectorThermal,
    detector_background_W: detectorBackground,
    detector_model_W: detectorModel,
  };
}

function fitTarget(
  target: TargetValue,
  covarianceSymmetryTolerance: number,
  covariancePsdTolerance: number,
) {
  const covariance = covarianceDiagnostics(
    target.spectral_covariance_W2,
    covarianceSymmetryTolerance,
    covariancePsdTolerance,
  );
  const activeDetectorIndices = target.detector_bin_mask.flatMap(
    (active, index) => active ? [index] : [],
  );
  const activeSourceIndices = target.source_bin_mask.flatMap(
    (active, index) => active ? [index] : [],
  );
  const activeCovariance = activeSubmatrix(
    target.spectral_covariance_W2,
    activeDetectorIndices,
  );
  const lower =
    activeDetectorIndices.length > 0 && covariance.pass
      ? cholesky(activeCovariance)
      : null;
  const measured = activeDetectorIndices.map(
    (index) => target.detector_power_W[index],
  );
  const fit = target.fit_contract;
  const grid = Array.from(
    { length: fit.temperature_grid_steps },
    (_, index) =>
      fit.minimum_temperature_K +
      (
        fit.maximum_temperature_K -
        fit.minimum_temperature_K
      ) * index / (fit.temperature_grid_steps - 1),
  );
  const scoreAt = (temperature: number) => {
    if (lower === null) return Number.POSITIVE_INFINITY;
    const model = modelComponents(target, temperature);
    const residual = activeDetectorIndices.map(
      (detectorIndex, index) =>
        measured[index] - model.detector_model_W[detectorIndex],
    );
    return quadraticWithInverse(lower, residual);
  };
  const scored = grid.map((temperature) => ({
    temperature,
    score: scoreAt(temperature),
  }));
  let best = scored.reduce(
    (current, candidate) =>
      candidate.score < current.score ? candidate : current,
    scored[0],
  );
  const bestIndex = scored.indexOf(best);
  if (lower !== null && Number.isFinite(best.score)) {
    let left = grid[Math.max(0, bestIndex - 1)];
    let right = grid[Math.min(grid.length - 1, bestIndex + 1)];
    const golden = (Math.sqrt(5) - 1) / 2;
    let c = right - golden * (right - left);
    let d = left + golden * (right - left);
    let fc = scoreAt(c);
    let fd = scoreAt(d);
    for (let iteration = 0; iteration < 64; iteration += 1) {
      if (fc <= fd) {
        right = d;
        d = c;
        fd = fc;
        c = right - golden * (right - left);
        fc = scoreAt(c);
      } else {
        left = c;
        c = d;
        fc = fd;
        d = left + golden * (right - left);
        fd = scoreAt(d);
      }
    }
    const refinedTemperature = (left + right) / 2;
    const refinedScore = scoreAt(refinedTemperature);
    if (refinedScore < best.score) {
      best = {
        temperature: refinedTemperature,
        score: refinedScore,
      };
    }
  }
  const candidateTemperature = best.temperature;
  const components = modelComponents(target, candidateTemperature);
  const derivativeStep = Math.max(candidateTemperature * 1e-5, 1e-6);
  const lowerTemperature = Math.max(
    fit.minimum_temperature_K,
    candidateTemperature - derivativeStep,
  );
  const upperTemperature = Math.min(
    fit.maximum_temperature_K,
    candidateTemperature + derivativeStep,
  );
  const derivativeDenominator = upperTemperature - lowerTemperature;
  const lowerModel = modelComponents(target, lowerTemperature);
  const upperModel = modelComponents(target, upperTemperature);
  const derivative = activeDetectorIndices.map(
    (index) =>
      derivativeDenominator > 0
        ? (
          upperModel.detector_model_W[index] -
          lowerModel.detector_model_W[index]
        ) / derivativeDenominator
        : 0,
  );
  const fisherInformation =
    lower === null ? 0 : quadraticWithInverse(lower, derivative);
  const temperatureStandardUncertainty =
    fisherInformation > 0 ? 1 / Math.sqrt(fisherInformation) : null;
  const signal = activeDetectorIndices.reduce(
    (sum, index) => sum + Math.abs(components.detector_thermal_W[index]),
    0,
  );
  const background = activeDetectorIndices.reduce(
    (sum, index) =>
      sum + Math.abs(components.detector_background_W[index]),
    0,
  );
  const signalToBackground =
    background === 0 ? null : signal / background;
  const signalBackgroundPass =
    background === 0
      ? signal > 0
      : signalToBackground! >= fit.minimum_signal_to_background;
  const activeX = activeSourceIndices.map(
    (index) =>
      PLANCK_J_S * C /
      (
        target.wavelength_m[index] *
        BOLTZMANN_J_K *
        candidateTemperature
      ),
  );
  const coveredXMin =
    activeX.length > 0 ? Math.min(...activeX) : null;
  const coveredXMax =
    activeX.length > 0 ? Math.max(...activeX) : null;
  const requiredX = fit.required_planck_x_interval;
  const bandPass =
    coveredXMin !== null &&
    coveredXMax !== null &&
    coveredXMin <= requiredX[0] &&
    coveredXMax >= requiredX[1];
  const fisherPass =
    Number.isFinite(fisherInformation) &&
    fisherInformation >= fit.minimum_fisher_information_per_K2;
  const fitAvailable =
    lower !== null &&
    Number.isFinite(best.score) &&
    activeDetectorIndices.length >= 2;
  const identifiable =
    fitAvailable && bandPass && signalBackgroundPass && fisherPass;
  const residual = target.detector_power_W.map(
    (value, index) => value - components.detector_model_W[index],
  );

  return {
    target_id: target.target_id,
    target_kind: target.target_kind,
    active_detector_bin_count: activeDetectorIndices.length,
    active_source_bin_count: activeSourceIndices.length,
    covariance,
    positive_definite_for_fit: lower !== null,
    candidate_temperature_K: candidateTemperature,
    temperature_estimate_K:
      identifiable ? candidateTemperature : null,
    temperature_standard_uncertainty_K:
      identifiable ? temperatureStandardUncertainty : null,
    fit_chi_square:
      Number.isFinite(best.score) ? best.score : null,
    fit_residual_W: residual,
    model_detector_power_W: components.detector_model_W,
    detector_thermal_signal_W: components.detector_thermal_W,
    detector_background_model_W: components.detector_background_W,
    signal_to_background: signalToBackground,
    signal_to_background_status:
      background === 0
        ? "unbounded_zero_background" as const
        : "finite" as const,
    minimum_signal_to_background:
      fit.minimum_signal_to_background,
    fisher_information_per_K2: fisherInformation,
    minimum_fisher_information_per_K2:
      fit.minimum_fisher_information_per_K2,
    planck_x_coverage: {
      covered_minimum: coveredXMin,
      covered_maximum: coveredXMax,
      required_minimum: requiredX[0],
      required_maximum: requiredX[1],
      gate: bandPass ? "pass" as const : "not_ready" as const,
    },
    signal_background_gate:
      signalBackgroundPass ? "pass" as const : "not_ready" as const,
    fisher_identifiability_gate:
      fisherPass && fitAvailable
        ? "pass" as const
        : "not_ready" as const,
    temperature_status:
      identifiable
        ? "identified" as const
        : "temperature_not_identifiable" as const,
  };
}

function stableSinc(value: number): number {
  if (Math.abs(value) < 1e-5) {
    return 1 - value ** 2 / 6 + value ** 4 / 120;
  }
  return Math.sin(value) / value;
}

function thermalRates(args: {
  particle: TargetValue;
  particleTemperatureK: number;
  boundaryTemperatureK: number;
  boundarySolidAngleSr: number;
  environmentFlux: readonly number[];
  branchSeparationM: number;
}) {
  let emissionRate = 0;
  let absorptionRate = 0;
  let scatteringRate = 0;
  let emissionDecoherenceRate = 0;
  let absorptionDecoherenceRate = 0;
  let scatteringDecoherenceRate = 0;
  const rows = args.particle.wavelength_m.map((wavelength, index) => {
    if (!args.particle.source_bin_mask[index]) {
      return {
        wavelength_m: wavelength,
        included: false as const,
        photon_energy_J: PLANCK_J_S * C / wavelength,
        localization_factor: 0,
        emission_rate_s: 0,
        absorption_rate_s: 0,
        scattering_rate_s: 0,
      };
    }
    const binWidth = args.particle.source_bin_width_m[index];
    const photonEnergy = PLANCK_J_S * C / wavelength;
    const particleRadiance = planckRadianceLambda(
      wavelength,
      args.particleTemperatureK,
    );
    const boundaryRadiance = planckRadianceLambda(
      wavelength,
      args.boundaryTemperatureK,
    );
    const emission =
      4 * PI *
      args.particle.absorption_cross_section_m2[index] *
      particleRadiance *
      binWidth / photonEnergy;
    const incidentFlux =
      args.boundarySolidAngleSr *
      boundaryRadiance / photonEnergy +
      args.environmentFlux[index];
    const absorption =
      incidentFlux *
      args.particle.absorption_cross_section_m2[index] *
      binWidth;
    const scattering =
      incidentFlux *
      args.particle.scattering_cross_section_m2[index] *
      binWidth;
    const localization =
      1 -
      stableSinc(
        2 * PI * args.branchSeparationM / wavelength,
      );
    emissionRate += emission;
    absorptionRate += absorption;
    scatteringRate += scattering;
    emissionDecoherenceRate += emission * localization;
    absorptionDecoherenceRate += absorption * localization;
    scatteringDecoherenceRate += scattering * localization;
    return {
      wavelength_m: wavelength,
      included: true as const,
      photon_energy_J: photonEnergy,
      localization_factor: localization,
      emission_rate_s: emission,
      absorption_rate_s: absorption,
      scattering_rate_s: scattering,
    };
  });
  return {
    spectral_rows: rows,
    event_rates_s: {
      emission: emissionRate,
      absorption: absorptionRate,
      scattering: scatteringRate,
      total: emissionRate + absorptionRate + scatteringRate,
    },
    decoherence_rates_s: {
      emission: emissionDecoherenceRate,
      absorption: absorptionDecoherenceRate,
      scattering: scatteringDecoherenceRate,
      total:
        emissionDecoherenceRate +
        absorptionDecoherenceRate +
        scatteringDecoherenceRate,
    },
  };
}

function simpsonIntegral(
  lower: number,
  upper: number,
  intervals: number,
  fn: (value: number) => number,
): number {
  const width = (upper - lower) / intervals;
  let sum = fn(lower) + fn(upper);
  for (let index = 1; index < intervals; index += 1) {
    sum +=
      (index % 2 === 0 ? 2 : 4) *
      fn(lower + index * width);
  }
  return sum * width / 3;
}

/**
 * Fits response-corrected particle and boundary temperatures from
 * calibration/pilot spectra, propagates their full spectral covariance, and
 * maps them into photon jump/localization rates. It never admits a solar
 * temperature or treats an ideal blackbody as the nanoparticle response.
 */
export function evaluateCasimirDpApparatusSpectralThermometryStage4_2B(
  rawInput: unknown,
) {
  const forbiddenSolarPath = findForbiddenSolarField(rawInput);
  if (forbiddenSolarPath !== null) {
    throw new Error(
      `SPB_FORBIDDEN_SOLAR_INPUT:${forbiddenSolarPath}`,
    );
  }
  const input =
    CasimirDpApparatusSpectralThermometryStage4_2BInput.parse(rawInput);
  const failures: Failure[] = [];

  addFailure(
    failures,
    input.acquisition_partition === "confirmatory",
    "SPB_CONFIRMATORY_PARTITION_FORBIDDEN",
    "acquisition_partition",
    "Spectral thermometry parameters may be fitted only from calibration or pilot data before confirmatory acquisition.",
  );

  const targetFreezeRows = input.targets.map((target) => {
    const calibration = target.wavelength_calibration;
    const pass =
      calibration.frozen &&
      calibration.coverage_frozen &&
      calibration.masks_frozen &&
      calibration.response_frozen &&
      calibration.line_spread_function_included &&
      calibration.throughput_included &&
      calibration.polarization_response_included &&
      calibration.gain_drift_model_included;
    return {
      target_id: target.target_id,
      gate: pass ? "pass" as const : "not_ready" as const,
    };
  });
  const freezePass =
    input.freeze_contract.frozen_before_confirmatory_acquisition &&
    input.freeze_contract.candidate_exclusions_frozen &&
    targetFreezeRows.every((row) => row.gate === "pass");
  addFailure(
    failures,
    !freezePass,
    "SPB_SPECTRAL_FREEZE_INVALID",
    "freeze_contract",
    "Wavelength coverage, masks, response, line spread, throughput, polarization response, gain drift, and exclusions must be frozen.",
  );

  const allReceipts = input.targets.flatMap((target) => [
    target.spectrum_receipt,
    target.detector_response_receipt,
    target.spectral_covariance_receipt,
    target.material_response_receipt,
    target.geometry_receipt,
    target.field_response_receipt,
    ...(target.thermal_state_model.model_receipt === null
      ? []
      : [target.thermal_state_model.model_receipt]),
  ]);
  const artifactIntegrityPass = allReceipts.every(receiptPass);
  addFailure(
    failures,
    !artifactIntegrityPass,
    "SPB_ARTIFACT_INTEGRITY_INVALID",
    "targets.receipts",
    "Every spectrum, response, covariance, material, geometry, field, and registered state-model receipt must pass SHA-256 integrity.",
  );

  const targetFits = input.targets.map((target) =>
    fitTarget(
      target,
      input.tolerances.covariance_symmetry_relative,
      input.tolerances.covariance_psd_relative,
    )
  );
  const covariancePass = targetFits.every(
    (fit) => fit.covariance.pass,
  );
  addFailure(
    failures,
    !covariancePass,
    "SPB_COVARIANCE_INVALID",
    "targets.spectral_covariance_W2",
    "Complete spectral covariance must be finite, symmetric, and positive semidefinite.",
  );

  const particle = input.targets.find(
    (target) => target.target_kind === "particle_internal",
  )!;
  const boundary = input.targets.find(
    (target) => target.target_kind === "boundary_surface",
  )!;
  const distinctParticleResponseValues =
    new Set(
      particle.emission_area_response_m2.map(
        (value) => value.toExponential(12),
      ),
    ).size;
  const nonBlackbodyPass =
    particle.material_response.model_kind !== "ideal_blackbody" &&
    particle.material_response.non_blackbody_response_present &&
    particle.material_response
      .complex_response_or_cross_section_uncertainty_included &&
    distinctParticleResponseValues >= 2;
  addFailure(
    failures,
    !nonBlackbodyPass,
    "SPB_NONBLACKBODY_RESPONSE_MISSING",
    "targets.particle_internal.material_response",
    "The nanoparticle requires a spectrally resolved non-blackbody material response with uncertainty.",
  );

  const thermalStateRows = input.targets.map((target) => {
    const state = target.thermal_state_model;
    const pass =
      state.valid_over_fit_window &&
      (
        state.model_kind === "local_thermal_equilibrium" &&
        state.model_receipt === null ||
        state.model_kind === "registered_non_equilibrium" &&
        state.model_receipt !== null &&
        receiptPass(state.model_receipt)
      );
    return {
      target_id: target.target_id,
      model_kind: state.model_kind,
      gate: pass ? "pass" as const : "not_ready" as const,
    };
  });
  addFailure(
    failures,
    thermalStateRows.some((row) => row.gate !== "pass"),
    "SPB_THERMAL_STATE_MODEL_INVALID",
    "targets.thermal_state_model",
    "Each target requires valid local thermal equilibrium or a content-addressed non-equilibrium model over the fit window.",
  );

  addFailure(
    failures,
    targetFits.some(
      (fit) => fit.planck_x_coverage.gate !== "pass",
    ),
    "SPB_TEMPERATURE_BAND_INCOMPLETE",
    "targets.fit_contract.required_planck_x_interval",
    "Unmasked wavelength coverage must span each preregistered temperature-sensitive Planck-x interval.",
  );
  addFailure(
    failures,
    targetFits.some(
      (fit) => fit.signal_background_gate !== "pass",
    ),
    "SPB_SIGNAL_BACKGROUND_INSUFFICIENT",
    "targets.fit_contract.minimum_signal_to_background",
    "The response-propagated thermal signal must clear its frozen signal-to-background threshold.",
  );
  addFailure(
    failures,
    targetFits.some(
      (fit) => fit.fisher_identifiability_gate !== "pass",
    ),
    "SPB_TEMPERATURE_NOT_IDENTIFIABLE",
    "targets.fit_contract.minimum_fisher_information_per_K2",
    "A temperature may be emitted only when the active covariance is invertible and Fisher identifiability passes.",
  );

  const fieldResponseRows = input.targets.map((target) => {
    const field = target.field_response;
    const nearBoundaryPass =
      field.regime !== "near_boundary" ||
      field.boundary_included &&
      (
        field.model_kind ===
          "boundary_inclusive_dyadic_green_fdt" ||
        field.model_kind === "finite_geometry_boundary_response"
      );
    const freeSpacePass =
      field.regime !== "free_space_recovery" ||
      field.model_kind === "free_space_mie" &&
      field.free_space_recovery_demonstrated &&
      field.free_space_recovery_relative_error !== null &&
      field.free_space_recovery_relative_error <=
        field.free_space_recovery_tolerance;
    return {
      target_id: target.target_id,
      regime: field.regime,
      model_kind: field.model_kind,
      gate:
        nearBoundaryPass && freeSpacePass
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  addFailure(
    failures,
    fieldResponseRows.some((row) => row.gate !== "pass"),
    "SPB_BOUNDARY_RESPONSE_INVALID",
    "targets.field_response",
    "Each target requires a boundary-inclusive response or a demonstrated free-space recovery limit.",
  );

  const ownershipIds = input.ownership_ledger.terms.map(
    (term) => term.term_id,
  );
  const ownershipRows = input.ownership_ledger.terms.map((term) => {
    const uniqueOwners =
      new Set(term.owners).size === term.owners.length;
    const dimensionPass =
      term.owners.length === term.allocation_fractions.length;
    const allocationSum = term.allocation_fractions.reduce(
      (sum, value) => sum + value,
      0,
    );
    const treatmentPass =
      term.owners.length === 1
        ? term.treatment === "exclusive_owner" &&
          Math.abs(allocationSum - 1) <=
            input.tolerances.ownership_fraction_absolute
        : term.treatment === "shared_partitioned" &&
          Math.abs(allocationSum - 1) <=
            input.tolerances.ownership_fraction_absolute;
    return {
      ...term,
      allocation_sum: allocationSum,
      gate:
        uniqueOwners && dimensionPass && treatmentPass
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  const ownershipPass =
    input.ownership_ledger.far_field_registered &&
    input.ownership_ledger.near_field_registered &&
    new Set(ownershipIds).size === ownershipIds.length &&
    ownershipRows.every((row) => row.gate === "pass");
  addFailure(
    failures,
    !ownershipPass,
    "SPB_CHANNEL_OWNERSHIP_INVALID",
    "ownership_ledger",
    "Far- and near-field channels must share a unified, term-exclusive or explicitly partitioned ownership ledger.",
  );

  const kinetics = input.kinetics;
  const jumpKernelPass = [
    kinetics.emission_kernel,
    kinetics.absorption_kernel,
    kinetics.scattering_kernel,
  ].every((kernel) => kernel === "jump_localization");
  addFailure(
    failures,
    !jumpKernelPass,
    "SPB_JUMP_KERNEL_INVALID",
    "kinetics",
    "Thermal emission, absorption, and scattering must use their jump/localization kernels.",
  );
  const diffusionPass =
    !kinetics.gaussian_diffusion_requested
      ? kinetics.diffusion_limit_validation.status === "not_requested"
      : kinetics.diffusion_limit_validation.status === "validated" &&
        kinetics.diffusion_limit_validation.pilot_only &&
        kinetics.diffusion_limit_validation.maximum_relative_error !==
          null &&
        kinetics.diffusion_limit_validation.maximum_relative_error <=
          kinetics.diffusion_limit_validation.tolerance;
  addFailure(
    failures,
    !diffusionPass,
    "SPB_DIFFUSION_LIMIT_INVALID",
    "kinetics.diffusion_limit_validation",
    "A Gaussian diffusion representation is admitted only after a pilot-only validated diffusion-limit recovery.",
  );

  const particleFit = targetFits.find(
    (fit) => fit.target_id === kinetics.particle_target_id,
  )!;
  const boundaryFit = targetFits.find(
    (fit) => fit.target_id === kinetics.boundary_target_id,
  )!;
  const temperaturesAvailable =
    particleFit.temperature_estimate_K !== null &&
    boundaryFit.temperature_estimate_K !== null;
  const baseRates = temperaturesAvailable
    ? thermalRates({
      particle,
      particleTemperatureK: particleFit.temperature_estimate_K!,
      boundaryTemperatureK: boundaryFit.temperature_estimate_K!,
      boundarySolidAngleSr:
        kinetics.boundary_to_particle_solid_angle_sr,
      environmentFlux:
        kinetics.environment_incident_photon_flux_per_m2_s_m,
      branchSeparationM: kinetics.branch_separation_m,
    })
    : null;
  const temperatureStep = (temperature: number) =>
    Math.max(temperature * 1e-5, 1e-6);
  const particleStep = temperaturesAvailable
    ? temperatureStep(particleFit.temperature_estimate_K!)
    : null;
  const boundaryStep = temperaturesAvailable
    ? temperatureStep(boundaryFit.temperature_estimate_K!)
    : null;
  const rateFor = (
    particleTemperatureK: number,
    boundaryTemperatureK: number,
  ) =>
    thermalRates({
      particle,
      particleTemperatureK,
      boundaryTemperatureK,
      boundarySolidAngleSr:
        kinetics.boundary_to_particle_solid_angle_sr,
      environmentFlux:
        kinetics.environment_incident_photon_flux_per_m2_s_m,
      branchSeparationM: kinetics.branch_separation_m,
    }).decoherence_rates_s.total;
  const derivativeParticle =
    temperaturesAvailable
      ? (
        rateFor(
          particleFit.temperature_estimate_K! + particleStep!,
          boundaryFit.temperature_estimate_K!,
        ) -
        rateFor(
          Math.max(
            Number.MIN_VALUE,
            particleFit.temperature_estimate_K! - particleStep!,
          ),
          boundaryFit.temperature_estimate_K!,
        )
      ) / (2 * particleStep!)
      : null;
  const derivativeBoundary =
    temperaturesAvailable
      ? (
        rateFor(
          particleFit.temperature_estimate_K!,
          boundaryFit.temperature_estimate_K! + boundaryStep!,
        ) -
        rateFor(
          particleFit.temperature_estimate_K!,
          Math.max(
            Number.MIN_VALUE,
            boundaryFit.temperature_estimate_K! - boundaryStep!,
          ),
        )
      ) / (2 * boundaryStep!)
      : null;

  const planckMoment = simpsonIntegral(
    0,
    40,
    4000,
    (x) => x === 0 ? 0 : x ** 3 / Math.expm1(x),
  );
  const planckMomentAnalytic = PI ** 4 / 15;
  const blackbodyRecoveryRelativeError =
    Math.abs(planckMoment - planckMomentAnalytic) /
    planckMomentAnalytic;
  const blackbodyRecoveryPass =
    blackbodyRecoveryRelativeError <=
    input.tolerances.blackbody_recovery_relative;
  addFailure(
    failures,
    !blackbodyRecoveryPass,
    "SPB_BLACKBODY_RECOVERY_FAILED",
    "tolerances.blackbody_recovery_relative",
    "The ideal Planck-moment recovery diagnostic must pass before the thermal numerical implementation is accepted.",
  );

  const sorted = sortFailures(failures);
  const failureCodes = new Set(sorted.map((failure) => failure.code));
  const gateFor = (
    ...codes: CasimirDpApparatusSpectralThermometryStage4_2BFailureCode[]
  ) => codes.some((code) => failureCodes.has(code))
    ? "not_ready" as const
    : "pass" as const;

  return {
    schema_version:
      CASIMIR_DP_APPARATUS_SPECTRAL_THERMOMETRY_STAGE4_2B_RESULT_VERSION,
    campaign_id: input.campaign_id,
    evidence_class: input.evidence_class,
    claim_ceiling: input.claim_ceiling,
    status:
      sorted.length === 0
        ? "pass" as const
        : "not_ready" as const,
    failures: sorted,
    first_failure_code: sorted[0]?.code ?? null,
    acquisition_partition: input.acquisition_partition,
    freeze_contract: {
      ...input.freeze_contract,
      target_rows: targetFreezeRows,
      gate: freezePass ? "pass" as const : "not_ready" as const,
    },
    target_thermometry: targetFits,
    thermal_state_models: thermalStateRows,
    field_response_models: fieldResponseRows,
    covariance_diagnostics: targetFits.map((fit) => ({
      target_id: fit.target_id,
      ...fit.covariance,
      positive_definite_for_fit: fit.positive_definite_for_fit,
    })),
    blackbody_recovery_diagnostic: {
      role:
        "ideal_limit_numerical_recovery_not_default_apparatus_model" as const,
      numerical_dimensionless_planck_moment: planckMoment,
      analytic_dimensionless_planck_moment: planckMomentAnalytic,
      relative_error: blackbodyRecoveryRelativeError,
      tolerance: input.tolerances.blackbody_recovery_relative,
      gate:
        blackbodyRecoveryPass
          ? "pass" as const
          : "not_ready" as const,
    },
    thermal_jump_localization: baseRates === null
      ? {
        status: "temperature_not_identifiable" as const,
        kernels: {
          emission: kinetics.emission_kernel,
          absorption: kinetics.absorption_kernel,
          scattering: kinetics.scattering_kernel,
        },
        spectral_rows: null,
        event_rates_s: null,
        decoherence_rates_s: null,
        coherence_rows: null,
      }
      : {
        status: "ready" as const,
        kernels: {
          emission: kinetics.emission_kernel,
          absorption: kinetics.absorption_kernel,
          scattering: kinetics.scattering_kernel,
        },
        spectral_rows: baseRates.spectral_rows,
        event_rates_s: baseRates.event_rates_s,
        decoherence_rates_s: baseRates.decoherence_rates_s,
        coherence_rows: kinetics.hold_times_s.map((holdTime) => ({
          hold_time_s: holdTime,
          chi_thermal:
            baseRates.decoherence_rates_s.total * holdTime,
          visibility_factor:
            Math.exp(
              -baseRates.decoherence_rates_s.total * holdTime,
            ),
        })),
      },
    thermal_to_coherence_jacobian: {
      parameter_order: [
        "particle_internal_temperature_K",
        "boundary_surface_temperature_K",
      ] as const,
      rows: temperaturesAvailable
        ? kinetics.hold_times_s.map((holdTime) => ({
          hold_time_s: holdTime,
          d_chi_d_particle_temperature_K:
            derivativeParticle! * holdTime,
          d_chi_d_boundary_temperature_K:
            derivativeBoundary! * holdTime,
        }))
        : null,
      covariance_ancestry_note:
        "Target fit covariances and shared calibration ancestry must be assembled by Runtime C before joint residual scoring." as const,
    },
    ownership_ledger: {
      unified_model_id: input.ownership_ledger.unified_model_id,
      far_field_registered:
        input.ownership_ledger.far_field_registered,
      near_field_registered:
        input.ownership_ledger.near_field_registered,
      terms: ownershipRows,
      physically_exclusive_assumption_used: false as const,
      gate: ownershipPass ? "pass" as const : "not_ready" as const,
    },
    final_gates: {
      calibration_or_pilot_only:
        gateFor("SPB_CONFIRMATORY_PARTITION_FORBIDDEN"),
      spectral_freeze:
        gateFor("SPB_SPECTRAL_FREEZE_INVALID"),
      artifact_integrity:
        gateFor("SPB_ARTIFACT_INTEGRITY_INVALID"),
      covariance_symmetry_and_psd:
        gateFor("SPB_COVARIANCE_INVALID"),
      nonblackbody_particle_response:
        gateFor("SPB_NONBLACKBODY_RESPONSE_MISSING"),
      thermal_state_validity:
        gateFor("SPB_THERMAL_STATE_MODEL_INVALID"),
      temperature_sensitive_coverage:
        gateFor("SPB_TEMPERATURE_BAND_INCOMPLETE"),
      signal_and_identifiability:
        gateFor(
          "SPB_SIGNAL_BACKGROUND_INSUFFICIENT",
          "SPB_TEMPERATURE_NOT_IDENTIFIABLE",
        ),
      boundary_or_free_space_response:
        gateFor("SPB_BOUNDARY_RESPONSE_INVALID"),
      unified_channel_ownership:
        gateFor("SPB_CHANNEL_OWNERSHIP_INVALID"),
      jump_localization_kernels:
        gateFor("SPB_JUMP_KERNEL_INVALID"),
      diffusion_limit:
        gateFor("SPB_DIFFUSION_LIMIT_INVALID"),
      ideal_blackbody_recovery:
        gateFor("SPB_BLACKBODY_RECOVERY_FAILED"),
      measured_evidence: "not_ready" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      physical_viability: "not_evaluated" as const,
      publication_claim:
        "response_corrected_apparatus_thermometry_and_thermal_coherence_forecast_only" as const,
    },
    promotion_allowed: false as const,
    observable_bridge_edges_added: 0 as const,
    no_solar_apparatus_input: true as const,
  };
}

export type CasimirDpApparatusSpectralThermometryStage4_2BResult =
  ReturnType<
    typeof evaluateCasimirDpApparatusSpectralThermometryStage4_2B
  >;
