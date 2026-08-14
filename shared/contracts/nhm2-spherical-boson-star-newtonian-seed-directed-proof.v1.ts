import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_newtonian_seed_directed_proof" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VERSION =
  "nhm2_spherical_boson_star_newtonian_seed_directed_proof/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS =
  Object.freeze({
    semanticSeed: Object.freeze({
      sha256:
        "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
      canonicalSizeBytes: 18894,
    }),
    operationPrepolicy: Object.freeze({
      sha256:
        "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
      canonicalSizeBytes: 32308,
    }),
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 36,
    maximumNodes: 24576,
    maximumArrayLength: 1024,
    maximumObjectPropertyCount: 512,
    maximumStringUtf8Bytes: 65536,
  } as const);

const BLOCKERS = Object.freeze([
  "closed_receipt_common_summary_and_duty_specific_value_types_nested_shapes_field_order_endpoint_mantissa_normalization_conditional_null_semantics_and_parser_ABI_absent",
  "exact_origin_nonlinear_operator_representative_inverse_Y_Z0_Z1_and_q_definition_absent",
  "exact_projection_initial_partition_depth_cell_evaluation_and_global_work_budget_absent",
  "exact_Z0_infinite_column_formula_constants_monotonicity_proof_and_operation_graph_absent",
  "exact_Z1_bilinear_block_tail_formulas_constants_and_operation_graph_absent",
  "exact_all_truncation_remainder_formulas_constants_and_composition_graph_absent",
  "exact_signed_reciprocal_endpoint_operation_graph_absent",
  "final_primary_numerics_policy_binding_absent",
  "hash_bound_primary_directed_proof_source_absent",
  "hash_bound_independent_directed_proof_source_absent",
  "mpfr_gmp_toolchain_executable_and_runtime_closure_absent",
  "primary_to_verifier_input_instance_absent",
  "candidate_manifest_and_preexecution_preseal_absent",
  "linux_single_process_single_thread_runtime_provider_absent",
  "directed_proof_not_implemented",
  "directed_proof_not_executed",
  "directed_proof_receipts_absent",
  "newtonian_seed_not_accepted",
  "relativistic_spherical_branch_not_solved",
  "metric_demand_nondegeneracy_receipt_absent",
] as const);

const AUTHORITY_LOCKS = Object.freeze({
  implementationComplete: false,
  runtimeClosureComplete: false,
  preexecutionPresealPresent: false,
  executionAuthorized: false,
  executionObserved: false,
  projectedExteriorContractionAccepted: false,
  fullExteriorPdeAccepted: false,
  exactCoreRootAccepted: false,
  exactGlobalSchrodingerPoissonRootAccepted: false,
  directedDutiesAccepted: false,
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
  primaryNumericsPolicyBinding: null,
  primarySourceManifest: null,
  independentSourceManifest: null,
  primaryToolchainManifest: null,
  independentToolchainManifest: null,
  primaryExecutableBinding: null,
  independentExecutableBinding: null,
  primaryRuntimeBinding: null,
  independentRuntimeBinding: null,
  candidateManifest: null,
  preexecutionPreseal: null,
  primaryInputInstance: null,
  primaryExecutionReceipt: null,
  independentExecutionReceipt: null,
  primaryProofSummary: null,
  independentProofSummary: null,
  agreementReceipt: null,
  directedProofResult: null,
} as const);

const DUTY_ORDER = Object.freeze([
  "origin_recurrence_and_remainder",
  "core_normalized_schrodinger",
  "core_normalized_poisson",
  "core_scalar_strict_positivity",
  "core_scalar_strict_decrease",
  "core_potential_strict_negativity",
  "exterior_projected_radii_polynomial",
  "exterior_full_scaled_schrodinger",
  "exterior_full_scaled_poisson",
  "exterior_H_strict_positivity",
  "exterior_scalar_strict_decrease",
  "exterior_potential_open_endpoint_negativity",
  "C1_join_and_one_sided_limits",
  "mass_and_coulomb_consistency",
  "global_integral_identities",
  "target_scaling_maximum_and_bvp_map",
] as const);

const POLICY = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_ARTIFACT_ID,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.candidateId,
  maturity:
    "stage_2_directed_proof_algebra_norm_receipt_architecture_with_exact_infinite_operator_bounds_still_blocked",
  frozenBeforeCandidateExecution: true,
  bindings: {
    semanticSeed:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS.semanticSeed,
    operationPrepolicy:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS.operationPrepolicy,
  },
  scopeBoundary: {
    subject:
      "directed_replay_of_the_frozen_finite_L2_core_plus_C1_Coulomb_exponential_exterior_representative_and_a_projected_exterior_correction_ball",
    provesOnlyRecordedDirectedDuties: true,
    projectedExteriorOperatorZeroImpliesFullExteriorPde: false,
    reason:
      "the_preconditioner_intentionally_discards_raw_low_ultraspherical_modes_S_0_S_1_and_P_0_through_P_3_so_the_contraction_is_not_an_injective_preconditioning_of_the_full_differential_residual",
    omittedLowModesMustPassIndependentResidualDuties: true,
    coreModesIncludedInSameContraction: false,
    exactCoreRootAuthority: false,
    exactExteriorPdeRootAuthority: false,
    exactGlobalSchrodingerPoissonRootAuthority: false,
    exactRelativisticBranchAuthority: false,
    numericalInitializerErrorEnclosureOnly: true,
    candidateFailureOnAnyUnresolvedOrExceededBound: true,
    retuningOrRetryAllowed: false,
  },
  directedArithmetic: {
    precisionBits: 256,
    precisionEscalationAllowed: false,
    endpointBackend: "MPFR_4_or_later_binary_precision_256",
    lowerDirection: "MPFR_RNDD",
    upperDirection: "MPFR_RNDU",
    nearestDirection: "MPFR_RNDN",
    inputs:
      "integers_dyadic_rationals_and_f64_payloads_are_injected_exactly_before_any_operation",
    positiveZeroOnly: true,
    negativeZeroForbidden: true,
    nonfiniteForbidden: true,
    intervalPrimitives: {
      add: "[a,b]+[c,d]=[RNDD(a+c),RNDU(b+d)]_with_lower_then_upper",
      subtract: "[a,b]-[c,d]=[RNDD(a-d),RNDU(b-c)]_with_lower_then_upper",
      multiply:
        "evaluate_ac_ad_bc_bd_in_that_order_once_RNDD_and_once_RNDU_then_take_the_first_minimum_and_first_maximum_on_ties",
      reciprocal:
        "reject_if_zero_is_contained_else_[RNDD(1/b),RNDU(1/a)]_for_positive_and_the_sign-correct_swapped_formula_for_negative",
      divide: "multiply_by_the_previously_constructed_reciprocal_interval",
      square:
        "if_zero_contained_lower_is_positive_zero_else_lower_is_RNDD(min(a^2,b^2));_upper_is_RNDU(max(a^2,b^2))",
      sqrt: "reject_negative_lower;_[sqrt_RNDD(max(a,0)),sqrt_RNDU(b)]",
      exp: "[exp_RNDD(a),exp_RNDU(b)]",
      log: "reject_nonpositive_lower;_[log_RNDD(a),log_RNDU(b)]",
      integerPower:
        "left_to_right_binary_exponentiation_from_the_most_significant_exponent_bit_with_one_directed_square_then_optional_directed_multiply",
      absoluteUpper: "max(abs(lower),abs(upper))_rounded_RNDU",
      hull: "lowest_lower_then_highest_upper_with_earliest_operand_winning_exact_ties",
      intersection: "max_lower_min_upper_and_reject_when_the_result_is_empty",
    },
    constants: {
      pi: "one_MPFR_const_pi_RNDD_lower_and_one_MPFR_const_pi_RNDU_upper",
      e: "exp_of_exact_one_with_RNDD_and_RNDU",
      R: "exact_integer_32",
      lambda: "exact_dyadic_2^-5",
      minimumCScale: "exact_dyadic_2^-256",
    },
    reductionOrder:
      "all_finite_sums_use_literal_increasing_index_order_and_each_lower_or_upper_add_rounds_once_in_its_direction;_no_pairwise_tree_FMA_SIMD_BLAS_or_reassociation",
  },
  coefficientSpaces: {
    coordinate: "y=R/x_in_[0,1]_and_t=2*y-1",
    unknownBasis: "unprimed_shifted_Chebyshev_T_n(t)_with_T_0=1",
    residualBasis: "ultraspherical_C_n^(2)(t)",
    unknownSpace: {
      symbol: "X",
      elements: "(alpha,beta,gamma)",
      coefficientWeight: "wX(n)=(n+1)^8",
      norm: "normX=sum_(n=0)^infinity wX(n)*(abs(alpha_n)+abs(beta_n))+abs(gamma)",
    },
    residualSpace: {
      symbol: "Y",
      elements:
        "(s,p,m)_where_s_n_is_raw_S_C2_mode_(n+2)_p_n_is_raw_P_C2_mode_(n+4)_and_m_is_the_dimensionless_mass_defect",
      coefficientWeight: "wY(n)=(n+1)^7",
      norm: "normY=sum_(n=0)^infinity wY(n)*(abs(s_n)+abs(p_n))+abs(m)",
      deliberatelyOmittedRawModes: [
        "S_C2_mode_0",
        "S_C2_mode_1",
        "P_C2_mode_0",
        "P_C2_mode_1",
        "P_C2_mode_2",
        "P_C2_mode_3",
      ],
    },
    boundednessBoundary: {
      derivativeIsNotClaimedBoundedFromXToX: true,
      secondDerivativeIsNotClaimedBoundedFromXToX: true,
      D2MapsXToYBecause:
        "Dyy_T_n(2y-1)=8*n*C_(n-2)^(2)_and_sup_n>=2(8*n*wY(n-2)/wX(n))_is_finite",
      multiplicationAndConvolution:
        "the_Chebyshev_product_weight_(n+1)^8_is_submultiplicative_and_every_polynomial_multiplier_is_a_finite_banded_map",
      conversionMaps:
        "S02_D02_D202_and_every_y_multiplier_column_sum_is_measured_from_X_weight_8_to_Y_weight_7_not_in_one_common_space",
      preconditionerMapsYToXBecause:
        "both_frozen_tail_multipliers_grow_linearly_in_n_and_sup_n>=32(wX(n)/(abs(mu_n)*wY(n)))_is_finitely_enclosed",
      requiredNormCertificate:
        "record_directed_upper_bounds_for_every_derivative_conversion_multiplication_convolution_DF_A_ADF_and_D2F_map_in_the_exact_declared_source_and_target_norms",
    },
  },
  exactCoefficientOperators: {
    ChebyshevRecurrence: "T_0(t)=1;_T_1(t)=t;_T_(n+1)(t)=2*t*T_n(t)-T_(n-1)(t)",
    ChebyshevProduct:
      "product(f,g)_m=(1/2)*sum_(j=0)^infinity_sum_(k=0)^infinity f_j*g_k*(indicator_(j+k=m)+indicator_(abs(j-k)=m))",
    convolutionLoopOrder:
      "shell=j+k_increasing_then_j_increasing_then_k=shell-j;_add_the_j+k_contribution_before_the_abs(j-k)_contribution_and_round_each_endpoint",
    polynomialMultiply:
      "apply_the_same_product_formula_with_the_finite_polynomial_operand_and_output_mode_increasing",
    liftPolynomial: {
      expression: "(1-y)^2=(3/8)*T_0-(1/2)*T_1+(1/8)*T_2",
      coefficientsExact: ["3/8", "-1/2", "1/8"],
    },
    ChebyshevToC1: {
      formula:
        "T_0=C_0^(1);_for_n>=1_T_n=(C_n^(1)-C_(n-2)^(1))/2_with_negative_modes_zero",
      matrix:
        "S01[m,n]=1_if_(m,n)=(0,0);_otherwise_+1/2_if_m=n>=1_minus_1/2_if_m=n-2>=0_and_zero_otherwise",
    },
    C1ToC2: {
      formula: "C_n^(1)=(C_n^(2)-C_(n-2)^(2))/(n+1)_with_negative_modes_zero",
      matrix:
        "S12[m,n]=+1/(n+1)_if_m=n_minus_1/(n+1)_if_m=n-2>=0_and_zero_otherwise",
    },
    ChebyshevToC2:
      "S02=S12*S01_with_input_column_n_increasing_intermediate_index_increasing_then_output_mode_increasing",
    firstDerivativeToC1: "D01[m,n]=2*n_if_n>=1_and_m=n-1_else_zero",
    firstDerivativeToC2: "D02=S12*D01_with_intermediate_index_increasing",
    secondDerivativeToC2: "D202[m,n]=8*n_if_n>=2_and_m=n-2_else_zero",
    multiplyYInC2: {
      recurrence:
        "t*C_n^(2)=((n+1)/(2*(n+2)))*C_(n+1)^(2)+((n+3)/(2*(n+2)))*C_(n-1)^(2)_with_negative_modes_zero",
      yMap: "M_y=(I+M_t)/2",
      powers: "M_y2=M_y*M_y_M_y3=M_y2*M_y_M_y4=M_y3*M_y_in_that_order",
    },
    ChebyshevProjection: {
      definition:
        "Proj_0(f)=integral_0^1 f((1+cos(pi*t))/2)dt_and_Proj_n(f)=2*integral_0^1 f((1+cos(pi*t))/2)*cos(n*pi*t)dt_for_n>=1",
      endpointParity:
        "all_odd_t_derivatives_are_zero_at_t=0_and_t=1_for_the_projected_B_E_E_over_y_and_E_over_y2_fibers_including_gamma_orders_0_1_2",
      finiteModeMaximum: 512,
      finiteModeIntegrator:
        "adaptive_exact-dyadic_t_cells_with_order_9_midpoint_Taylor_integral_and_an_order_10_interval_remainder",
      cellFormula:
        "g(t)=fiber(t)*cos(n*pi*t);_sum_even_j_in_{0,2,4,6,8} g^(j)(m)/j!*2*h^(j+1)/(j+1)_plus_[-1,1]*supabs(g^10(cell))/10!*2*h^11/11",
      automaticDifferentiation:
        "literal_length_11_univariate_Taylor_jet_add_multiply_reciprocal_exp_log_sin_cos_composition_loops_total_degree_0_to_10_and_convolution_index_increasing",
      cellAcceptance:
        "accept_when_the_order_10_remainder_width_is_at_most_2^-220;_otherwise_split_unless_the_projection_budget_would_be_exceeded",
      integrationByPartsTail:
        "L10Upper=sum_over_the_accepted_derivative_cover_cells(cell_width*supabs(d^10/dt^10(fiber_composed_with_y)))_RNDU;_for_n>=513_abs(Proj_n)<=2*L10Upper/(n*pi_lower)^10",
      weightedTailBound:
        "sum_(n=513)^infinity(n+1)^8*abs(Proj_n)<=2*L10Upper/pi_lower^10*(1+1/513)^8*(1/513+1/513^2)",
      gammaOrders: [0, 1, 2],
      rejection:
        "any_failed_endpoint_flatness_derivative_bound_nonfinite_value_or_exhausted_cell_budget_is_a_typed_candidate_failure",
    },
  },
  exteriorFiber: {
    R: 32,
    kappa:
      "fixed_positive_directed_interval_sqrt(-2*nu0)_from_the_exact_primary_nu0_f64_bits",
    a: "a=kappa*R",
    representativeC:
      "Cbar_is_the_exact_primary_C_f64_bit_pattern_injected_into_MPFR",
    fixedCScale:
      "sC=max(Cbar,2^-256)_computed_once_at_input_admission_and_never_recomputed_from_a_ball",
    gamma: "C=Cbar+sC*gamma",
    sigma: "sigma(C)=C/kappa-1",
    inputDomainGates: [
      "nu0_is_finite_strictly_negative_and_-1/2<2^-10*nu0<0",
      "Cbar_is_finite_and_strictly_positive",
      "kappa_interval_is_finite_and_has_strictly_positive_lower_endpoint",
      "Cbar-sC*2^-20_has_strictly_positive_lower_endpoint_so_every_radii_candidate_preserves_C>0",
      "U_lower>0_U1_upper<0_V_upper<0_and_every_join_interval_is_finite",
      "all_32_H_and_32_Q_representative_coefficients_are_finite_exact_f64_inputs_without_negative_zero",
    ],
    inputDomainFailure:
      "fail_candidate_before_inverse_projection_cover_or_radius_evaluation_without_repairing_any_input",
    fibers: {
      B: "B(C,y)=exp(-a*(1/y-1)-sigma(C)*log(y))_for_y>0_and_B(C,0)=positive_zero",
      E: "E(C,y)=B(C,y)^2_from_the_same_B_interval_and_E(C,0)=positive_zero",
      G1: "G1(C,y)=E(C,y)/y_for_y>0_and_G1(C,0)=positive_zero",
      G2: "G2(C,y)=E(C,y)/y^2_for_y>0_and_G2(C,0)=positive_zero",
    },
    exactGammaDerivatives: {
      C: ["C_gamma=sC", "C_gammagamma=0"],
      sigma: ["sigma_gamma=sC/kappa", "sigma_gammagamma=0"],
      B: [
        "B_gamma=-(sC/kappa)*log(y)*B",
        "B_gammagamma=(sC/kappa)^2*log(y)^2*B",
      ],
      E: [
        "E_gamma=-2*(sC/kappa)*log(y)*E",
        "E_gammagamma=4*(sC/kappa)^2*log(y)^2*E",
      ],
      G1AndG2:
        "divide_the_E_Egamma_Egammagamma_formulas_by_y_or_y^2_for_y>0_and_use_the_common_flat_positive-zero_extension_at_y=0",
      endpointEvaluation:
        "on_y_in_[0,delta]_replace_log-and-division_evaluation_by_the_exact_t=-log(y)_envelope_sup_(t>=-log(delta)) exp(-2*a*(exp(t)-1)+2*sigmaUpper*t)*t^j*exp(k*t)_for_j=0..2_k=0..2_using_interval_Newton_on_the_log-derivative_and_both_endpoints",
    },
    joinsFromPrimaryCore: {
      U: "directed_Clenshaw_enclosure_of_u_L2_at_x=32",
      U1: "directed_enclosure_of_partial_x_u_L2_at_x=32",
      V: "directed_Clenshaw_enclosure_of_V_L2_at_x=32",
      V1: "directed_enclosure_of_partial_x_V_L2_at_x=32",
      H1: "H(1)=U",
      Hy1: "H_y(1)=(-a+sigma)*U-R*U1",
      Q1: "Q(1)=V+C/R",
      Qy1: "Q_y(1)=(-2*a+2*sigma)*Q1+C/R-R*V1",
      gammaDerivatives: [
        "H1_gamma=H1_gammagamma=0",
        "Hy1_gamma=(sC/kappa)*U_and_Hy1_gammagamma=0",
        "Q1_gamma=sC/R_and_Q1_gammagamma=0",
        "Qy1_gamma=2*(sC/kappa)*Q1+(-2*a+2*sigma)*(sC/R)+sC/R",
        "Qy1_gammagamma=4*(sC/kappa)*(sC/R)",
      ],
    },
    affineFiberMap: {
      H: "H(alpha,gamma)=H1+Hy1*(y-1)+(1-y)^2*sum_n>=0 alpha_n*T_n(2y-1)",
      Q: "Q(beta,gamma)=Q1+Qy1*(y-1)+(1-y)^2*sum_n>=0 beta_n*T_n(2y-1)",
      firstAndSecondGammaDerivatives:
        "differentiate_only_the_C-dependent_lift_coefficients_exactly_as_listed;_the_free_alpha_and_beta_sequences_have_zero_gamma_derivative",
      mixedDerivatives:
        "H_alphaGamma=Q_betaGamma=H_alphabeta=Q_alphabeta=positive_zero_and_all_nonzero_mixed_derivatives_arise_only_after_product_composition",
      joinEquality:
        "value_and_first_y_derivative_match_U_U1_V_V1_for_every_member_of_the_gamma_fiber_by_construction",
    },
  },
  infiniteResidualOperator: {
    rawScaledSchrodinger:
      "S=-(1/2)*(M_y2*D202(H)+2*(a*I-sigma*M_y)*D02(H)+sigma*(sigma+1)*S02(H))+R^2*S02(product(G2,product(Q,H)))",
    rawScaledPoisson:
      "P=M_y4*D202(Q)+4*M_y2*(a*I-sigma*M_y)*D02(Q)+(4*a^2*I-4*a*(2*sigma+1)*M_y+2*sigma*(2*sigma+1)*M_y2)*S02(Q)-R^2*S02(product(H,H))",
    multiplicationInterpretation:
      "G2_is_first_projected_to_its_infinite_Chebyshev_sequence_with_the_frozen_projection_and_IBP_tail_then_all_products_use_the_exact_Chebyshev_convolution",
    fullMass: {
      core: "Icore=integral_0^R x^2*u_L2(x)^2 dx_by_the_frozen_directed_integrator",
      exterior:
        "Itail=R^3*integral_0^1 E(C,y)*H(y)^2*y^-4 dy_with_the_flat_y=0_extension",
      dimensionlessResidual: "m=(C-Icore-Itail)/sC",
      exactGammaDerivatives: [
        "m_gamma=1-(R^3/sC)*integral_0^1(E_gamma*H^2+2*E*H*H_gamma)*y^-4dy",
        "m_gammagamma=-(R^3/sC)*integral_0^1(E_gammagamma*H^2+4*E_gamma*H*H_gamma+2*E*(H_gamma^2+H*H_gammagamma))*y^-4dy",
      ],
      sequenceDerivatives:
        "alpha_and_mixed_alpha-gamma_derivatives_follow_the_same_literal_product_rule;_all_beta_derivatives_are_zero",
    },
    operatorF: "F(alpha,beta,gamma)=(s_n=S_C2[n+2],p_n=P_C2[n+4],m)_in_Y",
    lowRawModeDefect:
      "Dlow=(S_C2[0],S_C2[1],P_C2[0],P_C2[1],P_C2[2],P_C2[3])_is_not_in_F_and_is_enclosed_by_the_full_residual_duties",
    differentiation:
      "DF_and_D2F_are_generated_by_literal_second-order_jets_in_coordinate_order_alpha_0_alpha_1_..._beta_0_beta_1_..._gamma_using_the_exact_linear_maps_product_rule_and_the_listed_gamma_fiber_derivatives",
  },
  preconditioner: {
    finiteCutoff: 32,
    auditCutoff: 512,
    representative:
      "xbar=(the_exact_32_primary_tail_H_coefficients,the_exact_32_primary_tail_Q_coefficients,gamma=positive_zero)_with_all_higher_coefficients_positive_zero",
    finiteProjection:
      "P32Y=(s_0..s_31,p_0..p_31,m)_and_E32X=(alpha_0..alpha_31,beta_0..beta_31,gamma)_in_that_order",
    finiteJacobian:
      "J32=P32*DF(xbar)*E32_as_65_by_65_directed_intervals_then_Jmid_ij=midpoint_RNDN_of_each_interval_in_row-major_order",
    MPFRInverseConstruction: {
      storage: "fresh_row_major_65_by_65_MPFR256_RNDN_matrix",
      factorization:
        "Doolittle_LU_partial_pivoting_k_increasing_candidate_rows_increasing_lowest_row_wins_exact_abs_ties",
      pivotFailure:
        "positive-zero_nonfinite_or_interval-certified-singular_pivot_is_typed_inverse_failure",
      update:
        "one_RNDN_division_for_Lik_then_j_increasing_one_RNDN_multiply_and_one_RNDN_subtract",
      solves:
        "columns_of_identity_in_increasing_column_order_forward_rows_increasing_backward_rows_decreasing_and_inner_columns_increasing",
      inverseSymbol: "B32",
      certification:
        "eta=norm_l1_weighted(I-B32*[J32])_upper_by_directed_row-major_matrix_products_and_max_weighted_column_sum_must_be_strictly_less_than_one",
      noLibraryInverseOrFallback: true,
    },
    principalTailMultipliers: {
      schrodinger:
        "muS(n,sigma)=(-(n+1)*(n+2)+2*sigma*(n+2)-sigma*(sigma+1))/(64*(n+3))_for_n>=32",
      derivationSchrodinger:
        "exact_C_(n+2)^(2)_highest-mode_coefficient_of_the_polynomial_part_of_S_applied_to_(1-y)^2*T_n;_the_-a*Hy_term_and_G2QH_have_no_polynomial_highest-mode_contribution",
      poisson:
        "muP(n,sigma)=((n+1)*(n+2)-4*sigma*(n+2)+2*sigma*(2*sigma+1))/(512*(n+5))_for_n>=32",
      derivationPoisson:
        "exact_C_(n+4)^(2)_highest-mode_coefficient_of_the_polynomial_linear_P_part_applied_to_(1-y)^2*T_n",
      directCheckRange: "n=32..512_in_increasing_n_order",
      infiniteCheck: [
        "for_n>=513_require_(n+1)*(n+2)>2*absSigmaUpper*(n+2)+absSigmaUpper*(absSigmaUpper+1)_which_excludes_zero_from_muS",
        "for_n>=513_require_(n+1)*(n+2)>4*absSigmaUpper*(n+2)+2*absSigmaUpper*(2*absSigmaUpper+1)_which_excludes_zero_from_muP",
        "prove_each_left-minus-right_polynomial_is_strictly_increasing_for_real_n>=513_by_a_directed_lower_bound_on_its_derivative",
      ],
      resonanceFailure:
        "if_zero_is_contained_in_any_muS_or_muP_interval_for_gamma_in_[-2^-20,2^-20]_or_either_infinite_check_fails_then_fail_with_principal_tail_resonance_without_changing_cutoff_basis_scale_or_radius_list",
    },
    AFromYToX: {
      finite:
        "E32*B32*P32_applied_with_output_row_increasing_input_column_increasing_MPFR256_directed_products_and_sums",
      tailAlpha: "for_n>=32_(A*r)_alpha_n=r.s_n/muS(n,sigma(Cbar))",
      tailBeta: "for_n>=32_(A*r)_beta_n=r.p_n/muP(n,sigma(Cbar))",
      tailGamma: "positive_zero",
      ignoredResiduals:
        "all_residual_coordinates_not_selected_by_P32_or_the_two_tail_formulas_map_to_positive_zero",
      boundedness:
        "A_Y_to_X_upper=max(finite_weighted_column_norms,sup_n>=32(wX(n)/(abs(muS_n)*wY(n))),sup_n>=32(wX(n)/(abs(muP_n)*wY(n))))",
      fixedAfterConstruction: true,
    },
  },
  radiiPolynomialProof: {
    correctionMap: "T(x)=x-A*F(x)",
    claim:
      "a_strict_radii_result_proves_one_fixed_point_of_T_in_the_X_ball_only_and_does_not_promote_AF=0_to_F=0",
    radiusMaximumExact: "2^-20",
    candidates: "r_j=2^(-80+j)_for_j=0..60_in_increasing_j_order",
    finiteAndTailAssembly: {
      explicitModeMaximum: 512,
      finiteLoopOrder:
        "output_component_alpha_0..alpha_512_then_beta_0..beta_512_then_gamma;_inside_each_output_input_column_alpha_0..alpha_512_then_beta_0..beta_512_then_gamma",
      coefficientTailSources: [
        "order_10_IBP_projection_tails_for_G2_and_its_gamma_orders_0_1_2",
        "weighted_Chebyshev_convolution_tail_inequality_norm_w(f*g)_tail>K<=norm_w(f)_tail>K/2*norm_w(g)+norm_w(f)*norm_w(g)_tail>K/2",
        "finite_polynomial_bandwidth_2_for_each_C1_correction_lift",
        "finite_ultraspherical_bandwidth_4_for_the_polynomial_differential_part",
        "principal_multiplier_reciprocal_suprema_for_A",
      ],
      truncationOrder:
        "projection_tail_then_lift_tail_then_each_inner_product_tail_then_S02_or_D02_or_D202_tail_then_A_tail_then_weighted_sum",
      noUnrecordedRemainder: true,
    },
    Y: {
      formula: "YUpper=directed_upper_bound_of_normX(A*F(xbar))",
      finite:
        "sum_i_in_P32X wX(i)*absUpper(sum_j B32[i,j]*P32Fbar[j])_with_i_then_j_increasing_plus_absUpper_of_the_gamma_component",
      tail: "sum_n=32^512 wX(n)*(absUpper(Sbar_n/muSbar_n)+absUpper(Pbar_n/muPbar_n))+the_recorded_IBP_convolution_A_tail_bound",
      operationOrder: "finite_then_explicit_tail_modes_then_analytic_tail",
    },
    Z0: {
      formula:
        "Z0Upper=directed_upper_bound_of_operatorNorm_X_to_X(I-A*DF(xbar))",
      finiteColumns:
        "max_over_input_columns_j<=512_and_gamma_of_(sum_output_i<=512 wX(i)*absUpper(delta_ij-(A*DFbar)_ij)+recorded_output_tail_i>512)/wX(j)",
      infiniteColumns:
        "for_each_family_alpha_beta_take_the_max_of_the_directed_rational_bound_at_n=513_and_its_interval-certified_monotone_limit_using_the_principal_multiplier_cancellation_plus_all_polynomial_off-diagonals_and_IBP_convolution_tails",
      columnOrder:
        "alpha_columns_increasing_then_beta_columns_increasing_then_gamma_and_within_each_column_alpha_rows_then_beta_rows_then_gamma",
    },
    Z1: {
      formula:
        "Z1Upper=ANormUpper*M2Upper_where_M2Upper_is_a_directed_upper_bound_of_sup_(normX(x-xbar)<=2^-20)operatorNorm_(X_times_X_to_Y)(D2F(x))",
      HessianConstruction:
        "evaluate_the_exact_second-order_jet_graph_for_every_ordered_input-family_pair_(alpha,alpha),(alpha,beta),(alpha,gamma),(beta,alpha),(beta,beta),(beta,gamma),(gamma,alpha),(gamma,beta),(gamma,gamma)_in_that_order",
      blockNorm:
        "for_each_ordered_pair_take_the_max_weighted_bilinear_column_sum_over_explicit_modes_0..512_add_the_analytic_projection_and_convolution_tail_then_M2Upper_is_the_sum_of_the_nine_nonnegative_block_uppers_in_literal_order",
      gammaClosure:
        "the_gamma-gamma_and_mixed_blocks_include_sigma_B_E_G1_G2_H_lift_Q_lift_scaled_S_scaled_P_and_mass_derivatives_exactly_as_frozen_above",
    },
    Z: "ZUpper(r)=RNDU(Z0Upper+RNDU(Z1Upper*r))",
    p: "pUpper(r)=RNDU(YUpper+RNDU(ZUpper(r)*r)-r)_with_the_subtraction_lower_operand_Y+Zr_rounded_RNDU_and_minus_exact_r_rounded_RNDU",
    acceptance:
      "a_radius_is_strictly_valid_only_if_pUpper(r)<0_and_ZUpper(r)<1_and_every_bound_is_finite_and_every_resonance_projection_inverse_and_truncation_check_passed",
    selection:
      "evaluate_all_61_candidates_without_early_stop;_select_the_lowest-index_strictly-valid_radius;_earlier_candidates_are_invalid_and_later_valid_candidates_are_recorded_valid_not_selected",
    noCandidateDisposition:
      "fail_candidate_without_retry_retune_precision_escalation_or_cutoff_change",
    propagation:
      "the_selected_X_ball_and_C=Cbar+sC*[-r,r]_are_re-evaluated_jointly_through_sigma_B_E_G1_G2_both_lifts_H_Q_S_P_mass_sign_integral_identity_scaling_and_BVP-map_duties_with_dependency-preserving_interval_jets",
  },
  originDirectedProof: {
    domain: "x_in_[0,2^-8]",
    coefficientOrder: "a0,b0,a2,b2,...,a32,b32",
    explicitCount: 34,
    recurrence:
      "a_(2n+2)=2*(sum_(k=0)^n b_(2k)*a_(2(n-k))-nu0*a_(2n))/((2n+2)*(2n+3));_b_(2n+2)=sum_(k=0)^n a_(2k)*a_(2(n-k))/((2n+2)*(2n+3))",
    loopOrder:
      "n=0..15_then_a_convolution_k=0..n_then_b_convolution_k=0..n_with_each_multiply_before_add_and_denominator_last",
    infiniteRemainderSpace:
      "pairs_(da_n,db_n)_n>=17_with_norm=sum_n>=17(2^-8)^(2n)*(abs(da_n)+abs(db_n))",
    inverse:
      "divide_each_recurrence_defect_by_the_exact_positive_integer_(2n+2)*(2n+3)",
    radii:
      "evaluate_2^-80..2^-20_by_the_same_Y_Z0_Z1_p_and_first-radius_rules_with_geometric_convolution_tail_bound_sum_n>=17 q^n=q^17/(1-q)",
    requiredPredicates: [
      "u_contains_the_core_Clenshaw_enclosure_and_is_strictly_positive",
      "h=-u_prime/x_has_strictly_positive_limit_-2*(Vc-nu0)/3_and_strictly_positive_range",
      "V_is_strictly_negative",
      "origin_regular_R_S_normalized_enclosure_is_at_most_1e-10",
      "origin_regular_R_P_normalized_enclosure_is_at_most_1e-10",
      "series_and_core_Clenshaw_value_and_first-derivative_enclosures_intersect_at_x=2^-8",
    ],
  },
  intervalCoverEngine: {
    boxEncoding:
      "closed_exact-dyadic_endpoint_pairs_in_the_listed_coordinate_order",
    queue:
      "depth-first_stack_initialized_by_pushing_initial_boxes_in_reverse_domain_order;_pop_lowest-domain-box;_when_split_push_upper_child_then_lower_child_so_lower_is_processed_first",
    split:
      "bisect_the_lowest-index_coordinate_among_those_with_max(width/initialWidth);_exact_ties_choose_lowest_coordinate;_midpoint=(lower+upper)/2_exact_dyadic",
    accept:
      "accept_only_when_every_duty_predicate_is_strictly_or_nonstrictly_satisfied_as_declared_by_the_whole_outward_interval_and_all_required_denominator_intervals_exclude_zero",
    reject:
      "immediately_reject_on_a_proved_rail_violation_nonfinite_endpoint_empty_intersection_or_depth/budget_exhaustion;_an_unresolved_box_is_never_accept",
    records:
      "emit_exactly_one_record_for_every_popped_box_before_accept_split_or_reject_and_assign_recordOrdinal_monotonically_within_the_duty",
    commonMaximumDepth: 56,
    commonMaximumPoppedBoxesPerDuty: 262144,
    noAdaptivePrecisionOrPredicateWeakening: true,
  },
  coreCovers: {
    originBox: "[0,2^-8]_handled_only_by_originDirectedProof",
    nonoriginInitialBox: "[2^-8,32]",
    evaluator:
      "directed_Clenshaw_on_exact_L2_f64_Chebyshev_coefficients_then_exact_chain-rule_partial_x=(1-rho)^2*partial_rho_and_partial_xx=(1-rho)^4*partial_rhorho-2*(1-rho)^3*partial_rho",
    originOverlap:
      "both_origin_and_nonorigin_evaluators_cover_the_closed_x=2^-8_face_and_their_value_and_first-derivative_intersections_must_be_nonempty",
    normalizedSchrodinger:
      "abs(R_S)/(1+abs(u_xx/2)+abs(u_x/x)+abs(V*u)+abs(nu0*u))<=1e-10",
    normalizedPoisson: "abs(R_P)/(1+abs(V_xx)+abs(2*V_x/x)+u^2)<=1e-10",
    signs: ["u_lower>0", "(-u_x)_lower>0", "V_upper<0"],
    budgets:
      "five_separate_duties_each_initial_[2^-8,32]_depth_at_most_56_and_at_most_262144_popped_boxes",
  },
  exteriorCovers: {
    radialDomain: "y_in_[0,1]_equivalent_to_x_in_[32,infinity]",
    openEndpointCandidates: "delta_j=2^(-80+j)_for_j=0..60_in_increasing_order",
    endpointSlabSelection:
      "select_the_first_delta_for_which_all_flat-fiber_gamma-orders_residual_decrease_and_V-over-y_envelopes_are_strict;_evaluate_and_record_all_61_candidates",
    endpointPredicates: [
      "H_lower>0_on_[0,delta]",
      "decreaseExpression=a*H+y^2*H_y-sigma*y*H_has_strict_positive_lower_bound",
      "V_over_y=-C/R+G1*Q_has_strict_negative_upper_bound",
      "the_full_scaled_S_and_P_absolute_upper_bounds_are_at_most_1e-10",
    ],
    closedRemainderInitialBox: "[deltaSelected,1]",
    closedRemainderPredicates: [
      "H_lower>0",
      "a*H+y^2*H_y-sigma*y*H_strictly_positive",
      "V=-C*y/R+E*Q_strictly_negative",
      "abs(S)<=1e-10_and_abs(P)<=1e-10_without_an_additive_floor",
    ],
    infinitySemantics:
      "u_and_V_equal_positive_zero_at_y=0;_strict_V_negativity_is_only_for_finite_x_or_equivalently_y>0_and_is_proved_through_V_over_y_on_the_open-endpoint_slab",
    join: "at_y=1_record_exact_C1_lift_equalities_and_intersect_left_core_and_right_exterior_one-sided_S_P_limit_enclosures;_max_absolute_value-and-derivative_jump_must_be_at_most_1e-12",
    budgets:
      "each_of_the_five_tail_cover_duties_uses_at_most_262144_popped_boxes_depth_at_most_56_after_the_61_exact_endpoint-candidate_records",
  },
  integralsAndIdentities: {
    integrator:
      "the_same_order_9_midpoint_Taylor_plus_order_10_remainder_exact-dyadic_cover_engine_without_oscillatory_cos_factor",
    coreInitialBox: "x_in_[0,32]",
    tailInitialBox: "y_in_[0,1]",
    maximumDepth: 56,
    maximumPoppedBoxesPerIntegral: 196000,
    integralOrder: [
      "N_core",
      "N_tail",
      "T_core",
      "T_tail",
      "W_core",
      "W_tail",
      "potentialGradient_core",
      "potentialGradient_tail",
    ],
    definitions: {
      N: "4*pi*(integral_core x^2*u^2 dx+integral_tail R^3*E*H^2*y^-4 dy)",
      T: "2*pi*integral_0^infinity x^2*u_x^2 dx",
      W: "2*pi*integral_0^infinity x^2*V*u^2 dx",
      potentialGradient: "4*pi*integral_0^infinity x^2*V_x^2 dx",
      gaussFlux: "4*pi*C",
    },
    massCoulomb:
      "require_zero_in_C-N/(4*pi)_and_relative_width_or_absolute_defect_normalized_by_max(C,N/(4*pi),2^-256)_at_most_1e-9",
    identityResiduals: {
      virial: "abs(2*T+W)/(2*T+abs(W))<=1e-9",
      eigenvalue: "abs(nu0*N-T-2*W)/(abs(nu0)*N+T+2*abs(W))<=1e-9",
      poissonEnergy:
        "abs(potentialGradient+2*W)/(potentialGradient+2*abs(W))<=1e-9",
      gaussFlux: "abs(gaussFlux-N)/N<=1e-9_with_N_lower>0",
    },
    dependency:
      "the_same_joint_alpha_beta_gamma_ball_is_used_for_every_integral_and_shared_subexpressions_are_not_independently_reboxed",
  },
  scalingAndBvpPropagation: {
    lambda: "exact_2^-5",
    maps: [
      "uStar(x)=lambda^2*u(lambda*x)",
      "VStar(x)=lambda^2*V(lambda*x)",
      "nuStar=lambda^2*nu0",
      "CStar=lambda*C",
      "kappaStar=lambda*kappa",
      "sigmaStar=sigma",
      "baseJoinX=32_and_targetJoinX=1024",
    ],
    frequency:
      "wSeed=sqrt(1+2*nuStar)_requires_the_whole_radicand_interval_strictly_between_zero_and_one",
    maximum:
      "after_global_u_positive_and_strictly_decreasing_are_proved_propagate_max_(x>=0)|uStar|=uStar(0)=2^-10_and_require_absolute_error_at_most_2^-30",
    scalingDefects:
      "directed_relative_Linf_scalar_and_potential_defects_on_the_exact_core_cover_tail_endpoint_slab_and_tail_closed_cover_each_at_most_1e-12",
    bvpMap: [
      "varphiInit=uStar",
      "F0Init=VStar",
      "F1Init=-VStar",
      "wInit=wSeed",
    ],
    bvpBinding:
      "emit_only_the_analytic_composite_evaluator_and_interval-ball_binding;_no_relativistic_grid_value_is_created_by_this_proof",
    branchMustResolveFrequencyAndAllFieldsAgain: true,
    establishesBranchAuthority: false,
  },
  dutyRegistry: {
    exactDutyCount: 16,
    dutyOrder: DUTY_ORDER,
    firstFailurePrecedence: DUTY_ORDER,
    dutyDefinitions: [
      Object.freeze({
        ordinal: 0,
        id: "origin_recurrence_and_remainder",
        domain: "x_closed_[0,2^-8]",
        recordKind: "origin_coefficient_or_radius",
        route: "proof/origin.jsonl",
        count: "exactly_34_coefficient_records_plus_exactly_61_radius_records",
      }),
      Object.freeze({
        ordinal: 1,
        id: "core_normalized_schrodinger",
        domain: "x_closed_[2^-8,32]",
        recordKind: "interval_cover",
        route: "proof/core-intervals.jsonl",
        count: "one_per_popped_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 2,
        id: "core_normalized_poisson",
        domain: "x_closed_[2^-8,32]",
        recordKind: "interval_cover",
        route: "proof/core-intervals.jsonl",
        count: "one_per_popped_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 3,
        id: "core_scalar_strict_positivity",
        domain: "x_closed_[2^-8,32]",
        recordKind: "interval_cover",
        route: "proof/core-intervals.jsonl",
        count: "one_per_popped_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 4,
        id: "core_scalar_strict_decrease",
        domain: "x_closed_[2^-8,32]",
        recordKind: "interval_cover",
        route: "proof/core-intervals.jsonl",
        count: "one_per_popped_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 5,
        id: "core_potential_strict_negativity",
        domain: "x_closed_[2^-8,32]",
        recordKind: "interval_cover",
        route: "proof/core-intervals.jsonl",
        count: "one_per_popped_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 6,
        id: "exterior_projected_radii_polynomial",
        domain: "r_exact_list_2^-80_through_2^-20",
        recordKind: "radii_polynomial",
        route: "proof/tail-intervals.jsonl",
        count: "exactly_61",
      }),
      Object.freeze({
        ordinal: 7,
        id: "exterior_full_scaled_schrodinger",
        domain: "y_closed_[0,1]",
        recordKind: "endpoint_candidate_or_interval_cover",
        route: "proof/tail-intervals.jsonl",
        count:
          "exactly_61_endpoint-candidate_records_plus_one_per_popped_closed-cover_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 8,
        id: "exterior_full_scaled_poisson",
        domain: "y_closed_[0,1]",
        recordKind: "endpoint_candidate_or_interval_cover",
        route: "proof/tail-intervals.jsonl",
        count:
          "exactly_61_endpoint-candidate_records_plus_one_per_popped_closed-cover_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 9,
        id: "exterior_H_strict_positivity",
        domain: "y_closed_[0,1]",
        recordKind: "endpoint_candidate_or_interval_cover",
        route: "proof/tail-intervals.jsonl",
        count:
          "exactly_61_endpoint-candidate_records_plus_one_per_popped_closed-cover_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 10,
        id: "exterior_scalar_strict_decrease",
        domain: "y_closed_[0,1]",
        recordKind: "endpoint_candidate_or_interval_cover",
        route: "proof/tail-intervals.jsonl",
        count:
          "exactly_61_endpoint-candidate_records_plus_one_per_popped_closed-cover_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 11,
        id: "exterior_potential_open_endpoint_negativity",
        domain: "y_half-open_(0,1]_with_V(0)=0",
        recordKind: "endpoint_candidate_or_interval_cover",
        route: "proof/tail-intervals.jsonl",
        count:
          "exactly_61_endpoint-candidate_records_plus_one_per_popped_closed-cover_box_maximum_262144",
      }),
      Object.freeze({
        ordinal: 12,
        id: "C1_join_and_one_sided_limits",
        domain: "single_join_face_x=32_y=1",
        recordKind: "join",
        route: "proof/tail-intervals.jsonl",
        count: "exactly_1",
      }),
      Object.freeze({
        ordinal: 13,
        id: "mass_and_coulomb_consistency",
        domain: "core_x_[0,32]_plus_tail_y_[0,1]",
        recordKind: "integral_bundle",
        route: "proof/integrals.jsonl",
        count:
          "exactly_1_summary_plus_one_per_popped_box_for_N_core_and_N_tail_each_with_maximum_196000",
      }),
      Object.freeze({
        ordinal: 14,
        id: "global_integral_identities",
        domain: "core_x_[0,32]_plus_tail_y_[0,1]",
        recordKind: "integral_bundle",
        route: "proof/integrals.jsonl",
        count:
          "exactly_1_summary_plus_one_per_popped_box_for_T_core_T_tail_W_core_W_tail_potentialGradient_core_potentialGradient_tail_each_with_maximum_196000",
      }),
      Object.freeze({
        ordinal: 15,
        id: "target_scaling_maximum_and_bvp_map",
        domain: "whole_scaled_composite",
        recordKind: "scaling_and_bvp",
        route: "proof/scaling-and-bvp-init.jsonl",
        count: "exactly_1",
      }),
    ],
  },
  receiptSchemas: {
    endpoint:
      "exact_object_{sign:minus|plus|zero,mantissaLowercaseHex:string,exponent2:safe_integer,precisionBits:256,direction:RNDD|RNDU}_with_zero_only_{zero,0,0,256,direction}",
    interval: "exact_two-element_tuple_[lowerRNDD,upperRNDU]",
    commonExactKeys: [
      "schemaVersion",
      "candidateId",
      "semanticSeedBinding",
      "operationPrepolicyBinding",
      "directedProofPolicyBinding",
      "dutyOrdinal",
      "dutyId",
      "recordOrdinal",
      "recordKind",
      "domainBox",
      "depth",
      "parentRecordOrdinal",
      "decision",
      "payload",
      "payloadSha256",
    ],
    decisions: [
      "accept",
      "split",
      "reject",
      "invalid_radius",
      "selected_radius",
      "valid_not_selected",
      "budget_exhausted",
    ],
    dutySpecificPayloadExactKeys: {
      origin_coefficient_or_radius: [
        "coefficientId",
        "coefficientInterval",
        "recurrenceTermIntervals",
        "radiusExact",
        "YUpper",
        "Z0Upper",
        "Z1Upper",
        "ZAtRadiusUpper",
        "pUpper",
      ],
      interval_cover: [
        "coordinateOrder",
        "expressionId",
        "termIntervals",
        "normalizationInterval",
        "quantityInterval",
        "predicate",
        "predicateSatisfied",
      ],
      endpoint_candidate_or_interval_cover: [
        "deltaExact",
        "fiberGammaOrder",
        "flatEnvelopeIntervals",
        "quantityInterval",
        "predicate",
        "predicateSatisfied",
      ],
      radii_polynomial: [
        "radiusExact",
        "YUpper",
        "Z0Upper",
        "Z1Upper",
        "ZAtRadiusUpper",
        "pUpper",
        "resonanceMargins",
        "inverseDefectUpper",
        "projectionTailUpper",
        "strictlyValid",
        "selected",
      ],
      join: [
        "U",
        "U1",
        "V",
        "V1",
        "H1",
        "Hy1",
        "Q1",
        "Qy1",
        "valueDerivativeJumps",
        "leftPdeLimits",
        "rightPdeLimits",
      ],
      integral_bundle: [
        "integralId",
        "coreInterval",
        "tailInterval",
        "combinedInterval",
        "normalizationInterval",
        "residualInterval",
        "predicateSatisfied",
      ],
      scaling_and_bvp: [
        "lambda",
        "nuStar",
        "CStar",
        "kappaStar",
        "sigmaStar",
        "wSeed",
        "targetAmplitude",
        "scalarScalingDefect",
        "potentialScalingDefect",
        "continuousMaximum",
        "analyticBvpMapBinding",
      ],
    },
    recordCanonicalization:
      "RFC8785_UTF8_canonical_JSON_without_BOM_duplicate_keys_nonfinite_numbers_or_negative_zero",
    recordHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/record/v1\n",
    recordHash:
      "SHA256(literal_domain_utf8||u16le(dutyOrdinal)||u64le(canonical_record_without_payloadSha256_byte_length)||canonical_record_without_payloadSha256_bytes)",
    routeStreamHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/route-stream/v1\n",
    routeStreamHash:
      "SHA256(literal_domain_utf8||u64le(recordCount)||for_each_record_in_file_order(u64le(recordLineByteLength)||recordLineBytes_without_LF))",
    fileEncoding:
      "one_canonical_record_per_UTF8_line_with_single_LF_no_CR_no_blank_lines",
    fileOrder:
      "dutyOrdinal_increasing_then_recordOrdinal_increasing_with_duties_sharing_a_route_concatenated",
    maximumRecordBytes: 65536,
    maximumTotalRecords: 4194304,
    derivedMaximumTotalRecords:
      "95_origin_plus_5*262144_core_plus_61_radii_plus_5*(61+262144)_tail_plus_1_join_plus_2_summaries_plus_8*196000_integral_boxes_plus_1_scaling_equals_4189905",
    derivedMaximumTotalRecordCount: 4189905,
    summaryPath: "proof/directed-proof-summary.json",
    summaryExactKeys: [
      "schemaVersion",
      "candidateId",
      "inputBinding",
      "policyBinding",
      "implementationBinding",
      "runtimeBinding",
      "dutyCounts",
      "routeStreamBindings",
      "firstFailureOrAllPassed",
      "authorityFalse",
    ],
    summaryAuthorityFalse: true,
    conclusionSemantics: {
      permittedAllPassedTag:
        "all_directed_duties_passed_without_seed_or_solution_authority",
      forbiddenTags: [
        "exterior_solution_exists",
        "exact_exterior_root",
        "exact_global_SP_root",
        "seed_accepted",
        "candidate_accepted",
        "physical_viability",
      ],
      projectedContractionDecision:
        "selected_radius_means_only_a_fixed_point_of_T_equals_I-minus-AF_in_the_projected_X_ball",
      promotionForbidden:
        "neither_selected_radius_nor_all_directed_duties_passed_may_set_any_authority_lock_seed_acceptance_lamp_or_physical_claim",
    },
  },
  primaryToVerifierAbi: {
    status:
      "closed_mathematical_interchange_overlay_but_incomplete_execution_ABI_until_a_separate_final_primary_numerics_policy_is_exact-bound",
    primaryNumericsPolicyBinding: null,
    primaryNumericsPolicyRequiredBeforeAbiCompletion: true,
    direction:
      "untrusted_primary_seed_output_to_distinct_directed-proof_verifier_read-only_input",
    descriptorPath: "descriptor.json",
    acceptedInputPayloadsInOrder: [
      "scalars.f64le",
      "coefficients/core_L2_u.f64le",
      "coefficients/core_L2_V.f64le",
      "coefficients/tail_H.f64le",
      "coefficients/tail_Q.f64le",
    ],
    exactPayloadShapes: [
      "scalars.f64le:9_f64le_in_prepolicy_scalarRoleOrder_exactly_72_bytes",
      "coefficients/core_L2_u.f64le:128_f64le_exactly_1024_bytes",
      "coefficients/core_L2_V.f64le:128_f64le_exactly_1024_bytes",
      "coefficients/tail_H.f64le:32_f64le_exactly_256_bytes",
      "coefficients/tail_Q.f64le:32_f64le_exactly_256_bytes",
    ],
    descriptorRequiredBindings: [
      "candidateId",
      "semanticSeedBinding",
      "operationPolicyBinding",
      "primaryNumericsPolicyBinding",
      "commit40",
      "dirtyTreeDigest",
      "primarySourceManifestBinding",
      "primaryToolchainManifestBinding",
      "primaryExecutableBinding",
      "primaryRuntimeBinding",
      "preexecutionPresealBinding",
      "commandArgv",
      "wallStartUtc",
      "wallEndUtc",
      "monotonicElapsedNanoseconds",
      "orderedPayloadPathSizeHashBindings",
    ],
    verifierAdmissionOrder: [
      "lstat_descriptor_and_each_payload_without_following_links",
      "enforce_regular_file_owner_mode_size_and_exact_inventory",
      "hash_raw_bytes_and_compare_descriptor_bindings",
      "parse_descriptor_with_closed_exact-key_schema",
      "compare_semantic_seed_operation_prepolicy_candidate_commit_dirty-tree_preseal_source_toolchain_executable_runtime_and_command_bindings",
      "decode_each_f64le_from_fresh_exact-length_buffers_reject_nonfinite_and_negative-zero",
      "recompute_L2_join_values_derivatives_C_scale_kappa_sigma_and_every_proof_operand_from_bytes",
      "ignore_all_primary_pass_fail_proof_interval_and_metric_fields",
    ],
    derivedOperandsNeverAcceptedFromPrimary: [
      "U_U1_V_V1",
      "kappa_sigma_a_sC",
      "S_P_or_low-mode_coefficients",
      "Y_Z0_Z1_p_or_selected_radius",
      "origin_core_tail_sign_or_integral_intervals",
      "identity_or_scaling_verdicts",
    ],
    forbiddenRoleIdsAndKeysAtAnyDepth: [
      "declared_lever_tensor",
      "lever_tensor",
      "leverTensor",
      "lever_tensor_role",
      "declaredLeverTensor",
      "tile",
      "tiles",
      "tile_id",
      "tileId",
      "tile_role",
      "tileRole",
      "tile_weight",
      "tileWeight",
      "tile_gain",
      "tileGain",
      "tile_schedule",
      "tileSchedule",
    ],
    forbiddenRoleAdmission:
      "after_closed-schema_descriptor_parse_walk_every_key_and_every_string-valued_roleId_role_id_role_path_rolePath_path_and_name_in_UTF8_bytewise_depth-first_object-key-order_and_reject_an_exact_forbidden_token_before_opening_or_decoding_any_numeric_payload",
    inputBindingDomain:
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/input-binding/v1\n",
    inputBindingHash:
      "SHA256(literal_domain_utf8||descriptor_hash_bytes||for_each_payload_in_literal_order(u64le(pathByteLength)||pathUtf8||u64le(sizeBytes)||sha256Bytes))",
    freshness:
      "preopen_and_postread_lstat_fstat_device_inode_size_mtime_ctime_and_sha256_must_match_for_descriptor_and_every_payload",
    outputMayModifyPrimaryRoot: false,
  },
  implementationAndRuntimeBoundary: {
    requiredPrimaryImplementation:
      "future_hash-bound_C_or_Rust_MPFR-GMP_directed-proof_kernel_with_no_import_from_the_primary_binary64_solver",
    requiredIndependentImplementation:
      "future_distinct-language_distinct-source-tree_MPFR-GMP_or_Arb_kernel_recomputing_the_same_receipts_from_the_same_accepted_bytes_without_importing_or_invoking_the_primary_proof_kernel",
    primaryImplementation: null,
    independentImplementation: null,
    primaryRuntime: null,
    independentRuntime: null,
    executionCommand: null,
    executionReceipt: null,
    networkAllowed: false,
    processCountMaximum: 1,
    threadCountMaximum: 1,
    blasThreadCountMaximum: 1,
    currentWindowsHostExecutionAdmissible: false,
    maximumWallSeconds: 3600,
    maximumRssBytes: 1073741824,
    implementationComplete: false,
    runtimeClosureComplete: false,
    executionAuthorized: false,
    executionObserved: false,
  },
  attemptPolicy: {
    maximumCandidateAttempts: 1,
    retryAfterFailureAllowed: false,
    retuneGridJoinBasisCutoffPrecisionRadiusToleranceOrAlgorithmAllowed: false,
    unresolvedIntervalDisposition: "fail_candidate",
    budgetExhaustionDisposition: "fail_candidate",
    resonanceDisposition: "fail_candidate",
    failureOutput:
      "typed_authority-false_failure_receipt_only_without_candidate_numeric_output_promotion",
  },
  completionBoundary: {
    semanticSeedBound: true,
    operationPrepolicyBound: true,
    exactDirectedOperatorSemanticsComplete: false,
    exactNormAndBoundSemanticsComplete: false,
    exactReceiptSchemasComplete: false,
    exactPrimaryToVerifierAbiComplete: false,
    primaryNumericsPolicyBound: false,
    implementationComplete: false,
    runtimeClosureComplete: false,
    preexecutionPresealComplete: false,
    executionAuthorized: false,
    executionObserved: false,
    directedDutiesAccepted: false,
    seedAccepted: false,
  },
  blockers: BLOCKERS,
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1 =
  deepFreeze(POLICY);

const assertInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
      pins.semanticSeed.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
      pins.semanticSeed.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256 !==
      pins.operationPrepolicy.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES !==
      pins.operationPrepolicy.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1.candidateId !==
      POLICY.candidateId ||
    POLICY.dutyRegistry.exactDutyCount !== DUTY_ORDER.length ||
    POLICY.preconditioner.finiteCutoff !== 32 ||
    POLICY.preconditioner.auditCutoff !== 512 ||
    new Set(POLICY.receiptSchemas.commonExactKeys).size !==
      POLICY.receiptSchemas.commonExactKeys.length ||
    new Set(POLICY.originDirectedProof.requiredPredicates).size !==
      POLICY.originDirectedProof.requiredPredicates.length ||
    POLICY.receiptSchemas.derivedMaximumTotalRecordCount !== 4189905 ||
    POLICY.receiptSchemas.derivedMaximumTotalRecordCount >
      POLICY.receiptSchemas.maximumTotalRecords ||
    POLICY.completionBoundary.exactDirectedOperatorSemanticsComplete !==
      false ||
    POLICY.completionBoundary.exactNormAndBoundSemanticsComplete !== false ||
    POLICY.completionBoundary.exactReceiptSchemasComplete !== false ||
    POLICY.completionBoundary.exactPrimaryToVerifierAbiComplete !== false ||
    POLICY.primaryToVerifierAbi.primaryNumericsPolicyBinding !== null ||
    POLICY.completionBoundary.implementationComplete !== false ||
    POLICY.completionBoundary.executionAuthorized !== false ||
    Object.values(POLICY.authorityLocks).some((value) => value !== false) ||
    Object.values(POLICY.claimLocks).some((value) => value !== false) ||
    Object.values(POLICY.unresolved).some((value) => value !== null)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_newtonian_seed_directed_proof_v1_invariant_violation",
    );
  }
};

assertInvariants();

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
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VALIDATOR_LIMITS;
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1);
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-newtonian-seed-directed-proof/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_ARTIFACT_ID,
    policyVersion:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.candidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_SHA256 =
  "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  42778 as const;

if (
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_seed_directed_proof_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES}`,
  );
}

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1) {
    return [];
  }
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_seed_directed_proof_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["spherical_seed_directed_proof_external_copy_not_authoritative"]
      : ["spherical_seed_directed_proof_semantic_mismatch"];
  } catch {
    return ["spherical_seed_directed_proof_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarNewtonianSeedDirectedProofV1 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
