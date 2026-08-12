export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_scalar_reference" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_scalar_reference/v1" as const;

const TENSOR_COMPONENT_ORDER = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const;

const TENSOR_COMPONENT_MULTIPLICITIES = [
  1, 2, 2, 2, 1, 2, 2, 1, 2, 1,
] as const;

const NOISE_COMPONENT_PAIR_ORDER = TENSOR_COMPONENT_ORDER.flatMap((left) =>
  TENSOR_COMPONENT_ORDER.map((right) => `${left}:${right}`),
);

const SAMPLE_MULTIPLIERS = ["-0.5", "-0.2", "0.2", "0.5"] as const;
const X_SAMPLE_COORDINATES_M = ["-0.125", "-0.05", "0.05", "0.125"] as const;
const YZ_SAMPLE_COORDINATES_M = [
  "-0.025",
  "-0.01",
  "0.01",
  "0.025",
] as const;

const SAMPLE_POINTS = SAMPLE_MULTIPLIERS.flatMap((mZ, iZ) =>
  SAMPLE_MULTIPLIERS.flatMap((mY, iY) =>
    SAMPLE_MULTIPLIERS.map((mX, iX) => ({
      ordinal: 16 * iZ + 4 * iY + iX,
      multiplier: { x: mX, y: mY, z: mZ },
      inertialConformalCoordinatesM: {
        X0: "0",
        X: X_SAMPLE_COORDINATES_M[iX],
        Y: YZ_SAMPLE_COORDINATES_M[iY],
        Z: YZ_SAMPLE_COORDINATES_M[iZ],
      },
    })),
  ),
);

const WALD_COUNTERTERM_BASIS = [
  {
    name: "g_ab",
    definition:
      "metric_tensor_basis_element_equivalently_variation_of_integral_sqrt_minus_g",
    coefficient: 0,
    coefficientDisposition: "fixed_zero_named_convention",
  },
  {
    name: "G_ab",
    definition:
      "einstein_tensor_basis_element_equivalently_variation_of_integral_sqrt_minus_g_R",
    coefficient: 0,
    coefficientDisposition: "fixed_zero_named_convention",
  },
  {
    name: "I_ab",
    definition: "metric_variation_of_integral_sqrt_minus_g_R_squared",
    coefficient: 0,
    coefficientDisposition: "fixed_zero_named_convention",
  },
  {
    name: "J_ab",
    definition:
      "metric_variation_of_integral_sqrt_minus_g_R_cd_R_superscript_cd",
    coefficient: 0,
    coefficientDisposition: "fixed_zero_named_convention",
  },
] as const;

const IMPLEMENTATION_PLANS = [
  {
    role: "primary",
    implementationId:
      "conformal_scalar_symbolic_hadamard_wick_reference_primary",
    lineageIntent: "symbolic_tensor_and_hadamard_recursion_lineage",
    method:
      "independent_symbolic_differentiation_point_splitting_and_gaussian_wick_reduction",
    toolchainIntent: "computer_algebra_high_precision_export",
    sharedInputs:
      "only_this_frozen_semantic_contract_and_eventual_exact_23_file_science_pack",
    executionStatus: "planned_not_executed",
    sourceSha256: null,
    dependencyLockSha256: null,
    executableSha256: null,
    establishesIndependentImplementation: false,
  },
  {
    role: "independent",
    implementationId:
      "conformal_scalar_automatic_differentiation_reference_independent",
    lineageIntent: "separate_automatic_differentiation_and_quadrature_lineage",
    method:
      "separate_equation_transcription_automatic_differentiation_point_splitting_and_bilocal_quadrature",
    toolchainIntent: "independent_language_runtime_and_dependency_graph",
    sharedInputs:
      "only_this_frozen_semantic_contract_and_eventual_exact_23_file_science_pack",
    executionStatus: "planned_not_executed",
    sourceSha256: null,
    dependencyLockSha256: null,
    executableSha256: null,
    establishesIndependentImplementation: false,
  },
] as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CLAIM_LOCKS =
  Object.freeze({
    currentNhm2ShiftLapseMetric: false as const,
    currentNhm2Geometry: false as const,
    sourceRealization: false as const,
    metricDemandDerived: false as const,
    metricDemandErrorBoundDerived: false as const,
    metricDemandDerivationReceiptVerified: false as const,
    meanRsetDerived: false as const,
    noiseKernelDerived: false as const,
    uncertaintyBudgetDerived: false as const,
    waldConservationCorrectionDerived: false as const,
    matterWardIdentityVerified: false as const,
    fullGravityMatterHamiltonianConstraintDerived: false as const,
    fullGravityMatterMomentumConstraintsDerived: false as const,
    fullGravityMatterConstraintAlgebraDerived: false as const,
    rawReplayProduced: false as const,
    serverReplayCompleted: false as const,
    independentImplementationsExecuted: false as const,
    pairAgreementEstablished: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
  });

const REFERENCE = {
  artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
  authority: "frozen_semantic_reference_only",
  maturity: "diagnostic_only_unexecuted",
  diagnosticOnly: true,
  surrogate: {
    surrogateId: "conformally_flat_needle_reference",
    semanticRole: "analytic_semiclassical_scalar_reference_surrogate",
    relationshipToCurrentNhm2:
      "not_the_current_nhm2_shift_lapse_metric_or_source_model",
    allowedUse:
      "frozen_reference_for_future_candidate_producer_replay_and_pair_design",
    semanticRelabelingAllowed: false,
    physicalNeedleHullInterpretationAllowed: false,
  },
  geometry: {
    spacetimeDimension: 4,
    signature: "(-,+,+,+)",
    inertialConformalCoordinates: ["X0=c*T", "X", "Y", "Z"],
    ellipsoidalCompactCoordinate: {
      symbol: "s",
      expression:
        "s=(X/(0.25*m))^2+(Y/(0.05*m))^2+(Z/(0.05*m))^2",
      axesM: { x: 0.25, y: 0.05, z: 0.05 },
      domain: "s>=0",
    },
    compactBump: {
      symbol: "b",
      interiorExpression: "b(s)=exp(-s/(1-s)) for 0<=s<1",
      exteriorExpression: "b(s)=0 for s>=1",
      centerValue: 1,
      support: "s<1",
      regularity: "C_infinity_with_all_boundary_jets_zero_at_s=1",
      interiorDerivatives: {
        first: "db/ds=-b/(1-s)^2",
        second: "d2b/ds2=b*(2*s-1)/(1-s)^4",
      },
    },
    conformalFactor: {
      symbol: "Omega",
      expression: "Omega=1+1e-6*b(s)",
      amplitude: 0.000001,
      strictlyPositive: true,
      asymptoticValue: 1,
    },
    coordinateFlow: {
      kind: "pure_coordinate_compact_y_flow",
      generatorExpression: "V=0.01*c*b(s)*d/dY",
      speedFractionC: 0.01,
      flowSymbol: "Phi_T",
      completeness:
        "complete_smooth_flow_from_a_compactly_supported_spatial_vector_field",
      spacetimeMap: "F(T,x)=(T,Phi_T(x))",
      shiftOrLapsePhysics: false,
      materialMotion: false,
      actuation: false,
    },
    metric: {
      conformalInertialMetric: "g_bar=Omega^2*eta",
      pulledBackMetric: "g=F^*(Omega^2*eta)",
      construction:
        "diffeomorphic_pullback_of_a_conformally_flat_asymptotically_minkowski_metric",
      currentNhm2ShiftLapseMetric: false,
    },
    tetrad: {
      tetradId: "global_pulled_back_conformal_inertial_tetrad",
      conformalInertialFrame:
        "e_bar_hat_A=Omega^-1*d/dX^A for A in [0,1,2,3]",
      pulledBackFrame: "e_hat_A=F_*^-1(e_bar_hat_A)",
      pulledBackCoframe: "theta_hat_A=F^*(Omega*dX^A)",
      orthonormality: "g(e_hat_A,e_hat_B)=eta_hat_A_hat_B",
      coverage: "global",
    },
    boundaryAndAsymptotics: {
      manifold: "R^4",
      materialBoundary: "none",
      boundaryCondition: "no_material_boundary",
      asymptoticCondition: "Omega_to_1_and_V_to_0_so_g_to_eta",
      asymptoticallyMinkowski: true,
    },
  },
  fieldTheory: {
    field: "phi",
    fieldKind: "real_scalar",
    spacetimeDimension: 4,
    mass: { value: 0, convention: "massless" },
    curvatureCoupling: { symbol: "xi", numerator: 1, denominator: 6 },
    action:
      "S=-1/2*integral_d4x_sqrt(-g)*(g^ab*nabla_a(phi)*nabla_b(phi)+(1/6)*R*phi^2)",
    fieldEquation: "(Box_g-(1/6)*R)*phi=0",
    selfInteraction: "none",
    materialCoupling: "none",
  },
  state: {
    stateId: "conformal_minkowski_vacuum",
    stateClass: "quasifree_hadamard",
    unitConventionForTwoPointFunction: "hbar=c=1",
    minkowskiTwoPointFunction:
      "W0=(4*pi^2)^-1*[-(Delta_X0-i*0)^2+|Delta_X|^2]^-1",
    curvedTwoPointFunction:
      "Wg(x,y)=Omega(Fx)^-1*Omega(Fy)^-1*W0(Fx,Fy)",
    preparationClaim: false,
    empiricalStateReceipt: false,
  },
  renormalization: {
    schemeId:
      "locally_covariant_hadamard_point_splitting_wald_fixed_basis_v1",
    method: "locally_covariant_hadamard_point_splitting",
    hadamardLengthScale: { symbol: "ell", value: 1, unit: "m" },
    prescription:
      "apply_the_frozen_improved_conformal_scalar_stress_bidifferential_operator_to_Wg_minus_the_local_hadamard_parametrix_then_take_the_covariant_coincidence_limit",
    waldCountertermBasis: WALD_COUNTERTERM_BASIS,
    countertermPolicy: {
      basisClosedAndNamed: true,
      unnamedCountertermsAllowed: false,
      allCoefficientsFixedToZero: true,
      zeroMeaning:
        "chosen_finite_renormalization_convention_not_absence_of_wald_ambiguity",
    },
    conservationCorrection: {
      name: "wald_conservation_restoring_local_term",
      required: true,
      omissionAllowed: false,
      coefficient: null,
      coefficientDisposition:
        "must_be_derived_from_the_frozen_point_split_operator_and_hadamard_recursion_before_execution",
      status: "required_uncomputed_blocker",
      blocker: "wald_conservation_correction_coefficient_not_derived",
    },
    siRestoration: {
      meanStressTensor: "multiply_final_tetrad_components_by_hbar*c",
      connectedNoiseKernel:
        "multiply_final_tetrad_component_pairs_by_(hbar*c)^2",
    },
    evaluated: false,
  },
  sampling: {
    sampleCount: 64,
    multiplierOrder: SAMPLE_MULTIPLIERS,
    enumerationOrder: ["z_outer", "y_middle", "x_inner"],
    ordinalFormula: "ordinal=16*i_z+4*i_y+i_x",
    variationRule: "x_varies_fastest_then_y_then_z",
    pointFormula:
      "P_pqr=(X0=0,X=0.25*m_p,Y=0.05*m_q,Z=0.05*m_r) in meters",
    samplePoints: SAMPLE_POINTS,
    smearing: {
      smearingId: "normalized_C_infinity_spacetime_product_bumps_v1",
      oneDimensionalBump:
        "q(u)=exp(-u^2/(1-u^2)) for |u|<1 and q(u)=0 for |u|>=1",
      conformalInertialProductExpression:
        "bar_f_n(X)=C_n*q((X0-X0_n)/(c*tau))*q((X-X_n)/dx)*q((Y-Y_n)/dy)*q((Z-Z_n)/dz)",
      physicalTestFunction: "f_n=F^*(bar_f_n)",
      normalization:
        "integral_R4(d4X*sqrt(-bar_g)*bar_f_n)=1 with C_n>0, where bar_g=Omega^2*eta",
      pullbackNormalizationIdentity:
        "integral_R4(d4x*sqrt(-g)*f_n)=integral_R4(d4X*sqrt(-bar_g)*bar_f_n)=1",
      halfWidthsM: { cTau: 0.002, dx: 0.01, dy: 0.002, dz: 0.002 },
      centeredOnEverySample: true,
      regularity: "C_infinity_compact_spacetime_support",
      supportProof: {
        maximumAxisNormalizedMagnitude: 0.54,
        maximumEllipsoidalS: 0.8748,
        minimumOneMinusS: 0.1252,
        entireSupportStrictlyInsideConformalBump: true,
        formula: "s_max=3*(0.5+0.04)^2=2187/2500",
      },
      staticReduction: {
        conformalFactorTimeIndependent: true,
        timeIntegralCancelsFromNormalizedDemandSmear: true,
        spatialDemandFormula:
          "D_n,AB=(c^4/(8*pi*G))*integral(qx*qy*qz*Omega^2*G_AB*d3u)/integral(qx*qy*qz*Omega^4*d3u)",
      },
    },
    sampleWeights: {
      value: "1/64",
      count: 64,
      sum: 1,
      interpretation: "equal_diagnostic_sample_weights",
    },
  },
  tensorConvention: {
    basis: "global_pulled_back_conformal_inertial_orthonormal_tetrad",
    symmetricTensorComponentOrder: TENSOR_COMPONENT_ORDER,
    symmetricTensorMultiplicities: TENSOR_COMPONENT_MULTIPLICITIES,
    frobeniusFormula:
      "||T||_F^2=sum_I(multiplicity_I*T_I^2) in the frozen ten-component order",
    noiseKernelComponentPairOrder: NOISE_COMPONENT_PAIR_ORDER,
    noiseKernelComponentPairCount: 100,
    exchangeSymmetry: "N_IJ(p,q)=N_JI(q,p)",
  },
  derivationObligations: {
    metricDemand: {
      required: true,
      status: "blocked_not_derived",
      inertialConformalFormula:
        "G_AB=-2*omega_,AB+2*omega_,A*omega_,B+2*eta_AB*box_eta(omega)+eta_AB*(partial_omega)^2",
      omegaDefinition: "omega=ln(Omega)",
      exactDerivativeIdentities: {
        spatialEllipsoidalCoordinateGradient:
          "partial_i(s)=2*X_i/a_i^2 with a=(0.25,0.05,0.05)*m",
        spatialEllipsoidalCoordinateHessian:
          "partial_i_partial_j(s)=2*delta_ij/a_i^2",
        omegaFirstDerivative:
          "omega_s=(1e-6*(db/ds))/Omega",
        omegaSecondDerivative:
          "omega_ss=(1e-6*(d2b/ds2))/Omega-omega_s^2",
      },
      pullbackDuty: "pull_G_AB_back_with_F",
      tetradProjectionDuty:
        "project_all_ten_symmetric_components_on_the_global_pulled_back_tetrad",
      smearingDuty:
        "smear_each_projected_component_with_f_n=F^*(bar_f_n), using the exact pullback normalization identity and the static spatial reduction",
      siFormula: "D_hat_A_hat_B=(c^4/(8*pi*G))*smeared_G_hat_A_hat_B",
      boundaryDuty:
        "derive_first_and_second_bump_derivatives_and_verify_all_s_equals_1_boundary_jets",
      output: {
        role: "metric_demand_tensor",
        shape: [64, 10],
        componentOrder: TENSOR_COMPONENT_ORDER,
        unit: "J/m^3",
        encoding: "raw_ieee754_float64_little_endian",
      },
      deterministicErrorBoundOutput: {
        role: "metric_demand_absolute_error_bound",
        shape: [64, 10],
        componentOrder: TENSOR_COMPONENT_ORDER,
        unit: "J/m^3",
        encoding: "raw_ieee754_float64_little_endian",
        coverage: "all_64_samples_all_10_components",
        perComponentStrictlyPositiveUntilExactZeroProofReplayed: true,
      },
      derivationReceiptOutput: {
        role: "metric_demand_derivation_receipt",
        mediaType: "application/json",
        mustBind:
          "geometry_chart_sampling_normalization_policy_formula_constants_toolchain_execution_interval_central_bytes_error_bound_bytes_interval_trace_and_freshness",
        executorObservedProvenanceRequired: true,
        producerSelfAssertionSufficient: false,
      },
      numericalAuthority: {
        requiredMethod:
          "directed_rounding_interval_or_ball_arithmetic_with_positive_denominator_proof",
        refinementDeltaAloneIsErrorProof: false,
        centerPointSubstitutionAllowed: false,
        frozenRelativeDemandEnclosureTarget: 0.01,
        workLimitFailureDisposition:
          "blocked_validated_enclosure_target_not_met_without_retuning",
      },
      evaluated: false,
    },
    meanRset: {
      required: true,
      status: "blocked_not_derived",
      duties: [
        "derive_the_frozen_point_split_stress_bidifferential_operator_for_the_real_massless_xi_1_over_6_scalar",
        "derive_the_local_hadamard_parametrix_at_ell_1_m",
        "derive_and_include_the_required_wald_conservation_restoring_local_term",
        "apply_the_four_named_zero_coefficient_wald_counterterm_convention",
        "take_the_covariant_coincidence_limit",
        "pull_back_project_smear_and_restore_hbar_c_units",
        "derive_a_numerical_truncation_and_roundoff_uncertainty_budget",
      ],
      output: {
        role: "mean_rset",
        uncertaintyRole: "mean_rset_absolute_uncertainty95",
        shape: [64, 10],
        componentOrder: TENSOR_COMPONENT_ORDER,
        unit: "J/m^3",
        encoding: "raw_ieee754_float64_little_endian",
      },
      evaluated: false,
    },
    connectedNoiseKernel: {
      required: true,
      status: "blocked_not_derived",
      definition:
        "N_abcd(x,y)=1/2*<anticommutator(t_ab(x),t_cd(y))> with t_ab=T_ab-<T_ab>",
      operatorOrdering: "connected_symmetrized_anticommutator",
      duties: [
        "derive_the_free_quasifree_state_wick_reduction_from_Wg",
        "apply_the_frozen_point_split_stress_operators_at_both_points",
        "include_all_local_contact_conservation_and_renormalization_terms_required_by_the_frozen_scheme",
        "bilocally_smear_every_ordered_tetrad_component_pair_at_all_64_by_64_sample_pairs",
        "verify_exchange_symmetry_and_positive_semidefinite_smeared_covariance_with_uncertainty",
        "restore_(hbar*c)^2_units",
      ],
      output: {
        role: "noise_kernel",
        uncertaintyRole: "noise_kernel_absolute_uncertainty95",
        shape: [64, 64, 100],
        componentPairOrder: NOISE_COMPONENT_PAIR_ORDER,
        unit: "(J/m^3)^2",
        encoding: "raw_ieee754_float64_little_endian",
      },
      evaluated: false,
    },
    provenance: {
      required: true,
      status: "blocked_not_derived",
      duties: [
        "persist_exact_source_equations_and_derivation_trace",
        "persist_source_dependency_executable_and_build_recipe_hashes",
        "persist_raw_arrays_before_server_replay",
        "fail_without_retuning_if_either_implementation_disagrees",
      ],
    },
  },
  implementationPlans: IMPLEMENTATION_PLANS,
  constraintScope: {
    computedScope:
      "fixed_background_matter_stress_tensor_ward_identity_only",
    wardIdentityTarget: "nabla^a<T_ab>_ren=0_on_the_frozen_background",
    isFullGravityMatterHamiltonianMomentumAlgebra: false,
    equivalenceStatement:
      "fixed_background_matter_ward_algebra_is_not_equal_to_the_full_gravity_plus_matter_H_and_H_i_constraint_algebra",
    fullHamiltonianGeneratorDerived: false,
    fullMomentumGeneratorsDerived: false,
    fullPoissonBracketStructureFunctionsDerived: false,
    constraintArrayProductionAuthorized: false,
    status: "blocked",
    blocker:
      "full_gravity_plus_matter_H_Hi_generators_and_poisson_brackets_not_derived",
  },
  executionBoundary: {
    semanticContractOnly: true,
    candidateManifestProduced: false,
    scientificPresealProduced: false,
    rawArraysProduced: false,
    implementationsExecuted: false,
    replayExecuted: false,
    pairComparisonExecuted: false,
    empiricalReceiptPresent: false,
  },
  claimLocks: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CLAIM_LOCKS,
} as const;

const deepFreeze = <T>(value: T): T => {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
};

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE =
  deepFreeze(REFERENCE);

export type Nhm2ConformallyFlatNeedleScalarReferenceV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;

type PlainSnapshotResult =
  | { ok: true; value: unknown }
  | { ok: false; violation: string };

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  seen = new Set<object>(),
): PlainSnapshotResult => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { ok: true, value }
      : { ok: false, violation: `nonfinite_number:${pointer || "/"}` };
  }
  if (typeof value !== "object") {
    return { ok: false, violation: `non_json_value:${pointer || "/"}` };
  }
  if (seen.has(value)) {
    return { ok: false, violation: `cyclic_value:${pointer || "/"}` };
  }
  seen.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return { ok: false, violation: `non_plain_array:${pointer || "/"}` };
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(value);
    if (
      keys.some(
        (key) =>
          typeof key !== "string" ||
          (key !== "length" && !/^(?:0|[1-9][0-9]*)$/.test(key)),
      )
    ) {
      return { ok: false, violation: `array_keys_invalid:${pointer || "/"}` };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (descriptor == null || !("value" in descriptor)) {
        return {
          ok: false,
          violation: `accessor_or_sparse_array_forbidden:${pointer}/${index}`,
        };
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        seen,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    seen.delete(value);
    return { ok: true, value: output };
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return { ok: false, violation: `non_plain_object:${pointer || "/"}` };
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    return { ok: false, violation: `symbol_key_forbidden:${pointer || "/"}` };
  }
  const output: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    const descriptor = descriptors[key];
    if (descriptor == null || !("value" in descriptor)) {
      return {
        ok: false,
        violation: `accessor_property_forbidden:${pointer}/${key}`,
      };
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      seen,
    );
    if (!nested.ok) return nested;
    output[key] = nested.value;
  }
  seen.delete(value);
  return { ok: true, value: output };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const sameScalar = (left: unknown, right: unknown): boolean =>
  typeof left === "number" && typeof right === "number"
    ? Object.is(left, right)
    : left === right;

const exactDifferences = (
  actual: unknown,
  expected: unknown,
  pointer = "",
): string[] => {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    if (actual.length !== expected.length) {
      violations.push(`array_length_drift:${pointer || "/"}`);
    }
    const count = Math.min(actual.length, expected.length);
    for (let index = 0; index < count; index += 1) {
      violations.push(
        ...exactDifferences(actual[index], expected[index], `${pointer}/${index}`),
      );
    }
    return violations;
  }
  if (isRecord(actual) || isRecord(expected)) {
    if (!isRecord(actual) || !isRecord(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key)) {
        violations.push(`extra_key:${pointer}/${key}`);
      }
    }
    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) {
        violations.push(`missing_key:${pointer}/${key}`);
      } else {
        violations.push(
          ...exactDifferences(actual[key], expected[key], `${pointer}/${key}`),
        );
      }
    }
    return violations;
  }
  return sameScalar(actual, expected)
    ? []
    : [`value_drift:${pointer || "/"}`];
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

export const nhm2ConformallyFlatNeedleScalarReferenceViolations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  const violations = exactDifferences(
    snapshot.value,
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  );
  const root = isRecord(snapshot.value) ? snapshot.value : null;
  if (root == null) return unique(["reference_shape_invalid", ...violations]);
  const expectedRootKeys = Object.keys(
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  );
  if (
    Object.keys(root).length !== expectedRootKeys.length ||
    Object.keys(root).some((key) => !expectedRootKeys.includes(key))
  ) {
    violations.push("root_keys_not_exact");
  }
  if (
    root.artifactId !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID ||
    root.contractVersion !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION
  ) {
    violations.push("reference_identity_invalid");
  }
  const surrogate = isRecord(root.surrogate) ? root.surrogate : null;
  if (
    surrogate?.surrogateId !== "conformally_flat_needle_reference" ||
    surrogate?.relationshipToCurrentNhm2 !==
      "not_the_current_nhm2_shift_lapse_metric_or_source_model" ||
    surrogate?.semanticRelabelingAllowed !== false
  ) {
    violations.push("surrogate_semantic_relabeling_forbidden");
  }
  const renormalization = isRecord(root.renormalization)
    ? root.renormalization
    : null;
  if (
    renormalization == null ||
    exactDifferences(
      renormalization.waldCountertermBasis,
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.renormalization
        .waldCountertermBasis,
    ).length > 0 ||
    exactDifferences(
      renormalization.countertermPolicy,
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.renormalization
        .countertermPolicy,
    ).length > 0
  ) {
    violations.push("wald_counterterm_named_zero_basis_invalid");
  }
  if (
    renormalization == null ||
    exactDifferences(
      renormalization.conservationCorrection,
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.renormalization
        .conservationCorrection,
    ).length > 0
  ) {
    violations.push("wald_conservation_correction_contract_invalid");
  }
  if (
    exactDifferences(
      root.derivationObligations,
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.derivationObligations,
    ).length > 0
  ) {
    violations.push("derivation_obligations_incomplete_or_drifted");
  }
  if (
    exactDifferences(
      root.implementationPlans,
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.implementationPlans,
    ).length > 0
  ) {
    violations.push("distinct_unexecuted_implementation_plans_invalid");
  }
  const claimLocks = isRecord(root.claimLocks) ? root.claimLocks : null;
  if (claimLocks == null) {
    violations.push("claim_locks_invalid");
  } else {
    for (const [key, entry] of Object.entries(claimLocks)) {
      if (entry !== false) violations.push(`claim_lock_must_remain_false:${key}`);
    }
  }
  return unique(violations);
};

export const isNhm2ConformallyFlatNeedleScalarReferenceV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleScalarReferenceV1 =>
  nhm2ConformallyFlatNeedleScalarReferenceViolations(value).length === 0;
