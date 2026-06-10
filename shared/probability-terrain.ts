import {
  PROBABILITY_TERRAIN_SCHEMA_VERSION,
  type ProbabilityTerrainCandidateV1,
  type ProbabilityTerrainGraphKindV1,
  type ProbabilityTerrainUncertaintyModeV1,
  type ProbabilityTerrainV1,
} from "./contracts/probability-terrain.v1";

export type BuildProbabilityTerrainInputV1 = {
  graphKind: ProbabilityTerrainGraphKindV1;
  candidates: ProbabilityTerrainCandidateV1[];
};

function roundProbability(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function entropyBits(probabilities: number[]): number {
  return Number(
    probabilities
      .filter((probability) => probability > 0)
      .reduce((entropy, probability) => entropy - probability * Math.log2(probability), 0)
      .toFixed(6),
  );
}

function dominantId(probabilities: Record<string, number>): string | null {
  const entries = Object.entries(probabilities);
  if (entries.length === 0) return null;
  return entries.sort(([leftId, leftProbability], [rightId, rightProbability]) => {
    const delta = rightProbability - leftProbability;
    return delta !== 0 ? delta : leftId.localeCompare(rightId);
  })[0][0];
}

function candidateProbabilityById(candidates: ProbabilityTerrainCandidateV1[]): Record<string, number> {
  if (candidates.length === 0) return {};
  const weights = candidates.map((candidate) => Math.max(0, candidate.weight));
  const totalWeight = sum(weights);
  if (totalWeight <= 0) {
    const uniform = roundProbability(1 / candidates.length);
    return Object.fromEntries(candidates.map((candidate) => [candidate.id, uniform]));
  }
  return Object.fromEntries(
    candidates.map((candidate, index) => [candidate.id, roundProbability(weights[index] / totalWeight)]),
  );
}

function aggregateProbabilityByKey(
  probabilitiesById: Record<string, number>,
  candidatesById: Map<string, ProbabilityTerrainCandidateV1>,
  key: "renderChunkId" | "semanticChunkId",
): Record<string, number> {
  const aggregate = new Map<string, number>();
  for (const [candidateId, probability] of Object.entries(probabilitiesById)) {
    const chunkId = candidatesById.get(candidateId)?.[key];
    if (!chunkId) continue;
    aggregate.set(chunkId, (aggregate.get(chunkId) ?? 0) + probability);
  }
  return Object.fromEntries(
    [...aggregate.entries()]
      .map(([chunkId, probability]) => [chunkId, roundProbability(probability)] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function uncertaintyMode(args: {
  candidateCount: number;
  priorEntropyBits: number;
  posteriorEntropyBits: number;
  candidateProbabilityById: Record<string, number>;
}): ProbabilityTerrainUncertaintyModeV1 {
  if (args.candidateCount === 0) return "broad";
  const topProbability = Math.max(0, ...Object.values(args.candidateProbabilityById));
  if (
    topProbability >= 0.55 ||
    (args.priorEntropyBits > 0 && args.posteriorEntropyBits <= args.priorEntropyBits * 0.45)
  ) {
    return "focused";
  }
  if (args.priorEntropyBits === 0 || args.posteriorEntropyBits >= args.priorEntropyBits * 0.78) {
    return "broad";
  }
  return "ambiguous";
}

export function buildProbabilityTerrainV1(input: BuildProbabilityTerrainInputV1): ProbabilityTerrainV1 {
  const candidates = input.candidates.filter((candidate) => candidate.id.trim().length > 0);
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const probabilities = candidateProbabilityById(candidates);
  const renderChunkProbabilityById = aggregateProbabilityByKey(probabilities, candidatesById, "renderChunkId");
  const semanticChunkProbabilityById = aggregateProbabilityByKey(probabilities, candidatesById, "semanticChunkId");
  const priorEntropyBits = candidates.length > 0 ? Number(Math.log2(candidates.length).toFixed(6)) : 0;
  const posteriorEntropyBits = entropyBits(Object.values(probabilities));
  const informationGainBits = Number(Math.max(0, priorEntropyBits - posteriorEntropyBits).toFixed(6));

  return {
    schemaVersion: PROBABILITY_TERRAIN_SCHEMA_VERSION,
    graphKind: input.graphKind,
    candidateProbabilityById: probabilities,
    renderChunkProbabilityById,
    semanticChunkProbabilityById,
    priorEntropyBits,
    posteriorEntropyBits,
    informationGainBits,
    normalizedMass: roundProbability(sum(Object.values(probabilities))),
    placementCertainty: priorEntropyBits > 0 ? roundProbability(clamp01(informationGainBits / priorEntropyBits)) : candidates.length === 1 ? 1 : 0,
    uncertaintyMode: uncertaintyMode({
      candidateCount: candidates.length,
      priorEntropyBits,
      posteriorEntropyBits,
      candidateProbabilityById: probabilities,
    }),
    dominantCandidateId: dominantId(probabilities),
    dominantRenderChunkId: dominantId(renderChunkProbabilityById),
    dominantSemanticChunkId: dominantId(semanticChunkProbabilityById),
    interpretation: "placement_probability_not_truth_claim",
  };
}

export * from "./contracts/probability-terrain.v1";
