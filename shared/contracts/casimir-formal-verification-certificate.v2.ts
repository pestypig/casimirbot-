import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";
import {
  CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION,
  type CasimirFormalVerificationRequestV2,
} from "./casimir-formal-verification-request.v2";

export const CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_ARTIFACT_ID =
  "casimir_formal_verification_certificate_v2" as const;
export const CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_SCHEMA_VERSION =
  "casimir_formal_verification_certificate/v2" as const;
export const CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_HASH_DOMAIN =
  "casimir-formal-verification-certificate-artifact/v2" as const;

export type CasimirFormalVerificationCertificateV2 = {
  artifactId: typeof CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_SCHEMA_VERSION;
  generatedAt: string;
  certificateId: string;
  artifactSha256: string;
  request: {
    schemaVersion: typeof CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION;
    requestId: string;
    artifactSha256: string;
    semanticPropositionSha256: string;
    candidateBadgeIds: string[];
    observedTheoremTypeSha256: string;
    semanticToLeanBindingSha256: string;
    casimirSpecId: string;
    casimirSpecSemanticSha256: string;
    casimirSpecArtifactSha256: string;
    masterProblemPlanId: string;
    masterProblemArtifactSha256: string;
    derivationProgramId: string;
    derivationProgramArtifactSha256: string;
    graphId: string;
    graphSnapshotSha256: string;
  };
  status: "passed" | "failed" | "blocked" | "not_run";
  theorem: {
    claimId: string;
    formalArtifactId: string;
    sourceAuditArtifactSha256: string;
    theoremName: string;
    theoremModule: string;
    sourceSha256: string;
    declarationSha256: string;
    propositionSourceSha256: string;
    observedTheoremTypeSha256: string;
    emittedSourceSha256: string;
  };
  environment: {
    prover: "lean4";
    pinnedVersion: string;
    environmentPolicySha256: string;
    kernelBinarySha256: string;
    dependencyLockSha256: string;
    importClosureSha256: string;
    imports: Array<{
      module: string;
      sourceSha256: string;
      objectSha256: string;
    }>;
  };
  sandbox: {
    executorCapabilityId: string;
    executorCapabilitySha256: string;
    sandboxPolicySha256: string;
    attestationSha256: string;
    workerId: string;
    memoryLimitBytes: number;
    processLimit: number;
    timeoutMs: number;
    outputLimitBytes: number;
    peakMemoryBytes: number | null;
    outputBytes: number | null;
    oomKilled: boolean;
    timedOut: boolean;
    outputLimitExceeded: boolean;
    operatingSystemMemoryLimitApplied: true;
    operatingSystemProcessLimitApplied: true;
    operatingSystemFilesystemIsolationApplied: true;
    operatingSystemNetworkIsolationApplied: true;
    hostWorkstationExecution: false;
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
    semanticBindingApplied: boolean;
    semanticAndFormalIdentitySeparated: true;
    validatesScientificTruth: false;
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

export type BuildCasimirFormalVerificationCertificateV2Input = Omit<
  CasimirFormalVerificationCertificateV2,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & { generatedAt?: string };

const SHA256 = /^[a-f0-9]{64}$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const sha = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const sortedUnique = (values: string[]): boolean =>
  values.every(
    (entry, index) =>
      index === 0 || values[index - 1].localeCompare(entry, "en") < 0,
  );
const requireExactKeys = (
  value: object,
  keys: readonly string[],
  path: string,
  issues: string[],
): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index])
  )
    issues.push(`${path} must contain exactly: ${keys.join(", ")}`);
};

export function validateCasimirFormalVerificationCertificateV2(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["certificate must be an object"];
  requireExactKeys(
    value,
    [
      "artifactId",
      "schemaVersion",
      "generatedAt",
      "certificateId",
      "artifactSha256",
      "request",
      "status",
      "theorem",
      "environment",
      "sandbox",
      "replay",
      "axiomAudit",
      "blockers",
      "authority",
    ],
    "$",
    issues,
  );
  const certificate = value as unknown as CasimirFormalVerificationCertificateV2;
  if (certificate.artifactId !== CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_ARTIFACT_ID)
    issues.push("artifactId is invalid");
  if (certificate.schemaVersion !== CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_SCHEMA_VERSION)
    issues.push("schemaVersion is invalid");
  if (!nonEmpty(certificate.certificateId)) issues.push("certificateId is invalid");
  if (!nonEmpty(certificate.generatedAt) || Number.isNaN(Date.parse(certificate.generatedAt)))
    issues.push("generatedAt is invalid");
  if (!sha(certificate.artifactSha256)) issues.push("artifactSha256 is invalid");
  if (!["passed", "failed", "blocked", "not_run"].includes(certificate.status))
    issues.push("status is invalid");

  if (!isRecord(certificate.request)) {
    issues.push("request is invalid");
  } else {
    requireExactKeys(
      certificate.request,
      [
        "schemaVersion",
        "requestId",
        "artifactSha256",
        "semanticPropositionSha256",
        "candidateBadgeIds",
        "observedTheoremTypeSha256",
        "semanticToLeanBindingSha256",
        "casimirSpecId",
        "casimirSpecSemanticSha256",
        "casimirSpecArtifactSha256",
        "masterProblemPlanId",
        "masterProblemArtifactSha256",
        "derivationProgramId",
        "derivationProgramArtifactSha256",
        "graphId",
        "graphSnapshotSha256",
      ],
      "request",
      issues,
    );
    if (certificate.request.schemaVersion !== CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION)
      issues.push("request.schemaVersion is invalid");
    if (!nonEmpty(certificate.request.requestId)) issues.push("request.requestId is invalid");
    for (const field of [
      "casimirSpecId",
      "masterProblemPlanId",
      "derivationProgramId",
      "graphId",
    ] as const)
      if (!nonEmpty(certificate.request[field]))
        issues.push(`request.${field} is invalid`);
    if (
      !Array.isArray(certificate.request.candidateBadgeIds) ||
      !certificate.request.candidateBadgeIds.every(nonEmpty) ||
      !sortedUnique(certificate.request.candidateBadgeIds)
    )
      issues.push("request.candidateBadgeIds must be sorted and unique");
    for (const field of [
      "artifactSha256",
      "semanticPropositionSha256",
      "observedTheoremTypeSha256",
      "semanticToLeanBindingSha256",
      "casimirSpecSemanticSha256",
      "casimirSpecArtifactSha256",
      "masterProblemArtifactSha256",
      "derivationProgramArtifactSha256",
      "graphSnapshotSha256",
    ] as const)
      if (!sha(certificate.request[field])) issues.push(`request.${field} is invalid`);
  }
  if (!isRecord(certificate.theorem)) {
    issues.push("theorem is invalid");
  } else {
    requireExactKeys(
      certificate.theorem,
      [
        "claimId",
        "formalArtifactId",
        "sourceAuditArtifactSha256",
        "theoremName",
        "theoremModule",
        "sourceSha256",
        "declarationSha256",
        "propositionSourceSha256",
        "observedTheoremTypeSha256",
        "emittedSourceSha256",
      ],
      "theorem",
      issues,
    );
    for (const field of [
      "claimId",
      "formalArtifactId",
      "theoremName",
      "theoremModule",
    ] as const)
      if (!nonEmpty(certificate.theorem[field])) issues.push(`theorem.${field} is invalid`);
    for (const field of [
      "sourceAuditArtifactSha256",
      "sourceSha256",
      "declarationSha256",
      "propositionSourceSha256",
      "observedTheoremTypeSha256",
      "emittedSourceSha256",
    ] as const)
      if (!sha(certificate.theorem[field])) issues.push(`theorem.${field} is invalid`);
    if (
      isRecord(certificate.request) &&
      certificate.theorem.observedTheoremTypeSha256 !==
        certificate.request.observedTheoremTypeSha256
    )
      issues.push("theorem type does not match request formal identity");
  }
  if (!isRecord(certificate.environment)) {
    issues.push("environment is invalid");
  } else {
    requireExactKeys(
      certificate.environment,
      [
        "prover",
        "pinnedVersion",
        "environmentPolicySha256",
        "kernelBinarySha256",
        "dependencyLockSha256",
        "importClosureSha256",
        "imports",
      ],
      "environment",
      issues,
    );
    if (certificate.environment.prover !== "lean4") issues.push("environment.prover is invalid");
    if (!nonEmpty(certificate.environment.pinnedVersion))
      issues.push("environment.pinnedVersion is invalid");
    for (const field of [
      "environmentPolicySha256",
      "kernelBinarySha256",
      "dependencyLockSha256",
      "importClosureSha256",
    ] as const)
      if (!sha(certificate.environment[field])) issues.push(`environment.${field} is invalid`);
    if (!Array.isArray(certificate.environment.imports)) {
      issues.push("environment.imports is invalid");
    } else {
      const modules: string[] = [];
      for (const entry of certificate.environment.imports) {
        if (isRecord(entry))
          requireExactKeys(
            entry,
            ["module", "sourceSha256", "objectSha256"],
            "environment.imports[]",
            issues,
          );
        if (!nonEmpty(entry.module) || !sha(entry.sourceSha256) || !sha(entry.objectSha256))
          issues.push("environment import is invalid");
        modules.push(entry.module);
      }
      if (!sortedUnique(modules)) issues.push("environment imports must be sorted and unique");
    }
  }
  if (!isRecord(certificate.sandbox)) {
    issues.push("sandbox is invalid");
  } else {
    requireExactKeys(
      certificate.sandbox,
      [
        "executorCapabilityId",
        "executorCapabilitySha256",
        "sandboxPolicySha256",
        "attestationSha256",
        "workerId",
        "memoryLimitBytes",
        "processLimit",
        "timeoutMs",
        "outputLimitBytes",
        "peakMemoryBytes",
        "outputBytes",
        "oomKilled",
        "timedOut",
        "outputLimitExceeded",
        "operatingSystemMemoryLimitApplied",
        "operatingSystemProcessLimitApplied",
        "operatingSystemFilesystemIsolationApplied",
        "operatingSystemNetworkIsolationApplied",
        "hostWorkstationExecution",
      ],
      "sandbox",
      issues,
    );
    if (
      !nonEmpty(certificate.sandbox.executorCapabilityId) ||
      !nonEmpty(certificate.sandbox.workerId)
    )
      issues.push("sandbox identity is invalid");
    for (const field of [
      "executorCapabilitySha256",
      "sandboxPolicySha256",
      "attestationSha256",
    ] as const)
      if (!sha(certificate.sandbox[field]))
        issues.push(`sandbox.${field} is invalid`);
    if (
      !Number.isSafeInteger(certificate.sandbox.memoryLimitBytes) ||
      certificate.sandbox.memoryLimitBytes <= 0 ||
      !Number.isSafeInteger(certificate.sandbox.processLimit) ||
      certificate.sandbox.processLimit <= 0 ||
      !Number.isSafeInteger(certificate.sandbox.timeoutMs) ||
      certificate.sandbox.timeoutMs <= 0 ||
      !Number.isSafeInteger(certificate.sandbox.outputLimitBytes) ||
      certificate.sandbox.outputLimitBytes <= 0 ||
      (certificate.sandbox.peakMemoryBytes !== null &&
        (!Number.isSafeInteger(certificate.sandbox.peakMemoryBytes) ||
          certificate.sandbox.peakMemoryBytes < 0)) ||
      (certificate.sandbox.outputBytes !== null &&
        (!Number.isSafeInteger(certificate.sandbox.outputBytes) ||
          certificate.sandbox.outputBytes < 0)) ||
      typeof certificate.sandbox.oomKilled !== "boolean" ||
      typeof certificate.sandbox.timedOut !== "boolean" ||
      typeof certificate.sandbox.outputLimitExceeded !== "boolean" ||
      certificate.sandbox.operatingSystemMemoryLimitApplied !== true ||
      certificate.sandbox.operatingSystemProcessLimitApplied !== true ||
      certificate.sandbox.operatingSystemFilesystemIsolationApplied !== true ||
      certificate.sandbox.operatingSystemNetworkIsolationApplied !== true ||
      certificate.sandbox.hostWorkstationExecution !== false
    )
      issues.push("sandbox enforcement is invalid");
  }
  if (!isRecord(certificate.replay) || !Array.isArray(certificate.replay.runs)) {
    issues.push("replay is invalid");
  } else {
    requireExactKeys(
      certificate.replay,
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
    );
    if (
      certificate.replay.observationMode !== "outer_observed_process" ||
      certificate.replay.requiredReplayCount !== 2 ||
      !Number.isSafeInteger(certificate.replay.completedReplayCount) ||
      certificate.replay.completedReplayCount < 0 ||
      certificate.replay.completedReplayCount > 2 ||
      !sha(certificate.replay.aggregateTranscriptSha256)
    )
      issues.push("replay summary is invalid");
    const indexes = certificate.replay.runs.map((run) => run.replayIndex);
    if (new Set(indexes).size !== indexes.length) issues.push("replay indexes are duplicated");
    for (const run of certificate.replay.runs) {
      if (isRecord(run))
        requireExactKeys(
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
          "replay.runs[]",
          issues,
        );
      if (
        ![1, 2].includes(run.replayIndex) ||
        !Number.isInteger(run.exitCode) ||
        !sha(run.stdoutSha256) ||
        !sha(run.stderrSha256) ||
        !sha(run.transcriptSha256) ||
        Number.isNaN(Date.parse(run.startedAt)) ||
        Number.isNaN(Date.parse(run.completedAt))
      )
        issues.push(`replay run ${run.replayIndex} is invalid`);
    }
  }
  if (!isRecord(certificate.axiomAudit)) {
    issues.push("axiomAudit is invalid");
  } else {
    requireExactKeys(
      certificate.axiomAudit,
      [
        "declaredAxiomIds",
        "allowedAxiomIds",
        "usedAxiomIds",
        "hiddenAxiomsDetected",
        "reportSha256",
      ],
      "axiomAudit",
      issues,
    );
    const validAxiomArrays = ["declaredAxiomIds", "allowedAxiomIds", "usedAxiomIds"].every(
      (field) => Array.isArray(certificate.axiomAudit[field as keyof typeof certificate.axiomAudit]),
    );
    for (const field of ["declaredAxiomIds", "allowedAxiomIds", "usedAxiomIds"] as const) {
      const values = certificate.axiomAudit[field];
      if (!Array.isArray(values) || !values.every(nonEmpty) || !sortedUnique(values))
        issues.push(`axiomAudit.${field} must be sorted and unique`);
    }
    if (!sha(certificate.axiomAudit.reportSha256)) issues.push("axiomAudit.reportSha256 is invalid");
    if (validAxiomArrays) {
      const allowed = new Set(certificate.axiomAudit.allowedAxiomIds);
      for (const used of certificate.axiomAudit.usedAxiomIds)
        if (!allowed.has(used)) issues.push(`used axiom is not allowed: ${used}`);
    }
  }
  if (!Array.isArray(certificate.blockers)) {
    issues.push("blockers is invalid");
  } else {
    for (const blocker of certificate.blockers) {
      if (isRecord(blocker))
        requireExactKeys(
          blocker,
          ["code", "message", "evidenceRefs"],
          "blockers[]",
          issues,
        );
      if (
        !nonEmpty(blocker.code) ||
        !nonEmpty(blocker.message) ||
        !Array.isArray(blocker.evidenceRefs) ||
        !blocker.evidenceRefs.every(nonEmpty)
      )
        issues.push("blocker is invalid");
    }
  }
  const authority = certificate.authority;
  if (isRecord(authority))
    requireExactKeys(
      authority,
      [
        "outputRole",
        "formalPropositionChecked",
        "semanticBindingApplied",
        "semanticAndFormalIdentitySeparated",
        "validatesScientificTruth",
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
    );
  if (
    !isRecord(authority) ||
    authority.outputRole !== "evidence_for_bounded_synthesis" ||
    typeof authority.formalPropositionChecked !== "boolean" ||
    typeof authority.semanticBindingApplied !== "boolean" ||
    authority.semanticAndFormalIdentitySeparated !== true ||
    authority.validatesScientificTruth !== false ||
    authority.validatesTheory !== false ||
    authority.validatesGeneratedCode !== false ||
    authority.validatesNumericalImplementation !== false ||
    authority.validatesEmpiricalClaim !== false ||
    authority.validatesPhysicalMechanism !== false ||
    authority.assistantAnswer !== false ||
    authority.terminalEligible !== false ||
    authority.promotionAllowed !== false ||
    authority.postToolModelStepRequired !== true
  )
    issues.push("authority boundary is invalid");

  if (certificate.status === "passed") {
    if (
      !isRecord(certificate.replay) ||
      !Array.isArray(certificate.replay.runs) ||
      certificate.replay.completedReplayCount !== 2 ||
      certificate.replay.runs.length !== 2 ||
      certificate.replay.runs.some((run) => run.exitCode !== 0) ||
      certificate.replay.byteIdentical !== true ||
      !isRecord(certificate.sandbox) ||
      certificate.sandbox.oomKilled !== false ||
      certificate.sandbox.timedOut !== false ||
      certificate.sandbox.outputLimitExceeded !== false ||
      certificate.sandbox.peakMemoryBytes === null ||
      certificate.sandbox.peakMemoryBytes >
        certificate.sandbox.memoryLimitBytes ||
      certificate.sandbox.outputBytes === null ||
      certificate.sandbox.outputBytes >
        certificate.sandbox.outputLimitBytes ||
      !isRecord(certificate.axiomAudit) ||
      certificate.axiomAudit.hiddenAxiomsDetected !== false ||
      !Array.isArray(certificate.blockers) ||
      certificate.blockers.length !== 0 ||
      !isRecord(certificate.authority) ||
      certificate.authority.formalPropositionChecked !== true ||
      certificate.authority.semanticBindingApplied !== true
    )
      issues.push("passed certificate is not closed");
  } else if (certificate.authority?.formalPropositionChecked !== false) {
    issues.push("non-passed certificate cannot claim formal proposition checked");
  }
  return issues;
}

export async function computeCasimirFormalVerificationCertificateV2Sha256(
  value: Omit<CasimirFormalVerificationCertificateV2, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirFormalVerificationCertificateV2(
  input: BuildCasimirFormalVerificationCertificateV2Input,
): Promise<CasimirFormalVerificationCertificateV2> {
  const passed = input.status === "passed";
  const withoutHash: Omit<
    CasimirFormalVerificationCertificateV2,
    "artifactSha256"
  > = {
    ...input,
    artifactId: CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_ARTIFACT_ID,
    schemaVersion: CASIMIR_FORMAL_VERIFICATION_CERTIFICATE_V2_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    authority: {
      outputRole: "evidence_for_bounded_synthesis",
      formalPropositionChecked: passed,
      semanticBindingApplied: passed,
      semanticAndFormalIdentitySeparated: true,
      validatesScientificTruth: false,
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
      await computeCasimirFormalVerificationCertificateV2Sha256(withoutHash),
  };
}

export async function validateCasimirFormalVerificationCertificateV2Integrity(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirFormalVerificationCertificateV2(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } =
    value as unknown as CasimirFormalVerificationCertificateV2;
  const expected =
    await computeCasimirFormalVerificationCertificateV2Sha256(withoutHash);
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match certificate content");
  return issues;
}

export async function validateCasimirFormalVerificationCertificateV2AgainstRequest(
  certificate: CasimirFormalVerificationCertificateV2,
  request: CasimirFormalVerificationRequestV2,
): Promise<string[]> {
  const issues = [
    ...(await validateCasimirFormalVerificationCertificateV2Integrity(certificate)),
  ];
  if (certificate.request.requestId !== request.requestId)
    issues.push("certificate requestId does not match request");
  if (certificate.request.artifactSha256 !== request.artifactSha256)
    issues.push("certificate request hash does not match request");
  if (
    certificate.request.semanticPropositionSha256 !==
    request.semanticClaim.propositionSha256
  )
    issues.push("certificate semantic proposition does not match request");
  if (
    JSON.stringify(certificate.request.candidateBadgeIds) !==
    JSON.stringify(request.semanticClaim.candidateBadgeIds)
  )
    issues.push("certificate candidate badges do not match request");
  if (
    certificate.request.observedTheoremTypeSha256 !==
    request.formalArtifact.observedTheoremTypeSha256
  )
    issues.push("certificate observed theorem type does not match request");
  if (
    certificate.request.semanticToLeanBindingSha256 !==
    request.semanticToLeanBinding.artifactSha256
  )
    issues.push("certificate semantic binding does not match request");
  if (
    certificate.request.casimirSpecId !== request.casimirSpec.specId ||
    certificate.request.casimirSpecSemanticSha256 !==
      request.casimirSpec.semanticSha256 ||
    certificate.request.casimirSpecArtifactSha256 !==
      request.casimirSpec.artifactSha256
  )
    issues.push("certificate Casimir Spec identity does not match request");
  if (
    certificate.request.masterProblemPlanId !==
      request.masterProblem.planId ||
    certificate.request.masterProblemArtifactSha256 !==
      request.masterProblem.artifactSha256 ||
    certificate.request.derivationProgramId !==
      request.derivationProgram.programId ||
    certificate.request.derivationProgramArtifactSha256 !==
      request.derivationProgram.artifactSha256
  )
    issues.push("certificate procedure program lineage does not match request");
  if (
    certificate.request.graphId !== request.theoryGraph.graphId ||
    certificate.request.graphSnapshotSha256 !==
      request.theoryGraph.snapshotSha256
  )
    issues.push("certificate theory graph identity does not match request");
  if (certificate.theorem.claimId !== request.semanticClaim.claimId)
    issues.push("certificate claimId does not match request");
  if (
    certificate.theorem.formalArtifactId !==
      request.formalArtifact.formalArtifactId ||
    certificate.theorem.sourceAuditArtifactSha256 !==
      request.formalArtifact.sourceAuditArtifactSha256 ||
    certificate.theorem.theoremName !==
      request.formalArtifact.theoremName ||
    certificate.theorem.theoremModule !==
      request.formalArtifact.theoremModule ||
    certificate.theorem.sourceSha256 !== request.formalArtifact.sourceSha256 ||
    certificate.theorem.declarationSha256 !==
      request.formalArtifact.declarationSha256 ||
    certificate.theorem.propositionSourceSha256 !==
      request.formalArtifact.propositionSourceSha256 ||
    certificate.theorem.emittedSourceSha256 !==
      request.formalArtifact.sourceSha256
  )
    issues.push("certificate formal artifact identity does not match request");
  if (
    certificate.environment.prover !== request.formalEnvironment.prover ||
    certificate.environment.pinnedVersion !==
      request.formalEnvironment.pinnedVersion ||
    certificate.environment.environmentPolicySha256 !==
      request.formalEnvironment.environmentPolicySha256 ||
    certificate.environment.kernelBinarySha256 !==
      request.formalEnvironment.kernelBinarySha256 ||
    certificate.environment.dependencyLockSha256 !==
      request.formalEnvironment.dependencyLockSha256 ||
    certificate.environment.importClosureSha256 !==
      request.formalEnvironment.importClosureSha256 ||
    JSON.stringify(certificate.environment.imports) !==
      JSON.stringify(request.formalEnvironment.imports)
  )
    issues.push("certificate formal environment does not match request");
  if (
    certificate.sandbox.executorCapabilityId !==
      request.executionPolicy.sandboxExecutorCapabilityId ||
    certificate.sandbox.executorCapabilitySha256 !==
      request.executionPolicy.sandboxExecutorCapabilitySha256 ||
    certificate.sandbox.memoryLimitBytes !==
      request.executionPolicy.maxMemoryBytes ||
    certificate.sandbox.timeoutMs !==
      request.executionPolicy.timeoutMs ||
    certificate.sandbox.outputLimitBytes !==
      request.executionPolicy.maxOutputBytes ||
    certificate.sandbox.hostWorkstationExecution !== false
  )
    issues.push("certificate sandbox does not match request");
  if (
    certificate.replay.requiredReplayCount !==
    request.executionPolicy.replayCount
  )
    issues.push("certificate replay policy does not match request");
  if (
    JSON.stringify(certificate.axiomAudit.declaredAxiomIds) !==
      JSON.stringify(request.formalEnvironment.declaredAxiomIds) ||
    JSON.stringify(certificate.axiomAudit.allowedAxiomIds) !==
      JSON.stringify(request.formalEnvironment.allowedAxiomIds)
  )
    issues.push("certificate axiom policy does not match request");
  return issues;
}
