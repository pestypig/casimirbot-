import { createHash } from "node:crypto";

export const NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_ARTIFACT_ID =
  "nhm2.independent_numerical_external_execution_descriptor" as const;
export const NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION =
  "nhm2_independent_numerical_external_execution_descriptor/v1" as const;
export const NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID =
  "nhm2.independent_numerical_approved_toolchain_policy" as const;
export const NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION =
  "nhm2_independent_numerical_approved_toolchain_policy/v1" as const;
export const NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_SEMANTIC_DOMAIN =
  "nhm2-independent-numerical-external-execution-descriptor/v1\n" as const;

export type Nhm2IndependentNumericalExecutionDescriptorArtifactRefV1 = {
  artifactId: string;
  contractVersion: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2IndependentNumericalExternalExecutionDescriptorV1 = {
  artifactId: typeof NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_ARTIFACT_ID;
  contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION;
  generatedAt: string;
  descriptorId: string;
  semanticSha256: string;
  planRole: "independent_numerical";
  producerMode: "external_binary";
  solverFamily: "independent_replication_suite";
  solver: {
    solverId: string;
    implementationId: string;
    version: string;
    independenceGroup: string;
  };
  approvedPolicy: {
    artifactId: typeof NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID;
    contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION;
    policyId: string;
    semanticSha256: string;
    approvedAt: string;
    artifact: Nhm2IndependentNumericalExecutionDescriptorArtifactRefV1;
  };
  target: {
    platform: string;
    architecture: string;
  };
  implementationSourceClosure: {
    closureId: string;
    closureSha256: string;
    entryCount: number;
    aggregateBytes: number;
    ledger: Nhm2IndependentNumericalExecutionDescriptorArtifactRefV1;
  };
  toolchain: {
    ledger: Nhm2IndependentNumericalExecutionDescriptorArtifactRefV1;
    executable: Nhm2IndependentNumericalExecutionDescriptorArtifactRefV1;
  };
  environment: {
    lock: Nhm2IndependentNumericalExecutionDescriptorArtifactRefV1;
    allowlist: string[];
    values: Record<string, string>;
  };
  primaryLineage: {
    solverId: string;
    implementationId: string;
    solverDescriptorSha256: string;
    environmentLockSha256: string;
    producerBundleSha256: string;
    sourceClosureSha256: string;
  };
  claimBoundary: {
    administrativeEnrollmentOnly: true;
    serverPolicyAdmissionRequired: true;
    serverPresealRequired: true;
    externalProcessObservationIsNotScientificReplay: true;
    serverFieldLevelReplayRequired: true;
  };
  claimLocks: {
    descriptorEstablishesInstalledPolicy: false;
    descriptorEstablishesExecutableAvailability: false;
    independentImplementationLineageEstablished: false;
    independentContentLineageExclusionEstablished: false;
    independentNumericalReplicationReady: false;
    theoryClosureEstablished: false;
    empiricalValidationEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
  };
};

export type Nhm2IndependentNumericalExecutionDescriptorValidationV1 = {
  contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION;
  schemaValid: boolean;
  semanticHashValid: boolean;
  primaryLineageDistinct: boolean;
  claimsLocked: boolean;
  executionAuthority: false;
  scientificAuthority: false;
  violations: string[];
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "generatedAt",
  "descriptorId",
  "semanticSha256",
  "planRole",
  "producerMode",
  "solverFamily",
  "solver",
  "approvedPolicy",
  "target",
  "implementationSourceClosure",
  "toolchain",
  "environment",
  "primaryLineage",
  "claimBoundary",
  "claimLocks",
] as const;
const SOLVER_KEYS = [
  "solverId",
  "implementationId",
  "version",
  "independenceGroup",
] as const;
const POLICY_KEYS = [
  "artifactId",
  "contractVersion",
  "policyId",
  "semanticSha256",
  "approvedAt",
  "artifact",
] as const;
const TARGET_KEYS = ["platform", "architecture"] as const;
const SOURCE_CLOSURE_KEYS = [
  "closureId",
  "closureSha256",
  "entryCount",
  "aggregateBytes",
  "ledger",
] as const;
const TOOLCHAIN_KEYS = ["ledger", "executable"] as const;
const ENVIRONMENT_KEYS = ["lock", "allowlist", "values"] as const;
const PRIMARY_LINEAGE_KEYS = [
  "solverId",
  "implementationId",
  "solverDescriptorSha256",
  "environmentLockSha256",
  "producerBundleSha256",
  "sourceClosureSha256",
] as const;
const ARTIFACT_KEYS = [
  "artifactId",
  "contractVersion",
  "relativePath",
  "sha256",
  "sizeBytes",
] as const;
const CLAIM_BOUNDARY_KEYS = [
  "administrativeEnrollmentOnly",
  "serverPolicyAdmissionRequired",
  "serverPresealRequired",
  "externalProcessObservationIsNotScientificReplay",
  "serverFieldLevelReplayRequired",
] as const;
const CLAIM_LOCK_KEYS = [
  "descriptorEstablishesInstalledPolicy",
  "descriptorEstablishesExecutableAvailability",
  "independentImplementationLineageEstablished",
  "independentContentLineageExclusionEstablished",
  "independentNumericalReplicationReady",
  "theoryClosureEstablished",
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
const ENVIRONMENT_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
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

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareUtf8(left, right))
        .map(([key, nested]) => [key, stable(nested)]),
    );
  }
  return value;
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const artifactViolations = (value: unknown, pointer: string): string[] => {
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
  return violations;
};

export const computeNhm2IndependentNumericalExecutionDescriptorSemanticSha256 =
  (
    descriptor: Omit<
      Nhm2IndependentNumericalExternalExecutionDescriptorV1,
      "semanticSha256"
    >,
  ): string =>
    createHash("sha256")
      .update(
        NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_SEMANTIC_DOMAIN,
        "utf8",
      )
      .update(JSON.stringify(stable(descriptor)), "utf8")
      .digest("hex");

export const nhm2IndependentNumericalExecutionDescriptorViolations = (
  value: unknown,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) {
    return ["descriptor_shape_invalid"];
  }
  const violations: string[] = [];
  if (
    value.artifactId !==
      NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION ||
    !isExactIsoTimestamp(value.generatedAt) ||
    !isIdentifier(value.descriptorId) ||
    !isSha256(value.semanticSha256) ||
    value.planRole !== "independent_numerical" ||
    value.producerMode !== "external_binary" ||
    value.solverFamily !== "independent_replication_suite"
  ) {
    violations.push("descriptor_identity_invalid");
  }

  const solver = isRecord(value.solver) ? value.solver : null;
  if (
    solver == null ||
    !hasExactKeys(solver, SOLVER_KEYS) ||
    !isIdentifier(solver.solverId) ||
    !isIdentifier(solver.implementationId) ||
    !isIdentifier(solver.version) ||
    !isIdentifier(solver.independenceGroup)
  ) {
    violations.push("solver_binding_invalid");
  }

  const policy = isRecord(value.approvedPolicy) ? value.approvedPolicy : null;
  if (
    policy == null ||
    !hasExactKeys(policy, POLICY_KEYS) ||
    policy.artifactId !==
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID ||
    policy.contractVersion !==
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION ||
    !isIdentifier(policy.policyId) ||
    !isSha256(policy.semanticSha256) ||
    !isExactIsoTimestamp(policy.approvedAt) ||
    (isExactIsoTimestamp(policy.approvedAt) &&
      isExactIsoTimestamp(value.generatedAt) &&
      Date.parse(policy.approvedAt) > Date.parse(value.generatedAt))
  ) {
    violations.push("approved_policy_binding_invalid");
  }
  violations.push(
    ...artifactViolations(policy?.artifact, "/approvedPolicy/artifact"),
  );
  if (
    isRecord(policy?.artifact) &&
    (policy.artifact.artifactId !==
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID ||
      policy.artifact.contractVersion !==
        NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION)
  ) {
    violations.push("approved_policy_artifact_identity_invalid");
  }

  const target = isRecord(value.target) ? value.target : null;
  if (
    target == null ||
    !hasExactKeys(target, TARGET_KEYS) ||
    !isIdentifier(target.platform) ||
    !isIdentifier(target.architecture)
  ) {
    violations.push("target_binding_invalid");
  }

  const closure = isRecord(value.implementationSourceClosure)
    ? value.implementationSourceClosure
    : null;
  if (
    closure == null ||
    !hasExactKeys(closure, SOURCE_CLOSURE_KEYS) ||
    !isIdentifier(closure.closureId) ||
    !isSha256(closure.closureSha256) ||
    !Number.isSafeInteger(closure.entryCount) ||
    Number(closure.entryCount) <= 0 ||
    !Number.isSafeInteger(closure.aggregateBytes) ||
    Number(closure.aggregateBytes) <= 0
  ) {
    violations.push("source_closure_binding_invalid");
  }
  violations.push(
    ...artifactViolations(
      closure?.ledger,
      "/implementationSourceClosure/ledger",
    ),
  );

  const toolchain = isRecord(value.toolchain) ? value.toolchain : null;
  if (toolchain == null || !hasExactKeys(toolchain, TOOLCHAIN_KEYS)) {
    violations.push("toolchain_binding_invalid");
  }
  violations.push(
    ...artifactViolations(toolchain?.ledger, "/toolchain/ledger"),
  );
  violations.push(
    ...artifactViolations(toolchain?.executable, "/toolchain/executable"),
  );
  if (
    isRecord(toolchain?.ledger) &&
    isRecord(toolchain?.executable) &&
    toolchain.ledger.relativePath === toolchain.executable.relativePath
  ) {
    violations.push("toolchain_paths_not_distinct");
  }

  const environment = isRecord(value.environment) ? value.environment : null;
  if (environment == null || !hasExactKeys(environment, ENVIRONMENT_KEYS)) {
    violations.push("environment_binding_invalid");
  }
  violations.push(
    ...artifactViolations(environment?.lock, "/environment/lock"),
  );
  const allowlist = Array.isArray(environment?.allowlist)
    ? environment.allowlist
    : [];
  const environmentValues = isRecord(environment?.values)
    ? environment.values
    : null;
  if (
    allowlist.length === 0 ||
    !allowlist.every(
      (entry): entry is string =>
        typeof entry === "string" && ENVIRONMENT_NAME.test(entry),
    ) ||
    new Set(allowlist).size !== allowlist.length ||
    allowlist.some(
      (entry, index) =>
        index > 0 &&
        compareUtf8(allowlist[index - 1] as string, entry as string) >= 0,
    ) ||
    environmentValues == null ||
    JSON.stringify(Object.keys(environmentValues).sort(compareUtf8)) !==
      JSON.stringify(allowlist) ||
    Object.values(environmentValues ?? {}).some(
      (entry) => typeof entry !== "string" || entry.includes("\0"),
    )
  ) {
    violations.push("environment_values_invalid");
  }

  const primary = isRecord(value.primaryLineage) ? value.primaryLineage : null;
  if (
    primary == null ||
    !hasExactKeys(primary, PRIMARY_LINEAGE_KEYS) ||
    !isIdentifier(primary.solverId) ||
    !isIdentifier(primary.implementationId) ||
    !isSha256(primary.solverDescriptorSha256) ||
    !isSha256(primary.environmentLockSha256) ||
    !isSha256(primary.producerBundleSha256) ||
    !isSha256(primary.sourceClosureSha256)
  ) {
    violations.push("primary_lineage_binding_invalid");
  }
  if (solver != null && primary != null) {
    if (solver.solverId === primary.solverId)
      violations.push("independent_solver_id_not_distinct");
    if (solver.implementationId === primary.implementationId)
      violations.push("independent_implementation_id_not_distinct");
    if (
      solver.independenceGroup === primary.solverId ||
      solver.independenceGroup === primary.implementationId
    ) {
      violations.push("independence_group_not_distinct");
    }
  }
  const forbiddenPrimaryHashes =
    primary == null
      ? []
      : [
          primary.solverDescriptorSha256,
          primary.environmentLockSha256,
          primary.producerBundleSha256,
          primary.sourceClosureSha256,
        ];
  if (
    closure != null &&
    forbiddenPrimaryHashes.includes(closure.closureSha256 as string)
  ) {
    violations.push("independent_source_closure_aliases_primary_lineage");
  }
  if (
    isRecord(environment?.lock) &&
    environment.lock.sha256 === primary?.environmentLockSha256
  ) {
    violations.push("independent_environment_lock_aliases_primary_lineage");
  }
  if (
    isRecord(toolchain?.ledger) &&
    forbiddenPrimaryHashes.includes(toolchain.ledger.sha256 as string)
  ) {
    violations.push("independent_toolchain_ledger_aliases_primary_lineage");
  }
  if (
    isRecord(toolchain?.executable) &&
    forbiddenPrimaryHashes.includes(toolchain.executable.sha256 as string)
  ) {
    violations.push("independent_executable_aliases_primary_lineage");
  }

  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  if (
    boundary == null ||
    !hasExactKeys(boundary, CLAIM_BOUNDARY_KEYS) ||
    CLAIM_BOUNDARY_KEYS.some((key) => boundary[key] !== true)
  ) {
    violations.push("claim_boundary_invalid");
  }
  const locks = isRecord(value.claimLocks) ? value.claimLocks : null;
  if (
    locks == null ||
    !hasExactKeys(locks, CLAIM_LOCK_KEYS) ||
    CLAIM_LOCK_KEYS.some((key) => locks[key] !== false)
  ) {
    violations.push("claim_locks_invalid");
  }

  if (isSha256(value.semanticSha256)) {
    const { semanticSha256: _semanticSha256, ...semantic } = value;
    if (
      value.semanticSha256 !==
      computeNhm2IndependentNumericalExecutionDescriptorSemanticSha256(
        semantic as Omit<
          Nhm2IndependentNumericalExternalExecutionDescriptorV1,
          "semanticSha256"
        >,
      )
    ) {
      violations.push("descriptor_semantic_sha256_mismatch");
    }
  }
  return unique(violations);
};

export const validateNhm2IndependentNumericalExecutionDescriptorV1 = (
  value: unknown,
): Nhm2IndependentNumericalExecutionDescriptorValidationV1 => {
  const violations =
    nhm2IndependentNumericalExecutionDescriptorViolations(value);
  return {
    contractVersion:
      NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION,
    schemaValid: violations.length === 0,
    semanticHashValid: !violations.includes(
      "descriptor_semantic_sha256_mismatch",
    ),
    primaryLineageDistinct: !violations.some(
      (entry) =>
        entry.includes("not_distinct") ||
        entry.includes("aliases_primary_lineage"),
    ),
    // A malformed or semantically invalid descriptor has no trustworthy
    // claim-lock projection, even when its unread/omitted claimLocks object did
    // not happen to emit the narrow claim_locks_invalid code.
    claimsLocked:
      violations.length === 0 && !violations.includes("claim_locks_invalid"),
    executionAuthority: false,
    scientificAuthority: false,
    violations,
  };
};

export const isNhm2IndependentNumericalExecutionDescriptorV1 = (
  value: unknown,
): value is Nhm2IndependentNumericalExternalExecutionDescriptorV1 =>
  nhm2IndependentNumericalExecutionDescriptorViolations(value).length === 0;
