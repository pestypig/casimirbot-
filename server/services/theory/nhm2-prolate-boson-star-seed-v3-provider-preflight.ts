import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-postprojection-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SCHEMA_BINDINGS,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v3";

export const NHM2_PROLATE_BOSON_STAR_SEED_V3_PROVIDER_VERSION =
  "nhm2_prolate_boson_star_seed_isolated_worker_provider/v3" as const;
export const NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_TARGET =
  "external_linux_oci_cgroup_v2_worker" as const;
export const NHM2_PROLATE_BOSON_STAR_SEED_V3_PREREQUISITE_BINDING_VERSION =
  "nhm2_prolate_boson_star_seed_v3_prerequisite_binding/v1" as const;

const SHA256 = /^[0-9a-f]{64}$/;
const SAFE_ID = /^[a-z0-9](?:[a-z0-9._:-]{0,254}[a-z0-9])?$/;
const ATTEMPT_ID = /^[0-9a-f]{32}$/;
const UNSIGNED_DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const OCI_DIGEST = /^sha256:[0-9a-f]{64}$/;
const MAXIMUM_RAW_RESULT_FILE_COUNT = 64;
const MAXIMUM_RAW_RESULT_TOTAL_BYTES = 64 * 1024 * 1024;

export type Nhm2ProlateBosonStarSeedV3PrerequisiteArtifactKind =
  | "common_run_request"
  | "scheduler_lease"
  | "worker_attempt"
  | "absolute_deadline_receipt"
  | "verifier_quota_setup_receipt"
  | "verifier_seccomp_load_receipt"
  | "producer_full_enforcement_receipt"
  | "numeric_staging32_composite"
  | "raw_evidence6_composite"
  | "candidate_instance_identity"
  | "verifier_source_manifest"
  | "verifier_toolchain_manifest"
  | "verifier_executable"
  | "typed_interpreter"
  | "independent_proof_kernel"
  | "independent_proof_kernel_toolchain"
  | "mpfr_gmp_runtime_manifest"
  | "producer_projection_implementation"
  | "verifier_projection_implementation"
  | "implementation_separation_receipt"
  | "verifier_input_ledger"
  | "verifier_runtime_channel"
  | "verifier_launch_envelope";

export type Nhm2ProlateBosonStarSeedV3PrerequisiteBinding = Readonly<{
  bindingVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_V3_PREREQUISITE_BINDING_VERSION;
  artifactKind: Nhm2ProlateBosonStarSeedV3PrerequisiteArtifactKind;
  sha256Domain: string;
  sha256: string;
  canonicalSizeBytes: number;
}>;

export type Nhm2ProlateBosonStarSeedV3StageAttempt = Readonly<{
  stageId: "trusted_independent_verifier";
  sameAttemptId: string;
  schedulerLeaseBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  workerAttemptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
}>;

export type Nhm2ProlateBosonStarSeedV3ProducerEnforcementContext = Readonly<{
  stageId: "untrusted_seed_producer";
  sameAttemptId: string;
  schedulerLeaseBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  binding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
}>;

export type Nhm2ProlateBosonStarSeedV3AttemptBoundComposite = Readonly<{
  sameAttemptId: string;
  binding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
}>;

export type Nhm2ProlateBosonStarSeedV3CandidateInstanceContext = Readonly<{
  sameAttemptId: string;
  commonRunRequestBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  producerFullEnforcementReceiptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  numericStaging32CompositeBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  rawEvidence6CompositeBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  binding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
}>;

export type Nhm2ProlateBosonStarSeedV3VerifierPreflightInput = Readonly<{
  providerId: string;
  successorRunPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING;
  evidenceSchemaRegistryBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING;
  numericMaterializationPolicyBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING;
  postprojectionPolicyBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING;
  numericOperationGraphBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING;
  postprojectionOperationGraphBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING;
  commonRunRequestBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  sameAttemptId: string;
  schedulerLeaseBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierWorkerAttempt: Nhm2ProlateBosonStarSeedV3StageAttempt;
  absoluteDeadlineReceiptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierQuotaSetupReceiptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierSeccompLoadReceiptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  producerFullEnforcement: Nhm2ProlateBosonStarSeedV3ProducerEnforcementContext;
  numericStaging32Composite: Nhm2ProlateBosonStarSeedV3AttemptBoundComposite;
  rawEvidence6Composite: Nhm2ProlateBosonStarSeedV3AttemptBoundComposite;
  candidateInstanceIdentity: Nhm2ProlateBosonStarSeedV3CandidateInstanceContext;
  verifierSourceManifestBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierToolchainManifestBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierExecutableBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierOciImageDigest: string;
  typedInterpreterBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  independentProofKernelBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  independentProofKernelToolchainBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  mpfrGmpRuntimeManifestBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  producerProjectionImplementationBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierProjectionImplementationBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  implementationSeparationReceiptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierInputLedgerBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierRuntimeChannelBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
}>;

export type Nhm2ProlateBosonStarSeedV3LaunchEnvelopeFormationInput = Readonly<{
  providerId: string;
  stageId: "trusted_independent_verifier";
  sameAttemptId: string;
  schedulerLeaseBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierWorkerAttemptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierInputLedgerBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierRuntimeChannelBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  successorRunPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING;
  evidenceSchemaRegistryBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING;
}>;

export type Nhm2ProlateBosonStarSeedV3LaunchEnvelopeFormationResult = Readonly<{
  stageId: "trusted_independent_verifier";
  sameAttemptId: string;
  schedulerLeaseBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierWorkerAttemptBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierInputLedgerBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierRuntimeChannelBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  launchEnvelopeBinding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
}>;

export type Nhm2ProlateBosonStarSeedV3ProviderRawResult = Readonly<{
  status: "raw_evidence_only" | "provider_failed";
  rawEvidenceCanonicalUtf8Bytes: readonly Uint8Array[];
  issues: readonly string[];
}>;

export type Nhm2ProlateBosonStarSeedV3ProviderResult = Readonly<{
  status: "raw_evidence_only" | "provider_failed";
  rawEvidenceCanonicalUtf8Bytes: readonly Uint8Array[];
  issues: readonly string[];
  authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks;
}>;

export type Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV3 = Readonly<{
  providerVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_V3_PROVIDER_VERSION;
  providerId: string;
  executionTarget: typeof NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_TARGET;
  platform: "linux";
  runPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING;
  evidenceSchemaRegistryBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING;
  readClockMonotonicRawNanoseconds: () => string;
  formVerifierLaunchEnvelope: (
    input: Nhm2ProlateBosonStarSeedV3LaunchEnvelopeFormationInput,
  ) =>
    | Promise<Nhm2ProlateBosonStarSeedV3LaunchEnvelopeFormationResult | null>
    | Nhm2ProlateBosonStarSeedV3LaunchEnvelopeFormationResult
    | null;
  launchExactEvidenceAdmittedVerifier: (
    context: Nhm2ProlateBosonStarSeedV3PreflightSnapshot,
  ) => Promise<Nhm2ProlateBosonStarSeedV3ProviderRawResult>;
}>;

const FAILURE_PAIRS = Object.freeze({
  common_run_request_or_policy_input_invalid: "commonRunRequestOrPolicyInputs",
  scheduler_lease_or_worker_attempt_missing_or_invalid:
    "schedulerLeaseOrWorkerAttemptBinding",
  deadline_quota_or_seccomp_prerequisite_missing_or_invalid:
    "deadlineQuotaOrSeccompPrerequisiteBinding",
  producer_full_enforcement_missing_or_invalid:
    "producerFullEnforcementReceiptBinding",
  numeric_staging32_composite_missing_or_invalid:
    "numericStaging32CompositeBinding",
  raw_evidence6_composite_missing_or_invalid: "rawEvidence6CompositeBinding",
  candidate_instance_identity_missing_or_mixed:
    "candidateInstanceIdentityBinding",
  verifier_source_toolchain_executable_or_oci_missing_or_invalid:
    "verifierSourceToolchainExecutableOrOciBinding",
  typed_interpreter_missing_or_invalid: "typedInterpreterBinding",
  mpfr_gmp_runtime_manifest_missing_or_invalid: "mpfrGmpRuntimeManifestBinding",
  proof_kernel_or_toolchain_missing_or_invalid:
    "independentProofKernelOrToolchainBinding",
  static_implementation_or_separation_missing_or_invalid:
    "staticImplementationOrSeparationBinding",
  verifier_input_ledger_formation_failed: "verifierInputLedgerBinding",
  verifier_channel_formation_or_secure_observation_failed:
    "verifierRuntimeChannelBindingOrObservation",
  verifier_launch_envelope_formation_failed:
    "verifierLaunchEnvelopeBindingOrObservation",
} as const);

export type Nhm2ProlateBosonStarSeedV3PrelaunchFailureCode =
  keyof typeof FAILURE_PAIRS;
export type Nhm2ProlateBosonStarSeedV3FirstFailedContextField =
  (typeof FAILURE_PAIRS)[Nhm2ProlateBosonStarSeedV3PrelaunchFailureCode];

export type Nhm2ProlateBosonStarSeedV3VerifierPrelaunchContextRejection =
  Readonly<{
    schemaVersion: "nhm2_prolate_boson_star_newtonian_seed_v3_verifier_prelaunch_context_rejection/v1";
    disposition: "broker_prelaunch_context_rejection";
    successorRunPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING;
    evidenceSchemaRegistryBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING;
    commonRunRequestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    sameAttemptIdOrNull: string | null;
    schedulerLeaseBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierWorkerAttemptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    absoluteDeadlineReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierQuotaSetupReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierSeccompLoadReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    producerFullEnforcementReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    numericStaging32CompositeBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    rawEvidence6CompositeBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    candidateInstanceIdentityBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierSourceManifestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierToolchainManifestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierExecutableBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierOciImageDigestOrNull: string | null;
    typedInterpreterBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    independentProofKernelBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    independentProofKernelToolchainBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    mpfrGmpRuntimeManifestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    producerProjectionImplementationBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    verifierProjectionImplementationBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    implementationSeparationReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    attemptedVerifierInputLedgerBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    attemptedVerifierRuntimeChannelBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    attemptedVerifierLaunchEnvelopeBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null;
    failureCode: Nhm2ProlateBosonStarSeedV3PrelaunchFailureCode;
    firstFailedContextField: Nhm2ProlateBosonStarSeedV3FirstFailedContextField;
    clockId: "CLOCK_MONOTONIC_RAW";
    contextEvaluationStartMonotonicNanoseconds: string;
    rejectionReceiptCloseMonotonicNanoseconds: string;
    verifierLaunchEnvelopeBinding: null;
    compositeReplayBundleBinding: null;
    verifierFullEnforcementReceiptBinding: null;
    typedInterpreterValidationReceiptBinding: null;
    atomicNestedRegistrationReceiptBinding: null;
    assemblerLaunchEnvelopeBinding: null;
    verifierLaunchAuthorized: false;
    executionAuthorized: false;
    registrationAllowed: false;
    seedAdmissionGranted: false;
    artifactAccepted: false;
    scientificAdmissionGranted: false;
    physicalAuthorityGranted: false;
    propulsionAuthorityGranted: false;
    transportAuthorityGranted: false;
    validatedContextRequired: true;
    allPassed: false;
  }>;

export type Nhm2ProlateBosonStarSeedV3PreflightSnapshot = Readonly<{
  snapshotVersion: "nhm2_prolate_boson_star_seed_v3_syntactic_preflight_snapshot/v1";
  providerId: string;
  stageId: "trusted_independent_verifier";
  sameAttemptId: string;
  successorRunPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING;
  evidenceSchemaRegistryBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING;
  input: Nhm2ProlateBosonStarSeedV3VerifierPreflightInput;
  attemptedLaunchEnvelopeBinding: null;
  contextEvaluationStartMonotonicNanoseconds: string;
  contextValidationCloseMonotonicNanoseconds: string;
  exactRuntimeEvidenceInterpretationCompleted: false;
  launchEligible: false;
  launchAuthorityFromMetadata: false;
  executionAuthorized: false;
  artifactAuthorityGranted: false;
  scientificAuthorityGranted: false;
  physicalAuthorityGranted: false;
}>;

export type Nhm2ProlateBosonStarSeedV3PreflightResult =
  | Readonly<{
      ok: true;
      status: "syntactic_preflight_snapshot_launch_ineligible";
      snapshot: Nhm2ProlateBosonStarSeedV3PreflightSnapshot;
      rejection: null;
      blocker: "exact_v3_runtime_evidence_interpretation_and_admission_token_absent";
      exactSchemaInterpretationCompleted: false;
      launchEligible: false;
    }>
  | Readonly<{
      ok: false;
      status: "prelaunch_context_rejected";
      snapshot: null;
      rejection: Nhm2ProlateBosonStarSeedV3VerifierPrelaunchContextRejection;
      rejectionBinding: null;
      exactSchemaInterpretationCompleted: false;
      registrationAllowed: false;
      launchEligible: false;
    }>
  | Readonly<{
      ok: false;
      status: "provider_failed";
      code:
        | "trusted_server_handle_invalid_or_revoked"
        | "trusted_clock_unavailable_or_nonmonotonic";
      snapshot: null;
      rejection: null;
    }>;

const PROVIDER_KEYS = Object.freeze([
  "providerVersion",
  "providerId",
  "executionTarget",
  "platform",
  "runPlanBinding",
  "evidenceSchemaRegistryBinding",
  "readClockMonotonicRawNanoseconds",
  "formVerifierLaunchEnvelope",
  "launchExactEvidenceAdmittedVerifier",
] as const);
const PREFLIGHT_KEYS = Object.freeze([
  "providerId",
  "successorRunPlanBinding",
  "evidenceSchemaRegistryBinding",
  "numericMaterializationPolicyBinding",
  "postprojectionPolicyBinding",
  "numericOperationGraphBinding",
  "postprojectionOperationGraphBinding",
  "commonRunRequestBinding",
  "sameAttemptId",
  "schedulerLeaseBinding",
  "verifierWorkerAttempt",
  "absoluteDeadlineReceiptBinding",
  "verifierQuotaSetupReceiptBinding",
  "verifierSeccompLoadReceiptBinding",
  "producerFullEnforcement",
  "numericStaging32Composite",
  "rawEvidence6Composite",
  "candidateInstanceIdentity",
  "verifierSourceManifestBinding",
  "verifierToolchainManifestBinding",
  "verifierExecutableBinding",
  "verifierOciImageDigest",
  "typedInterpreterBinding",
  "independentProofKernelBinding",
  "independentProofKernelToolchainBinding",
  "mpfrGmpRuntimeManifestBinding",
  "producerProjectionImplementationBinding",
  "verifierProjectionImplementationBinding",
  "implementationSeparationReceiptBinding",
  "verifierInputLedgerBinding",
  "verifierRuntimeChannelBinding",
] as const);

const exactDataRecord = (
  value: unknown,
  expectedKeys: readonly string[],
  requireFrozen = false,
): Readonly<Record<string, unknown>> | null => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      (requireFrozen && !Object.isFrozen(value))
    ) {
      return null;
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.length !== expectedKeys.length ||
      keys.some((key) => typeof key !== "string") ||
      !expectedKeys.every((key) => keys.includes(key))
    ) {
      return null;
    }
    const snapshot = Object.create(null) as Record<string, unknown>;
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      ) {
        return null;
      }
      snapshot[key] = descriptor.value;
    }
    return Object.freeze(snapshot);
  } catch {
    return null;
  }
};

const exactPinnedRecord = (
  value: unknown,
  expected: Readonly<Record<string, unknown>>,
): boolean => {
  const keys = Object.keys(expected);
  const record = exactDataRecord(value, keys);
  return record != null && keys.every((key) => record[key] === expected[key]);
};

const snapshotBinding = (
  value: unknown,
  artifactKind: Nhm2ProlateBosonStarSeedV3PrerequisiteArtifactKind,
): Nhm2ProlateBosonStarSeedV3PrerequisiteBinding | null => {
  const record = exactDataRecord(value, [
    "bindingVersion",
    "artifactKind",
    "sha256Domain",
    "sha256",
    "canonicalSizeBytes",
  ]);
  if (
    record == null ||
    record.bindingVersion !==
      NHM2_PROLATE_BOSON_STAR_SEED_V3_PREREQUISITE_BINDING_VERSION ||
    record.artifactKind !== artifactKind ||
    typeof record.sha256Domain !== "string" ||
    !record.sha256Domain.endsWith("\n") ||
    typeof record.sha256 !== "string" ||
    !SHA256.test(record.sha256) ||
    typeof record.canonicalSizeBytes !== "number" ||
    !Number.isSafeInteger(record.canonicalSizeBytes) ||
    record.canonicalSizeBytes <= 0
  ) {
    return null;
  }
  return Object.freeze({
    bindingVersion:
      NHM2_PROLATE_BOSON_STAR_SEED_V3_PREREQUISITE_BINDING_VERSION,
    artifactKind,
    sha256Domain: record.sha256Domain,
    sha256: record.sha256,
    canonicalSizeBytes: record.canonicalSizeBytes,
  });
};

const bindingIdentity = (
  binding: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding,
): string =>
  `${binding.artifactKind}\n${binding.sha256Domain}${binding.sha256}\n${binding.canonicalSizeBytes}`;
const sameBinding = (
  left: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding,
  right: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding,
): boolean => bindingIdentity(left) === bindingIdentity(right);

const snapshotAttempt = (
  value: unknown,
): Nhm2ProlateBosonStarSeedV3StageAttempt | null => {
  const record = exactDataRecord(value, [
    "stageId",
    "sameAttemptId",
    "schedulerLeaseBinding",
    "workerAttemptBinding",
  ]);
  const scheduler = snapshotBinding(
    record?.schedulerLeaseBinding,
    "scheduler_lease",
  );
  const worker = snapshotBinding(
    record?.workerAttemptBinding,
    "worker_attempt",
  );
  if (
    record == null ||
    record.stageId !== "trusted_independent_verifier" ||
    typeof record.sameAttemptId !== "string" ||
    !ATTEMPT_ID.test(record.sameAttemptId) ||
    scheduler == null ||
    worker == null
  ) {
    return null;
  }
  return Object.freeze({
    stageId: "trusted_independent_verifier",
    sameAttemptId: record.sameAttemptId,
    schedulerLeaseBinding: scheduler,
    workerAttemptBinding: worker,
  });
};

type ValidatedPrefix = Partial<{
  commonRunRequestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  sameAttemptIdOrNull: string;
  schedulerLeaseBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierWorkerAttemptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  absoluteDeadlineReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierQuotaSetupReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierSeccompLoadReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  producerFullEnforcementReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  numericStaging32CompositeBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  rawEvidence6CompositeBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  candidateInstanceIdentityBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierSourceManifestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierToolchainManifestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierExecutableBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierOciImageDigestOrNull: string;
  typedInterpreterBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  independentProofKernelBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  independentProofKernelToolchainBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  mpfrGmpRuntimeManifestBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  producerProjectionImplementationBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  verifierProjectionImplementationBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  implementationSeparationReceiptBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  attemptedVerifierInputLedgerBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  attemptedVerifierRuntimeChannelBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
  attemptedVerifierLaunchEnvelopeBindingOrNull: Nhm2ProlateBosonStarSeedV3PrerequisiteBinding;
}>;

const readClock = (state: ProviderState): string | null => {
  try {
    const value = Reflect.apply(
      state.readClockMonotonicRawNanoseconds,
      undefined,
      [],
    );
    return typeof value === "string" && UNSIGNED_DECIMAL.test(value)
      ? value
      : null;
  } catch {
    return null;
  }
};

const monotonicNotBefore = (left: string, right: string): boolean =>
  BigInt(right) >= BigInt(left);

const makeRejection = (
  state: ProviderState,
  start: string,
  code: Nhm2ProlateBosonStarSeedV3PrelaunchFailureCode,
  prefix: ValidatedPrefix,
): Nhm2ProlateBosonStarSeedV3PreflightResult => {
  const close = readClock(state);
  if (close == null || !monotonicNotBefore(start, close)) {
    return Object.freeze({
      ok: false,
      status: "provider_failed",
      code: "trusted_clock_unavailable_or_nonmonotonic",
      snapshot: null,
      rejection: null,
    });
  }
  return Object.freeze({
    ok: false,
    status: "prelaunch_context_rejected",
    snapshot: null,
    rejectionBinding: null,
    exactSchemaInterpretationCompleted: false,
    registrationAllowed: false,
    launchEligible: false,
    rejection: Object.freeze({
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_v3_verifier_prelaunch_context_rejection/v1",
      disposition: "broker_prelaunch_context_rejection",
      successorRunPlanBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
      evidenceSchemaRegistryBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
      commonRunRequestBindingOrNull:
        prefix.commonRunRequestBindingOrNull ?? null,
      sameAttemptIdOrNull: prefix.sameAttemptIdOrNull ?? null,
      schedulerLeaseBindingOrNull: prefix.schedulerLeaseBindingOrNull ?? null,
      verifierWorkerAttemptBindingOrNull:
        prefix.verifierWorkerAttemptBindingOrNull ?? null,
      absoluteDeadlineReceiptBindingOrNull:
        prefix.absoluteDeadlineReceiptBindingOrNull ?? null,
      verifierQuotaSetupReceiptBindingOrNull:
        prefix.verifierQuotaSetupReceiptBindingOrNull ?? null,
      verifierSeccompLoadReceiptBindingOrNull:
        prefix.verifierSeccompLoadReceiptBindingOrNull ?? null,
      producerFullEnforcementReceiptBindingOrNull:
        prefix.producerFullEnforcementReceiptBindingOrNull ?? null,
      numericStaging32CompositeBindingOrNull:
        prefix.numericStaging32CompositeBindingOrNull ?? null,
      rawEvidence6CompositeBindingOrNull:
        prefix.rawEvidence6CompositeBindingOrNull ?? null,
      candidateInstanceIdentityBindingOrNull:
        prefix.candidateInstanceIdentityBindingOrNull ?? null,
      verifierSourceManifestBindingOrNull:
        prefix.verifierSourceManifestBindingOrNull ?? null,
      verifierToolchainManifestBindingOrNull:
        prefix.verifierToolchainManifestBindingOrNull ?? null,
      verifierExecutableBindingOrNull:
        prefix.verifierExecutableBindingOrNull ?? null,
      verifierOciImageDigestOrNull: prefix.verifierOciImageDigestOrNull ?? null,
      typedInterpreterBindingOrNull:
        prefix.typedInterpreterBindingOrNull ?? null,
      independentProofKernelBindingOrNull:
        prefix.independentProofKernelBindingOrNull ?? null,
      independentProofKernelToolchainBindingOrNull:
        prefix.independentProofKernelToolchainBindingOrNull ?? null,
      mpfrGmpRuntimeManifestBindingOrNull:
        prefix.mpfrGmpRuntimeManifestBindingOrNull ?? null,
      producerProjectionImplementationBindingOrNull:
        prefix.producerProjectionImplementationBindingOrNull ?? null,
      verifierProjectionImplementationBindingOrNull:
        prefix.verifierProjectionImplementationBindingOrNull ?? null,
      implementationSeparationReceiptBindingOrNull:
        prefix.implementationSeparationReceiptBindingOrNull ?? null,
      attemptedVerifierInputLedgerBindingOrNull:
        prefix.attemptedVerifierInputLedgerBindingOrNull ?? null,
      attemptedVerifierRuntimeChannelBindingOrNull:
        prefix.attemptedVerifierRuntimeChannelBindingOrNull ?? null,
      attemptedVerifierLaunchEnvelopeBindingOrNull:
        prefix.attemptedVerifierLaunchEnvelopeBindingOrNull ?? null,
      failureCode: code,
      firstFailedContextField: FAILURE_PAIRS[code],
      clockId: "CLOCK_MONOTONIC_RAW",
      contextEvaluationStartMonotonicNanoseconds: start,
      rejectionReceiptCloseMonotonicNanoseconds: close,
      verifierLaunchEnvelopeBinding: null,
      compositeReplayBundleBinding: null,
      verifierFullEnforcementReceiptBinding: null,
      typedInterpreterValidationReceiptBinding: null,
      atomicNestedRegistrationReceiptBinding: null,
      assemblerLaunchEnvelopeBinding: null,
      verifierLaunchAuthorized: false,
      executionAuthorized: false,
      registrationAllowed: false,
      seedAdmissionGranted: false,
      artifactAccepted: false,
      scientificAdmissionGranted: false,
      physicalAuthorityGranted: false,
      propulsionAuthorityGranted: false,
      transportAuthorityGranted: false,
      validatedContextRequired: true,
      allPassed: false,
    }),
  });
};

const snapshotProvider = (
  value: unknown,
):
  | Readonly<{
      ok: true;
      provider: Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV3;
    }>
  | Readonly<{ ok: false; issues: readonly string[] }> => {
  const record = exactDataRecord(value, PROVIDER_KEYS, true);
  const issues: string[] = [];
  if (record == null) {
    return Object.freeze({
      ok: false,
      issues: Object.freeze(["exact_frozen_plain_v3_provider_required"]),
    });
  }
  if (
    record.providerVersion !== NHM2_PROLATE_BOSON_STAR_SEED_V3_PROVIDER_VERSION
  )
    issues.push("provider_version_mismatch");
  if (typeof record.providerId !== "string" || !SAFE_ID.test(record.providerId))
    issues.push("provider_id_invalid");
  if (
    record.executionTarget !== NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_TARGET
  )
    issues.push("execution_target_mismatch");
  if (record.platform !== "linux") issues.push("linux_platform_required");
  if (
    !exactPinnedRecord(
      record.runPlanBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
    )
  )
    issues.push("sealed_v3_run_plan_binding_mismatch");
  if (
    !exactPinnedRecord(
      record.evidenceSchemaRegistryBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
    )
  )
    issues.push("sealed_v3_registry_binding_mismatch");
  for (const key of [
    "readClockMonotonicRawNanoseconds",
    "formVerifierLaunchEnvelope",
    "launchExactEvidenceAdmittedVerifier",
  ] as const) {
    if (typeof record[key] !== "function") issues.push(`${key}_required`);
  }
  if (issues.length > 0) {
    return Object.freeze({ ok: false, issues: Object.freeze(issues.sort()) });
  }
  return Object.freeze({
    ok: true,
    provider: value as Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV3,
  });
};

export const snapshotNhm2ProlateBosonStarSeedIsolatedWorkerProviderV3 =
  snapshotProvider;

declare const trustedHandleBrand: unique symbol;
export type Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle = Readonly<{
  readonly [trustedHandleBrand]: true;
}>;

type ProviderState = Readonly<{
  providerId: string;
  readClockMonotonicRawNanoseconds: Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV3["readClockMonotonicRawNanoseconds"];
  formVerifierLaunchEnvelope: Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV3["formVerifierLaunchEnvelope"];
  launchExactEvidenceAdmittedVerifier: Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV3["launchExactEvidenceAdmittedVerifier"];
  revoked: { value: boolean };
}>;

const PROVIDER_HANDLES = new WeakMap<object, ProviderState>();
const PREFLIGHT_SNAPSHOTS = new WeakMap<
  object,
  Readonly<{ state: ProviderState; consumed: { value: boolean } }>
>();

/** Trusted server-composition boundary. The returned handle has no data keys. */
export const installNhm2ProlateBosonStarSeedV3ProviderBehindTrustedServerHandle =
  (
    value: unknown,
  ):
    | Readonly<{
        ok: true;
        providerId: string;
        handle: Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle;
      }>
    | Readonly<{ ok: false; issues: readonly string[] }> => {
    const snapshot = snapshotProvider(value);
    if (snapshot.ok === false) return snapshot;
    const handle = Object.freeze(
      Object.create(null),
    ) as Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle;
    PROVIDER_HANDLES.set(
      handle,
      Object.freeze({
        providerId: snapshot.provider.providerId,
        readClockMonotonicRawNanoseconds:
          snapshot.provider.readClockMonotonicRawNanoseconds,
        formVerifierLaunchEnvelope:
          snapshot.provider.formVerifierLaunchEnvelope,
        launchExactEvidenceAdmittedVerifier:
          snapshot.provider.launchExactEvidenceAdmittedVerifier,
        revoked: { value: false },
      }),
    );
    return Object.freeze({
      ok: true,
      providerId: snapshot.provider.providerId,
      handle,
    });
  };

export const revokeNhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle = (
  handle: Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle,
): void => {
  const state = PROVIDER_HANDLES.get(handle);
  if (state != null) state.revoked.value = true;
};

const snapshotPreflightInput = (
  value: unknown,
): Readonly<Record<string, unknown>> | null =>
  exactDataRecord(value, PREFLIGHT_KEYS);

const snapshotProducerEnforcement = (
  value: unknown,
): Nhm2ProlateBosonStarSeedV3ProducerEnforcementContext | null => {
  const record = exactDataRecord(value, [
    "stageId",
    "sameAttemptId",
    "schedulerLeaseBinding",
    "binding",
  ]);
  const scheduler = snapshotBinding(
    record?.schedulerLeaseBinding,
    "scheduler_lease",
  );
  const binding = snapshotBinding(
    record?.binding,
    "producer_full_enforcement_receipt",
  );
  if (
    record == null ||
    record.stageId !== "untrusted_seed_producer" ||
    typeof record.sameAttemptId !== "string" ||
    !ATTEMPT_ID.test(record.sameAttemptId) ||
    scheduler == null ||
    binding == null
  )
    return null;
  return Object.freeze({
    stageId: "untrusted_seed_producer",
    sameAttemptId: record.sameAttemptId,
    schedulerLeaseBinding: scheduler,
    binding,
  });
};

const snapshotComposite = (
  value: unknown,
  artifactKind: "numeric_staging32_composite" | "raw_evidence6_composite",
): Nhm2ProlateBosonStarSeedV3AttemptBoundComposite | null => {
  const record = exactDataRecord(value, ["sameAttemptId", "binding"]);
  const binding = snapshotBinding(record?.binding, artifactKind);
  if (
    record == null ||
    typeof record.sameAttemptId !== "string" ||
    !ATTEMPT_ID.test(record.sameAttemptId) ||
    binding == null
  )
    return null;
  return Object.freeze({ sameAttemptId: record.sameAttemptId, binding });
};

const snapshotCandidate = (
  value: unknown,
): Nhm2ProlateBosonStarSeedV3CandidateInstanceContext | null => {
  const record = exactDataRecord(value, [
    "sameAttemptId",
    "commonRunRequestBinding",
    "producerFullEnforcementReceiptBinding",
    "numericStaging32CompositeBinding",
    "rawEvidence6CompositeBinding",
    "binding",
  ]);
  if (record == null || typeof record.sameAttemptId !== "string") return null;
  const common = snapshotBinding(
    record.commonRunRequestBinding,
    "common_run_request",
  );
  const producer = snapshotBinding(
    record.producerFullEnforcementReceiptBinding,
    "producer_full_enforcement_receipt",
  );
  const numeric = snapshotBinding(
    record.numericStaging32CompositeBinding,
    "numeric_staging32_composite",
  );
  const raw = snapshotBinding(
    record.rawEvidence6CompositeBinding,
    "raw_evidence6_composite",
  );
  const binding = snapshotBinding(
    record.binding,
    "candidate_instance_identity",
  );
  if (
    !ATTEMPT_ID.test(record.sameAttemptId) ||
    common == null ||
    producer == null ||
    numeric == null ||
    raw == null ||
    binding == null
  )
    return null;
  return Object.freeze({
    sameAttemptId: record.sameAttemptId,
    commonRunRequestBinding: common,
    producerFullEnforcementReceiptBinding: producer,
    numericStaging32CompositeBinding: numeric,
    rawEvidence6CompositeBinding: raw,
    binding,
  });
};

/**
 * Syntactically snapshots and checks the sealed-v3 prelaunch dependency
 * surface. It does not invoke provider envelope or launch callbacks: exact
 * runtime evidence must be interpreted and admitted before envelope formation.
 * Every failure produces an unbound additive-v3 rejection candidate with all
 * authority fields false/null.
 */
export const preflightNhm2ProlateBosonStarSeedVerifierContextV3 = async (
  handle: Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle,
  input: unknown,
): Promise<Nhm2ProlateBosonStarSeedV3PreflightResult> => {
  const state = PROVIDER_HANDLES.get(handle);
  if (state == null || state.revoked.value) {
    return Object.freeze({
      ok: false,
      status: "provider_failed",
      code: "trusted_server_handle_invalid_or_revoked",
      snapshot: null,
      rejection: null,
    });
  }
  const start = readClock(state);
  if (start == null) {
    return Object.freeze({
      ok: false,
      status: "provider_failed",
      code: "trusted_clock_unavailable_or_nonmonotonic",
      snapshot: null,
      rejection: null,
    });
  }
  const prefix: ValidatedPrefix = {};
  const record = snapshotPreflightInput(input);
  if (
    record == null ||
    record.providerId !== state.providerId ||
    !exactPinnedRecord(
      record.successorRunPlanBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
    ) ||
    !exactPinnedRecord(
      record.evidenceSchemaRegistryBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
    ) ||
    !exactPinnedRecord(
      record.numericMaterializationPolicyBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
    ) ||
    !exactPinnedRecord(
      record.postprojectionPolicyBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
    ) ||
    !exactPinnedRecord(
      record.numericOperationGraphBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
    ) ||
    !exactPinnedRecord(
      record.postprojectionOperationGraphBinding,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING,
    )
  ) {
    return makeRejection(
      state,
      start,
      "common_run_request_or_policy_input_invalid",
      prefix,
    );
  }
  const common = snapshotBinding(
    record.commonRunRequestBinding,
    "common_run_request",
  );
  if (common == null) {
    return makeRejection(
      state,
      start,
      "common_run_request_or_policy_input_invalid",
      prefix,
    );
  }
  prefix.commonRunRequestBindingOrNull = common;

  const scheduler = snapshotBinding(
    record.schedulerLeaseBinding,
    "scheduler_lease",
  );
  const attempt = snapshotAttempt(record.verifierWorkerAttempt);
  if (
    typeof record.sameAttemptId !== "string" ||
    !ATTEMPT_ID.test(record.sameAttemptId) ||
    scheduler == null ||
    attempt == null ||
    attempt.sameAttemptId !== record.sameAttemptId ||
    !sameBinding(attempt.schedulerLeaseBinding, scheduler)
  ) {
    return makeRejection(
      state,
      start,
      "scheduler_lease_or_worker_attempt_missing_or_invalid",
      prefix,
    );
  }
  prefix.sameAttemptIdOrNull = record.sameAttemptId;
  prefix.schedulerLeaseBindingOrNull = scheduler;
  prefix.verifierWorkerAttemptBindingOrNull = attempt.workerAttemptBinding;

  const deadline = snapshotBinding(
    record.absoluteDeadlineReceiptBinding,
    "absolute_deadline_receipt",
  );
  const quota = snapshotBinding(
    record.verifierQuotaSetupReceiptBinding,
    "verifier_quota_setup_receipt",
  );
  const seccomp = snapshotBinding(
    record.verifierSeccompLoadReceiptBinding,
    "verifier_seccomp_load_receipt",
  );
  if (deadline == null || quota == null || seccomp == null) {
    return makeRejection(
      state,
      start,
      "deadline_quota_or_seccomp_prerequisite_missing_or_invalid",
      prefix,
    );
  }
  prefix.absoluteDeadlineReceiptBindingOrNull = deadline;
  prefix.verifierQuotaSetupReceiptBindingOrNull = quota;
  prefix.verifierSeccompLoadReceiptBindingOrNull = seccomp;

  const producer = snapshotProducerEnforcement(record.producerFullEnforcement);
  if (
    producer == null ||
    producer.sameAttemptId !== record.sameAttemptId ||
    !sameBinding(producer.schedulerLeaseBinding, scheduler)
  ) {
    return makeRejection(
      state,
      start,
      "producer_full_enforcement_missing_or_invalid",
      prefix,
    );
  }
  prefix.producerFullEnforcementReceiptBindingOrNull = producer.binding;

  const numeric = snapshotComposite(
    record.numericStaging32Composite,
    "numeric_staging32_composite",
  );
  if (numeric == null || numeric.sameAttemptId !== record.sameAttemptId) {
    return makeRejection(
      state,
      start,
      "numeric_staging32_composite_missing_or_invalid",
      prefix,
    );
  }
  prefix.numericStaging32CompositeBindingOrNull = numeric.binding;

  const raw = snapshotComposite(
    record.rawEvidence6Composite,
    "raw_evidence6_composite",
  );
  if (raw == null || raw.sameAttemptId !== record.sameAttemptId) {
    return makeRejection(
      state,
      start,
      "raw_evidence6_composite_missing_or_invalid",
      prefix,
    );
  }
  prefix.rawEvidence6CompositeBindingOrNull = raw.binding;

  const candidate = snapshotCandidate(record.candidateInstanceIdentity);
  if (
    candidate == null ||
    candidate.sameAttemptId !== record.sameAttemptId ||
    !sameBinding(candidate.commonRunRequestBinding, common) ||
    !sameBinding(
      candidate.producerFullEnforcementReceiptBinding,
      producer.binding,
    ) ||
    !sameBinding(candidate.numericStaging32CompositeBinding, numeric.binding) ||
    !sameBinding(candidate.rawEvidence6CompositeBinding, raw.binding)
  ) {
    return makeRejection(
      state,
      start,
      "candidate_instance_identity_missing_or_mixed",
      prefix,
    );
  }
  prefix.candidateInstanceIdentityBindingOrNull = candidate.binding;

  const source = snapshotBinding(
    record.verifierSourceManifestBinding,
    "verifier_source_manifest",
  );
  const toolchain = snapshotBinding(
    record.verifierToolchainManifestBinding,
    "verifier_toolchain_manifest",
  );
  const executable = snapshotBinding(
    record.verifierExecutableBinding,
    "verifier_executable",
  );
  if (
    source == null ||
    toolchain == null ||
    executable == null ||
    typeof record.verifierOciImageDigest !== "string" ||
    !OCI_DIGEST.test(record.verifierOciImageDigest)
  ) {
    return makeRejection(
      state,
      start,
      "verifier_source_toolchain_executable_or_oci_missing_or_invalid",
      prefix,
    );
  }
  prefix.verifierSourceManifestBindingOrNull = source;
  prefix.verifierToolchainManifestBindingOrNull = toolchain;
  prefix.verifierExecutableBindingOrNull = executable;
  prefix.verifierOciImageDigestOrNull = record.verifierOciImageDigest;

  const interpreter = snapshotBinding(
    record.typedInterpreterBinding,
    "typed_interpreter",
  );
  if (interpreter == null) {
    return makeRejection(
      state,
      start,
      "typed_interpreter_missing_or_invalid",
      prefix,
    );
  }
  prefix.typedInterpreterBindingOrNull = interpreter;

  const mpfr = snapshotBinding(
    record.mpfrGmpRuntimeManifestBinding,
    "mpfr_gmp_runtime_manifest",
  );
  if (mpfr == null) {
    return makeRejection(
      state,
      start,
      "mpfr_gmp_runtime_manifest_missing_or_invalid",
      prefix,
    );
  }
  prefix.mpfrGmpRuntimeManifestBindingOrNull = mpfr;

  const proofKernel = snapshotBinding(
    record.independentProofKernelBinding,
    "independent_proof_kernel",
  );
  const proofToolchain = snapshotBinding(
    record.independentProofKernelToolchainBinding,
    "independent_proof_kernel_toolchain",
  );
  if (
    proofKernel == null ||
    proofToolchain == null ||
    proofKernel.sha256 === proofToolchain.sha256 ||
    proofKernel.sha256 === toolchain.sha256 ||
    proofToolchain.sha256 === toolchain.sha256
  ) {
    return makeRejection(
      state,
      start,
      "proof_kernel_or_toolchain_missing_or_invalid",
      prefix,
    );
  }
  prefix.independentProofKernelBindingOrNull = proofKernel;
  prefix.independentProofKernelToolchainBindingOrNull = proofToolchain;

  const producerProjection = snapshotBinding(
    record.producerProjectionImplementationBinding,
    "producer_projection_implementation",
  );
  const verifierProjection = snapshotBinding(
    record.verifierProjectionImplementationBinding,
    "verifier_projection_implementation",
  );
  const separation = snapshotBinding(
    record.implementationSeparationReceiptBinding,
    "implementation_separation_receipt",
  );
  if (
    producerProjection == null ||
    verifierProjection == null ||
    separation == null ||
    producerProjection.sha256 === verifierProjection.sha256
  ) {
    return makeRejection(
      state,
      start,
      "static_implementation_or_separation_missing_or_invalid",
      prefix,
    );
  }
  prefix.producerProjectionImplementationBindingOrNull = producerProjection;
  prefix.verifierProjectionImplementationBindingOrNull = verifierProjection;
  prefix.implementationSeparationReceiptBindingOrNull = separation;

  const ledger = snapshotBinding(
    record.verifierInputLedgerBinding,
    "verifier_input_ledger",
  );
  if (ledger == null) {
    return makeRejection(
      state,
      start,
      "verifier_input_ledger_formation_failed",
      prefix,
    );
  }
  prefix.attemptedVerifierInputLedgerBindingOrNull = ledger;

  const channel = snapshotBinding(
    record.verifierRuntimeChannelBinding,
    "verifier_runtime_channel",
  );
  if (channel == null) {
    return makeRejection(
      state,
      start,
      "verifier_channel_formation_or_secure_observation_failed",
      prefix,
    );
  }
  prefix.attemptedVerifierRuntimeChannelBindingOrNull = channel;

  const close = readClock(state);
  if (close == null || !monotonicNotBefore(start, close)) {
    return Object.freeze({
      ok: false,
      status: "provider_failed",
      code: "trusted_clock_unavailable_or_nonmonotonic",
      snapshot: null,
      rejection: null,
    });
  }
  const validatedInput = Object.freeze({
    providerId: state.providerId,
    successorRunPlanBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
    evidenceSchemaRegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
    numericMaterializationPolicyBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
    postprojectionPolicyBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
    numericOperationGraphBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
    postprojectionOperationGraphBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING,
    commonRunRequestBinding: common,
    sameAttemptId: record.sameAttemptId,
    schedulerLeaseBinding: scheduler,
    verifierWorkerAttempt: attempt,
    absoluteDeadlineReceiptBinding: deadline,
    verifierQuotaSetupReceiptBinding: quota,
    verifierSeccompLoadReceiptBinding: seccomp,
    producerFullEnforcement: producer,
    numericStaging32Composite: numeric,
    rawEvidence6Composite: raw,
    candidateInstanceIdentity: candidate,
    verifierSourceManifestBinding: source,
    verifierToolchainManifestBinding: toolchain,
    verifierExecutableBinding: executable,
    verifierOciImageDigest: record.verifierOciImageDigest,
    typedInterpreterBinding: interpreter,
    independentProofKernelBinding: proofKernel,
    independentProofKernelToolchainBinding: proofToolchain,
    mpfrGmpRuntimeManifestBinding: mpfr,
    producerProjectionImplementationBinding: producerProjection,
    verifierProjectionImplementationBinding: verifierProjection,
    implementationSeparationReceiptBinding: separation,
    verifierInputLedgerBinding: ledger,
    verifierRuntimeChannelBinding: channel,
  }) as Nhm2ProlateBosonStarSeedV3VerifierPreflightInput;
  const snapshot = Object.freeze({
    snapshotVersion:
      "nhm2_prolate_boson_star_seed_v3_syntactic_preflight_snapshot/v1" as const,
    providerId: state.providerId,
    stageId: "trusted_independent_verifier" as const,
    sameAttemptId: record.sameAttemptId,
    successorRunPlanBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
    evidenceSchemaRegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
    input: validatedInput,
    attemptedLaunchEnvelopeBinding: null,
    contextEvaluationStartMonotonicNanoseconds: start,
    contextValidationCloseMonotonicNanoseconds: close,
    exactRuntimeEvidenceInterpretationCompleted: false as const,
    launchEligible: false as const,
    launchAuthorityFromMetadata: false as const,
    executionAuthorized: false as const,
    artifactAuthorityGranted: false as const,
    scientificAuthorityGranted: false as const,
    physicalAuthorityGranted: false as const,
  });
  PREFLIGHT_SNAPSHOTS.set(
    snapshot,
    Object.freeze({ state, consumed: { value: false } }),
  );
  return Object.freeze({
    ok: true,
    status: "syntactic_preflight_snapshot_launch_ineligible",
    snapshot,
    rejection: null,
    blocker:
      "exact_v3_runtime_evidence_interpretation_and_admission_token_absent",
    exactSchemaInterpretationCompleted: false,
    launchEligible: false,
  });
};

const providerFailedResult = (
  issue: string,
): Nhm2ProlateBosonStarSeedV3ProviderResult =>
  Object.freeze({
    status: "provider_failed",
    rawEvidenceCanonicalUtf8Bytes: Object.freeze([]),
    issues: Object.freeze([issue]),
    authorityLocks:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks,
  });

/**
 * The only launch surface. Both the WeakMap-backed server handle and an exact,
 * single-use preflight snapshot and a future exact-evidence admission token
 * are required. This slice deliberately has no token issuer, so installing a
 * provider cannot launch it. No catalog object can supply any of these values.
 */
declare const exactEvidenceAdmissionTokenBrand: unique symbol;
export type Nhm2ProlateBosonStarSeedV3ExactEvidenceAdmissionToken = Readonly<{
  readonly [exactEvidenceAdmissionTokenBrand]: true;
}>;
const EXACT_EVIDENCE_ADMISSION_TOKENS = new WeakMap<
  object,
  Readonly<{
    state: ProviderState;
    snapshot: Nhm2ProlateBosonStarSeedV3PreflightSnapshot;
  }>
>();

export const launchNhm2ProlateBosonStarSeedVerifierWithTrustedServerHandleV3 =
  async (
    handle: Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle,
    snapshot: Nhm2ProlateBosonStarSeedV3PreflightSnapshot,
    exactEvidenceAdmissionToken: Nhm2ProlateBosonStarSeedV3ExactEvidenceAdmissionToken,
  ): Promise<Nhm2ProlateBosonStarSeedV3ProviderResult> => {
    const state = PROVIDER_HANDLES.get(handle);
    const snapshotState = PREFLIGHT_SNAPSHOTS.get(snapshot);
    const admission = EXACT_EVIDENCE_ADMISSION_TOKENS.get(
      exactEvidenceAdmissionToken,
    );
    if (
      state == null ||
      state.revoked.value ||
      snapshotState == null ||
      snapshotState.state !== state ||
      snapshotState.consumed.value ||
      admission == null ||
      admission.state !== state ||
      admission.snapshot !== snapshot
    ) {
      return providerFailedResult(
        "exact_v3_runtime_evidence_admission_token_required",
      );
    }
    snapshotState.consumed.value = true;
    let raw: Nhm2ProlateBosonStarSeedV3ProviderRawResult;
    try {
      raw = await Reflect.apply(
        state.launchExactEvidenceAdmittedVerifier,
        undefined,
        [snapshot],
      );
    } catch {
      return providerFailedResult("trusted_provider_launch_failed");
    }
    const record = exactDataRecord(raw, [
      "status",
      "rawEvidenceCanonicalUtf8Bytes",
      "issues",
    ]);
    if (
      record == null ||
      (record.status !== "raw_evidence_only" &&
        record.status !== "provider_failed") ||
      !Array.isArray(record.rawEvidenceCanonicalUtf8Bytes) ||
      !Array.isArray(record.issues) ||
      record.rawEvidenceCanonicalUtf8Bytes.length >
        MAXIMUM_RAW_RESULT_FILE_COUNT
    ) {
      return providerFailedResult("trusted_provider_result_invalid");
    }
    const bytes: Uint8Array[] = [];
    let total = 0;
    for (const value of record.rawEvidenceCanonicalUtf8Bytes) {
      if (!(value instanceof Uint8Array))
        return providerFailedResult("trusted_provider_result_invalid");
      total += value.byteLength;
      if (total > MAXIMUM_RAW_RESULT_TOTAL_BYTES)
        return providerFailedResult("trusted_provider_result_over_limit");
      bytes.push(Uint8Array.from(value));
    }
    const issues: string[] = [];
    for (const value of record.issues) {
      if (
        typeof value !== "string" ||
        value.length > 160 ||
        !/^[a-z0-9_:.-]+$/.test(value)
      )
        return providerFailedResult("trusted_provider_result_invalid");
      issues.push(value);
    }
    return Object.freeze({
      status: record.status,
      rawEvidenceCanonicalUtf8Bytes: Object.freeze(bytes),
      issues: Object.freeze(issues),
      authorityLocks:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks,
    });
  };

export const NHM2_PROLATE_BOSON_STAR_SEED_V3_PROVIDER_SEALED_BINDINGS =
  Object.freeze({
    runPlanSha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256_DOMAIN,
    runPlanSha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256,
    runPlanCanonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_CANONICAL_SIZE_BYTES,
    evidenceRegistrySha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256_DOMAIN,
    evidenceRegistrySha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256,
    evidenceRegistryCanonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
    verifierPrelaunchContextRejectionSchemaBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SCHEMA_BINDINGS.verifierPrelaunchContextRejection,
  } as const);
