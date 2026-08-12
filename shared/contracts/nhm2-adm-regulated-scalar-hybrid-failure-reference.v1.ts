export const NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_ARTIFACT_ID =
  "nhm2.adm_regulated_scalar_hybrid_failure_reference" as const;

export const NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CONTRACT_VERSION =
  "nhm2_adm_regulated_scalar_hybrid_failure_reference/v1" as const;

const CONSTRAINT_COMPONENT_ORDER = [
  "hamiltonian",
  "momentum_x",
  "momentum_y",
  "momentum_z",
] as const;

const BRACKET_FAMILIES = ["H_H", "H_Hi", "Hi_Hj"] as const;

const GRID_LEVELS = [
  {
    level: 0,
    pointsPerAxis: 4,
    pointCount: 64,
    spacingExact: "2^-1",
    spacing: 1 / 2,
  },
  {
    level: 1,
    pointsPerAxis: 8,
    pointCount: 512,
    spacingExact: "2^-2",
    spacing: 1 / 4,
  },
  {
    level: 2,
    pointsPerAxis: 16,
    pointCount: 4096,
    spacingExact: "2^-3",
    spacing: 1 / 8,
  },
] as const;

const ANCHOR_COORDINATES = ["-3/8", "-1/8", "1/8", "3/8"] as const;
const ANCHORS = ANCHOR_COORDINATES.flatMap((z, iz) =>
  ANCHOR_COORDINATES.flatMap((y, iy) =>
    ANCHOR_COORDINATES.map((x, ix) => ({
      ordinal: 16 * iz + 4 * iy + ix,
      coordinateExact: { x, y, z },
    })),
  ),
);

const FUTURE_BRACKET_RAW_ROLE_PLAN = BRACKET_FAMILIES.flatMap((bracketId) =>
  ["computed", "target", "residual", "absolute_uncertainty95"].map(
    (quantity) => ({
      role: `constraint_bracket.${bracketId}.${quantity}`,
      shape: [64, 4] as const,
      componentOrder: CONSTRAINT_COMPONENT_ORDER,
      unit: "dimensionless",
      dtype: "float64",
      binaryEncoding: "raw_ieee754",
      endianness: "little",
      storageOrder: "row-major",
    }),
  ),
);

const FUTURE_IDENTITY_RAW_ROLE_PLAN = [
  "antisymmetry.forward",
  "antisymmetry.reverse",
  "antisymmetry.residual",
  "antisymmetry.absolute_uncertainty95",
  "jacobi.term_1",
  "jacobi.term_2",
  "jacobi.term_3",
  "jacobi.residual",
  "jacobi.absolute_uncertainty95",
] as const;

const FUTURE_REGULATOR_RAW_ROLE_PLAN = GRID_LEVELS.flatMap((grid) => [
  {
    role: `regulator_level.${grid.level}.residual`,
    shape: [64, 4] as const,
    componentOrder: CONSTRAINT_COMPONENT_ORDER,
    unit: "dimensionless",
    dtype: "float64",
    binaryEncoding: "raw_ieee754",
    endianness: "little",
    storageOrder: "row-major",
  },
  {
    role: `regulator_level.${grid.level}.absolute_uncertainty95`,
    shape: [64, 4] as const,
    componentOrder: CONSTRAINT_COMPONENT_ORDER,
    unit: "dimensionless",
    dtype: "float64",
    binaryEncoding: "raw_ieee754",
    endianness: "little",
    storageOrder: "row-major",
  },
]);

const CENTRAL_VALUE_ROUNDING_DUTY =
  "for_every_central_raw_scalar_derive_a_certified_real_interval_narrower_than_0.5_ULP_of_the_candidate_binary64_require_the_entire_interval_to_round_to_one_finite_binary64_under_IEEE754_roundTiesToEven_then_emit_that_unique_value_otherwise_block_without_choosing_a_byte" as const;

const IMPLEMENTATION_LINEAGES = [
  {
    role: "primary",
    implementationId: "adm_scalar_direct_canonical_ad_sbp_primary",
    method:
      "differentiate_the_discrete_ADM_plus_frozen_state_expectation_functionals_by_automatic_differentiation_then_contract_the_canonical_symplectic_form",
    derivativeScheme:
      "second_order_periodic_summation_by_parts_centered_difference",
    arithmeticDuty:
      "binary64_outputs_must_be_enclosed_by_separately_accumulated_directed_rounding_or_higher_precision_bounds",
    centralValueRoundingDuty: CENTRAL_VALUE_ROUNDING_DUTY,
    targetDuty:
      "derive_classical_Dirac_targets_from_the_frozen_smearings_without_reading_computed_or_residual_arrays",
    identityDuty:
      "evaluate_forward_reverse_and_all_three_nested_Jacobi_terms_as_separate_Poisson_bracket_calls",
    sharedCodeAllowedWithIndependent: false,
    sharedInputsAllowed:
      "this_frozen_semantic_reference_only_before_independent_equation_transcription",
    executionStatus: "planned_not_executed",
    sourceSha256: null,
    dependencyLockSha256: null,
    executableSha256: null,
  },
  {
    role: "independent",
    implementationId: "adm_scalar_manual_variation_same_functional_independent",
    method:
      "manually_differentiate_the_exact_same_frozen_nodewise_D0_7_point_ADM_scalar_functional_and_independently_reconstruct_the_Husain_Javed_anomaly_terms",
    derivativeScheme:
      "independent_equation_transcription_of_the_exact_same_frozen_periodic_D0_and_7_point_operators_not_an_alternative_discrete_functional",
    arithmeticDuty:
      "separate_high_precision_or_interval_enclosure_with_no_import_of_primary_numeric_helpers",
    centralValueRoundingDuty: CENTRAL_VALUE_ROUNDING_DUTY,
    targetDuty:
      "independently_transcribe_the_three_Dirac_structure_function_targets_and_frozen_operand_signs",
    identityDuty:
      "evaluate_reverse_and_nested_brackets_from_independent_canonical_gradients_not_from_primary_or_target_arrays",
    sharedCodeAllowedWithIndependent: false,
    sharedInputsAllowed:
      "this_frozen_semantic_reference_only_before_independent_equation_transcription",
    executionStatus: "planned_not_executed",
    sourceSha256: null,
    dependencyLockSha256: null,
    executableSha256: null,
  },
] as const;

export const NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CLAIM_LOCKS =
  Object.freeze({
    candidateAuthority: false as const,
    presealAuthority: false as const,
    rawReplayAuthority: false as const,
    lampAuthority: false as const,
    theoryGraphAuthority: false as const,
    diagnosticPass: false as const,
    constraintClosure: false as const,
    anomalyFreeSemiclassicalGravity: false as const,
    continuumConstraintAnomaly: false as const,
    continuumHadamardState: false as const,
    covariantlyRenormalizedRset: false as const,
    connectedStressNoiseKernel: false as const,
    currentNhm2MetricIdentity: false as const,
    currentNhm2SourceIdentity: false as const,
    casimirSourceIdentity: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
  });

const REFERENCE = {
  artifactId: NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_ARTIFACT_ID,
  contractVersion:
    NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CONTRACT_VERSION,
  authority: "frozen_negative_control_semantic_reference_only",
  maturity: "diagnostic_negative_control_unexecuted",
  diagnosticOnly: true,
  negativeControl: {
    referenceId: "adm_regulated_scalar_hybrid_expected_closure_failure",
    semanticRole:
      "executable_future_negative_control_for_a_naive_gravity_plus_fixed_quantum_state_expectation_value_substitution",
    expectedScientificDisposition:
      "at_least_one_finite_grid_constraint_closure_family_is_expected_to_fail_while_canonical_antisymmetry_and_Jacobi_remain_numerically_resolved_but_execution_is_required_and_the_continuum_anomaly_remains_unresolved",
    expectedDispositionIsNotAnOutput: true,
    unexpectedNumericalPassAuthority: false,
    agreementOnFailureMeaning:
      "reproducible_finite_grid_frozen_candidate_limit_only_not_a_continuum_anomaly_constraint_closure_or_theory_completion",
    fixedBackgroundMatterOnly: false,
    fullAnomalyFreeQuantumGravityMatterTheory: false,
    passOracle: false,
    retuningAfterFreezeAllowed: false,
    fallbackCandidateSelectionAllowed: false,
  },
  conventions: {
    spacetimeSignature: "(-,+,+,+)",
    spatialDimension: 3,
    codeUnits: "c=hbar=kappa_8piG=1",
    kappaExact: "1",
    cosmologicalConstantExact: "0",
    canonicalPoissonBracket:
      "{F,G}=integral_d3x[(delta_F/delta_q_ab)*(delta_G/delta_pi^ab)-(delta_F/delta_pi^ab)*(delta_G/delta_q_ab)]",
    symmetricCanonicalStorage: {
      qOrder: ["q_xx", "q_yy", "q_zz", "q_xy", "q_xz", "q_yz"],
      pOrder: ["P_xx", "P_yy", "P_zz", "P_xy", "P_xz", "P_yz"],
      momentumDecoding: {
        diagonal: "pi_xx=P_xx, pi_yy=P_yy, pi_zz=P_zz",
        offDiagonal: "pi_xy=P_xy/2, pi_xz=P_xz/2, pi_yz=P_yz/2",
      },
      reason:
        "P_xy=2*pi_xy_and_corresponding_xz_yz_relations_preserve_pi^ab*dq_ab=sum_I(P_I*dQ_I)_for_symmetric_tensors",
    },
    piConvention: "pi^ab=(sqrt(q)/(2*kappa))*(K^ab-q^ab*K)_with_kappa_equal_1",
    momentumConstraintSign: "D_G_a=-2*q_ab*D_c(pi^bc)",
    bracketOperandOrderIsSignificant: true,
  },
  canonicalFormulation: {
    phaseSpace: {
      gravityCanonicalPair: ["q_ab", "pi^ab"],
      bracketedVariables: ["q_ab", "pi^ab"],
      frozenExternalQuantumStateData: [
        "phi_mean",
        "p_phi_mean",
        "C_phi_phi",
        "C_p_p",
        "C_sym_phi_p",
      ],
      regulatedScalarCommutator:
        "[phi_j,p_phi_k]=i*h_level^-3*delta_jk_on_each_grid_level",
      quantumStateIncludedInSymplecticPhaseSpace: false,
      scientificConsequence:
        "the_frozen_state_expectation_substitution_is_a_naive_canonical_semiclassical_hybrid_and_is_not_presumed_to_close",
    },
    gravityHamiltonianDensity:
      "H_G=(2*kappa/sqrt(q))*(pi_ab*pi^ab-(1/2)*pi^2)-(sqrt(q)/(2*kappa))*(R3-2*Lambda)",
    gravityMomentumDensity: "D_G_a=-2*q_ab*D_c(pi^bc)",
    scalarHamiltonianDensity:
      "H_phi_h(j)=(1/2)*(p_phi(j)^2/sqrt(q(j))+sqrt(q(j))*(q^ab(j)*D0_a(phi)(j)*D0_b(phi)(j)+m^2*phi(j)^2))",
    scalarMomentumDensity:
      "D_phi_a_h(j)=(1/2)*(p_phi(j)*D0_a(phi)(j)+D0_a(phi)(j)*p_phi(j))",
    expectedMatterFunctionals: {
      hOmega:
        "h_omega[q]=expectation_omega(H_phi[q])_from_the_frozen_means_and_covariances",
      cOmega:
        "c_omega_a=expectation_omega(D_phi_a)_from_the_frozen_means_and_covariances",
      fixedDuringGravityPoissonDifferentiation: true,
    },
    effectiveGenerators: {
      hamiltonian: "H_eff[N]=integral_d3x*N*(H_G+h_omega[q])",
      momentum: "D_eff[X]=integral_d3x*X^a*(D_G_a+c_omega_a)",
    },
    classicalDiracTargets: {
      H_H: "{H_eff[N],H_eff[M]}_target=D_eff[W_D0], W_D0^a(j)=q^ab(j)*(N(j)*D0_b(M)(j)-M(j)*D0_b(N)(j))",
      H_Hi: "{H_eff[N],D_eff[X]}_target=-H_eff[L_X_D0(N)], L_X_D0(N)(j)=X^a(j)*D0_a(N)(j)",
      Hi_Hj:
        "{D_eff[X],D_eff[Y]}_target=D_eff[[X,Y]_D0], [X,Y]_D0^a(j)=X^b(j)*D0_b(Y^a)(j)-Y^b(j)*D0_b(X^a)(j)",
    },
    anomalyWitness:
      "on_each_finite_grid_the_frozen_pi_equal_zero_slice_is_expected_to_make_the_direct_gravity_phase_space_H_H_bracket_omit_the_nonzero_c_omega[W]_term_present_in_the_D_eff[W]_target_but_only_execution_can_establish_the_finite_grid_residual_and_no_continuum_anomaly_is_claimed",
    fixedBackgroundWardIdentitySubstitutionAllowed: false,
  },
  frozenBaseData: {
    manifoldAndBoundary: {
      spatialTopology: "three_torus_used_only_as_a_regulator_box",
      coordinateDomain: "[-1,1)^3",
      periodicityLengthExact: "2",
      continuumAsymptoticFlatnessClaim: false,
    },
    compactNeedleProfile: {
      ellipsoidalCoordinate: "s=(x/(3/4))^2+(y/(1/2))^2+(z/(1/2))^2",
      interiorBump: "b(s)=exp(-s/(1-s)) for 0<=s<1",
      exteriorBump: "b(s)=0 for s>=1",
      regularity: "C_infinity_with_all_support_boundary_jets_zero",
      supportStrictlyInsideRegulatorBox: true,
    },
    admSlice: {
      conformalFactor: "psi=1+2^-8*b(s)",
      conformalAmplitude: { exact: "2^-8", value: 1 / 256 },
      spatialMetric: "q_ab=psi^4*delta_ab",
      canonicalMomentum: "pi^ab=0",
      backgroundLapse: "1",
      backgroundShift: ["0", "0", "0"],
      constraintSolved: false,
      role: "deliberately_off_shell_compact_conformal_ADM_probe_not_an_Einstein_matter_solution",
    },
  },
  regulator: {
    regulatorId: "periodic_nested_second_order_sbp_4_8_16/v1",
    grids: GRID_LEVELS,
    nodeFormula: "x_j=-1+2*j/n independently on each axis for j=0,...,n-1",
    nesting: "every_4_grid_node_is_an_8_and_16_grid_node",
    derivative: "D0_a(f)_j=(f_(j+e_a)-f_(j-e_a))/(2*h) with periodic indices",
    sevenPointLaplacian:
      "Delta_h(f)_j=sum_a(f_(j+e_a)-2*f_j+f_(j-e_a))/h^2_with_periodic_indices",
    quadrature: "h^3*sum_over_all_grid_nodes",
    discreteCanonicalPoissonBracket:
      "{F,G}_level=h^-3*sum_grid,sum_I[(partial_F/partial_Q_I)*(partial_G/partial_P_I)-(partial_F/partial_P_I)*(partial_G/partial_Q_I)] with Q_I and P_I in the frozen symmetric canonical storage order",
    formalOrder: 2,
    outputRestriction:
      "evaluate_all_64_frozen_probe_functionals_on_every_level_in_the_same_ordinal_order",
  },
  discreteGeometryAndMatterEvaluation: {
    inverseAndDeterminant:
      "at_each_node_compute_q_inverse_and_det_q_from_the_symmetric_Q_components_before_any_pointwise_contraction_and_require_det_q_positive",
    momentumDecode:
      "decode_pi_xx=P_xx_pi_yy=P_yy_pi_zz=P_zz_pi_xy=P_xy/2_pi_xz=P_xz/2_pi_yz=P_yz/2_before_lowering_or_contraction",
    momentumContractions:
      "pi_ab=q_ac*q_bd*pi^cd_and_pi_trace=q_ab*pi^ab_evaluated_pointwise_at_the_same_node",
    christoffel:
      "Gamma^a_bc(j)=(1/2)*q^ad(j)*(D0_b(q_dc)(j)+D0_c(q_db)(j)-D0_d(q_bc)(j))",
    ricci:
      "R_ab(j)=D0_c(Gamma^c_ab)(j)-D0_b(Gamma^c_ac)(j)+Gamma^c_ab(j)*Gamma^d_cd(j)-Gamma^c_ad(j)*Gamma^d_bc(j)",
    scalarCurvature: "R3(j)=q^ab(j)*R_ab(j)",
    densityWeightOfPi: 1,
    momentumDivergence:
      "D_c(pi^bc)(j)=D0_c(pi^bc)(j)+Gamma^b_cd(j)*pi^cd(j)_after_the_Gamma^c_cd*pi^bd_and_weight_one_minus_Gamma^d_dc*pi^bc_terms_cancel",
    gravityDensityPlacement:
      "sqrt_q_inverse_q_lowered_pi_pi_trace_and_R3_are_all_formed_pointwise_then_H_G_and_D_G_are_multiplied_by_the_sampled_smearing_and_summed_with_h^3",
    scalarSecondMoments: {
      pSquared: "P2_j=p_phi_bar(j)^2+C_p_p(j,j)",
      phiSquared: "Phi2_j=phi_bar(j)^2+C_phi_phi(j,j)",
      gradient:
        "G_ab(j)=D0_a(phi_bar)(j)*D0_b(phi_bar)(j)+(D0_a*C_phi_phi*D0_b_transpose)(j,j)",
      symmetrizedMomentumGradient:
        "C_a(j)=p_phi_bar(j)*D0_a(phi_bar)(j)+(1/2)*[(C_sym_p_phi*D0_a_transpose)(j,j)+(D0_a*C_sym_phi_p)(j,j)]",
    },
    scalarExpectationPlacement:
      "h_omega(j)=(1/2)*(P2_j/sqrt(q_j)+sqrt(q_j)*(q^ab(j)*G_ab(j)+m^2*Phi2_j))_and_c_omega_a(j)=C_a(j)_with_all_products_at_node_j",
    scalarCrossCovarianceConsequence:
      "C_sym_p_phi=transpose(C_sym_phi_p)=0_so_c_omega_a(j)=p_phi_bar(j)*D0_a(phi_bar)(j)",
    generatorQuadrature:
      "H_eff[N]=h^3*sum_j(N_j*(H_G_j+h_omega_j))_and_D_eff[X]=h^3*sum_j(X_j^a*(D_G_a_j+c_omega_a_j))",
    derivativeAndProductOrderingMutable: false,
  },
  scalarState: {
    stateId: "finite_lattice_coherent_gaussian_scalar_negative_control",
    fieldKind: "real_minimally_coupled_massive_scalar",
    scalarMass: { exact: "2^-2", value: 1 / 4 },
    meanFieldAmplitude: { exact: "2^-3", value: 1 / 8 },
    meanMomentumAmplitude: { exact: "2^-3", value: 1 / 8 },
    momentumTiltAmplitude: { exact: "2^-3", value: 1 / 8 },
    means: {
      phi: "phi_bar=2^-3*b(s)",
      pPhi: "p_phi_bar=2^-3*b(s)*(1+2^-3*x)",
    },
    latticeCanonicalCommutator: "[phi_j,p_phi_k]=i*h_level^-3*delta_jk",
    referenceQuadraticOperator:
      "K_h=-Delta_h+(2^-2)^2*I_with_the_frozen_periodic_7_point_Delta_h_on_each_level",
    referenceHamiltonian:
      "H_ref=(h_level^3/2)*(p_phi_transpose*p_phi+phi_transpose*K_h*phi)",
    covariance: {
      C_phi_phi: "(h_level^-3/2)*K_h^(-1/2)",
      C_p_p: "(h_level^-3/2)*K_h^(1/2)",
      C_sym_phi_p: "0",
      matrixFunctions:
        "real_symmetric_spectral_decomposition_with_positive_mass_removing_the_zero_mode_singularity",
      uncertaintySaturation:
        "C_phi_phi*C_p_p=(h_level^-6/4)*I_in_the_common_K_h_eigenbasis_matching_[phi_j,p_phi_k]=i*h_level^-3*delta_jk",
    },
    stateIsPositiveFiniteDimensionalGaussian: true,
    stateIsSubmittedArrayFixture: false,
    continuumHadamardLimitEstablished: false,
    covariantlyRenormalizedContinuumRsetEstablished: false,
    connectedContinuumNoiseKernelEstablished: false,
    physicalPreparationReceiptPresent: false,
  },
  samplingAndProbes: {
    sampleCount: 64,
    anchorCoordinateOrder: ANCHOR_COORDINATES,
    enumerationOrder: ["z_outer", "y_middle", "x_inner"],
    ordinalFormula: "ordinal=16*i_z+4*i_y+i_x",
    anchors: ANCHORS,
    compactProbe: {
      supportRadius: { exact: "2^-1", value: 1 / 2 },
      periodicDisplacement:
        "d_p^a(x)=the_unique_representative_of_x^a-x_p^a_in_[-1,1)",
      radius: "r_p^2=sum_a(d_p^a)^2",
      unnormalizedInterior: "q_p(x)=exp(-r_p^2/((2^-1)^2-r_p^2)) for r_p<2^-1",
      exterior: "q_p(x)=0 for r_p>=2^-1",
      levelNormalization: "chi_p_level=q_p/(h_level^3*sum_grid(q_p))",
      normalizedOnEveryLevel: true,
      directionCoordinates: "u_p,a=d_p^a/(2^-1)",
    },
    frozenVectors: {
      v: ["1/sqrt(21)", "2/sqrt(21)", "4/sqrt(21)"],
      w: ["4/sqrt(21)", "-2/sqrt(21)", "1/sqrt(21)"],
      basis: ["e_x", "e_y", "e_z"],
    },
  },
  bracketArrayDerivation: {
    outputShape: [64, 4],
    componentOrder: CONSTRAINT_COMPONENT_ORDER,
    channelMeaning:
      "each_slot_is_one_frozen_smeared_scalar_bracket_probe_assigned_to_the_target_constraint_sector_named_by_the_component_order",
    H_H: {
      hamiltonianChannel:
        "computed=target=residual=0_as_a_structural_sector_zero",
      momentumChannels:
        "for_a_in_[x,y,z], computed[p,a]={H_eff[chi_p],H_eff[u_p,a*chi_p]}_q_pi and target[p,a]=D_eff[W_p,a]",
      WDefinition:
        "W_p,a_D0^b(j)=q^bc(j)*(chi_p(j)*D0_c(u_p,a*chi_p)(j)-(u_p,a(j)*chi_p(j))*D0_c(chi_p)(j))",
    },
    H_Hi: {
      hamiltonianChannel:
        "computed[p,0]={H_eff[chi_p],D_eff[chi_p*v]}_q_pi and target[p,0]=-H_eff[(chi_p*v)^a*D0_a(chi_p)]",
      momentumChannels: "computed=target=residual=0_as_structural_sector_zeros",
    },
    Hi_Hj: {
      hamiltonianChannel:
        "computed=target=residual=0_as_a_structural_sector_zero",
      momentumChannels:
        "for_a_in_[x,y,z], X_p,a=chi_p*e_a, Y_p,a=u_p,a*chi_p*v, computed[p,a]={D_eff[X_p,a],D_eff[Y_p,a]}_q_pi and target[p,a]=D_eff[[X_p,a,Y_p,a]_D0] with [X,Y]_D0^b=X^c*D0_c(Y^b)-Y^c*D0_c(X^b)",
    },
    residualDefinition: "residual[p,A]=computed[p,A]-target[p,A]",
    computedMayNotReadTargetBytes: true,
    targetMayNotReadComputedBytes: true,
    residualMayNotReplaceEitherOperand: true,
  },
  normalization: {
    normalizationId: "fixed_level_independent_one_code_unit_scale/v1",
    referenceScale: { exact: "2^0", value: 1, unit: "dimensionless" },
    justification:
      "one_frozen_code_unit_is_independent_of_every_computed_target_residual_and_regulator_value_preserves_absolute_magnitude_differences_across_all_64_probes_and_all_three_levels_and_cannot_be_retuned_after_observation",
    appliesTo:
      "every_bracket_operand_residual_antisymmetry_term_Jacobi_term_and_regulator_difference_before_raw_float64_encoding",
    normalizedValue: "raw_smeared_scalar_value/(2^0)",
    levelIndependent: true,
    pointIndependent: true,
    componentIndependent: true,
    familyIndependent: true,
    serverRecomputedOnlyFromFrozenConstant: true,
    computedOrTargetDependentDenominatorAllowed: false,
    submittedOutputDependentDenominatorAllowed: false,
    toleranceRetuningAllowed: false,
  },
  canonicalIdentityDerivation: {
    combinedGenerator: "C[nu,X]=H_eff[nu]+D_eff[X]",
    channelProbeTriples: {
      channel0:
        "xi=(chi_p,chi_p*v); eta=(u_p,x*chi_p,chi_p*w); zeta=(u_p,y*chi_p,u_p,x*chi_p*e_y)",
      channelX:
        "xi=(chi_p,chi_p*e_x); eta=(u_p,x*chi_p,chi_p*e_y); zeta=(u_p,y*chi_p,u_p,x*chi_p*e_y)",
      channelY:
        "xi=(chi_p,chi_p*e_y); eta=(u_p,y*chi_p,chi_p*e_z); zeta=(u_p,z*chi_p,u_p,y*chi_p*e_z)",
      channelZ:
        "xi=(chi_p,chi_p*e_z); eta=(u_p,z*chi_p,chi_p*e_x); zeta=(u_p,x*chi_p,u_p,z*chi_p*e_x)",
    },
    antisymmetry: {
      forward: "A_forward[p,A]={C[xi_p,A],C[eta_p,A]}_q_pi",
      reverse:
        "A_reverse[p,A]={C[eta_p,A],C[xi_p,A]}_q_pi_evaluated_by_a_separate_bracket_call",
      residual: "A_residual=A_forward+A_reverse",
      targetArraysUsed: false,
    },
    Jacobi: {
      term1: "J1={C[xi],{C[eta],C[zeta]}_q_pi}_q_pi",
      term2: "J2={C[eta],{C[zeta],C[xi]}_q_pi}_q_pi",
      term3: "J3={C[zeta],{C[xi],C[eta]}_q_pi}_q_pi",
      residual: "J_residual=J1+J2+J3",
      eachInnerAndOuterBracketSeparatelyEvaluated: true,
      targetArraysUsed: false,
    },
    inputOnlyIdentityScale: "the_same_frozen_2^0_reference_scale",
    interpretation:
      "antisymmetry_and_Jacobi_are_numeric_canonical_Poisson_bracket_checks_and_do_not_establish_constraint_closure",
  },
  regulatorDisposition: {
    derivationKind: "producer_derived_finite_grid_diagnostic",
    serverRecomputedDerivationAuthority: false,
    serverReplayDuty:
      "validate_frozen_descriptors_positive_values_uncertainties_and_order_two_convergence_without_relabeling_the_regulator_values_as_server_derived_science",
    governedRoleCompatibility:
      "regulator_level.0_1_2.residual_roles_carry_nonnegative_discretization_error_estimates_not_signed_constraint_closure_residuals",
    closureResidualFamilyOrder: [
      "H_H",
      "H_Hi",
      "Hi_Hj",
      "antisymmetry",
      "jacobi",
    ],
    interlevelDifferenceCoarseMiddle:
      "d_01[p,A]=sqrt(sum_F((R_F_level_0[p,A]-R_F_level_1[p,A])^2))",
    interlevelDifferenceMiddleFine:
      "d_12[p,A]=sqrt(sum_F((R_F_level_1[p,A]-R_F_level_2[p,A])^2))",
    level0ErrorEstimate: "E_0[p,A]=(4/3)*d_01[p,A]",
    level1ErrorEstimate: "E_1[p,A]=(4/3)*d_12[p,A]",
    level2ErrorEstimate: "E_2[p,A]=(1/3)*d_12[p,A]",
    roleValueBinding:
      "regulator_level.l.residual[p,A]=E_l[p,A]_for_l_in_[0,1,2]",
    interlevelUncertaintyCoarseMiddle:
      "u_d01[p,A]=sqrt(sum_F((U_F_level_0[p,A]+U_F_level_1[p,A])^2))",
    interlevelUncertaintyMiddleFine:
      "u_d12[p,A]=sqrt(sum_F((U_F_level_1[p,A]+U_F_level_2[p,A])^2))",
    uncertaintyRoleBinding:
      "U_E0=(4/3)*u_d01_U_E1=(4/3)*u_d12_U_E2=(1/3)*u_d12",
    formalOrder: 2,
    expectedAsymptoticRelation:
      "E_0_approximately_4*E_1_and_E_1_equals_4*E_2_only_when_the_three_frozen_grids_are_in_the_second_order_regime",
    valueDomain: "finite_nonnegative_for_every_governed_role_entry",
    governedLevelwiseUpper95:
      "q_level=max_over_p_A(abs(E_level[p,A])+U_E_level[p,A])",
    governedLevelwiseRequirement: "q_level_must_be_strictly_positive",
    zeroValueDisposition:
      "individual_exact_zero_entries_are_allowed_but_a_level_with_q_level_equal_zero_is_governed_replay_blocked_and_the_finite_grid_result_is_inconclusive",
    zeroFlooringOrSyntheticPerturbationAllowed: false,
    closureMagnitudeOrContinuumInterceptAllowed: false,
    continuumExtrapolationAuthorized: false,
    continuumAnomalyAttributionAuthorized: false,
    scope:
      "finite_grid_discretization_error_evidence_only_with_continuum_anomaly_unresolved",
    negativeOrNonfiniteUncertaintyDisposition:
      "blocked_invalid_uncertainty_without_repair_or_clamping",
    retuningOrCandidateReplacementAfterObservationAllowed: false,
  },
  finiteGridFailureSemantics: {
    diagnosticClosureTolerance: { exact: "1/10", value: 0.1 },
    failureRule:
      "after_governed_replay_any_finite_grid_bracket_residual_absolute_upper95_above_1_over_10_is_a_frozen_candidate_failure",
    belowThresholdRule:
      "a_below_threshold_finite_grid_result_means_the_negative_control_did_not_exhibit_the_expected_failure_and_grants_no_pass_or_promotion_authority",
    continuumInferenceAllowed: false,
    noRetuneTerminal: true,
  },
  futureRawArrayPlan: {
    semanticPlanOnly: true,
    rawValues: null,
    governedCentralArrayGridBinding: {
      sourceRegulatorLevel: 2,
      sourcePointsPerAxis: 16,
      roleCount: 21,
      roles: [
        ...FUTURE_BRACKET_RAW_ROLE_PLAN.map((entry) => entry.role),
        ...FUTURE_IDENTITY_RAW_ROLE_PLAN,
      ],
      rule: "every_governed_bracket_and_identity_central_or_uncertainty_array_is_derived_from_level_2_only",
    },
    regulatorOperandGridBinding: {
      sourceRegulatorLevels: [0, 1, 2],
      sourcePointsPerAxis: [4, 8, 16],
      rule: "the_producer_derives_regulator_error_estimates_from_frozen_closure_and_identity_operands_on_all_three_levels",
    },
    binary64Centralization: {
      roundingMode: "IEEE754_roundTiesToEven",
      certifiedIntervalMaximumWidth:
        "strictly_less_than_0.5_ULP_of_the_candidate_binary64",
      uniqueRoundingCellRequired: true,
      centralValueDuty: CENTRAL_VALUE_ROUNDING_DUTY,
      exactZeroEncoding: "positive_zero_0x0000000000000000",
      negativeZeroAllowed: false,
      nonfiniteCentralValueAllowed: false,
      ambiguousIntervalDisposition:
        "blocked_without_emitting_or_selecting_a_central_binary64",
      uncertaintyBinding:
        "the_matching_absolute_uncertainty95_value_must_nonnegatively_enclose_the_certified_interval_about_the_emitted_central_value_and_may_not_shift_or_select_the_central_byte",
    },
    bracketRoles: FUTURE_BRACKET_RAW_ROLE_PLAN,
    identityRoles: FUTURE_IDENTITY_RAW_ROLE_PLAN.map((role) => ({
      role,
      shape: [64, 4] as const,
      componentOrder: CONSTRAINT_COMPONENT_ORDER,
      unit: "dimensionless",
      dtype: "float64",
      binaryEncoding: "raw_ieee754",
      endianness: "little",
      storageOrder: "row-major",
    })),
    regulatorRoles: FUTURE_REGULATOR_RAW_ROLE_PLAN,
  },
  implementationLineages: IMPLEMENTATION_LINEAGES,
  primaryScientificReferences: [
    {
      referenceId: "ADM_1962_republication",
      locator: "arXiv:gr-qc/0405109",
      duty: "canonical_gravity_phase_space_and_constraint_conventions",
    },
    {
      referenceId: "Husain_Javed_canonical_semiclassical_anomaly",
      locator: "arXiv:2511.07753",
      duty: "negative_control_motivation_and_missing_matter_momentum_term_in_the_naive_expectation_value_substitution",
    },
    {
      referenceId: "Bonzom_Dittrich_discrete_hypersurface_algebra",
      locator: "arXiv:1304.5983",
      duty: "regulator_caution_that_discretization_can_break_hypersurface_deformation_symmetry",
    },
  ],
  scientificBoundary: {
    finiteRegulatorStateOnly: true,
    continuumHadamardEstablished: false,
    covariantRsetEstablished: false,
    connectedStressNoiseEstablished: false,
    stateGravityExtendedSymplecticClosureEstablished: false,
    continuumConstraintAnomalyEstablished: false,
    currentNhm2GeometryEstablished: false,
    currentNhm2SourceEstablished: false,
    casimirMaterialOrApparatusEstablished: false,
    semanticRelabelingAsNhm2OrCasimirAllowed: false,
    negativeControlFailureCompletesActiveTheoryGoal: false,
  },
  executionBoundary: {
    semanticReferenceOnly: true,
    candidateManifest: null,
    scientificPreseal: null,
    rawArrays: null,
    replayReceipt: null,
    pairReceipt: null,
    lampReceipt: null,
    theoryGraphReceipt: null,
    implementationsExecuted: false,
    empiricalReceiptPresent: false,
  },
  claimLocks: NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CLAIM_LOCKS,
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

export const NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE =
  deepFreeze(REFERENCE);

export type Nhm2AdmRegulatedScalarHybridFailureReferenceV1 =
  typeof NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE;

type PlainSnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };

const FORBIDDEN_PLAIN_DATA_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

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
    if (keys.some((key) => typeof key !== "string")) {
      return { ok: false, violation: `symbol_key_forbidden:${pointer || "/"}` };
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (
      lengthDescriptor == null ||
      !("value" in lengthDescriptor) ||
      lengthDescriptor.value !== value.length ||
      lengthDescriptor.enumerable !== false ||
      lengthDescriptor.configurable !== false
    ) {
      return {
        ok: false,
        violation: `array_length_descriptor_invalid:${pointer || "/"}`,
      };
    }
    for (const key of keys as string[]) {
      if (key === "length") continue;
      if (FORBIDDEN_PLAIN_DATA_KEYS.has(key)) {
        return {
          ok: false,
          violation: `forbidden_property_key:${pointer}/${key}`,
        };
      }
      if (!/^(?:0|[1-9][0-9]*)$/.test(key)) {
        return { ok: false, violation: `array_keys_invalid:${pointer || "/"}` };
      }
      const index = Number(key);
      if (
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index >= value.length ||
        String(index) !== key
      ) {
        return {
          ok: false,
          violation: `array_index_out_of_range:${pointer}/${key}`,
        };
      }
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
      if (descriptor.enumerable !== true) {
        return {
          ok: false,
          violation: `non_enumerable_array_entry_forbidden:${pointer}/${index}`,
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
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_PLAIN_DATA_KEYS.has(key)) {
      return {
        ok: false,
        violation: `forbidden_property_key:${pointer}/${key}`,
      };
    }
    const descriptor = descriptors[key];
    if (descriptor == null || !("value" in descriptor)) {
      return {
        ok: false,
        violation: `accessor_property_forbidden:${pointer}/${key}`,
      };
    }
    if (descriptor.enumerable !== true) {
      return {
        ok: false,
        violation: `non_enumerable_property_forbidden:${pointer}/${key}`,
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

const exactDiff = (
  actual: unknown,
  expected: unknown,
  pointer = "",
): string[] => {
  if (Object.is(actual, expected)) return [];
  if (Array.isArray(actual) && Array.isArray(expected)) {
    const violations: string[] = [];
    if (actual.length !== expected.length) {
      violations.push(`array_length_drift:${pointer || "/"}`);
    }
    const count = Math.min(actual.length, expected.length);
    for (let index = 0; index < count; index += 1) {
      violations.push(
        ...exactDiff(actual[index], expected[index], `${pointer}/${index}`),
      );
    }
    return violations;
  }
  if (
    actual != null &&
    expected != null &&
    typeof actual === "object" &&
    typeof expected === "object" &&
    !Array.isArray(actual) &&
    !Array.isArray(expected)
  ) {
    const actualRecord = actual as Record<string, unknown>;
    const expectedRecord = expected as Record<string, unknown>;
    const violations: string[] = [];
    for (const key of Object.keys(expectedRecord)) {
      if (!Object.prototype.hasOwnProperty.call(actualRecord, key)) {
        violations.push(`missing_key:${pointer}/${key}`);
      } else {
        violations.push(
          ...exactDiff(
            actualRecord[key],
            expectedRecord[key],
            `${pointer}/${key}`,
          ),
        );
      }
    }
    for (const key of Object.keys(actualRecord)) {
      if (!Object.prototype.hasOwnProperty.call(expectedRecord, key)) {
        violations.push(`extra_key:${pointer}/${key}`);
      }
    }
    return violations;
  }
  return [`value_drift:${pointer || "/"}`];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const unique = (values: readonly string[]): string[] => [...new Set(values)];

export const nhm2AdmRegulatedScalarHybridFailureReferenceViolations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];

  const violations = exactDiff(
    snapshot.value,
    NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE,
  );
  if (!isRecord(snapshot.value)) return unique(violations);

  const root = snapshot.value;
  const negativeControl = isRecord(root.negativeControl)
    ? root.negativeControl
    : null;
  if (
    negativeControl == null ||
    negativeControl.passOracle !== false ||
    negativeControl.retuningAfterFreezeAllowed !== false ||
    negativeControl.fallbackCandidateSelectionAllowed !== false ||
    negativeControl.unexpectedNumericalPassAuthority !== false
  ) {
    violations.push("negative_control_no_retune_boundary_invalid");
  }

  const state = isRecord(root.scalarState) ? root.scalarState : null;
  if (
    state == null ||
    state.continuumHadamardLimitEstablished !== false ||
    state.covariantlyRenormalizedContinuumRsetEstablished !== false ||
    state.connectedContinuumNoiseKernelEstablished !== false
  ) {
    violations.push("continuum_scalar_science_promotion_forbidden");
  }

  const boundary = isRecord(root.scientificBoundary)
    ? root.scientificBoundary
    : null;
  if (
    boundary == null ||
    boundary.semanticRelabelingAsNhm2OrCasimirAllowed !== false ||
    boundary.negativeControlFailureCompletesActiveTheoryGoal !== false ||
    boundary.currentNhm2GeometryEstablished !== false ||
    boundary.currentNhm2SourceEstablished !== false ||
    boundary.casimirMaterialOrApparatusEstablished !== false
  ) {
    violations.push("nhm2_casimir_or_goal_promotion_forbidden");
  }
  if (
    boundary == null ||
    boundary.continuumConstraintAnomalyEstablished !== false
  ) {
    violations.push("continuum_constraint_anomaly_promotion_forbidden");
  }

  const future = isRecord(root.futureRawArrayPlan)
    ? root.futureRawArrayPlan
    : null;
  const execution = isRecord(root.executionBoundary)
    ? root.executionBoundary
    : null;
  if (
    future == null ||
    future.rawValues !== null ||
    execution == null ||
    execution.semanticReferenceOnly !== true ||
    execution.candidateManifest !== null ||
    execution.scientificPreseal !== null ||
    execution.rawArrays !== null ||
    execution.replayReceipt !== null ||
    execution.pairReceipt !== null ||
    execution.lampReceipt !== null ||
    execution.theoryGraphReceipt !== null ||
    execution.implementationsExecuted !== false
  ) {
    violations.push(
      "semantic_reference_execution_or_output_inflation_forbidden",
    );
  }

  const lineages = Array.isArray(root.implementationLineages)
    ? root.implementationLineages
    : [];
  if (
    lineages.length !== 2 ||
    lineages.some(
      (entry) =>
        !isRecord(entry) ||
        entry.executionStatus !== "planned_not_executed" ||
        entry.sharedCodeAllowedWithIndependent !== false ||
        entry.sourceSha256 !== null ||
        entry.dependencyLockSha256 !== null ||
        entry.executableSha256 !== null,
    )
  ) {
    violations.push("primary_independent_unexecuted_lineage_boundary_invalid");
  }

  const locks = isRecord(root.claimLocks) ? root.claimLocks : null;
  if (locks == null) {
    violations.push("claim_locks_missing");
  } else {
    for (const [key, lock] of Object.entries(locks)) {
      if (lock !== false)
        violations.push(`claim_lock_must_remain_false:${key}`);
    }
  }

  return unique(violations);
};

export const isNhm2AdmRegulatedScalarHybridFailureReferenceV1 = (
  value: unknown,
): value is Nhm2AdmRegulatedScalarHybridFailureReferenceV1 =>
  nhm2AdmRegulatedScalarHybridFailureReferenceViolations(value).length === 0;
