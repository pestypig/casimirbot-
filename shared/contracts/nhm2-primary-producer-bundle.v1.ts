import { createHash } from "node:crypto";

export const NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID =
  "nhm2.primary_theory_candidate_producer_bundle";
export const NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION =
  "javascript_esm_bundle/v1";
export const NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID =
  "nhm2.primary_theory_candidate_producer_bundle_build";
export const NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION =
  "nhm2_primary_theory_candidate_producer_bundle_build/v1";

export const NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS = {
  bundle: true,
  write: false,
  metafile: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "bundle",
  sourcemap: false,
  legalComments: "none",
  charset: "utf8",
  treeShaking: true,
  minify: false,
} as const;

export type Nhm2PrimaryProducerBundleRefV1 = {
  artifactId: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID;
  path: string;
  schemaVersion: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2PrimaryProducerBundleBuildInputV1 = {
  path: string;
  sha256: string;
  sizeBytes: number;
  bytesInOutput: number;
};

export type Nhm2PrimaryProducerBundleBuildMetadataV1 = {
  artifactId: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION;
  generatedAt: string;
  entryPoint: {
    path: string;
    sha256: string;
  };
  bundleRef: Nhm2PrimaryProducerBundleRefV1;
  bundler: {
    name: "esbuild";
    version: string;
    options: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS;
  };
  inputClosure: {
    inputCount: number;
    sourceSnapshotSha256: string;
    inputs: Nhm2PrimaryProducerBundleBuildInputV1[];
  };
  metafile: {
    sha256: string;
    outputKey: string;
    outputBytes: number;
    externalImports: Array<{
      path: string;
      kind: string;
      external: true;
    }>;
    value: Record<string, unknown>;
  };
  dependencyClosure: {
    bundledSourceClosureComplete: true;
    runtimeNodeModulesRequired: false;
    externalNpmPackages: [];
    externalNodeBuiltins: string[];
  };
  claimBoundary: {
    deterministicBuildReceiptOnly: true;
    operatingSystemHermeticityAsserted: false;
    nodeRuntimeHermeticityAsserted: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

const SHA256 = /^[a-f0-9]{64}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim() === value && value.length > 0;

const isPortablePath = (value: unknown): value is string => {
  if (!isText(value)) return false;
  if (
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[a-z]:/i.test(value) ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    /[?#*{}\[\]]/.test(value)
  ) {
    return false;
  }
  const segments = value.split("/");
  return segments.every(
    (segment) => segment !== "" && segment !== "." && segment !== "..",
  );
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
};

export const canonicalNhm2PrimaryProducerBundleBuildValue = (
  value: unknown,
): string => JSON.stringify(canonicalize(value));

export const sha256Nhm2PrimaryProducerBundleBuildValue = (
  value: unknown,
): string =>
  createHash("sha256")
    .update(canonicalNhm2PrimaryProducerBundleBuildValue(value), "utf8")
    .digest("hex");

export const computeNhm2PrimaryProducerBundleSourceSnapshotSha256 = (
  inputs: readonly Nhm2PrimaryProducerBundleBuildInputV1[],
): string =>
  sha256Nhm2PrimaryProducerBundleBuildValue(
    [...inputs]
      .sort((left, right) => left.path.localeCompare(right.path))
      .map((input) => ({
        path: input.path,
        sha256: input.sha256,
        sizeBytes: input.sizeBytes,
        bytesInOutput: input.bytesInOutput,
      })),
  );

const sameBuildOptions = (value: unknown): boolean =>
  isRecord(value) &&
  hasOnlyKeys(value, Object.keys(NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS)) &&
  Object.entries(NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS).every(
    ([key, expected]) => value[key] === expected,
  );

const isBundleRef = (value: unknown): value is Nhm2PrimaryProducerBundleRefV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "artifactId",
    "path",
    "schemaVersion",
    "sha256",
    "sizeBytes",
  ]) &&
  value.artifactId === NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID &&
  isPortablePath(value.path) &&
  value.schemaVersion === NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 0;

const isBuildInput = (
  value: unknown,
): value is Nhm2PrimaryProducerBundleBuildInputV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, ["path", "sha256", "sizeBytes", "bytesInOutput"]) &&
  isPortablePath(value.path) &&
  !value.path.split("/").includes("node_modules") &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 0 &&
  Number.isSafeInteger(value.bytesInOutput) &&
  (value.bytesInOutput as number) >= 0;

export const isNhm2PrimaryProducerBundleBuildMetadata = (
  value: unknown,
): value is Nhm2PrimaryProducerBundleBuildMetadataV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "entryPoint",
      "bundleRef",
      "bundler",
      "inputClosure",
      "metafile",
      "dependencyClosure",
      "claimBoundary",
    ]) ||
    value.artifactId !== NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION ||
    !isText(value.generatedAt) ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    !isBundleRef(value.bundleRef)
  ) {
    return false;
  }
  const entryPoint = isRecord(value.entryPoint) ? value.entryPoint : null;
  const bundler = isRecord(value.bundler) ? value.bundler : null;
  const inputClosure = isRecord(value.inputClosure) ? value.inputClosure : null;
  const metafile = isRecord(value.metafile) ? value.metafile : null;
  const dependencyClosure = isRecord(value.dependencyClosure)
    ? value.dependencyClosure
    : null;
  const claimBoundary = isRecord(value.claimBoundary)
    ? value.claimBoundary
    : null;
  if (
    entryPoint == null ||
    !hasOnlyKeys(entryPoint, ["path", "sha256"]) ||
    !isPortablePath(entryPoint.path) ||
    typeof entryPoint.sha256 !== "string" ||
    !SHA256.test(entryPoint.sha256) ||
    bundler == null ||
    !hasOnlyKeys(bundler, ["name", "version", "options"]) ||
    bundler.name !== "esbuild" ||
    !isText(bundler.version) ||
    !sameBuildOptions(bundler.options) ||
    inputClosure == null ||
    !hasOnlyKeys(inputClosure, [
      "inputCount",
      "sourceSnapshotSha256",
      "inputs",
    ]) ||
    !Number.isSafeInteger(inputClosure.inputCount) ||
    !Array.isArray(inputClosure.inputs) ||
    !inputClosure.inputs.every(isBuildInput) ||
    inputClosure.inputCount !== inputClosure.inputs.length ||
    inputClosure.inputs.length === 0 ||
    new Set(
      (inputClosure.inputs as Nhm2PrimaryProducerBundleBuildInputV1[]).map(
        (input) => input.path,
      ),
    ).size !== inputClosure.inputs.length ||
    typeof inputClosure.sourceSnapshotSha256 !== "string" ||
    inputClosure.sourceSnapshotSha256 !==
      computeNhm2PrimaryProducerBundleSourceSnapshotSha256(
        inputClosure.inputs as Nhm2PrimaryProducerBundleBuildInputV1[],
      ) ||
    !(inputClosure.inputs as Nhm2PrimaryProducerBundleBuildInputV1[]).some(
      (input) =>
        input.path === entryPoint.path && input.sha256 === entryPoint.sha256,
    )
  ) {
    return false;
  }
  if (
    metafile == null ||
    !hasOnlyKeys(metafile, [
      "sha256",
      "outputKey",
      "outputBytes",
      "externalImports",
      "value",
    ]) ||
    typeof metafile.sha256 !== "string" ||
    !SHA256.test(metafile.sha256) ||
    !isPortablePath(metafile.outputKey) ||
    !Number.isSafeInteger(metafile.outputBytes) ||
    metafile.outputBytes !== value.bundleRef.sizeBytes ||
    !Array.isArray(metafile.externalImports) ||
    !metafile.externalImports.every(
      (entry) =>
        isRecord(entry) &&
        hasOnlyKeys(entry, ["path", "kind", "external"]) &&
        typeof entry.path === "string" &&
        entry.path.startsWith("node:") &&
        isText(entry.kind) &&
        entry.external === true,
    ) ||
    !isRecord(metafile.value) ||
    metafile.sha256 !==
      sha256Nhm2PrimaryProducerBundleBuildValue(metafile.value)
  ) {
    return false;
  }
  const externalNodeBuiltins = metafile.externalImports.map(
    (entry) => (entry as { path: string }).path,
  );
  if (
    dependencyClosure == null ||
    !hasOnlyKeys(dependencyClosure, [
      "bundledSourceClosureComplete",
      "runtimeNodeModulesRequired",
      "externalNpmPackages",
      "externalNodeBuiltins",
    ]) ||
    dependencyClosure.bundledSourceClosureComplete !== true ||
    dependencyClosure.runtimeNodeModulesRequired !== false ||
    !Array.isArray(dependencyClosure.externalNpmPackages) ||
    dependencyClosure.externalNpmPackages.length !== 0 ||
    !Array.isArray(dependencyClosure.externalNodeBuiltins) ||
    dependencyClosure.externalNodeBuiltins.length !==
      externalNodeBuiltins.length ||
    !dependencyClosure.externalNodeBuiltins.every(
      (entry, index) => entry === externalNodeBuiltins[index],
    ) ||
    claimBoundary == null ||
    !hasOnlyKeys(claimBoundary, [
      "deterministicBuildReceiptOnly",
      "operatingSystemHermeticityAsserted",
      "nodeRuntimeHermeticityAsserted",
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
    ]) ||
    claimBoundary.deterministicBuildReceiptOnly !== true ||
    claimBoundary.operatingSystemHermeticityAsserted !== false ||
    claimBoundary.nodeRuntimeHermeticityAsserted !== false ||
    claimBoundary.physicalViabilityClaimAllowed !== false ||
    claimBoundary.transportClaimAllowed !== false ||
    claimBoundary.propulsionClaimAllowed !== false ||
    claimBoundary.routeEtaClaimAllowed !== false ||
    claimBoundary.speedAuthorityClaimAllowed !== false
  ) {
    return false;
  }
  return true;
};
