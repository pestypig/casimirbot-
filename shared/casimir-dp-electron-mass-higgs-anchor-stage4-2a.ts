// math-stage: diagnostic
import { z } from "zod";

export const CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_INPUT_VERSION =
  "casimir_dp_electron_mass_higgs_anchor_stage4_2a_input/1" as const;

export const CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_RESULT_VERSION =
  "casimir_dp_electron_mass_higgs_anchor_stage4_2a_result/1" as const;

export const CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_FAILURE_ORDER = [
  "EMH_FORBIDDEN_BRIDGE_FIELD",
  "EMH_SOURCE_PROVENANCE_INVALID",
  "EMH_CORRECTION_LEDGER_INVALID",
  "EMH_GAMMA_CORRECTION_REPLAY_FAILED",
  "EMH_OBSERVATIONAL_EQUATION_FAILED",
  "EMH_PUBLISHED_MASS_REPLAY_FAILED",
  "EMH_CODATA_CORRELATION_POLICY_INVALID",
  "EMH_CONVERSION_CLOSURE_FAILED",
  "EMH_FERMI_SCALE_FAILED",
  "EMH_TREE_YUKAWA_FAILED",
  "EMH_PRECISION_MATCHING_OVERCLAIM",
  "EMH_COLLIDER_BOUNDARY_FAILED",
  "EMH_ZERO_V_DOMAIN_EXIT_FAILED",
  "EMH_NONBRIDGE_POLICY_FAILED",
] as const;

export type CasimirDpElectronMassHiggsAnchorStage4_2AFailureCode =
  typeof CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_FAILURE_ORDER[number];

const NonEmpty = z.string().min(1);
const Finite = z.number().finite();
const PositiveFinite = Finite.positive();
const NonnegativeFinite = Finite.nonnegative();

const SourceReference = z.object({
  source_id: NonEmpty,
  citation: NonEmpty,
  url: z.string().url(),
  supports: NonEmpty,
  does_not_support: NonEmpty,
}).strict();

const PenningCorrection = z.object({
  correction_id: z.enum([
    "image_charge",
    "line_shape_dip",
    "magnetron_frequency",
    "second_pna_dipole",
    "axial_frequency_drift",
    "motional_magnetic_field",
    "image_current",
    "electric_c4",
    "gamma_lineshape_asymmetry",
    "magnetic_b2",
    "gaussian_lineshape_fit",
    "electric_c6",
    "residual_special_relativity",
  ]),
  relative_shift_ppt: Finite,
  relative_standard_uncertainty_ppt: NonnegativeFinite,
  uncertainty_semantics: z.enum([
    "standard",
    "upper_bound",
    "negligible_upper_bound",
  ]),
}).strict();

const IonizationEnergy = z.object({
  electron_index: z.number().int().min(1).max(5),
  energy_eV: PositiveFinite,
  standard_uncertainty_eV: NonnegativeFinite,
}).strict();

const ReferenceValue = z.object({
  value: PositiveFinite,
  standard_uncertainty: NonnegativeFinite,
  rounding_resolution: PositiveFinite,
}).strict();

export const CasimirDpElectronMassHiggsAnchorStage4_2AInput = z.object({
  schema_version: z.literal(
    CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_INPUT_VERSION,
  ),
  calibration_id: z.literal(
    "stage4-2a-electron-mass-higgs-anchor-v1",
  ),
  evidence_class: z.literal("source_backed_calculation"),
  claim_ceiling: z.literal(
    "electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only",
  ),
  promotion_allowed: z.literal(false),
  source_registry: z.array(SourceReference).length(5),
  penning_replay: z.object({
    experiment_id: z.literal("koehler_2015_carbon_12_c5_corrected"),
    selected_publication_state: z.literal(
      "detailed_corrected_analysis_supersedes_original_image_current_sign",
    ),
    species: z.literal("12C5+"),
    charge_state_abs_e: z.literal(5),
    frequency_ratio_symbol: z.literal("Gamma"),
    frequency_ratio_definition: z.literal("omega_L_over_omega_c"),
    observational_equation: z.literal(
      "m_e=(|g_b|/2)(|e|/|q|)(omega_c/omega_L)m_ion",
    ),
    gamma_statistical: PositiveFinite,
    gamma_corrected: PositiveFinite,
    gamma_statistical_standard_uncertainty: PositiveFinite,
    gamma_systematic_standard_uncertainty: PositiveFinite,
    published_total_relative_shift_ppt: Finite,
    correction_rounding_resolution_ppt: PositiveFinite,
    corrections: z.array(PenningCorrection).length(13),
    bound_state_qed: z.object({
      g_factor_abs: PositiveFinite,
      g_factor_abs_standard_uncertainty: PositiveFinite,
      framework: z.literal("bound_state_qed"),
      recoil_included: z.boolean(),
      finite_nuclear_size_included: z.boolean(),
      higher_order_two_loop_estimate_included: z.boolean(),
      value_is_source_specific_final_value: z.boolean(),
    }).strict(),
    ion_mass_ledger: z.object({
      neutral_carbon_relative_mass_u: z.literal(12),
      neutral_carbon_mass_is_exact_in_source_epoch: z.boolean(),
      removed_electron_count: z.literal(5),
      ionization_energies: z.array(IonizationEnergy).length(5),
      published_total_binding_energy_eV: PositiveFinite,
      published_total_binding_energy_standard_uncertainty_eV:
        PositiveFinite,
      source_epoch_atomic_mass_energy_equivalent_eV: PositiveFinite,
      source_epoch_atomic_mass_energy_standard_uncertainty_eV:
        PositiveFinite,
      published_ion_relative_mass_u: PositiveFinite,
      published_ion_relative_mass_standard_uncertainty_u:
        PositiveFinite,
      self_consistent_electron_mass_dependence_included: z.boolean(),
    }).strict(),
    published_result: z.object({
      A_r_e: PositiveFinite,
      statistical_standard_uncertainty: PositiveFinite,
      systematic_standard_uncertainty: PositiveFinite,
      theory_standard_uncertainty: PositiveFinite,
    }).strict(),
  }).strict(),
  codata_conversions: z.object({
    adjustment_id: z.literal("CODATA-2022"),
    source_overlap_class: z.enum([
      "shared_adjustment_ancestor_not_independent",
      "independent",
    ]),
    cross_covariance_status: z.enum(["not_supplied", "supplied"]),
    independence_significance_status: z.enum([
      "not_computable_without_cross_covariance",
      "computable",
    ]),
    independent_confirmation_claimed: z.boolean(),
    conversion_semantics: z.enum([
      "deterministic_fully_correlated_views",
      "independent_measurements",
    ]),
    atomic_mass_constant_kg: z.object({
      value: PositiveFinite,
      standard_uncertainty: PositiveFinite,
    }).strict(),
    exact_si: z.object({
      c_m_s: z.literal(299792458),
      h_J_s: z.literal(6.62607015e-34),
      elementary_charge_C: z.literal(1.602176634e-19),
    }).strict(),
    alpha_fs_zero_momentum: z.object({
      value: PositiveFinite,
      standard_uncertainty: PositiveFinite,
    }).strict(),
    references: z.object({
      A_r_e: ReferenceValue,
      m_e_OS_kg: ReferenceValue,
      E_e_OS_J: ReferenceValue,
      E_e_OS_MeV: ReferenceValue,
    }).strict(),
  }).strict(),
  electroweak_tree_mapping: z.object({
    unit_convention: z.literal("natural_energy_hbar_c_equal_1"),
    fermi_constant_GeV_minus2: PositiveFinite,
    fermi_constant_standard_uncertainty_GeV_minus2:
      PositiveFinite,
    fermi_scale_definition: z.literal(
      "v_F=(sqrt(2)*G_F)^(-1/2)",
    ),
    reference_v_F_tree_GeV: PositiveFinite,
    lagrangian_convention: z.literal(
      "L_Y=-y_e*bar(L_e)*Phi*e_R+h.c.;<Phi>=(0,v_F/sqrt(2))",
    ),
    mass_relation: z.literal(
      "m_e*c^2=y_e_lagrangian_tree*v_F_tree/sqrt(2)",
    ),
    vertex_relation: z.literal(
      "g_h_e_e_tree=m_e*c^2/v_F_tree=y_e_lagrangian_tree/sqrt(2)",
    ),
    inferred_tree_value_is_direct_measurement: z.boolean(),
    extra_c_squared_factor_applied: z.boolean(),
    precision_matching: z.object({
      status: z.enum(["not_supplied", "supplied"]),
      mu_GeV: PositiveFinite.nullable(),
      scheme: NonEmpty.nullable(),
      tadpole_prescription: NonEmpty.nullable(),
      qed_electroweak_matching: NonEmpty.nullable(),
      perturbative_order: NonEmpty.nullable(),
      running_value_claimed: z.boolean(),
    }).strict(),
  }).strict(),
  collider_lane: z.object({
    source_id: z.literal("cms_hig_21_015"),
    channel: z.literal("H_to_e_plus_e_minus"),
    branching_fraction_upper_limit: PositiveFinite,
    confidence_level: z.number().min(0).max(1),
    result_kind: z.enum(["upper_bound_only", "observation"]),
    direct_observation_claimed: z.boolean(),
    naive_coupling_modifier_reconstruction_authorized: z.boolean(),
    standard_model_tree_anchor_excluded: z.boolean(),
  }).strict(),
  formal_zero_v_limit: z.object({
    enabled: z.boolean(),
    fixed_lagrangian_yukawa: z.boolean(),
    experimental_switch: z.boolean(),
    domain_exit_required: z.boolean(),
    unchanged_low_energy_model_extrapolation_allowed: z.boolean(),
  }).strict(),
  nonbridge_policy: z.object({
    observable_bridge_edges_allowed: z.boolean(),
    shared_energy_units_create_causal_edge: z.boolean(),
    mass_frequency_identity_is_new_dynamics: z.boolean(),
    vacuum_word_equivalence_allowed: z.boolean(),
  }).strict(),
  tolerances: z.object({
    source_numeric_relative_tolerance: PositiveFinite,
    gamma_shift_rounding_tolerance_ppt: PositiveFinite,
    systematic_budget_tolerance_ppt: PositiveFinite,
    mass_replay_uncertainty_multiplier: PositiveFinite,
    correlated_comparison_uncertainty_multiplier: PositiveFinite,
    identity_relative_tolerance: PositiveFinite,
    fermi_scale_absolute_tolerance_GeV: PositiveFinite,
  }).strict(),
}).strict().superRefine((input, context) => {
  const correctionIds = input.penning_replay.corrections.map(
    (row) => row.correction_id,
  );
  if (new Set(correctionIds).size !== correctionIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["penning_replay", "corrections"],
      message: "Penning correction ids must be unique.",
    });
  }
  const electronIndices = input.penning_replay.ion_mass_ledger
    .ionization_energies.map((row) => row.electron_index);
  if (new Set(electronIndices).size !== electronIndices.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [
        "penning_replay",
        "ion_mass_ledger",
        "ionization_energies",
      ],
      message: "Ionization-energy electron indices must be unique.",
    });
  }
});

export type CasimirDpElectronMassHiggsAnchorStage4_2AInput = z.infer<
  typeof CasimirDpElectronMassHiggsAnchorStage4_2AInput
>;

type Failure = {
  code: CasimirDpElectronMassHiggsAnchorStage4_2AFailureCode;
  path: string;
  message: string;
};

type ComparisonReference = {
  value: number;
  standard_uncertainty: number;
  rounding_resolution: number;
};

const PUBLISHED_CORRECTIONS = [
  ["image_charge", -282.4, 14.1, "standard"],
  ["line_shape_dip", 0, 5.2, "standard"],
  ["magnetron_frequency", 0, 3.2, "standard"],
  ["second_pna_dipole", 0, 3, "upper_bound"],
  ["axial_frequency_drift", 0, 1.2, "negligible_upper_bound"],
  ["motional_magnetic_field", 0, 0.8, "negligible_upper_bound"],
  ["image_current", -2.2, 0.55, "standard"],
  ["electric_c4", 0, 0.5, "standard"],
  ["gamma_lineshape_asymmetry", 0, 0.3, "standard"],
  ["magnetic_b2", 1.36, 0.27, "standard"],
  ["gaussian_lineshape_fit", 0, 0.1, "standard"],
  ["electric_c6", 0, 0.059, "standard"],
  ["residual_special_relativity", -0.042, 0.002, "standard"],
] as const;

const PUBLISHED_IONIZATION_ENERGIES = [
  [1, 11.2603, 0.001],
  [2, 24.3845, 0.0009],
  [3, 47.88778, 0.00012],
  [4, 64.49358, 0.00019],
  [5, 392.09049, 0.00003],
] as const;

const REQUIRED_SOURCE_URLS = new Map([
  [
    "koehler_2015_penning_detailed",
    "https://arxiv.org/abs/1604.04380",
  ],
  [
    "sturm_2014_nature",
    "https://doi.org/10.1038/nature13026",
  ],
  [
    "codata_2022",
    "https://physics.nist.gov/cuu/pdf/JPCRD2022CODATA.pdf",
  ],
  [
    "pdg_2025_higgs",
    "https://pdg.lbl.gov/2025/reviews/rpp2025-rev-higgs-boson.pdf",
  ],
  [
    "cms_hig_21_015",
    "https://cms-results.web.cern.ch/cms-results/public-results/publications/HIG-21-015/",
  ],
]);

const FORBIDDEN_INPUT_KEY =
  /(?:^|_)(?:cavity|casimir|diosi|dp|collapse|manifold|quantum_foam|resonance|polarization|transfer_kernel)(?:_|$)/iu;

function findForbiddenInputKey(
  value: unknown,
  path: string[] = [],
): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenInputKey(value[index], [
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
    if (FORBIDDEN_INPUT_KEY.test(key)) return childPath.join(".");
    const found = findForbiddenInputKey(child, childPath);
    if (found !== null) return found;
  }
  return null;
}

function relativeError(actual: number, expected: number): number {
  if (actual === expected) return 0;
  return Math.abs(actual - expected) /
    Math.max(Math.abs(actual), Math.abs(expected), Number.MIN_VALUE);
}

function addFailure(
  failures: Failure[],
  condition: boolean,
  code: CasimirDpElectronMassHiggsAnchorStage4_2AFailureCode,
  path: string,
  message: string,
): void {
  if (condition) failures.push({ code, path, message });
}

function sortedFailures(failures: Failure[]): Failure[] {
  const order = new Map(
    CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_FAILURE_ORDER.map(
      (code, index) => [code, index],
    ),
  );
  return [...failures].sort((left, right) => {
    const codeDifference =
      (order.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.code) ?? Number.MAX_SAFE_INTEGER);
    return codeDifference === 0
      ? left.path.localeCompare(right.path)
      : codeDifference;
  });
}

function closeEnough(
  actual: number,
  expected: number,
  relativeTolerance: number,
): boolean {
  return relativeError(actual, expected) <= relativeTolerance;
}

function quadrature(values: readonly number[]): number {
  return Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );
}

function comparisonRow(args: {
  quantity_id: "A_r_e" | "m_e_OS_kg" | "E_e_OS_J" | "E_e_OS_MeV";
  computed: number;
  computedStandardUncertainty: number;
  reference: ComparisonReference;
  multiplier: number;
}) {
  const absoluteDifference = Math.abs(
    args.computed - args.reference.value,
  );
  const acceptanceEnvelope = args.multiplier * (
    args.computedStandardUncertainty +
    args.reference.standard_uncertainty +
    args.reference.rounding_resolution / 2
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
    computed_standard_uncertainty:
      args.computedStandardUncertainty,
    reference_standard_uncertainty:
      args.reference.standard_uncertainty,
    reference_rounding_resolution:
      args.reference.rounding_resolution,
    acceptance_envelope: acceptanceEnvelope,
    independent_confirmation: false,
    significance: null,
    significance_status:
      "not_computable_without_cross_covariance" as const,
    correlation_class:
      "shared_adjustment_ancestor_and_deterministic_conversions" as const,
    gate:
      absoluteDifference <= acceptanceEnvelope
        ? "pass" as const
        : "blocked" as const,
  };
}

/**
 * Replays one published Penning-trap electron-mass inference and maps the
 * resulting rest-energy parameter into the explicitly tree-level Standard
 * Model convention. It is a diagnostic anchor: no cross-mechanism input is
 * admitted, and no blocked scientific identification is promoted by a pass.
 */
export function evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(
  rawInput: unknown,
) {
  const forbiddenPath = findForbiddenInputKey(rawInput);
  if (forbiddenPath !== null) {
    throw new Error(
      `EMH_FORBIDDEN_BRIDGE_FIELD:${forbiddenPath}`,
    );
  }

  const input = CasimirDpElectronMassHiggsAnchorStage4_2AInput.parse(
    rawInput,
  );
  const failures: Failure[] = [];
  const sourceTolerance =
    input.tolerances.source_numeric_relative_tolerance;
  const penning = input.penning_replay;
  const massLedger = penning.ion_mass_ledger;
  const theory = penning.bound_state_qed;

  const sourceMap = new Map(
    input.source_registry.map((source) => [
      source.source_id,
      source,
    ]),
  );
  const sourceRegistryPass =
    sourceMap.size === REQUIRED_SOURCE_URLS.size &&
    [...REQUIRED_SOURCE_URLS].every(([sourceId, url]) =>
      sourceMap.get(sourceId)?.url === url
    );
  addFailure(
    failures,
    !sourceRegistryPass,
    "EMH_SOURCE_PROVENANCE_INVALID",
    "source_registry",
    "The five frozen metrology, adjustment, electroweak, and collider source identities must reproduce.",
  );

  const correctionsById = new Map(
    penning.corrections.map((row) => [row.correction_id, row]),
  );
  const correctionRowsMatch =
    correctionsById.size === PUBLISHED_CORRECTIONS.length &&
    PUBLISHED_CORRECTIONS.every(
      ([correctionId, shift, uncertainty, semantics]) => {
        const row = correctionsById.get(correctionId);
        return row !== undefined &&
          closeEnough(
            row.relative_shift_ppt,
            shift,
            sourceTolerance,
          ) &&
          closeEnough(
            row.relative_standard_uncertainty_ppt,
            uncertainty,
            sourceTolerance,
          ) &&
          row.uncertainty_semantics === semantics;
      },
    );
  const correctionShiftPpt = penning.corrections.reduce(
    (sum, row) => sum + row.relative_shift_ppt,
    0,
  );
  const correctionUncertaintyPpt = quadrature(
    penning.corrections.map(
      (row) => row.relative_standard_uncertainty_ppt,
    ),
  );
  const reportedSystematicRelativePpt =
    penning.gamma_systematic_standard_uncertainty /
    penning.gamma_corrected * 1e12;
  const correctionAggregatePass =
    Math.abs(
      correctionShiftPpt -
      penning.published_total_relative_shift_ppt
    ) <= penning.correction_rounding_resolution_ppt &&
    Math.abs(
      correctionUncertaintyPpt - reportedSystematicRelativePpt
    ) <= input.tolerances.systematic_budget_tolerance_ppt;
  addFailure(
    failures,
    !correctionRowsMatch || !correctionAggregatePass,
    "EMH_CORRECTION_LEDGER_INVALID",
    "penning_replay.corrections",
    "The published systematic-shift rows, rounded total, and quadrature uncertainty must close.",
  );

  const gammaFromCorrectionRows =
    penning.gamma_statistical *
    (1 + correctionShiftPpt * 1e-12);
  const gammaFromPublishedTotal =
    penning.gamma_statistical *
    (
      1 +
      penning.published_total_relative_shift_ppt * 1e-12
    );
  const gammaRowResidualPpt =
    (
      gammaFromCorrectionRows - penning.gamma_corrected
    ) / penning.gamma_statistical * 1e12;
  const gammaPublishedResidualPpt =
    (
      gammaFromPublishedTotal - penning.gamma_corrected
    ) / penning.gamma_statistical * 1e12;
  const gammaSourceValuesPass =
    closeEnough(
      penning.gamma_statistical,
      4376.210502112,
      sourceTolerance,
    ) &&
    closeEnough(
      penning.gamma_corrected,
      4376.210500872,
      sourceTolerance,
    ) &&
    closeEnough(
      penning.gamma_statistical_standard_uncertainty,
      1.02e-7,
      sourceTolerance,
    ) &&
    closeEnough(
      penning.gamma_systematic_standard_uncertainty,
      6.9e-8,
      sourceTolerance,
    ) &&
    closeEnough(
      penning.published_total_relative_shift_ppt,
      -283.3,
      sourceTolerance,
    );
  const gammaCorrectionPass =
    gammaSourceValuesPass &&
    Math.abs(gammaRowResidualPpt) <=
      input.tolerances.gamma_shift_rounding_tolerance_ppt &&
    Math.abs(gammaPublishedResidualPpt) <=
      input.tolerances.gamma_shift_rounding_tolerance_ppt;
  addFailure(
    failures,
    !gammaCorrectionPass,
    "EMH_GAMMA_CORRECTION_REPLAY_FAILED",
    "penning_replay.gamma_corrected",
    "The corrected frequency ratio must reproduce from both the row ledger and the published rounded shift.",
  );

  const ionizationRowsByIndex = new Map(
    massLedger.ionization_energies.map((row) => [
      row.electron_index,
      row,
    ]),
  );
  const ionizationRowsMatch = PUBLISHED_IONIZATION_ENERGIES.every(
    ([electronIndex, energy, uncertainty]) => {
      const row = ionizationRowsByIndex.get(electronIndex);
      return row !== undefined &&
        closeEnough(row.energy_eV, energy, sourceTolerance) &&
        closeEnough(
          row.standard_uncertainty_eV,
          uncertainty,
          sourceTolerance,
        );
    },
  );
  const componentBindingEnergy = massLedger.ionization_energies.reduce(
    (sum, row) => sum + row.energy_eV,
    0,
  );
  const bindingEnergyDifferenceFromPublished =
    componentBindingEnergy -
    massLedger.published_total_binding_energy_eV;
  const bindingMassU =
    massLedger.published_total_binding_energy_eV /
    massLedger.source_epoch_atomic_mass_energy_equivalent_eV;
  const denominator =
    massLedger.removed_electron_count *
    (2 * penning.gamma_corrected + theory.g_factor_abs);
  const selfConsistentAr =
    theory.g_factor_abs *
    (
      massLedger.neutral_carbon_relative_mass_u +
      bindingMassU
    ) /
    denominator;
  const ionMassFromSelfConsistentSolution =
    massLedger.neutral_carbon_relative_mass_u -
    massLedger.removed_electron_count * selfConsistentAr +
    bindingMassU;
  const directObservationalAr =
    theory.g_factor_abs / 2 *
    (1 / penning.charge_state_abs_e) *
    (1 / penning.gamma_corrected) *
    massLedger.published_ion_relative_mass_u;
  const observationalEquationResidual = relativeError(
    directObservationalAr,
    selfConsistentAr,
  );
  const ionMassAbsoluteDifference = Math.abs(
    ionMassFromSelfConsistentSolution -
    massLedger.published_ion_relative_mass_u,
  );
  const observationalMetadataPass =
    ionizationRowsMatch &&
    Math.abs(bindingEnergyDifferenceFromPublished) <=
      massLedger.published_total_binding_energy_standard_uncertainty_eV &&
    massLedger.neutral_carbon_mass_is_exact_in_source_epoch &&
    massLedger.self_consistent_electron_mass_dependence_included &&
    theory.framework === "bound_state_qed" &&
    theory.recoil_included &&
    theory.finite_nuclear_size_included &&
    theory.higher_order_two_loop_estimate_included &&
    theory.value_is_source_specific_final_value &&
    closeEnough(
      theory.g_factor_abs,
      2.0010415901798,
      sourceTolerance,
    ) &&
    closeEnough(
      theory.g_factor_abs_standard_uncertainty,
      4.7e-12,
      sourceTolerance,
    ) &&
    closeEnough(
      massLedger.published_total_binding_energy_eV,
      540.1166,
      sourceTolerance,
    ) &&
    closeEnough(
      massLedger.published_total_binding_energy_standard_uncertainty_eV,
      0.0014,
      sourceTolerance,
    ) &&
    closeEnough(
      massLedger.source_epoch_atomic_mass_energy_equivalent_eV,
      931.494061e6,
      sourceTolerance,
    ) &&
    closeEnough(
      massLedger.source_epoch_atomic_mass_energy_standard_uncertainty_eV,
      21,
      sourceTolerance,
    );
  const observationalEquationPass =
    observationalMetadataPass &&
    observationalEquationResidual <=
      input.tolerances.identity_relative_tolerance &&
    ionMassAbsoluteDifference <=
      input.tolerances.mass_replay_uncertainty_multiplier *
      massLedger.published_ion_relative_mass_standard_uncertainty_u;
  addFailure(
    failures,
    !observationalEquationPass,
    "EMH_OBSERVATIONAL_EQUATION_FAILED",
    "penning_replay.observational_equation",
    "The explicit frequency-ratio equation and self-consistent ion-mass ledger must reproduce the same relative electron mass.",
  );

  const sumMassUncertainty = quadrature([
    penning.published_result.statistical_standard_uncertainty,
    penning.published_result.systematic_standard_uncertainty,
    penning.published_result.theory_standard_uncertainty,
  ]);
  const derivativeArByGamma = Math.abs(
    -2 *
    theory.g_factor_abs *
    (
      massLedger.neutral_carbon_relative_mass_u +
      bindingMassU
    ) /
    (
      massLedger.removed_electron_count *
      (2 * penning.gamma_corrected + theory.g_factor_abs) ** 2
    ),
  );
  const derivativeArByG = Math.abs(
    (
      massLedger.neutral_carbon_relative_mass_u +
      bindingMassU
    ) /
    massLedger.removed_electron_count *
    2 * penning.gamma_corrected /
    (2 * penning.gamma_corrected + theory.g_factor_abs) ** 2,
  );
  const reconstructedUncertainties = {
    statistical:
      derivativeArByGamma *
      penning.gamma_statistical_standard_uncertainty,
    systematic:
      derivativeArByGamma *
      penning.gamma_systematic_standard_uncertainty,
    theory:
      derivativeArByG *
      theory.g_factor_abs_standard_uncertainty,
  };
  const publishedUncertaintyReplayPass =
    closeEnough(
      reconstructedUncertainties.statistical,
      penning.published_result.statistical_standard_uncertainty,
      0.02,
    ) &&
    closeEnough(
      reconstructedUncertainties.systematic,
      penning.published_result.systematic_standard_uncertainty,
      0.02,
    ) &&
    closeEnough(
      reconstructedUncertainties.theory,
      penning.published_result.theory_standard_uncertainty,
      0.02,
    );
  const massReplayAbsoluteDifference = Math.abs(
    selfConsistentAr - penning.published_result.A_r_e
  );
  const massReplayPass =
    closeEnough(
      penning.published_result.A_r_e,
      0.0005485799090694,
      sourceTolerance,
    ) &&
    closeEnough(
      penning.published_result.statistical_standard_uncertainty,
      1.28e-14,
      sourceTolerance,
    ) &&
    closeEnough(
      penning.published_result.systematic_standard_uncertainty,
      8.6e-15,
      sourceTolerance,
    ) &&
    closeEnough(
      penning.published_result.theory_standard_uncertainty,
      1.3e-15,
      sourceTolerance,
    ) &&
    publishedUncertaintyReplayPass &&
    massReplayAbsoluteDifference <=
      input.tolerances.mass_replay_uncertainty_multiplier *
      sumMassUncertainty;
  addFailure(
    failures,
    !massReplayPass,
    "EMH_PUBLISHED_MASS_REPLAY_FAILED",
    "penning_replay.published_result",
    "The corrected source value and its statistical, systematic, and bound-state-QED uncertainty components must reproduce.",
  );

  const codata = input.codata_conversions;
  const correlationPolicyPass =
    codata.source_overlap_class ===
      "shared_adjustment_ancestor_not_independent" &&
    codata.cross_covariance_status === "not_supplied" &&
    codata.independence_significance_status ===
      "not_computable_without_cross_covariance" &&
    !codata.independent_confirmation_claimed &&
    codata.conversion_semantics ===
      "deterministic_fully_correlated_views" &&
    closeEnough(
      codata.atomic_mass_constant_kg.value,
      1.66053906892e-27,
      sourceTolerance,
    ) &&
    closeEnough(
      codata.atomic_mass_constant_kg.standard_uncertainty,
      5.2e-37,
      sourceTolerance,
    );
  addFailure(
    failures,
    !correlationPolicyPass,
    "EMH_CODATA_CORRELATION_POLICY_INVALID",
    "codata_conversions",
    "The Penning result and CODATA views share adjustment ancestry; absent cross-covariance, no independent pull or confirmation is allowed.",
  );

  const mEkg =
    selfConsistentAr * codata.atomic_mass_constant_kg.value;
  const restEnergyJ = mEkg * codata.exact_si.c_m_s ** 2;
  const restEnergyMeV =
    restEnergyJ /
    (codata.exact_si.elementary_charge_C * 1e6);
  const arRelativeUncertainty = sumMassUncertainty / selfConsistentAr;
  const atomicMassRelativeUncertainty =
    codata.atomic_mass_constant_kg.standard_uncertainty /
    codata.atomic_mass_constant_kg.value;
  const convertedRelativeUncertainty =
    arRelativeUncertainty + atomicMassRelativeUncertainty;
  const comparisonMultiplier =
    input.tolerances.correlated_comparison_uncertainty_multiplier;
  const comparisonRows = [
    comparisonRow({
      quantity_id: "A_r_e",
      computed: selfConsistentAr,
      computedStandardUncertainty: sumMassUncertainty,
      reference: codata.references.A_r_e,
      multiplier: comparisonMultiplier,
    }),
    comparisonRow({
      quantity_id: "m_e_OS_kg",
      computed: mEkg,
      computedStandardUncertainty:
        mEkg * convertedRelativeUncertainty,
      reference: codata.references.m_e_OS_kg,
      multiplier: comparisonMultiplier,
    }),
    comparisonRow({
      quantity_id: "E_e_OS_J",
      computed: restEnergyJ,
      computedStandardUncertainty:
        restEnergyJ * convertedRelativeUncertainty,
      reference: codata.references.E_e_OS_J,
      multiplier: comparisonMultiplier,
    }),
    comparisonRow({
      quantity_id: "E_e_OS_MeV",
      computed: restEnergyMeV,
      computedStandardUncertainty:
        restEnergyMeV * convertedRelativeUncertainty,
      reference: codata.references.E_e_OS_MeV,
      multiplier: comparisonMultiplier,
    }),
  ];
  const conversionPass = comparisonRows.every(
    (row) => row.gate === "pass",
  );
  addFailure(
    failures,
    !conversionPass,
    "EMH_CONVERSION_CLOSURE_FAILED",
    "codata_conversions.references",
    "The relative-mass, kilogram, joule, and MeV views must remain within their correlated source envelopes.",
  );

  const electroweak = input.electroweak_tree_mapping;
  const vF =
    1 /
    Math.sqrt(
      Math.SQRT2 * electroweak.fermi_constant_GeV_minus2,
    );
  const vFStandardUncertainty =
    vF / 2 *
    (
      electroweak
        .fermi_constant_standard_uncertainty_GeV_minus2 /
      electroweak.fermi_constant_GeV_minus2
    );
  const fermiScalePass =
    closeEnough(
      electroweak.fermi_constant_GeV_minus2,
      1.1663787e-5,
      sourceTolerance,
    ) &&
    closeEnough(
      electroweak
        .fermi_constant_standard_uncertainty_GeV_minus2,
      6e-12,
      sourceTolerance,
    ) &&
    Math.abs(vF - electroweak.reference_v_F_tree_GeV) <=
      input.tolerances.fermi_scale_absolute_tolerance_GeV &&
    electroweak.unit_convention ===
      "natural_energy_hbar_c_equal_1" &&
    !electroweak.extra_c_squared_factor_applied;
  addFailure(
    failures,
    !fermiScalePass,
    "EMH_FERMI_SCALE_FAILED",
    "electroweak_tree_mapping",
    "The G_mu-scheme Fermi scale must reproduce in natural-energy units without an extra c-squared factor.",
  );

  const electronEnergyGeV = restEnergyMeV / 1e3;
  const yElectronTree = Math.SQRT2 * electronEnergyGeV / vF;
  const gHiggsElectronElectronTree = electronEnergyGeV / vF;
  const treeAnchorRelativeStandardUncertainty =
    convertedRelativeUncertainty +
    vFStandardUncertainty / vF;
  const yElectronTreeStandardUncertainty =
    yElectronTree * treeAnchorRelativeStandardUncertainty;
  const gHiggsElectronElectronTreeStandardUncertainty =
    gHiggsElectronElectronTree *
    treeAnchorRelativeStandardUncertainty;
  const massFromTreeGeV =
    yElectronTree * vF / Math.SQRT2;
  const vertexFromY = yElectronTree / Math.SQRT2;
  const comptonFrequencyHz =
    restEnergyJ / codata.exact_si.h_J_s;
  const energyFromTreeJ =
    massFromTreeGeV *
    1e9 *
    codata.exact_si.elementary_charge_C;
  const comptonFrequencyFromTreeHz =
    energyFromTreeJ / codata.exact_si.h_J_s;
  const rydbergLeadingEnergyGeV =
    0.5 *
    codata.alpha_fs_zero_momentum.value ** 2 *
    electronEnergyGeV;
  const rydbergLeadingEnergyFromTreeGeV =
    codata.alpha_fs_zero_momentum.value ** 2 *
    yElectronTree *
    vF /
    (2 * Math.SQRT2);
  const treeResiduals = {
    mass_relation: relativeError(
      massFromTreeGeV,
      electronEnergyGeV,
    ),
    vertex_from_y: relativeError(
      vertexFromY,
      gHiggsElectronElectronTree,
    ),
    vertex_from_mass: relativeError(
      gHiggsElectronElectronTree,
      electronEnergyGeV / vF,
    ),
    compton_identity_rewrite: relativeError(
      comptonFrequencyFromTreeHz,
      comptonFrequencyHz,
    ),
    rydberg_identity_rewrite: relativeError(
      rydbergLeadingEnergyFromTreeGeV,
      rydbergLeadingEnergyGeV,
    ),
  };
  const treeMappingPass =
    !electroweak.inferred_tree_value_is_direct_measurement &&
    Object.values(treeResiduals).every(
      (residual) =>
        residual <= input.tolerances.identity_relative_tolerance,
    );
  addFailure(
    failures,
    !treeMappingPass,
    "EMH_TREE_YUKAWA_FAILED",
    "electroweak_tree_mapping.mass_relation",
    "The convention-bound tree mass, Yukawa, vertex, Compton, and leading Rydberg identities must close without becoming direct measurements.",
  );

  const precision = electroweak.precision_matching;
  const precisionPolicyPass =
    precision.status === "not_supplied" &&
    precision.mu_GeV === null &&
    precision.scheme === null &&
    precision.tadpole_prescription === null &&
    precision.qed_electroweak_matching === null &&
    precision.perturbative_order === null &&
    !precision.running_value_claimed;
  addFailure(
    failures,
    !precisionPolicyPass,
    "EMH_PRECISION_MATCHING_OVERCLAIM",
    "electroweak_tree_mapping.precision_matching",
    "A precision running Yukawa remains blocked until scale, scheme, tadpole, matching, and perturbative-order inputs are jointly supplied.",
  );

  const collider = input.collider_lane;
  const colliderBoundaryPass =
    closeEnough(
      collider.branching_fraction_upper_limit,
      3e-4,
      sourceTolerance,
    ) &&
    collider.confidence_level === 0.95 &&
    collider.result_kind === "upper_bound_only" &&
    !collider.direct_observation_claimed &&
    !collider.naive_coupling_modifier_reconstruction_authorized &&
    !collider.standard_model_tree_anchor_excluded;
  addFailure(
    failures,
    !colliderBoundaryPass,
    "EMH_COLLIDER_BOUNDARY_FAILED",
    "collider_lane",
    "CMS H-to-ee is an upper-bound-only lane and cannot be relabeled as a direct Yukawa observation or a naive coupling-modifier extraction.",
  );

  const zeroV = input.formal_zero_v_limit;
  const zeroVDomainExitPass =
    zeroV.enabled &&
    zeroV.fixed_lagrangian_yukawa &&
    !zeroV.experimental_switch &&
    zeroV.domain_exit_required &&
    !zeroV.unchanged_low_energy_model_extrapolation_allowed;
  addFailure(
    failures,
    !zeroVDomainExitPass,
    "EMH_ZERO_V_DOMAIN_EXIT_FAILED",
    "formal_zero_v_limit",
    "The zero-Fermi-scale check must remain a formal fixed-Yukawa limit that exits the broken-electroweak and low-energy atomic domain.",
  );

  const nonbridge = input.nonbridge_policy;
  const nonbridgePass =
    !nonbridge.observable_bridge_edges_allowed &&
    !nonbridge.shared_energy_units_create_causal_edge &&
    !nonbridge.mass_frequency_identity_is_new_dynamics &&
    !nonbridge.vacuum_word_equivalence_allowed;
  addFailure(
    failures,
    !nonbridgePass,
    "EMH_NONBRIDGE_POLICY_FAILED",
    "nonbridge_policy",
    "Shared units, algebra, or terminology cannot create a causal cross-mechanism edge.",
  );

  const orderedFailures = sortedFailures(failures);
  const failureCodes = new Set(
    orderedFailures.map((failure) => failure.code),
  );
  const gateFor = (
    code: CasimirDpElectronMassHiggsAnchorStage4_2AFailureCode,
  ): "pass" | "blocked" =>
    failureCodes.has(code) ? "blocked" : "pass";

  return {
    schema_version:
      CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_RESULT_VERSION,
    input_schema_version: input.schema_version,
    calibration_id: input.calibration_id,
    status:
      orderedFailures.length === 0
        ? "pass" as const
        : "not_ready" as const,
    evidence_class: input.evidence_class,
    claim_ceiling: input.claim_ceiling,
    promotion_allowed: false as const,
    observable_bridge_edges_added: 0 as const,
    forbidden_input_key_scan: {
      recursive: true as const,
      gate: "pass" as const,
    },
    failures: orderedFailures,
    first_failure_code:
      orderedFailures[0]?.code ?? null,
    source_provenance: {
      selected_experiment: penning.experiment_id,
      selected_publication_state:
        penning.selected_publication_state,
      source_ids: [...sourceMap.keys()].sort(),
      gate: gateFor("EMH_SOURCE_PROVENANCE_INVALID"),
    },
    correction_ledger: {
      row_count: penning.corrections.length,
      relative_shift_sum_ppt: correctionShiftPpt,
      published_total_relative_shift_ppt:
        penning.published_total_relative_shift_ppt,
      shift_rounding_residual_ppt:
        correctionShiftPpt -
        penning.published_total_relative_shift_ppt,
      uncertainty_quadrature_ppt: correctionUncertaintyPpt,
      reported_systematic_relative_uncertainty_ppt:
        reportedSystematicRelativePpt,
      uncertainty_residual_ppt:
        correctionUncertaintyPpt -
        reportedSystematicRelativePpt,
      gate: gateFor("EMH_CORRECTION_LEDGER_INVALID"),
    },
    frequency_ratio_replay: {
      symbol: penning.frequency_ratio_symbol,
      definition: penning.frequency_ratio_definition,
      gamma_statistical: penning.gamma_statistical,
      gamma_corrected_published: penning.gamma_corrected,
      gamma_corrected_from_rows: gammaFromCorrectionRows,
      gamma_corrected_from_published_total:
        gammaFromPublishedTotal,
      row_replay_residual_ppt: gammaRowResidualPpt,
      published_total_replay_residual_ppt:
        gammaPublishedResidualPpt,
      statistical_standard_uncertainty:
        penning.gamma_statistical_standard_uncertainty,
      systematic_standard_uncertainty:
        penning.gamma_systematic_standard_uncertainty,
      gate: gateFor("EMH_GAMMA_CORRECTION_REPLAY_FAILED"),
    },
    electron_mass_metrology_replay: {
      species: penning.species,
      observational_equation: penning.observational_equation,
      binding_energy: {
        component_sum_eV: componentBindingEnergy,
        published_total_eV:
          massLedger.published_total_binding_energy_eV,
        component_minus_published_eV:
          bindingEnergyDifferenceFromPublished,
        mass_equivalent_u: bindingMassU,
      },
      ion_relative_mass: {
        reconstructed_u: ionMassFromSelfConsistentSolution,
        published_u: massLedger.published_ion_relative_mass_u,
        absolute_difference_u: ionMassAbsoluteDifference,
      },
      A_r_e: {
        direct_observational_equation: directObservationalAr,
        self_consistent_solution: selfConsistentAr,
        published: penning.published_result.A_r_e,
        direct_vs_self_relative_residual:
          observationalEquationResidual,
        self_vs_published_absolute_difference:
          massReplayAbsoluteDifference,
      },
      uncertainty_replay: {
        reconstructed: reconstructedUncertainties,
        published: {
          statistical:
            penning.published_result
              .statistical_standard_uncertainty,
          systematic:
            penning.published_result
              .systematic_standard_uncertainty,
          theory:
            penning.published_result
              .theory_standard_uncertainty,
        },
        combined_standard_uncertainty: sumMassUncertainty,
        method:
          "analytic_observational_equation_jacobian_and_quadrature" as const,
      },
      static_weighing: false as const,
      theory_assisted_frequency_ratio_inference: true as const,
      observational_equation_gate:
        gateFor("EMH_OBSERVATIONAL_EQUATION_FAILED"),
      published_mass_gate:
        gateFor("EMH_PUBLISHED_MASS_REPLAY_FAILED"),
    },
    correlated_codata_conversions: {
      A_r_e: selfConsistentAr,
      m_e_OS_kg: mEkg,
      E_e_OS_J: restEnergyJ,
      E_e_OS_MeV: restEnergyMeV,
      converted_relative_standard_uncertainty:
        convertedRelativeUncertainty,
      uncertainty_method:
        "conservative_l1_for_unknown_codata_cross_covariance" as const,
      conversion_semantics: codata.conversion_semantics,
      source_overlap_class: codata.source_overlap_class,
      cross_covariance_status: codata.cross_covariance_status,
      independent_pull: null,
      comparisons: comparisonRows,
      correlation_policy_gate:
        gateFor("EMH_CODATA_CORRELATION_POLICY_INVALID"),
      conversion_gate:
        gateFor("EMH_CONVERSION_CLOSURE_FAILED"),
    },
    standard_model_tree_mapping: {
      convention: electroweak.lagrangian_convention,
      v_F_tree_GeV: vF,
      v_F_tree_standard_uncertainty_GeV:
        vFStandardUncertainty,
      electron_pole_rest_energy_GeV: electronEnergyGeV,
      y_e_lagrangian_tree: yElectronTree,
      y_e_lagrangian_tree_standard_uncertainty:
        yElectronTreeStandardUncertainty,
      g_h_e_e_tree: gHiggsElectronElectronTree,
      g_h_e_e_tree_standard_uncertainty:
        gHiggsElectronElectronTreeStandardUncertainty,
      sqrt2_ratio:
        yElectronTree / gHiggsElectronElectronTree,
      inferred_from_mass_not_directly_observed: true as const,
      uncertainty_scope:
        "tree_anchor_with_source_mass_and_G_F_only" as const,
      uncertainty_method:
        "conservative_l1_mass_and_G_F_unknown_cross_covariance" as const,
      fermi_scale_gate: gateFor("EMH_FERMI_SCALE_FAILED"),
      tree_identity_gate: gateFor("EMH_TREE_YUKAWA_FAILED"),
      residuals: treeResiduals,
      identity_replay: {
        compton_frequency_Hz: comptonFrequencyHz,
        compton_frequency_from_tree_Hz:
          comptonFrequencyFromTreeHz,
        rydberg_leading_energy_GeV: rydbergLeadingEnergyGeV,
        rydberg_leading_energy_from_tree_GeV:
          rydbergLeadingEnergyFromTreeGeV,
        interpretation:
          "shared_algebra_not_independent_evidence" as const,
      },
      precision_matching: {
        status: "blocked" as const,
        reason:
          "scale_scheme_tadpole_matching_and_order_not_supplied" as const,
        y_e_MSbar_at_mu: null,
        gate: gateFor("EMH_PRECISION_MATCHING_OVERCLAIM"),
      },
    },
    collider_upper_bound_lane: {
      source_id: collider.source_id,
      channel: collider.channel,
      branching_fraction_upper_limit:
        collider.branching_fraction_upper_limit,
      confidence_level: collider.confidence_level,
      electron_yukawa_collider_status:
        "upper_bound_only" as const,
      direct_electron_yukawa_observed: false as const,
      kappa_e_collider_bound: null,
      naive_reconstruction_performed: false as const,
      tree_anchor_interpretation:
        "not_excluded_no_direct_electron_yukawa_observation" as const,
      gate: gateFor("EMH_COLLIDER_BOUNDARY_FAILED"),
    },
    formal_zero_v_domain_exit: {
      formal_limit_only: true as const,
      fixed_y_e_lagrangian_tree: yElectronTree,
      at_limit: {
        v_F_tree_GeV: 0 as const,
        electron_rest_energy_GeV: 0 as const,
        compton_frequency_Hz: 0 as const,
        rydberg_leading_energy_GeV: 0 as const,
        ordinary_compton_wavelength:
          "diverges_to_infinity" as const,
        reduced_compton_wavelength:
          "diverges_to_infinity" as const,
        bohr_radius: "diverges_to_infinity" as const,
      },
      experimental_switch: false as const,
      domain_status:
        "outside_broken_electroweak_and_low_energy_atomic_domain" as const,
      unchanged_apparatus_extrapolation_allowed: false as const,
      gate: gateFor("EMH_ZERO_V_DOMAIN_EXIT_FAILED"),
    },
    final_gates: {
      primary_source_integrity:
        gateFor("EMH_SOURCE_PROVENANCE_INVALID"),
      penning_correction_ledger:
        gateFor("EMH_CORRECTION_LEDGER_INVALID"),
      penning_observational_replay:
        failureCodes.has("EMH_GAMMA_CORRECTION_REPLAY_FAILED") ||
          failureCodes.has("EMH_OBSERVATIONAL_EQUATION_FAILED") ||
          failureCodes.has("EMH_PUBLISHED_MASS_REPLAY_FAILED")
          ? "blocked" as const
          : "pass" as const,
      codata_correlated_reproduction:
        failureCodes.has("EMH_CODATA_CORRELATION_POLICY_INVALID") ||
          failureCodes.has("EMH_CONVERSION_CLOSURE_FAILED")
          ? "blocked" as const
          : "pass" as const,
      unit_dimension_closure:
        failureCodes.has("EMH_CONVERSION_CLOSURE_FAILED") ||
          failureCodes.has("EMH_FERMI_SCALE_FAILED") ||
          failureCodes.has("EMH_TREE_YUKAWA_FAILED")
          ? "blocked" as const
          : "pass" as const,
      conditional_sm_tree_mapping:
        failureCodes.has("EMH_FERMI_SCALE_FAILED") ||
          failureCodes.has("EMH_TREE_YUKAWA_FAILED")
          ? "blocked" as const
          : "pass" as const,
      collider_upper_bound_semantics:
        gateFor("EMH_COLLIDER_BOUNDARY_FAILED"),
      formal_zero_v_domain_exit:
        gateFor("EMH_ZERO_V_DOMAIN_EXIT_FAILED"),
      semantic_nonbridge:
        gateFor("EMH_NONBRIDGE_POLICY_FAILED"),
      independent_electron_mass_validation: "not_ready" as const,
      running_yukawa_at_higgs_scale: "blocked" as const,
      direct_electron_yukawa_observation: "not_ready" as const,
      electron_mass_from_higgs_identification: "blocked" as const,
      higgs_origin_identification: "blocked" as const,
      measured_casimir_coherence_evidence: "not_ready" as const,
      casimir_higgs_dp_transfer: "blocked" as const,
      compton_to_collapse_clock: "blocked" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      physical_viability: "not_evaluated" as const,
      publication_claim:
        "electron_mass_replay_and_conditional_tree_anchor_only" as const,
    },
  };
}

export type CasimirDpElectronMassHiggsAnchorStage4_2AResult =
  ReturnType<
    typeof evaluateCasimirDpElectronMassHiggsAnchorStage4_2A
  >;
