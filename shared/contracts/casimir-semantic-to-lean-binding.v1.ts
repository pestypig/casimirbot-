import {
  CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION,
  computeCasimirSpecValueSha256V1,
} from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_SEMANTIC_TO_LEAN_BINDING_ARTIFACT_ID =
  "casimir_semantic_to_lean_binding" as const;
export const CASIMIR_SEMANTIC_TO_LEAN_BINDING_SCHEMA_VERSION =
  "casimir_semantic_to_lean_binding/v1" as const;
export const CASIMIR_SEMANTIC_TO_LEAN_BINDING_HASH_DOMAIN =
  "casimir-semantic-to-lean-binding/v1" as const;

export type CasimirSemanticToLeanBindingV1 = {
  artifactId: typeof CASIMIR_SEMANTIC_TO_LEAN_BINDING_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_SEMANTIC_TO_LEAN_BINDING_SCHEMA_VERSION;
  bindingId: string;
  generatedAt: string;
  artifactSha256: string;
  status: "candidate" | "reviewed" | "rejected";
  casimirSpec: {
    specId: string;
    schemaVersion: typeof CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION;
    semanticSha256: string;
    artifactSha256: string;
  };
  semanticClaim: {
    claimId: string;
    propositionSha256: string;
  };
  formalArtifact: {
    formalArtifactId: string;
    sourceAuditArtifactSha256: string;
    sourceSha256: string;
    theoremName: string;
    theoremModule: string;
    declarationSha256: string;
    propositionSourceSha256: string;
    observedTheoremTypeSha256: string;
    environmentPolicySha256: string;
  };
  translation: {
    kind: "reviewed_translation_mapping";
    correspondenceSha256: string;
    assumptionCorrespondenceSha256: string;
    unitsAndFramesCorrespondenceSha256: string;
  };
  review: {
    reviewerPolicyId: string;
    reviewerPolicySha256: string;
    reviewArtifactId: string | null;
    reviewArtifactSha256: string | null;
    reviewedAt: string | null;
  };
  limitations: string[];
  authority: {
    outputRole: "semantic_to_formal_translation_binding";
    serverRegistrationRequired: true;
    sourceCorrelationOnly: boolean;
    semanticEquivalenceReviewed: boolean;
    formalPropositionChecked: false;
    validatesScientificTruth: false;
    validatesTheory: false;
    validatesNumericalImplementation: false;
    validatesEmpiricalClaim: false;
    validatesPhysicalMechanism: false;
    assistantAnswer: false;
    terminalEligible: false;
  };
};

export type BuildCasimirSemanticToLeanBindingV1Input = Omit<
  CasimirSemanticToLeanBindingV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & { generatedAt?: string };

const SHA256 = /^[a-f0-9]{64}$/;
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const sha = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const sortedUnique = (values: string[]): boolean =>
  values.every(
    (entry, index) =>
      index === 0 || values[index - 1].localeCompare(entry, "en") < 0,
  );

export async function computeCasimirSemanticToLeanBindingSha256V1(
  value: Omit<CasimirSemanticToLeanBindingV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_SEMANTIC_TO_LEAN_BINDING_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirSemanticToLeanBindingV1(
  input: BuildCasimirSemanticToLeanBindingV1Input,
): Promise<CasimirSemanticToLeanBindingV1> {
  const reviewed = input.status === "reviewed";
  const withoutHash: Omit<
    CasimirSemanticToLeanBindingV1,
    "artifactSha256"
  > = {
    ...input,
    artifactId: CASIMIR_SEMANTIC_TO_LEAN_BINDING_ARTIFACT_ID,
    schemaVersion: CASIMIR_SEMANTIC_TO_LEAN_BINDING_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    authority: {
      outputRole: "semantic_to_formal_translation_binding",
      serverRegistrationRequired: true,
      sourceCorrelationOnly: !reviewed,
      semanticEquivalenceReviewed: reviewed,
      formalPropositionChecked: false,
      validatesScientificTruth: false,
      validatesTheory: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
      assistantAnswer: false,
      terminalEligible: false,
    },
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeCasimirSemanticToLeanBindingSha256V1(withoutHash),
  };
}

export function validateCasimirSemanticToLeanBindingShapeV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["binding must be an object"];
  if (value.artifactId !== CASIMIR_SEMANTIC_TO_LEAN_BINDING_ARTIFACT_ID)
    issues.push("artifactId is invalid");
  if (value.schemaVersion !== CASIMIR_SEMANTIC_TO_LEAN_BINDING_SCHEMA_VERSION)
    issues.push("schemaVersion is invalid");
  for (const field of ["bindingId", "generatedAt"] as const)
    if (!nonEmpty(value[field])) issues.push(`${field} must be non-empty`);
  if (
    typeof value.generatedAt === "string" &&
    Number.isNaN(Date.parse(value.generatedAt))
  )
    issues.push("generatedAt must be an ISO-compatible timestamp");
  if (!sha(value.artifactSha256))
    issues.push("artifactSha256 must be lowercase SHA-256");
  if (!["candidate", "reviewed", "rejected"].includes(String(value.status)))
    issues.push("status is invalid");

  const spec = value.casimirSpec;
  if (!isRecord(spec)) {
    issues.push("casimirSpec must be an object");
  } else {
    if (!nonEmpty(spec.specId)) issues.push("casimirSpec.specId must be non-empty");
    if (spec.schemaVersion !== CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION)
      issues.push("casimirSpec.schemaVersion is invalid");
    for (const field of ["semanticSha256", "artifactSha256"] as const)
      if (!sha(spec[field]))
        issues.push(`casimirSpec.${field} must be lowercase SHA-256`);
  }

  const claim = value.semanticClaim;
  if (!isRecord(claim)) {
    issues.push("semanticClaim must be an object");
  } else {
    if (!nonEmpty(claim.claimId))
      issues.push("semanticClaim.claimId must be non-empty");
    if (!sha(claim.propositionSha256))
      issues.push(
        "semanticClaim.propositionSha256 must be lowercase SHA-256",
      );
  }

  const formal = value.formalArtifact;
  if (!isRecord(formal)) {
    issues.push("formalArtifact must be an object");
  } else {
    for (const field of [
      "formalArtifactId",
      "theoremName",
      "theoremModule",
    ] as const)
      if (!nonEmpty(formal[field]))
        issues.push(`formalArtifact.${field} must be non-empty`);
    for (const field of [
      "sourceAuditArtifactSha256",
      "sourceSha256",
      "declarationSha256",
      "propositionSourceSha256",
      "observedTheoremTypeSha256",
      "environmentPolicySha256",
    ] as const)
      if (!sha(formal[field]))
        issues.push(`formalArtifact.${field} must be lowercase SHA-256`);
  }

  const translation = value.translation;
  if (!isRecord(translation)) {
    issues.push("translation must be an object");
  } else {
    if (translation.kind !== "reviewed_translation_mapping")
      issues.push("translation.kind is invalid");
    for (const field of [
      "correspondenceSha256",
      "assumptionCorrespondenceSha256",
      "unitsAndFramesCorrespondenceSha256",
    ] as const)
      if (!sha(translation[field]))
        issues.push(`translation.${field} must be lowercase SHA-256`);
  }

  const review = value.review;
  if (!isRecord(review)) {
    issues.push("review must be an object");
  } else {
    for (const field of ["reviewerPolicyId", "reviewerPolicySha256"] as const) {
      if (field.endsWith("Sha256")) {
        if (!sha(review[field]))
          issues.push(`review.${field} must be lowercase SHA-256`);
      } else if (!nonEmpty(review[field])) {
        issues.push(`review.${field} must be non-empty`);
      }
    }
    const reviewFields = [
      review.reviewArtifactId,
      review.reviewArtifactSha256,
      review.reviewedAt,
    ];
    const allNull = reviewFields.every((entry) => entry === null);
    const allPresent =
      nonEmpty(review.reviewArtifactId) &&
      sha(review.reviewArtifactSha256) &&
      nonEmpty(review.reviewedAt) &&
      !Number.isNaN(Date.parse(review.reviewedAt));
    if (!allNull && !allPresent)
      issues.push("review evidence must be entirely null or entirely present");
    if (value.status === "reviewed" && !allPresent)
      issues.push("reviewed binding requires complete review evidence");
    if (value.status !== "reviewed" && !allNull)
      issues.push("non-reviewed binding must not carry review evidence");
  }

  if (
    !Array.isArray(value.limitations) ||
    !value.limitations.every(nonEmpty) ||
    !sortedUnique(value.limitations)
  )
    issues.push("limitations must be sorted, unique, non-empty strings");

  const authority = value.authority;
  if (!isRecord(authority)) {
    issues.push("authority must be an object");
  } else {
    const reviewed = value.status === "reviewed";
    if (
      authority.outputRole !== "semantic_to_formal_translation_binding" ||
      authority.serverRegistrationRequired !== true ||
      authority.sourceCorrelationOnly !== !reviewed ||
      authority.semanticEquivalenceReviewed !== reviewed ||
      authority.formalPropositionChecked !== false ||
      authority.validatesScientificTruth !== false ||
      authority.validatesTheory !== false ||
      authority.validatesNumericalImplementation !== false ||
      authority.validatesEmpiricalClaim !== false ||
      authority.validatesPhysicalMechanism !== false ||
      authority.assistantAnswer !== false ||
      authority.terminalEligible !== false
    )
      issues.push("authority boundary is invalid");
  }
  return issues;
}

export async function validateCasimirSemanticToLeanBindingV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateCasimirSemanticToLeanBindingShapeV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } =
    value as unknown as CasimirSemanticToLeanBindingV1;
  const expected =
    await computeCasimirSemanticToLeanBindingSha256V1(withoutHash);
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match binding content");
  return issues;
}
