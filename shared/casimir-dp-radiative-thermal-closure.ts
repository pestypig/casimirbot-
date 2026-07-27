// math-stage: exploratory
import { z } from "zod";
import { C, HBAR, PI } from "./physics-const";

const SHA256 = /^[a-f0-9]{64}$/;
const EvidenceClass = z.enum([
  "measured",
  "literature_anchored",
  "synthetic_fixture",
]);

/**
 * Boltzmann's constant is exact in the 2019 SI.  Planck's constant is derived
 * from the repository's canonical reduced Planck constant so h/ħ cannot drift
 * between the frequency and angular-frequency lanes.
 */
export const BOLTZMANN_J_K = 1.380_649e-23;
export const PLANCK_J_S = 2 * PI * HBAR;
/**
 * Scale-relative tolerance used only to judge supplied near-field covariance
 * symmetry and positive semidefiniteness.  The covariance is normalized by its
 * largest absolute entry before the eigensystem check, so this is dimensionless
 * and does not silently impose an absolute floor on small covariances.
 */
export const NEAR_FIELD_COVARIANCE_RELATIVE_TOLERANCE = 1e-12;

const Vector3 = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);

const Matrix4 = z.tuple([
  z.tuple([
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
  ]),
  z.tuple([
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
  ]),
  z.tuple([
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
  ]),
  z.tuple([
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
    z.number().finite(),
  ]),
]);

const HashedReceipt = z.object({
  source_ref: z.string().min(1),
  evidence_class: EvidenceClass,
  expected_sha256: z.string().regex(SHA256),
  actual_sha256: z.string().regex(SHA256),
  integrity_verified: z.boolean(),
});

const SpectralCheckpoint = z.object({
  checkpoint_id: z.string().min(1),
  nu_Hz: z.number().positive().finite(),
  omega_rad_s: z.number().positive().finite(),
  temperature_K: z.number().nonnegative().finite(),
});

const NearFieldFdtInput = z.object({
  source_ref: z.string().min(1),
  receipt: HashedReceipt,
  green_tensor_ref: z.string().min(1),
  spectrum_convention: z.literal("two_sided_angular_frequency"),
  material_loss_included: z.boolean(),
  temperature_included: z.boolean(),
  geometry_included: z.boolean(),
  zero_point_separated_from_thermal_transfer: z.boolean(),
  net_thermal_power_W: z.number().finite(),
  gross_thermal_power_W: z.number().nonnegative().finite(),
  energy_transfer_variance_rate_J2_s: z.number().nonnegative().finite(),
  recoil_force_N: Vector3,
  occupation_heating_rate_s: z.number().nonnegative().finite(),
  decoherence_rate_s: z.number().nonnegative().finite(),
  accumulated_covariance: Matrix4,
});

export const CasimirDpRadiativeThermalClosureInput = z.object({
  schema_version: z.literal("casimir_dp_radiative_thermal_closure/1"),
  evidence_class: EvidenceClass,
  model_binding_sha256: z.string().regex(SHA256),
  authority_receipt: HashedReceipt,
  frequency_convention: z.object({
    canonical_internal_variable: z.literal("omega_rad_s"),
    conversion_relative_tolerance: z.number().nonnegative().finite(),
    spectral_checkpoints: z.array(SpectralCheckpoint).min(1),
  }),
  integration: z.object({
    dimensionless_x_max: z.number().positive().finite(),
    simpson_intervals: z.number().int().positive().finite(),
    stefan_boltzmann_relative_tolerance: z.number().nonnegative().finite(),
  }),
  reservoirs: z.object({
    source_temperature_K: z.number().nonnegative().finite(),
    environment_temperature_K: z.number().nonnegative().finite(),
    source_emissivity: z.number().min(0).max(1),
    environment_emissivity: z.number().min(0).max(1),
    radiating_area_m2: z.number().positive().finite(),
    view_factor: z.number().min(0).max(1),
    material_receipt: HashedReceipt,
  }),
  geometry: z.object({
    transfer_regime: z.enum(["far_field", "near_field"]),
    separation_m: z.number().positive().finite(),
    minimum_far_field_thermal_wavelength_ratio: z.number().positive().finite(),
    geometry_receipt: HashedReceipt,
  }),
  near_field_fdt: NearFieldFdtInput.nullable(),
  probe: z.object({
    interaction_time_s: z.number().positive().finite(),
    branch_separation_m: z.number().nonnegative().finite(),
    oscillator_omega_rad_s: z.number().positive().finite(),
    heating_absorption_fraction: z.number().min(0).max(1),
    decoherence_coupling_efficiency: z.number().min(0).max(1),
    recoil_anisotropy: z.number().min(0).max(1),
    recoil_direction: Vector3,
  }),
  solar_benchmark: z.object({
    luminosity_W: z.number().positive().finite(),
    radius_m: z.number().positive().finite(),
    reference_effective_temperature_K: z.number().positive().finite(),
    absolute_tolerance_K: z.number().nonnegative().finite(),
    receipt: HashedReceipt,
  }),
  gates: z.object({
    detailed_balance_absolute_tolerance_W: z.number().nonnegative().finite(),
    recoil_direction_norm_tolerance: z.number().nonnegative().finite(),
  }),
  accounting: z.object({
    zero_point_in_net_thermal_power: z.boolean(),
    thermal_channel_already_counted_in_parent_qed: z.boolean(),
    combine_far_field_and_near_field_outputs: z.boolean(),
  }),
}).superRefine((input, context) => {
  if (input.integration.simpson_intervals % 2 !== 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["integration", "simpson_intervals"],
      message: "Composite Simpson integration requires an even interval count.",
    });
  }

  if (
    input.geometry.transfer_regime === "near_field" &&
    input.near_field_fdt === null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["near_field_fdt"],
      message: "Near-field transfer requires a Green/FDT input receipt.",
    });
  }
  if (
    input.geometry.transfer_regime === "far_field" &&
    input.near_field_fdt !== null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["near_field_fdt"],
      message:
        "Far-field Stefan-Boltzmann output and near-field Green/FDT output must not be combined.",
    });
  }

  const accounting = input.accounting;
  if (
    accounting.zero_point_in_net_thermal_power ||
    accounting.thermal_channel_already_counted_in_parent_qed ||
    accounting.combine_far_field_and_near_field_outputs
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["accounting"],
      message:
        "Thermal closure is fail-closed against zero-point or cross-runtime double counting.",
    });
  }
});

export type CasimirDpRadiativeThermalClosureInput = z.infer<
  typeof CasimirDpRadiativeThermalClosureInput
>;

type Receipt = z.infer<typeof HashedReceipt>;
type Vector3Value = z.infer<typeof Vector3>;
type Matrix4Value = z.infer<typeof Matrix4>;

function receiptPass(receipt: Receipt): boolean {
  return receipt.integrity_verified &&
    receipt.expected_sha256 === receipt.actual_sha256;
}

function relativeDifference(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function hasOnlyFiniteNumbers(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(hasOnlyFiniteNumbers);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(hasOnlyFiniteNumbers);
  }
  return true;
}

function simpsonIntegral(
  lower: number,
  upper: number,
  intervals: number,
  integrand: (x: number) => number,
): number {
  const width = (upper - lower) / intervals;
  let sum = integrand(lower) + integrand(upper);
  for (let index = 1; index < intervals; index += 1) {
    sum += (index % 2 === 0 ? 2 : 4) * integrand(lower + index * width);
  }
  return sum * width / 3;
}

function occupationFromOmega(omegaRadS: number, temperatureK: number): number {
  if (temperatureK === 0) return 0;
  const ratio = HBAR * omegaRadS / (BOLTZMANN_J_K * temperatureK);
  if (ratio > 700) return 0;
  return 1 / Math.expm1(ratio);
}

function boseOccupationFromX(x: number): number {
  if (x === 0) return Number.POSITIVE_INFINITY;
  if (x > 700) return 0;
  return 1 / Math.expm1(x);
}

function planckMomentIntegrand(x: number): number {
  if (x === 0) return 0;
  return x ** 3 * boseOccupationFromX(x);
}

function photonMomentIntegrand(x: number): number {
  if (x === 0) return 0;
  return x ** 2 * boseOccupationFromX(x);
}

function energyNoiseMomentIntegrand(x: number): number {
  if (x === 0) return 0;
  const occupation = boseOccupationFromX(x);
  return x ** 4 * occupation * (1 + occupation);
}

function sinc(value: number): number {
  if (Math.abs(value) < 1e-6) {
    return 1 - value ** 2 / 6 + value ** 4 / 120;
  }
  return Math.sin(value) / value;
}

function effectiveGreyEmissivity(source: number, environment: number): number {
  if (source === 0 || environment === 0) return 0;
  return 1 / (1 / source + 1 / environment - 1);
}

function normalizedDirection(
  direction: Vector3Value,
): { norm: number; unit: Vector3Value } {
  const norm = Math.hypot(...direction);
  if (norm === 0) return { norm, unit: [0, 0, 0] };
  return {
    norm,
    unit: direction.map((value) => value / norm) as Vector3Value,
  };
}

function outerProduct(
  vector: Vector3Value,
  scale: number,
): [
  [number, number, number],
  [number, number, number],
  [number, number, number],
] {
  return vector.map((rowValue) =>
    vector.map((columnValue) => rowValue * columnValue * scale)
  ) as [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
}

function normalizedSymmetricEigenvalues4(matrix: Matrix4Value): number[] {
  const scale = Math.max(
    ...matrix.flatMap((row) => row.map((value) => Math.abs(value))),
  );
  if (scale === 0) return [0, 0, 0, 0];

  // Jacobi rotations operate on the symmetrized, scale-normalized matrix.
  // Symmetry itself is checked separately and must pass before the PSD result
  // can pass.
  const work = matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      (value + matrix[columnIndex][rowIndex]) / (2 * scale)
    )
  );

  for (let iteration = 0; iteration < 64; iteration += 1) {
    let pivotRow = 0;
    let pivotColumn = 1;
    let maximumOffDiagonal = 0;
    for (let row = 0; row < 4; row += 1) {
      for (let column = row + 1; column < 4; column += 1) {
        const magnitude = Math.abs(work[row][column]);
        if (magnitude > maximumOffDiagonal) {
          maximumOffDiagonal = magnitude;
          pivotRow = row;
          pivotColumn = column;
        }
      }
    }
    if (maximumOffDiagonal <= Number.EPSILON * 16) break;

    const app = work[pivotRow][pivotRow];
    const aqq = work[pivotColumn][pivotColumn];
    const apq = work[pivotRow][pivotColumn];
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);

    for (let index = 0; index < 4; index += 1) {
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

function inspectNearFieldCovariance(matrix: Matrix4Value) {
  const dimension = matrix.length;
  const rowLengths = matrix.map((row) => row.length);
  const square = dimension === 4 &&
    rowLengths.every((rowLength) => rowLength === dimension);
  const finite = matrix.every((row) =>
    row.every((value) => Number.isFinite(value))
  );
  const scale = Math.max(
    ...matrix.flatMap((row) => row.map((value) => Math.abs(value))),
  );
  const normalizationScale = scale === 0 ? 1 : scale;
  let maximumSymmetryRelativeError = 0;
  for (let row = 0; row < 4; row += 1) {
    for (let column = row + 1; column < 4; column += 1) {
      maximumSymmetryRelativeError = Math.max(
        maximumSymmetryRelativeError,
        Math.abs(matrix[row][column] - matrix[column][row]) /
          normalizationScale,
      );
    }
  }
  const symmetry =
    maximumSymmetryRelativeError <=
      NEAR_FIELD_COVARIANCE_RELATIVE_TOLERANCE;
  const normalizedEigenvalues = finite
    ? normalizedSymmetricEigenvalues4(matrix)
    : [Number.NaN, Number.NaN, Number.NaN, Number.NaN];
  const minimumScaledEigenvalue = Math.min(...normalizedEigenvalues);
  const positiveSemidefinite =
    symmetry &&
    Number.isFinite(minimumScaledEigenvalue) &&
    minimumScaledEigenvalue >=
      -NEAR_FIELD_COVARIANCE_RELATIVE_TOLERANCE;

  return {
    dimension,
    row_lengths: rowLengths,
    normalization_scale: normalizationScale,
    relative_tolerance: NEAR_FIELD_COVARIANCE_RELATIVE_TOLERANCE,
    maximum_symmetry_relative_error: maximumSymmetryRelativeError,
    normalized_eigenvalues: normalizedEigenvalues,
    minimum_scaled_eigenvalue: minimumScaledEigenvalue,
    square_gate: square ? "pass" as const : "not_ready" as const,
    finite_gate: finite ? "pass" as const : "not_ready" as const,
    symmetry_gate: symmetry ? "pass" as const : "not_ready" as const,
    positive_semidefinite_gate:
      positiveSemidefinite ? "pass" as const : "not_ready" as const,
    pass: square && finite && symmetry && positiveSemidefinite,
  };
}

/**
 * Stage-4 thermal-radiative/FDT closure.
 *
 * The far-field lane is an explicitly grey, reciprocal two-reservoir model.
 * The near-field lane only admits supplied Green/FDT output and never adds the
 * far-field result.  Both lanes keep vacuum zero-point energy separate from
 * thermal occupation and stop at an ordinary-decoherence prediction.
 */
export function evaluateCasimirDpRadiativeThermalClosure(
  rawInput: CasimirDpRadiativeThermalClosureInput,
) {
  const input = CasimirDpRadiativeThermalClosureInput.parse(rawInput);
  const intervals = input.integration.simpson_intervals;
  const xMax = input.integration.dimensionless_x_max;

  const planckMomentNumerical = simpsonIntegral(
    0,
    xMax,
    intervals,
    planckMomentIntegrand,
  );
  const planckMomentAnalytic = PI ** 4 / 15;
  const stefanBoltzmannAnalytic_W_m2_K4 =
    PI ** 2 * BOLTZMANN_J_K ** 4 / (60 * HBAR ** 3 * C ** 2);
  const stefanBoltzmannNumerical_W_m2_K4 =
    BOLTZMANN_J_K ** 4 /
      (4 * PI ** 2 * HBAR ** 3 * C ** 2) *
    planckMomentNumerical;
  const stefanBoltzmannRelativeError = relativeDifference(
    stefanBoltzmannNumerical_W_m2_K4,
    stefanBoltzmannAnalytic_W_m2_K4,
  );
  const stefanBoltzmannGate =
    stefanBoltzmannRelativeError <=
        input.integration.stefan_boltzmann_relative_tolerance
      ? "pass" as const
      : "not_ready" as const;

  const checkpointRows = input.frequency_convention.spectral_checkpoints.map(
    (checkpoint) => {
      const expectedOmega = 2 * PI * checkpoint.nu_Hz;
      const omegaConversionRelativeError = relativeDifference(
        checkpoint.omega_rad_s,
        expectedOmega,
      );
      const energyFromNu = PLANCK_J_S * checkpoint.nu_Hz;
      const energyFromOmega = HBAR * checkpoint.omega_rad_s;
      const energyConversionRelativeError = relativeDifference(
        energyFromNu,
        energyFromOmega,
      );
      const occupation = occupationFromOmega(
        checkpoint.omega_rad_s,
        checkpoint.temperature_K,
      );
      const radianceNu =
        2 * PLANCK_J_S * checkpoint.nu_Hz ** 3 / C ** 2 * occupation;
      const radianceOmega =
        HBAR * checkpoint.omega_rad_s ** 3 /
          (4 * PI ** 3 * C ** 2) *
        occupation;
      const radianceJacobianRelativeError = relativeDifference(
        radianceNu / (2 * PI),
        radianceOmega,
      );
      return {
        checkpoint_id: checkpoint.checkpoint_id,
        temperature_K: checkpoint.temperature_K,
        nu_Hz: checkpoint.nu_Hz,
        omega_rad_s: checkpoint.omega_rad_s,
        omega_from_nu_rad_s: expectedOmega,
        photon_energy_h_nu_J: energyFromNu,
        photon_energy_hbar_omega_J: energyFromOmega,
        planck_occupation: occupation,
        mode_zero_point_energy_J: 0.5 * energyFromOmega,
        mode_thermal_energy_J: energyFromOmega * occupation,
        mode_total_energy_J: energyFromOmega * (0.5 + occupation),
        planck_spectral_radiance_nu_W_m2_sr_Hz: radianceNu,
        planck_spectral_radiance_omega_W_m2_sr_per_rad_s: radianceOmega,
        omega_conversion_relative_error: omegaConversionRelativeError,
        energy_conversion_relative_error: energyConversionRelativeError,
        radiance_jacobian_relative_error: radianceJacobianRelativeError,
      };
    },
  );
  const maximumFrequencyConversionError = Math.max(
    ...checkpointRows.flatMap((row) => [
      row.omega_conversion_relative_error,
      row.energy_conversion_relative_error,
      row.radiance_jacobian_relative_error,
    ]),
  );
  const frequencyConventionGate =
    maximumFrequencyConversionError <=
        input.frequency_convention.conversion_relative_tolerance
      ? "pass" as const
      : "not_ready" as const;

  const sourceTemperature = input.reservoirs.source_temperature_K;
  const environmentTemperature = input.reservoirs.environment_temperature_K;
  const maximumTemperature = Math.max(sourceTemperature, environmentTemperature);
  const reducedThermalWavelengthM = maximumTemperature === 0
    ? Number.POSITIVE_INFINITY
    : HBAR * C / (BOLTZMANN_J_K * maximumTemperature);
  const thermalWavelengthRatio = maximumTemperature === 0
    ? Number.POSITIVE_INFINITY
    : input.geometry.separation_m / reducedThermalWavelengthM;
  const farFieldValidity =
    input.geometry.transfer_regime === "near_field"
      ? "not_applicable" as const
      : maximumTemperature === 0 ||
          thermalWavelengthRatio >=
            input.geometry.minimum_far_field_thermal_wavelength_ratio
        ? "pass" as const
        : "not_ready" as const;

  const nearField = input.near_field_fdt;
  const nearFieldCovarianceDiagnostics = nearField === null
    ? null
    : inspectNearFieldCovariance(nearField.accumulated_covariance);
  const nearFieldGrossNetPowerPass = nearField !== null &&
    nearField.gross_thermal_power_W >=
      Math.abs(nearField.net_thermal_power_W);
  const nearFieldPhysicalityPass = nearField !== null &&
    nearFieldCovarianceDiagnostics?.pass === true &&
    nearFieldGrossNetPowerPass;
  const nearFieldFdtPass = nearFieldPhysicalityPass &&
    receiptPass(nearField.receipt) &&
    nearField.material_loss_included &&
    nearField.temperature_included &&
    nearField.geometry_included &&
    nearField.zero_point_separated_from_thermal_transfer;
  const nearFieldFdtGate = input.geometry.transfer_regime === "far_field"
    ? "not_applicable" as const
    : nearFieldFdtPass
      ? "pass" as const
      : "not_ready" as const;

  const effectiveEmissivity = effectiveGreyEmissivity(
    input.reservoirs.source_emissivity,
    input.reservoirs.environment_emissivity,
  );
  const areaViewEmissivity =
    input.reservoirs.radiating_area_m2 *
    input.reservoirs.view_factor *
    effectiveEmissivity;
  const sourceFarFieldPower =
    areaViewEmissivity *
    stefanBoltzmannNumerical_W_m2_K4 *
    sourceTemperature ** 4;
  const environmentFarFieldPower =
    areaViewEmissivity *
    stefanBoltzmannNumerical_W_m2_K4 *
    environmentTemperature ** 4;
  const farFieldNetPower = sourceFarFieldPower - environmentFarFieldPower;
  const farFieldGrossPower = sourceFarFieldPower + environmentFarFieldPower;

  const photonMoment = simpsonIntegral(
    0,
    xMax,
    intervals,
    photonMomentIntegrand,
  );
  const photonRateAtTemperature = (temperatureK: number): number =>
    temperatureK === 0
      ? 0
      : areaViewEmissivity *
        (BOLTZMANN_J_K * temperatureK / HBAR) ** 3 /
        (4 * PI ** 2 * C ** 2) *
        photonMoment;
  const sourcePhotonRate = photonRateAtTemperature(sourceTemperature);
  const environmentPhotonRate = photonRateAtTemperature(environmentTemperature);
  const grossPhotonRate = sourcePhotonRate + environmentPhotonRate;

  const energyNoiseMoment = simpsonIntegral(
    0,
    xMax,
    intervals,
    energyNoiseMomentIntegrand,
  );
  const energyNoiseAtTemperature = (temperatureK: number): number =>
    temperatureK === 0
      ? 0
      : areaViewEmissivity *
        (BOLTZMANN_J_K * temperatureK) ** 5 /
        (4 * PI ** 2 * HBAR ** 3 * C ** 2) *
        energyNoiseMoment;
  const farFieldEnergyVarianceRate =
    energyNoiseAtTemperature(sourceTemperature) +
    energyNoiseAtTemperature(environmentTemperature);

  const decoherenceRateAtTemperature = (temperatureK: number): number => {
    if (temperatureK === 0 || input.probe.branch_separation_m === 0) return 0;
    const thermalScaleRadS =
      BOLTZMANN_J_K * temperatureK / HBAR;
    const distinguishabilityMoment = simpsonIntegral(
      0,
      xMax,
      intervals,
      (x) => {
        if (x === 0) return 0;
        const distinguishability = Math.max(
          0,
          1 -
            sinc(
              x *
                thermalScaleRadS *
                input.probe.branch_separation_m /
                C,
            ),
        );
        return photonMomentIntegrand(x) * distinguishability;
      },
    );
    return areaViewEmissivity *
      thermalScaleRadS ** 3 /
      (4 * PI ** 2 * C ** 2) *
      distinguishabilityMoment *
      input.probe.decoherence_coupling_efficiency;
  };
  const farFieldDecoherenceRate =
    decoherenceRateAtTemperature(sourceTemperature) +
    decoherenceRateAtTemperature(environmentTemperature);
  const farFieldHeatingRate =
    farFieldGrossPower *
    input.probe.heating_absorption_fraction /
    (HBAR * input.probe.oscillator_omega_rad_s);

  const direction = normalizedDirection(input.probe.recoil_direction);
  const directionGate =
    Math.abs(direction.norm - 1) <=
        input.gates.recoil_direction_norm_tolerance
      ? "pass" as const
      : "not_ready" as const;
  const farFieldRecoilMagnitude =
    input.probe.recoil_anisotropy * farFieldNetPower / C;
  const farFieldRecoilForce = direction.unit.map(
    (component) => component * farFieldRecoilMagnitude,
  ) as Vector3Value;

  const useFarField = input.geometry.transfer_regime === "far_field";
  const netPower = useFarField
    ? farFieldNetPower
    : nearField!.net_thermal_power_W;
  const grossPower = useFarField
    ? farFieldGrossPower
    : nearField!.gross_thermal_power_W;
  const energyVarianceRate = useFarField
    ? farFieldEnergyVarianceRate
    : nearField!.energy_transfer_variance_rate_J2_s;
  const recoilForce = useFarField
    ? farFieldRecoilForce
    : nearField!.recoil_force_N;
  const heatingRate = useFarField
    ? farFieldHeatingRate
    : nearField!.occupation_heating_rate_s;
  const decoherenceRate = useFarField
    ? farFieldDecoherenceRate
    : nearField!.decoherence_rate_s;

  const interactionTime = input.probe.interaction_time_s;
  const accumulatedEnergyVariance = energyVarianceRate * interactionTime;
  const recoilCoefficient = input.probe.recoil_anisotropy / C;
  const accumulatedCovariance = useFarField
    ? [
      [
        accumulatedEnergyVariance,
        accumulatedEnergyVariance * recoilCoefficient,
        0,
        0,
      ],
      [
        accumulatedEnergyVariance * recoilCoefficient,
        accumulatedEnergyVariance * recoilCoefficient ** 2,
        0,
        0,
      ],
      [0, 0, heatingRate * interactionTime, 0],
      [0, 0, 0, decoherenceRate * interactionTime],
    ] as [
      [number, number, number, number],
      [number, number, number, number],
      [number, number, number, number],
      [number, number, number, number],
    ]
    : nearField!.accumulated_covariance;
  const forceNoiseCovariance = outerProduct(
    direction.unit,
    energyVarianceRate *
      (input.probe.recoil_anisotropy / C) ** 2,
  );

  const equalTemperature = sourceTemperature === environmentTemperature;
  const detailedBalancePass = equalTemperature
    ? Math.abs(netPower) <= input.gates.detailed_balance_absolute_tolerance_W
    : netPower * (sourceTemperature - environmentTemperature) >= 0;
  let entropyProduction_W_K: number | null = null;
  let entropyProductionPass = true;
  if (sourceTemperature > 0 && environmentTemperature > 0) {
    entropyProduction_W_K =
      netPower *
      (1 / environmentTemperature - 1 / sourceTemperature);
    entropyProductionPass = entropyProduction_W_K >= -Number.EPSILON;
  } else if (sourceTemperature === 0 && environmentTemperature === 0) {
    entropyProduction_W_K = 0;
  } else {
    // The ideal-reservoir expression diverges at an exact zero-temperature
    // sink; null records that boundary without manufacturing a finite value.
    entropyProductionPass =
      netPower * (sourceTemperature - environmentTemperature) >= 0;
  }

  const solarEffectiveTemperatureK = (
    input.solar_benchmark.luminosity_W /
    (
      4 *
      PI *
      input.solar_benchmark.radius_m ** 2 *
      stefanBoltzmannNumerical_W_m2_K4
    )
  ) ** 0.25;
  const solarAbsoluteErrorK = Math.abs(
    solarEffectiveTemperatureK -
      input.solar_benchmark.reference_effective_temperature_K,
  );
  const solarGate =
    solarAbsoluteErrorK <= input.solar_benchmark.absolute_tolerance_K
      ? "pass" as const
      : "not_ready" as const;
  const numericalValidityRows = {
    spectral_checkpoints: hasOnlyFiniteNumbers(checkpointRows),
    planck_stefan_boltzmann: hasOnlyFiniteNumbers([
      planckMomentNumerical,
      planckMomentAnalytic,
      stefanBoltzmannNumerical_W_m2_K4,
      stefanBoltzmannAnalytic_W_m2_K4,
      stefanBoltzmannRelativeError,
    ]),
    thermal_wavelength:
      maximumTemperature === 0 ||
      hasOnlyFiniteNumbers([
        reducedThermalWavelengthM,
        thermalWavelengthRatio,
      ]),
    far_field_transfer:
      !useFarField ||
      hasOnlyFiniteNumbers([
        sourceFarFieldPower,
        environmentFarFieldPower,
        farFieldNetPower,
        farFieldGrossPower,
        sourcePhotonRate,
        environmentPhotonRate,
        grossPhotonRate,
        farFieldEnergyVarianceRate,
        farFieldRecoilForce,
        farFieldHeatingRate,
        farFieldDecoherenceRate,
      ]),
    active_transfer_and_noise: hasOnlyFiniteNumbers([
      netPower,
      grossPower,
      energyVarianceRate,
      recoilForce,
      heatingRate,
      decoherenceRate,
      accumulatedEnergyVariance,
      forceNoiseCovariance,
    ]),
    residual_covariance: hasOnlyFiniteNumbers(accumulatedCovariance),
    entropy_production:
      entropyProduction_W_K === null ||
      Number.isFinite(entropyProduction_W_K),
    solar_benchmark: hasOnlyFiniteNumbers([
      solarEffectiveTemperatureK,
      solarAbsoluteErrorK,
    ]),
  };
  const numericalValidityPass = Object.values(numericalValidityRows).every(
    Boolean,
  );

  const provenanceRows = {
    authority: receiptPass(input.authority_receipt),
    material: receiptPass(input.reservoirs.material_receipt),
    geometry: receiptPass(input.geometry.geometry_receipt),
    solar_benchmark: receiptPass(input.solar_benchmark.receipt),
    near_field_fdt: nearField === null ? null : receiptPass(nearField.receipt),
  };
  const provenancePass = Object.values(provenanceRows).every(
    (value) => value === null || value,
  );
  const receiptEvidenceClasses = {
    authority: input.authority_receipt.evidence_class,
    material: input.reservoirs.material_receipt.evidence_class,
    geometry: input.geometry.geometry_receipt.evidence_class,
    solar_benchmark: input.solar_benchmark.receipt.evidence_class,
    near_field_fdt: useFarField ? null : nearField?.receipt.evidence_class ??
      null,
  };
  const activeReceiptsMeasured = Object.values(receiptEvidenceClasses).every(
    (value) => value === null || value === "measured",
  );
  const activeTransferGate = useFarField
    ? farFieldValidity === "pass"
    : nearFieldFdtGate === "pass";
  const thermalClosurePass =
    provenancePass &&
    activeTransferGate &&
    stefanBoltzmannGate === "pass" &&
    frequencyConventionGate === "pass" &&
    directionGate === "pass" &&
    detailedBalancePass &&
    entropyProductionPass &&
    solarGate === "pass" &&
    numericalValidityPass;
  const measuredReady =
    input.evidence_class === "measured" &&
    activeReceiptsMeasured &&
    thermalClosurePass;

  return {
    schema_version: "casimir_dp_radiative_thermal_closure_result/1" as const,
    input_schema_version: input.schema_version,
    model_binding_sha256: input.model_binding_sha256,
    constants: {
      canonical_spectral_variable: "omega_rad_s" as const,
      hbar_J_s: HBAR,
      h_J_s: PLANCK_J_S,
      h_equals_two_pi_hbar: true as const,
      boltzmann_J_K: BOLTZMANN_J_K,
      speed_of_light_m_s: C,
    },
    frequency_congruence: {
      checkpoints: checkpointRows,
      maximum_relative_error: maximumFrequencyConversionError,
      tolerance: input.frequency_convention.conversion_relative_tolerance,
      gate: frequencyConventionGate,
    },
    planck_stefan_boltzmann: {
      dimensionless_planck_moment_numerical: planckMomentNumerical,
      dimensionless_planck_moment_analytic: planckMomentAnalytic,
      sigma_numerical_W_m2_K4: stefanBoltzmannNumerical_W_m2_K4,
      sigma_analytic_W_m2_K4: stefanBoltzmannAnalytic_W_m2_K4,
      sigma_relative_error: stefanBoltzmannRelativeError,
      tolerance: input.integration.stefan_boltzmann_relative_tolerance,
      gate: stefanBoltzmannGate,
    },
    mode_energy_accounting: {
      zero_point_term: "one_half_hbar_omega" as const,
      thermal_term: "hbar_omega_nbar" as const,
      zero_point_in_net_thermal_power: false as const,
      gate: "pass" as const,
    },
    transfer_regime: {
      active_model: useFarField
        ? "far_field_greybody_stefan_boltzmann" as const
        : "near_field_green_fdt_supplied" as const,
      reduced_thermal_wavelength_m: reducedThermalWavelengthM,
      separation_to_reduced_thermal_wavelength_ratio: thermalWavelengthRatio,
      minimum_far_field_ratio:
        input.geometry.minimum_far_field_thermal_wavelength_ratio,
      far_field_validity_gate: farFieldValidity,
      near_field_green_fdt_gate: nearFieldFdtGate,
      double_counting_gate: "pass" as const,
    },
    near_field_validation: useFarField
      ? {
        applicable: false as const,
        covariance: null,
        power_consistency: null,
        gate: "not_applicable" as const,
      }
      : {
        applicable: true as const,
        covariance: {
          dimension: nearFieldCovarianceDiagnostics!.dimension,
          row_lengths: nearFieldCovarianceDiagnostics!.row_lengths,
          normalization_scale:
            nearFieldCovarianceDiagnostics!.normalization_scale,
          relative_tolerance:
            nearFieldCovarianceDiagnostics!.relative_tolerance,
          maximum_symmetry_relative_error:
            nearFieldCovarianceDiagnostics!.maximum_symmetry_relative_error,
          normalized_eigenvalues:
            nearFieldCovarianceDiagnostics!.normalized_eigenvalues,
          minimum_scaled_eigenvalue:
            nearFieldCovarianceDiagnostics!.minimum_scaled_eigenvalue,
          square_gate: nearFieldCovarianceDiagnostics!.square_gate,
          finite_gate: nearFieldCovarianceDiagnostics!.finite_gate,
          symmetry_gate: nearFieldCovarianceDiagnostics!.symmetry_gate,
          positive_semidefinite_gate:
            nearFieldCovarianceDiagnostics!.positive_semidefinite_gate,
        },
        power_consistency: {
          gross_thermal_power_W: nearField!.gross_thermal_power_W,
          absolute_net_thermal_power_W:
            Math.abs(nearField!.net_thermal_power_W),
          gross_minus_absolute_net_W:
            nearField!.gross_thermal_power_W -
            Math.abs(nearField!.net_thermal_power_W),
          gross_not_less_than_absolute_net_gate:
            nearFieldGrossNetPowerPass
              ? "pass" as const
              : "not_ready" as const,
        },
        gate:
          nearFieldPhysicalityPass ? "pass" as const : "not_ready" as const,
      },
    emissivity: {
      source: input.reservoirs.source_emissivity,
      environment: input.reservoirs.environment_emissivity,
      effective_grey_emissivity: effectiveEmissivity,
      opaque_limit_gate:
        effectiveEmissivity >= 0 && effectiveEmissivity <= 1
          ? "pass" as const
          : "not_ready" as const,
    },
    thermal_transfer: {
      source_power_W: useFarField ? sourceFarFieldPower : null,
      environment_power_W: useFarField ? environmentFarFieldPower : null,
      net_power_source_to_environment_W: netPower,
      gross_exchange_power_W: grossPower,
      gross_photon_rate_s: useFarField ? grossPhotonRate : null,
      detailed_balance_gate:
        detailedBalancePass ? "pass" as const : "not_ready" as const,
      entropy_production_W_K: entropyProduction_W_K,
      nonnegative_entropy_production_gate:
        entropyProductionPass ? "pass" as const : "not_ready" as const,
    },
    recoil: {
      force_N: recoilForce,
      direction_norm: direction.norm,
      direction_gate: directionGate,
    },
    noise: {
      model: useFarField
        ? "far_field_bose_occupation_variance" as const
        : "near_field_green_fdt_supplied" as const,
      energy_transfer_variance_rate_J2_s: energyVarianceRate,
      one_sided_white_power_noise_psd_W2_Hz: 2 * energyVarianceRate,
      force_noise_covariance_N2_s: forceNoiseCovariance,
    },
    heating: {
      occupation_heating_rate_s: heatingRate,
      accumulated_occupation: heatingRate * interactionTime,
      model: useFarField
        ? "greybody_absorbed_power_over_hbar_omega_probe" as const
        : "near_field_green_fdt_supplied" as const,
    },
    decoherence: {
      rate_s: decoherenceRate,
      chi: decoherenceRate * interactionTime,
      visibility_factor: Math.exp(-decoherenceRate * interactionTime),
      model: useFarField
        ? "thermal_photon_path_distinguishability" as const
        : "near_field_green_fdt_supplied" as const,
    },
    residual_covariance: {
      observable_order: [
        "net_energy_J",
        "directed_recoil_momentum_kg_m_s",
        "heating_quanta",
        "decoherence_chi",
      ] as const,
      covariance: accumulatedCovariance,
      authority: useFarField
        ? "reduced-order Bose energy-current noise with shared energy/recoil covariance and Poisson heating/decoherence diagonals" as const
        : "supplied near-field Green/FDT covariance" as const,
    },
    solar_benchmark: {
      luminosity_W: input.solar_benchmark.luminosity_W,
      radius_m: input.solar_benchmark.radius_m,
      effective_temperature_K: solarEffectiveTemperatureK,
      reference_effective_temperature_K:
        input.solar_benchmark.reference_effective_temperature_K,
      absolute_error_K: solarAbsoluteErrorK,
      tolerance_K: input.solar_benchmark.absolute_tolerance_K,
      interpretation:
        "flux-equivalent effective temperature from luminosity and radius; not a prediction of stellar structure from h alone" as const,
      gate: solarGate,
    },
    provenance: {
      receipt_checks: provenanceRows,
      receipt_evidence_classes: receiptEvidenceClasses,
      all_active_receipts_measured: activeReceiptsMeasured,
      gate: provenancePass ? "pass" as const : "not_ready" as const,
    },
    numerical_validity: {
      checks: numericalValidityRows,
      gate: numericalValidityPass ? "pass" as const : "not_ready" as const,
    },
    readiness: {
      thermal_closure_gate:
        thermalClosurePass ? "pass" as const : "not_ready" as const,
      measured_thermal_lane:
        measuredReady
          ? "ready_for_scientific_comparison" as const
          : "not_ready" as const,
      evidence_class: input.evidence_class,
      maximum_claim: measuredReady
        ? "measurement_constrained_ordinary_thermal_prediction" as const
        : input.evidence_class === "synthetic_fixture"
          ? "synthetic_pipeline_validation" as const
          : "diagnostic_thermal_prediction" as const,
    },
    promotion_allowed: measuredReady,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    claim_boundaries: [
      "Equal dimensions or shared h and hbar constants do not define a transfer kernel between thermal modes and collapse.",
      "Stefan-Boltzmann closure is a far-field thermal benchmark and is not a near-field Casimir-noise model.",
      "Zero-point mode energy is reported separately and is not added to net thermal power.",
      "Ordinary thermal power, recoil, heating, noise, or decoherence does not identify objective collapse or manifold dynamics.",
    ],
  };
}
