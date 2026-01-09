import { hashStableJson } from "../../utils/information-boundary";
import type { RidgeTrack } from "./curvature-metrics";

export type RidgeSurvivalCI = {
  lower: number;
  upper: number;
};

export type RidgeSurvivalPoint = {
  t_frames: number;
  survival: number;
  hazard: number;
  mean_residual_life: number;
  survival_ci?: RidgeSurvivalCI;
  hazard_ci?: RidgeSurvivalCI;
  mean_residual_life_ci?: RidgeSurvivalCI;
};

export type RidgeSurvivalBootstrap = {
  samples: number;
  seed: string;
  lower_q: number;
  upper_q: number;
};

export type RidgeSurvivalResult = {
  total_tracks: number;
  max_lifetime_frames: number;
  points: RidgeSurvivalPoint[];
  bootstrap?: RidgeSurvivalBootstrap;
};

export type RidgeSurvivalOptions = {
  bootstrap_samples?: number;
  seed?: string;
  ci_lower?: number;
  ci_upper?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const percentile = (values: number[], p: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = Math.min(1, Math.max(0, p)) * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const t = pos - lower;
  return sorted[lower] * (1 - t) + sorted[upper] * t;
};

const seedFrom = (value: unknown): number => {
  const hash = hashStableJson(value).replace(/^sha256:/, "");
  const seed = parseInt(hash.slice(0, 8), 16);
  return Number.isFinite(seed) ? seed : 0;
};

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const computeSurvivalSeries = (
  lifetimes: number[],
  maxLifetime: number,
) => {
  const total = lifetimes.length;
  const survival: number[] = [];
  const hazard: number[] = [];
  const meanResidual: number[] = [];
  let prevSurvival = 1;
  for (let t = 1; t <= maxLifetime; t += 1) {
    let survivors = 0;
    let residualSum = 0;
    for (const value of lifetimes) {
      if (value >= t) {
        survivors += 1;
        residualSum += value - t;
      }
    }
    const s = total > 0 ? clamp01(survivors / total) : 0;
    const h = prevSurvival > 0 ? clamp01((prevSurvival - s) / prevSurvival) : 0;
    const mrl = survivors > 0 ? residualSum / survivors : 0;
    survival.push(s);
    hazard.push(h);
    meanResidual.push(mrl);
    prevSurvival = s;
  }
  return { survival, hazard, meanResidual };
};

const resampleLifetimes = (lifetimes: number[], rng: () => number): number[] => {
  const out: number[] = [];
  for (let i = 0; i < lifetimes.length; i++) {
    const idx = Math.floor(rng() * lifetimes.length);
    out.push(lifetimes[idx]);
  }
  return out;
};

export const buildRidgeSurvival = (
  tracks: RidgeTrack[],
  options?: RidgeSurvivalOptions,
): RidgeSurvivalResult => {
  const lifetimes = tracks
    .map((track) => track.lifetime_frames)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!lifetimes.length) {
    return { total_tracks: 0, max_lifetime_frames: 0, points: [] };
  }
  const maxLifetime = Math.max(...lifetimes);
  const baseSeries = computeSurvivalSeries(lifetimes, maxLifetime);
  const points: RidgeSurvivalPoint[] = baseSeries.survival.map((s, idx) => ({
    t_frames: idx + 1,
    survival: s,
    hazard: baseSeries.hazard[idx] ?? 0,
    mean_residual_life: baseSeries.meanResidual[idx] ?? 0,
  }));

  const samples = Math.max(0, Math.floor(options?.bootstrap_samples ?? 0));
  if (samples <= 0) {
    return {
      total_tracks: lifetimes.length,
      max_lifetime_frames: maxLifetime,
      points,
    };
  }

  const seed =
    options?.seed ??
    hashStableJson({ lifetimes, max_lifetime_frames: maxLifetime });
  const lower_q = clamp01(options?.ci_lower ?? 0.05);
  const upper_q = clamp01(options?.ci_upper ?? 0.95);
  const rng = mulberry32(seedFrom(`${seed}:ridge_survival`));

  const survivalSamples = Array.from({ length: maxLifetime }, () => [] as number[]);
  const hazardSamples = Array.from({ length: maxLifetime }, () => [] as number[]);
  const mrlSamples = Array.from({ length: maxLifetime }, () => [] as number[]);

  for (let b = 0; b < samples; b += 1) {
    const resampled = resampleLifetimes(lifetimes, rng);
    const series = computeSurvivalSeries(resampled, maxLifetime);
    for (let i = 0; i < maxLifetime; i++) {
      survivalSamples[i].push(series.survival[i] ?? 0);
      hazardSamples[i].push(series.hazard[i] ?? 0);
      mrlSamples[i].push(series.meanResidual[i] ?? 0);
    }
  }

  for (let i = 0; i < points.length; i++) {
    if (survivalSamples[i].length) {
      points[i].survival_ci = {
        lower: percentile(survivalSamples[i], lower_q),
        upper: percentile(survivalSamples[i], upper_q),
      };
    }
    if (hazardSamples[i].length) {
      points[i].hazard_ci = {
        lower: percentile(hazardSamples[i], lower_q),
        upper: percentile(hazardSamples[i], upper_q),
      };
    }
    if (mrlSamples[i].length) {
      points[i].mean_residual_life_ci = {
        lower: percentile(mrlSamples[i], lower_q),
        upper: percentile(mrlSamples[i], upper_q),
      };
    }
  }

  return {
    total_tracks: lifetimes.length,
    max_lifetime_frames: maxLifetime,
    points,
    bootstrap: {
      samples,
      seed,
      lower_q,
      upper_q,
    },
  };
};
