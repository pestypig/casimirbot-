import { mkdirSync, writeFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {
  TokamakPrecursorDataset,
  TokamakCulpabilityArtifact,
  TokamakPrecursorReport,
  TokamakPrecursorScoreKey,
  type TTokamakCulpabilityArtifact,
  type TTokamakPrecursorControlScenario,
  type TTokamakPrecursorControlSummary,
  type TTokamakPrecursorStatSummary,
  type TTokamakPrecursorDataset,
  type TTokamakPrecursorFrameMetrics,
  type TTokamakPrecursorFrameResult,
  type TTokamakPrecursorReport,
  type TTokamakPrecursorScoreKey,
} from "@shared/tokamak-precursor";
import { buildFluxBandMasks } from "@shared/tokamak-flux-coords";
import { withDerivedArtifactInformationBoundary } from "@shared/information-boundary-derived";
import { buildTokamakRzEnergyFromSnapshot } from "../server/services/essence/tokamak-energy-adapter";
import {
  computeCurvatureDiagnosticsFromFields,
  type CurvatureBandSummary,
  type CurvatureDiagnosticsSummary,
} from "../server/skills/physics.curvature";
import {
  computePhaseLockScore,
  trackRidgeSequence,
  type RidgeTrack,
  type RidgeTrackingConfig,
} from "../server/services/physics/curvature-metrics";
import type { TCurvatureBoundaryCondition2D } from "@shared/essence-physics";
import { scanK3FrequencyBand } from "../server/services/physics/curvature-phase-lock";
import { buildRidgeSurvival } from "../server/services/physics/ridge-survival";
import { computeTokamakStabilityProxies } from "../server/services/physics/tokamak-stability-proxies";
import { buildInformationBoundary, hashStableJson } from "../server/utils/information-boundary";
import { stableJsonStringify } from "../server/utils/stable-json";

const DEFAULT_DATASET_PATH = path.resolve(process.cwd(), "datasets", "tokamak-rz-precursor.fixture.json");

type RunOptions = {
  dataset_path?: string;
  score_key?: TTokamakPrecursorScoreKey;
  generated_at_iso?: string;
  tracking?: RidgeTrackingConfig;
  banding?: {
    edge_band_m?: number;
    sol_band_m?: number;
  };
  flux_banding?: {
    core_max?: number;
    edge_max?: number;
  };
  phase_lock?: {
    min_hz?: number;
    max_hz?: number;
    grid_size?: number;
    band_threshold_ratio?: number;
    window_cycles?: number;
    slip_drop?: number;
    slip_floor?: number;
    growth_window_s?: number;
    growth_min_samples?: number;
  };
  boundary?: TCurvatureBoundaryCondition2D;
  characteristics?: {
    tau_alfven_s?: number;
    alfven_length_m?: number;
    alfven_speed_m_s?: number;
    tau_E_s?: number;
  };
  robustness?: {
    bootstrap_samples?: number;
    seed?: string;
    weight_jitter?: number;
    grid_resample_factor?: number;
  };
  control?: {
    enabled?: boolean;
    objective_weights?: Partial<ControlObjectiveWeights>;
    u_J_ramp?: {
      start_factor?: number;
      end_factor?: number;
    };
    u_gradp_scale?: number;
    drive_hz?: {
      scale?: number;
      amplitude?: number;
    };
  };
  artifacts?: {
    dir?: string;
    write_culpability?: boolean;
    culpability_path?: string;
  };
};

type ControlObjectiveWeights = {
  k2: number;
  fragmentation_rate: number;
  k1: number;
  k3: number;
};

const decodeFloat32Raster = (b64: string, expectedCount: number, label: string): Float32Array => {
  const clean = (b64 ?? "").trim().replace(/^data:[^,]+,/, "").replace(/\s+/g, "");
  const buf = Buffer.from(clean, "base64");
  const expectedBytes = expectedCount * 4;
  if (buf.byteLength !== expectedBytes) {
    throw new Error(`${label}_size_mismatch: expected ${expectedBytes} bytes, got ${buf.byteLength}`);
  }
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};

const encodeFloat32Raster = (arr: Float32Array): string =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");

const buildMaskOn = (mask: Float32Array): Uint8Array => {
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    out[i] = mask[i] > 0 ? 1 : 0;
  }
  return out;
};

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

const collectMaskedValues = (arr: Float32Array, maskOn?: Uint8Array): number[] => {
  const values: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (maskOn && !maskOn[i]) continue;
    const v = arr[i];
    if (Number.isFinite(v)) {
      values.push(v);
    }
  }
  return values;
};

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

const toEpochSeconds = (iso: string): number | null => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms / 1000 : null;
};

const coerceFinite = (value: number | undefined | null, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readMetricValue = (
  metrics: TTokamakPrecursorFrameMetrics,
  key: string,
): number | undefined => {
  const value = metrics[key as keyof TTokamakPrecursorFrameMetrics];
  return typeof value === "number" ? value : undefined;
};

const clampContribution = (value: number): number =>
  Math.max(-1, Math.min(1, value));

const FEATURE_KEYS = [
  "k0",
  "k1",
  "k2",
  "fragmentation_rate",
  "ridge_count",
  "ridge_length_m",
  "ridge_lifetime_p50",
  "ridge_lifetime_p90",
  "k2_dt",
  "fragmentation_dt",
] as const;

const PHYSICS_FEATURE_KEYS = [
  "u_total_p95",
  "u_deltaB_p95",
  "u_rad_p95",
  "gradp_p95",
  "gradp_edge_p95",
  "current_p95",
  "current_edge_p95",
  "psi_core_fraction",
  "psi_edge_fraction",
] as const;

const CURVATURE_FEATURE_KEYS = [
  "k0",
  "k1",
  "k2",
  "fragmentation_rate",
  "ridge_count",
  "ridge_length_m",
  "ridge_lifetime_p50",
  "ridge_lifetime_p90",
  "k2_dt",
  "fragmentation_dt",
  "k3",
] as const;

const HAZARD_FEATURE_KEYS = [
  "k2",
  "k2_dt",
  "ridge_count",
  "ridge_lifetime_mean",
  "ridge_length_density",
] as const;

const DEFAULT_CONTROL_WEIGHTS: ControlObjectiveWeights = {
  k2: 1,
  fragmentation_rate: 0.7,
  k1: 0.35,
  k3: 0.2,
};

type LogisticModel = {
  weights: number[];
  bias: number;
  means: number[];
  scales: number[];
};

const buildFeatureVector = (metrics: TTokamakPrecursorFrameMetrics): number[] =>
  FEATURE_KEYS.map((key) => coerceFinite(readMetricValue(metrics, key)));

const buildPhysicsFeatureVector = (
  metrics: TTokamakPrecursorFrameMetrics,
): number[] => {
  const proxies = metrics.stability_proxies;
  const values: Record<string, number | undefined> = {
    u_total_p95: metrics.u_total_p95,
    u_deltaB_p95: metrics.u_deltaB_p95,
    u_rad_p95: metrics.u_rad_p95,
    gradp_p95: proxies?.gradp_p95 ?? metrics.u_gradp_p95,
    gradp_edge_p95: proxies?.gradp_edge_p95,
    current_p95: proxies?.current_p95 ?? metrics.u_J_p95,
    current_edge_p95: proxies?.current_edge_p95,
    psi_core_fraction: proxies?.psi_core_fraction,
    psi_edge_fraction: proxies?.psi_edge_fraction,
  };
  return PHYSICS_FEATURE_KEYS.map((key) => coerceFinite(values[key]));
};

const buildCurvatureFeatureVector = (
  metrics: TTokamakPrecursorFrameMetrics,
): number[] =>
  CURVATURE_FEATURE_KEYS.map((key) =>
    coerceFinite(readMetricValue(metrics, key)),
  );

const buildHazardVector = (metrics: TTokamakPrecursorFrameMetrics): number[] =>
  HAZARD_FEATURE_KEYS.map((key) => coerceFinite(readMetricValue(metrics, key)));

const sigmoid = (value: number): number => {
  const clamped = Math.max(-60, Math.min(60, value));
  return 1 / (1 + Math.exp(-clamped));
};

const standardizeVectors = (vectors: number[][]) => {
  if (vectors.length === 0) {
    return { standardized: vectors, means: [] as number[], scales: [] as number[] };
  }
  const dim = vectors[0].length;
  const means = new Array(dim).fill(0);
  const scales = new Array(dim).fill(0);
  for (const row of vectors) {
    for (let i = 0; i < dim; i++) {
      means[i] += row[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    means[i] /= vectors.length;
  }
  for (const row of vectors) {
    for (let i = 0; i < dim; i++) {
      const diff = row[i] - means[i];
      scales[i] += diff * diff;
    }
  }
  for (let i = 0; i < dim; i++) {
    const variance = scales[i] / Math.max(1, vectors.length);
    const std = Math.sqrt(variance);
    scales[i] = std > 0 ? std : 1;
  }
  const standardized = vectors.map((row) =>
    row.map((value, i) => (value - means[i]) / scales[i]),
  );
  return { standardized, means, scales };
};

const trainLogisticModel = (
  vectors: number[][],
  labels: number[],
): LogisticModel => {
  const { standardized, means, scales } = standardizeVectors(vectors);
  const dim = standardized[0]?.length ?? 0;
  const weights = new Array(dim).fill(0);
  let bias = 0;
  if (vectors.length === 0 || dim === 0) {
    return { weights, bias, means, scales };
  }
  const lr = 0.4;
  const l2 = 0.01;
  const iterations = 250;
  for (let iter = 0; iter < iterations; iter += 1) {
    const grad = new Array(dim).fill(0);
    let gradBias = 0;
    for (let i = 0; i < standardized.length; i++) {
      const row = standardized[i];
      let z = bias;
      for (let j = 0; j < dim; j++) {
        z += weights[j] * row[j];
      }
      const p = sigmoid(z);
      const err = p - labels[i];
      gradBias += err;
      for (let j = 0; j < dim; j++) {
        grad[j] += err * row[j];
      }
    }
    const invN = 1 / standardized.length;
    for (let j = 0; j < dim; j++) {
      weights[j] -= lr * (grad[j] * invN + l2 * weights[j]);
    }
    bias -= lr * gradBias * invN;
  }
  return { weights, bias, means, scales };
};

const predictLogistic = (vector: number[], model: LogisticModel): number => {
  let z = model.bias;
  for (let i = 0; i < model.weights.length; i++) {
    const scaled = (vector[i] - model.means[i]) / model.scales[i];
    z += model.weights[i] * scaled;
  }
  return sigmoid(z);
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

const shuffleInPlace = (arr: number[], rng: () => number): void => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

const pearsonCorr = (a: number[], b: number[]): number | null => {
  if (a.length !== b.length || a.length === 0) return null;
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < a.length; i++) {
    meanA += a[i];
    meanB += b[i];
  }
  meanA /= a.length;
  meanB /= b.length;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const denom = Math.sqrt(denA * denB);
  if (denom <= 0) return null;
  return num / denom;
};

const toBandMetrics = (
  band?: CurvatureBandSummary,
): NonNullable<TTokamakPrecursorFrameMetrics["bands"]>["core"] | undefined => {
  if (!band) return undefined;
  return {
    k0: band.k_metrics.k0,
    k1: band.k_metrics.k1,
    k2: band.k_metrics.k2,
    ridge_count: band.ridge_summary.ridge_count,
    ridge_length_m: band.ridge_summary.ridge_length_m,
    fragmentation_index: band.ridge_summary.fragmentation_index,
    coverage: band.coverage,
  };
};

const toFluxBandMetrics = (
  diag: CurvatureDiagnosticsSummary | undefined,
  coverage: number | undefined,
): NonNullable<TTokamakPrecursorFrameMetrics["bands"]>["core"] | undefined =>
  diag
    ? toBandMetrics({
        k_metrics: diag.k_metrics,
        ridge_summary: diag.ridge_summary,
        coverage: coverage ?? 0,
      })
    : undefined;

const buildCoherenceBudget = (
  channels: Partial<Record<string, CurvatureDiagnosticsSummary>>,
): TTokamakPrecursorFrameMetrics["coherence_budget"] => {
  const channelMetrics: NonNullable<TTokamakPrecursorFrameMetrics["coherence_budget"]>["channels"] = {};
  const k2Values: Array<{ key: string; value: number }> = [];
  const fragValues: Array<{ key: string; value: number }> = [];
  for (const [key, diag] of Object.entries(channels)) {
    if (!diag) continue;
    const k2 = diag.k_metrics.k2;
    const fragmentation = diag.ridge_summary.fragmentation_index;
    channelMetrics[key as keyof typeof channelMetrics] = {
      k2,
      fragmentation_index: fragmentation,
    };
    if (Number.isFinite(k2)) k2Values.push({ key, value: k2 });
    if (Number.isFinite(fragmentation)) fragValues.push({ key, value: fragmentation });
  }
  if (Object.keys(channelMetrics).length === 0) {
    return undefined;
  }
  const k2Sum = k2Values.reduce((sum, entry) => sum + entry.value, 0);
  const k2Share: NonNullable<TTokamakPrecursorFrameMetrics["coherence_budget"]>["k2_share"] = {};
  if (k2Sum > 0) {
    for (const entry of k2Values) {
      k2Share[entry.key as keyof typeof k2Share] = entry.value / k2Sum;
    }
  }
  const leadingK2 = k2Values.sort((a, b) => b.value - a.value)[0]?.key;
  const leadingFrag = fragValues.sort((a, b) => b.value - a.value)[0]?.key;
  return {
    channels: channelMetrics,
    ...(k2Sum > 0 ? { k2_share: k2Share } : {}),
    ...(leadingK2 ? { leading_k2_channel: leadingK2 } : {}),
    ...(leadingFrag ? { leading_fragmentation_channel: leadingFrag } : {}),
  };
};

const summarizeValues = (
  values: Array<number | undefined | null>,
): TTokamakPrecursorStatSummary | undefined => {
  const clean = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (!clean.length) return undefined;
  const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
  return {
    count: clean.length,
    mean,
    p50: percentile(clean, 0.5),
    p90: percentile(clean, 0.9),
  };
};

const computeCoherenceObjective = (
  metrics: TTokamakPrecursorFrameMetrics,
  weights: ControlObjectiveWeights,
): number | undefined => {
  const hasMetric = [
    metrics.k1,
    metrics.k2,
    metrics.fragmentation_rate,
    metrics.k3,
  ].some((value) => Number.isFinite(value ?? NaN));
  if (!hasMetric) return undefined;
  const k1 = coerceFinite(metrics.k1);
  const k2 = coerceFinite(metrics.k2);
  const frag = coerceFinite(metrics.fragmentation_rate);
  const k3 = coerceFinite(metrics.k3);
  return (
    weights.k2 * k2 +
    weights.fragmentation_rate * frag -
    weights.k1 * k1 -
    weights.k3 * k3
  );
};

const buildControlSummary = (
  frames: Array<{ metrics: TTokamakPrecursorFrameMetrics }>,
  tracking: { tracks: RidgeTrack[] },
  weights: ControlObjectiveWeights,
): TTokamakPrecursorControlSummary => {
  const k1 = summarizeValues(frames.map((frame) => frame.metrics.k1));
  const k2 = summarizeValues(frames.map((frame) => frame.metrics.k2));
  const k3 = summarizeValues(frames.map((frame) => frame.metrics.k3));
  const frag = summarizeValues(frames.map((frame) => frame.metrics.fragmentation_rate));
  const ridgeCount = summarizeValues(frames.map((frame) => frame.metrics.ridge_count));
  const ridgeLength = summarizeValues(frames.map((frame) => frame.metrics.ridge_length_m));
  const ridgeP50 = summarizeValues(frames.map((frame) => frame.metrics.ridge_lifetime_p50));
  const ridgeP90 = summarizeValues(frames.map((frame) => frame.metrics.ridge_lifetime_p90));
  const objective = summarizeValues(
    frames.map((frame) => computeCoherenceObjective(frame.metrics, weights)),
  );
  const ridgeSurvival = buildRidgeSurvival(tracking.tracks);
  const summary: TTokamakPrecursorControlSummary = {};
  if (k1) summary.k1 = k1;
  if (k2) summary.k2 = k2;
  if (k3) summary.k3 = k3;
  if (frag) summary.fragmentation_rate = frag;
  if (ridgeCount) summary.ridge_count = ridgeCount;
  if (ridgeLength) summary.ridge_length_m = ridgeLength;
  if (ridgeP50) summary.ridge_lifetime_p50 = ridgeP50;
  if (ridgeP90) summary.ridge_lifetime_p90 = ridgeP90;
  if (objective) summary.coherence_objective = objective;
  if (ridgeSurvival.total_tracks > 0) {
    summary.ridge_survival = {
      total_tracks: ridgeSurvival.total_tracks,
      max_lifetime_frames: ridgeSurvival.max_lifetime_frames,
    };
  }
  return summary;
};

const diffStatSummary = (
  next?: TTokamakPrecursorStatSummary,
  base?: TTokamakPrecursorStatSummary,
): TTokamakPrecursorStatSummary | undefined => {
  if (!next && !base) return undefined;
  const diff = (a?: number, b?: number) =>
    a !== undefined && b !== undefined ? a - b : undefined;
  return {
    count: next?.count ?? base?.count ?? 0,
    mean: diff(next?.mean, base?.mean),
    p50: diff(next?.p50, base?.p50),
    p90: diff(next?.p90, base?.p90),
  };
};

const diffControlSummary = (
  next?: TTokamakPrecursorControlSummary,
  base?: TTokamakPrecursorControlSummary,
): TTokamakPrecursorControlSummary | undefined => {
  if (!next && !base) return undefined;
  const summary: TTokamakPrecursorControlSummary = {};
  const k1 = diffStatSummary(next?.k1, base?.k1);
  const k2 = diffStatSummary(next?.k2, base?.k2);
  const k3 = diffStatSummary(next?.k3, base?.k3);
  const frag = diffStatSummary(next?.fragmentation_rate, base?.fragmentation_rate);
  const ridgeCount = diffStatSummary(next?.ridge_count, base?.ridge_count);
  const ridgeLength = diffStatSummary(next?.ridge_length_m, base?.ridge_length_m);
  const ridgeP50 = diffStatSummary(next?.ridge_lifetime_p50, base?.ridge_lifetime_p50);
  const ridgeP90 = diffStatSummary(next?.ridge_lifetime_p90, base?.ridge_lifetime_p90);
  const objective = diffStatSummary(next?.coherence_objective, base?.coherence_objective);
  if (k1) summary.k1 = k1;
  if (k2) summary.k2 = k2;
  if (k3) summary.k3 = k3;
  if (frag) summary.fragmentation_rate = frag;
  if (ridgeCount) summary.ridge_count = ridgeCount;
  if (ridgeLength) summary.ridge_length_m = ridgeLength;
  if (ridgeP50) summary.ridge_lifetime_p50 = ridgeP50;
  if (ridgeP90) summary.ridge_lifetime_p90 = ridgeP90;
  if (objective) summary.coherence_objective = objective;
  if (next?.ridge_survival || base?.ridge_survival) {
    const totalTracks =
      (next?.ridge_survival?.total_tracks ?? 0) -
      (base?.ridge_survival?.total_tracks ?? 0);
    const maxLifetime =
      (next?.ridge_survival?.max_lifetime_frames ?? 0) -
      (base?.ridge_survival?.max_lifetime_frames ?? 0);
    if (totalTracks >= 0 && maxLifetime >= 0) {
      summary.ridge_survival = {
        total_tracks: totalTracks,
        max_lifetime_frames: maxLifetime,
      };
    }
  }
  return summary;
};

type PhaseLockSample = {
  t_s: number;
  k1: number;
  frame_id: string;
  timestamp_iso: string;
  label: boolean;
};

const buildPhaseLockSamples = (
  frames: Array<{
    id: string;
    timestamp_iso: string;
    t_s: number | null;
    label: { event_present: boolean };
    metrics: { k1?: number };
  }>,
): PhaseLockSample[] =>
  frames.map((frame, index) => ({
    t_s: Number.isFinite(frame.t_s) ? (frame.t_s as number) : index,
    k1: coerceFinite(frame.metrics.k1, 0),
    frame_id: frame.id,
    timestamp_iso: frame.timestamp_iso,
    label: frame.label.event_present,
  }));

const computeMedianDt = (times: number[]): number => {
  const diffs: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const dt = times[i] - times[i - 1];
    if (dt > 0) diffs.push(dt);
  }
  return diffs.length ? percentile(diffs, 0.5) : 1;
};

const buildFrequencyGrid = (
  times: number[],
  opts?: RunOptions["phase_lock"],
): number[] => {
  if (times.length < 2) return [];
  const total = times[times.length - 1] - times[0];
  const medianDt = computeMedianDt(times);
  const minHz = opts?.min_hz ?? (total > 0 ? 1 / total : 0);
  const maxHz = opts?.max_hz ?? (medianDt > 0 ? 0.5 / medianDt : 0);
  if (!Number.isFinite(minHz) || !Number.isFinite(maxHz) || maxHz <= minHz || maxHz <= 0) {
    return [];
  }
  const gridSize = Math.max(3, Math.floor(opts?.grid_size ?? 24));
  const step = (maxHz - minHz) / Math.max(1, gridSize - 1);
  return Array.from({ length: gridSize }, (_, i) => minHz + step * i);
};

const findDominantFrequency = (
  samples: Array<{ t_s: number; k1: number }>,
  frequencies: number[],
) => {
  if (!samples.length || frequencies.length === 0) {
    return { f_mode_hz: undefined, k3: undefined };
  }
  let bestF = frequencies[0];
  let bestScore = -1;
  for (const freq of frequencies) {
    const score = computePhaseLockScore(samples, freq);
    if (score > bestScore) {
      bestScore = score;
      bestF = freq;
    }
  }
  return { f_mode_hz: bestF, k3: bestScore >= 0 ? bestScore : undefined };
};

const buildDetuningSeries = (
  samples: PhaseLockSample[],
  frequencies: number[],
  fStar: number,
  bandwidth: { width_hz: number },
  window_s: number,
) => {
  const halfWindow = window_s / 2;
  return samples.map((sample) => {
    const window = samples.filter(
      (entry) => Math.abs(entry.t_s - sample.t_s) <= halfWindow,
    );
    const series = window.map((entry) => ({ t_s: entry.t_s, k1: entry.k1 }));
    const { f_mode_hz } = findDominantFrequency(series, frequencies);
    const delta =
      f_mode_hz !== undefined && bandwidth.width_hz > 0
        ? (f_mode_hz - fStar) / bandwidth.width_hz
        : undefined;
    return {
      frame_id: sample.frame_id,
      timestamp_iso: sample.timestamp_iso,
      t_s: sample.t_s,
      label: sample.label,
      f_mode_hz,
      delta,
      abs_delta: delta !== undefined ? Math.abs(delta) : undefined,
    };
  });
};

const computeGrowthTauSeries = (
  times: number[],
  values: Array<number | undefined>,
  opts?: RunOptions["phase_lock"],
): Array<number | undefined> => {
  if (times.length < 3) return new Array(values.length).fill(undefined);
  const window = opts?.growth_window_s ?? Math.max(1, computeMedianDt(times) * 3);
  const minSamples = Math.max(3, Math.floor(opts?.growth_min_samples ?? 3));
  const minVal = 1e-6;
  const out: Array<number | undefined> = new Array(values.length).fill(undefined);
  for (let i = 0; i < times.length; i++) {
    const tEnd = times[i];
    let start = i;
    while (start > 0 && tEnd - times[start - 1] <= window) {
      start -= 1;
    }
    const sliceTimes: number[] = [];
    const sliceLogs: number[] = [];
    for (let j = start; j <= i; j++) {
      const value = values[j];
      if (!Number.isFinite(value ?? NaN)) continue;
      sliceTimes.push(times[j]);
      sliceLogs.push(Math.log(Math.max(minVal, value as number)));
    }
    if (sliceTimes.length < minSamples) continue;
    const meanT = sliceTimes.reduce((sum, v) => sum + v, 0) / sliceTimes.length;
    const meanY = sliceLogs.reduce((sum, v) => sum + v, 0) / sliceLogs.length;
    let cov = 0;
    let varT = 0;
    for (let k = 0; k < sliceTimes.length; k++) {
      const dt = sliceTimes[k] - meanT;
      const dy = sliceLogs[k] - meanY;
      cov += dt * dy;
      varT += dt * dt;
    }
    if (varT <= 0) continue;
    const gamma = cov / varT;
    if (gamma > 0) {
      out[i] = 1 / gamma;
    }
  }
  return out;
};

const summarizeStats = (values: number[]) => {
  if (!values.length) return { count: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    count: values.length,
    mean,
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
  };
};

const medianFinite = (values: Array<number | undefined>): number | undefined => {
  const cleaned = values.filter((value) => Number.isFinite(value ?? NaN)) as number[];
  return cleaned.length ? percentile(cleaned, 0.5) : undefined;
};

const summarizeByLabel = (
  values: Array<number | undefined>,
  labels: boolean[],
) => {
  const stable: number[] = [];
  const unstable: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (!Number.isFinite(value ?? NaN)) continue;
    if (labels[i]) {
      unstable.push(value as number);
    } else {
      stable.push(value as number);
    }
  }
  return {
    stable: stable.length ? summarizeStats(stable) : undefined,
    unstable: unstable.length ? summarizeStats(unstable) : undefined,
  };
};

const buildRocCurve = (pairs: Array<{ score: number; label: boolean }>) => {
  if (!pairs.length) return { auc: null as number | null, roc: [] as Array<{ threshold: number; tpr: number; fpr: number }> };
  const sorted = [...pairs].sort((a, b) => b.score - a.score);
  const pos = sorted.filter((p) => p.label).length;
  const neg = sorted.length - pos;
  if (pos === 0 || neg === 0) {
    return { auc: null as number | null, roc: [] };
  }
  let tp = 0;
  let fp = 0;
  let tpPrev = 0;
  let fpPrev = 0;
  let aucSum = 0;
  const roc: Array<{ threshold: number; tpr: number; fpr: number }> = [];
  for (const pair of sorted) {
    if (pair.label) tp += 1;
    else fp += 1;
    const tpr = tp / pos;
    const fpr = fp / neg;
    aucSum += (fp - fpPrev) * (tp + tpPrev) / 2;
    tpPrev = tp;
    fpPrev = fp;
    roc.push({ threshold: pair.score, tpr, fpr });
  }
  const auc = aucSum / (pos * neg);
  return { auc, roc };
};

const selectOperatingPoint = (
  roc: Array<{ threshold: number; tpr: number; fpr: number }>,
) => {
  if (!roc.length) return null;
  let best = roc[0];
  let bestScore = best.tpr - best.fpr;
  for (const point of roc) {
    const score = point.tpr - point.fpr;
    if (score > bestScore) {
      best = point;
      bestScore = score;
    }
  }
  return { threshold: best.threshold, fpr: best.fpr, tpr: best.tpr };
};

const computeFalseAlarmRate = (
  frames: Array<{ score: number; label: boolean }>,
  threshold: number,
): number => {
  const negatives = frames.filter((frame) => !frame.label);
  if (!negatives.length) return 0;
  const falsePos = negatives.filter((frame) => frame.score >= threshold).length;
  return falsePos / negatives.length;
};

const computeLeadTimeSummary = (
  frames: Array<{
    score: number;
    label: boolean;
    t_s: number;
  }>,
  threshold: number,
) => {
  const leadTimes: number[] = [];
  for (let i = 0; i < frames.length; i++) {
    if (!frames[i].label) continue;
    if (i > 0 && frames[i - 1].label) continue;
    let alarmIndex = -1;
    for (let j = i - 1; j >= 0; j -= 1) {
      if (frames[j].score >= threshold) {
        alarmIndex = j;
        break;
      }
    }
    if (alarmIndex >= 0) {
      const dt = frames[i].t_s - frames[alarmIndex].t_s;
      if (Number.isFinite(dt) && dt >= 0) {
        leadTimes.push(dt);
      }
    }
  }
  if (!leadTimes.length) {
    return { count: 0 };
  }
  return {
    count: leadTimes.length,
    mean: leadTimes.reduce((sum, v) => sum + v, 0) / leadTimes.length,
    p50: percentile(leadTimes, 0.5),
    p90: percentile(leadTimes, 0.9),
  };
};

const buildBootstrapCI = (
  samples: number[],
  totalSamples: number,
  label: "bootstrap" | "jackknife",
) => {
  if (!samples.length) return undefined;
  return {
    method: label,
    samples: totalSamples,
    mean: samples.reduce((sum, v) => sum + v, 0) / samples.length,
    p50: percentile(samples, 0.5),
    lower: percentile(samples, 0.05),
    upper: percentile(samples, 0.95),
  };
};

const buildJackknifeCI = (samples: number[]) => {
  if (samples.length < 2) return undefined;
  const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length;
  let variance = 0;
  for (const value of samples) {
    variance += (value - mean) ** 2;
  }
  const n = samples.length;
  const stdError = Math.sqrt(((n - 1) / n) * variance);
  return {
    method: "jackknife",
    samples: samples.length,
    mean,
    std_error: stdError,
    lower: mean - 1.96 * stdError,
    upper: mean + 1.96 * stdError,
  };
};

const runBootstrap = (args: {
  frames: Array<{ score: number; label: boolean; t_s: number }>;
  threshold: number;
  samples: number;
  seed: string;
}) => {
  const rng = mulberry32(seedFrom(`${args.seed}:bootstrap`));
  const indices = Array.from({ length: args.frames.length }, (_, i) => i);
  const aucSamples: number[] = [];
  const farSamples: number[] = [];
  const leadSamples: number[] = [];
  for (let b = 0; b < args.samples; b++) {
    const resample: Array<{ score: number; label: boolean; t_s: number }> = [];
    for (let i = 0; i < indices.length; i++) {
      const idx = Math.floor(rng() * indices.length);
      resample.push(args.frames[indices[idx]]);
    }
    const pairs = resample.map((frame) => ({ score: frame.score, label: frame.label }));
    const roc = buildRocCurve(pairs);
    if (roc.auc !== null) {
      aucSamples.push(roc.auc);
    }
    farSamples.push(computeFalseAlarmRate(resample, args.threshold));
    const leadSummary = computeLeadTimeSummary(resample, args.threshold);
    if (leadSummary.p50 !== undefined) {
      leadSamples.push(leadSummary.p50);
    }
  }
  return { aucSamples, farSamples, leadSamples };
};

const runJackknife = (args: {
  frames: Array<{ score: number; label: boolean; t_s: number }>;
  threshold: number;
}) => {
  const aucSamples: number[] = [];
  const farSamples: number[] = [];
  const leadSamples: number[] = [];
  for (let i = 0; i < args.frames.length; i++) {
    const subset = args.frames.filter((_, index) => index !== i);
    if (subset.length < 2) continue;
    const pairs = subset.map((frame) => ({ score: frame.score, label: frame.label }));
    const roc = buildRocCurve(pairs);
    if (roc.auc !== null) {
      aucSamples.push(roc.auc);
    }
    farSamples.push(computeFalseAlarmRate(subset, args.threshold));
    const leadSummary = computeLeadTimeSummary(subset, args.threshold);
    if (leadSummary.p50 !== undefined) {
      leadSamples.push(leadSummary.p50);
    }
  }
  return { aucSamples, farSamples, leadSamples };
};

const computeFeatureSensitivity = (args: {
  featureVectors: number[][];
  labels: boolean[];
  model: LogisticModel;
  seed: string;
}) => {
  const baselineScores = args.featureVectors.map((row) => predictLogistic(row, args.model));
  const baselinePairs = baselineScores.map((score, idx) => ({
    score,
    label: args.labels[idx],
  }));
  const baselineAuc = buildRocCurve(baselinePairs).auc;
  if (baselineAuc === null) {
    return undefined;
  }
  const means = args.featureVectors[0].map((_, idx) => {
    let sum = 0;
    for (const row of args.featureVectors) sum += row[idx];
    return sum / args.featureVectors.length;
  });
  const ablation: Record<string, { auc: number | null; auc_delta: number | null }> = {};
  const permutation: Record<string, { auc: number | null; auc_delta: number | null }> = {};
  for (let i = 0; i < FEATURE_KEYS.length; i++) {
    const key = FEATURE_KEYS[i];
    const ablatedVectors = args.featureVectors.map((row) => {
      const next = [...row];
      next[i] = means[i];
      return next;
    });
    const ablatedScores = ablatedVectors.map((row) => predictLogistic(row, args.model));
    const ablatedPairs = ablatedScores.map((score, idx) => ({
      score,
      label: args.labels[idx],
    }));
    const ablatedAuc = buildRocCurve(ablatedPairs).auc;
    ablation[key] = {
      auc: ablatedAuc,
      auc_delta:
        ablatedAuc !== null ? ablatedAuc - baselineAuc : null,
    };

    const permutedVectors = args.featureVectors.map((row) => [...row]);
    const column = permutedVectors.map((row) => row[i]);
    const rng = mulberry32(seedFrom(`${args.seed}:permute:${key}`));
    shuffleInPlace(column, rng);
    for (let r = 0; r < permutedVectors.length; r++) {
      permutedVectors[r][i] = column[r];
    }
    const permScores = permutedVectors.map((row) => predictLogistic(row, args.model));
    const permPairs = permScores.map((score, idx) => ({
      score,
      label: args.labels[idx],
    }));
    const permAuc = buildRocCurve(permPairs).auc;
    permutation[key] = {
      auc: permAuc,
      auc_delta: permAuc !== null ? permAuc - baselineAuc : null,
    };
  }
  return { ablation, permutation };
};

type EnergyContext = {
  id: string;
  timestamp_iso: string;
  label: { event_present: boolean };
  t_s: number;
  grid: { nx: number; ny: number; dx_m: number; dy_m: number; thickness_m?: number };
  frame: { kind: "rz-plane"; r_min_m: number; r_max_m: number; z_min_m: number; z_max_m: number; axis_order?: ["r", "z"] };
  u_total: Float32Array;
  mask: Float32Array | null;
};

type SeedFrame = {
  id: string;
  timestamp_iso: string;
  label: { event_present: boolean };
  metrics: TTokamakPrecursorFrameMetrics;
  k_metrics: CurvatureDiagnosticsSummary["k_metrics"];
  ridge_summary: CurvatureDiagnosticsSummary["ridge_summary"];
  ridges: CurvatureDiagnosticsSummary["ridges"];
  band_metrics?: TTokamakPrecursorFrameMetrics["bands"];
  coherence_budget?: TTokamakPrecursorFrameMetrics["coherence_budget"];
  area_m2?: number;
  t_s: number;
};

const buildSeedFramesFromContexts = (
  contexts: EnergyContext[],
  boundary: TCurvatureBoundaryCondition2D,
): SeedFrame[] =>
  contexts.map((context) => {
    const maskOn = context.mask ? buildMaskOn(context.mask) : undefined;
    const values = collectMaskedValues(context.u_total, maskOn);
    const dx = context.grid.dx_m ?? 1;
    const dy = context.grid.dy_m ?? 1;
    const area_m2 = context.grid.nx * dx * context.grid.ny * dy;
    const metrics: TTokamakPrecursorFrameMetrics = {
      u_total_p95: percentile(values, 0.95),
    };
    const grid = {
      ...context.grid,
      thickness_m: context.grid.thickness_m ?? 1,
    };
    const frame = {
      ...context.frame,
      axis_order: context.frame.axis_order ?? ["r", "z"],
    };
    const curvature = computeCurvatureDiagnosticsFromFields({
      grid,
      frame,
      boundary,
      u_field: context.u_total,
      mask: context.mask ?? undefined,
    });
    return {
      id: context.id,
      timestamp_iso: context.timestamp_iso,
      label: context.label,
      metrics,
      k_metrics: curvature.k_metrics,
      ridge_summary: curvature.ridge_summary,
      ridges: curvature.ridges,
      area_m2,
      t_s: context.t_s,
    };
  });

const buildFramesWithTracking = (
  seedFrames: SeedFrame[],
  trackingOpts: RidgeTrackingConfig | undefined,
) => {
  const tracking = trackRidgeSequence(
    seedFrames.map((frame) => ({
      t_s: frame.t_s,
      k1: frame.k_metrics.k1,
      ridges: frame.ridges,
    })),
    trackingOpts,
  );
  const trackIndex = new Map(tracking.tracks.map((track) => [track.id, track]));
  const enrichedFrames = seedFrames.map((frame, index) => {
    const trackingFrame = tracking.frames[index];
    const ridges = trackingFrame?.ridges ?? frame.ridges;
    const ridgeLength = ridges.length
      ? ridges.reduce((sum, ridge) => sum + ridge.length_m, 0)
      : frame.ridge_summary.ridge_length_m;
    const lifetimes = ridges.map((ridge) => {
      const id = ridge.id;
      const track = id ? trackIndex.get(id) : undefined;
      return track ? index - track.first_frame + 1 : 1;
    });
    const lifetimeMean =
      lifetimes.length > 0
        ? lifetimes.reduce((sum, value) => sum + value, 0) / lifetimes.length
        : undefined;
    const fragmentationEvents =
      (trackingFrame?.new_count ?? 0) + (trackingFrame?.ended_count ?? 0);
    const fragmentation_rate_per_m =
      ridgeLength > 0 ? fragmentationEvents / ridgeLength : 0;
    const area_m2 = frame.area_m2;
    const ridge_length_density =
      area_m2 && area_m2 > 0 ? ridgeLength / area_m2 : undefined;
    const edgeK2 = frame.band_metrics?.edge?.k2;
    const coreK2 = frame.band_metrics?.core?.k2;
    const edgeCoreDecoupling =
      edgeK2 !== undefined && coreK2 !== undefined ? edgeK2 - coreK2 : undefined;
    const edgeCoreRatio =
      edgeK2 !== undefined && coreK2 !== undefined && coreK2 > 0
        ? edgeK2 / coreK2
        : undefined;
    const metrics: TTokamakPrecursorFrameMetrics = {
      ...frame.metrics,
      k0: frame.k_metrics.k0,
      k1: frame.k_metrics.k1,
      k2: frame.k_metrics.k2,
      ...(tracking.k3 !== undefined ? { k3: tracking.k3 } : {}),
      ridge_count: trackingFrame?.ridge_count ?? frame.ridge_summary.ridge_count,
      ridge_length_m: ridgeLength,
      fragmentation_rate: trackingFrame?.fragmentation_rate ?? 0,
      fragmentation_index: frame.ridge_summary.fragmentation_index,
      fragmentation_rate_per_m,
      ridge_lifetime_p50: percentile(lifetimes, 0.5),
      ridge_lifetime_p90: percentile(lifetimes, 0.9),
      ...(lifetimeMean !== undefined ? { ridge_lifetime_mean: lifetimeMean } : {}),
      ...(ridge_length_density !== undefined
        ? { ridge_length_density }
        : {}),
      ...(edgeCoreDecoupling !== undefined
        ? { edge_core_decoupling_k2: edgeCoreDecoupling }
        : {}),
      ...(edgeCoreRatio !== undefined ? { edge_core_ratio_k2: edgeCoreRatio } : {}),
      ...(frame.band_metrics ? { bands: frame.band_metrics } : {}),
      ...(frame.coherence_budget ? { coherence_budget: frame.coherence_budget } : {}),
    };
    return { ...frame, metrics, fragmentation_events: fragmentationEvents };
  });

  const framesWithRates = enrichedFrames.map((frame, index) => {
    if (index === 0) {
      const metrics: TTokamakPrecursorFrameMetrics = {
        ...frame.metrics,
        k2_dt: 0,
        fragmentation_dt: 0,
        fragmentation_rate_per_s: 0,
      };
      return { ...frame, metrics };
    }
    const prev = enrichedFrames[index - 1];
    const currentTime = coerceFinite(frame.t_s, index);
    const prevTime = coerceFinite(prev.t_s, index - 1);
    const dtRaw = currentTime - prevTime;
    const dt = dtRaw > 0 ? dtRaw : 1;
    const k2_dt =
      (coerceFinite(frame.metrics.k2) - coerceFinite(prev.metrics.k2)) / dt;
    const fragmentation_dt =
      (coerceFinite(frame.metrics.fragmentation_rate) -
        coerceFinite(prev.metrics.fragmentation_rate)) /
      dt;
    const fragmentation_rate_per_s =
      coerceFinite((frame as { fragmentation_events?: number }).fragmentation_events) /
      dt;
    const metrics: TTokamakPrecursorFrameMetrics = {
      ...frame.metrics,
      k2_dt,
      fragmentation_dt,
      fragmentation_rate_per_s,
    };
    return { ...frame, metrics };
  });

  return { framesWithRates, tracking };
};

const scaleRasterPayload = <T extends { data_b64: string }>(
  payload: T | undefined,
  expectedCount: number,
  factor: number,
  label: string,
): T | undefined => {
  if (!payload) return undefined;
  const arr = decodeFloat32Raster(payload.data_b64, expectedCount, label);
  for (let i = 0; i < arr.length; i++) {
    arr[i] *= factor;
  }
  return { ...payload, data_b64: encodeFloat32Raster(arr) };
};

const rampFactor = (index: number, total: number, start: number, end: number): number => {
  if (total <= 1) return end;
  const t = Math.min(1, Math.max(0, index / (total - 1)));
  const smooth = smoothstep(t);
  return start + (end - start) * smooth;
};

const driveModulationFactor = (
  t_s: number,
  drive_hz: number,
  amplitude: number,
): number => {
  if (!Number.isFinite(drive_hz) || drive_hz <= 0) return 1;
  const safeAmp = Math.min(1, Math.max(0, amplitude));
  if (safeAmp === 0) return 1;
  const phase = 2 * Math.PI * drive_hz * t_s;
  const factor = 1 + safeAmp * Math.sin(phase);
  return Math.max(0, factor);
};

const buildEnergyContextsFromSnapshots = (
  frames: TTokamakPrecursorDataset["frames"],
  startEpoch: number | null,
  transform?: (
    snapshot: TTokamakPrecursorDataset["frames"][number]["snapshot"],
    index: number,
    total: number,
  ) => TTokamakPrecursorDataset["frames"][number]["snapshot"] | null,
): EnergyContext[] | null => {
  const contexts: EnergyContext[] = [];
  const totalFrames = frames.length;
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const snapshot = transform
      ? transform(frame.snapshot, index, totalFrames)
      : frame.snapshot;
    if (!snapshot) {
      return null;
    }
    const energy = buildTokamakRzEnergyFromSnapshot(snapshot);
    const expectedCount = energy.grid.nx * energy.grid.ny;
    const mask = decodeFloat32Raster(
      energy.separatrix_mask.data_b64,
      expectedCount,
      "separatrix_mask",
    );
    const total = decodeFloat32Raster(
      energy.components.u_total_Jm3.data_b64,
      expectedCount,
      "u_total_Jm3",
    );
    const epoch = toEpochSeconds(frame.timestamp_iso);
    const t_s = startEpoch !== null && epoch !== null ? epoch - startEpoch : 0;
    contexts.push({
      id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      label: frame.label,
      t_s,
      grid: energy.grid,
      frame: energy.frame,
      u_total: total,
      mask,
    });
  }
  return contexts;
};

const downsampleField = (
  field: Float32Array,
  mask: Float32Array | null,
  grid: { nx: number; ny: number; dx_m: number; dy_m: number; thickness_m?: number },
  factor: number,
): { field: Float32Array; mask: Float32Array | null; grid: typeof grid } | null => {
  if (factor <= 1) return { field, mask, grid };
  const nx = grid.nx;
  const ny = grid.ny;
  const newNx = Math.floor(nx / factor);
  const newNy = Math.floor(ny / factor);
  if (newNx < 2 || newNy < 2) return null;
  const out = new Float32Array(newNx * newNy);
  const outMask = mask ? new Float32Array(newNx * newNy) : null;
  for (let y = 0; y < newNy; y++) {
    for (let x = 0; x < newNx; x++) {
      let sum = 0;
      let sumMask = 0;
      let count = 0;
      for (let yy = 0; yy < factor; yy++) {
        for (let xx = 0; xx < factor; xx++) {
          const srcX = x * factor + xx;
          const srcY = y * factor + yy;
          if (srcX >= nx || srcY >= ny) continue;
          const idx = srcY * nx + srcX;
          sum += field[idx];
          if (mask) sumMask += mask[idx];
          count += 1;
        }
      }
      const outIdx = y * newNx + x;
      out[outIdx] = count > 0 ? sum / count : 0;
      if (outMask) {
        outMask[outIdx] = count > 0 ? sumMask / count : 0;
      }
    }
  }
  return {
    field: out,
    mask: outMask,
    grid: {
      ...grid,
      nx: newNx,
      ny: newNy,
      dx_m: grid.dx_m * factor,
      dy_m: grid.dy_m * factor,
    },
  };
};

const perturbSnapshotWeights = (
  snapshot: TTokamakPrecursorDataset["frames"][number]["snapshot"],
  jitter: number,
  rng: () => number,
) => {
  const nextManifest = {
    ...snapshot.manifest,
    channels: snapshot.manifest.channels.map((entry) => {
      const delta = (rng() * 2 - 1) * jitter;
      const nextWeight = Math.max(1e-6, entry.weight * (1 + delta));
      return { ...entry, weight: nextWeight };
    }),
  };
  return { ...snapshot, manifest: nextManifest };
};

const scoreFromContexts = (args: {
  contexts: EnergyContext[];
  scoreKey: TTokamakPrecursorScoreKey;
  comboModel: LogisticModel | null;
  tracking?: RidgeTrackingConfig;
  boundary: TCurvatureBoundaryCondition2D;
}) => {
  const seedFrames = buildSeedFramesFromContexts(args.contexts, args.boundary);
  const { framesWithRates } = buildFramesWithTracking(seedFrames, args.tracking);
  const featureVectors = framesWithRates.map((frame) =>
    buildFeatureVector(frame.metrics),
  );
  const scores = framesWithRates.map((frame, index) => {
    if (args.scoreKey === "k_combo_v1") {
      if (!args.comboModel) return null;
      return predictLogistic(featureVectors[index], args.comboModel);
    }
    const value = readMetricValue(frame.metrics, args.scoreKey);
    return value ?? null;
  });
  const pairs = scores
    .map((score, idx) => ({
      score,
      label: framesWithRates[idx].label.event_present,
    }))
    .filter((pair): pair is { score: number; label: boolean } => pair.score !== null);
  const roc = buildRocCurve(pairs);
  return { scores, auc: roc.auc };
};
export async function loadTokamakPrecursorDataset(
  datasetPath = DEFAULT_DATASET_PATH,
): Promise<TTokamakPrecursorDataset> {
  const src = await fs.readFile(datasetPath, "utf8");
  return TokamakPrecursorDataset.parse(JSON.parse(src));
}

export function runTokamakPrecursorDataset(
  dataset: TTokamakPrecursorDataset,
  opts: RunOptions = {},
): TTokamakPrecursorReport {
  const normalized = TokamakPrecursorDataset.parse(dataset);
  const scoreKey = TokamakPrecursorScoreKey.parse(opts.score_key ?? "k_combo_v1");
  const boundary = opts.boundary ?? "dirichlet0";
  const startEpoch = normalized.frames.length > 0
    ? toEpochSeconds(normalized.frames[0].timestamp_iso)
    : null;
  const energyContexts: EnergyContext[] = [];

  const seedFrames = normalized.frames.map((frame) => {
    const energy = buildTokamakRzEnergyFromSnapshot(frame.snapshot);
    const expectedCount = energy.grid.nx * energy.grid.ny;
    const mask = decodeFloat32Raster(
      energy.separatrix_mask.data_b64,
      expectedCount,
      "separatrix_mask",
    );
    const maskOn = buildMaskOn(mask);
    const total = decodeFloat32Raster(
      energy.components.u_total_Jm3.data_b64,
      expectedCount,
      "u_total_Jm3",
    );
    const values = collectMaskedValues(total, maskOn);
    const dx = energy.grid.dx_m ?? 1;
    const dy = energy.grid.dy_m ?? 1;
    const area_m2 = energy.grid.nx * dx * energy.grid.ny * dy;
    const metrics: TTokamakPrecursorFrameMetrics = {
      u_total_p95: percentile(values, 0.95),
      u_deltaB_p95: energy.components.u_deltaB_Jm3
        ? percentile(
            collectMaskedValues(
              decodeFloat32Raster(
                energy.components.u_deltaB_Jm3.data_b64,
                expectedCount,
                "u_deltaB_Jm3",
              ),
              maskOn,
            ),
            0.95,
          )
        : undefined,
      u_gradp_p95: energy.components.u_gradp
        ? percentile(
            collectMaskedValues(
              decodeFloat32Raster(
                energy.components.u_gradp.data_b64,
                expectedCount,
                "u_gradp",
              ),
              maskOn,
            ),
            0.95,
          )
        : undefined,
      u_J_p95: energy.components.u_J
        ? percentile(
            collectMaskedValues(
              decodeFloat32Raster(
                energy.components.u_J.data_b64,
                expectedCount,
                "u_J",
              ),
              maskOn,
            ),
            0.95,
          )
        : undefined,
      u_rad_p95: energy.components.u_rad
        ? percentile(
            collectMaskedValues(
              decodeFloat32Raster(
                energy.components.u_rad.data_b64,
                expectedCount,
                "u_rad",
              ),
              maskOn,
            ),
            0.95,
          )
        : undefined,
    };

    const channelFields: Partial<Record<string, Float32Array>> = {
      u_deltaB_Jm3: energy.components.u_deltaB_Jm3
        ? decodeFloat32Raster(
            energy.components.u_deltaB_Jm3.data_b64,
            expectedCount,
            "u_deltaB_Jm3",
          )
        : undefined,
      u_gradp: energy.components.u_gradp
        ? decodeFloat32Raster(
            energy.components.u_gradp.data_b64,
            expectedCount,
            "u_gradp",
          )
        : undefined,
      u_J: energy.components.u_J
        ? decodeFloat32Raster(energy.components.u_J.data_b64, expectedCount, "u_J")
        : undefined,
      u_rad: energy.components.u_rad
        ? decodeFloat32Raster(energy.components.u_rad.data_b64, expectedCount, "u_rad")
        : undefined,
    };
    const psiN = frame.snapshot.equilibrium?.psi_N
      ? decodeFloat32Raster(
          frame.snapshot.equilibrium.psi_N.data_b64,
          expectedCount,
          "psi_N",
        )
      : null;
    const stabilityProxies = computeTokamakStabilityProxies({
      u_gradp: channelFields.u_gradp ?? null,
      u_J: channelFields.u_J ?? null,
      psi_N: psiN,
      mask,
      flux_banding: opts.flux_banding,
    });
    if (stabilityProxies) {
      metrics.stability_proxies = stabilityProxies;
    }

    const curvature = computeCurvatureDiagnosticsFromFields({
      grid: energy.grid,
      frame: energy.frame,
      boundary,
      u_field: total,
      mask,
      banding: opts.banding,
    });
    let bandMetrics: TTokamakPrecursorFrameMetrics["bands"] | undefined;
    if (psiN) {
      const fluxBands = buildFluxBandMasks(psiN, {
        core_max: opts.flux_banding?.core_max,
        edge_max: opts.flux_banding?.edge_max,
        mask,
      });
      const coreDiag = fluxBands.coverage.core > 0
        ? computeCurvatureDiagnosticsFromFields({
            grid: energy.grid,
            frame: energy.frame,
            boundary,
            u_field: total,
            mask: fluxBands.core,
          })
        : undefined;
      const edgeDiag = fluxBands.coverage.edge > 0
        ? computeCurvatureDiagnosticsFromFields({
            grid: energy.grid,
            frame: energy.frame,
            boundary,
            u_field: total,
            mask: fluxBands.edge,
          })
        : undefined;
      const solDiag = fluxBands.coverage.sol > 0
        ? computeCurvatureDiagnosticsFromFields({
            grid: energy.grid,
            frame: energy.frame,
            boundary,
            u_field: total,
            mask: fluxBands.sol,
          })
        : undefined;
      bandMetrics = {
        core: toFluxBandMetrics(coreDiag, fluxBands.coverage.core),
        edge: toFluxBandMetrics(edgeDiag, fluxBands.coverage.edge),
        sol: toFluxBandMetrics(solDiag, fluxBands.coverage.sol),
      };
    } else if (curvature.band_metrics) {
      bandMetrics = {
        core: toBandMetrics(curvature.band_metrics.core),
        edge: toBandMetrics(curvature.band_metrics.edge),
        sol: toBandMetrics(curvature.band_metrics.sol),
      };
    }

    const channelDiagnostics: Partial<Record<string, CurvatureDiagnosticsSummary>> = {};
    for (const [key, field] of Object.entries(channelFields)) {
      if (!field) continue;
      channelDiagnostics[key] = computeCurvatureDiagnosticsFromFields({
        grid: energy.grid,
        frame: energy.frame,
        boundary,
        u_field: field,
        mask,
      });
    }
    const coherenceBudget = buildCoherenceBudget(channelDiagnostics);

    const epoch = toEpochSeconds(frame.timestamp_iso);
    const t_s = startEpoch !== null && epoch !== null ? epoch - startEpoch : 0;
    energyContexts.push({
      id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      label: frame.label,
      t_s,
      grid: energy.grid,
      frame: energy.frame,
      u_total: total,
      mask,
    });
    return {
      id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      label: frame.label,
      metrics,
      k_metrics: curvature.k_metrics,
      ridge_summary: curvature.ridge_summary,
      ridges: curvature.ridges,
      band_metrics: bandMetrics,
      coherence_budget: coherenceBudget,
      area_m2,
      t_s,
    };
  });

  const { framesWithRates, tracking } = buildFramesWithTracking(
    seedFrames,
    opts.tracking,
  );

  const phaseSamples = buildPhaseLockSamples(framesWithRates);
  const phaseTimes = phaseSamples.map((sample) => sample.t_s);
  const phaseMedianDt = phaseTimes.length > 1 ? computeMedianDt(phaseTimes) : 1;
  const windowCycles = opts.phase_lock?.window_cycles ?? 3;
  const frequencyGrid = buildFrequencyGrid(phaseTimes, opts.phase_lock);
  const phaseScan = scanK3FrequencyBand(phaseSamples, frequencyGrid, {
    window_cycles: windowCycles,
    min_window_s: phaseMedianDt,
    band_threshold_ratio: opts.phase_lock?.band_threshold_ratio,
    slip_drop: opts.phase_lock?.slip_drop,
    slip_floor: opts.phase_lock?.slip_floor,
  });
  const window_s =
    phaseScan.fStar && phaseScan.fStar > 0
      ? Math.max(phaseMedianDt, windowCycles / phaseScan.fStar)
      : 0;
  const phaseSlips = phaseScan.phaseSlipEvents;
  const k3Star =
    phaseScan.fStar !== undefined
      ? phaseScan.k3ByF.find((entry) => entry.frequency_hz === phaseScan.fStar)
          ?.k3
      : undefined;

  const labels = framesWithRates.map((frame) => frame.label.event_present);
  const timeAxis = framesWithRates.map((frame, index) =>
    Number.isFinite(frame.t_s) ? (frame.t_s as number) : index,
  );
  let detuningReport:
    | {
        f_star_hz: number;
        bandwidth_hz: typeof phaseScan.bandwidth;
        series: Array<{
          frame_id: string;
          timestamp_iso: string;
          t_s: number;
          f_mode_hz?: number;
          delta?: number;
          abs_delta?: number;
        }>;
        stats?: {
          stable?: ReturnType<typeof summarizeStats>;
          unstable?: ReturnType<typeof summarizeStats>;
          spike_count?: number;
          spike_rate_per_s?: number;
          threshold?: number;
        };
      }
    | undefined;
  if (
    phaseScan.fStar &&
    phaseScan.bandwidth &&
    window_s > 0 &&
    phaseScan.k3ByF.length > 0
  ) {
    const frequencies = phaseScan.k3ByF.map((entry) => entry.frequency_hz);
    const seriesWithLabels = buildDetuningSeries(
      phaseSamples,
      frequencies,
      phaseScan.fStar,
      phaseScan.bandwidth,
      window_s,
    );
    const series = seriesWithLabels.map(({ label, ...rest }) => rest);
    const absDelta = seriesWithLabels.map((entry) => entry.abs_delta);
    const detuningStats = summarizeByLabel(
      absDelta.map((value) => (Number.isFinite(value ?? NaN) ? (value as number) : undefined)),
      seriesWithLabels.map((entry) => entry.label),
    );
    const spikeThreshold = 1;
    const spikeCount = seriesWithLabels.filter(
      (entry) => (entry.abs_delta ?? 0) >= spikeThreshold,
    ).length;
    const duration =
      phaseTimes.length > 1
        ? Math.max(...phaseTimes) - Math.min(...phaseTimes)
        : undefined;
    const spikeRate =
      duration && duration > 0 ? spikeCount / duration : undefined;
    detuningReport = {
      f_star_hz: phaseScan.fStar,
      bandwidth_hz: phaseScan.bandwidth,
      series,
      stats: {
        stable: detuningStats.stable,
        unstable: detuningStats.unstable,
        spike_count: spikeCount,
        ...(spikeRate !== undefined ? { spike_rate_per_s: spikeRate } : {}),
        threshold: spikeThreshold,
      },
    };
  }
  const k2Series = framesWithRates.map((frame) => frame.metrics.k2);
  const fragSeries = framesWithRates.map((frame) => frame.metrics.fragmentation_rate);
  const tauGrowthK2Series = computeGrowthTauSeries(
    timeAxis,
    k2Series,
    opts.phase_lock,
  );
  const tauGrowthFragSeries = computeGrowthTauSeries(
    timeAxis,
    fragSeries,
    opts.phase_lock,
  );
  const tauGrowthK2 = medianFinite(tauGrowthK2Series);
  const tauGrowthFrag = medianFinite(tauGrowthFragSeries);
  const directTauA = opts.characteristics?.tau_alfven_s;
  const alfvenLength = opts.characteristics?.alfven_length_m;
  const alfvenSpeed = opts.characteristics?.alfven_speed_m_s;
  const tauAlfven =
    Number.isFinite(directTauA ?? NaN) && (directTauA ?? 0) > 0
      ? (directTauA as number)
      : Number.isFinite(alfvenLength ?? NaN) &&
          Number.isFinite(alfvenSpeed ?? NaN) &&
          (alfvenLength ?? 0) > 0 &&
          (alfvenSpeed ?? 0) > 0
        ? (alfvenLength as number) / (alfvenSpeed as number)
        : undefined;
  const tauE =
    Number.isFinite(opts.characteristics?.tau_E_s ?? NaN) &&
    (opts.characteristics?.tau_E_s ?? 0) > 0
      ? (opts.characteristics?.tau_E_s as number)
      : undefined;
  let chi:
    | {
        reference_frequency_hz?: number;
        tau_char_s?: {
          tau_alfven_s?: number;
          tau_growth_k2_s?: number;
          tau_growth_fragmentation_s?: number;
          tau_E_s?: number;
        };
        chi_values?: {
          alfven?: number;
          growth_k2?: number;
          growth_fragmentation?: number;
          tau_E?: number;
        };
        chi_by_label?: {
          growth_k2?: ReturnType<typeof summarizeByLabel>;
          growth_fragmentation?: ReturnType<typeof summarizeByLabel>;
          alfven?: ReturnType<typeof summarizeByLabel>;
          tau_E?: ReturnType<typeof summarizeByLabel>;
        };
      }
    | undefined;
  if (phaseScan.fStar && phaseScan.fStar > 0) {
    const fStar = phaseScan.fStar;
    const tauChar: {
      tau_alfven_s?: number;
      tau_growth_k2_s?: number;
      tau_growth_fragmentation_s?: number;
      tau_E_s?: number;
    } = {};
    if (tauAlfven) tauChar.tau_alfven_s = tauAlfven;
    if (tauGrowthK2) tauChar.tau_growth_k2_s = tauGrowthK2;
    if (tauGrowthFrag) tauChar.tau_growth_fragmentation_s = tauGrowthFrag;
    if (tauE) tauChar.tau_E_s = tauE;
    const chiValues: {
      alfven?: number;
      growth_k2?: number;
      growth_fragmentation?: number;
      tau_E?: number;
    } = {};
    if (tauAlfven) chiValues.alfven = fStar * tauAlfven;
    if (tauGrowthK2) chiValues.growth_k2 = fStar * tauGrowthK2;
    if (tauGrowthFrag) chiValues.growth_fragmentation = fStar * tauGrowthFrag;
    if (tauE) chiValues.tau_E = fStar * tauE;
    const chiByLabel: {
      growth_k2?: ReturnType<typeof summarizeByLabel>;
      growth_fragmentation?: ReturnType<typeof summarizeByLabel>;
      alfven?: ReturnType<typeof summarizeByLabel>;
      tau_E?: ReturnType<typeof summarizeByLabel>;
    } = {};
    if (tauGrowthK2Series.length) {
      const series = tauGrowthK2Series.map((tau) =>
        Number.isFinite(tau ?? NaN) ? (tau as number) * fStar : undefined,
      );
      chiByLabel.growth_k2 = summarizeByLabel(series, labels);
    }
    if (tauGrowthFragSeries.length) {
      const series = tauGrowthFragSeries.map((tau) =>
        Number.isFinite(tau ?? NaN) ? (tau as number) * fStar : undefined,
      );
      chiByLabel.growth_fragmentation = summarizeByLabel(series, labels);
    }
    if (tauAlfven) {
      const series = labels.map(() => fStar * tauAlfven);
      chiByLabel.alfven = summarizeByLabel(series, labels);
    }
    if (tauE) {
      const series = labels.map(() => fStar * tauE);
      chiByLabel.tau_E = summarizeByLabel(series, labels);
    }
    chi = {
      reference_frequency_hz: fStar,
      ...(Object.keys(tauChar).length ? { tau_char_s: tauChar } : {}),
      ...(Object.keys(chiValues).length ? { chi_values: chiValues } : {}),
      ...(Object.keys(chiByLabel).length ? { chi_by_label: chiByLabel } : {}),
    };
  }

  const phaseDuration =
    phaseTimes.length > 1 ? Math.max(...phaseTimes) - Math.min(...phaseTimes) : undefined;
  const phaseSlipRatePerS =
    phaseDuration && phaseDuration > 0 ? phaseSlips.length / phaseDuration : undefined;
  const phaseLock =
    phaseScan.k3ByF.length > 0
      ? {
          scan: phaseScan.k3ByF,
          ...(phaseScan.fStar ? { f_star_hz: phaseScan.fStar } : {}),
          ...(k3Star !== undefined ? { k3_star: k3Star } : {}),
          ...(phaseScan.bandwidth ? { bandwidth_hz: phaseScan.bandwidth } : {}),
          phase_slips: phaseSlips,
          phase_slip_count: phaseSlips.length,
          ...(phaseSlipRatePerS !== undefined
            ? { phase_slip_rate_per_s: phaseSlipRatePerS }
            : {}),
          ...(detuningReport ? { detuning: detuningReport } : {}),
          ...(chi ? { chi } : {}),
        }
      : undefined;

  const featureVectors = framesWithRates.map((frame) =>
    buildFeatureVector(frame.metrics),
  );
  const physicsVectors = framesWithRates.map((frame) =>
    buildPhysicsFeatureVector(frame.metrics),
  );
  const curvatureVectors = framesWithRates.map((frame) =>
    buildCurvatureFeatureVector(frame.metrics),
  );
  const combinedVectors = physicsVectors.map((vector, index) => [
    ...vector,
    ...curvatureVectors[index],
  ]);
  const featureVectorReport = {
    physics_only: {
      features: [...PHYSICS_FEATURE_KEYS],
      vectors: physicsVectors,
    },
    physics_plus_curvature: {
      features: [...PHYSICS_FEATURE_KEYS, ...CURVATURE_FEATURE_KEYS],
      vectors: combinedVectors,
    },
  };
  const labelValues = labels.map((label) => (label ? 1 : 0));
  const comboModel = scoreKey === "k_combo_v1"
    ? trainLogisticModel(featureVectors, labelValues)
    : null;
  const hazardVectors = framesWithRates
    .slice(0, Math.max(0, framesWithRates.length - 1))
    .map((frame) => buildHazardVector(frame.metrics));
  const hazardLabels = labels.slice(1);
  const hazardModel =
    hazardVectors.length > 0
      ? trainLogisticModel(
          hazardVectors,
          hazardLabels.map((label) => (label ? 1 : 0)),
        )
      : null;
  const hazardScores = hazardModel
    ? hazardVectors.map((vector) => predictLogistic(vector, hazardModel))
    : [];
  const hazardPairs = hazardScores
    .map((score, idx) => ({
      score,
      label: hazardLabels[idx],
    }))
    .filter((pair): pair is { score: number; label: boolean } =>
      typeof pair.label === "boolean",
    );
  const hazardRoc = buildRocCurve(hazardPairs);
  const hazardSeries = hazardScores.map((score, idx) => {
    const frame = framesWithRates[idx];
    const nextFrame = framesWithRates[idx + 1];
    const t_s = coerceFinite(frame?.t_s, idx);
    const next_t_s = nextFrame ? coerceFinite(nextFrame.t_s, idx + 1) : undefined;
    const delta_t_s =
      next_t_s !== undefined ? Math.max(0, next_t_s - t_s) : undefined;
    return {
      frame_id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      t_s,
      ...(delta_t_s !== undefined ? { delta_t_s } : {}),
      hazard_prob: score,
      event_next: hazardLabels[idx],
    };
  });
  const hazardReport =
    hazardSeries.length > 0
      ? {
          model: hazardModel
            ? {
                features: [...HAZARD_FEATURE_KEYS],
                weights: hazardModel.weights,
                bias: hazardModel.bias,
                means: hazardModel.means,
                scales: hazardModel.scales,
              }
            : undefined,
          auc: hazardRoc.auc,
          series: hazardSeries,
          notes: "one-step event likelihood based on ridge hazard features",
        }
      : undefined;

  const frames: TTokamakPrecursorFrameResult[] = framesWithRates.map((frame, index) => {
    const metrics = frame.metrics;
    const score =
      scoreKey === "k_combo_v1"
        ? predictLogistic(featureVectors[index], comboModel as LogisticModel)
        : readMetricValue(metrics, scoreKey);
    if (score === undefined) {
      throw new Error(`tokamak_precursor_missing_score:${scoreKey}`);
    }
    return {
      id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      label: frame.label,
      metrics,
      score,
    };
  });

  const pairs = frames.map((frame) => ({ score: frame.score, label: frame.label.event_present }));
  const roc = buildRocCurve(pairs);
  const scoreFrames = framesWithRates.map((frame, index) => ({
    score: frames[index]?.score ?? 0,
    label: frame.label.event_present,
    t_s: coerceFinite(frame.t_s, index),
    id: frame.id,
    timestamp_iso: frame.timestamp_iso,
  }));
  const operatingPoint = selectOperatingPoint(roc.roc);
  const robustnessSeed =
    opts.robustness?.seed ??
    hashStableJson({
      dataset_created_at: normalized.created_at,
      score_key: scoreKey,
    });
  const bootstrapSamples = Math.max(
    25,
    Math.floor(opts.robustness?.bootstrap_samples ?? 200),
  );
  let uncertainty:
    | {
        seed?: string;
        operating_point?: {
          threshold: number;
          false_alarm_rate: number;
          lead_time_s?: ReturnType<typeof computeLeadTimeSummary>;
        };
        auc?: { bootstrap?: ReturnType<typeof buildBootstrapCI>; jackknife?: ReturnType<typeof buildJackknifeCI> };
        false_alarm_rate?: {
          bootstrap?: ReturnType<typeof buildBootstrapCI>;
          jackknife?: ReturnType<typeof buildJackknifeCI>;
        };
        lead_time_s?: {
          bootstrap?: ReturnType<typeof buildBootstrapCI>;
          jackknife?: ReturnType<typeof buildJackknifeCI>;
        };
      }
    | undefined;
  if (operatingPoint) {
    const falseAlarmRate = computeFalseAlarmRate(scoreFrames, operatingPoint.threshold);
    const leadSummary = computeLeadTimeSummary(scoreFrames, operatingPoint.threshold);
    const bootstrap = runBootstrap({
      frames: scoreFrames,
      threshold: operatingPoint.threshold,
      samples: bootstrapSamples,
      seed: robustnessSeed,
    });
    const jackknife = runJackknife({
      frames: scoreFrames,
      threshold: operatingPoint.threshold,
    });
    uncertainty = {
      seed: robustnessSeed,
      operating_point: {
        threshold: operatingPoint.threshold,
        false_alarm_rate: falseAlarmRate,
        ...(leadSummary ? { lead_time_s: leadSummary } : {}),
      },
      auc: {
        bootstrap: buildBootstrapCI(bootstrap.aucSamples, bootstrapSamples, "bootstrap"),
        jackknife: buildJackknifeCI(jackknife.aucSamples),
      },
      false_alarm_rate: {
        bootstrap: buildBootstrapCI(bootstrap.farSamples, bootstrapSamples, "bootstrap"),
        jackknife: buildJackknifeCI(jackknife.farSamples),
      },
      lead_time_s: {
        bootstrap: buildBootstrapCI(bootstrap.leadSamples, bootstrapSamples, "bootstrap"),
        jackknife: buildJackknifeCI(jackknife.leadSamples),
      },
    };
  } else {
    uncertainty = { seed: robustnessSeed };
  }

  const computedSensitivity =
    scoreKey === "k_combo_v1" && comboModel
      ? computeFeatureSensitivity({
          featureVectors,
          labels,
          model: comboModel,
          seed: robustnessSeed,
        })
      : undefined;
  const featureSensitivity = computedSensitivity
    ? { ...computedSensitivity, seed: robustnessSeed }
    : undefined;

  const domainShiftScenarios: Array<{
    id: string;
    auc: number | null;
    auc_delta: number | null;
    score_corr: number | null;
    config?: Record<string, unknown>;
    notes?: string;
  }> = [];
  const baselineScores = frames.map((frame) => frame.score);
  const baseAuc = roc.auc;
  const scoreKeyNeedsChannels = [
    "u_deltaB_p95",
    "u_gradp_p95",
    "u_J_p95",
    "u_rad_p95",
  ].includes(scoreKey);
  if (scoreKeyNeedsChannels) {
    domainShiftScenarios.push({
      id: "skip",
      auc: null,
      auc_delta: null,
      score_corr: null,
      notes: "score_key_requires_channel_metrics",
    });
  } else if (scoreKey === "k_combo_v1" && !comboModel) {
    domainShiftScenarios.push({
      id: "skip",
      auc: null,
      auc_delta: null,
      score_corr: null,
      notes: "missing_combo_model",
    });
  } else {
    const gridFactor = Math.max(2, Math.floor(opts.robustness?.grid_resample_factor ?? 2));
    const resampled = energyContexts
      .map((context) => {
        const result = downsampleField(context.u_total, context.mask, context.grid, gridFactor);
        if (!result) return null;
        return {
          ...context,
          grid: result.grid,
          u_total: result.field,
          mask: result.mask,
        };
      })
      .filter((context): context is EnergyContext => Boolean(context));
    if (resampled.length !== energyContexts.length) {
      domainShiftScenarios.push({
        id: "grid_resample",
        auc: null,
        auc_delta: null,
        score_corr: null,
        config: { factor: gridFactor },
        notes: "grid_too_small_for_resample",
      });
    } else {
      const shifted = scoreFromContexts({
        contexts: resampled,
        scoreKey,
        comboModel,
        tracking: opts.tracking,
        boundary,
      });
      const aligned = shifted.scores
        .map((score, idx) => ({ score, baseline: baselineScores[idx] }))
        .filter((entry): entry is { score: number; baseline: number } => entry.score !== null);
      const corr =
        aligned.length > 1
          ? pearsonCorr(
              aligned.map((entry) => entry.score),
              aligned.map((entry) => entry.baseline),
            )
          : null;
      domainShiftScenarios.push({
        id: "grid_resample",
        auc: shifted.auc,
        auc_delta:
          shifted.auc !== null && baseAuc !== null ? shifted.auc - baseAuc : null,
        score_corr: corr,
        config: { factor: gridFactor },
      });
    }

    const weightJitter = Math.max(0, opts.robustness?.weight_jitter ?? 0.1);
    const weightRng = mulberry32(seedFrom(`${robustnessSeed}:weights`));
    const weightContexts = normalized.frames.map((frame, index) => {
      const snapshot = perturbSnapshotWeights(frame.snapshot, weightJitter, weightRng);
      const energy = buildTokamakRzEnergyFromSnapshot(snapshot);
      const expectedCount = energy.grid.nx * energy.grid.ny;
      const mask = decodeFloat32Raster(
        energy.separatrix_mask.data_b64,
        expectedCount,
        "separatrix_mask",
      );
      const total = decodeFloat32Raster(
        energy.components.u_total_Jm3.data_b64,
        expectedCount,
        "u_total_Jm3",
      );
      return {
        id: frame.id,
        timestamp_iso: frame.timestamp_iso,
        label: frame.label,
        t_s: energyContexts[index]?.t_s ?? index,
        grid: energy.grid,
        frame: energy.frame,
        u_total: total,
        mask,
      };
    });
    const weightShift = scoreFromContexts({
      contexts: weightContexts,
      scoreKey,
      comboModel,
      tracking: opts.tracking,
      boundary,
    });
    const weightAligned = weightShift.scores
      .map((score, idx) => ({ score, baseline: baselineScores[idx] }))
      .filter((entry): entry is { score: number; baseline: number } => entry.score !== null);
    const weightCorr =
      weightAligned.length > 1
        ? pearsonCorr(
            weightAligned.map((entry) => entry.score),
            weightAligned.map((entry) => entry.baseline),
          )
        : null;
    domainShiftScenarios.push({
      id: "weight_perturb",
      auc: weightShift.auc,
      auc_delta:
        weightShift.auc !== null && baseAuc !== null ? weightShift.auc - baseAuc : null,
      score_corr: weightCorr,
      config: { jitter: weightJitter },
    });

    const missingMaskContexts = energyContexts.map((context) => ({
      ...context,
      mask: null,
    }));
    const maskShift = scoreFromContexts({
      contexts: missingMaskContexts,
      scoreKey,
      comboModel,
      tracking: opts.tracking,
      boundary,
    });
    const maskAligned = maskShift.scores
      .map((score, idx) => ({ score, baseline: baselineScores[idx] }))
      .filter((entry): entry is { score: number; baseline: number } => entry.score !== null);
    const maskCorr =
      maskAligned.length > 1
        ? pearsonCorr(
            maskAligned.map((entry) => entry.score),
            maskAligned.map((entry) => entry.baseline),
          )
        : null;
    domainShiftScenarios.push({
      id: "missing_mask",
      auc: maskShift.auc,
      auc_delta: maskShift.auc !== null && baseAuc !== null ? maskShift.auc - baseAuc : null,
      score_corr: maskCorr,
      config: { mode: "null_mask" },
    });
  }

  const baselineMeanScore =
    baselineScores.length > 0
      ? baselineScores.reduce((sum, value) => sum + value, 0) / baselineScores.length
      : 0;
  let culpabilityReport:
    | {
        method: "finite-diff";
        entries: Array<{
          channel: string;
          weight: number;
          epsilon: number;
          mean_score_delta?: number;
          auc_delta?: number | null;
          gradient?: number | null;
        }>;
        notes?: string;
      }
    | undefined;
  const manifest = normalized.frames[0]?.snapshot.manifest;
  if (scoreKey !== "k_combo_v1") {
    culpabilityReport = {
      method: "finite-diff",
      entries: [],
      notes: "culpability_requires_k_combo_v1",
    };
  } else if (!comboModel) {
    culpabilityReport = {
      method: "finite-diff",
      entries: [],
      notes: "missing_combo_model",
    };
  } else if (normalized.frames.length === 0) {
    culpabilityReport = {
      method: "finite-diff",
      entries: [],
      notes: "empty_dataset",
    };
  } else if (!manifest) {
    culpabilityReport = {
      method: "finite-diff",
      entries: [],
      notes: "missing_manifest",
    };
  } else {
    const epsilon = 0.05;
    const rawEntries = manifest.channels.map((entry) => {
      const contexts = buildEnergyContextsFromSnapshots(
        normalized.frames,
        startEpoch,
        (snapshot) => ({
          ...snapshot,
          manifest: {
            ...snapshot.manifest,
            channels: snapshot.manifest.channels.map((channel) =>
              channel.key === entry.key
                ? { ...channel, weight: channel.weight * (1 + epsilon) }
                : channel,
            ),
          },
        }),
      );
      if (!contexts) {
        return {
          channel: entry.key,
          weight: entry.weight,
          epsilon,
          gradient: null,
          auc_delta: null,
          contribution: 0,
        };
      }
      const shifted = scoreFromContexts({
        contexts,
        scoreKey,
        comboModel,
        tracking: opts.tracking,
        boundary,
      });
      const validScores = shifted.scores.filter(
        (value): value is number => value !== null && Number.isFinite(value),
      );
      const meanScore =
        validScores.length > 0
          ? validScores.reduce((sum, value) => sum + value, 0) /
            validScores.length
          : undefined;
      const meanScoreDelta =
        meanScore !== undefined ? meanScore - baselineMeanScore : undefined;
      const aucDelta =
        shifted.auc !== null && baseAuc !== null
          ? shifted.auc - baseAuc
          : null;
      const gradient =
        entry.weight !== 0 && meanScoreDelta !== undefined
          ? meanScoreDelta / (entry.weight * epsilon)
          : null;
      const contribution =
        gradient !== null
          ? gradient * entry.weight
          : meanScoreDelta ?? 0;
      return {
        channel: entry.key,
        weight: entry.weight,
        epsilon,
        ...(meanScoreDelta !== undefined ? { mean_score_delta: meanScoreDelta } : {}),
        auc_delta: aucDelta,
        gradient,
        contribution,
      };
    });
    const totalAbsContribution = rawEntries.reduce(
      (sum, entry) => sum + Math.abs(entry.contribution ?? 0),
      0,
    );
    const rankedEntries = rawEntries
      .map((entry) => ({
        ...entry,
        normalized_contribution:
          totalAbsContribution > 0
            ? clampContribution((entry.contribution ?? 0) / totalAbsContribution)
            : 0,
      }))
      .sort((a, b) => {
        const aScore = Math.abs(a.normalized_contribution ?? 0);
        const bScore = Math.abs(b.normalized_contribution ?? 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.channel.localeCompare(b.channel);
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    culpabilityReport = {
      method: "finite-diff",
      entries: rankedEntries,
    };
  }

  const fragmentationMean = summarizeStats(
    framesWithRates
      .map((frame) => frame.metrics.fragmentation_rate)
      .filter((value): value is number => Number.isFinite(value ?? NaN)),
  );
  const totalDuration =
    timeAxis.length > 1 ? Math.max(...timeAxis) - Math.min(...timeAxis) : undefined;
  const totalFragmentationEvents = framesWithRates.reduce(
    (sum, frame) =>
      sum +
      coerceFinite((frame as { fragmentation_events?: number }).fragmentation_events),
    0,
  );
  const ridgeChangeRate =
    totalDuration && totalDuration > 0
      ? totalFragmentationEvents / totalDuration
      : undefined;
  const phaseSlipRate =
    totalDuration && totalDuration > 0 ? phaseSlips.length / totalDuration : undefined;
  const ridgeSurvival = buildRidgeSurvival(tracking.tracks, {
    bootstrap_samples: bootstrapSamples,
    seed: robustnessSeed,
  });
  const normalizationReport = {
    ...(ridgeChangeRate !== undefined
      ? { ridge_topology_change_rate_per_s: ridgeChangeRate }
      : {}),
    ...(fragmentationMean.count > 0
      ? { ridge_fragmentation_rate_mean: fragmentationMean.mean }
      : {}),
    ridge_survival: {
      total_tracks: ridgeSurvival.total_tracks,
      max_lifetime_frames: ridgeSurvival.max_lifetime_frames,
    },
    phase_slip_count: phaseSlips.length,
    ...(phaseSlipRate !== undefined ? { phase_slip_rate_per_s: phaseSlipRate } : {}),
  };

  const controlEnabled = opts.control?.enabled ?? true;
  let controlExperiments: { objective: { mode: "linear"; weights: ControlObjectiveWeights; lower_is_better: boolean; notes?: string }; scenarios: TTokamakPrecursorControlScenario[] } | undefined;
  if (controlEnabled) {
    const coerceWeight = (value: number | undefined, fallback: number) =>
      Math.max(0, coerceFinite(value, fallback));
    const controlWeights: ControlObjectiveWeights = {
      k2: coerceWeight(opts.control?.objective_weights?.k2, DEFAULT_CONTROL_WEIGHTS.k2),
      fragmentation_rate: coerceWeight(
        opts.control?.objective_weights?.fragmentation_rate,
        DEFAULT_CONTROL_WEIGHTS.fragmentation_rate,
      ),
      k1: coerceWeight(opts.control?.objective_weights?.k1, DEFAULT_CONTROL_WEIGHTS.k1),
      k3: coerceWeight(opts.control?.objective_weights?.k3, DEFAULT_CONTROL_WEIGHTS.k3),
    };
    const baselineSummary = buildControlSummary(framesWithRates, tracking, controlWeights);
    const scenarios: TTokamakPrecursorControlScenario[] = [];

    const jRampStart = opts.control?.u_J_ramp?.start_factor ?? 1;
    const jRampEnd = opts.control?.u_J_ramp?.end_factor ?? 0.85;
    const hasJ = normalized.frames.every((frame) => Boolean(frame.snapshot.perturbations.j_A_m2));
    if (!hasJ) {
      scenarios.push({
        id: "u_J_ramp",
        kind: "u_J_ramp",
        baseline: baselineSummary,
        config: { start_factor: jRampStart, end_factor: jRampEnd },
        notes: "missing_j_A_m2",
      });
    } else {
      const contexts = buildEnergyContextsFromSnapshots(
        normalized.frames,
        startEpoch,
        (snapshot, index, total) => {
          const expectedCount = snapshot.grid.nx * snapshot.grid.ny;
          const factor = rampFactor(index, total, jRampStart, jRampEnd);
          const scale = Math.sqrt(Math.max(0, factor));
          const scaled = scaleRasterPayload(
            snapshot.perturbations.j_A_m2,
            expectedCount,
            scale,
            "j_A_m2",
          );
          if (!scaled) return null;
          return {
            ...snapshot,
            perturbations: { ...snapshot.perturbations, j_A_m2: scaled },
          };
        },
      );
      if (!contexts) {
        scenarios.push({
          id: "u_J_ramp",
          kind: "u_J_ramp",
          baseline: baselineSummary,
          config: { start_factor: jRampStart, end_factor: jRampEnd },
          notes: "u_J_ramp_failed",
        });
      } else {
        const seeded = buildSeedFramesFromContexts(contexts, boundary);
        const { framesWithRates: rampFrames, tracking: rampTracking } = buildFramesWithTracking(
          seeded,
          opts.tracking,
        );
        const actuatedSummary = buildControlSummary(rampFrames, rampTracking, controlWeights);
        scenarios.push({
          id: "u_J_ramp",
          kind: "u_J_ramp",
          baseline: baselineSummary,
          actuated: actuatedSummary,
          delta: diffControlSummary(actuatedSummary, baselineSummary),
          config: { start_factor: jRampStart, end_factor: jRampEnd },
        });
      }
    }

    const gradpScale = opts.control?.u_gradp_scale ?? 0.85;
    const hasP = normalized.frames.every((frame) => Boolean(frame.snapshot.perturbations.p_Pa));
    if (!hasP) {
      scenarios.push({
        id: "u_gradp_reduce",
        kind: "u_gradp_reduce",
        baseline: baselineSummary,
        config: { scale: gradpScale },
        notes: "missing_p_Pa",
      });
    } else {
      const contexts = buildEnergyContextsFromSnapshots(
        normalized.frames,
        startEpoch,
        (snapshot) => {
          const expectedCount = snapshot.grid.nx * snapshot.grid.ny;
          const scaled = scaleRasterPayload(
            snapshot.perturbations.p_Pa,
            expectedCount,
            gradpScale,
            "p_Pa",
          );
          if (!scaled) return null;
          return {
            ...snapshot,
            perturbations: { ...snapshot.perturbations, p_Pa: scaled },
          };
        },
      );
      if (!contexts) {
        scenarios.push({
          id: "u_gradp_reduce",
          kind: "u_gradp_reduce",
          baseline: baselineSummary,
          config: { scale: gradpScale },
          notes: "u_gradp_reduce_failed",
        });
      } else {
        const seeded = buildSeedFramesFromContexts(contexts, boundary);
        const { framesWithRates: gradFrames, tracking: gradTracking } = buildFramesWithTracking(
          seeded,
          opts.tracking,
        );
        const actuatedSummary = buildControlSummary(gradFrames, gradTracking, controlWeights);
        scenarios.push({
          id: "u_gradp_reduce",
          kind: "u_gradp_reduce",
          baseline: baselineSummary,
          actuated: actuatedSummary,
          delta: diffControlSummary(actuatedSummary, baselineSummary),
          config: { scale: gradpScale },
        });
      }
    }

    const driveScale = Number.isFinite(opts.control?.drive_hz?.scale ?? NaN)
      ? (opts.control?.drive_hz?.scale as number)
      : 1;
    const driveAmplitude = Number.isFinite(opts.control?.drive_hz?.amplitude ?? NaN)
      ? (opts.control?.drive_hz?.amplitude as number)
      : 0.15;
    const safeDriveAmp = Math.min(1, Math.max(0, driveAmplitude));
    const baseDriveHz = phaseScan.fStar ?? opts.tracking?.drive_hz;
    const driveHz =
      Number.isFinite(baseDriveHz ?? NaN) && (baseDriveHz ?? 0) > 0
        ? (baseDriveHz as number) * driveScale
        : null;
    if (!driveHz || !Number.isFinite(driveHz) || driveHz <= 0) {
      scenarios.push({
        id: "drive_frequency",
        kind: "drive_frequency",
        baseline: baselineSummary,
        config: { scale: driveScale, amplitude: safeDriveAmp },
        notes: "missing_drive_frequency",
      });
    } else if (!hasJ) {
      scenarios.push({
        id: "drive_frequency",
        kind: "drive_frequency",
        baseline: baselineSummary,
        config: { drive_hz: driveHz, scale: driveScale, amplitude: safeDriveAmp },
        notes: "missing_j_A_m2",
      });
    } else {
      const contexts = buildEnergyContextsFromSnapshots(
        normalized.frames,
        startEpoch,
        (snapshot, index) => {
          const expectedCount = snapshot.grid.nx * snapshot.grid.ny;
          const iso = normalized.frames[index]?.timestamp_iso ?? snapshot.timestamp_iso;
          const epoch = toEpochSeconds(iso);
          const t_s = startEpoch !== null && epoch !== null ? epoch - startEpoch : index;
          const factor = driveModulationFactor(t_s, driveHz, safeDriveAmp);
          const scale = Math.sqrt(Math.max(0, factor));
          const scaled = scaleRasterPayload(
            snapshot.perturbations.j_A_m2,
            expectedCount,
            scale,
            "j_A_m2",
          );
          if (!scaled) return null;
          return {
            ...snapshot,
            perturbations: { ...snapshot.perturbations, j_A_m2: scaled },
          };
        },
      );
      if (!contexts) {
        scenarios.push({
          id: "drive_frequency",
          kind: "drive_frequency",
          baseline: baselineSummary,
          config: { drive_hz: driveHz, scale: driveScale, amplitude: safeDriveAmp },
          notes: "drive_frequency_failed",
        });
      } else {
        const driveTracking = { ...(opts.tracking ?? {}), drive_hz: driveHz };
        const seeded = buildSeedFramesFromContexts(contexts, boundary);
        const { framesWithRates: driveFrames, tracking: driveTrackingResult } =
          buildFramesWithTracking(seeded, driveTracking);
        const actuatedSummary = buildControlSummary(driveFrames, driveTrackingResult, controlWeights);
        scenarios.push({
          id: "drive_frequency",
          kind: "drive_frequency",
          baseline: baselineSummary,
          actuated: actuatedSummary,
          delta: diffControlSummary(actuatedSummary, baselineSummary),
          config: {
            drive_hz: driveHz,
            scale: driveScale,
            amplitude: safeDriveAmp,
          source: phaseScan.fStar ? "phase_lock_f_star" : "tracking_drive_hz",
            target: "j_A_m2",
          },
        });
      }
    }

    controlExperiments = {
      objective: {
        mode: "linear",
        weights: controlWeights,
        lower_is_better: true,
        notes: "coherence_cost = w_k2*k2 + w_frag*fragmentation_rate - w_k1*k1 - w_k3*k3",
      },
      scenarios,
    };
  }

  const generated_at_iso = opts.generated_at_iso ?? normalized.created_at;
  const report_hash = hashStableJson({
    dataset_created_at: normalized.created_at,
    score_key: scoreKey,
    frames: frames.map((frame) => ({
      id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      score: frame.score,
      event_present: frame.label.event_present,
    })),
  });
  let culpabilityArtifact: TTokamakCulpabilityArtifact | undefined;
  let culpabilityArtifactHash: string | undefined;
  let culpabilityArtifactPath: string | undefined;
  if (culpabilityReport && culpabilityReport.entries.length > 0) {
    const manifestForArtifact = normalized.frames[0]?.snapshot.manifest;
    const informationBoundary = buildInformationBoundary({
      data_cutoff_iso: normalized.created_at,
      mode: "observables",
      labels_used_as_features: false,
      event_features_included: false,
      inputs: {
        kind: "tokamak_culpability",
        v: 1,
        dataset_created_at: normalized.created_at,
        score_key: scoreKey,
        report_hash,
        manifest: manifestForArtifact?.channels ?? [],
      },
      features: {
        kind: "tokamak_culpability",
        v: 1,
        entries: culpabilityReport.entries,
      },
    });
    const artifactBase = {
      schema_version: "tokamak_culpability/1",
      kind: "tokamak_culpability",
      generated_at_iso,
      score_key: scoreKey,
      report_hash,
      entries: culpabilityReport.entries,
      ...(culpabilityReport.notes ? { notes: culpabilityReport.notes } : {}),
    };
    const withBoundary = withDerivedArtifactInformationBoundary(
      artifactBase,
      informationBoundary,
    );
    culpabilityArtifact = TokamakCulpabilityArtifact.parse(withBoundary);
    culpabilityArtifactHash = hashStableJson(culpabilityArtifact);

    const writeCulpability = opts.artifacts?.write_culpability ?? true;
    if (writeCulpability) {
      const artifactDir =
        opts.artifacts?.dir ?? path.resolve(process.cwd(), "artifacts");
      const artifactPath =
        opts.artifacts?.culpability_path ??
        path.join(artifactDir, "culpability.json");
      mkdirSync(path.dirname(artifactPath), { recursive: true });
      writeFileSync(artifactPath, stableJsonStringify(culpabilityArtifact), "utf8");
      culpabilityArtifactPath = artifactPath;
    }
  }
  return TokamakPrecursorReport.parse({
    schema_version: "tokamak_precursor_report/1",
    kind: "tokamak_precursor_report",
    generated_at_iso,
    dataset_path: opts.dataset_path,
    score_key: scoreKey,
    auc: roc.auc,
    frames,
    roc_curve: roc.roc,
    report_hash,
    feature_vectors: featureVectorReport,
    ridge_survival: ridgeSurvival,
    ...(phaseLock ? { phase_lock: phaseLock } : {}),
    ...(uncertainty ? { uncertainty } : {}),
    ...(featureSensitivity ? { feature_sensitivity: featureSensitivity } : {}),
    domain_shift: { scenarios: domainShiftScenarios },
    ...(hazardReport ? { hazard_forecast: hazardReport } : {}),
    ...(culpabilityReport ? { culpability: culpabilityReport } : {}),
    ...(culpabilityArtifact ? { culpability_artifact: culpabilityArtifact } : {}),
    ...(culpabilityArtifactHash
      ? { culpability_artifact_hash: culpabilityArtifactHash }
      : {}),
    ...(culpabilityArtifactPath
      ? { culpability_artifact_path: culpabilityArtifactPath }
      : {}),
    ...(normalizationReport ? { normalization: normalizationReport } : {}),
    ...(controlExperiments ? { control_experiments: controlExperiments } : {}),
  });
}
