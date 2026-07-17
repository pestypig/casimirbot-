export const PROBABILITY_TERRAIN_SCHEMA_VERSION = "probability_terrain/v1" as const;

export const PROBABILITY_TERRAIN_GRAPH_KINDS = [
  "theory_badge_graph",
  "moral_badge_graph",
  "generic_graph",
] as const;

export const PROBABILITY_TERRAIN_UNCERTAINTY_MODES = [
  "broad",
  "focused",
  "ambiguous",
] as const;

export const PROBABILITY_TERRAIN_COVERAGE_BASES = [
  "closed_world_default",
  "caller_calibrated",
  "absolute_match_score_heuristic",
  "semantic_coverage_heuristic",
  "no_candidates",
] as const;

export type ProbabilityTerrainGraphKindV1 = (typeof PROBABILITY_TERRAIN_GRAPH_KINDS)[number];
export type ProbabilityTerrainUncertaintyModeV1 = (typeof PROBABILITY_TERRAIN_UNCERTAINTY_MODES)[number];
export type ProbabilityTerrainCoverageBasisV1 = (typeof PROBABILITY_TERRAIN_COVERAGE_BASES)[number];

export type ProbabilityTerrainCandidateV1 = {
  id: string;
  weight: number;
  renderChunkId?: string | null;
  semanticChunkId?: string | null;
};

export type ProbabilityTerrainV1 = {
  schemaVersion: typeof PROBABILITY_TERRAIN_SCHEMA_VERSION;
  graphKind: ProbabilityTerrainGraphKindV1;
  candidateProbabilityById: Record<string, number>;
  renderChunkProbabilityById: Record<string, number>;
  semanticChunkProbabilityById: Record<string, number>;
  priorEntropyBits: number;
  posteriorEntropyBits: number;
  informationGainBits: number;
  normalizedMass: number;
  placementCertainty: number;
  uncertaintyMode: ProbabilityTerrainUncertaintyModeV1;
  dominantCandidateId: string | null;
  dominantRenderChunkId: string | null;
  dominantSemanticChunkId: string | null;
  interpretation: "placement_probability_not_truth_claim";
  /**
   * Open-world fields are additive v1 extensions. The legacy probability maps
   * remain conditional on the returned candidate set; these fields preserve
   * explicit probability mass for "none of the represented graph".
   */
  representedProbabilityMass?: number;
  outOfGraphProbability?: number;
  openWorldCandidateProbabilityById?: Record<string, number>;
  openWorldEntropyBits?: number;
  openWorldPlacementCertainty?: number;
  coverageBasis?: ProbabilityTerrainCoverageBasisV1;
  openWorldInterpretation?: "includes_out_of_graph_hypothesis_not_truth_claim";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function validateProbabilityMap(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const [key, probability] of Object.entries(value)) {
    if (!key) issues.push(`${prefix} keys must be non-empty`);
    if (!isFiniteNumber(probability)) {
      issues.push(`${prefix}.${key} must be a finite number`);
    } else if (probability < 0 || probability > 1) {
      issues.push(`${prefix}.${key} must be between 0 and 1`);
    }
  }
}

export function validateProbabilityTerrainV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["probability terrain must be an object"];

  if (value.schemaVersion !== PROBABILITY_TERRAIN_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${PROBABILITY_TERRAIN_SCHEMA_VERSION}`);
  }
  if (!PROBABILITY_TERRAIN_GRAPH_KINDS.includes(value.graphKind as ProbabilityTerrainGraphKindV1)) {
    issues.push("graphKind is invalid");
  }
  validateProbabilityMap("candidateProbabilityById", value.candidateProbabilityById, issues);
  validateProbabilityMap("renderChunkProbabilityById", value.renderChunkProbabilityById, issues);
  validateProbabilityMap("semanticChunkProbabilityById", value.semanticChunkProbabilityById, issues);
  for (
    const field of [
      "priorEntropyBits",
      "posteriorEntropyBits",
      "informationGainBits",
      "normalizedMass",
      "placementCertainty",
    ] as const
  ) {
    if (!isFiniteNumber(value[field])) {
      issues.push(`${field} must be a finite number`);
    } else if (value[field] < 0) {
      issues.push(`${field} must be non-negative`);
    }
  }
  if (!PROBABILITY_TERRAIN_UNCERTAINTY_MODES.includes(value.uncertaintyMode as ProbabilityTerrainUncertaintyModeV1)) {
    issues.push("uncertaintyMode is invalid");
  }
  for (const field of ["dominantCandidateId", "dominantRenderChunkId", "dominantSemanticChunkId"] as const) {
    if (value[field] !== null && typeof value[field] !== "string") {
      issues.push(`${field} must be a string or null`);
    }
  }
  if (value.interpretation !== "placement_probability_not_truth_claim") {
    issues.push("interpretation must be placement_probability_not_truth_claim");
  }

  const hasOpenWorldFields = [
    "representedProbabilityMass",
    "outOfGraphProbability",
    "openWorldCandidateProbabilityById",
    "openWorldEntropyBits",
    "openWorldPlacementCertainty",
    "coverageBasis",
    "openWorldInterpretation",
  ].some((field) => value[field] !== undefined);

  if (hasOpenWorldFields) {
    validateProbabilityMap(
      "openWorldCandidateProbabilityById",
      value.openWorldCandidateProbabilityById,
      issues,
    );
    for (const field of [
      "representedProbabilityMass",
      "outOfGraphProbability",
      "openWorldEntropyBits",
      "openWorldPlacementCertainty",
    ] as const) {
      if (!isFiniteNumber(value[field])) {
        issues.push(`${field} must be a finite number`);
      } else if (value[field] < 0 || ((field !== "openWorldEntropyBits") && value[field] > 1)) {
        issues.push(`${field} must be between 0 and 1`);
      }
    }
    if (!PROBABILITY_TERRAIN_COVERAGE_BASES.includes(value.coverageBasis as ProbabilityTerrainCoverageBasisV1)) {
      issues.push("coverageBasis is invalid");
    }
    if (value.openWorldInterpretation !== "includes_out_of_graph_hypothesis_not_truth_claim") {
      issues.push("openWorldInterpretation must be includes_out_of_graph_hypothesis_not_truth_claim");
    }

    if (isFiniteNumber(value.representedProbabilityMass) && isFiniteNumber(value.outOfGraphProbability)) {
      if (Math.abs(value.representedProbabilityMass + value.outOfGraphProbability - 1) > 0.00001) {
        issues.push("representedProbabilityMass plus outOfGraphProbability must equal 1");
      }
    }
    if (isRecord(value.openWorldCandidateProbabilityById) && isFiniteNumber(value.representedProbabilityMass)) {
      const representedSum = Object.values(value.openWorldCandidateProbabilityById)
        .filter(isFiniteNumber)
        .reduce((total, probability) => total + probability, 0);
      if (Math.abs(representedSum - value.representedProbabilityMass) > 0.00005) {
        issues.push("openWorldCandidateProbabilityById mass must equal representedProbabilityMass");
      }
    }
  }

  return issues;
}

export function isProbabilityTerrainV1(value: unknown): value is ProbabilityTerrainV1 {
  return validateProbabilityTerrainV1(value).length === 0;
}
