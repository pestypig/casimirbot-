import { z } from "zod";

export const CASIMIR_DP_QED_SCALE_HIERARCHY_INPUT_VERSION =
  "casimir_dp_qed_scale_hierarchy_calibration/1" as const;

const NonEmpty = z.string().min(1);
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Finite = z.number().finite();
const PositiveFinite = Finite.positive();
const NonnegativeFinite = Finite.nonnegative();

const AuthorityReceipt = z.object({
  authority_id: z.literal("nist-codata-2022-v9.0"),
  path: z.literal("configs/constants/codata-2022.v1.json"),
  expected_sha256: Sha256,
  actual_sha256: Sha256,
  integrity_verified: z.boolean(),
  citation: z.literal(
    "NIST/CODATA recommended values of the fundamental physical constants: 2022",
  ),
  url: z.literal("https://physics.nist.gov/constants"),
  retrieved_at: z.string().datetime(),
}).strict();

const ExactSiQuantity = z.object({
  value: PositiveFinite,
  literal_text: NonEmpty,
  standard_uncertainty: z.literal(0),
  exact_si: z.literal(true),
}).strict();

const AdjustedQuantity = z.object({
  value: PositiveFinite,
  literal_text: NonEmpty,
  standard_uncertainty: NonnegativeFinite,
  standard_uncertainty_literal_text: NonEmpty,
  relative_uncertainty: NonnegativeFinite,
}).strict();

const ReferenceQuantity = AdjustedQuantity.extend({
  rounding_resolution: PositiveFinite,
}).strict();

const RelativeCovarianceMatrix = z.tuple([
  z.tuple([Finite, Finite, Finite]),
  z.tuple([Finite, Finite, Finite]),
  z.tuple([Finite, Finite, Finite]),
]);

const CovarianceNotSupplied = z.object({
  status: z.literal("not_supplied"),
  quantity_order: z.tuple([
    z.literal("fine_structure_alpha"),
    z.literal("electron_rest_mass_kg"),
    z.literal("nucleus_to_electron_mass_ratio"),
  ]),
  relative_covariance: z.null(),
  derived_reference_cross_covariance: z.literal("not_supplied"),
  significance_policy: z.literal(
    "not_computable_without_cross_covariance",
  ),
  fallback_uncertainty_policy: z.literal(
    "conservative_l1_relative_uncertainty_bound",
  ),
}).strict();

const CovarianceSupplied = z.object({
  status: z.literal("supplied"),
  quantity_order: z.tuple([
    z.literal("fine_structure_alpha"),
    z.literal("electron_rest_mass_kg"),
    z.literal("nucleus_to_electron_mass_ratio"),
  ]),
  relative_covariance: RelativeCovarianceMatrix,
  derived_reference_cross_covariance: z.literal("not_supplied"),
  significance_policy: z.literal(
    "not_computable_without_cross_covariance",
  ),
  fallback_uncertainty_policy: z.literal(
    "conservative_l1_relative_uncertainty_bound",
  ),
}).strict();

const PrecisionOmissions = z.tuple([
  z.literal("dirac_bound_state"),
  z.literal("relativistic_recoil"),
  z.literal("radiative_recoil"),
  z.literal("electron_self_energy"),
  z.literal("vacuum_polarization"),
  z.literal("higher_order_radiative"),
  z.literal("finite_nuclear_size"),
  z.literal("nuclear_polarizability"),
  z.literal("hyperfine_structure"),
  z.literal("stark_shift"),
  z.literal("zeeman_shift"),
  z.literal("doppler_shift"),
  z.literal("pressure_shift"),
  z.literal("blackbody_shift"),
]);

export const CasimirDpQedScaleHierarchyCalibrationInput = z.object({
  schema_version: z.literal(
    CASIMIR_DP_QED_SCALE_HIERARCHY_INPUT_VERSION,
  ),
  calibration_id: z.literal(
    "casimir-dp-qed-scale-hierarchy-stage4-1-v1",
  ),
  evidence_class: z.literal("source_backed_calculation"),
  claim_ceiling: z.literal("qed_scale_identity_calibration"),
  promotion_allowed: z.literal(false),
  authority_receipt: AuthorityReceipt,
  constants_set: z.object({
    id: z.literal("CODATA-2022-v9.0"),
    h_J_s: ExactSiQuantity,
    c_m_s: ExactSiQuantity,
    fine_structure_alpha: AdjustedQuantity.extend({
      regime: z.literal("zero_momentum_low_energy_codata"),
    }).strict(),
    electron_rest_mass_kg: AdjustedQuantity.extend({
      mass_scheme: z.literal("on_shell_rest_mass"),
    }).strict(),
    references: z.object({
      electron_compton_wavelength_m: ReferenceQuantity,
      electron_reduced_compton_wavelength_m: ReferenceQuantity,
      bohr_radius_m: ReferenceQuantity,
      classical_electron_radius_m: ReferenceQuantity,
      rydberg_constant_m_inv: ReferenceQuantity,
      rydberg_frequency_Hz: ReferenceQuantity,
      rydberg_energy_J: ReferenceQuantity,
      hartree_energy_J: ReferenceQuantity,
    }).strict(),
  }).strict(),
  uncertainty_model: z.discriminatedUnion("status", [
    CovarianceNotSupplied,
    CovarianceSupplied,
  ]),
  reduced_mass_case: z.object({
    case_id: z.literal("hydrogen_proton_electron_leading_order"),
    atomic_number_Z: z.literal(1),
    nucleus_to_electron_mass_ratio: PositiveFinite,
    ratio_literal_text: NonEmpty,
    ratio_standard_uncertainty: NonnegativeFinite,
    ratio_standard_uncertainty_literal_text: NonEmpty,
    mass_semantics: z.literal("bare_nucleus_over_electron"),
    initial_n: z.number().int().positive(),
    final_n: z.number().int().positive(),
  }).strict(),
  symbol_registry: z.object({
    fine_structure_constant: z.literal("alpha_fs"),
    electric_polarizability_tensor: z.literal("alpha_pol_ij"),
    statistical_significance: z.literal("alpha_stat"),
    branch_amplitudes: z.tuple([
      z.literal("c_A"),
      z.literal("c_B"),
    ]),
    bare_alpha_allowed: z.literal(false),
  }).strict(),
  conventions: z.object({
    units: z.literal("SI"),
    ordinary_compton_wavelength: z.literal("lambda_C=h/(m_e*c)"),
    reduced_compton_wavelength: z.literal(
      "lambda_bar_C=hbar/(m_e*c)",
    ),
    cyclic_compton_frequency: z.literal("nu_C=m_e*c^2/h"),
    angular_compton_frequency: z.literal(
      "omega_C=m_e*c^2/hbar=2*pi*nu_C",
    ),
    rydberg_constant_semantics: z.literal(
      "R_infinity_is_infinite_nuclear_mass_wavenumber",
    ),
    rydberg_frequency_semantics: z.literal("nu_R=c*R_infinity"),
    alpha_semantics: z.literal(
      "dimensionless_low_energy_electromagnetic_coupling_not_probability",
    ),
  }).strict(),
  precision_scope: z.object({
    calculation_level: z.literal(
      "leading_nonrelativistic_reduced_mass",
    ),
    applied_terms: z.tuple([
      z.literal("si_exact_constants"),
      z.literal("codata_low_energy_constants"),
      z.literal("leading_nonrelativistic_reduced_mass"),
    ]),
    omitted_terms: PrecisionOmissions,
    precision_spectroscopy_claimed: z.literal(false),
    independent_empirical_validation_claimed: z.literal(false),
  }).strict(),
  domain_exclusions: z.object({
    polarization_or_helicity_model_included: z.literal(false),
    cavity_input_allowed: z.literal(false),
    casimir_input_allowed: z.literal(false),
    dp_input_allowed: z.literal(false),
    collapse_input_allowed: z.literal(false),
    manifold_input_allowed: z.literal(false),
    resonance_input_allowed: z.literal(false),
    transfer_kernel_input_allowed: z.literal(false),
  }).strict(),
  tolerances: z.object({
    identity_relative_tolerance: PositiveFinite,
    maximum_identity_relative_tolerance: PositiveFinite,
    covariance_symmetry_tolerance: NonnegativeFinite,
    covariance_psd_tolerance: NonnegativeFinite,
    reference_uncertainty_multiplier: PositiveFinite,
  }).strict(),
}).strict().superRefine((input, context) => {
  if (
    input.tolerances.identity_relative_tolerance >
      input.tolerances.maximum_identity_relative_tolerance
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tolerances", "identity_relative_tolerance"],
      message:
        "identity_relative_tolerance exceeds the hard maximum",
    });
  }
  if (
    input.reduced_mass_case.initial_n ===
      input.reduced_mass_case.final_n
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reduced_mass_case"],
      message: "initial_n and final_n must be distinct",
    });
  }
});

export type CasimirDpQedScaleHierarchyCalibrationInput = z.infer<
  typeof CasimirDpQedScaleHierarchyCalibrationInput
>;

export const CASIMIR_DP_QED_SCALE_HIERARCHY_FAILURE_ORDER = [
  "QSH_SOURCE_INTEGRITY_FAILED",
  "QSH_SI_EXACT_CONSTANT_MISMATCH",
  "QSH_ALPHA_REGIME_UNSUPPORTED",
  "QSH_LITERAL_PRECISION_METADATA_INVALID",
  "QSH_UNCERTAINTY_METADATA_INVALID",
  "QSH_UNCERTAINTY_COVARIANCE_INVALID",
  "QSH_HBAR_2PI_MISMATCH",
  "QSH_COMPTON_CONVENTION_MISMATCH",
  "QSH_COMPTON_ENERGY_FREQUENCY_MISMATCH",
  "QSH_BOHR_LENGTH_IDENTITY_FAILED",
  "QSH_CLASSICAL_RADIUS_IDENTITY_FAILED",
  "QSH_RYDBERG_IDENTITY_FAILED",
  "QSH_HARTREE_RYDBERG_IDENTITY_FAILED",
  "QSH_SCALE_HIERARCHY_FAILED",
  "QSH_CODATA_REFERENCE_OUTSIDE_ENVELOPE",
  "QSH_NUCLEAR_MASS_SEMANTICS_INVALID",
  "QSH_REDUCED_MASS_CLOSURE_FAILED",
  "QSH_LEADING_TRANSITION_CLOSURE_FAILED",
  "QSH_PRECISION_SCOPE_OVERCLAIM",
] as const;

export type CasimirDpQedScaleHierarchyFailureCode =
  typeof CASIMIR_DP_QED_SCALE_HIERARCHY_FAILURE_ORDER[number];

type Failure = {
  code: CasimirDpQedScaleHierarchyFailureCode;
  path: string;
  message: string;
};

type RelativeExponentVector = {
  fine_structure_alpha: number;
  electron_rest_mass_kg: number;
  nucleus_to_electron_mass_ratio: number;
};

const zeroExponentVector = (): RelativeExponentVector => ({
  fine_structure_alpha: 0,
  electron_rest_mass_kg: 0,
  nucleus_to_electron_mass_ratio: 0,
});

function relativeError(actual: number, expected: number): number {
  const scale = Math.max(
    Math.abs(actual),
    Math.abs(expected),
    Number.MIN_VALUE,
  );
  return Math.abs(actual - expected) / scale;
}

function maximum(values: number[]): number {
  return values.reduce((current, value) => Math.max(current, value), 0);
}

function determinant3(matrix: number[][]): number {
  const [a, b, c] = matrix;
  return (
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0])
  );
}

function validateRelativeCovariance(
  uncertainty: CasimirDpQedScaleHierarchyCalibrationInput[
    "uncertainty_model"
  ],
  expectedRelativeUncertainties: readonly [
    number,
    number,
    number,
  ],
  symmetryTolerance: number,
  psdTolerance: number,
): {
  supplied: boolean;
  symmetric: boolean | null;
  diagonal_matches_declared_uncertainties: boolean | null;
  correlations_within_bounds: boolean | null;
  positive_semidefinite: boolean | null;
  minimum_principal_minor: number | null;
  gate: "pass" | "blocked";
} {
  if (uncertainty.status === "not_supplied") {
    return {
      supplied: false,
      symmetric: null,
      diagonal_matches_declared_uncertainties: null,
      correlations_within_bounds: null,
      positive_semidefinite: null,
      minimum_principal_minor: null,
      gate: "pass",
    };
  }
  const matrix = uncertainty.relative_covariance.map((row) => [...row]);
  const symmetric = matrix.every((row, i) =>
    row.every((value, j) =>
      Math.abs(value - matrix[j][i]) <= symmetryTolerance
    )
  );
  const diagonalMatchesDeclaredUncertainties =
    expectedRelativeUncertainties.every((uncertaintyValue, index) =>
      Math.abs(
        matrix[index][index] -
          uncertaintyValue * uncertaintyValue,
      ) <= symmetryTolerance
    );
  const positiveDiagonal = matrix.every(
    (row, index) => row[index] > 0,
  );
  const correlation = positiveDiagonal
    ? matrix.map((row, i) =>
      row.map((value, j) =>
        value /
        Math.sqrt(matrix[i][i] * matrix[j][j])
      )
    )
    : [
      [Number.NaN, Number.NaN, Number.NaN],
      [Number.NaN, Number.NaN, Number.NaN],
      [Number.NaN, Number.NaN, Number.NaN],
    ];
  const correlationsWithinBounds =
    positiveDiagonal &&
    correlation.every((row, i) =>
      row.every((value, j) =>
        Number.isFinite(value) &&
        (
          i === j
            ? Math.abs(value - 1) <= psdTolerance
            : Math.abs(value) <= 1 + psdTolerance
        )
      )
    );
  const principalMinors = [
    correlation[0][0],
    correlation[1][1],
    correlation[2][2],
    correlation[0][0] * correlation[1][1] -
      correlation[0][1] * correlation[1][0],
    correlation[0][0] * correlation[2][2] -
      correlation[0][2] * correlation[2][0],
    correlation[1][1] * correlation[2][2] -
      correlation[1][2] * correlation[2][1],
    determinant3(correlation),
  ];
  const minimumPrincipalMinor = Math.min(...principalMinors);
  const positiveSemidefinite =
    symmetric &&
    diagonalMatchesDeclaredUncertainties &&
    correlationsWithinBounds &&
    minimumPrincipalMinor >= -psdTolerance;
  return {
    supplied: true,
    symmetric,
    diagonal_matches_declared_uncertainties:
      diagonalMatchesDeclaredUncertainties,
    correlations_within_bounds: correlationsWithinBounds,
    positive_semidefinite: positiveSemidefinite,
    minimum_principal_minor: minimumPrincipalMinor,
    gate: positiveSemidefinite ? "pass" : "blocked",
  };
}

function conservativeRelativeUncertainty(
  exponents: RelativeExponentVector,
  input: CasimirDpQedScaleHierarchyCalibrationInput,
): number {
  const alpha = input.constants_set.fine_structure_alpha;
  const mass = input.constants_set.electron_rest_mass_kg;
  const ratio = input.reduced_mass_case;
  const alphaRelativeUncertainty =
    alpha.standard_uncertainty / alpha.value;
  const massRelativeUncertainty =
    mass.standard_uncertainty / mass.value;
  const ratioRelativeUncertainty =
    ratio.ratio_standard_uncertainty /
    ratio.nucleus_to_electron_mass_ratio;
  return (
    Math.abs(exponents.fine_structure_alpha) *
      alphaRelativeUncertainty +
    Math.abs(exponents.electron_rest_mass_kg) *
      massRelativeUncertainty +
    Math.abs(exponents.nucleus_to_electron_mass_ratio) *
      ratioRelativeUncertainty
  );
}

function propagatedRelativeUncertainty(
  exponents: RelativeExponentVector,
  input: CasimirDpQedScaleHierarchyCalibrationInput,
): {
  relative_standard_uncertainty: number;
  method:
    | "supplied_relative_covariance"
    | "conservative_l1_relative_uncertainty_bound";
} {
  if (input.uncertainty_model.status === "not_supplied") {
    return {
      relative_standard_uncertainty:
        conservativeRelativeUncertainty(exponents, input),
      method:
        "conservative_l1_relative_uncertainty_bound",
    };
  }
  const vector = [
    exponents.fine_structure_alpha,
    exponents.electron_rest_mass_kg,
    exponents.nucleus_to_electron_mass_ratio,
  ];
  const matrix = input.uncertainty_model.relative_covariance;
  let variance = 0;
  for (let row = 0; row < vector.length; row += 1) {
    for (let column = 0; column < vector.length; column += 1) {
      variance +=
        vector[row] * matrix[row][column] * vector[column];
    }
  }
  return {
    relative_standard_uncertainty: Math.sqrt(Math.max(0, variance)),
    method: "supplied_relative_covariance",
  };
}

function referenceRow(args: {
  quantity_id: string;
  computed: number;
  reference: {
    value: number;
    standard_uncertainty: number;
    rounding_resolution: number;
  };
  exponents: RelativeExponentVector;
  input: CasimirDpQedScaleHierarchyCalibrationInput;
}) {
  const propagated = propagatedRelativeUncertainty(
    args.exponents,
    args.input,
  );
  const computedUncertainty =
    Math.abs(args.computed) *
    propagated.relative_standard_uncertainty;
  const envelope =
    args.input.tolerances.reference_uncertainty_multiplier *
    (
      computedUncertainty +
      args.reference.standard_uncertainty +
      args.reference.rounding_resolution / 2
    );
  const absoluteDifference = Math.abs(
    args.computed - args.reference.value,
  );
  return {
    quantity_id: args.quantity_id,
    computed_value: args.computed,
    reference_value: args.reference.value,
    absolute_difference: absoluteDifference,
    relative_difference: relativeError(
      args.computed,
      args.reference.value,
    ),
    reference_standard_uncertainty:
      args.reference.standard_uncertainty,
    reference_rounding_resolution:
      args.reference.rounding_resolution,
    computed_relative_standard_uncertainty:
      propagated.relative_standard_uncertainty,
    computed_absolute_standard_uncertainty: computedUncertainty,
    uncertainty_propagation_method: propagated.method,
    acceptance_envelope: envelope,
    significance: null,
    significance_status:
      "not_computable_without_cross_covariance" as const,
    gate:
      absoluteDifference <= envelope
        ? "pass" as const
        : "blocked" as const,
  };
}

function addFailure(
  failures: Failure[],
  condition: boolean,
  code: CasimirDpQedScaleHierarchyFailureCode,
  path: string,
  message: string,
): void {
  if (condition) failures.push({ code, path, message });
}

function sortedFailures(failures: Failure[]): Failure[] {
  const order = new Map(
    CASIMIR_DP_QED_SCALE_HIERARCHY_FAILURE_ORDER.map(
      (code, index) => [code, index],
    ),
  );
  return [...failures].sort((left, right) => {
    const codeOrder =
      (order.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.code) ?? Number.MAX_SAFE_INTEGER);
    return codeOrder === 0
      ? left.path.localeCompare(right.path)
      : codeOrder;
  });
}

export function evaluateCasimirDpQedScaleHierarchyCalibration(
  rawInput: CasimirDpQedScaleHierarchyCalibrationInput,
) {
  const input = CasimirDpQedScaleHierarchyCalibrationInput.parse(
    rawInput,
  );
  const failures: Failure[] = [];
  const tolerance = input.tolerances.identity_relative_tolerance;
  const h = input.constants_set.h_J_s.value;
  const c = input.constants_set.c_m_s.value;
  const alpha = input.constants_set.fine_structure_alpha.value;
  const electronMass = input.constants_set.electron_rest_mass_kg.value;
  const hbar = h / (2 * Math.PI);

  addFailure(
    failures,
    !input.authority_receipt.integrity_verified ||
      input.authority_receipt.expected_sha256 !==
        input.authority_receipt.actual_sha256,
    "QSH_SOURCE_INTEGRITY_FAILED",
    "authority_receipt",
    "The CODATA authority receipt is missing or does not reproduce.",
  );
  addFailure(
    failures,
    h !== 6.62607015e-34 || c !== 299792458,
    "QSH_SI_EXACT_CONSTANT_MISMATCH",
    "constants_set",
    "The Stage-4.1 authority must use the exact SI values of h and c.",
  );
  addFailure(
    failures,
    input.constants_set.fine_structure_alpha.regime !==
      "zero_momentum_low_energy_codata",
    "QSH_ALPHA_REGIME_UNSUPPORTED",
    "constants_set.fine_structure_alpha.regime",
    "The calibration admits only the CODATA low-energy fine-structure coupling.",
  );
  const adjustedQuantities = [
    input.constants_set.fine_structure_alpha,
    input.constants_set.electron_rest_mass_kg,
    ...Object.values(input.constants_set.references),
  ];
  const literalMetadataValid =
    Number(input.constants_set.h_J_s.literal_text) === h &&
    Number(input.constants_set.c_m_s.literal_text) === c &&
    adjustedQuantities.every((quantity) =>
      Number(quantity.literal_text) === quantity.value &&
      Number(quantity.standard_uncertainty_literal_text) ===
        quantity.standard_uncertainty
    ) &&
    Number(input.reduced_mass_case.ratio_literal_text) ===
      input.reduced_mass_case.nucleus_to_electron_mass_ratio &&
    Number(
      input.reduced_mass_case
        .ratio_standard_uncertainty_literal_text,
    ) === input.reduced_mass_case.ratio_standard_uncertainty;
  addFailure(
    failures,
    !literalMetadataValid,
    "QSH_LITERAL_PRECISION_METADATA_INVALID",
    "constants_set",
    "Decimal literal metadata must reproduce every source value and printed uncertainty.",
  );
  const relativeUncertaintyMetadataValid =
    adjustedQuantities.every((quantity) =>
      relativeError(
        quantity.relative_uncertainty,
        quantity.standard_uncertainty / quantity.value,
      ) <= 1e-15
    );
  addFailure(
    failures,
    !relativeUncertaintyMetadataValid,
    "QSH_UNCERTAINTY_METADATA_INVALID",
    "constants_set",
    "Relative uncertainties must be derived from the authoritative absolute uncertainty and value.",
  );

  const covariance = validateRelativeCovariance(
    input.uncertainty_model,
    [
      input.constants_set.fine_structure_alpha
        .relative_uncertainty,
      input.constants_set.electron_rest_mass_kg
        .relative_uncertainty,
      input.reduced_mass_case.ratio_standard_uncertainty /
        input.reduced_mass_case.nucleus_to_electron_mass_ratio,
    ],
    input.tolerances.covariance_symmetry_tolerance,
    input.tolerances.covariance_psd_tolerance,
  );
  addFailure(
    failures,
    covariance.gate !== "pass",
    "QSH_UNCERTAINTY_COVARIANCE_INVALID",
    "uncertainty_model.relative_covariance",
    "A supplied relative covariance matrix must match the declared standard uncertainties, normalize to bounded correlations, and be symmetric positive semidefinite.",
  );

  const restEnergy = electronMass * c * c;
  const comptonFrequency = restEnergy / h;
  const comptonAngularFrequency = restEnergy / hbar;
  const comptonWavelength = h / (electronMass * c);
  const reducedComptonWavelength = hbar / (electronMass * c);
  const bohrRadius = reducedComptonWavelength / alpha;
  const classicalElectronRadius = alpha * reducedComptonWavelength;
  const rydbergFromMass =
    alpha * alpha * electronMass * c / (2 * h);
  const rydbergFromCompton =
    alpha * alpha / (2 * comptonWavelength);
  const rydbergFromReducedCompton =
    alpha * alpha / (4 * Math.PI * reducedComptonWavelength);
  const rydbergFromBohr =
    alpha / (4 * Math.PI * bohrRadius);
  const rydbergFrequency = c * rydbergFromMass;
  const rydbergEnergy = h * rydbergFrequency;
  const hartreeFromMass = alpha * alpha * electronMass * c * c;
  const hartreeFromRydberg = 2 * h * c * rydbergFromMass;

  const hbarResidual = relativeError(hbar, h / (2 * Math.PI));
  const comptonConventionResiduals = {
    ordinary_vs_reduced_2pi: relativeError(
      comptonWavelength,
      2 * Math.PI * reducedComptonWavelength,
    ),
    frequency_vs_wavelength: relativeError(
      comptonFrequency,
      c / comptonWavelength,
    ),
    angular_vs_reduced_wavelength: relativeError(
      comptonAngularFrequency,
      c / reducedComptonWavelength,
    ),
    angular_vs_cyclic_2pi: relativeError(
      comptonAngularFrequency,
      2 * Math.PI * comptonFrequency,
    ),
  };
  const energyFrequencyResiduals = {
    h_nu_vs_rest_energy: relativeError(
      h * comptonFrequency,
      restEnergy,
    ),
    hbar_omega_vs_rest_energy: relativeError(
      hbar * comptonAngularFrequency,
      restEnergy,
    ),
  };
  const bohrResidual = relativeError(
    bohrRadius,
    hbar / (alpha * electronMass * c),
  );
  const classicalRadiusResiduals = {
    alpha_lambda_bar: relativeError(
      classicalElectronRadius,
      alpha * reducedComptonWavelength,
    ),
    alpha_squared_a0: relativeError(
      classicalElectronRadius,
      alpha * alpha * bohrRadius,
    ),
  };
  const rydbergResiduals = {
    mass_vs_compton: relativeError(
      rydbergFromMass,
      rydbergFromCompton,
    ),
    mass_vs_reduced_compton: relativeError(
      rydbergFromMass,
      rydbergFromReducedCompton,
    ),
    mass_vs_bohr: relativeError(
      rydbergFromMass,
      rydbergFromBohr,
    ),
    frequency_ratio: relativeError(
      rydbergFrequency / comptonFrequency,
      alpha * alpha / 2,
    ),
  };
  const hartreeResiduals = {
    mass_vs_rydberg: relativeError(
      hartreeFromMass,
      hartreeFromRydberg,
    ),
    rydberg_energy_is_half_hartree: relativeError(
      rydbergEnergy,
      hartreeFromMass / 2,
    ),
  };
  const hierarchyResiduals = {
    a0_over_reduced_compton: relativeError(
      bohrRadius / reducedComptonWavelength,
      1 / alpha,
    ),
    inverse_rydberg_over_compton: relativeError(
      (1 / rydbergFromMass) / comptonWavelength,
      2 / (alpha * alpha),
    ),
    inverse_rydberg_over_bohr: relativeError(
      (1 / rydbergFromMass) / bohrRadius,
      4 * Math.PI / alpha,
    ),
    rydberg_frequency_over_compton: relativeError(
      rydbergFrequency / comptonFrequency,
      alpha * alpha / 2,
    ),
  };

  addFailure(
    failures,
    hbarResidual > tolerance,
    "QSH_HBAR_2PI_MISMATCH",
    "conventions.hbar",
    "hbar must equal h/(2*pi).",
  );
  addFailure(
    failures,
    maximum(Object.values(comptonConventionResiduals)) > tolerance,
    "QSH_COMPTON_CONVENTION_MISMATCH",
    "conventions.compton",
    "Ordinary/reduced wavelength and cyclic/angular frequency conventions do not close.",
  );
  addFailure(
    failures,
    maximum(Object.values(energyFrequencyResiduals)) > tolerance,
    "QSH_COMPTON_ENERGY_FREQUENCY_MISMATCH",
    "electron_scales.rest_energy",
    "E=m_e*c^2=h*nu_C=hbar*omega_C does not close.",
  );
  addFailure(
    failures,
    bohrResidual > tolerance,
    "QSH_BOHR_LENGTH_IDENTITY_FAILED",
    "electron_scales.bohr_radius_m",
    "a_0=lambda_bar_C/alpha_fs does not close.",
  );
  addFailure(
    failures,
    maximum(Object.values(classicalRadiusResiduals)) > tolerance,
    "QSH_CLASSICAL_RADIUS_IDENTITY_FAILED",
    "electron_scales.classical_electron_radius_m",
    "r_e=alpha_fs*lambda_bar_C=alpha_fs^2*a_0 does not close.",
  );
  addFailure(
    failures,
    maximum(Object.values(rydbergResiduals)) > tolerance,
    "QSH_RYDBERG_IDENTITY_FAILED",
    "electron_scales.rydberg_constant_m_inv",
    "The three Rydberg representations do not close.",
  );
  addFailure(
    failures,
    maximum(Object.values(hartreeResiduals)) > tolerance,
    "QSH_HARTREE_RYDBERG_IDENTITY_FAILED",
    "electron_scales.hartree_energy_J",
    "E_h=2*h*c*R_infinity and E_Ry=E_h/2 do not close.",
  );
  addFailure(
    failures,
    maximum(Object.values(hierarchyResiduals)) > tolerance,
    "QSH_SCALE_HIERARCHY_FAILED",
    "hierarchy",
    "One or more dimensionless QED scale ratios failed.",
  );

  const references = input.constants_set.references;
  const alphaMass = {
    fine_structure_alpha: 2,
    electron_rest_mass_kg: 1,
    nucleus_to_electron_mass_ratio: 0,
  } satisfies RelativeExponentVector;
  const inverseMass = {
    ...zeroExponentVector(),
    electron_rest_mass_kg: -1,
  };
  const inverseAlphaMass = {
    fine_structure_alpha: -1,
    electron_rest_mass_kg: -1,
    nucleus_to_electron_mass_ratio: 0,
  } satisfies RelativeExponentVector;
  const alphaInverseMass = {
    fine_structure_alpha: 1,
    electron_rest_mass_kg: -1,
    nucleus_to_electron_mass_ratio: 0,
  } satisfies RelativeExponentVector;
  const referenceAgreement = [
    referenceRow({
      quantity_id: "electron_compton_wavelength_m",
      computed: comptonWavelength,
      reference: references.electron_compton_wavelength_m,
      exponents: inverseMass,
      input,
    }),
    referenceRow({
      quantity_id: "electron_reduced_compton_wavelength_m",
      computed: reducedComptonWavelength,
      reference: references.electron_reduced_compton_wavelength_m,
      exponents: inverseMass,
      input,
    }),
    referenceRow({
      quantity_id: "bohr_radius_m",
      computed: bohrRadius,
      reference: references.bohr_radius_m,
      exponents: inverseAlphaMass,
      input,
    }),
    referenceRow({
      quantity_id: "classical_electron_radius_m",
      computed: classicalElectronRadius,
      reference: references.classical_electron_radius_m,
      exponents: alphaInverseMass,
      input,
    }),
    referenceRow({
      quantity_id: "rydberg_constant_m_inv",
      computed: rydbergFromMass,
      reference: references.rydberg_constant_m_inv,
      exponents: alphaMass,
      input,
    }),
    referenceRow({
      quantity_id: "rydberg_frequency_Hz",
      computed: rydbergFrequency,
      reference: references.rydberg_frequency_Hz,
      exponents: alphaMass,
      input,
    }),
    referenceRow({
      quantity_id: "rydberg_energy_J",
      computed: rydbergEnergy,
      reference: references.rydberg_energy_J,
      exponents: alphaMass,
      input,
    }),
    referenceRow({
      quantity_id: "hartree_energy_J",
      computed: hartreeFromMass,
      reference: references.hartree_energy_J,
      exponents: alphaMass,
      input,
    }),
  ];
  addFailure(
    failures,
    referenceAgreement.some((row) => row.gate !== "pass"),
    "QSH_CODATA_REFERENCE_OUTSIDE_ENVELOPE",
    "constants_set.references",
    "A computed scale falls outside the conservative CODATA rounding/uncertainty envelope.",
  );

  const reduced = input.reduced_mass_case;
  addFailure(
    failures,
    reduced.mass_semantics !== "bare_nucleus_over_electron",
    "QSH_NUCLEAR_MASS_SEMANTICS_INVALID",
    "reduced_mass_case.mass_semantics",
    "Reduced mass requires a bare-nucleus/electron mass ratio.",
  );
  const q = reduced.nucleus_to_electron_mass_ratio;
  const reducedMassRatio = q / (1 + q);
  const reducedMass = electronMass * reducedMassRatio;
  const reducedRydberg = rydbergFromMass * reducedMassRatio;
  const reducedBohrRadius = bohrRadius / reducedMassRatio;
  const hydrogenicOrbitalScale =
    reducedBohrRadius / reduced.atomic_number_Z;
  const levelEnergy = (principalN: number): number =>
    -h * c * reducedRydberg *
      reduced.atomic_number_Z ** 2 /
      principalN ** 2;
  const initialEnergy = levelEnergy(reduced.initial_n);
  const finalEnergy = levelEnergy(reduced.final_n);
  const transitionEnergy = Math.abs(finalEnergy - initialEnergy);
  const transitionFrequency =
    c * reducedRydberg * reduced.atomic_number_Z ** 2 *
    Math.abs(
      1 / reduced.final_n ** 2 -
      1 / reduced.initial_n ** 2,
    );
  const reducedMassRatioLogQExponent = 1 / (1 + q);
  const transitionUncertainty = propagatedRelativeUncertainty(
    {
      fine_structure_alpha: 2,
      electron_rest_mass_kg: 1,
      nucleus_to_electron_mass_ratio:
        reducedMassRatioLogQExponent,
    },
    input,
  );
  const reducedMassResiduals = {
    mass_ratio: relativeError(
      reducedMass / electronMass,
      reducedMassRatio,
    ),
    rydberg_scale: relativeError(
      reducedRydberg / rydbergFromMass,
      reducedMassRatio,
    ),
    bohr_scale: relativeError(
      reducedBohrRadius / bohrRadius,
      1 / reducedMassRatio,
    ),
  };
  const transitionResiduals = {
    energy_frequency: relativeError(
      transitionEnergy,
      h * transitionFrequency,
    ),
    level_difference: relativeError(
      transitionFrequency,
      Math.abs(finalEnergy - initialEnergy) / h,
    ),
  };
  addFailure(
    failures,
    maximum(Object.values(reducedMassResiduals)) > tolerance,
    "QSH_REDUCED_MASS_CLOSURE_FAILED",
    "reduced_mass",
    "The leading reduced-mass scaling does not close.",
  );
  addFailure(
    failures,
    maximum(Object.values(transitionResiduals)) > tolerance,
    "QSH_LEADING_TRANSITION_CLOSURE_FAILED",
    "reduced_mass.leading_transition",
    "The leading hydrogenic energy/frequency/wavenumber forms do not close.",
  );

  addFailure(
    failures,
    input.precision_scope.precision_spectroscopy_claimed ||
      input.precision_scope.independent_empirical_validation_claimed,
    "QSH_PRECISION_SCOPE_OVERCLAIM",
    "precision_scope",
    "Leading scale calibration cannot claim precision spectroscopy or independent empirical validation.",
  );

  const orderedFailures = sortedFailures(failures);
  const identityFailureCodes = new Set<
    CasimirDpQedScaleHierarchyFailureCode
  >([
    "QSH_HBAR_2PI_MISMATCH",
    "QSH_COMPTON_CONVENTION_MISMATCH",
    "QSH_COMPTON_ENERGY_FREQUENCY_MISMATCH",
    "QSH_BOHR_LENGTH_IDENTITY_FAILED",
    "QSH_CLASSICAL_RADIUS_IDENTITY_FAILED",
    "QSH_RYDBERG_IDENTITY_FAILED",
    "QSH_HARTREE_RYDBERG_IDENTITY_FAILED",
    "QSH_SCALE_HIERARCHY_FAILED",
  ]);
  const reducedMassFailureCodes = new Set<
    CasimirDpQedScaleHierarchyFailureCode
  >([
    "QSH_NUCLEAR_MASS_SEMANTICS_INVALID",
    "QSH_REDUCED_MASS_CLOSURE_FAILED",
    "QSH_LEADING_TRANSITION_CLOSURE_FAILED",
  ]);
  const hasIdentityFailure = orderedFailures.some((row) =>
    identityFailureCodes.has(row.code)
  );
  const hasReducedMassFailure = orderedFailures.some((row) =>
    reducedMassFailureCodes.has(row.code)
  );
  const sourceIntegrityGate = orderedFailures.some((row) =>
      row.code === "QSH_SOURCE_INTEGRITY_FAILED"
    )
    ? "blocked" as const
    : "pass" as const;
  const covarianceGate = covariance.gate;
  const referenceGate = referenceAgreement.every((row) =>
      row.gate === "pass"
    )
    ? "pass" as const
    : "blocked" as const;
  const identityGate = hasIdentityFailure
    ? "blocked" as const
    : "pass" as const;
  const reducedMassGate = hasReducedMassFailure
    ? "blocked" as const
    : "pass" as const;
  const status = orderedFailures.length === 0
    ? "pass" as const
    : "blocked" as const;

  return {
    schema_version:
      "casimir_dp_qed_scale_hierarchy_calibration_result/1" as const,
    calibration_id: input.calibration_id,
    evidence_class: input.evidence_class,
    claim_ceiling: input.claim_ceiling,
    status,
    first_failure_code: orderedFailures[0]?.code ?? null,
    failures: orderedFailures,
    authority: {
      ...input.authority_receipt,
      gate: sourceIntegrityGate,
    },
    symbol_registry: {
      ...input.symbol_registry,
      gate: "pass" as const,
      interpretation:
        "alpha_fs is dimensionless electromagnetic coupling; alpha_pol_ij is a dimensionful polarizability tensor; alpha_stat is a statistical level; c_A and c_B are branch amplitudes.",
    },
    conventions: {
      hbar_J_s: hbar,
      electron_compton_wavelength_m: comptonWavelength,
      electron_reduced_compton_wavelength_m:
        reducedComptonWavelength,
      compton_2pi_relative_error:
        comptonConventionResiduals.ordinary_vs_reduced_2pi,
      hbar_2pi_relative_error: hbarResidual,
      cyclic_angular_relative_error:
        comptonConventionResiduals.angular_vs_cyclic_2pi,
      maximum_relative_error: maximum([
        hbarResidual,
        ...Object.values(comptonConventionResiduals),
      ]),
      gate:
        hbarResidual <= tolerance &&
          maximum(Object.values(comptonConventionResiduals)) <= tolerance
          ? "pass" as const
          : "blocked" as const,
    },
    electron_scales: {
      rest_energy_J: restEnergy,
      compton_frequency_Hz: comptonFrequency,
      compton_angular_frequency_rad_s: comptonAngularFrequency,
      electron_compton_wavelength_m: comptonWavelength,
      electron_reduced_compton_wavelength_m:
        reducedComptonWavelength,
      bohr_radius_m: bohrRadius,
      classical_electron_radius_m: classicalElectronRadius,
      rydberg_constant_m_inv: rydbergFromMass,
      rydberg_frequency_Hz: rydbergFrequency,
      rydberg_energy_J: rydbergEnergy,
      hartree_energy_J: hartreeFromMass,
    },
    algebraic_closure: {
      energy_frequency_relative_errors: energyFrequencyResiduals,
      bohr_length_relative_error: bohrResidual,
      classical_radius_relative_errors: classicalRadiusResiduals,
      rydberg_relative_errors: rydbergResiduals,
      hartree_rydberg_relative_errors: hartreeResiduals,
      maximum_relative_error: maximum([
        ...Object.values(energyFrequencyResiduals),
        bohrResidual,
        ...Object.values(classicalRadiusResiduals),
        ...Object.values(rydbergResiduals),
        ...Object.values(hartreeResiduals),
      ]),
      tolerance,
      gate: identityGate,
    },
    hierarchy: {
      a0_over_reduced_compton:
        bohrRadius / reducedComptonWavelength,
      inverse_rydberg_over_compton:
        (1 / rydbergFromMass) / comptonWavelength,
      inverse_rydberg_over_bohr:
        (1 / rydbergFromMass) / bohrRadius,
      rydberg_frequency_over_compton_frequency:
        rydbergFrequency / comptonFrequency,
      expected: {
        alpha_fs_inverse: 1 / alpha,
        two_over_alpha_fs_squared: 2 / (alpha * alpha),
        four_pi_over_alpha_fs: 4 * Math.PI / alpha,
        alpha_fs_squared_over_two: alpha * alpha / 2,
      },
      relative_errors: hierarchyResiduals,
      maximum_relative_error: maximum(
        Object.values(hierarchyResiduals),
      ),
      gate:
        maximum(Object.values(hierarchyResiduals)) <= tolerance
          ? "pass" as const
          : "blocked" as const,
    },
    uncertainty: {
      base_relative_covariance_status:
        input.uncertainty_model.status,
      base_relative_covariance_supplied: covariance.supplied,
      covariance_symmetric: covariance.symmetric,
      covariance_diagonal_matches_declared_uncertainties:
        covariance.diagonal_matches_declared_uncertainties,
      covariance_correlations_within_bounds:
        covariance.correlations_within_bounds,
      covariance_positive_semidefinite:
        covariance.positive_semidefinite,
      covariance_minimum_principal_minor:
        covariance.minimum_principal_minor,
      covariance_gate: covarianceGate,
      derived_reference_cross_covariance:
        input.uncertainty_model
          .derived_reference_cross_covariance,
      reference_significance:
        "not_computable_without_cross_covariance" as const,
      fallback_uncertainty_policy:
        input.uncertainty_model.fallback_uncertainty_policy,
      rounding_policy:
        "reference_value_plus_standard_uncertainty_plus_half_last_digit_resolution" as const,
    },
    codata_reference_agreement: {
      rows: referenceAgreement,
      comparison_kind:
        "tabulation_and_rounding_consistency_not_independent_test" as const,
      uncertainty_multiplier:
        input.tolerances.reference_uncertainty_multiplier,
      gate: referenceGate,
    },
    reduced_mass: {
      case_id: reduced.case_id,
      atomic_number_Z: reduced.atomic_number_Z,
      nucleus_to_electron_mass_ratio: q,
      reduced_mass_over_electron_mass: reducedMassRatio,
      reduced_mass_kg: reducedMass,
      reduced_mass_rydberg_m_inv: reducedRydberg,
      reduced_mass_bohr_radius_m: reducedBohrRadius,
      hydrogenic_orbital_scale_m: hydrogenicOrbitalScale,
      initial_n: reduced.initial_n,
      final_n: reduced.final_n,
      initial_level_energy_J: initialEnergy,
      final_level_energy_J: finalEnergy,
      leading_transition_energy_J: transitionEnergy,
      leading_transition_frequency_Hz: transitionFrequency,
      leading_transition_relative_standard_uncertainty:
        transitionUncertainty.relative_standard_uncertainty,
      leading_transition_absolute_standard_uncertainty_Hz:
        transitionFrequency *
        transitionUncertainty.relative_standard_uncertainty,
      uncertainty_propagation_method:
        transitionUncertainty.method,
      infinite_mass_fractional_shift:
        1 - reducedMassRatio,
      closure_relative_errors: {
        ...reducedMassResiduals,
        ...transitionResiduals,
      },
      maximum_closure_relative_error: maximum([
        ...Object.values(reducedMassResiduals),
        ...Object.values(transitionResiduals),
      ]),
      gate: reducedMassGate,
      interpretation:
        "leading_nonrelativistic_reduced_mass_not_precision_hydrogen_spectroscopy",
    },
    precision_scope: {
      ...input.precision_scope,
      correction_ledger_complete_for_declared_level: true,
      precision_spectroscopy_gate: "not_ready" as const,
      independent_empirical_validation:
        "not_evaluated" as const,
    },
    semantic_non_bridge: {
      relationship:
        "algebraic_identity_within_explicit_coulomb_dirac_qed_scale_family" as const,
      modifies_stage4_frequency_non_bridge: false as const,
      sourced_casimir_dp_transfer_kernel_present: false as const,
      stage4_frequency_status:
        "same_dimension_not_connected" as const,
      maximum_claim:
        "same_identity_family_not_collapse_bridge" as const,
    },
    final_gates: {
      software_identity_calibration: status,
      source_authority_integrity: sourceIntegrityGate,
      algebraic_identity_closure: identityGate,
      codata_tabulation_consistency: referenceGate,
      covariance_semantics: covarianceGate,
      leading_reduced_mass_closure: reducedMassGate,
      measured_evidence: "not_ready" as const,
      apparatus_material_response: "not_ready" as const,
      ordinary_physics_apparatus_closure: "not_ready" as const,
      precision_spectroscopy: "not_ready" as const,
      independent_empirical_validation: "not_evaluated" as const,
      polarization_or_helicity_model: "not_evaluated" as const,
      casimir_to_atomic_transfer: "blocked" as const,
      atomic_to_dp_transfer: "blocked" as const,
      compton_to_collapse_clock: "blocked" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      physical_viability: "not_evaluated" as const,
      publication_claim:
        "diagnostic_constants_calibration_only" as const,
    },
    promotion_allowed: false as const,
    claim_boundaries: [
      "The Compton-to-Rydberg relation is admitted because an explicit Coulomb/Dirac-QED scale derivation supplies the dynamics; equal dimensions alone would not be enough.",
      "The fine-structure constant is an electromagnetic coupling, not a universal photon-emission probability.",
      "CODATA reference agreement is a correlated tabulation and rounding consistency check, not independent empirical validation.",
      "The leading reduced-mass hydrogenic result omits precision spectroscopy corrections listed in the correction ledger.",
      "The calibration contains no circular-polarization, material-response, Casimir, DP, collapse, resonance, transfer-kernel, or manifold model.",
      "Stage-4 remains immutable and its Compton/DP/cavity result remains same_dimension_not_connected.",
    ],
  };
}

export type CasimirDpQedScaleHierarchyCalibrationResult = ReturnType<
  typeof evaluateCasimirDpQedScaleHierarchyCalibration
>;
