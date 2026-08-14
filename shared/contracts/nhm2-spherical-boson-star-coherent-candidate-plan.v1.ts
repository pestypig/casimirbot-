import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER,
  NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
  NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT,
} from "./nhm2-semiclassical-v3-replay-epoch.v1";
import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
} from "./nhm2-semiclassical-v3-constraint-operand-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
} from "./nhm2-semiclassical-v3-pair-numeric-agreement-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256,
} from "./nhm2-spherical-boson-star-1s-v3-tolerance-policy.v1";

export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_ARTIFACT_ID =
  "nhm2.spherical_boson_star_coherent_candidate_plan" as const;
export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_coherent_candidate_plan/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID =
  "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING_PINS =
  Object.freeze({
    replayEpochPolicySha256:
      "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
    constraintArithmeticPolicySha256:
      "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
    pairNumericAgreementPolicySha256:
      "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
    tolerancePolicySha256:
      "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
    inputRoleOrderSha256:
      "a2d6c6c256b7dbfcbb87873a9cd5659d471a8a92b38e9720192aa83d6023994b",
    scientificInputRoleOrderSha256:
      "fbefe8a647f1a11c81148a931258a850b6b41041927552bb76429197f12e238b",
    implementationInputRoleOrderSha256:
      "4977f5339269383309287bf5f3e81a33c108e8e212eebc281591cbee020b9406",
    outputRoleOrderSha256:
      "95ce1862e00c151f7bb36e483e7fffbe7c08b23791f8682dff4a0268b688f227",
    derivationSidecarRoleOrderSha256:
      "9ec55cfe0f5b109166abc72e35b08a5e2dbc0dfbf2ec1c43341cda01a40a917b",
    replayMetricLeafIdsSha256:
      "99eb0b2077bea07be03a3fe08db126c5014f6801c0ac6bb220c6dd2723aa7498",
    replayMetricCoverageSha256:
      "b9c806970fbe853603ad666ee454a6e16f0a9aebd85903b4de9e41098586b574",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS =
  Object.freeze([
    "spherical_boson_star_branch_not_solved",
    "radial_monotonicity_and_no_fold_receipt_absent",
    "covariant_metric_error_not_enclosed",
    "metric_demand_lower_bound_nondegeneracy_receipt_absent",
    "self_consistent_semiclassical_backreaction_not_converged",
    "hadamard_mode_sum_not_computed",
    "renormalized_mean_rset_not_computed",
    "connected_noise_kernel_not_computed",
    "total_effective_action_constraint_algebra_not_computed",
    "v3_constraint_operand_manifest_not_produced",
    "candidate_manifest_and_scientific_preseal_absent",
    "primary_execution_not_issued_or_built",
    "independent_execution_not_issued_or_built",
    "v3_raw_replay_not_executed_for_candidate",
    "v3_pair_numeric_agreement_not_executed",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 8192,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 8192,
  } as const);

const AXIS_COORDINATES = Object.freeze([
  Object.freeze({ exact: "-3/8", value: -3 / 8 }),
  Object.freeze({ exact: "-1/8", value: -1 / 8 }),
  Object.freeze({ exact: "1/8", value: 1 / 8 }),
  Object.freeze({ exact: "3/8", value: 3 / 8 }),
] as const);

const SAMPLE_CENTERS = Object.freeze(
  AXIS_COORDINATES.flatMap((z, iz) =>
    AXIS_COORDINATES.flatMap((y, iy) =>
      AXIS_COORDINATES.map((x, ix) =>
        Object.freeze({
          ordinal: 16 * iz + 4 * iy + ix,
          muTimesCoordinate: Object.freeze({ x, y, z }),
        }),
      ),
    ),
  ),
);

const PLAN = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CONTRACT_VERSION,
  authority: "preregistered_candidate_plan_identity_only",
  maturity: "v3_diagnostic_candidate_selection_only_all_evidence_absent",
  selectionFrozen: true,
  scientificCandidateAdmissible: false,
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
    scientificRole:
      "fresh_spherical_1s_joint_geometry_state_control_for_the_semiclassical_v3_lane",
    lineage:
      "new_unobserved_spherical_control_preregistered_under_a_new_candidate_id_and_contract_not_a_retune_fallback_or_branch_switch_of_the_observed_prolate_2p_lineage",
    prolateCandidateInherited: false,
    prolateObservationUsedToChooseNumericValues: false,
    currentNhm2Geometry: false,
    warpGeometry: false,
    casimirApparatus: false,
    transportMechanism: false,
    declaredLeverOrTileTensorUsed: false,
    retuningAfterObservationAllowed: false,
    fallbackBranchAfterObservationAllowed: false,
    failureDisposition: "fail_this_candidate_without_retuning",
    changeRule:
      "any_change_to_selector_state_chart_normalization_sampling_smearing_tolerance_regulator_or_algorithm_requires_a_new_candidate_id_and_contract_version_before_execution",
  },
  conventions: {
    naturalUnits: "hbar=c=1",
    spacetimeSignature: "(-,+,+,+)",
    einsteinEquation: "G_ab=8*pi*G*<T_ab>_ren",
    cosmologicalConstant: { exact: "0", value: 0 },
    tensorComponentOrder: [
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
    ],
  },
  matterModel: {
    field: "single_minimally_coupled_complex_scalar",
    action:
      "S_m=-integral_sqrt(-g)*(nabla_a(Phi_star)*nabla^a(Phi)+mu^2*Phi_star*Phi)",
    curvatureCouplingXi: { exact: "0", value: 0 },
    selfCouplingLambda: { exact: "0", value: 0 },
    dimensionlessGravitationalCoupling: {
      expression: "8*pi*G*mu^2",
      exact: "2^-40",
      value: 2 ** -40,
    },
    coherentPeakAmplitude: {
      expression:
        "sqrt(8*pi*G)*max_Sigma(abs(phi_c))_with_phi_c=<Phi>_the_coherent_c_number_mean_field",
      exact: "2^-10",
      value: 2 ** -10,
      heldFixedThroughoutBackreactionIteration: true,
      quantumOperatorAmplitudeSelectorAllowed: false,
    },
  },
  frozenBranchSelector: {
    multipolarQuantumNumbers: { N: 1, ell: 0, m: 0 },
    commonName: "lowest_nodeless_1s_spherical_branch",
    radialNodeCount: 0,
    parity: "even_under_every_spatial_inversion_and_reflection",
    symmetry: "static_spherically_symmetric",
    regularity: "regular_horizonless_everywhere",
    boundaryCondition: "asymptotically_flat",
    continuationOrigin: "vacuum_zero_amplitude_limit",
    selectedSegment:
      "first_weak_field_solution_at_the_frozen_peak_amplitude_continuously_connected_to_vacuum_and_strictly_before_the_first_ADM_mass_or_frequency_turning_point",
    scalarAnsatz: "Phi(t,r)=phi(r)*exp(-i*omega*t)",
    scalarPhaseConvention: "phi(0)_is_real_and_strictly_positive",
    omegaOverMu: null,
    omegaDuty:
      "solve_as_an_eigenvalue_without_reading_gate_outputs_and_block_on_nonuniqueness_nodes_loss_of_radial_monotonicity_or_a_branch_fold",
    arbitraryLiteratureFrequencyAllowed: false,
    classicalEinsteinKleinGordonSolutionIsOnlyIterationSeed: true,
    radialProfileRules: {
      originValueStrictlyPositive: true,
      nodelessForFiniteRadius: true,
      nonincreasingAwayFromOrigin: true,
      secondaryRadialExtremaAllowed: false,
      asymptoticLimit: "phi_to_0_as_r_to_infinity",
      observedMonotonicityReceipt: null,
      monotonicityEstablished: false,
    },
    noFoldRules: {
      continuationParameter: "sqrt(8*pi*G)*max_Sigma(abs(phi_c))_held_at_2^-10",
      mustRemainOnVacuumConnectedFirstWeakFieldSegment: true,
      firstMassOrFrequencyTurningPointMayBeCrossed: false,
      branchReplacementAfterFoldAllowed: false,
      observedNoFoldReceipt: null,
      noFoldEstablished: false,
    },
    geometryGauge: {
      coordinates: ["t", "r", "theta", "varphi"],
      metricAnsatz:
        "ds^2=-exp(2*F0(r))*dt^2+exp(2*F1(r))*(dr^2+r^2*dtheta^2+r^2*sin(theta)^2*dvarphi^2)",
      unknownFunctions: ["F0(r)", "F1(r)"],
      isotropicRadialCondition:
        "g_rr=g_thetatheta/r^2=g_varphi_varphi/(r^2*sin(theta)^2)=exp(2*F1)_and_all_off_diagonal_components_zero",
      asymptoticConditions: "F0=F1=0_and_phi=0_as_r_to_infinity",
      radialOriginConditions:
        "partial_r_F0=partial_r_F1=partial_r_phi=0_at_r=0_with_finite_F0_F1_phi",
      elementaryFlatness:
        "spherical_isotropic_ansatz_enforces_axis_elementary_flatness",
      cartesianMap: [
        "x=r*sin(theta)*cos(varphi)",
        "y=r*sin(theta)*sin(varphi)",
        "z=r*cos(theta)",
      ],
      residualCoordinateTransformAllowed: false,
      postsolveRadialReparameterizationAllowed: false,
    },
  },
  jointSemiclassicalState: {
    stateClass: "coherent_displacement_of_static_ground_state_hadamard_vacuum",
    construction:
      "omega_alpha_g=W(phi_c)|0_g>_with_<Phi>=phi_c_on_the_same_self_consistent_geometry",
    groundStateTime: "asymptotic_static_Killing_time",
    coherentMeanEquation: "(box_g-mu^2)*phi_c=0",
    requiredMeanStress: "<T_ab>_alpha_ren=T_ab[phi_c]+<T_ab>_0g_ren",
    vacuumPolarizationMayBeDroppedOrFit: false,
    coherentDisplacementPreservesHadamardSingularity: true,
    connectedNoiseDefinition:
      "N_abcd(x,y)=one_half*<anticommutator(T_ab-<T_ab>,T_cd-<T_cd>)>_alpha",
    connectedNoiseDerivation:
      "point_split_Wick_reduction_from_the_same_coherent_Hadamard_state",
    submittedLeverOrTileTensorAllowed: false,
  },
  renormalization: {
    scheme: "locally_covariant_Hadamard_point_splitting",
    hadamardLength: { expression: "ell=mu^-1", exact: "1/mu" },
    finiteAmbiguityConditions: [
      "renormalized_Minkowski_vacuum_stress_equals_zero",
      "Newton_constant_equals_the_registered_G_at_scale_mu",
      "renormalized_curvature_squared_coefficients_equal_zero_at_scale_mu",
    ],
    conservationRestoringLocalTerm:
      "must_be_derived_from_the_same_diffeomorphism_invariant_one_loop_effective_action",
    conservationRestoringCoefficient: null,
    producerSelectedFiniteCountertermsAllowed: false,
  },
  selfConsistency: {
    equation: "G_ab[g]=8*pi*G*(T_ab[phi_c,g]+<T_ab>_0g_ren)",
    classicalGeometryOnlyAllowed: false,
    iterationSeed: "classical_spherical_1s_Einstein_Klein_Gordon_solution",
    relativeLInfConvergenceTarget: { exact: "10^-3", value: 1e-3 },
    converged: null,
    residualRelativeLInf: null,
    branchReplacementAfterFailureAllowed: false,
  },
  chartTetradSamplingAndSmearing: {
    slice: "t=0",
    chart:
      "the_exact_isotropic_spherical_gauge_and_standard_spherical_to_Cartesian_map_frozen_in_frozenBranchSelector.geometryGauge",
    tetrad: {
      sphericalFrame: [
        "e_hat0=exp(-F0)*partial_t",
        "e_hatr=exp(-F1)*partial_r",
        "e_hattheta=exp(-F1)*r^-1*partial_theta",
        "e_hatvarphi=exp(-F1)*(r*sin(theta))^-1*partial_varphi",
      ],
      cartesianFrame:
        "(e_hatx,e_haty,e_hatz)_is_the_standard_right_handed_spherical_to_Cartesian_rotation_of_(e_hatr,e_hattheta,e_hatvarphi)",
      timeOrientation:
        "e_hat0_future_directed_and_matches_partial_t_at_infinity",
      spatialOrientation: "e_hatx_cross_e_haty=e_hatz_at_infinity",
      componentOrder: [
        "00",
        "01",
        "02",
        "03",
        "11",
        "12",
        "13",
        "22",
        "23",
        "33",
      ],
      postsolveLorentzOrSpatialRotationAllowed: false,
    },
    coordinateGamingToPopulateStructuralZerosAllowed: false,
    structuralTensorZerosAllowedOnlyWhenDerived: true,
    sampleCount: 64,
    axisCoordinates: AXIS_COORDINATES,
    enumerationOrder: ["z_outer", "y_middle", "x_inner"],
    ordinalFormula: "ordinal=16*i_z+4*i_y+i_x",
    centers: SAMPLE_CENTERS,
    smearing: {
      kind: "normalized_C_infinity_spacetime_product_bump",
      oneDimensionalBump:
        "q(u)=exp(-u^2/(1-u^2))_for_abs(u)<1_and_zero_otherwise",
      dimensionlessHalfWidths: {
        muDeltaT: { exact: "1/64", value: 1 / 64 },
        muDeltaX: { exact: "1/64", value: 1 / 64 },
        muDeltaY: { exact: "1/64", value: 1 / 64 },
        muDeltaZ: { exact: "1/64", value: 1 / 64 },
      },
      normalizedAgainst: "sqrt(-g)_d4x",
    },
  },
  tolerancePolicy: {
    policy: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY,
    binding: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
    literalSha256Pin:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING_PINS.tolerancePolicySha256,
    presealReceipt: null,
    presealed: false,
  },
  nondegeneracyPresealGate: {
    source: "tolerancePolicy.policy.nondegeneracyPresealGate",
    requiredBeforeScientificPreseal: true,
    metricDemandLowerBoundReceipt: null,
    established: false,
    candidateSelectionOrSphericalSymmetryIsProof: false,
    failureDisposition: "fail_candidate_without_retuning",
    scientificCandidateAdmissible: false,
  },
  governedOutputPlan: {
    valuesPresent: false,
    noCompression: true,
    noReducedBasisSubstitution: true,
    everyOutputRoleMustBeMaterializedAsRawFloat64Array: true,
    outputRoleOrder: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
    outputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
    outputArrayCount: NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT,
    decodedFloat64ArrayCount: NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT,
    solverSciencePayloadFileCount:
      NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT,
    metricDemand: { shape: [64, 10], unit: "J/m^3", value: null },
    metricDemandAbsoluteErrorBound: {
      shape: [64, 10],
      unit: "J/m^3",
      value: null,
      maximumRelativeFrobeniusEnclosure: 0.01,
    },
    meanRset: { shape: [64, 10], unit: "J/m^3", value: null },
    meanRsetAbsoluteUncertainty95: {
      shape: [64, 10],
      unit: "J/m^3",
      value: null,
    },
    connectedNoiseKernel: {
      shape: [64, 64, 100],
      unit: "(J/m^3)^2",
      value: null,
      rawFullArrayRequired: true,
      lowRankFactorOrMomentSummarySufficient: false,
    },
    connectedNoiseAbsoluteUncertainty95: {
      shape: [64, 64, 100],
      unit: "(J/m^3)^2",
      value: null,
    },
    bracketAndIdentityShape: [64, 4],
    rawArrays: null,
  },
  totalConstraintDuty: {
    formulation:
      "ADM_Legendre_transform_of_the_same_renormalized_diffeomorphism_invariant_one_loop_effective_action_with_its_state_history_variables_retained",
    alternativesAfterFreezeAllowed: false,
    normalization: {
      coordinates: "xbar^a=mu*x^a_and_tbar=mu*t",
      scalar: "Phibar=sqrt(8*pi*G)*Phi",
      generatorDefinition:
        "Hbar_and_Dbar_are_the_dimensionless_generators_obtained_by_the_ADM_Legendre_transform_of_the_barred_effective_action",
      scale: "one_in_the_frozen_barred_canonical_units",
      normalizedValue:
        "the_raw_Hbar_Dbar_bracket_target_or_identity_value_without_any_output_dependent_rescaling",
      inputOnly: true,
      outputDependentRescalingAllowed: false,
    },
    canonicalPhaseSpace: {
      gravityVariables: ["qbar_ab", "pibar^ab"],
      stateVariables:
        "barred_coherent_mean_and_Gaussian_two_point_data_on_the_projective_Hilbert_state_manifold",
      totalBracket:
        "Poissonbar_total=Poissonbar_ADM_plus_inverse(Omegabar_state)_with_no_state_variable_held_fixed_during_metric_variation",
      fixedStateDuringGravityVariationAllowed: false,
    },
    requiredTerms: [
      "gravity",
      "coherent_mean_field",
      "renormalized_vacuum",
      "gravity_matter_cross_variations",
      "state_and_geometry_functional_variations",
      "structure_function_targets",
    ],
    targetConstruction: {
      H_H: "Dbar_total[qbar^ab*(N*partialbar_b(M)-M*partialbar_b(N))]_from_sealed_geometry_and_external_probes",
      H_Hi: "-Hbar_total[X^a*partialbar_a(N)]_from_sealed_geometry_and_external_probes",
      Hi_Hj:
        "Dbar_total[X^b*partialbar_b(Y^a)-Y^b*partialbar_b(X^a)]_from_sealed_geometry_and_external_probes",
      targetMayReadComputedOrResidualArrays: false,
      independentServerReplayRequired: true,
    },
    constraintOperandSchema: {
      artifactId: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
      schemaBoundary: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
      levels: NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
      familyOrder: NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
      roleOrder: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER,
      outputRoles: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
      operandArraysPerLevel:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
      operandArrayCount: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
      operandArraySizeBytes:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
      noCompression: true,
      noAggregateResidualSubstitution: true,
      everyPrimitiveComputedTargetReverseAndNestedTermRequired: true,
      runtimeManifest: null,
      structurallyAdmissible: false,
    },
    regulator: {
      levels: NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
      centralArraysUseLevel: "level_2",
      serverMustRecomputeEveryFamilyResidualBeforeDifferencing: true,
      serverMustEvaluateConvergenceSeparatelyForEveryFamily: true,
      arithmeticPolicy: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
      exactZeroDisposition:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.exactZeroDisposition,
      noPostObservationLevelOrCutoffChange: true,
      result: null,
    },
    result: null,
  },
  v3Bindings: {
    bindingPins: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING_PINS,
    replayEpoch: {
      policy: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY,
      binding: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
      inputRoles: NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
      scientificInputRoles: NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
      implementationInputRoles: NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
      outputRoles: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
      derivationSidecarRoles:
        NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
    },
    constraintArithmetic: {
      policy: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
      binding: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    },
    pairNumericAgreement: {
      policy: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
      binding: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
      pairExecutionPresent: false,
      pairAgreementAuthority: false,
    },
  },
  inputClosureTopology: {
    scientific: {
      roles: NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
      roleCount: 25,
      roleOrderSha256: NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
      exactBytesSharedAcrossPairRequired: true,
      frozenByScientificPreseal: true,
      closurePresent: false,
    },
    implementation: {
      roles: NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
      roleCount: 3,
      roleOrderSha256:
        NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
      exactBytesDistinctAcrossPairRequired: true,
      descriptorsDistinctAcrossPairRequired: true,
      primaryClosurePresent: false,
      independentClosurePresent: false,
    },
    completeRun: {
      roles: NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
      roleCount: 28,
      roleOrderSha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
      mustBeFrozenBeforeExecution: true,
      primaryClosurePresent: false,
      independentClosurePresent: false,
    },
    roleOrderPins: {
      output: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
      derivationSidecar:
        NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
      replayMetricLeaves: NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256,
      replayMetricCoverage: NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256,
    },
  },
  derivationReceiptDuties: {
    requiredRoles: NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
    operandDerivationMustBindAll63RawArrays: true,
    uncertaintyDerivationMustCoverEveryPrimitiveAndResidual: true,
    targetDerivationMustBeReplayedFromSealedGeometryAndExternalProbes: true,
    sidecars: null,
    structurallyAdmissible: false,
  },
  implementationSeparationPlan: {
    primary:
      "spectral_radial_Newton_Krylov_geometry_plus_covariant_mode_sum_and_effective_action_differentiation",
    independent:
      "independent_radial_finite_element_geometry_plus_separately_transcribed_mode_and_constraint_implementation",
    sharedScientificCodeAllowed: false,
    sharedGeneratedEquationsAllowed: false,
    sharedInputsAllowed: "only_the_exact_25_role_scientific_preseal",
    sourceDependencyAndExecutableBytesMustBeDistinct: true,
    outputRootsMustBeDisjoint: true,
    primarySourceSha256: null,
    independentSourceSha256: null,
    primaryExecutableSha256: null,
    independentExecutableSha256: null,
  },
  preregistrationLifecycle: {
    issuer: null,
    builder: null,
    primaryExecution: null,
    independentExecution: null,
    candidateManifest: null,
    scientificPreseal: null,
    primaryReplayReceipt: null,
    independentReplayReceipt: null,
    pairReceipt: null,
    stressNoiseLampReceipt: null,
    constraintAlgebraLampReceipt: null,
  },
  authorityBoundary: {
    candidateAuthority: false,
    scientificCandidateAdmissible: false,
    issuerAuthority: false,
    builderAuthority: false,
    executionAuthority: false,
    branchSolveAuthority: false,
    nondegeneracyAuthority: false,
    scientificPresealAuthority: false,
    rawReplayAuthority: false,
    runReplayAuthority: false,
    pairAgreementAuthority: false,
    independentImplementationAgreementEstablished: false,
    semiclassicalStressNoiseLamp: false,
    semiclassicalConstraintAlgebraLamp: false,
    diagnosticPass: false,
    theoryGraphAuthority: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS,
  unresolvedEvidence: {
    solvedFrequencyOverMu: null,
    solvedGeometrySha256: null,
    solvedStateSha256: null,
    radialMonotonicityReceipt: null,
    noFoldReceipt: null,
    metricDemandLowerBoundReceipt: null,
    conservationCorrectionSha256: null,
    metricDemandArrays: null,
    meanRsetArrays: null,
    connectedNoiseArrays: null,
    constraintArrays: null,
    regulatorEvidence: null,
    runtimeReceipt: null,
    candidateManifest: null,
    scientificPreseal: null,
    constraintOperandManifest: null,
    derivationSidecars: null,
    replayReceipt: null,
    independentPairReceipt: null,
    stressNoiseLampReceipt: null,
    constraintAlgebraLampReceipt: null,
  },
  claimLockKeys: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  claimLocks: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN =
  deepFreeze(PLAN);

const assertPlanInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING_PINS;
  if (
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256 !==
      pins.replayEpochPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256 !==
      pins.constraintArithmeticPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING.sha256 !==
      pins.pairNumericAgreementPolicySha256 ||
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256 !==
      pins.tolerancePolicySha256 ||
    NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256 !==
      pins.inputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256 !==
      pins.scientificInputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256 !==
      pins.implementationInputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256 !==
      pins.outputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256 !==
      pins.derivationSidecarRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256 !==
      pins.replayMetricLeafIdsSha256 ||
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256 !==
      pins.replayMetricCoverageSha256 ||
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length !== 25 ||
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS.length !== 3 ||
    NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length !== 28 ||
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES.length !== 68 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES.length !== 63 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT !== 63 ||
    NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT !== 70 ||
    NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT !== 71 ||
    Object.values(PLAN.authorityBoundary).some((value) => value !== false) ||
    Object.values(PLAN.claimLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_coherent_candidate_plan_invariant_violation",
    );
  }
};

assertPlanInvariants();

export type Nhm2SphericalBosonStarCoherentCandidatePlanV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN;

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { visitedNodes: number };

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget: SnapshotBudget = { visitedNodes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.visitedNodes += 1;
  if (budget.visitedNodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    return Buffer.byteLength(value, "utf8") <= limits.maximumStringUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `string_byte_length_limit:${pointer || "/"}`,
        });
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value !== "object") {
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cyclic_value:${pointer || "/"}`,
    });
  }
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return Object.freeze({
        ok: false,
        violation: `non_plain_array:${pointer || "/"}`,
      });
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    const length =
      lengthDescriptor != null && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      typeof length !== "number" ||
      !Number.isSafeInteger(length) ||
      length < 0
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_length:${pointer || "/"}`,
      });
    }
    if (length > limits.maximumArrayLength) {
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      return Object.freeze({
        ok: false,
        violation: `symbol_key:${pointer || "/"}`,
      });
    }
    const indexKeys = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== length + 1 ||
      indexKeys.length !== length ||
      indexKeys.some((key) => {
        if (!/^(0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index < 0 || index >= length;
      })
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_surface:${pointer || "/"}`,
      });
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return Object.freeze({
          ok: false,
          violation: `array_entry_surface:${pointer}/${index}`,
        });
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return Object.freeze({
      ok: false,
      violation: `non_plain_object:${pointer || "/"}`,
    });
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    return Object.freeze({
      ok: false,
      violation: `symbol_key:${pointer || "/"}`,
    });
  }
  if (keys.length > limits.maximumObjectPropertyCount) {
    return Object.freeze({
      ok: false,
      violation: `object_property_count_limit:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_KEYS.has(key)) {
      return Object.freeze({
        ok: false,
        violation: `forbidden_key:${pointer}/${key}`,
      });
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return Object.freeze({
        ok: false,
        violation: `object_property_surface:${pointer}/${key}`,
      });
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value);
  return Object.freeze({ ok: true, value: output });
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN);
export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-coherent-candidate-plan/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_JSON;

export const nhm2SphericalBosonStarCoherentCandidatePlanViolations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_candidate_plan_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["spherical_candidate_plan_external_copy_not_authoritative"]
      : ["spherical_candidate_plan_semantic_mismatch"];
  } catch {
    return ["spherical_candidate_plan_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarCoherentCandidatePlan = (
  value: unknown,
): value is Nhm2SphericalBosonStarCoherentCandidatePlanV1 =>
  nhm2SphericalBosonStarCoherentCandidatePlanViolations(value).length === 0;
