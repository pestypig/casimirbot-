import { sha256Text, writeJson } from "../figure-manifest.js";

export interface ScalarSample {
  value: number | null;
}

export interface FieldStats {
  field: string;
  slicePlane: "xz" | "yz" | "centerline" | "chart";
  sampleShape: [number, number];
  rawMin: string;
  rawMax: string;
  mean: string;
  median: string;
  p01: string;
  p05: string;
  p95: string;
  p99: string;
  normalization:
    | "repo-normalized"
    | "raw"
    | "delta_from_reference"
    | "signed_zero_centered"
    | "robust_percentile"
    | "log_abs_with_sign";
  units: "repo-normalized" | "dimensionless diagnostic" | "unknown";
  sourceHash: string;
  nearZeroEpsilon?: number;
  nearZeroCount?: number;
  tickLabels: string[];
  colorDomain?: [number, number];
}

export function computeFieldStats(
  field: string,
  samples: ScalarSample[],
  options: {
    slicePlane?: FieldStats["slicePlane"];
    sampleShape?: [number, number];
    normalization: FieldStats["normalization"];
    units: FieldStats["units"];
    sourceHash: string;
    nearZeroEpsilon?: number;
    symmetricDomain?: boolean;
  },
): FieldStats {
  const values = samples.map((sample) => sample.value).filter((value): value is number => Number.isFinite(value));
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;
  const mean = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
  const p01 = quantile(sorted, 0.01);
  const p05 = quantile(sorted, 0.05);
  const median = quantile(sorted, 0.5);
  const p95 = quantile(sorted, 0.95);
  const p99 = quantile(sorted, 0.99);
  const nearZeroCount = options.nearZeroEpsilon === undefined
    ? undefined
    : values.filter((value) => Math.abs(value) <= options.nearZeroEpsilon!).length;
  const maxAbs = Math.max(Math.abs(p01), Math.abs(p99), Math.abs(min), Math.abs(max), options.nearZeroEpsilon ?? 0);
  const colorDomain: [number, number] | undefined = options.symmetricDomain ? [-maxAbs, maxAbs] : undefined;
  const ticks = ensureDistinctTicks(colorDomain
    ? [colorDomain[0], 0, colorDomain[1]]
    : [min, median, max]);
  return {
    field,
    slicePlane: options.slicePlane ?? "xz",
    sampleShape: options.sampleShape ?? [Math.max(1, samples.length), 1],
    rawMin: formatSci(min),
    rawMax: formatSci(max),
    mean: formatSci(mean),
    median: formatSci(median),
    p01: formatSci(p01),
    p05: formatSci(p05),
    p95: formatSci(p95),
    p99: formatSci(p99),
    normalization: options.normalization,
    units: options.units,
    sourceHash: options.sourceHash,
    nearZeroEpsilon: options.nearZeroEpsilon,
    nearZeroCount,
    tickLabels: ticks.map(formatSci),
    colorDomain,
  };
}

export function writeFieldStats(pathname: string, stats: FieldStats | FieldStats[]): void {
  writeJson(pathname, stats);
}

export function statsHash(stats: FieldStats | FieldStats[]): string {
  return sha256Text(JSON.stringify(stats));
}

export function formatSci(value: number): string {
  if (!Number.isFinite(value)) return "NaN";
  if (value === 0) return "0.000e+0";
  return value.toExponential(3);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const lower = sorted[base] ?? sorted[sorted.length - 1] ?? 0;
  const upper = sorted[base + 1] ?? lower;
  return lower + rest * (upper - lower);
}

function ensureDistinctTicks(ticks: number[]): number[] {
  const distinct = new Set(ticks.map(formatSci));
  if (distinct.size >= 3) return ticks;
  const center = ticks.find((value) => Number.isFinite(value)) ?? 0;
  const pad = Math.max(Math.abs(center) * 1e-3, 1e-12);
  return [center - pad, center, center + pad];
}
