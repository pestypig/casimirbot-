import fs from "node:fs/promises";
import path from "node:path";

import {
  buildCasimirFormalLeanReplayPolicyV1,
  validateCasimirFormalLeanReplayPolicyIntegrityV1,
  type CasimirFormalLeanReplayPolicyV1,
} from "@shared/contracts/casimir-formal-lean-replay-policy.v1";
import { computeCasimirSpecValueSha256V1 } from "@shared/contracts/casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_FORMAL_ENVIRONMENT_POLICY_CATALOG_SCHEMA =
  "casimir.formal_environment_policy_catalog.v1" as const;

export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_CATALOG_ENTRY_ID =
  "casimir.formal.runtime_self_test.true.v1" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_ENVIRONMENT_POLICY_ID =
  "casimir.formal.runtime_self_test.lean4-4.31.0.win32-x64.v1" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_ARTIFACT_ID =
  "casimir.formal.runtime_self_test.true.source.v1" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_THEOREM_NAME =
  "casimir_formal_runtime_self_test_true" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_THEOREM_MODULE =
  "CasimirFormalRuntimeSelfTest" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_REPO_PATH =
  "formal/lean/CasimirFormalRuntimeSelfTest.lean" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_SHA256 =
  "4ca64b9be8528a8fa6920731470e3dee6c5923fa9a309ac03605bd0970e9bd78" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_IMPORT_CLOSURE_SHA256 =
  "f75931ad29fe249390b16fab7405005df4167f58e6f6cbd6b2e50ab0e797a20b" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_RELEASE = "4.31.0" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_COMMIT_SHA =
  "68218e876d2a38b1985b8590fff244a83c321783" as const;
export const CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_KERNEL_BINARY_SHA256 =
  "9b216deb50d37c32c829d1efaaa5bafd5560417d382df35a815489e31a31593f" as const;

export type CasimirFormalEnvironmentPolicyCatalogEntryV1 = {
  policyId: string;
  policyArtifactSha256: string;
  platform: NodeJS.Platform;
  architecture: string;
  toolchainIdentity: {
    release: string;
    commitSha: string;
    kernelBinarySha256: string;
    authority: "exact_binary_sha256_allowlist";
  };
  policy: CasimirFormalLeanReplayPolicyV1;
  leanExecutablePath: string;
  importSourcePaths: Record<string, string>;
  importClosureSha256: string;
  environmentLockSha256: string;
};

export type CasimirFormalRuntimeSelfTestCatalogEntryV1 = {
  catalogEntryId: typeof CASIMIR_FORMAL_RUNTIME_SELF_TEST_CATALOG_ENTRY_ID;
  purpose: "lean_kernel_and_replay_runtime_self_test_only";
  formalArtifactId: typeof CASIMIR_FORMAL_RUNTIME_SELF_TEST_ARTIFACT_ID;
  theorem: {
    theoremName: typeof CASIMIR_FORMAL_RUNTIME_SELF_TEST_THEOREM_NAME;
    theoremModule: typeof CASIMIR_FORMAL_RUNTIME_SELF_TEST_THEOREM_MODULE;
    sourceRepoPath: typeof CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_REPO_PATH;
    sourceSha256: typeof CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_SHA256;
    absoluteSourcePath: string;
  };
  environmentPolicyId: typeof CASIMIR_FORMAL_RUNTIME_SELF_TEST_ENVIRONMENT_POLICY_ID;
  environmentLockSha256: string;
  environment: CasimirFormalEnvironmentPolicyCatalogEntryV1;
  authority: {
    nonScientificRuntimeSelfTest: true;
    semanticBindingRegistered: false;
    theoremTypeIdentityRegistered: false;
    theoryGraphBindingRegistered: false;
    theoryExperimentFormalClosureEligible: false;
    validatesScientificClaim: false;
    validatesPhysicalTruth: false;
    validatesNumericalImplementation: false;
    certificatePromotionAllowed: false;
    assistantAnswer: false;
    terminalEligible: false;
  };
};

/*
 * Intentionally empty in production. This catalog belongs to the legacy v1
 * runtime-canary/preparation rail. Scientific v2 execution is selected through
 * the external sealed-execution catalog and may not inherit a host executable
 * or filesystem path from this module.
 */
const ENTRIES = new Map<string, CasimirFormalEnvironmentPolicyCatalogEntryV1>();
let installedRuntimeSelfTest: CasimirFormalRuntimeSelfTestCatalogEntryV1 | null =
  null;

const sha256File = async (filePath: string): Promise<string> => {
  const { createHash } = await import("node:crypto");
  return createHash("sha256")
    .update(await fs.readFile(filePath))
    .digest("hex");
};

const requireRegularNonAliasedFile = async (
  filePath: string,
  label: string,
): Promise<string> => {
  if (!path.isAbsolute(filePath)) {
    throw new Error(`${label}_path_not_absolute`);
  }
  const absolutePath = path.resolve(filePath);
  const stat = await fs.lstat(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${label}_not_regular_file`);
  }
  const realPath = await fs.realpath(absolutePath);
  const same =
    process.platform === "win32"
      ? realPath.toLowerCase() === absolutePath.toLowerCase()
      : realPath === absolutePath;
  if (!same) throw new Error(`${label}_path_alias_forbidden`);
  return absolutePath;
};

/**
 * Resolves the exact, server-owned, non-scientific runtime self-test without
 * registering it in the scientific environment catalog. A trusted server
 * bootstrap may use this for a bounded runtime canary after it supplies the
 * repository root and Lean executable explicitly.
 */
export async function resolveCasimirFormalRuntimeSelfTestCatalogEntryV1(input: {
  repositoryRoot: string;
  leanExecutablePath: string;
}): Promise<CasimirFormalRuntimeSelfTestCatalogEntryV1> {
  if (process.platform !== "win32" || process.arch !== "x64") {
    throw new Error("formal_runtime_self_test_platform_not_registered");
  }
  if (!path.isAbsolute(input.repositoryRoot)) {
    throw new Error("formal_runtime_self_test_repository_root_not_absolute");
  }
  const repositoryRoot = path.resolve(input.repositoryRoot);
  const repositoryStat = await fs.lstat(repositoryRoot);
  if (!repositoryStat.isDirectory() || repositoryStat.isSymbolicLink()) {
    throw new Error("formal_runtime_self_test_repository_root_invalid");
  }
  const repositoryRealPath = await fs.realpath(repositoryRoot);
  if (repositoryRealPath.toLowerCase() !== repositoryRoot.toLowerCase()) {
    throw new Error("formal_runtime_self_test_repository_root_alias_forbidden");
  }

  const absoluteSourcePath = await requireRegularNonAliasedFile(
    path.resolve(
      repositoryRoot,
      ...CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_REPO_PATH.split("/"),
    ),
    "formal_runtime_self_test_source",
  );
  const relativeSourcePath = path
    .relative(repositoryRoot, absoluteSourcePath)
    .split(path.sep)
    .join("/");
  if (
    relativeSourcePath !== CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_REPO_PATH
  ) {
    throw new Error("formal_runtime_self_test_source_path_mismatch");
  }
  if (
    (await sha256File(absoluteSourcePath)) !==
    CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_SHA256
  ) {
    throw new Error("formal_runtime_self_test_source_hash_mismatch");
  }

  const leanExecutablePath = await requireRegularNonAliasedFile(
    input.leanExecutablePath,
    "formal_runtime_self_test_lean_executable",
  );
  if (
    (await sha256File(leanExecutablePath)) !==
    CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_KERNEL_BINARY_SHA256
  ) {
    throw new Error("formal_runtime_self_test_lean_binary_hash_mismatch");
  }

  const policy = await buildCasimirFormalLeanReplayPolicyV1({
    policyId: CASIMIR_FORMAL_RUNTIME_SELF_TEST_ENVIRONMENT_POLICY_ID,
    pinnedVersion: `${CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_RELEASE}+${CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_COMMIT_SHA}`,
    kernelBinarySha256:
      CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_KERNEL_BINARY_SHA256,
    allowedImportModules: [],
    resourceCeilings: {
      timeoutMs: 30_000,
      maxMemoryBytes: 256 * 1024 * 1024,
      maxOutputBytes: 1024 * 1024,
      maxSourceBytes: 16 * 1024,
      maxImportCount: 1,
    },
  });
  const policyIssues =
    await validateCasimirFormalLeanReplayPolicyIntegrityV1(policy);
  if (policyIssues.length > 0) {
    throw new Error(
      `formal_runtime_self_test_policy_invalid:${policyIssues.join(",")}`,
    );
  }
  if (policy.allowedImportModules.length !== 0) {
    throw new Error("formal_runtime_self_test_import_closure_not_empty");
  }
  const importClosureSha256 = await computeCasimirSpecValueSha256V1({
    schema: "casimir.formal.import_closure.v1",
    modules: [],
  });
  if (
    importClosureSha256 !==
    CASIMIR_FORMAL_RUNTIME_SELF_TEST_IMPORT_CLOSURE_SHA256
  ) {
    throw new Error("formal_runtime_self_test_import_closure_hash_mismatch");
  }

  const environmentLockSha256 = await computeCasimirSpecValueSha256V1({
    schema: "casimir.formal.runtime_self_test.environment_lock.v1",
    purpose: "lean_kernel_and_replay_runtime_self_test_only",
    platform: "win32",
    architecture: "x64",
    release: CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_RELEASE,
    commitSha: CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_COMMIT_SHA,
    kernelBinarySha256:
      CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_KERNEL_BINARY_SHA256,
    policyArtifactSha256: policy.artifactSha256,
    importClosureSha256: CASIMIR_FORMAL_RUNTIME_SELF_TEST_IMPORT_CLOSURE_SHA256,
    sourceSha256: CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_SHA256,
    theoryExperimentFormalClosureEligible: false,
  });
  const environmentEntry: CasimirFormalEnvironmentPolicyCatalogEntryV1 = {
    policyId: policy.policyId,
    policyArtifactSha256: policy.artifactSha256,
    platform: "win32",
    architecture: "x64",
    toolchainIdentity: {
      release: CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_RELEASE,
      commitSha: CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_COMMIT_SHA,
      kernelBinarySha256:
        CASIMIR_FORMAL_RUNTIME_SELF_TEST_LEAN_KERNEL_BINARY_SHA256,
      authority: "exact_binary_sha256_allowlist",
    },
    policy,
    leanExecutablePath,
    importSourcePaths: {},
    importClosureSha256: CASIMIR_FORMAL_RUNTIME_SELF_TEST_IMPORT_CLOSURE_SHA256,
    environmentLockSha256,
  };
  return {
    catalogEntryId: CASIMIR_FORMAL_RUNTIME_SELF_TEST_CATALOG_ENTRY_ID,
    purpose: "lean_kernel_and_replay_runtime_self_test_only",
    formalArtifactId: CASIMIR_FORMAL_RUNTIME_SELF_TEST_ARTIFACT_ID,
    theorem: {
      theoremName: CASIMIR_FORMAL_RUNTIME_SELF_TEST_THEOREM_NAME,
      theoremModule: CASIMIR_FORMAL_RUNTIME_SELF_TEST_THEOREM_MODULE,
      sourceRepoPath: CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_REPO_PATH,
      sourceSha256: CASIMIR_FORMAL_RUNTIME_SELF_TEST_SOURCE_SHA256,
      absoluteSourcePath,
    },
    environmentPolicyId: CASIMIR_FORMAL_RUNTIME_SELF_TEST_ENVIRONMENT_POLICY_ID,
    environmentLockSha256,
    environment: environmentEntry,
    authority: {
      nonScientificRuntimeSelfTest: true,
      semanticBindingRegistered: false,
      theoremTypeIdentityRegistered: false,
      theoryGraphBindingRegistered: false,
      theoryExperimentFormalClosureEligible: false,
      validatesScientificClaim: false,
      validatesPhysicalTruth: false,
      validatesNumericalImplementation: false,
      certificatePromotionAllowed: false,
      assistantAnswer: false,
      terminalEligible: false,
    },
  };
}

/**
 * Installs only a non-scientific runtime self-test in a test process.
 * It is not called by server bootstrap, cannot be selected by the formal
 * preparation route, and cannot satisfy a theory-experiment formal axis.
 */
export async function installCasimirFormalRuntimeSelfTestCatalogForTestsV1(input: {
  repositoryRoot: string;
  leanExecutablePath: string;
}): Promise<CasimirFormalRuntimeSelfTestCatalogEntryV1> {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("formal_runtime_self_test_process_required");
  }
  installedRuntimeSelfTest =
    await resolveCasimirFormalRuntimeSelfTestCatalogEntryV1(input);
  return installedRuntimeSelfTest;
}

export const inspectCasimirFormalEnvironmentPolicyCatalogV1 = () => ({
  schema: CASIMIR_FORMAL_ENVIRONMENT_POLICY_CATALOG_SCHEMA,
  configured: ENTRIES.size > 0,
  policyIds: Array.from(ENTRIES.keys()).sort(),
  assistantAnswer: false as const,
  terminalEligible: false as const,
});

export const resolveCasimirFormalEnvironmentPolicyCatalogEntryV1 = (
  policyId: string | null | undefined,
): CasimirFormalEnvironmentPolicyCatalogEntryV1 | null => {
  const normalized =
    typeof policyId === "string" && policyId.trim() ? policyId.trim() : null;
  return normalized ? (ENTRIES.get(normalized) ?? null) : null;
};

export const resolveCasimirFormalRuntimeSelfTestCatalogEntryForTestsV1 = (
  formalArtifactId: string | null | undefined,
): CasimirFormalRuntimeSelfTestCatalogEntryV1 | null =>
  formalArtifactId?.trim() === CASIMIR_FORMAL_RUNTIME_SELF_TEST_ARTIFACT_ID
    ? installedRuntimeSelfTest
    : null;

export const resetCasimirFormalEnvironmentPolicyCatalogForTestsV1 =
  (): void => {
    ENTRIES.clear();
    installedRuntimeSelfTest = null;
  };
