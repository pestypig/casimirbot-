import type { SamplingKind } from "@shared/schema";
import { qiSnapHub } from "./qi-snap-broadcaster";
import { reduceTilesToSample, type RawTileInput } from "./qi-saturation";

type TelemetryFn = () => RawTileInput[] | null | undefined;

const DEFAULTS = {
  HZ: 12,
  FULL_EVERY: 20,
  EPS_S: 0.01,
  SAMPLER: "lorentzian" as SamplingKind,
  WINDOW_S: 2e-3,
};

const runtime = {
  timer: null as NodeJS.Timeout | null,
  sequence: 0,
  sampler: DEFAULTS.SAMPLER,
  window_s: DEFAULTS.WINDOW_S,
  fullEvery: DEFAULTS.FULL_EVERY,
  deltaEps: DEFAULTS.EPS_S,
  hz: DEFAULTS.HZ,
  lastById: new Map<string, number>(),
  sensor: null as TelemetryFn | null,
};

export function setQiTelemetrySource(fn: TelemetryFn): void {
  runtime.sensor = fn;
}

type StartOptions = {
  sensor?: TelemetryFn;
  hz?: number;
  fullEvery?: number;
  sampler?: SamplingKind;
  window_s?: number;
  deltaEps?: number;
};

export function startQiSnapStream(options: StartOptions = {}): void {
  if (runtime.timer) return;
  runtime.sensor = options.sensor ?? runtime.sensor;
  if (!runtime.sensor) {
    throw new Error("No QI telemetry source configured");
  }

  runtime.hz = clamp(options.hz ?? DEFAULTS.HZ, 1, 60);
  runtime.fullEvery = Math.max(1, Math.floor(options.fullEvery ?? DEFAULTS.FULL_EVERY));
  runtime.sampler = options.sampler ?? DEFAULTS.SAMPLER;
  runtime.window_s = Math.max(1e-6, options.window_s ?? DEFAULTS.WINDOW_S);
  runtime.deltaEps = Math.max(1e-5, options.deltaEps ?? DEFAULTS.EPS_S);
  runtime.sequence = 0;
  runtime.lastById.clear();

  const intervalMs = Math.max(10, Math.round(1000 / runtime.hz));
  runtime.timer = setInterval(tick, intervalMs);
}

export function stopQiSnapStream(): void {
  if (runtime.timer) {
    clearInterval(runtime.timer);
    runtime.timer = null;
  }
}

function tick(): void {
  const sensor = runtime.sensor;
  if (!sensor) return;
  const tiles = sensor() ?? [];
  if (!tiles.length) return;

  runtime.sequence += 1;
  const fullFrame = runtime.sequence % runtime.fullEvery === 0;
  const frameKind: "full" | "delta" = fullFrame ? "full" : "delta";
  const sample = reduceTilesToSample(tiles, Date.now(), runtime.sampler, runtime.window_s, {
    frame_kind: frameKind,
    sequence: runtime.sequence,
  });

  if (!fullFrame) {
    sample.tiles = sample.tiles.filter((tile) => {
      const prev = runtime.lastById.get(tile.tileId);
      if (prev === undefined) return true;
      return Math.abs(prev - tile.S) >= runtime.deltaEps;
    });
    if (sample.tiles.length === 0) {
      return;
    }
  }

  for (const tile of sample.tiles) {
    runtime.lastById.set(tile.tileId, tile.S);
  }

  qiSnapHub.publish(sample);
}

function clamp(value: number, min: number, max: number): number {
  const v = Number.isFinite(value) ? value : min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
