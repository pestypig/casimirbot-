import fs from "node:fs/promises";
import path from "node:path";
import type { NeuroStreamKind } from "./schemas/neuro.schemas.js";

type RunningStats = {
  count: number;
  mean: number;
  m2: number;
  min: number;
  max: number;
};

type StatsSummary = {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
};

export type CalibrationSummary = {
  version: 1;
  sessionId?: string;
  label?: string;
  stream?: NeuroStreamKind;
  deviceId?: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  updateCount: number;
  sampleTotal: number;
  stats: Record<string, StatsSummary>;
};

const DEFAULT_CALIBRATION_DIR = path.resolve(
  process.cwd(),
  "data",
  "neuro",
  "calibration",
);

const createStats = (): RunningStats => ({
  count: 0,
  mean: 0,
  m2: 0,
  min: Number.POSITIVE_INFINITY,
  max: Number.NEGATIVE_INFINITY,
});

const updateStats = (stats: RunningStats, value: number): void => {
  stats.count += 1;
  const delta = value - stats.mean;
  stats.mean += delta / stats.count;
  const delta2 = value - stats.mean;
  stats.m2 += delta * delta2;
  if (value < stats.min) stats.min = value;
  if (value > stats.max) stats.max = value;
};

const summarizeStats = (stats: RunningStats): StatsSummary => {
  const variance = stats.count > 0 ? stats.m2 / stats.count : 0;
  return {
    count: stats.count,
    mean: stats.mean,
    std: Math.sqrt(Math.max(0, variance)),
    min: Number.isFinite(stats.min) ? stats.min : 0,
    max: Number.isFinite(stats.max) ? stats.max : 0,
  };
};

const safeId = (value: string): string =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "calibration";

export class CalibrationSession {
  readonly startedAt: number;
  readonly sessionId?: string;
  readonly label?: string;
  readonly stream?: NeuroStreamKind;
  readonly deviceId?: string;
  private stats = new Map<string, RunningStats>();
  private updateCount = 0;
  private sampleTotal = 0;

  constructor(options: {
    sessionId?: string;
    label?: string;
    stream?: NeuroStreamKind;
    deviceId?: string;
    startedAt?: number;
  }) {
    this.sessionId = options.sessionId;
    this.label = options.label;
    this.stream = options.stream;
    this.deviceId = options.deviceId;
    this.startedAt = options.startedAt ?? Date.now();
  }

  record(values: Record<string, number | undefined>, sampleCount?: number): void {
    this.updateCount += 1;
    if (Number.isFinite(sampleCount ?? NaN)) {
      this.sampleTotal += Math.max(0, sampleCount as number);
    }
    for (const [key, value] of Object.entries(values)) {
      if (!Number.isFinite(value ?? NaN)) continue;
      const next = this.stats.get(key) ?? createStats();
      updateStats(next, value as number);
      this.stats.set(key, next);
    }
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  getSampleTotal(): number {
    return this.sampleTotal;
  }

  finish(endedAt: number = Date.now()): CalibrationSummary {
    const summary: CalibrationSummary = {
      version: 1,
      sessionId: this.sessionId,
      label: this.label,
      stream: this.stream,
      deviceId: this.deviceId,
      startedAt: this.startedAt,
      endedAt,
      durationMs: Math.max(0, endedAt - this.startedAt),
      updateCount: this.updateCount,
      sampleTotal: this.sampleTotal,
      stats: {},
    };
    for (const [key, stats] of this.stats.entries()) {
      summary.stats[key] = summarizeStats(stats);
    }
    return summary;
  }
}

export const saveCalibrationSummary = async (
  summary: CalibrationSummary,
  filePath?: string,
): Promise<string> => {
  const baseName = filePath?.trim();
  const fileName =
    baseName && baseName.length > 0
      ? baseName
      : `${safeId(summary.sessionId ?? "session")}-${safeId(
          summary.label ?? "calibration",
        )}-${new Date(summary.endedAt).toISOString().replace(/[:.]/g, "-")}.json`;
  const resolvedPath = baseName
    ? path.resolve(process.cwd(), baseName)
    : path.join(DEFAULT_CALIBRATION_DIR, fileName);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, JSON.stringify(summary, null, 2), "utf8");
  return resolvedPath;
};
