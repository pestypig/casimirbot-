import { createHash } from "node:crypto";

import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION,
  NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES,
} from "./nhm2-primary-raw-content-policy.v1";
import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
  NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING,
  NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
  NHM2_PRIMARY_RAW_OUTPUT_PARENT_FAMILIES,
  type Nhm2PrimaryRawOutputFamilyId,
} from "./nhm2-primary-raw-output-manifest.v1";
import {
  NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
} from "./nhm2-primary-producer-bundle.v1";

export const NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_ARTIFACT_ID =
  "nhm2.primary_raw_solver_suite_enrollment" as const;
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION =
  "nhm2_primary_raw_solver_suite_enrollment/v1" as const;
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_SEMANTIC_DOMAIN =
  "nhm2-primary-raw-solver-suite-enrollment/v1\n" as const;
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_COVERAGE_SEMANTIC_DOMAIN =
  "nhm2-primary-raw-solver-suite-canonical-coverage/v1\n" as const;
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_FAMILY_COUNT = 9 as const;
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_ROLE_COUNT = 107 as const;
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_MANIFEST_PROTOCOL =
  "manifest_last_closed_inventory/v1" as const;

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const rawRolePolicies = NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES as Record<
  string,
  Record<string, unknown>
>;

/**
 * Derived from the frozen raw-content policy. No semantic role is restated in
 * this enrollment contract.
 */
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_FAMILY_COVERAGE =
  Object.freeze(
    NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.map((familyId) =>
      Object.freeze({
        familyId,
        parentFamilyIds: Object.freeze([
          ...NHM2_PRIMARY_RAW_OUTPUT_PARENT_FAMILIES[familyId],
        ]),
        semanticRoles: Object.freeze(Object.keys(rawRolePolicies[familyId])),
      }),
    ),
  );

export const NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_ROLE_COUNT =
  NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_FAMILY_COVERAGE.reduce(
    (count, family) => count + family.semanticRoles.length,
    0,
  );

export const NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_COVERAGE_SHA256 =
  createHash("sha256")
    .update(NHM2_PRIMARY_RAW_SOLVER_SUITE_COVERAGE_SEMANTIC_DOMAIN, "utf8")
    .update(
      JSON.stringify(NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_FAMILY_COVERAGE),
      "utf8",
    )
    .digest("hex");

export type Nhm2PrimaryRawSolverSuiteArtifactRefV1 = {
  artifactId: string;
  contractVersion: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2PrimaryRawSolverSuiteKernelEnrollmentV1 = {
  enrollmentId: string;
  kernelKind: "external" | "formal";
  producerMode: "external_binary" | "formal_kernel";
  solver: {
    solverId: string;
    implementationId: string;
    version: string;
  };
  target: {
    platform: string;
    architecture: string;
  };
  sourceClosure: {
    closureId: string;
    semanticSha256: string;
    entryCount: number;
    aggregateBytes: number;
    ledger: Nhm2PrimaryRawSolverSuiteArtifactRefV1;
  };
  toolchain: {
    toolchainId: string;
    semanticSha256: string;
    ledger: Nhm2PrimaryRawSolverSuiteArtifactRefV1;
  };
  executable: Nhm2PrimaryRawSolverSuiteArtifactRefV1;
  environment: {
    environmentId: string;
    semanticSha256: string;
    lock: Nhm2PrimaryRawSolverSuiteArtifactRefV1;
  };
  claimBoundary: {
    administrativeEnrollmentOnly: true;
    pinnedIdentityOnly: true;
    executionAuthorized: false;
    outputAcceptedWithoutServerReplay: false;
    scientificAuthority: false;
  };
};

export type Nhm2PrimaryRawSolverSuiteFamilyCoverageV1 = {
  familyId: Nhm2PrimaryRawOutputFamilyId;
  parentFamilyIds: Nhm2PrimaryRawOutputFamilyId[];
  semanticRoles: string[];
  kernelEnrollmentIds: string[];
};

export type Nhm2PrimaryRawSolverSuiteEnrollmentV1 = {
  artifactId: typeof NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION;
  generatedAt: string;
  enrollmentId: string;
  semanticSha256: string;
  planRole: "primary_numerical";
  contentPolicy: {
    artifactId: typeof NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID;
    contractVersion: typeof NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION;
    sha256: string;
    familyDagOrdering: typeof NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING;
    familyCount: number;
    roleCount: number;
    coverageSha256: string;
  };
  familyCoverage: Nhm2PrimaryRawSolverSuiteFamilyCoverageV1[];
  kernelEnrollments: Nhm2PrimaryRawSolverSuiteKernelEnrollmentV1[];
  primaryProducerBundle: {
    bundleId: string;
    sourceSnapshotSha256: string;
    bundle: Nhm2PrimaryRawSolverSuiteArtifactRefV1;
    buildMetadata: Nhm2PrimaryRawSolverSuiteArtifactRefV1;
  };
  rawOutputProtocol: {
    protocol: typeof NHM2_PRIMARY_RAW_SOLVER_SUITE_MANIFEST_PROTOCOL;
    manifest: {
      artifactId: typeof NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID;
      contractVersion: typeof NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION;
      relativePath: string;
    };
    dataFilesDeclaredBeforeManifest: true;
    manifestWrittenLast: true;
    manifestExcludedFromDataFileInventory: true;
    unlistedFilesForbidden: true;
    extraDirectoriesForbidden: true;
    inventoryReopenedByServer: true;
  };
  publication: {
    authority: "server_only";
    governedRootId: string;
    governedRootPolicy: Nhm2PrimaryRawSolverSuiteArtifactRefV1;
    governedRootResolvedByServer: true;
    callerSuppliedRootAllowed: false;
    publicationOutsideGovernedRootAllowed: false;
    symlinkOrReparseTraversalAllowed: false;
    publishAfterServerReplayOnly: true;
  };
  executionBoundary: {
    administrativeEnrollmentOnly: true;
    runtimeWiringIncluded: false;
    executionAuthorized: false;
    syntheticFallbackAllowed: false;
    repositoryScriptFallbackAllowed: false;
    kernelOutputTrustedWithoutServerReplay: false;
  };
  claimLocks: {
    rawSuiteExecuted: false;
    rawManifestProduced: false;
    diagnosticAdmissibilityEstablished: false;
    theoryModelValidated: false;
    theoryClosureEstablished: false;
    formalProofEstablished: false;
    empiricalValidationEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
  };
};

export type Nhm2PrimaryRawSolverSuiteEnrollmentValidationV1 = {
  contractVersion: typeof NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION;
  schemaValid: boolean;
  semanticHashValid: boolean;
  canonicalPolicyBound: boolean;
  exactFamilyRoleCoverage: boolean;
  kernelsPinned: boolean;
  publicationLocked: boolean;
  claimsLocked: boolean;
  executionAuthority: false;
  scientificAuthority: false;
  violations: string[];
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "generatedAt",
  "enrollmentId",
  "semanticSha256",
  "planRole",
  "contentPolicy",
  "familyCoverage",
  "kernelEnrollments",
  "primaryProducerBundle",
  "rawOutputProtocol",
  "publication",
  "executionBoundary",
  "claimLocks",
] as const;
const CONTENT_POLICY_KEYS = [
  "artifactId",
  "contractVersion",
  "sha256",
  "familyDagOrdering",
  "familyCount",
  "roleCount",
  "coverageSha256",
] as const;
const FAMILY_COVERAGE_KEYS = [
  "familyId",
  "parentFamilyIds",
  "semanticRoles",
  "kernelEnrollmentIds",
] as const;
const KERNEL_KEYS = [
  "enrollmentId",
  "kernelKind",
  "producerMode",
  "solver",
  "target",
  "sourceClosure",
  "toolchain",
  "executable",
  "environment",
  "claimBoundary",
] as const;
const SOLVER_KEYS = ["solverId", "implementationId", "version"] as const;
const TARGET_KEYS = ["platform", "architecture"] as const;
const SOURCE_CLOSURE_KEYS = [
  "closureId",
  "semanticSha256",
  "entryCount",
  "aggregateBytes",
  "ledger",
] as const;
const TOOLCHAIN_KEYS = ["toolchainId", "semanticSha256", "ledger"] as const;
const ENVIRONMENT_KEYS = ["environmentId", "semanticSha256", "lock"] as const;
const ARTIFACT_KEYS = [
  "artifactId",
  "contractVersion",
  "relativePath",
  "sha256",
  "sizeBytes",
] as const;
const KERNEL_BOUNDARY_KEYS = [
  "administrativeEnrollmentOnly",
  "pinnedIdentityOnly",
  "executionAuthorized",
  "outputAcceptedWithoutServerReplay",
  "scientificAuthority",
] as const;
const PRODUCER_BUNDLE_KEYS = [
  "bundleId",
  "sourceSnapshotSha256",
  "bundle",
  "buildMetadata",
] as const;
const RAW_OUTPUT_PROTOCOL_KEYS = [
  "protocol",
  "manifest",
  "dataFilesDeclaredBeforeManifest",
  "manifestWrittenLast",
  "manifestExcludedFromDataFileInventory",
  "unlistedFilesForbidden",
  "extraDirectoriesForbidden",
  "inventoryReopenedByServer",
] as const;
const MANIFEST_KEYS = [
  "artifactId",
  "contractVersion",
  "relativePath",
] as const;
const PUBLICATION_KEYS = [
  "authority",
  "governedRootId",
  "governedRootPolicy",
  "governedRootResolvedByServer",
  "callerSuppliedRootAllowed",
  "publicationOutsideGovernedRootAllowed",
  "symlinkOrReparseTraversalAllowed",
  "publishAfterServerReplayOnly",
] as const;
const EXECUTION_BOUNDARY_KEYS = [
  "administrativeEnrollmentOnly",
  "runtimeWiringIncluded",
  "executionAuthorized",
  "syntheticFallbackAllowed",
  "repositoryScriptFallbackAllowed",
  "kernelOutputTrustedWithoutServerReplay",
] as const;
const CLAIM_LOCK_KEYS = [
  "rawSuiteExecuted",
  "rawManifestProduced",
  "diagnosticAdmissibilityEstablished",
  "theoryModelValidated",
  "theoryClosureEstablished",
  "formalProofEstablished",
  "empiricalValidationEstablished",
  "physicalViabilityEstablished",
  "transportEstablished",
  "propulsionEstablished",
  "routeEtaEstablished",
  "certifiedSpeedEstablished",
] as const;

const SHA256 = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/;
const CONTRACT_VERSION = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}\/v[1-9][0-9]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort(compareUtf8);
  const expected = [...expectedKeys].sort(compareUtf8);
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
};

const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" && IDENTIFIER.test(value);

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);

const isExactIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const isPortableRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  value
    .split("/")
    .every((part) => part.length > 0 && part !== "." && part !== "..") &&
  !/(^|\/)latest(?:\.|\/|$)/i.test(value);

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (!isRecord(value)) return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => compareUtf8(left, right))
      .map(([key, nested]) => [key, stable(nested)]),
  );
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const sameOrderedStrings = (
  actual: unknown,
  expected: readonly string[],
): boolean =>
  Array.isArray(actual) &&
  actual.length === expected.length &&
  actual.every((entry, index) => entry === expected[index]);

const isSortedUniqueIdentifiers = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isIdentifier) &&
  new Set(value).size === value.length &&
  value.every(
    (entry, index) => index === 0 || compareUtf8(value[index - 1], entry) < 0,
  );

const artifactViolations = (
  value: unknown,
  pointer: string,
  expected?: { artifactId: string; contractVersion: string },
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, ARTIFACT_KEYS)) {
    return [`artifact_shape_invalid:${pointer}`];
  }
  const violations: string[] = [];
  if (!isIdentifier(value.artifactId))
    violations.push(`artifact_id_invalid:${pointer}`);
  if (
    typeof value.contractVersion !== "string" ||
    !CONTRACT_VERSION.test(value.contractVersion)
  )
    violations.push(`artifact_contract_version_invalid:${pointer}`);
  if (!isPortableRelativePath(value.relativePath))
    violations.push(`artifact_path_invalid:${pointer}`);
  if (!isSha256(value.sha256))
    violations.push(`artifact_sha256_invalid:${pointer}`);
  if (!Number.isSafeInteger(value.sizeBytes) || Number(value.sizeBytes) <= 0)
    violations.push(`artifact_size_invalid:${pointer}`);
  if (
    expected != null &&
    (value.artifactId !== expected.artifactId ||
      value.contractVersion !== expected.contractVersion)
  ) {
    violations.push(`artifact_identity_invalid:${pointer}`);
  }
  return violations;
};

const kernelViolations = (value: unknown, pointer: string): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, KERNEL_KEYS)) {
    return [`kernel_shape_invalid:${pointer}`];
  }
  const violations: string[] = [];
  if (
    !isIdentifier(value.enrollmentId) ||
    (value.kernelKind !== "external" && value.kernelKind !== "formal") ||
    (value.producerMode !== "external_binary" &&
      value.producerMode !== "formal_kernel") ||
    (value.kernelKind === "external" &&
      value.producerMode !== "external_binary") ||
    (value.kernelKind === "formal" && value.producerMode !== "formal_kernel")
  ) {
    violations.push(`kernel_identity_invalid:${pointer}`);
  }

  const solver = isRecord(value.solver) ? value.solver : null;
  if (
    solver == null ||
    !hasExactKeys(solver, SOLVER_KEYS) ||
    !isIdentifier(solver.solverId) ||
    !isIdentifier(solver.implementationId) ||
    !isIdentifier(solver.version)
  ) {
    violations.push(`kernel_solver_invalid:${pointer}`);
  }

  const target = isRecord(value.target) ? value.target : null;
  if (
    target == null ||
    !hasExactKeys(target, TARGET_KEYS) ||
    !isIdentifier(target.platform) ||
    !isIdentifier(target.architecture)
  ) {
    violations.push(`kernel_target_invalid:${pointer}`);
  }

  const sourceClosure = isRecord(value.sourceClosure)
    ? value.sourceClosure
    : null;
  if (
    sourceClosure == null ||
    !hasExactKeys(sourceClosure, SOURCE_CLOSURE_KEYS) ||
    !isIdentifier(sourceClosure.closureId) ||
    !isSha256(sourceClosure.semanticSha256) ||
    !Number.isSafeInteger(sourceClosure.entryCount) ||
    Number(sourceClosure.entryCount) <= 0 ||
    !Number.isSafeInteger(sourceClosure.aggregateBytes) ||
    Number(sourceClosure.aggregateBytes) <= 0
  ) {
    violations.push(`kernel_source_closure_invalid:${pointer}`);
  }
  violations.push(
    ...artifactViolations(
      sourceClosure?.ledger,
      `${pointer}/sourceClosure/ledger`,
    ),
  );

  const toolchain = isRecord(value.toolchain) ? value.toolchain : null;
  if (
    toolchain == null ||
    !hasExactKeys(toolchain, TOOLCHAIN_KEYS) ||
    !isIdentifier(toolchain.toolchainId) ||
    !isSha256(toolchain.semanticSha256)
  ) {
    violations.push(`kernel_toolchain_invalid:${pointer}`);
  }
  violations.push(
    ...artifactViolations(toolchain?.ledger, `${pointer}/toolchain/ledger`),
    ...artifactViolations(value.executable, `${pointer}/executable`),
  );

  const environment = isRecord(value.environment) ? value.environment : null;
  if (
    environment == null ||
    !hasExactKeys(environment, ENVIRONMENT_KEYS) ||
    !isIdentifier(environment.environmentId) ||
    !isSha256(environment.semanticSha256)
  ) {
    violations.push(`kernel_environment_invalid:${pointer}`);
  }
  violations.push(
    ...artifactViolations(environment?.lock, `${pointer}/environment/lock`),
  );

  const pinnedArtifacts = [
    sourceClosure?.ledger,
    toolchain?.ledger,
    value.executable,
    environment?.lock,
  ].filter(isRecord);
  const artifactPaths = pinnedArtifacts
    .map((entry) => entry.relativePath)
    .filter((entry): entry is string => typeof entry === "string");
  const artifactHashes = pinnedArtifacts
    .map((entry) => entry.sha256)
    .filter((entry): entry is string => typeof entry === "string");
  if (
    artifactPaths.length !== 4 ||
    new Set(artifactPaths).size !== artifactPaths.length
  ) {
    violations.push(`kernel_artifact_paths_not_distinct:${pointer}`);
  }
  if (
    artifactHashes.length !== 4 ||
    new Set(artifactHashes).size !== artifactHashes.length
  ) {
    violations.push(`kernel_artifact_hashes_not_distinct:${pointer}`);
  }
  const bindingHashes = [
    sourceClosure?.semanticSha256,
    toolchain?.semanticSha256,
    isRecord(value.executable) ? value.executable.sha256 : undefined,
    environment?.semanticSha256,
  ].filter((entry): entry is string => typeof entry === "string");
  if (
    bindingHashes.length !== 4 ||
    new Set(bindingHashes).size !== bindingHashes.length
  ) {
    violations.push(`kernel_binding_hashes_not_distinct:${pointer}`);
  }

  const claimBoundary = isRecord(value.claimBoundary)
    ? value.claimBoundary
    : null;
  if (
    claimBoundary == null ||
    !hasExactKeys(claimBoundary, KERNEL_BOUNDARY_KEYS) ||
    claimBoundary.administrativeEnrollmentOnly !== true ||
    claimBoundary.pinnedIdentityOnly !== true ||
    claimBoundary.executionAuthorized !== false ||
    claimBoundary.outputAcceptedWithoutServerReplay !== false ||
    claimBoundary.scientificAuthority !== false
  ) {
    violations.push(`kernel_claim_boundary_invalid:${pointer}`);
  }
  return violations;
};

export const computeNhm2PrimaryRawSolverSuiteEnrollmentSemanticSha256 = (
  value:
    | Nhm2PrimaryRawSolverSuiteEnrollmentV1
    | Omit<Nhm2PrimaryRawSolverSuiteEnrollmentV1, "semanticSha256">,
): string => {
  const semantic = { ...value } as Record<string, unknown>;
  delete semantic.semanticSha256;
  return createHash("sha256")
    .update(NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_SEMANTIC_DOMAIN, "utf8")
    .update(JSON.stringify(stable(semantic)), "utf8")
    .digest("hex");
};

/**
 * Validates administrative enrollment only. Successful validation never grants
 * runtime, diagnostic, theory, physical, or transport authority.
 */
export const nhm2PrimaryRawSolverSuiteEnrollmentViolations = (
  value: unknown,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) {
    return ["descriptor_shape_invalid"];
  }
  const violations: string[] = [];
  if (
    value.artifactId !== NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION ||
    !isExactIsoTimestamp(value.generatedAt) ||
    !isIdentifier(value.enrollmentId) ||
    value.planRole !== "primary_numerical"
  ) {
    violations.push("descriptor_identity_invalid");
  }
  if (
    !isSha256(value.semanticSha256) ||
    value.semanticSha256 !==
      computeNhm2PrimaryRawSolverSuiteEnrollmentSemanticSha256(
        value as Nhm2PrimaryRawSolverSuiteEnrollmentV1,
      )
  ) {
    violations.push("descriptor_semantic_sha256_mismatch");
  }

  const contentPolicy = isRecord(value.contentPolicy)
    ? value.contentPolicy
    : null;
  if (
    contentPolicy == null ||
    !hasExactKeys(contentPolicy, CONTENT_POLICY_KEYS) ||
    contentPolicy.artifactId !== NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID ||
    contentPolicy.contractVersion !==
      NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION ||
    contentPolicy.sha256 !== NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256 ||
    contentPolicy.familyDagOrdering !==
      NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING ||
    contentPolicy.familyCount !==
      NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_FAMILY_COUNT ||
    contentPolicy.roleCount !==
      NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_ROLE_COUNT ||
    contentPolicy.coverageSha256 !==
      NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_COVERAGE_SHA256
  ) {
    violations.push("content_policy_binding_invalid");
  }
  if (
    NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.length !==
      NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_FAMILY_COUNT ||
    NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_ROLE_COUNT !==
      NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_ROLE_COUNT
  ) {
    violations.push("canonical_policy_cardinality_drift");
  }

  const kernels = Array.isArray(value.kernelEnrollments)
    ? value.kernelEnrollments
    : [];
  if (kernels.length === 0) violations.push("kernel_enrollments_missing");
  for (const [index, kernel] of kernels.entries()) {
    violations.push(...kernelViolations(kernel, `/kernelEnrollments/${index}`));
  }
  const kernelIds = kernels
    .map((kernel) => (isRecord(kernel) ? kernel.enrollmentId : undefined))
    .filter((entry): entry is string => typeof entry === "string");
  if (
    kernelIds.length !== kernels.length ||
    new Set(kernelIds).size !== kernelIds.length ||
    !kernelIds.every(
      (entry, index) =>
        index === 0 || compareUtf8(kernelIds[index - 1], entry) < 0,
    )
  ) {
    violations.push("kernel_enrollment_ids_invalid");
  }

  const familyCoverage = Array.isArray(value.familyCoverage)
    ? value.familyCoverage
    : [];
  const referencedKernelIds = new Set<string>();
  if (
    familyCoverage.length !==
    NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_FAMILY_COUNT
  ) {
    violations.push("family_coverage_count_invalid");
  }
  for (const [
    index,
    expected,
  ] of NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_FAMILY_COVERAGE.entries()) {
    const coverage = familyCoverage[index];
    if (!isRecord(coverage) || !hasExactKeys(coverage, FAMILY_COVERAGE_KEYS)) {
      violations.push(`family_coverage_shape_invalid:${index}`);
      continue;
    }
    if (
      coverage.familyId !== expected.familyId ||
      !sameOrderedStrings(coverage.parentFamilyIds, expected.parentFamilyIds) ||
      !sameOrderedStrings(coverage.semanticRoles, expected.semanticRoles)
    ) {
      violations.push(`family_dag_or_roles_invalid:${expected.familyId}`);
    }
    if (!isSortedUniqueIdentifiers(coverage.kernelEnrollmentIds)) {
      violations.push(`family_kernel_bindings_invalid:${expected.familyId}`);
      continue;
    }
    for (const kernelId of coverage.kernelEnrollmentIds) {
      referencedKernelIds.add(kernelId);
      if (!kernelIds.includes(kernelId)) {
        violations.push(
          `family_kernel_binding_unknown:${expected.familyId}:${kernelId}`,
        );
      }
    }
  }
  if (kernelIds.some((kernelId) => !referencedKernelIds.has(kernelId))) {
    violations.push("kernel_enrollment_unassigned");
  }

  const producerBundle = isRecord(value.primaryProducerBundle)
    ? value.primaryProducerBundle
    : null;
  if (
    producerBundle == null ||
    !hasExactKeys(producerBundle, PRODUCER_BUNDLE_KEYS) ||
    !isIdentifier(producerBundle.bundleId) ||
    !isSha256(producerBundle.sourceSnapshotSha256)
  ) {
    violations.push("primary_producer_bundle_invalid");
  }
  violations.push(
    ...artifactViolations(
      producerBundle?.bundle,
      "/primaryProducerBundle/bundle",
      {
        artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
        contractVersion: NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
      },
    ),
    ...artifactViolations(
      producerBundle?.buildMetadata,
      "/primaryProducerBundle/buildMetadata",
      {
        artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
        contractVersion: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
      },
    ),
  );
  if (
    isRecord(producerBundle?.bundle) &&
    isRecord(producerBundle?.buildMetadata) &&
    (producerBundle.bundle.relativePath ===
      producerBundle.buildMetadata.relativePath ||
      producerBundle.bundle.sha256 === producerBundle.buildMetadata.sha256)
  ) {
    violations.push("primary_producer_bundle_artifacts_not_distinct");
  }

  const rawOutputProtocol = isRecord(value.rawOutputProtocol)
    ? value.rawOutputProtocol
    : null;
  const manifest = isRecord(rawOutputProtocol?.manifest)
    ? rawOutputProtocol.manifest
    : null;
  if (
    rawOutputProtocol == null ||
    !hasExactKeys(rawOutputProtocol, RAW_OUTPUT_PROTOCOL_KEYS) ||
    rawOutputProtocol.protocol !==
      NHM2_PRIMARY_RAW_SOLVER_SUITE_MANIFEST_PROTOCOL ||
    manifest == null ||
    !hasExactKeys(manifest, MANIFEST_KEYS) ||
    manifest.artifactId !== NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID ||
    manifest.contractVersion !==
      NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION ||
    !isPortableRelativePath(manifest.relativePath) ||
    !String(manifest.relativePath).endsWith(".json") ||
    rawOutputProtocol.dataFilesDeclaredBeforeManifest !== true ||
    rawOutputProtocol.manifestWrittenLast !== true ||
    rawOutputProtocol.manifestExcludedFromDataFileInventory !== true ||
    rawOutputProtocol.unlistedFilesForbidden !== true ||
    rawOutputProtocol.extraDirectoriesForbidden !== true ||
    rawOutputProtocol.inventoryReopenedByServer !== true
  ) {
    violations.push("raw_output_protocol_invalid");
  }

  const publication = isRecord(value.publication) ? value.publication : null;
  if (
    publication == null ||
    !hasExactKeys(publication, PUBLICATION_KEYS) ||
    publication.authority !== "server_only" ||
    !isIdentifier(publication.governedRootId) ||
    publication.governedRootResolvedByServer !== true ||
    publication.callerSuppliedRootAllowed !== false ||
    publication.publicationOutsideGovernedRootAllowed !== false ||
    publication.symlinkOrReparseTraversalAllowed !== false ||
    publication.publishAfterServerReplayOnly !== true
  ) {
    violations.push("publication_boundary_invalid");
  }
  violations.push(
    ...artifactViolations(
      publication?.governedRootPolicy,
      "/publication/governedRootPolicy",
    ),
  );

  const executionBoundary = isRecord(value.executionBoundary)
    ? value.executionBoundary
    : null;
  if (
    executionBoundary == null ||
    !hasExactKeys(executionBoundary, EXECUTION_BOUNDARY_KEYS) ||
    executionBoundary.administrativeEnrollmentOnly !== true ||
    executionBoundary.runtimeWiringIncluded !== false ||
    executionBoundary.executionAuthorized !== false ||
    executionBoundary.syntheticFallbackAllowed !== false ||
    executionBoundary.repositoryScriptFallbackAllowed !== false ||
    executionBoundary.kernelOutputTrustedWithoutServerReplay !== false
  ) {
    violations.push("execution_boundary_invalid");
  }

  const claimLocks = isRecord(value.claimLocks) ? value.claimLocks : null;
  if (
    claimLocks == null ||
    !hasExactKeys(claimLocks, CLAIM_LOCK_KEYS) ||
    CLAIM_LOCK_KEYS.some((key) => claimLocks[key] !== false)
  ) {
    violations.push("claim_locks_invalid");
  }

  return unique(violations);
};

const lacksViolation = (
  violations: readonly string[],
  prefixes: readonly string[],
): boolean =>
  !violations.some((violation) =>
    prefixes.some((prefix) => violation.startsWith(prefix)),
  );

export const validateNhm2PrimaryRawSolverSuiteEnrollmentV1 = (
  value: unknown,
): Nhm2PrimaryRawSolverSuiteEnrollmentValidationV1 => {
  const violations = nhm2PrimaryRawSolverSuiteEnrollmentViolations(value);
  return {
    contractVersion: NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION,
    schemaValid: violations.length === 0,
    semanticHashValid: !violations.includes(
      "descriptor_semantic_sha256_mismatch",
    ),
    canonicalPolicyBound: lacksViolation(violations, [
      "content_policy_binding_invalid",
      "canonical_policy_cardinality_drift",
    ]),
    exactFamilyRoleCoverage: lacksViolation(violations, [
      "family_coverage_",
      "family_dag_or_roles_invalid",
      "family_kernel_bindings_invalid",
      "family_kernel_binding_unknown",
      "kernel_enrollment_unassigned",
    ]),
    kernelsPinned: lacksViolation(violations, ["kernel_", "artifact_"]),
    publicationLocked: lacksViolation(violations, [
      "raw_output_protocol_invalid",
      "publication_boundary_invalid",
    ]),
    claimsLocked: violations.length === 0,
    executionAuthority: false,
    scientificAuthority: false,
    violations,
  };
};

export const isNhm2PrimaryRawSolverSuiteEnrollmentV1 = (
  value: unknown,
): value is Nhm2PrimaryRawSolverSuiteEnrollmentV1 =>
  nhm2PrimaryRawSolverSuiteEnrollmentViolations(value).length === 0;
