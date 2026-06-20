import {
  type ProbabilityTerrainV1,
  validateProbabilityTerrainV1,
} from "./probability-terrain.v1";
import type { HelixAskSourceTargetRequestedOutput } from "../helix-ask-source-target-intent";
import {
  type TheoryFrontierCandidateV1,
  validateTheoryFrontierCandidateV1,
} from "./theory-frontier-candidate.v1";
import {
  type TheoryFrontierVectorFieldTraceV1,
  validateTheoryFrontierVectorFieldTraceV1,
} from "./theory-frontier-vector-field.v1";

export const THEORY_FRONTIER_SEARCH_ARTIFACT_ID = "theory_frontier_search" as const;
export const THEORY_FRONTIER_SEARCH_SCHEMA_VERSION = "theory_frontier_search/v1" as const;

export const THEORY_FRONTIER_METHOD_ANCHORS_V1 = [
  {
    id: "cubiomes",
    label: "Cubiomes deterministic seed finding",
    url: "https://github.com/Cubitect/cubiomes",
    claim: "Procedural-search precedent for fast deterministic seed finding and large-scale map viewing.",
  },
  {
    id: "cubiomes_biome_noise",
    label: "Cubiomes biome noise",
    url: "https://github.com/Cubitect/cubiomes/blob/master/biomenoise.h",
    claim: "Procedural-search precedent for seeded climate/noise fields.",
  },
  {
    id: "cubiomes_generator_api",
    label: "Cubiomes generator API",
    url: "https://github.com/Cubitect/cubiomes/blob/master/generator.h",
    claim: "Procedural-search precedent for scaled range generation and coarse-to-fine search.",
  },
  {
    id: "minecraft_caves_cliffs_ii",
    label: "Minecraft Caves & Cliffs II",
    url: "https://www.minecraft.net/en-us/article/caves---cliffs-part-ii-the-features",
    claim: "Procedural-search precedent for multi-resolution terrain and inspectable biome distribution.",
  },
  {
    id: "red_blob_terrain_noise",
    label: "Red Blob terrain noise",
    url: "https://www.redblobgames.com/maps/terrain-from-noise/",
    claim: "Procedural-search precedent for independent fields defining map classes.",
  },
] as const;

const THEORY_FRONTIER_SCHOLARLY_REQUEST_OUTPUTS = [
  "scholarly_paper_refs",
  "doi_metadata",
  "scholarly_full_text",
  "paper_pdf_pages",
] as const;

export type TheoryFrontierMethodAnchorV1 = (typeof THEORY_FRONTIER_METHOD_ANCHORS_V1)[number];

export type TheoryFrontierScholarlyLookupRequestV1 = {
  requestId: string;
  candidateId: string;
  targetSource: "scholarly_research";
  requestedOutputs: HelixAskSourceTargetRequestedOutput[];
  query: string;
  badgeIds: string[];
  renderChunkIds: string[];
  semanticChunkIds: string[];
  reason: string;
  mutating: false;
  noAutoPromoteLiterature: true;
};

export type TheoryFrontierOptimizationRecordKindV1 =
  | "verified_research_throughput"
  | "evidence_closure"
  | "root_to_leaf_coverage"
  | "information_gain"
  | "false_positive_reduction";

export type TheoryFrontierOptimizationRecordV1 = {
  recordId: string;
  candidateId: string;
  recordKind: TheoryFrontierOptimizationRecordKindV1;
  metric:
    | "verified_frontier_yield_per_budget"
    | "evidence_closure_score"
    | "first_principles_path_badge_count"
    | "information_gain_bits"
    | "claim_boundary_block_count";
  value: number;
  comparisonBasis: "within_replayed_candidate_set";
  reason: string;
};

export type TheoryFrontierSearchOptimizationV1 = {
  objectiveMetric: "verified_frontier_yield_per_budget";
  rawCandidateCountOptimized: false;
  recordDefinition: "reproducible_improvement_in_research_throughput_evidence_closure_root_to_leaf_coverage_information_gain_or_false_positive_reduction";
  candidateBudget: {
    requestedLimit: number;
    evaluatedPairCount: number;
    emittedCandidateCount: number;
    totalEstimatedCost: number;
  };
  records: TheoryFrontierOptimizationRecordV1[];
};

export type TheoryFrontierSearchStageNameV1 =
  | "cheap_biome_field_scan"
  | "unit_dimensional_filter"
  | "symbol_equation_family_filter"
  | "first_principles_ancestry_filter"
  | "typed_edge_semantics_filter"
  | "observable_artifact_filter"
  | "source_reference_falsifier_filter"
  | "exact_contract_verification_queue";

export type TheoryFrontierSearchStageV1 = {
  order: number;
  stageName: TheoryFrontierSearchStageNameV1;
  mode: "candidate_generation" | "scoring_filter" | "verification_gate";
  costTier: "cheap" | "progressive" | "exact";
  inputCandidateCount: number;
  scoredCandidateCount: number;
  passedCandidateCount: number;
  flaggedCandidateCount: number;
  retainedCandidateIds: string[];
  evidenceFields: string[];
  deterministic: true;
};

export type TheoryFrontierSearchStageTraceV1 = {
  proceduralModel: "coarse_to_fine_seed_finding_precedent";
  cheapBiomeFields: ["scale_envelope", "domain", "fidelity", "semantic_chunk", "claim_pressure"];
  progressiveCongruenceFilters: [
    "unit_dimensional_compatibility",
    "symbol_equation_family_compatibility",
    "shared_first_principles_ancestry",
    "allowed_typed_edge_semantics",
    "observable_artifact_requirements",
    "source_reference_falsifier_coverage",
  ];
  contextReuse: {
    strategy: "shared_biome_layout_and_connection_trace_cache";
    amortizedAcrossCandidatePairs: true;
    reusedContextKeys: string[];
  };
  stages: TheoryFrontierSearchStageV1[];
};

export type TheoryFrontierSearchV1 = {
  artifactId: typeof THEORY_FRONTIER_SEARCH_ARTIFACT_ID;
  schemaVersion: typeof THEORY_FRONTIER_SEARCH_SCHEMA_VERSION;
  generatedAt: string;
  searchId: string;
  graphId: string;
  graphHash: string;
  query: string;
  searchSeed: string;
  taxonomyVersion: string;
  scoringVersion: string;
  verifierVersion: string;
  candidates: TheoryFrontierCandidateV1[];
  vectorFieldTrace: TheoryFrontierVectorFieldTraceV1;
  scholarlyLookupRequests: TheoryFrontierScholarlyLookupRequestV1[];
  probabilityTerrain: ProbabilityTerrainV1;
  stageTrace: TheoryFrontierSearchStageTraceV1;
  optimization: TheoryFrontierSearchOptimizationV1;
  summary: {
    candidateCount: number;
    statusCounts: Record<string, number>;
    topCandidateId: string | null;
    posteriorEntropyBits: number;
    informationGainBits: number;
    verifiedFrontierYieldPerBudget: number;
  };
  methodAnchors: readonly TheoryFrontierMethodAnchorV1[];
  interpretation: {
    proceduralSearchPrecedentOnly: true;
    probabilitiesArePlacementUncertaintyOnly: true;
    noTheoryValidation: true;
    noAutomaticEdgePromotion: true;
  };
};

export type BuildTheoryFrontierSearchV1Input = Omit<
  TheoryFrontierSearchV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "scholarlyLookupRequests"
  | "stageTrace"
  | "optimization"
  | "summary"
  | "methodAnchors"
  | "interpretation"
> & {
  generatedAt?: string;
  scholarlyLookupRequests?: TheoryFrontierScholarlyLookupRequestV1[];
  stageTrace?: TheoryFrontierSearchStageTraceV1;
  optimization?: Partial<TheoryFrontierSearchOptimizationV1> & {
    candidateBudget?: Partial<TheoryFrontierSearchOptimizationV1["candidateBudget"]>;
  };
  summary?: Partial<TheoryFrontierSearchV1["summary"]>;
  methodAnchors?: readonly TheoryFrontierMethodAnchorV1[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const round6 = (value: number): number => Number(value.toFixed(6));

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function countStatuses(candidates: TheoryFrontierCandidateV1[]): Record<string, number> {
  return candidates.reduce<Record<string, number>>((counts, candidate) => {
    counts[candidate.status] = (counts[candidate.status] ?? 0) + 1;
    return counts;
  }, {});
}

function validateScholarlyLookupRequests(value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push("scholarlyLookupRequests must be an array");
    return;
  }
  for (const [index, request] of value.entries()) {
    const prefix = `scholarlyLookupRequests[${index}]`;
    if (!isRecord(request)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    for (const field of ["requestId", "candidateId", "query", "reason"] as const) {
      if (!isNonEmptyString(request[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
    }
    if (request.targetSource !== "scholarly_research") {
      issues.push(`${prefix}.targetSource must be scholarly_research`);
    }
    if (
      !Array.isArray(request.requestedOutputs) ||
      !request.requestedOutputs.every((item: unknown) =>
        typeof item === "string" && THEORY_FRONTIER_SCHOLARLY_REQUEST_OUTPUTS.includes(item as never)
      )
    ) {
      issues.push(`${prefix}.requestedOutputs must contain only frontier scholarly output kinds`);
    }
    if (!Array.isArray(request.requestedOutputs) || request.requestedOutputs.length === 0) {
      issues.push(`${prefix}.requestedOutputs must be non-empty`);
    }
    for (const field of ["badgeIds", "renderChunkIds", "semanticChunkIds"] as const) {
      if (!Array.isArray(request[field]) || !request[field].every((item: unknown) => typeof item === "string")) {
        issues.push(`${prefix}.${field} must be an array of strings`);
      }
    }
    if (request.mutating !== false) issues.push(`${prefix}.mutating must be false`);
    if (request.noAutoPromoteLiterature !== true) {
      issues.push(`${prefix}.noAutoPromoteLiterature must be true`);
    }
  }
}

function validateMethodAnchors(value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push("methodAnchors must be an array");
    return;
  }
  if (value.length !== THEORY_FRONTIER_METHOD_ANCHORS_V1.length) {
    issues.push("methodAnchors must contain the required procedural-search anchors");
  }
  for (const expected of THEORY_FRONTIER_METHOD_ANCHORS_V1) {
    const actual = value.find((anchor: unknown) =>
      isRecord(anchor) && anchor.id === expected.id
    );
    if (!isRecord(actual)) {
      issues.push(`methodAnchors must include ${expected.id}`);
      continue;
    }
    if (actual.label !== expected.label) {
      issues.push(`methodAnchors.${expected.id}.label is invalid`);
    }
    if (actual.url !== expected.url) {
      issues.push(`methodAnchors.${expected.id}.url is invalid`);
    }
    if (actual.claim !== expected.claim) {
      issues.push(`methodAnchors.${expected.id}.claim is invalid`);
    }
  }
}

function bestRecord(
  candidates: TheoryFrontierCandidateV1[],
  args: {
    recordKind: TheoryFrontierOptimizationRecordKindV1;
    metric: TheoryFrontierOptimizationRecordV1["metric"];
    valueFor: (candidate: TheoryFrontierCandidateV1) => number;
    reason: string;
  },
): TheoryFrontierOptimizationRecordV1 | null {
  const [best] = [...candidates]
    .map((candidate) => ({ candidate, value: round6(args.valueFor(candidate)) }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) =>
      right.value - left.value || left.candidate.candidateId.localeCompare(right.candidate.candidateId),
    );
  if (!best) return null;
  return {
    recordId: `frontier_record:${args.metric}:${best.candidate.candidateId}`,
    candidateId: best.candidate.candidateId,
    recordKind: args.recordKind,
    metric: args.metric,
    value: best.value,
    comparisonBasis: "within_replayed_candidate_set",
    reason: args.reason,
  };
}

function buildOptimizationRecords(candidates: TheoryFrontierCandidateV1[]): TheoryFrontierOptimizationRecordV1[] {
  const records = [
    bestRecord(candidates, {
      recordKind: "verified_research_throughput",
      metric: "verified_frontier_yield_per_budget",
      valueFor: (candidate) => candidate.scores.verifiedFrontierYieldPerBudget,
      reason: "highest replayed verified_frontier_yield_per_budget for this search seed",
    }),
    bestRecord(candidates, {
      recordKind: "evidence_closure",
      metric: "evidence_closure_score",
      valueFor: (candidate) => candidate.scores.evidenceClosureScore,
      reason: "highest replayed evidence closure score for this search seed",
    }),
    bestRecord(candidates, {
      recordKind: "root_to_leaf_coverage",
      metric: "first_principles_path_badge_count",
      valueFor: (candidate) => candidate.congruence.firstPrinciplesPathBadgeIds.length,
      reason: "largest replayed first-principles-to-candidate path coverage for this search seed",
    }),
    bestRecord(candidates, {
      recordKind: "information_gain",
      metric: "information_gain_bits",
      valueFor: (candidate) => candidate.scores.informationGainBits,
      reason: "highest replayed placement information gain for this search seed",
    }),
    bestRecord(candidates, {
      recordKind: "false_positive_reduction",
      metric: "claim_boundary_block_count",
      valueFor: (candidate) => candidate.status === "blocked_by_boundary" ? 1 + candidate.congruence.claimBoundaryNotes.length : 0,
      reason: "strongest replayed claim-boundary block that reduces false-positive promotion risk",
    }),
  ].filter((record): record is TheoryFrontierOptimizationRecordV1 => Boolean(record));
  const seen = new Set<string>();
  return records
    .filter((record) => {
      if (seen.has(record.recordId)) return false;
      seen.add(record.recordId);
      return true;
    })
    .sort((left, right) => left.recordId.localeCompare(right.recordId));
}

function buildOptimization(
  input: BuildTheoryFrontierSearchV1Input,
): TheoryFrontierSearchOptimizationV1 {
  const totalEstimatedCost = round6(
    input.candidates.reduce((total, candidate) => total + Math.max(0, candidate.scores.estimatedCost), 0),
  );
  return {
    objectiveMetric: "verified_frontier_yield_per_budget",
    rawCandidateCountOptimized: false,
    recordDefinition:
      "reproducible_improvement_in_research_throughput_evidence_closure_root_to_leaf_coverage_information_gain_or_false_positive_reduction",
    candidateBudget: {
      requestedLimit: input.optimization?.candidateBudget?.requestedLimit ?? input.candidates.length,
      evaluatedPairCount: input.optimization?.candidateBudget?.evaluatedPairCount ?? input.candidates.length,
      emittedCandidateCount: input.optimization?.candidateBudget?.emittedCandidateCount ?? input.candidates.length,
      totalEstimatedCost: input.optimization?.candidateBudget?.totalEstimatedCost ?? totalEstimatedCost,
    },
    records: input.optimization?.records ?? buildOptimizationRecords(input.candidates),
  };
}

function stageRecord(args: {
  order: number;
  stageName: TheoryFrontierSearchStageNameV1;
  mode: TheoryFrontierSearchStageV1["mode"];
  costTier: TheoryFrontierSearchStageV1["costTier"];
  inputCandidateCount: number;
  candidates: TheoryFrontierCandidateV1[];
  passes: (candidate: TheoryFrontierCandidateV1) => boolean;
  evidenceFields: string[];
}): TheoryFrontierSearchStageV1 {
  const passed = args.candidates.filter(args.passes);
  return {
    order: args.order,
    stageName: args.stageName,
    mode: args.mode,
    costTier: args.costTier,
    inputCandidateCount: args.inputCandidateCount,
    scoredCandidateCount: args.candidates.length,
    passedCandidateCount: passed.length,
    flaggedCandidateCount: Math.max(0, args.candidates.length - passed.length),
    retainedCandidateIds: args.candidates.map((candidate) => candidate.candidateId).sort(),
    evidenceFields: args.evidenceFields,
    deterministic: true,
  };
}

function buildStageTrace(input: BuildTheoryFrontierSearchV1Input): TheoryFrontierSearchStageTraceV1 {
  const candidates = input.candidates;
  const initialCount = input.optimization?.candidateBudget?.evaluatedPairCount ?? candidates.length;
  return {
    proceduralModel: "coarse_to_fine_seed_finding_precedent",
    cheapBiomeFields: ["scale_envelope", "domain", "fidelity", "semantic_chunk", "claim_pressure"],
    progressiveCongruenceFilters: [
      "unit_dimensional_compatibility",
      "symbol_equation_family_compatibility",
      "shared_first_principles_ancestry",
      "allowed_typed_edge_semantics",
      "observable_artifact_requirements",
      "source_reference_falsifier_coverage",
    ],
    contextReuse: {
      strategy: "shared_biome_layout_and_connection_trace_cache",
      amortizedAcrossCandidatePairs: true,
      reusedContextKeys: [
        input.graphHash,
        input.taxonomyVersion,
        input.scoringVersion,
        "theory_biome_layout",
        "theory_badge_connection_trace",
        "theory_frontier_vector_field",
      ],
    },
    stages: [
      stageRecord({
        order: 1,
        stageName: "cheap_biome_field_scan",
        mode: "candidate_generation",
        costTier: "cheap",
        inputCandidateCount: initialCount,
        candidates,
        passes: (candidate) => candidate.scores.cheapBiomeScore > 0,
        evidenceFields: ["biomeRegion.scaleEnvelopeLog10M", "vectorFieldTrace.vectors.scaleEnvelopeLog10M", "biomeRegion.domainKeys", "biomeRegion.fidelityKeys", "biomeRegion.semanticChunkIds", "biomeRegion.averageClaimPressure"],
      }),
      stageRecord({
        order: 2,
        stageName: "unit_dimensional_filter",
        mode: "scoring_filter",
        costTier: "progressive",
        inputCandidateCount: candidates.length,
        candidates,
        passes: (candidate) => candidate.congruence.unitCompatibility === "compatible" || candidate.congruence.unitCompatibility === "partial",
        evidenceFields: ["congruence.unitCompatibility", "congruence.sharedUnitSignatures", "vectorFieldTrace.candidateTraces.vectorDelta.dimensionalDistance", "congruence.dimensionalIssues"],
      }),
      stageRecord({
        order: 3,
        stageName: "symbol_equation_family_filter",
        mode: "scoring_filter",
        costTier: "progressive",
        inputCandidateCount: candidates.length,
        candidates,
        passes: (candidate) => candidate.congruence.symbolCompatibilityScore > 0 || candidate.congruence.equationFamilyCompatibilityScore > 0,
        evidenceFields: ["congruence.sharedSymbols", "congruence.sharedEquationFamilies", "vectorFieldTrace.candidateTraces.vectorDelta.equationFamilyDistance"],
      }),
      stageRecord({
        order: 4,
        stageName: "first_principles_ancestry_filter",
        mode: "scoring_filter",
        costTier: "progressive",
        inputCandidateCount: candidates.length,
        candidates,
        passes: (candidate) => candidate.congruence.firstPrinciplesPathBadgeIds.length > 0,
        evidenceFields: ["congruence.sharedFirstPrincipleBadgeIds", "congruence.firstPrinciplesPathBadgeIds"],
      }),
      stageRecord({
        order: 5,
        stageName: "typed_edge_semantics_filter",
        mode: "scoring_filter",
        costTier: "progressive",
        inputCandidateCount: candidates.length,
        candidates,
        passes: (candidate) => candidate.congruence.allowedTypedEdgeRelations.length > 0 || candidate.frontierKind === "missing_intermediate_badge",
        evidenceFields: ["frontierKind", "congruence.allowedTypedEdgeRelations"],
      }),
      stageRecord({
        order: 6,
        stageName: "observable_artifact_filter",
        mode: "scoring_filter",
        costTier: "progressive",
        inputCandidateCount: candidates.length,
        candidates,
        passes: (candidate) => candidate.congruence.requiredObservables.length > 0 && candidate.congruence.requiredArtifacts.length > 0,
        evidenceFields: ["congruence.requiredObservables", "congruence.requiredArtifacts"],
      }),
      stageRecord({
        order: 7,
        stageName: "source_reference_falsifier_filter",
        mode: "scoring_filter",
        costTier: "progressive",
        inputCandidateCount: candidates.length,
        candidates,
        passes: (candidate) => candidate.congruence.sourceReferences.length > 0 && candidate.congruence.falsificationChecks.length > 0,
        evidenceFields: ["congruence.sourceReferences", "congruence.falsificationChecks"],
      }),
      stageRecord({
        order: 8,
        stageName: "exact_contract_verification_queue",
        mode: "verification_gate",
        costTier: "exact",
        inputCandidateCount: candidates.length,
        candidates,
        passes: (candidate) => candidate.status === "exact_verification_pending",
        evidenceFields: ["status", "replay", "congruence", "vectorFieldTrace.relationTensors", "claimBoundary"],
      }),
    ],
  };
}

export function buildTheoryFrontierSearchV1(input: BuildTheoryFrontierSearchV1Input): TheoryFrontierSearchV1 {
  const verifiedFrontierYieldPerBudget = Number(
    input.candidates
      .reduce((total, candidate) => total + Math.max(0, candidate.scores.verifiedFrontierYieldPerBudget), 0)
      .toFixed(6),
  );
  const summary = {
    candidateCount: input.candidates.length,
    statusCounts: countStatuses(input.candidates),
    topCandidateId: input.candidates[0]?.candidateId ?? null,
    posteriorEntropyBits: input.probabilityTerrain.posteriorEntropyBits,
    informationGainBits: input.probabilityTerrain.informationGainBits,
    verifiedFrontierYieldPerBudget,
    ...input.summary,
  };

  return {
    artifactId: THEORY_FRONTIER_SEARCH_ARTIFACT_ID,
    schemaVersion: THEORY_FRONTIER_SEARCH_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    searchId: input.searchId,
    graphId: input.graphId,
    graphHash: input.graphHash,
    query: input.query,
    searchSeed: input.searchSeed,
    taxonomyVersion: input.taxonomyVersion,
    scoringVersion: input.scoringVersion,
    verifierVersion: input.verifierVersion,
    candidates: input.candidates,
    vectorFieldTrace: input.vectorFieldTrace,
    scholarlyLookupRequests: input.scholarlyLookupRequests ?? [],
    probabilityTerrain: input.probabilityTerrain,
    stageTrace: input.stageTrace ?? buildStageTrace(input),
    optimization: buildOptimization(input),
    summary,
    methodAnchors: input.methodAnchors ?? THEORY_FRONTIER_METHOD_ANCHORS_V1,
    interpretation: {
      proceduralSearchPrecedentOnly: true,
      probabilitiesArePlacementUncertaintyOnly: true,
      noTheoryValidation: true,
      noAutomaticEdgePromotion: true,
    },
  };
}

export function validateTheoryFrontierSearchV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["frontier search must be an object"];

  if (value.artifactId !== THEORY_FRONTIER_SEARCH_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_FRONTIER_SEARCH_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_FRONTIER_SEARCH_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_FRONTIER_SEARCH_SCHEMA_VERSION}`);
  }
  for (
    const field of [
      "generatedAt",
      "searchId",
      "graphId",
      "graphHash",
      "query",
      "searchSeed",
      "taxonomyVersion",
      "scoringVersion",
      "verifierVersion",
    ] as const
  ) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!Array.isArray(value.candidates)) {
    issues.push("candidates must be an array");
  } else {
    for (const [index, candidate] of value.candidates.entries()) {
      for (const issue of validateTheoryFrontierCandidateV1(candidate)) {
        issues.push(`candidates[${index}].${issue}`);
      }
    }
  }

  if (!isRecord(value.vectorFieldTrace)) {
    issues.push("vectorFieldTrace must be an object");
  } else {
    for (const issue of validateTheoryFrontierVectorFieldTraceV1(value.vectorFieldTrace)) {
      issues.push(`vectorFieldTrace.${issue}`);
    }
    if (value.vectorFieldTrace.graphHash !== value.graphHash) {
      issues.push("vectorFieldTrace.graphHash must match graphHash");
    }
    if (value.vectorFieldTrace.query !== value.query) {
      issues.push("vectorFieldTrace.query must match query");
    }
    if (value.vectorFieldTrace.searchSeed !== value.searchSeed) {
      issues.push("vectorFieldTrace.searchSeed must match searchSeed");
    }
  }

  validateScholarlyLookupRequests(value.scholarlyLookupRequests, issues);

  for (const issue of validateProbabilityTerrainV1(value.probabilityTerrain)) {
    issues.push(`probabilityTerrain.${issue}`);
  }

  if (!isRecord(value.stageTrace)) {
    issues.push("stageTrace must be an object");
  } else {
    if (value.stageTrace.proceduralModel !== "coarse_to_fine_seed_finding_precedent") {
      issues.push("stageTrace.proceduralModel must be coarse_to_fine_seed_finding_precedent");
    }
    const expectedCheapFields = ["scale_envelope", "domain", "fidelity", "semantic_chunk", "claim_pressure"];
    if (
      !Array.isArray(value.stageTrace.cheapBiomeFields) ||
      expectedCheapFields.some((field, index) => value.stageTrace.cheapBiomeFields[index] !== field)
    ) {
      issues.push("stageTrace.cheapBiomeFields are invalid");
    }
    const expectedFilters = [
      "unit_dimensional_compatibility",
      "symbol_equation_family_compatibility",
      "shared_first_principles_ancestry",
      "allowed_typed_edge_semantics",
      "observable_artifact_requirements",
      "source_reference_falsifier_coverage",
    ];
    if (
      !Array.isArray(value.stageTrace.progressiveCongruenceFilters) ||
      expectedFilters.some((field, index) => value.stageTrace.progressiveCongruenceFilters[index] !== field)
    ) {
      issues.push("stageTrace.progressiveCongruenceFilters are invalid");
    }
    if (!isRecord(value.stageTrace.contextReuse)) {
      issues.push("stageTrace.contextReuse must be an object");
    } else {
      if (value.stageTrace.contextReuse.strategy !== "shared_biome_layout_and_connection_trace_cache") {
        issues.push("stageTrace.contextReuse.strategy is invalid");
      }
      if (value.stageTrace.contextReuse.amortizedAcrossCandidatePairs !== true) {
        issues.push("stageTrace.contextReuse.amortizedAcrossCandidatePairs must be true");
      }
      if (!Array.isArray(value.stageTrace.contextReuse.reusedContextKeys)) {
        issues.push("stageTrace.contextReuse.reusedContextKeys must be an array");
      }
    }
    if (!Array.isArray(value.stageTrace.stages) || value.stageTrace.stages.length !== 8) {
      issues.push("stageTrace.stages must contain eight stages");
    } else {
      const expectedStageNames: TheoryFrontierSearchStageNameV1[] = [
        "cheap_biome_field_scan",
        "unit_dimensional_filter",
        "symbol_equation_family_filter",
        "first_principles_ancestry_filter",
        "typed_edge_semantics_filter",
        "observable_artifact_filter",
        "source_reference_falsifier_filter",
        "exact_contract_verification_queue",
      ];
      for (const [index, stage] of value.stageTrace.stages.entries()) {
        const prefix = `stageTrace.stages[${index}]`;
        if (!isRecord(stage)) {
          issues.push(`${prefix} must be an object`);
          continue;
        }
        if (stage.order !== index + 1) issues.push(`${prefix}.order must be ${index + 1}`);
        if (stage.stageName !== expectedStageNames[index]) issues.push(`${prefix}.stageName is invalid`);
        if (!["candidate_generation", "scoring_filter", "verification_gate"].includes(String(stage.mode))) {
          issues.push(`${prefix}.mode is invalid`);
        }
        if (!["cheap", "progressive", "exact"].includes(String(stage.costTier))) {
          issues.push(`${prefix}.costTier is invalid`);
        }
        for (const field of ["inputCandidateCount", "scoredCandidateCount", "passedCandidateCount", "flaggedCandidateCount"] as const) {
          if (!isFiniteNumber(stage[field])) issues.push(`${prefix}.${field} must be a finite number`);
        }
        if (!Array.isArray(stage.retainedCandidateIds) || !stage.retainedCandidateIds.every((item: unknown) => typeof item === "string")) {
          issues.push(`${prefix}.retainedCandidateIds must be an array of strings`);
        }
        if (!Array.isArray(stage.evidenceFields) || !stage.evidenceFields.every((item: unknown) => typeof item === "string")) {
          issues.push(`${prefix}.evidenceFields must be an array of strings`);
        }
        if (stage.deterministic !== true) issues.push(`${prefix}.deterministic must be true`);
      }
    }
  }

  if (!isRecord(value.optimization)) {
    issues.push("optimization must be an object");
  } else {
    if (value.optimization.objectiveMetric !== "verified_frontier_yield_per_budget") {
      issues.push("optimization.objectiveMetric must be verified_frontier_yield_per_budget");
    }
    if (value.optimization.rawCandidateCountOptimized !== false) {
      issues.push("optimization.rawCandidateCountOptimized must be false");
    }
    if (
      value.optimization.recordDefinition !==
      "reproducible_improvement_in_research_throughput_evidence_closure_root_to_leaf_coverage_information_gain_or_false_positive_reduction"
    ) {
      issues.push("optimization.recordDefinition is invalid");
    }
    if (!isRecord(value.optimization.candidateBudget)) {
      issues.push("optimization.candidateBudget must be an object");
    } else {
      for (const field of ["requestedLimit", "evaluatedPairCount", "emittedCandidateCount", "totalEstimatedCost"] as const) {
        if (!isFiniteNumber(value.optimization.candidateBudget[field])) {
          issues.push(`optimization.candidateBudget.${field} must be a finite number`);
        }
      }
    }
    if (!Array.isArray(value.optimization.records)) {
      issues.push("optimization.records must be an array");
    } else {
      for (const [index, record] of value.optimization.records.entries()) {
        const prefix = `optimization.records[${index}]`;
        if (!isRecord(record)) {
          issues.push(`${prefix} must be an object`);
          continue;
        }
        for (const field of ["recordId", "candidateId", "recordKind", "metric", "comparisonBasis", "reason"] as const) {
          if (!isNonEmptyString(record[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        }
        if (record.comparisonBasis !== "within_replayed_candidate_set") {
          issues.push(`${prefix}.comparisonBasis must be within_replayed_candidate_set`);
        }
        if (!isFiniteNumber(record.value)) issues.push(`${prefix}.value must be a finite number`);
      }
    }
  }

  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
  } else {
    if (!isFiniteNumber(value.summary.candidateCount)) issues.push("summary.candidateCount must be a finite number");
    if (!isRecord(value.summary.statusCounts)) issues.push("summary.statusCounts must be an object");
    if (value.summary.topCandidateId !== null && typeof value.summary.topCandidateId !== "string") {
      issues.push("summary.topCandidateId must be a string or null");
    }
    for (
      const field of ["posteriorEntropyBits", "informationGainBits", "verifiedFrontierYieldPerBudget"] as const
    ) {
      if (!isFiniteNumber(value.summary[field])) issues.push(`summary.${field} must be a finite number`);
    }
  }

  validateMethodAnchors(value.methodAnchors, issues);

  if (!isRecord(value.interpretation)) {
    issues.push("interpretation must be an object");
  } else {
    for (
      const field of [
        "proceduralSearchPrecedentOnly",
        "probabilitiesArePlacementUncertaintyOnly",
        "noTheoryValidation",
        "noAutomaticEdgePromotion",
      ] as const
    ) {
      if (value.interpretation[field] !== true) issues.push(`interpretation.${field} must be true`);
    }
  }

  return issues;
}

export function isTheoryFrontierSearchV1(value: unknown): value is TheoryFrontierSearchV1 {
  return validateTheoryFrontierSearchV1(value).length === 0;
}
