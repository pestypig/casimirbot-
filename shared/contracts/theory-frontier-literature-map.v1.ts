export const THEORY_FRONTIER_LITERATURE_MAP_ARTIFACT_ID = "theory_frontier_literature_map" as const;
export const THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION = "theory_frontier_literature_map/v1" as const;

export const THEORY_FRONTIER_LITERATURE_EFFECTS = [
  "support_existing_context",
  "conflict_with_badge",
  "identify_missing_evidence",
  "suggest_missing_badge",
  "unrelated",
] as const;

export const THEORY_FRONTIER_EXTRACTED_EVIDENCE_KINDS = [
  "claim",
  "equation",
  "value",
  "limitation",
] as const;

const THEORY_FRONTIER_LITERATURE_REQUESTED_OUTPUTS = [
  "scholarly_paper_refs",
  "doi_metadata",
  "scholarly_full_text",
  "paper_pdf_pages",
] as const;

export type TheoryFrontierLiteratureEffectV1 = (typeof THEORY_FRONTIER_LITERATURE_EFFECTS)[number];
export type TheoryFrontierExtractedEvidenceKindV1 = (typeof THEORY_FRONTIER_EXTRACTED_EVIDENCE_KINDS)[number];

export type TheoryFrontierLiteratureReplayV1 = {
  graphHash: string;
  graphId: string;
  query: string;
  searchSeed: string;
  taxonomyVersion: string;
  scoringVersion: string;
  literatureMapVersion: typeof THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION;
  evidenceReferenceIds: string[];
};

export type TheoryFrontierLiteratureSourceV1 = {
  sourceId: string;
  title: string;
  url?: string | null;
  doi?: string | null;
  authors: string[];
  year?: number | null;
  retrieval: {
    targetSource: "scholarly_research";
    requestedOutputs: Array<"scholarly_paper_refs" | "doi_metadata" | "scholarly_full_text" | "paper_pdf_pages">;
    fullTextRetrieved: boolean;
    fullTextDigest: string | null;
  };
};

export type TheoryFrontierExtractedEvidenceV1 = {
  itemId: string;
  sourceId: string;
  kind: TheoryFrontierExtractedEvidenceKindV1;
  text: string;
  symbols: string[];
  equationFamilies: string[];
  unitSignatures: string[];
  values: string[];
  limitations: string[];
  pageRefs: string[];
  confidence: number;
};

export type TheoryFrontierLiteratureMappingV1 = {
  mappingId: string;
  sourceId: string;
  sourceItemId: string;
  effect: TheoryFrontierLiteratureEffectV1;
  candidateIds: string[];
  badgeIds: string[];
  renderChunkIds: string[];
  semanticChunkIds: string[];
  extractedClaims: string[];
  extractedEquations: string[];
  extractedValues: string[];
  extractedLimitations: string[];
  reasons: string[];
};

export type TheoryFrontierLiteratureMapV1 = {
  artifactId: typeof THEORY_FRONTIER_LITERATURE_MAP_ARTIFACT_ID;
  schemaVersion: typeof THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION;
  generatedAt: string;
  mapId: string;
  frontierCandidateIds: string[];
  replay: TheoryFrontierLiteratureReplayV1;
  sources: TheoryFrontierLiteratureSourceV1[];
  extractedEvidence: TheoryFrontierExtractedEvidenceV1[];
  mappings: TheoryFrontierLiteratureMappingV1[];
  summary: {
    sourceCount: number;
    extractedEvidenceCount: number;
    mappingCount: number;
    mappedBadgeCount: number;
    mappedCandidateCount: number;
    effectCounts: Record<string, number>;
  };
  authority: {
    assistant_answer: false;
    terminal_eligible: false;
    validatesTheory: false;
    solvesPhysicalMechanism: false;
    promotionAllowed: false;
    noAutoPromoteLiterature: true;
    allowedEvidenceEffects: TheoryFrontierLiteratureEffectV1[];
    deterministicContentRole: "scholarly_evidence_map_not_answer";
  };
};

export type BuildTheoryFrontierLiteratureMapV1Input = Omit<
  TheoryFrontierLiteratureMapV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary" | "authority"
> & {
  generatedAt?: string;
  summary?: Partial<TheoryFrontierLiteratureMapV1["summary"]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function validateStringArrayField(prefix: string, value: unknown, issues: string[], requireNonEmpty = false): void {
  if (!isStringArray(value)) {
    issues.push(`${prefix} must be an array of strings`);
  } else if (requireNonEmpty && value.length === 0) {
    issues.push(`${prefix} must be non-empty`);
  }
}

function validateLiteratureEffects(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value) || !value.every((item: unknown) => typeof item === "string")) {
    issues.push(`${prefix} must be an array of allowed literature effects`);
    return;
  }
  for (const effect of value) {
    if (!THEORY_FRONTIER_LITERATURE_EFFECTS.includes(effect as never)) {
      issues.push(`${prefix} contains invalid effect ${effect}`);
    }
  }
  for (const effect of THEORY_FRONTIER_LITERATURE_EFFECTS) {
    if (!value.includes(effect)) issues.push(`${prefix} must include ${effect}`);
  }
}

export function buildTheoryFrontierLiteratureMapV1(
  input: BuildTheoryFrontierLiteratureMapV1Input,
): TheoryFrontierLiteratureMapV1 {
  const effectCounts = countBy(input.mappings.map((mapping) => mapping.effect));
  const mappedBadgeCount = new Set(input.mappings.flatMap((mapping) => mapping.badgeIds)).size;
  const mappedCandidateCount = new Set(input.mappings.flatMap((mapping) => mapping.candidateIds)).size;

  return {
    artifactId: THEORY_FRONTIER_LITERATURE_MAP_ARTIFACT_ID,
    schemaVersion: THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    mapId: input.mapId,
    frontierCandidateIds: input.frontierCandidateIds,
    replay: input.replay,
    sources: input.sources,
    extractedEvidence: input.extractedEvidence,
    mappings: input.mappings,
    summary: {
      sourceCount: input.sources.length,
      extractedEvidenceCount: input.extractedEvidence.length,
      mappingCount: input.mappings.length,
      mappedBadgeCount,
      mappedCandidateCount,
      effectCounts,
      ...input.summary,
    },
    authority: {
      assistant_answer: false,
      terminal_eligible: false,
      validatesTheory: false,
      solvesPhysicalMechanism: false,
      promotionAllowed: false,
      noAutoPromoteLiterature: true,
      allowedEvidenceEffects: [...THEORY_FRONTIER_LITERATURE_EFFECTS],
      deterministicContentRole: "scholarly_evidence_map_not_answer",
    },
  };
}

export function validateTheoryFrontierLiteratureMapV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["literature map must be an object"];

  if (value.artifactId !== THEORY_FRONTIER_LITERATURE_MAP_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_FRONTIER_LITERATURE_MAP_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "mapId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  validateStringArrayField("frontierCandidateIds", value.frontierCandidateIds, issues);

  if (!isRecord(value.replay)) {
    issues.push("replay must be an object");
  } else {
    for (
      const field of ["graphHash", "graphId", "query", "searchSeed", "taxonomyVersion", "scoringVersion"] as const
    ) {
      if (!isNonEmptyString(value.replay[field])) issues.push(`replay.${field} must be a non-empty string`);
    }
    if (value.replay.literatureMapVersion !== THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION) {
      issues.push(`replay.literatureMapVersion must be ${THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION}`);
    }
    validateStringArrayField("replay.evidenceReferenceIds", value.replay.evidenceReferenceIds, issues);
  }

  if (!Array.isArray(value.sources)) {
    issues.push("sources must be an array");
  } else {
    for (const [index, source] of value.sources.entries()) {
      const prefix = `sources[${index}]`;
      if (!isRecord(source)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      for (const field of ["sourceId", "title"] as const) {
        if (!isNonEmptyString(source[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
      }
      validateStringArrayField(`${prefix}.authors`, source.authors, issues);
      if (source.year != null && !isFiniteNumber(source.year)) issues.push(`${prefix}.year must be a number or null`);
      if (!isRecord(source.retrieval)) {
        issues.push(`${prefix}.retrieval must be an object`);
      } else {
        if (source.retrieval.targetSource !== "scholarly_research") {
          issues.push(`${prefix}.retrieval.targetSource must be scholarly_research`);
        }
        if (!Array.isArray(source.retrieval.requestedOutputs)) {
          issues.push(`${prefix}.retrieval.requestedOutputs must be an array`);
        } else {
          for (const output of source.retrieval.requestedOutputs) {
            if (!THEORY_FRONTIER_LITERATURE_REQUESTED_OUTPUTS.includes(output as never)) {
              issues.push(`${prefix}.retrieval.requestedOutputs contains invalid output ${output}`);
            }
          }
        }
        if (typeof source.retrieval.fullTextRetrieved !== "boolean") {
          issues.push(`${prefix}.retrieval.fullTextRetrieved must be boolean`);
        } else if (source.retrieval.fullTextRetrieved === true && !isNonEmptyString(source.retrieval.fullTextDigest)) {
          issues.push(`${prefix}.retrieval.fullTextDigest must be non-empty when fullTextRetrieved is true`);
        }
      }
    }
  }

  if (!Array.isArray(value.extractedEvidence)) {
    issues.push("extractedEvidence must be an array");
  } else {
    for (const [index, evidence] of value.extractedEvidence.entries()) {
      const prefix = `extractedEvidence[${index}]`;
      if (!isRecord(evidence)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      for (const field of ["itemId", "sourceId", "text"] as const) {
        if (!isNonEmptyString(evidence[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
      }
      if (!includes(THEORY_FRONTIER_EXTRACTED_EVIDENCE_KINDS, evidence.kind)) {
        issues.push(`${prefix}.kind is invalid`);
      }
      for (const field of ["symbols", "equationFamilies", "unitSignatures", "values", "limitations", "pageRefs"] as const) {
        validateStringArrayField(`${prefix}.${field}`, evidence[field], issues);
      }
      if (!isFiniteNumber(evidence.confidence) || evidence.confidence < 0 || evidence.confidence > 1) {
        issues.push(`${prefix}.confidence must be between 0 and 1`);
      }
    }
  }

  if (!Array.isArray(value.mappings)) {
    issues.push("mappings must be an array");
  } else {
    for (const [index, mapping] of value.mappings.entries()) {
      const prefix = `mappings[${index}]`;
      if (!isRecord(mapping)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      for (const field of ["mappingId", "sourceId", "sourceItemId"] as const) {
        if (!isNonEmptyString(mapping[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
      }
      if (!includes(THEORY_FRONTIER_LITERATURE_EFFECTS, mapping.effect)) {
        issues.push(`${prefix}.effect is invalid`);
      }
      for (
        const field of [
          "candidateIds",
          "badgeIds",
          "renderChunkIds",
          "semanticChunkIds",
          "extractedClaims",
          "extractedEquations",
          "extractedValues",
          "extractedLimitations",
          "reasons",
        ] as const
      ) {
        validateStringArrayField(`${prefix}.${field}`, mapping[field], issues);
      }
    }
  }

  if (!isRecord(value.authority)) {
    issues.push("authority must be an object");
  } else {
    for (
      const field of [
        "assistant_answer",
        "terminal_eligible",
        "validatesTheory",
        "solvesPhysicalMechanism",
        "promotionAllowed",
      ] as const
    ) {
      if (value.authority[field] !== false) issues.push(`authority.${field} must be false`);
    }
    if (value.authority.noAutoPromoteLiterature !== true) {
      issues.push("authority.noAutoPromoteLiterature must be true");
    }
    if (value.authority.deterministicContentRole !== "scholarly_evidence_map_not_answer") {
      issues.push("authority.deterministicContentRole must be scholarly_evidence_map_not_answer");
    }
    validateLiteratureEffects("authority.allowedEvidenceEffects", value.authority.allowedEvidenceEffects, issues);
  }

  return issues;
}

export function isTheoryFrontierLiteratureMapV1(value: unknown): value is TheoryFrontierLiteratureMapV1 {
  return validateTheoryFrontierLiteratureMapV1(value).length === 0;
}
