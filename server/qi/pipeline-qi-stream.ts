import type { RawTileInput } from "./qi-saturation";
import { setQiTelemetrySource, startQiSnapStream } from "./qi-snap-source";

type TelemetrySource = "synthetic" | "controller" | "hardware";

const runtime = {
  latest: [] as RawTileInput[],
  lastSource: null as TelemetrySource | null,
  lastUpdateMs: 0,
  latestAvgNeg: null as number | null,
};

const SYNTHETIC_SUPPRESS_MS = Math.max(
  0,
  Number(process.env.QI_SYNTH_SUPPRESS_MS ?? process.env.QI_STREAM_SYNTH_SUPPRESS_MS ?? 750),
);

const STREAM_HZ = Number(process.env.QI_STREAM_HZ ?? process.env.QI_SNAP_HZ ?? 8);
const STREAM_WINDOW_S = Number(process.env.QI_STREAM_WINDOW_S ?? process.env.QI_SNAP_WINDOW_S ?? 2e-3);
const STREAM_DELTA = Number(process.env.QI_STREAM_DELTA ?? process.env.QI_SNAP_DELTA_EPS ?? 0.01);
const STREAM_FULL_EVERY = Number(process.env.QI_STREAM_FULL_EVERY ?? process.env.QI_SNAP_FULL_EVERY ?? 24);

setQiTelemetrySource(() => runtime.latest);

try {
  startQiSnapStream({
    hz: STREAM_HZ,
    window_s: STREAM_WINDOW_S,
    deltaEps: STREAM_DELTA,
    fullEvery: STREAM_FULL_EVERY,
  });
} catch (err) {
  console.error("[qi-stream] failed to start qi snap stream:", err);
}

type UpdateOptions = {
  source?: TelemetrySource;
};

export function updatePipelineQiTiles(
  tiles: RawTileInput[] | null | undefined,
  options: UpdateOptions = {},
): void {
  const nextSource: TelemetrySource = options.source ?? "synthetic";
  if (
    nextSource === "synthetic" &&
    runtime.lastSource &&
    runtime.lastSource !== "synthetic" &&
    SYNTHETIC_SUPPRESS_MS > 0
  ) {
    const age = Date.now() - runtime.lastUpdateMs;
    if (age < SYNTHETIC_SUPPRESS_MS) {
      return;
    }
  }
  runtime.latest = Array.isArray(tiles) ? tiles : [];
  runtime.lastSource = nextSource;
  runtime.lastUpdateMs = Date.now();
  runtime.latestAvgNeg = computeAverageNeg(runtime.latest);
}

export function getLatestQiTileStats(): {
  avgNeg: number | null;
  source: TelemetrySource | null;
  updatedAt: number;
} {
  return {
    avgNeg: runtime.latestAvgNeg,
    source: runtime.lastSource,
    updatedAt: runtime.lastUpdateMs,
  };
}

function computeAverageNeg(tiles: RawTileInput[]): number | null {
  if (!tiles.length) return null;
  let acc = 0;
  let weight = 0;
  for (const tile of tiles) {
    const w = Number.isFinite(tile.weight) ? (tile.weight as number) : 1;
    const sample = Number.isFinite(tile.rho_neg_Jm3) ? (tile.rho_neg_Jm3 as number) : 0;
    acc += sample * w;
    weight += w;
  }
  if (weight <= 0) return null;
  return acc / weight;
}
