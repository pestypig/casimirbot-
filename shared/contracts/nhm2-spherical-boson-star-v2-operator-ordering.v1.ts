import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS,
} from "./nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256,
} from "./nhm2-spherical-boson-star-v2-classical-structure-functions.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256,
} from "./nhm2-spherical-boson-star-v2-constraint-formulation.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256,
} from "./nhm2-spherical-boson-star-v2-regulator-definition.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256,
} from "./nhm2-spherical-boson-star-v2-renormalization-counterterms.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
} from "./nhm2-spherical-boson-star-v2-renormalization-prescription.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_ARTIFACT_ID =
  "nhm2.semiclassical_v2.operator_ordering" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_operator_ordering/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_INPUT_ID =
  "operator_ordering" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_PHASE =
  "stage_2_preexecution_candidate_specific_ordering_with_typed_derivation_blockers" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING_PINS =
  Object.freeze({
    candidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    candidateFreezeCanonicalSizeBytes: 55_997,
    constraintFormulationSha256:
      "736ce86009ef09e4e7222bebc12638b8889f7129db6443160b1856585aae45ff",
    constraintFormulationCanonicalSizeBytes: 11_571,
    renormalizationPrescriptionSha256:
      "0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89",
    renormalizationPrescriptionCanonicalSizeBytes: 10_670,
    renormalizationCountertermsSha256:
      "ce189a901d951d839cba823e32b8b5e56b532bc7cad5b5ae5b1ad372d76afcfa",
    renormalizationCountertermsCanonicalSizeBytes: 10_182,
    regulatorDefinitionSha256:
      "d3b42d5483abde3db51b2755bbf58e0b35f78abd4980da56a750963362d46ade",
    regulatorDefinitionCanonicalSizeBytes: 62_592,
    classicalStructureFunctionsSha256:
      "d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700",
    classicalStructureFunctionsCanonicalSizeBytes: 8_870,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS =
  Object.freeze([
    "primary_source_byte_packet_not_bound",
    "operator_ordering_derivation_packet_not_bound",
    "renormalized_total_effective_action_operator_realization_not_materialized",
    "state_inverse_symplectic_coordinate_chart_and_discretization_derivation_not_bound",
    "equal_time_contact_term_and_boundary_distribution_prescription_not_derived",
    "spatial_quadrature_and_binary64_reduction_order_not_frozen",
    "point_split_constraint_insertion_derivation_not_replayed",
    "anomaly_cancellation_or_absence_not_proved",
    "primary_and_independent_implementations_absent",
    "runtime_manifest_and_scientific_preseal_absent",
    "arrays_replay_and_independent_agreement_absent",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_AUTHORITY_LOCKS =
  Object.freeze({
    sourceAuthority: false as const,
    derivationAuthority: false as const,
    formulaAuthority: false as const,
    implementationAuthority: false as const,
    runtimeAuthority: false as const,
    scientificPresealAuthority: false as const,
    executionAuthority: false as const,
    arrayAuthority: false as const,
    replayAuthority: false as const,
    independentAgreementAuthority: false as const,
    anomalyProofAuthority: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16_384,
    maximumArrayLength: 1_024,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 2_048,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 524_288,
  } as const);

const FREEZE = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const FORMULATION = NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION;
const PRESCRIPTION = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION;
const COUNTERTERMS = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS;
const REGULATOR = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION;
const INPUT_INTERFACE =
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.find(
    ({ inputId }) =>
      inputId === NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_INPUT_ID,
  );
const OPERATOR_DAG_EDGES =
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.filter(
    ({ from }) => from === "operator_ordering",
  ).map((edge) => Object.freeze({ ...edge }));

if (INPUT_INTERFACE == null) {
  throw new Error("nhm2_spherical_v2_operator_ordering_interface_missing");
}

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CONTRACT_VERSION,
  inputId: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_INPUT_ID,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_PHASE,
  authority:
    "canonical_preexecution_evaluation_order_only_without_source_derivation_execution_or_proof_authority",
  maturity:
    "stage_2_candidate_specific_ordering_frozen_but_scientific_derivation_and_executable_reduction_incomplete",
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    geometryId: FREEZE.candidateIdentity.geometryId,
    quantumStateId: FREEZE.candidateIdentity.quantumStateId,
    chartId: FREEZE.candidateIdentity.chartId,
    normalizationId: FREEZE.candidateIdentity.normalizationId,
    samplingBasisId: FREEZE.candidateIdentity.samplingBasisId,
    sourceMode: FREEZE.candidateIdentity.sourceMode,
    declaredLeverOrTileTensorUsed: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  approvedInputInterface: {
    inputId: INPUT_INTERFACE.inputId,
    artifactId: INPUT_INTERFACE.artifactId,
    contractVersion: INPUT_INTERFACE.contractVersion,
  },
  exactUpstreamBindings: {
    candidateFreeze: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    },
    constraintFormulation: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
    },
    renormalizationPrescription: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
    },
    renormalizationCounterterms: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING,
    },
    regulatorDefinition: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
    },
    classicalStructureFunctions: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
    },
  },
  semanticBoundary: {
    orderedObject:
      "Poissonbar_total_brackets_of_renormalized_c_number_total_ADM_plus_state_generators_on_the_frozen_equal_tbar_hypersurface",
    quantumCompositeOperatorProductsOccurOnlyInsidePinnedPointSplitExpectations: true,
    replacePoissonBracketWithUnspecifiedCommutatorAllowed: false,
    inferAnomalyFreedomFromClassicalDiracAlgebraAllowed: false,
    finiteProbeChecksProveFullFunctionalIdentity: false,
    unspecifiedCanonicalQuantizationOrderingSelectedHere: false,
  },
  pointSplitRenormalizedInsertion: {
    selectedMeanRoute:
      PRESCRIPTION.frozenPrescriptionRoutes.selectedImprovedMoretti.routeId,
    smoothRemainder:
      PRESCRIPTION.twoPointAndParametrixNormalization.totalSmoothRemainder,
    symmetricOperator:
      PRESCRIPTION.symmetricPointSplitOperator.selectedOperator,
    countertermTensor: COUNTERTERMS.selectedLocalTensor.exactFormula,
    orderedSteps: [
      "01_construct_S_C_as_S_1_plus_S_2_from_the_frozen_joint_state",
      "02_construct_per_real_H_S_with_ell_equal_mu_inverse_and_no_smooth_w0",
      "03_form_K_C_equal_S_C_minus_2_times_H_S_before_any_coincidence_limit",
      "04_apply_all_x_y_covariant_derivatives_and_D_to_K_C_while_points_remain_split",
      "05_take_x_and_y_to_z_covariant_coincidence_only_after_all_bidifferential_actions",
      "06_construct_Theta_ab_from_the_exact_bound_counterterm_basis_and_coefficients",
      "07_add_Theta_ab_once_to_the_coincident_improved_mean_stress",
      "08_apply_this_composite_operator_prescription_to_each_quantum_expectation_in_the_complete_total_effective_action_generator_realization_before_any_bracket_functional_variation",
    ],
    derivativesBeforeCoincidenceRequired: true,
    coincidenceBeforeDifferentiationAllowed: false,
    explicitV1AddedToImprovedRoute: false,
    bothMeanRoutesAccumulated: false,
    producerSelectedPointSplitReorderAllowed: false,
    precomputedMeanArraySubstitutedForDifferentiableFunctionalAllowed: false,
    completeEffectiveActionOperatorRealization: null,
    sourceDerivationReceipt: null,
  },
  connectedNoiseOrdering: {
    orderedSteps: [
      "01_construct_each_renormalized_point_split_stress_operator_with_the_same_pinned_prescription",
      "02_center_each_operator_as_t_ab_equal_T_ab_ren_minus_omega_T_ab_ren_times_identity",
      "03_form_one_half_times_the_ordered_sum_t_ab_x_t_cd_y_plus_t_cd_y_t_ab_x",
      "04_apply_the_frozen_smearing_and_component_projection_without_injecting_counterterm_arrays",
    ],
    symmetrizationCoefficient: "1/2",
    cNumberCountertermsCancelOnlyAfterExplicitCentering: true,
    countertermArraysInjectedIntoNoise: false,
    unsymmetrizedProductMayReplaceConnectedSymmetrizedNoise: false,
    noiseArrayPresent: false,
  },
  totalPoissonBracketOrdering: {
    definition:
      "Poissonbar_total(F,G)=Poissonbar_ADM(F,G)+inverse(Omegabar_state)(d_state_F,d_state_G)",
    gravityContribution:
      "Poissonbar_ADM(F,G)=integral_d3xbar[(delta_F/delta_qbar_ab)*(delta_G/delta_pibar^ab)-(delta_F/delta_pibar^ab)*(delta_G/delta_qbar_ab)]",
    stateContribution:
      "Poissonbar_state(F,G)=inverse(Omegabar_state)(d_state_F,d_state_G)",
    stateSymplecticForm: FORMULATION.canonicalPhaseSpace.stateSymplecticForm,
    orderedContributionEvaluation: [
      "01_evaluate_first_gravity_q_then_pi_product",
      "02_evaluate_second_gravity_pi_then_q_product",
      "03_subtract_second_gravity_product_from_first",
      "04_evaluate_state_inverse_symplectic_contraction_with_F_as_first_argument_and_G_as_second",
      "05_add_gravity_contribution_then_state_contribution",
    ],
    bothGravityAndStateVariationsRequired: true,
    fixedStateDuringGravityVariationAllowed: false,
    swapArgumentsInsideEitherContributionAllowed: false,
    discardGravityMatterCrossVariationsAllowed: false,
    producerSelectedContributionReorderAllowed: false,
    stateInverseSymplecticCoordinateRealization: null,
    spatialQuadratureAndBinary64ReductionOrder: null,
    executableBracketComplete: false,
  },
  generatorPreparationOrdering: {
    generatorDefinitions: {
      Hamiltonian: FORMULATION.generators.Hamiltonian,
      momentum: FORMULATION.generators.momentum,
      combined: FORMULATION.generators.combined,
    },
    requiredTermOrder: [
      "gravity",
      "coherent_mean_field",
      "renormalized_vacuum",
      "gravity_matter_cross_variations",
      "state_and_geometry_functional_variations",
      "structure_function_targets_are_not_part_of_the_computed_generator",
    ],
    probesHeldAsExternalCNumbersDuringEveryVariation: true,
    geometryAndStateDependenceRetainedThroughEveryNestedVariation: true,
    targetOrResidualArraysMayBeReadDuringGeneratorPreparation: false,
    producerSelectedTermOmissionOrReorderAllowed: false,
  },
  computedBracketFamilies: {
    familyOrder: ["H_H", "H_Hi", "Hi_Hj"],
    componentOrder: ["hamiltonian", "momentum_x", "momentum_y", "momentum_z"],
    H_H: {
      expression: "Poissonbar_total(Hbar_total[N],Hbar_total[M])",
      firstArgument: "Hbar_total[N]",
      secondArgument: "Hbar_total[M]",
      probes: FORMULATION.bracketOperands.H_H,
    },
    H_Hi: {
      expression: "Poissonbar_total(Hbar_total[N],Dbar_total[X])",
      firstArgument: "Hbar_total[N]",
      secondArgument: "Dbar_total[X]",
      probes: FORMULATION.bracketOperands.H_Hi,
    },
    Hi_Hj: {
      expression: "Poissonbar_total(Dbar_total[X],Dbar_total[Y])",
      firstArgument: "Dbar_total[X]",
      secondArgument: "Dbar_total[Y]",
      probes: FORMULATION.bracketOperands.Hi_Hj,
    },
    evaluationRule:
      "evaluate_each_family_sample_and_all_four_components_fresh_in_frozen_family_then_component_order",
    expectedStructuralZerosMustBeSeparatelyDerivedNotFilledOrCopied: true,
    targetArraysMayBeRead: false,
    residualArraysMayBeRead: false,
    reverseOrSymmetryReuseAllowed: false,
  },
  antisymmetryOrdering: {
    componentAndProbeTriples: FORMULATION.identityOperands.probeTriples,
    forward: {
      ordinal: 1,
      expression: "Poissonbar_total(Cbar[xi],Cbar[eta])",
      evaluatedFresh: true,
    },
    reverse: {
      ordinal: 2,
      expression: "Poissonbar_total(Cbar[eta],Cbar[xi])",
      evaluatedFresh: true,
      mayBeSynthesizedByNegatingForward: false,
      mayReuseForwardDerivativeTapeOrArray: false,
    },
    residual: {
      ordinal: 3,
      expression: "server_residual=forward+reverse",
      serverRecomputedOnlyAfterBothRawOperandsAreDecoded: true,
      producerResidualAuthoritative: false,
    },
    targetOrResidualArraysMayBeReadByEitherBracket: false,
  },
  jacobiOrdering: {
    componentAndProbeTriples: FORMULATION.identityOperands.probeTriples,
    term_1: {
      ordinal: 1,
      inner: "Poissonbar_total(Cbar[eta],Cbar[zeta])",
      outer:
        "Poissonbar_total(Cbar[xi],Poissonbar_total(Cbar[eta],Cbar[zeta]))",
    },
    term_2: {
      ordinal: 2,
      inner: "Poissonbar_total(Cbar[zeta],Cbar[xi])",
      outer:
        "Poissonbar_total(Cbar[eta],Poissonbar_total(Cbar[zeta],Cbar[xi]))",
    },
    term_3: {
      ordinal: 3,
      inner: "Poissonbar_total(Cbar[xi],Cbar[eta])",
      outer:
        "Poissonbar_total(Cbar[zeta],Poissonbar_total(Cbar[xi],Cbar[eta]))",
    },
    nestedRule:
      "for_each_term_evaluate_the_inner_generator_as_a_differentiable_functional_then_evaluate_the_outer_bracket_without_collapsing_the_inner_result_to_an_array",
    everyInnerAndOuterBracketEvaluatedFresh: true,
    innerBracketReuseAcrossTermsOrFromAntisymmetryAllowed: false,
    cyclicPermutationMayBeSynthesizedFromAnotherTerm: false,
    targetOrResidualArraysMayBeRead: false,
    residual: {
      ordinal: 4,
      expression: "server_residual=term_1+term_2+term_3",
      additionOrder: "left_associated_term_1_plus_term_2_then_plus_term_3",
      serverRecomputedOnlyAfterAllThreeRawTermsAreDecoded: true,
      producerResidualAuthoritative: false,
    },
  },
  classicalTargetAndResidualSeparation: {
    targetFamilyOrder: ["H_H", "H_Hi", "Hi_Hj"],
    targetSource:
      "exact_bound_classical_structure_functions_plus_sealed_geometry_and_external_probes_only",
    targetMayReadComputedOrResidualArrays: false,
    computedMayReadTargetOrResidualArrays: false,
    identityOperandsMayReadTargetOrResidualArrays: false,
    serverReplayOrder: [
      "01_decode_and_validate_all_primitive_operand_bytes",
      "02_recompute_classical_targets_from_the_exact_bound_structure_functions",
      "03_recompute_H_H_H_Hi_and_Hi_Hj_residuals_as_computed_minus_target",
      "04_recompute_antisymmetry_residual_as_forward_plus_reverse",
      "05_recompute_jacobi_residual_left_associated_as_term_1_plus_term_2_then_plus_term_3",
      "06_compare_producer_residual_files_only_for_mismatch_rejection",
    ],
    producerTargetOrResidualSummaryAuthority: false,
  },
  regulatorChronology: {
    levelOrder: REGULATOR.levels.map(({ ordinal, levelId, hExact }) => ({
      ordinal,
      levelId,
      hExact,
    })),
    familyOrder: [...REGULATOR.familyOrder],
    operandRoleOrder: Object.fromEntries(
      Object.entries(REGULATOR.operandRoleOrder).map(([family, roles]) => [
        family,
        [...roles],
      ]),
    ),
    orderedStepsPerLevel: [
      "01_materialize_the_level_regulator_from_its_frozen_h_without_reading_any_result",
      "02_construct_point_split_renormalized_generator_inputs_at_that_same_level",
      "03_evaluate_H_H_then_H_Hi_then_Hi_Hj_in_component_order",
      "04_evaluate_antisymmetry_forward_then_reverse",
      "05_evaluate_jacobi_term_1_then_term_2_then_term_3",
      "06_emit_primitive_operands_in_the_frozen_family_and_operand_role_inventory",
      "07_finish_the_entire_level_before_beginning_the_next_finer_level",
    ],
    levelsEvaluatedCoarseToFine: true,
    parallelOrProducerSelectedLevelOrderAllowed: false,
    crossLevelOperandSymmetryDerivativeTapeOrArrayReuseAllowed: false,
    postObservationRegulatorOrOrderingRetuneAllowed: false,
    serverConvergenceEvaluationOnlyAfterAllThreeLevelsDecoded: true,
  },
  forbiddenShortcuts: {
    producerSelectedReorder: false,
    commutativityOrAntisymmetryReuse: false,
    jacobiCyclicReuse: false,
    expectedZeroFill: false,
    targetArrayRead: false,
    residualArrayRead: false,
    crossLevelArrayReuse: false,
    derivedOnlySubmission: false,
    outputDependentRescaling: false,
    postObservationRetuning: false,
  },
  derivationAuthority: {
    frozenBaseDagEdges: OPERATOR_DAG_EDGES,
    baseDagEdgeRoles: ["computed_constraint_ordering", "anomaly_ordering"],
    primarySourceBytePacketBinding: null,
    derivationPacketBinding: null,
    serverReplayReceipt: null,
    independentDerivationAgreementReceipt: null,
    derivationWitnessPresent: false,
    anomalyProofPresent: false,
    complete: false,
  },
  materialization: {
    canonicalOrderingBytesPresent: true,
    frozenBeforeCandidateExecution: true,
    primarySourceBytesPresent: false,
    primarySourceBytePacketBinding: null,
    derivationPresent: false,
    derivationReceipt: null,
    implementationPresent: false,
    implementationBinding: null,
    independentImplementationPresent: false,
    independentImplementationBinding: null,
    runtimeBound: false,
    runtimeManifest: null,
    scientificPresealComplete: false,
    scientificPresealReceipt: null,
    executionAuthorized: false,
    executionObserved: false,
    executionReceipt: null,
    arraysPresent: false,
    arrayManifest: null,
    replayPerformed: false,
    replayReceipt: null,
    independentAgreement: false,
    independentAgreementReceipt: null,
    lampsPromoted: false,
  },
  completion: {
    deterministicSymbolicCallOrderFrozen: true,
    pointSplitInsertionOrderFrozen: true,
    regulatorChronologyFrozen: true,
    sourceAndDerivationClosureComplete: false,
    executableNumericalOrderingComplete: false,
    anomalyAnalysisComplete: false,
    scientificInputComplete: false,
    candidateExecutionMayStart: false,
    blockersAreTypedAndFailClosed: true,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2OperatorOrderingV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING);
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-operator-ordering/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256_DOMAIN, "utf8")
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_SHA256 =
  "ea9600151d59c6692190673658bed861904b4261de9dcda92a52bf093aa2dd0e" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_CANONICAL_SIZE_BYTES =
  17_662 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CONTRACT_VERSION,
    inputId: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_INPUT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { nodes: number; utf8Bytes: number };

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
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_VALIDATOR_LIMITS;
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
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value === "string") {
    const byteLength = Buffer.byteLength(value, "utf8");
    if (byteLength > limits.maximumStringUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `string_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += byteLength;
    return budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
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
      violation: `cycle_forbidden:${pointer || "/"}`,
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
    if (
      keys.some((key) => typeof key !== "string") ||
      keys.length !== length + 1
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
  if (
    keys.some((key) => typeof key !== "string") ||
    keys.length > limits.maximumObjectPropertyCount
  ) {
    return Object.freeze({
      ok: false,
      violation: `object_surface:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const keyByteLength = Buffer.byteLength(key, "utf8");
    budget.utf8Bytes += keyByteLength;
    if (
      keyByteLength > limits.maximumPropertyKeyUtf8Bytes ||
      budget.utf8Bytes > limits.maximumAggregateUtf8Bytes
    ) {
      return Object.freeze({
        ok: false,
        violation: `property_or_aggregate_byte_limit:${pointer || "/"}`,
      });
    }
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
        violation: `object_entry_surface:${pointer}/${key}`,
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

const assertInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING_PINS;
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING;
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.candidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.candidateFreezeCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256 !==
      pins.constraintFormulationSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES !==
      pins.constraintFormulationCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256 !==
      pins.renormalizationPrescriptionSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES !==
      pins.renormalizationPrescriptionCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256 !==
      pins.renormalizationCountertermsSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES !==
      pins.renormalizationCountertermsCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256 !==
      pins.regulatorDefinitionSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES !==
      pins.regulatorDefinitionCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256 !==
      pins.classicalStructureFunctionsSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES !==
      pins.classicalStructureFunctionsCanonicalSizeBytes
  ) {
    throw new Error("nhm2_spherical_v2_operator_ordering_dependency_pin_drift");
  }
  if (
    INPUT_INTERFACE.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_ARTIFACT_ID ||
    INPUT_INTERFACE.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CONTRACT_VERSION ||
    !NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS.includes(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_INPUT_ID,
    ) ||
    contract.candidateIdentity.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID
  ) {
    throw new Error("nhm2_spherical_v2_operator_ordering_interface_invariant");
  }
  if (
    contract.totalPoissonBracketOrdering.executableBracketComplete !== false ||
    contract.totalPoissonBracketOrdering
      .stateInverseSymplecticCoordinateRealization !== null ||
    contract.totalPoissonBracketOrdering
      .spatialQuadratureAndBinary64ReductionOrder !== null ||
    contract.antisymmetryOrdering.reverse.mayBeSynthesizedByNegatingForward !==
      false ||
    contract.jacobiOrdering
      .innerBracketReuseAcrossTermsOrFromAntisymmetryAllowed !== false ||
    contract.classicalTargetAndResidualSeparation
      .computedMayReadTargetOrResidualArrays !== false ||
    contract.completion.scientificInputComplete !== false
  ) {
    throw new Error("nhm2_spherical_v2_operator_ordering_science_invariant");
  }
  if (
    Object.values(contract.authorityLocks).some((value) => value !== false) ||
    contract.materialization.implementationPresent !== false ||
    contract.materialization.implementationBinding !== null ||
    contract.materialization.runtimeManifest !== null ||
    contract.materialization.scientificPresealReceipt !== null ||
    contract.materialization.arraysPresent !== false ||
    contract.materialization.replayReceipt !== null ||
    contract.materialization.lampsPromoted !== false
  ) {
    throw new Error("nhm2_spherical_v2_operator_ordering_authority_invariant");
  }
  if (
    OPERATOR_DAG_EDGES.length !== 2 ||
    OPERATOR_DAG_EDGES.map(({ relation }) => relation).join("|") !==
      "computed_constraint_ordering|anomaly_ordering"
  ) {
    throw new Error("nhm2_spherical_v2_operator_ordering_dag_invariant");
  }
};

assertInvariants();

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_operator_ordering_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES}`,
  );
}

export const nhm2SphericalBosonStarV2OperatorOrderingViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (!snapshot.ok) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_JSON
      ? []
      : ["spherical_v2_operator_ordering_semantic_drift"];
  } catch {
    return ["spherical_v2_operator_ordering_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2OperatorOrderingV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2OperatorOrderingV1 =>
  nhm2SphericalBosonStarV2OperatorOrderingViolations(value).length === 0;

export const cloneNhm2SphericalBosonStarV2OperatorOrdering = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2OperatorOrderingV1;
