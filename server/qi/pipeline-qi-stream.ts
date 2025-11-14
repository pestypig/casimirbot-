import type { RawTileInput } from "./qi-saturation";
import { setQiTelemetrySource, startQiSnapStream } from "./qi-snap-source";

const runtime = {
  latest: [] as RawTileInput[],
};

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

export function updatePipelineQiTiles(tiles: RawTileInput[] | null | undefined): void {
  runtime.latest = Array.isArray(tiles) ? tiles : [];
}
