import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed.v1";

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_newtonian_seed_operation_policy" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VERSION =
  "nhm2_spherical_boson_star_newtonian_seed_operation_policy/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SEED_PIN =
  Object.freeze({
    sha256: "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
    canonicalSizeBytes: 18894,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BLOCKERS =
  Object.freeze([
    "hash_bound_primary_implementation_source_absent",
    "hash_bound_independent_interval_verifier_source_absent",
    "hash_bound_gauss_legendre_fixture_absent",
    "directed_infinite_tail_proof_operator_policy_absent",
    "exact_proof_receipt_schema_binding_absent",
    "source_toolchain_executable_and_runtime_manifests_absent",
    "linux_single_process_single_thread_runtime_provider_absent",
    "candidate_manifest_and_preexecution_preseal_absent",
    "operation_policy_not_implemented_or_executed",
    "output_descriptor_and_payloads_absent",
    "independent_core_tail_and_continuous_proof_replay_absent",
    "relativistic_spherical_branch_not_solved",
    "metric_demand_nondegeneracy_receipt_absent",
  ] as const);

const CORE_LEVELS = Object.freeze([
  Object.freeze({ id: "L0", radialNodeCount: 64 }),
  Object.freeze({ id: "L1", radialNodeCount: 96 }),
  Object.freeze({ id: "L2", radialNodeCount: 128 }),
] as const);

const ARRAY_ROLE_ORDER = Object.freeze([
  "rho_nodes",
  "base_scalar_u0",
  "base_potential_V0",
  "target_scalar_u_star",
  "target_potential_V_star",
] as const);

const SCALAR_ROLE_ORDER = Object.freeze([
  "nu0",
  "Vc",
  "N0",
  "C",
  "kappa",
  "sigma",
  "lambda",
  "nu_star",
  "wSeed",
] as const);

const AUTHORITY_LOCKS = Object.freeze({
  algorithmSemanticFreezeComplete: false,
  implementationClosureComplete: false,
  preexecutionPresealPresent: false,
  executionAuthorized: false,
  executionObserved: false,
  outputAccepted: false,
  seedAccepted: false,
  branchAccepted: false,
  nondegeneracyAccepted: false,
  runReplayAccepted: false,
  independentAgreementAccepted: false,
  semiclassicalStressNoiseLamp: false,
  semiclassicalConstraintAlgebraLamp: false,
  diagnosticPass: false,
  candidateAuthority: false,
  theoryGraphAuthority: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

const UNRESOLVED = Object.freeze({
  primarySourceManifest: null,
  independentSourceManifest: null,
  primaryToolchainManifest: null,
  independentToolchainManifest: null,
  primaryExecutableBinding: null,
  independentExecutableBinding: null,
  primaryRuntimeBinding: null,
  independentRuntimeBinding: null,
  runtimeProviderBinding: null,
  candidateManifest: null,
  preexecutionPreseal: null,
  executionCommand: null,
  executionReceipt: null,
  outputDescriptor: null,
  outputRootObservation: null,
  primaryReplayReceipt: null,
  independentReplayReceipt: null,
  seedResult: null,
} as const);

const POLICY = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_ARTIFACT_ID,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.candidateId,
  maturity:
    "stage_2_primary_operation_and_output_prepolicy_with_directed_proof_operator_still_blocked",
  frozenBeforeExecution: true,
  semanticSeedBinding:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SEED_PIN,
  purpose:
    "freeze_the_primary_finite_core_plus_C1_Coulomb_exponential_tail_candidate_map_and_output_boundary_before_any_candidate_dependent_observation_while_explicitly_blocking_execution_until_a_separate_exact_directed_proof_operator_policy_is_bound",
  approximationAuthorityBoundary: {
    subject:
      "one_numerical_Newtonian_initializer_composite_checked_against_frozen_residual_continuity_sign_scaling_and_identity_limits",
    exactGlobalSchrodingerPoissonSolutionAuthority: false,
    exactCoreRootAuthority: false,
    exactRelativisticBranchAuthority: false,
    artificialRhoOneBoundaryMaySelectTheFiniteCoreApproximation: true,
    acceptanceRequiresOnlyTheFrozenNumericalRailsAndDirectedErrorEnclosures: true,
    BvpMustResolveTheRelativisticEquationsIndependently: true,
  },
  arithmeticBoundary: {
    primaryNonlinearSolve:
      "strict_scalar_loop_IEEE754_binary64_round_to_nearest_ties_to_even",
    primaryForbidden: [
      "BLAS",
      "FMA",
      "SIMD_reassociation",
      "fast_math",
      "extended_precision_registers",
      "parallel_reduction",
      "finite_difference_or_automatic_Jacobian",
    ],
    independentReplay:
      "MPFR_256_bits_RNDN_with_directed_RNDD_RNDU_interval_endpoints",
    mpfrPrecisionBits: 256,
    precisionEscalationAllowed: false,
    everyBinary64Barrier:
      "one_named_mpfr_get_d_RNDN_then_exact_f64le_reinjection_before_downstream_use",
    numericalZero: "canonical_positive_zero_only",
    negativeZeroForbidden: true,
    nonfiniteForbidden: true,
  },
  mappedCoreNodes: {
    levels: CORE_LEVELS,
    formula: "rho_j=(1-cos(pi*j/(N-1)))/2_for_j=0..N-1",
    generation:
      "MPFR256_RNDN_const_pi_integer_products_division_cos_subtraction_and_division_by_2_in_that_order",
    serialization:
      "each_node_passes_a_named_get_d_RNDN_barrier_then_is_written_f64le_in_increasing_j_order",
    requiredEndpointBits: ["rho_0=positive_zero", "rho_(N-1)=1_exact"],
    differentiation:
      "first_and_second_barycentric_Chebyshev_Lobatto_matrices_generated_in_MPFR256_then_each_entry_get_d_RNDN_reinjected",
    barycentricWeights:
      "w_j=(-1)^j*c_j_with_c_0=c_(N-1)=1/2_and_every_interior_c_j=1",
    firstMatrix:
      "for_i_not_equal_j_D_ij=w_j/(w_i*(rho_i-rho_j));_D_ii=-sum_(j_in_0..N-1,j_not_i)_in_increasing_j_order_D_ij",
    secondMatrix:
      "D2_ij=sum_(k=0)^(N-1)_in_increasing_k_order_D_ik*D_kj_in_MPFR256_then_one_get_d_RNDN_per_entry",
    xMap: "x=rho/(1-rho)_with_rho=1_used_only_by_replaced_boundary_rows",
  },
  coreSquareSystem: {
    levelOrder: ["L0", "L1", "L2"],
    unknownOrder: "z=[u[0],...,u[N-1],V[0],...,V[N-1],nu]_length_2N+1",
    residualOrder: "F=[S[0],...,S[N-1],P[0],...,P[N-1],u[0]-1]_length_2N+1",
    rowCountIdentity:
      "2*(N-2)_interior_PDE_plus_3_origin_or_gauge_rows_plus_2_infinity_rows=2N+1",
    radialLaplacian:
      "Lrho(q)_i=(1-rho_i)^4*((D2*q)_i+2*(D*q)_i/rho_i)_for_1<=i<=N-2",
    scalarRows: {
      origin: "S[0]=(D*u)[0]",
      interior: "S[i]=-(1/2)*Lrho(u)_i+(V[i]-nu)*u[i]_for_i=1..N-2",
      infinity: "S[N-1]=u[N-1]",
    },
    potentialRows: {
      origin: "P[0]=(D*V)[0]",
      interior: "P[i]=Lrho(V)_i-u[i]^2_for_i=1..N-2",
      infinity: "P[N-1]=V[N-1]",
    },
    amplitudeRow: "F[2N]=u[0]-1",
    boundaryRowsReplacePdeRows: true,
    noRowAveragingOrFallback: true,
    analyticJacobian: {
      scalar: "dS=-(1/2)*Lrho(du)+(V-nu)*du+u*dV-u*dnu_on_interior",
      potential: "dP=Lrho(dV)-2*u*du_on_interior",
      boundaryAndGauge:
        "literal_linear_derivatives_of_the_five_replaced_rows_and_u[0]-1",
      constructionOrder: "row_major_then_column_major_scalar_loops",
    },
    scalarOperationOrder:
      "matrix_dot_products_accumulate_in_increasing_column_order;_each_product_rounds_then_each_add_rounds;_all_displayed_multiplications_divisions_additions_and_subtractions_execute_left_to_right_with_parentheses_exactly_as_written",
    continuumAuthority:
      "the_accepted_polynomial_reconstruction_has_authority_only_on_0<=x<=32",
    rhoOnePolynomialValuesHaveGlobalAuthority: false,
  },
  fixedL0Initializer: {
    independentOfObservedGates: true,
    kg: "(7/8)^(1/4)_evaluated_MPFR256_RNDN",
    kgOperationGraph:
      "inject_integers_7_and_8_divide_then_sqrt_then_sqrt_in_MPFR256_RNDN",
    nuGuess: "-kg^2/2",
    scalar: "u_guess(x)=(1+kg*x)*exp(-kg*x)",
    potential:
      "V_guess(x)=-(I2(x)+2*kg*I3(x)+kg^2*I4(x))/x-(J1(x)+2*kg*J2(x)+kg^2*J3(x))",
    lowerIntegral:
      "In(x)=n!/(2kg)^(n+1)*(1-exp(-2kg*x)*sum_(j=0)^n((2kg*x)^j/j!))",
    upperIntegral: "Jn(x)=n!/(2kg)^(n+1)*exp(-2kg*x)*sum_(j=0)^n((2kg*x)^j/j!)",
    originPotentialLimit: "V_guess(0)=-9/(8*kg^2)",
    infinityValues: "u_guess(infinity)=V_guess(infinity)=positive_zero",
    evaluation:
      "for_each_node_in_increasing_index_use_exact_rho_bit_then_x_map;_evaluate_exp_then_each_power_and_factorial_term_in_increasing_j_order_with_one_multiply_then_one_add;_MPFR256_RNDN_throughout_then_one_get_d_RNDN_per_nodal_value",
    alternateInitializerAllowed: false,
  },
  levelTransfer: {
    L1Initializer:
      "barycentric_resample_the_accepted_L0_u_and_V_polynomials_to_L1_nodes_and_copy_nu",
    L2Initializer:
      "barycentric_resample_the_accepted_L1_u_and_V_polynomials_to_L2_nodes_and_copy_nu",
    resamplingArithmetic:
      "if_output_rho_bit_equals_an_input_rho_bit_copy_that_input_value;_otherwise_evaluate_sum_j(w_j*q_j/(rho-rho_j))/sum_j(w_j/(rho-rho_j))_with_j_increasing_in_MPFR256_from_exact_input_bits_then_get_d_RNDN_per_output",
    restartOrAlternateTransferAllowed: false,
  },
  deterministicDenseLinearSolve: {
    rowScaling: "identity_only",
    columnScaling: "identity_only",
    matrixStorage: "fresh_row_major_binary64_length_(2N+1)^2",
    factorization: "Doolittle_LU_with_partial_pivoting_scalar_binary64_loops",
    pivotChoice:
      "maximum_absolute_value_in_rows_k..end_with_lowest_row_index_winning_exact_ties",
    pivotRejection: "exact_positive_zero_or_nonfinite_pivot_is_failure",
    loopOrder:
      "k_outer_then_candidate_row_scan_then_row_swap_then_i_outer_then_j_inner",
    divisionAndUpdate:
      "one_binary64_division_for_Lik_then_one_nonfused_multiply_and_one_subtraction_per_trailing_entry",
    triangularSolveOrder:
      "forward_rows_increasing_then_backward_rows_decreasing_with_columns_increasing",
    iterativeRefinementPassCount: 3,
    refinement:
      "each_pass_recomputes_b_minus_A*x_in_MPFR256_from_exact_f64_bits_in_column_order_get_d_RNDN_once_per_residual_component_solves_with_the_same_LU_and_adds_correction_in_binary64_index_order",
    refactorDuringRefinementAllowed: false,
    equilibrationAllowed: false,
  },
  deterministicNewton: {
    maximumUpdatesPerCoreLevel: 48,
    maximumTailUpdates: 48,
    maximumLineSearchTrialsPerUpdate: 25,
    trialOrder: "alpha_k=2^-k_for_k=0..24",
    armijoConstantExact: "2^-12",
    merit: "phi(z)=sum_i(F_i^2)/2_in_literal_index_order",
    linearRightHandSide: "solve_J_delta=-F",
    acceptance:
      "first_finite_domain_valid_trial_with_phi_trial<=phi_current-2^-12*alpha*sum_i(F_i^2)",
    coreDomain:
      "nu<0_and_-1/2<2^-10*nu<0_and_every_trial_value_finite_and_not_negative_zero",
    tailDomain:
      "C>0_and_kappa>0_and_every_trial_value_finite_and_not_negative_zero",
    convergence: {
      unscaledEquationLInfMaximumExact: "2^-40",
      scaledStepLInfMaximumExact: "2^-42",
      scaledStep:
        "max_i(abs(alphaAccepted*delta_i)/max(1,abs(postUpdateUnknown_i)))_with_alpha_multiply_then_post_update_add_each_binary64_rounded",
      consecutiveAcceptedUpdatesRequired: 2,
      checkedOnlyAfterAcceptedUpdate: true,
      initialStateCannotSatisfyTerminalConvergenceWithoutOneAcceptedUpdate: true,
    },
    maximumUpdateDisposition:
      "after_update_48_if_the_two_consecutive_condition_is_not_met_fail_without_an_additional_trial",
    trialOperationGraph:
      "for_i_in_increasing_order_step_i=round_binary64(alpha*delta_i)_then_zTrial_i=round_binary64(z_i+step_i);_evaluate_F_in_literal_row_order;_phi_accumulates_round_binary64(round_binary64(F_i*F_i)+accumulator)_in_increasing_i_then_divides_by_2",
    lineSearchFallbackAllowed: false,
    retryAfterFailureAllowed: false,
  },
  L2CoreJoinExtraction: {
    joinX: 32,
    joinRhoExact: "32/33",
    source:
      "MPFR256_barycentric_reconstruction_and_first_derivative_of_exact_accepted_L2_f64_bits",
    valueOrder: ["U=u(32)", "U1=u_prime(32)", "V=V(32)", "V1=V_prime(32)"],
    eachValueGetDRndnForPrimaryTailSolve: true,
    independentVerifierRetainsDirectedIntervals: true,
  },
  tailSquareSystem: {
    R: 32,
    coefficientCountPerField: 32,
    unknownOrder: "[C,h[0],...,h[31],q[0],...,q[31]]_length_65",
    rowOrder:
      "[scaledSchrodinger(y[0..31]),scaledPoisson(y[0..31]),fullMassFixedPoint]_length_65",
    collocationNodes:
      "y_j=(1-cos(pi*j/31))/2_for_j=0..31_including_infinity_y=0_and_join_y=1",
    collocationNodeGeneration:
      "MPFR256_RNDN_then_named_get_d_RNDN_and_exact_f64le_reinjection",
    definitions: {
      y: "R/x",
      kappa: "sqrt(-2*nu0)",
      sigma: "C/kappa-1",
      a: "kappa*R",
      B: "exp(-kappa*(x-R)+sigma*log(x/R))",
      E: "B*B_from_the_same_B_value_or_interval",
      scalar: "u=B*H(y)",
      potential: "V=-C/x+E*Q(y)",
    },
    C1EliminatedLifts: {
      H1: "H(1)=U",
      Hy1: "H_y(1)=(-kappa*R+sigma)*U-R*U1",
      Q1: "Q(1)=V+C/R",
      Qy1: "Q_y(1)=(-2*kappa*R+2*sigma)*Q(1)+C/R-R*V1",
      H: "H(y)=H(1)+H_y(1)*(y-1)+(1-y)^2*sum_(n=0)^31 h[n]*T_n(2y-1)",
      Q: "Q(y)=Q(1)+Q_y(1)*(y-1)+(1-y)^2*sum_(n=0)^31 q[n]*T_n(2y-1)",
      exactValueAndFirstDerivativeMatchByConstruction: true,
    },
    scaledRows: {
      schrodinger:
        "S=(R^2/y^2)*(R_S/B)=-(1/2)*(y^2*Hyy+2*(a-sigma*y)*Hy+sigma*(sigma+1)*H)+R^2*(E/y^2)*Q*H",
      poisson:
        "P=(R^2/E)*R_P=y^4*Qyy+4*y^2*(a-sigma*y)*Qy+(4*a^2-4*a*(2*sigma+1)*y+2*sigma*(2*sigma+1)*y^2)*Q-R^2*H^2",
      infinitySchrodinger: "S(0)=-a*Hy(0)-sigma*(sigma+1)*H(0)/2",
      infinityPoisson: "P(0)=4*a^2*Q(0)-R^2*H(0)^2",
      EOverYSquaredExtension:
        "positive_for_y>0_and_defined_as_positive_zero_at_y=0_with_C_infinity_flat_but_not_real_analytic_extension",
      additiveOneNormalizationForbidden: true,
    },
    fullMassFixedPoint: {
      equation:
        "C=integral_0^R(x^2*u_core^2*dx)+R^3*integral_0^1(E(y)*H(y)^2*y^-4*dy)",
      residualSign:
        "F_mass=C-integral_0^R(x^2*u_core^2*dx)-R^3*integral_0^1(E*H^2*y^-4*dy)",
      yZeroIntegrand:
        "C_infinity_flat_positive_zero_limit_evaluated_without_log(0)_or_zero_times_infinity",
      provisionalPrimaryIntegral: {
        corePartition:
          "exactly_256_equal_x_cells_on_[0,R]_in_increasing_cell_order",
        tailPartition:
          "exactly_4096_equal_y_cells_on_[0,1]_in_increasing_cell_order",
        rule: "exactly_256_point_Gauss_Legendre_on_each_cell_using_a_future_hash_bound_512_value_MPFR256_node_weight_fixture_in_increasing_node_order",
        fixtureBinding: null,
        summation:
          "MPFR256_cell_outer_node_inner_left_to_right_multiply_then_add_without_pairwise_reordering",
        newtonBarrier: "one_get_d_RNDN_after_the_complete_core_plus_tail_sum",
        massRowAnalyticJacobian:
          "differentiate_the_same_fixed_quadrature_graph_in_forward_mode_MPFR256_with_unknown_order_C_then_h_then_q_and_get_d_RNDN_once_per_derivative_component",
        adaptiveSubdivisionAllowed: false,
        earlyStoppingAllowed: false,
      },
      verifierIntegral:
        "directed_interval_range_times_width_adaptive_dyadic_enclosure_not_the_primary_quadrature",
    },
    initializer: {
      C: "MPFR256_Gauss_Legendre_core_integral_0_to_R_then_one_get_d_RNDN",
      h: "32_positive_zero_values",
      q: "32_positive_zero_values",
      liftsRecomputedFromThatC: true,
      alternateTailOrderJoinBasisOrInitializerAllowed: false,
    },
    analyticJacobianRequired: true,
    analyticJacobianRealization:
      "literal_forward_mode_dual_evaluation_of_the_frozen_tail_scalar_graph_with_value_plus_65_derivatives_ordered_C_h_q;_each_exp_log_sqrt_multiply_divide_add_subtract_and_Chebyshev_recurrence_applies_its_exact_symbolic_derivative_left_to_right_and_rounds_each_binary64_primary_value_or_MPFR256_mass_graph_value_at_the_same_barrier",
    finiteDifferenceJacobianAllowed: false,
    genericLibraryAutomaticDifferentiationAllowed: false,
    ChebyshevEvaluation:
      "T_0(t)=1,T_1(t)=t,T_(n+1)=2*t*T_n-T_(n-1)_in_increasing_n_order;_first_and_second_derivatives_follow_the_differentiated_same_recurrence_in_increasing_n_order",
    tailCoefficientPayloadMeaning:
      "tail_H_and_tail_Q_payloads_are_exactly_the_32_correction_coefficients_h_and_q_not_coefficients_of_the_C1_lifts",
  },
  exactTargetScaling: {
    lambdaExact: "2^-5",
    RStar: 1024,
    CStar: "lambda*C",
    kappaStar: "lambda*kappa",
    sigmaStar: "sigma",
    aStar: "a",
    HStar: "lambda^2*H",
    QStar: "lambda^2*Q",
    targetSolveAllowed: false,
  },
  independentDirectedProof: {
    status:
      "required_semantics_and_budgets_preregistered_but_not_an_executable_proof_operator_until_the_separate_exact_operator_policy_and_schema_bindings_are_present",
    backend:
      "future_distinct_source_MPFR256_directed_interval_implementation_without_importing_primary_modules",
    precisionBits: 256,
    precisionEscalationAllowed: false,
    unresolvedIntervalDisposition: "fail_candidate",
    bisection:
      "dyadic_midpoint_lowest_ordinal_first_depth_first_with_lower_child_before_upper_child",
    maximumDepthPerDuty: 56,
    maximumBoxesPerDuty: 262144,
    dutiesInOrder: [
      "core_normalized_Schrodinger_residual_on_x_in_[0,32]",
      "core_normalized_Poisson_residual_on_x_in_[0,32]",
      "core_u_strictly_positive",
      "core_minus_u_prime_strictly_positive_for_x>0_with_origin_series_limit",
      "core_V_strictly_negative",
      "tail_absolute_scaled_S_enclosure",
      "tail_absolute_scaled_P_enclosure",
      "tail_H_strictly_positive",
      "tail_y_Hy_plus_(a/y-sigma)_H_strictly_positive_with_directed_y_zero_limit",
      "tail_minus_C*y/R_plus_E*Q_strictly_negative",
      "C1_join_and_one_sided_PDE_limits",
      "full_mass_Coulomb_consistency",
      "origin_recurrence",
      "global_identities",
      "target_scaling_and_continuous_global_maximum",
      "representative_to_true_exterior_solution_radii_enclosure",
    ],
    tailAbsoluteScaledResidualMaximumExact: "1e-10",
    tailResidualNormalization:
      "direct_absolute_enclosure_of_the_dimensionless_scaled_rows_with_no_additive_floor",
    globalIntegralEnclosure:
      "adaptive_directed_interval_range_times_dyadic_width_with_at_most_262144_cells_and_depth_56_per_integral",
    outwardRemainderProof: {
      subject:
        "exterior_only_fibered_triples_(H,Q,C)_near_the_finite_representative_for_the_fixed_accepted_core_join_data_with_each_triple_using_its_own_sigma(C)=C/kappa-1_B(C)_and_-C/x_principal_potential",
      weightedNorm:
        "sum_n(1+n)^4*(abs(deltaH_n)+abs(deltaQ_n))+abs(gamma)_where_gamma=(C-C_rep)/sC_and_sC=max(C_rep,2^-256)_and_deltaH_deltaQ_compare_the_factored_fibers_after_subtracting_each_member's_own_-C/x_and_dividing_by_its_own_B(C)_or_E(C)",
      radiiCandidates:
        "2^-80,2^-79,...,2^-20_in_that_order_first_strictly_valid_candidate_only",
      operator:
        "directed_interval_Frechet_derivative_of_the_integral_form_of_both_exterior_SP_equations_and_the_mass_fixed_point",
      BanachSpace:
        "triples_(deltaH,deltaQ,gamma)_with_fixed_sC=max(C_rep,2^-256)_C=C_rep+sC*gamma_and_norm_sum_n(1+n)^4*(abs(deltaH_n)+abs(deltaQ_n))+abs(gamma)",
      infiniteOperator:
        "the_two_C1_eliminated_scaled_SP_residual_coefficient_sequences_plus_the_full_mass_fixed_point_sequence",
      approximateInverse:
        "inverse_of_the_65x65_primary_Jacobian_recomputed_in_MPFR256_RNDN_then_extended_diagonally_on_modes_n>=32_by_the_exact_principal_linear_tail_multiplier",
      YBound:
        "directed_upper_bound_on_norm(A*F(representative))_including_all_modes_n>=32_and_mass_coupling",
      ZBound:
        "directed_polynomial_upper_bound_on_sup_norm(I-A*DF(representative+ball_r))_including_tail_convolution_and_mass_coupling",
      inequalities:
        "p(r)=YUpper+ZUpper(r)*r-r<0_and_ZUpper(r)<1_with_all_bounds_finite_and_strict",
      uniqueness:
        "the_same_contraction_ball_contains_exactly_one_exterior_C1_tail_and_C_fixed_point_for_the_fixed_approximate_core_join_data_and_does_not_claim_an_exact_global_SP_root",
      noCandidateDisposition: "fail_candidate",
      recordEveryCandidate: true,
      propagation:
        "for_accepted_radius_r_evaluate_C_in_C_rep+sC*[-r,r]_then_sigma(C),B(C),E(C),u=B(C)H_and_V=-C/x+E(C)Q_jointly_by_directed_interval_arithmetic_and_propagate_that_fibered_ball_to_every_tail_residual_sign_mass_identity_scaling_and_analytic_BVP_initializer_enclosure",
    },
    positivity: {
      scalar: "H>0_since_B>0_for_finite_x",
      decreasing:
        "prove_a*H+y^2*H_y-sigma*y*H>0_on_[0,1]_which_equals_y_times_the_finite_x_decrease_expression_and_has_strict_limit_a*H(0)>0",
      potential: "-C*y/R+E*Q<0_for_y_in_(0,1]",
      potentialOpenEndpoint:
        "prove_V/y=-C/R+(E/y)*Q<0_using_the_C_infinity_flat_extension_E/y=positive_zero_at_y=0_and_require_sup(max(Q,0)*E/y)<C_lower/R_on_[0,delta]_for_the_first_delta_2^-80..2^-20_then_cover_[delta,1];_V(0)=positive_zero_is_only_the_infinity_boundary",
    },
    formalPrincipalRecurrence:
      "generate_the_formal_principal_coefficients_from_c0=exp(a)*R^(-sigma)*H(0)_using_c_(n+1)=-((sigma-n)*(sigma-n+1)/(2*kappa*(n+1)))*c_n_for_n=0..30_and_record_them_as_asymptotic_reference_only;_do_not_require_the_finite_global_H_polynomial_Taylor_coefficients_to_equal_the_formal_sector_because_sourced_flat_sectors_and_finite_approximation_are_separate",
    originRecurrenceReplay: {
      maximumEvenPower: 32,
      coefficientOrder: "a0,b0,a2,b2,...,a32,b32",
      recurrenceArithmetic:
        "MPFR256_directed_interval_in_increasing_n_then_k_order",
      remainder:
        "radii_enclosure_on_x_in_[0,2^-8]_using_candidates_2^-80..2^-20_and_the_same_defect_plus_lipschitz_radius_inequality",
      exactRecordCount: 17,
    },
    everyDutyMustPassConjunctively: true,
  },
  replayGates: {
    normalizedCoreResidualMaximum: 1e-10,
    boundaryAndC1Maximum: 1e-12,
    targetAmplitudeAbsoluteErrorMaximumExact: "2^-30",
    targetScalingRelativeMaximum: 1e-12,
    L1ToL2FieldRelativeMaximum: 1e-8,
    L1ToL2CoreObservableRelativeMaximum: 1e-9,
    D01OverD12Minimum: 4,
    D12ZeroRule: "D12=0_requires_D01=0",
    lastEightRadialCoefficientRatioMaximum: 1e-10,
    globalIdentityRelativeMaximum: 1e-9,
    continuousStrictProofRequired: true,
    producerComputedMetricsHavePassAuthority: false,
  },
  materializationGraphs: {
    auditNodes:
      "generate_N=256_rho_nodes_by_the_same_MPFR256_RNDN_graph_and_get_d_RNDN_barriers_as_core_levels_without_a_solve",
    coreCoefficients:
      "for_each_L0_L1_L2_field_compute_a_m=(2/(N-1))*c_m*sum_(j=0)^(N-1)c_j*q_j*cos(pi*m*j/(N-1))_with_c_endpoint=1/2_c_interior=1;_inject_pi_m_j_and_N-1_then_divide_cos_multiply_cj_qj_and_accumulate_j_increasing_all_MPFR256_RNDN_then_multiply_outer_factors_and_get_d_RNDN_per_m",
    solvedLevelBaseArrays:
      "L0_L1_L2_base_arrays_are_the_exact_accepted_same_level_nodal_f64_bits_and_have_authority_only_on_x<=32",
    targetArrays:
      "at_every_level_evaluate_the_finite_L2_core_plus_finite_tail_representative_that_was_actually_solved_after_exact_lambda_scaling_at_that_level_rho_nodes_in_MPFR256_then_get_d_RNDN_once_per_value_and_bind_the_separate_true_solution_ball",
    auditBaseArrays:
      "evaluate_the_finite_L2_core_plus_finite_tail_representative_that_was_actually_solved_at_all_256_AUDIT_rho_nodes_in_MPFR256_then_get_d_RNDN_once_per_value_and_bind_the_separate_true_solution_ball",
    infinityValues:
      "all_base_and_target_scalar_and_potential_values_at_rho=1_are_canonical_positive_zero",
    scalarMetadata:
      "nu0_and_Vc_are_exact_primary_accepted_f64_values;_C_is_the_exact_primary_tail_unknown_f64_value;_kappa_sigma_N0_nu_star_wSeed_are_recomputed_in_MPFR256_from_those_exact_bits_then_get_d_RNDN;_lambda_is_exact_2^-5;_the_independent_intervals_must_contain_each_serialized_value_and_are_bound_separately",
    BVPInitializer:
      "this_policy_emits_only_the_analytic_initializer_map_binding_and_composite_evaluator_hash;_no_BVP_grid_values_are_emitted_until_a_separate_frozen_BVP_numerical_policy_binds_its_grid",
  },
  proofRecordSchemas: {
    intervalEndpointEncoding:
      "each_endpoint_is_object_{sign:minus_or_plus_or_zero,mantissaLowercaseHex:string,exponent2:safe_integer,precisionBits:256,direction:RNDD_or_RNDU}_with_zero_only_sign_zero_mantissa_0_exponent2_0",
    commonExactKeys: [
      "schemaVersion",
      "dutyOrdinal",
      "recordOrdinal",
      "boxLower",
      "boxUpper",
      "quantityLower",
      "quantityUpper",
      "decision",
      "depth",
      "parentOrdinal",
      "payloadSha256",
    ],
    dutySpecificPayloadSchemas: {
      intervalCover:
        "{variableOrder:string_tuple,expressionId:string,termIntervals:endpoint_pair_tuple,normalizationInterval:endpoint_pair_or_null,strictPredicate:string}",
      C1Join:
        "{U,U1,V,V1,H1,Hy1,Q1,Qy1,leftPdeLimits,rightPdeLimits:directed_endpoint_pairs}",
      massAndIdentities:
        "{N,T,W,potentialGradient,gaussFlux,C,massDefect,virialDefect,eigenvalueDefect,poissonEnergyDefect,gaussDefect:directed_endpoint_pairs}",
      recurrence:
        "{c0:directed_endpoint_pair,generatedC:exact_32_directed_endpoint_pairs,admissionEqualityRequired:false}",
      radiiPolynomial:
        "{radiusExact:string,YUpper:directed_endpoint,ZPolynomialCoefficients:directed_endpoint_tuple,pUpper:directed_endpoint,accepted:boolean}",
      scalingAndBvpMap:
        "{lambda,nuStar,wSeed,targetAmplitudeError,scalarScalingDefect,potentialScalingDefect,continuousMaximum,analyticBvpMapBinding:directed_endpoint_pairs_or_binding}",
    },
    decisionOrder: ["accept", "split", "reject", "budget_exhausted"],
    boxEncoding:
      "tuple_of_intervalEndpointEncoding_values_in_the_duty_specific_variable_order",
    payloadHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-proof-record/v1\n",
    payloadHash:
      "SHA256(literal_domain_utf8||u64le(canonical_record_without_payloadSha256_length)||canonical_record_without_payloadSha256)",
    recordOrder:
      "dutyOrdinal_then_depth_then_lexicographic_boxLower_then_recordOrdinal",
    populations: {
      origin: 17,
      maximumPerIntervalDuty: 262144,
      outwardRadiiCandidates: 61,
      exactDutyCount: 16,
    },
    dutyToFile: {
      origin_recurrence: "proof/origin.jsonl",
      core_duties: "proof/core-intervals.jsonl",
      tail_and_outward_duties: "proof/tail-intervals.jsonl",
      mass_and_global_identity_duties: "proof/integrals.jsonl",
      target_scaling_and_BVP_map: "proof/scaling-and-bvp-init.jsonl",
    },
    terminalAcceptance:
      "every_duty_ends_with_only_accept_records_and_no_reject_or_budget_exhausted_record",
  },
  outputDescriptorAndPayloadPolicy: {
    rootInventoryOrder: [
      "descriptor.json",
      "scalars.f64le",
      "arrays/L0/rho_nodes.f64le",
      "arrays/L0/base_scalar_u0.f64le",
      "arrays/L0/base_potential_V0.f64le",
      "arrays/L0/target_scalar_u_star.f64le",
      "arrays/L0/target_potential_V_star.f64le",
      "arrays/L1/rho_nodes.f64le",
      "arrays/L1/base_scalar_u0.f64le",
      "arrays/L1/base_potential_V0.f64le",
      "arrays/L1/target_scalar_u_star.f64le",
      "arrays/L1/target_potential_V_star.f64le",
      "arrays/L2/rho_nodes.f64le",
      "arrays/L2/base_scalar_u0.f64le",
      "arrays/L2/base_potential_V0.f64le",
      "arrays/L2/target_scalar_u_star.f64le",
      "arrays/L2/target_potential_V_star.f64le",
      "arrays/AUDIT/rho_nodes.f64le",
      "arrays/AUDIT/base_scalar_u0.f64le",
      "arrays/AUDIT/base_potential_V0.f64le",
      "arrays/AUDIT/target_scalar_u_star.f64le",
      "arrays/AUDIT/target_potential_V_star.f64le",
      "coefficients/core_L0_u.f64le",
      "coefficients/core_L0_V.f64le",
      "coefficients/core_L1_u.f64le",
      "coefficients/core_L1_V.f64le",
      "coefficients/core_L2_u.f64le",
      "coefficients/core_L2_V.f64le",
      "coefficients/tail_H.f64le",
      "coefficients/tail_Q.f64le",
      "proof/origin.jsonl",
      "proof/core-intervals.jsonl",
      "proof/tail-intervals.jsonl",
      "proof/integrals.jsonl",
      "proof/scaling-and-bvp-init.jsonl",
      "receipt.json",
    ],
    scalarRoleOrder: SCALAR_ROLE_ORDER,
    scalarByteLength: 72,
    levelOrder: ["L0", "L1", "L2", "AUDIT"],
    arrayRoleOrder: ARRAY_ROLE_ORDER,
    arrayCount: 20,
    arrayElementCount: 2720,
    arrayByteLength: 21760,
    coreCoefficientElementCount: 576,
    coreCoefficientByteLength: 4608,
    tailCoefficientElementCount: 64,
    tailCoefficientByteLength: 512,
    everyF64Payload:
      "fresh_exact_length_little_endian_full_view_all_values_finite_and_negative_zero_forbidden",
    descriptorEncoding:
      "UTF8_RFC8785_canonical_JSON_no_BOM_no_duplicate_keys_no_nonfinite_numbers",
    proofEncoding:
      "UTF8_one_RFC8785_canonical_JSON_record_per_LF_line_no_CR_no_blank_lines",
    payloadHashDomain: "nhm2-spherical-boson-star-newtonian-seed-payload/v1\n",
    payloadHashRecipe:
      "SHA256(literal_payloadHashDomain_utf8||u64le(rolePathUtf8ByteLength)||rolePathUtf8||u64le(payloadByteLength)||payloadBytes)",
    descriptorHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-descriptor/v1\n",
    descriptorHashRecipe:
      "SHA256(literal_descriptorHashDomain_utf8||canonical_descriptor_bytes)_with_descriptor_not_containing_its_own_hash",
    descriptorRequiredBindings: [
      "candidateId",
      "semanticSeedBinding",
      "operationPolicyBinding",
      "commit40",
      "dirtyTreeDigest",
      "sourceManifestBindings",
      "toolchainManifestBindings",
      "executableBindings",
      "runtimeBindings",
      "commandArgv",
      "wallStartUtc",
      "wallEndUtc",
      "monotonicElapsedNanoseconds",
      "preexecutionPresealBinding",
      "orderedPayloadPathSizeHashBindings",
      "proofRecordCountsAndHashes",
      "firstFailureOrAllPassed",
    ],
    descriptorExactFieldTypes:
      "all_binding_hashes_lowercase_64_hex_sizes_safe_nonnegative_integers_commandArgv_nonempty_UTF8_string_tuple_times_RFC3339_UTC_strings_elapsed_safe_nonnegative_integer_payloads_exact_tuple_of_path_size_sha256_and_firstFailureOrAllPassed_exact_tagged_union",
    descriptorPayloadBindingOrder:
      "every_rootInventoryOrder_entry_after_descriptor.json_and_before_receipt.json_in_literal_order",
    receiptHashDomain: "nhm2-spherical-boson-star-newtonian-seed-receipt/v1\n",
    receiptSemantics:
      "receipt_binds_descriptor_hash_and_every_non_descriptor_non_receipt_payload_hash_and_is_not_bound_by_descriptor_to_avoid_a_cycle",
    maximumDescriptorBytes: 1048576,
    maximumProofRecordBytes: 16384,
    maximumProofRecordCount: 4194304,
    writeProtocol:
      "create_one_private_sibling_temp_root_O_EXCL_mode0700_validate_and_hash_every_payload_then_write_non_descriptor_payloads_in_inventory_order_fsync_each_file_write_descriptor_then_receipt_fsync_files_and_directories_bottom_up_then_atomically_rename_the_temp_root_to_the_absent_final_root_and_fsync_parent",
    partialOutputOnFailureAllowed: false,
    tempRootFailureDisposition:
      "failure_before_atomic_publish_leaves_only_a_non_authoritative_random_nonce_temp_root_that_is_never_treated_as_output;_the_separate_failure_receipt_is_written_to_a_predeclared_disjoint_failure_root",
    failureReceipt: {
      path: "failure/receipt.json",
      exactKeys: [
        "candidateId",
        "semanticSeedBinding",
        "operationPolicyBinding",
        "attemptOrdinal",
        "firstFailureCode",
        "stage",
        "commit40",
        "commandArgv",
        "wallStartUtc",
        "wallEndUtc",
        "monotonicElapsedNanoseconds",
        "authorityFalse",
      ],
      attemptOrdinal: 1,
      authorityFalse: true,
      noCandidateNumericValuesBeyondTheFirstTypedFailure: true,
    },
  },
  provenanceAndFreshness: {
    commit: "exact_lowercase_40_hex_commit",
    dirtyTreeDigest:
      "SHA256_over_sorted_length_delimited_relative_path_status_and_worktree_bytes_for_every_tracked_or_untracked_in_scope_source",
    command: "exact_UTF8_argv_array_without_shell_reparsing",
    timing:
      "UTC_start_and_end_plus_monotonic_elapsed_nanoseconds_from_the_same_process",
    implementationIdentity:
      "exact_source_toolchain_executable_shared_library_and_runtime_manifest_hash_size_bindings",
    manifestSchema: {
      exactKeys: [
        "schemaVersion",
        "role",
        "orderedEntries",
        "aggregateSha256",
        "authorityFalse",
      ],
      entryExactKeys: ["path", "sizeBytes", "sha256", "mediaType"],
      pathRule:
        "canonical_relative_POSIX_path_no_dot_dot_no_empty_segment_no_backslash",
      order: "UTF8_bytewise_path_order",
      aggregateDomain: "nhm2-spherical-boson-star-newtonian-seed-manifest/v1\n",
      authorityFalse: true,
    },
    dirtyTreeScope:
      "exact_union_of_every_source_manifest_path_plus_build_recipe_and_lockfile_paths_with_git_status_porcelain_v2_record_for_each_path",
    freshness:
      "prelaunch_and_postexit_lstat_fstat_no_follow_device_inode_size_mtime_ctime_and_content_hash_observations_for_every_static_input",
    networkAllowed: false,
    processCountMaximum: 1,
    threadCountMaximum: 1,
    blasThreadCountMaximum: 1,
    maximumWallSeconds: 1800,
    maximumRssBytes: 805306368,
    currentHostWindowsExecutionAdmissible: false,
    primaryAndIndependentProcessSeparation:
      "each_execution_individually_has_processCountMaximum=1_and_uses_disjoint_source_root_executable_runtime_and_output_root;_they_never_import_or_invoke_each_other",
  },
  firstFailurePrecedence: [
    "binding_or_literal_policy_mismatch",
    "source_toolchain_executable_or_runtime_closure_absent_or_mismatched",
    "preexecution_preseal_absent_or_mismatched",
    "runtime_resource_or_network_policy_violation",
    "mapped_node_or_operator_generation_failure",
    "L0_initializer_failure",
    "L0_core_solve_failure",
    "L0_replay_gate_failure",
    "L1_transfer_or_core_solve_failure",
    "L1_replay_gate_failure",
    "L2_transfer_or_core_solve_failure",
    "L2_replay_gate_failure",
    "tail_join_or_tail_solve_failure",
    "tail_interval_or_continuous_proof_failure",
    "global_identity_or_Coulomb_consistency_failure",
    "convergence_or_spectral_tail_failure",
    "target_scaling_or_BVP_initializer_failure",
    "output_preflight_or_atomic_write_failure",
    "postwrite_freshness_or_readback_failure",
  ],
  attemptPolicy: {
    maximumCandidateAttempts: 1,
    retryAfterAnyFailureAllowed: false,
    retuneGridJoinTailOrderPrecisionToleranceAlgorithmOrInitializerAllowed: false,
    branchFallbackAllowed: false,
    failureDisposition:
      "persist_failure_receipt_only_and_fail_this_candidate_without_seed_or_branch_artifact",
  },
  completionBoundary: {
    primaryCandidateMapStructureFrozen: true,
    primaryOperationSemanticsComplete: false,
    primaryOutputInventoryComplete: true,
    directedProofOperatorSemanticsComplete: false,
    exactProofReceiptSchemasComplete: false,
    quadratureFixtureBound: false,
    operationSemanticsComplete: false,
    outputAndProofSchemasComplete: false,
    implementationClosureComplete: false,
    preexecutionPresealComplete: false,
    executionAuthorized: false,
    executionObserved: false,
    seedAccepted: false,
  },
  blockers:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BLOCKERS,
  unresolved: UNRESOLVED,
  authorityLocks: AUTHORITY_LOCKS,
  claimLockKeys: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.claimLockKeys,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.claimLocks,
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1 =
  deepFreeze(POLICY);

const assertInvariants = (): void => {
  if (
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SEED_PIN.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SEED_PIN.canonicalSizeBytes ||
    POLICY.tailSquareSystem.coefficientCountPerField !== 32 ||
    POLICY.outputDescriptorAndPayloadPolicy.arrayByteLength !== 21760 ||
    POLICY.outputDescriptorAndPayloadPolicy.coreCoefficientByteLength !==
      4608 ||
    POLICY.outputDescriptorAndPayloadPolicy.tailCoefficientByteLength !== 512 ||
    POLICY.completionBoundary.primaryCandidateMapStructureFrozen !== true ||
    POLICY.completionBoundary.primaryOperationSemanticsComplete !== false ||
    POLICY.completionBoundary.operationSemanticsComplete !== false ||
    POLICY.completionBoundary.directedProofOperatorSemanticsComplete !==
      false ||
    POLICY.completionBoundary.implementationClosureComplete !== false ||
    POLICY.completionBoundary.executionAuthorized !== false ||
    Object.values(POLICY.authorityLocks).some((value) => value !== false) ||
    Object.values(POLICY.claimLocks).some((value) => value !== false) ||
    Object.values(POLICY.unresolved).some((value) => value !== null)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_newtonian_seed_operation_policy_v1_invariant_violation",
    );
  }
};

assertInvariants();

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16384,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 32768,
  } as const);

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

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
  budget = { nodes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
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
          violation: `string_byte_limit:${pointer || "/"}`,
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
  if (isProxy(value)) {
    return Object.freeze({
      ok: false,
      violation: `proxy_forbidden:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cycle:${pointer || "/"}`,
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
      length < 0 ||
      length > limits.maximumArrayLength
    ) {
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
    const indices = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== length + 1 ||
      indices.length !== length ||
      indices.some((key) => {
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1);
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-newtonian-seed-operation-policy/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_ARTIFACT_ID,
    policyVersion:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1.candidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_SHA256 =
  "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  32308 as const;

if (
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_seed_operation_policy_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES}`,
  );
}

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarNewtonianSeedOperationPolicyV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1) {
    return [];
  }
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_seed_operation_policy_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["spherical_seed_operation_policy_external_copy_not_authoritative"]
      : ["spherical_seed_operation_policy_semantic_mismatch"];
  } catch {
    return ["spherical_seed_operation_policy_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarNewtonianSeedOperationPolicyV1 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1;
