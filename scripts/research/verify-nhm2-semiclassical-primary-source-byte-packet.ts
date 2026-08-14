import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

const DEFAULT_MANIFEST_RELATIVE_PATH =
  "configs/research/nhm2-semiclassical-primary-source-byte-packet.v1.json";
const SHA256_RE = /^[0-9a-f]{64}$/;
const RECEIPT_SCHEMA_VERSION =
  "nhm2_semiclassical_primary_source_byte_verification_receipt/1";
// Updated only after the tracked manifest is in its final, formatted byte form.
const EXACT_MANIFEST_FILE_SHA256 =
  "43c1e79ce8bc1562dce56f478baf1ae454a69e77161a7c87a933d4d1ef054bad";
const EXACT_MANIFEST_FILE_SIZE_BYTES = 11_332;

const EXPECTED_AUTHORITY_LOCK_KEYS = [
  "originProvenanceAuthority",
  "sourceRedistributionAuthority",
  "sourceFormulaAuthority",
  "distributionalEquivalenceAuthority",
  "numericalExecutionAuthority",
  "meanRsetExecutionAuthority",
  "connectedNoiseExecutionAuthority",
  "lampAuthority",
  "physicalClaimAuthority",
  "certificateEligibility",
  "certificateAuthority",
] as const;

const EXPECTED_RECEIPT_MAY_RESOLVE = [
  "primary_source_artifact_bytes_not_verified",
  "primary_source_artifact_bytes_not_observed_or_pinned",
] as const;

const EXPECTED_RECEIPT_DOES_NOT_RESOLVE = [
  "primary_source_artifacts_not_vendored_and_locally_hash_verified",
  "formula_transcriptions_not_implemented",
  "distributional_equivalence_proof_not_discharged",
  "execution_contract_absent",
] as const;

const EXPECTED_SOURCE_ARTIFACTS = [
  {
    sourceId: "moretti_conserved_stress_and_local_wick_algebra",
    sourceVersion: "arXiv:gr-qc/0109048v2",
    arxivId: "gr-qc/0109048v2",
    abstractUrl: "https://arxiv.org/abs/gr-qc/0109048v2",
    downloadUrl: "https://arxiv.org/e-print/gr-qc/0109048v2",
    localFilename: "gr-qc_0109048v2.eprint",
    sha256: "f28fb4b058978cf95817bc22326dc6e1d41267608f1880cf0773f81fc142425f",
    sizeBytes: 38_039,
    licenseClassification: "arxiv_assumed_nonexclusive_distribution_1991_2003",
    licenseUrl: "https://arxiv.org/licenses/assumed-1991-2003/",
  },
  {
    sourceId: "phillips_hu_noise_normalization_and_stress_construction",
    sourceVersion: "arXiv:gr-qc/0010019v2",
    arxivId: "gr-qc/0010019v2",
    abstractUrl: "https://arxiv.org/abs/gr-qc/0010019v2",
    downloadUrl: "https://arxiv.org/e-print/gr-qc/0010019v2",
    localFilename: "gr-qc_0010019v2.eprint",
    sha256: "fdb4ccfff441524ef4f65629c3a66628f02dfca793a3c8862d03f6e283865374",
    sizeBytes: 30_809,
    licenseClassification: "arxiv_assumed_nonexclusive_distribution_1991_2003",
    licenseUrl: "https://arxiv.org/licenses/assumed-1991-2003/",
  },
  {
    sourceId: "cho_hu_conformal_mean_and_connected_noise_mapping",
    sourceVersion: "arXiv:1407.3907v1",
    arxivId: "1407.3907v1",
    abstractUrl: "https://arxiv.org/abs/1407.3907v1",
    downloadUrl: "https://arxiv.org/e-print/1407.3907v1",
    localFilename: "1407.3907v1.eprint",
    sha256: "a6aadd6363c4105c2571ddae2e889d4056dfc249da4f0f2fdc48e9a05905443f",
    sizeBytes: 11_844,
    licenseClassification: "arxiv_nonexclusive_distribution_1_0",
    licenseUrl: "https://arxiv.org/licenses/nonexclusive-distrib/1.0/",
  },
  {
    sourceId: "bates_centered_symmetrized_noise_distribution_audit",
    sourceVersion: "arXiv:1301.2501v1",
    arxivId: "1301.2501v1",
    abstractUrl: "https://arxiv.org/abs/1301.2501v1",
    downloadUrl: "https://arxiv.org/e-print/1301.2501v1",
    localFilename: "1301.2501v1.eprint",
    sha256: "1c53226a4dec6fb20b755989926ebd929b809dfabd7f67627e901e1a502f17cf",
    sizeBytes: 295_571,
    licenseClassification: "arxiv_nonexclusive_distribution_1_0",
    licenseUrl: "https://arxiv.org/licenses/nonexclusive-distrib/1.0/",
  },
  {
    sourceId: "serino_flat_improved_conformal_scalar_stress",
    sourceVersion: "arXiv:2004.08668v2",
    arxivId: "2004.08668v2",
    abstractUrl: "https://arxiv.org/abs/2004.08668v2",
    downloadUrl: "https://arxiv.org/e-print/2004.08668v2",
    localFilename: "2004.08668v2.eprint",
    sha256: "b054efb1adc181072815a2eefeea7b8970fe9cfa8f395170636d6246cdcd9a22",
    sizeBytes: 721_733,
    licenseClassification: "arxiv_nonexclusive_distribution_1_0",
    licenseUrl: "https://arxiv.org/licenses/nonexclusive-distrib/1.0/",
  },
  {
    sourceId: "herzog_huang_weyl_flat_trace_anomaly_stress",
    sourceVersion: "arXiv:1301.5002v3",
    arxivId: "1301.5002v3",
    abstractUrl: "https://arxiv.org/abs/1301.5002v3",
    downloadUrl: "https://arxiv.org/e-print/1301.5002v3",
    localFilename: "1301.5002v3.eprint",
    sha256: "49421e70657a38ca275fa2c3ecd4fb2a99a758abb84090f66257c35ca435fcec",
    sizeBytes: 13_390,
    licenseClassification: "arxiv_nonexclusive_distribution_1_0",
    licenseUrl: "https://arxiv.org/licenses/nonexclusive-distrib/1.0/",
  },
] as const;

type JsonRecord = Record<string, unknown>;

export type SourceArtifactManifestEntry = {
  sourceId: string;
  sourceVersion: string;
  arxivId: string;
  abstractUrl: string;
  equationAnchors: string[];
  sourceRoles: string[];
  consumingContracts: string[];
  artifact: {
    kind: "arxiv_eprint_source_archive";
    downloadUrl: string;
    localFilename: string;
    sha256: string;
    sizeBytes: number;
  };
  license: {
    classification: string;
    url: string;
    repositoryRedistributionPermissionEstablished: false;
    localIntegrityCacheOnly: true;
  };
};

export type SourceBytePacketManifest = {
  schemaVersion: string;
  packetId: string;
  packetVersion: string;
  maturity: string;
  status: string;
  scope: {
    declaredSourceCount: number;
    declaredArtifactCount: number;
    declaredTotalSizeBytes: number;
    knownMeanConventionSourcesOutsideThisPacket: string[];
    blanketMeanConventionSourceClosureAllowed: false;
    blanketNoiseExecutionClosureAllowed: false;
  } & JsonRecord;
  remoteProbeObservation: {
    observedOn: string;
    bytesCopiedIntoRepository: false;
    bytesCopiedIntoRepositoryCache: false;
    localVerificationReceiptProduced: false;
    remoteObservationAloneCountsAsLocalVerification: false;
  } & JsonRecord;
  localCachePolicy: {
    defaultRelativeRoot: string;
    repositoryInternalCacheMustRemainUnder: string;
    trustBoundary: "operator_controlled_local_content_cache_not_secure_launch_or_preseal_root";
    receiptAdmissionAlwaysReopensAndRehashesBytes: true;
    parentPathRaceClosureGuaranteed: false;
    repositoryInternalCacheIgnoredByGitPolicy: true;
    trackedSourceArchivesAllowed: false;
    callerSelectedExternalCacheAllowed: true;
    defaultCommandMode: "verify_only";
    networkAcquisitionRequiresExplicitFlag: "--acquire";
    receiptFilenamePrefix: string;
    maximumArtifactSizeBytes: number;
    maximumPacketSizeBytes: number;
    perArtifactTimeoutMs: number;
    totalAcquisitionTimeoutMs: number;
    maximumRedirects: number;
    allowedHttpsHosts: string[];
  };
  licensingBoundary: JsonRecord;
  blockerBoundary: {
    manifestAloneResolvesAnyBlocker: false;
    remoteProbeAloneResolvesAnyBlocker: false;
    successfulLocalReceiptRequired: true;
    receiptMayResolveOnly: string[];
    receiptDoesNotResolve: string[];
    vendoringComponentRemainsUnresolved: true;
    formulaInterpretationComponentRemainsUnresolved: true;
    executionComponentRemainsUnresolved: true;
  };
  authorityLocks: Record<string, false>;
  sources: SourceArtifactManifestEntry[];
};

type VerifiedSourceArtifact = {
  sourceId: string;
  sourceVersion: string;
  localRelativePath: string;
  sha256: string;
  sizeBytes: number;
  localBytePresenceVerified: true;
  sourceBytesVendored: false;
  remoteOriginProvenanceVerified: false;
  formulaInterpretationVerified: false;
  authorizesExecution: false;
};

export type SourceBytePacketReceipt = {
  schemaVersion: typeof RECEIPT_SCHEMA_VERSION;
  packetId: string;
  packetVersion: string;
  manifestFileSha256: string;
  manifestFileSizeBytes: number;
  packetContentIdentitySha256: string;
  verifiedAt: string;
  mode: "verify_only" | "acquire_then_verify";
  cacheRoot: string;
  sourceCount: number;
  totalSizeBytes: number;
  artifacts: VerifiedSourceArtifact[];
  integrityObservation: {
    allDeclaredLocalBytesPresent: true;
    allDeclaredSizesMatch: true;
    allDeclaredSha256Match: true;
    localContentIntegrityVerified: true;
    sourceBytesVendored: false;
    remoteOriginProvenanceVerified: false;
    formulaInterpretationVerified: false;
  };
  trustBoundary: {
    plainJsonReceiptTrustedWithoutAdmission: false;
    admissionRequiresExactManifestIdentity: true;
    admissionRequiresLocalByteReverification: true;
    operatorControlledContentCache: true;
    secureLaunchOrPresealRootVerified: false;
    pathOrOriginAuthorityGranted: false;
  };
  blockerBoundary: {
    eligibleLocalByteIdentityBlockers: string[];
    blockersResolvedByReceiptWithoutConsumerBinding: false;
    vendoringRequirementResolved: false;
    formulaRequirementResolved: false;
    executionRequirementResolved: false;
  };
  authorityLocks: Record<string, false>;
};

declare const ADMITTED_SOURCE_BYTE_PACKET_RECEIPT: unique symbol;

export type AdmittedSourceBytePacketReceipt =
  Readonly<SourceBytePacketReceipt> & {
    readonly [ADMITTED_SOURCE_BYTE_PACKET_RECEIPT]: true;
  };

type LoadedManifest = {
  manifest: SourceBytePacketManifest;
  rawBytes: Buffer;
  sha256: string;
};

type RunOptions = {
  repositoryRoot: string;
  manifestPath?: string;
  cacheRoot?: string;
  acquire?: boolean;
  writeReceipt?: boolean;
  fetchImpl?: typeof fetch;
};

type AdmissionOptions = {
  repositoryRoot: string;
  receipt: unknown;
  manifestPath?: string;
  cacheRoot?: string;
};

const fail = (code: string, detail?: string): never => {
  throw new Error(
    `nhm2_source_byte_packet:${code}${detail == null ? "" : `:${detail}`}`,
  );
};

const isRecord = (value: unknown): value is JsonRecord =>
  value != null && typeof value === "object" && !Array.isArray(value);

const exactKeys = (
  value: JsonRecord,
  expected: readonly string[],
  code: string,
): void => {
  let actual: string[];
  try {
    actual = Object.keys(value).sort();
  } catch {
    fail(code);
  }
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail(code);
  }
};

const exactStringArray = (
  actual: unknown,
  expected: readonly string[],
  code: string,
): string[] => {
  const values = requireStringArray(actual, code, expected.length === 0);
  if (
    values.length !== expected.length ||
    values.some((value, index) => value !== expected[index])
  ) {
    fail(code);
  }
  return values;
};

const snapshotJsonData = (
  value: unknown,
  seen = new Set<object>(),
  budget = { nodes: 0 },
  depth = 0,
): unknown => {
  budget.nodes += 1;
  if (budget.nodes > 512 || depth > 32) {
    fail("receipt_snapshot_complexity_limit_exceeded");
  }
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      fail("receipt_snapshot_number_invalid");
    }
    return value;
  }
  if (typeof value !== "object") fail("receipt_snapshot_value_invalid");
  const objectValue = value as object;
  if (seen.has(objectValue)) fail("receipt_snapshot_cycle_rejected");
  seen.add(objectValue);
  try {
    const prototype = Object.getPrototypeOf(value);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.getOwnPropertySymbols(value).length !== 0) {
      fail("receipt_snapshot_symbol_key_rejected");
    }
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) {
        fail("receipt_snapshot_array_prototype_invalid");
      }
      const lengthDescriptor = descriptors.length;
      if (
        lengthDescriptor == null ||
        !("value" in lengthDescriptor) ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        lengthDescriptor.value < 0
      ) {
        fail("receipt_snapshot_array_shape_invalid");
      }
      const arrayLength = lengthDescriptor.value as number;
      if (arrayLength > 64) {
        fail("receipt_snapshot_complexity_limit_exceeded");
      }
      const names = Object.getOwnPropertyNames(value);
      const expectedNames = [
        ...Array.from({ length: arrayLength }, (_, index) => String(index)),
        "length",
      ];
      if (
        names.length !== expectedNames.length ||
        names.some((name, index) => name !== expectedNames[index])
      ) {
        fail("receipt_snapshot_array_shape_invalid");
      }
      const result: unknown[] = [];
      for (let index = 0; index < arrayLength; index += 1) {
        const descriptor = descriptors[String(index)];
        if (
          descriptor == null ||
          !("value" in descriptor) ||
          descriptor.enumerable !== true
        ) {
          fail("receipt_snapshot_accessor_rejected");
        }
        result.push(
          snapshotJsonData(descriptor.value, seen, budget, depth + 1),
        );
      }
      return result;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      fail("receipt_snapshot_object_prototype_invalid");
    }
    const result: JsonRecord = Object.create(null) as JsonRecord;
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!("value" in descriptor) || descriptor.enumerable !== true) {
        fail("receipt_snapshot_accessor_rejected");
      }
      result[key] = snapshotJsonData(descriptor.value, seen, budget, depth + 1);
    }
    return result;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("nhm2_source_byte_packet:")
    ) {
      throw error;
    }
    fail("receipt_snapshot_trap_rejected");
  } finally {
    seen.delete(objectValue);
  }
};

const deepFreeze = <T>(value: T): T => {
  if (value != null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const isWithin = (parent: string, candidate: string): boolean => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};

const requireStringArray = (
  value: unknown,
  code: string,
  allowEmpty = false,
): string[] => {
  if (
    !Array.isArray(value) ||
    (!allowEmpty && value.length === 0) ||
    value.some((entry) => typeof entry !== "string" || entry.length === 0)
  ) {
    fail(code);
  }
  return value as string[];
};

const requireFalseRecord = (value: unknown, code: string): void => {
  if (
    !isRecord(value) ||
    Object.keys(value).length === 0 ||
    Object.values(value).some((entry) => entry !== false)
  ) {
    fail(code);
  }
};

export const assertAllowedDownloadUrl = (
  rawUrl: string,
  allowedHosts: readonly string[],
): URL => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    fail("download_url_invalid", rawUrl);
  }
  const allowed = new Set(allowedHosts.map((host) => host.toLowerCase()));
  if (
    parsed.protocol !== "https:" ||
    !allowed.has(parsed.hostname.toLowerCase()) ||
    (parsed.port !== "" && parsed.port !== "443") ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.hash !== ""
  ) {
    fail("download_url_not_allowed", rawUrl);
  }
  return parsed;
};

const assertAllowedArtifactDownloadUrl = (
  rawUrl: string,
  source: SourceArtifactManifestEntry,
  allowedHosts: readonly string[],
): URL => {
  const parsed = assertAllowedDownloadUrl(rawUrl, allowedHosts);
  if (
    parsed.pathname !== `/e-print/${source.arxivId}` ||
    parsed.search !== ""
  ) {
    fail("download_url_artifact_path_mismatch", source.sourceId);
  }
  return parsed;
};

const assertSafeLocalFilename = (filename: string): void => {
  if (
    filename.length === 0 ||
    filename === "." ||
    filename === ".." ||
    path.basename(filename) !== filename ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    fail("local_filename_not_safe", filename);
  }
};

export const validateSourceBytePacketManifest = (
  value: unknown,
): SourceBytePacketManifest => {
  if (!isRecord(value)) fail("manifest_root_invalid");
  exactKeys(
    value as JsonRecord,
    [
      "schemaVersion",
      "packetId",
      "packetVersion",
      "maturity",
      "status",
      "scope",
      "remoteProbeObservation",
      "localCachePolicy",
      "licensingBoundary",
      "blockerBoundary",
      "authorityLocks",
      "sources",
    ],
    "manifest_root_keys_invalid",
  );
  const manifest = value as unknown as SourceBytePacketManifest;
  if (
    manifest.schemaVersion !==
      "nhm2_semiclassical_primary_source_byte_packet/1" ||
    manifest.packetId !==
      "nhm2_conformally_flat_needle_semiclassical_primary_source_bytes_v1" ||
    manifest.packetVersion !== "1.0.0" ||
    manifest.maturity !== "stage_2_source_identity_only" ||
    manifest.status !== "manifest_pinned_local_receipt_absent"
  ) {
    fail("manifest_identity_invalid");
  }
  if (!isRecord(manifest.scope)) fail("manifest_scope_invalid");
  if (!isRecord(manifest.remoteProbeObservation)) {
    fail("remote_probe_observation_invalid");
  }
  if (!isRecord(manifest.localCachePolicy)) {
    fail("local_cache_policy_invalid");
  }
  if (!isRecord(manifest.licensingBoundary)) {
    fail("licensing_boundary_invalid");
  }
  if (!isRecord(manifest.blockerBoundary)) {
    fail("blocker_boundary_invalid");
  }
  requireFalseRecord(manifest.authorityLocks, "authority_locks_invalid");
  exactKeys(
    manifest.authorityLocks,
    EXPECTED_AUTHORITY_LOCK_KEYS,
    "authority_lock_keys_invalid",
  );

  exactKeys(
    manifest.scope,
    [
      "candidateFamily",
      "lanes",
      "declaredSourceCount",
      "declaredArtifactCount",
      "declaredTotalSizeBytes",
      "sourceSelection",
      "knownMeanConventionSourcesOutsideThisPacket",
      "blanketMeanConventionSourceClosureAllowed",
      "blanketNoiseExecutionClosureAllowed",
    ],
    "manifest_scope_keys_invalid",
  );
  exactKeys(
    manifest.remoteProbeObservation,
    [
      "observedOn",
      "observationEnvironment",
      "observationPurpose",
      "bytesCopiedIntoRepository",
      "bytesCopiedIntoRepositoryCache",
      "localVerificationReceiptProduced",
      "remoteObservationAloneCountsAsLocalVerification",
    ],
    "remote_probe_observation_keys_invalid",
  );
  exactKeys(
    manifest.localCachePolicy as unknown as JsonRecord,
    [
      "defaultRelativeRoot",
      "repositoryInternalCacheMustRemainUnder",
      "trustBoundary",
      "receiptAdmissionAlwaysReopensAndRehashesBytes",
      "parentPathRaceClosureGuaranteed",
      "repositoryInternalCacheIgnoredByGitPolicy",
      "trackedSourceArchivesAllowed",
      "callerSelectedExternalCacheAllowed",
      "defaultCommandMode",
      "networkAcquisitionRequiresExplicitFlag",
      "receiptFilenamePrefix",
      "maximumArtifactSizeBytes",
      "maximumPacketSizeBytes",
      "perArtifactTimeoutMs",
      "totalAcquisitionTimeoutMs",
      "maximumRedirects",
      "allowedHttpsHosts",
    ],
    "local_cache_policy_keys_invalid",
  );
  exactKeys(
    manifest.licensingBoundary,
    [
      "status",
      "arxivLicenseIsNotInterpretedAsRepositoryRedistributionPermission",
      "sourceArchivesVendored",
      "licenseReviewAuthorizesLocalIntegrityCachingOnly",
      "licenseReviewAuthorizesRepositoryRedistribution",
      "licenseReviewAuthorizesFormulaExecution",
      "licenseReviewAuthorizesPhysicalClaims",
    ],
    "licensing_boundary_keys_invalid",
  );

  const policy = manifest.localCachePolicy;
  const allowedHosts = requireStringArray(
    policy.allowedHttpsHosts,
    "allowed_https_hosts_invalid",
  );
  if (
    policy.defaultRelativeRoot !==
      "artifacts/research/semiclassical-source-bytes/nhm2-primary-source-packet-v1" ||
    policy.repositoryInternalCacheMustRemainUnder !==
      "artifacts/research/semiclassical-source-bytes" ||
    policy.trustBoundary !==
      "operator_controlled_local_content_cache_not_secure_launch_or_preseal_root" ||
    policy.receiptAdmissionAlwaysReopensAndRehashesBytes !== true ||
    policy.parentPathRaceClosureGuaranteed !== false ||
    policy.repositoryInternalCacheIgnoredByGitPolicy !== true ||
    policy.trackedSourceArchivesAllowed !== false ||
    policy.callerSelectedExternalCacheAllowed !== true ||
    policy.defaultCommandMode !== "verify_only" ||
    policy.networkAcquisitionRequiresExplicitFlag !== "--acquire" ||
    !Number.isSafeInteger(policy.maximumArtifactSizeBytes) ||
    policy.maximumArtifactSizeBytes <= 0 ||
    !Number.isSafeInteger(policy.maximumPacketSizeBytes) ||
    policy.maximumPacketSizeBytes <= 0 ||
    !Number.isSafeInteger(policy.perArtifactTimeoutMs) ||
    policy.perArtifactTimeoutMs <= 0 ||
    !Number.isSafeInteger(policy.totalAcquisitionTimeoutMs) ||
    policy.totalAcquisitionTimeoutMs <= 0 ||
    !Number.isSafeInteger(policy.maximumRedirects) ||
    policy.maximumRedirects < 0 ||
    policy.maximumRedirects > 5 ||
    policy.receiptFilenamePrefix !==
      "nhm2-primary-source-byte-verification-receipt" ||
    allowedHosts.length !== 2 ||
    !allowedHosts.includes("arxiv.org") ||
    !allowedHosts.includes("export.arxiv.org")
  ) {
    fail("local_cache_policy_invalid");
  }

  const probe = manifest.remoteProbeObservation;
  if (
    probe.observedOn !== "2026-08-12" ||
    probe.observationEnvironment !==
      "unique_os_temp_directory_outside_repository" ||
    probe.observationPurpose !==
      "measure_exact_versioned_eprint_bytes_before_manifest_freeze" ||
    probe.bytesCopiedIntoRepository !== false ||
    probe.bytesCopiedIntoRepositoryCache !== false ||
    probe.localVerificationReceiptProduced !== false ||
    probe.remoteObservationAloneCountsAsLocalVerification !== false
  ) {
    fail("remote_probe_boundary_invalid");
  }

  const licenseBoundary = manifest.licensingBoundary;
  if (
    licenseBoundary.status !==
      "repository_redistribution_permission_not_established" ||
    licenseBoundary.arxivLicenseIsNotInterpretedAsRepositoryRedistributionPermission !==
      true ||
    licenseBoundary.sourceArchivesVendored !== false ||
    licenseBoundary.licenseReviewAuthorizesLocalIntegrityCachingOnly !== true ||
    licenseBoundary.licenseReviewAuthorizesRepositoryRedistribution !== false ||
    licenseBoundary.licenseReviewAuthorizesFormulaExecution !== false ||
    licenseBoundary.licenseReviewAuthorizesPhysicalClaims !== false
  ) {
    fail("licensing_boundary_invalid");
  }

  const blocker = manifest.blockerBoundary;
  exactKeys(
    blocker as unknown as JsonRecord,
    [
      "manifestAloneResolvesAnyBlocker",
      "remoteProbeAloneResolvesAnyBlocker",
      "successfulLocalReceiptRequired",
      "receiptMayResolveOnly",
      "receiptDoesNotResolve",
      "vendoringComponentRemainsUnresolved",
      "formulaInterpretationComponentRemainsUnresolved",
      "executionComponentRemainsUnresolved",
    ],
    "blocker_boundary_keys_invalid",
  );
  const mayResolve = exactStringArray(
    blocker.receiptMayResolveOnly,
    EXPECTED_RECEIPT_MAY_RESOLVE,
    "receipt_resolution_scope_invalid",
  );
  const doesNotResolve = exactStringArray(
    blocker.receiptDoesNotResolve,
    EXPECTED_RECEIPT_DOES_NOT_RESOLVE,
    "receipt_nonresolution_scope_invalid",
  );
  if (
    blocker.manifestAloneResolvesAnyBlocker !== false ||
    blocker.remoteProbeAloneResolvesAnyBlocker !== false ||
    blocker.successfulLocalReceiptRequired !== true ||
    mayResolve.length !== EXPECTED_RECEIPT_MAY_RESOLVE.length ||
    doesNotResolve.length !== EXPECTED_RECEIPT_DOES_NOT_RESOLVE.length ||
    blocker.vendoringComponentRemainsUnresolved !== true ||
    blocker.formulaInterpretationComponentRemainsUnresolved !== true ||
    blocker.executionComponentRemainsUnresolved !== true
  ) {
    fail("blocker_boundary_invalid");
  }

  if (
    manifest.scope.declaredSourceCount !== 6 ||
    manifest.scope.declaredArtifactCount !== 6 ||
    manifest.scope.declaredTotalSizeBytes !== 1111386 ||
    manifest.scope.blanketMeanConventionSourceClosureAllowed !== false ||
    manifest.scope.blanketNoiseExecutionClosureAllowed !== false ||
    manifest.scope.candidateFamily !== "nhm2_conformally_flat_needle" ||
    manifest.scope.sourceSelection !==
      "exact_six_source_versions_declared_for_this_packet" ||
    exactStringArray(
      manifest.scope.lanes,
      [
        "fixed_background_mean_rset_convention",
        "fixed_background_connected_noise_convention",
      ],
      "manifest_scope_lanes_invalid",
    ).length !== 2 ||
    requireStringArray(
      manifest.scope.knownMeanConventionSourcesOutsideThisPacket,
      "known_out_of_scope_sources_invalid",
    ).join("|") !== "arXiv:1202.5107v2|arXiv:gr-qc/0512118v2"
  ) {
    fail("manifest_scope_invalid");
  }

  if (
    !Array.isArray(manifest.sources) ||
    manifest.sources.length !== EXPECTED_SOURCE_ARTIFACTS.length
  ) {
    fail("manifest_sources_invalid");
  }
  const sourceIds = new Set<string>();
  const versions = new Set<string>();
  const filenames = new Set<string>();
  const urls = new Set<string>();
  let totalBytes = 0;
  for (const [sourceIndex, source] of manifest.sources.entries()) {
    if (
      !isRecord(source) ||
      !isRecord(source.artifact) ||
      !isRecord(source.license)
    ) {
      fail("source_entry_invalid");
    }
    exactKeys(
      source,
      [
        "sourceId",
        "sourceVersion",
        "arxivId",
        "abstractUrl",
        "equationAnchors",
        "sourceRoles",
        "consumingContracts",
        "artifact",
        "license",
      ],
      "source_entry_keys_invalid",
    );
    exactKeys(
      source.artifact,
      ["kind", "downloadUrl", "localFilename", "sha256", "sizeBytes"],
      "source_artifact_keys_invalid",
    );
    exactKeys(
      source.license,
      [
        "classification",
        "url",
        "repositoryRedistributionPermissionEstablished",
        "localIntegrityCacheOnly",
      ],
      "source_license_keys_invalid",
    );
    const expected = EXPECTED_SOURCE_ARTIFACTS[sourceIndex];
    if (
      typeof source.sourceId !== "string" ||
      source.sourceId.length === 0 ||
      typeof source.sourceVersion !== "string" ||
      typeof source.arxivId !== "string" ||
      source.sourceVersion !== `arXiv:${source.arxivId}` ||
      source.abstractUrl !== `https://arxiv.org/abs/${source.arxivId}` ||
      source.sourceId !== expected.sourceId ||
      source.sourceVersion !== expected.sourceVersion ||
      source.arxivId !== expected.arxivId ||
      source.abstractUrl !== expected.abstractUrl
    ) {
      fail("source_identity_invalid", String(source.sourceId));
    }
    requireStringArray(source.equationAnchors, "equation_anchors_invalid");
    requireStringArray(source.sourceRoles, "source_roles_invalid");
    requireStringArray(
      source.consumingContracts,
      "consuming_contracts_invalid",
    );
    if (
      sourceIds.has(source.sourceId) ||
      versions.has(source.sourceVersion) ||
      filenames.has(source.artifact.localFilename) ||
      urls.has(source.artifact.downloadUrl)
    ) {
      fail("source_identity_duplicate", source.sourceId);
    }
    sourceIds.add(source.sourceId);
    versions.add(source.sourceVersion);
    filenames.add(source.artifact.localFilename);
    urls.add(source.artifact.downloadUrl);

    assertSafeLocalFilename(source.artifact.localFilename);
    const download = assertAllowedDownloadUrl(
      source.artifact.downloadUrl,
      allowedHosts,
    );
    if (
      source.artifact.kind !== "arxiv_eprint_source_archive" ||
      source.artifact.downloadUrl !== expected.downloadUrl ||
      source.artifact.localFilename !== expected.localFilename ||
      source.artifact.sha256 !== expected.sha256 ||
      source.artifact.sizeBytes !== expected.sizeBytes ||
      download.hostname !== "arxiv.org" ||
      download.pathname !== `/e-print/${source.arxivId}` ||
      download.search !== "" ||
      !SHA256_RE.test(source.artifact.sha256) ||
      !Number.isSafeInteger(source.artifact.sizeBytes) ||
      source.artifact.sizeBytes <= 0 ||
      source.artifact.sizeBytes > policy.maximumArtifactSizeBytes
    ) {
      fail("source_artifact_invalid", source.sourceId);
    }
    if (
      typeof source.license.classification !== "string" ||
      source.license.classification.length === 0 ||
      source.license.classification !== expected.licenseClassification ||
      source.license.url !== expected.licenseUrl ||
      !source.license.url.startsWith("https://arxiv.org/licenses/") ||
      source.license.repositoryRedistributionPermissionEstablished !== false ||
      source.license.localIntegrityCacheOnly !== true
    ) {
      fail("source_license_invalid", source.sourceId);
    }
    totalBytes += source.artifact.sizeBytes;
  }
  if (
    totalBytes !== manifest.scope.declaredTotalSizeBytes ||
    totalBytes > policy.maximumPacketSizeBytes
  ) {
    fail("declared_packet_size_invalid");
  }
  return manifest;
};

export const loadSourceBytePacketManifest = async (
  manifestPath: string,
): Promise<LoadedManifest> => {
  const rawBytes = await readPlainFileBounded(
    manifestPath,
    EXACT_MANIFEST_FILE_SIZE_BYTES + 1,
    "manifest_file",
  );
  const rawSha256 = sha256(rawBytes);
  if (
    rawBytes.byteLength !== EXACT_MANIFEST_FILE_SIZE_BYTES ||
    rawSha256 !== EXACT_MANIFEST_FILE_SHA256
  ) {
    fail("manifest_file_identity_mismatch");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBytes.toString("utf8"));
  } catch {
    fail("manifest_json_invalid");
  }
  return {
    manifest: validateSourceBytePacketManifest(parsed),
    rawBytes,
    sha256: rawSha256,
  };
};

const assertNoSymlinkInExistingChain = async (
  absolutePath: string,
): Promise<void> => {
  const resolved = path.resolve(absolutePath);
  const parsed = path.parse(resolved);
  const segments = resolved
    .slice(parsed.root.length)
    .split(path.sep)
    .filter(Boolean);
  let current = parsed.root;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      fail("symlink_path_rejected", current);
    }
  }
};

const resolveSourceByteCacheRoot = async (
  repositoryRoot: string,
  requestedCacheRoot: string | undefined,
  manifest: SourceBytePacketManifest,
): Promise<string> => {
  const repoRoot = path.resolve(repositoryRoot);
  const target = path.resolve(
    repoRoot,
    requestedCacheRoot ?? manifest.localCachePolicy.defaultRelativeRoot,
  );
  const allowedInternalRoot = path.resolve(
    repoRoot,
    manifest.localCachePolicy.repositoryInternalCacheMustRemainUnder,
  );
  if (isWithin(repoRoot, target) && !isWithin(allowedInternalRoot, target)) {
    fail("repository_internal_cache_path_not_ignored", target);
  }
  await assertNoSymlinkInExistingChain(target);
  await fs.mkdir(target, { recursive: true });
  await assertNoSymlinkInExistingChain(target);
  const stat = await fs.lstat(target);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail("cache_root_not_plain_directory", target);
  }
  return await fs.realpath(target);
};

const readPlainFileBounded = async (
  filePath: string,
  maximumBytes: number,
  failurePrefix = "source_artifact",
): Promise<Buffer> => {
  await assertNoSymlinkInExistingChain(filePath);
  const noFollow =
    fsConstants.O_RDONLY |
    (typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0);
  let handle;
  try {
    handle = await fs.open(filePath, noFollow);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      fail(`${failurePrefix}_missing`, filePath);
    }
    throw error;
  }
  try {
    const before = await handle.stat();
    if (!before.isFile()) fail(`${failurePrefix}_not_plain_file`, filePath);
    if (before.size > maximumBytes)
      fail(`${failurePrefix}_too_large`, filePath);

    const chunks: Buffer[] = [];
    let position = 0;
    while (position <= maximumBytes) {
      const remainingWithSentinel = maximumBytes + 1 - position;
      const buffer = Buffer.allocUnsafe(
        Math.min(64 * 1024, remainingWithSentinel),
      );
      const { bytesRead } = await handle.read(
        buffer,
        0,
        buffer.byteLength,
        position,
      );
      if (bytesRead === 0) break;
      position += bytesRead;
      if (position > maximumBytes) {
        fail(`${failurePrefix}_too_large`, filePath);
      }
      chunks.push(buffer.subarray(0, bytesRead));
    }

    const after = await handle.stat();
    if (
      !after.isFile() ||
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs ||
      after.size !== position
    ) {
      fail(`${failurePrefix}_changed_during_read`, filePath);
    }
    return Buffer.concat(chunks, position);
  } finally {
    await handle.close();
  }
};

const verifyOneLocalArtifact = async (
  cacheRoot: string,
  source: SourceArtifactManifestEntry,
): Promise<VerifiedSourceArtifact> => {
  const artifactPath = path.resolve(cacheRoot, source.artifact.localFilename);
  if (!isWithin(cacheRoot, artifactPath)) {
    fail("source_artifact_path_escape", source.sourceId);
  }
  const bytes = await readPlainFileBounded(
    artifactPath,
    source.artifact.sizeBytes,
  );
  if (bytes.byteLength !== source.artifact.sizeBytes) {
    fail("source_artifact_size_mismatch", source.sourceId);
  }
  const actualSha256 = sha256(bytes);
  if (actualSha256 !== source.artifact.sha256) {
    fail("source_artifact_sha256_mismatch", source.sourceId);
  }
  const realArtifactPath = await fs.realpath(artifactPath);
  if (!isWithin(cacheRoot, realArtifactPath)) {
    fail("source_artifact_realpath_escape", source.sourceId);
  }
  return {
    sourceId: source.sourceId,
    sourceVersion: source.sourceVersion,
    localRelativePath: source.artifact.localFilename,
    sha256: actualSha256,
    sizeBytes: bytes.byteLength,
    localBytePresenceVerified: true,
    sourceBytesVendored: false,
    remoteOriginProvenanceVerified: false,
    formulaInterpretationVerified: false,
    authorizesExecution: false,
  };
};

const verifiedEvidenceSets = new WeakSet<VerifiedSourceArtifact[]>();
const admittedReceipts = new WeakSet<object>();

const verifyLocalSourceBytePacket = async (
  cacheRoot: string,
  manifest: SourceBytePacketManifest,
): Promise<VerifiedSourceArtifact[]> => {
  const realCacheRoot = await fs.realpath(cacheRoot);
  const verified: VerifiedSourceArtifact[] = [];
  for (const source of manifest.sources) {
    verified.push(await verifyOneLocalArtifact(realCacheRoot, source));
  }
  const total = verified.reduce((sum, entry) => sum + entry.sizeBytes, 0);
  if (total !== manifest.scope.declaredTotalSizeBytes) {
    fail("verified_packet_size_mismatch");
  }
  for (const artifact of verified) Object.freeze(artifact);
  Object.freeze(verified);
  verifiedEvidenceSets.add(verified);
  return verified;
};

const fetchExactArtifactBytes = async (
  source: SourceArtifactManifestEntry,
  manifest: SourceBytePacketManifest,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<Buffer> => {
  const policy = manifest.localCachePolicy;
  const deadline = performance.now() + timeoutMs;
  let current = assertAllowedArtifactDownloadUrl(
    source.artifact.downloadUrl,
    source,
    policy.allowedHttpsHosts,
  );
  for (let redirectCount = 0; ; redirectCount += 1) {
    const remainingMs = deadline - performance.now();
    if (remainingMs <= 0) fail("acquisition_timeout", source.sourceId);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remainingMs);
    let response: Response;
    try {
      response = await fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept:
            "application/gzip, application/x-eprint-tar, application/octet-stream",
          "user-agent": "CasimirBot-NHM2-source-byte-integrity-verifier/1",
        },
      });
    } catch (error) {
      if (controller.signal.aborted) {
        fail("acquisition_timeout", source.sourceId);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status <= 399) {
      if (redirectCount >= policy.maximumRedirects) {
        fail("redirect_limit_exceeded", source.sourceId);
      }
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (location == null) fail("redirect_location_missing", source.sourceId);
      current = assertAllowedArtifactDownloadUrl(
        new URL(location, current).toString(),
        source,
        policy.allowedHttpsHosts,
      );
      continue;
    }
    if (response.status !== 200) {
      await response.body?.cancel();
      fail("acquisition_http_status", `${source.sourceId}:${response.status}`);
    }
    const declaredLength = response.headers.get("content-length");
    if (
      declaredLength != null &&
      (!/^\d+$/.test(declaredLength) ||
        Number(declaredLength) !== source.artifact.sizeBytes)
    ) {
      await response.body?.cancel();
      fail("acquisition_content_length_mismatch", source.sourceId);
    }
    if (response.body == null)
      fail("acquisition_body_missing", source.sourceId);
    const reader = response.body.getReader();
    const bodyRemainingMs = deadline - performance.now();
    if (bodyRemainingMs <= 0) fail("acquisition_timeout", source.sourceId);
    const bodyTimer = setTimeout(() => controller.abort(), bodyRemainingMs);
    try {
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const result = await reader.read();
        if (result.done) break;
        received += result.value.byteLength;
        if (
          received > source.artifact.sizeBytes ||
          received > policy.maximumArtifactSizeBytes
        ) {
          await reader.cancel();
          fail("acquisition_byte_limit_exceeded", source.sourceId);
        }
        chunks.push(result.value);
      }
      const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
      if (bytes.byteLength !== source.artifact.sizeBytes) {
        fail("acquisition_size_mismatch", source.sourceId);
      }
      if (sha256(bytes) !== source.artifact.sha256) {
        fail("acquisition_sha256_mismatch", source.sourceId);
      }
      return bytes;
    } catch (error) {
      if (controller.signal.aborted) {
        fail("acquisition_timeout", source.sourceId);
      }
      throw error;
    } finally {
      clearTimeout(bodyTimer);
    }
  }
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.lstat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
};

const acquireMissingSourceBytePacket = async (
  cacheRoot: string,
  manifest: SourceBytePacketManifest,
  fetchImpl: typeof fetch = fetch,
): Promise<void> => {
  const realCacheRoot = await fs.realpath(cacheRoot);
  const tempDirectory = await fs.mkdtemp(
    path.join(realCacheRoot, ".nhm2-source-tmp-"),
  );
  if (!isWithin(realCacheRoot, tempDirectory)) {
    fail("temporary_directory_escape");
  }
  const temporaryFiles = new Set<string>();
  const startedAt = performance.now();
  let acquiredBytes = 0;
  try {
    for (const source of manifest.sources) {
      const finalPath = path.resolve(
        realCacheRoot,
        source.artifact.localFilename,
      );
      if (!isWithin(realCacheRoot, finalPath)) {
        fail("source_artifact_path_escape", source.sourceId);
      }
      if (await fileExists(finalPath)) {
        await verifyOneLocalArtifact(realCacheRoot, source);
        continue;
      }
      const totalRemaining =
        manifest.localCachePolicy.totalAcquisitionTimeoutMs -
        (performance.now() - startedAt);
      if (totalRemaining <= 0) fail("packet_acquisition_timeout");
      const timeoutMs = Math.min(
        manifest.localCachePolicy.perArtifactTimeoutMs,
        totalRemaining,
      );
      const bytes = await fetchExactArtifactBytes(
        source,
        manifest,
        timeoutMs,
        fetchImpl,
      );
      acquiredBytes += bytes.byteLength;
      if (acquiredBytes > manifest.localCachePolicy.maximumPacketSizeBytes) {
        fail("packet_acquisition_byte_limit_exceeded");
      }
      const tempPath = path.join(
        tempDirectory,
        `${source.artifact.localFilename}.${randomUUID()}.partial`,
      );
      temporaryFiles.add(tempPath);
      const handle = await fs.open(tempPath, "wx", 0o600);
      try {
        await handle.writeFile(bytes);
        await handle.sync();
      } finally {
        await handle.close();
      }
      const tempBytes = await readPlainFileBounded(
        tempPath,
        source.artifact.sizeBytes,
      );
      if (
        tempBytes.byteLength !== source.artifact.sizeBytes ||
        sha256(tempBytes) !== source.artifact.sha256
      ) {
        fail("temporary_artifact_integrity_mismatch", source.sourceId);
      }
      try {
        await fs.link(tempPath, finalPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        await verifyOneLocalArtifact(realCacheRoot, source);
      }
      await fs.unlink(tempPath);
      temporaryFiles.delete(tempPath);
      await verifyOneLocalArtifact(realCacheRoot, source);
    }
  } finally {
    for (const temporaryFile of temporaryFiles) {
      await fs.unlink(temporaryFile).catch(() => undefined);
    }
    await fs.rmdir(tempDirectory).catch(() => undefined);
  }
};

const packetContentIdentitySha256 = (
  manifest: SourceBytePacketManifest,
): string =>
  sha256(
    JSON.stringify(
      manifest.sources.map((source) => ({
        sourceId: source.sourceId,
        sourceVersion: source.sourceVersion,
        kind: source.artifact.kind,
        sha256: source.artifact.sha256,
        sizeBytes: source.artifact.sizeBytes,
      })),
    ),
  );

const buildSourceBytePacketReceipt = (
  loaded: LoadedManifest,
  cacheRoot: string,
  verified: VerifiedSourceArtifact[],
  mode: "verify_only" | "acquire_then_verify",
  now: () => Date = () => new Date(),
): AdmittedSourceBytePacketReceipt => {
  if (
    !verifiedEvidenceSets.has(verified) ||
    verified.length !== loaded.manifest.sources.length
  ) {
    fail("receipt_artifact_count_invalid");
  }
  for (const [index, artifact] of verified.entries()) {
    const source = loaded.manifest.sources[index];
    if (
      artifact.sourceId !== source.sourceId ||
      artifact.sourceVersion !== source.sourceVersion ||
      artifact.localRelativePath !== source.artifact.localFilename ||
      artifact.sha256 !== source.artifact.sha256 ||
      artifact.sizeBytes !== source.artifact.sizeBytes ||
      artifact.localBytePresenceVerified !== true ||
      artifact.sourceBytesVendored !== false ||
      artifact.remoteOriginProvenanceVerified !== false ||
      artifact.formulaInterpretationVerified !== false ||
      artifact.authorizesExecution !== false
    ) {
      fail("receipt_artifact_evidence_invalid", source.sourceId);
    }
  }
  const totalSizeBytes = verified.reduce(
    (sum, artifact) => sum + artifact.sizeBytes,
    0,
  );
  if (totalSizeBytes !== loaded.manifest.scope.declaredTotalSizeBytes) {
    fail("receipt_total_size_invalid");
  }
  const authorityLocks = Object.fromEntries(
    Object.keys(loaded.manifest.authorityLocks).map((key) => [key, false]),
  ) as Record<string, false>;
  const receipt: SourceBytePacketReceipt = {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    packetId: loaded.manifest.packetId,
    packetVersion: loaded.manifest.packetVersion,
    manifestFileSha256: loaded.sha256,
    manifestFileSizeBytes: loaded.rawBytes.byteLength,
    packetContentIdentitySha256: packetContentIdentitySha256(loaded.manifest),
    verifiedAt: now().toISOString(),
    mode,
    cacheRoot,
    sourceCount: verified.length,
    totalSizeBytes,
    artifacts: verified,
    integrityObservation: {
      allDeclaredLocalBytesPresent: true,
      allDeclaredSizesMatch: true,
      allDeclaredSha256Match: true,
      localContentIntegrityVerified: true,
      sourceBytesVendored: false,
      remoteOriginProvenanceVerified: false,
      formulaInterpretationVerified: false,
    },
    trustBoundary: {
      plainJsonReceiptTrustedWithoutAdmission: false,
      admissionRequiresExactManifestIdentity: true,
      admissionRequiresLocalByteReverification: true,
      operatorControlledContentCache: true,
      secureLaunchOrPresealRootVerified: false,
      pathOrOriginAuthorityGranted: false,
    },
    blockerBoundary: {
      eligibleLocalByteIdentityBlockers:
        loaded.manifest.blockerBoundary.receiptMayResolveOnly,
      blockersResolvedByReceiptWithoutConsumerBinding: false,
      vendoringRequirementResolved: false,
      formulaRequirementResolved: false,
      executionRequirementResolved: false,
    },
    authorityLocks,
  };
  deepFreeze(receipt);
  admittedReceipts.add(receipt);
  return receipt as AdmittedSourceBytePacketReceipt;
};

const validateUntrustedReceiptShape = (
  value: unknown,
  loaded: LoadedManifest,
  cacheRoot: string,
): SourceBytePacketReceipt => {
  const snapshot = snapshotJsonData(value);
  if (!isRecord(snapshot)) fail("receipt_root_invalid");
  const snapshotRecord = snapshot as JsonRecord;
  exactKeys(
    snapshotRecord,
    [
      "schemaVersion",
      "packetId",
      "packetVersion",
      "manifestFileSha256",
      "manifestFileSizeBytes",
      "packetContentIdentitySha256",
      "verifiedAt",
      "mode",
      "cacheRoot",
      "sourceCount",
      "totalSizeBytes",
      "artifacts",
      "integrityObservation",
      "trustBoundary",
      "blockerBoundary",
      "authorityLocks",
    ],
    "receipt_root_keys_invalid",
  );
  const receipt = snapshotRecord as unknown as SourceBytePacketReceipt;
  if (
    receipt.schemaVersion !== RECEIPT_SCHEMA_VERSION ||
    receipt.packetId !== loaded.manifest.packetId ||
    receipt.packetVersion !== loaded.manifest.packetVersion ||
    receipt.manifestFileSha256 !== loaded.sha256 ||
    receipt.manifestFileSizeBytes !== loaded.rawBytes.byteLength ||
    receipt.packetContentIdentitySha256 !==
      packetContentIdentitySha256(loaded.manifest) ||
    typeof receipt.verifiedAt !== "string" ||
    !Number.isFinite(Date.parse(receipt.verifiedAt)) ||
    new Date(receipt.verifiedAt).toISOString() !== receipt.verifiedAt ||
    (receipt.mode !== "verify_only" &&
      receipt.mode !== "acquire_then_verify") ||
    receipt.cacheRoot !== cacheRoot ||
    receipt.sourceCount !== loaded.manifest.sources.length ||
    receipt.totalSizeBytes !== loaded.manifest.scope.declaredTotalSizeBytes
  ) {
    fail("receipt_identity_invalid");
  }

  if (
    !Array.isArray(receipt.artifacts) ||
    receipt.artifacts.length !== loaded.manifest.sources.length
  ) {
    fail("receipt_artifacts_invalid");
  }
  for (const [index, artifact] of receipt.artifacts.entries()) {
    if (!isRecord(artifact)) fail("receipt_artifact_invalid");
    exactKeys(
      artifact,
      [
        "sourceId",
        "sourceVersion",
        "localRelativePath",
        "sha256",
        "sizeBytes",
        "localBytePresenceVerified",
        "sourceBytesVendored",
        "remoteOriginProvenanceVerified",
        "formulaInterpretationVerified",
        "authorizesExecution",
      ],
      "receipt_artifact_keys_invalid",
    );
    const source = loaded.manifest.sources[index];
    if (
      artifact.sourceId !== source.sourceId ||
      artifact.sourceVersion !== source.sourceVersion ||
      artifact.localRelativePath !== source.artifact.localFilename ||
      artifact.sha256 !== source.artifact.sha256 ||
      artifact.sizeBytes !== source.artifact.sizeBytes ||
      artifact.localBytePresenceVerified !== true ||
      artifact.sourceBytesVendored !== false ||
      artifact.remoteOriginProvenanceVerified !== false ||
      artifact.formulaInterpretationVerified !== false ||
      artifact.authorizesExecution !== false
    ) {
      fail("receipt_artifact_invalid", source.sourceId);
    }
  }

  if (!isRecord(receipt.integrityObservation)) {
    fail("receipt_integrity_observation_invalid");
  }
  exactKeys(
    receipt.integrityObservation,
    [
      "allDeclaredLocalBytesPresent",
      "allDeclaredSizesMatch",
      "allDeclaredSha256Match",
      "localContentIntegrityVerified",
      "sourceBytesVendored",
      "remoteOriginProvenanceVerified",
      "formulaInterpretationVerified",
    ],
    "receipt_integrity_observation_keys_invalid",
  );
  if (
    receipt.integrityObservation.allDeclaredLocalBytesPresent !== true ||
    receipt.integrityObservation.allDeclaredSizesMatch !== true ||
    receipt.integrityObservation.allDeclaredSha256Match !== true ||
    receipt.integrityObservation.localContentIntegrityVerified !== true ||
    receipt.integrityObservation.sourceBytesVendored !== false ||
    receipt.integrityObservation.remoteOriginProvenanceVerified !== false ||
    receipt.integrityObservation.formulaInterpretationVerified !== false
  ) {
    fail("receipt_integrity_observation_invalid");
  }

  if (!isRecord(receipt.trustBoundary)) fail("receipt_trust_boundary_invalid");
  exactKeys(
    receipt.trustBoundary,
    [
      "plainJsonReceiptTrustedWithoutAdmission",
      "admissionRequiresExactManifestIdentity",
      "admissionRequiresLocalByteReverification",
      "operatorControlledContentCache",
      "secureLaunchOrPresealRootVerified",
      "pathOrOriginAuthorityGranted",
    ],
    "receipt_trust_boundary_keys_invalid",
  );
  if (
    receipt.trustBoundary.plainJsonReceiptTrustedWithoutAdmission !== false ||
    receipt.trustBoundary.admissionRequiresExactManifestIdentity !== true ||
    receipt.trustBoundary.admissionRequiresLocalByteReverification !== true ||
    receipt.trustBoundary.operatorControlledContentCache !== true ||
    receipt.trustBoundary.secureLaunchOrPresealRootVerified !== false ||
    receipt.trustBoundary.pathOrOriginAuthorityGranted !== false
  ) {
    fail("receipt_trust_boundary_invalid");
  }

  if (!isRecord(receipt.blockerBoundary)) {
    fail("receipt_blocker_boundary_invalid");
  }
  exactKeys(
    receipt.blockerBoundary,
    [
      "eligibleLocalByteIdentityBlockers",
      "blockersResolvedByReceiptWithoutConsumerBinding",
      "vendoringRequirementResolved",
      "formulaRequirementResolved",
      "executionRequirementResolved",
    ],
    "receipt_blocker_boundary_keys_invalid",
  );
  exactStringArray(
    receipt.blockerBoundary.eligibleLocalByteIdentityBlockers,
    EXPECTED_RECEIPT_MAY_RESOLVE,
    "receipt_blocker_scope_invalid",
  );
  if (
    receipt.blockerBoundary.blockersResolvedByReceiptWithoutConsumerBinding !==
      false ||
    receipt.blockerBoundary.vendoringRequirementResolved !== false ||
    receipt.blockerBoundary.formulaRequirementResolved !== false ||
    receipt.blockerBoundary.executionRequirementResolved !== false
  ) {
    fail("receipt_blocker_boundary_invalid");
  }

  if (!isRecord(receipt.authorityLocks))
    fail("receipt_authority_locks_invalid");
  requireFalseRecord(receipt.authorityLocks, "receipt_authority_locks_invalid");
  exactKeys(
    receipt.authorityLocks,
    EXPECTED_AUTHORITY_LOCK_KEYS,
    "receipt_authority_lock_keys_invalid",
  );
  return receipt;
};

export const admitSourceBytePacketReceipt = async (
  options: AdmissionOptions,
): Promise<AdmittedSourceBytePacketReceipt> => {
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const manifestPath = path.resolve(
    repositoryRoot,
    options.manifestPath ?? DEFAULT_MANIFEST_RELATIVE_PATH,
  );
  const loaded = await loadSourceBytePacketManifest(manifestPath);
  const cacheRoot = await resolveSourceByteCacheRoot(
    repositoryRoot,
    options.cacheRoot,
    loaded.manifest,
  );
  const untrusted = validateUntrustedReceiptShape(
    options.receipt,
    loaded,
    cacheRoot,
  );
  const verified = await verifyLocalSourceBytePacket(
    cacheRoot,
    loaded.manifest,
  );
  return buildSourceBytePacketReceipt(
    loaded,
    cacheRoot,
    verified,
    "verify_only",
  );
};

export const isAdmittedSourceBytePacketReceipt = (
  value: unknown,
): value is AdmittedSourceBytePacketReceipt =>
  value != null && typeof value === "object" && admittedReceipts.has(value);

const writeReceipt = async (
  cacheRoot: string,
  manifest: SourceBytePacketManifest,
  receipt: SourceBytePacketReceipt,
): Promise<string> => {
  const filename = `${manifest.localCachePolicy.receiptFilenamePrefix}-${Date.now()}-${randomUUID()}.v1.json`;
  assertSafeLocalFilename(filename);
  const receiptPath = path.resolve(cacheRoot, filename);
  if (!isWithin(cacheRoot, receiptPath)) fail("receipt_path_escape");
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const handle = await fs.open(receiptPath, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  return receiptPath;
};

export const runSourceBytePacket = async (
  options: RunOptions,
): Promise<{
  manifestPath: string;
  cacheRoot: string;
  receipt: SourceBytePacketReceipt;
  receiptPath: string | null;
}> => {
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const manifestPath = path.resolve(
    repositoryRoot,
    options.manifestPath ?? DEFAULT_MANIFEST_RELATIVE_PATH,
  );
  const loaded = await loadSourceBytePacketManifest(manifestPath);
  const cacheRoot = await resolveSourceByteCacheRoot(
    repositoryRoot,
    options.cacheRoot,
    loaded.manifest,
  );
  const acquire = options.acquire === true;
  if (acquire) {
    await acquireMissingSourceBytePacket(
      cacheRoot,
      loaded.manifest,
      options.fetchImpl ?? fetch,
    );
  }
  const verified = await verifyLocalSourceBytePacket(
    cacheRoot,
    loaded.manifest,
  );
  const receipt = buildSourceBytePacketReceipt(
    loaded,
    cacheRoot,
    verified,
    acquire ? "acquire_then_verify" : "verify_only",
  );
  const receiptPath =
    options.writeReceipt === false
      ? null
      : await writeReceipt(cacheRoot, loaded.manifest, receipt);
  return { manifestPath, cacheRoot, receipt, receiptPath };
};

const usage = (): string => `Usage:
  tsx scripts/research/verify-nhm2-semiclassical-primary-source-byte-packet.ts [options]

Options:
  --manifest <path>    Override the tracked packet manifest.
  --cache-root <path>  Use an external cache or the ignored in-repo cache subtree.
  --acquire            Explicitly permit bounded HTTPS acquisition of missing bytes.
  --no-receipt         Verify without writing a local receipt.
  --help               Show this text.

Default mode is offline verify-only. Manifest pins and remote observations do not
count as local byte verification; success requires all six exact local artifacts.
`;

const parseCli = (argv: string[]) => {
  const result: {
    manifestPath?: string;
    cacheRoot?: string;
    acquire: boolean;
    writeReceipt: boolean;
    help: boolean;
  } = {
    acquire: false,
    writeReceipt: true,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--acquire") result.acquire = true;
    else if (token === "--no-receipt") result.writeReceipt = false;
    else if (token === "--help" || token === "-h") result.help = true;
    else if (token === "--manifest" || token === "--cache-root") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        fail("cli_value_missing", token);
      if (token === "--manifest") result.manifestPath = value;
      else result.cacheRoot = value;
      index += 1;
    } else {
      fail("cli_argument_unknown", token);
    }
  }
  return result;
};

const main = async (): Promise<void> => {
  const cli = parseCli(process.argv.slice(2));
  if (cli.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await runSourceBytePacket({
    repositoryRoot: process.cwd(),
    manifestPath: cli.manifestPath,
    cacheRoot: cli.cacheRoot,
    acquire: cli.acquire,
    writeReceipt: cli.writeReceipt,
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        mode: result.receipt.mode,
        manifestPath: result.manifestPath,
        cacheRoot: result.cacheRoot,
        receiptPath: result.receiptPath,
        manifestFileSha256: result.receipt.manifestFileSha256,
        packetContentIdentitySha256: result.receipt.packetContentIdentitySha256,
        sourceCount: result.receipt.sourceCount,
        totalSizeBytes: result.receipt.totalSizeBytes,
        localContentIntegrityVerified:
          result.receipt.integrityObservation.localContentIntegrityVerified,
        sourceBytesVendored:
          result.receipt.integrityObservation.sourceBytesVendored,
        remoteOriginProvenanceVerified:
          result.receipt.integrityObservation.remoteOriginProvenanceVerified,
        formulaInterpretationVerified:
          result.receipt.integrityObservation.formulaInterpretationVerified,
        authorityLocks: result.receipt.authorityLocks,
      },
      null,
      2,
    )}\n`,
  );
};

const invokedPath = process.argv[1];
if (
  invokedPath != null &&
  import.meta.url === pathToFileURL(path.resolve(invokedPath)).href
) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
