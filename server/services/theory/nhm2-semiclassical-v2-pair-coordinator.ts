import path from "node:path";

import {
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
  computeNhm2SemiclassicalV2PairLaunchSealSha256,
  nhm2SemiclassicalV2PairAgreementViolations,
} from "../../../shared/contracts/nhm2-semiclassical-v2-pair-agreement.v1";
import {
  nhm2SemiclassicalV2RawReplayManifestPairViolations,
  nhm2SemiclassicalV2RawReplayManifestViolations,
} from "../../../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import { nhm2SemiclassicalV2ScientificPresealViolations } from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";
import {
  compareNhm2SemiclassicalV2Pair,
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION,
} from "./nhm2-semiclassical-v2-pair-comparator";
import {
  getDefaultNhm2SemiclassicalV2PairExecutionCatalog,
  getNhm2SemiclassicalV2PairCatalogAuthorityScope,
  NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_CONTRACT_VERSION,
  type Nhm2SemiclassicalV2PairExecutionCatalogResolverV1,
  type Nhm2SemiclassicalV2PairResolvedEnrollmentV1,
} from "./nhm2-semiclassical-v2-pair-execution-catalog";
import {
  NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION,
  replayNhm2SemiclassicalV2Run,
} from "./nhm2-semiclassical-v2-run-replayer";
import {
  hasValidNhm2SemiclassicalV2ScientificPresealServerReceiptIntegrity,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES,
} from "./nhm2-semiclassical-v2-scientific-presealer";
import { readNhm2SecureRunOutputs } from "./nhm2-secure-run-output-reader";

export const NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_pair_coordinator/v1" as const;

export const NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_STAGES = [
  "request_admission",
  "trusted_catalog_resolution",
  "persisted_preseal_reverification",
  "root_and_lineage_admission",
  "empty_output_prestate_observation",
  "os_isolation_attestation",
  "launch_seal_exclusive_persistence_readback",
  "paired_execution",
  "writer_revocation_and_read_only_freeze",
  "secure_raw_replay",
  "independent_pair_comparison",
  "pair_receipt_validation",
  "pair_receipt_exclusive_persistence_readback",
] as const;

export type Nhm2SemiclassicalV2PairCoordinatorStage =
  (typeof NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_STAGES)[number];

export const NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_BLOCKERS = [
  "coordinator_request_invalid",
  "untrusted_catalog_resolver",
  "trusted_pair_enrollment_not_registered",
  "trusted_catalog_resolution_failed",
  "test_fixture_catalog_has_no_artifact_authority",
  "scientific_preseal_server_receipt_integrity_invalid",
  "scientific_preseal_persisted_artifact_invalid",
  "scientific_preseal_reference_mismatch",
  "pair_catalog_binding_invalid",
  "pair_roots_not_server_authorized_distinct_and_disjoint",
  "independent_implementation_lineage_not_distinct",
  "scientific_root_mount_identity_and_sealed_inventory_not_verified",
  "production_pair_lifecycle_not_enabled",
  "launch_seal_bounded_readback_not_established",
  "launch_seal_monotonic_chronology_not_established",
  "empty_output_prestate_not_server_observed",
  "os_isolation_not_server_attested",
  "pair_execution_failed",
  "writer_revocation_or_read_only_freeze_failed",
  "raw_manifest_contract_or_cross_binding_invalid",
  "secure_server_replay_failed",
  "pair_comparison_failed",
  "pair_agreement_contract_invalid",
  "pair_agreement_exclusive_persistence_readback_failed",
] as const;

export type Nhm2SemiclassicalV2PairCoordinatorBlocker =
  (typeof NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_BLOCKERS)[number];

export type Nhm2SemiclassicalV2PairCoordinatorRequestV1 = Readonly<{
  /** The caller receives this opaque ID from a server-side enrollment flow. */
  opaquePairEnrollmentId: string;
  /** Opaque server receipt ID; never a path or receipt object. */
  scientificPresealReceiptId: string;
  /** Opaque persisted-artifact ID; never a path or artifact object. */
  scientificPresealArtifactId: string;
}>;

export type Nhm2SemiclassicalV2PairCoordinatorStageStateV1 = Readonly<{
  stage: Nhm2SemiclassicalV2PairCoordinatorStage;
  state: "pass" | "blocked" | "not_run";
}>;

export const NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_CLAIM_LOCKS =
  Object.freeze({
    schemaValidationAuthenticatesServerOrigin: false as const,
    receiptSelfHashAuthenticatesServerOrigin: false as const,
    diagnosticLampStateAuthority: false as const,
    diagnosticLampPromotionAuthority: false as const,
    scientificRootMountIdentityAndSealedInventoryVerified: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
    empiricalValidation: false as const,
  });

export type Nhm2SemiclassicalV2PairCoordinatorResultV1 = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_CONTRACT_VERSION;
  serverOwned: true;
  diagnosticOnly: true;
  status: "blocked";
  authorityState:
    | "blocked"
    | "test_fixture_non_authoritative"
    | "blocked_pending_production_os_backend";
  stoppedAtStage: Nhm2SemiclassicalV2PairCoordinatorStage;
  stages: readonly Nhm2SemiclassicalV2PairCoordinatorStageStateV1[];
  blockers: readonly Nhm2SemiclassicalV2PairCoordinatorBlocker[];
  details: readonly string[];
  pairAgreementReceipt: null;
  componentBindings: Readonly<{
    catalogContractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_CONTRACT_VERSION;
    runReplayerContractVersion: typeof NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION;
    pairComparatorContractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION;
    launchSealContractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION;
    launchSealServerReceiptContractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION;
    comparisonPolicySha256: string;
    replayMetricCoverageSha256: string;
    replayMetricLeafCount: number;
    scientificPresealMaximumPersistedBytes: string;
    rawManifestValidatorInstalled: true;
    rawManifestPairValidatorInstalled: true;
    serverRunReplayerInstalled: true;
    exhaustivePairComparatorInstalled: true;
    pairAgreementValidatorInstalled: true;
    productionLifecycleEnabled: false;
  }>;
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_CLAIM_LOCKS;
}>;

export type Nhm2SemiclassicalV2PairCoordinatorV1 = Readonly<{
  run(
    request: Nhm2SemiclassicalV2PairCoordinatorRequestV1,
  ): Promise<Nhm2SemiclassicalV2PairCoordinatorResultV1>;
}>;

type CoordinatorOptions = Readonly<{
  /** Server wiring dependency. It is deliberately separate from public input. */
  catalog?: Nhm2SemiclassicalV2PairExecutionCatalogResolverV1;
}>;

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._@-]{0,511}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const REQUEST_KEYS = [
  "opaquePairEnrollmentId",
  "scientificPresealReceiptId",
  "scientificPresealArtifactId",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length && keys.every((key) => expected.includes(key))
  );
};

const snapshotCoordinatorRequest = (
  value: unknown,
): Nhm2SemiclassicalV2PairCoordinatorRequestV1 | null => {
  if (
    value == null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return null;
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== REQUEST_KEYS.length ||
    ownKeys.some(
      (key) =>
        typeof key !== "string" ||
        !(REQUEST_KEYS as readonly string[]).includes(key),
    )
  ) {
    return null;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const values: Record<string, string> = {};
  for (const key of REQUEST_KEYS) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      typeof descriptor.value !== "string" ||
      !IDENTIFIER.test(descriptor.value)
    ) {
      return null;
    }
    values[key] = descriptor.value;
  }
  return Object.freeze({
    opaquePairEnrollmentId: values.opaquePairEnrollmentId,
    scientificPresealReceiptId: values.scientificPresealReceiptId,
    scientificPresealArtifactId: values.scientificPresealArtifactId,
  });
};

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const isPortableRoot = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 1024 &&
  !value.includes("\\") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  value.split("/").every((segment) =>
    segment.length > 0 && segment !== "." && segment !== "..",
  );

const deepFreeze = <T>(value: T): T => {
  if (
    value == null ||
    typeof value !== "object" ||
    Buffer.isBuffer(value) ||
    Object.isFrozen(value)
  ) {
    return value;
  }
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
};

const COMPONENT_BINDINGS = Object.freeze({
  catalogContractVersion:
    NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_CONTRACT_VERSION,
  runReplayerContractVersion:
    NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION,
  pairComparatorContractVersion:
    NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION,
  launchSealContractVersion:
    NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION,
  launchSealServerReceiptContractVersion:
    NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION,
  comparisonPolicySha256:
    NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256,
  replayMetricCoverageSha256:
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
  replayMetricLeafCount:
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
  scientificPresealMaximumPersistedBytes:
    NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES.toString(),
  rawManifestValidatorInstalled: true as const,
  rawManifestPairValidatorInstalled: true as const,
  serverRunReplayerInstalled: true as const,
  exhaustivePairComparatorInstalled: true as const,
  pairAgreementValidatorInstalled: true as const,
  productionLifecycleEnabled: false as const,
});

// Keep these exact server-owned components linked at this boundary. A later
// contract version can enter execution only through these bindings, not a
// catalog-supplied validator, replay function, or comparator.
const SERVER_COMPONENTS = Object.freeze({
  validateRawManifest: nhm2SemiclassicalV2RawReplayManifestViolations,
  validateRawManifestPair:
    nhm2SemiclassicalV2RawReplayManifestPairViolations,
  replayRun: replayNhm2SemiclassicalV2Run,
  comparePair: compareNhm2SemiclassicalV2Pair,
  validatePairAgreement: nhm2SemiclassicalV2PairAgreementViolations,
  computeLaunchSealSha256:
    computeNhm2SemiclassicalV2PairLaunchSealSha256,
});

const stageStates = (
  stoppedAt: Nhm2SemiclassicalV2PairCoordinatorStage,
  passed: readonly Nhm2SemiclassicalV2PairCoordinatorStage[],
): Nhm2SemiclassicalV2PairCoordinatorStageStateV1[] => {
  return NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_STAGES.map((stage) => {
    if (stage === stoppedAt) {
      return { stage, state: "blocked" as const };
    }
    return {
      stage,
      state: passed.includes(stage)
        ? ("pass" as const)
        : ("not_run" as const),
    };
  });
};

const blocked = (
  stoppedAtStage: Nhm2SemiclassicalV2PairCoordinatorStage,
  blocker: Nhm2SemiclassicalV2PairCoordinatorBlocker,
  detail: string,
  passed: readonly Nhm2SemiclassicalV2PairCoordinatorStage[] = [],
  authorityState: Nhm2SemiclassicalV2PairCoordinatorResultV1["authorityState"] =
    "blocked",
): Nhm2SemiclassicalV2PairCoordinatorResultV1 =>
  deepFreeze({
    contractVersion: NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_CONTRACT_VERSION,
    serverOwned: true as const,
    diagnosticOnly: true as const,
    status: "blocked" as const,
    authorityState,
    stoppedAtStage,
    stages: stageStates(stoppedAtStage, passed),
    blockers: [blocker],
    details: [detail],
    pairAgreementReceipt: null,
    componentBindings: { ...COMPONENT_BINDINGS },
    claimLocks: { ...NHM2_SEMICLASSICAL_V2_PAIR_COORDINATOR_CLAIM_LOCKS },
  });

const pathsOverlap = (left: string, right: string): boolean => {
  const normalize = (value: string): string => {
    const resolved = path.resolve(value).replace(/\\/g, "/").replace(/\/+$/, "");
    return process.platform === "win32"
      ? resolved.toLocaleLowerCase("en-US")
      : resolved;
  };
  const a = normalize(left);
  const b = normalize(right);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
};

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, canonicalizeJson(entry)]),
    );
  }
  return value;
};

const sameCanonicalJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeJson(left)) ===
  JSON.stringify(canonicalizeJson(right));

const sameFilesystemIdentity = (
  left: Readonly<{
    dev: string;
    ino: string;
    sizeBytes: string;
    mtimeNs: string;
    ctimeNs: string;
  }>,
  right: Readonly<{
    dev: string;
    ino: string;
    sizeBytes: string;
    mtimeNs: string;
    ctimeNs: string;
  }>,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.sizeBytes === right.sizeBytes &&
  left.mtimeNs === right.mtimeNs &&
  left.ctimeNs === right.ctimeNs;

const securelyRereadPersistedPreseal = async (
  enrollment: Readonly<Nhm2SemiclassicalV2PairResolvedEnrollmentV1>,
): Promise<readonly string[]> => {
  const receipt = enrollment.scientificPreseal.receipt;
  const absolutePath = receipt.artifact.absolutePath;
  if (!path.isAbsolute(absolutePath)) {
    return ["preseal_receipt_artifact_path_not_absolute"];
  }
  const runDirectory = path.dirname(absolutePath);
  const relativePath = path.basename(absolutePath);
  if (
    relativePath.length === 0 ||
    relativePath === "." ||
    relativePath === ".."
  ) {
    return ["preseal_receipt_artifact_path_invalid"];
  }
  try {
    const snapshot = await readNhm2SecureRunOutputs({
      runDirectory,
      files: [
        {
          relativePath,
          expectedSha256: receipt.artifact.sha256,
          expectedSizeBytes: BigInt(receipt.artifact.sizeBytes),
          decode: { kind: "bytes" },
        },
      ],
      maxFileBytes:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES,
      maxAggregateBytes:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES,
    });
    const file = snapshot.files[0];
    if (
      file == null ||
      file.relativePath !== relativePath ||
      file.sha256 !== receipt.artifact.sha256 ||
      file.sizeBytes.toString() !== receipt.artifact.sizeBytes ||
      !sameFilesystemIdentity(
        file.filesystemIdentity,
        receipt.artifact.filesystemIdentity,
      )
    ) {
      return ["preseal_receipt_current_readback_identity_mismatch"];
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(file.bytes),
      );
    } catch {
      return ["preseal_receipt_current_bytes_not_strict_utf8_json"];
    }
    if (!sameCanonicalJson(parsed, enrollment.scientificPreseal.parsedArtifact)) {
      return ["preseal_receipt_current_bytes_content_mismatch"];
    }
    const violations = nhm2SemiclassicalV2ScientificPresealViolations(parsed);
    return violations.map((entry) => `preseal_current:${entry}`);
  } catch (error) {
    return [
      `preseal_secure_reread_failed:${
        error instanceof Error ? error.message : "unknown"
      }`,
    ];
  }
};

const registrationViolations = (
  request: Nhm2SemiclassicalV2PairCoordinatorRequestV1,
  enrollment: Readonly<Nhm2SemiclassicalV2PairResolvedEnrollmentV1>,
): string[] => {
  const violations: string[] = [];
  if (
    enrollment.opaquePairEnrollmentId !== request.opaquePairEnrollmentId ||
    enrollment.scientificPreseal.receiptId !==
      request.scientificPresealReceiptId ||
    enrollment.scientificPreseal.artifactId !==
      request.scientificPresealArtifactId
  ) {
    violations.push("opaque_reference_cross_binding_mismatch");
  }
  if (
    enrollment.lanes.length !== 2 ||
    enrollment.lanes[0].role !== "primary" ||
    enrollment.lanes[1].role !== "independent"
  ) {
    violations.push("lane_role_order_invalid");
    return violations;
  }
  const [primary, independent] = enrollment.lanes;
  for (const [index, lane] of enrollment.lanes.entries()) {
    const expectedRole = index === 0 ? "primary" : "independent";
    if (
      lane.enrollmentCapability.role !== expectedRole ||
      lane.enrollmentCapability.authority !== "server" ||
      lane.enrollmentCapability.serverAuthorized !== true ||
      lane.enrollmentCapability.capabilityDisclosure !==
        "opaque_server_binding_only" ||
      !IDENTIFIER.test(lane.enrollmentCapability.opaqueEnrollmentId) ||
      !SHA256.test(lane.enrollmentCapability.capabilityBindingSha256) ||
      lane.rootLease.role !== expectedRole ||
      lane.rootLease.authority !== "server" ||
      lane.rootLease.serverAuthorized !== true ||
      !isIsoTimestamp(lane.rootLease.authorizedAt) ||
      lane.rootLease.scientificRootAccess !==
        "read_only_exact_sealed_inventory" ||
      lane.rootLease.implementationRootAccess !== "read_only_lane_private" ||
      lane.rootLease.outputRootAccess !== "read_write_lane_private" ||
      !isPortableRoot(lane.rootLease.scientificRootDirectory) ||
      !isPortableRoot(lane.rootLease.implementationRootDirectory) ||
      !isPortableRoot(lane.rootLease.outputRootDirectory) ||
      !SHA256.test(lane.rootLease.leaseBindingSha256) ||
      lane.implementationLineage.role !== expectedRole ||
      ![
        lane.implementationLineage.sourceSha256,
        lane.implementationLineage.dependencyLockSha256,
        lane.implementationLineage.executableSha256,
        lane.implementationLineage.buildRecipeSha256,
      ].every((hash) => SHA256.test(hash)) ||
      typeof lane.observeEmptyOutputPrestate !== "function" ||
      typeof lane.establishOsIsolation !== "function" ||
      typeof lane.executeAfterPersistedLaunchSeal !== "function" ||
      typeof lane.revokeWritersAndFreezeOutput !== "function"
    ) {
      violations.push(`lane_capability_invalid:${expectedRole}`);
    }
  }
  if (
    primary.implementationLineage.lineageId ===
      independent.implementationLineage.lineageId ||
    primary.implementationLineage.implementationDomainId ===
      independent.implementationLineage.implementationDomainId ||
    primary.implementationLineage.sourceSha256 ===
      independent.implementationLineage.sourceSha256 ||
    primary.implementationLineage.executableSha256 ===
      independent.implementationLineage.executableSha256
  ) {
    violations.push("implementation_lineages_not_distinct");
  }
  const roots = [
    primary.absoluteRoots.implementation,
    primary.absoluteRoots.output,
    independent.absoluteRoots.implementation,
    independent.absoluteRoots.output,
  ];
  if (
    primary.absoluteRoots.scientific !== independent.absoluteRoots.scientific ||
    !path.isAbsolute(primary.absoluteRoots.scientific) ||
    roots.some((root) => !path.isAbsolute(root)) ||
    roots.some((root, index) =>
      roots.slice(index + 1).some((other) => pathsOverlap(root, other)),
    ) ||
    roots.some((root) => pathsOverlap(root, primary.absoluteRoots.scientific))
  ) {
    violations.push("root_topology_invalid");
  }
  if (
    primary.rootLease.scientificRootDirectory !==
      enrollment.scientificPreseal.artifactBinding
        .sealedScientificRootDirectory ||
    independent.rootLease.scientificRootDirectory !==
      primary.rootLease.scientificRootDirectory ||
    primary.rootLease.outputRootDirectory ===
      independent.rootLease.outputRootDirectory ||
    primary.rootLease.implementationRootDirectory ===
      independent.rootLease.implementationRootDirectory
  ) {
    violations.push("logical_root_binding_invalid");
  }
  if (
    enrollment.candidate.candidateId !==
      enrollment.scientificPreseal.artifactBinding.candidateId ||
    enrollment.candidate.candidateManifestId !==
      enrollment.scientificPreseal.artifactBinding.candidateManifestId ||
    enrollment.candidate.candidateFrozenAt !==
      enrollment.scientificPreseal.artifactBinding.candidateFrozenAt
  ) {
    violations.push("candidate_preseal_binding_invalid");
  }
  return violations;
};

/**
 * Creates the server coordinator. Dependency injection is a server wiring
 * seam, not part of `run()` input. Unknown resolver objects are rejected by
 * the catalog module's runtime authority registry before their `resolve`
 * method is called.
 */
export const createNhm2SemiclassicalV2PairCoordinator = (
  options: CoordinatorOptions = {},
): Nhm2SemiclassicalV2PairCoordinatorV1 => {
  const catalog =
    options.catalog ?? getDefaultNhm2SemiclassicalV2PairExecutionCatalog();
  return Object.freeze({
    async run(
      request: Nhm2SemiclassicalV2PairCoordinatorRequestV1,
    ): Promise<Nhm2SemiclassicalV2PairCoordinatorResultV1> {
      const requestSnapshot = snapshotCoordinatorRequest(request);
      if (requestSnapshot == null) {
        return blocked(
          "request_admission",
          "coordinator_request_invalid",
          "Only the exact three opaque identifiers are accepted; paths, commands, policies, receipts, and attestations are forbidden.",
        );
      }
      const scope = getNhm2SemiclassicalV2PairCatalogAuthorityScope(catalog);
      if (scope == null) {
        return blocked(
          "trusted_catalog_resolution",
          "untrusted_catalog_resolver",
          "The resolver was not installed by the server catalog module and was not invoked.",
          ["request_admission"],
        );
      }

      let resolution: Awaited<ReturnType<typeof catalog.resolve>>;
      try {
        resolution = await catalog.resolve(requestSnapshot);
      } catch (error) {
        return blocked(
          "trusted_catalog_resolution",
          "trusted_catalog_resolution_failed",
          error instanceof Error ? error.message : "unknown_catalog_failure",
          ["request_admission"],
        );
      }
      if (resolution.status !== "resolved") {
        return blocked(
          "trusted_catalog_resolution",
          resolution.blocker === "trusted_pair_enrollment_not_registered"
            ? "trusted_pair_enrollment_not_registered"
            : "trusted_catalog_resolution_failed",
          `${resolution.blocker}:${resolution.detail}`,
          ["request_admission"],
        );
      }
      if (scope === "test_fixture_non_authoritative") {
        return blocked(
          "trusted_catalog_resolution",
          "test_fixture_catalog_has_no_artifact_authority",
          "The test-only catalog can exercise fixtures but cannot start a governed run or emit a pair-agreement artifact.",
          ["request_admission"],
          "test_fixture_non_authoritative",
        );
      }

      const enrollment = resolution.enrollment;
      const presealReceipt = enrollment.scientificPreseal.receipt;
      const presealArtifact = enrollment.scientificPreseal.parsedArtifact;
      const presealArtifactBinding =
        enrollment.scientificPreseal.artifactBinding;
      if (
        !hasValidNhm2SemiclassicalV2ScientificPresealServerReceiptIntegrity(
          presealReceipt,
        )
      ) {
        return blocked(
          "persisted_preseal_reverification",
          "scientific_preseal_server_receipt_integrity_invalid",
          "The trusted catalog entry carries a preseal receipt whose canonical integrity hash does not verify.",
          ["request_admission", "trusted_catalog_resolution"],
        );
      }
      const presealViolations =
        nhm2SemiclassicalV2ScientificPresealViolations(presealArtifact);
      const receiptSizeText = presealReceipt.artifact.sizeBytes;
      const receiptSize =
        typeof receiptSizeText === "string" && /^(?:0|[1-9][0-9]*)$/.test(receiptSizeText)
          ? BigInt(receiptSizeText)
          : 0n;
      if (
        presealViolations.length > 0 ||
        receiptSize <= 0n ||
        receiptSize >
          NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES ||
        presealReceipt.artifact.sha256 !==
          presealArtifactBinding.artifactSha256 ||
        presealReceipt.artifact.sizeBytes !==
          presealArtifactBinding.artifactSizeBytes ||
        presealReceipt.sealKey !== presealArtifactBinding.sealKey ||
        presealReceipt.sealedAt !== presealArtifactBinding.sealedAt ||
        presealArtifact.sealKey !== presealArtifactBinding.sealKey ||
        presealArtifact.candidateFrozenAt !==
          presealArtifactBinding.candidateFrozenAt ||
        presealArtifact.candidateBinding.candidateId !==
          presealArtifactBinding.candidateId ||
        presealArtifact.candidateBinding.candidateManifestId !==
          presealArtifactBinding.candidateManifestId ||
        presealArtifact.candidateBinding.candidateManifestSha256 !==
          presealArtifactBinding.candidateManifestSha256 ||
        presealArtifact.sealedScientificRootDirectory !==
          presealArtifactBinding.sealedScientificRootDirectory ||
        presealArtifact.sealedInventorySha256 !==
          presealArtifactBinding.sealedInventorySha256 ||
        presealArtifact.scientificContentSha256 !==
          presealArtifactBinding.scientificContentSha256
      ) {
        return blocked(
          "persisted_preseal_reverification",
          "scientific_preseal_persisted_artifact_invalid",
          presealViolations.length > 0
            ? presealViolations.join(";")
            : "The persisted preseal receipt, artifact binding, and parsed artifact do not cross-bind exactly.",
          ["request_admission", "trusted_catalog_resolution"],
        );
      }
      const currentPresealReadbackViolations =
        await securelyRereadPersistedPreseal(enrollment);
      if (currentPresealReadbackViolations.length > 0) {
        return blocked(
          "persisted_preseal_reverification",
          "scientific_preseal_persisted_artifact_invalid",
          currentPresealReadbackViolations.join(";"),
          ["request_admission", "trusted_catalog_resolution"],
        );
      }

      const bindingViolations = registrationViolations(
        requestSnapshot,
        enrollment,
      );
      if (bindingViolations.length > 0) {
        const lineageOnly = bindingViolations.includes(
          "implementation_lineages_not_distinct",
        );
        const rootOnly = bindingViolations.includes("root_topology_invalid");
        return blocked(
          "root_and_lineage_admission",
          lineageOnly
            ? "independent_implementation_lineage_not_distinct"
            : rootOnly
              ? "pair_roots_not_server_authorized_distinct_and_disjoint"
              : "pair_catalog_binding_invalid",
          bindingViolations.join(";"),
          [
            "request_admission",
            "trusted_catalog_resolution",
            "persisted_preseal_reverification",
          ],
        );
      }

      /*
       * Deliberate first unimplemented transition: portable and absolute root
       * strings do not prove filesystem identity, exact 21-file inventory, or
       * the read-only mount actually presented to each OS-isolated lane. Those
       * observations must come from a server backend and be bound into the
       * launch seal. We therefore stop at root admission before observing or
       * changing output roots and before any sandbox/runner callback. The fixed
       * SERVER_COMPONENTS object is the only continuation path; public input
       * cannot replace its validators, replayer, or comparator.
       */
      void SERVER_COMPONENTS;
      return blocked(
        "root_and_lineage_admission",
        "scientific_root_mount_identity_and_sealed_inventory_not_verified",
        "No server observation binds the sealed scientific root's realpath/filesystem identity, exact 21-file inventory, and read-only lane mount into the launch seal. No prestate callback, sandbox start, runner, replay, comparison, or receipt persistence was invoked.",
        [
          "request_admission",
          "trusted_catalog_resolution",
          "persisted_preseal_reverification",
        ],
        "blocked_pending_production_os_backend",
      );
    },
  });
};

export const runNhm2SemiclassicalV2PairCoordinator = (
  request: Nhm2SemiclassicalV2PairCoordinatorRequestV1,
): Promise<Nhm2SemiclassicalV2PairCoordinatorResultV1> =>
  createNhm2SemiclassicalV2PairCoordinator().run(request);
