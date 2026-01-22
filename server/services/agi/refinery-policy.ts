import type { AgiEvidence, AgiRefinerySummary, AgiTrajectory } from "@shared/agi-refinery";
import {
  difficultyKey,
  intentKey,
  strategyKey,
  surfaceKey,
} from "./refinery-axes";

export type RefinerySamplingPolicy = {
  createdAt: string;
  acceptanceFloor: number;
  acceptanceRate: number;
  alphaTarget?: number;
  intentWeights: Record<string, number>;
  evidenceWeights: Record<string, number>;
  strategyWeights: Record<string, number>;
  difficultyWeights: Record<string, number>;
  surfaceWeights: Record<string, number>;
  surfaceMinimums?: Record<string, number>;
  intentMaximums?: Record<string, number>;
  minClientServerShare?: number;
  maxDocsSharedShare?: number;
  throttled: boolean;
};

const clampRatio = (value: number): number => Math.min(Math.max(value, 0), 1);

const parseRatio = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return clampRatio(parsed);
};

const parseRatioWithDefault = (value: string | undefined, fallback: number): number => {
  const parsed = parseRatio(value);
  return parsed === undefined ? fallback : parsed;
};

const computeWeights = (counts?: Record<string, number>): Record<string, number> => {
  if (!counts) return {};
  const weights: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts)) {
    const count = Number(value);
    if (!Number.isFinite(count) || count <= 0) {
      weights[key] = 1;
    } else {
      weights[key] = 1 / Math.sqrt(count);
    }
  }
  return weights;
};

const averageEvidenceWeight = (
  evidence: AgiEvidence[],
  weights: Record<string, number>,
): number => {
  if (evidence.length === 0) return 1;
  const total = evidence.reduce((sum, item) => {
    const key = item.kind ?? "unknown";
    return sum + (weights[key] ?? 1);
  }, 0);
  return total / evidence.length;
};

export const buildSamplingPolicy = (
  summary: AgiRefinerySummary,
  options?: { acceptanceFloor?: number },
): RefinerySamplingPolicy => {
  const acceptanceFloor = options?.acceptanceFloor ?? 0.6;
  const acceptanceRate = summary.acceptanceRate ?? 0;
  const throttled = acceptanceRate < acceptanceFloor;
  const intentWeights = computeWeights(summary.byIntent);
  const evidenceWeights = computeWeights(summary.byEvidenceKind);
  const strategyWeights = computeWeights(summary.byStrategy);
  const difficultyWeights = computeWeights(summary.byDifficulty);
  const surfaceWeights = computeWeights(summary.bySurface);
  const alphaTarget = parseRatio(process.env.AGI_REFINERY_ALPHA_TARGET);
  const minClientShare = parseRatioWithDefault(
    process.env.AGI_REFINERY_MIN_CLIENT_SHARE,
    0.25,
  );
  const minServerShare = parseRatioWithDefault(
    process.env.AGI_REFINERY_MIN_SERVER_SHARE,
    0.25,
  );
  const minClientServerShare = parseRatioWithDefault(
    process.env.AGI_REFINERY_MIN_CLIENT_SERVER_SHARE,
    0.5,
  );
  const maxDocsSharedShare = parseRatioWithDefault(
    process.env.AGI_REFINERY_MAX_DOCS_SHARED_SHARE,
    0.5,
  );
  const maxWarpShare = parseRatioWithDefault(
    process.env.AGI_REFINERY_MAX_WARP_SHARE,
    0.5,
  );
  if (throttled) {
    for (const key of Object.keys(intentWeights)) {
      intentWeights[key] = intentWeights[key] * 0.7;
    }
    for (const key of Object.keys(evidenceWeights)) {
      evidenceWeights[key] = evidenceWeights[key] * 0.7;
    }
    for (const key of Object.keys(strategyWeights)) {
      strategyWeights[key] = strategyWeights[key] * 0.7;
    }
    for (const key of Object.keys(difficultyWeights)) {
      difficultyWeights[key] = difficultyWeights[key] * 0.7;
    }
    for (const key of Object.keys(surfaceWeights)) {
      surfaceWeights[key] = surfaceWeights[key] * 0.7;
    }
  }
  return {
    createdAt: new Date().toISOString(),
    acceptanceFloor,
    acceptanceRate,
    alphaTarget,
    intentWeights,
    evidenceWeights,
    strategyWeights,
    difficultyWeights,
    surfaceWeights,
    surfaceMinimums: {
      client: minClientShare,
      server: minServerShare,
    },
    intentMaximums: {
      warp: maxWarpShare,
    },
    minClientServerShare,
    maxDocsSharedShare,
    throttled,
  };
};

export const scoreTrajectoryForSampling = (
  trajectory: AgiTrajectory,
  policy: RefinerySamplingPolicy,
): number => {
  const intentWeight = policy.intentWeights[intentKey(trajectory.z)] ?? 1;
  const evidenceWeight = averageEvidenceWeight(trajectory.E ?? [], policy.evidenceWeights);
  const strategyWeight = policy.strategyWeights[strategyKey(trajectory)] ?? 1;
  const difficultyWeight =
    policy.difficultyWeights[difficultyKey(trajectory)] ?? 1;
  const surfaceWeight = policy.surfaceWeights[surfaceKey(trajectory)] ?? 1;
  return intentWeight * evidenceWeight * strategyWeight * difficultyWeight * surfaceWeight;
};
