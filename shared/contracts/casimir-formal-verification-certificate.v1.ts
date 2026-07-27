import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";
import {
  CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION,
  type CasimirFormalVerificationRequestV1,
} from "./casimir-formal-verification-request.v1";

export const CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_ARTIFACT_ID =
  "casimir_formal_verification_certificate" as const;
export const CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_SCHEMA_VERSION =
  "casimir_formal_verification_certificate/v1" as const;
export const CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_HASH_DOMAIN =
  "casimir-formal-verification-certificate-artifact/v1" as const;

export const CASIMIR_FORMAL_VERIFICATION_STATUSES = [
  "passed",
  "failed",
  "blocked",
  "not_run",
] as const;

export type CasimirFormalVerificationStatusV1 =
  (typeof CASIMIR_FORMAL_VERIFICATION_STATUSES)[number];

export type CasimirFormalVerificationCertificateV1 = {
  artifactId: typeof CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_SCHEMA_VERSION;
  generatedAt: string;
  certificateId: string;
  artifactSha256: string;
  request: {
    schemaVersion: typeof CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION;
    requestId: string;
    artifactSha256: string;
    propositionSha256: string;
    casimirSpec: {
      semanticSha256: string;
      artifactSha256: string;
    };
    masterProblem: {
      planId: string;
      artifactSha256: string;
    };
    derivationProgram: {
      programId: string;
      artifactSha256: string;
    };
    theoryGraph: {
      graphId: string;
      snapshotSha256: string;
    };
  };
  status: CasimirFormalVerificationStatusV1;
  theorem: {
    claimId: string;
    theoremName: string;
    statementSha256: string;
    emittedSourceSha256: string;
  };
  environment: {
    prover: "lean4";
    pinnedVersion: string;
    toolchainPolicySha256: string;
    kernelBinarySha256: string;
    imports: Array<{
      module: string;
      sourceSha256: string;
    }>;
  };
  replay: {
    observationMode: "outer_observed_process";
    requiredReplayCount: 2;
    completedReplayCount: number;
    byteIdentical: boolean;
    aggregateTranscriptSha256: string;
    runs: Array<{
      replayIndex: 1 | 2;
      exitCode: number;
      stdoutSha256: string;
      stderrSha256: string;
      transcriptSha256: string;
      startedAt: string;
      completedAt: string;
    }>;
  };
  axiomAudit: {
    declaredAxiomIds: string[];
    allowedAxiomIds: string[];
    usedAxiomIds: string[];
    hiddenAxiomsDetected: boolean;
    reportSha256: string;
  };
  blockers: Array<{
    code: string;
    message: string;
    evidenceRefs: string[];
  }>;
  authority: {
    outputRole: "evidence_for_bounded_synthesis";
    formalPropositionChecked: boolean;
    validatesSemanticIntent: false;
    validatesTheory: false;
    validatesGeneratedCode: false;
    validatesNumericalImplementation: false;
    validatesEmpiricalClaim: false;
    validatesPhysicalMechanism: false;
    assistantAnswer: false;
    terminalEligible: false;
    promotionAllowed: false;
    postToolModelStepRequired: true;
  };
};

export type BuildCasimirFormalVerificationCertificateV1Input = Omit<
  CasimirFormalVerificationCertificateV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "authority"
> & { generatedAt?: string };

const CERTIFICATE_KEYS = [
  "artifactId",
  "schemaVersion",
  "generatedAt",
  "certificateId",
  "artifactSha256",
  "request",
  "status",
  "theorem",
  "environment",
  "replay",
  "axiomAudit",
  "blockers",
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
const isSortedUnique = (values: string[]): boolean =>
  values.every(
    (value, index) =>
      index === 0 || values[index - 1].localeCompare(value, "en") < 0,
  );
const addExactShapeIssue = (
  value: unknown,
  keys: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  if (!hasExactKeys(value, keys))
    issues.push(`${path} must contain exactly: ${keys.join(", ")}`);
  return true;
};
const validateSha = (value: unknown, path: string, issues: string[]): void => {
  if (!isSha256(value)) issues.push(`${path} must be lowercase SHA-256`);
};
const validateTimestamp = (
  value: unknown,
  path: string,
  issues: string[],
): void => {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    issues.push(`${path} must be an ISO-compatible timestamp`);
  }
};
const validateIdArray = (
  value: unknown,
  path: string,
  issues: string[],
): string[] => {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    issues.push(`${path} must be an array of non-empty strings`);
    return [];
  }
  if (!isSortedUnique(value))
    issues.push(`${path} must be sorted and duplicate-free`);
  return value;
};

export function validateCasimirFormalVerificationCertificateV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!addExactShapeIssue(value, CERTIFICATE_KEYS, "$", issues)) return issues;
  if (
    value.artifactId !== CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_ARTIFACT_ID
  ) {
    issues.push(
      `artifactId must be ${CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_ARTIFACT_ID}`,
    );
  }
  if (
    value.schemaVersion !==
    CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_SCHEMA_VERSION
  ) {
    issues.push(
      `schemaVersion must be ${CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_SCHEMA_VERSION}`,
    );
  }
  validateTimestamp(value.generatedAt, "generatedAt", issues);
  if (!isNonEmptyString(value.certificateId))
    issues.push("certificateId must be non-empty");
  validateSha(value.artifactSha256, "artifactSha256", issues);
  if (
    !CASIMIR_FORMAL_VERIFICATION_STATUSES.includes(
      value.status as CasimirFormalVerificationStatusV1,
    )
  ) {
    issues.push("status is invalid");
  }

  if (
    addExactShapeIssue(
      value.request,
      [
        "schemaVersion",
        "requestId",
        "artifactSha256",
        "propositionSha256",
        "casimirSpec",
        "masterProblem",
        "derivationProgram",
        "theoryGraph",
      ],
      "request",
      issues,
    )
  ) {
    if (
      value.request.schemaVersion !==
      CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION
    ) {
      issues.push(
        `request.schemaVersion must be ${CASIMIR_FORMAL_VERIFICATION_REQUEST_SCHEMA_VERSION}`,
      );
    }
    if (!isNonEmptyString(value.request.requestId))
      issues.push("request.requestId must be non-empty");
    validateSha(value.request.artifactSha256, "request.artifactSha256", issues);
    validateSha(
      value.request.propositionSha256,
      "request.propositionSha256",
      issues,
    );
    if (
      addExactShapeIssue(
        value.request.casimirSpec,
        ["semanticSha256", "artifactSha256"],
        "request.casimirSpec",
        issues,
      )
    ) {
      validateSha(
        value.request.casimirSpec.semanticSha256,
        "request.casimirSpec.semanticSha256",
        issues,
      );
      validateSha(
        value.request.casimirSpec.artifactSha256,
        "request.casimirSpec.artifactSha256",
        issues,
      );
    }
    if (
      addExactShapeIssue(
        value.request.masterProblem,
        ["planId", "artifactSha256"],
        "request.masterProblem",
        issues,
      )
    ) {
      if (!isNonEmptyString(value.request.masterProblem.planId)) {
        issues.push("request.masterProblem.planId must be non-empty");
      }
      validateSha(
        value.request.masterProblem.artifactSha256,
        "request.masterProblem.artifactSha256",
        issues,
      );
    }
    if (
      addExactShapeIssue(
        value.request.derivationProgram,
        ["programId", "artifactSha256"],
        "request.derivationProgram",
        issues,
      )
    ) {
      if (!isNonEmptyString(value.request.derivationProgram.programId)) {
        issues.push("request.derivationProgram.programId must be non-empty");
      }
      validateSha(
        value.request.derivationProgram.artifactSha256,
        "request.derivationProgram.artifactSha256",
        issues,
      );
    }
    if (
      addExactShapeIssue(
        value.request.theoryGraph,
        ["graphId", "snapshotSha256"],
        "request.theoryGraph",
        issues,
      )
    ) {
      if (!isNonEmptyString(value.request.theoryGraph.graphId)) {
        issues.push("request.theoryGraph.graphId must be non-empty");
      }
      validateSha(
        value.request.theoryGraph.snapshotSha256,
        "request.theoryGraph.snapshotSha256",
        issues,
      );
    }
  }

  if (
    addExactShapeIssue(
      value.theorem,
      ["claimId", "theoremName", "statementSha256", "emittedSourceSha256"],
      "theorem",
      issues,
    )
  ) {
    for (const field of ["claimId", "theoremName"] as const) {
      if (!isNonEmptyString(value.theorem[field]))
        issues.push(`theorem.${field} must be non-empty`);
    }
    validateSha(
      value.theorem.statementSha256,
      "theorem.statementSha256",
      issues,
    );
    validateSha(
      value.theorem.emittedSourceSha256,
      "theorem.emittedSourceSha256",
      issues,
    );
    if (
      isRecord(value.request) &&
      isSha256(value.request.propositionSha256) &&
      value.theorem.statementSha256 !== value.request.propositionSha256
    ) {
      issues.push(
        "theorem.statementSha256 must equal request.propositionSha256",
      );
    }
  }

  if (
    addExactShapeIssue(
      value.environment,
      [
        "prover",
        "pinnedVersion",
        "toolchainPolicySha256",
        "kernelBinarySha256",
        "imports",
      ],
      "environment",
      issues,
    )
  ) {
    if (value.environment.prover !== "lean4")
      issues.push("environment.prover must be lean4");
    if (!isNonEmptyString(value.environment.pinnedVersion))
      issues.push("environment.pinnedVersion must be non-empty");
    validateSha(
      value.environment.toolchainPolicySha256,
      "environment.toolchainPolicySha256",
      issues,
    );
    validateSha(
      value.environment.kernelBinarySha256,
      "environment.kernelBinarySha256",
      issues,
    );
    if (!Array.isArray(value.environment.imports)) {
      issues.push("environment.imports must be an array");
    } else {
      const modules: string[] = [];
      value.environment.imports.forEach((entry, index) => {
        const path = `environment.imports[${index}]`;
        if (
          !addExactShapeIssue(entry, ["module", "sourceSha256"], path, issues)
        )
          return;
        if (!isNonEmptyString(entry.module))
          issues.push(`${path}.module must be non-empty`);
        else modules.push(entry.module);
        validateSha(entry.sourceSha256, `${path}.sourceSha256`, issues);
      });
      if (!isSortedUnique(modules))
        issues.push(
          "environment.imports must be sorted by module and duplicate-free",
        );
    }
  }

  if (
    addExactShapeIssue(
      value.replay,
      [
        "observationMode",
        "requiredReplayCount",
        "completedReplayCount",
        "byteIdentical",
        "aggregateTranscriptSha256",
        "runs",
      ],
      "replay",
      issues,
    )
  ) {
    if (value.replay.observationMode !== "outer_observed_process") {
      issues.push("replay.observationMode must be outer_observed_process");
    }
    if (value.replay.requiredReplayCount !== 2)
      issues.push("replay.requiredReplayCount must be 2");
    if (
      !Number.isSafeInteger(value.replay.completedReplayCount) ||
      Number(value.replay.completedReplayCount) < 0 ||
      Number(value.replay.completedReplayCount) > 2
    ) {
      issues.push(
        "replay.completedReplayCount must be an integer from 0 through 2",
      );
    }
    if (typeof value.replay.byteIdentical !== "boolean")
      issues.push("replay.byteIdentical must be boolean");
    validateSha(
      value.replay.aggregateTranscriptSha256,
      "replay.aggregateTranscriptSha256",
      issues,
    );
    if (!Array.isArray(value.replay.runs)) {
      issues.push("replay.runs must be an array");
    } else {
      value.replay.runs.forEach((run, index) => {
        const path = `replay.runs[${index}]`;
        if (
          !addExactShapeIssue(
            run,
            [
              "replayIndex",
              "exitCode",
              "stdoutSha256",
              "stderrSha256",
              "transcriptSha256",
              "startedAt",
              "completedAt",
            ],
            path,
            issues,
          )
        )
          return;
        if (
          run.replayIndex !== index + 1 ||
          ![1, 2].includes(Number(run.replayIndex))
        ) {
          issues.push(`${path}.replayIndex must be ${index + 1}`);
        }
        if (!Number.isSafeInteger(run.exitCode))
          issues.push(`${path}.exitCode must be an integer`);
        validateSha(run.stdoutSha256, `${path}.stdoutSha256`, issues);
        validateSha(run.stderrSha256, `${path}.stderrSha256`, issues);
        validateSha(run.transcriptSha256, `${path}.transcriptSha256`, issues);
        validateTimestamp(run.startedAt, `${path}.startedAt`, issues);
        validateTimestamp(run.completedAt, `${path}.completedAt`, issues);
      });
      if (value.replay.completedReplayCount !== value.replay.runs.length) {
        issues.push(
          "replay.completedReplayCount must equal replay.runs.length",
        );
      }
    }
  }

  let hiddenAxiomsDetected: unknown;
  let usedAxiomIds: string[] = [];
  let allowedAxiomIds: string[] = [];
  if (
    addExactShapeIssue(
      value.axiomAudit,
      [
        "declaredAxiomIds",
        "allowedAxiomIds",
        "usedAxiomIds",
        "hiddenAxiomsDetected",
        "reportSha256",
      ],
      "axiomAudit",
      issues,
    )
  ) {
    const declared = validateIdArray(
      value.axiomAudit.declaredAxiomIds,
      "axiomAudit.declaredAxiomIds",
      issues,
    );
    allowedAxiomIds = validateIdArray(
      value.axiomAudit.allowedAxiomIds,
      "axiomAudit.allowedAxiomIds",
      issues,
    );
    usedAxiomIds = validateIdArray(
      value.axiomAudit.usedAxiomIds,
      "axiomAudit.usedAxiomIds",
      issues,
    );
    hiddenAxiomsDetected = value.axiomAudit.hiddenAxiomsDetected;
    if (typeof hiddenAxiomsDetected !== "boolean")
      issues.push("axiomAudit.hiddenAxiomsDetected must be boolean");
    validateSha(
      value.axiomAudit.reportSha256,
      "axiomAudit.reportSha256",
      issues,
    );
    const allowed = new Set(allowedAxiomIds);
    for (const axiomId of declared) {
      if (!allowed.has(axiomId))
        issues.push(`axiom is not allowed: ${axiomId}`);
    }
    const observedHiddenAxiom = usedAxiomIds.some(
      (axiomId) => !allowed.has(axiomId),
    );
    if (
      typeof hiddenAxiomsDetected === "boolean" &&
      hiddenAxiomsDetected !== observedHiddenAxiom
    ) {
      issues.push(
        "axiomAudit.hiddenAxiomsDetected must exactly reflect used axioms outside the allowlist",
      );
    }
  }

  if (!Array.isArray(value.blockers)) {
    issues.push("blockers must be an array");
  } else {
    value.blockers.forEach((blocker, index) => {
      const path = `blockers[${index}]`;
      if (
        !addExactShapeIssue(
          blocker,
          ["code", "message", "evidenceRefs"],
          path,
          issues,
        )
      )
        return;
      if (!isNonEmptyString(blocker.code))
        issues.push(`${path}.code must be non-empty`);
      if (!isNonEmptyString(blocker.message))
        issues.push(`${path}.message must be non-empty`);
      validateIdArray(blocker.evidenceRefs, `${path}.evidenceRefs`, issues);
    });
  }

  let formalPropositionChecked: unknown;
  if (
    addExactShapeIssue(
      value.authority,
      [
        "outputRole",
        "formalPropositionChecked",
        "validatesSemanticIntent",
        "validatesTheory",
        "validatesGeneratedCode",
        "validatesNumericalImplementation",
        "validatesEmpiricalClaim",
        "validatesPhysicalMechanism",
        "assistantAnswer",
        "terminalEligible",
        "promotionAllowed",
        "postToolModelStepRequired",
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
    formalPropositionChecked = value.authority.formalPropositionChecked;
    if (typeof formalPropositionChecked !== "boolean") {
      issues.push("authority.formalPropositionChecked must be boolean");
    }
    for (const field of [
      "validatesSemanticIntent",
      "validatesTheory",
      "validatesGeneratedCode",
      "validatesNumericalImplementation",
      "validatesEmpiricalClaim",
      "validatesPhysicalMechanism",
      "assistantAnswer",
      "terminalEligible",
      "promotionAllowed",
    ] as const) {
      if (value.authority[field] !== false)
        issues.push(`authority.${field} must be false`);
    }
    if (value.authority.postToolModelStepRequired !== true) {
      issues.push("authority.postToolModelStepRequired must be true");
    }
  }

  const passed = value.status === "passed";
  if (passed) {
    if (!isRecord(value.replay) || value.replay.completedReplayCount !== 2) {
      issues.push("passed status requires two completed replays");
    }
    if (!isRecord(value.replay) || value.replay.byteIdentical !== true) {
      issues.push("passed status requires byte-identical replays");
    }
    if (
      isRecord(value.replay) &&
      Array.isArray(value.replay.runs) &&
      value.replay.runs.some((run) => !isRecord(run) || run.exitCode !== 0)
    ) {
      issues.push("passed status requires every replay exitCode to be 0");
    }
    if (hiddenAxiomsDetected !== false)
      issues.push("passed status requires no hidden axioms");
    if (formalPropositionChecked !== true) {
      issues.push(
        "passed status requires authority.formalPropositionChecked true",
      );
    }
    if (Array.isArray(value.blockers) && value.blockers.length > 0) {
      issues.push("passed status requires no blockers");
    }
    const allowed = new Set(allowedAxiomIds);
    if (usedAxiomIds.some((axiomId) => !allowed.has(axiomId))) {
      issues.push("passed status requires every used axiom to be allowed");
    }
  } else if (formalPropositionChecked !== false) {
    issues.push(
      "non-passed status requires authority.formalPropositionChecked false",
    );
  }
  if (!passed && Array.isArray(value.blockers) && value.blockers.length === 0) {
    issues.push("non-passed status requires at least one blocker");
  }
  return issues;
}

export async function computeCasimirFormalVerificationCertificateSha256V1(
  value: Omit<CasimirFormalVerificationCertificateV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirFormalVerificationCertificateV1(
  input: BuildCasimirFormalVerificationCertificateV1Input,
): Promise<CasimirFormalVerificationCertificateV1> {
  const withoutHash: Omit<
    CasimirFormalVerificationCertificateV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_ARTIFACT_ID,
    schemaVersion: CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    certificateId: input.certificateId,
    request: input.request,
    status: input.status,
    theorem: input.theorem,
    environment: input.environment,
    replay: input.replay,
    axiomAudit: input.axiomAudit,
    blockers: input.blockers,
    authority: {
      outputRole: "evidence_for_bounded_synthesis",
      formalPropositionChecked: input.status === "passed",
      validatesSemanticIntent: false,
      validatesTheory: false,
      validatesGeneratedCode: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
      postToolModelStepRequired: true,
    },
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirFormalVerificationCertificateSha256V1(withoutHash),
  };
}

export async function validateCasimirFormalVerificationCertificateIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirFormalVerificationCertificateV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } = value;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_HASH_DOMAIN,
    value: withoutHash,
  });
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match certificate content");
  return issues;
}

export function validateCasimirFormalVerificationCertificateAgainstRequestV1(
  certificate: CasimirFormalVerificationCertificateV1,
  request: CasimirFormalVerificationRequestV1,
): string[] {
  const issues: string[] = [];
  if (certificate.request.requestId !== request.requestId)
    issues.push("certificate requestId does not match request");
  if (certificate.request.artifactSha256 !== request.artifactSha256) {
    issues.push("certificate request artifactSha256 does not match request");
  }
  if (
    certificate.request.propositionSha256 !== request.claim.propositionSha256
  ) {
    issues.push("certificate propositionSha256 does not match request");
  }
  if (
    certificate.request.casimirSpec.semanticSha256 !==
    request.casimirSpec.semanticSha256
  ) {
    issues.push(
      "certificate Casimir Spec semantic hash does not match request",
    );
  }
  if (
    certificate.request.casimirSpec.artifactSha256 !==
    request.casimirSpec.artifactSha256
  ) {
    issues.push(
      "certificate Casimir Spec artifact hash does not match request",
    );
  }
  if (
    certificate.request.masterProblem.planId !== request.masterProblem.planId
  ) {
    issues.push("certificate Master Problem planId does not match request");
  }
  if (
    certificate.request.masterProblem.artifactSha256 !==
    request.masterProblem.artifactSha256
  ) {
    issues.push(
      "certificate Master Problem artifact hash does not match request",
    );
  }
  if (
    certificate.request.derivationProgram.programId !==
    request.derivationProgram.programId
  ) {
    issues.push("certificate derivation programId does not match request");
  }
  if (
    certificate.request.derivationProgram.artifactSha256 !==
    request.derivationProgram.artifactSha256
  ) {
    issues.push(
      "certificate derivation program artifact hash does not match request",
    );
  }
  if (certificate.request.theoryGraph.graphId !== request.theoryGraph.graphId) {
    issues.push("certificate Theory Graph graphId does not match request");
  }
  if (
    certificate.request.theoryGraph.snapshotSha256 !==
    request.theoryGraph.snapshotSha256
  ) {
    issues.push(
      "certificate Theory Graph snapshot hash does not match request",
    );
  }
  if (certificate.theorem.claimId !== request.claim.claimId)
    issues.push("certificate claimId does not match request");
  if (certificate.theorem.theoremName !== request.formalArtifact.theoremName) {
    issues.push("certificate theoremName does not match request");
  }
  if (
    certificate.theorem.statementSha256 !==
    request.formalArtifact.statementSha256
  ) {
    issues.push("certificate statementSha256 does not match request");
  }
  if (
    certificate.theorem.emittedSourceSha256 !==
    request.formalArtifact.sourceSha256
  ) {
    issues.push("certificate emittedSourceSha256 does not match request");
  }
  if (
    certificate.environment.pinnedVersion !==
    request.formalEnvironment.pinnedVersion
  ) {
    issues.push("certificate pinnedVersion does not match request");
  }
  if (
    certificate.environment.toolchainPolicySha256 !==
    request.formalEnvironment.toolchainPolicySha256
  ) {
    issues.push("certificate toolchainPolicySha256 does not match request");
  }
  if (
    JSON.stringify(certificate.environment.imports) !==
    JSON.stringify(request.formalEnvironment.imports)
  ) {
    issues.push("certificate imports do not match request");
  }
  if (
    JSON.stringify(certificate.axiomAudit.declaredAxiomIds) !==
    JSON.stringify(request.formalEnvironment.declaredAxiomIds)
  ) {
    issues.push("certificate declared axioms do not match request");
  }
  if (
    JSON.stringify(certificate.axiomAudit.allowedAxiomIds) !==
    JSON.stringify(request.formalEnvironment.allowedAxiomIds)
  ) {
    issues.push("certificate allowed axioms do not match request");
  }
  return issues;
}
