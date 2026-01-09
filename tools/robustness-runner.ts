import fs from "node:fs/promises";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CurvatureBoundaryCondition2D,
  type TCurvatureBoundaryCondition2D,
  type TFloat32RasterB64,
} from "@shared/essence-physics";
import { TokamakPrecursorDataset, TokamakPrecursorScoreKey } from "@shared/tokamak-precursor";
import type { TTokamakPrecursorDataset, TTokamakPrecursorScoreKey } from "@shared/tokamak-precursor";
import {
  TokamakRobustnessReport,
  type TTokamakRobustnessReport,
  type TTokamakRobustnessScenario,
} from "@shared/tokamak-robustness";
import { withDerivedArtifactInformationBoundary } from "@shared/information-boundary-derived";
import { runTokamakPrecursorDataset } from "./tokamak-precursor-runner";
import { buildInformationBoundary, hashStableJson } from "../server/utils/information-boundary";
import { stableJsonStringify } from "../server/utils/stable-json";

const DEFAULT_DATASET_PATH = path.resolve(
  process.cwd(),
  "datasets",
  "tokamak-rz-precursor.fixture.json",
);

type RobustnessArtifactsOptions = {
  dir?: string;
  output_path?: string;
  write?: boolean;
};

type RobustnessOptions = {
  dataset_path?: string;
  score_key?: TTokamakPrecursorScoreKey;
  generated_at_iso?: string;
  baseline_boundary?: TCurvatureBoundaryCondition2D;
  boundaries?: TCurvatureBoundaryCondition2D[];
  downsample_factor?: number;
  mask_hole_fraction?: number;
  noise_std_fraction?: number;
  seed?: string;
  artifacts?: RobustnessArtifactsOptions;
};

type RasterPayload = TFloat32RasterB64;

type DownsampleFactors = {
  fx: number;
  fy: number;
  nx: number;
  ny: number;
};

const decodeFloat32Raster = (
  b64: string,
  expectedCount: number,
  label: string,
): Float32Array => {
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

const summarizeDeltas = (values: number[]) => {
  if (!values.length) {
    return { count: 0, mean: 0, mean_abs: 0, p50: 0, p90: 0, max_abs: 0 };
  }
  const count = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const absValues = values.map((value) => Math.abs(value));
  const meanAbs = absValues.reduce((sum, value) => sum + value, 0) / count;
  return {
    count,
    mean,
    mean_abs: meanAbs,
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    max_abs: Math.max(...absValues),
  };
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

const gaussian = (rng: () => number): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const computeStd = (values: Float32Array): number => {
  let sum = 0;
  let count = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    sum += value;
    count += 1;
  }
  if (count === 0) return 0;
  const mean = sum / count;
  let variance = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    const diff = value - mean;
    variance += diff * diff;
  }
  return Math.sqrt(variance / count);
};

const shuffleInPlace = (arr: number[], rng: () => number): void => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

const resolveDownsampleFactors = (
  grid: { nx: number; ny: number },
  factor: number,
): DownsampleFactors | null => {
  const base = Math.max(1, Math.floor(factor));
  let fx = base;
  let fy = base;
  if (Math.floor(grid.nx / fx) < 2) fx = 1;
  if (Math.floor(grid.ny / fy) < 2) fy = 1;
  if (fx === 1 && fy === 1) return null;
  const nx = Math.floor(grid.nx / fx);
  const ny = Math.floor(grid.ny / fy);
  if (nx < 2 || ny < 2) return null;
  return { fx, fy, nx, ny };
};

const recomputeGridSpacing = (
  frame: {
    r_min_m: number;
    r_max_m: number;
    z_min_m: number;
    z_max_m: number;
    axis_order?: ["r", "z"];
  },
  nx: number,
  ny: number,
) => {
  const axisX = frame.axis_order?.[0] ?? "r";
  const axisY = frame.axis_order?.[1] ?? "z";
  const xRange = axisX === "r" ? frame.r_max_m - frame.r_min_m : frame.z_max_m - frame.z_min_m;
  const yRange = axisY === "z" ? frame.z_max_m - frame.z_min_m : frame.r_max_m - frame.r_min_m;
  return {
    dx_m: xRange / Math.max(1, nx - 1),
    dy_m: yRange / Math.max(1, ny - 1),
  };
};

const downsampleArray = (
  field: Float32Array,
  nx: number,
  ny: number,
  factors: DownsampleFactors,
): Float32Array => {
  const out = new Float32Array(factors.nx * factors.ny);
  for (let y = 0; y < factors.ny; y++) {
    for (let x = 0; x < factors.nx; x++) {
      let sum = 0;
      let count = 0;
      for (let yy = 0; yy < factors.fy; yy++) {
        for (let xx = 0; xx < factors.fx; xx++) {
          const srcX = x * factors.fx + xx;
          const srcY = y * factors.fy + yy;
          if (srcX >= nx || srcY >= ny) continue;
          const idx = srcY * nx + srcX;
          const value = field[idx];
          if (!Number.isFinite(value)) continue;
          sum += value;
          count += 1;
        }
      }
      out[y * factors.nx + x] = count > 0 ? sum / count : 0;
    }
  }
  return out;
};

const mapRasterPayload = (
  payload: RasterPayload | undefined,
  expectedCount: number,
  label: string,
  transform: (arr: Float32Array) => Float32Array,
): RasterPayload | undefined => {
  if (!payload) return payload;
  const arr = decodeFloat32Raster(payload.data_b64, expectedCount, label);
  const next = transform(arr);
  return { ...payload, data_b64: encodeFloat32Raster(next) };
};

const applyMaskHoles = (
  payload: RasterPayload,
  expectedCount: number,
  fraction: number,
  rng: () => number,
): RasterPayload => {
  if (fraction <= 0) return payload;
  const arr = decodeFloat32Raster(payload.data_b64, expectedCount, "separatrix_mask");
  const indices: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0) indices.push(i);
  }
  const holeCount = Math.floor(indices.length * Math.min(1, fraction));
  if (holeCount <= 0) return payload;
  shuffleInPlace(indices, rng);
  const next = new Float32Array(arr);
  for (let i = 0; i < holeCount; i++) {
    next[indices[i]] = 0;
  }
  return { ...payload, data_b64: encodeFloat32Raster(next) };
};

const applyNoise = (
  payload: RasterPayload,
  expectedCount: number,
  noiseStdFraction: number,
  rng: () => number,
  label: string,
): RasterPayload => {
  if (noiseStdFraction <= 0) return payload;
  const arr = decodeFloat32Raster(payload.data_b64, expectedCount, label);
  const std = computeStd(arr);
  const noiseStd = std * noiseStdFraction;
  if (!Number.isFinite(noiseStd) || noiseStd <= 0) return payload;
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = arr[i] + gaussian(rng) * noiseStd;
  }
  return { ...payload, data_b64: encodeFloat32Raster(out) };
};

const buildBaselineMeans = (frames: Array<{ metrics: Record<string, number | undefined>; score: number }>) => {
  const collect = (key: string) =>
    frames.map((frame) => frame.metrics[key]).filter((value): value is number => Number.isFinite(value ?? NaN));
  const meanOf = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
  const k0 = collect("k0");
  const k1 = collect("k1");
  const k2 = collect("k2");
  const scores = frames.map((frame) => frame.score).filter((value) => Number.isFinite(value));
  return {
    k0_mean: meanOf(k0),
    k1_mean: meanOf(k1),
    k2_mean: meanOf(k2),
    score_mean: meanOf(scores),
  };
};

const buildScenario = (args: {
  id: string;
  kind: TTokamakRobustnessScenario["kind"];
  boundary?: TCurvatureBoundaryCondition2D;
  report: ReturnType<typeof runTokamakPrecursorDataset>;
  baseline: ReturnType<typeof runTokamakPrecursorDataset>;
  baselineMeans: ReturnType<typeof buildBaselineMeans>;
  config?: Record<string, unknown>;
  notes?: string;
}) => {
  const baselineById = new Map(args.baseline.frames.map((frame) => [frame.id, frame]));
  const k0Deltas: number[] = [];
  const k1Deltas: number[] = [];
  const k2Deltas: number[] = [];
  const scoreDeltas: number[] = [];
  for (const frame of args.report.frames) {
    const base = baselineById.get(frame.id);
    if (!base) continue;
    const k0 = frame.metrics.k0;
    const k1 = frame.metrics.k1;
    const k2 = frame.metrics.k2;
    const baseK0 = base.metrics.k0;
    const baseK1 = base.metrics.k1;
    const baseK2 = base.metrics.k2;
    if (Number.isFinite(k0 ?? NaN) && Number.isFinite(baseK0 ?? NaN)) {
      k0Deltas.push((k0 as number) - (baseK0 as number));
    }
    if (Number.isFinite(k1 ?? NaN) && Number.isFinite(baseK1 ?? NaN)) {
      k1Deltas.push((k1 as number) - (baseK1 as number));
    }
    if (Number.isFinite(k2 ?? NaN) && Number.isFinite(baseK2 ?? NaN)) {
      k2Deltas.push((k2 as number) - (baseK2 as number));
    }
    scoreDeltas.push(frame.score - base.score);
  }
  const k0Summary = summarizeDeltas(k0Deltas);
  const k1Summary = summarizeDeltas(k1Deltas);
  const k2Summary = summarizeDeltas(k2Deltas);
  const scoreSummary = summarizeDeltas(scoreDeltas);
  const info_loss = {
    ...(args.baselineMeans.k0_mean && args.baselineMeans.k0_mean > 0
      ? { k0_rel_mean: k0Summary.mean_abs / args.baselineMeans.k0_mean }
      : {}),
    ...(args.baselineMeans.k1_mean && args.baselineMeans.k1_mean > 0
      ? { k1_rel_mean: k1Summary.mean_abs / args.baselineMeans.k1_mean }
      : {}),
    ...(args.baselineMeans.k2_mean && args.baselineMeans.k2_mean > 0
      ? { k2_rel_mean: k2Summary.mean_abs / args.baselineMeans.k2_mean }
      : {}),
    ...(args.baselineMeans.score_mean && args.baselineMeans.score_mean > 0
      ? { score_rel_mean: scoreSummary.mean_abs / args.baselineMeans.score_mean }
      : {}),
  };
  return {
    id: args.id,
    kind: args.kind,
    boundary: args.boundary,
    frame_count: args.report.frames.length,
    ...(args.config ? { config: args.config } : {}),
    k_metrics: { k0: k0Summary, k1: k1Summary, k2: k2Summary },
    score: scoreSummary,
    ...(Object.keys(info_loss).length ? { info_loss } : {}),
    ...(args.notes ? { notes: args.notes } : {}),
  } as TTokamakRobustnessScenario;
};

const runPrecursor = (
  dataset: TTokamakPrecursorDataset,
  scoreKey: TTokamakPrecursorScoreKey,
  boundary: TCurvatureBoundaryCondition2D,
) =>
  runTokamakPrecursorDataset(dataset, {
    score_key: scoreKey,
    boundary,
    artifacts: { write_culpability: false },
  });

const buildDownsampledDataset = (
  dataset: TTokamakPrecursorDataset,
  factor: number,
): { dataset: TTokamakPrecursorDataset; factors: DownsampleFactors } | null => {
  const reference = resolveDownsampleFactors(dataset.frames[0].snapshot.grid, factor);
  if (!reference) return null;
  const frames = dataset.frames.map((frame) => {
    const snapshot = frame.snapshot;
    const expectedCount = snapshot.grid.nx * snapshot.grid.ny;
    const perFrameFactors = resolveDownsampleFactors(snapshot.grid, factor);
    if (!perFrameFactors || perFrameFactors.fx !== reference.fx || perFrameFactors.fy !== reference.fy) {
      throw new Error("tokamak_robustness_downsample_incompatible");
    }
    const nextGridSpacing = recomputeGridSpacing(snapshot.frame, reference.nx, reference.ny);
    const nextGrid = {
      ...snapshot.grid,
      nx: reference.nx,
      ny: reference.ny,
      dx_m: nextGridSpacing.dx_m,
      dy_m: nextGridSpacing.dy_m,
    };
    const downsample = (payload: RasterPayload | undefined, label: string) =>
      mapRasterPayload(payload, expectedCount, label, (arr) =>
        downsampleArray(arr, snapshot.grid.nx, snapshot.grid.ny, reference),
      );
    const nextEquilibrium = snapshot.equilibrium
      ? {
          ...snapshot.equilibrium,
          b_eq_T: downsample(snapshot.equilibrium.b_eq_T, "b_eq_T"),
          p_eq_Pa: downsample(snapshot.equilibrium.p_eq_Pa, "p_eq_Pa"),
          psi_N: downsample(snapshot.equilibrium.psi_N, "psi_N"),
        }
      : undefined;
    const nextPerturbations = {
      ...snapshot.perturbations,
      b_T: downsample(snapshot.perturbations.b_T, "b_T"),
      delta_b_T: downsample(snapshot.perturbations.delta_b_T, "delta_b_T"),
      p_Pa: downsample(snapshot.perturbations.p_Pa, "p_Pa"),
      j_A_m2: downsample(snapshot.perturbations.j_A_m2, "j_A_m2"),
      rad_W_m3: downsample(snapshot.perturbations.rad_W_m3, "rad_W_m3"),
    };
    return {
      ...frame,
      snapshot: {
        ...snapshot,
        grid: nextGrid,
        separatrix_mask: downsample(snapshot.separatrix_mask, "separatrix_mask")!,
        equilibrium: nextEquilibrium,
        perturbations: nextPerturbations,
      },
    };
  });
  return { dataset: { ...dataset, frames }, factors: reference };
};

const buildMaskHolesDataset = (
  dataset: TTokamakPrecursorDataset,
  fraction: number,
  seed: string,
): TTokamakPrecursorDataset => {
  if (fraction <= 0) return dataset;
  const frames = dataset.frames.map((frame) => {
    const snapshot = frame.snapshot;
    const expectedCount = snapshot.grid.nx * snapshot.grid.ny;
    const rng = mulberry32(seedFrom(`${seed}:mask:${frame.id}`));
    return {
      ...frame,
      snapshot: {
        ...snapshot,
        separatrix_mask: applyMaskHoles(snapshot.separatrix_mask, expectedCount, fraction, rng),
      },
    };
  });
  return { ...dataset, frames };
};

const buildNoiseDataset = (
  dataset: TTokamakPrecursorDataset,
  noiseStdFraction: number,
  seed: string,
): TTokamakPrecursorDataset => {
  if (noiseStdFraction <= 0) return dataset;
  const frames = dataset.frames.map((frame) => {
    const snapshot = frame.snapshot;
    const expectedCount = snapshot.grid.nx * snapshot.grid.ny;
    const noiseField = (payload: RasterPayload | undefined, label: string) => {
      if (!payload) return payload;
      const rng = mulberry32(seedFrom(`${seed}:noise:${frame.id}:${label}`));
      return applyNoise(payload, expectedCount, noiseStdFraction, rng, label);
    };
    return {
      ...frame,
      snapshot: {
        ...snapshot,
        perturbations: {
          ...snapshot.perturbations,
          b_T: noiseField(snapshot.perturbations.b_T, "b_T"),
          delta_b_T: noiseField(snapshot.perturbations.delta_b_T, "delta_b_T"),
          p_Pa: noiseField(snapshot.perturbations.p_Pa, "p_Pa"),
          j_A_m2: noiseField(snapshot.perturbations.j_A_m2, "j_A_m2"),
          rad_W_m3: noiseField(snapshot.perturbations.rad_W_m3, "rad_W_m3"),
        },
      },
    };
  });
  return { ...dataset, frames };
};

export async function loadTokamakPrecursorDataset(
  datasetPath = DEFAULT_DATASET_PATH,
): Promise<TTokamakPrecursorDataset> {
  const src = await fs.readFile(datasetPath, "utf8");
  return TokamakPrecursorDataset.parse(JSON.parse(src));
}

export function runTokamakRobustnessSuite(
  dataset: TTokamakPrecursorDataset,
  opts: RobustnessOptions = {},
): TTokamakRobustnessReport {
  const normalized = TokamakPrecursorDataset.parse(dataset);
  const scoreKey = TokamakPrecursorScoreKey.parse(opts.score_key ?? "k_combo_v1");
  const baselineBoundary = CurvatureBoundaryCondition2D.parse(
    opts.baseline_boundary ?? "dirichlet0",
  );
  const generated_at_iso = opts.generated_at_iso ?? normalized.created_at;
  const seed = opts.seed ?? hashStableJson({ dataset_created_at: normalized.created_at });
  const downsampleFactor = Math.max(1, Math.floor(opts.downsample_factor ?? 2));
  const maskHoleFraction = Math.max(0, opts.mask_hole_fraction ?? 0.02);
  const noiseStdFraction = Math.max(0, opts.noise_std_fraction ?? 0.02);

  const baselineReport = runPrecursor(normalized, scoreKey, baselineBoundary);
  const baselineMeans = buildBaselineMeans(baselineReport.frames);
  const baseline = {
    boundary: baselineBoundary,
    score_key: scoreKey,
    frame_count: baselineReport.frames.length,
    k_metrics: {
      ...(baselineMeans.k0_mean !== undefined ? { k0_mean: baselineMeans.k0_mean } : {}),
      ...(baselineMeans.k1_mean !== undefined ? { k1_mean: baselineMeans.k1_mean } : {}),
      ...(baselineMeans.k2_mean !== undefined ? { k2_mean: baselineMeans.k2_mean } : {}),
    },
    ...(baselineMeans.score_mean !== undefined ? { score_mean: baselineMeans.score_mean } : {}),
  };

  const scenarios: TTokamakRobustnessScenario[] = [];
  const downsampled = buildDownsampledDataset(normalized, downsampleFactor);
  if (!downsampled) {
    scenarios.push(
      buildScenario({
        id: "downsample",
        kind: "downsample",
        boundary: baselineBoundary,
        report: baselineReport,
        baseline: baselineReport,
        baselineMeans,
        config: { factor: downsampleFactor },
        notes: "grid_too_small_for_downsample",
      }),
    );
  } else {
    const downsampleReport = runPrecursor(downsampled.dataset, scoreKey, baselineBoundary);
    scenarios.push(
      buildScenario({
        id: "downsample",
        kind: "downsample",
        boundary: baselineBoundary,
        report: downsampleReport,
        baseline: baselineReport,
        baselineMeans,
        config: {
          factor: downsampleFactor,
          factor_x: downsampled.factors.fx,
          factor_y: downsampled.factors.fy,
          nx: downsampled.factors.nx,
          ny: downsampled.factors.ny,
        },
      }),
    );
  }

  const maskDataset = buildMaskHolesDataset(normalized, maskHoleFraction, seed);
  const maskReport = runPrecursor(maskDataset, scoreKey, baselineBoundary);
  scenarios.push(
    buildScenario({
      id: "mask_holes",
      kind: "mask_holes",
      boundary: baselineBoundary,
      report: maskReport,
      baseline: baselineReport,
      baselineMeans,
      config: { fraction: maskHoleFraction },
    }),
  );

  const noiseDataset = buildNoiseDataset(normalized, noiseStdFraction, seed);
  const noiseReport = runPrecursor(noiseDataset, scoreKey, baselineBoundary);
  scenarios.push(
    buildScenario({
      id: "noise",
      kind: "noise",
      boundary: baselineBoundary,
      report: noiseReport,
      baseline: baselineReport,
      baselineMeans,
      config: { std_fraction: noiseStdFraction },
    }),
  );

  const candidateBoundaries =
    opts.boundaries ??
    CurvatureBoundaryCondition2D.options.filter((value) => value !== baselineBoundary);
  for (const boundary of candidateBoundaries) {
    const boundaryReport = runPrecursor(normalized, scoreKey, boundary);
    scenarios.push(
      buildScenario({
        id: `boundary_${boundary}`,
        kind: "boundary",
        boundary,
        report: boundaryReport,
        baseline: baselineReport,
        baselineMeans,
        config: { boundary },
      }),
    );
  }

  const report_hash = hashStableJson({
    dataset_created_at: normalized.created_at,
    score_key: scoreKey,
    baseline,
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id,
      kind: scenario.kind,
      boundary: scenario.boundary,
      config: scenario.config,
      k_metrics: scenario.k_metrics,
      score: scenario.score,
      info_loss: scenario.info_loss,
      notes: scenario.notes,
    })),
  });

  const informationBoundary = buildInformationBoundary({
    data_cutoff_iso: normalized.created_at,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs: {
      kind: "tokamak_robustness",
      v: 1,
      dataset_created_at: normalized.created_at,
      dataset_path: opts.dataset_path,
      score_key: scoreKey,
      baseline_boundary: baselineBoundary,
      seed,
      scenarios: scenarios.map((scenario) => ({
        id: scenario.id,
        kind: scenario.kind,
        boundary: scenario.boundary,
        config: scenario.config,
        notes: scenario.notes,
      })),
    },
    features: {
      kind: "tokamak_robustness",
      v: 1,
      report_hash,
      baseline,
      scenarios: scenarios.map((scenario) => ({
        id: scenario.id,
        k_metrics: scenario.k_metrics,
        score: scenario.score,
        info_loss: scenario.info_loss,
      })),
    },
  });

  const reportBase = {
    schema_version: "tokamak_robustness_report/1",
    kind: "tokamak_robustness_report",
    generated_at_iso,
    dataset_path: opts.dataset_path,
    report_hash,
    baseline,
    scenarios,
  };

  const report = TokamakRobustnessReport.parse(
    withDerivedArtifactInformationBoundary(reportBase, informationBoundary),
  );

  const write = opts.artifacts?.write ?? true;
  if (write) {
    const artifactDir = opts.artifacts?.dir ?? path.resolve(process.cwd(), "artifacts");
    const outputPath =
      opts.artifacts?.output_path ??
      path.join(artifactDir, "robustness.json");
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, stableJsonStringify(report), "utf8");
  }

  return report;
}

export async function runTokamakRobustnessFromPath(
  datasetPath = DEFAULT_DATASET_PATH,
  opts: RobustnessOptions = {},
): Promise<TTokamakRobustnessReport> {
  const dataset = await loadTokamakPrecursorDataset(datasetPath);
  return runTokamakRobustnessSuite(dataset, {
    ...opts,
    dataset_path: opts.dataset_path ?? datasetPath,
  });
}

export function defaultRobustnessOutputPath(): string {
  return path.join(os.tmpdir(), "tokamak-robustness.json");
}
