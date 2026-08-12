export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_ARTIFACT_ID =
  "nhm2.prolate_boson_star_coherent_candidate_plan" as const;

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_coherent_candidate_plan/v1" as const;

const AXIS_COORDINATES = [
  { exact: "-3/8", value: -3 / 8 },
  { exact: "-1/8", value: -1 / 8 },
  { exact: "1/8", value: 1 / 8 },
  { exact: "3/8", value: 3 / 8 },
] as const;

const SAMPLE_CENTERS = AXIS_COORDINATES.flatMap((z, iz) =>
  AXIS_COORDINATES.flatMap((y, iy) =>
    AXIS_COORDINATES.map((x, ix) => ({
      ordinal: 16 * iz + 4 * iy + ix,
      muTimesCoordinate: { x, y, z },
    })),
  ),
);

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS =
  Object.freeze([
    "boson_star_branch_not_solved",
    "covariant_metric_error_not_enclosed",
    "self_consistent_semiclassical_backreaction_not_converged",
    "hadamard_mode_sum_not_computed",
    "renormalized_mean_rset_not_computed",
    "connected_noise_kernel_not_computed",
    "total_effective_action_constraint_algebra_not_computed",
    "constraint_regulator_operand_replay_not_integrated_into_v3_lane",
    "qei_and_preparation_switching_not_evaluated",
    "primary_runtime_provenance_missing",
    "independent_implementation_not_executed",
    "candidate_manifest_and_preseal_absent",
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CLAIM_LOCKS =
  Object.freeze({
    candidateAuthority: false as const,
    scientificCandidateAdmissible: false as const,
    presealAuthority: false as const,
    rawReplayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    experimentReadyTheoryClosure: false as const,
    currentNhm2MetricIdentity: false as const,
    currentNhm2SourceIdentity: false as const,
    casimirSourceIdentity: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
  });

const PLAN = {
  artifactId: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_ARTIFACT_ID,
  contractVersion:
    NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CONTRACT_VERSION,
  authority: "preregistered_science_plan_only",
  maturity: "diagnostic_candidate_selection_solver_absent",
  selectionFrozen: true,
  scientificCandidateAdmissible: false,
  candidateIdentity: {
    candidateId:
      "nhm2.semiclassical_v2.prolate_boson_star_2p_weak_field_plan/v1",
    scientificRole:
      "fresh_joint_geometry_state_benchmark_for_the_semiclassical_v2_lane",
    relationToNhm2:
      "needle_like_positive_energy_semiclassical_benchmark_not_the_current_nhm2_shift_lapse_metric_or_source",
    currentNhm2Geometry: false,
    warpGeometry: false,
    casimirApparatus: false,
    transportMechanism: false,
    selectionChangeRule:
      "any_change_to_a_frozen_selector_state_renormalization_sampling_smearing_tolerance_or_algorithm_requires_a_new_candidate_id_and_contract_version",
    retuningAfterObservationAllowed: false,
    fallbackBranchAfterObservationAllowed: false,
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
    multipolarQuantumNumbers: { N: 2, ell: 1, m: 0 },
    commonName: "lowest_nodeless_2p_like_prolate_branch",
    radialNodeCount: 0,
    equatorialParity: "odd_under_z_to_minus_z_for_the_complex_field",
    metricSymmetry: "static_axisymmetric",
    regularity: "regular_horizonless_everywhere",
    boundaryCondition: "asymptotically_flat",
    continuationOrigin: "vacuum_zero_amplitude_limit",
    selectedSegment:
      "first_weak_field_solution_at_the_frozen_peak_amplitude_before_any_mass_or_frequency_turning_point",
    scalarAnsatz: "Phi(t,r,theta)=phi(r,theta)*exp(-i*omega*t)",
    omegaOverMu: null,
    omegaDuty:
      "solve_as_an_eigenvalue_without_reading_gate_outputs_and_block_on_nonuniqueness_wrong_parity_nodes_or_branch_turning",
    arbitraryLiteratureFrequencyAllowed: false,
    classicalEinsteinKleinGordonSolutionIsOnlyIterationSeed: true,
    geometryGauge: {
      coordinates: ["t", "r", "theta", "varphi"],
      metricAnsatz:
        "ds^2=-exp(2*F0)*dt^2+exp(2*F1)*(dr^2+r^2*dtheta^2)+exp(2*F2)*r^2*sin(theta)^2*dvarphi^2",
      unknownFunctions: ["F0(r,theta)", "F1(r,theta)", "F2(r,theta)"],
      quasiIsotropicCondition: "g_rr=g_thetatheta/r^2_and_g_rtheta=0",
      azimuthalCondition: "g_varphi_varphi=exp(2*F2)*r^2*sin(theta)^2",
      asymptoticConditions: "F0=F1=F2=0_and_phi=0_as_r_to_infinity",
      axisConditions:
        "elementary_flatness_F1=F2_and_theta_derivatives_of_F0_F1_F2_vanish_at_theta=0_pi",
      radialOriginConditions:
        "regular_metric_even_in_r_and_the_l_equals_1_scalar_has_the_frozen_odd_leading_parity",
      cartesianMap: [
        "x=r*sin(theta)*cos(varphi)",
        "y=r*sin(theta)*sin(varphi)",
        "z=r*cos(theta)",
      ],
      residualCoordinateTransformAllowed: false,
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
    iterationSeed: "classical_multipolar_Einstein_Klein_Gordon_solution",
    relativeLInfConvergenceTarget: { exact: "10^-3", value: 1e-3 },
    converged: null,
    residualRelativeLInf: null,
    branchReplacementAfterFailureAllowed: false,
  },
  chartTetradSamplingAndSmearing: {
    slice: "t=0",
    chart:
      "the_exact_quasi_isotropic_gauge_and_standard_spherical_to_Cartesian_map_frozen_in_frozenBranchSelector.geometryGauge",
    tetrad: {
      sphericalFrame: [
        "e_hat0=exp(-F0)*partial_t",
        "e_hatr=exp(-F1)*partial_r",
        "e_hattheta=exp(-F1)*r^-1*partial_theta",
        "e_hatvarphi=exp(-F2)*(r*sin(theta))^-1*partial_varphi",
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
    nondegeneracyGate:
      "all_64_multiplicity_weighted_symmetric_tensor_Frobenius_norms_must_strictly_exceed_the_governed_floor",
    everyTensorComponentMustBeNonzero: false,
  },
  governedOutputPlan: {
    valuesPresent: false,
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
    },
    connectedNoiseAbsoluteUncertainty95: {
      shape: [64, 64, 100],
      unit: "(J/m^3)^2",
      value: null,
    },
    meanDemandClosureTolerance: { exact: "1/10", value: 0.1 },
    bracketFamilies: ["H_H", "H_Hi", "Hi_Hj"],
    bracketAndIdentityShape: [64, 4],
    identityFamilies: ["antisymmetry", "jacobi"],
    minimumRegulatorLevelCount: 3,
    rawArrays: null,
  },
  totalConstraintDuty: {
    formulation:
      "ADM_Legendre_transform_of_the_same_renormalized_diffeomorphism_invariant_one_loop_in_in_effective_action_with_its_state_history_variables_retained",
    alternativesAfterFreezeAllowed: false,
    dimensionlessRescaling: {
      coordinates: "xbar^a=mu*x^a_and_tbar=mu*t",
      metric: {
        lineElement: "dsbar^2=mu^2*ds^2",
        componentPullback:
          "gbar_AbarBbar(xbar)=mu^2*(partial_x^A/partial_xbar^Abar)*(partial_x^B/partial_xbar^Bbar)*g_AB(xbar/mu)=g_AB(xbar/mu)",
        spatialRestriction:
          "qbar_ibarjbar_is_the_tbar_constant_spatial_restriction_of_gbar_AbarBbar",
      },
      scalar: "Phibar=sqrt(8*pi*G)*Phi",
      momenta:
        "all_gravity_and_state_momenta_are_the_Legendre_conjugates_of_the_barred_fields_with_respect_to_tbar",
      spatialMeasure: "sqrt(det(qbar))*d3xbar",
      generatorDefinition:
        "Hbar_and_Dbar_are_the_dimensionless_generators_obtained_by_the_ADM_Legendre_transform_of_the_barred_effective_action",
      rawConstraintArraysAreDimensionless: true,
      mixingBarredAndUnbarredQuantitiesAllowed: false,
    },
    canonicalPhaseSpace: {
      gravityVariables: ["qbar_ab", "pibar^ab"],
      stateVariables:
        "barred_coherent_mean_and_Gaussian_two_point_data_on_the_projective_Hilbert_state_manifold",
      stateSymplecticForm:
        "Omegabar_state(delta1Psi,delta2Psi)=2*Im(<delta1Psi|delta2Psi>)_pulled_back_to_the_frozen_barred_coherent_Gaussian_coordinates",
      totalBracket:
        "Poissonbar_total=Poissonbar_ADM_plus_inverse(Omegabar_state)_with_no_state_variable_held_fixed_during_metric_variation",
    },
    requiredTerms: [
      "gravity",
      "coherent_mean_field",
      "renormalized_vacuum",
      "gravity_matter_cross_variations",
      "state_and_geometry_functional_variations",
      "structure_function_targets",
    ],
    matterOnlyWardIdentitySufficient: false,
    fixedStateDuringGravityVariationAllowed: false,
    producerComputedMayReadTargetOrResidualArrays: false,
    spatialProbeDefinition: {
      referenceGeometry:
        "qbar_star_is_the_converged_self_consistent_candidate_geometry_frozen_before_any_constraint_bracket_execution",
      chi: "chi_p_is_the_dimensionless_tbar=0_spatial_factor_of_the_frozen_C_infinity_smear_centered_at_p_and_normalized_once_with_sqrt(det(qbar_star))*d3xbar",
      localCoordinates:
        "u_p,a=(xbar_a-xbar_p,a)/(1/64)_inside_the_probe_support",
      constructionAndSeal:
        "all_64_probe_functions_are_materialized_and_hash_sealed_after_qbar_star_converges_and_before_either_constraint_implementation_starts",
      probeArtifactSha256: null,
      variationalTreatment:
        "chi_p_u_p_and_all_lapse_shift_probe_functions_are_external_c_number_inputs_held_fixed_during_every_inner_outer_forward_and_reverse_Poissonbar_variation",
      metricVariationThroughProbeNormalizationAllowed: false,
      fixedVectors: {
        v: ["1/sqrt(21)", "2/sqrt(21)", "4/sqrt(21)"],
        w: ["4/sqrt(21)", "-2/sqrt(21)", "1/sqrt(21)"],
        basis: ["e_x", "e_y", "e_z"],
      },
    },
    bracketOperands: {
      H_H: "N=chi_p_and_M_a=u_p,a*chi_p_for_the_three_momentum_channels_with_the_Hamiltonian_channel_a_separately_derived_structural_zero",
      H_Hi: "N=chi_p_and_X=chi_p*v_for_the_Hamiltonian_channel_with_three_separately_derived_structural_zero_momentum_channels",
      Hi_Hj:
        "X_a=chi_p*e_a_and_Y_a=u_p,a*chi_p*v_for_the_three_momentum_channels_with_the_Hamiltonian_channel_a_separately_derived_structural_zero",
    },
    targetConstruction: {
      H_H: "Dbar_total[qbar^ab*(N*partialbar_b(M)-M*partialbar_b(N))]_computed_from_geometry_and_frozen_external_smearings_without_computed_or_residual_arrays",
      H_Hi: "-Hbar_total[X^a*partialbar_a(N)]_computed_without_computed_or_residual_arrays",
      Hi_Hj:
        "Dbar_total[X^b*partialbar_b(Y^a)-Y^b*partialbar_b(X^a)]_computed_without_computed_or_residual_arrays",
      residual: "residual=computed-target_recomputed_server_side",
    },
    normalization: {
      scale: "one_in_the_frozen_barred_canonical_units",
      normalizedValue:
        "the_raw_Hbar_Dbar_bracket_target_or_identity_value_without_any_output_dependent_rescaling",
      inputOnly: true,
      computedTargetResidualOrUncertaintyDependent: false,
    },
    canonicalIdentityDerivation: {
      combinedGenerator: "Cbar[nu,X]=Hbar[nu]+Dbar[X]",
      tupleOrder: ["dimensionless_lapse_nu", "dimensionless_shift_X"],
      channelOrder: ["hamiltonian", "momentum_x", "momentum_y", "momentum_z"],
      channelAssignment:
        "at_each_sample_the_four_raw_entries_are_the_scalar_results_from_hamiltonian_momentumX_momentumY_momentumZ_triples_in_channelOrder_with_no_component_mixing",
      triples: {
        hamiltonian:
          "xi=(chi_p,chi_p*v);eta=(u_p,x*chi_p,chi_p*w);zeta=(u_p,y*chi_p,u_p,x*chi_p*e_y)",
        momentumX:
          "xi=(chi_p,chi_p*e_x);eta=(u_p,x*chi_p,chi_p*e_y);zeta=(u_p,y*chi_p,u_p,x*chi_p*e_y)",
        momentumY:
          "xi=(chi_p,chi_p*e_y);eta=(u_p,y*chi_p,chi_p*e_z);zeta=(u_p,z*chi_p,u_p,y*chi_p*e_z)",
        momentumZ:
          "xi=(chi_p,chi_p*e_z);eta=(u_p,z*chi_p,chi_p*e_x);zeta=(u_p,x*chi_p,u_p,z*chi_p*e_x)",
      },
      antisymmetry: {
        forward: "A_forward={Cbar[xi],Cbar[eta]}_total",
        reverse:
          "A_reverse={Cbar[eta],Cbar[xi]}_total_as_a_separate_bracket_evaluation",
        residual: "A_residual=A_forward+A_reverse",
      },
      jacobi: {
        term1:
          "J1={Cbar[xi],{Cbar[eta],Cbar[zeta]}_total}_total_with_the_inner_and_outer_brackets_separately_evaluated",
        term2:
          "J2={Cbar[eta],{Cbar[zeta],Cbar[xi]}_total}_total_with_the_inner_and_outer_brackets_separately_evaluated",
        term3:
          "J3={Cbar[zeta],{Cbar[xi],Cbar[eta]}_total}_total_with_the_inner_and_outer_brackets_separately_evaluated",
        residual: "J_residual=J1+J2+J3",
      },
      everyInnerOuterAndReverseBracketSeparatelyEvaluated: true,
      targetOrResidualArraysMayNotBeRead: true,
      finiteProbeCoverageProvesTheFullFunctionalIdentity: false,
    },
    regulator: {
      parameter: "h",
      radialCompactification: "rho=mu*r/(1+mu*r)_in_[0,1]",
      polarCoordinate: "eta=cos(theta)_in_[-1,1]",
      nodes:
        "Chebyshev_Lobatto_nodes_on_rho_and_eta_with_the_listed_radial_and_polar_counts",
      derivatives:
        "unique_barycentric_Chebyshev_Lobatto_differentiation_matrices_mapped_through_rho_and_eta",
      quadrature:
        "tensor_product_Clenshaw_Curtis_weights_after_analytic_inclusion_of_r^2*dr/drho_and_sin(theta)*dtheta=-deta_with_eta_bounds_reversed_the_rho=1_integrand_set_by_its_frozen_asymptotic_limit_and_tau_equation_replacement_not_altering_volume_weights",
      boundaryOperators:
        "tau_rows_enforce_the_frozen_regular_origin_axis_elementary_flatness_parity_and_asymptotic_conditions",
      modeCutoffKernel:
        "inclusive_sharp_projector_with_unit_weight_for_positive_omegabar<=modeCutoffOverMu_abs(m)<=ell<=angularModeCutoff_and_zero_weight_otherwise",
      quantumModeRegulator: {
        positiveFrequency:
          "positive_frequency_is_defined_only_by_the_unit_normalized_asymptotic_static_Killing_time_tbar",
        angularConvention:
          "for_each_integer_m_sum_the_full_coupled_spherical_harmonic_block_abs(m)<=ell<=angularModeCutoff_in_both_equatorial_parity_sectors_without_a_diagonal_partial_wave_approximation",
        continuumParameter:
          "kappabar=sqrt(omegabar^2-1)_on_[0,sqrt(modeCutoffOverMu^2-1)]",
        continuumQuadrature:
          "continuumMomentumPoints_point_Gauss_Legendre_rule_affinely_scaled_to_the_frozen_kappabar_interval",
        scatteringBoundaryAndNormalization:
          "regular_origin_and_axis_solutions_are_matched_to_the_coupled_channel_asymptotic_Jost_basis_including_the_candidate_ADM_mass_long_range_phase_and_delta(kappabar-kappabar_prime)_normalized_to_unit_Klein_Gordon_flux",
        boundStateTreatment:
          "every_positive_frequency_normalizable_pole_with_0<omegabar<1_is_found_by_the_same_Jost_determinant_counted_once_and_unit_Klein_Gordon_normalized_with_exponentially_decaying_asymptotics",
        spectralWeight:
          "the_continuum_measure_is_exactly_dkappabar_after_unit_Klein_Gordon_delta(kappabar-kappabar_prime)_normalization_with_no_producer_selected_density_or_extra_frequency_Jacobian",
        complexFieldMultiplicity:
          "particle_and_antiparticle_charge_conjugate_vacuum_sectors_are_each_included_exactly_once",
        subtraction:
          "the_same_spatial_angular_frequency_regulator_is_applied_to_the_unrenormalized_mode_sum_and_the_local_Hadamard_parametrix_terms_before_the_frozen_Wald_limit_is_taken",
      },
      discreteFunctional:
        "collocate_and_quadrature_integrate_the_same_barred_one_loop_effective_action_then_differentiate_that_discrete_functional_for_every_total_bracket",
      primaryBracketMethod:
        "automatic_differentiation_of_the_regulated_discrete_functional_composed_with_the_total_gravity_plus_state_symplectic_matrix",
      independentBracketMethod:
        "manual_variation_of_the_same_regulated_discrete_functional_without_primary_generated_equations_or_primary_source_code",
      levels: [
        {
          level: 0,
          hExact: "1/16",
          radialPoints: 16,
          polarPoints: 12,
          modeCutoffOverMu: 16,
          angularModeCutoff: 8,
          continuumMomentumPoints: 64,
        },
        {
          level: 1,
          hExact: "1/32",
          radialPoints: 32,
          polarPoints: 24,
          modeCutoffOverMu: 32,
          angularModeCutoff: 16,
          continuumMomentumPoints: 128,
        },
        {
          level: 2,
          hExact: "1/64",
          radialPoints: 64,
          polarPoints: 48,
          modeCutoffOverMu: 64,
          angularModeCutoff: 32,
          continuumMomentumPoints: 256,
        },
      ],
      centralBracketAndIdentityArraysUseLevel: 2,
      perLevelOperandReplay: {
        standaloneSchemaContract:
          "nhm2_semiclassical_v2_constraint_operand_replay/v1",
        standaloneSchemaImplemented: true,
        serverDecoderAndArithmeticReplayImplemented: false,
        currentV2RawReplayLaneCompatible: false,
        familyOrder: ["H_H", "H_Hi", "Hi_Hj", "antisymmetry", "jacobi"],
        levelCount: 3,
        sampleCount: 64,
        channelCount: 4,
        requiredOperands:
          "every_computed_target_forward_reverse_and_nested_term_needed_to_recompute_each_family_residual_at_each_level",
        serverMustRecomputeEveryFamilyResidualBeforeDifferencing: true,
        serverMustEvaluateConvergenceSeparatelyForEveryFamily: true,
        currentProducerDerivedThreeArrayRegulatorRolesSufficient: false,
        versionedV3RawSchemaIntegrationRequiredBeforeCandidatePreseal: true,
      },
      interlevelDifferences: {
        d01: "for_each_family_componentwise_abs(server_recomputed_level_0_residual-server_recomputed_level_1_residual)",
        d12: "for_each_family_componentwise_abs(server_recomputed_level_1_residual-server_recomputed_level_2_residual)",
      },
      errorRoles: {
        level0: "E_0=2*d01",
        level1: "E_1=2*d12",
        level2: "E_2=d12",
      },
      uncertaintyRoles: {
        level0: "U_E0=2*(U_level0+U_level1)",
        level1: "U_E1=2*(U_level1+U_level2)",
        level2: "U_E2=U_level1+U_level2",
      },
      conservativeErrorAssumption:
        "the_error_coefficients_are_the_p_min=1_Richardson_bounds_and_are_not_reduced_when_a_higher_observed_order_is_reported",
      serverReplayOrder:
        "for_each_family_q_level=max_over_p_A(abs(E_family_level[p,A])+U_E_family_level[p,A])_with_h=[1/16,1/32,1/64]_and_adjacent_log_orders_recomputed_separately_with_global_pass_only_if_every_family_passes",
      exactZeroLevelDisposition:
        "q_level_equal_to_zero_is_blocked_as_regulator_order_inconclusive_and_no_synthetic_floor_is_allowed",
      minimumObservedOrder: 1,
      noPostObservationLevelOrCutoffChange: true,
    },
    tolerances: {
      bracketResidualUpper95: 0.1,
      antisymmetryResidualUpper95: 0.1,
      jacobiResidualUpper95: 0.1,
      producerResidualConsistency: 1e-12,
      regulatorFinalResidualUpper95: 0.1,
    },
    requiredChecks: [
      "H_H",
      "H_Hi",
      "Hi_Hj",
      "antisymmetry",
      "Jacobi",
      "regulator_convergence",
    ],
    result: null,
  },
  implementationSeparationPlan: {
    primary:
      "spectral_Newton_Krylov_geometry_plus_covariant_mode_sum_and_effective_action_differentiation",
    independent:
      "independent_finite_element_geometry_plus_separately_transcribed_mode_and_constraint_implementation",
    sharedScientificCodeAllowed: false,
    sharedGeneratedEquationsAllowed: false,
    sharedInputsAllowed: "exact_frozen_science_preseal_only",
    primarySourceSha256: null,
    independentSourceSha256: null,
    operatingSystemIsolationEstablished: false,
  },
  primaryScientificReferences: [
    {
      locator: "arXiv:2008.10608",
      duty: "fully_nonlinear_classical_multipolar_boson_star_branch_motivation",
      limitation:
        "does_not_supply_a_renormalized_quantum_RSET_noise_kernel_or_self_consistent_semiclassical_solution",
    },
    {
      locator: "arXiv:2601.05129",
      duty: "fixed_background_spherical_boson_star_coherent_state_RSET_method_motivation",
      limitation:
        "spherical_fixed_background_calculation_that_leaves_self_consistent_backreaction_iteration_as_future_work",
    },
    {
      locator: "arXiv:gr-qc/0010019",
      duty: "general_point_separated_scalar_stress_noise_kernel_formula",
      limitation: "general_framework_not_a_computation_for_this_candidate",
    },
  ],
  blockers: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS,
  unresolvedEvidence: {
    solvedFrequencyOverMu: null,
    solvedGeometrySha256: null,
    solvedStateSha256: null,
    conservationCorrectionSha256: null,
    metricDemandArrays: null,
    meanRsetArrays: null,
    connectedNoiseArrays: null,
    constraintArrays: null,
    regulatorEvidence: null,
    runtimeReceipt: null,
    candidateManifest: null,
    scientificPreseal: null,
    replayReceipt: null,
    independentPairReceipt: null,
    lampReceipt: null,
  },
  claimLocks: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CLAIM_LOCKS,
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

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN = deepFreeze(PLAN);

export type Nhm2ProlateBosonStarCoherentCandidatePlanV1 =
  typeof NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN;

type SnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };

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
  seen = new Set<object>(),
): SnapshotResult => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      return { ok: false, violation: `invalid_number:${pointer || "/"}` };
    }
    return { ok: true, value };
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
      return { ok: false, violation: `symbol_key:${pointer || "/"}` };
    }
    const expectedKeys = new Set([
      ...Array.from({ length: value.length }, (_, index) => String(index)),
      "length",
    ]);
    if (
      keys.length !== expectedKeys.size ||
      keys.some((key) => !expectedKeys.has(key as string))
    ) {
      return { ok: false, violation: `array_surface:${pointer || "/"}` };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return {
          ok: false,
          violation: `array_entry_surface:${pointer}/${index}`,
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
    return { ok: false, violation: `symbol_key:${pointer || "/"}` };
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_KEYS.has(key)) {
      return {
        ok: false,
        violation: `forbidden_key:${pointer}/${key}`,
      };
    }
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return {
        ok: false,
        violation: `object_property_surface:${pointer}/${key}`,
      };
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      seen,
    );
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  seen.delete(value);
  return { ok: true, value: output };
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

const EXPECTED_CANONICAL_JSON = canonicalJson(
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
);

export const nhm2ProlateBosonStarCoherentCandidatePlanViolations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  if (canonicalJson(snapshot.value) !== EXPECTED_CANONICAL_JSON) {
    return ["candidate_plan_semantic_mismatch"];
  }
  return value === NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN
    ? []
    : ["candidate_plan_external_copy_not_authoritative"];
};

export const isNhm2ProlateBosonStarCoherentCandidatePlanV1 = (
  value: unknown,
): value is Nhm2ProlateBosonStarCoherentCandidatePlanV1 =>
  nhm2ProlateBosonStarCoherentCandidatePlanViolations(value).length === 0;
