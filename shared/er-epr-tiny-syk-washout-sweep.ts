import { runErEprSolverAdapter } from "./er-epr-solver-adapter";
import type { ErEprRawSolverObservables } from "./er-epr-raw-observables";

export type TinySykWashoutPoint = {
  deltaS_nats: number;
  entropyVisibility: number;
  visibilityAdjustedSignal: number;
};

export type TinySykWashoutSummary = {
  points: TinySykWashoutPoint[];
  monotonic: boolean;
};

export function runTinySykEntropyWashoutSweep(
  raw: ErEprRawSolverObservables,
  deltaS_nats: number[],
  tolerance = 1e-9,
): TinySykWashoutSummary {
  const sorted = [...deltaS_nats].sort((left, right) => left - right);
  const points = sorted.map((deltaS) => {
    const evaluation = runErEprSolverAdapter({
      schemaVersion: "er-epr-solver-adapter-request.v1",
      requestId: `tiny-syk-washout:${raw.runId}:${deltaS}`,
      createdAt: raw.createdAt,
      raw,
      thresholds: {},
      normalizationThresholds: { entropyAreaProxyScale: 1 },
      entropyStretch: { deltaS_nats: deltaS },
      requestedSpacetimeCL: "proxy_only",
    }).evaluation;
    return {
      deltaS_nats: deltaS,
      entropyVisibility: evaluation.values.entropyVisibility,
      visibilityAdjustedSignal: evaluation.values.visibilityAdjustedSignal,
    };
  });
  const monotonic = points.slice(1).every((point, index) =>
    point.visibilityAdjustedSignal <= points[index].visibilityAdjustedSignal + tolerance,
  );
  return { points, monotonic };
}
