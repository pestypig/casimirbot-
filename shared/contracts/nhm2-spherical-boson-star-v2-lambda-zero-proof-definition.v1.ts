import { createHash } from "node:crypto";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256,
} from "./nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1";

/**
 * Program gate: G2 — classical branch proof and terminal state
 * Workstream: lambda-zero limiting-ground-state proof closure
 * Capability or component: four-part lambda-zero proof definition successor
 * Current maturity: definition-only, uninstantiated, authority-neutral
 * Target maturity: sealed ABI for independently replayed proof implementations
 * Required frozen inputs: repaired vacuum ABI, Newtonian directed proof and
 *   operator successor, and the reviewed lambda-zero closure proposal
 * Required evidence: exact semantic/raw bindings, four non-substitutable proof
 *   duties, exact receipt schemas, null instances, and false authority locks
 * Stop/fail criteria: dependency drift, conflated kernel/invertibility claim,
 *   nonnegative transversality, missing first-tube inclusion, or promotion
 * Explicit non-goals: proof execution, seed acceptance, tube construction,
 *   candidate admission, Theory Graph lamp, or physical authority
 * Downstream gate unlocked: primary and independent lambda-zero proof kernels
 */

export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_lambda_zero_proof_definition" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_VERSION =
  "nhm2_spherical_boson_star_v2_lambda_zero_proof_definition/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_DOMAIN =
  "nhm2-spherical-boson-star-v2-lambda-zero-proof-definition/v1\n" as const;

const RAW_DEPENDENCY_BINDINGS = Object.freeze({
  lambdaZeroClosureProposal: Object.freeze({
    path: "docs/research/nhm2-spherical-boson-star-v2-g2-d-lambda-zero-closure-proposal.md",
    rawSha256:
      "1d5694347fbdb97d7c4d9a0ab88f4f3cae937fdcf400a5371aebd3c11afb5591",
    sizeBytes: 7_314,
  }),
  newtonianDirectedProof: Object.freeze({
    path: "shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1.ts",
    rawSha256:
      "0b51f6df4cf6ded8c0008e4392f5e08f8752a30259d0deba829edf7689707853",
    sizeBytes: 61_403,
  }),
  newtonianDirectedProofOperator: Object.freeze({
    path: "shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1.ts",
    rawSha256:
      "084e1b32a15955fd9867f9616a4ec01bb986a12fa347162df92efed7c1d430a1",
    sizeBytes: 54_712,
  }),
  vacuumContinuationProofAbi: Object.freeze({
    path: "shared/contracts/nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1.ts",
    rawSha256:
      "44c6392b56fe31a193e83e298effdd3dcc0b67c7cc684a45558a2ca2e48a8a81",
    sizeBytes: 46_152,
  }),
} as const);

const BLOCKERS = Object.freeze([
  "accepted_newtonian_ground_state_product_absent",
  "fixed_potential_simple_kernel_receipt_absent",
  "normalized_coupled_jacobian_inverse_receipt_absent",
  "bifurcation_transversality_receipt_absent",
  "lambda_zero_tangent_receipt_absent",
  "first_tube_uniform_radius_and_containment_receipt_absent",
  "primary_and_independent_implementation_runtime_preseal_absent",
  "source_disjoint_replay_and_agreement_absent",
] as const);

const INSTANCES = Object.freeze({
  agreementReceiptBinding: null,
  firstTubeContainmentReceiptBinding: null,
  groundStateReceiptBinding: null,
  independentImplementationBinding: null,
  independentReceiptBinding: null,
  independentRuntimeBinding: null,
  normalizedCoupledJacobianReceiptBinding: null,
  preexecutionPresealBinding: null,
  primaryImplementationBinding: null,
  primaryReceiptBinding: null,
  primaryRuntimeBinding: null,
  simpleKernelReceiptBinding: null,
  tangentReceiptBinding: null,
  transversalityReceiptBinding: null,
} as const);

const AUTHORITY_LOCKS = Object.freeze({
  branchAccepted: false,
  candidateAdmissionAuthorized: false,
  candidateExecuted: false,
  diagnosticPass: false,
  firstTubeAccepted: false,
  groundStateAccepted: false,
  independentAgreementAccepted: false,
  lambdaZeroProductReady: false,
  physicalViability: false,
  proofExecutionAuthorized: false,
  propulsion: false,
  semiclassicalConstraintAlgebraLamp: false,
  semiclassicalStressNoiseLamp: false,
  theoryGraphAuthority: false,
  transport: false,
} as const);

const DEFINITION = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_ARTIFACT_ID,
  authorityLocks: AUTHORITY_LOCKS,
  blockers: BLOCKERS,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_BINDING.candidateId,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_VERSION,
  exactDependencyBindings: {
    lambdaZeroClosureProposal:
      RAW_DEPENDENCY_BINDINGS.lambdaZeroClosureProposal,
    newtonianDirectedProof: {
      ...RAW_DEPENDENCY_BINDINGS.newtonianDirectedProof,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
      semanticSha256:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
    },
    newtonianDirectedProofOperator: {
      ...RAW_DEPENDENCY_BINDINGS.newtonianDirectedProofOperator,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
      semanticSha256:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
    },
    vacuumContinuationProofAbi: {
      ...RAW_DEPENDENCY_BINDINGS.vacuumContinuationProofAbi,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES,
      plainCanonicalSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PLAIN_CANONICAL_SHA256,
      semanticSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256,
    },
  },
  firstTubeContainmentDefinition: {
    cellIdentity: "I_0=[0,2^-15]",
    chronology: [
      "accept_lambda_zero_ground_state_and_all_three_linear_receipts",
      "construct_exact_packed_state_and_tangent_embedding",
      "persist_and_rehash_first_cell_center",
      "compute_first_cell_uniform_Y_Z0_Z1_Z2_for_all_73_radii",
      "select_lowest_ordinal_strictly_valid_radius_without_early_stop",
      "prove_embedded_state_and_tangent_inside_the_same_selected_tube",
      "prove_right_oriented_face_compatibility_with_t_lambda_equal_one",
    ],
    containmentNorm:
      "the_exact_G2_D_weighted_l1_product_norm_with_chi=17/16_and_all_component_weights_one",
    exactStateEmbedding: {
      core: "u0,V0,-V0_are_mapped_to_core_AU,core_AH,core_AV1_by_the_frozen_desingularized_operator_and_G2_D_packing_without_sampling_or_refitting",
      scalarOrder: ["a", "b", "nu", "m", "c"],
      scalars:
        "nu=nu0,m=C=N0/(4*pi),and_a_b_c_are_the_exact_frozen_core_tail_coordinates_of_the_same_accepted_profile",
      tail: "the_full_frozen_analytic_tail_instance_and_all_five_joins_are_bound_not_a_finite_asymptotic_truncation",
    },
    failure:
      "any_embedding_tangent_radius_orientation_or_identity_failure_stops_G2_without_retry_retune_subdivision_precision_change_or_new_center",
    pointwiseMatchIsContainment: false,
    requiresSelectedUniformTubeRadius: true,
    tangentInclusionRequired: true,
  },
  fixedPotentialSimpleKernelDefinition: {
    boundaryConditions: [
      "h_is_regular_at_y=0",
      "h_prime(0)=0",
      "h_decays_in_the_frozen_weighted_tail_space",
    ],
    claim: "kernel(L0)=span{u0}",
    conclusionLimitedToFixedPotentialSpectralOperator: true,
    coupledJacobianInvertibilityFollowsFromThisClaim: false,
    domain:
      "the_exact_radial_weighted_domain_bound_by_the_accepted_newtonian_directed_proof_product",
    operator: "L0*h=-(1/2)*(h''+2*h'/y)+(V0-nu0)*h",
    proofMethod:
      "directed_interval_Sturm_ground_state_and_no_second_regular_decaying_solution_or_an_independently_reviewed_equivalent_validated_spectral_method",
    requiredProfileFacts: [
      "u0_is_strictly_positive_and_nodeless",
      "u0_is_in_the_operator_domain",
      "L0*u0=0",
    ],
  },
  instances: INSTANCES,
  lambdaZeroLimitingGroundStateDefinition: {
    exactEquations: ["V''+2*V'/y=u^2", "-(1/2)*(u''+2*u'/y)+V*u=nu*u"],
    exactG2Map: {
      m0: "C=N0/(4*pi)=integral_0^infinity(y^2*u0(y)^2)dy",
      nu0: "nu",
      u0: "u",
      v0: "V",
      v1: "-V",
    },
    normalizationAndBoundary: [
      "u(0)=1",
      "u'(0)=0",
      "V'(0)=0",
      "u(infinity)=0",
      "V(infinity)=0",
      "nu<0",
    ],
    requiredGlobalProduct:
      "one_accepted_independently_replayed_global_root_from_the_frozen_Newtonian_directed_proof_architecture_and_operator_successor",
    substitutesForbidden: [
      "N64_diagnostic",
      "unproved_seed_output",
      "origin_recurrence_without_exterior_global_root",
      "finite_exterior_truncation",
    ],
  },
  lambdaZeroTangentDefinition: {
    analyticParameter: "s=lambda^2",
    differentiatedEquation:
      "solve_the_exact_augmented_coupled_linear_system_for_the_s_derivative_then_convert_to_the_lambda_extended_tangent_without_finite_differences",
    evennessRule:
      "each_zero_lambda_derivative_of_a_state_coordinate_must_be_proved_from_the_frozen_expression_graph_not_inserted_by_convention",
    finitePositiveLambdaDifferenceAllowed: false,
    orientation: "t_lambda=1",
  },
  maturity:
    "stage_2_definition_only_successor_with_no_instances_execution_or_authority",
  normalizedCoupledJacobianDefinition: {
    augmentedResidual: [
      "R_u=-(1/2)*(u''+2*u'/y)+(V-nu)*u",
      "R_V=V''+2*V'/y-u^2",
      "R_norm=u(0)-1",
    ],
    claim: "DR0_is_bijective_between_the_exact_frozen_Newtonian_proof_spaces",
    derivative: [
      "delta_R_u=L0*delta_u+u0*delta_V-u0*delta_nu",
      "delta_R_V=delta_V''+2*delta_V'/y-2*u0*delta_u",
      "delta_R_norm=delta_u(0)",
    ],
    proofMethod:
      "directed_approximate_inverse_B_with_strict_operator_norm_bound_norm(I-B*DR0)<1_including_every_finite_and_analytic_tail_column",
    spectralSimplicityMaySubstitute: false,
  },
  receiptDefinition: {
    exactFullRootKeysInCanonicalOrder: [
      "artifactId",
      "authorityFalse",
      "blockers",
      "candidateId",
      "contractVersion",
      "coupledJacobianReceiptBinding",
      "firstTubeContainmentReceiptBinding",
      "groundStateReceiptBinding",
      "kernelReceiptBinding",
      "phase",
      "receiptSha256",
      "tangentReceiptBinding",
      "transversalityReceiptBinding",
    ],
    exactUnsignedRootKeysInCanonicalOrder: [
      "artifactId",
      "authorityFalse",
      "blockers",
      "candidateId",
      "contractVersion",
      "coupledJacobianReceiptBinding",
      "firstTubeContainmentReceiptBinding",
      "groundStateReceiptBinding",
      "kernelReceiptBinding",
      "phase",
      "tangentReceiptBinding",
      "transversalityReceiptBinding",
    ],
    phase: "diagnostic_preexecution_lambda_zero_proof",
    selfHashDomain:
      "nhm2-spherical-boson-star-v2/lambda-zero-proof-product/v1\n",
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_exact_unsigned_root_byte_length)||canonical_exact_unsigned_root_bytes)",
    successfulProductRequiresEveryBinding: true,
  },
  reviewBoundary: {
    definitionsFrozenByThisSuccessorOnly: true,
    implementationMayBeginAfterIndependentSemanticAudit: true,
    implementationOrExecutionCompleted: false,
    lambdaZeroProductProduced: false,
    proofClaimEstablished: false,
  },
  transversalityDefinition: {
    adjointKernelRepresentative: "u0",
    exactPairing: "<f,g>=4*pi*integral_0^infinity(y^2*f(y)*g(y))dy",
    parameterDerivative: "partial_nu_R_u=-u0",
    requiredDirectedConclusion:
      "tau=<u0,partial_nu_R_u>=-4*pi*integral_0^infinity(y^2*u0(y)^2)dy=-N0<0",
    finiteDifferenceSlopeAllowed: false,
    nonzeroNormalizationAssertionAloneAllowed: false,
    separateFromCoupledJacobianInvertibility: true,
  },
} as const;

type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

const canonicalize = (value: JsonValue): string => {
  if (value === null || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
      throw new TypeError("lambda_zero_definition_noncanonical_number");
    }
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((child) => canonicalize(child)).join(",")}]`;
  }
  const record = value as { readonly [key: string]: JsonValue };
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`;
};

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (
    value === null ||
    typeof value !== "object" ||
    seen.has(value as object)
  ) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1 =
  deepFreeze(DEFINITION);
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON =
  canonicalize(DEFINITION as JsonValue);
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_PLAIN_CANONICAL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON,
    "utf8",
  );
const canonicalSizeLittleEndian = Buffer.alloc(8);
canonicalSizeLittleEndian.writeBigUInt64LE(
  BigInt(
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_SIZE_BYTES,
  ),
);
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_DOMAIN,
      "utf8",
    )
    .update(canonicalSizeLittleEndian)
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");

export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_SEMANTIC_SHA256:
  string | null =
  "bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f";
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_PLAIN_CANONICAL_SHA256:
  string | null =
  "39d71f698d1d8bbe0fa4fca6e3b1bd4d61f0f55a696555f771f00fdc0c06b23b";
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = 8_157;
export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_LITERAL_SEAL_STATUS =
  "sealed_after_parent_acknowledgement_and_receipt_root_repair" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_ARTIFACT_ID,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_SIZE_BYTES,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_VERSION,
    literalSealStatus:
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_LITERAL_SEAL_STATUS,
    plainCanonicalSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_PLAIN_CANONICAL_SHA256,
    semanticSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_SHA256,
    semanticSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_DOMAIN,
  });

const MAXIMUM_WIRE_CODE_UNITS = 65_536;
const MAXIMUM_WIRE_UTF8_BYTES = 65_536;

export const nhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Violations = (
  value: unknown,
): readonly string[] => {
  if (typeof value !== "string")
    return ["lambda_zero_definition_wire_required"];
  if (value.length > MAXIMUM_WIRE_CODE_UNITS) {
    return ["lambda_zero_definition_wire_code_unit_limit"];
  }
  if (Buffer.byteLength(value, "utf8") > MAXIMUM_WIRE_UTF8_BYTES) {
    return ["lambda_zero_definition_wire_byte_limit"];
  }
  return value ===
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON
    ? []
    : ["lambda_zero_definition_wire_mismatch"];
};

export const isNhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Wire = (
  value: unknown,
): value is string =>
  nhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1Violations(value)
    .length === 0;

export const cloneNhm2SphericalBosonStarV2LambdaZeroProofDefinitionV1CanonicalWire =
  (): string =>
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_JSON;

const allNull = (value: unknown): boolean =>
  value === null ||
  (typeof value === "object" &&
    value !== null &&
    Object.values(value as Record<string, unknown>).every(allNull));
const allFalse = (value: unknown): boolean =>
  typeof value === "boolean"
    ? value === false
    : typeof value === "object" &&
      value !== null &&
      Object.values(value as Record<string, unknown>).every(allFalse);

const assertInvariants = (): void => {
  const expected = [
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_SEMANTIC_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  ];
  const expectedNull = expected.every((value) => value === null);
  const expectedPresent = expected.every((value) => value !== null);
  if (
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING.sha256 !==
      DEFINITION.exactDependencyBindings.newtonianDirectedProof
        .semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING.sha256 !==
      DEFINITION.exactDependencyBindings.newtonianDirectedProofOperator
        .semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_BINDING.semanticSha256 !==
      DEFINITION.exactDependencyBindings.vacuumContinuationProofAbi
        .semanticSha256 ||
    !allNull(DEFINITION.instances) ||
    !allFalse(DEFINITION.authorityLocks) ||
    DEFINITION.fixedPotentialSimpleKernelDefinition
      .coupledJacobianInvertibilityFollowsFromThisClaim !== false ||
    DEFINITION.normalizedCoupledJacobianDefinition
      .spectralSimplicityMaySubstitute !== false ||
    DEFINITION.transversalityDefinition
      .separateFromCoupledJacobianInvertibility !== true ||
    !(expectedNull || expectedPresent) ||
    (expectedPresent &&
      (expected[0] !==
        NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_SEMANTIC_SHA256 ||
        expected[1] !==
          NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_PLAIN_CANONICAL_SHA256 ||
        expected[2] !==
          NHM2_SPHERICAL_BOSON_STAR_V2_LAMBDA_ZERO_PROOF_DEFINITION_V1_CANONICAL_SIZE_BYTES))
  ) {
    throw new Error("lambda_zero_proof_definition_invariant");
  }
};

assertInvariants();
