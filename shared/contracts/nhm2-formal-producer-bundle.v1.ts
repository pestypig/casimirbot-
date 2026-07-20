import {
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS,
  NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
  canonicalNhm2PrimaryProducerBundleBuildValue,
  computeNhm2PrimaryProducerBundleSourceSnapshotSha256,
  isNhm2PrimaryProducerBundleBuildMetadata,
  sha256Nhm2PrimaryProducerBundleBuildValue,
  type Nhm2PrimaryProducerBundleBuildInputV1,
  type Nhm2PrimaryProducerBundleBuildMetadataV1,
  type Nhm2PrimaryProducerBundleRefV1,
} from "./nhm2-primary-producer-bundle.v1";

export const NHM2_FORMAL_PRODUCER_BUNDLE_ARTIFACT_ID =
  "nhm2.formal_theory_candidate_outer_producer_bundle" as const;
export const NHM2_FORMAL_PRODUCER_BUNDLE_SCHEMA_VERSION =
  NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION;
export const NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID =
  "nhm2.formal_theory_candidate_outer_producer_bundle_build" as const;
export const NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION =
  "nhm2_formal_theory_candidate_outer_producer_bundle_build/v1" as const;

/**
 * Both governed Node launchers intentionally use one byte-for-byte build
 * policy. Their artifact identities remain distinct so a primary numerical
 * bundle can never be admitted as the formal outer producer (or vice versa).
 */
export const NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS =
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS;

export type Nhm2FormalProducerBundleRefV1 = Omit<
  Nhm2PrimaryProducerBundleRefV1,
  "artifactId"
> & {
  artifactId: typeof NHM2_FORMAL_PRODUCER_BUNDLE_ARTIFACT_ID;
};

export type Nhm2FormalProducerBundleBuildInputV1 =
  Nhm2PrimaryProducerBundleBuildInputV1;

export type Nhm2FormalProducerBundleBuildMetadataV1 = Omit<
  Nhm2PrimaryProducerBundleBuildMetadataV1,
  "artifactId" | "contractVersion" | "bundleRef"
> & {
  artifactId: typeof NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID;
  contractVersion: typeof NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION;
  bundleRef: Nhm2FormalProducerBundleRefV1;
};

export const canonicalNhm2FormalProducerBundleBuildValue =
  canonicalNhm2PrimaryProducerBundleBuildValue;
export const sha256Nhm2FormalProducerBundleBuildValue =
  sha256Nhm2PrimaryProducerBundleBuildValue;
export const computeNhm2FormalProducerBundleSourceSnapshotSha256 =
  computeNhm2PrimaryProducerBundleSourceSnapshotSha256;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

/**
 * Reuses the exact primary standalone-bundle structural gate after replacing
 * only the three lane-specific identity constants. This makes the dependency,
 * metafile, source-closure, and claim-boundary rules impossible to drift
 * between the two governed producer lanes.
 */
export const isNhm2FormalProducerBundleBuildMetadata = (
  value: unknown,
): value is Nhm2FormalProducerBundleBuildMetadataV1 => {
  if (
    !isRecord(value) ||
    value.artifactId !== NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION ||
    !isRecord(value.bundleRef) ||
    value.bundleRef.artifactId !== NHM2_FORMAL_PRODUCER_BUNDLE_ARTIFACT_ID ||
    value.bundleRef.schemaVersion !== NHM2_FORMAL_PRODUCER_BUNDLE_SCHEMA_VERSION
  ) {
    return false;
  }

  return isNhm2PrimaryProducerBundleBuildMetadata({
    ...value,
    artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
    contractVersion: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
    bundleRef: {
      ...value.bundleRef,
      artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
    },
  });
};
