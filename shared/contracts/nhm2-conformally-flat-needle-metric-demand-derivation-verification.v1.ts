import { createHash } from "node:crypto";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFERENCE_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256,
  canonicalNhm2ConformallyFlatNeedleMetricDemandJson,
  type Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
} from "./nhm2-conformally-flat-needle-metric-demand-interval-producer.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_metric_demand_derivation_verification" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_metric_demand_derivation_verification/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES =
  Object.freeze({
    producerRunReceipt: 2 * 1024 * 1024,
    intervalTrace: 8 * 1024 * 1024,
    centralTensor: 64 * 10 * 8,
    absoluteErrorBound: 64 * 10 * 8,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TERMINAL_V2_NUMERICAL_RESULT =
  Object.freeze({
    maximumRelativeFrobeniusEnclosure: 0.12854082269732725 as const,
    minimumDenominatorLowerBound: 0.8965265656068966 as const,
    strictlyPositiveComponentErrorBoundCount: 640 as const,
    frozenRelativeEnclosureTarget: 0.01 as const,
    gate: "frozen_enclosure_target_failed_without_retuning" as const,
    candidateInputAdmissible: false as const,
  });

/**
 * This hash fixes the reference, formula, conventions, constants, units, tensor
 * order, and exact static-flow cancellation that the structural replayer is
 * allowed to inspect.  It is not a hash of an independent numerical engine.
 */
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_FORMULA_REFERENCE_BINDING =
  Object.freeze({
    referenceSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFERENCE_SHA256,
    configurationSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
    formulaId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION.formulaId,
    integrationAlgorithmId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID,
    priorV1FailureObservationSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256,
    dimensionReduction:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION.dimensionReduction,
    componentOrder:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION.componentOrder,
    constants:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION.constants,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_FORMULA_REFERENCE_SHA256 =
  createHash("sha256")
    .update(
      canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_FORMULA_REFERENCE_BINDING,
      ),
      "utf8",
    )
    .digest("hex");

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_BLOCKERS =
  Object.freeze([
    "independent_transcendental_interval_replay_not_implemented",
    "producer_interval_trace_not_independently_recomputed",
    "outer_executor_provenance_bound_not_independently_authenticated",
    "independent_metric_demand_implementation_not_compared",
    "candidate_input_inadmissible_without_independent_transcendental_replay",
    "prior_v1_failure_observation_unauthenticated",
    "independent_wall_heap_rss_resource_envelope_not_verified",
    "outer_execution_driver_source_not_hash_bound",
    "structural_replayer_runtime_provenance_not_independently_authenticated",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CLAIM_LOCKS =
  Object.freeze({
    producerReceiptPromotedBeyondBindingEvidence: false as const,
    outerExecutorProvenanceIndependentlyAuthenticated: false as const,
    outerExecutionDriverSourceBound: false as const,
    independentTranscendentalIntervalReplay: false as const,
    structuralReplayerProvenanceIndependentlyAuthenticated: false as const,
    deterministicErrorBoundAuthority: false as const,
    metricDemandDerivationAuthority: false as const,
    candidateInputAdmissible: false as const,
    candidateManifestAuthority: false as const,
    scientificPresealAuthority: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    runtimeResourceSafety: false as const,
    diagnosticPass: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
  });

export type Nhm2ConformallyFlatNeedleMetricDemandByteBindingV1 = {
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ConformallyFlatNeedleMetricDemandIndependentReplayIdentityV1 = {
  implementationId: "server_structural_trace_replayer_without_transcendental_engine/v1";
  implementationSourceSha256: string;
  dependencyLockSha256: string;
  toolchainArtifactSha256: string;
  executableSha256: string;
  implementationContractSha256: string;
  sourceRelationshipToProducer: "separate_server_module_but_no_independent_transcendental_implementation";
};

export type Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1 = {
  artifactId: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_ARTIFACT_ID;
  contractVersion: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CONTRACT_VERSION;
  authority: "diagnostic_structural_binding_only";
  status: "blocked_structural_replay_only_candidate_input_inadmissible";
  verificationId: string;
  producerBinding: {
    producerReceiptCanonicalBytes: Nhm2ConformallyFlatNeedleMetricDemandByteBindingV1;
    producerReceiptIntegrityValid: true;
    producerReceiptAuthorityPreservedAsBindingOnly: true;
    candidateInputAdmissible: false;
    protocolLineage: "v2_midpoint_hessian_interval";
    integrationAlgorithmId: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID;
    lineageSeparationExact: true;
    priorV1FailureObservation: {
      sha256: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256;
      authority: "unauthenticated_development_observation_only";
      numericalGate: "failed_0p01_enclosure_target";
      scientificCandidateDisposition: "inconclusive_not_a_candidate_failure";
      executorAuthenticated: false;
      outputBytesPersisted: false;
      retuned: false;
      promotedIntoV2Evidence: false;
    };
    producerFrozenEnclosureGate: "frozen_enclosure_target_failed_without_retuning";
    configurationSha256: string;
    formulaReferenceSha256: string;
    sixFrozenScienceInputBindings: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS;
    centralTensorBytes: Nhm2ConformallyFlatNeedleMetricDemandByteBindingV1;
    absoluteErrorBoundBytes: Nhm2ConformallyFlatNeedleMetricDemandByteBindingV1;
    canonicalIntervalTraceBytes: Nhm2ConformallyFlatNeedleMetricDemandByteBindingV1;
    canonicalDerivationReceiptBytes: Nhm2ConformallyFlatNeedleMetricDemandByteBindingV1;
  };
  outerExecutorObservation: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["executionObservation"];
  exclusiveOutputObservation: {
    outputDirectory: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["outputDirectory"];
    outputs: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["outputs"];
    allOutputsAbsentBeforeExclusiveCreate: true;
    allOutputsSecurelyReread: true;
  };
  terminalFailureReproduction: {
    runMode: "receipt_capture_reproduction_of_terminal_v2_failure";
    priorObservation: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["priorTerminalObservation"];
    bitwiseReproduction: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["bitwiseReproduction"];
    priorObservationAuthorityNotPromoted: true;
    candidateInputAdmissible: false;
  };
  structuralReplay: {
    traceParsedWithBoundedFatalUtf8CanonicalJson: true;
    frozenConfigurationExact: true;
    frozenReferenceAndFormulaBindingExact: true;
    unitsComponentOrderConstantsAndConventionsExact: true;
    exactStaticFlowTimeFactorCancellationBound: true;
    v2MidpointHessianTraceSemanticsExact: true;
    priorV1FailureObservationNotPromoted: true;
    sampleAndComponentCoverage64By10Exact: true;
    allRefinementLevelsPresentWithoutCoverageGaps: true;
    allDenominatorLowerBoundsStrictlyPositive: true;
    all640ErrorBoundsStrictlyPositive: true;
    intervalMidpointAndRadiusRelationsRecomputed: true;
    cumulativeIntersectionRelationsRecomputed: true;
    centralAndErrorFloat64BytesExactlyMatched: true;
    multiplicityWeightedFrobeniusRatiosRecomputed: true;
    producerReportedTargetMetAtEverySample: false;
    reportedFrozenEnclosureGate: "frozen_enclosure_target_failed_without_retuning";
    maximumReportedRelativeFrobeniusEnclosure: number;
    minimumReportedDenominatorLowerBound: number;
    traceGateDispositionExactlyRecomputed: true;
    candidateInputAdmissible: false;
    traceSummaryExactlyRecomputed: true;
    traceSha256AndDerivationReceiptIntegrityExact: true;
    mathematicalScope: "reported_trace_relations_only_not_independent_integrand_or_transcendental_enclosure_replay";
  };
  independentReplay: {
    identity: Nhm2ConformallyFlatNeedleMetricDemandIndependentReplayIdentityV1;
    engineStatus: "not_implemented";
    transcendentalPrimitivesRecomputed: false;
    cellwiseIntegrandsRecomputed: false;
    intervalEnclosuresIndependentlyEstablished: false;
    producerImplementationImportedOrCalled: false;
    selfAuthoredStatusCanClearAuthority: false;
  };
  resourceEnvelope: {
    producerObservation: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["resourceObservation"];
    traceBytesBoundedByVerifier: true;
    producerExecutionModel: "in_process_synchronous_derivation";
    independentlyVerifiedWallTimeCap: false;
    independentlyVerifiedHeapCap: false;
    independentlyVerifiedRssCap: false;
    resourceSafetyAuthority: false;
  };
  authorityBlockers: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_BLOCKERS;
  claimLocks: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CLAIM_LOCKS;
  integrity: {
    hashAlgorithm: "sha256";
    canonicalization: "utf8_lexicographic_object_keys_json_v1";
    artifactSha256: string;
  };
};

type UnsignedVerification = Omit<
  Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1,
  "integrity"
> & {
  integrity: Omit<
    Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1["integrity"],
    "artifactSha256"
  >;
};

export const computeNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationSha256 =
  (value: UnsignedVerification): string =>
    createHash("sha256")
      .update(canonicalNhm2ConformallyFlatNeedleMetricDemandJson(value), "utf8")
      .digest("hex");

const SHA256 = /^[a-f0-9]{64}$/;
const validSha = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const validIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const hasExactPlainDataKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> => {
  if (
    value == null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return false;
  }
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length &&
    keys.every(
      (key) =>
        typeof key === "string" &&
        expected.includes(key) &&
        (() => {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          return (
            descriptor != null &&
            "value" in descriptor &&
            descriptor.enumerable === true
          );
        })(),
    )
  );
};

export const hasValidNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationIntegrity =
  (
    value: unknown,
  ): value is Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1 => {
    try {
      if (value == null || typeof value !== "object" || Array.isArray(value)) {
        return false;
      }
      const artifact =
        value as Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1;
      if (
        !hasExactPlainDataKeys(artifact, [
          "artifactId",
          "contractVersion",
          "authority",
          "status",
          "verificationId",
          "producerBinding",
          "outerExecutorObservation",
          "exclusiveOutputObservation",
          "terminalFailureReproduction",
          "structuralReplay",
          "independentReplay",
          "resourceEnvelope",
          "authorityBlockers",
          "claimLocks",
          "integrity",
        ]) ||
        !hasExactPlainDataKeys(artifact.integrity, [
          "hashAlgorithm",
          "canonicalization",
          "artifactSha256",
        ]) ||
        !hasExactPlainDataKeys(artifact.producerBinding, [
          "producerReceiptCanonicalBytes",
          "producerReceiptIntegrityValid",
          "producerReceiptAuthorityPreservedAsBindingOnly",
          "candidateInputAdmissible",
          "protocolLineage",
          "integrationAlgorithmId",
          "lineageSeparationExact",
          "priorV1FailureObservation",
          "producerFrozenEnclosureGate",
          "configurationSha256",
          "formulaReferenceSha256",
          "sixFrozenScienceInputBindings",
          "centralTensorBytes",
          "absoluteErrorBoundBytes",
          "canonicalIntervalTraceBytes",
          "canonicalDerivationReceiptBytes",
        ]) ||
        ![
          artifact.producerBinding.producerReceiptCanonicalBytes,
          artifact.producerBinding.centralTensorBytes,
          artifact.producerBinding.absoluteErrorBoundBytes,
          artifact.producerBinding.canonicalIntervalTraceBytes,
          artifact.producerBinding.canonicalDerivationReceiptBytes,
        ].every((binding) =>
          hasExactPlainDataKeys(binding, ["sha256", "sizeBytes"]),
        ) ||
        !hasExactPlainDataKeys(artifact.outerExecutorObservation, [
          "invocationId",
          "repositoryRoot",
          "gitCommitSha",
          "gitWorktreeState",
          "command",
          "argv",
          "startedAt",
          "completedAt",
          "durationMs",
          "exitCode",
          "implementationSourceSha256",
          "dependencyLockSha256",
          "toolchainArtifactSha256",
          "executableSha256",
          "observationLimit",
          "implementationHashesStableAcrossCalculation",
        ]) ||
        !hasExactPlainDataKeys(artifact.exclusiveOutputObservation, [
          "outputDirectory",
          "outputs",
          "allOutputsAbsentBeforeExclusiveCreate",
          "allOutputsSecurelyReread",
        ]) ||
        !hasExactPlainDataKeys(
          artifact.exclusiveOutputObservation.outputDirectory,
          ["absolutePath", "prestate", "creation", "freshness"],
        ) ||
        !Array.isArray(artifact.exclusiveOutputObservation.outputs) ||
        artifact.exclusiveOutputObservation.outputs.length !== 4 ||
        artifact.exclusiveOutputObservation.outputs.some(
          (output) =>
            !hasExactPlainDataKeys(output, [
              "role",
              "relativePath",
              "absolutePath",
              "sha256",
              "sizeBytes",
              "freshness",
              "prestate",
              "secureReadbackVerified",
              "filesystemIdentity",
            ]) ||
            !hasExactPlainDataKeys(output.filesystemIdentity, [
              "dev",
              "ino",
              "sizeBytes",
              "mtimeNs",
              "ctimeNs",
            ]),
        ) ||
        !hasExactPlainDataKeys(artifact.terminalFailureReproduction, [
          "runMode",
          "priorObservation",
          "bitwiseReproduction",
          "priorObservationAuthorityNotPromoted",
          "candidateInputAdmissible",
        ]) ||
        !hasExactPlainDataKeys(
          artifact.terminalFailureReproduction.priorObservation,
          [
            "authority",
            "outputDirectoryAbsolutePath",
            "configurationSha256",
            "implementationSourceSha256",
            "executorReceiptPresent",
            "numericalGate",
            "maximumRelativeFrobeniusEnclosure",
            "frozenRelativeEnclosureTarget",
            "outputs",
          ],
        ) ||
        !Array.isArray(
          artifact.terminalFailureReproduction.priorObservation.outputs,
        ) ||
        artifact.terminalFailureReproduction.priorObservation.outputs.length !==
          3 ||
        artifact.terminalFailureReproduction.priorObservation.outputs.some(
          (output) =>
            !hasExactPlainDataKeys(output, [
              "role",
              "relativePath",
              "absolutePath",
              "sha256",
              "sizeBytes",
              "freshness",
              "filesystemIdentity",
            ]) ||
            !hasExactPlainDataKeys(output.filesystemIdentity, [
              "dev",
              "ino",
              "sizeBytes",
              "mtimeNs",
              "ctimeNs",
            ]),
        ) ||
        !hasExactPlainDataKeys(
          artifact.terminalFailureReproduction.bitwiseReproduction,
          [
            "centralTensorSha256Identical",
            "deterministicErrorBoundSha256Identical",
            "intervalTraceSha256Identical",
            "allThreeOutputsBitwiseIdentical",
          ],
        ) ||
        !hasExactPlainDataKeys(artifact.structuralReplay, [
          "traceParsedWithBoundedFatalUtf8CanonicalJson",
          "frozenConfigurationExact",
          "frozenReferenceAndFormulaBindingExact",
          "unitsComponentOrderConstantsAndConventionsExact",
          "exactStaticFlowTimeFactorCancellationBound",
          "v2MidpointHessianTraceSemanticsExact",
          "priorV1FailureObservationNotPromoted",
          "sampleAndComponentCoverage64By10Exact",
          "allRefinementLevelsPresentWithoutCoverageGaps",
          "allDenominatorLowerBoundsStrictlyPositive",
          "all640ErrorBoundsStrictlyPositive",
          "intervalMidpointAndRadiusRelationsRecomputed",
          "cumulativeIntersectionRelationsRecomputed",
          "centralAndErrorFloat64BytesExactlyMatched",
          "multiplicityWeightedFrobeniusRatiosRecomputed",
          "producerReportedTargetMetAtEverySample",
          "reportedFrozenEnclosureGate",
          "maximumReportedRelativeFrobeniusEnclosure",
          "minimumReportedDenominatorLowerBound",
          "traceGateDispositionExactlyRecomputed",
          "candidateInputAdmissible",
          "traceSummaryExactlyRecomputed",
          "traceSha256AndDerivationReceiptIntegrityExact",
          "mathematicalScope",
        ]) ||
        !hasExactPlainDataKeys(artifact.independentReplay.identity, [
          "implementationId",
          "implementationSourceSha256",
          "dependencyLockSha256",
          "toolchainArtifactSha256",
          "executableSha256",
          "implementationContractSha256",
          "sourceRelationshipToProducer",
        ]) ||
        artifact.artifactId !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_ARTIFACT_ID ||
        artifact.contractVersion !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CONTRACT_VERSION ||
        artifact.authority !== "diagnostic_structural_binding_only" ||
        artifact.status !==
          "blocked_structural_replay_only_candidate_input_inadmissible" ||
        !validSha(artifact.verificationId) ||
        !validSha(artifact.outerExecutorObservation.invocationId) ||
        !/^[a-f0-9]{40}$/.test(
          artifact.outerExecutorObservation.gitCommitSha,
        ) ||
        artifact.outerExecutorObservation.gitWorktreeState !== "clean" ||
        typeof artifact.outerExecutorObservation.repositoryRoot !== "string" ||
        artifact.outerExecutorObservation.repositoryRoot.length === 0 ||
        typeof artifact.outerExecutorObservation.command !== "string" ||
        artifact.outerExecutorObservation.command.length === 0 ||
        !Array.isArray(artifact.outerExecutorObservation.argv) ||
        artifact.outerExecutorObservation.argv.length === 0 ||
        artifact.outerExecutorObservation.argv.some(
          (entry) => typeof entry !== "string",
        ) ||
        !validIsoTimestamp(artifact.outerExecutorObservation.startedAt) ||
        !validIsoTimestamp(artifact.outerExecutorObservation.completedAt) ||
        Date.parse(artifact.outerExecutorObservation.completedAt) <
          Date.parse(artifact.outerExecutorObservation.startedAt) ||
        !Number.isFinite(artifact.outerExecutorObservation.durationMs) ||
        artifact.outerExecutorObservation.durationMs < 0 ||
        artifact.outerExecutorObservation.exitCode !== 0 ||
        !validSha(
          artifact.outerExecutorObservation.implementationSourceSha256,
        ) ||
        !validSha(artifact.outerExecutorObservation.dependencyLockSha256) ||
        !validSha(artifact.outerExecutorObservation.toolchainArtifactSha256) ||
        !validSha(artifact.outerExecutorObservation.executableSha256) ||
        artifact.outerExecutorObservation.observationLimit !==
          "host_process_observed_in_process_operation_not_independent_replay" ||
        artifact.outerExecutorObservation
          .implementationHashesStableAcrossCalculation !== true ||
        !validSha(artifact.integrity?.artifactSha256) ||
        artifact.integrity.hashAlgorithm !== "sha256" ||
        artifact.integrity.canonicalization !==
          "utf8_lexicographic_object_keys_json_v1" ||
        artifact.producerBinding?.producerReceiptIntegrityValid !== true ||
        artifact.producerBinding
          ?.producerReceiptAuthorityPreservedAsBindingOnly !== true ||
        artifact.producerBinding.candidateInputAdmissible !== false ||
        artifact.producerBinding.protocolLineage !==
          "v2_midpoint_hessian_interval" ||
        artifact.producerBinding.integrationAlgorithmId !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID ||
        artifact.producerBinding.lineageSeparationExact !== true ||
        canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
          artifact.producerBinding.priorV1FailureObservation,
        ) !==
          canonicalNhm2ConformallyFlatNeedleMetricDemandJson({
            sha256:
              NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256,
            authority:
              NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.authority,
            numericalGate:
              NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.numericalGate,
            scientificCandidateDisposition:
              NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.scientificCandidateDisposition,
            executorAuthenticated: false,
            outputBytesPersisted: false,
            retuned: false,
            promotedIntoV2Evidence: false,
          }) ||
        artifact.producerBinding.producerFrozenEnclosureGate !==
          "frozen_enclosure_target_failed_without_retuning" ||
        artifact.producerBinding.configurationSha256 !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 ||
        artifact.producerBinding.formulaReferenceSha256 !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_FORMULA_REFERENCE_SHA256 ||
        canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
          artifact.producerBinding.sixFrozenScienceInputBindings,
        ) !==
          canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
          ) ||
        ![
          artifact.producerBinding.producerReceiptCanonicalBytes,
          artifact.producerBinding.centralTensorBytes,
          artifact.producerBinding.absoluteErrorBoundBytes,
          artifact.producerBinding.canonicalIntervalTraceBytes,
          artifact.producerBinding.canonicalDerivationReceiptBytes,
        ].every(
          (binding) =>
            validSha(binding?.sha256) &&
            Number.isSafeInteger(binding.sizeBytes) &&
            binding.sizeBytes > 0,
        ) ||
        artifact.exclusiveOutputObservation
          ?.allOutputsAbsentBeforeExclusiveCreate !== true ||
        artifact.exclusiveOutputObservation?.allOutputsSecurelyReread !==
          true ||
        artifact.exclusiveOutputObservation.outputDirectory.prestate !==
          "absent_observed_before_exclusive_create" ||
        artifact.exclusiveOutputObservation.outputDirectory.creation !==
          "directory_created_exclusively" ||
        artifact.exclusiveOutputObservation.outputDirectory.freshness !==
          "new" ||
        artifact.exclusiveOutputObservation.outputs.some((output, index) => {
          const expectedRoles = [
            "metric_demand_tensor",
            "metric_demand_absolute_error_bound",
            "metric_demand_interval_trace",
            "metric_demand_derivation_receipt",
          ];
          const bindings = [
            artifact.producerBinding.centralTensorBytes,
            artifact.producerBinding.absoluteErrorBoundBytes,
            artifact.producerBinding.canonicalIntervalTraceBytes,
            artifact.producerBinding.canonicalDerivationReceiptBytes,
          ];
          return (
            output.role !== expectedRoles[index] ||
            output.sha256 !== bindings[index].sha256 ||
            output.sizeBytes !== bindings[index].sizeBytes ||
            output.freshness !== "created_new_during_execution" ||
            output.prestate !== "absent_observed_before_exclusive_create" ||
            output.secureReadbackVerified !== true ||
            output.filesystemIdentity.sizeBytes !== String(output.sizeBytes) ||
            !Object.values(output.filesystemIdentity).every(
              (entry) => typeof entry === "string" && /^\d+$/.test(entry),
            )
          );
        }) ||
        artifact.terminalFailureReproduction?.runMode !==
          "receipt_capture_reproduction_of_terminal_v2_failure" ||
        artifact.terminalFailureReproduction.priorObservation?.authority !==
          "unauthenticated_partial_terminal_output_observation" ||
        artifact.terminalFailureReproduction.priorObservation
          .configurationSha256 !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 ||
        artifact.terminalFailureReproduction.priorObservation
          .implementationSourceSha256 !== null ||
        artifact.terminalFailureReproduction.priorObservation
          .executorReceiptPresent !== false ||
        artifact.terminalFailureReproduction.priorObservation
          .maximumRelativeFrobeniusEnclosure !== 0.12854082269732725 ||
        artifact.terminalFailureReproduction.priorObservation
          .frozenRelativeEnclosureTarget !== 0.01 ||
        artifact.terminalFailureReproduction.priorObservation.numericalGate !==
          "frozen_enclosure_target_failed_without_retuning" ||
        artifact.terminalFailureReproduction.priorObservation.outputs.some(
          (output, index) => {
            const bindings = [
              artifact.producerBinding.centralTensorBytes,
              artifact.producerBinding.absoluteErrorBoundBytes,
              artifact.producerBinding.canonicalIntervalTraceBytes,
            ];
            return (
              output.sha256 !== bindings[index].sha256 ||
              output.sizeBytes !== bindings[index].sizeBytes ||
              output.freshness !==
                "preexisting_terminal_partial_securely_reread_for_reproduction" ||
              output.filesystemIdentity.sizeBytes !==
                String(output.sizeBytes) ||
              !Object.values(output.filesystemIdentity).every(
                (entry) => typeof entry === "string" && /^\d+$/.test(entry),
              )
            );
          },
        ) ||
        artifact.terminalFailureReproduction
          .priorObservationAuthorityNotPromoted !== true ||
        artifact.terminalFailureReproduction.candidateInputAdmissible !==
          false ||
        !Object.values(
          artifact.terminalFailureReproduction.bitwiseReproduction ?? {},
        ).every((entry) => entry === true) ||
        artifact.structuralReplay
          ?.traceParsedWithBoundedFatalUtf8CanonicalJson !== true ||
        artifact.structuralReplay.frozenConfigurationExact !== true ||
        artifact.structuralReplay.frozenReferenceAndFormulaBindingExact !==
          true ||
        artifact.structuralReplay
          .unitsComponentOrderConstantsAndConventionsExact !== true ||
        artifact.structuralReplay.exactStaticFlowTimeFactorCancellationBound !==
          true ||
        artifact.structuralReplay.v2MidpointHessianTraceSemanticsExact !==
          true ||
        artifact.structuralReplay.priorV1FailureObservationNotPromoted !==
          true ||
        artifact.structuralReplay.sampleAndComponentCoverage64By10Exact !==
          true ||
        artifact.structuralReplay
          .allRefinementLevelsPresentWithoutCoverageGaps !== true ||
        artifact.structuralReplay.allDenominatorLowerBoundsStrictlyPositive !==
          true ||
        artifact.structuralReplay.all640ErrorBoundsStrictlyPositive !== true ||
        artifact.structuralReplay
          .intervalMidpointAndRadiusRelationsRecomputed !== true ||
        artifact.structuralReplay.cumulativeIntersectionRelationsRecomputed !==
          true ||
        artifact.structuralReplay.centralAndErrorFloat64BytesExactlyMatched !==
          true ||
        artifact.structuralReplay
          .multiplicityWeightedFrobeniusRatiosRecomputed !== true ||
        artifact.structuralReplay.traceGateDispositionExactlyRecomputed !==
          true ||
        artifact.structuralReplay.candidateInputAdmissible !== false ||
        artifact.structuralReplay.reportedFrozenEnclosureGate !==
          artifact.producerBinding.producerFrozenEnclosureGate ||
        artifact.structuralReplay.producerReportedTargetMetAtEverySample !==
          false ||
        !Number.isFinite(
          artifact.structuralReplay.maximumReportedRelativeFrobeniusEnclosure,
        ) ||
        artifact.structuralReplay.maximumReportedRelativeFrobeniusEnclosure <
          0 ||
        artifact.structuralReplay.maximumReportedRelativeFrobeniusEnclosure !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TERMINAL_V2_NUMERICAL_RESULT.maximumRelativeFrobeniusEnclosure ||
        !Number.isFinite(
          artifact.structuralReplay.minimumReportedDenominatorLowerBound,
        ) ||
        artifact.structuralReplay.minimumReportedDenominatorLowerBound <= 0 ||
        artifact.structuralReplay.minimumReportedDenominatorLowerBound !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TERMINAL_V2_NUMERICAL_RESULT.minimumDenominatorLowerBound ||
        artifact.structuralReplay.traceSummaryExactlyRecomputed !== true ||
        artifact.structuralReplay
          .traceSha256AndDerivationReceiptIntegrityExact !== true ||
        artifact.structuralReplay?.mathematicalScope !==
          "reported_trace_relations_only_not_independent_integrand_or_transcendental_enclosure_replay" ||
        artifact.independentReplay?.engineStatus !== "not_implemented" ||
        !hasExactPlainDataKeys(artifact.independentReplay, [
          "identity",
          "engineStatus",
          "transcendentalPrimitivesRecomputed",
          "cellwiseIntegrandsRecomputed",
          "intervalEnclosuresIndependentlyEstablished",
          "producerImplementationImportedOrCalled",
          "selfAuthoredStatusCanClearAuthority",
        ]) ||
        artifact.independentReplay.identity?.implementationId !==
          "server_structural_trace_replayer_without_transcendental_engine/v1" ||
        !validSha(
          artifact.independentReplay.identity.implementationSourceSha256,
        ) ||
        !validSha(artifact.independentReplay.identity.dependencyLockSha256) ||
        !validSha(
          artifact.independentReplay.identity.toolchainArtifactSha256,
        ) ||
        !validSha(artifact.independentReplay.identity.executableSha256) ||
        !validSha(
          artifact.independentReplay.identity.implementationContractSha256,
        ) ||
        artifact.independentReplay.identity.sourceRelationshipToProducer !==
          "separate_server_module_but_no_independent_transcendental_implementation" ||
        artifact.independentReplay.transcendentalPrimitivesRecomputed !==
          false ||
        artifact.independentReplay.cellwiseIntegrandsRecomputed !== false ||
        artifact.independentReplay
          .intervalEnclosuresIndependentlyEstablished !== false ||
        artifact.independentReplay.producerImplementationImportedOrCalled !==
          false ||
        artifact.independentReplay.selfAuthoredStatusCanClearAuthority !==
          false ||
        !hasExactPlainDataKeys(artifact.resourceEnvelope, [
          "producerObservation",
          "traceBytesBoundedByVerifier",
          "producerExecutionModel",
          "independentlyVerifiedWallTimeCap",
          "independentlyVerifiedHeapCap",
          "independentlyVerifiedRssCap",
          "resourceSafetyAuthority",
        ]) ||
        !hasExactPlainDataKeys(artifact.resourceEnvelope.producerObservation, [
          "requestedNodeHeapCeilingMegabytes",
          "nodeHeapCeilingProcessArgumentObserved",
          "observedNodeHeapLimitBytes",
          "callerDeclaredExternalWallTimeCeilingMs",
          "externalWallTimeEnforcement",
          "traceMaximumBytes",
          "traceSizeBytes",
          "processPeakRssBytes",
          "peakRssObservationScope",
          "resourceEnvelopeIndependentlyVerified",
        ]) ||
        artifact.resourceEnvelope.producerObservation
          .requestedNodeHeapCeilingMegabytes !== 2304 ||
        artifact.resourceEnvelope.producerObservation
          .nodeHeapCeilingProcessArgumentObserved !== true ||
        !Number.isSafeInteger(
          artifact.resourceEnvelope.producerObservation
            .observedNodeHeapLimitBytes,
        ) ||
        artifact.resourceEnvelope.producerObservation
          .observedNodeHeapLimitBytes <= 0 ||
        artifact.resourceEnvelope.producerObservation
          .callerDeclaredExternalWallTimeCeilingMs !== 600000 ||
        artifact.resourceEnvelope.producerObservation
          .externalWallTimeEnforcement !==
          "caller_wrapper_declared_not_in_process_verified" ||
        artifact.resourceEnvelope.producerObservation.traceMaximumBytes !==
          8388608 ||
        artifact.resourceEnvelope.producerObservation.traceSizeBytes !==
          artifact.producerBinding.canonicalIntervalTraceBytes.sizeBytes ||
        (artifact.resourceEnvelope.producerObservation.processPeakRssBytes !==
          null &&
          (!Number.isSafeInteger(
            artifact.resourceEnvelope.producerObservation.processPeakRssBytes,
          ) ||
            artifact.resourceEnvelope.producerObservation.processPeakRssBytes <=
              0)) ||
        artifact.resourceEnvelope.producerObservation
          .peakRssObservationScope !==
          "host_process_lifetime_not_run_exclusive" ||
        artifact.resourceEnvelope.producerObservation
          .resourceEnvelopeIndependentlyVerified !== false ||
        artifact.resourceEnvelope.traceBytesBoundedByVerifier !== true ||
        artifact.resourceEnvelope.producerExecutionModel !==
          "in_process_synchronous_derivation" ||
        artifact.resourceEnvelope.independentlyVerifiedWallTimeCap !== false ||
        artifact.resourceEnvelope.independentlyVerifiedHeapCap !== false ||
        artifact.resourceEnvelope.independentlyVerifiedRssCap !== false ||
        artifact.resourceEnvelope.resourceSafetyAuthority !== false ||
        canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
          artifact.authorityBlockers,
        ) !==
          canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_BLOCKERS,
          ) ||
        canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
          artifact.claimLocks,
        ) !==
          canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CLAIM_LOCKS,
          )
      ) {
        return false;
      }
      const { artifactSha256, ...integrity } = artifact.integrity;
      return (
        artifactSha256 ===
        computeNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationSha256(
          { ...artifact, integrity },
        )
      );
    } catch {
      return false;
    }
  };
