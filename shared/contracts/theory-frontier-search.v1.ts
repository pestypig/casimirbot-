import {
  type ProbabilityTerrainV1,
  validateProbabilityTerrainV1,
} from "./probability-terrain.v1";
import type { HelixAskSourceTargetRequestedOutput } from "../helix-ask-source-target-intent";
import {
  type TheoryFrontierCandidateV1,
  validateTheoryFrontierCandidateV1,
} from "./theory-frontier-candidate.v1";

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
  scholarlyLookupRequests: TheoryFrontierScholarlyLookupRequestV1[];
  probabilityTerrain: ProbabilityTerrainV1;
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
  "artifactId" | "schemaVersion" | "generatedAt" | "scholarlyLookupRequests" | "summary" | "methodAnchors" | "interpretation"
> & {
  generatedAt?: string;
  scholarlyLookupRequests?: TheoryFrontierScholarlyLookupRequestV1[];
  summary?: Partial<TheoryFrontierSearchV1["summary"]>;
  methodAnchors?: readonly TheoryFrontierMethodAnchorV1[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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
    for (const field of ["requestedOutputs", "badgeIds", "renderChunkIds", "semanticChunkIds"] as const) {
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
    scholarlyLookupRequests: input.scholarlyLookupRequests ?? [],
    probabilityTerrain: input.probabilityTerrain,
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

  validateScholarlyLookupRequests(value.scholarlyLookupRequests, issues);

  for (const issue of validateProbabilityTerrainV1(value.probabilityTerrain)) {
    issues.push(`probabilityTerrain.${issue}`);
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

  if (!Array.isArray(value.methodAnchors) || value.methodAnchors.length === 0) {
    issues.push("methodAnchors must be a non-empty array");
  }

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
