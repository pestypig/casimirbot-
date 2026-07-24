import {
  CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION,
  computeCasimirSpecValueSha256V1,
} from "./casimir-spec-scientific-claim-ir.v1";
import { THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION } from "./theory-derivation-program.v1";
import { THEORY_MASTER_PROBLEM_SCHEMA_VERSION } from "./theory-master-problem.v1";

export const CASIMIR_FORMAL_VERIFICATION_REQUEST_ARTIFACT_ID =
  "casimir_formal_verification_request" as const;
export const CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION =
  "casimir_formal_verification_request/v1" as const;
export const CASIMIR_FORMAL_VERIFICATION_REQUEST_HASH_DOMAIN =
  "casimir-formal-verification-request-artifact/v1" as const;

export type CasimirFormalVerificationRequestV1 = {
  artifactId: typeof CASIMIR_FORMAL_VERIFICATION_REQUEST_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION;
  generatedAt: string;
  requestId: string;
  artifactSha256: string;
  casimirSpec: {
    specId: string;
    schemaVersion: typeof CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION;
    semanticSha256: string;
    artifactSha256: string;
  };
  claim: {
    claimId: string;
    propositionSha256: string;
  };
  formalArtifact: {
    theoremName: string;
    theoremModule: string;
    statementSha256: string;
    sourceSha256: string;
    emitterId: string;
    emitterRevisionSha256: string;
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
    toolchainPolicyId: string;
    toolchainPolicySha256: string;
    pinnedVersion: string;
    imports: Array<{
      module: string;
      sourceSha256: string;
    }>;
    declaredAxiomIds: string[];
    allowedAxiomIds: string[];
  };
  executionPolicy: {
    replayCount: 2;
    timeoutMs: number;
    maxMemoryBytes: number;
    maxOutputBytes: number;
    networkAllowed: false;
    arbitraryCommandAllowed: false;
    outerObservedProcessRequired: true;
  };
  authority: {
    outputRole: "evidence_for_bounded_synthesis";
    executesTools: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
    validatesSemanticIntent: false;
    validatesNumericalImplementation: false;
    validatesEmpiricalClaim: false;
    validatesPhysicalMechanism: false;
  };
};

export type BuildCasimirFormalVerificationRequestV1Input = Omit<
  CasimirFormalVerificationRequestV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "authority"
> & {
  generatedAt?: string;
};

const REQUEST_KEYS = [
  "artifactId",
  "schemaVersion",
  "generatedAt",
  "requestId",
  "artifactSha256",
  "casimirSpec",
  "claim",
  "formalArtifact",
  "masterProblem",
  "derivationProgram",
  "theoryGraph",
  "catalogSnapshots",
  "formalEnvironment",
  "executionPolicy",
  "authority",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
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
const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
const isSortedUnique = (values: string[]): boolean =>
  values.every(
    (value, index) =>
      index === 0 || values[index - 1].localeCompare(value, "en") < 0,
  );

function addExactShapeIssue(
  value: unknown,
  keys: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  if (!hasExactKeys(value, keys)) {
    issues.push(`${path} must contain exactly: ${keys.join(", ")}`);
  }
  return true;
}

function validateIdArray(value: unknown, path: string, issues: string[]): void {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    issues.push(`${path} must be an array of non-empty strings`);
    return;
  }
  if (!isSortedUnique(value)) {
    issues.push(`${path} must be sorted and duplicate-free`);
  }
}

export function validateCasimirFormalVerificationRequestV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!addExactShapeIssue(value, REQUEST_KEYS, "$", issues)) return issues;

  if (value.artifactId !== CASIMIR_FORMAL_VERIFICATION_REQUEST_ARTIFACT_ID) {
    issues.push(
      `artifactId must be ${CASIMIR_FORMAL_VERIFICATION_REQUEST_ARTIFACT_ID}`,
    );
  }
  if (
    value.schemaVersion !== CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION
  ) {
    issues.push(
      `schemaVersion must be ${CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION}`,
    );
  }
  for (const field of ["generatedAt", "requestId"] as const) {
    if (!isNonEmptyString(value[field]))
      issues.push(`${field} must be a non-empty string`);
  }
  if (
    typeof value.generatedAt === "string" &&
    Number.isNaN(Date.parse(value.generatedAt))
  ) {
    issues.push("generatedAt must be an ISO-compatible timestamp");
  }
  if (!isSha256(value.artifactSha256))
    issues.push("artifactSha256 must be lowercase SHA-256");

  if (
    addExactShapeIssue(
      value.casimirSpec,
      ["specId", "schemaVersion", "semanticSha256", "artifactSha256"],
      "casimirSpec",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.casimirSpec.specId))
      issues.push("casimirSpec.specId must be non-empty");
    if (
      value.casimirSpec.schemaVersion !==
      CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION
    ) {
      issues.push(
        `casimirSpec.schemaVersion must be ${CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION}`,
      );
    }
    if (!isSha256(value.casimirSpec.semanticSha256))
      issues.push("casimirSpec.semanticSha256 must be lowercase SHA-256");
    if (!isSha256(value.casimirSpec.artifactSha256))
      issues.push("casimirSpec.artifactSha256 must be lowercase SHA-256");
  }

  if (
    addExactShapeIssue(
      value.claim,
      ["claimId", "propositionSha256"],
      "claim",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.claim.claimId))
      issues.push("claim.claimId must be non-empty");
    if (!isSha256(value.claim.propositionSha256))
      issues.push("claim.propositionSha256 must be lowercase SHA-256");
  }

  if (
    addExactShapeIssue(
      value.formalArtifact,
      [
        "theoremName",
        "theoremModule",
        "statementSha256",
        "sourceSha256",
        "emitterId",
        "emitterRevisionSha256",
      ],
      "formalArtifact",
      issues,
    )
  ) {
    for (const field of [
      "theoremName",
      "theoremModule",
      "emitterId",
    ] as const) {
      if (!isNonEmptyString(value.formalArtifact[field])) {
        issues.push(`formalArtifact.${field} must be non-empty`);
      }
    }
    for (const field of [
      "statementSha256",
      "sourceSha256",
      "emitterRevisionSha256",
    ] as const) {
      if (!isSha256(value.formalArtifact[field])) {
        issues.push(`formalArtifact.${field} must be lowercase SHA-256`);
      }
    }
    if (
      isRecord(value.claim) &&
      isSha256(value.claim.propositionSha256) &&
      value.formalArtifact.statementSha256 !== value.claim.propositionSha256
    ) {
      issues.push(
        "formalArtifact.statementSha256 must equal claim.propositionSha256",
      );
    }
  }

  if (
    addExactShapeIssue(
      value.masterProblem,
      ["schemaVersion", "planId", "artifactSha256"],
      "masterProblem",
      issues,
    )
  ) {
    if (
      value.masterProblem.schemaVersion !== THEORY_MASTER_PROBLEM_SCHEMA_VERSION
    ) {
      issues.push(
        `masterProblem.schemaVersion must be ${THEORY_MASTER_PROBLEM_SCHEMA_VERSION}`,
      );
    }
    if (!isNonEmptyString(value.masterProblem.planId))
      issues.push("masterProblem.planId must be non-empty");
    if (!isSha256(value.masterProblem.artifactSha256))
      issues.push("masterProblem.artifactSha256 must be lowercase SHA-256");
  }

  if (
    addExactShapeIssue(
      value.derivationProgram,
      [
        "schemaVersion",
        "programId",
        "sourceMasterProblemPlanId",
        "artifactSha256",
      ],
      "derivationProgram",
      issues,
    )
  ) {
    if (
      value.derivationProgram.schemaVersion !==
      THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION
    ) {
      issues.push(
        `derivationProgram.schemaVersion must be ${THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION}`,
      );
    }
    if (!isNonEmptyString(value.derivationProgram.programId))
      issues.push("derivationProgram.programId must be non-empty");
    if (!isNonEmptyString(value.derivationProgram.sourceMasterProblemPlanId)) {
      issues.push(
        "derivationProgram.sourceMasterProblemPlanId must be non-empty",
      );
    }
    if (!isSha256(value.derivationProgram.artifactSha256)) {
      issues.push("derivationProgram.artifactSha256 must be lowercase SHA-256");
    }
    if (
      isNonEmptyString(value.derivationProgram.sourceMasterProblemPlanId) &&
      isRecord(value.masterProblem) &&
      value.derivationProgram.sourceMasterProblemPlanId !==
        value.masterProblem.planId
    ) {
      issues.push(
        "derivationProgram.sourceMasterProblemPlanId must equal masterProblem.planId",
      );
    }
  }

  if (
    addExactShapeIssue(
      value.theoryGraph,
      ["graphId", "snapshotSha256"],
      "theoryGraph",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.theoryGraph.graphId))
      issues.push("theoryGraph.graphId must be non-empty");
    if (!isSha256(value.theoryGraph.snapshotSha256))
      issues.push("theoryGraph.snapshotSha256 must be lowercase SHA-256");
  }

  if (!Array.isArray(value.catalogSnapshots)) {
    issues.push("catalogSnapshots must be an array");
  } else {
    const ids: string[] = [];
    value.catalogSnapshots.forEach((entry, index) => {
      const path = `catalogSnapshots[${index}]`;
      if (
        !addExactShapeIssue(
          entry,
          ["catalogId", "snapshotSha256"],
          path,
          issues,
        )
      )
        return;
      if (!isNonEmptyString(entry.catalogId))
        issues.push(`${path}.catalogId must be non-empty`);
      else ids.push(entry.catalogId);
      if (!isSha256(entry.snapshotSha256))
        issues.push(`${path}.snapshotSha256 must be lowercase SHA-256`);
    });
    if (!isSortedUnique(ids))
      issues.push(
        "catalogSnapshots must be sorted by catalogId and duplicate-free",
      );
  }

  if (
    addExactShapeIssue(
      value.formalEnvironment,
      [
        "prover",
        "toolchainPolicyId",
        "toolchainPolicySha256",
        "pinnedVersion",
        "imports",
        "declaredAxiomIds",
        "allowedAxiomIds",
      ],
      "formalEnvironment",
      issues,
    )
  ) {
    if (value.formalEnvironment.prover !== "lean4")
      issues.push("formalEnvironment.prover must be lean4");
    for (const field of ["toolchainPolicyId", "pinnedVersion"] as const) {
      if (!isNonEmptyString(value.formalEnvironment[field])) {
        issues.push(`formalEnvironment.${field} must be non-empty`);
      }
    }
    if (!isSha256(value.formalEnvironment.toolchainPolicySha256)) {
      issues.push(
        "formalEnvironment.toolchainPolicySha256 must be lowercase SHA-256",
      );
    }
    if (!Array.isArray(value.formalEnvironment.imports)) {
      issues.push("formalEnvironment.imports must be an array");
    } else {
      const modules: string[] = [];
      value.formalEnvironment.imports.forEach((entry, index) => {
        const path = `formalEnvironment.imports[${index}]`;
        if (
          !addExactShapeIssue(entry, ["module", "sourceSha256"], path, issues)
        )
          return;
        if (!isNonEmptyString(entry.module))
          issues.push(`${path}.module must be non-empty`);
        else modules.push(entry.module);
        if (!isSha256(entry.sourceSha256))
          issues.push(`${path}.sourceSha256 must be lowercase SHA-256`);
      });
      if (!isSortedUnique(modules))
        issues.push(
          "formalEnvironment.imports must be sorted by module and duplicate-free",
        );
    }
    validateIdArray(
      value.formalEnvironment.declaredAxiomIds,
      "formalEnvironment.declaredAxiomIds",
      issues,
    );
    validateIdArray(
      value.formalEnvironment.allowedAxiomIds,
      "formalEnvironment.allowedAxiomIds",
      issues,
    );
    if (
      Array.isArray(value.formalEnvironment.declaredAxiomIds) &&
      Array.isArray(value.formalEnvironment.allowedAxiomIds)
    ) {
      const allowed = new Set(value.formalEnvironment.allowedAxiomIds);
      for (const axiomId of value.formalEnvironment.declaredAxiomIds) {
        if (typeof axiomId === "string" && !allowed.has(axiomId)) {
          issues.push(`declared axiom is not allowed: ${axiomId}`);
        }
      }
    }
  }

  if (
    addExactShapeIssue(
      value.executionPolicy,
      [
        "replayCount",
        "timeoutMs",
        "maxMemoryBytes",
        "maxOutputBytes",
        "networkAllowed",
        "arbitraryCommandAllowed",
        "outerObservedProcessRequired",
      ],
      "executionPolicy",
      issues,
    )
  ) {
    if (value.executionPolicy.replayCount !== 2)
      issues.push("executionPolicy.replayCount must be 2");
    for (const field of [
      "timeoutMs",
      "maxMemoryBytes",
      "maxOutputBytes",
    ] as const) {
      if (!isPositiveInteger(value.executionPolicy[field])) {
        issues.push(`executionPolicy.${field} must be a positive safe integer`);
      }
    }
    if (value.executionPolicy.networkAllowed !== false)
      issues.push("executionPolicy.networkAllowed must be false");
    if (value.executionPolicy.arbitraryCommandAllowed !== false) {
      issues.push("executionPolicy.arbitraryCommandAllowed must be false");
    }
    if (value.executionPolicy.outerObservedProcessRequired !== true) {
      issues.push("executionPolicy.outerObservedProcessRequired must be true");
    }
  }

  if (
    addExactShapeIssue(
      value.authority,
      [
        "outputRole",
        "executesTools",
        "assistantAnswer",
        "terminalEligible",
        "postToolModelStepRequired",
        "validatesSemanticIntent",
        "validatesNumericalImplementation",
        "validatesEmpiricalClaim",
        "validatesPhysicalMechanism",
      ],
      "authority",
      issues,
    )
  ) {
    if (value.authority.outputRole !== "evidence_for_bounded_synthesis") {
      issues.push(
        "authority.outputRole must be evidence_for_bounded_synthesis",
      );
    }
    for (const field of [
      "executesTools",
      "assistantAnswer",
      "terminalEligible",
      "validatesSemanticIntent",
      "validatesNumericalImplementation",
      "validatesEmpiricalClaim",
      "validatesPhysicalMechanism",
    ] as const) {
      if (value.authority[field] !== false)
        issues.push(`authority.${field} must be false`);
    }
    if (value.authority.postToolModelStepRequired !== true) {
      issues.push("authority.postToolModelStepRequired must be true");
    }
  }
  return issues;
}

export async function computeCasimirFormalVerificationRequestSha256V1(
  value: Omit<CasimirFormalVerificationRequestV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_VERIFICATION_REQUEST_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirFormalVerificationRequestV1(
  input: BuildCasimirFormalVerificationRequestV1Input,
): Promise<CasimirFormalVerificationRequestV1> {
  const withoutHash: Omit<
    CasimirFormalVerificationRequestV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_FORMAL_VERIFICATION_REQUEST_ARTIFACT_ID,
    schemaVersion: CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    requestId: input.requestId,
    casimirSpec: input.casimirSpec,
    claim: input.claim,
    formalArtifact: input.formalArtifact,
    masterProblem: input.masterProblem,
    derivationProgram: input.derivationProgram,
    theoryGraph: input.theoryGraph,
    catalogSnapshots: input.catalogSnapshots,
    formalEnvironment: input.formalEnvironment,
    executionPolicy: input.executionPolicy,
    authority: {
      outputRole: "evidence_for_bounded_synthesis",
      executesTools: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
      validatesSemanticIntent: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
    },
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirFormalVerificationRequestSha256V1(withoutHash),
  };
}

export async function validateCasimirFormalVerificationRequestIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirFormalVerificationRequestV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } = value;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_VERIFICATION_REQUEST_HASH_DOMAIN,
    value: withoutHash,
  });
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match request content");
  return issues;
}
