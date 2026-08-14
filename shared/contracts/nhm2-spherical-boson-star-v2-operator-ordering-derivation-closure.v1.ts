import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
} from "./nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
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
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256,
} from "./nhm2-spherical-boson-star-v2-operator-ordering.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256,
} from "./nhm2-spherical-boson-star-v2-regulator-definition.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256,
} from "./nhm2-spherical-boson-star-v2-renormalization-counterterms.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
} from "./nhm2-spherical-boson-star-v2-renormalization-prescription.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_ARTIFACT_ID =
  "nhm2.semiclassical_v2.operator_ordering_derivation_closure" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_operator_ordering_derivation_closure/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_PHASE =
  "stage_2_preexecution_additive_dependency_overlay_with_fail_closed_operator_gaps" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING_PINS =
  Object.freeze({
    candidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    candidateFreezeCanonicalSizeBytes: 55_997,
    constraintFormulationSha256:
      "736ce86009ef09e4e7222bebc12638b8889f7129db6443160b1856585aae45ff",
    constraintFormulationCanonicalSizeBytes: 11_571,
    baseOperatorOrderingSha256:
      "ea9600151d59c6692190673658bed861904b4261de9dcda92a52bf093aa2dd0e",
    baseOperatorOrderingCanonicalSizeBytes: 17_662,
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
    scienceDerivationDagSha256:
      "c0a656b833f380239bed1d3aac321b7a2361fa6b0bf2026355a0dcc4d0d32ce7",
    inspectedSourceManifestFileSha256:
      "43c1e79ce8bc1562dce56f478baf1ae454a69e77161a7c87a933d4d1ef054bad",
    inspectedSourceManifestFileSizeBytes: 11_332,
    inspectedSourcePacketContentIdentitySha256:
      "06980af3a986ab3e657c8bb40faeee681b66334e13e95e79b402deeecbaedfd8",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_REQUEST =
  Object.freeze(
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.derivationAuthority.candidateSpecificRequiredEdgeOverlay.map(
      (edge) => Object.freeze({ ...edge }),
    ),
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY =
  Object.freeze(
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_REQUEST.map(
      ({ from, to, role }) => Object.freeze({ from, to, relation: role }),
    ),
  );

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-operator-ordering-derivation-dag-overlay/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      canonicalJson(
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY,
      ),
      "utf8",
    )
    .digest("hex");

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BLOCKERS =
  Object.freeze([
    Object.freeze({
      blockerId: "candidate_specific_primary_source_byte_packet_absent",
      surface: "source_bytes",
      upstreamEvidence:
        "no_candidate_specific_spherical_boson_star_operator_or_constraint_derivation_source_packet_is_present",
      requiredResolution:
        "exact_candidate_specific_source_manifest_source_bytes_equation_anchors_transcription_hashes_and_admitted_local_byte_receipt",
      disposition: "block_scientific_input_closure_and_candidate_execution",
    }),
    Object.freeze({
      blockerId: "inspected_source_packet_candidate_family_mismatch",
      surface: "source_bytes",
      upstreamEvidence:
        "the_only_inspected_manifest_declares_candidateFamily_nhm2_conformally_flat_needle_not_the_frozen_spherical_boson_star_candidate",
      requiredResolution:
        "a_new_packet_whose_declared_candidate_family_and_consuming_contracts_exactly_cover_this_candidate_operator_realization",
      disposition: "reject_packet_as_operator_derivation_authority",
    }),
    Object.freeze({
      blockerId: "inspected_source_packet_local_byte_receipt_absent",
      surface: "source_bytes",
      upstreamEvidence:
        "manifest_status_is_manifest_pinned_local_receipt_absent_and_the_default_local_cache_is_absent",
      requiredResolution:
        "server_admitted_receipt_after_reopening_and_rehashing_every_exact_local_source_artifact",
      disposition: "reject_manifest_identity_as_source_byte_proof",
    }),
    Object.freeze({
      blockerId: "operator_ordering_derivation_packet_absent",
      surface: "derivation",
      upstreamEvidence:
        "base_operator_ordering.derivationAuthority.derivationPacketBinding_is_null",
      requiredResolution:
        "candidate_specific_symbolic_derivation_transcript_bound_to_the_exact_source_bytes_and_all_frozen_science_inputs",
      disposition: "block_scientific_input_closure_and_candidate_execution",
    }),
    Object.freeze({
      blockerId:
        "renormalized_total_effective_action_operator_realization_absent",
      surface: "effective_action",
      upstreamEvidence:
        "base_operator_ordering.pointSplitRenormalizedInsertion.completeEffectiveActionOperatorRealization_is_null",
      requiredResolution:
        "complete_differentiable_ADM_plus_state_generator_realization_including_vacuum_cross_and_counterterm_variations",
      disposition: "block_executable_bracket_and_candidate_execution",
    }),
    Object.freeze({
      blockerId:
        "state_inverse_symplectic_coordinate_chart_and_discretization_absent",
      surface: "state_symplectic_inverse",
      upstreamEvidence:
        "the_frozen_state_names_projective_Hilbert_coherent_mean_and_Gaussian_two_point_data_but_does_not_select_coordinates_gauge_quotient_mode_basis_truncation_or_inverse_matrix_entries",
      requiredResolution:
        "exact_real_coordinate_vector_order_projective_phase_gauge_mode_basis_truncation_two_point_parameterization_symplectic_matrix_and_inverse_contraction_algorithm",
      disposition:
        "block_executable_state_Poisson_bracket_and_candidate_execution",
    }),
    Object.freeze({
      blockerId:
        "equal_time_contact_and_boundary_distribution_prescription_absent",
      surface: "distributional_bracket",
      upstreamEvidence:
        "point_split_mean_rules_and_asymptotically_flat_variational_boundary_terms_do_not_define_equal_tbar_delta_derivatives_contact_extension_integration_by_parts_or_numerical_outer_boundary_disposition",
      requiredResolution:
        "source_derived_equal_time_distribution_test_space_contact_extension_derivative_sign_integration_by_parts_and_asymptotic_boundary_limit_prescription",
      disposition:
        "block_executable_constraint_insertion_and_candidate_execution",
    }),
    Object.freeze({
      blockerId:
        "spatial_quadrature_weights_and_binary64_reduction_order_absent",
      surface: "numerical_reduction",
      upstreamEvidence:
        "the_64_frozen_sampling_centers_order_output_probes_only_and_no_spatial_integration_nodes_weights_cell_measure_or_binary64_accumulation_tree_is_frozen",
      requiredResolution:
        "exact_spatial_domain_nodes_weights_metric_measure_derivative_discretization_term_order_fma_policy_and_left_or_tree_binary64_reduction_sequence",
      disposition: "block_executable_bracket_and_candidate_execution",
    }),
    Object.freeze({
      blockerId: "point_split_constraint_insertion_derivation_not_replayed",
      surface: "derivation_replay",
      upstreamEvidence:
        "no_server_recomputed_witness_connects_the_pinned_point_split_stress_prescription_to_every_total_constraint_generator_variation",
      requiredResolution:
        "server_replay_and_source_disjoint_independent_agreement_for_every_insertion_and_nested_variation",
      disposition: "block_derivation_authority_and_candidate_execution",
    }),
    Object.freeze({
      blockerId: "anomaly_cancellation_or_absence_not_proved",
      surface: "anomaly",
      upstreamEvidence:
        "the_base_science_DAG_requires_constraint_anomaly_evidence_and_no_replay_or_independent_agreement_exists",
      requiredResolution:
        "regulated_byte_level_anomaly_assessment_with_counterterm_binding_server_replay_and_independent_agreement",
      disposition: "block_anomaly_authority_and_candidate_execution",
    }),
    Object.freeze({
      blockerId: "primary_and_independent_implementations_absent",
      surface: "implementation",
      upstreamEvidence:
        "base_operator_ordering_materialization_has_no_primary_or_independent_implementation_binding",
      requiredResolution:
        "source_disjoint_implementation_source_dependency_lock_executable_and_runtime_closure_bindings",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "runtime_manifest_and_scientific_preseal_absent",
      surface: "preexecution",
      upstreamEvidence:
        "base_operator_ordering_materialization_runtimeManifest_and_scientificPresealReceipt_are_null",
      requiredResolution:
        "authenticated_runtime_loader_observation_complete_input_manifest_and_server_persisted_preexecution_seal",
      disposition: "block_candidate_execution",
    }),
    Object.freeze({
      blockerId: "arrays_replay_and_independent_agreement_absent",
      surface: "postexecution_evidence",
      upstreamEvidence:
        "no_candidate_execution_arrays_server_replay_receipt_or_independent_pair_agreement_exists",
      requiredResolution:
        "one_frozen_attempt_exact_byte_replay_and_source_disjoint_numeric_agreement_without_retuning",
      disposition: "block_lamps_and_all_claims",
    }),
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_AUTHORITY_LOCKS =
  Object.freeze({
    sourceAuthority: false as const,
    derivationAuthority: false as const,
    formulaAuthority: false as const,
    effectiveActionAuthority: false as const,
    stateSymplecticInverseAuthority: false as const,
    contactDistributionAuthority: false as const,
    numericalReductionAuthority: false as const,
    anomalyProofAuthority: false as const,
    implementationAuthority: false as const,
    runtimeAuthority: false as const,
    scientificPresealAuthority: false as const,
    executionAuthority: false as const,
    arrayAuthority: false as const,
    replayAuthority: false as const,
    independentAgreementAuthority: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16_384,
    maximumArrayLength: 1_024,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 2_048,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 524_288,
  } as const);

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CONTRACT_VERSION,
  phase:
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_PHASE,
  authority:
    "additive_candidate_specific_dependency_edge_approval_only_without_source_derivation_formula_execution_or_claim_authority",
  maturity:
    "stage_2_candidate_specific_DAG_overlay_closed_operator_realization_and_numerical_semantics_blocked",
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverOrTileTensorUsed: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  exactUpstreamBindings: {
    candidateFreeze: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    },
    constraintFormulation: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
    },
    baseOperatorOrdering: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
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
    scienceDerivationDag: {
      sha256: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
      role: "immutable_base_DAG_identity_not_derivation_or_replay_evidence",
    },
  },
  additiveDerivationDagOverlay: {
    baseDagSha256: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
    baseDagMutated: false,
    overlayOnly: true,
    overlaySha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_SHA256,
    requestedEdges:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_REQUEST,
    edges:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY,
    edgeCount: 3,
    roleToRelationMapping:
      "approved_relation_is_the_request_role_copied_exactly_without_rewrite",
    exactRequiredOrder: ["geometry", "chart", "sampling_basis"],
    approvalStatus:
      "approved_as_complete_candidate_specific_direct_input_overlay_for_computed_bracket_operands_witness",
    approvalScope:
      "dependency_edge_identity_and_acyclicity_only_not_a_derivation_witness_replay_receipt_or_formula_authority",
    additionalDirectInputEdgesAllowed: false,
    unionGraphAcyclic: true,
    resolvesConstraintFormulationBlocker:
      "science_derivation_authority_successor_for_computed_geometry_chart_and_sampling_edges_absent",
    derivationWitnessPresent: false,
    grantsExecutionOrReplayAuthority: false,
  },
  inspectedSourcePacket: {
    manifestRelativePath:
      "configs/research/nhm2-semiclassical-primary-source-byte-packet.v1.json",
    manifestFileSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING_PINS.inspectedSourceManifestFileSha256,
    manifestFileSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING_PINS.inspectedSourceManifestFileSizeBytes,
    schemaVersion: "nhm2_semiclassical_primary_source_byte_packet/1",
    packetId:
      "nhm2_conformally_flat_needle_semiclassical_primary_source_bytes_v1",
    packetContentIdentitySha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING_PINS.inspectedSourcePacketContentIdentitySha256,
    declaredCandidateFamily: "nhm2_conformally_flat_needle",
    requiredCandidateFamily: "nhm2_spherical_boson_star",
    candidateFamilyMatches: false,
    manifestStatus: "manifest_pinned_local_receipt_absent",
    defaultLocalCachePresentAtInspection: false,
    admittedLocalByteReceipt: null,
    allDeclaredLocalBytesVerified: false,
    formulaInterpretationVerified: false,
    distributionalEquivalenceVerified: false,
    consumerBindingAdmitted: false,
    exactManifestIdentityIsSourceFormulaProof: false,
    disposition:
      "exactly_bound_as_rejected_inspected_evidence_not_as_this_candidate_source_packet",
  },
  closedSurface: {
    surfaceId:
      "computed_bracket_operands_witness_candidate_specific_direct_input_DAG_overlay",
    closedSemantics:
      "the_computed_total_constraint_witness_directly_depends_on_the_frozen_candidate_geometry_chart_and_sampling_basis_in_that_order_in_addition_to_the_immutable_base_DAG_edges",
    closureKind: "static_dependency_graph_semantics_only",
    numericOrScientificDerivationEvidenceCreated: false,
    implementationOrExecutionAuthorityCreated: false,
  },
  unresolvedOperatorRealization: {
    baseSymbolicCallOrderFrozen: true,
    basePointSplitChronologyFrozen: true,
    baseRegulatorChronologyFrozen: true,
    completeEffectiveActionOperatorRealization: null,
    stateInverseSymplecticCoordinateRealization: null,
    equalTimeContactAndBoundaryDistributionPrescription: null,
    spatialQuadratureAndBinary64ReductionOrder: null,
    pointSplitConstraintInsertionDerivation: null,
    anomalyCancellationOrAbsenceProof: null,
    stateInverseSymplecticMissingFields: [
      "real_coordinate_vector_and_order",
      "projective_phase_gauge_fixing",
      "mode_basis_and_truncation",
      "coherent_mean_parameterization",
      "Gaussian_two_point_parameterization_and_reality_constraints",
      "symplectic_matrix_entries",
      "inverse_or_linear_solve_algorithm",
      "F_first_G_second_contraction_index_order",
    ],
    contactAndBoundaryMissingFields: [
      "equal_tbar_distribution_test_space",
      "delta_and_delta_derivative_sign_convention",
      "coincident_contact_extension",
      "integration_by_parts_order",
      "origin_boundary_distribution",
      "asymptotic_infinity_limit",
      "finite_numerical_outer_boundary_disposition",
    ],
    numericalReductionMissingFields: [
      "spatial_integration_domain",
      "nodes_and_enumeration",
      "quadrature_weights",
      "metric_measure_evaluation",
      "derivative_discretization",
      "term_and_component_accumulation_order",
      "fused_multiply_add_policy",
      "binary64_reduction_tree",
    ],
    frozenSamplingCenterOrderMaySubstituteForSpatialQuadrature: false,
    producerSelectedDefaultsAllowed: false,
  },
  derivationAndEvidenceBoundary: {
    sourcePacketAdmitted: false,
    derivationPacketPresent: false,
    completeEffectiveActionPresent: false,
    stateInverseSymplecticRealizationPresent: false,
    contactDistributionPrescriptionPresent: false,
    numericalReductionOrderPresent: false,
    pointSplitInsertionReplayPresent: false,
    anomalyProofPresent: false,
    primaryImplementationPresent: false,
    independentImplementationPresent: false,
    runtimeManifestPresent: false,
    scientificPresealPresent: false,
    executionObserved: false,
    arraysPresent: false,
    replayReceiptPresent: false,
    independentAgreementPresent: false,
  },
  completion: {
    candidateSpecificComputedWitnessOverlayClosed: true,
    sourceAndDerivationClosureComplete: false,
    executableNumericalOrderingComplete: false,
    anomalyAnalysisComplete: false,
    operatorOrderingScientificInputComplete: false,
    candidateExecutionMayStart: false,
    theoryGraphLampPromotionAllowed: false,
    physicalClaimUnlockAllowed: false,
    blockersAreTypedAndFailClosed: true,
  },
  blockers:
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE;

export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_JSON =
  canonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-operator-ordering-derivation-closure/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_SHA256 =
  "70aee3e44231eaa537964595acd6378394c4f7a8fabeb5d79307b7966d6ac3eb" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_CANONICAL_SIZE_BYTES =
  16_310 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256_DOMAIN,
    sha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

type DagEdge = Readonly<{ from: string; to: string; relation: string }>;

const graphIsAcyclic = (edges: readonly DagEdge[]): boolean => {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const { from, to } of edges) {
    if (!adjacency.has(from)) adjacency.set(from, []);
    if (!adjacency.has(to)) adjacency.set(to, []);
    adjacency.get(from)!.push(to);
    indegree.set(from, indegree.get(from) ?? 0);
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
  }
  const queue = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([node]) => node);
  let visited = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited += 1;
    for (const target of adjacency.get(node) ?? []) {
      const next = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, next);
      if (next === 0) queue.push(target);
    }
  }
  return visited === indegree.size;
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING_PINS;
  const contract =
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE;
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.candidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.candidateFreezeCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256 !==
      pins.constraintFormulationSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES !==
      pins.constraintFormulationCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256 !==
      pins.baseOperatorOrderingSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES !==
      pins.baseOperatorOrderingCanonicalSizeBytes ||
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
      pins.classicalStructureFunctionsCanonicalSizeBytes ||
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 !==
      pins.scienceDerivationDagSha256
  ) {
    throw new Error(
      "nhm2_spherical_v2_operator_derivation_closure_dependency_pin_drift",
    );
  }

  const overlay = [
    ...NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY,
  ];
  const overlayRequest = [
    ...NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_REQUEST,
  ];
  const requested = [
    ...NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.derivationAuthority
      .candidateSpecificRequiredEdgeOverlay,
  ];
  const baseContainsOverlay = overlay.some((candidate) =>
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.some(
      (base) =>
        base.from === candidate.from &&
        base.to === candidate.to &&
        base.relation === candidate.relation,
    ),
  );
  if (
    canonicalJson(overlayRequest) !== canonicalJson(requested) ||
    canonicalJson(overlay) !==
      canonicalJson(
        overlayRequest.map(({ from, to, role }) => ({
          from,
          to,
          relation: role,
        })),
      ) ||
    overlay.length !== 3 ||
    overlay.map(({ from }) => from).join("|") !==
      "geometry|chart|sampling_basis" ||
    overlay.some(({ to }) => to !== "computed_bracket_operands_witness") ||
    baseContainsOverlay ||
    !graphIsAcyclic([
      ...NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
      ...overlay,
    ]) ||
    contract.additiveDerivationDagOverlay.baseDagMutated !== false ||
    contract.additiveDerivationDagOverlay.additionalDirectInputEdgesAllowed !==
      false ||
    contract.additiveDerivationDagOverlay.derivationWitnessPresent !== false ||
    contract.additiveDerivationDagOverlay.grantsExecutionOrReplayAuthority !==
      false
  ) {
    throw new Error(
      "nhm2_spherical_v2_operator_derivation_closure_overlay_invariant",
    );
  }

  if (
    contract.inspectedSourcePacket.candidateFamilyMatches !== false ||
    contract.inspectedSourcePacket.admittedLocalByteReceipt !== null ||
    contract.inspectedSourcePacket.allDeclaredLocalBytesVerified !== false ||
    contract.inspectedSourcePacket.consumerBindingAdmitted !== false ||
    contract.inspectedSourcePacket.exactManifestIdentityIsSourceFormulaProof !==
      false ||
    contract.unresolvedOperatorRealization
      .completeEffectiveActionOperatorRealization !== null ||
    contract.unresolvedOperatorRealization
      .stateInverseSymplecticCoordinateRealization !== null ||
    contract.unresolvedOperatorRealization
      .equalTimeContactAndBoundaryDistributionPrescription !== null ||
    contract.unresolvedOperatorRealization
      .spatialQuadratureAndBinary64ReductionOrder !== null ||
    contract.unresolvedOperatorRealization
      .frozenSamplingCenterOrderMaySubstituteForSpatialQuadrature !== false ||
    contract.completion.sourceAndDerivationClosureComplete !== false ||
    contract.completion.executableNumericalOrderingComplete !== false ||
    contract.completion.operatorOrderingScientificInputComplete !== false ||
    contract.completion.candidateExecutionMayStart !== false ||
    Object.values(contract.authorityLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_v2_operator_derivation_closure_authority_invariant",
    );
  }

  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.totalPoissonBracketOrdering
      .stateInverseSymplecticCoordinateRealization !== null ||
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.totalPoissonBracketOrdering
      .spatialQuadratureAndBinary64ReductionOrder !== null ||
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING
      .pointSplitRenormalizedInsertion
      .completeEffectiveActionOperatorRealization !== null
  ) {
    throw new Error(
      "nhm2_spherical_v2_operator_derivation_closure_upstream_gap_drift",
    );
  }
};

assertInvariants();

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_operator_derivation_closure_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_SIZE_BYTES}`,
  );
}

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
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_VALIDATOR_LIMITS;
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

export const nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations =
  (value: unknown): string[] => {
    try {
      const snapshot = snapshotPlainData(value);
      if (!snapshot.ok) return [snapshot.violation];
      return canonicalJson(snapshot.value) ===
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_JSON
        ? []
        : ["spherical_v2_operator_derivation_closure_semantic_drift"];
    } catch {
      return ["spherical_v2_operator_derivation_closure_snapshot_invalid"];
    }
  };

export const isNhm2SphericalBosonStarV2OperatorOrderingDerivationClosureV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureV1 =>
  nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(value)
    .length === 0;

export const cloneNhm2SphericalBosonStarV2OperatorOrderingDerivationClosure =
  () =>
    JSON.parse(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_JSON,
    ) as Nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureV1;
