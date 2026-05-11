import type { ErEprSimulationInput } from "./er-epr-simulation";
import {
  type ErEprRawSolverObservables,
} from "./er-epr-raw-observables";

export type ErEprNormalizationThresholds = {
  timeDelayScale?: number;
  sizeWindingGrowthScale?: number;
  scramblingDropScale?: number;
  thermalizationVarianceScale?: number;
  entropyAreaProxyScale?: number;
};

export function normalizeErEprRawObservables(
  raw: ErEprRawSolverObservables,
  thresholds: ErEprNormalizationThresholds = {},
): ErEprSimulationInput["observables"] {
  const telemetry = raw.rawTelemetry;
  return {
    mutualInformation: finiteNonNegative(telemetry.leftRightMutualInformation),
    entanglementEntropy_nats: finiteNonNegative(telemetry.entanglementEntropy_nats),
    teleportationFidelity: clamp01(telemetry.teleportationFidelityRaw ?? 0),
    causalOrderingScore: causalOrderingScore(raw),
    timeDelayScore: timeDelayScore(telemetry.timeDelayEstimate, thresholds.timeDelayScale),
    operatorSizeWindingScore: operatorSizeWindingScore(
      telemetry.operatorSizeCurve,
      thresholds.sizeWindingGrowthScale,
    ),
    scramblingScore: scramblingScore(
      telemetry.outOfTimeOrderCorrelator,
      thresholds.scramblingDropScale,
    ),
    thermalizationScore: thermalizationScore(
      telemetry.twoPointCorrelator,
      thresholds.thermalizationVarianceScale,
    ),
    entropyAreaProxyTrackingScore: entropyAreaProxyTrackingScore(
      telemetry.entanglementEntropy_nats,
      telemetry.leftRightMutualInformation,
      thresholds.entropyAreaProxyScale,
    ),
    ordinaryTeleportationControlScore: clamp01(telemetry.preCouplingLeakageRaw ?? 0),
    shuffledHamiltonianControlScore: clamp01(telemetry.shuffledHamiltonianFidelityRaw ?? 0),
    disentangledControlScore: clamp01(telemetry.disentangledFidelityRaw ?? 0),
    wrongSignCouplingControlScore: clamp01(telemetry.wrongSignFidelityRaw ?? 0),
  };
}

function causalOrderingScore(raw: ErEprRawSolverObservables): number {
  if (raw.rawTelemetry.causalOrderingPass !== undefined) {
    return raw.rawTelemetry.causalOrderingPass ? 1 : 0;
  }
  const { injectionTime, couplingTime, extractionTime } = raw.rawTelemetry;
  if (
    injectionTime === undefined ||
    couplingTime === undefined ||
    extractionTime === undefined
  ) {
    return 0;
  }
  return injectionTime <= couplingTime && couplingTime <= extractionTime ? 1 : 0;
}

function timeDelayScore(value: number | undefined, scale = 1): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return 0;
  return clamp01(value / Math.max(1e-12, scale));
}

function operatorSizeWindingScore(
  curve: Array<{ time: number; size: number }> | undefined,
  scale = 1,
): number {
  if (!curve || curve.length < 2) return 0;
  const sorted = [...curve].sort((left, right) => left.time - right.time);
  const growth = sorted[sorted.length - 1].size - sorted[0].size;
  const monotoneSteps = sorted.slice(1).filter((point, index) => point.size >= sorted[index].size).length;
  const monotoneScore = monotoneSteps / Math.max(1, sorted.length - 1);
  return clamp01((growth / Math.max(1e-12, scale)) * 0.7 + monotoneScore * 0.3);
}

function scramblingScore(values: number[] | undefined, scale = 1): number {
  if (!values || values.length < 2) return 0;
  const drop = values[0] - values[values.length - 1];
  return clamp01(drop / Math.max(1e-12, scale));
}

function thermalizationScore(values: number[] | undefined, scale = 0.1): number {
  if (!values || values.length < 3) return 0;
  const tail = values.slice(Math.floor(values.length / 2));
  const avg = tail.reduce((sum, value) => sum + value, 0) / tail.length;
  const variance = tail.reduce((sum, value) => sum + (value - avg) ** 2, 0) / tail.length;
  return clamp01(1 - variance / Math.max(1e-12, scale));
}

function entropyAreaProxyTrackingScore(
  entanglementEntropy: number | undefined,
  mutualInformation: number | undefined,
  scale = 4,
): number {
  if (
    entanglementEntropy === undefined ||
    mutualInformation === undefined ||
    entanglementEntropy <= 0 ||
    mutualInformation <= 0
  ) {
    return 0;
  }
  return clamp01(Math.min(entanglementEntropy, mutualInformation) / Math.max(1e-12, scale));
}

function finiteNonNegative(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
