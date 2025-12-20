import type { WarpFieldType } from "./schema";

export type Vec3 = [number, number, number];

export type MetricEval = {
  alpha: number;
  beta: Vec3;
  gamma: [number, number, number, number, number, number];
  dBeta: [number, number, number, number, number, number, number, number, number];
};

export const METRIC_MODE = {
  alcubierre: 0,
  natario: 1,
  irrotational: 2,
} as const;

export type MetricModeId = (typeof METRIC_MODE)[keyof typeof METRIC_MODE];

export const metricModeFromWarpFieldType = (warpFieldType?: WarpFieldType | null): MetricModeId => {
  switch (warpFieldType) {
    case "alcubierre":
      return METRIC_MODE.alcubierre;
    case "irrotational":
      return METRIC_MODE.irrotational;
    case "natario":
    case "natario_sdf":
    default:
      return METRIC_MODE.natario;
  }
};
