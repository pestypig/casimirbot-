import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_ARTIFACT_ID =
  "casimir_formal_sandbox_executor_capability" as const;
export const CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_SCHEMA_VERSION =
  "casimir_formal_sandbox_executor_capability/v1" as const;
export const CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_HASH_DOMAIN =
  "casimir-formal-sandbox-executor-capability/v1" as const;

export type CasimirFormalSandboxExecutorCapabilityV1 = {
  artifactId: typeof CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_SCHEMA_VERSION;
  generatedAt: string;
  capabilityId: string;
  artifactSha256: string;
  executionTarget: "external_isolated_worker";
  platform: string;
  architecture: string;
  sandboxPolicySha256: string;
  enforcement: {
    operatingSystemMemoryLimitEnforced: true;
    operatingSystemProcessLimitEnforced: true;
    filesystemIsolationEnforced: true;
    networkIsolationEnforced: true;
    wallTimeoutEnforced: true;
    outputByteLimitEnforced: true;
    processTreeContainmentEnforced: true;
    hostWorkstationExecutionAllowed: false;
  };
  resourceCeilings: {
    maxMemoryBytes: number;
    maxProcessCount: number;
    timeoutMs: number;
    maxOutputBytes: number;
  };
  attestation: {
    issuer: string;
    evidenceSha256: string;
  };
  authority: {
    outputRole: "execution_capability_attestation_only";
    executesByItself: false;
    formalPropositionChecked: false;
    validatesScientificTruth: false;
    validatesTheory: false;
    validatesNumericalImplementation: false;
    validatesEmpiricalClaim: false;
    validatesPhysicalMechanism: false;
    assistantAnswer: false;
    terminalEligible: false;
    promotionAllowed: false;
  };
};

export type BuildCasimirFormalSandboxExecutorCapabilityV1Input = Omit<
  CasimirFormalSandboxExecutorCapabilityV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "executionTarget"
  | "authority"
> & { generatedAt?: string };

const SHA256 = /^[a-f0-9]{64}$/;
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (
  value: object,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => entry === expected[index])
  );
};

export async function computeCasimirFormalSandboxExecutorCapabilitySha256V1(
  value: Omit<
    CasimirFormalSandboxExecutorCapabilityV1,
    "artifactSha256"
  >,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirFormalSandboxExecutorCapabilityV1(
  input: BuildCasimirFormalSandboxExecutorCapabilityV1Input,
): Promise<CasimirFormalSandboxExecutorCapabilityV1> {
  const withoutHash: Omit<
    CasimirFormalSandboxExecutorCapabilityV1,
    "artifactSha256"
  > = {
    ...input,
    artifactId:
      CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_ARTIFACT_ID,
    schemaVersion:
      CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    executionTarget: "external_isolated_worker",
    authority: {
      outputRole: "execution_capability_attestation_only",
      executesByItself: false,
      formalPropositionChecked: false,
      validatesScientificTruth: false,
      validatesTheory: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
    },
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirFormalSandboxExecutorCapabilitySha256V1(
        withoutHash,
      ),
  };
}

export async function validateCasimirFormalSandboxExecutorCapabilityV1(
  value: unknown,
): Promise<string[]> {
  const issues: string[] = [];
  if (!isRecord(value)) return ["capability must be an object"];
  if (
    !exactKeys(value, [
      "artifactId",
      "schemaVersion",
      "generatedAt",
      "capabilityId",
      "artifactSha256",
      "executionTarget",
      "platform",
      "architecture",
      "sandboxPolicySha256",
      "enforcement",
      "resourceCeilings",
      "attestation",
      "authority",
    ])
  )
    issues.push("capability shape is invalid");
  const capability =
    value as unknown as CasimirFormalSandboxExecutorCapabilityV1;
  if (
    capability.artifactId !==
    CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_ARTIFACT_ID
  )
    issues.push("artifactId is invalid");
  if (
    capability.schemaVersion !==
    CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_SCHEMA_VERSION
  )
    issues.push("schemaVersion is invalid");
  if (
    !nonEmpty(capability.generatedAt) ||
    Number.isNaN(Date.parse(capability.generatedAt))
  )
    issues.push("generatedAt is invalid");
  for (const field of [
    "capabilityId",
    "platform",
    "architecture",
  ] as const)
    if (!nonEmpty(capability[field])) issues.push(`${field} is invalid`);
  for (const field of [
    "artifactSha256",
    "sandboxPolicySha256",
  ] as const)
    if (!SHA256.test(String(capability[field])))
      issues.push(`${field} is invalid`);
  if (capability.executionTarget !== "external_isolated_worker")
    issues.push("executionTarget is invalid");
  const enforcement = capability.enforcement;
  if (
    !isRecord(enforcement) ||
    !exactKeys(enforcement, [
      "operatingSystemMemoryLimitEnforced",
      "operatingSystemProcessLimitEnforced",
      "filesystemIsolationEnforced",
      "networkIsolationEnforced",
      "wallTimeoutEnforced",
      "outputByteLimitEnforced",
      "processTreeContainmentEnforced",
      "hostWorkstationExecutionAllowed",
    ]) ||
    enforcement.operatingSystemMemoryLimitEnforced !== true ||
    enforcement.operatingSystemProcessLimitEnforced !== true ||
    enforcement.filesystemIsolationEnforced !== true ||
    enforcement.networkIsolationEnforced !== true ||
    enforcement.wallTimeoutEnforced !== true ||
    enforcement.outputByteLimitEnforced !== true ||
    enforcement.processTreeContainmentEnforced !== true ||
    enforcement.hostWorkstationExecutionAllowed !== false
  )
    issues.push("sandbox enforcement is insufficient");
  const ceilings = capability.resourceCeilings;
  if (
    !isRecord(ceilings) ||
    !exactKeys(ceilings, [
      "maxMemoryBytes",
      "maxProcessCount",
      "timeoutMs",
      "maxOutputBytes",
    ]) ||
    ![
      ceilings.maxMemoryBytes,
      ceilings.maxProcessCount,
      ceilings.timeoutMs,
      ceilings.maxOutputBytes,
    ].every((entry) => Number.isSafeInteger(entry) && Number(entry) > 0)
  )
    issues.push("resourceCeilings are invalid");
  if (
    !isRecord(capability.attestation) ||
    !exactKeys(capability.attestation, [
      "issuer",
      "evidenceSha256",
    ]) ||
    !nonEmpty(capability.attestation.issuer) ||
    !SHA256.test(String(capability.attestation.evidenceSha256))
  )
    issues.push("attestation is invalid");
  const authority = capability.authority;
  if (
    !isRecord(authority) ||
    !exactKeys(authority, [
      "outputRole",
      "executesByItself",
      "formalPropositionChecked",
      "validatesScientificTruth",
      "validatesTheory",
      "validatesNumericalImplementation",
      "validatesEmpiricalClaim",
      "validatesPhysicalMechanism",
      "assistantAnswer",
      "terminalEligible",
      "promotionAllowed",
    ]) ||
    authority.outputRole !== "execution_capability_attestation_only" ||
    authority.executesByItself !== false ||
    authority.formalPropositionChecked !== false ||
    authority.validatesScientificTruth !== false ||
    authority.validatesTheory !== false ||
    authority.validatesNumericalImplementation !== false ||
    authority.validatesEmpiricalClaim !== false ||
    authority.validatesPhysicalMechanism !== false ||
    authority.assistantAnswer !== false ||
    authority.terminalEligible !== false ||
    authority.promotionAllowed !== false
  )
    issues.push("authority boundary is invalid");
  if (issues.length === 0) {
    const { artifactSha256, ...withoutHash } = capability;
    const expected =
      await computeCasimirFormalSandboxExecutorCapabilitySha256V1(
        withoutHash,
      );
    if (artifactSha256 !== expected)
      issues.push("artifactSha256 does not match capability content");
  }
  return issues;
}
