import { createHash } from "node:crypto";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES,
  hasValidNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationIntegrity,
  type Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-metric-demand-derivation-verification.v1";

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BRIDGE_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_metric_demand_derivation_replay_bridge/v1" as const;

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BLOCKERS =
  Object.freeze([
    "metric_demand_derivation_executor_provenance_unverified",
    "interval_trace_not_server_replayed",
  ] as const);

export type Nhm2SemiclassicalV2MetricDemandDerivationReplayBlocker =
  (typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BLOCKERS)[number];

declare const metricDemandDerivationReplayCapabilityBrand: unique symbol;

/**
 * A plain object cannot manufacture this authority. The runtime identity is
 * held in the module-private WeakMap below; the symbol is only a TypeScript
 * boundary. This deliberately has no public issuer until a complete,
 * independently implemented derivation replayer is installed server-side.
 */
export type Nhm2SemiclassicalV2MetricDemandDerivationReplayCapability =
  Readonly<{
    readonly [metricDemandDerivationReplayCapabilityBrand]: true;
  }>;

type CapabilityState = Readonly<{
  scope: Nhm2SemiclassicalV2MetricDemandDerivationReplayScope;
  centralTensorBytes: Uint8Array;
  centralTensorSha256: string;
  centralTensorSizeBytes: number;
  absoluteErrorBoundBytes: Uint8Array;
  absoluteErrorBoundSha256: string;
  absoluteErrorBoundSizeBytes: number;
  independentImplementationSourceSha256: string;
  independentImplementationDependencyLockSha256: string;
  independentExecutableSha256: string;
  exactCentralErrorAndTraceByteReplayEstablished: true;
  completeIndependentDerivationEstablished: true;
  producerImplementationImportedOrCalled: false;
  retunedAfterExecution: false;
}>;

// These private implementation hashes identify a future independent replay
// engine; they are not a substitute for an independently persisted
// verification receipt. Binding such a receipt requires a new frozen input and
// a versioned auditable result field before any issuer may be added.
const CAPABILITY_STATES = new WeakMap<object, CapabilityState>();

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_SCOPE_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_metric_demand_derivation_replay_scope/v1" as const;

/**
 * Exact immutable context for one derivation replay. This intentionally binds
 * both the scientific preseal and the concrete raw run. A capability issued
 * for one manifest, receipt, trace, implementation, or execution interval can
 * therefore never authorize another one merely because its central/error
 * arrays happen to be byte-identical.
 */
export type Nhm2SemiclassicalV2MetricDemandDerivationReplayScope = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_SCOPE_CONTRACT_VERSION;
  candidateId: string;
  candidateManifestSha256: string;
  scientificPresealSealKey: string;
  scientificPresealScientificContentSha256: string;
  scientificPresealSealedInventorySha256: string;
  scientificPresealSealedAt: string;
  scientificClosureSha256: string;
  completeClosureSha256: string;
  metricDemandDerivationReceiptSha256: string;
  intervalTraceSha256: string;
  intervalTraceSizeBytes: number;
  approvedReplayPolicySha256: string;
  centralTensorSha256: string;
  centralTensorSizeBytes: number;
  absoluteErrorBoundSha256: string;
  absoluteErrorBoundSizeBytes: number;
  rawReplayManifestSha256: string;
  rawReplayManifestSizeBytes: number;
  manifestFrozenAt: string;
  manifestGeneratedAt: string;
  manifestObservedAt: string;
  implementationRole: "primary" | "independent";
  implementationId: string;
  implementationVersion: string;
  implementationSourceSha256: string;
  implementationDependencyLockSha256: string;
  implementationExecutableSha256: string;
  executionCommitSha: string;
  executionCommand: string;
  executionArgvSha256: string;
  executionWorkingDirectory: string;
  executionOutputDirectory: string;
  executionStartedAt: string;
  executionCompletedAt: string;
  executionDurationMs: number;
  metricDemandDerivationSourceSha256: string;
  metricDemandDerivationDependencyLockSha256: string;
  metricDemandDerivationToolchainArtifactSha256: string;
  metricDemandDerivationExecutableSha256: string;
  metricDemandDerivationGitCommitSha: string;
  metricDemandDerivationCommand: string;
  metricDemandDerivationArgvSha256: string;
  metricDemandDerivationStartedAt: string;
  metricDemandDerivationCompletedAt: string;
  metricDemandDerivationDurationMs: number;
}>;

export type Nhm2SemiclassicalV2MetricDemandDerivationReplayEvidence = Readonly<{
  capability: Nhm2SemiclassicalV2MetricDemandDerivationReplayCapability;
  scope: Nhm2SemiclassicalV2MetricDemandDerivationReplayScope;
}>;

const SCOPE_KEYS = [
  "contractVersion",
  "candidateId",
  "candidateManifestSha256",
  "scientificPresealSealKey",
  "scientificPresealScientificContentSha256",
  "scientificPresealSealedInventorySha256",
  "scientificPresealSealedAt",
  "scientificClosureSha256",
  "completeClosureSha256",
  "metricDemandDerivationReceiptSha256",
  "intervalTraceSha256",
  "intervalTraceSizeBytes",
  "approvedReplayPolicySha256",
  "centralTensorSha256",
  "centralTensorSizeBytes",
  "absoluteErrorBoundSha256",
  "absoluteErrorBoundSizeBytes",
  "rawReplayManifestSha256",
  "rawReplayManifestSizeBytes",
  "manifestFrozenAt",
  "manifestGeneratedAt",
  "manifestObservedAt",
  "implementationRole",
  "implementationId",
  "implementationVersion",
  "implementationSourceSha256",
  "implementationDependencyLockSha256",
  "implementationExecutableSha256",
  "executionCommitSha",
  "executionCommand",
  "executionArgvSha256",
  "executionWorkingDirectory",
  "executionOutputDirectory",
  "executionStartedAt",
  "executionCompletedAt",
  "executionDurationMs",
  "metricDemandDerivationSourceSha256",
  "metricDemandDerivationDependencyLockSha256",
  "metricDemandDerivationToolchainArtifactSha256",
  "metricDemandDerivationExecutableSha256",
  "metricDemandDerivationGitCommitSha",
  "metricDemandDerivationCommand",
  "metricDemandDerivationArgvSha256",
  "metricDemandDerivationStartedAt",
  "metricDemandDerivationCompletedAt",
  "metricDemandDerivationDurationMs",
] as const;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;

const snapshotExactOwnDataRecord = (
  value: unknown,
  keys: readonly string[],
): Readonly<Record<string, unknown>> | null => {
  try {
    if (value == null || typeof value !== "object" || Array.isArray(value))
      return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const actual = Reflect.ownKeys(value);
    if (
      actual.length !== keys.length ||
      actual.some((key) => typeof key !== "string" || !keys.includes(key))
    ) {
      return null;
    }
    const snapshot: Record<string, unknown> = Object.create(null);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
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

const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

const isCanonicalIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
};

export const snapshotNhm2SemiclassicalV2MetricDemandDerivationReplayScope = (
  value: unknown,
): Nhm2SemiclassicalV2MetricDemandDerivationReplayScope | null => {
  const snapshot = snapshotExactOwnDataRecord(value, SCOPE_KEYS);
  if (snapshot == null) return null;
  const shaKeys = [
    "candidateManifestSha256",
    "scientificPresealSealKey",
    "scientificPresealScientificContentSha256",
    "scientificPresealSealedInventorySha256",
    "scientificClosureSha256",
    "completeClosureSha256",
    "metricDemandDerivationReceiptSha256",
    "intervalTraceSha256",
    "approvedReplayPolicySha256",
    "centralTensorSha256",
    "absoluteErrorBoundSha256",
    "rawReplayManifestSha256",
    "implementationSourceSha256",
    "implementationDependencyLockSha256",
    "implementationExecutableSha256",
    "executionArgvSha256",
    "metricDemandDerivationSourceSha256",
    "metricDemandDerivationDependencyLockSha256",
    "metricDemandDerivationToolchainArtifactSha256",
    "metricDemandDerivationExecutableSha256",
    "metricDemandDerivationArgvSha256",
  ] as const;
  const timestampKeys = [
    "scientificPresealSealedAt",
    "manifestFrozenAt",
    "manifestGeneratedAt",
    "manifestObservedAt",
    "executionStartedAt",
    "executionCompletedAt",
    "metricDemandDerivationStartedAt",
    "metricDemandDerivationCompletedAt",
  ] as const;
  const positiveIntegerKeys = [
    "intervalTraceSizeBytes",
    "centralTensorSizeBytes",
    "absoluteErrorBoundSizeBytes",
    "rawReplayManifestSizeBytes",
    "executionDurationMs",
    "metricDemandDerivationDurationMs",
  ] as const;
  const textKeys = [
    "candidateId",
    "implementationId",
    "implementationVersion",
    "executionCommand",
    "executionWorkingDirectory",
    "executionOutputDirectory",
    "metricDemandDerivationCommand",
  ] as const;
  const valid =
    snapshot.contractVersion ===
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_SCOPE_CONTRACT_VERSION &&
    (snapshot.implementationRole === "primary" ||
      snapshot.implementationRole === "independent") &&
    shaKeys.every((key) =>
      SHA256.test(typeof snapshot[key] === "string" ? snapshot[key] : ""),
    ) &&
    timestampKeys.every((key) => isCanonicalIsoTimestamp(snapshot[key])) &&
    positiveIntegerKeys.every(
      (key) => Number.isSafeInteger(snapshot[key]) && Number(snapshot[key]) > 0,
    ) &&
    textKeys.every((key) => isNonemptyString(snapshot[key])) &&
    GIT_SHA.test(
      typeof snapshot.executionCommitSha === "string"
        ? snapshot.executionCommitSha
        : "",
    ) &&
    GIT_SHA.test(
      typeof snapshot.metricDemandDerivationGitCommitSha === "string"
        ? snapshot.metricDemandDerivationGitCommitSha
        : "",
    ) &&
    Date.parse(snapshot.executionCompletedAt as string) -
      Date.parse(snapshot.executionStartedAt as string) ===
      snapshot.executionDurationMs &&
    Date.parse(snapshot.metricDemandDerivationCompletedAt as string) -
      Date.parse(snapshot.metricDemandDerivationStartedAt as string) ===
      snapshot.metricDemandDerivationDurationMs;
  return valid
    ? (snapshot as Nhm2SemiclassicalV2MetricDemandDerivationReplayScope)
    : null;
};

const exactScopeEquals = (
  left: Nhm2SemiclassicalV2MetricDemandDerivationReplayScope,
  right: Nhm2SemiclassicalV2MetricDemandDerivationReplayScope,
): boolean => SCOPE_KEYS.every((key) => left[key] === right[key]);

export type Nhm2SemiclassicalV2MetricDemandDerivationReplayInspection =
  | Readonly<{
      status: "accepted";
      blockers: readonly [];
      evidence: Readonly<{
        scope: Nhm2SemiclassicalV2MetricDemandDerivationReplayScope;
        centralTensorSha256: string;
        centralTensorSizeBytes: number;
        absoluteErrorBoundSha256: string;
        absoluteErrorBoundSizeBytes: number;
        independentImplementationSourceSha256: string;
        independentImplementationDependencyLockSha256: string;
        independentExecutableSha256: string;
        exactCentralErrorAndTraceByteReplayEstablished: true;
        completeIndependentDerivationEstablished: true;
        producerImplementationImportedOrCalled: false;
        retunedAfterExecution: false;
      }>;
    }>
  | Readonly<{
      status: "blocked";
      blockers: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BLOCKERS;
      evidence: null;
    }>;

const BLOCKED_INSPECTION = Object.freeze({
  status: "blocked" as const,
  blockers: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BLOCKERS,
  evidence: null,
});

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const copyBoundedBytes = (
  value: unknown,
  maximumBytes: number,
  exactBytes: number | null,
): Uint8Array | null => {
  if (!(value instanceof Uint8Array)) return null;
  if (
    value.byteLength <= 0 ||
    value.byteLength > maximumBytes ||
    (exactBytes != null && value.byteLength !== exactBytes)
  ) {
    return null;
  }
  return Uint8Array.from(value);
};

const encodeFloat64LittleEndian = (value: unknown): Uint8Array | null => {
  if (
    !(value instanceof Float64Array) ||
    value.byteOffset !== 0 ||
    value.byteLength !== value.buffer.byteLength ||
    value.buffer instanceof SharedArrayBuffer
  ) {
    return null;
  }
  const bytes = Buffer.allocUnsafe(value.byteLength);
  for (let index = 0; index < value.length; index += 1) {
    if (!Number.isFinite(value[index])) return null;
    bytes.writeDoubleLE(value[index], index * 8);
  }
  return bytes;
};

/**
 * The calculation kernel calls this after validating its arrays. Acceptance
 * depends on WeakMap identity, the entire immutable run scope, and exact
 * central/error byte bindings. Copying every enumerable field from a real
 * token still cannot forge it. There is deliberately no issuer in this module;
 * adding one also requires a versioned, auditable accepted-evidence field in
 * the content-replay result contract.
 */
export const inspectNhm2SemiclassicalV2MetricDemandDerivationReplayCapability =
  (input: {
    evidence: unknown;
    centralTensor: Float64Array;
    absoluteErrorBound: Float64Array;
  }): Nhm2SemiclassicalV2MetricDemandDerivationReplayInspection => {
    try {
      const evidence = snapshotExactOwnDataRecord(input.evidence, [
        "capability",
        "scope",
      ]);
      const scope =
        snapshotNhm2SemiclassicalV2MetricDemandDerivationReplayScope(
          evidence?.scope,
        );
      const capability = evidence?.capability;
      if (
        evidence == null ||
        scope == null ||
        capability == null ||
        (typeof capability !== "object" && typeof capability !== "function")
      ) {
        return BLOCKED_INSPECTION;
      }
      const state = CAPABILITY_STATES.get(capability as object);
      const stateScope =
        snapshotNhm2SemiclassicalV2MetricDemandDerivationReplayScope(
          state?.scope,
        );
      if (
        state == null ||
        stateScope == null ||
        !exactScopeEquals(stateScope, scope)
      ) {
        return BLOCKED_INSPECTION;
      }
      const centralBytes = encodeFloat64LittleEndian(input.centralTensor);
      const errorBytes = encodeFloat64LittleEndian(input.absoluteErrorBound);
      if (
        centralBytes == null ||
        errorBytes == null ||
        !(state.centralTensorBytes instanceof Uint8Array) ||
        !(state.absoluteErrorBoundBytes instanceof Uint8Array) ||
        centralBytes.byteLength !== state.centralTensorSizeBytes ||
        errorBytes.byteLength !== state.absoluteErrorBoundSizeBytes ||
        state.centralTensorBytes.byteLength !== state.centralTensorSizeBytes ||
        state.absoluteErrorBoundBytes.byteLength !==
          state.absoluteErrorBoundSizeBytes ||
        !Buffer.from(centralBytes).equals(
          Buffer.from(state.centralTensorBytes),
        ) ||
        !Buffer.from(errorBytes).equals(
          Buffer.from(state.absoluteErrorBoundBytes),
        ) ||
        sha256(centralBytes) !== state.centralTensorSha256 ||
        sha256(errorBytes) !== state.absoluteErrorBoundSha256 ||
        sha256(state.centralTensorBytes) !== state.centralTensorSha256 ||
        sha256(state.absoluteErrorBoundBytes) !==
          state.absoluteErrorBoundSha256 ||
        stateScope.centralTensorSizeBytes !== state.centralTensorSizeBytes ||
        stateScope.absoluteErrorBoundSizeBytes !==
          state.absoluteErrorBoundSizeBytes ||
        stateScope.centralTensorSha256 !== state.centralTensorSha256 ||
        stateScope.absoluteErrorBoundSha256 !==
          state.absoluteErrorBoundSha256 ||
        !SHA256.test(state.independentImplementationSourceSha256) ||
        !SHA256.test(state.independentImplementationDependencyLockSha256) ||
        !SHA256.test(state.independentExecutableSha256) ||
        state.exactCentralErrorAndTraceByteReplayEstablished !== true ||
        state.completeIndependentDerivationEstablished !== true ||
        state.producerImplementationImportedOrCalled !== false ||
        state.retunedAfterExecution !== false
      ) {
        return BLOCKED_INSPECTION;
      }
      return Object.freeze({
        status: "accepted" as const,
        blockers: Object.freeze([] as const),
        evidence: Object.freeze({
          scope: stateScope,
          centralTensorSha256: state.centralTensorSha256,
          centralTensorSizeBytes: state.centralTensorSizeBytes,
          absoluteErrorBoundSha256: state.absoluteErrorBoundSha256,
          absoluteErrorBoundSizeBytes: state.absoluteErrorBoundSizeBytes,
          independentImplementationSourceSha256:
            state.independentImplementationSourceSha256,
          independentImplementationDependencyLockSha256:
            state.independentImplementationDependencyLockSha256,
          independentExecutableSha256: state.independentExecutableSha256,
          exactCentralErrorAndTraceByteReplayEstablished: true as const,
          completeIndependentDerivationEstablished: true as const,
          producerImplementationImportedOrCalled: false as const,
          retunedAfterExecution: false as const,
        }),
      });
    } catch {
      return BLOCKED_INSPECTION;
    }
  };

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BRIDGE_CLAIM_LOCKS =
  Object.freeze({
    metricDemandDerivationAuthority: false as const,
    intervalTraceReplayAuthority: false as const,
    independentDerivationAuthority: false as const,
    candidateInputAdmissible: false as const,
    contentReplayCapabilityIssued: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SEMICLASSICAL_V2_NEEDLE_DERIVATION_BRIDGE_BLOCKERS =
  Object.freeze([
    "needle_derivation_verification_invalid_or_byte_binding_mismatch",
    "needle_verifier_is_structural_only",
    "needle_candidate_input_inadmissible",
    "independent_transcendental_derivation_not_implemented",
    "opaque_content_replay_capability_not_issued",
  ] as const);

export type Nhm2SemiclassicalV2NeedleDerivationBridgeResult = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BRIDGE_CONTRACT_VERSION;
  status: "blocked";
  authority: "diagnostic_binding_bridge_only";
  capability: null;
  structuralBinding: Readonly<{
    verificationArtifactIntegrityValid: boolean;
    centralTensorBytesExact: boolean;
    absoluteErrorBoundBytesExact: boolean;
    intervalTraceBytesExact: boolean;
    reportedTraceRelationsServerReplayed: boolean;
  }>;
  independentDerivation: Readonly<{
    complete: false;
    transcendentalPrimitivesRecomputed: false;
    cellwiseIntegrandsRecomputed: false;
    intervalEnclosuresIndependentlyEstablished: false;
  }>;
  blockers: typeof NHM2_SEMICLASSICAL_V2_NEEDLE_DERIVATION_BRIDGE_BLOCKERS;
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BRIDGE_CLAIM_LOCKS;
}>;

const exactByteBinding = (
  bytes: Uint8Array | null,
  binding: unknown,
): boolean => {
  const record = snapshotExactOwnDataRecord(binding, ["sha256", "sizeBytes"]);
  if (bytes == null || record == null) return false;
  return (
    typeof record.sha256 === "string" &&
    typeof record.sizeBytes === "number" &&
    bytes.byteLength === record.sizeBytes &&
    sha256(bytes) === record.sha256
  );
};

/**
 * Adapts the current conformally-flat-needle verification artifact without
 * promoting it. The verifier's exact contract is structural-only and fixes
 * `candidateInputAdmissible=false`; consequently this function can report
 * byte-binding diagnostics but can never issue the opaque replay capability.
 */
export const bridgeNhm2ConformallyFlatNeedleMetricDemandDerivationVerification =
  (input: {
    verificationArtifact: unknown;
    centralTensorBytes: Uint8Array;
    absoluteErrorBoundBytes: Uint8Array;
    intervalTraceBytes: Uint8Array;
  }): Nhm2SemiclassicalV2NeedleDerivationBridgeResult => {
    const centralBytes = copyBoundedBytes(
      input.centralTensorBytes,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.centralTensor,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.centralTensor,
    );
    const errorBytes = copyBoundedBytes(
      input.absoluteErrorBoundBytes,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.absoluteErrorBound,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.absoluteErrorBound,
    );
    const traceBytes = copyBoundedBytes(
      input.intervalTraceBytes,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.intervalTrace,
      null,
    );
    const integrityValid =
      hasValidNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationIntegrity(
        input.verificationArtifact,
      );
    const artifact = integrityValid
      ? (input.verificationArtifact as Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1)
      : null;
    const centralExact = exactByteBinding(
      centralBytes,
      artifact?.producerBinding.centralTensorBytes,
    );
    const errorExact = exactByteBinding(
      errorBytes,
      artifact?.producerBinding.absoluteErrorBoundBytes,
    );
    const traceExact = exactByteBinding(
      traceBytes,
      artifact?.producerBinding.canonicalIntervalTraceBytes,
    );
    const reportedTraceRelationsServerReplayed =
      artifact?.structuralReplay
        .traceParsedWithBoundedFatalUtf8CanonicalJson === true &&
      artifact.structuralReplay.traceSummaryExactlyRecomputed === true &&
      artifact.structuralReplay.centralAndErrorFloat64BytesExactlyMatched ===
        true &&
      centralExact &&
      errorExact &&
      traceExact;

    return Object.freeze({
      contractVersion:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BRIDGE_CONTRACT_VERSION,
      status: "blocked" as const,
      authority: "diagnostic_binding_bridge_only" as const,
      capability: null,
      structuralBinding: Object.freeze({
        verificationArtifactIntegrityValid: integrityValid,
        centralTensorBytesExact: centralExact,
        absoluteErrorBoundBytesExact: errorExact,
        intervalTraceBytesExact: traceExact,
        reportedTraceRelationsServerReplayed,
      }),
      independentDerivation: Object.freeze({
        complete: false as const,
        transcendentalPrimitivesRecomputed: false as const,
        cellwiseIntegrandsRecomputed: false as const,
        intervalEnclosuresIndependentlyEstablished: false as const,
      }),
      blockers: NHM2_SEMICLASSICAL_V2_NEEDLE_DERIVATION_BRIDGE_BLOCKERS,
      claimLocks:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_REPLAY_BRIDGE_CLAIM_LOCKS,
    });
  };
