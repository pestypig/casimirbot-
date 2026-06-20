import type {
  TheoryBadgeEdgeRelation,
  TheoryBadgeSourceRefV1,
} from "./theory-badge-graph.v1";

export const THEORY_FRONTIER_CANDIDATE_ARTIFACT_ID = "theory_frontier_candidate" as const;
export const THEORY_FRONTIER_CANDIDATE_SCHEMA_VERSION = "theory_frontier_candidate/v1" as const;

export const THEORY_FRONTIER_CANDIDATE_STATUSES = [
  "coarse_candidate",
  "exact_verification_pending",
  "needs_observable",
  "needs_scholarly_evidence",
  "blocked_by_boundary",
] as const;

export const THEORY_FRONTIER_KINDS = [
  "candidate_connection",
  "missing_intermediate_badge",
  "unresolved_semantic_region",
] as const;

export const THEORY_FRONTIER_UNIT_COMPATIBILITY = [
  "compatible",
  "partial",
  "unknown",
  "incompatible",
] as const;

export const THEORY_FRONTIER_ALLOWED_LITERATURE_EFFECTS = [
  "support_existing_context",
  "conflict_with_badge",
  "identify_missing_evidence",
  "suggest_missing_badge",
  "unrelated",
] as const;

const FORBIDDEN_FRONTIER_CLAIM_PATTERNS = [
  /\bvalidated propulsion\b/i,
  /\bworking warp drive\b/i,
  /\bphysical mechanism confirmed\b/i,
  /\bQEI passed\b/i,
  /\bproven warp\b/i,
  /\benergy conditions cleared\b/i,
  /\bexternal paper validates NHM2\b/i,
  /\bsource closure solved\b/i,
  /\bfrontier candidate validates\b/i,
] as const;

export type TheoryFrontierCandidateStatusV1 = (typeof THEORY_FRONTIER_CANDIDATE_STATUSES)[number];
export type TheoryFrontierKindV1 = (typeof THEORY_FRONTIER_KINDS)[number];
export type TheoryFrontierUnitCompatibilityV1 = (typeof THEORY_FRONTIER_UNIT_COMPATIBILITY)[number];

export type TheoryFrontierReplayKeyV1 = {
  graphHash: string;
  graphId: string;
  query: string;
  searchSeed: string;
  taxonomyVersion: string;
  scoringVersion: string;
  evidenceReferenceIds: string[];
};

export type TheoryFrontierBiomeRegionV1 = {
  scaleEnvelopeLog10M: {
    min: number | null;
    max: number | null;
  };
  scaleBands: string[];
  domainKeys: string[];
  fidelityKeys: string[];
  renderChunkIds: string[];
  semanticChunkIds: string[];
  averageClaimPressure: number;
};

export type TheoryFrontierCongruenceV1 = {
  unitCompatibility: TheoryFrontierUnitCompatibilityV1;
  sharedUnitSignatures: string[];
  dimensionalIssues: string[];
  symbolCompatibilityScore: number;
  sharedSymbols: string[];
  equationFamilyCompatibilityScore: number;
  sharedEquationFamilies: string[];
  sharedFirstPrincipleBadgeIds: string[];
  firstPrinciplesPathBadgeIds: string[];
  allowedTypedEdgeRelations: TheoryBadgeEdgeRelation[];
  requiredObservables: string[];
  requiredArtifacts: string[];
  sourceReferences: TheoryBadgeSourceRefV1[];
  falsificationChecks: string[];
  uncertaintyBudget: string[];
  claimBoundaryNotes: string[];
};

export type TheoryFrontierScoresV1 = {
  cheapBiomeScore: number;
  congruenceScore: number;
  evidenceClosureScore: number;
  informationGainBits: number;
  estimatedCost: number;
  verifiedFrontierYieldPerBudget: number;
};

export type TheoryFrontierCandidateV1 = {
  artifactId: typeof THEORY_FRONTIER_CANDIDATE_ARTIFACT_ID;
  schemaVersion: typeof THEORY_FRONTIER_CANDIDATE_SCHEMA_VERSION;
  generatedAt: string;
  candidateId: string;
  frontierKind: TheoryFrontierKindV1;
  status: TheoryFrontierCandidateStatusV1;
  title: string;
  summary: string;
  badgeIds: string[];
  missingBadgeTitle?: string | null;
  replay: TheoryFrontierReplayKeyV1;
  biomeRegion: TheoryFrontierBiomeRegionV1;
  congruence: TheoryFrontierCongruenceV1;
  scores: TheoryFrontierScoresV1;
  literaturePolicy: {
    scholarlyLookupAllowed: boolean;
    noAutoPromoteLiterature: true;
    allowedEvidenceEffects: Array<(typeof THEORY_FRONTIER_ALLOWED_LITERATURE_EFFECTS)[number]>;
  };
  claimBoundary: {
    validatesTheory: false;
    solvesPhysicalMechanism: false;
    promotionAllowed: false;
    terminalEligible: false;
    assistantAnswer: false;
    probabilityMeans: "placement_uncertainty_not_truth_probability";
  };
};

export type BuildTheoryFrontierCandidateV1Input = Omit<
  TheoryFrontierCandidateV1,
  "artifactId" | "schemaVersion" | "generatedAt"
> & {
  generatedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function validateAllowedLiteratureEffects(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value) || !value.every((item: unknown) => typeof item === "string")) {
    issues.push(`${prefix} must be an array of allowed literature effects`);
    return;
  }
  const invalid = value.filter((item) => !THEORY_FRONTIER_ALLOWED_LITERATURE_EFFECTS.includes(item as never));
  for (const effect of invalid) {
    issues.push(`${prefix} contains invalid effect ${effect}`);
  }
  for (const effect of THEORY_FRONTIER_ALLOWED_LITERATURE_EFFECTS) {
    if (!value.includes(effect)) issues.push(`${prefix} must include ${effect}`);
  }
}

function validateNumberRange(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateSourceReferences(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  for (const [index, sourceRef] of value.entries()) {
    if (!isRecord(sourceRef)) {
      issues.push(`${prefix}[${index}] must be an object`);
      continue;
    }
    if (!isNonEmptyString(sourceRef.kind)) {
      issues.push(`${prefix}[${index}].kind must be a non-empty string`);
    }
  }
}

export function buildTheoryFrontierCandidateV1(
  input: BuildTheoryFrontierCandidateV1Input,
): TheoryFrontierCandidateV1 {
  return {
    artifactId: THEORY_FRONTIER_CANDIDATE_ARTIFACT_ID,
    schemaVersion: THEORY_FRONTIER_CANDIDATE_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    ...input,
  };
}

export function validateTheoryFrontierCandidateV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["frontier candidate must be an object"];

  if (value.artifactId !== THEORY_FRONTIER_CANDIDATE_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_FRONTIER_CANDIDATE_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_FRONTIER_CANDIDATE_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_FRONTIER_CANDIDATE_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "candidateId", "title", "summary"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!includes(THEORY_FRONTIER_KINDS, value.frontierKind)) issues.push("frontierKind is invalid");
  if (!includes(THEORY_FRONTIER_CANDIDATE_STATUSES, value.status)) issues.push("status is invalid");
  if (!isStringArray(value.badgeIds) || value.badgeIds.length === 0) {
    issues.push("badgeIds must be a non-empty array of strings");
  }

  if (!isRecord(value.replay)) {
    issues.push("replay must be an object");
  } else {
    for (
      const field of ["graphHash", "graphId", "query", "searchSeed", "taxonomyVersion", "scoringVersion"] as const
    ) {
      if (!isNonEmptyString(value.replay[field])) issues.push(`replay.${field} must be a non-empty string`);
    }
    if (!isStringArray(value.replay.evidenceReferenceIds)) {
      issues.push("replay.evidenceReferenceIds must be an array of strings");
    }
  }

  if (!isRecord(value.biomeRegion)) {
    issues.push("biomeRegion must be an object");
  } else {
    const biome = value.biomeRegion;
    if (!isRecord(biome.scaleEnvelopeLog10M)) {
      issues.push("biomeRegion.scaleEnvelopeLog10M must be an object");
    } else {
      for (const bound of ["min", "max"] as const) {
        const numberOrNull = biome.scaleEnvelopeLog10M[bound];
        if (numberOrNull !== null && !isFiniteNumber(numberOrNull)) {
          issues.push(`biomeRegion.scaleEnvelopeLog10M.${bound} must be a finite number or null`);
        }
      }
    }
    for (const field of ["scaleBands", "domainKeys", "fidelityKeys", "renderChunkIds", "semanticChunkIds"] as const) {
      if (!isStringArray(biome[field])) issues.push(`biomeRegion.${field} must be an array of strings`);
    }
    validateNumberRange("biomeRegion.averageClaimPressure", biome.averageClaimPressure, issues);
  }

  if (!isRecord(value.congruence)) {
    issues.push("congruence must be an object");
  } else {
    const congruence = value.congruence;
    if (!includes(THEORY_FRONTIER_UNIT_COMPATIBILITY, congruence.unitCompatibility)) {
      issues.push("congruence.unitCompatibility is invalid");
    }
    for (
      const field of [
        "sharedUnitSignatures",
        "dimensionalIssues",
        "sharedSymbols",
        "sharedEquationFamilies",
        "sharedFirstPrincipleBadgeIds",
        "firstPrinciplesPathBadgeIds",
        "allowedTypedEdgeRelations",
        "requiredObservables",
        "requiredArtifacts",
        "falsificationChecks",
        "uncertaintyBudget",
        "claimBoundaryNotes",
      ] as const
    ) {
      if (!isStringArray(congruence[field])) issues.push(`congruence.${field} must be an array of strings`);
    }
    validateNumberRange("congruence.symbolCompatibilityScore", congruence.symbolCompatibilityScore, issues);
    validateNumberRange("congruence.equationFamilyCompatibilityScore", congruence.equationFamilyCompatibilityScore, issues);
    validateSourceReferences("congruence.sourceReferences", congruence.sourceReferences, issues);
  }

  if (!isRecord(value.scores)) {
    issues.push("scores must be an object");
  } else {
    for (
      const field of [
        "cheapBiomeScore",
        "congruenceScore",
        "evidenceClosureScore",
        "informationGainBits",
        "estimatedCost",
        "verifiedFrontierYieldPerBudget",
      ] as const
    ) {
      if (!isFiniteNumber(value.scores[field])) issues.push(`scores.${field} must be a finite number`);
    }
  }

  if (!isRecord(value.literaturePolicy)) {
    issues.push("literaturePolicy must be an object");
  } else {
    if (typeof value.literaturePolicy.scholarlyLookupAllowed !== "boolean") {
      issues.push("literaturePolicy.scholarlyLookupAllowed must be boolean");
    }
    if (value.literaturePolicy.noAutoPromoteLiterature !== true) {
      issues.push("literaturePolicy.noAutoPromoteLiterature must be true");
    }
    validateAllowedLiteratureEffects(
      "literaturePolicy.allowedEvidenceEffects",
      value.literaturePolicy.allowedEvidenceEffects,
      issues,
    );
  }

  if (!isRecord(value.claimBoundary)) {
    issues.push("claimBoundary must be an object");
  } else {
    const boundary = value.claimBoundary;
    for (
      const field of [
        "validatesTheory",
        "solvesPhysicalMechanism",
        "promotionAllowed",
        "terminalEligible",
        "assistantAnswer",
      ] as const
    ) {
      if (boundary[field] !== false) issues.push(`claimBoundary.${field} must be false`);
    }
    if (boundary.probabilityMeans !== "placement_uncertainty_not_truth_probability") {
      issues.push("claimBoundary.probabilityMeans must be placement_uncertainty_not_truth_probability");
    }
  }

  const serialized = JSON.stringify(value);
  for (const pattern of FORBIDDEN_FRONTIER_CLAIM_PATTERNS) {
    if (pattern.test(serialized)) {
      issues.push(`forbidden frontier validation phrase matched: ${pattern.source}`);
    }
  }

  return issues;
}

export function isTheoryFrontierCandidateV1(value: unknown): value is TheoryFrontierCandidateV1 {
  return validateTheoryFrontierCandidateV1(value).length === 0;
}
