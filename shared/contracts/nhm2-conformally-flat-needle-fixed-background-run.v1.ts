import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
} from "./nhm2-conformally-flat-needle-scalar-reference.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_fixed_background_run" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_fixed_background_run/v1" as const;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new TypeError(
        "Canonical JSON requires finite, non-negative-zero numbers.",
      );
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (
    value == null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError("Canonical JSON requires plain JSON objects.");
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const canonicalBinding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return Object.freeze({
    canonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  });
};

const identityBinding = (value: unknown) => {
  const binding = canonicalBinding(value);
  return {
    sha256: binding.sha256,
    sizeBytes: binding.sizeBytes,
    canonicalization: binding.canonicalization,
  } as const;
};

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const OBSERVABLES = NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES;
const REFERENCE = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;

const CANDIDATE_DESCRIPTOR = {
  candidateId: "conformally_flat_needle_fixed_background_candidate_001",
  candidateOrdinal: 1,
  candidateCount: 1,
  candidateClass: "diagnostic_fixed_background_conformal_scalar_reference",
  surrogateId: REFERENCE.surrogate.surrogateId,
  relationshipToCurrentNhm2: REFERENCE.surrogate.relationshipToCurrentNhm2,
  semanticRelabelingAllowed: false,
  geometryCriterion: {
    kind: "nondegenerate_conformal_bump_reference",
    conformalAmplitude: REFERENCE.geometry.conformalFactor.amplitude,
    conformalAmplitudeNonzero: true,
    conformalFactorStrictlyPositive:
      REFERENCE.geometry.conformalFactor.strictlyPositive,
    sampleCount: REFERENCE.sampling.sampleCount,
    allSmearingSupportsStrictlyInsideBump:
      REFERENCE.sampling.smearing.supportProof
        .entireSupportStrictlyInsideConformalBump,
    diagnosticMathematicalCriterionSatisfied: true,
    establishesPhysicalRealizability: false,
  },
  exactReferenceRequired: true,
  exactObservablesContractRequired: true,
  executionPresealIssued: false,
  authoritativeCandidateManifestPresent: false,
} as const;

const CANDIDATE_DESCRIPTOR_BINDING = canonicalBinding(CANDIDATE_DESCRIPTOR);
const REFERENCE_BINDING = canonicalBinding(REFERENCE);
const FROZEN_IDENTITIES = OBSERVABLES.content.frozenInputIdentities;

const PLANNED_ARRAY_OUTPUTS = [
  {
    ordinal: 0,
    role: "fixed_background_mean_rset",
    relativePath: "outputs/fixed-background-mean-rset.f64le",
    shape: [64, 10],
    axisOrder: ["sample_ordinal", "tensor_component_ordinal"],
    tensorOrderSourcePointer:
      "/content/frozenInputIdentities/tensorConvention/componentOrder",
    elementCount: 640,
    elementSizeBytes: 8,
    expectedSizeBytes: 5120,
    unit: "J/m^3",
    encoding: "raw_ieee754_float64_little_endian",
    headerBytes: 0,
    framingAllowed: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
  {
    ordinal: 1,
    role: "fixed_background_mean_rset_absolute_uncertainty95",
    relativePath: "outputs/fixed-background-mean-rset-u95.f64le",
    shape: [64, 10],
    axisOrder: ["sample_ordinal", "tensor_component_ordinal"],
    tensorOrderSourcePointer:
      "/content/frozenInputIdentities/tensorConvention/componentOrder",
    elementCount: 640,
    elementSizeBytes: 8,
    expectedSizeBytes: 5120,
    unit: "J/m^3",
    encoding: "raw_ieee754_float64_little_endian",
    headerBytes: 0,
    framingAllowed: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
  {
    ordinal: 2,
    role: "fixed_background_connected_noise_kernel",
    relativePath: "outputs/fixed-background-connected-noise.f64le",
    shape: [64, 64, 100],
    axisOrder: [
      "left_sample_ordinal",
      "right_sample_ordinal",
      "tensor_component_pair_ordinal",
    ],
    tensorOrderSourcePointer:
      "/content/frozenInputIdentities/tensorConvention/noisePairOrder",
    elementCount: 409600,
    elementSizeBytes: 8,
    expectedSizeBytes: 3276800,
    unit: "(J/m^3)^2",
    encoding: "raw_ieee754_float64_little_endian",
    headerBytes: 0,
    framingAllowed: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
  {
    ordinal: 3,
    role: "fixed_background_connected_noise_absolute_uncertainty95",
    relativePath: "outputs/fixed-background-connected-noise-u95.f64le",
    shape: [64, 64, 100],
    axisOrder: [
      "left_sample_ordinal",
      "right_sample_ordinal",
      "tensor_component_pair_ordinal",
    ],
    tensorOrderSourcePointer:
      "/content/frozenInputIdentities/tensorConvention/noisePairOrder",
    elementCount: 409600,
    elementSizeBytes: 8,
    expectedSizeBytes: 3276800,
    unit: "(J/m^3)^2",
    encoding: "raw_ieee754_float64_little_endian",
    headerBytes: 0,
    framingAllowed: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
  {
    ordinal: 4,
    role: "fixed_background_sample_weights",
    relativePath: "outputs/fixed-background-sample-weights.f64le",
    shape: [64],
    axisOrder: ["sample_ordinal"],
    tensorOrderSourcePointer: null,
    elementCount: 64,
    elementSizeBytes: 8,
    expectedSizeBytes: 512,
    unit: "1",
    encoding: "raw_ieee754_float64_little_endian",
    headerBytes: 0,
    framingAllowed: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
] as const;

const PLANNED_SIDECARS = [
  {
    ordinal: 0,
    role: "fixed_background_derivation_receipt",
    relativePath: "sidecars/fixed-background-derivation-receipt.json",
    contractVersion:
      "nhm2_conformally_flat_needle_fixed_background_derivation_receipt/v1",
    mediaType: "application/json",
    purpose: "non_authoritative_exact_equation_and_derivation_observation_plan",
    authoritativeByItself: false,
    canUnlockClaims: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
  {
    ordinal: 1,
    role: "fixed_background_interval_trace",
    relativePath: "sidecars/fixed-background-tail-interval-trace.jsonl",
    contractVersion:
      "nhm2_conformally_flat_needle_fixed_background_interval_trace/v1",
    mediaType: "application/jsonl",
    purpose:
      "non_authoritative_directed_rounding_cubature_and_spectral_tail_trace_plan",
    authoritativeByItself: false,
    canUnlockClaims: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
  {
    ordinal: 2,
    role: "fixed_background_execution_provenance",
    relativePath: "sidecars/fixed-background-execution-provenance.json",
    contractVersion:
      "nhm2_conformally_flat_needle_fixed_background_execution_provenance/v1",
    mediaType: "application/json",
    purpose:
      "non_authoritative_executor_observed_source_dependency_executable_and_run_provenance_plan",
    authoritativeByItself: false,
    canUnlockClaims: false,
    present: false,
    sha256: null,
    sizeBytes: null,
    serverObservationReceiptSha256: null,
  },
] as const;

const PLANNED_IMPLEMENTATION_INPUTS = [
  {
    ordinal: 0,
    implementationRole: "primary",
    implementationId: "anomaly_wess_zumino_arb_spectral_primary",
    lineageId: "fixed_background_primary_arb_spectral_lineage_v1",
    lineageRoot: "lineages/primary-arb-spectral",
    runOutputRoot: "runs/primary-arb-spectral",
    status: "planned_bytes_absent",
    source: {
      role: "primary_source_tree",
      relativePath: "lineages/primary-arb-spectral/source.tar.zst",
      mediaType: "application/zstd",
      requiredBeforeExecution: true,
      present: false,
      sha256: null,
      sizeBytes: null,
      executorObserved: false,
    },
    dependency: {
      role: "primary_dependency_lock",
      relativePath: "lineages/primary-arb-spectral/dependency-lock.json",
      mediaType: "application/json",
      requiredBeforeExecution: true,
      present: false,
      sha256: null,
      sizeBytes: null,
      executorObserved: false,
    },
    executable: {
      role: "primary_executable",
      relativePath: "lineages/primary-arb-spectral/executable.bin",
      mediaType: "application/octet-stream",
      requiredBeforeExecution: true,
      present: false,
      sha256: null,
      sizeBytes: null,
      executorObserved: false,
    },
  },
  {
    ordinal: 1,
    implementationRole: "independent",
    implementationId: "hadamard_ad_mpfr_two_particle_independent",
    lineageId: "fixed_background_independent_hadamard_mpfr_lineage_v1",
    lineageRoot: "lineages/independent-hadamard-mpfr",
    runOutputRoot: "runs/independent-hadamard-mpfr",
    status: "planned_bytes_absent",
    source: {
      role: "independent_source_tree",
      relativePath: "lineages/independent-hadamard-mpfr/source.tar.zst",
      mediaType: "application/zstd",
      requiredBeforeExecution: true,
      present: false,
      sha256: null,
      sizeBytes: null,
      executorObserved: false,
    },
    dependency: {
      role: "independent_dependency_lock",
      relativePath: "lineages/independent-hadamard-mpfr/dependency-lock.json",
      mediaType: "application/json",
      requiredBeforeExecution: true,
      present: false,
      sha256: null,
      sizeBytes: null,
      executorObserved: false,
    },
    executable: {
      role: "independent_executable",
      relativePath: "lineages/independent-hadamard-mpfr/executable.bin",
      mediaType: "application/octet-stream",
      requiredBeforeExecution: true,
      present: false,
      sha256: null,
      sizeBytes: null,
      executorObserved: false,
    },
  },
] as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_BLOCKERS =
  Object.freeze([
    "renormalization_sign_and_boxR_convention_not_frozen",
    "wald_conservation_correction_not_derived",
    "deterministic_tail_and_cubature_budget_not_frozen",
    "candidate_execution_preseal_absent",
    "primary_source_dependency_executable_bytes_absent",
    "independent_source_dependency_executable_bytes_absent",
    "primary_solver_absent",
    "independent_solver_absent",
    "raw_arrays_absent",
    "server_byte_replay_absent",
    "independent_pair_agreement_absent",
    "full_adm_constraint_theory_not_selected",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CLAIM_LOCKS =
  Object.freeze({
    candidatePresealed: false as const,
    primaryExecutionAdmitted: false as const,
    independentExecutionAdmitted: false as const,
    rawArraysProduced: false as const,
    exactProvenanceObserved: false as const,
    serverByteReplayCompleted: false as const,
    finitenessReplayPass: false as const,
    symmetryReplayPass: false as const,
    positiveSemidefiniteReplayPass: false as const,
    fluctuationReplayPass: false as const,
    fixedBackgroundWardReplayPass: false as const,
    independentAgreementEstablished: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    fullAdmConstraintClosure: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateEligibility: false as const,
    certificateIssued: false as const,
  });

const CONTENT = {
  maturity: "diagnostic_fixed_background_run_schema_plan_only",
  status: "blocked_manifest_only_no_execution",
  executionAdmissible: false,
  schemaPlanOnly: true,
  bindings: {
    observablesContract: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
      sha256: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      contentSha256: OBSERVABLES.contentBinding.sha256,
      contentSizeBytes: OBSERVABLES.contentBinding.sizeBytes,
      exactContractRequired: true,
    },
    scalarReference: {
      artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
      sha256: REFERENCE_BINDING.sha256,
      sizeBytes: REFERENCE_BINDING.sizeBytes,
      canonicalization: REFERENCE_BINDING.canonicalization,
      exactReferenceRequired: true,
    },
    candidateIdentity: {
      artifactId: "nhm2.conformally_flat_needle_fixed_background_candidate_001",
      contractVersion:
        "nhm2_conformally_flat_needle_fixed_background_candidate/v1_planned",
      status: "exact_semantic_descriptor_bound_manifest_not_issued",
      descriptor: CANDIDATE_DESCRIPTOR,
      descriptorSha256: CANDIDATE_DESCRIPTOR_BINDING.sha256,
      descriptorSizeBytes: CANDIDATE_DESCRIPTOR_BINDING.sizeBytes,
      canonicalization: CANDIDATE_DESCRIPTOR_BINDING.canonicalization,
      authoritativeManifestSha256: null,
      authoritativeManifestSizeBytes: null,
      authoritativeManifestPresent: false,
    },
  },
  frozenInputIdentityBindings: [
    {
      ordinal: 0,
      role: "geometry",
      sourcePointer: "/content/frozenInputIdentities/geometry",
      ...identityBinding(FROZEN_IDENTITIES.geometry),
    },
    {
      ordinal: 1,
      role: "state",
      sourcePointer: "/content/frozenInputIdentities/state",
      ...identityBinding(FROZEN_IDENTITIES.state),
    },
    {
      ordinal: 2,
      role: "chart",
      sourcePointer: "/content/frozenInputIdentities/chart",
      ...identityBinding(FROZEN_IDENTITIES.chart),
    },
    {
      ordinal: 3,
      role: "tetrad",
      sourcePointer: "/content/frozenInputIdentities/tetrad",
      ...identityBinding(FROZEN_IDENTITIES.tetrad),
    },
    {
      ordinal: 4,
      role: "samples",
      sourcePointer: "/content/frozenInputIdentities/samples",
      ...identityBinding(FROZEN_IDENTITIES.samples),
    },
    {
      ordinal: 5,
      role: "smearing",
      sourcePointer: "/content/frozenInputIdentities/smearing",
      ...identityBinding(FROZEN_IDENTITIES.smearing),
    },
    {
      ordinal: 6,
      role: "tensor_convention",
      sourcePointer: "/content/frozenInputIdentities/tensorConvention",
      ...identityBinding(FROZEN_IDENTITIES.tensorConvention),
    },
  ],
  unresolvedExecutionPolicyBindings: {
    renormalizationConventionPlan: {
      status: OBSERVABLES.content.renormalizationConventionPlan.status,
      authoritativeConventionFrozen: false,
      ...identityBinding(OBSERVABLES.content.renormalizationConventionPlan),
    },
    deterministicNumericsPlan: {
      policyVersion:
        OBSERVABLES.content.deterministicNumericsPlan.policyVersion,
      policyFrozen: false,
      ...identityBinding(OBSERVABLES.content.deterministicNumericsPlan),
    },
    executionAllowedWhileEitherPolicyUnresolved: false,
  },
  freezeBoundary: {
    semanticCandidateIdentityBound: true,
    exactReferenceIdentityBound: true,
    exactFrozenInputIdentitiesBound: true,
    renormalizationConventionFrozenForExecution: false,
    deterministicNumericsPolicyFrozenForExecution: false,
    executionPresealIssued: false,
    exactPresealSha256: null,
    exactPresealSizeBytes: null,
    candidateManifestSha256: null,
    candidateManifestSizeBytes: null,
    executionCannotBeginUntilEveryIdentityAndPolicyIsPresealed: true,
    mutationAfterPresealAllowed: false,
  },
  sourceBoundary: {
    sourceMode: "state_derived_quantum_expectation",
    declaredLeverTensorPresent: false,
    declaredLeverTensorInputAllowed: false,
    declaredLeverTensorForbidden: true,
    metricDemandTensorInputAllowed: false,
    metricDemandSubstitutionForQuantumExpectationAllowed: false,
    forbiddenInputRoles: [
      "declared_lever_tensor",
      "metric_demand_tensor",
      "metric_demand_absolute_error_bound",
    ],
  },
  implementationInputPlan: {
    inputs: PLANNED_IMPLEMENTATION_INPUTS,
    requiredImplementationRoles: ["primary", "independent"],
    requiredArtifactKindsPerImplementation: [
      "source",
      "dependency",
      "executable",
    ],
    allSixByteArtifactsMustBePresentAndServerObservedBeforeExecution: true,
    lineageRootsMustBeDisjoint: true,
    runOutputRootsMustBeDisjoint: true,
    sourcePathsMustBeDisjoint: true,
    dependencyPathsMustBeDisjoint: true,
    executablePathsMustBeDisjoint: true,
    crossLineageSourceReuseAllowed: false,
    crossLineageDependencyReuseAllowed: false,
    crossLineageExecutableReuseAllowed: false,
    crossLineageRuntimeReuseAllowed: false,
    crossLineageIntermediateCacheReuseAllowed: false,
    onlyExactFrozenContractAndInputBytesMayBeShared: true,
    producerSelfAssertionSufficient: false,
  },
  plannedArtifactInventory: {
    arrayOutputs: PLANNED_ARRAY_OUTPUTS,
    sidecars: PLANNED_SIDECARS,
    arrayOutputCount: 5,
    sidecarCount: 3,
    totalExpectedArrayBytesPerImplementation: 6564352,
    sameOrderedInventoryRequiredFromBothImplementations: true,
    artifactPathsResolvedUnderPerImplementationRunOutputRoot: true,
    rawBytesMustPrecedeReplay: true,
    arrayHashReceiptsPresent: false,
    sidecarHashReceiptsPresent: false,
    sidecarsAreAuthorityByThemselves: false,
  },
  constraintOutputBoundary: {
    constraintArrayProductionAuthorized: false,
    constraintOutputSchemaPresent: false,
    normalizedConstraintBracketOutputAuthorized: false,
    antisymmetryOutputAuthorized: false,
    jacobiOutputAuthorized: false,
    regulatorOutputAuthorized: false,
    fullAdmConstraintClosureClaimAllowed: false,
    forbiddenOutputRoles: [
      "H",
      "H_i",
      "hamiltonian_constraint",
      "momentum_constraint",
      "constraint_bracket",
      "normalized_constraint_bracket",
      "constraint_antisymmetry",
      "constraint_jacobi",
      "constraint_regulator",
      "declared_lever_tensor",
    ],
    fixedBackgroundWardIdentityMayOnlyBeFutureDiagnostic: true,
    fixedBackgroundWardIdentityEstablishesFullAdmClosure: false,
  },
  replayAndAgreementBoundary: {
    runReceiptPresent: false,
    runReceiptSha256: null,
    replayReceiptPresent: false,
    replayReceiptSha256: null,
    pairAgreementReceiptPresent: false,
    pairAgreementReceiptSha256: null,
    serverByteReplayCompleted: false,
    independentPairAgreementEstablished: false,
    executionProvenanceVerified: false,
    replayOrReceiptMayBeSynthesizedFromThisPlan: false,
  },
  noRetunePolicy: {
    policy: "single_exact_presealed_candidate_fail_without_retuning",
    candidateRetuningAfterExecutionFailureAllowed: false,
    renormalizationRetuningAfterExecutionFailureAllowed: false,
    toleranceRetuningAfterExecutionFailureAllowed: false,
    cutoffRetuningAfterExecutionFailureAllowed: false,
    budgetRetuningAfterExecutionFailureAllowed: false,
    implementationSubstitutionAfterExecutionFailureAllowed: false,
    failureDisposition: "fail_candidate_and_preserve_failed_lineage",
  },
  authority: {
    status: "blocked",
    firstBlocker: "renormalization_sign_and_boxR_convention_not_frozen",
    blockers: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_BLOCKERS,
    builderExported: false,
    issuerExported: false,
    executableRunExported: false,
    manifestMayAuthorizeExecution: false,
    manifestMayUnlockLamps: false,
    manifestMayEstablishConstraintClosure: false,
    manifestMayEstablishPhysicalClaims: false,
    certificateAuthority: false,
  },
  claimLocks: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);

const CONTRACT = {
  artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleFixedBackgroundRunV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN;

export const canonicalNhm2ConformallyFlatNeedleFixedBackgroundRunJson = (
  value: Nhm2ConformallyFlatNeedleFixedBackgroundRunV1,
): string => canonicalJson(value);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CANONICAL_JSON =
  canonicalJson(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN);
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SIZE_BYTES =
  13189 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SHA256 =
  "32191a882bbe4c4f8f6cd462fe25052e059ed715b5482dda577078b71ea0eaa8" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SIZE_BYTES =
  25097 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SHA256 =
  "725a6ff3a50aa4074f7bf6f09c0fc991f0dfed82bf0b46a091a9bbe910711a90" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SIZE_BYTES =
  826 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SHA256 =
  "ea25d349f45f5f9d31b7706db095dbfae183be857a2da53ef61115ac00352340" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SIZE_BYTES =
  16082 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SHA256 =
  "c42253e33e23b54ae4d2581a82a5b71253203372c5a6e1c1b20d04e787a6e83c" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SIZE_BYTES =
  16405 as const;

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SIZE_BYTES ||
  REFERENCE_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SHA256 ||
  REFERENCE_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SIZE_BYTES ||
  CANDIDATE_DESCRIPTOR_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SHA256 ||
  CANDIDATE_DESCRIPTOR_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SIZE_BYTES ||
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_conformally_flat_needle_fixed_background_run_v1_literal_binding_drift",
  );
}

type SnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };

const FORBIDDEN_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
): SnapshotResult => {
  const at = pointer || "/";
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false, violation: `nonfinite_number:${at}` };
    }
    if (Object.is(value, -0)) {
      return { ok: false, violation: `negative_zero:${at}` };
    }
    return { ok: true, value };
  }
  if (typeof value !== "object") {
    return { ok: false, violation: `non_json_value:${at}` };
  }
  if (nodeUtilTypes.isProxy(value)) {
    return { ok: false, violation: `proxy_forbidden:${at}` };
  }
  if (ancestors.has(value)) {
    return { ok: false, violation: `cycle_forbidden:${at}` };
  }
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value);
    return { ok: false, violation: `symbol_key_forbidden:${at}` };
  }

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
      return { ok: false, violation: `non_plain_array:${at}` };
    }
    if (
      keys.some(
        (key) => key !== "length" && !/^(?:0|[1-9][0-9]*)$/.test(key as string),
      )
    ) {
      ancestors.delete(value);
      return { ok: false, violation: `array_keys_invalid:${at}` };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        ancestors.delete(value);
        return {
          ok: false,
          violation: `accessor_sparse_or_hidden_array_entry:${pointer}/${index}`,
        };
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
      );
      if (!nested.ok) {
        ancestors.delete(value);
        return nested;
      }
      output.push(nested.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    ancestors.delete(value);
    return { ok: false, violation: `non_plain_object:${at}` };
  }
  const output: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    if (FORBIDDEN_DATA_KEYS.has(key)) {
      ancestors.delete(value);
      return {
        ok: false,
        violation: `forbidden_data_key:${pointer}/${key}`,
      };
    }
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      ancestors.delete(value);
      return {
        ok: false,
        violation: `accessor_or_hidden_property_forbidden:${pointer}/${key}`,
      };
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
    );
    if (!nested.ok) {
      ancestors.delete(value);
      return nested;
    }
    output[key] = nested.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const exactDifferences = (
  actual: unknown,
  expected: unknown,
  pointer = "",
): string[] => {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    if (actual.length !== expected.length) {
      violations.push(`array_length_drift:${pointer || "/"}`);
    }
    for (
      let index = 0;
      index < Math.min(actual.length, expected.length);
      index += 1
    ) {
      violations.push(
        ...exactDifferences(
          actual[index],
          expected[index],
          `${pointer}/${index}`,
        ),
      );
    }
    return violations;
  }
  if (isRecord(actual) || isRecord(expected)) {
    if (!isRecord(actual) || !isRecord(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key)) {
        violations.push(`extra_key:${pointer}/${key}`);
      }
    }
    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) {
        violations.push(`missing_key:${pointer}/${key}`);
      } else {
        violations.push(
          ...exactDifferences(actual[key], expected[key], `${pointer}/${key}`),
        );
      }
    }
    return violations;
  }
  return Object.is(actual, expected) ? [] : [`value_drift:${pointer || "/"}`];
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const isConstraintShapedRole = (role: unknown): boolean =>
  typeof role !== "string" ||
  /(?:^H$|^H_i$|constraint|hamiltonian|momentum|bracket|antisymmetry|jacobi|regulator|declared_lever)/i.test(
    role,
  );

export const nhm2ConformallyFlatNeedleFixedBackgroundRunViolations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  const violations = exactDifferences(
    snapshot.value,
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN,
  );
  const root = isRecord(snapshot.value) ? snapshot.value : null;
  const content = root != null && isRecord(root.content) ? root.content : null;

  const bindings =
    content != null && isRecord(content.bindings) ? content.bindings : null;
  if (
    bindings == null ||
    exactDifferences(bindings, CONTENT.bindings).length > 0
  ) {
    violations.push("canonical_identity_bindings_invalid");
  }

  const source =
    content != null && isRecord(content.sourceBoundary)
      ? content.sourceBoundary
      : null;
  if (
    source == null ||
    source.declaredLeverTensorPresent !== false ||
    source.declaredLeverTensorInputAllowed !== false ||
    source.declaredLeverTensorForbidden !== true ||
    source.metricDemandTensorInputAllowed !== false ||
    source.metricDemandSubstitutionForQuantumExpectationAllowed !== false
  ) {
    violations.push("lever_or_metric_demand_input_forbidden");
  }

  const inventory =
    content != null && isRecord(content.plannedArtifactInventory)
      ? content.plannedArtifactInventory
      : null;
  const arrays = Array.isArray(inventory?.arrayOutputs)
    ? inventory.arrayOutputs
    : [];
  if (
    arrays.length !== 5 ||
    arrays.some((entry) => {
      if (!isRecord(entry)) return true;
      return (
        isConstraintShapedRole(entry.role) ||
        entry.present !== false ||
        entry.sha256 !== null ||
        entry.sizeBytes !== null ||
        entry.serverObservationReceiptSha256 !== null
      );
    })
  ) {
    violations.push(
      "raw_array_inventory_must_remain_unobserved_and_constraint_free",
    );
  }
  const sidecars = Array.isArray(inventory?.sidecars) ? inventory.sidecars : [];
  if (
    sidecars.length !== 3 ||
    sidecars.some((entry) => {
      if (!isRecord(entry)) return true;
      return (
        entry.authoritativeByItself !== false ||
        entry.canUnlockClaims !== false ||
        entry.present !== false ||
        entry.sha256 !== null ||
        entry.sizeBytes !== null ||
        entry.serverObservationReceiptSha256 !== null
      );
    })
  ) {
    violations.push("sidecars_must_remain_absent_and_non_authoritative");
  }

  const inputPlan =
    content != null && isRecord(content.implementationInputPlan)
      ? content.implementationInputPlan
      : null;
  const implementationInputs = Array.isArray(inputPlan?.inputs)
    ? inputPlan.inputs
    : [];
  const lineageRoots: string[] = [];
  const runOutputRoots: string[] = [];
  const artifactPaths: string[] = [];
  let plannedInputsInvalid = implementationInputs.length !== 2;
  for (const entry of implementationInputs) {
    if (
      !isRecord(entry) ||
      typeof entry.lineageRoot !== "string" ||
      typeof entry.runOutputRoot !== "string"
    ) {
      plannedInputsInvalid = true;
      continue;
    }
    lineageRoots.push(entry.lineageRoot);
    runOutputRoots.push(entry.runOutputRoot);
    for (const kind of ["source", "dependency", "executable"] as const) {
      const input = isRecord(entry[kind]) ? entry[kind] : null;
      if (
        input == null ||
        typeof input.relativePath !== "string" ||
        !input.relativePath.startsWith(`${entry.lineageRoot}/`) ||
        input.requiredBeforeExecution !== true ||
        input.present !== false ||
        input.sha256 !== null ||
        input.sizeBytes !== null ||
        input.executorObserved !== false
      ) {
        plannedInputsInvalid = true;
      } else {
        artifactPaths.push(input.relativePath);
      }
    }
  }
  if (
    plannedInputsInvalid ||
    new Set(lineageRoots).size !== 2 ||
    new Set(runOutputRoots).size !== 2 ||
    [...lineageRoots, ...runOutputRoots].some((root, index, roots) =>
      roots.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          (root.startsWith(`${other}/`) || other.startsWith(`${root}/`)),
      ),
    ) ||
    new Set(artifactPaths).size !== 6
  ) {
    violations.push(
      "implementation_lineages_must_remain_disjoint_and_unobserved",
    );
  }

  const freeze =
    content != null && isRecord(content.freezeBoundary)
      ? content.freezeBoundary
      : null;
  if (
    freeze == null ||
    freeze.executionPresealIssued !== false ||
    freeze.exactPresealSha256 !== null ||
    freeze.candidateManifestSha256 !== null ||
    freeze.mutationAfterPresealAllowed !== false
  ) {
    violations.push("execution_preseal_must_remain_absent");
  }

  const noRetune =
    content != null && isRecord(content.noRetunePolicy)
      ? content.noRetunePolicy
      : null;
  if (
    noRetune == null ||
    Object.entries(noRetune).some(
      ([key, policy]) => key.endsWith("Allowed") && policy !== false,
    )
  ) {
    violations.push("no_retune_policy_invalid");
  }

  const authority =
    content != null && isRecord(content.authority) ? content.authority : null;
  if (
    content?.executionAdmissible !== false ||
    authority == null ||
    authority.status !== "blocked" ||
    Object.entries(authority).some(
      ([key, authorityValue]) =>
        key !== "status" &&
        key !== "firstBlocker" &&
        key !== "blockers" &&
        typeof authorityValue === "boolean" &&
        authorityValue !== false,
    )
  ) {
    violations.push("execution_and_claim_authority_must_remain_blocked");
  }

  const locks =
    content != null && isRecord(content.claimLocks) ? content.claimLocks : null;
  if (locks == null) {
    violations.push("claim_locks_invalid");
  } else {
    for (const [key, lock] of Object.entries(locks)) {
      if (lock !== false) {
        violations.push(`claim_lock_must_remain_false:${key}`);
      }
    }
  }

  return unique(violations);
};

export const isNhm2ConformallyFlatNeedleFixedBackgroundRunV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleFixedBackgroundRunV1 =>
  nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(value).length === 0;
