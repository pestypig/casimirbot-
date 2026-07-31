import {
  CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION,
  computeCasimirSpecValueSha256V1,
} from "./casimir-spec-scientific-claim-ir.v1";
import { THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION } from "./theory-derivation-program.v1";
import { THEORY_MASTER_PROBLEM_SCHEMA_VERSION } from "./theory-master-problem.v1";
import { CASIMIR_SEMANTIC_TO_LEAN_BINDING_SCHEMA_VERSION } from "./casimir-semantic-to-lean-binding.v1";

export const CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_ARTIFACT_ID =
  "casimir_formal_verification_request_v2" as const;
export const CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION =
  "casimir_formal_verification_request/v2" as const;
export const CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_HASH_DOMAIN =
  "casimir-formal-verification-request-artifact/v2" as const;

export type CasimirFormalVerificationRequestV2 = {
  artifactId: typeof CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION;
  generatedAt: string;
  requestId: string;
  artifactSha256: string;
  casimirSpec: {
    specId: string;
    schemaVersion: typeof CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION;
    semanticSha256: string;
    artifactSha256: string;
  };
  semanticClaim: {
    claimId: string;
    propositionSha256: string;
    candidateBadgeIds: string[];
  };
  formalArtifact: {
    formalArtifactId: string;
    sourceAuditArtifactSha256: string;
    theoremName: string;
    theoremModule: string;
    sourceSha256: string;
    declarationSha256: string;
    propositionSourceSha256: string;
    observedTheoremTypeSha256: string;
    emitterId: string;
    emitterRevisionSha256: string;
  };
  semanticToLeanBinding: {
    bindingId: string;
    schemaVersion: typeof CASIMIR_SEMANTIC_TO_LEAN_BINDING_SCHEMA_VERSION;
    artifactSha256: string;
    bindingKind: "reviewed_translation_mapping";
    status: "reviewed";
    claimId: string;
    semanticPropositionSha256: string;
    formalArtifactId: string;
    observedTheoremTypeSha256: string;
    reviewerPolicyId: string;
    reviewerPolicySha256: string;
    limitations: string[];
  };
  masterProblem: {
    schemaVersion: typeof THEORY_MASTER_PROBLEM_SCHEMA_VERSION;
    planId: string;
    artifactSha256: string;
  };
  derivationProgram: {
    schemaVersion: typeof THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION;
    programId: string;
    sourceMasterProblemPlanId: string;
    artifactSha256: string;
  };
  theoryGraph: {
    graphId: string;
    snapshotSha256: string;
  };
  catalogSnapshots: Array<{
    catalogId: string;
    snapshotSha256: string;
  }>;
  formalEnvironment: {
    prover: "lean4";
    environmentPolicyId: string;
    environmentPolicySha256: string;
    pinnedVersion: string;
    kernelBinarySha256: string;
    dependencyLockSha256: string;
    importClosureSha256: string;
    imports: Array<{
      module: string;
      sourceSha256: string;
      objectSha256: string;
    }>;
    declaredAxiomIds: string[];
    allowedAxiomIds: string[];
  };
  executionPolicy: {
    replayCount: 2;
    timeoutMs: number;
    maxMemoryBytes: number;
    maxOutputBytes: number;
    sandboxExecutorCapabilityId: string;
    sandboxExecutorCapabilitySha256: string;
    networkAllowed: false;
    arbitraryCommandAllowed: false;
    outerObservedProcessRequired: true;
    operatingSystemMemoryLimitRequired: true;
    operatingSystemProcessLimitRequired: true;
    operatingSystemFilesystemIsolationRequired: true;
    operatingSystemNetworkIsolationRequired: true;
    hostWorkstationExecutionAllowed: false;
  };
  authority: {
    outputRole: "evidence_for_bounded_synthesis";
    executesTools: false;
    semanticAndFormalIdentitySeparated: true;
    semanticBindingReviewed: true;
    validatesScientificTruth: false;
    validatesNumericalImplementation: false;
    validatesEmpiricalClaim: false;
    validatesPhysicalMechanism: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
};

export type BuildCasimirFormalVerificationRequestV2Input = Omit<
  CasimirFormalVerificationRequestV2,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & { generatedAt?: string };

const SHA256 = /^[a-f0-9]{64}$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const sha = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);
const sortedUnique = (values: string[]): boolean =>
  values.every(
    (entry, index) =>
      index === 0 || values[index - 1].localeCompare(entry, "en") < 0,
  );
const exactKeys = (
  value: unknown,
  keys: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index])
  ) {
    issues.push(`${path} must contain exactly: ${keys.join(", ")}`);
  }
  return true;
};
const requireSha = (
  value: unknown,
  path: string,
  issues: string[],
): void => {
  if (!sha(value)) issues.push(`${path} must be lowercase SHA-256`);
};
const requireStrings = (
  value: Record<string, unknown>,
  fields: readonly string[],
  path: string,
  issues: string[],
): void => {
  for (const field of fields) {
    if (!nonEmpty(value[field])) issues.push(`${path}.${field} must be non-empty`);
  }
};
const validateSortedIds = (
  value: unknown,
  path: string,
  issues: string[],
): string[] => {
  if (!Array.isArray(value) || !value.every(nonEmpty)) {
    issues.push(`${path} must be an array of non-empty strings`);
    return [];
  }
  if (!sortedUnique(value)) issues.push(`${path} must be sorted and unique`);
  return value;
};

export function validateCasimirFormalVerificationRequestV2(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (
    !exactKeys(
      value,
      [
        "artifactId",
        "schemaVersion",
        "generatedAt",
        "requestId",
        "artifactSha256",
        "casimirSpec",
        "semanticClaim",
        "formalArtifact",
        "semanticToLeanBinding",
        "masterProblem",
        "derivationProgram",
        "theoryGraph",
        "catalogSnapshots",
        "formalEnvironment",
        "executionPolicy",
        "authority",
      ],
      "$",
      issues,
    )
  )
    return issues;
  if (value.artifactId !== CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_ARTIFACT_ID)
    issues.push("artifactId is invalid");
  if (value.schemaVersion !== CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION)
    issues.push("schemaVersion is invalid");
  requireStrings(value, ["generatedAt", "requestId"], "$", issues);
  if (
    typeof value.generatedAt === "string" &&
    Number.isNaN(Date.parse(value.generatedAt))
  )
    issues.push("generatedAt must be an ISO-compatible timestamp");
  requireSha(value.artifactSha256, "artifactSha256", issues);

  if (
    exactKeys(
      value.casimirSpec,
      ["specId", "schemaVersion", "semanticSha256", "artifactSha256"],
      "casimirSpec",
      issues,
    )
  ) {
    requireStrings(value.casimirSpec, ["specId"], "casimirSpec", issues);
    if (
      value.casimirSpec.schemaVersion !==
      CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION
    )
      issues.push("casimirSpec.schemaVersion is invalid");
    requireSha(value.casimirSpec.semanticSha256, "casimirSpec.semanticSha256", issues);
    requireSha(value.casimirSpec.artifactSha256, "casimirSpec.artifactSha256", issues);
  }
  if (
    exactKeys(
      value.semanticClaim,
      ["claimId", "propositionSha256", "candidateBadgeIds"],
      "semanticClaim",
      issues,
    )
  ) {
    requireStrings(value.semanticClaim, ["claimId"], "semanticClaim", issues);
    requireSha(
      value.semanticClaim.propositionSha256,
      "semanticClaim.propositionSha256",
      issues,
    );
    validateSortedIds(
      value.semanticClaim.candidateBadgeIds,
      "semanticClaim.candidateBadgeIds",
      issues,
    );
  }
  if (
    exactKeys(
      value.formalArtifact,
      [
        "formalArtifactId",
        "sourceAuditArtifactSha256",
        "theoremName",
        "theoremModule",
        "sourceSha256",
        "declarationSha256",
        "propositionSourceSha256",
        "observedTheoremTypeSha256",
        "emitterId",
        "emitterRevisionSha256",
      ],
      "formalArtifact",
      issues,
    )
  ) {
    requireStrings(
      value.formalArtifact,
      ["formalArtifactId", "theoremName", "theoremModule", "emitterId"],
      "formalArtifact",
      issues,
    );
    for (const field of [
      "sourceAuditArtifactSha256",
      "sourceSha256",
      "declarationSha256",
      "propositionSourceSha256",
      "observedTheoremTypeSha256",
      "emitterRevisionSha256",
    ] as const)
      requireSha(value.formalArtifact[field], `formalArtifact.${field}`, issues);
  }
  if (
    exactKeys(
      value.semanticToLeanBinding,
      [
        "bindingId",
        "schemaVersion",
        "artifactSha256",
        "bindingKind",
        "status",
        "claimId",
        "semanticPropositionSha256",
        "formalArtifactId",
        "observedTheoremTypeSha256",
        "reviewerPolicyId",
        "reviewerPolicySha256",
        "limitations",
      ],
      "semanticToLeanBinding",
      issues,
    )
  ) {
    const binding = value.semanticToLeanBinding;
    requireStrings(
      binding,
      ["bindingId", "claimId", "formalArtifactId", "reviewerPolicyId"],
      "semanticToLeanBinding",
      issues,
    );
    if (
      binding.schemaVersion !==
      CASIMIR_SEMANTIC_TO_LEAN_BINDING_SCHEMA_VERSION
    )
      issues.push("semanticToLeanBinding.schemaVersion is invalid");
    for (const field of [
      "artifactSha256",
      "semanticPropositionSha256",
      "observedTheoremTypeSha256",
      "reviewerPolicySha256",
    ] as const)
      requireSha(binding[field], `semanticToLeanBinding.${field}`, issues);
    if (binding.bindingKind !== "reviewed_translation_mapping")
      issues.push("semanticToLeanBinding.bindingKind is invalid");
    if (binding.status !== "reviewed")
      issues.push("semanticToLeanBinding.status is invalid");
    validateSortedIds(binding.limitations, "semanticToLeanBinding.limitations", issues);
    if (
      isRecord(value.semanticClaim) &&
      binding.claimId !== value.semanticClaim.claimId
    )
      issues.push("semantic binding claimId does not match semantic claim");
    if (
      isRecord(value.semanticClaim) &&
      binding.semanticPropositionSha256 !== value.semanticClaim.propositionSha256
    )
      issues.push("semantic binding proposition does not match semantic claim");
    if (
      isRecord(value.formalArtifact) &&
      binding.formalArtifactId !== value.formalArtifact.formalArtifactId
    )
      issues.push("semantic binding formalArtifactId does not match formal artifact");
    if (
      isRecord(value.formalArtifact) &&
      binding.observedTheoremTypeSha256 !==
        value.formalArtifact.observedTheoremTypeSha256
    )
      issues.push("semantic binding theorem type does not match formal artifact");
  }
  if (
    exactKeys(
      value.masterProblem,
      ["schemaVersion", "planId", "artifactSha256"],
      "masterProblem",
      issues,
    )
  ) {
    if (value.masterProblem.schemaVersion !== THEORY_MASTER_PROBLEM_SCHEMA_VERSION)
      issues.push("masterProblem.schemaVersion is invalid");
    requireStrings(value.masterProblem, ["planId"], "masterProblem", issues);
    requireSha(value.masterProblem.artifactSha256, "masterProblem.artifactSha256", issues);
  }
  if (
    exactKeys(
      value.derivationProgram,
      ["schemaVersion", "programId", "sourceMasterProblemPlanId", "artifactSha256"],
      "derivationProgram",
      issues,
    )
  ) {
    if (
      value.derivationProgram.schemaVersion !==
      THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION
    )
      issues.push("derivationProgram.schemaVersion is invalid");
    requireStrings(
      value.derivationProgram,
      ["programId", "sourceMasterProblemPlanId"],
      "derivationProgram",
      issues,
    );
    requireSha(
      value.derivationProgram.artifactSha256,
      "derivationProgram.artifactSha256",
      issues,
    );
    if (
      isRecord(value.masterProblem) &&
      value.derivationProgram.sourceMasterProblemPlanId !== value.masterProblem.planId
    )
      issues.push("derivation program does not bind the master problem");
  }
  if (
    exactKeys(
      value.theoryGraph,
      ["graphId", "snapshotSha256"],
      "theoryGraph",
      issues,
    )
  ) {
    requireStrings(value.theoryGraph, ["graphId"], "theoryGraph", issues);
    requireSha(value.theoryGraph.snapshotSha256, "theoryGraph.snapshotSha256", issues);
  }
  if (!Array.isArray(value.catalogSnapshots)) {
    issues.push("catalogSnapshots must be an array");
  } else {
    const ids: string[] = [];
    value.catalogSnapshots.forEach((entry, index) => {
      if (
        exactKeys(
          entry,
          ["catalogId", "snapshotSha256"],
          `catalogSnapshots[${index}]`,
          issues,
        )
      ) {
        requireStrings(entry, ["catalogId"], `catalogSnapshots[${index}]`, issues);
        requireSha(
          entry.snapshotSha256,
          `catalogSnapshots[${index}].snapshotSha256`,
          issues,
        );
        if (typeof entry.catalogId === "string") ids.push(entry.catalogId);
      }
    });
    if (!sortedUnique(ids))
      issues.push("catalogSnapshots must be sorted by catalogId and unique");
  }
  if (
    exactKeys(
      value.formalEnvironment,
      [
        "prover",
        "environmentPolicyId",
        "environmentPolicySha256",
        "pinnedVersion",
        "kernelBinarySha256",
        "dependencyLockSha256",
        "importClosureSha256",
        "imports",
        "declaredAxiomIds",
        "allowedAxiomIds",
      ],
      "formalEnvironment",
      issues,
    )
  ) {
    const environment = value.formalEnvironment;
    if (environment.prover !== "lean4")
      issues.push("formalEnvironment.prover must be lean4");
    requireStrings(
      environment,
      ["environmentPolicyId", "pinnedVersion"],
      "formalEnvironment",
      issues,
    );
    for (const field of [
      "environmentPolicySha256",
      "kernelBinarySha256",
      "dependencyLockSha256",
      "importClosureSha256",
    ] as const)
      requireSha(environment[field], `formalEnvironment.${field}`, issues);
    if (!Array.isArray(environment.imports)) {
      issues.push("formalEnvironment.imports must be an array");
    } else {
      const modules: string[] = [];
      environment.imports.forEach((entry, index) => {
        if (
          exactKeys(
            entry,
            ["module", "sourceSha256", "objectSha256"],
            `formalEnvironment.imports[${index}]`,
            issues,
          )
        ) {
          requireStrings(entry, ["module"], `formalEnvironment.imports[${index}]`, issues);
          requireSha(entry.sourceSha256, `formalEnvironment.imports[${index}].sourceSha256`, issues);
          requireSha(entry.objectSha256, `formalEnvironment.imports[${index}].objectSha256`, issues);
          if (typeof entry.module === "string") modules.push(entry.module);
        }
      });
      if (!sortedUnique(modules))
        issues.push("formalEnvironment.imports must be sorted and unique");
    }
    const declared = validateSortedIds(
      environment.declaredAxiomIds,
      "formalEnvironment.declaredAxiomIds",
      issues,
    );
    const allowed = new Set(
      validateSortedIds(
        environment.allowedAxiomIds,
        "formalEnvironment.allowedAxiomIds",
        issues,
      ),
    );
    for (const axiom of declared)
      if (!allowed.has(axiom)) issues.push(`declared axiom is not allowed: ${axiom}`);
  }
  if (
    exactKeys(
      value.executionPolicy,
      [
        "replayCount",
        "timeoutMs",
        "maxMemoryBytes",
        "maxOutputBytes",
        "sandboxExecutorCapabilityId",
        "sandboxExecutorCapabilitySha256",
        "networkAllowed",
        "arbitraryCommandAllowed",
        "outerObservedProcessRequired",
        "operatingSystemMemoryLimitRequired",
        "operatingSystemProcessLimitRequired",
        "operatingSystemFilesystemIsolationRequired",
        "operatingSystemNetworkIsolationRequired",
        "hostWorkstationExecutionAllowed",
      ],
      "executionPolicy",
      issues,
    )
  ) {
    const policy = value.executionPolicy;
    if (policy.replayCount !== 2) issues.push("executionPolicy.replayCount must be 2");
    if (!nonEmpty(policy.sandboxExecutorCapabilityId))
      issues.push(
        "executionPolicy.sandboxExecutorCapabilityId must be non-empty",
      );
    requireSha(
      policy.sandboxExecutorCapabilitySha256,
      "executionPolicy.sandboxExecutorCapabilitySha256",
      issues,
    );
    for (const field of ["timeoutMs", "maxMemoryBytes", "maxOutputBytes"] as const)
      if (!Number.isSafeInteger(policy[field]) || Number(policy[field]) <= 0)
        issues.push(`executionPolicy.${field} must be a positive safe integer`);
    if (
      policy.networkAllowed !== false ||
      policy.arbitraryCommandAllowed !== false ||
      policy.outerObservedProcessRequired !== true ||
      policy.operatingSystemMemoryLimitRequired !== true ||
      policy.operatingSystemProcessLimitRequired !== true ||
      policy.operatingSystemFilesystemIsolationRequired !== true ||
      policy.operatingSystemNetworkIsolationRequired !== true ||
      policy.hostWorkstationExecutionAllowed !== false
    )
      issues.push("executionPolicy authority boundary is invalid");
  }
  if (
    exactKeys(
      value.authority,
      [
        "outputRole",
        "executesTools",
        "semanticAndFormalIdentitySeparated",
        "semanticBindingReviewed",
        "validatesScientificTruth",
        "validatesNumericalImplementation",
        "validatesEmpiricalClaim",
        "validatesPhysicalMechanism",
        "assistantAnswer",
        "terminalEligible",
        "postToolModelStepRequired",
      ],
      "authority",
      issues,
    )
  ) {
    const authority = value.authority;
    if (
      authority.outputRole !== "evidence_for_bounded_synthesis" ||
      authority.executesTools !== false ||
      authority.semanticAndFormalIdentitySeparated !== true ||
      authority.semanticBindingReviewed !== true ||
      authority.validatesScientificTruth !== false ||
      authority.validatesNumericalImplementation !== false ||
      authority.validatesEmpiricalClaim !== false ||
      authority.validatesPhysicalMechanism !== false ||
      authority.assistantAnswer !== false ||
      authority.terminalEligible !== false ||
      authority.postToolModelStepRequired !== true
    )
      issues.push("authority boundary is invalid");
  }
  return issues;
}

export async function computeCasimirFormalVerificationRequestV2Sha256(
  value: Omit<CasimirFormalVerificationRequestV2, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirFormalVerificationRequestV2(
  input: BuildCasimirFormalVerificationRequestV2Input,
): Promise<CasimirFormalVerificationRequestV2> {
  const withoutHash: Omit<CasimirFormalVerificationRequestV2, "artifactSha256"> = {
    ...input,
    artifactId: CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_ARTIFACT_ID,
    schemaVersion: CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    authority: {
      outputRole: "evidence_for_bounded_synthesis",
      executesTools: false,
      semanticAndFormalIdentitySeparated: true,
      semanticBindingReviewed: true,
      validatesScientificTruth: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
    },
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirFormalVerificationRequestV2Sha256(withoutHash),
  };
}

export async function validateCasimirFormalVerificationRequestV2Integrity(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirFormalVerificationRequestV2(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } =
    value as unknown as CasimirFormalVerificationRequestV2;
  const expected =
    await computeCasimirFormalVerificationRequestV2Sha256(withoutHash);
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match request content");
  return issues;
}
