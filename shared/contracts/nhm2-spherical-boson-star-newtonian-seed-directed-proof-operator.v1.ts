import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_newtonian_seed_directed_proof_operator" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_VERSION =
  "nhm2_spherical_boson_star_newtonian_seed_directed_proof_operator/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS =
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
    directedProofArchitecture: Object.freeze({
      sha256:
        "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99",
      canonicalSizeBytes: 42778,
    }),
    primaryNumericsPolicyBinding: Object.freeze({
      sha256:
        "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
      canonicalSizeBytes: 80055,
    }),
  } as const);

const AUTHORITY_LOCKS = Object.freeze({
  operatorArchitectureOnly: false,
  implementationComplete: false,
  runtimeClosureComplete: false,
  preexecutionPresealPresent: false,
  executionAuthorized: false,
  executionObserved: false,
  proofReceiptPresent: false,
  projectedExteriorContractionAccepted: false,
  omittedRawModeDutiesAccepted: false,
  fullExteriorPdeAccepted: false,
  exactCoreRootAccepted: false,
  exactGlobalSchrodingerPoissonRootAccepted: false,
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

const BLOCKERS = Object.freeze([
  "primary_to_verifier_ABI_and_exact_receipt_schema_absent",
  "hash_bound_primary_and_independent_operator_implementations_absent",
  "toolchain_executable_runtime_and_preexecution_preseal_absent",
  "operator_not_implemented_or_executed",
  "operator_receipts_and_independent_agreement_absent",
  "newtonian_seed_not_accepted",
] as const);

const UNRESOLVED = Object.freeze({
  interchangePolicyBinding: null,
  primaryImplementationBinding: null,
  independentImplementationBinding: null,
  primaryRuntimeBinding: null,
  independentRuntimeBinding: null,
  preexecutionPresealBinding: null,
  inputInstanceBinding: null,
  primaryReceiptBinding: null,
  independentReceiptBinding: null,
  agreementReceiptBinding: null,
} as const);

const POLICY = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_ARTIFACT_ID,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.candidateId,
  maturity:
    "stage_2_exact_operator_and_norm_formula_overlay_with_primary_policy_bound_but_without_ABI_implementation_runtime_execution_or_authority",
  frozenBeforeCandidateExecution: true,
  bindings: {
    semanticSeed:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS.semanticSeed,
    operationPrepolicy:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS.operationPrepolicy,
    directedProofArchitecture:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS.directedProofArchitecture,
    primaryNumericsPolicyBinding:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS.primaryNumericsPolicyBinding,
  },
  scopeBoundary: {
    closesOnly: [
      "origin_nonlinear_operator_representative_inverse_Y_Z0_Z1_q_and_separate_derivative_envelope",
      "projection_initial_partition_split_evaluation_and_global_work_budget",
      "Z0_explicit_and_infinite_column_compiler",
      "Z1_nine_ordered_bilinear_block_compiler_with_shared_whole-X-ball_alpha_beta_gamma_sources",
      "all_named_projection_convolution_lift_conversion_preconditioner_and_origin_remainders",
      "signed_reciprocal_endpoint_graph",
    ],
    doesNotClose: [
      "primary_to_verifier_ABI",
      "receipt_schema_or_canonical_serialization",
      "source_toolchain_executable_runtime_preseal_or_execution",
    ],
    projectedOperator:
      "F=(S_C2[n+2],P_C2[n+4],mass)_and_T=I-AF_exactly_as_bound_by_the_architecture",
    projectedContractionImpliesFullRawPde: false,
    omittedRawModes: [
      "S_C2[0]",
      "S_C2[1]",
      "P_C2[0]",
      "P_C2[1]",
      "P_C2[2]",
      "P_C2[3]",
    ],
    omittedRawModesRequiredAsSeparateWholeBallDuties: true,
    omittedRawModesMayEnterProjectedNormOrRadiusDecision: false,
    selectedRadiusMeaning:
      "fixed_point_of_the_projected_T_map_only_until_all_six_raw_modes_and_full_raw_core_tail_global_identity_duties_pass_separately",
    anyUnresolvedOrExceededBoundDisposition: "fail_frozen_candidate",
    retryRetuneOrPrecisionEscalationAllowed: false,
    fullRawAndGlobalDutyBoundary: {
      dutiesAfterProjectedRadiusSelection: [
        "six_omitted_raw_coefficient_intervals",
        "full_scaled_S_pointwise_interval_cover_on_y_in_[0,1]",
        "full_scaled_P_pointwise_interval_cover_on_y_in_[0,1]",
        "C1_join_and_one_sided_limits",
        "mass_Coulomb_consistency",
        "virial_eigenvalue_Poisson_energy_and_Gauss_flux_interval_identities",
      ],
      commonBall:
        "all_duties_use_the_same_selected_alpha_beta_gamma_ball_without_independent_reboxing",
      exactPdeZeroConclusionAllowed: false,
      reason:
        "the_six_discarded_raw_modes_are_not_annihilated_by_the_projected_fixed-point_equation_and_the_pointwise_duties_are_frozen_diagnostic_residual_inequalities_not_an_injective_full-PDE_existence_proof",
    },
  },
  directedArithmeticClosure: {
    inheritsArchitectureArithmeticExactly: true,
    precisionBits: 256,
    reductionOrder:
      "literal_index_order_with_one_MPFR_RNDD_or_RNDU_round_after_every_named_primitive_and_no_FMA_reassociation_or_library_norm",
    signedReciprocalEndpointGraph: {
      admission:
        "for_closed_[a,b]_require_finite_a<=b_and_either_a>0_or_b<0;_reject_a<=0<=b_before_any_division",
      positiveBranch: [
        "lower=MPFR_div_RNDD(exact_positive_one,b)",
        "upper=MPFR_div_RNDU(exact_positive_one,a)",
      ],
      negativeBranch: [
        "lower=MPFR_div_RNDD(exact_positive_one,b)",
        "upper=MPFR_div_RNDU(exact_positive_one,a)",
      ],
      orderingReason:
        "x_to_1/x_is_strictly_decreasing_on_each_admitted_sign_component_so_b_maps_to_the_lower_endpoint_and_a_to_the_upper_endpoint_in_both_branches",
      postconditions: [
        "lower<=upper",
        "positive_input_produces_strictly_positive_output",
        "negative_input_produces_strictly_negative_output",
        "negative_zero_nonfinite_or_sign_crossing_is_typed_reciprocal_failure",
      ],
      divideGraph:
        "construct_the_reciprocal_once_by_this_graph_then_multiply_by_the_architecture_four-products_interval_multiply_without_recomputing_or_reordering_endpoints",
    },
  },
  originOperatorClosure: {
    domainEndpointExact: "d=2^-8",
    coefficientConvention:
      "u(x)=sum_n>=0 a_n*x^(2n)_and_V(x)=sum_n>=0 b_n*x^(2n)_where_a_n_denotes_architecture_a_(2n)_and_b_n_denotes_architecture_b_(2n)",
    representative: {
      finiteOrder: 16,
      aBar: "aBar[0]=exact_1;_bBar[0]=exact_primary_Vc_bits;_for_n=0..15_generate_aBar[n+1],bBar[n+1]_by_the_exact_recurrence;_all_n>=17_are_positive_zero",
      recurrenceLoop:
        "n_increasing;_Aconv=sum_k=0^n bBar[k]*aBar[n-k];_Bconv=sum_k=0^n aBar[k]*aBar[n-k];_subtract_nu0*aBar[n];_multiply_Aconv_difference_by_2;_last_divide_by_D_(n+1)",
    },
    tailSpace: {
      coordinateOrder: "a_17,b_17,a_18,b_18,...",
      weight: "wOrigin(n)=d^(2n)=2^(-16n)",
      norm: "normOrigin=sum_n>=17 wOrigin(n)*(abs(deltaA[n])+abs(deltaB[n]))",
      closedOverlapDerivativeControlFromThisNormAlone: false,
    },
    nonlinearResidual: {
      denominator: "D_m=2*m*(2*m+1)_for_m>=1",
      aComponent: "G_a[m]=a[m]-(2/D_m)*(sum_k=0^(m-1)b[k]*a[m-1-k]-nu0*a[m-1])",
      bComponent: "G_b[m]=b[m]-(1/D_m)*sum_k=0^(m-1)a[k]*a[m-1-k]",
      tailOperator:
        "Gtail(a,b)=(G_a[m],G_b[m])_m>=17_with_a[0..16],b[0..16]_fixed_to_the_representative_and_tail_coordinates_free",
      evaluationOrder:
        "m_increasing;_within_each_component_k_increasing;_multiply_then_add;_nu_term_after_convolution;_scalar_multiply_then_denominator_division;_subtract_from_coordinate_last",
      representativeDefectFiniteSupport:
        "Gtail(aBar,bBar)_m_is_exact_positive_zero_for_m>=34;_evaluate_m=17..33_only",
    },
    representativeAndInverse: {
      xbarTail: "all_tail_coordinates_m>=17_are_exact_positive_zero",
      inverseAOrigin: "identity_map_on_the_origin_tail_residual_coordinates",
      reason:
        "DGtail_at_the_zero_tail_is_lower_triangular_with_unit_diagonal_because_every_recurrence_source_for_index_m_uses_indices_at_most_m-1",
      noFiniteMatrixOrNumericalInverse: true,
      fixedPointSemantics:
        "TOrigin=z-Gtail(z)_because_AOrigin_is_the_identity;_therefore_a_fixed_point_implies_Gtail=exact_zero_coordinatewise_unlike_the_noninjective_exterior_preconditioner",
    },
    exactConvolutionNormLemma: {
      statement:
        "for_causal_convolution_(p*q)[n]=sum_k=0^n p[k]q[n-k]_and_w(n)=d^(2n),_norm_w(p*q)<=norm_w(p)*norm_w(q)",
      proofOperation:
        "w(n)=w(k)*w(n-k);_apply_triangle_inequality_then_Tonelli_to_the_nonnegative_double_sum_in_shell_n_then_k_order",
      finiteRepresentativeWeightedL1:
        "Abar=sum_n=0^16 w(n)*abs(aBar[n]);_Bbar=sum_n=0^16 w(n)*abs(bBar[n])",
      inverseDenominatorUpper:
        "invD17Upper=RNDU(1/(2*17*35))=RNDU(1/1190)_and_D_m_is_strictly_increasing_for_m>=17",
    },
    radiiBounds: {
      YUpper:
        "sum_m=17^33 w(m)*(absUpper(G_aBar[m])+absUpper(G_bBar[m]))_in_m_then_a_b_order",
      Z0Upper: "RNDU(invD17Upper*RNDU(2*RNDU(Abar+Bbar+abs(nu0))))",
      Z1Upper:
        "RNDU(invD17Upper*6)_because_the_second_derivative_has_two_ba_orderings_in_Ga_and_two_aa_orderings_in_Gb_with_Ga_prefactor_2",
      ZAtRadius: "RNDU(Z0Upper+RNDU(Z1Upper*r))",
      pUpper: "RNDU(RNDU(YUpper+RNDU(ZAtRadius*r))-r)",
      candidates: "r_j=2^(-80+j)_for_j=0..60_all_evaluated",
      acceptance:
        "pUpper<0_and_ZAtRadius<1_and_the_separate_geometric_envelope_duty_passes",
    },
    separateGeometricEnvelopeDuty: {
      isConsequenceOfOriginL1Contraction: false,
      reason:
        "the_weighted_l1_contraction_norm_does_not_bound_first_or_second_derivatives_on_the_closed_face_x=d_because_the_factors_n_and_n*(2n-1)_are_unbounded",
      fixedEnvelope: {
        qExact: "2^-12",
        MExact: "2^8",
        statement:
          "for_every_n>=17_require_d^(2n)*(abs(a[n]-aBar[n])+abs(b[n]-bBar[n]))<=M*q^n",
      },
      baseRange:
        "verify_n=17..34_directly_from_the_joint_interval_ball_and_the_recurrence_graph;_aBar_and_bBar_are_zero_for_n>=17",
      propagationForEveryNAtLeast34:
        "define_Aq=sum_k=0^16 abs(aBar[k])*(d^2/q)^k_and_Bq=sum_k=0^16 abs(bBar[k])*(d^2/q)^k_in_k_order_and_Nu=abs(nu0);_for_n>=34_the_scaled_recurrence_sum_T[n+1]=d^(2n+2)*(abs(a[n+1])+abs(b[n+1]))_is_at_most_d^2*q^n/(2*(n+1)*(2*n+3))*{M*(4*Aq+2*Bq+2*Nu)+3*(n-33)*M^2};_this_follows_by_splitting_each_convolution_into_low-high_high-low_and_the_exact_n-33_high-high_pairs",
      fixedUniformPropagationInequality:
        "let_C=M*(4*Aq+2*Bq+2*Nu);_require_RNDU((d^2/(M*q))*(RNDU(C/4970)+RNDU((3*M^2)/548)))<=1;_4970=2*35*71_is_D_35_and_sup_integer_n>=34((n-33)/(2*(n+1)*(2*n+3)))=1/548_at_unique_n=67",
      discreteSupremumProof:
        "the_forward_difference_numerator_for_f(n)=(n-33)/(2*(n+1)*(2n+3))_is_-4*n^2+260*n+468;_it_is_strictly_positive_for_34<=n<=66_and_strictly_negative_for_n>=67_by_integer_Horner_after_the_two_endpoint_checks_so_f_has_unique_integer_maximizer_67;_the_C_over_D_term_is_bounded_separately_by_C/D_35",
      propagationFailure:
        "if_the_fixed_M_q_induction_base_or_symbolic_decrease_check_fails_then_fail_the_candidate_without_increasing_M_or_q",
      tailsAtClosedOverlap: {
        value: "sum_n>=17 M*q^n=M*q^17/(1-q)",
        firstDerivative:
          "d^-1*sum_n>=17 2*n*M*q^n=d^-1*2*M*q^17*(17-16*q)/(1-q)^2",
        secondDerivative:
          "d^-2*sum_n>=17 2*n*(2*n-1)*M*q^n=d^-2*2*M*q^17*(561-1053*q+496*q^2)/(1-q)^3",
        operationOrder:
          "construct_integer_and_dyadic_terms_left_to_right;_integer_power_by_binary_exponentiation;_signed_reciprocal_by_the_frozen_graph;_multiply_numerator_factors_in_written_order;_divide_last",
      },
      requiredUses: [
        "origin_to_core_value_overlap",
        "origin_to_core_first_derivative_overlap",
        "origin_regular_second_derivative_residual_enclosures",
      ],
      convergenceConclusion:
        "the_fixed_q<1_value_d1_d2_majorants_give_uniform_absolute_convergence_of_the_series_and_its_first_two_x_derivatives_on_[0,d];_coordinatewise_Gtail=0_then_implies_the_two_regular_radial_equations_on_[0,d]_only",
    },
  },
  projectionClosure: {
    projectedFibersInOrder: [
      "B_gamma_0",
      "B_gamma_1",
      "B_gamma_2",
      "E_gamma_0",
      "E_gamma_1",
      "E_gamma_2",
      "G1_gamma_0",
      "G1_gamma_1",
      "G1_gamma_2",
      "G2_gamma_0",
      "G2_gamma_1",
      "G2_gamma_2",
    ],
    modesPerFiber: 513,
    modeOrder: "fiber_order_then_n_increasing_0_through_512",
    initialPartition: {
      cellCount: 8,
      cells:
        "I_j=[j/8,(j+1)/8]_for_j=0..7_in_increasing_j_order_with_exact_dyadic_endpoints",
      stackInitialization: "push_I_7_through_I_0_so_I_0_is_popped_first",
    },
    splitRule: {
      midpoint: "exact_dyadic_(lower+upper)/2",
      childOrder: "push_upper_then_lower_so_the_lower_child_is_processed_first",
      maximumAdditionalSplitDepthFromInitialCell: 9,
      minimumCellWidthExact: "2^-12",
    },
    cellProgram:
      "order_9_midpoint_Taylor_integral_plus_order_10_remainder_exactly_as_the_architecture;_length_11_jet_coefficients_are_ordinary_derivative_over_factorial_coefficients",
    acceptance:
      "accept_cell_only_if_its_complete_directed_order_10_remainder_width<=2^-220;_otherwise_split_if_depth_less_than_9_else_fail_projection_budget",
    exactBudgets: {
      maximumPoppedCellsPerProjection: 8184,
      derivation:
        "eight_binary_trees_each_with_depth_9_below_its_initial_root_have_at_most_8*(2^10-1)=8184_popped_cells",
      maximumAcceptedLeavesPerProjection: 4096,
      maximumTaylorJetBuildsPerPoppedCell: 1,
      maximumJetCoefficientWorkUnitsPerPoppedCell: 11,
      maximumJetCoefficientWorkUnitsPerProjection: 90024,
      exactProjectionCount: 6156,
      projectionCountDerivation: "12_fibers*513_modes",
      maximumGlobalPoppedCells: 50380704,
      maximumGlobalTaylorJetBuilds: 50380704,
      maximumGlobalJetCoefficientWorkUnits: 554187744,
      endpointFlatnessDerivativeChecksPerFiber: 10,
      endpointFlatnessOrders: "odd_orders_1_3_5_7_9_at_each_of_two_endpoints",
      maximumGlobalEndpointFlatnessChecks: 120,
      maximumGlobalScalarEvaluationWorkUnits: 554187864,
    },
    workCounter:
      "increment_projection_count_before_each_mode;_increment_popped_and_TaylorJetBuilds_once_before_each_cell_evaluation;_increment_jetCoefficientWorkUnits_once_after_each_of_coefficients_0..10_is_built;_increment_endpoint_check_once_per_fiber_then_endpoint_0_1_then_odd_derivative_order_1_3_5_7_9;_fail_before_an_increment_that_would_exceed_any_local_or_global_budget",
    noMemoizationAcrossFiberGammaOrderOrMode: true,
    continueAfterProjectionFailure: false,
    failureDisposition:
      "first_failure_in_fiber_then_mode_then_cell_pop_order_fails_the_candidate_without_partition_depth_order_or_precision_change",
  },
  exteriorOperatorClosure: {
    coordinateFamilies: ["alpha", "beta", "gamma"],
    coordinateOrder: "alpha_0_alpha_1_..._beta_0_beta_1_..._gamma",
    rawResidualsAndProjection:
      "evaluate_architecture_S_and_P_raw_C2_sequences_then_define_F_s[n]=S[n+2],F_p[n]=P[n+4],F_m=m",
    projectedAndRawDutySeparation: {
      contractionCoordinates: "S[2..infinity],P[4..infinity],m",
      independentRawCoordinates: "S[0],S[1],P[0],P[1],P[2],P[3]",
      rawDutyDomain:
        "the_same_selected_joint_alpha_beta_gamma_ball_re-evaluated_without_projection_or_preconditioning",
      rawDutyAcceptance:
        "the_whole_outward_interval_for_each_of_the_six_coordinates_must_contain_zero_and_have_absolute_upper_at_most_1e-10",
      rawDutyFailureDoesNotInvalidateContractionTheoremButFailsCandidate: true,
    },
    exactFirstDerivativeColumns: {
      definition:
        "for_each_input_coordinate_e_j_build_DF(xbar)e_j_by_the_literal_first_order_jet_of_the_architecture_linear_maps_convolution_fibers_and_mass_integral",
      finiteInputColumns: "alpha_0..alpha_512_then_beta_0..beta_512_then_gamma",
      outputOrder:
        "s_0..s_512_then_p_0..p_512_then_mass_then_each_analytic_output_tail",
      highInputColumns:
        "for_each_family_alpha_or_beta_and_n>=513_compile_the_exact_finitely_many_polynomial_bands_plus_the_convolution_projection_tail_majorants_below",
      directionalFormulas: [
        "DS_poly[r]=-(1/2)*(y^2*H_r_yy+2*(a-sigma*y)*H_r_y-2*sigma_r*y*H_y+cS*H_r+cS_r*H)",
        "DS_nonlinear[r]=R^2*S02(G2_r*Q*H+G2*Q_r*H+G2*Q*H_r)",
        "DP_poly[r]=y^4*Q_r_yy+4*y^2*((a-sigma*y)*Q_r_y-sigma_r*y*Q_y)+cP*Q_r+cP_r*Q",
        "DP_source[r]=-R^2*S02(H_r*H+H*H_r)",
        "Dm[r]=(C_r-R^3*integral((E_r*H^2+2*E*H*H_r)*y^-4))/sC_with_C_gamma=sC_and_other_C_r_zero",
      ],
      formulaOrder:
        "define_sigma_r_cS_cS_r_cP_cP_r_then_build_S_polynomial_S_nonlinear_P_polynomial_P_source_mass_in_that_order_without_combining_symmetric_products",
    },
    exactSecondDerivativeBlocks: {
      orderedBlockOrder: [
        "alpha_alpha",
        "alpha_beta",
        "alpha_gamma",
        "beta_alpha",
        "beta_beta",
        "beta_gamma",
        "gamma_alpha",
        "gamma_beta",
        "gamma_gamma",
      ],
      fieldDerivatives: {
        Halpha: "H_alpha_j=(1-y)^2*T_j;_all_H_beta_j=0",
        Qbeta: "Q_beta_j=(1-y)^2*T_j;_all_Q_alpha_j=0",
        Hgamma: "H_gamma=Hy1_gamma*(y-1);_H_gammagamma=positive_zero",
        Qgamma:
          "Q_gamma=Q1_gamma+Qy1_gamma*(y-1);_Q_gammagamma=Qy1_gammagamma*(y-1)",
      },
      schrodingerNonlinearSecondDerivative:
        "D2(G2*Q*H)[r,s]=G2_rs*Q*H+G2_r*(Q_s*H+Q*H_s)+G2_s*(Q_r*H+Q*H_r)+G2*(Q_rs*H+Q_r*H_s+Q_s*H_r+Q*H_rs)_in_exact_written_order_then_R^2*S02",
      poissonSourceSecondDerivative:
        "D2(H*H)[r,s]=H_rs*H+H_r*H_s+H_s*H_r+H*H_rs_in_written_order_then_minus_R^2*S02",
      polynomialGammaTerms:
        "differentiate_every_occurrence_of_sigma_in_the_written_S_and_P_polynomial_coefficients_by_sigma_gamma=sC/kappa_and_sigma_gammagamma=0;_differentiate_H_Q_and_their_D02_D202_images_by_the_listed_field_derivatives;_no_symbolic_simplification_or_term_combination",
      directionalSymbols:
        "for_direction_r_define_sigma_r=sC/kappa_if_r=gamma_else_positive_zero_and_sigma_rs=positive_zero_for_every_ordered_pair;_cS=sigma*(sigma+1),_cS_r=(2*sigma+1)*sigma_r,_cS_rs=2*sigma_r*sigma_s;_cP=4*a^2-4*a*(2*sigma+1)*y+2*sigma*(2*sigma+1)*y^2,_cP_r=(-8*a*y+(8*sigma+2)*y^2)*sigma_r,_cP_rs=8*y^2*sigma_r*sigma_s",
      schrodingerPolynomialSecondDerivative:
        "D2S_poly[r,s]=-(1/2)*(y^2*H_rs_yy+2*(a-sigma*y)*H_rs_y-2*sigma_r*y*H_s_y-2*sigma_s*y*H_r_y+cS*H_rs+cS_r*H_s+cS_s*H_r+cS_rs*H)_with_terms_in_written_order",
      poissonPolynomialSecondDerivative:
        "D2P_poly[r,s]=y^4*Q_rs_yy+4*y^2*((a-sigma*y)*Q_rs_y-sigma_r*y*Q_s_y-sigma_s*y*Q_r_y)+cP*Q_rs+cP_r*Q_s+cP_s*Q_r+cP_rs*Q_with_terms_in_written_order",
      massSecondDerivative:
        "differentiate_m=(C-Icore-Itail)/sC_with_C_affine_and_fixed_sC;_Icore_has_zero_tail_coordinate_derivatives;_differentiate_Itail=R^3*integral(E*H^2*y^-4)_using_the_same_ordered_product_formula_as_S_and_literal_projection_integrator_without_oscillatory_factor;_all_beta_rows_are_exact_positive_zero",
      wholeXBallOperandRule:
        "for_every_one_of_the_nine_ordered_blocks_route_each_undifferentiated_H_or_Q_operand_through_weightedMajorantCompiler.normalizedBasisColumnPrimitives.wholeXBallSequenceSource_at_rhoX=2^-20;_directional_H_r_Q_r_H_rs_Q_rs_operands_remain_the_exact_normalized_unit_lift_or_gamma_derivative_columns;_a_block_that_is_symbolically_zero_must_still_be_derived_from_these_dependency_rules_before_emitting_exact_positive_zero",
      symmetryUseForbidden:
        "compute_all_nine_ordered_blocks;_do_not_copy_transposes_or_average_mixed_blocks",
    },
  },
  weightedMajorantCompiler: {
    spaces: {
      XWeight: "wX(n)=(n+1)^8",
      YWeight: "wY(n)=(n+1)^7",
      cutoffFinite: 32,
      cutoffAudit: 512,
      tailStart: 513,
    },
    exactWeightedColumnNorm: {
      linear: "Col_XtoY(L,j)=sum_i>=0 wY(i)*absUpper(L_ij)/wX(j)",
      preconditioned: "Col_XtoX(K,j)=sum_i>=0 wX(i)*absUpper(K_ij)/wX(j)",
      bilinear:
        "Col2_XxXtoY(B,j,k)=sum_i>=0 wY(i)*absUpper(B_i,j,k)/(wX(j)*wX(k))",
      reduction:
        "output_i_increasing;_finite_sum_first;_named_analytic_tail_second;_divide_by_input_weights_last",
    },
    normalizedBasisColumnPrimitives: {
      unit: "E_n[m]=1_if_m=n_else_positive_zero_and_the_normalized_input_column_is_E_n/wX(n)",
      ChebyshevProductOfUnits:
        "Prod(E_j,E_k)[m]=(indicator_(m=j+k)+indicator_(m=abs(j-k)))/2_with_both_indicators_added_when_j=k=0_or_one_index_is_zero_exactly_as_the_architecture_double-indicator_formula",
      fixedMultiplierColumn:
        "for_a_fixed_Chebyshev_sequence_c,_Prod(c,E_n)[m]=(1/2)*sum_k>=0 c[k]*(indicator_(m=k+n)+indicator_(m=abs(k-n)))_with_k_increasing_and_the_two_indicator_contributions_added_in_written_order",
      liftedColumn:
        "Lift_n=Prod([3/8,-1/2,1/8],E_n)_formed_by_k=0,1,2_then_output_m_increasing_without_a_precomputed_stencil",
      derivativeColumns: [
        "D02Column(n)[m]=sum_l_increasing S12[m,l]*D01[l,n]",
        "D202Column(n)[m]=8*n_if_n>=2_and_m=n-2_else_positive_zero",
        "MyPowerColumn(p,n)[m]=the_literal_p_repeated_My_matrix_products_with_intermediate_indices_increasing_for_p=1..4",
      ],
      projectionTailOperand:
        "a_projected_fiber_is_the_closed_object_{coefficients_0_through_512_in_order,weightedTailUpper_from_513};_no_unlisted_coefficient_may_be_assumed_zero",
      coefficientTailUse:
        "split_fixedMultiplierColumn_at_k=512;_evaluate_k=0..512_exactly_and_bound_k>=513_by_the_Chebyshev_Banach_product_of_the_recorded_weightedTailUpper_and_the_exact_normalized_unit_or_lift_column_norm",
      wholeXBallSequenceSource: {
        commonRadiusExact: "rhoX=2^-20",
        admittedBall:
          "deltaGamma_in_[-rhoX,rhoX]_and_sum_n>=0_wX(n)*(abs(deltaAlpha[n])+abs(deltaBeta[n]))+abs(deltaGamma)<=rhoX_with_one_shared_rhoX_budget_and_no_coordinatewise_reboxing",
        coordinateCoefficientIntervals:
          "for_family_alpha_or_beta_and_n=0..512_emit_[-rhoX/wX(n),+rhoX/wX(n)]_by_one_signed_reciprocal_then_multiply_graph;_also_record_the_shared_family_weightedNormUpper=rhoX_and_weightedTailUpperFrom513=rhoX;_the_per-coefficient_intervals_are_local_outer_enclosures_and_must_never_be_summed_as_if_they_were_independent_ball_budgets",
        liftPolynomialExact: "ell=[3/8,-1/2,1/8]",
        liftWeightedNormExact:
          "Llift=sum_k=0^2_wX(k)*abs(ell[k])=3/8+2^8/2+3^8/8=7588/8=1897/2",
        liftedCorrectionGraph:
          "form_Lift(deltaFamily)=Prod(ell,deltaFamily)_by_k_then_input_n_then_output_m_order;_emit_modes_0..512_by_the_exact_double-indicator_formula;_set_wholeWeightedNormUpper=RNDU(Llift*rhoX)_and_weightedTailUpperFrom513=RNDU(Llift*rhoX)_using_the_shared_ball_norm_not_the_sum_of_local_coefficient_boxes",
        pointwiseBallEnvelope:
          "on_every_y_in_[0,1]_use_abs((1-y)^2*sum_n_deltaFamily[n]*T_n(2y-1))<=sum_n_abs(deltaFamily[n])<=sum_n_wX(n)*abs(deltaFamily[n])<=rhoX;_this_rhoX_pointwise_envelope_is_distinct_from_the_Llift*rhoX_coefficient-space_norm",
        representativeSources:
          "HbarGamma_and_QbarGamma_use_the_exact_primary_0..31_representative_coefficients_positive-zero_higher_modes_and_the_frozen_gamma-dependent_join_lifts_on_deltaGamma_in_[-rhoX,rhoX]",
        wholeFieldSources:
          "HWholeXBall=HbarGamma+Lift(deltaAlpha)_and_QWholeXBall=QbarGamma+Lift(deltaBeta);_emit_each_as_{coefficients_0_through_512,weightedTailUpperFrom513,wholeWeightedNormUpper}_with_additions_in_source_order_and_with_the_Llift*rhoX_tail_added_once",
        requiredConsumers:
          "every_undifferentiated_H_or_Q_in_all_nine_ordered_D2F_blocks_including_G2_rs*Q*H_cS_rs*H_cP_rs*Q_and_every_mass_I1_I2_integrand",
        massIntegrationBoundary:
          "the_order-10_integrator_must_never_differentiate_an_unknown_alpha_or_beta_sequence;_mass_I1_I2_use_the_pointwise_rhoX_envelope_and_integrate_only_E_Egamma_Egammagamma_fibers_with_finite_HbarGamma_Hgamma_bounds",
        failure:
          "missing_shared_ball_norm_missing_tail_double-counted_local_boxes_or_any_undifferentiated_H_Q_bypassing_HWholeXBall_QWholeXBall_fails_the_frozen_candidate",
      },
    },
    exactFiniteOffsetColumns: {
      S02: [
        "S02[0,0]=1",
        "for_n>=1_S02[n,n]=1/(2*(n+1))",
        "for_n>=2_S02[n-2,n]=-1/(2*(n+1))-1/(2*(n-1))",
        "for_n>=4_S02[n-4,n]=1/(2*(n-1))",
        "all_other_entries_are_exact_zero",
      ],
      D02: [
        "for_n>=1_D02[n-1,n]=2",
        "for_n>=3_D02[n-3,n]=-2",
        "all_other_entries_are_exact_zero",
      ],
      D202: ["for_n>=2_D202[n-2,n]=8*n", "all_other_entries_are_exact_zero"],
      My: [
        "My[n,n]=1/2",
        "My[n+1,n]=(n+1)/(4*(n+2))",
        "for_n>=1_My[n-1,n]=(n+3)/(4*(n+2))",
        "all_other_entries_are_exact_zero",
      ],
      MyPowers:
        "for_p=2_3_4_form_My^p_by_paths_(i0=n,i1,...,ip=m)_with_each_step_offset_in_-1_0_1;_path_lexicographic_by_i1_then_i2_then_i3_then_i4;_multiply_exact_rational_edges_left_to_right_and_add_equal-output_paths_in_path_order",
      cutoffTailFormula:
        "for_any_finite-offset_matrix_L_and_input_intervals_c,_TailUpper_K(Lc)=RNDU_sum_n>=0_sum_delta_with_n+delta>K wOut(n+delta)*absUpper(L[n+delta,n])*absUpper(c[n]);_enumerate_explicit_n<=512_and_use_the_input_weighted_tail_times_the_interval-certified_supremum_of_each_normalized_offset_column_for_n>=513",
    },
    symbolicColumnDag: {
      allowedNodeKindsInTopologicalOrder: [
        "exact_rational_constant",
        "directed_interval_constant",
        "normalized_unit_column",
        "finite_sequence",
        "whole_X_ball_sequence_with_tail_and_norm",
        "projected_fiber_sequence_with_tail",
        "add",
        "subtract",
        "scalar_multiply",
        "Chebyshev_product",
        "S02",
        "D02",
        "D202",
        "My_power_1_to_4",
        "select_S_offset_2_or_P_offset_4",
        "mass_integral",
        "preconditioner_A",
      ],
      construction:
        "expand_the_architecture_S_P_mass_first_or_second_jet_expression_without_algebraic_reassociation;_assign_nodeOrdinal_preorder_expression_order;_evaluate_children_then_the_parent;_each_sequence_node_carries_coefficients_0..512_plus_exactly_one_named_weightedTailUpper_and_each_whole-X-ball_H_Q_node_also_carries_the_shared_wholeWeightedNormUpper",
      addSubtract:
        "combine_coefficients_m=0..512_increasing_then_RNDU_add_the_two_nonnegative_tail_uppers",
      scalarMultiply:
        "multiply_each_coefficient_interval_then_multiply_the_tail_upper_by_absUpper(scalar)_with_scalar_dependency_preserved",
      product:
        "finite_coefficients_use_the_exact_double-indicator_formula_in_shell_then_left-index_order;_tail_uses_the_registered_Chebyshev_product_tail_once",
      wholeXBallProduct:
        "when_either_operand_is_HWholeXBall_or_QWholeXBall_use_its_recorded_shared_wholeWeightedNormUpper_and_weightedTailUpperFrom513_in_the_Chebyshev_Banach_tail_rule;_never_reconstruct_a_norm_by_summing_the_513_local_outer_coefficient_intervals",
      selection:
        "S_raw_mode_m_maps_to_s_(m-2)_only_for_m>=2;_P_raw_mode_m_maps_to_p_(m-4)_only_for_m>=4;_the_six_lower_modes_are_emitted_to_the_separate_raw-duty_vector_and_never_inserted_into_Y",
      noCommonSubexpressionEliminationAcrossGammaOrdersOrOrderedHessianBlocks: true,
    },
    primitiveTailRules: {
      finiteBand:
        "for_a_matrix_with_offsets_delta_in_a_literal_finite_set_and_entry_majorants_c_delta(n),_TailCol(n)=sum_delta wOut(n+delta)*c_delta(n)/wIn(n)_omitting_negative_outputs",
      monotoneRationalSupremum:
        "for_each_nonnegative_rational_term_clear_the_known-positive_denominator_on_real_n>=513;_differentiate_the_resulting_ratio;_use_interval_Horner_on_m=1/n_in_[0,1/513];_if_the_derivative_sign_is_strict_then_sup_is_max(value_at_513,limit_at_infinity);_otherwise_fail_no_sampling_fallback",
      ChebyshevConvolution:
        "use_the_exact_half_sum_product_then_bound_by_the_weighted_l1_Banach_product;_for_output_modes>K_split_each_pair_by_j>K/2_or_k>K/2_in_shell_then_index_order",
      projection:
        "for_each_projected_fiber_gamma_order_use_abs(Proj_n)<=2*L10/(n*piLower)^10_for_n>=513_and_the_architecture_closed_weighted_tail_sum",
      lift: "multiply_by_(1-y)^2_with_exact_T_coefficients_[3/8,-1/2,1/8];_all_outputs_beyond_K_receive_input_tail_beyond_K-2_and_the_two_boundary_crossing_modes_K-1,K_in_literal_product_order",
      conversion:
        "S02_D02_D202_and_M_y_powers_use_their_exact_finite_offset_matrices;_tail_is_the_finiteBand_rule_with_every_matrix_entry_formed_as_an_exact_rational_before_directed_injection",
      preconditioner:
        "finite_B32_has_no_rows_or_columns_above_31;_for_output_n>=32_divide_s_n_or_p_n_by_the_signed_mu_interval_once_using_the_frozen_reciprocal_graph;_tail_gamma_is_zero",
      massIntegralHighColumns:
        "on_the_common_gamma_ball_integrate_JE0=integralUpper(abs(E)*y^-4),JE1=integralUpper(abs(E_gamma)*y^-4),JE2=integralUpper(abs(E_gammagamma)*y^-4)_by_the_fixed_nonoscillatory_order-10_fiber_cell_program;_set_HAbsUpper=RNDU(HbarGamma_unweightedL1Upper+rhoX)_using_the_exact_pointwise_whole-X-ball_envelope_and_HgammaAbsUpper=the_directed_unweightedL1_upper_of_the_finite_Hgamma_sequence;_then_I0=JE0,I1=RNDU(RNDU(HAbsUpper*JE1)+RNDU(HgammaAbsUpper*JE0)),I2=RNDU(RNDU(RNDU(square(HAbsUpper)*JE2)+RNDU(4*RNDU(HAbsUpper*RNDU(HgammaAbsUpper*JE1))))+RNDU(2*RNDU(square(HgammaAbsUpper)*JE0)))_in_written_order;_never_build_a_Taylor_jet_of_an_unknown_alpha_sequence;_the_normalized_mass_Hessian_high-column_bounds_are_(2*R^3/sC)*I0/(wX(j)*wX(k))_for_alpha-alpha,_(2*R^3/sC)*I1/wX(j)_for_alpha-gamma_or_gamma-alpha,_and_(R^3/sC)*I2_for_gamma-gamma;_all_beta_blocks_are_exact_zero;_finite_alpha_indices_still_use_the_literal_T_j_integrands_not_these_sup_bounds",
    },
    Z0Compiler: {
      finiteColumns:
        "compute_j=alpha_0..alpha_512,beta_0..beta_512,gamma;_for_each_form_delta-A*DFbar_rows_i=alpha_0..alpha_512,beta_0..beta_512,gamma_then_add_every_named_output_tail_and_take_max",
      infiniteColumnFamilies: ["alpha", "beta"],
      cancellation:
        "for_n>=513_symbolically_extract_the_matching_principal_diagonal_DF_entry_muS_or_muP_and_apply_1-(1/mu)*mu_as_exact_zero_before_interval_evaluation;_using_an_interval_product_that_merely_contains_one_is_forbidden",
      remainingTerms:
        "compile_every_nonprincipal_polynomial_offset_by_finiteBand_then_every_projected-fiber convolution tail by_ChebyshevConvolution_projection_and_lift_rules_then_apply_the_signed_principal reciprocal",
      exactColumnFunction:
        "R_family(n)=Col_XtoX(I-A*DFbar,family_n)_after_the_symbolic_principal_pair_is_deleted;_construct_R_family_by_the_symbolicColumnDag_with_normalizedBasisColumnPrimitives_and_no_whole-operator triangle bound",
      supremum:
        "each_literal_term_gets_a_monotoneRationalSupremum_certificate_on_n>=513;_sum_terms_in_source_expression_order;_take_max_of_alpha_family_beta_family_and_all_finite_columns",
      failure:
        "missing_principal_symbolic_match_unlisted_offset_indeterminate_monotonicity_or_unbounded_limit_fails_the_candidate_with_no_sampling_fallback",
    },
    Z1Compiler: {
      explicitPairs:
        "for_each_of_nine_ordered_family_blocks_evaluate_j,k=0..512_in_j_then_k_order_and_all_output_modes_0..512_then_add_named_output_tails",
      infinitePairs:
        "for_each_block_partition_j_or_k_above_512;_apply_finiteBand_projection_ChebyshevConvolution_lift_conversion_and_integral_tail_rules_to_the_exact_secondDerivativeBlocks_expression_tree_without_symmetry_reuse",
      exactPairFunction:
        "B_familyPair(j,k)=Col2_XxXtoY(D2F,family_j,family_k)_from_the_symbolicColumnDag_with_every_undifferentiated_H_Q_bound_to_HWholeXBall_QWholeXBall;_finite-finite_is_enumerated;_finite-infinite_infinite-finite_and_infinite-infinite_each_use_the_exact_unit-product_fixed-multiplier-and-massIntegralHighColumns_formulas_before_any_supremum",
      pairSuprema:
        "for_finite-infinite_and_infinite-finite_enumerate_the_finite_index_0..512_and_map_the_single_infinite_index_to_m=1/(index+1)_in_[0,1/514],_clear_positive_weight_denominators_and_interval-Horner_the_rational_derivative;_for_infinite-infinite_apply_the_exact_constant-one_weighted_Chebyshev_product_lemma_at_each_product_node_and_multiply_the_separately_certified_one-variable_finite-band_D02_D202_lift_and_preconditioner_column_suprema;_mass_uses_massIntegralHighColumns;_if_any_one-variable_derivative_sign_or_finite-band_limit_is_indeterminate_fail_without_grid_sampling",
      infiniteInfiniteAbsoluteDifferenceHandling:
        "no_interval_or_corner_substitution_for_abs(j-k)_is_allowed;_the_constant-one_Chebyshev_product_lemma_sums_both_j+k_and_abs(j-k)_branches_exactly_at_the_norm_level_before_the_two_independent_input-column_suprema",
      blockUpper:
        "maximum_of_explicit_pair_column_norms_and_each_interval-certified_infinite-family_supremum",
      M2Upper: "RNDU_sum_of_the_nine_blockUpper_values_in_the_declared_order",
      ANormUpper:
        "max_of_all_finite_B32_weighted_columns_and_the_two_signed_principal_reciprocal_tail_suprema",
      Z1Upper: "RNDU(ANormUpper*M2Upper)",
      ballDependency:
        "evaluate_one_shared_normX_ball_of_radius_rhoX=2^-20:_gamma-dependent_fibers_and_join_lifts_use_gamma_in_[-rhoX,rhoX],_while_all_undifferentiated_H_Q_operands_use_the_whole-X-ball_sequence_source_with_shared_alpha_beta_weighted-norm_budget;_use_this_common_outer_ball_once_for_every_ordered_block_and_mass_I1_I2_with_no_coordinatewise_or_per-radius_reboxing",
    },
  },
  truncationRemainderRegistry: {
    requiredNamedRemaindersInOrder: [
      "projection_mode_tail",
      "Chebyshev_product_tail",
      "C1_lift_tail",
      "ultraspherical_conversion_tail",
      "polynomial_band_crossing_tail",
      "preconditioner_tail",
      "mass_integral_cell_remainder",
      "origin_value_tail",
      "origin_first_derivative_tail",
      "origin_second_derivative_tail",
    ],
    formulas: {
      projection_mode_tail: "2*L10/piLower^10*(1+1/513)^8*(1/513+1/513^2)",
      Chebyshev_product_tail:
        "tailK(f*g)<=tailFloorKOver2(f)*norm(g)+norm(f)*tailFloorKOver2(g)",
      C1_lift_tail:
        "exact_bandwidth_2_crossing_rule_from_weightedMajorantCompiler",
      ultraspherical_conversion_tail:
        "exactFiniteOffsetColumns.cutoffTailFormula_applied_separately_to_S02_D02_and_D202_with_the_literal_entries_above_and_no_generic_operator_constant",
      polynomial_band_crossing_tail:
        "exactFiniteOffsetColumns.cutoffTailFormula_for_each_named_My_power_then_S02_D02_or_D202_composition_with_paths_and_composed_offsets_in_literal_order",
      preconditioner_tail:
        "signed_reciprocal_muS_or_muP_supremum_times_the_corresponding_residual_tail",
      mass_integral_cell_remainder:
        "sum_accepted_cells 2*h^11*supabs(d10_integrand)/(11*10!)_in_cell_order_where_h_is_the_exact_cell_half_width",
      origin_value_tail: "M*q^17/(1-q)",
      origin_first_derivative_tail: "d^-1*2*M*q^17*(17-16*q)/(1-q)^2",
      origin_second_derivative_tail:
        "d^-2*2*M*q^17*(561-1053*q+496*q^2)/(1-q)^3",
    },
    compositionOrder:
      "projection_then_Chebyshev_product_then_lift_then_conversion_then_polynomial_band_crossing_then_preconditioner_then_mass_integral_then_origin_value_d1_d2",
    unregisteredRemainderOrGenericEpsilonAllowed: false,
    doubleCountingAllowed: false,
  },
  hostileCanonicalValidation: {
    maximumDepth: 40,
    maximumNodes: 32768,
    maximumArrayLength: 2048,
    maximumObjectPropertyCount: 768,
    maximumPropertyKeyUtf8Bytes: 4096,
    maximumStringUtf8Bytes: 65536,
    maximumAggregateUtf8Bytes: 262144,
    identityOnlyAuthority: true,
    externalCanonicalCopyDisposition:
      "well_formed_equal_copy_is_non_authoritative_and_semantic_difference_is_mismatch",
  },
  completionBoundary: {
    semanticSeedBound: true,
    operationPrepolicyBound: true,
    directedProofArchitectureBound: true,
    primaryNumericsPolicyBound: true,
    exactOriginOperatorAndEnvelopeFormulasClosed: true,
    exactProjectionBudgetsClosed: true,
    exactSignedReciprocalGraphClosed: true,
    exactZ0HighColumnCompilerClosed: true,
    exactZ1BilinearTailCompilerClosed: true,
    exactWholeXBallSequenceAndTailCompilerClosed: true,
    exactNamedTruncationRemaindersClosed: true,
    hostileCanonicalUtf8BudgetsClosed: true,
    exactPrimaryToVerifierAbiComplete: false,
    exactReceiptSchemasComplete: false,
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1 =
  deepFreeze(POLICY);

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS;
  const completion = POLICY.completionBoundary;
  if (
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
      pins.semanticSeed.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
      pins.semanticSeed.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256 !==
      pins.operationPrepolicy.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES !==
      pins.operationPrepolicy.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256 !==
      pins.directedProofArchitecture.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES !==
      pins.directedProofArchitecture.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 !==
      pins.primaryNumericsPolicyBinding.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES !==
      pins.primaryNumericsPolicyBinding.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.candidateId !==
      POLICY.candidateId ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.candidateId !==
      POLICY.candidateId ||
    POLICY.projectionClosure.exactBudgets.maximumPoppedCellsPerProjection !==
      8184 ||
    POLICY.projectionClosure.exactBudgets.exactProjectionCount !== 6156 ||
    POLICY.projectionClosure.exactBudgets.maximumGlobalPoppedCells !==
      50380704 ||
    POLICY.projectionClosure.exactBudgets
      .maximumGlobalJetCoefficientWorkUnits !== 554187744 ||
    POLICY.projectionClosure.exactBudgets
      .maximumGlobalScalarEvaluationWorkUnits !== 554187864 ||
    POLICY.scopeBoundary.omittedRawModes.length !== 6 ||
    POLICY.exteriorOperatorClosure.exactSecondDerivativeBlocks.orderedBlockOrder
      .length !== 9 ||
    POLICY.truncationRemainderRegistry.requiredNamedRemaindersInOrder.length !==
      10 ||
    POLICY.hostileCanonicalValidation.maximumPropertyKeyUtf8Bytes !== 4096 ||
    POLICY.hostileCanonicalValidation.maximumAggregateUtf8Bytes !== 262144 ||
    completion.primaryNumericsPolicyBound !== true ||
    completion.exactWholeXBallSequenceAndTailCompilerClosed !== true ||
    completion.hostileCanonicalUtf8BudgetsClosed !== true ||
    completion.exactPrimaryToVerifierAbiComplete !== false ||
    completion.exactReceiptSchemasComplete !== false ||
    completion.implementationComplete !== false ||
    completion.executionAuthorized !== false ||
    Object.values(POLICY.unresolved).some((value) => value !== null) ||
    Object.values(POLICY.authorityLocks).some((value) => value !== false) ||
    Object.values(POLICY.claimLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_newtonian_seed_directed_proof_operator_v1_invariant_violation",
    );
  }
};

assertInvariants();

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

type SnapshotBudget = {
  nodes: number;
  utf8Bytes: number;
};

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
  budget: SnapshotBudget = { nodes: 0, utf8Bytes: 0 },
): SnapshotResult => {
  const limits = POLICY.hostileCanonicalValidation;
  const reserveUtf8 = (
    byteLength: number,
    individualLimit: number,
    individualViolation: string,
    location: string,
  ): SnapshotResult | null => {
    if (byteLength > individualLimit) {
      return Object.freeze({
        ok: false,
        violation: `${individualViolation}:${location}`,
      });
    }
    if (byteLength > limits.maximumAggregateUtf8Bytes - budget.utf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `snapshot_aggregate_utf8_byte_limit:${location}`,
      });
    }
    budget.utf8Bytes += byteLength;
    return null;
  };
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
    const violation = reserveUtf8(
      Buffer.byteLength(value, "utf8"),
      limits.maximumStringUtf8Bytes,
      "string_byte_limit",
      pointer || "/",
    );
    return violation ?? Object.freeze({ ok: true, value });
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
    for (let keyOrdinal = 0; keyOrdinal < keys.length; keyOrdinal += 1) {
      const key = keys[keyOrdinal] as string;
      const violation = reserveUtf8(
        Buffer.byteLength(key, "utf8"),
        limits.maximumPropertyKeyUtf8Bytes,
        "property_key_byte_limit",
        `${pointer || "/"}#${keyOrdinal}`,
      );
      if (violation != null) return violation;
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
  for (let keyOrdinal = 0; keyOrdinal < keys.length; keyOrdinal += 1) {
    const key = keys[keyOrdinal] as string;
    const violation = reserveUtf8(
      Buffer.byteLength(key, "utf8"),
      limits.maximumPropertyKeyUtf8Bytes,
      "property_key_byte_limit",
      `${pointer || "/"}#${keyOrdinal}`,
    );
    if (violation != null) return violation;
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_JSON =
  canonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1,
  );
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_ARTIFACT_ID,
    policyVersion:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1.candidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256_DOMAIN,
    sha256:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_SHA256 =
  "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  34695 as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_LITERAL_SEAL_STATUS =
  "sealed_with_replacement_primary_numerics_whole_X_ball_and_bounded_validator_without_execution_authority" as const;

if (
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_seed_directed_proof_operator_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES}`,
  );
}

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations =
  (value: unknown): string[] => {
    if (
      value ===
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1
    ) {
      return [];
    }
    let snapshot: SnapshotResult;
    try {
      snapshot = snapshotPlainData(value);
    } catch {
      return [
        "spherical_seed_directed_proof_operator_plain_data_snapshot_invalid",
      ];
    }
    if (!snapshot.ok) return [snapshot.violation];
    try {
      return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
        ? [
            "spherical_seed_directed_proof_operator_external_copy_not_authoritative",
          ]
        : ["spherical_seed_directed_proof_operator_semantic_mismatch"];
    } catch {
      return [
        "spherical_seed_directed_proof_operator_plain_data_snapshot_invalid",
      ];
    }
  };

export const isNhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1;
