import type {
  AgiEvidence,
  AgiRefinerySummary,
  AgiTrajectory,
  AgiGateReport,
  AgiRunMode,
} from "@shared/agi-refinery";
import type { TrainingTraceRecord } from "@shared/schema";
import { getTrainingTraceExport } from "../observability/training-trace-store";
import {
  difficultyKey,
  intentKey,
  strategyKey,
  surfaceKey,
} from "./refinery-axes";
import { evaluateTrajectoryGates } from "./refinery-gates";

export type RefinerySummaryOptions = {
  limit?: number;
  tenantId?: string;
};

const estimateTokens = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
};

const trajectoryKey = (trajectory: AgiTrajectory): string =>
  trajectory.traceId ?? trajectory.id;

const accumulateEvidenceKinds = (
  evidence: AgiEvidence[],
  counter: Record<string, number>,
): void => {
  for (const item of evidence) {
    const key = item.kind ?? "unknown";
    counter[key] = (counter[key] ?? 0) + 1;
  }
};

const extractPayload = (
  traces: TrainingTraceRecord[],
): {
  trajectories: Map<string, AgiTrajectory>;
  gates: Map<string, AgiGateReport>;
} => {
  const trajectories = new Map<string, AgiTrajectory>();
  const gates = new Map<string, AgiGateReport>();
  for (const trace of traces) {
    if (!trace.payload) continue;
    if (trace.payload.kind === "trajectory") {
      const data = trace.payload.data as AgiTrajectory;
      trajectories.set(trajectoryKey(data), data);
    } else if (trace.payload.kind === "trajectory_gates") {
      const data = trace.payload.data as AgiGateReport;
      const key = data.traceId ?? data.trajectoryId ?? trace.traceId ?? trace.id;
      if (key) {
        gates.set(key, data);
      }
    }
  }
  return { trajectories, gates };
};

const classifyRunMode = (originShares: Record<string, number>): AgiRunMode => {
  const liveShare = originShares.live ?? 0;
  const variantShare = originShares.variant ?? 0;
  if (liveShare >= 0.8) return "anchor_mining";
  if (variantShare >= 0.8) return "variant_expansion";
  return "mixed";
};

const expectedAlphaRange: Record<AgiRunMode, { min: number; max: number }> = {
  anchor_mining: { min: 0.6, max: 1 },
  variant_expansion: { min: 0, max: 0.2 },
  mixed: { min: 0.2, max: 0.7 },
};

const metricIsActive = (value: unknown): boolean => {
  if (typeof value === "number") return value > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "0" && value !== "false";
  return false;
};

const isGovernorTrace = (trace: TrainingTraceRecord): boolean => {
  if (trace.source?.tool === "alpha_governor") return true;
  if (trace.notes?.includes("alpha_blocked")) return true;
  if (trace.notes?.includes("governor_engaged")) return true;
  if (metricIsActive(trace.metrics?.alpha_blocked)) return true;
  if (metricIsActive(trace.metrics?.governor_engaged)) return true;
  return false;
};

export const collectRefinerySummary = (
  options?: RefinerySummaryOptions,
): AgiRefinerySummary => {
  const traces = getTrainingTraceExport({
    limit: options?.limit,
    tenantId: options?.tenantId,
  });
  const governorEngaged = traces.some(isGovernorTrace);
  const { trajectories, gates } = extractPayload(traces);
  let total = 0;
  let accepted = 0;
  let totalTokens = 0;
  const byIntent: Record<string, number> = {};
  const byEvidenceKind: Record<string, number> = {};
  const byStrategy: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const bySurface: Record<string, number> = {};
  const acceptedByStrategy: Record<string, number> = {};
  const acceptedByDifficulty: Record<string, number> = {};
  const acceptedBySurface: Record<string, number> = {};
  const byOrigin: Record<string, number> = {};
  const byFailure: Record<string, number> = {};
  const byRejectReason: Record<string, number> = {};

  for (const trajectory of trajectories.values()) {
    total += 1;
    const key = trajectoryKey(trajectory);
    const gateReport = gates.get(key) ?? evaluateTrajectoryGates(trajectory);
    if (gateReport.accepted) {
      accepted += 1;
    } else {
      for (const gate of gateReport.gates) {
        if (!gate.pass) {
          byFailure[gate.name] = (byFailure[gate.name] ?? 0) + 1;
        }
      }
      if (gateReport.rejectReason) {
        byRejectReason[gateReport.rejectReason] =
          (byRejectReason[gateReport.rejectReason] ?? 0) + 1;
      }
    }
    const intentLabel = intentKey(trajectory.z);
    byIntent[intentLabel] = (byIntent[intentLabel] ?? 0) + 1;
    accumulateEvidenceKinds(trajectory.E ?? [], byEvidenceKind);
    const strategyLabel = strategyKey(trajectory);
    byStrategy[strategyLabel] = (byStrategy[strategyLabel] ?? 0) + 1;
    if (gateReport.accepted) {
      acceptedByStrategy[strategyLabel] =
        (acceptedByStrategy[strategyLabel] ?? 0) + 1;
    }
    const difficultyLabel = difficultyKey(trajectory);
    byDifficulty[difficultyLabel] = (byDifficulty[difficultyLabel] ?? 0) + 1;
    if (gateReport.accepted) {
      acceptedByDifficulty[difficultyLabel] =
        (acceptedByDifficulty[difficultyLabel] ?? 0) + 1;
    }
    const surfaceLabel = surfaceKey(trajectory);
    bySurface[surfaceLabel] = (bySurface[surfaceLabel] ?? 0) + 1;
    if (gateReport.accepted) {
      acceptedBySurface[surfaceLabel] =
        (acceptedBySurface[surfaceLabel] ?? 0) + 1;
    }
    const originLabel = trajectory.meta?.origin ?? "unknown";
    byOrigin[originLabel] = (byOrigin[originLabel] ?? 0) + 1;
    totalTokens +=
      estimateTokens(trajectory.x ?? "") +
      estimateTokens(trajectory.y?.summary ?? trajectory.y?.text ?? "");
  }

  const acceptanceRate = total > 0 ? accepted / total : 0;
  const avgTokens = total > 0 ? totalTokens / total : 0;
  const acceptanceByStrategy: Record<string, number> = {};
  const acceptanceByDifficulty: Record<string, number> = {};
  const acceptanceBySurface: Record<string, number> = {};
  for (const [key, value] of Object.entries(byStrategy)) {
    const acceptedCount = acceptedByStrategy[key] ?? 0;
    acceptanceByStrategy[key] = value > 0 ? acceptedCount / value : 0;
  }
  for (const [key, value] of Object.entries(byDifficulty)) {
    const acceptedCount = acceptedByDifficulty[key] ?? 0;
    acceptanceByDifficulty[key] = value > 0 ? acceptedCount / value : 0;
  }
  for (const [key, value] of Object.entries(bySurface)) {
    const acceptedCount = acceptedBySurface[key] ?? 0;
    acceptanceBySurface[key] = value > 0 ? acceptedCount / value : 0;
  }
  const originShares: Record<string, number> = {};
  for (const [key, value] of Object.entries(byOrigin)) {
    originShares[key] = total > 0 ? value / total : 0;
  }
  const runMode = classifyRunMode(originShares);
  const alphaRange = expectedAlphaRange[runMode];
  return {
    createdAt: new Date().toISOString(),
    total,
    accepted,
    acceptanceRate,
    totalTokens,
    avgTokens,
    originShares: Object.keys(originShares).length ? originShares : undefined,
    runMode,
    expectedAlphaMin: alphaRange.min,
    expectedAlphaMax: alphaRange.max,
    governorEngaged,
    byIntent: Object.keys(byIntent).length ? byIntent : undefined,
    byEvidenceKind: Object.keys(byEvidenceKind).length ? byEvidenceKind : undefined,
    byStrategy: Object.keys(byStrategy).length ? byStrategy : undefined,
    byDifficulty: Object.keys(byDifficulty).length ? byDifficulty : undefined,
    bySurface: Object.keys(bySurface).length ? bySurface : undefined,
    acceptanceByStrategy: Object.keys(acceptanceByStrategy).length
      ? acceptanceByStrategy
      : undefined,
    acceptanceByDifficulty: Object.keys(acceptanceByDifficulty).length
      ? acceptanceByDifficulty
      : undefined,
    acceptanceBySurface: Object.keys(acceptanceBySurface).length
      ? acceptanceBySurface
      : undefined,
    byFailure: Object.keys(byFailure).length ? byFailure : undefined,
    byRejectReason: Object.keys(byRejectReason).length
      ? byRejectReason
      : undefined,
  };
};
