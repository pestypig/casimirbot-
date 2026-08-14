import { createHash } from "node:crypto";

import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";
import { NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER } from "./nhm2-semiclassical-state-realizability.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID } from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
} from "./nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_ARTIFACT_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_static_ground_state_hadamard_mean_noise_realization" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_spherical_boson_star_static_ground_state_hadamard_mean_noise_realization/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_PHASE =
  "stage_2_preexecution_nonexecutable_mean_noise_definition_with_all_instances_absent" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 262_144,
    maximumWireUtf8Bytes: 524_288,
    maximumDepth: 32,
    maximumNodes: 32_768,
    maximumArrayLength: 1_024,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 65_536,
    maximumAggregateUtf8Bytes: 2_097_152,
  } as const);

const REQUIRED_SMEARING_WEIGHT_BINDING = Object.freeze({
  sha256: "4cff97a0c1220dbef8c0df29e500d4c80d88320c97f8d16529c9e98ac290a446",
  canonicalSizeBytes: 6_764,
  rawSha256: "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd",
  rawSizeBytes: 512,
} as const);

const REQUIRED_SI_OUTPUT_NORMALIZATION_BINDING = Object.freeze({
  sha256: "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
  canonicalSizeBytes: 23_822,
} as const);

const TENSOR_COMPONENT_ORDER = Object.freeze([
  ...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
]);
const NOISE_COMPONENT_PAIR_ORDER = Object.freeze([
  ...NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
]);

const TYPED_NULL_EVIDENCE = Object.freeze({
  jointSelfConsistentGeometryStateAlgorithm: null,
  jointSelfConsistentGeometryStateWitness: null,
  staticGroundStateSpectralRealization: null,
  strictlyPositiveSelfAdjointDomainWitness: null,
  completeBoundPoleInventory: null,
  completeContinuumSpectralMeasure: null,
  thresholdModeAndResonanceClassification: null,
  hadamardZLambda3CandidateCoefficients: null,
  candidateSpecializedHadamardSubtractor: null,
  morettiThetaNoDoubleCountCrosswalk: null,
  conservationRestoringThetaFromEffectiveAction: null,
  angularMomentumCutoffSelector: null,
  continuumFrequencyCutoffSelector: null,
  radialDiscretizationSelector: null,
  boundStateSelector: null,
  angularTailEnclosure: null,
  continuumFrequencyTailEnclosure: null,
  radialDiscretizationEnclosure: null,
  boundPoleEnclosure: null,
  jointMeanNoiseAbsoluteUncertainty95Construction: null,
  siOutputNormalizationReceipt: null,
  sourceBytesInventory: null,
  derivationSourceBytes: null,
  conventionCrosswalkBytes: null,
  implementationSourceBytes: null,
  dependencyLockBytes: null,
  executableBytes: null,
  effectiveActionStateSymplecticContactRealization: null,
  meanRsetBytes: null,
  meanRsetAbsoluteUncertainty95Bytes: null,
  noiseKernelBytes: null,
  noiseKernelAbsoluteUncertainty95Bytes: null,
  primaryReplayReceipt: null,
  independentReplayReceipt: null,
  pairAgreementReceipt: null,
} as const);

const AUTHORITY_LOCKS = Object.freeze({
  implementationAuthority: false,
  runtimeClosureAuthority: false,
  selfConsistentGeometryStateAuthority: false,
  groundStateSpectralAuthority: false,
  hadamardSubtractorAuthority: false,
  meanRsetAuthority: false,
  noiseKernelAuthority: false,
  numericalEnclosureAuthority: false,
  candidateManifestAuthority: false,
  scientificPresealAuthority: false,
  executionAuthority: false,
  outputAuthority: false,
  replayAuthority: false,
  independentAgreement: false,
  semiclassicalStressNoiseLamp: false,
  semiclassicalConstraintAlgebraLamp: false,
  diagnosticPass: false,
  theoryGraphPromotion: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

const SOURCE_ROUTING_HINTS = Object.freeze([
  Object.freeze({
    sourceId: "arrechea_static_spherical_rset",
    locator: "https://arxiv.org/abs/2409.04528v2",
    role: "static_spherical_Hadamard_RSET_context_not_a_copyable_isotropic_candidate_formula",
    exactSourceBytesSha256: null,
    exactSourceSizeBytes: null,
  }),
  Object.freeze({
    sourceId: "taylor_breen_ottewill_hadamard_modes",
    locator: "https://arxiv.org/abs/2201.05174",
    role: "Hadamard_mode_sum_context",
    exactSourceBytesSha256: null,
    exactSourceSizeBytes: null,
  }),
  Object.freeze({
    sourceId: "breen_ottewill_static_spherical_modes",
    locator: "https://arxiv.org/abs/1112.3048",
    role: "static_spherical_mode_sum_context",
    exactSourceBytesSha256: null,
    exactSourceSizeBytes: null,
  }),
  Object.freeze({
    sourceId: "moretti_improved_point_splitting",
    locator: "https://arxiv.org/abs/gr-qc/0109048v2",
    role: "primary_D_ab_one_third_point_splitting_route",
    exactSourceBytesSha256: null,
    exactSourceSizeBytes: null,
  }),
  Object.freeze({
    sourceId: "decanini_folacci_hadamard_renormalization",
    locator: "https://arxiv.org/abs/gr-qc/0512118v2",
    role: "exclusive_whole_calculation_cross_check_route",
    exactSourceBytesSha256: null,
    exactSourceSizeBytes: null,
  }),
  Object.freeze({
    sourceId: "phillips_hu_noise_kernel",
    locator: "https://arxiv.org/abs/gr-qc/0010019v2",
    role: "point_separated_noise_context_not_diagonal_evaluation_authority",
    exactSourceBytesSha256: null,
    exactSourceSizeBytes: null,
  }),
]);

const PROPOSED_DAG_NODES = Object.freeze([
  Object.freeze({
    nodeId: "joint_self_consistent_geometry_state_witness",
    duty: "prove_the_geometry_and_coherent_ground_state_are_the_same_joint_fixed_point",
    artifactBinding: null,
  }),
  Object.freeze({
    nodeId: "static_ground_state_spectral_realization",
    duty: "realize_the_positive_self_adjoint_static_operator_with_all_bound_poles_and_continuum",
    artifactBinding: null,
  }),
  Object.freeze({
    nodeId: "hadamard_Zlambda3_realization",
    duty: "specialize_the_Hadamard_subtractor_and_Zlambda3_coefficients_to_the_frozen_candidate",
    artifactBinding: null,
  }),
  Object.freeze({
    nodeId: "coherent_wick_gram_noise_realization",
    duty: "derive_uniform_one_and_two_particle_Fock_Gram_kernels_including_coherent_linear_terms",
    artifactBinding: null,
  }),
  Object.freeze({
    nodeId: "smeared_mean_noise_realization",
    duty: "materialize_all_64_mean_probes_and_all_64_by_64_by_100_noise_entries",
    artifactBinding: null,
  }),
  Object.freeze({
    nodeId: "joint_numerical_enclosure_witness",
    duty: "enclose_bound_continuum_angular_radial_and_joint_U95_errors_without_observed_output_tuning",
    artifactBinding: null,
  }),
  Object.freeze({
    nodeId: "effective_action_state_symplectic_contact_realization",
    duty: "bind_the_same_effective_action_to_state_symplectic_contact_and_constraint_variations",
    artifactBinding: null,
  }),
]);

const PROPOSED_DAG_EDGES = Object.freeze([
  Object.freeze({
    from: "joint_self_consistent_geometry_state_witness",
    to: "static_ground_state_spectral_realization",
    relation: "same_joint_geometry_defines_static_operator",
  }),
  Object.freeze({
    from: "static_ground_state_spectral_realization",
    to: "hadamard_Zlambda3_realization",
    relation: "ground_two_point_function_enters_candidate_subtraction",
  }),
  Object.freeze({
    from: "joint_self_consistent_geometry_state_witness",
    to: "hadamard_Zlambda3_realization",
    relation: "same_geometry_fixes_local_Hadamard_coefficients",
  }),
  Object.freeze({
    from: "static_ground_state_spectral_realization",
    to: "coherent_wick_gram_noise_realization",
    relation: "spectral_one_particle_space_defines_Fock_Gram_vectors",
  }),
  Object.freeze({
    from: "joint_self_consistent_geometry_state_witness",
    to: "coherent_wick_gram_noise_realization",
    relation:
      "same_coherent_mean_Cauchy_data_define_the_mandatory_linear_sector",
  }),
  Object.freeze({
    from: "hadamard_Zlambda3_realization",
    to: "smeared_mean_noise_realization",
    relation: "candidate_subtractor_defines_renormalized_mean",
  }),
  Object.freeze({
    from: "coherent_wick_gram_noise_realization",
    to: "smeared_mean_noise_realization",
    relation: "Wick_Gram_vectors_define_connected_noise",
  }),
  Object.freeze({
    from: "smeared_mean_noise_realization",
    to: "joint_numerical_enclosure_witness",
    relation: "every_materialized_entry_requires_joint_error_enclosure",
  }),
  Object.freeze({
    from: "effective_action_state_symplectic_contact_realization",
    to: "joint_self_consistent_geometry_state_witness",
    relation: "same_effective_action_and_state_contact_define_joint_variation",
  }),
  Object.freeze({
    from: "effective_action_state_symplectic_contact_realization",
    to: "smeared_mean_noise_realization",
    relation: "same_counterterms_and_state_history_prevent_double_counting",
  }),
]);

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CONTRACT_VERSION,
  phase:
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_PHASE,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  authority: "nonexecutable_definition_and_successor_DAG_proposal_only",
  maturity:
    "stage_2_analytic_realization_definition_all_candidate_instances_and_numerical_evidence_absent",
  exactBindings: {
    siOutputNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    requiredSiOutputNormalizationSemanticSeal:
      REQUIRED_SI_OUTPUT_NORMALIZATION_BINDING,
    smearingWeightFreeze:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
    requiredSemanticSeal: REQUIRED_SMEARING_WEIGHT_BINDING,
    exactWeightRawSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
    exactWeightRawSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
  },
  scopeBoundary: {
    geometryClass:
      "static_spherically_symmetric_horizonless_asymptotically_flat",
    coordinateGauge: "frozen_isotropic_spherical_chart",
    stateClass: "coherent_displacement_of_static_ground_state_Hadamard_vacuum",
    fieldModel:
      "free_minimally_coupled_complex_scalar_with_mu_as_the_unit_scale",
    declaredLeverOrTileTensorUsed: false,
    copiedArealGaugeRsetFormulaUsed: false,
    reasonArealGaugeFormulaCannotBeCopied:
      "for_A=exp(2*F0)_and_B=exp(2*F1)_the_areal_radius_is_R=x*exp(F1)_and_g_RR=(1+x*F1_prime)^(-2)_not_1/A",
    implementationOrRunInstanceProvided: false,
    observedGateOutputMayChooseAnyDefinitionCutoffOrTail: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  coherentTwoRealNormalization: {
    physicalToBarredFieldMap:
      "Phibar=sqrt(8*pi*G_nat)*Phi_and_g=8*pi*G_nat*mu_nat^2=2^-40",
    barredComplexFieldDefinition: "Phibar=(phibar_1+i*phibar_2)/sqrt(2)",
    inverseDefinitions: Object.freeze([
      "phibar_1=(Phibar+Phibar_star)/sqrt(2)",
      "phibar_2=(Phibar-Phibar_star)/(i*sqrt(2))",
    ]),
    barredMatterAction:
      "S_m=-(1/(2*g))*sum_A=1^2*integral_d4xbar[sqrt(-gbar)*(nablaBar(phibar_A)^2+phibar_A^2)]",
    barredStressDefinition:
      "Tbar_ab_is_the_dimensionless_stress_obtained_from_phibar_with_the_overall_1/g_removed_so_Gbar_ab=Tbar_ab",
    exactCoupling: Object.freeze({
      symbol: "g",
      exact: "2^-40",
      value: 2 ** -40,
    }),
    canonicalMomentum:
      "pibar_A=g^(-1)*sqrt(h)*N^(-1)*partial_tau(phibar_A)_for_zero_shift",
    equalTimeCcr:
      "[phibar_A(x),pibar_B(y)]=i*delta_AB*delta^3(x-y)_equivalently_[phibar_A(x),partial_tau(phibar_B(y))]=i*g*N(y)/sqrt(h(y))*delta_AB*delta^3(x-y)",
    vacuumTwoPointNormalization:
      "Wbar_AB(X,Y)=delta_AB*Wbar0(X,Y)_so_<Phibar(X)Phibar_star(Y)>_0=Wbar0(X,Y)",
    coherentMeanDefinition:
      "Phibar_c=(phibar_c1+i*phibar_c2)/sqrt(2)_and_delta_phibar_A=phibar_A-phibar_cA",
    frozenPhaseAtTauZero: Object.freeze({
      PhibarC: "varphi(x)_real_and_strictly_positive_at_the_origin",
      partialTauPhibarC: "-i*w*varphi(x)",
      phibarC1: "sqrt(2)*varphi(x)",
      phibarC2: "0",
      partialTauPhibarC1: "0",
      partialTauPhibarC2: "-sqrt(2)*w*varphi(x)",
    }),
    physicalPhiMayBeIdentifiedWithBvpVarphi: false,
    unitNormalizedCcrMayBeAppliedDirectlyToPhibar: false,
    droppingTheSecondRealFieldOrItsTimeDerivativeAllowed: false,
  },
  staticGroundStateOperator: {
    dimensionlessCoordinates: "tau=mu*t_and_x=mu*r",
    metric: "dsbar^2=-A(x)*dtau^2+B(x)*(dx^2+x^2*dOmega^2)",
    coefficientDefinitions: Object.freeze({
      A: "exp(2*F0(x))",
      B: "exp(2*F1(x))",
      lapseN: "sqrt(A)=exp(F0)",
      spatialMetric: "h_ij=B*delta_ij",
      spatialVolumeDensity: "sqrt(h)=B^(3/2)",
    }),
    oneParticleConfigurationHilbertSpace: "L2(Sigma,N^(-1)*sqrt(h)*d^3x)",
    innerProduct: "<f,g>_config=integral_Sigma[N^(-1)*sqrt(h)*conj(f)*g*d^3x]",
    operator: "K=-N/sqrt(h)*partial_i(N*sqrt(h)*h^ij*partial_j)+A",
    evolutionEquation: "partial_tau^2(phibar_A)+K*phibar_A=0_for_A=1,2",
    quadraticForm:
      "q[f]=integral_Sigma[N*sqrt(h)*(h^ij*partial_i(conj(f))*partial_j(f)+conj(f)*f)*d^3x]",
    realizationDuty:
      "use_the_positive_Friedrichs_realization_of_the_closed_quadratic_form_after_proving_candidate_regular_coefficients_domain_and_strict_positivity",
    radialSectors: {
      angularBasis:
        "Y_lm_with_integral_S2(conj(Y_lm)*Y_lprime_mprime*dOmega)=delta_llprime*delta_mmprime",
      labels: "ell=0,1,2,..._and_m=-ell,...,+ell",
      radialHilbertMeasure: "B^(3/2)*x^2/N*dx",
      operator:
        "K_ell=-N/(B^(3/2)*x^2)*d_dx[x^2*N*B^(1/2)*d_dx]+A*(1+ell*(ell+1)/(B*x^2))",
      eigenEquation: "K_ell*u_ell_lambda=omega_lambda^2*u_ell_lambda",
      originDomain:
        "regular_solution_u_ell=O(x^ell)_with_the_Friedrichs_boundary_form_zero_at_x=0",
      infinityDomain:
        "asymptotically_flat_bound_or_delta_normalized_scattering_condition_with_no_postsolve_radial_reparameterization",
    },
    exactSpectralObligations: {
      strictlyPositiveSelfAdjointKRequired: true,
      negativeOrZeroSpectrumDisposition: "fail_candidate",
      allDiscreteBoundPoles:
        "include_every_normalizable_eigenmode_with_0<omega^2<1_for_every_ell_and_m",
      fullContinuum:
        "include_the_complete_delta_normalized_spectral_measure_for_omega^2>=1_for_every_ell_and_m",
      thresholdDuty:
        "classify_and_include_or_bound_every_omega^2=1_threshold_mode_half_bound_state_or_resonance",
      embeddedOrExceptionalSpectrumMayBeSilentlyDropped: false,
      coherent1sModeMayReplaceVacuumSpectrum: false,
      finiteModeTruncationDefinesTheGroundState: false,
      positiveFrequency:
        "exp(-i*omega*tau)_with_respect_to_the_asymptotic_static_future_Killing_time",
      HadamardConditionMustBeProvedForRealization: true,
    },
    spectralGroundTwoPointFunction: {
      boundRadialNormalization:
        "integral_0^infinity[B^(3/2)*x^2/N*conj(u_ell_b)*u_ell_bprime*dx]=delta_bbprime",
      continuumRadialNormalization:
        "integral_0^infinity[B^(3/2)*x^2/N*conj(u_ell_omega)*u_ell_omegaPrime*dx]=delta(omega-omegaPrime)",
      fixedContinuumParameter: "omega_in_[1,infinity)_not_lambda=omega^2",
      boundMode:
        "U_ell_m_b(X)=u_ell_b(x)*Y_ell_m(Omega)*exp(-i*omega_ell_b*tau)",
      continuumMode:
        "U_ell_m_omega(X)=u_ell_omega(x)*Y_ell_m(Omega)*exp(-i*omega*tau)",
      exactFormula:
        "Wbar0(X,Y)=g*sum_ell=0^infinity*sum_m=-ell^ell[(sum_b U_ell_m_b(X)*conj(U_ell_m_b(Y))/(2*omega_ell_b))+integral_1^infinity(U_ell_m_omega(X)*conj(U_ell_m_omega(Y))/(2*omega))*domega]",
      exactBoundWeight: "g/(2*omega_ell_b)",
      exactContinuumMeasureAndWeight: "g*domega/(2*omega)",
      spectralParameterOrNormalizationChangeAllowed: false,
      lambdaParameterConversionDuty:
        "an_implementation_using_lambda=omega^2_must_transform_both_delta_normalization_and_measure_exactly_and_may_not_reuse_the_domega_formula",
      ccrReconstruction:
        "the_equal_tau_antisymmetric_time_derivative_of_Wbar0_reconstructs_i*g*N/sqrt(h)*delta^3",
      distributionalSum:
        "the_infinite_bound_plus_continuum_expression_defines_a_bidistribution_before_smearing_not_a_pointwise_convergent_diagonal_series",
    },
  },
  meanRsetDefinition: {
    oneRealComponentWightmanFunction: "Wbar0(X,Y)",
    symmetricHadamardParametrix:
      "Hbar_S(X,Y)=g*H_S_unit(X,Y)_for_xi=0_mass=1_and_Hadamard_length_ell=mu^(-1)",
    smoothCoincidenceKernel: "K_C_bar(X,Y)=2*(Re(Wbar0(X,Y))-Hbar_S(X,Y))",
    primaryRoute: {
      routeId: "Moretti_D_ab_one_third_plus_Theta",
      equation:
        "<Tbar_ab>_ren=Tbar_ab[Phibar_c]+coincidence(Dbar_ab^(1/3)*K_C_bar)+ThetaBar_ab",
      improvedBidifferentialOperator:
        "Dbar_ab^(1/3)_specialized_to_the_frozen_barred_minimally_coupled_complex_field_and_Tbar_conventions",
      builtInConservationCorrection:
        "the_eta=1/3_improvement_inside_Dbar_ab^(1/3)_is_applied_exactly_once",
      localTerm:
        "ThetaBar_ab_is_only_the_residual_finite_local_effective_action_ambiguity_after_the_Dbar_eta=1/3_improvement_and_frozen_renormalization_conditions",
      thetaMayRepeatBuiltInEtaOneThirdOrGAbQCorrection: false,
      noDoubleCountCrosswalk: null,
    },
    exclusiveCrossCheckRoute: {
      routeId: "Decanini_Folacci_Hadamard_coefficient_whole_calculation",
      purpose: "independent_exclusive_cross_check_only",
      mayBeAddedToPrimaryResult: false,
      maySupplyASecondCopyOfLocalCounterterms: false,
      mayBeAveragedOrMixedWithPrimaryRoute: false,
    },
    routeSelectionRule:
      "one_complete_route_per_result_with_an_explicit_symbol_and_counterterm_crosswalk_before_any_numeric_execution",
    countertermsAppliedExactlyOnce: true,
    MinkowskiVacuumStressExactlyZeroConditionRetained: true,
    registeredNewtonConstantAtScaleMuConditionRetained: true,
    renormalizedCurvatureSquaredCoefficientsZeroAtScaleMuConditionRetained: true,
    vacuumPolarizationMayBeDroppedFittedOrReplacedByClassicalStress: false,
  },
  coherentWickFockGramNoise: {
    stressFluctuation:
      "DeltaTbar_ab=Tbar_ab-<Tbar_ab>_alpha_in_the_same_coherent_Hadamard_state",
    coherentState: "Omega_alpha=W(Phibar_c)*Omega",
    smearedPhysicalOperator:
      "Bbar_pI=integral_Mbar[sqrt(-gbar_metric)*f_p(X)*E_I^ab(X)*DeltaTbar_ab(X)*d^4xbar]",
    pulledBackFockOperator:
      "Abar_pI=W(Phibar_c)^star*Bbar_pI*W(Phibar_c)_acting_in_the_ground_state_Fock_representation",
    fockVacuum:
      "Omega_is_the_static_ground_state_vacuum_for_both_real_components",
    exactSectorDefinition: Object.freeze({
      oneParticleVector: "Psi1_pI=P_1*Abar_pI*Omega",
      twoParticleVector: "Psi2_pI=P_2*Abar_pI*Omega",
      higherParticleVector: "P_n*Abar_pI*Omega=0_for_every_n_greater_than_2",
      projectionNormalization:
        "P_n_are_the_orthogonal_projections_of_the_standard_a_a_dagger_symmetric_Fock_space_whose_phibar_field_carries_the_frozen_sqrt(g)_mode_factor",
    }),
    uniformGramFormula:
      "Nbar_pI_qJ=Re(<Psi1_pI,Psi1_qJ>+<Psi2_pI,Psi2_qJ>)_for_every_p,q,I,J",
    anticommutatorIdentity:
      "Nbar_pI_qJ=(1/2)*<Omega,{Abar_pI,Abar_qJ}*Omega>=Re(<Abar_pI*Omega,Abar_qJ*Omega>)",
    coherentLinearSector: {
      origin:
        "the_terms_in_DeltaTbar_linear_in_delta_phibar_A_and_proportional_to_phibar_cA_or_its_derivatives",
      equalsOneParticleVector: true,
      mustBeIncluded: true,
      tauZeroWarning:
        "phibar_c2=0_at_tau=0_does_not_remove_the_sector_because_partial_tau(phibar_c2)=-sqrt(2)*w*varphi_is_nonzero",
    },
    quadraticWickSector: {
      origin:
        "the_ground_state_Wick_ordered_quadratic_delta_phibar_A_stress_after_its_expectation_is_subtracted",
      equalsTwoParticleVector: true,
      mustBeIncluded: true,
      sameHadamardAndCountertermConventionAsMeanRequired: true,
    },
    diagonalDefinition:
      "Nbar_pI_pI=norm(Psi1_pI)^2+norm(Psi2_pI)^2_after_C_infinity_spacetime_smearing",
    diagonalWickProductDefinition:
      "use_the_same_distributionally_defined_smeared_Wick_polynomial_product_as_every_off_diagonal_entry_not_a_pointwise_coincidence_limit_or_posthoc_fill",
    pointwiseCoincidenceEvaluationAllowed: false,
    diagonalMayBeFilledByExtrapolationOrZero: false,
    structuralPositiveSemidefiniteness:
      "for_every_real_c_pI_sum(c_pI*Nbar_pI_qJ*c_qJ)=norm(sum(c_pI*Psi1_pI))^2+norm(sum(c_pI*Psi2_pI))^2>=0",
    PSDMayBeEstablishedOnlyByClippingNegativeEigenvalues: false,
    lowRankFactorMayReplaceRequiredRawKernel: false,
  },
  probeAndIndexSemantics: {
    sliceCenters: "64_frozen_cartesian_centers_on_tau=0",
    sampleOrdinalRange: Object.freeze({ first: 0, last: 63, count: 64 }),
    sampleEnumeration: "ordinal=16*i_z+4*i_y+i_x",
    probeDefinition:
      "f_p_is_the_frozen_normalized_C_infinity_product_bump_centered_at_sample_ordinal_p",
    oneDimensionalBump:
      "q(u)=exp(-u^2/(1-u^2))_for_abs(u)<1_and_zero_otherwise",
    halfWidths: "mu*DeltaT=mu*DeltaX=mu*DeltaY=mu*DeltaZ=1/64",
    perProbeNormalization:
      "integral_Mbar[sqrt(-gbar_metric)*f_p*d^4xbar]=1_for_each_p_independently",
    tetradProjection:
      "E_I_selects_the_frozen_covariant_orthonormal_tetrad_component_without_sqrt(2)_off_diagonal_rescaling_or_postsolve_rotation",
    tensorComponentOrder: TENSOR_COMPONENT_ORDER,
    componentOrdinalRange: Object.freeze({ first: 0, last: 9, count: 10 }),
    noisePairFlattening:
      "pairOrdinal=10*I+J_with_I_outer_and_J_inner_in_tensorComponentOrder",
    noiseComponentPairOrder: NOISE_COMPONENT_PAIR_ORDER,
    outputShapes: Object.freeze({
      meanRset: Object.freeze([64, 10] as const),
      meanRsetAbsoluteUncertainty95: Object.freeze([64, 10] as const),
      connectedNoiseKernel: Object.freeze([64, 64, 100] as const),
      connectedNoiseAbsoluteUncertainty95: Object.freeze([
        64, 64, 100,
      ] as const),
    }),
    exchangeSymmetry:
      "Nbar[p,q,10*I+J]=Nbar[q,p,10*J+I]_before_SI_scaling_or_any_tolerance_check",
    structuralZerosMayBeInsertedWithoutDerivation: false,
    formulaMustBeUniformAcrossAllSamplesAndComponents: true,
  },
  fixedGlobalSmearingWeightBinding: {
    semanticRole:
      "discrete_replay_aggregation_measure_distinct_from_each_probe_normalization_and_internal_quadrature",
    exactRule: "w_p=1/64=2^-6_for_every_p=0,...,63",
    binary64BitsBigEndian: "3f90000000000000",
    rawF64LeWord: "000000000000903f",
    exactRawSha256: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
    exactRawSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
    mayAlterMeanOrNoiseProduction: false,
    mayBeChosenFromObservedOutputs: false,
    mayReplacePerProbeBumpNormalizationOrQuadratureWeights: false,
    exactBitsCheckRequiredBeforeNormalizationCheck: true,
  },
  dimensionlessToSiOutputMap: {
    semanticAuthority:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    exactCoupling: "g=8*pi*G_SI*mu_E^2/(hbar*c^5)=2^-40",
    massEnergyScale: "mu_E=sqrt(g*hbar*c^5/(8*pi*G_SI))",
    inverseLengthScale: "mu_L=mu_E/(hbar*c)=sqrt(g*c^3/(8*pi*G_SI*hbar))",
    coordinateMap: Object.freeze({
      radial: "x=mu_L*r_SI",
      time: "tau=mu_E*t_SI/hbar=mu_L*c*t_SI",
    }),
    barredEinsteinEquation: "Gbar_ab=<Tbar_ab>_ren_with_G_ab=mu_L^2*Gbar_ab",
    stressScalePrimary: "stressScale_J_m3=c^4*mu_L^2/(8*pi*G_SI)",
    stressScaleClosed: "stressScale_J_m3=g*c^7/((8*pi*G_SI)^2*hbar)",
    noiseScale: "noiseScale_(J_m3)^2=stressScale_J_m3^2",
    meanOutput: "mean_rset_SI[p,I]=stressScale_J_m3*mean_rset_bar[p,I]",
    noiseOutput:
      "noise_kernel_SI[p,q,10*I+J]=noiseScale_(J_m3)^2*Nbar[p,q,10*I+J]",
    uncertaintyOutputs:
      "paired_absolute_uncertainty95_outputs_use_the_exact_SI_normalization_interval_program_and_may_not_scale_only_the_central_value",
    normalizationReceipt: null,
    bindingAloneGrantsOutputOrExecutionAuthority: false,
  },
  numericalRealizationBoundary: {
    boundPolesAndContinuumBothRequired: true,
    angularFrequencyRadialAndBoundSelectorsMustBeFrozenBeforeExecution: true,
    everyDiscardedSectorRequiresAnAposterioriCertifiedTailEnclosure: true,
    separateMeanAndNoiseMarginalErrorBarsSatisfyJointU95Duty: false,
    jointCoverageAcrossEveryRequiredMeanAndNoiseEntryMustBeDefinedBeforeExecution: true,
    sourceAndDerivationBytesMustBeHashedBeforeImplementationAuthority: true,
    candidateOutputMayNotSelectCutoffsTailsPrecisionOrConfidenceConstruction: true,
    exactSelectorsCutoffsTailsAndJointU95: Object.freeze({
      angularMomentumCutoffSelector: null,
      continuumFrequencyCutoffSelector: null,
      radialDiscretizationSelector: null,
      boundStateSelector: null,
      angularTailEnclosure: null,
      continuumFrequencyTailEnclosure: null,
      radialDiscretizationEnclosure: null,
      boundPoleEnclosure: null,
      jointMeanNoiseAbsoluteUncertainty95Construction: null,
    }),
  },
  jointGeometryStateAndEffectiveActionBoundary: {
    sameSelfConsistentGeometryRequiredForCoherentMeanAndGroundVacuum: true,
    classicalEinsteinKleinGordonGeometryIsOnlyAnIterationSeed: true,
    oneWayQuantumEvaluationOnAnUncorrectedClassicalGeometryAllowed: false,
    selfConsistentEquation:
      "Gbar_ab[gbar_metric]=Tbar_ab[Phibar_c,gbar_metric]+<Tbar_ab>_0g_ren",
    fixedPointAlgorithmMustBeFrozenBeforeExecution: true,
    convergenceAndBranchWitnessMustBindFinalGeometryAndState: true,
    sameEffectiveActionMustSupplyMeanThetaAndConstraintVariations: true,
    stateVariablesMustRemainInTheADMLegendreVariation: true,
    stateSymplecticFormAndGeometryStateContactMustBeRealized: true,
    jointSelfConsistentGeometryStateAlgorithm: null,
    jointSelfConsistentGeometryStateWitness: null,
    effectiveActionStateSymplecticContactRealization: null,
  },
  sourceAndDerivationProvenance: {
    routingHintsOnlyNotEvidence: SOURCE_ROUTING_HINTS,
    sourceBytesInventory: null,
    derivationSourceBytes: null,
    conventionCrosswalkBytes: null,
    candidateSpecializedSubtractorBytes: null,
    implementationSourceBytes: null,
    noSourceMayBeClaimedReplayedOrCopiedFromLocatorAlone: true,
  },
  typedNullEvidence: TYPED_NULL_EVIDENCE,
  additiveScienceDagSuccessorProposal: {
    baseDagMutatedByThisArtifact: false,
    proposalApproved: false,
    proposalHasExecutionAuthority: false,
    proposedNodes: PROPOSED_DAG_NODES,
    proposedEdges: PROPOSED_DAG_EDGES,
    integrationReceipt: null,
  },
  blockers: Object.freeze([
    "joint_self_consistent_geometry_state_algorithm_absent",
    "joint_self_consistent_geometry_state_witness_absent",
    "static_ground_state_positive_self_adjoint_spectral_realization_absent",
    "complete_bound_pole_and_continuum_spectral_data_absent",
    "threshold_mode_and_resonance_classification_absent",
    "hadamard_Zlambda3_candidate_coefficients_absent",
    "candidate_specialized_Hadamard_subtractor_absent",
    "Moretti_Theta_no_double_count_crosswalk_absent",
    "conservation_restoring_Theta_effective_action_derivation_absent",
    "exact_angular_frequency_radial_and_bound_selectors_absent",
    "certified_angular_frequency_radial_and_bound_tail_enclosures_absent",
    "joint_mean_noise_absolute_uncertainty95_construction_absent",
    "si_output_normalization_receipt_absent",
    "exact_source_derivation_crosswalk_and_implementation_bytes_absent",
    "effective_action_state_symplectic_contact_realization_absent",
    "additive_science_DAG_successor_not_approved_or_integrated",
    "mean_and_noise_output_bytes_absent",
    "candidate_manifest_and_scientific_preseal_absent",
    "primary_independent_replay_and_pair_agreement_absent",
  ]),
  authorityLocks: AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child, seen);
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0))
      throw new TypeError("static_ground_state_mean_noise_noncanonical_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  if (value == null || typeof value !== "object")
    throw new TypeError("static_ground_state_mean_noise_non_json_value");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")),
    )
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-static-ground-state-hadamard-mean-noise-realization/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_JSON =
  canonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_SHA256 =
  "bf9875496a7aa8f5bde0509e597b373454ddea072f1d1af2ae18b746f7646467" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_CANONICAL_SIZE_BYTES =
  25_213 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256_DOMAIN,
    sha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const exactBinding = (
  observed: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
  expected: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
) =>
  observed.sha256 === expected.sha256 &&
  observed.canonicalSizeBytes === expected.canonicalSizeBytes;

const allTypedEvidenceNull = Object.values(TYPED_NULL_EVIDENCE).every(
  (value) => value === null,
);

if (
  !exactBinding(
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    REQUIRED_SI_OUTPUT_NORMALIZATION_BINDING,
  ) ||
  !exactBinding(
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
    REQUIRED_SMEARING_WEIGHT_BINDING,
  ) ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256 !==
    REQUIRED_SMEARING_WEIGHT_BINDING.rawSha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES !==
    REQUIRED_SMEARING_WEIGHT_BINDING.rawSizeBytes ||
  TENSOR_COMPONENT_ORDER.length !== 10 ||
  NOISE_COMPONENT_PAIR_ORDER.length !== 100 ||
  NOISE_COMPONENT_PAIR_ORDER[0] !== "T00:T00" ||
  NOISE_COMPONENT_PAIR_ORDER[99] !== "T33:T33" ||
  PROPOSED_DAG_NODES.length !== 7 ||
  !allTypedEvidenceNull ||
  Object.values(AUTHORITY_LOCKS).some((value) => value !== false)
)
  throw new Error("spherical_v2_static_ground_state_mean_noise_invariant");

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_CANONICAL_SIZE_BYTES
)
  throw new Error(
    "spherical_v2_static_ground_state_mean_noise_literal_seal_mismatch",
  );

type SnapshotBudget = { nodes: number; utf8Bytes: number };
type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

const pointerToken = (value: string): string =>
  value.replaceAll("~", "~0").replaceAll("/", "~1");

const snapshotParsedJson = (
  value: unknown,
  pointer = "",
  depth = 0,
  budget: SnapshotBudget = { nodes: 0, utf8Bytes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_LIMITS;
  if (depth > limits.maximumDepth)
    return { ok: false, violation: `wire_depth_limit:${pointer || "/"}` };
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes)
    return { ok: false, violation: `wire_node_limit:${pointer || "/"}` };
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number")
    return Number.isFinite(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: `wire_number_invalid:${pointer || "/"}` };
  if (typeof value === "string") {
    const bytes = Buffer.byteLength(value, "utf8");
    budget.utf8Bytes += bytes;
    return bytes <= limits.maximumStringUtf8Bytes &&
      budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? { ok: true, value }
      : { ok: false, violation: `wire_string_limit:${pointer || "/"}` };
  }
  if (Array.isArray(value)) {
    if (value.length > limits.maximumArrayLength)
      return { ok: false, violation: `wire_array_limit:${pointer || "/"}` };
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index))
        return {
          ok: false,
          violation: `wire_sparse_array:${pointer}/${index}`,
        };
      const child = snapshotParsedJson(
        value[index],
        `${pointer}/${index}`,
        depth + 1,
        budget,
      );
      if (!child.ok) return child;
      output.push(child.value);
    }
    return { ok: true, value: output };
  }
  if (value == null || typeof value !== "object")
    return { ok: false, violation: `wire_non_json:${pointer || "/"}` };
  const keys = Object.keys(value);
  if (keys.length > limits.maximumObjectPropertyCount)
    return { ok: false, violation: `wire_object_limit:${pointer || "/"}` };
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    const keyBytes = Buffer.byteLength(key, "utf8");
    budget.utf8Bytes += keyBytes;
    if (
      keyBytes > limits.maximumPropertyKeyUtf8Bytes ||
      budget.utf8Bytes > limits.maximumAggregateUtf8Bytes
    )
      return {
        ok: false,
        violation: `wire_property_key_limit:${pointer || "/"}`,
      };
    const child = snapshotParsedJson(
      (value as Record<string, unknown>)[key],
      `${pointer}/${pointerToken(key)}`,
      depth + 1,
      budget,
    );
    if (!child.ok) return child;
    output[key] = child.value;
  }
  return { ok: true, value: output };
};

export const nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationViolations =
  (value: unknown): string[] => {
    if (
      value ===
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION
    )
      return [];
    if (typeof value !== "string")
      return ["static_ground_state_mean_noise_wire_required"];
    const limits =
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_LIMITS;
    if (value.length > limits.maximumWireUtf16CodeUnits)
      return ["static_ground_state_mean_noise_wire_code_unit_limit"];
    if (Buffer.byteLength(value, "utf8") > limits.maximumWireUtf8Bytes)
      return ["static_ground_state_mean_noise_wire_byte_limit"];
    let parsed: unknown;
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return ["static_ground_state_mean_noise_wire_json_invalid"];
    }
    const snapshot = snapshotParsedJson(parsed);
    if (!snapshot.ok) return [snapshot.violation];
    try {
      const canonical = canonicalJson(snapshot.value);
      if (canonical !== value)
        return ["static_ground_state_mean_noise_wire_not_canonical"];
      return canonical ===
        NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_JSON
        ? ["static_ground_state_mean_noise_external_copy_not_authoritative"]
        : ["static_ground_state_mean_noise_semantic_mismatch"];
    } catch {
      return ["static_ground_state_mean_noise_wire_invalid"];
    }
  };

export const isNhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationV1 =
  (
    value: unknown,
  ): value is Nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationV1 =>
    value ===
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION;
