import {
  CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION,
  computeCasimirSpecValueSha256V1,
} from "./casimir-spec-scientific-claim-ir.v1";
import { THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION } from "./theory-derivation-program.v1";
import { THEORY_MASTER_PROBLEM_SCHEMA_VERSION } from "./theory-master-problem.v1";

export const CASIMIR_ARTIFACT_GENERATION_REQUEST_ARTIFACT_ID =
  "casimir_artifact_generation_request" as const;
export const CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION =
  "casimir_artifact_generation_request/v1" as const;
export const CASIMIR_ARTIFACT_GENERATION_REQUEST_HASH_DOMAIN =
  "casimir-artifact-generation-request/v1" as const;

export const CASIMIR_ARTIFACT_GENERATION_RECEIPT_ARTIFACT_ID =
  "casimir_artifact_generation_receipt" as const;
export const CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION =
  "casimir_artifact_generation_receipt/v1" as const;
export const CASIMIR_ARTIFACT_GENERATION_RECEIPT_HASH_DOMAIN =
  "casimir-artifact-generation-receipt/v1" as const;

export const CASIMIR_GENERATED_ARTIFACT_ROLES = [
  "formal_source",
  "implementation_source",
  "numerical_case",
  "build_manifest",
] as const;
export type CasimirGeneratedArtifactRoleV1 =
  (typeof CASIMIR_GENERATED_ARTIFACT_ROLES)[number];

export const CASIMIR_ARTIFACT_GENERATION_RECEIPT_STATUSES = [
  "succeeded",
  "failed",
  "blocked",
] as const;
export type CasimirArtifactGenerationReceiptStatusV1 =
  (typeof CASIMIR_ARTIFACT_GENERATION_RECEIPT_STATUSES)[number];

type CasimirArtifactGenerationAuthorityV1 = {
  outputRole: "evidence_for_bounded_synthesis";
  artifactBytesProduced: boolean;
  providerOutputTrusted: false;
  formalPropositionChecked: false;
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

export type CasimirArtifactGenerationRequestV1 = {
  artifactId: typeof CASIMIR_ARTIFACT_GENERATION_REQUEST_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION;
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
  sourcePacket: {
    packetId: string;
    mediaType: string;
    artifactSha256: string;
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
  producerPolicy: {
    adapterContractId: string;
    adapterContractSha256: string;
    allowedProducerIds: string[];
    immutableRepositoryPinRequired: true;
    outputHashRequired: true;
    providerOutputTrusted: false;
  };
  requestedArtifacts: Array<{
    artifactId: string;
    role: CasimirGeneratedArtifactRoleV1;
    mediaType: string;
  }>;
  authority: Omit<
    CasimirArtifactGenerationAuthorityV1,
    "artifactBytesProduced"
  > & {
    artifactBytesProduced: false;
  };
};

export type CasimirArtifactGenerationReceiptV1 = {
  artifactId: typeof CASIMIR_ARTIFACT_GENERATION_RECEIPT_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION;
  generatedAt: string;
  receiptId: string;
  artifactSha256: string;
  request: {
    schemaVersion: typeof CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION;
    requestId: string;
    artifactSha256: string;
    casimirSpecSemanticSha256: string;
    casimirSpecArtifactSha256: string;
    claimId: string;
    propositionSha256: string;
  };
  producer: {
    producerId: string;
    adapterId: string;
    adapterRevisionSha256: string;
    upstreamRepository: {
      uri: string;
      commitSha: string;
      sourceTreeSha256: string;
    };
  };
  run: {
    status: CasimirArtifactGenerationReceiptStatusV1;
    startedAt: string;
    completedAt: string;
    transcriptSha256: string;
    environmentSha256: string;
  };
  artifacts: Array<{
    artifactId: string;
    role: CasimirGeneratedArtifactRoleV1;
    mediaType: string;
    logicalPath: string;
    artifactSha256: string;
    sizeBytes: number;
    derivedFromSha256s: string[];
  }>;
  blockers: Array<{
    code: string;
    message: string;
    evidenceRefs: string[];
  }>;
  authority: CasimirArtifactGenerationAuthorityV1;
};

export type BuildCasimirArtifactGenerationRequestV1Input = Omit<
  CasimirArtifactGenerationRequestV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & { generatedAt?: string };

export type BuildCasimirArtifactGenerationReceiptV1Input = Omit<
  CasimirArtifactGenerationReceiptV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & { generatedAt?: string };

const REQUEST_KEYS = [
  "artifactId",
  "schemaVersion",
  "generatedAt",
  "requestId",
  "artifactSha256",
  "casimirSpec",
  "claim",
  "sourcePacket",
  "masterProblem",
  "derivationProgram",
  "producerPolicy",
  "requestedArtifacts",
  "authority",
] as const;

const RECEIPT_KEYS = [
  "artifactId",
  "schemaVersion",
  "generatedAt",
  "receiptId",
  "artifactSha256",
  "request",
  "producer",
  "run",
  "artifacts",
  "blockers",
  "authority",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isCommitSha = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
const isSortedUnique = (values: string[]): boolean =>
  values.every(
    (value, index) =>
      index === 0 || values[index - 1].localeCompare(value, "en") < 0,
  );
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

function exactObject(
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

function timestamp(value: unknown, path: string, issues: string[]): void {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    issues.push(`${path} must be an ISO-compatible timestamp`);
  }
}

function sha(value: unknown, path: string, issues: string[]): void {
  if (!isSha256(value)) issues.push(`${path} must be lowercase SHA-256`);
}

function sortedStrings(
  value: unknown,
  path: string,
  issues: string[],
): string[] {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    issues.push(`${path} must be an array of non-empty strings`);
    return [];
  }
  if (!isSortedUnique(value)) {
    issues.push(`${path} must be sorted and duplicate-free`);
  }
  return value;
}

function validateLockedAuthority(
  value: unknown,
  artifactBytesProduced: boolean,
  path: string,
  issues: string[],
): void {
  if (
    !exactObject(
      value,
      [
        "outputRole",
        "artifactBytesProduced",
        "providerOutputTrusted",
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
      path,
      issues,
    )
  ) {
    return;
  }
  if (value.outputRole !== "evidence_for_bounded_synthesis") {
    issues.push(`${path}.outputRole must be evidence_for_bounded_synthesis`);
  }
  if (value.artifactBytesProduced !== artifactBytesProduced) {
    issues.push(
      `${path}.artifactBytesProduced must be ${String(artifactBytesProduced)}`,
    );
  }
  for (const field of [
    "providerOutputTrusted",
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
  ] as const) {
    if (value[field] !== false) issues.push(`${path}.${field} must be false`);
  }
  if (value.postToolModelStepRequired !== true) {
    issues.push(`${path}.postToolModelStepRequired must be true`);
  }
}

function validateCasimirSpecBinding(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (
    !exactObject(
      value,
      ["specId", "schemaVersion", "semanticSha256", "artifactSha256"],
      path,
      issues,
    )
  ) {
    return;
  }
  if (!isNonEmptyString(value.specId))
    issues.push(`${path}.specId must be non-empty`);
  if (
    value.schemaVersion !== CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION
  ) {
    issues.push(
      `${path}.schemaVersion must be ${CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION}`,
    );
  }
  sha(value.semanticSha256, `${path}.semanticSha256`, issues);
  sha(value.artifactSha256, `${path}.artifactSha256`, issues);
}

function validateClaimBinding(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (!exactObject(value, ["claimId", "propositionSha256"], path, issues))
    return;
  if (!isNonEmptyString(value.claimId))
    issues.push(`${path}.claimId must be non-empty`);
  sha(value.propositionSha256, `${path}.propositionSha256`, issues);
}

function validateRequestedArtifacts(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(`${path} must be a non-empty array`);
    return;
  }
  const ids: string[] = [];
  value.forEach((entry, index) => {
    const itemPath = `${path}[${index}]`;
    if (
      !exactObject(entry, ["artifactId", "role", "mediaType"], itemPath, issues)
    )
      return;
    if (!isNonEmptyString(entry.artifactId))
      issues.push(`${itemPath}.artifactId must be non-empty`);
    else ids.push(entry.artifactId);
    if (
      !CASIMIR_GENERATED_ARTIFACT_ROLES.includes(
        entry.role as CasimirGeneratedArtifactRoleV1,
      )
    ) {
      issues.push(`${itemPath}.role is invalid`);
    }
    if (!isNonEmptyString(entry.mediaType))
      issues.push(`${itemPath}.mediaType must be non-empty`);
  });
  if (!isSortedUnique(ids)) {
    issues.push(`${path} must be sorted by artifactId and duplicate-free`);
  }
}

export function validateCasimirArtifactGenerationRequestV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!exactObject(value, REQUEST_KEYS, "$", issues)) return issues;
  if (value.artifactId !== CASIMIR_ARTIFACT_GENERATION_REQUEST_ARTIFACT_ID) {
    issues.push(
      `artifactId must be ${CASIMIR_ARTIFACT_GENERATION_REQUEST_ARTIFACT_ID}`,
    );
  }
  if (
    value.schemaVersion !== CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION
  ) {
    issues.push(
      `schemaVersion must be ${CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION}`,
    );
  }
  timestamp(value.generatedAt, "generatedAt", issues);
  if (!isNonEmptyString(value.requestId))
    issues.push("requestId must be non-empty");
  sha(value.artifactSha256, "artifactSha256", issues);
  validateCasimirSpecBinding(value.casimirSpec, "casimirSpec", issues);
  validateClaimBinding(value.claim, "claim", issues);

  if (
    exactObject(
      value.sourcePacket,
      ["packetId", "mediaType", "artifactSha256"],
      "sourcePacket",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.sourcePacket.packetId))
      issues.push("sourcePacket.packetId must be non-empty");
    if (!isNonEmptyString(value.sourcePacket.mediaType))
      issues.push("sourcePacket.mediaType must be non-empty");
    sha(
      value.sourcePacket.artifactSha256,
      "sourcePacket.artifactSha256",
      issues,
    );
  }

  if (
    exactObject(
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
    sha(
      value.masterProblem.artifactSha256,
      "masterProblem.artifactSha256",
      issues,
    );
  }

  if (
    exactObject(
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
    sha(
      value.derivationProgram.artifactSha256,
      "derivationProgram.artifactSha256",
      issues,
    );
    if (
      isRecord(value.masterProblem) &&
      isNonEmptyString(value.masterProblem.planId) &&
      value.derivationProgram.sourceMasterProblemPlanId !==
        value.masterProblem.planId
    ) {
      issues.push(
        "derivationProgram.sourceMasterProblemPlanId must equal masterProblem.planId",
      );
    }
  }

  if (
    exactObject(
      value.producerPolicy,
      [
        "adapterContractId",
        "adapterContractSha256",
        "allowedProducerIds",
        "immutableRepositoryPinRequired",
        "outputHashRequired",
        "providerOutputTrusted",
      ],
      "producerPolicy",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.producerPolicy.adapterContractId))
      issues.push("producerPolicy.adapterContractId must be non-empty");
    sha(
      value.producerPolicy.adapterContractSha256,
      "producerPolicy.adapterContractSha256",
      issues,
    );
    const producerIds = sortedStrings(
      value.producerPolicy.allowedProducerIds,
      "producerPolicy.allowedProducerIds",
      issues,
    );
    if (producerIds.length === 0)
      issues.push("producerPolicy.allowedProducerIds must be non-empty");
    if (value.producerPolicy.immutableRepositoryPinRequired !== true) {
      issues.push(
        "producerPolicy.immutableRepositoryPinRequired must be true",
      );
    }
    if (value.producerPolicy.outputHashRequired !== true)
      issues.push("producerPolicy.outputHashRequired must be true");
    if (value.producerPolicy.providerOutputTrusted !== false)
      issues.push("producerPolicy.providerOutputTrusted must be false");
  }

  validateRequestedArtifacts(
    value.requestedArtifacts,
    "requestedArtifacts",
    issues,
  );
  validateLockedAuthority(value.authority, false, "authority", issues);
  return issues;
}

function validateReceiptArtifacts(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array`);
    return;
  }
  const ids: string[] = [];
  value.forEach((entry, index) => {
    const itemPath = `${path}[${index}]`;
    if (
      !exactObject(
        entry,
        [
          "artifactId",
          "role",
          "mediaType",
          "logicalPath",
          "artifactSha256",
          "sizeBytes",
          "derivedFromSha256s",
        ],
        itemPath,
        issues,
      )
    )
      return;
    if (!isNonEmptyString(entry.artifactId))
      issues.push(`${itemPath}.artifactId must be non-empty`);
    else ids.push(entry.artifactId);
    if (
      !CASIMIR_GENERATED_ARTIFACT_ROLES.includes(
        entry.role as CasimirGeneratedArtifactRoleV1,
      )
    ) {
      issues.push(`${itemPath}.role is invalid`);
    }
    if (!isNonEmptyString(entry.mediaType))
      issues.push(`${itemPath}.mediaType must be non-empty`);
    if (!isNonEmptyString(entry.logicalPath))
      issues.push(`${itemPath}.logicalPath must be non-empty`);
    else if (
      entry.logicalPath.startsWith("/") ||
      /^[a-zA-Z]:[\\/]/.test(entry.logicalPath) ||
      entry.logicalPath.split(/[\\/]/).includes("..")
    ) {
      issues.push(`${itemPath}.logicalPath must be a safe relative path`);
    }
    sha(entry.artifactSha256, `${itemPath}.artifactSha256`, issues);
    if (!isPositiveInteger(entry.sizeBytes))
      issues.push(`${itemPath}.sizeBytes must be a positive safe integer`);
    sortedStrings(
      entry.derivedFromSha256s,
      `${itemPath}.derivedFromSha256s`,
      issues,
    ).forEach((item, sourceIndex) =>
      sha(
        item,
        `${itemPath}.derivedFromSha256s[${sourceIndex}]`,
        issues,
      ),
    );
  });
  if (!isSortedUnique(ids)) {
    issues.push(`${path} must be sorted by artifactId and duplicate-free`);
  }
}

function validateBlockers(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array`);
    return;
  }
  const codes: string[] = [];
  value.forEach((entry, index) => {
    const itemPath = `${path}[${index}]`;
    if (
      !exactObject(
        entry,
        ["code", "message", "evidenceRefs"],
        itemPath,
        issues,
      )
    )
      return;
    if (!isNonEmptyString(entry.code))
      issues.push(`${itemPath}.code must be non-empty`);
    else codes.push(entry.code);
    if (!isNonEmptyString(entry.message))
      issues.push(`${itemPath}.message must be non-empty`);
    sortedStrings(entry.evidenceRefs, `${itemPath}.evidenceRefs`, issues);
  });
  if (!isSortedUnique(codes)) {
    issues.push(`${path} must be sorted by code and duplicate-free`);
  }
}

export function validateCasimirArtifactGenerationReceiptV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!exactObject(value, RECEIPT_KEYS, "$", issues)) return issues;
  if (value.artifactId !== CASIMIR_ARTIFACT_GENERATION_RECEIPT_ARTIFACT_ID) {
    issues.push(
      `artifactId must be ${CASIMIR_ARTIFACT_GENERATION_RECEIPT_ARTIFACT_ID}`,
    );
  }
  if (
    value.schemaVersion !== CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION
  ) {
    issues.push(
      `schemaVersion must be ${CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION}`,
    );
  }
  timestamp(value.generatedAt, "generatedAt", issues);
  if (!isNonEmptyString(value.receiptId))
    issues.push("receiptId must be non-empty");
  sha(value.artifactSha256, "artifactSha256", issues);

  if (
    exactObject(
      value.request,
      [
        "schemaVersion",
        "requestId",
        "artifactSha256",
        "casimirSpecSemanticSha256",
        "casimirSpecArtifactSha256",
        "claimId",
        "propositionSha256",
      ],
      "request",
      issues,
    )
  ) {
    if (
      value.request.schemaVersion !==
      CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION
    ) {
      issues.push(
        `request.schemaVersion must be ${CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION}`,
      );
    }
    for (const field of ["requestId", "claimId"] as const) {
      if (!isNonEmptyString(value.request[field]))
        issues.push(`request.${field} must be non-empty`);
    }
    for (const field of [
      "artifactSha256",
      "casimirSpecSemanticSha256",
      "casimirSpecArtifactSha256",
      "propositionSha256",
    ] as const) {
      sha(value.request[field], `request.${field}`, issues);
    }
  }

  if (
    exactObject(
      value.producer,
      [
        "producerId",
        "adapterId",
        "adapterRevisionSha256",
        "upstreamRepository",
      ],
      "producer",
      issues,
    )
  ) {
    for (const field of ["producerId", "adapterId"] as const) {
      if (!isNonEmptyString(value.producer[field]))
        issues.push(`producer.${field} must be non-empty`);
    }
    sha(
      value.producer.adapterRevisionSha256,
      "producer.adapterRevisionSha256",
      issues,
    );
    if (
      exactObject(
        value.producer.upstreamRepository,
        ["uri", "commitSha", "sourceTreeSha256"],
        "producer.upstreamRepository",
        issues,
      )
    ) {
      if (!isNonEmptyString(value.producer.upstreamRepository.uri))
        issues.push("producer.upstreamRepository.uri must be non-empty");
      if (!isCommitSha(value.producer.upstreamRepository.commitSha)) {
        issues.push(
          "producer.upstreamRepository.commitSha must be lowercase 40-character Git SHA",
        );
      }
      sha(
        value.producer.upstreamRepository.sourceTreeSha256,
        "producer.upstreamRepository.sourceTreeSha256",
        issues,
      );
    }
  }

  let status: unknown;
  if (
    exactObject(
      value.run,
      [
        "status",
        "startedAt",
        "completedAt",
        "transcriptSha256",
        "environmentSha256",
      ],
      "run",
      issues,
    )
  ) {
    status = value.run.status;
    if (
      !CASIMIR_ARTIFACT_GENERATION_RECEIPT_STATUSES.includes(
        status as CasimirArtifactGenerationReceiptStatusV1,
      )
    ) {
      issues.push("run.status is invalid");
    }
    timestamp(value.run.startedAt, "run.startedAt", issues);
    timestamp(value.run.completedAt, "run.completedAt", issues);
    if (
      isNonEmptyString(value.run.startedAt) &&
      isNonEmptyString(value.run.completedAt) &&
      Date.parse(value.run.completedAt) < Date.parse(value.run.startedAt)
    ) {
      issues.push("run.completedAt must not precede run.startedAt");
    }
    sha(value.run.transcriptSha256, "run.transcriptSha256", issues);
    sha(value.run.environmentSha256, "run.environmentSha256", issues);
  }
  validateReceiptArtifacts(value.artifacts, "artifacts", issues);
  validateBlockers(value.blockers, "blockers", issues);
  const succeeded = status === "succeeded";
  validateLockedAuthority(value.authority, succeeded, "authority", issues);
  if (succeeded) {
    if (!Array.isArray(value.artifacts) || value.artifacts.length === 0)
      issues.push("succeeded status requires at least one artifact");
    if (Array.isArray(value.blockers) && value.blockers.length > 0)
      issues.push("succeeded status requires no blockers");
  } else if (Array.isArray(value.blockers) && value.blockers.length === 0) {
    issues.push("non-succeeded status requires at least one blocker");
  }
  return issues;
}

export async function computeCasimirArtifactGenerationRequestSha256V1(
  value: Omit<CasimirArtifactGenerationRequestV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_ARTIFACT_GENERATION_REQUEST_HASH_DOMAIN,
    value,
  });
}

export async function computeCasimirArtifactGenerationReceiptSha256V1(
  value: Omit<CasimirArtifactGenerationReceiptV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_ARTIFACT_GENERATION_RECEIPT_HASH_DOMAIN,
    value,
  });
}

const authority = (
  artifactBytesProduced: boolean,
): CasimirArtifactGenerationAuthorityV1 => ({
  outputRole: "evidence_for_bounded_synthesis",
  artifactBytesProduced,
  providerOutputTrusted: false,
  formalPropositionChecked: false,
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
});

export async function buildCasimirArtifactGenerationRequestV1(
  input: BuildCasimirArtifactGenerationRequestV1Input,
): Promise<CasimirArtifactGenerationRequestV1> {
  const withoutHash: Omit<
    CasimirArtifactGenerationRequestV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_ARTIFACT_GENERATION_REQUEST_ARTIFACT_ID,
    schemaVersion: CASIMIR_ARTIFACT_GENERATION_REQUEST_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    requestId: input.requestId,
    casimirSpec: input.casimirSpec,
    claim: input.claim,
    sourcePacket: input.sourcePacket,
    masterProblem: input.masterProblem,
    derivationProgram: input.derivationProgram,
    producerPolicy: input.producerPolicy,
    requestedArtifacts: input.requestedArtifacts,
    authority: authority(false),
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirArtifactGenerationRequestSha256V1(withoutHash),
  };
}

export async function buildCasimirArtifactGenerationReceiptV1(
  input: BuildCasimirArtifactGenerationReceiptV1Input,
): Promise<CasimirArtifactGenerationReceiptV1> {
  const withoutHash: Omit<
    CasimirArtifactGenerationReceiptV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_ARTIFACT_GENERATION_RECEIPT_ARTIFACT_ID,
    schemaVersion: CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    receiptId: input.receiptId,
    request: input.request,
    producer: input.producer,
    run: input.run,
    artifacts: input.artifacts,
    blockers: input.blockers,
    authority: authority(input.run.status === "succeeded"),
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirArtifactGenerationReceiptSha256V1(withoutHash),
  };
}

export async function validateCasimirArtifactGenerationRequestIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirArtifactGenerationRequestV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } = value;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_ARTIFACT_GENERATION_REQUEST_HASH_DOMAIN,
    value: withoutHash,
  });
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match request content");
  return issues;
}

export async function validateCasimirArtifactGenerationReceiptIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirArtifactGenerationReceiptV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } = value;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_ARTIFACT_GENERATION_RECEIPT_HASH_DOMAIN,
    value: withoutHash,
  });
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match receipt content");
  return issues;
}

export function validateCasimirArtifactGenerationReceiptAgainstRequestV1(
  receipt: CasimirArtifactGenerationReceiptV1,
  request: CasimirArtifactGenerationRequestV1,
): string[] {
  const issues: string[] = [];
  if (receipt.request.requestId !== request.requestId)
    issues.push("receipt requestId does not match request");
  if (receipt.request.artifactSha256 !== request.artifactSha256)
    issues.push("receipt request artifactSha256 does not match request");
  if (
    receipt.request.casimirSpecSemanticSha256 !==
    request.casimirSpec.semanticSha256
  ) {
    issues.push("receipt Casimir Spec semantic hash does not match request");
  }
  if (
    receipt.request.casimirSpecArtifactSha256 !==
    request.casimirSpec.artifactSha256
  ) {
    issues.push("receipt Casimir Spec artifact hash does not match request");
  }
  if (receipt.request.claimId !== request.claim.claimId)
    issues.push("receipt claimId does not match request");
  if (receipt.request.propositionSha256 !== request.claim.propositionSha256)
    issues.push("receipt proposition hash does not match request");
  if (
    !request.producerPolicy.allowedProducerIds.includes(
      receipt.producer.producerId,
    )
  ) {
    issues.push("receipt producerId is not allowed by request");
  }
  if (receipt.producer.adapterId !== request.producerPolicy.adapterContractId)
    issues.push("receipt adapterId does not match request adapter contract");

  if (receipt.run.status === "succeeded") {
    const requested = new Map(
      request.requestedArtifacts.map((artifact) => [
        artifact.artifactId,
        artifact,
      ]),
    );
    const observed = new Map(
      receipt.artifacts.map((artifact) => [artifact.artifactId, artifact]),
    );
    for (const [artifactId, expected] of requested) {
      const actual = observed.get(artifactId);
      if (!actual) {
        issues.push(`requested artifact missing from receipt: ${artifactId}`);
        continue;
      }
      if (actual.role !== expected.role)
        issues.push(`artifact role mismatch: ${artifactId}`);
      if (actual.mediaType !== expected.mediaType)
        issues.push(`artifact mediaType mismatch: ${artifactId}`);
      if (
        !actual.derivedFromSha256s.includes(
          request.sourcePacket.artifactSha256,
        )
      ) {
        issues.push(
          `artifact is not bound to source packet hash: ${artifactId}`,
        );
      }
    }
    for (const artifactId of observed.keys()) {
      if (!requested.has(artifactId))
        issues.push(`unrequested artifact present in receipt: ${artifactId}`);
    }
  }
  return issues;
}
