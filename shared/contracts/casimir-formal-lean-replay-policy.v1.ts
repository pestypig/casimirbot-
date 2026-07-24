import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_FORMAL_LEAN_REPLAY_POLICY_ARTIFACT_ID =
  "casimir_formal_lean_replay_policy" as const;
export const CASIMIR_FORMAL_LEAN_REPLAY_POLICY_SCHEMA_VERSION =
  "casimir_formal_lean_replay_policy/v1" as const;
export const CASIMIR_FORMAL_LEAN_REPLAY_POLICY_HASH_DOMAIN =
  "casimir-formal-lean-replay-policy-artifact/v1" as const;

export const CASIMIR_FORMAL_LEAN_FORBIDDEN_SOURCE_TOKENS_V1 = [
  "#check",
  "#eval",
  "#print",
  "#reduce",
  "#run",
  "admit",
  "axiom",
  "builtin_initialize",
  "elab",
  "extern",
  "foreign",
  "implemented_by",
  "include_bytes",
  "include_str",
  "initialize",
  "macro",
  "opaque",
  "run_cmd",
  "run_tac",
  "sorry",
  "syntax",
  "unsafe",
] as const;

export type CasimirFormalLeanReplayPolicyV1 = {
  artifactId: typeof CASIMIR_FORMAL_LEAN_REPLAY_POLICY_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_FORMAL_LEAN_REPLAY_POLICY_SCHEMA_VERSION;
  policyId: string;
  artifactSha256: string;
  prover: "lean4";
  pinnedVersion: string;
  kernelBinarySha256: string;
  allowedImportModules: string[];
  fixedInvocation: {
    directExecutableOnly: true;
    shellAllowed: false;
    argumentsPrefix: ["--trust=0", "--threads=1"];
    wrapperFileName: "CasimirReplay.lean";
    replayCount: 2;
  };
  resourceCeilings: {
    timeoutMs: number;
    maxMemoryBytes: number;
    maxOutputBytes: number;
    maxSourceBytes: number;
    maxImportCount: number;
  };
  sourceAdmission: {
    exactUtf8Required: true;
    bomAllowed: false;
    forbiddenTokens: string[];
    undeclaredImportsAllowed: false;
    localCodeGenerationAllowed: false;
  };
  isolation: {
    networkEnvironmentVariablesForwarded: false;
    inheritedEnvironmentAllowed: false;
    subprocessShellAllowed: false;
    operatingSystemNetworkSandboxAsserted: false;
    operatingSystemFilesystemSandboxAsserted: false;
  };
  authority: {
    replayPolicyOnly: true;
    executesTools: false;
    formalAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    promotionAllowed: false;
  };
};

export type BuildCasimirFormalLeanReplayPolicyV1Input = Omit<
  CasimirFormalLeanReplayPolicyV1,
  | "artifactId"
  | "schemaVersion"
  | "artifactSha256"
  | "prover"
  | "fixedInvocation"
  | "sourceAdmission"
  | "isolation"
  | "authority"
>;

const SHA256 = /^[a-f0-9]{64}$/;
const LEAN_MODULE = /^[A-Z][A-Za-z0-9_]*(?:\.[A-Z][A-Za-z0-9_]*)*$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
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
const exactShape = (
  value: unknown,
  keys: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  if (!hasExactKeys(value, keys)) {
    issues.push(`${path} must contain exactly: ${keys.join(", ")}`);
  }
  return true;
};
const isSortedUnique = (values: string[]): boolean =>
  values.every((value, index) => index === 0 || values[index - 1] < value);

export function validateCasimirFormalLeanReplayPolicyV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (
    !exactShape(
      value,
      [
        "artifactId",
        "schemaVersion",
        "policyId",
        "artifactSha256",
        "prover",
        "pinnedVersion",
        "kernelBinarySha256",
        "allowedImportModules",
        "fixedInvocation",
        "resourceCeilings",
        "sourceAdmission",
        "isolation",
        "authority",
      ],
      "$",
      issues,
    )
  ) {
    return issues;
  }
  if (value.artifactId !== CASIMIR_FORMAL_LEAN_REPLAY_POLICY_ARTIFACT_ID) {
    issues.push(
      `artifactId must be ${CASIMIR_FORMAL_LEAN_REPLAY_POLICY_ARTIFACT_ID}`,
    );
  }
  if (
    value.schemaVersion !== CASIMIR_FORMAL_LEAN_REPLAY_POLICY_SCHEMA_VERSION
  ) {
    issues.push(
      `schemaVersion must be ${CASIMIR_FORMAL_LEAN_REPLAY_POLICY_SCHEMA_VERSION}`,
    );
  }
  if (!isNonEmptyString(value.policyId))
    issues.push("policyId must be non-empty");
  if (!isNonEmptyString(value.pinnedVersion))
    issues.push("pinnedVersion must be non-empty");
  if (value.prover !== "lean4") issues.push("prover must be lean4");
  if (
    typeof value.artifactSha256 !== "string" ||
    !SHA256.test(value.artifactSha256)
  ) {
    issues.push("artifactSha256 must be lowercase SHA-256");
  }
  if (
    typeof value.kernelBinarySha256 !== "string" ||
    !SHA256.test(value.kernelBinarySha256)
  ) {
    issues.push("kernelBinarySha256 must be lowercase SHA-256");
  }
  if (
    !Array.isArray(value.allowedImportModules) ||
    !value.allowedImportModules.every(
      (entry): entry is string =>
        typeof entry === "string" && LEAN_MODULE.test(entry),
    ) ||
    !isSortedUnique(value.allowedImportModules)
  ) {
    issues.push(
      "allowedImportModules must be sorted, unique Lean module names",
    );
  }

  if (
    exactShape(
      value.fixedInvocation,
      [
        "directExecutableOnly",
        "shellAllowed",
        "argumentsPrefix",
        "wrapperFileName",
        "replayCount",
      ],
      "fixedInvocation",
      issues,
    )
  ) {
    if (value.fixedInvocation.directExecutableOnly !== true)
      issues.push("fixedInvocation.directExecutableOnly must be true");
    if (value.fixedInvocation.shellAllowed !== false)
      issues.push("fixedInvocation.shellAllowed must be false");
    if (
      JSON.stringify(value.fixedInvocation.argumentsPrefix) !==
      JSON.stringify(["--trust=0", "--threads=1"])
    ) {
      issues.push(
        "fixedInvocation.argumentsPrefix must be --trust=0, --threads=1",
      );
    }
    if (value.fixedInvocation.wrapperFileName !== "CasimirReplay.lean") {
      issues.push("fixedInvocation.wrapperFileName must be CasimirReplay.lean");
    }
    if (value.fixedInvocation.replayCount !== 2)
      issues.push("fixedInvocation.replayCount must be 2");
  }

  if (
    exactShape(
      value.resourceCeilings,
      [
        "timeoutMs",
        "maxMemoryBytes",
        "maxOutputBytes",
        "maxSourceBytes",
        "maxImportCount",
      ],
      "resourceCeilings",
      issues,
    )
  ) {
    for (const field of [
      "timeoutMs",
      "maxMemoryBytes",
      "maxOutputBytes",
      "maxSourceBytes",
      "maxImportCount",
    ] as const) {
      if (!isPositiveInteger(value.resourceCeilings[field])) {
        issues.push(
          `resourceCeilings.${field} must be a positive safe integer`,
        );
      }
    }
  }

  if (
    exactShape(
      value.sourceAdmission,
      [
        "exactUtf8Required",
        "bomAllowed",
        "forbiddenTokens",
        "undeclaredImportsAllowed",
        "localCodeGenerationAllowed",
      ],
      "sourceAdmission",
      issues,
    )
  ) {
    if (value.sourceAdmission.exactUtf8Required !== true)
      issues.push("sourceAdmission.exactUtf8Required must be true");
    if (value.sourceAdmission.bomAllowed !== false)
      issues.push("sourceAdmission.bomAllowed must be false");
    if (
      JSON.stringify(value.sourceAdmission.forbiddenTokens) !==
      JSON.stringify(CASIMIR_FORMAL_LEAN_FORBIDDEN_SOURCE_TOKENS_V1)
    ) {
      issues.push("sourceAdmission.forbiddenTokens must match v1 authority");
    }
    if (value.sourceAdmission.undeclaredImportsAllowed !== false)
      issues.push("sourceAdmission.undeclaredImportsAllowed must be false");
    if (value.sourceAdmission.localCodeGenerationAllowed !== false)
      issues.push("sourceAdmission.localCodeGenerationAllowed must be false");
  }

  if (
    exactShape(
      value.isolation,
      [
        "networkEnvironmentVariablesForwarded",
        "inheritedEnvironmentAllowed",
        "subprocessShellAllowed",
        "operatingSystemNetworkSandboxAsserted",
        "operatingSystemFilesystemSandboxAsserted",
      ],
      "isolation",
      issues,
    )
  ) {
    for (const field of [
      "networkEnvironmentVariablesForwarded",
      "inheritedEnvironmentAllowed",
      "subprocessShellAllowed",
      "operatingSystemNetworkSandboxAsserted",
      "operatingSystemFilesystemSandboxAsserted",
    ] as const) {
      if (value.isolation[field] !== false)
        issues.push(`isolation.${field} must be false`);
    }
  }

  if (
    exactShape(
      value.authority,
      [
        "replayPolicyOnly",
        "executesTools",
        "formalAuthority",
        "numericalAuthority",
        "empiricalAuthority",
        "physicalAuthority",
        "assistantAnswer",
        "terminalEligible",
        "promotionAllowed",
      ],
      "authority",
      issues,
    )
  ) {
    if (value.authority.replayPolicyOnly !== true)
      issues.push("authority.replayPolicyOnly must be true");
    for (const field of [
      "executesTools",
      "formalAuthority",
      "numericalAuthority",
      "empiricalAuthority",
      "physicalAuthority",
      "assistantAnswer",
      "terminalEligible",
      "promotionAllowed",
    ] as const) {
      if (value.authority[field] !== false)
        issues.push(`authority.${field} must be false`);
    }
  }
  return issues;
}

export async function computeCasimirFormalLeanReplayPolicySha256V1(
  value: Omit<CasimirFormalLeanReplayPolicyV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_LEAN_REPLAY_POLICY_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirFormalLeanReplayPolicyV1(
  input: BuildCasimirFormalLeanReplayPolicyV1Input,
): Promise<CasimirFormalLeanReplayPolicyV1> {
  const withoutHash: Omit<CasimirFormalLeanReplayPolicyV1, "artifactSha256"> = {
    artifactId: CASIMIR_FORMAL_LEAN_REPLAY_POLICY_ARTIFACT_ID,
    schemaVersion: CASIMIR_FORMAL_LEAN_REPLAY_POLICY_SCHEMA_VERSION,
    policyId: input.policyId,
    prover: "lean4",
    pinnedVersion: input.pinnedVersion,
    kernelBinarySha256: input.kernelBinarySha256,
    allowedImportModules: input.allowedImportModules,
    fixedInvocation: {
      directExecutableOnly: true,
      shellAllowed: false,
      argumentsPrefix: ["--trust=0", "--threads=1"],
      wrapperFileName: "CasimirReplay.lean",
      replayCount: 2,
    },
    resourceCeilings: input.resourceCeilings,
    sourceAdmission: {
      exactUtf8Required: true,
      bomAllowed: false,
      forbiddenTokens: [...CASIMIR_FORMAL_LEAN_FORBIDDEN_SOURCE_TOKENS_V1],
      undeclaredImportsAllowed: false,
      localCodeGenerationAllowed: false,
    },
    isolation: {
      networkEnvironmentVariablesForwarded: false,
      inheritedEnvironmentAllowed: false,
      subprocessShellAllowed: false,
      operatingSystemNetworkSandboxAsserted: false,
      operatingSystemFilesystemSandboxAsserted: false,
    },
    authority: {
      replayPolicyOnly: true,
      executesTools: false,
      formalAuthority: false,
      numericalAuthority: false,
      empiricalAuthority: false,
      physicalAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
    },
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirFormalLeanReplayPolicySha256V1(withoutHash),
  };
}

export async function validateCasimirFormalLeanReplayPolicyIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirFormalLeanReplayPolicyV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } = value;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_LEAN_REPLAY_POLICY_HASH_DOMAIN,
    value: withoutHash,
  });
  if (artifactSha256 !== expected) {
    issues.push("artifactSha256 does not match replay policy content");
  }
  return issues;
}
