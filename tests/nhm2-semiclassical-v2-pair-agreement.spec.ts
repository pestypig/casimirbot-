import { createHash } from "node:crypto";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_RECEIPT_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT,
  NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES,
  NHM2_SEMICLASSICAL_V2_PAIR_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY,
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V2_PAIR_DIAGNOSTIC_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_LOCKS,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
  NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_LOCKS,
  computeNhm2SemiclassicalV2PairAgreementReceiptSha256,
  computeNhm2SemiclassicalV2PairLaunchSealArtifactSha256,
  computeNhm2SemiclassicalV2PairLaunchSealArtifactSizeBytes,
  computeNhm2SemiclassicalV2PairLaunchSealSha256,
  computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256,
  computeNhm2SemiclassicalV2PairReplayMetricLeafCanonicalValueSha256,
  computeNhm2SemiclassicalV2PairScientificPresealServerReceiptSha256,
  isNhm2SemiclassicalV2PairAgreementV1,
  nhm2SemiclassicalV2PairAgreementViolations,
  nhm2SemiclassicalV2PairComparisonPolicyViolations,
  type Nhm2SemiclassicalV2PairAgreementReceiptV1,
  type Nhm2SemiclassicalV2PairAgreementUnsignedReceiptV1,
  type Nhm2SemiclassicalV2PairLaneBindingV1,
  type Nhm2SemiclassicalV2PairLaunchSealUnsignedV1,
  type Nhm2SemiclassicalV2PairRole,
} from "../shared/contracts/nhm2-semiclassical-v2-pair-agreement.v1";
import {
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";

const digest = (seed: string): string =>
  createHash("sha256").update(seed, "utf8").digest("hex");

const clone = <T>(value: T): T => structuredClone(value);

const lane = (
  role: Nhm2SemiclassicalV2PairRole,
): Nhm2SemiclassicalV2PairLaneBindingV1 => {
  const manifestSha256 = digest(`${role}:raw-manifest`);
  return {
    role,
    enrollmentCapability: {
      role,
      opaqueEnrollmentId: `enrollment.${role}`,
      capabilityBindingSha256: digest(`${role}:capability`),
      capabilityDisclosure: "opaque_server_binding_only",
      authority: "server",
      serverAuthorized: true,
    },
    rootLease: {
      role,
      leaseId: `lease.${role}`,
      authority: "server",
      authorizedAt: "2026-08-10T00:01:00.000Z",
      scientificRootDirectory: "pair/scientific",
      scientificRootAccess: "read_only_exact_sealed_inventory",
      implementationRootDirectory: `pair/${role}/implementation`,
      implementationRootAccess: "read_only_lane_private",
      outputRootDirectory: `pair/${role}/output`,
      outputRootAccess: "read_write_lane_private",
      leaseBindingSha256: digest(`${role}:root-lease`),
      serverAuthorized: true,
    },
    emptyOutputPrestate: {
      role,
      receiptId: `empty-prestate.${role}`,
      authority: "server_filesystem_observer",
      observedAt: "2026-08-10T00:02:00.000Z",
      outputRootDirectory: `pair/${role}/output`,
      directoryExisted: true,
      entryCount: 0,
      aggregateSizeBytes: 0,
      directoryEmpty: true,
      manifestAbsent: true,
      producerDeclarationAcceptedAsEvidence: false,
      receiptSha256: digest(`${role}:empty-prestate`),
    },
    isolationAttestation: {
      role,
      attestationId: `os-isolation.${role}`,
      authority: "server_os_isolation_observer",
      observedAt: "2026-08-10T00:02:30.000Z",
      executionDomainId: `execution-domain.${role}`,
      processNamespaceIsolated: true,
      mountNamespaceIsolated: true,
      networkNamespaceIsolated: true,
      networkPolicy: "no_external_or_cross_lane_connectivity",
      scientificRootReadOnlyMountVerified: true,
      implementationRootLanePrivateMountVerified: true,
      outputRootLanePrivateMountVerified: true,
      counterpartOutputNotMountedVerified: true,
      ambientRepositoryNotMountedVerified: true,
      producerNotMountedDeclarationAcceptedAsEvidence: false,
      attestationSha256: digest(`${role}:os-isolation`),
    },
    implementationLineage: {
      role,
      implementationId: `implementation.${role}`,
      lineageId: `lineage.${role}`,
      implementationDomainId: `implementation-domain.${role}`,
      sourceSha256: digest(`${role}:source`),
      dependencyLockSha256: digest(`${role}:dependencies`),
      executableSha256: digest(`${role}:executable`),
      buildRecipeSha256: digest(`${role}:build-recipe`),
    },
    execution: {
      runId: `run.${role}`,
      rawReplayManifest: {
        artifactId: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
        contractVersion:
          NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
        sha256: manifestSha256,
        sizeBytes: 4096,
      },
      manifestFrozenAt: "2026-08-10T00:02:45.000Z",
      startedAt:
        role === "primary"
          ? "2026-08-10T00:04:00.000Z"
          : "2026-08-10T00:05:00.000Z",
      completedAt:
        role === "primary"
          ? "2026-08-10T00:10:00.000Z"
          : "2026-08-10T00:11:00.000Z",
      exitCode: 0,
      outputRootDirectory: `pair/${role}/output`,
      serverObserved: true,
    },
    replayer: {
      contractVersion: NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION,
      resultSha256: digest("shared:canonical-content-replay-result"),
      manifestSha256,
      readbackClosureSha256: digest(`${role}:readback-closure`),
      calculationDisposition: "pass",
      candidateDisposition: "single_run_replay_only",
      serverOwned: true,
      replayMetricCoverageSha256:
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
      replayMetricLeafCount:
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
      issuesCount: 0,
      blockersCount: 0,
    },
    arrays: NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES.map(
      (arrayRole, ordinal) => ({
        ordinal,
        arrayRole,
        sha256: digest(`shared-array:${arrayRole}`),
        sizeBytes: (ordinal + 1) * 8,
      }),
    ),
  };
};

const resign = (receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1): void => {
  const { receiptIntegrity: _integrity, ...unsigned } = receipt;
  receipt.receiptIntegrity.receiptSha256 =
    computeNhm2SemiclassicalV2PairAgreementReceiptSha256(unsigned);
};

const resignScientificPresealReceipt = (
  receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1,
): void => {
  const { receiptSha256: _hash, ...unsigned } =
    receipt.scientificPresealReceipt;
  receipt.scientificPresealReceipt.receiptSha256 =
    computeNhm2SemiclassicalV2PairScientificPresealServerReceiptSha256(
      unsigned,
    );
};

const rebindAndResignLaunchEvidence = (
  receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1,
): void => {
  const { launchSealSha256: _sealHash, ...unsignedLaunchSeal } =
    receipt.pairLaunchSeal;
  receipt.pairLaunchSeal.launchSealSha256 =
    computeNhm2SemiclassicalV2PairLaunchSealSha256(unsignedLaunchSeal);
  const persistedSize =
    computeNhm2SemiclassicalV2PairLaunchSealArtifactSizeBytes(
      receipt.pairLaunchSeal,
    );
  receipt.pairLaunchSealReceipt.launchSealId =
    receipt.pairLaunchSeal.launchSealId;
  receipt.pairLaunchSealReceipt.pairId = receipt.pairLaunchSeal.pairId;
  receipt.pairLaunchSealReceipt.persistedAt =
    receipt.pairLaunchSeal.persistedAt;
  receipt.pairLaunchSealReceipt.artifact.sha256 =
    computeNhm2SemiclassicalV2PairLaunchSealArtifactSha256(
      receipt.pairLaunchSeal,
    );
  receipt.pairLaunchSealReceipt.artifact.sizeBytes = String(persistedSize);
  receipt.pairLaunchSealReceipt.artifact.filesystemIdentity.sizeBytes =
    String(persistedSize);
  const { receiptSha256: _receiptHash, ...unsignedLaunchReceipt } =
    receipt.pairLaunchSealReceipt;
  receipt.pairLaunchSealReceipt.receiptSha256 =
    computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256(
      unsignedLaunchReceipt,
    );
  resign(receipt);
};

const buildReceipt = (): Nhm2SemiclassicalV2PairAgreementReceiptV1 => {
  const primary = lane("primary");
  const independent = lane("independent");
  const persistedPresealSha256 = digest("persisted-scientific-preseal");
  const scientificSealKey = digest("preseal-key.1");
  const scientificPresealReceiptUnsigned = {
    artifactId:
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_CONTRACT_VERSION,
    authority: "server_observed_persistence_readback" as const,
    persistenceState: "created_exclusively" as const,
    sealKey: scientificSealKey,
    sealedAt: "2026-08-10T00:00:30.000Z",
    persistenceObservedAt: "2026-08-10T00:00:45.000Z",
    artifact: {
      absolutePath: path.resolve(
        "artifacts/pair/preseal/scientific-preseal.v1.json",
      ),
      sha256: persistedPresealSha256,
      sizeBytes: "4096",
      filesystemIdentity: {
        dev: "1",
        ino: "2",
        sizeBytes: "4096",
        mtimeNs: "1000000000",
        ctimeNs: "1000000000",
      },
    },
    locks: { ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_LOCKS },
    receiptHashAlgorithm: "sha256" as const,
    receiptCanonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
  };
  const scientificPresealReceipt = {
    ...scientificPresealReceiptUnsigned,
    receiptSha256:
      computeNhm2SemiclassicalV2PairScientificPresealServerReceiptSha256(
        scientificPresealReceiptUnsigned,
      ),
  };
  const scientificPresealArtifactBinding = {
    artifactId: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
    contractVersion: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
    verificationState:
      "server_reopened_rehashed_and_validated_persisted_preseal" as const,
    artifactSha256: persistedPresealSha256,
    artifactSizeBytes: "4096",
    sealKey: scientificSealKey,
    candidateId: "candidate.1",
    candidateManifestId: "candidate-manifest.1",
    candidateFrozenAt: "2026-08-10T00:00:00.000Z",
    sealedScientificRootDirectory: "pair/scientific",
    candidateManifestSha256: digest("candidate-manifest"),
    scientificContentSha256: digest("scientific-content"),
    sealedInventorySha256: digest("sealed-inventory"),
    sealedAt: "2026-08-10T00:00:30.000Z",
  };
  const launchUnsigned: Nhm2SemiclassicalV2PairLaunchSealUnsignedV1 = {
    artifactId: NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_ARTIFACT_ID,
    contractVersion: NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION,
    launchSealId: "pair-launch-seal.1",
    pairId: "pair.1",
    persistedAt: "2026-08-10T00:03:00.000Z",
    comparisonPolicySha256: NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256,
    scientificPresealReceiptSha256: scientificPresealReceipt.receiptSha256,
    primaryCapabilityBindingSha256:
      primary.enrollmentCapability.capabilityBindingSha256,
    independentCapabilityBindingSha256:
      independent.enrollmentCapability.capabilityBindingSha256,
    primaryRootLeaseBindingSha256: primary.rootLease.leaseBindingSha256,
    independentRootLeaseBindingSha256: independent.rootLease.leaseBindingSha256,
    primaryEmptyOutputPrestateReceiptSha256:
      primary.emptyOutputPrestate.receiptSha256,
    independentEmptyOutputPrestateReceiptSha256:
      independent.emptyOutputPrestate.receiptSha256,
    primaryIsolationAttestationSha256:
      primary.isolationAttestation.attestationSha256,
    independentIsolationAttestationSha256:
      independent.isolationAttestation.attestationSha256,
    persistedBeforeBothStarts: true,
  };
  const pairLaunchSeal = {
    ...launchUnsigned,
    launchSealSha256:
      computeNhm2SemiclassicalV2PairLaunchSealSha256(launchUnsigned),
  };
  const launchArtifactSizeBytes =
    computeNhm2SemiclassicalV2PairLaunchSealArtifactSizeBytes(pairLaunchSeal);
  const pairLaunchSealReceiptUnsigned = {
    artifactId:
      NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION,
    authority: "server_observed_persistence_readback" as const,
    persistenceState: "created_exclusively" as const,
    launchSealId: pairLaunchSeal.launchSealId,
    pairId: pairLaunchSeal.pairId,
    persistedAt: pairLaunchSeal.persistedAt,
    persistenceObservedAt: "2026-08-10T00:03:30.000Z",
    artifact: {
      absolutePath: path.resolve(
        "artifacts/pair/launch/pair-launch-seal.v1.json",
      ),
      sha256:
        computeNhm2SemiclassicalV2PairLaunchSealArtifactSha256(pairLaunchSeal),
      sizeBytes: String(launchArtifactSizeBytes),
      filesystemIdentity: {
        dev: "1",
        ino: "3",
        sizeBytes: String(launchArtifactSizeBytes),
        mtimeNs: "2000000000",
        ctimeNs: "2000000000",
      },
    },
    locks: {
      ...NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_LOCKS,
    },
    receiptHashAlgorithm: "sha256" as const,
    receiptCanonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
  };
  const pairLaunchSealReceipt = {
    ...pairLaunchSealReceiptUnsigned,
    receiptSha256: computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256(
      pairLaunchSealReceiptUnsigned,
    ),
  };
  const unsigned: Nhm2SemiclassicalV2PairAgreementUnsignedReceiptV1 = {
    artifactId: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_ARTIFACT_ID,
    contractVersion: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_CONTRACT_VERSION,
    authority: "server_owned",
    generatedAt: "2026-08-10T00:12:00.000Z",
    pairAgreementId: "pair-agreement.1",
    pairId: "pair.1",
    candidate: {
      candidateId: "candidate.1",
      candidateManifestId: "candidate-manifest.1",
      candidateFrozenAt: "2026-08-10T00:00:00.000Z",
    },
    comparisonPolicy: {
      artifactId: NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_CONTRACT_VERSION,
      policyId: NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ID,
      sha256: NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256,
    },
    scientificPresealReceipt,
    scientificPresealArtifactBinding,
    pairLaunchSeal,
    pairLaunchSealReceipt,
    lanes: [primary, independent],
    arrayComparisons: NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES.map(
      (arrayRole, ordinal) => ({
        ordinal,
        arrayRole,
        comparator: "strict_byte_equality",
        primary: {
          sha256: primary.arrays[ordinal].sha256,
          sizeBytes: primary.arrays[ordinal].sizeBytes,
        },
        independent: {
          sha256: independent.arrays[ordinal].sha256,
          sizeBytes: independent.arrays[ordinal].sizeBytes,
        },
        bytesEqual: true,
        status: "pass",
      }),
    ),
    replayMetricCoverage: {
      ordering: "frozen_content_replay_leaf_order_v2",
      leafDescriptors:
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE.map((entry) => ({
          ...entry,
        })),
      leafCount: NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
      coverageSha256:
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
    },
    replayMetricComparisons:
      NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE.map(
        (entry, ordinal) => {
          const valueSha = digest(`replay-leaf:${entry.leafId}`);
          return {
            ordinal,
            leafId: entry.leafId,
            valueKind: entry.valueKind,
            comparator: "canonical_json_value_equality",
            primaryCanonicalValueSha256: valueSha,
            independentCanonicalValueSha256: valueSha,
            valuesEqual: true,
            status: "pass",
          };
        },
      ),
    diagnosticInputAuthorization: {
      authorizationKind: "candidate_scoped_diagnostic_input_only",
      candidateId: "candidate.1",
      authorizedInputIds: NHM2_SEMICLASSICAL_V2_PAIR_DIAGNOSTIC_INPUT_IDS,
      authorizedInputCount: 2,
      lampStateAuthority: false,
      lampPromotionAuthority: false,
    },
    status: "pass",
    claimLocks: { ...NHM2_SEMICLASSICAL_V2_PAIR_CLAIM_LOCKS },
  };
  return {
    ...unsigned,
    receiptIntegrity: {
      algorithm: "sha256",
      canonicalization:
        "recursive_lexicographic_object_keys_preserve_array_order_v1",
      hashDomain: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_RECEIPT_SHA256_DOMAIN,
      receiptSha256:
        computeNhm2SemiclassicalV2PairAgreementReceiptSha256(unsigned),
    },
  };
};

describe("NHM2 semiclassical-v2 pair agreement contract", () => {
  it("rejects superseded v1 pair-agreement and comparison-policy identities", () => {
    const oldAgreement = buildReceipt();
    (oldAgreement as unknown as { contractVersion: string }).contractVersion =
      "nhm2_semiclassical_v2_pair_agreement/v1";
    resign(oldAgreement);
    expect(nhm2SemiclassicalV2PairAgreementViolations(oldAgreement)).toContain(
      "pair_agreement_identity_invalid",
    );

    const oldPolicy = buildReceipt();
    (
      oldPolicy.comparisonPolicy as unknown as { contractVersion: string }
    ).contractVersion = "nhm2_semiclassical_v2_pair_comparison_policy/v1";
    resign(oldPolicy);
    expect(nhm2SemiclassicalV2PairAgreementViolations(oldPolicy)).toContain(
      "comparison_policy_binding_invalid_or_retuned",
    );
  });
  it("freezes strict-byte 32-array policy and all 108 replay metric leaves", () => {
    expect(NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES).toHaveLength(
      NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT,
    );
    expect(NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT).toBe(32);
    expect(NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE).toHaveLength(
      108,
    );
    expect(NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT).toBe(108);
    expect(NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE).toEqual(
      expect.arrayContaining([
        {
          leafId:
            "metrics.metricDemand.minimumPointwiseSymmetricTensorFrobeniusLowerBoundSI",
          valueKind: "number",
        },
        {
          leafId: "metrics.metricDemand.argminLowerBoundPointIndex",
          valueKind: "integer",
        },
        {
          leafId:
            "metrics.metricDemand.maximumPointwiseDeterministicErrorFrobeniusSI",
          valueKind: "number",
        },
        {
          leafId: "metrics.metricDemand.argmaxDeterministicErrorPointIndex",
          valueKind: "integer",
        },
        {
          leafId:
            "metrics.meanMetricDemandClosure.metricDemandDeterministicErrorFrobeniusAtWorstPointSI",
          valueKind: "number",
        },
        {
          leafId:
            "metrics.meanMetricDemandClosure.metricDemandFrobeniusLowerBoundAtWorstPointSI",
          valueKind: "number",
        },
      ]),
    );
    expect(NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY.defaultComparator).toBe(
      "strict_byte_equality",
    );
    expect(NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY.roleRules).toEqual([]);
    expect(
      nhm2SemiclassicalV2PairComparisonPolicyViolations(
        NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY,
      ),
    ).toEqual([]);
  });

  it("accepts an exact server-owned, prelaunch-sealed passing pair receipt", () => {
    const receipt = buildReceipt();
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toEqual([]);
    expect(isNhm2SemiclassicalV2PairAgreementV1(receipt)).toBe(true);
  });

  it("preserves exact replay leaf values, including the sign bit of zero", () => {
    expect(
      computeNhm2SemiclassicalV2PairReplayMetricLeafCanonicalValueSha256(0),
    ).not.toBe(
      computeNhm2SemiclassicalV2PairReplayMetricLeafCanonicalValueSha256(-0),
    );
    expect(() =>
      computeNhm2SemiclassicalV2PairReplayMetricLeafCanonicalValueSha256(
        Number.NaN,
      ),
    ).toThrow("replay_metric_leaf_value_must_be_finite");
  });

  it("fails closed when an array role or replay metric leaf is missing", () => {
    const arrayMissing = buildReceipt();
    arrayMissing.lanes[1].arrays.splice(12, 1);
    arrayMissing.arrayComparisons.splice(12, 1);
    resign(arrayMissing);
    expect(nhm2SemiclassicalV2PairAgreementViolations(arrayMissing)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("array_role_coverage_count_invalid"),
        "array_comparison_coverage_count_invalid",
      ]),
    );

    const metricMissing = buildReceipt();
    metricMissing.replayMetricComparisons.splice(40, 1);
    resign(metricMissing);
    expect(nhm2SemiclassicalV2PairAgreementViolations(metricMissing)).toContain(
      "replay_metric_leaf_comparison_count_invalid",
    );
  });

  it("rejects any retuned or role-overridden comparison policy", () => {
    const retuned = {
      ...NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY,
      roleRules: [
        {
          arrayRole: "mean_rset",
          comparator: "absolute_or_relative",
          absoluteTolerance: 1e-3,
          relativeTolerance: 1e-3,
          preregisteredAt: "2026-08-09T00:00:00.000Z",
          registrationSha256: digest("retuned"),
        },
      ],
    };
    expect(nhm2SemiclassicalV2PairComparisonPolicyViolations(retuned)).toEqual([
      "comparison_policy_not_exact_frozen_server_policy",
    ]);

    const receipt = buildReceipt();
    receipt.comparisonPolicy.sha256 = digest("retuned-policy");
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      "comparison_policy_binding_invalid_or_retuned",
    );
  });

  it.each([
    [
      "lineage",
      (receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1) => {
        receipt.lanes[1].implementationLineage.lineageId =
          receipt.lanes[0].implementationLineage.lineageId;
      },
      "implementation_lineages_not_genuinely_distinct",
    ],
    [
      "execution domain",
      (receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1) => {
        receipt.lanes[1].isolationAttestation.executionDomainId =
          receipt.lanes[0].isolationAttestation.executionDomainId;
      },
      "pair_execution_domains_not_distinct",
    ],
    [
      "private root",
      (receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1) => {
        receipt.lanes[1].rootLease.implementationRootDirectory =
          receipt.lanes[0].rootLease.implementationRootDirectory;
      },
      "pair_private_roots_not_distinct_and_disjoint",
    ],
  ])("rejects the same %s across the two lanes", (_name, mutate, violation) => {
    const receipt = buildReceipt();
    mutate(receipt);
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      violation,
    );
  });

  it("rejects missing isolation or empty-output prestate evidence", () => {
    const noIsolation = buildReceipt() as any;
    delete noIsolation.lanes[0].isolationAttestation;
    resign(noIsolation);
    expect(nhm2SemiclassicalV2PairAgreementViolations(noIsolation)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("lane_shape_invalid:/lanes/0"),
      ]),
    );

    const noPrestate = buildReceipt() as any;
    delete noPrestate.lanes[1].emptyOutputPrestate;
    resign(noPrestate);
    expect(nhm2SemiclassicalV2PairAgreementViolations(noPrestate)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("lane_shape_invalid:/lanes/1"),
      ]),
    );
  });

  it("rejects a launch seal persisted at or after either lane start", () => {
    const receipt = buildReceipt();
    receipt.pairLaunchSeal.persistedAt = receipt.lanes[0].execution.startedAt;
    const { launchSealSha256: _hash, ...launchUnsigned } =
      receipt.pairLaunchSeal;
    receipt.pairLaunchSeal.launchSealSha256 =
      computeNhm2SemiclassicalV2PairLaunchSealSha256(launchUnsigned);
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      "pair_launch_seal_not_persisted_before_both_starts",
    );
  });

  it("rejects a coherently re-signed launch receipt backdated before preseal readback", () => {
    const receipt = buildReceipt();
    receipt.pairLaunchSeal.persistedAt = "2026-08-10T00:00:40.000Z";
    receipt.pairLaunchSealReceipt.persistenceObservedAt =
      "2026-08-10T00:00:41.000Z";
    rebindAndResignLaunchEvidence(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      "pair_launch_seal_not_persisted_before_both_starts",
    );
  });

  it.each([
    [
      "scientific preseal",
      (receipt: any) => {
        receipt.scientificPresealReceipt.artifact.sizeBytes = "0";
        receipt.scientificPresealReceipt.artifact.filesystemIdentity.sizeBytes =
          "0";
        resignScientificPresealReceipt(receipt);
      },
      "scientific_preseal_receipt_binding_invalid",
    ],
    [
      "launch seal",
      (receipt: any) => {
        receipt.pairLaunchSealReceipt.artifact.sizeBytes = "0";
        receipt.pairLaunchSealReceipt.artifact.filesystemIdentity.sizeBytes =
          "0";
        const { receiptSha256: _hash, ...unsigned } =
          receipt.pairLaunchSealReceipt;
        receipt.pairLaunchSealReceipt.receiptSha256 =
          computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256(unsigned);
      },
      "pair_launch_seal_server_receipt_binding_invalid",
    ],
  ])(
    "rejects a zero-size %s persistence receipt",
    (_name, mutate, violation) => {
      const receipt = buildReceipt() as any;
      mutate(receipt);
      resign(receipt);
      expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
        violation,
      );
    },
  );

  it.each([
    [
      "scientific preseal",
      (receipt: any) => {
        receipt.scientificPresealReceipt.artifact.absolutePath =
          "relative/preseal.json";
        resignScientificPresealReceipt(receipt);
      },
      "scientific_preseal_receipt_binding_invalid",
    ],
    [
      "launch seal",
      (receipt: any) => {
        const directory = path.dirname(
          receipt.pairLaunchSealReceipt.artifact.absolutePath,
        );
        receipt.pairLaunchSealReceipt.artifact.absolutePath = `${directory}${path.sep}nested${path.sep}..${path.sep}pair-launch-seal.v1.json`;
        const { receiptSha256: _hash, ...unsigned } =
          receipt.pairLaunchSealReceipt;
        receipt.pairLaunchSealReceipt.receiptSha256 =
          computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256(unsigned);
      },
      "pair_launch_seal_server_receipt_binding_invalid",
    ],
  ])(
    "rejects a non-normalized or relative %s receipt path",
    (_name, mutate, violation) => {
      const receipt = buildReceipt() as any;
      mutate(receipt);
      resign(receipt);
      expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
        violation,
      );
    },
  );

  it("rejects a non-SHA-256 scientific seal key even with a recomputed receipt hash", () => {
    const receipt = buildReceipt();
    receipt.scientificPresealReceipt.sealKey = "producer-chosen-key";
    receipt.scientificPresealArtifactBinding.sealKey = "producer-chosen-key";
    resignScientificPresealReceipt(receipt);
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toEqual(
      expect.arrayContaining([
        "scientific_preseal_receipt_binding_invalid",
        "scientific_preseal_persisted_artifact_binding_invalid",
      ]),
    );
  });

  it("does not accept a producer-only not_mounted declaration as OS evidence", () => {
    const receipt = buildReceipt() as any;
    receipt.lanes[1].isolationAttestation.authority = "producer";
    receipt.lanes[1].isolationAttestation.producerNotMountedDeclarationAcceptedAsEvidence = true;
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("server_os_isolation_attestation_invalid"),
      ]),
    );
  });

  it("does not promote a false presealer receipt lock to true", () => {
    const receipt = buildReceipt() as any;
    receipt.scientificPresealReceipt.locks.osReadOnlyIsolationEstablished = true;
    const { receiptSha256: _hash, ...unsignedPresealReceipt } =
      receipt.scientificPresealReceipt;
    receipt.scientificPresealReceipt.receiptSha256 =
      computeNhm2SemiclassicalV2PairScientificPresealServerReceiptSha256(
        unsignedPresealReceipt,
      );
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      "scientific_preseal_receipt_binding_invalid",
    );
  });

  it("does not promote a false launch-receipt lock to true", () => {
    const receipt = buildReceipt() as any;
    receipt.pairLaunchSealReceipt.locks.schemaValidationAuthenticatesServerOrigin = true;
    const { receiptSha256: _hash, ...unsignedLaunchReceipt } =
      receipt.pairLaunchSealReceipt;
    receipt.pairLaunchSealReceipt.receiptSha256 =
      computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256(
        unsignedLaunchReceipt,
      );
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      "pair_launch_seal_server_receipt_binding_invalid",
    );
  });

  it.each([
    [
      "scientific preseal",
      (receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1) => {
        receipt.scientificPresealReceipt.receiptSha256 = digest(
          "forged-preseal-receipt",
        );
      },
      "scientific_preseal_server_receipt_integrity_invalid",
    ],
    [
      "launch seal",
      (receipt: Nhm2SemiclassicalV2PairAgreementReceiptV1) => {
        receipt.pairLaunchSealReceipt.receiptSha256 = digest(
          "forged-launch-receipt",
        );
      },
      "pair_launch_seal_server_receipt_integrity_invalid",
    ],
  ])("rejects a forged %s receipt hash", (_name, mutate, violation) => {
    const receipt = buildReceipt();
    mutate(receipt);
    resign(receipt);
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      violation,
    );
  });

  it("rejects every physical, lamp, empirical, transport, and closure claim unlock", () => {
    for (const key of Object.keys(NHM2_SEMICLASSICAL_V2_PAIR_CLAIM_LOCKS)) {
      const receipt = buildReceipt() as any;
      receipt.claimLocks[key] = true;
      resign(receipt);
      expect(
        nhm2SemiclassicalV2PairAgreementViolations(receipt),
        key,
      ).toContain("claim_locks_invalid");
    }
  });

  it("detects any post-signature receipt mutation", () => {
    const receipt = clone(buildReceipt());
    receipt.generatedAt = "2026-08-10T00:13:00.000Z";
    expect(nhm2SemiclassicalV2PairAgreementViolations(receipt)).toContain(
      "receipt_integrity_sha256_mismatch",
    );
  });
});
