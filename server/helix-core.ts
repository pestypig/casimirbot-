import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import { Request, Response } from "express";
import { z } from "zod";
// Use built-in fetch when available (Node ≥18), fallback to node-fetch
import {
  initializePipelineState,
  calculateEnergyPipeline,
  switchMode,
  updateParameters,
  computeEnergySnapshot,
  buildGrRequestPayload,
  getGlobalPipelineState,
  setGlobalPipelineState,
  sampleDisplacementField,
  sampleDisplacementFieldGeometry,
  fieldSamplesToCsv,
  MODE_CONFIGS,
  PAPER_DUTY,
  orchestrateVacuumGapSweep,
  appendSweepRows,
  getSweepHistoryTotals,
  computeTauLcMsFromHull,
  TAU_LC_UNIT_DRIFT_LIMIT,
  DEFAULT_PULSED_CURRENT_LIMITS_A,
} from "./energy-pipeline";
// Import the type on a separate line to avoid esbuild/tsx parse grief
import type { EnergyPipelineState, FieldSampleBuffer, ScheduleSweepRequest, WarpGeometrySpec } from "./energy-pipeline";
import { QI_AUTOTHROTTLE_HYST, QI_AUTOTHROTTLE_TARGET } from "./config/env.js";
import {
  computeSweepPointExtended,
  stability_check,
  applyVacuumSweepGuardrails,
} from "../modules/dynamic/dynamic-casimir.js";
import { omega0_from_gap, domega0_dd } from "../modules/sim_core/static-casimir.js";
import { writePhaseCalibration, reducePhaseCalLogToLookup } from "./utils/phase-calibration.js";
// ROBUST speed of light import: handle named/default or missing module gracefully
import { C } from './utils/physics-const-safe';
import { computeClocking } from "../shared/clocking.js";
import {
  buildCurvatureBrick,
  buildHullRadialMapFromPositions,
  resolveHullRadius,
  serializeBrick,
  serializeBrickBinary,
  type CurvBrickParams,
  type Vec3,
  type HullRadialMap,
  type CurvDebugStamp,
  setCurvatureDebugStamp,
  clearCurvatureDebugStamp,
  getCurvatureDebugStamp,
} from "./curvature-brick";
import {
  buildStressEnergyBrick,
  serializeStressEnergyBrick,
  serializeStressEnergyBrickBinary,
  type StressEnergyBrickParams,
} from "./stress-energy-brick";
import {
  buildLapseBrick,
  serializeLapseBrick,
  serializeLapseBrickBinary,
  type LapseBrick,
  type LapseBrickParams,
} from "./lapse-brick";
import {
  buildGrInitialBrick,
  serializeGrInitialBrick,
  serializeGrInitialBrickBinary,
  type GrInitialBrick,
  type GrInitialBrickParams,
} from "./gr-initial-brick";
import {
  buildGrEvolveBrick,
  buildGrDiagnostics,
  serializeGrEvolveBrick,
  serializeGrEvolveBrickBinary,
  type GrEvolveBrick,
  type GrEvolveBrickParams,
} from "./gr-evolve-brick";
import {
  isGrWorkerEnabled,
  runGrEvolveBrickInWorker,
  runGrInitialBrickInWorker,
} from "./gr/gr-worker-client";
import { evaluateGrConstraintGateFromDiagnostics } from "./gr/constraint-evaluator.js";
import { resolveGrConstraintPolicyBundle } from "./gr/gr-constraint-policy.js";
import { runGrEvaluation } from "./gr/gr-evaluation.js";
import { runGrConstraintNetwork4d } from "./gr/gr-constraint-network.js";
import { runGrAgentLoop } from "./gr/gr-agent-loop.js";
import { grAgentLoopOptionsSchema } from "./gr/gr-agent-loop-schema.js";
import { recordGrAgentLoopRun } from "./services/observability/gr-agent-loop-store.js";
import {
  dynamicConfigSchema,
  vacuumGapSweepConfigSchema,
  sweepSpecSchema,
  hardwareSectorStateSchema,
  hardwareQiSampleSchema,
  hardwareSpectrumFrameSchema,
  hullSchema,
  hullAreaOverrideSchema,
  hullAreaPerSectorSchema,
  warpGeometrySchema,
  warpGeometryKindSchema,
  warpRadialSampleSchema,
  warpFallbackModeSchema,
  hullPreviewPayloadSchema,
  cardMeshMetadataSchema,
  cardLatticeMetadataSchema,
  grAssistantReportRequestSchema,
  grAssistantReportSchema,
  grConstraintPolicySchema,
  grConstraintThresholdSchema,
  grConstraintContractSchema,
  grConstraintNetworkSchema,
  grEvaluationSchema,
  grRegionStatsSchema,
  casimirTileSummarySchema,
  experimentalSchema,
  sectorControlLiveEventSchema,
} from "../shared/schema.js";
import { kappa_drive_from_power } from "../shared/curvature-proxy.js";
import { mathStageRegistry, type MathStage } from "../shared/math-stage.js";
import type {
  SweepSpec,
  SweepProgressEvent,
  SweepGuardSpec,
  RangeSpec,
  VacuumGapSweepRow,
  HardwareSectorState,
  HardwareQiSample,
  HardwareSpectrumFrame,
  BasisTransform,
  HullPreviewPayload,
  AxisLabel,
  WarpGeometryFallback,
  GrConstraintContract,
  GrAssistantReportPayload,
  GrGrounding,
  GrRegionStats,
} from "../shared/schema.js";
import type { WarpConfig } from "../types/warpViability";
import { grAssistantHandler } from "./skills/physics.gr.assistant.js";
import {
  applyHullBasisToDims,
  applyHullBasisToPositions,
  HULL_BASIS_IDENTITY,
  isIdentityHullBasis,
  resolveHullBasis,
  type HullBasisResolved,
} from "../shared/hull-basis.js";
import { buildProofPack } from "./helix-proof-pack.js";
import { getSpectrumSnapshots, postSpectrum } from "./metrics/spectrum.js";
import type { SpectrumSnapshot } from "./metrics/spectrum.js";
import { slewPump } from "./instruments/pump.js";
import { recordTrainingTrace } from "./services/observability/training-trace-store.js";
import { runModeTransitionSectorPreflight } from "./control/sectorControlPreflight.js";

/**
 * Monotonic sequence for pipeline snapshots served via GET /api/helix/pipeline.
 * Survives hot-reloads within the node process; resets on process restart.
 */
let __PIPE_SEQ = 0;

// ── simple async mutex ───────────────────────────────────────────────────────
class Mutex {
  private p = Promise.resolve();
  lock<T>(fn: () => Promise<T> | T): Promise<T> {
    const run = this.p.then(fn, fn);
    this.p = run.then(() => void 0, () => void 0);
    return run;
  }
}
const pipeMutex = new Mutex();

const BASELINE_TAU_LC_MS =
  computeTauLcMsFromHull(initializePipelineState().hull ?? null) ?? null;

type HardwareBroadcast = (topic: string, payload: unknown) => void;
let hardwareBroadcast: HardwareBroadcast | null = null;

export function registerHardwareBroadcast(fn: HardwareBroadcast | null) {
  hardwareBroadcast = fn ?? null;
}

const zPlateauSummary = z
  .object({
    phi_min_deg: z.number(),
    phi_max_deg: z.number(),
    width_deg: z.number(),
    G_ref_dB: z.number(),
    Q_penalty_pct: z.number(),
  })
  .passthrough();
const zSweepRow = z
  .object({
    d_nm: z.number().optional(),
    m: z.number().optional(),
    Omega_GHz: z.number().optional(),
    phi_deg: z.number().optional(),
    G: z.number().optional(),
    QL: z.number().optional(),
    QL_base: z.number().optional(),
    stable: z.boolean().optional(),
    status: z.enum(["PASS", "WARN", "UNSTABLE"]).optional(),
    detune_MHz: z.number().optional(),
    kappa_Hz: z.number().optional(),
    kappaEff_Hz: z.number().optional(),
    kappa_MHz: z.number().optional(),
    kappaEff_MHz: z.number().optional(),
    pumpRatio: z.number().optional(),
    plateau: z.union([zPlateauSummary, z.null()]).optional(),
    crest: z.boolean().optional(),
    notes: z.array(z.string()).optional(),
    Omega_rad_s: z.number().optional(),
    dB_squeeze: z.number().optional(),
    sidebandAsym: z.number().optional(),
    noiseTemp_K: z.number().optional(),
    deltaU_cycle_J: z.number().optional(),
    deltaU_mode_J: z.number().optional(),
    negEnergyProxy: z.number().optional(),
    pumpPhase_deg: z.number().optional(),
    g_lin: z.number().optional(),
    // Hardware aliases
    gap_nm: z.number().optional(),
    modulationDepth_pct: z.number().optional(),
    pumpFreq_GHz: z.number().optional(),
  })
  .passthrough();

type SweepRowInput = z.infer<typeof zSweepRow>;

const toFinite = (value: number | undefined, fallback = 0) =>
  Number.isFinite(value) ? (value as number) : fallback;

const toOptionalFinite = (value: number | undefined) =>
  Number.isFinite(value) ? (value as number) : undefined;

function num(x: unknown): number | undefined {
  if (x == null || x === "") return undefined;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function pick<T>(...vals: (T | undefined)[]): T | undefined {
  for (const v of vals) {
    if (v !== undefined) return v;
  }
  return undefined;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type StrobeDutySegment = { t0: number; t1: number; duty: number };
type StrobeDutySummary = {
  dutyAvg: number;
  windowMs: number;
  samples: number;
  lastSampleAt: number;
  lastDuty: number;
  sLive?: number;
  sTotal?: number;
  source?: string;
};

const STROBE_DUTY_WINDOW_MS = 12_000;
const STROBE_DUTY_MAX_SEGMENTS = 96;
let strobeDutyStream: {
  segments: StrobeDutySegment[];
  lastTs: number;
  lastDuty: number;
  summary: StrobeDutySummary | null;
} = {
  segments: [],
  lastTs: 0,
  lastDuty: 0,
  summary: null,
};

function recordStrobeDutySample(input: {
  dutyEffective: number;
  ts?: number;
  sLive?: number;
  sTotal?: number;
  source?: string;
  windowMs?: number;
}): StrobeDutySummary {
  const now = Number.isFinite(input.ts) ? (input.ts as number) : Date.now();
  const duty = clamp01(input.dutyEffective ?? 0);
  const windowMs =
    input.windowMs && Number.isFinite(input.windowMs) && (input.windowMs as number) > 0
      ? (input.windowMs as number)
      : STROBE_DUTY_WINDOW_MS;

  const cutoff = now - windowMs;
  let segments = strobeDutyStream.segments;

  const lastTs = strobeDutyStream.lastTs || now;
  const lastDuty = Number.isFinite(strobeDutyStream.lastDuty)
    ? clamp01(strobeDutyStream.lastDuty)
    : duty;
  const dt = Math.min(windowMs * 4, Math.max(0, now - lastTs));
  if (dt > 0 || segments.length === 0) {
    const start = segments.length === 0 && dt === 0 ? now - 1 : lastTs;
    segments.push({ t0: start, t1: now, duty: lastDuty });
  }

  const pruned: StrobeDutySegment[] = [];
  for (const seg of segments) {
    if (seg.t1 <= cutoff) continue;
    pruned.push({
      t0: Math.max(seg.t0, cutoff),
      t1: seg.t1,
      duty: clamp01(seg.duty),
    });
  }
  segments = pruned.slice(-STROBE_DUTY_MAX_SEGMENTS);

  let area = 0;
  let duration = 0;
  for (const seg of segments) {
    const start = Math.max(seg.t0, cutoff);
    const end = Math.max(start, seg.t1);
    const dtSeg = end - start;
    if (dtSeg <= 0) continue;
    area += seg.duty * dtSeg;
    duration += dtSeg;
  }
  const avg = duration > 0 ? area / duration : duty;

  const summary: StrobeDutySummary = {
    dutyAvg: avg,
    windowMs,
    samples: (strobeDutyStream.summary?.samples ?? 0) + 1,
    lastSampleAt: now,
    lastDuty: duty,
    sLive: input.sLive,
    sTotal: input.sTotal,
    source: input.source ?? strobeDutyStream.summary?.source ?? "hardware",
  };

  strobeDutyStream = { segments, lastTs: now, lastDuty: duty, summary };
  return summary;
}

function toVacuumRow(payload: SweepRowInput): VacuumGapSweepRow {
  const r: any = { ...payload };

  // Phase normalization and mirroring
  const phi = num(pick(r.phi_deg, r.pumpPhase_deg, r.phase_deg));
  if (phi !== undefined) {
    r.phi_deg = phi;
    if (r.pumpPhase_deg === undefined) r.pumpPhase_deg = phi;
  }

  // Frequency and detune conversions
  const kappaMHz = pick(num(r.kappa_MHz), r.kappa_Hz != null ? num(r.kappa_Hz / 1e6) : undefined);
  if (kappaMHz !== undefined) r.kappa_MHz = kappaMHz;

  const detuneMHz = pick(num(r.detune_MHz), r.detune_Hz != null ? num(r.detune_Hz / 1e6) : undefined);
  if (detuneMHz !== undefined) r.detune_MHz = detuneMHz;

  const omegaGHz = pick(num(r.Omega_GHz), num(r.pumpFreq_GHz), num(r.freq_GHz));
  if (omegaGHz !== undefined) r.Omega_GHz = omegaGHz;

  // Geometry and modulation depth
  const gapNm = pick(num(r.d_nm), num(r.gap_nm));
  if (gapNm !== undefined) r.d_nm = gapNm;

  const depthPct = pick(num(r.depth_pct), num(r.modulationDepth_pct), num(r.mDepth_pct));
  if (depthPct !== undefined) {
    r.depth_pct = depthPct;
    r.m = depthPct <= 1 ? depthPct : depthPct / 100;
  } else {
    const mCandidate = num(r.m);
    if (mCandidate !== undefined) {
      r.m = mCandidate <= 1 ? mCandidate : mCandidate / 100;
      if (r.depth_pct === undefined) r.depth_pct = r.m * 100;
    } else {
      r.m = 0;
    }
  }

  // Gains, Q, ratios
  const gain = pick(num(r.G), num(r.gain_dB), num(r.gain));
  if (gain !== undefined) r.G = gain;

  const ql = pick(num(r.QL), num(r.q_loaded), num(r.qLoaded));
  if (ql !== undefined) r.QL = ql;

  const pumpRatio = pick(num(r.pumpRatio), num(r.pump_ratio));
  if (pumpRatio !== undefined) r.pumpRatio = pumpRatio;

  const rho = pick(num(r.rho), num(r.pumpRho));
  if (rho !== undefined) r.rho = rho;

  // Noise temperature and aliases
  const noiseK = pick(num(r.noiseTemperature_K), num(r.noiseTemp_K), num(r.noise_temp_K));
  if (noiseK !== undefined) {
    r.noiseTemperature_K = noiseK;
    r.noiseTemp_K = noiseK;
  }

  // Plateau aliases
  const plateauWidth = pick(num(r.plateau?.width_deg), num(r.plateau_width_deg));
  const plateauCenter = pick(num(r.plateau?.center_deg), num(r.plateau_center_deg));
  if (plateauWidth !== undefined || plateauCenter !== undefined) {
    r.plateau = {
      ...(typeof r.plateau === "object" && r.plateau ? r.plateau : {}),
      ...(plateauWidth !== undefined ? { width_deg: plateauWidth } : {}),
      ...(plateauCenter !== undefined ? { center_deg: plateauCenter } : {}),
    };
  }

  if (r.stable === undefined) r.stable = true;
  if (r.status === undefined) r.status = "PASS";

  const plateau = r.plateau ?? null;

  const normalizedRow: VacuumGapSweepRow = {
    d_nm: toFinite(r.d_nm),
    m: toFinite(r.m),
    Omega_GHz: toFinite(r.Omega_GHz),
    phi_deg: toFinite(r.phi_deg),
    G: toFinite(r.G),
    QL: toOptionalFinite(r.QL),
    stable: r.stable,
    notes: Array.isArray(r.notes) ? r.notes : undefined,
    QL_base: toOptionalFinite(r.QL_base),
    Omega_rad_s: toOptionalFinite(r.Omega_rad_s),
    detune_MHz: toOptionalFinite(r.detune_MHz),
    kappaEff_Hz: toOptionalFinite(r.kappaEff_Hz),
    kappa_MHz: toOptionalFinite(r.kappa_MHz),
    kappaEff_MHz: toOptionalFinite(r.kappaEff_MHz),
    pumpRatio: toOptionalFinite(r.pumpRatio),
    status: r.status,
    dB_squeeze: toOptionalFinite(r.dB_squeeze),
    sidebandAsym: toOptionalFinite(r.sidebandAsym),
    noiseTemp_K: toOptionalFinite(r.noiseTemp_K ?? r.noiseTemperature_K),
    deltaU_cycle_J: toOptionalFinite(r.deltaU_cycle_J),
    deltaU_mode_J: toOptionalFinite(r.deltaU_mode_J),
    negEnergyProxy: toOptionalFinite(r.negEnergyProxy),
    crest: r.crest ?? false,
    plateau,
    pumpPhase_deg: toFinite(r.pumpPhase_deg),
    kappa_Hz: toOptionalFinite(r.kappa_Hz),
    g_lin: toOptionalFinite(r.g_lin),
  };

  return { ...r, ...normalizedRow };
}

type SweepJob = {
  id: string;
  activeSlew: boolean;
  reason: string;
  enqueuedAt: number;
};

const sweepQueue: SweepJob[] = [];
let activeSweepJob: SweepJob | null = null;

function ensureSweepRuntime(state: EnergyPipelineState): NonNullable<EnergyPipelineState["sweep"]> {
  if (!state.sweep) {
    state.sweep = {
      active: false,
      status: "idle",
      top: [],
      last: null,
      cancelRequested: false,
      cancelled: false,
      activeSlew: false,
    };
  } else {
    state.sweep.status ??= "idle";
    state.sweep.top ??= [];
    state.sweep.last ??= null;
    state.sweep.cancelRequested ??= false;
    state.sweep.cancelled ??= false;
  }
  return state.sweep;
}

function enqueueSweepJob(
  state: EnergyPipelineState,
  request: ScheduleSweepRequest & { reason: string },
): SweepJob {
  const runtime = ensureSweepRuntime(state);
  const job: SweepJob = {
    id: randomUUID(),
    activeSlew: request.activeSlew,
    reason: request.reason ?? "pipeline",
    enqueuedAt: Date.now(),
  };

  if (runtime.status === "running" && !runtime.cancelRequested) {
    runtime.cancelRequested = true;
  }

  sweepQueue.push(job);

  if (activeSweepJob) {
    const nextJob = sweepQueue[0] ?? null;
    if (nextJob) {
      runtime.nextJobId = nextJob.id;
      runtime.nextJobQueuedAt = nextJob.enqueuedAt;
      runtime.nextJobActiveSlew = nextJob.activeSlew;
    }
  } else {
    runtime.status = "queued";
    runtime.jobId = job.id;
    runtime.queuedAt = job.enqueuedAt;
    runtime.startedAt = undefined;
    runtime.completedAt = undefined;
    runtime.iter = 0;
    runtime.total = undefined;
    runtime.etaMs = undefined;
    runtime.cancelRequested = false;
    runtime.cancelled = false;
    runtime.error = undefined;
    runtime.top = [];
    runtime.last = null;
    runtime.nextJobId = undefined;
    runtime.nextJobQueuedAt = undefined;
    runtime.nextJobActiveSlew = undefined;
  }

  runtime.activeSlew = job.activeSlew;

  triggerSweepWorker();
  return job;
}

function triggerSweepWorker() {
  if (activeSweepJob || sweepQueue.length === 0) return;
  setImmediate(runNextSweepJob);
}

async function runNextSweepJob() {
  if (activeSweepJob || sweepQueue.length === 0) return;
  const job = sweepQueue.shift()!;
  activeSweepJob = job;
  try {
    await pipeMutex.lock(async () => {
      const state = getGlobalPipelineState();
      const runtime = ensureSweepRuntime(state);
      runtime.status = "running";
      runtime.jobId = job.id;
      runtime.queuedAt = runtime.queuedAt ?? job.enqueuedAt;
      runtime.startedAt = Date.now();
      runtime.cancelRequested = false;
      runtime.cancelled = false;
      runtime.active = true;
      runtime.error = undefined;
      runtime.activeSlew = job.activeSlew;
      const nextJob = sweepQueue[0] ?? null;
      if (nextJob) {
        runtime.nextJobId = nextJob.id;
        runtime.nextJobQueuedAt = nextJob.enqueuedAt;
        runtime.nextJobActiveSlew = nextJob.activeSlew;
      } else {
        runtime.nextJobId = undefined;
        runtime.nextJobQueuedAt = undefined;
        runtime.nextJobActiveSlew = undefined;
      }
      setGlobalPipelineState(state);
    });

    const state = getGlobalPipelineState();
    await orchestrateVacuumGapSweep(state);

    await pipeMutex.lock(async () => {
      const stateAfter = getGlobalPipelineState();
      const runtime = ensureSweepRuntime(stateAfter);
      const cancelled = !!runtime.cancelled;
      runtime.status = cancelled ? "cancelled" : "completed";
      runtime.active = false;
      runtime.completedAt = Date.now();
      runtime.cancelRequested = false;
      runtime.activeSlew = job.activeSlew;
      const nextJob = sweepQueue[0] ?? null;
      if (nextJob) {
        runtime.nextJobId = nextJob.id;
        runtime.nextJobQueuedAt = nextJob.enqueuedAt;
        runtime.nextJobActiveSlew = nextJob.activeSlew;
      } else {
        runtime.nextJobId = undefined;
        runtime.nextJobQueuedAt = undefined;
        runtime.nextJobActiveSlew = undefined;
      }
      if (!cancelled) {
        runtime.etaMs = 0;
      }
      setGlobalPipelineState(stateAfter);
    });
  } catch (err) {
    await pipeMutex.lock(async () => {
      const stateErr = getGlobalPipelineState();
      const runtime = ensureSweepRuntime(stateErr);
      runtime.status = "failed";
      runtime.active = false;
      runtime.completedAt = Date.now();
      runtime.cancelRequested = false;
      runtime.cancelled = false;
      runtime.error = err instanceof Error ? err.message : String(err);
      const nextJob = sweepQueue[0] ?? null;
      if (nextJob) {
        runtime.nextJobId = nextJob.id;
        runtime.nextJobQueuedAt = nextJob.enqueuedAt;
        runtime.nextJobActiveSlew = nextJob.activeSlew;
      } else {
        runtime.nextJobId = undefined;
        runtime.nextJobQueuedAt = undefined;
        runtime.nextJobActiveSlew = undefined;
      }
      setGlobalPipelineState(stateErr);
    });
  } finally {
    activeSweepJob = null;
    triggerSweepWorker();
  }
}

// Simple server-side event publisher (placeholder for future WebSocket integration)
export function publish(event: string, payload: any) {
  // TODO: Integrate with WebSocket broadcaster when available
  console.log(`[SERVER-EVENT] ${event}:`, payload);
}

const DEFAULT_SWEEP_GUARDS: Required<Pick<SweepGuardSpec, "maxGain_dB" | "minQL" | "maxQL" | "qlDropPct">> & {
  timeoutMs?: number;
  abortOnGain?: boolean;
} = {
  maxGain_dB: 15,
  minQL: 1e3,
  maxQL: 2e9,
  qlDropPct: 50,
  timeoutMs: undefined,
  abortOnGain: false,
};

const RANGE_STEP_LIMIT = 50_000;

const clampPrecision = (value: number, digits = 12) =>
  Number.isFinite(value) ? Number.parseFloat(value.toFixed(digits)) : value;

function expandRange(range: RangeSpec): number[] {
  const start = Number(range.start);
  const stop = Number(range.stop);
  const step = Number(range.step);
  if (!Number.isFinite(start) || !Number.isFinite(stop) || !Number.isFinite(step) || step === 0) {
    return [];
  }

  const direction = step > 0 ? 1 : -1;
  if (direction > 0 && start > stop) return [];
  if (direction < 0 && start < stop) return [];

  const epsilon = Math.abs(step) * 1e-6 + 1e-12;
  const values: number[] = [];
  let current = start;
  let iterations = 0;

  while (iterations < RANGE_STEP_LIMIT) {
    if (direction > 0) {
      if (current > stop + epsilon) break;
    } else if (current < stop - epsilon) {
      break;
    }
    values.push(clampPrecision(current));
    current += step;
    iterations += 1;
  }

  if (values.length === 0 && Math.abs(stop - start) <= epsilon) {
    values.push(clampPrecision(stop));
  }

  return values;
}

const toFiniteNumber = (value: unknown): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

function normalizeSweepGuards(
  guards?: SweepGuardSpec,
): SweepGuardSpec & { timeoutMs?: number; abortOnGain?: boolean } {
  return {
    maxGain_dB: toFiniteNumber(guards?.maxGain_dB) ?? DEFAULT_SWEEP_GUARDS.maxGain_dB,
    minQL: toFiniteNumber(guards?.minQL) ?? DEFAULT_SWEEP_GUARDS.minQL,
    maxQL: toFiniteNumber(guards?.maxQL) ?? DEFAULT_SWEEP_GUARDS.maxQL,
    qlDropPct: toFiniteNumber(guards?.qlDropPct) ?? DEFAULT_SWEEP_GUARDS.qlDropPct,
    timeoutMs: toFiniteNumber(guards?.timeoutMs),
    abortOnGain: typeof guards?.abortOnGain === "boolean" ? guards.abortOnGain : DEFAULT_SWEEP_GUARDS.abortOnGain,
  };
}

export async function* orchestrateParametricSweep(
  specInput: SweepSpec,
  opts: { signal?: AbortSignal } = {},
): AsyncGenerator<SweepProgressEvent> {
  const parsed = sweepSpecSchema.safeParse(specInput);
  if (!parsed.success) {
    const error = parsed.error.flatten();
    throw new Error(
      `invalid-sweep-spec: ${JSON.stringify({ fieldErrors: error.fieldErrors, formErrors: error.formErrors })}`,
    );
  }
  const spec = parsed.data;

  const gapValues = expandRange(spec.gap_nm);
  const freqValues = expandRange(spec.pumpFreq_GHz);
  const depthValues = expandRange(spec.modulationDepth_pct);
  const phaseValues = expandRange(spec.pumpPhase_deg);

  const total =
    gapValues.length * freqValues.length * depthValues.length * Math.max(phaseValues.length, 1);
  yield { type: "init", payload: { total, spec } };
  if (total === 0) {
    yield { type: "done", payload: { resultsCount: 0, elapsedMs: 0 } };
    return;
  }

  const guards = normalizeSweepGuards(spec.guards);
  const shouldActuate = spec.hardware !== false && spec.measureOnly !== true;
  const { signal } = opts;

  const state = (getGlobalPipelineState() ?? {}) as Partial<EnergyPipelineState> & Record<string, unknown>;
  const sweepCfg = ((state?.dynamicConfig as any)?.sweep ?? {}) as Record<string, unknown>;
  const geometry =
    sweepCfg.geometry === "parallel_plate" ? "parallel_plate" : "cpw";
  const gammaGeo =
    toFiniteNumber(sweepCfg.gamma_geo) ?? toFiniteNumber((state as any)?.gammaGeo) ?? 1e-3;
  const baseF0_GHz =
    toFiniteNumber(sweepCfg.base_f0_GHz) ?? (toFiniteNumber(state?.modulationFreq_GHz) ?? 15) / 2;
  const Qc = Math.max(
    1,
    toFiniteNumber(sweepCfg.Qc) ??
      toFiniteNumber((state as any)?.qCavity) ??
      toFiniteNumber((state as any)?.qMechanical) ??
      5e5,
  );
  const Qint = Math.max(
    1,
    toFiniteNumber((state as any)?.qMechanical) ?? toFiniteNumber((state as any)?.qCavity) ?? 2e9,
  );

  const startTs = Date.now();
  const timeoutAt =
    typeof guards.timeoutMs === "number" && guards.timeoutMs > 0
      ? startTs + guards.timeoutMs
      : null;

  let resultsCount = 0;
  let abortEvent: SweepProgressEvent | null = null;

  outer: for (const gap of gapValues) {
    if (signal?.aborted) {
      abortEvent = { type: "abort", payload: { reason: "client-aborted" } };
      break;
    }
    if (timeoutAt && Date.now() > timeoutAt) {
      abortEvent = { type: "abort", payload: { reason: "timeout" } };
      break;
    }

    const gapMeters = gap * 1e-9;
    const f0_GHz = omega0_from_gap(gapMeters, baseF0_GHz, geometry, gammaGeo);
    const w0 = 2 * Math.PI * f0_GHz * 1e9;
    const dw_dd = domega0_dd(gapMeters, f0_GHz, geometry, gammaGeo);

    for (const depth of depthValues) {
      if (signal?.aborted) {
        abortEvent = { type: "abort", payload: { reason: "client-aborted" } };
        break outer;
      }
      if (timeoutAt && Date.now() > timeoutAt) {
        abortEvent = { type: "abort", payload: { reason: "timeout" } };
        break outer;
      }

      for (const freq of freqValues) {
        if (shouldActuate) {
          try {
            await slewPump({ freq_GHz: freq, depth_pct: depth, phi_deg: phaseValues[0] ?? 0 });
          } catch (err) {
            console.warn("[helix-core] pump slew (freq/depth) failed:", err);
          }
          if (signal?.aborted) {
            abortEvent = { type: "abort", payload: { reason: "client-aborted" } };
            break outer;
          }
        }

        for (const phase of phaseValues) {
          if (timeoutAt && Date.now() > timeoutAt) {
            abortEvent = { type: "abort", payload: { reason: "timeout" } };
            break outer;
          }
          if (signal?.aborted) {
            abortEvent = { type: "abort", payload: { reason: "client-aborted" } };
            break outer;
          }

          if (shouldActuate) {
            try {
              await slewPump({ phi_deg: phase });
            } catch (err) {
              console.warn("[helix-core] pump slew (phase) failed:", err);
            }
          }

          const row = computeSweepPointExtended({
            gap_nm: gap,
            modulationDepth_pct: depth,
            pumpFreq_GHz: freq,
            pumpPhase_deg: phase,
            w0,
            dw_dd,
            Qc,
            Qint,
          });
          const guardCheck = stability_check(row, guards);
          row.stable = guardCheck.pass;
          row.abortReason = guardCheck.reason ?? null;

          yield { type: "point", payload: row };
          resultsCount += 1;

          if (!guardCheck.pass && guardCheck.abortSweep) {
            abortEvent = {
              type: "abort",
              payload: { reason: guardCheck.reason ?? "guard-tripped", at: row },
            };
            break outer;
          }
        }
      }
    }
  }

  if (abortEvent) {
    yield abortEvent;
    return;
  }

  const elapsedMs = Date.now() - startTs;
  yield { type: "done", payload: { resultsCount, elapsedMs } };
}

// Schema for pipeline parameter updates
const HULL_DIM_MIN_M = 1e-3;
const HULL_DIM_MAX_M = 20_000; // Guardrail: cap hull length-scale at 20 km
const HULL_AREA_MAX_M2 = 1e8; // Guardrail: cap surface area at 100 km^2
const PREVIEW_TRI_CAP = 2_000_000; // Guardrail: reject preview meshes that exceed 2M triangles
const vacuumGapSweepUpdateSchema = vacuumGapSweepConfigSchema
  .partial()
  .extend({
    gaps_nm: vacuumGapSweepConfigSchema.shape.gaps_nm.optional(),
  });

const dynamicConfigUpdateSchema = dynamicConfigSchema
  .partial()
  .extend({
    sweep: vacuumGapSweepUpdateSchema.optional(),
  });

const warpSdfPreviewSchema = z
  .object({
    key: z.string().min(1).optional(),
    hash: z.string().optional(),
    meshHash: z.string().optional(),
    basisSignature: z.string().optional(),
    dims: z
      .tuple([z.number().int().positive(), z.number().int().positive(), z.number().int().positive()])
      .optional(),
    bounds: z.tuple([z.number(), z.number(), z.number()]).optional(),
    voxelSize: z.number().positive().optional(),
    band: z.number().positive().optional(),
    format: z.enum(["float", "byte"]).optional(),
    clampReasons: z.array(z.string()).optional(),
    stats: z
      .object({
        sampleCount: z.number().int().nonnegative().optional(),
        voxelsTouched: z.number().int().nonnegative().optional(),
        voxelCoverage: z.number().nonnegative().optional(),
        trianglesTouched: z.number().int().nonnegative().optional(),
        triangleCoverage: z.number().nonnegative().optional(),
        maxAbsDistance: z.number().nonnegative().optional(),
        maxQuantizationError: z.number().nonnegative().optional(),
      })
      .optional(),
    updatedAt: z.number().nonnegative().optional(),
  })
  .partial();

const brickVec3Schema = z.tuple([z.number(), z.number(), z.number()]);

const hullBrickChannelSchema = z.object({
  data: z.string().min(1),
  min: z.number().optional(),
  max: z.number().optional(),
});

const hullBrickBoundsSchema = z
  .object({
    min: brickVec3Schema.optional(),
    max: brickVec3Schema.optional(),
    center: brickVec3Schema.optional(),
    extent: brickVec3Schema.optional(),
    axes: brickVec3Schema.optional(),
    wall: z.number().optional(),
  })
  .partial();

const hullBrickSchema = z
  .object({
    dims: z.tuple([z.number().int().positive(), z.number().int().positive(), z.number().int().positive()]),
    voxelBytes: z.number().int().positive().optional(),
    format: z.enum(["r32f"]).optional(),
    channels: z
      .object({
        hullDist: hullBrickChannelSchema.optional(),
        hullMask: hullBrickChannelSchema.optional(),
      })
      .partial(),
    bounds: hullBrickBoundsSchema.optional(),
    meta: z.record(z.any()).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.channels?.hullDist && !value.channels?.hullMask) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hullBrick must include hullDist or hullMask channel",
        path: ["channels"],
      });
    }
  });

const grInvariantStatsSchema = z
  .object({
    min: z.number().finite(),
    max: z.number().finite(),
    mean: z.number().finite(),
    p98: z.number().finite(),
    sampleCount: z.number().int().nonnegative(),
    abs: z.boolean(),
    wallFraction: z.number().finite(),
    bandFraction: z.number().finite(),
    threshold: z.number().finite(),
    bandMin: z.number().finite(),
    bandMax: z.number().finite(),
  })
  .partial();

const grInvariantStatsSetSchema = z
  .object({
    kretschmann: grInvariantStatsSchema.optional(),
    ricci4: grInvariantStatsSchema.optional(),
  })
  .partial();

const grBaselineSchema = z
  .object({
    invariants: grInvariantStatsSetSchema.optional(),
    source: z.string().optional(),
    updatedAt: z.number().finite().optional(),
  })
  .partial();

const UpdateSchema = z.object({
  tileArea_cm2: z.number().min(0.01).max(10_000).optional(),
  gap_nm: z.number().min(0.1).max(1000).optional(),
  sag_nm: z.number().min(0).max(1000).optional(),
  temperature_K: z.number().min(0).max(400).optional(),
  modulationFreq_GHz: z.number().min(0.001).max(1000).optional(),
  hull: hullSchema.partial().optional(),
  hullAreaOverride_m2: hullAreaOverrideSchema.shape.hullAreaOverride_m2,
  hullAreaOverride_uncertainty_m2: hullAreaOverrideSchema.shape.hullAreaOverride_uncertainty_m2,
  hullAreaPerSector_m2: hullAreaPerSectorSchema,
  driveDir: brickVec3Schema.optional(),
  warpFieldType: z.enum(["natario", "natario_sdf", "alcubierre", "irrotational"]).optional(),
  warpGeometry: warpGeometrySchema.partial().optional(),
  warpGeometryKind: warpGeometryKindSchema.optional(),
  warpGeometryAssetId: z.string().optional(),
  fallbackMode: warpFallbackModeSchema.optional(),
  preview: hullPreviewPayloadSchema.nullable().optional(),
  previewMesh: cardMeshMetadataSchema.nullable().optional(),
  mesh: cardMeshMetadataSchema.nullable().optional(),
  previewSdf: warpSdfPreviewSchema.nullable().optional(),
  sdf: warpSdfPreviewSchema.nullable().optional(),
  previewLattice: cardLatticeMetadataSchema.nullable().optional(),
  lattice: cardLatticeMetadataSchema.nullable().optional(),
  hullBrick: hullBrickSchema.nullable().optional(),
  grBaseline: grBaselineSchema.optional(),
  beta_trans: z.number().min(0).max(1).optional(),
  powerFillCmd: z.number().min(0).max(1).optional(),
  grEnabled: z.boolean().optional(),
  dynamicConfig: dynamicConfigUpdateSchema.optional(),
  experimental: experimentalSchema.optional(),
  negativeFraction: z.number().min(0).max(1).optional(),
  dutyCycle: z.number().min(0).max(1).optional(),
  localBurstFrac: z.number().min(0).max(1).optional(),
  sectorCount: z.number().int().min(1).max(10_000).optional(),
  sectorsConcurrent: z.number().int().min(1).max(10_000).optional(),
  sectorStrobing: z.number().int().min(1).max(10_000).optional(),
  strobeHz: z.number().min(0).max(1e9).optional(),
  phase01: z.number().optional(),
  sigmaSector: z.number().min(1e-6).max(1).optional(),
  splitEnabled: z.boolean().optional(),
  splitFrac: z.number().min(0).max(1).optional(),
  qSpoilingFactor: z.number().min(0).max(10).optional(),
  gammaGeo: z.number().min(1e-6).max(1e6).optional(),
  gammaVanDenBroeck: z.number().min(0).max(1e12).optional(),
  massMode: z
    .enum(["MODEL_DERIVED", "TARGET_CALIBRATED", "MEASURED_FORCE_INFERRED"])
    .optional(),
  iPeakMaxMidi_A: z.number().min(0).max(1e9).optional(),
  iPeakMaxSector_A: z.number().min(0).max(1e9).optional(),
  iPeakMaxLauncher_A: z.number().min(0).max(1e9).optional(),
  rhoTarget: z.number().min(0).max(1).optional(),
}).superRefine((value, ctx) => {
  const hull = value.hull;
  if (hull) {
    const checkDim = (key: "Lx_m" | "Ly_m" | "Lz_m") => {
      const raw = hull[key];
      if (raw == null) return;
      if (!Number.isFinite(raw)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "hull dimension must be finite", path: ["hull", key] });
        return;
      }
      if (raw <= HULL_DIM_MIN_M || raw > HULL_DIM_MAX_M) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `hull.${key} must be within (${HULL_DIM_MIN_M}, ${HULL_DIM_MAX_M}] m`,
          path: ["hull", key],
        });
      }
    };
    checkDim("Lx_m");
    checkDim("Ly_m");
    checkDim("Lz_m");
    if (hull.wallThickness_m != null) {
      if (!Number.isFinite(hull.wallThickness_m)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "hull.wallThickness_m must be finite", path: ["hull", "wallThickness_m"] });
      } else if (hull.wallThickness_m <= 0 || hull.wallThickness_m > HULL_DIM_MAX_M) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `hull.wallThickness_m must be within (0, ${HULL_DIM_MAX_M}] m`,
          path: ["hull", "wallThickness_m"],
        });
      }
    }
  }
  const checkArea = (raw: unknown, key: "hullAreaOverride_m2" | "hullAreaOverride_uncertainty_m2", allowZero: boolean) => {
    if (raw == null) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${key} must be finite`, path: [key] });
    } else if ((allowZero ? n < 0 : n <= 0) || n > HULL_AREA_MAX_M2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must be within ${allowZero ? "[0," : "(0,"} ${HULL_AREA_MAX_M2}] m^2`,
        path: [key],
      });
    }
  };
  checkArea(value.hullAreaOverride_m2, "hullAreaOverride_m2", false);
  checkArea(value.hullAreaOverride_uncertainty_m2, "hullAreaOverride_uncertainty_m2", true);
  if (value.hullAreaPerSector_m2 != null) {
    if (!Array.isArray(value.hullAreaPerSector_m2) || value.hullAreaPerSector_m2.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hullAreaPerSector_m2 must be a non-empty array",
        path: ["hullAreaPerSector_m2"],
      });
    } else if (value.hullAreaPerSector_m2.length > 10_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hullAreaPerSector_m2 length exceeds limit (10k)",
        path: ["hullAreaPerSector_m2"],
      });
    } else {
      const badIdx = value.hullAreaPerSector_m2.findIndex(
        (v) => !Number.isFinite(v) || v < 0 || v > HULL_AREA_MAX_M2,
      );
      if (badIdx >= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `hullAreaPerSector_m2[${badIdx}] must be within [0, ${HULL_AREA_MAX_M2}] m^2`,
          path: ["hullAreaPerSector_m2", badIdx],
        });
      }
    }
  }
});
/* BEGIN STRAY_DUPLICATED_BLOCK - commented out to fix top-level parse errors
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const s = getGlobalPipelineState();

    const totalSectors = Math.max(1, s.sectorCount);
    const concurrent = Math.max(1, s.concurrentSectors || 1); // must be ≥1 to allocate buffers
    const activeFraction = concurrent / totalSectors;

    const strobeHz = Number(s.strobeHz ?? 1000);
    const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

    const now = Date.now() / 1000;
    const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

    const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
    const activeTiles = tilesPerSector * concurrent;

    const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };

    // Canonical geometry fields for visualizer
    let a: number, b: number, c: number;
    if (hull) {

    const strobeHz = Number(s.strobeHz ?? 1000);
    const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

    const now = Date.now() / 1000;
    const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

    const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
    const activeTiles = tilesPerSector * concurrent;

    const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };

    // Canonical geometry fields for visualizer
    let a: number, b: number, c: number;
    if (hull) {
      a = hull.Lx_m / 2;
      b = hull.Ly_m / 2;
      c = hull.Lz_m / 2;
    } else {
      // Default values if hull is undefined
      a = 1007 / 2;
      b = 264 / 2;
      c = 173 / 2;
    }

    const aEff_geo  = Math.cbrt(a*b*c);                 // geometric mean (legacy)
    const aEff_harm = 3 / (1/a + 1/b + 1/c);            // ✅ harmonic mean — matches viewer
    const w_m       = (s.sag_nm ?? 16) * 1e-9;
    const w_rho_harm = w_m / aEff_harm;
    const w_rho_geo  = w_m / aEff_geo;

    // Optional scene scale helper (if your viewer wants precomputed clip axes):
    const sceneScale = 1 / Math.max(a, 1e-9);           // long semi-axis → 1.0
    const axesScene = [a*sceneScale, b*sceneScale, c*sceneScale];

    const R_geom = Math.cbrt((hull.Lx_m/2) * (hull.Ly_m/2) * (hull.Lz_m/2));

    // --- Duty & θ chain (canonical) ---
    const dutyLocal    = Number.isFinite((s as any).localBurstFrac)
      ? Math.max(1e-12, (s as any).localBurstFrac as number)
      : Math.max(1e-12, s.dutyCycle ?? 0.01); // ✅ default 1%

    // UI duty (per-sector knob, averaged by UI over all sectors)
    const dutyUI = Math.max(1e-12, s.dutyCycle ?? dutyLocal);

    // Ford–Roman ship-wide duty (used for REAL)
    const dutyFR = Math.max(1e-12, (s as any).dutyEffectiveFR ??
                                       (s as any).dutyEffective_FR ??
                                       (dutyLocal * (concurrent / totalSectors)));

    const γg   = s.gammaGeo ?? 26;
    const qsp  = s.qSpoilingFactor ?? 1;
    const γvdb = s.gammaVanDenBroeck ?? 0;             // ← use calibrated value from pipeline
    const γ3 = Math.pow(γg, 3);

    // ✅ physics-true, FR-averaged — NO sqrt
    const theta_FR = γ3 * qsp * γvdb * dutyFR;
    // keep a UI-only label if you want, but don't use it in engines
    const theta_UI = γ3 * qsp * γvdb * dutyUI;

    // Canonical, engine-facing bundle
    const warpUniforms = {
      // geometry (semi-axes in meters)
      hull: { a, b, c },
      axesScene,
      wallWidth_m: w_m,
      wallWidth_rho: w_rho_harm,

      // sectors & duties
      sectorCount: totalSectors,    // total
      sectors: concurrent,          // concurrent
      dutyCycle: dutyUI,            // UI knob
      dutyEffectiveFR: dutyFR,      // REAL θ uses this

      // physics chain
      gammaGeo: γg,
      gammaVdB: γvdb,               // ✅ canonical short key
      deltaAOverA: qsp,             // ✅ canonical for qSpoilingFactor
      currentMode: s.currentMode ?? 'hover'
    };
    const tauLC = Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / C;
    const f_m_Hz = (s.modulationFreq_GHz ?? 15) * 1e9;
    const T_m = 1 / f_m_Hz;

    const G = 9.80665;
    const gTargets: Record<string, number> = { hover:0.10*G, cruise:0.05*G, emergency:0.30*G, standby:0.00*G };
    const mode = (s.currentMode ?? 'hover').toLowerCase();
    const gTarget = gTargets[mode] ?? 0;
    const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (C*C)));
    const betaTiltVec: [number, number, number] = [0, -1, 0]; // "down" direction
    const gEff_check = (epsilonTilt * (C*C)) / R_geom;

  const C2 = C * C;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

    // Canonical warpUniforms packet for consistent engine data
    const canonicalWarpUniforms = {
      // authoritative amps & duty for engines
      gammaGeo: s.gammaGeo,
      qSpoilingFactor: s.qSpoilingFactor,
      gammaVanDenBroeck: s.gammaVanDenBroeck,
      dutyEffectiveFR: dutyFR,
      sectorCount: totalSectors,
      sectors: concurrent,
      colorMode: "theta" as const,
      physicsParityMode: false,   // REAL should flip to true at callsite
      ridgeMode: 1,
      // expected θ from pipeline (linear duty)
  // CANONICAL: authoritative ship-wide theta used by engines
  // θ = γ_geo^3 · q · γ_VdB · duty_FR
  thetaScale: theta_FR,
    };

    // lightweight server-side audit (optional but handy)
    const thetaExpected = canonicalWarpUniforms.thetaScale;
    const thetaUsedByServer = thetaExpected; // server isn't forcing; used for compare in clients
    const thetaAudit = {
      expected: thetaExpected,
      used: thetaUsedByServer,
      ratio: thetaExpected > 0 ? (thetaUsedByServer / thetaExpected) : 1
    };

    // add time-loop info needed by the viewer & charts
    const lc = (s as any).lightCrossing ?? {};
    const lcBurst = Number(lc.burst_ms);
    const lcDwell = Number(lc.dwell_ms ?? lc.sectorPeriod_ms);
    const lcTauMs = Number(lc.tauLC_ms);
    const burst_ms = Number.isFinite(lcBurst) && lcBurst > 0 ? lcBurst : dutyLocal * sectorPeriod_ms;
    const dwell_ms_effective = Number.isFinite(lcDwell) && lcDwell > 0 ? lcDwell : sectorPeriod_ms;
    const clocking = computeClocking({
      tauLC_ms: Number.isFinite(lcTauMs) && lcTauMs > 0 ? lcTauMs : tauLC * 1000,
      burst_ms,
      dwell_ms: dwell_ms_effective,
      sectorPeriod_ms,
      hull,
      localDuty: dutyLocal,
    });
    const burstForCycles = clocking.burst_ms ?? burst_ms;
    const cyclesPerBurst = (burstForCycles / 1000) * f_m_Hz; // tell client exactly how many carrier cycles fit
    const TS_effective = (() => {
      const tsRaw = Number(clocking.TS);
      if (Number.isFinite(tsRaw) && tsRaw > 0) return tsRaw;
      const tsFallback = Number(s.TS_ratio);
      if (Number.isFinite(tsFallback) && tsFallback > 0) return tsFallback;
      return 1e-9;
    })();
    const clockingPayload = { ...clocking, TS: TS_effective };
    const TS_modulation = (s as any)?.TS_modulation ?? s.TS_long ?? s.TS_ratio;
    res.json({
      totalTiles: Math.floor(s.N_tiles),
      activeTiles, tilesPerSector,
      totalSectors,
      activeSectors: concurrent,
      activeFraction,
      sectorStrobing: concurrent,   // concurrent (live) sectors
      currentSector: sweepIdx,

      // make mode & inputs visible to UI
      currentMode: s.currentMode,
      dutyCycle: s.dutyCycle,
      sectorCount: totalSectors,

      strobeHz, sectorPeriod_ms,

      hull,

      shiftVector: { epsilonTilt, betaTiltVec, gTarget, R_geom, gEff_check },

      energyOutput_MW: s.P_avg,
      energyOutput_W:  s.P_avg * 1e6,
      energyOutput:    s.P_avg,
      exoticMass_kg: Math.round(s.M_exotic),
      exoticMassRaw_kg: Math.round(s.M_exotic_raw ?? s.M_exotic),

      clocking: clockingPayload,
      timeScaleRatio: TS_effective,
      tauLC_s: tauLC, T_m_s: T_m,
      timescales: {
        f_m_Hz, T_m_s: T_m,
        L_long_m: Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m),
        T_long_s: tauLC,
        TS_long: TS_effective,
        TS_geom: s.TS_geom ?? TS_effective,
        TS_modulation,
      },

      dutyGlobal_UI: s.dutyCycle,
      dutyEffectiveFR: (s as any).dutyEffectiveFR ?? (s as any).dutyEffective_FR,

      gammaVanDenBroeck: s.gammaVanDenBroeck,
      gammaGeo: s.gammaGeo,
      qCavity: s.qCavity,

      fordRoman: { value: s.zeta, limit: 1.0, status: s.fordRomanCompliance ? "PASS" : "FAIL" },
      natario:   { value: 0, status: s.natarioConstraint ? "PASS" : "WARN" },

      massPerTile_kg,
      overallStatus: s.overallStatus ?? (s.fordRomanCompliance ? "NOMINAL" : "CRITICAL"),

      tiles: { tileArea_cm2: s.tileArea_cm2, hullArea_m2: s.hullArea_m2 ?? null, N_tiles: s.N_tiles },
    });
  } catch (err:any) {
    console.error('[getSystemMetrics] handler error:', err?.message ?? err);
    res.status(500).json({ error: 'metrics_failed', message: err?.message ?? String(err) });
  }
/* BEGIN STRAY_ORPHAN_SUMMARY - commented out to fix top-level parse errors
    energyPerSector_J,
    totalEnergy_J,
    averagePower_W: s.P_avg * 1e6,
    exoticMassGenerated_kg: s.M_exotic,
    frequency_Hz,
    dutyCycle_ship_pct: Math.max(0, (s.dutyEffective_FR ?? 0)) * 100,
    dutyCycle_requested_pct: dutyReq != null ? dutyReq*100 : null,
    status: "SEQUENCE_COMPLETE",
    log: `Pulsed ${totalSectors} sectors (${totalTiles} tiles) @ ${frequency_Hz/1e9} GHz. M_exotic=${s.M_exotic.toFixed(1)} kg.`
  };
*/

// Run diagnostics scan on all sectors
async function runDiagnosticsScan() {
  const s = getGlobalPipelineState();
  const totalSectors = Math.max(1, s.sectorCount);
  const baseQ   = s.qCavity || 1e9;
  const baseT_K = s.temperature_K ?? 20;
  const massPerTile = (s.N_tiles > 0) ? (s.M_exotic / s.N_tiles) : 0; // proxy

  const sectors = [];
  const issues  = [];

  const jitter = (k:number, span:number) => 1 + span * Math.sin(0.7*k + 0.13); // deterministic

  for (let i = 1; i <= totalSectors; i++) {
    const jQ  = jitter(i, 0.08);
    const jT  = jitter(i, 0.04);
    const jEr = jitter(i, 0.10);

    const qFactor    = baseQ * jQ;
    const temperature= baseT_K * jT;
    const errorRate  = Math.max(0, 0.02 * (1/Math.max(1e-3, s.qSpoilingFactor ?? 1)) * jEr);
    const curvatureP = Math.abs(s.U_cycle) / (9e16); // J→kg proxy per tile

    const sectorIssues:string[] = [];
    if (qFactor < baseQ * 0.9) sectorIssues.push("LOW_Q");
    if (errorRate > 0.03)      sectorIssues.push("HIGH_ERROR");
    if (temperature > baseT_K + 2.5) sectorIssues.push("TEMP_WARNING");
    if (curvatureP > massPerTile * 1.2) sectorIssues.push("CURVATURE_LIMIT");

    const status = sectorIssues.length ? "FAULT" : "OK";
    const sector = { id:`S${i}`, qFactor, errorRate, temperature, curvature:curvatureP, status, issues:sectorIssues };
    sectors.push(sector);
    if (sectorIssues.length) issues.push({ sectorId: sector.id, issues: sectorIssues });
  }

  return {
    mode: "DIAGNOSTICS",
    totalSectors,
    healthySectors: totalSectors - issues.length,
    faultySectors: issues.length,
    systemHealth: ((totalSectors - issues.length) / totalSectors * 100).toFixed(1) + "%",
    criticalIssues: issues.filter(i => i.issues.includes("CURVATURE_LIMIT")),
    warnings: issues.filter(i => !i.issues.includes("CURVATURE_LIMIT")),
    recommendations: [
      issues.length > totalSectors * 0.05 ? "Consider thermal cycling to nudge Q-factors upward" : null,
      issues.some(i => i.issues.includes("TEMP_WARNING")) ? "Increase coolant flow to affected sectors" : null
    ].filter(Boolean)
  };
}

// Simulate a full pulse cycle using current operational mode
async function simulatePulseCycle(args: { frequency_GHz: number; i_peak_A?: number; load?: PulseLoadKind }) {
  const load: PulseLoadKind = args?.load === "midi" ? "midi" : args?.load === "launcher" ? "launcher" : "sector";
  const i_peak_A = Number.isFinite(args?.i_peak_A) ? Number(args.i_peak_A) : undefined;
  const guard = enforcePulseCeiling(load, i_peak_A);
  if (!guard.ok) {
    return guard;
  }

  const s = getGlobalPipelineState();
  const frequency_Hz = args.frequency_GHz * 1e9;

  const powerRaw_W  = s.P_loss_raw * s.N_tiles; // on-window
  const powerAvg_W  = s.P_avg * 1e6;            // pipeline stores MW

  return {
    mode: "PULSE_CYCLE",
    operationalMode: s.currentMode?.toUpperCase?.() ?? "HOVER",
    frequency_Hz,
    frequency_GHz: args.frequency_GHz,
    modeParameters: {
      dutyCycle_UI: s.dutyCycle,
      sectorCount: s.sectorCount,
      concurrentSectors: s.concurrentSectors,
      qSpoilingFactor: s.qSpoilingFactor,
      gammaVanDenBroeck: s.gammaVanDenBroeck,
      powerOutput_MW: s.P_avg
    },
    energyCalculations: {
      energyPerTile_J: s.U_static,
      geometricAmplified_J: s.U_geo,
      U_Q_J: s.U_Q,
      U_cycle_J: s.U_cycle,
      powerRaw_W,
      powerAverage_W: powerAvg_W,
      exoticMassTotal_kg: s.M_exotic
    },
    metrics: {
      fordRoman: s.zeta,
      fordRomanStatus: s.fordRomanCompliance ? "PASS" : "FAIL",
      natario: 0,
      natarioStatus: s.natarioConstraint ? "VALID" : "WARN",
      timeScale: s.TS_ratio,
      timeScaleStatus: s.TS_ratio > 100 ? "PASS" : "FAIL"
    },
    status: "CYCLE_COMPLETE",
    load,
    i_peak_A,
    limit_A: guard.limit_A,
    log: `${s.currentMode?.toUpperCase?.() ?? "HOVER"} @${args.frequency_GHz} GHz | Peak=${(powerRaw_W/1e6).toFixed(1)} MW, Avg=${s.P_avg.toFixed(1)} MW, M_exotic=${Math.round(s.M_exotic)} kg, zeta=${s.zeta.toFixed(3)}, TS=${Math.round(s.TS_ratio)}`
  };
}

// Function to check metric violations
function checkMetricViolation(metricType: string) {
  const s = getGlobalPipelineState();
  const C2 = C * C;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

  const map = {
    "ford-roman": {
      value: s.zeta, limit: 1.0,
      status: s.fordRomanCompliance ? "PASS" : "FAIL",
      equation: `ζ = ${s.zeta.toPrecision(3)} ${s.zeta < 1 ? "<" : "≥"} 1.0`
    },
    "natario": {
      value: 0, limit: 0,
      status: s.natarioConstraint ? "PASS" : "WARN",
      equation: "∇·ξ = 0"
    },
    "curvature": {
      value: massPerTile_kg, limit: massPerTile_kg * 1.2,
      status: "PASS",
      equation: `m_tile ≈ ${massPerTile_kg.toExponential(2)} kg`
    },
    "timescale": {
      value: s.TS_ratio, limit: 100,
      status: s.TS_ratio > 100 ? "PASS" : "FAIL",
      equation: `TS = ${s.TS_ratio.toFixed(1)}`
    }
  } as const;

  return (map as any)[metricType] || { status: "UNKNOWN", equation: "Metric not found" };
}

// Rate limiting for OpenAI API calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};
const RATE_LIMIT_PER_MINUTE = toPositiveInt(process.env.HELIX_COMMAND_RATE_LIMIT_PER_MINUTE, 30);
const RATE_LIMIT_WINDOW = toPositiveInt(process.env.HELIX_COMMAND_RATE_LIMIT_WINDOW_MS, 60000); // 1 minute

function clientKey(req: Request) {
  const h = req.headers;
  return (h['cf-connecting-ip'] as string)
      || (h['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || (req.socket as any).remoteAddress
      || 'unknown';
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(clientId);

  if (rec && now > rec.resetTime) {
    rateLimitMap.delete(clientId); // drop stale record
  }

  const record = rateLimitMap.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + RATE_LIMIT_WINDOW;
  }
  if (record.count >= RATE_LIMIT_PER_MINUTE) return false;

  record.count++;
  rateLimitMap.set(clientId, record);
  return true;
}

// --- Minimal ChatGPT helper stubs (compatibility placeholders) -----------------
// These are lightweight implementations so the server can build requests and
// validate function call arguments during development. Replace with richer
// implementations as needed when wiring to production OpenAI function schemas.

export function buildHelixCorePrompt(state: EnergyPipelineState): string {
  // Minimal system prompt describing the pipeline state for ChatGPT
  return `You are Helix pipeline assistant. Mode=${state.currentMode ?? 'unknown'}, P_avg=${state.P_avg ?? 0} MW, N_tiles=${state.N_tiles ?? 0}`;
}

export const AVAILABLE_FUNCTIONS: any[] = [
  // Keep empty or list simple metadata; real function signatures are driven by FN_SCHEMAS
  {
    name: "run_gr_agent_loop",
    description:
      "Run the GR agent loop and return the evaluation plus an audit record.",
    parameters: {
      type: "object",
      properties: {
        maxIterations: { type: "integer", minimum: 1, maximum: 50 },
        commitAccepted: { type: "boolean" },
        useLiveSnapshot: { type: "boolean" },
      },
      additionalProperties: true,
    },
  },
];

export const FN_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  pulse_sector: z.object({
    sectorIdx: z.number().optional(),
    frequency_GHz: z.number().optional(),
    i_peak_A: z.number(),
    load: z.enum(["sector", "midi", "launcher"]).optional(),
  }),
  execute_auto_pulse_sequence: z.object({
    steps: z.number().optional(),
    interval_ms: z.number().optional(),
    i_peak_A: z.number(),
    load: z.enum(["sector", "midi", "launcher"]).optional(),
  }),
  run_diagnostics_scan: z.object({}),
  simulate_pulse_cycle: z.object({
    frequency_GHz: z.number(),
    i_peak_A: z.number(),
    load: z.enum(["sector", "midi", "launcher"]).optional(),
  }),
  check_metric_violation: z.object({ metricType: z.string() }),
  load_document: z.object({ docId: z.string() }),
  run_gr_agent_loop: grAgentLoopOptionsSchema
};

type PulseLoadKind = "midi" | "sector" | "launcher";

function resolvePulseCeiling(load: PulseLoadKind): number {
  const state = getGlobalPipelineState();
  const fallback =
    load === "midi"
      ? DEFAULT_PULSED_CURRENT_LIMITS_A.midi
      : load === "launcher"
      ? DEFAULT_PULSED_CURRENT_LIMITS_A.launcher
      : DEFAULT_PULSED_CURRENT_LIMITS_A.sector;
  if (!state) return fallback;
  if (load === "midi") return state.iPeakMaxMidi_A ?? fallback;
  if (load === "launcher") return state.iPeakMaxLauncher_A ?? fallback;
  return state.iPeakMaxSector_A ?? fallback;
}

function enforcePulseCeiling(load: PulseLoadKind, requestedA?: number) {
  const limitA = resolvePulseCeiling(load);
  const requested = Number.isFinite(requestedA) ? (requestedA as number) : undefined;
   if (requested == null) {
    return {
      ok: false,
      error: "i_peak_missing",
      load,
      requested_A: requestedA,
      limit_A: limitA,
      message: "Provide i_peak_A in pulse requests so caps can be enforced.",
    };
  }
  if (limitA != null && requested != null && requested > limitA) {
    return {
      ok: false,
      error: "i_peak_exceeds_ceiling",
      load,
      requested_A: requested,
      limit_A: limitA,
    };
  }
  return { ok: true, load, requested_A: requested, limit_A: limitA };
}

// Lightweight function implementations used when GPT asks to invoke server-side tasks
export async function executePulseSector(args: any) {
  const load: PulseLoadKind = args?.load === "midi" ? "midi" : args?.load === "launcher" ? "launcher" : "sector";
  const i_peak_A = Number.isFinite(args?.i_peak_A) ? Number(args.i_peak_A) : undefined;
  const guard = enforcePulseCeiling(load, i_peak_A);
  if (!guard.ok) {
    return guard;
  }
  // placeholder: simulate executing a single sector pulse
  return {
    ok: true,
    sector: args?.sectorIdx ?? 0,
    note: "pulse scheduled (stub)",
    load,
    i_peak_A,
    limit_A: guard.limit_A,
  };
}

export async function executeAutoPulseSequence(args: any) {
  const load: PulseLoadKind = args?.load === "midi" ? "midi" : args?.load === "launcher" ? "launcher" : "sector";
  const i_peak_A = Number.isFinite(args?.i_peak_A) ? Number(args.i_peak_A) : undefined;
  const guard = enforcePulseCeiling(load, i_peak_A);
  if (!guard.ok) {
    return guard;
  }
  // placeholder: simulate auto-pulse sequence
  return {
    ok: true,
    steps: args?.steps ?? 1,
    interval_ms: args?.interval_ms,
    note: "auto sequence started (stub)",
    load,
    i_peak_A,
    limit_A: guard.limit_A,
  };
}


// Main ChatGPT interaction handler
export async function handleHelixCommand(req: Request, res: Response) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Rate limiting
    const clientId = clientKey(req);
    if (!checkRateLimit(clientId)) {
      try {
        console.warn("[helix-core] rate limit exceeded", {
          clientId,
          ip: req.ip,
          path: req.path,
          ua: req.headers["user-agent"]
        });
      } catch {}
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT_PER_MINUTE.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', (RATE_LIMIT_WINDOW / 1000).toString());
      return res.status(429).json({ 
        error: `Rate limit exceeded. Maximum ${RATE_LIMIT_PER_MINUTE} requests per minute.` 
      });
    }
    const { message: userMessage, messages, function_call } = req.body;

    // Handle both single message and messages array formats
    const chatMessages = messages || (userMessage ? [{ role: "user", content: userMessage }] : []);

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OPENAI_API_KEY not configured. Please set the API key in environment variables." 
      });
    }

    // BEFORE sending to the API:
    const live = getGlobalPipelineState();
    const chatGPTRequest = {
      model: process.env.HELIX_OPENAI_MODEL || "gpt-4-0613",
      messages: [{ role: "system", content: buildHelixCorePrompt(live) }, ...chatMessages],
      functions: AVAILABLE_FUNCTIONS,
      function_call: function_call || "auto",
      temperature: 0.7
    };

    // Call ChatGPT API with timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.HELIX_OPENAI_TIMEOUT_MS || 30000));

  const _fetch = globalThis.fetch ?? (await import('node-fetch')).default as unknown as typeof fetch;
    const response = await _fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY!}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chatGPTRequest),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ 
        error: `ChatGPT API error: ${error}` 
      });
    }

    const gptResponse = await response.json() as any;
    const message = gptResponse.choices[0].message;

    // Check if GPT wants to call a function
    if (message.function_call) {
      const functionName = message.function_call.name as keyof typeof FN_SCHEMAS;
      const raw = (() => { try { return JSON.parse(message.function_call.arguments || "{}"); } catch { return {}; } })();
      const schema = FN_SCHEMAS[functionName];

      if (!schema) {
        return res.json({ message, functionResult: { error: "Unknown function" } });
      }
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return res.json({ message, functionResult: { error: "Invalid arguments", issues: parsed.error.issues } });
      }

      const args = parsed.data;
      let functionResult;
      switch (functionName) {
        case "pulse_sector": functionResult = await executePulseSector(args); break;
        case "execute_auto_pulse_sequence": functionResult = await executeAutoPulseSequence(args); break;
        case "run_diagnostics_scan": functionResult = await runDiagnosticsScan(); break;
        case "simulate_pulse_cycle": functionResult = await simulatePulseCycle(args); break;
        case "check_metric_violation": functionResult = checkMetricViolation(args.metricType); break;
        case "load_document": functionResult = { docId: args.docId, status: "LOADED", message: "Document overlay ready for display" }; break;
        case "run_gr_agent_loop": {
          const start = Date.now();
          const result = await runGrAgentLoop(args);
          const durationMs = Date.now() - start;
          const run = recordGrAgentLoopRun({
            result,
            options: args,
            durationMs,
          });
          functionResult = { run, result };
          break;
        }
      }
      return res.json({ message, functionResult });
    }

    // Return the regular message
    res.json({ message: message });

  } catch (error) {
    console.error("HELIX-CORE error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
}

function setCors(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Tile status endpoint
export function getTileStatus(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const { sectorId } = req.params;

  // Mock tile data for demo
  const tileData = {
    id: sectorId,
    qFactor: 5e4 + Math.random() * 1e5,
    errorRate: Math.random() * 0.05,
    temperature: 20 + Math.random() * 5,
    active: Math.random() > 0.3,
    strobing: Math.random() > 0.8,
    curvatureContribution: Math.random() * 1e-15,
    lastPulse: new Date().toISOString()
  };

  res.json(tileData);
}

const shouldPrewarmPipeline =
  process.env.HELIX_PREWARM_PIPELINE === "1" ||
  (process.env.NODE_ENV !== "production" && process.env.HELIX_SKIP_PREWARM !== "1");

// Initialize the global pipeline state (skip in prod to keep health checks fast)
if (shouldPrewarmPipeline) {
  setTimeout(() => {
    void (async () => {
      try {
        const pipelineState = await calculateEnergyPipeline(initializePipelineState());
        setGlobalPipelineState(pipelineState);
        if (BASELINE_TAU_LC_MS) {
          console.info("[helix-core] baseline tau_LC derived from hull geometry", {
            tauLC_ms: BASELINE_TAU_LC_MS,
            tauLC_us: BASELINE_TAU_LC_MS * 1000,
          });
        }
      } catch (error) {
        console.error("[helix-core] pipeline prewarm failed:", error);
      }
    })();
  }, 0);
}

// Generate sample tiles with positions and T00 values for Green's Potential computation
function generateSampleTiles(count: number): Array<{ pos: [number, number, number]; t00: number }> {
  const tiles = [];
  const hullA = 503.5, hullB = 132, hullC = 86.5; // Half-dimensions in meters

  for (let i = 0; i < count; i++) {
    // Generate random positions on ellipsoid surface
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = hullA * Math.sin(phi) * Math.cos(theta);
    const y = hullB * Math.sin(phi) * Math.sin(theta);
    const z = hullC * Math.cos(phi);

    // Generate T00 values with realistic stress-energy distribution
    const r = Math.hypot(x / hullA, y / hullB, z / hullC);
    const t00 = -2.568e13 * (1 + 0.1 * Math.sin(5 * theta) * Math.cos(3 * phi)) * (1 - 0.5 * r);

    tiles.push({ pos: [x, y, z] as [number, number, number], t00 });
  }

  return tiles;
}

// System metrics endpoint (physics-first, strobe-aware)
export function getSystemMetrics(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const s = getGlobalPipelineState();

  const totalSectors = Math.max(1, s.sectorCount);
  const concurrent = Math.max(1, s.concurrentSectors || 1); // must be ≥1 to allocate buffers
  const activeFraction = concurrent / totalSectors;

  const strobeHz = Number(s.strobeHz ?? 1000);
  const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

  const now = Date.now() / 1000;
  const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

  const tilesVecRaw = Array.isArray((s as any).tilesPerSectorVector)
    ? ((s as any).tilesPerSectorVector as number[])
    : null;
  const tilesPerSectorAvg = tilesVecRaw && tilesVecRaw.length
    ? tilesVecRaw.reduce((a, b) => a + b, 0) / Math.max(1, totalSectors)
    : s.N_tiles / totalSectors;
  const tilesPerSector = Math.max(0, Math.round(tilesPerSectorAvg));
  const activeTiles = tilesVecRaw && tilesVecRaw.length
    ? Math.max(0, Math.round(tilesVecRaw.reduce((a, b) => a + b, 0) * activeFraction))
    : tilesPerSector * concurrent;

  const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };

  // Canonical geometry fields for visualizer
  let a: number, b: number, c: number;
  if (hull) {
    a = hull.Lx_m / 2;
    b = hull.Ly_m / 2;
    c = hull.Lz_m / 2;
  } else {
    // Default values if hull is undefined
    a = 1007 / 2;
    b = 264 / 2;
    c = 173 / 2;
  }

  const aEff_geo  = Math.cbrt(a*b*c);                 // geometric mean (legacy)
  const aEff_harm = 3 / (1/a + 1/b + 1/c);            // ✅ harmonic mean — matches viewer
  const w_m       = (s.sag_nm ?? 16) * 1e-9;
  const w_rho_harm = w_m / aEff_harm;
  const w_rho_geo  = w_m / aEff_geo;

  // Optional scene scale helper (if your viewer wants precomputed clip axes):
  const sceneScale = 1 / Math.max(a, 1e-9);           // long semi-axis → 1.0
  const axesScene = [a*sceneScale, b*sceneScale, c*sceneScale];

  const R_geom = Math.cbrt((hull.Lx_m/2) * (hull.Ly_m/2) * (hull.Lz_m/2));

  // --- Duty & θ chain (canonical) ---
  const dutyLocal    = Number.isFinite((s as any).localBurstFrac)
    ? Math.max(1e-12, (s as any).localBurstFrac as number)
    : Math.max(1e-12, s.dutyCycle ?? 0.01); // ✅ default 1%

  // UI duty (per-sector knob, averaged by UI over all sectors)
  const dutyUI = Math.max(1e-12, s.dutyCycle ?? dutyLocal);

  // Ford–Roman ship-wide duty (used for REAL)
  const dutyFR = Math.max(1e-12, (s as any).dutyEffectiveFR ??
                                     (s as any).dutyEffective_FR ??
                                     (dutyLocal * (concurrent / totalSectors)));

  const γg   = s.gammaGeo ?? 26;
  const qsp  = s.qSpoilingFactor ?? 1;
  const γvdb = s.gammaVanDenBroeck ?? 0;             // ← use calibrated value from pipeline
  const γ3 = Math.pow(γg, 3);

  // ✅ physics-true, FR-averaged — NO sqrt
  const theta_FR = γ3 * qsp * γvdb * dutyFR;
  // keep a UI-only label if you want, but don't use it in engines
  const theta_UI = γ3 * qsp * γvdb * dutyUI;

  // Canonical, engine-facing bundle
  const warpUniforms = {
    // geometry (semi-axes in meters)
    hull: { a, b, c },
    axesScene,
    wallWidth_m: w_m,
    wallWidth_rho: w_rho_harm,

    // sectors & duties
    sectorCount: totalSectors,    // total
    sectors: concurrent,          // concurrent
    dutyCycle: dutyUI,            // UI knob
    dutyEffectiveFR: dutyFR,      // REAL θ uses this

    // physics chain
    gammaGeo: γg,
    gammaVdB: γvdb,               // ✅ canonical short key
    deltaAOverA: qsp,             // ✅ canonical for qSpoilingFactor
    currentMode: s.currentMode ?? 'hover'
  };
  // Use canonical C imported from utils/physics-const-safe
  const tauLC = Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / C;
  const f_m_Hz = (s.modulationFreq_GHz ?? 15) * 1e9;
  const T_m = 1 / f_m_Hz;

  const G = 9.80665;
  const gTargets: Record<string, number> = { hover:0.10*G, cruise:0.05*G, emergency:0.30*G, standby:0.00*G };
  const mode = (s.currentMode ?? 'hover').toLowerCase();
  const gTarget = gTargets[mode] ?? 0;
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (C*C)));
  const betaTiltVec: [number, number, number] = [0, -1, 0]; // "down" direction
  const gEff_check = (epsilonTilt * (C*C)) / R_geom;

  const C2 = C * C;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

  // Canonical warpUniforms packet for consistent engine data
  const canonicalWarpUniforms = {
    // authoritative amps & duty for engines
    gammaGeo: s.gammaGeo,
    qSpoilingFactor: s.qSpoilingFactor,
    gammaVanDenBroeck: s.gammaVanDenBroeck,
    dutyEffectiveFR: dutyFR,
    sectorCount: totalSectors,
    sectors: concurrent,
    colorMode: "theta" as const,
    physicsParityMode: false,   // REAL should flip to true at callsite
    ridgeMode: 1,
    // expected θ from pipeline (linear duty)
    thetaScale: theta_FR,
  };

  // lightweight server-side audit (optional but handy)
  const thetaExpected = canonicalWarpUniforms.thetaScale;
  const thetaUsedByServer = thetaExpected; // server isn't forcing; used for compare in clients
  const thetaAudit = {
    expected: thetaExpected,
    used: thetaUsedByServer,
    ratio: thetaExpected > 0 ? (thetaUsedByServer / thetaExpected) : 1
  };

  // add time-loop info needed by the viewer & charts
  const lc = (s as any).lightCrossing ?? {};
  const lcBurst = Number(lc.burst_ms);
  const lcDwell = Number(lc.dwell_ms ?? lc.sectorPeriod_ms);
  const lcTauMs = Number(lc.tauLC_ms);
  const burst_ms = Number.isFinite(lcBurst) && lcBurst > 0 ? lcBurst : dutyLocal * sectorPeriod_ms;
  const dwell_ms_effective = Number.isFinite(lcDwell) && lcDwell > 0 ? lcDwell : sectorPeriod_ms;
  const clocking = computeClocking({
    tauLC_ms: Number.isFinite(lcTauMs) && lcTauMs > 0 ? lcTauMs : tauLC * 1000,
    burst_ms,
    dwell_ms: dwell_ms_effective,
    sectorPeriod_ms,
    hull,
    localDuty: dutyLocal,
  });
  const burstForCycles = clocking.burst_ms ?? burst_ms;
  const cyclesPerBurst = (burstForCycles / 1000) * f_m_Hz; // tell client exactly how many carrier cycles fit
  const TS_effective = Number.isFinite(clocking.TS) ? (clocking.TS as number) : s.TS_ratio;
  const TS_modulation = (s as any)?.TS_modulation ?? s.TS_long ?? s.TS_ratio;
  const clockingPayload = { ...clocking, TS: TS_effective };
  res.json({
    totalTiles: Math.floor(s.N_tiles),
    activeTiles, tilesPerSector,
    totalSectors,
    activeSectors: concurrent,
    activeFraction,
    env: {
      atmDensity_kg_m3: Number.isFinite((s as any).atmDensity_kg_m3)
        ? Number((s as any).atmDensity_kg_m3)
        : null,
      altitude_m: Number.isFinite((s as any).altitude_m)
        ? Number((s as any).altitude_m)
        : null,
    },
    sectorStrobing: concurrent,   // concurrent (live) sectors
    currentSector: sweepIdx,

    // make mode & inputs visible to UI
    currentMode: s.currentMode,
    dutyCycle: s.dutyCycle,
    sectorCount: totalSectors,    // total for averaging

    strobeHz, sectorPeriod_ms,

    hull,

    shiftVector: { epsilonTilt, betaTiltVec, gTarget, R_geom, gEff_check },

    energyOutput_MW: s.P_avg,        // MW (canonical)
    energyOutput_W:  s.P_avg * 1e6,  // W (for fmtPowerUnitFromW callers)
    energyOutput:    s.P_avg,        // MW (legacy alias)
    exoticMass_kg: Math.round(s.M_exotic),
    exoticMassRaw_kg: Math.round(s.M_exotic_raw ?? s.M_exotic),

    clocking,
    timeScaleRatio: TS_effective,
    tauLC_s: tauLC, T_m_s: T_m,
    timescales: {
      f_m_Hz, T_m_s: T_m,
      L_long_m: Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m),
      T_long_s: tauLC,
      TS_long: TS_effective,
      TS_geom: s.TS_geom ?? TS_effective,
      TS_modulation,
    },
    dutyGlobal_UI: s.dutyCycle,
    dutyEffectiveFR: (s as any).dutyEffectiveFR ?? (s as any).dutyEffective_FR,

    gammaVanDenBroeck: s.gammaVanDenBroeck,
    gammaGeo: s.gammaGeo,
    qCavity: s.qCavity,

    fordRoman: { value: s.zeta, limit: 1.0, status: s.fordRomanCompliance ? "PASS" : "FAIL" },
    natario:   { value: 0, status: s.natarioConstraint ? "PASS" : "WARN" },

    massPerTile_kg,
    overallStatus: s.overallStatus ?? (s.fordRomanCompliance ? "NOMINAL" : "CRITICAL"),

    tiles: {
      tileArea_cm2: s.tileArea_cm2,
      hullArea_m2: s.hullArea_m2 ?? null,
      N_tiles: s.N_tiles,
      tilesPerSector: s.tilesPerSector,
      tilesPerSectorVector: (s as any).tilesPerSectorVector,
      tilesPerSectorUniform: (s as any).tilesPerSectorUniform,
      tilePowerDensityScale: (s as any).tilePowerDensityScale,
      areaPerSector_m2: (s as any).hullAreaPerSector_m2,
      areaPerSectorSource: (s as any).__hullAreaPerSectorSource,
      hullAreaSource: (s as any).__hullAreaSource,
      hullAreaEllipsoid_m2: (s as any).__hullAreaEllipsoid_m2,
    },

    // Add tile data with positions and T00 values for Green's Potential computation
    tileData: generateSampleTiles(Math.min(100, activeTiles)), // Generate sample tiles for φ computation
    geometry: { Lx_m: hull.Lx_m, Ly_m: hull.Ly_m, Lz_m: hull.Lz_m, TS_ratio: TS_effective, TS_long: TS_effective, TS_geom: s.TS_geom ?? TS_effective },

    axes_m: [a, b, c],
    axesScene,                         // for immediate camera fit
    cameraZ_hint: Math.max(1.2, 1.8 * Math.max(...axesScene)), // camera positioning hint
    wallWidth_m: w_m,
    wallWidth_rho: w_rho_harm,         // ✅ unified with renderer (harmonic-mean ρ)
    wallWidth_rho_geo: w_rho_geo,      // legacy (do not use for viewer)
    aEff_geo_m: aEff_geo,
    aEff_harm_m: aEff_harm,

    // ✅ canonical packet the renderer consumes
    warpUniforms: canonicalWarpUniforms,
    thetaAudit,

    // ✅ hint-only values (never applied as uniforms)
    viewerHints: {
      theta_FR_like: theta_FR,
      theta_UI_like: theta_UI,
      ridgeMode: 1,
      colorMode: 'theta'
    },

    // ✅ strobe/time window (for dutyLocal provenance)
    lightCrossing: {
      tauLC_ms: clockingPayload.tauLC_ms ?? tauLC * 1000,
      dwell_ms: clockingPayload.dwell_ms ?? dwell_ms_effective,
      burst_ms: clockingPayload.burst_ms ?? burst_ms,
      sectorIdx: sweepIdx,
      sectorCount: totalSectors,
      onWindowDisplay: true,
      // 👇 additions for the viewer/plots
      onWindow: true,
      freqGHz: f_m_Hz / 1e9,
      tauPulse_ms: clockingPayload.tauPulse_ms ?? clockingPayload.burst_ms ?? null,
      epsilon: clockingPayload.epsilon ?? null,
      TS: clockingPayload.TS ?? null,
      regime: clockingPayload.regime,
      cyclesPerBurst
    },

    modelMode: "calibrated-single-pass"
  });
}

// Get full pipeline state
export async function getPipelineState(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Helix-Mock", "0");
  res.setHeader("X-Server-PID", `${process.pid}`);

  let s: EnergyPipelineState;
  try {
    s = await pipeMutex.lock(async () => {
      const current = getGlobalPipelineState();
      const refreshed = await calculateEnergyPipeline({ ...current });
      setGlobalPipelineState(refreshed);
      return refreshed;
    });
  } catch (err) {
    console.error("[helix-core] getPipelineState failed:", err);
    res.status(500).json({ error: "pipeline-state-compute-failed" });
    return;
  }

  // Include mode-specific configuration fields for client consumption
  const currentMode = s.currentMode || 'hover';
  const modeConfig = MODE_CONFIGS[currentMode as keyof typeof MODE_CONFIGS];

  const stampedTs = Date.now();
  const stampedSeq = ++__PIPE_SEQ;
  const uptime_ms = (s as any).__uptime_ms ?? Math.floor(process.uptime() * 1000);
  const tick = (s as any).__tick ?? null;

  res.json({
    ...s,
    // monotonic server-side stamps for clients to order snapshots
    seq: stampedSeq,
    __ts: stampedTs,
    __tick: tick,
    __uptime_ms: uptime_ms,
    __ts_baseBurst_ms: (s as any).__ts_baseBurst_ms ?? null,
    __ts_baseBurst_source: (s as any).__ts_baseBurst_source ?? null,
    __dt_wall_s: (s as any).__dt_wall_s ?? null,
    tsAutoscale: s.tsAutoscale
      ? {
          engaged: !!s.tsAutoscale.engaged,
          gating: s.tsAutoscale.gating ?? "idle",
          appliedBurst_ns: s.tsAutoscale.appliedBurst_ns ?? null,
          proposedBurst_ns: s.tsAutoscale.proposedBurst_ns ?? null,
          target: (s.tsAutoscale as any).targetTS ?? (s.tsAutoscale as any).target ?? null,
          slew: (s.tsAutoscale as any).slewPerSec ?? (s.tsAutoscale as any).slew ?? null,
          floor_ns: (s.tsAutoscale as any).floor_ns ?? null,
          lastTickMs: (s.tsAutoscale as any).lastTickMs ?? (s as any).__ts_lastUpdate ?? null,
          dtLast_s: (s.tsAutoscale as any).dtLast_s ?? (s as any).__ts_dt_s ?? null,
        }
      : null,
    qiAutothrottle: {
      enabled: !!s.qiAutothrottle?.enabled,
      scale: s.qiAutothrottle?.scale ?? 1,
      target: s.qiAutothrottle?.target ?? QI_AUTOTHROTTLE_TARGET,
      hysteresis: s.qiAutothrottle?.hysteresis ?? QI_AUTOTHROTTLE_HYST,
      reason: s.qiAutothrottle?.reason ?? null,
    },
    qiAutoscale: s.qiAutoscale
      ? {
          enabled: !!s.qiAutoscale.enabled,
          engaged: !!s.qiAutoscale.engaged,
          target: s.qiAutoscale.targetZeta ?? (s.qiAutoscale as any).target ?? 0.9,
          zetaRaw: s.qiAutoscale.rawZeta ?? null,
          sumWindowDt: (s.qiAutoscale as any).sumWindowDt ?? null,
          rhoSource: (s.qiAutoscale as any).rhoSource ?? null,
          proposedScale: s.qiAutoscale.proposedScale ?? null,
          appliedScale:
            s.qiAutoscale.appliedScale ??
            s.qiAutoscale.scale ??
            1,
          gating: s.qiAutoscale.gating ?? "idle",
          note: s.qiAutoscale.note ?? null,
          minScale: (s.qiAutoscale as any).minScale ?? null,
          slew: (s.qiAutoscale as any).slewPerSec ?? (s.qiAutoscale as any).slew ?? null,
          lastTickMs: (s.qiAutoscale as any).lastTickMs ?? null,
          dtLast_s: (s.qiAutoscale as any).dtLast_s ?? (s as any).__qi_dt_s ?? null,
          clamps: Array.isArray(s.qiAutoscale.clamps)
            ? s.qiAutoscale.clamps.slice(-6)
            : [],
        }
      : null,
    dutyEffectiveFR: (s as any).dutyEffectiveFR ?? (s as any).dutyEffective_FR,
    // canonical viewer fields
    sectorCount: s.sectorCount,                 // total
    sectors: s.concurrentSectors ?? 1,          // concurrent
    hull: { a: (s.hull?.Lx_m || 1007)/2, b: (s.hull?.Ly_m || 264)/2, c: (s.hull?.Lz_m || 173)/2 }, // ✅
    gammaVdB: s.gammaVanDenBroeck,
    deltaAOverA: s.qSpoilingFactor,
    // helpful defaults
    localBurstFrac: (s as any).localBurstFrac ?? 0.01
  });
}

// Get proof pack for pipeline-derived metrics
export async function getPipelineProofs(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Helix-Mock", "0");
  res.setHeader("X-Server-PID", `${process.pid}`);

  let s: EnergyPipelineState;
  try {
    s = await pipeMutex.lock(async () => {
      const current = getGlobalPipelineState();
      const refreshed = await calculateEnergyPipeline({ ...current });
      setGlobalPipelineState(refreshed);
      return refreshed;
    });
  } catch (err) {
    console.error("[helix-core] getPipelineProofs failed:", err);
    res.status(500).json({ error: "pipeline-proofs-compute-failed" });
    return;
  }

  const proofPack = buildProofPack(s);
  try {
    const entries = Object.values(proofPack.values);
    const missingCount = entries.filter((entry) => entry.value == null).length;
    const proxyCount = entries.filter((entry) => entry.proxy).length;
    recordTrainingTrace({
      traceId: `proof-pack:${randomUUID()}`,
      source: {
        system: "helix",
        component: "pipeline-proof-pack",
        tool: "proof-pack",
        version: "v1",
        proxy: proxyCount > 0,
      },
      signal: {
        kind: "proof-pack",
        proxy: proxyCount > 0,
      },
      pass: missingCount === 0,
      deltas: [],
      metrics: {
        fields_total: entries.length,
        fields_missing: missingCount,
        fields_proxy: proxyCount,
        pipeline_seq: proofPack.pipeline?.seq ?? null,
      },
      notes: proofPack.notes,
    });
  } catch (error) {
    console.warn("[helix-core] proof pack training trace emit failed", error);
  }

  res.json(proofPack);
}

// Update pipeline parameters
export async function updatePipelineParams(req: Request, res: Response) {
  try {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid parameters", issues: parsed.error.issues });
    }
    type WarpGeometryInput =
      | (Partial<Omit<WarpGeometrySpec, "sdf">> & {
          kind?: EnergyPipelineState["warpGeometryKind"];
          geometryKind?: EnergyPipelineState["warpGeometryKind"];
          radial?: Partial<WarpGeometrySpec["radial"]>;
          sdf?:
            | (Partial<WarpGeometrySpec["sdf"]> & {
                dims?: [number, number, number];
                bounds_m?: [number, number, number];
                band_m?: number;
                format?: "float" | "byte";
              })
            | null;
        })
      | null;
  type PipelineParamInput = Record<string, any> & {
    hull?: Partial<EnergyPipelineState["hull"]>;
    warpGeometry?: WarpGeometryInput;
  };
  const params: PipelineParamInput = { ...parsed.data };
  if (typeof params.phase01 === "number" && Number.isFinite(params.phase01)) {
    params.phase01 = wrap01(params.phase01);
  }
  if (typeof params.sectorCount === "number" && Number.isFinite(params.sectorCount)) {
    params.sectorCount = Math.max(1, Math.floor(params.sectorCount));
  }
  if (typeof params.strobeHz === "number" && Number.isFinite(params.strobeHz)) {
    params.strobeHz = Math.max(0, params.strobeHz);
  }
  if (typeof params.sigmaSector === "number" && Number.isFinite(params.sigmaSector)) {
    params.sigmaSector = Math.max(1e-6, Math.min(1, params.sigmaSector));
  }
  if (typeof params.splitFrac === "number" && Number.isFinite(params.splitFrac)) {
    params.splitFrac = clamp01(params.splitFrac);
  }
  const previewPayload = params.preview ?? null;
  const previewMesh = params.previewMesh ?? params.mesh ?? null;
  const previewSdf = params.previewSdf ?? params.sdf ?? null;
  const previewLattice = params.previewLattice ?? params.lattice ?? null;
  const fallbackModeRaw = params.fallbackMode;
  const validatePreview = (): string[] => {
    const reasons: string[] = [];
    const triCandidates = [
      (previewMesh as any)?.triangleCount,
      (previewPayload as any)?.lodFull?.triangleCount,
      (previewPayload as any)?.lodCoarse?.triangleCount,
    ]
      .map((v) => (Number.isFinite(v) ? Number(v) : null))
      .filter((v): v is number => v != null);
    if (triCandidates.length && Math.max(...triCandidates) > PREVIEW_TRI_CAP) {
      reasons.push(`triangles>${PREVIEW_TRI_CAP}`);
    }
    const dimsCandidates: Array<[number, number, number]> = [];
    const targetDims = (previewPayload as any)?.targetDims;
    if (targetDims && Number.isFinite(targetDims.Lx_m) && Number.isFinite(targetDims.Ly_m) && Number.isFinite(targetDims.Lz_m)) {
      dimsCandidates.push([targetDims.Lx_m, targetDims.Ly_m, targetDims.Lz_m]);
    }
    const metricDims = (previewPayload as any)?.hullMetrics?.dims_m;
    if (metricDims && Number.isFinite(metricDims.Lx_m) && Number.isFinite(metricDims.Ly_m) && Number.isFinite(metricDims.Lz_m)) {
      dimsCandidates.push([metricDims.Lx_m, metricDims.Ly_m, metricDims.Lz_m]);
    }
    const obb = (previewMesh as any)?.obb ?? (previewPayload as any)?.obb;
    if (obb?.halfSize && Array.isArray(obb.halfSize) && obb.halfSize.length >= 3) {
      const [hx, hy, hz] = obb.halfSize;
      if ([hx, hy, hz].every((v: any) => Number.isFinite(v))) {
        dimsCandidates.push([hx * 2, hy * 2, hz * 2]);
      } else {
        reasons.push("obb:nonfinite");
      }
    }
    for (const dims of dimsCandidates) {
      if (dims.some((v) => !Number.isFinite(v) || v <= 0)) {
        reasons.push("dims:nonfinite");
        break;
      }
      const maxDim = Math.max(...dims);
      if (maxDim > HULL_DIM_MAX_M) {
        reasons.push(`extent>${HULL_DIM_MAX_M}`);
        break;
      }
    }
    return Array.from(new Set(reasons));
  };

    const previewProvided = Object.prototype.hasOwnProperty.call(parsed.data, "preview");
  const previewMeshProvided =
    Object.prototype.hasOwnProperty.call(parsed.data, "previewMesh") ||
    Object.prototype.hasOwnProperty.call(parsed.data, "mesh");
  const previewSdfProvided =
    Object.prototype.hasOwnProperty.call(parsed.data, "previewSdf") ||
    Object.prototype.hasOwnProperty.call(parsed.data, "sdf");
  const previewLatticeProvided =
    Object.prototype.hasOwnProperty.call(parsed.data, "previewLattice") ||
    Object.prototype.hasOwnProperty.call(parsed.data, "lattice");
  const previewSdfPresent = previewSdfProvided && previewSdf != null;
  const previewLatticePresent = previewLatticeProvided && previewLattice != null;
  const fallbackMode: "allow" | "warn" | "block" =
    fallbackModeRaw === "warn" || fallbackModeRaw === "block" ? fallbackModeRaw : "allow";
  const warpFieldRequested =
    params.warpFieldType ??
    (params.dynamicConfig && typeof params.dynamicConfig === "object"
      ? (params.dynamicConfig as any).warpFieldType
      : undefined);
  const applyPreview =
    previewPayload != null ||
    previewMesh != null ||
    previewSdf != null ||
    previewLattice != null;
  if (applyPreview && !warpFieldRequested) {
    params.warpFieldType = "alcubierre";
    params.dynamicConfig = {
      ...(params.dynamicConfig ?? {}),
      warpFieldType: "alcubierre",
    };
  }
  if (previewProvided || previewMeshProvided || previewSdfProvided || previewLatticeProvided) {
    const validationReasons = validatePreview();
    if (validationReasons.length) {
      return res.status(422).json({ error: "preview-validation-failed", validation: validationReasons });
    }
  }

    const pickHash = (value: unknown) =>
      typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

    let resolvedGeometryKind: EnergyPipelineState["warpGeometryKind"] | undefined;

    delete params.preview;
    delete params.previewMesh;
    delete params.mesh;
    delete params.previewSdf;
    delete params.sdf;
    delete params.previewLattice;
    delete params.lattice;
    delete (params as any).fallbackMode;

    if (typeof params.negativeFraction === "number") {
      params.negativeFraction = Math.max(0, Math.min(1, params.negativeFraction));
    }
    const { nextState: newState, scheduledJob, fallback: geometryFallback, blocked } = await pipeMutex.lock<{
      nextState: EnergyPipelineState;
      scheduledJob: SweepJob | null;
      fallback: WarpGeometryFallback;
      blocked: boolean;
    }>(async () => {
      let pendingJob: SweepJob | null = null;
      const curr = getGlobalPipelineState();
      const previewState = (curr as any).geometryPreview ?? null;

      const meshHashIncoming = pickHash(
        (previewMesh as any)?.meshHash ?? (previewPayload as any)?.meshHash ?? (previewPayload as any)?.mesh?.meshHash,
      );
      const meshHashExisting = pickHash(
        (previewState as any)?.mesh?.meshHash ??
          (previewState as any)?.preview?.meshHash ??
          (previewState as any)?.preview?.mesh?.meshHash,
      );
      const meshesAlign = !meshHashIncoming || !meshHashExisting || meshHashIncoming === meshHashExisting;
      const meshHash = meshHashIncoming ?? meshHashExisting;

      const sdfHashIncoming = pickHash(
        (previewSdf as any)?.key ?? (previewSdf as any)?.hash ?? (previewLattice as any)?.hashes?.sdf,
      );
      const sdfHashExisting = meshesAlign
        ? pickHash((previewState as any)?.sdf?.key ?? (previewState as any)?.sdf?.hash ?? (previewState as any)?.lattice?.hashes?.sdf)
        : null;
      const sdfHash = sdfHashIncoming ?? sdfHashExisting;

      const volumeHashIncoming = pickHash((previewLattice as any)?.hashes?.volume);
      const volumeHashExisting = meshesAlign ? pickHash((previewState as any)?.lattice?.hashes?.volume) : null;
      const volumeHash = volumeHashIncoming ?? volumeHashExisting;

      const latticeEnabledIncoming = (previewLattice as any)?.enabled;
      const latticeEnabledExisting = meshesAlign ? (previewState as any)?.lattice?.enabled : undefined;
      const latticeEnabled = latticeEnabledIncoming ?? latticeEnabledExisting;

      const clampReasons: string[] = [];
      const sdfClampIncoming = (previewSdf as any)?.clampReasons;
      if (Array.isArray(sdfClampIncoming)) clampReasons.push(...sdfClampIncoming);
      const latticeClampIncoming = (previewLattice as any)?.frame?.clampReasons;
      if (Array.isArray(latticeClampIncoming)) clampReasons.push(...latticeClampIncoming);
      if (meshesAlign) {
        const sdfClampExisting = (previewState as any)?.sdf?.clampReasons;
        if (Array.isArray(sdfClampExisting)) clampReasons.push(...sdfClampExisting);
        const latticeClampExisting = (previewState as any)?.lattice?.frame?.clampReasons;
        if (Array.isArray(latticeClampExisting)) clampReasons.push(...latticeClampExisting);
      }

      const hasPreviewSdf =
        previewSdfPresent || (!previewSdfProvided && meshesAlign && !!(previewState as any)?.sdf);
      const hasPreviewLattice =
        previewLatticePresent || (!previewLatticeProvided && meshesAlign && !!(previewState as any)?.lattice);

      const fallbackReasons: string[] = [];
      const validSdfHashes = !!(meshHash && (sdfHash || volumeHash));
      const canUseSdf = validSdfHashes && clampReasons.length === 0 && latticeEnabled !== false;
      const wantsSdf = canUseSdf || params.warpGeometryKind === "sdf" || hasPreviewSdf || hasPreviewLattice;

      const resolvedKind = canUseSdf
        ? "sdf"
        : wantsSdf
          ? "ellipsoid"
          : params.warpGeometryKind ?? curr.warpGeometryKind;
      resolvedGeometryKind = resolvedKind;
      if (!meshHash) fallbackReasons.push("preview:missing-mesh");
      if (!(sdfHash || volumeHash)) fallbackReasons.push("preview:missing-sdf");
      if (!hasPreviewSdf && !hasPreviewLattice) fallbackReasons.push("preview:missing");
      if (latticeEnabled === false) fallbackReasons.push("lattice:disabled");
      if (clampReasons.length) {
        for (const reason of clampReasons) fallbackReasons.push(`clamp:${reason}`);
      }
      const fallbackReasonsUnique = Array.from(new Set(fallbackReasons));
      const fallbackRequested = wantsSdf && !canUseSdf;
      const fallbackApplied = fallbackRequested && resolvedKind === "ellipsoid";
      const fallbackMeta: WarpGeometryFallback = {
        mode: fallbackMode,
        applied: fallbackApplied,
        reasons:
          fallbackApplied || fallbackMode === "warn"
            ? fallbackReasonsUnique
            : [],
        requestedKind: params.warpGeometryKind ?? curr.warpGeometryKind ?? null,
        resolvedKind,
      };

      const { hull: hullPartial, warpGeometry: warpGeometryPartial, ...paramsRest } = params;
      const paramsTyped: Partial<EnergyPipelineState> = { ...paramsRest };
      if (warpGeometryPartial !== undefined) {
        paramsTyped.warpGeometry =
          warpGeometryPartial === null ? null : (warpGeometryPartial as unknown as WarpGeometrySpec);
      }
      if (hullPartial) {
        paramsTyped.hull = {
          ...(curr.hull ?? {
            Lx_m: curr.shipRadius_m * 2,
            Ly_m: curr.shipRadius_m * 2,
            Lz_m: curr.shipRadius_m * 2,
          }),
          ...hullPartial,
        } as EnergyPipelineState["hull"];
      }
      const geometryPreviewTouched =
        previewProvided || previewMeshProvided || previewSdfProvided || previewLatticeProvided;
      let mergedPreview: any = null;
      if (geometryPreviewTouched) {
        mergedPreview = { ...(curr as any).geometryPreview ?? {} };
        if (previewProvided) mergedPreview.preview = previewPayload;
        if (previewMeshProvided) mergedPreview.mesh = previewMesh;
        if (previewSdfProvided) mergedPreview.sdf = previewSdf;
        if (previewLatticeProvided) mergedPreview.lattice = previewLattice;
        mergedPreview.updatedAt = Date.now();
        paramsTyped.geometryPreview = mergedPreview;
      }
      if (resolvedKind) {
        if (fallbackApplied) {
          console.warn("[helix-core] warp geometry fallback to ellipsoid", {
            requestedKind: params.warpGeometryKind ?? curr.warpGeometryKind ?? null,
            meshHash,
            sdfHash: sdfHash ?? volumeHash ?? null,
            clampReasons,
            latticeEnabled: latticeEnabled ?? true,
            previewHashesAligned: meshesAlign,
            fallbackReasons: fallbackReasonsUnique,
          });
        }
        paramsTyped.warpGeometryKind = resolvedKind;
        if (paramsTyped.warpGeometry) {
          paramsTyped.warpGeometry = {
            ...(paramsTyped.warpGeometry as any),
            geometryKind: resolvedKind,
          } as any;
        }
      }
      if (fallbackApplied && fallbackMode === "block") {
        const nextStateBlocked = geometryPreviewTouched
          ? {
              ...curr,
              geometryPreview: mergedPreview ?? (curr as any).geometryPreview ?? null,
              geometryFallback: { ...fallbackMeta, blocked: true },
            }
          : { ...curr, geometryFallback: { ...fallbackMeta, blocked: true } };
        setGlobalPipelineState(nextStateBlocked);
        return { nextState: nextStateBlocked, scheduledJob: pendingJob, fallback: { ...fallbackMeta, blocked: true }, blocked: true };
      }
      const next = await updateParameters(curr, paramsTyped, {
        sweepMode: "async",
        sweepReason: "pipeline-update",
        scheduleSweep: (request) => {
          pendingJob = enqueueSweepJob(curr, { ...request, reason: request.reason ?? "pipeline-update" });
        },
      });
      if (fallbackApplied || fallbackMode === "warn") {
        (next as any).geometryFallback = fallbackMeta;
      }
      setGlobalPipelineState(next);
      return { nextState: next, scheduledJob: pendingJob, fallback: fallbackMeta, blocked: false };
    });

    if (blocked && geometryFallback) {
      return res
        .status(422)
        .json({ error: "warp-geometry-fallback-blocked", geometryFallback: { ...geometryFallback, blocked: true } });
    }

    const shouldAttachFallback = geometryFallback && (geometryFallback.applied || geometryFallback.mode === "warn");
    const attachGeometryFallback = (payload: any) =>
      shouldAttachFallback ? { ...payload, geometryFallback } : payload;

    // Write calibration for phase diagram integration
    await writePhaseCalibration({
      tile_area_cm2: newState.tileArea_cm2,
      ship_radius_m: newState.shipRadius_m || 86.5,
      P_target_W: (newState as any).P_avg_W || 100e6, 
      M_target_kg: newState.exoticMassTarget_kg || 1400,
      zeta_target: 0.5
    }, 'pipeline_update');

    const publishKeys = Object.keys(params);
    if (resolvedGeometryKind && !publishKeys.includes("warpGeometryKind")) {
      publishKeys.push("warpGeometryKind");
    }
    if (previewProvided || previewMeshProvided || previewSdfProvided || previewLatticeProvided) {
      publishKeys.push("geometryPreview");
    }
    publish("warp:reload", { reason: "pipeline-update", keys: publishKeys, ts: Date.now() });

    if (scheduledJob) {
      const isCurrentJob = newState.sweep?.jobId === scheduledJob.id;
      const responsePayload = attachGeometryFallback({
        ...newState,
        sweepJob: {
          id: scheduledJob.id,
          status: isCurrentJob ? newState.sweep?.status ?? "queued" : "queued",
          activeSlew: scheduledJob.activeSlew,
          reason: scheduledJob.reason,
          enqueuedAt: scheduledJob.enqueuedAt,
          queuedBehindActive: !isCurrentJob && newState.sweep?.status === "running",
        },
      });
      res.status(202).json(responsePayload);
    } else {
      res.json(attachGeometryFallback(newState));
    }
  } catch (error) {
    res.status(400).json({ error: "Failed to update parameters", details: error instanceof Error ? error.message : "Unknown error" });
  }
}

export async function cancelVacuumGapSweep(_req: Request, res: Response) {
  try {
    const sweepState = await pipeMutex.lock(async () => {
      const state = getGlobalPipelineState();
      const runtime = ensureSweepRuntime(state);
      runtime.cancelRequested = true;
      runtime.nextJobId = undefined;
      runtime.nextJobQueuedAt = undefined;
      runtime.nextJobActiveSlew = undefined;
      runtime.status = runtime.active ? "running" : "cancelled";
      runtime.error = undefined;
      if (!runtime.active) {
        runtime.cancelled = true;
      }
      sweepQueue.length = 0;
      setGlobalPipelineState(state);
      return {
        active: !!runtime.active,
        cancelRequested: !!runtime.cancelRequested,
        cancelled: !!runtime.cancelled,
        status: runtime.status,
        jobId: runtime.jobId,
      };
    });
    res.json({ ok: true, ...sweepState });
  } catch (error) {
    const message = error instanceof Error ? error.message : "cancel-sweep-failed";
    res.status(500).json({ ok: false, error: message });
  }
}

// Switch operational mode
export async function switchOperationalMode(req: Request, res: Response) {
  try {
    const { mode } = req.body;
    if (!['hover','taxi','nearzero','cruise','emergency','standby'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    const requestedMode = mode as EnergyPipelineState["currentMode"];
    const transition = await pipeMutex.lock(async () => {
      const curr = getGlobalPipelineState();
      const preflight = runModeTransitionSectorPreflight(curr, requestedMode);
      const appliedMode =
        preflight.plannerResult.ok
          ? requestedMode
          : preflight.fallbackMode ?? requestedMode;
      const next = await switchMode(curr, appliedMode);
      const sectorControlLiveEvent = sectorControlLiveEventSchema.parse({
        ts: Date.now(),
        requestedMode,
        appliedMode,
        fallbackApplied: preflight.fallbackApplied,
        plannerMode: preflight.plannerMode,
        firstFail: preflight.plannerResult.firstFail ?? null,
        constraints: preflight.plannerResult.plan.constraints,
        observerGrid: preflight.plannerResult.plan.observerGrid
          ? {
              overflowCount: preflight.plannerResult.plan.observerGrid.overflowCount,
              paybackGain: preflight.plannerResult.plan.observerGrid.paybackGain,
            }
          : null,
      });
      next.latestSectorControlLiveEvent = {
        ...sectorControlLiveEvent,
        source: "server",
        updatedAt: Date.now(),
      };
      setGlobalPipelineState(next);
      return { next, preflight, appliedMode, sectorControlLiveEvent };
    });
    const newState = transition.next;

    // Write calibration for phase diagram integration  
    await writePhaseCalibration({
      tile_area_cm2: newState.tileArea_cm2,
      ship_radius_m: newState.shipRadius_m || 86.5,
      P_target_W: 100e6, // Use fixed target power for now
      M_target_kg: newState.exoticMassTarget_kg || 1400,
      zeta_target: 0.5
    }, 'mode_change');

    publish("warp:reload", {
      reason: transition.preflight.fallbackApplied ? "mode-change-preflight-fallback" : "mode-change",
      mode: transition.appliedMode,
      requestedMode,
      ts: Date.now(),
    });

    res.json({
      success: true,
      mode: transition.appliedMode,
      requestedMode,
      fallbackApplied: transition.preflight.fallbackApplied,
      preflight: {
        required: transition.preflight.required,
        plannerMode: transition.preflight.plannerMode,
        ok: transition.preflight.plannerResult.ok,
        firstFail: transition.sectorControlLiveEvent.firstFail,
        constraints: transition.sectorControlLiveEvent.constraints ?? null,
        observerGrid: transition.sectorControlLiveEvent.observerGrid ?? null,
        fallbackMode: transition.preflight.fallbackMode,
      },
      state: newState,
      config: MODE_CONFIGS[transition.appliedMode as keyof typeof MODE_CONFIGS],
    });
  } catch (error) {
    res.status(400).json({ error: "Failed to switch mode", details: error instanceof Error ? error.message : "Unknown error" });
  }
}

export function getSectorControlLiveEvent(_req: Request, res: Response) {
  const state = getGlobalPipelineState();
  const authoritative = sectorControlLiveEventSchema.safeParse(state.latestSectorControlLiveEvent);
  res.json({
    event: authoritative.success ? authoritative.data : null,
    meta: {
      source: "server",
      hasEvent: authoritative.success,
      now: Date.now(),
    },
  });
}

// Get HELIX metrics (alias for compatibility)
export function getHelixMetrics(req: Request, res: Response) {
  return getSystemMetrics(req, res);
}

// --- Field geometry helpers --------------------------------------------------

const PREVIEW_STALE_MS = 24 * 60 * 60 * 1000; // 24h
const FIELD_GEOMETRY_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const FIELD_GEOMETRY_CACHE_MAX = 12;

type BasisResolved = HullBasisResolved;

type GeometryResolution = {
  hull: { Lx_m: number; Ly_m: number; Lz_m: number };
  sampleHull: { Lx_m: number; Ly_m: number; Lz_m: number };
  basis: BasisResolved;
  source: "preview" | "pipeline";
  meshHash?: string;
  clampReasons: string[];
  previewUpdatedAt?: number;
  stale: boolean;
};

type FieldGeometryCacheEntry = {
  createdAt: number;
  key: string;
  buffer: FieldSampleBuffer;
  meta: {
    geometrySource: GeometryResolution["source"];
    basisApplied: BasisResolved;
    hullDims: GeometryResolution["hull"];
    sampleHull: GeometryResolution["sampleHull"];
    meshHash?: string;
    clampReasons: string[];
    previewUpdatedAt?: number;
  };
};

const fieldGeometryCache = new Map<string, FieldGeometryCacheEntry>();

const clampHullDim = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const v = Math.abs(n);
  return Math.max(HULL_DIM_MIN_M, Math.min(HULL_DIM_MAX_M, v));
};

const clampHullDimsFrom = (raw: any): GeometryResolution["hull"] | null => {
  if (!raw || typeof raw !== "object") return null;
  const dims = {
    Lx_m: clampHullDim((raw as any).Lx_m ?? (raw as any).x ?? ((raw as any).a ? (raw as any).a * 2 : undefined)),
    Ly_m: clampHullDim((raw as any).Ly_m ?? (raw as any).y ?? ((raw as any).b ? (raw as any).b * 2 : undefined)),
    Lz_m: clampHullDim((raw as any).Lz_m ?? (raw as any).z ?? ((raw as any).c ? (raw as any).c * 2 : undefined)),
  };
  if (dims.Lx_m && dims.Ly_m && dims.Lz_m) return dims as GeometryResolution["hull"];
  return null;
};

const hullDimsFromObb = (obb: any): GeometryResolution["hull"] | null => {
  const half = obb?.halfSize;
  if (!Array.isArray(half) || half.length < 3) return null;
  return clampHullDimsFrom({
    Lx_m: (half[0] ?? 0) * 2,
    Ly_m: (half[1] ?? 0) * 2,
    Lz_m: (half[2] ?? 0) * 2,
  });
};

const divideHullByScale = (
  hull: GeometryResolution["hull"],
  scale: BasisResolved["scale"],
): GeometryResolution["hull"] => {
  const safeScale = (value: number | undefined) => {
    const n = Number(value);
    return Number.isFinite(n) && Math.abs(n) > 1e-9 ? Math.abs(n) : 1;
  };
  return {
    Lx_m: clampHullDim(hull.Lx_m / safeScale(scale[0])) ?? hull.Lx_m,
    Ly_m: clampHullDim(hull.Ly_m / safeScale(scale[1])) ?? hull.Ly_m,
    Lz_m: clampHullDim(hull.Lz_m / safeScale(scale[2])) ?? hull.Lz_m,
  };
};

const coercePreviewPayload = (raw: any): HullPreviewPayload | null => {
  if (!raw || typeof raw !== "object") return null;
  const parsed = hullPreviewPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data as HullPreviewPayload;
};

const resolveGeometryForSampling = (
  previewRaw: any,
  pipelineHull: any,
): GeometryResolution => {
  const preview = coercePreviewPayload(previewRaw);
  const previewUpdatedAt =
    preview && Number.isFinite(preview.updatedAt) ? Number(preview.updatedAt) : undefined;
  const previewStale = previewUpdatedAt != null
    ? Date.now() - previewUpdatedAt > PREVIEW_STALE_MS
    : false;

  const basis = resolveHullBasis(preview?.mesh?.basis ?? (preview?.basis as BasisTransform | null), preview?.scale);

  const clampReasons: string[] = [];
  if (Array.isArray(preview?.clampReasons)) clampReasons.push(...preview.clampReasons);
  if (Array.isArray(preview?.mesh?.clampReasons)) clampReasons.push(...preview.mesh.clampReasons);

  const previewDimsRaw =
    clampHullDimsFrom(preview?.targetDims) ??
    hullDimsFromObb(preview?.mesh?.obb) ??
    hullDimsFromObb(preview?.obb) ??
    clampHullDimsFrom(preview?.hullMetrics?.dims_m);
  const previewDims = previewDimsRaw ? applyHullBasisToDims(previewDimsRaw, basis) : null;

  const previewIssues: string[] = [];
  if (!preview) previewIssues.push("preview-missing");
  if (preview && !previewDims) previewIssues.push("preview-missing-dims");
  if (previewStale && previewDims) previewIssues.push("preview-stale");
  if (preview && clampReasons.length) previewIssues.push("preview-clamped");

  const usePreview = !!previewDims && previewIssues.length === 0;
  const pipelineDims = clampHullDimsFrom(pipelineHull);
  const hull = usePreview
    ? (previewDims as GeometryResolution["hull"])
    : (pipelineDims ?? (previewDims ?? { Lx_m: 100, Ly_m: 100, Lz_m: 100 }));

  const basisApplied = usePreview ? basis : HULL_BASIS_IDENTITY;
  const sampleHull = divideHullByScale(hull, basisApplied.scale);

  return {
    hull,
    sampleHull,
    basis: basisApplied,
    source: usePreview ? "preview" : "pipeline",
    meshHash: preview?.meshHash ?? preview?.mesh?.meshHash,
    clampReasons: usePreview ? clampReasons : [...clampReasons, ...previewIssues],
    previewUpdatedAt,
    stale: previewStale,
  };
};

const detachFieldBuffer = (buffer: FieldSampleBuffer): FieldSampleBuffer => ({
  length: buffer.length,
  x: Float32Array.from(buffer.x),
  y: Float32Array.from(buffer.y),
  z: Float32Array.from(buffer.z),
  nx: Float32Array.from(buffer.nx),
  ny: Float32Array.from(buffer.ny),
  nz: Float32Array.from(buffer.nz),
  rho: Float32Array.from(buffer.rho),
  bell: Float32Array.from(buffer.bell),
  sgn: Float32Array.from(buffer.sgn),
  disp: Float32Array.from(buffer.disp),
  dA: Float32Array.from(buffer.dA),
});

const transformBufferWithBasis = (
  buffer: FieldSampleBuffer,
  basis: BasisResolved,
): FieldSampleBuffer => {
  if (isIdentityHullBasis(basis)) return buffer;
  const { swap, flip, scale } = basis;
  const len = buffer.length;
  const x = new Float32Array(len);
  const y = new Float32Array(len);
  const z = new Float32Array(len);
  const nx = new Float32Array(len);
  const ny = new Float32Array(len);
  const nz = new Float32Array(len);

  const pick = (axis: AxisLabel, v: { x: number; y: number; z: number }) =>
    axis === "x" ? v.x : axis === "y" ? v.y : v.z;

  for (let i = 0; i < len; i++) {
    const srcPos = { x: buffer.x[i], y: buffer.y[i], z: buffer.z[i] };
    const srcN = { x: buffer.nx[i], y: buffer.ny[i], z: buffer.nz[i] };

    const px = pick(swap.x, srcPos) * (flip.x ? -1 : 1) * scale[0];
    const py = pick(swap.y, srcPos) * (flip.y ? -1 : 1) * scale[1];
    const pz = pick(swap.z, srcPos) * (flip.z ? -1 : 1) * scale[2];

    const nxRaw = pick(swap.x, srcN) * (flip.x ? -1 : 1);
    const nyRaw = pick(swap.y, srcN) * (flip.y ? -1 : 1);
    const nzRaw = pick(swap.z, srcN) * (flip.z ? -1 : 1);
    const nMag = Math.hypot(nxRaw, nyRaw, nzRaw);
    const invN = nMag > 1e-9 ? 1 / nMag : 1;

    x[i] = px;
    y[i] = py;
    z[i] = pz;
    nx[i] = nxRaw * invN;
    ny[i] = nyRaw * invN;
    nz[i] = nzRaw * invN;
  }

  return { ...buffer, x, y, z, nx, ny, nz };
};

const readGeometryCache = (key: string): FieldGeometryCacheEntry | null => {
  const cached = fieldGeometryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > FIELD_GEOMETRY_CACHE_TTL_MS) {
    fieldGeometryCache.delete(key);
    return null;
  }
  return cached;
};

const writeGeometryCache = (entry: FieldGeometryCacheEntry) => {
  if (fieldGeometryCache.size >= FIELD_GEOMETRY_CACHE_MAX) {
    const oldest = fieldGeometryCache.keys().next().value;
    if (oldest) fieldGeometryCache.delete(oldest);
  }
  fieldGeometryCache.set(entry.key, entry);
};

const makeGeometryCacheKey = (input: {
  resolved: GeometryResolution;
  geometryKind: string;
  params: Record<string, any>;
}) => {
  const keyPayload = {
    source: input.resolved.source,
    meshHash: input.resolved.meshHash ?? null,
    hull: input.resolved.hull,
    sampleHull: input.resolved.sampleHull,
    basis: input.resolved.basis,
    geometryKind: input.geometryKind,
    params: input.params,
    previewUpdatedAt: input.resolved.previewUpdatedAt ?? null,
  };
  return JSON.stringify(keyPayload);
};

// --- Field probe (mesh-aware) -------------------------------------------------

type FieldProbePatch = {
  sector: number;
  gateAvg: number;
  gateMin: number;
  gateMax: number;
  count: number;
};

type FieldProbeCacheEntry = {
  createdAt: number;
  key: string;
  values: Float32Array;
  patches: FieldProbePatch[];
  stats: { min: number; max: number; mean: number; absMax: number; absMean: number };
  meta: {
    geometrySource: GeometryResolution["source"];
    basisApplied: BasisResolved;
    hullDims: GeometryResolution["hull"];
    sampleHull: GeometryResolution["sampleHull"];
    meshHash?: string;
    clampReasons: string[];
    previewUpdatedAt?: number;
    stateSig: string;
    cacheKey: string;
  };
  thresholds: { field: number; gradient: number };
};

const FIELD_PROBE_CACHE_TTL_MS = 1500;
const FIELD_PROBE_CACHE_MAX = 8;
const FIELD_PROBE_VERTEX_CAP = 120_000;

const fieldProbeCache = new Map<string, FieldProbeCacheEntry>();

const fieldProbeStateSignature = (state: EnergyPipelineState) => {
  const hull = state.hull ?? { Lx_m: 0, Ly_m: 0, Lz_m: 0 };
  const parts: Array<number | string | null> = [
    state.gammaGeo ?? null,
    state.qSpoilingFactor ?? null,
    state.sag_nm ?? null,
    state.sectorCount ?? null,
    state.concurrentSectors ?? null,
    hull.Lx_m,
    hull.Ly_m,
    hull.Lz_m,
    state.warpFieldType ?? "natario",
  ];
  return parts.map((p) => (Number.isFinite(p as number) ? Math.round((p as number) * 1e6) / 1e6 : String(p ?? "n"))).join("|");
};

const fieldProbePositionsSignature = (positions: Float32Array) => {
  const verts = Math.floor(positions.length / 3);
  if (verts === 0) return "0";
  const step = Math.max(1, Math.floor(verts / 24));
  let acc = 0;
  for (let i = 0; i < positions.length; i += step * 3) {
    const x = Math.round((positions[i] ?? 0) * 1000);
    const y = Math.round((positions[i + 1] ?? 0) * 1000);
    const z = Math.round((positions[i + 2] ?? 0) * 1000);
    acc = (acc * 31 + x * 17 + y * 13 + z * 7) | 0;
  }
  return `${verts}:${acc >>> 0}`;
};

const readFieldProbeCache = (key: string): FieldProbeCacheEntry | null => {
  const cached = fieldProbeCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > FIELD_PROBE_CACHE_TTL_MS) {
    fieldProbeCache.delete(key);
    return null;
  }
  return cached;
};

const writeFieldProbeCache = (entry: FieldProbeCacheEntry) => {
  if (fieldProbeCache.size >= FIELD_PROBE_CACHE_MAX) {
    const oldest = fieldProbeCache.keys().next().value;
    if (oldest) fieldProbeCache.delete(oldest);
  }
  fieldProbeCache.set(entry.key, entry);
};

const aggregateProbePatches = (
  values: Float32Array,
  positions: Float32Array,
  sectors: number,
  fieldThreshold: number,
  gradientThreshold: number,
): FieldProbePatch[] => {
  const total = Math.max(1, Math.floor(sectors));
  const buckets = Array.from({ length: total }, () => ({
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    sum: 0,
    count: 0,
  }));

  for (let i = 0; i < values.length; i++) {
    const base = i * 3;
    const x = positions[base] ?? 0;
    const z = positions[base + 2] ?? 0;
    const theta = Math.atan2(z, x);
    const idx = Math.min(total - 1, Math.max(0, Math.floor(((theta / (2 * Math.PI)) + 1) % 1 * total)));
    const v = values[i] ?? 0;
    const b = buckets[idx];
    if (v < b.min) b.min = v;
    if (v > b.max) b.max = v;
    b.sum += v;
    b.count += 1;
  }

  const patches: FieldProbePatch[] = [];
  for (let s = 0; s < buckets.length; s++) {
    const b = buckets[s];
    if (!b.count) continue;
    const avg = b.sum / b.count;
    const span = b.max - b.min;
    const peak = Math.max(Math.abs(b.min), Math.abs(b.max));
    if (peak < fieldThreshold && span < gradientThreshold) continue;
    patches.push({
      sector: s,
      gateAvg: avg,
      gateMin: b.min,
      gateMax: b.max,
      count: b.count,
    });
  }

  patches.sort((a, b) => Math.abs(b.gateMax) - Math.abs(a.gateMax));
  return patches;
};

export function probeFieldOnHull(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    setCors(res);
    return res.status(200).end();
  }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const state = getGlobalPipelineState();
    const body = req.body ?? {};
    const schema = z.object({
      preview: hullPreviewPayloadSchema.optional(),
      overlay: z.object({
        positions: z.array(z.number()).min(3),
        normals: z.array(z.number()).optional(),
        meshHash: z.string().optional(),
        lod: z.enum(["preview", "high"]).optional(),
        aligned: z.boolean().optional(),
      }),
      params: z
        .object({
          totalSectors: z.number().int().positive().optional(),
          liveSectors: z.number().int().positive().optional(),
          fieldThreshold: z.number().positive().optional(),
          gradientThreshold: z.number().positive().optional(),
        })
        .optional(),
    });

    const parsed = schema.parse(body);
    const previewRaw = parsed.preview ?? (body as any)?.previewPayload ?? (body as any)?.hullPreview ?? null;
    const resolved = resolveGeometryForSampling(previewRaw, state.hull);

    const positionsInput = parsed.overlay.positions;
    const normalsInput = parsed.overlay.normals;
    const positionsArr = new Float32Array(positionsInput);
    const normalsArr = normalsInput ? new Float32Array(normalsInput) : null;

    const vertCount = Math.floor(positionsArr.length / 3);
    if (vertCount <= 0) {
      return res.status(400).json({ error: "probe-empty" });
    }
    if (vertCount > FIELD_PROBE_VERTEX_CAP) {
      return res.status(413).json({ error: "probe-over-budget", clampReasons: ["probe:overBudget"] });
    }

    const sectorsResolved = Math.max(1, Math.floor(parsed.params?.totalSectors ?? state.sectorCount ?? 16));
    const splitResolved = Math.floor(sectorsResolved / 2);
    const fieldThreshold = parsed.params?.fieldThreshold ?? 0.4;
    const gradientThreshold = parsed.params?.gradientThreshold ?? 0.22;

    const stateSig = fieldProbeStateSignature(state);
    const posSig = fieldProbePositionsSignature(positionsArr);
    const cacheKey = [
      "probe",
      posSig,
      resolved.source,
      resolved.meshHash ?? parsed.overlay.meshHash ?? "none",
      resolved.previewUpdatedAt ?? "none",
      sectorsResolved,
      fieldThreshold,
      gradientThreshold,
      stateSig,
    ].join("|");

    const cached = readFieldProbeCache(cacheKey);
    if (cached) {
      res.setHeader("X-Geometry-Source", cached.meta.geometrySource);
      res.setHeader("X-Geometry-Basis", JSON.stringify(cached.meta.basisApplied));
      if (cached.meta.meshHash) res.setHeader("X-Mesh-Hash", cached.meta.meshHash);
      if (cached.meta.previewUpdatedAt) res.setHeader("X-Preview-Updated-At", String(cached.meta.previewUpdatedAt));
      return res.json({
        count: cached.values.length,
        geometrySource: cached.meta.geometrySource,
        basisApplied: cached.meta.basisApplied,
        meshHash: cached.meta.meshHash,
        hullDims: cached.meta.hullDims,
        sampleHull: cached.meta.sampleHull,
        clampReasons: cached.meta.clampReasons,
        previewUpdatedAt: cached.meta.previewUpdatedAt ?? null,
        cache: { hit: true, key: cached.meta.cacheKey, ageMs: Date.now() - cached.createdAt },
        stats: cached.stats,
        patches: cached.patches,
        fieldThreshold: cached.thresholds.field,
        gradientThreshold: cached.thresholds.gradient,
        values: Array.from(cached.values),
      });
    }

    // Build samples directly from provided vertices; assume positions are already basis-aligned.
    const samples: { p: [number, number, number]; n: [number, number, number] }[] = new Array(vertCount);
    for (let i = 0; i < vertCount; i++) {
      const base = i * 3;
      const p: [number, number, number] = [
        positionsArr[base] ?? 0,
        positionsArr[base + 1] ?? 0,
        positionsArr[base + 2] ?? 0,
      ];
      let n: [number, number, number];
      if (normalsArr && normalsArr.length >= positionsArr.length) {
        n = [
          normalsArr[base] ?? 0,
          normalsArr[base + 1] ?? 0,
          normalsArr[base + 2] ?? 0,
        ];
      } else {
        const mag = Math.hypot(p[0], p[1], p[2]);
        const inv = mag > 1e-9 ? 1 / mag : 1;
        n = [p[0] * inv, p[1] * inv, p[2] * inv];
      }
      samples[i] = { p, n };
    }

    const bufferDetached = detachFieldBuffer(
      sampleDisplacementFieldGeometry(
        { ...state, hull: resolved.sampleHull ?? resolved.hull },
        {
          geometryKind: "sdf",
          sdf: { samples },
          sectors: sectorsResolved,
          split: splitResolved,
        },
      ),
    );

    const values = bufferDetached.disp;
    const count = bufferDetached.length;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let sum = 0;
    let absMean = 0;
    for (let i = 0; i < count; i++) {
      const v = values[i] ?? 0;
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      absMean += Math.abs(v);
    }
    const mean = count > 0 ? sum / count : 0;
    absMean = count > 0 ? absMean / count : 0;
    const absMax = Math.max(Math.abs(min), Math.abs(max));

    const patches = aggregateProbePatches(values, positionsArr, sectorsResolved, fieldThreshold, gradientThreshold);

    const response = {
      count,
      geometrySource: resolved.source,
      basisApplied: resolved.basis,
      meshHash: parsed.overlay.meshHash ?? resolved.meshHash,
      hullDims: resolved.hull,
      sampleHull: resolved.sampleHull,
      clampReasons: resolved.clampReasons,
      previewUpdatedAt: resolved.previewUpdatedAt ?? null,
      cache: { hit: false, key: cacheKey, ageMs: 0 },
      stats: { min, max, mean, absMax, absMean },
      patches,
      fieldThreshold,
      gradientThreshold,
      values: Array.from(values),
    };

    writeFieldProbeCache({
      createdAt: Date.now(),
      key: cacheKey,
      values: Float32Array.from(values),
      patches,
      stats: { min, max, mean, absMax, absMean },
      meta: {
        geometrySource: resolved.source,
        basisApplied: resolved.basis,
        hullDims: resolved.hull,
        sampleHull: resolved.sampleHull,
        meshHash: parsed.overlay.meshHash ?? resolved.meshHash,
        clampReasons: resolved.clampReasons,
        previewUpdatedAt: resolved.previewUpdatedAt,
        stateSig,
        cacheKey,
      },
      thresholds: { field: fieldThreshold, gradient: gradientThreshold },
    });

    res.setHeader("X-Geometry-Source", resolved.source);
    if (resolved.meshHash) res.setHeader("X-Mesh-Hash", String(resolved.meshHash));
    if (resolved.previewUpdatedAt) res.setHeader("X-Preview-Updated-At", String(resolved.previewUpdatedAt));
    res.setHeader("X-Geometry-Basis", JSON.stringify(resolved.basis));
    res.json(response);
  } catch (e) {
    console.error("field probe endpoint error:", e);
    res.status(400).json({ error: "field-probe-failed" });
  }
}

// --- Lattice probe (time-dilation) -----------------------------------------
type MathStageLabel = MathStage | "unstaged";
type ProbeSourcedNumber = { value: number; source: string; proxy: boolean };
type ProbeGuardrailState = "ok" | "fail" | "proxy";
type ProbeGuardrails = {
  fordRoman: ProbeGuardrailState;
  thetaAudit: ProbeGuardrailState;
  tsRatio: ProbeGuardrailState;
  vdbBand: ProbeGuardrailState;
  multiplier: number;
  proxy: boolean;
  hardPass: boolean;
};

const LATTICE_PROBE_GRID_DIV = 12;
const LATTICE_PROBE_GRID_SCALE = 1.2;
const LATTICE_PROBE_MAX_VERTS = 200_000;
const LATTICE_PROBE_ALPHA_MIN = 0.3;
const LATTICE_PROBE_DEFAULT_VISUALS = {
  phiScale: 0.45,
  warpStrength: 0.12,
  breathAmp: 0.08,
  softening: 0.35,
} as const;
const LATTICE_PROBE_KAPPA_TUNING = {
  logMin: -60,
  logMax: -20,
  phiMin: 0.25,
  phiMax: 0.85,
  warpMin: 0.08,
  warpMax: 0.22,
  breathMin: 0.05,
  breathMax: 0.14,
  softenMin: 0.22,
  softenMax: 0.5,
  smooth: 0.08,
} as const;
const LATTICE_PROBE_BETA_NEAR_REST_MAX = 0.25;
const LATTICE_PROBE_TS_RATIO_MIN = 1.5;
const LATTICE_PROBE_THETA_MAX = 1e12;
const LATTICE_PROBE_NATARIO_GEOM_WARP_SCALE = 0.05;
const LATTICE_PROBE_METRIC_BLEND = 0.45;
const LATTICE_PROBE_SHEAR_STRENGTH = 0.35;
const LATTICE_PROBE_THETA_WARP_SCALE = 0.7;
const LATTICE_PROBE_HULL_WARP_SCALE = 0.55;
const LATTICE_PROBE_HULL_CONTOUR_SCALE = 1.2;
const LATTICE_PROBE_HULL_CONTOUR_MIN = 0.05;
const LATTICE_PROBE_DEFAULT_BUBBLE_SIGMA = 6;
const LATTICE_PROBE_BREATH_RATE = 0.8;

const LATTICE_PROBE_STAGE_RANK: Record<MathStageLabel, number> = {
  unstaged: -1,
  exploratory: 0,
  "reduced-order": 1,
  diagnostic: 2,
  certified: 3,
};

const latticeProbeStageIndex = new Map<string, MathStageLabel>(
  mathStageRegistry.map((entry) => [entry.module, entry.stage]),
);
const resolveLatticeProbeStage = (module: string): MathStageLabel =>
  latticeProbeStageIndex.get(module) ?? "unstaged";
const meetsLatticeProbeStage = (
  stage: MathStageLabel,
  minStage: MathStageLabel,
) => LATTICE_PROBE_STAGE_RANK[stage] >= LATTICE_PROBE_STAGE_RANK[minStage];

const probeFirstFinite = (...values: Array<unknown>): number | undefined => {
  for (const value of values) {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
};

const probePickSourcedNumber = (
  candidates: Array<{ value: unknown; source: string; proxy?: boolean }>,
): ProbeSourcedNumber | null => {
  for (const candidate of candidates) {
    const num = Number(candidate.value);
    if (!Number.isFinite(num)) continue;
    return {
      value: num,
      source: candidate.source,
      proxy: Boolean(candidate.proxy),
    };
  }
  return null;
};

const probeResolveBooleanStatus = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const norm = value.toLowerCase();
    if (["ok", "pass", "passed", "true", "admissible"].includes(norm)) return true;
    if (["fail", "failed", "false", "inadmissible"].includes(norm)) return false;
  }
  return null;
};

const probeStrictCongruenceEnabled = (pipeline?: EnergyPipelineState | null): boolean =>
  (pipeline as any)?.strictCongruence !== false;

const probeQiSourceIsMetric = (source: unknown): boolean => {
  if (typeof source !== "string") return false;
  const normalized = source.toLowerCase();
  return (
    normalized.startsWith("warp.metric") ||
    normalized.startsWith("gr.metric") ||
    normalized.startsWith("gr.rho_constraint")
  );
};

const probeNormalizeLog = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = Math.log10(value);
  if (!Number.isFinite(logValue) || logMax <= logMin) return 0;
  return clamp01((logValue - logMin) / (logMax - logMin));
};

const probeAverageFinite = (...values: Array<number | null | undefined>) => {
  let sum = 0;
  let count = 0;
  for (const value of values) {
    if (!Number.isFinite(value as number)) continue;
    sum += value as number;
    count += 1;
  }
  return count > 0 ? sum / count : 0;
};

const probeGetPowerW = (pipeline?: EnergyPipelineState | null): number => {
  const watts = probeFirstFinite(
    pipeline?.P_avg_W,
    (pipeline as any)?.power_W,
  );
  if (Number.isFinite(watts)) return watts as number;
  const megaWatts = probeFirstFinite((pipeline as any)?.P_avg_MW);
  if (Number.isFinite(megaWatts)) return (megaWatts as number) * 1e6;
  const raw = probeFirstFinite(pipeline?.P_avg, (pipeline as any)?.power);
  if (typeof raw !== "number" || !Number.isFinite(raw)) return Number.NaN;
  if (raw === 0) return 0;
  if (raw > 0 && raw < 1e4) return raw * 1e6;
  return raw;
};

const probeResolvePowerW = (
  pipeline?: EnergyPipelineState | null,
): ProbeSourcedNumber => {
  const watts = probePickSourcedNumber([
    { value: pipeline?.P_avg_W, source: "P_avg_W" },
    { value: (pipeline as any)?.power_W, source: "power_W" },
  ]);
  if (watts) return watts;
  const megaWatts = probePickSourcedNumber([
    { value: (pipeline as any)?.P_avg_MW, source: "P_avg_MW" },
  ]);
  if (megaWatts) return { ...megaWatts, value: megaWatts.value * 1e6 };
  const raw = probePickSourcedNumber([
    { value: pipeline?.P_avg, source: "P_avg", proxy: true },
    { value: (pipeline as any)?.power, source: "power", proxy: true },
  ]);
  if (!raw) return { value: Number.NaN, source: "missing", proxy: true };
  if (raw.value === 0) return raw;
  if (raw.value > 0 && raw.value < 1e4) {
    return { value: raw.value * 1e6, source: `${raw.source}_MW?`, proxy: true };
  }
  return raw;
};

const probeGetHullAreaM2 = (pipeline?: EnergyPipelineState | null): number => {
  const tiles = (pipeline as any)?.tiles;
  const area = probeFirstFinite(
    pipeline?.hullArea_m2,
    tiles?.hullArea_m2,
    pipeline?.hullAreaOverride_m2,
    (pipeline as any)?.__hullAreaEllipsoid_m2,
  );
  if (Number.isFinite(area) && (area as number) > 0) return area as number;
  const tileAreaCm2 = probeFirstFinite(
    pipeline?.tileArea_cm2,
    tiles?.tileArea_cm2,
  );
  const nTiles = probeFirstFinite(
    pipeline?.N_tiles,
    tiles?.N_tiles,
    tiles?.total,
  );
  if (
    Number.isFinite(tileAreaCm2) &&
    Number.isFinite(nTiles) &&
    (tileAreaCm2 as number) > 0 &&
    (nTiles as number) > 0
  ) {
    return (tileAreaCm2 as number) * 1e-4 * (nTiles as number);
  }
  return Number.NaN;
};

const probeGetDutyEffective = (pipeline?: EnergyPipelineState | null): number =>
  clamp01(
    probeFirstFinite(
      pipeline?.dutyEffectiveFR,
      pipeline?.dutyEffective_FR,
      pipeline?.dutyShip,
      pipeline?.dutyEff,
      pipeline?.dutyCycle,
      (pipeline as any)?.dutyFR,
      (pipeline as any)?.dutyGate,
    ) ?? 0,
  );

const probeResolveDutyEffective = (
  pipeline?: EnergyPipelineState | null,
): ProbeSourcedNumber => {
  const direct = probePickSourcedNumber([
    { value: (pipeline as any)?.d_eff, source: "d_eff" },
    { value: pipeline?.dutyEffectiveFR, source: "dutyEffectiveFR" },
    { value: pipeline?.dutyEffective_FR, source: "dutyEffective_FR" },
    { value: pipeline?.dutyShip, source: "dutyShip", proxy: true },
    { value: pipeline?.dutyEff, source: "dutyEff", proxy: true },
    { value: pipeline?.dutyCycle, source: "dutyCycle", proxy: true },
    { value: (pipeline as any)?.dutyFR, source: "dutyFR", proxy: true },
    { value: (pipeline as any)?.dutyGate, source: "dutyGate", proxy: true },
  ]);
  if (direct) return { ...direct, value: clamp01(direct.value) };
  return { value: 0, source: "missing", proxy: true };
};

const probeGetGeometryGain = (pipeline?: EnergyPipelineState | null): number => {
  const gammaGeo = probeFirstFinite(
    pipeline?.gammaGeo,
    (pipeline as any)?.ampFactors?.gammaGeo,
    (pipeline as any)?.amps?.gammaGeo,
  );
  return Number.isFinite(gammaGeo) && (gammaGeo as number) > 0
    ? (gammaGeo as number)
    : 1;
};

const probeComputeKappaDrive = (
  pipeline?: EnergyPipelineState | null,
): number => {
  if (!pipeline) return Number.NaN;
  const powerW = probeGetPowerW(pipeline);
  const areaM2 = probeGetHullAreaM2(pipeline);
  if (!Number.isFinite(powerW) || !Number.isFinite(areaM2) || areaM2 <= 0) {
    return Number.NaN;
  }
  const dEff = probeGetDutyEffective(pipeline);
  const gain = probeGetGeometryGain(pipeline);
  return kappa_drive_from_power(powerW, areaM2, dEff, gain);
};

const probeNormalizeKappaTuning = (
  input?: Partial<typeof LATTICE_PROBE_KAPPA_TUNING>,
) => {
  const base = LATTICE_PROBE_KAPPA_TUNING;
  const logMinRaw = toFinite(input?.logMin, base.logMin);
  const logMaxRaw = toFinite(input?.logMax, base.logMax);
  const [logMin, logMax] =
    logMaxRaw > logMinRaw ? [logMinRaw, logMaxRaw] : [base.logMin, base.logMax];
  const phiMinRaw = toFinite(input?.phiMin, base.phiMin);
  const phiMaxRaw = toFinite(input?.phiMax, base.phiMax);
  const [phiMin, phiMax] =
    phiMaxRaw > phiMinRaw ? [phiMinRaw, phiMaxRaw] : [base.phiMin, base.phiMax];
  const warpMinRaw = toFinite(input?.warpMin, base.warpMin);
  const warpMaxRaw = toFinite(input?.warpMax, base.warpMax);
  const [warpMin, warpMax] =
    warpMaxRaw > warpMinRaw
      ? [warpMinRaw, warpMaxRaw]
      : [base.warpMin, base.warpMax];
  const breathMinRaw = toFinite(input?.breathMin, base.breathMin);
  const breathMaxRaw = toFinite(input?.breathMax, base.breathMax);
  const [breathMin, breathMax] =
    breathMaxRaw > breathMinRaw
      ? [breathMinRaw, breathMaxRaw]
      : [base.breathMin, base.breathMax];
  const softenMinRaw = toFinite(input?.softenMin, base.softenMin);
  const softenMaxRaw = toFinite(input?.softenMax, base.softenMax);
  const [softenMin, softenMax] =
    softenMaxRaw > softenMinRaw
      ? [softenMinRaw, softenMaxRaw]
      : [base.softenMin, base.softenMax];
  const smooth = clamp01(toFinite(input?.smooth, base.smooth));
  return {
    logMin,
    logMax,
    phiMin,
    phiMax,
    warpMin,
    warpMax,
    breathMin,
    breathMax,
    softenMin,
    softenMax,
    smooth,
  };
};

const probeMapKappaToUnit = (
  kappa: number,
  tuning: ReturnType<typeof probeNormalizeKappaTuning>,
): number | null => {
  if (!Number.isFinite(kappa) || kappa <= 0) return null;
  const logK = Math.log10(kappa);
  if (!Number.isFinite(logK)) return null;
  const denom = tuning.logMax - tuning.logMin;
  if (!Number.isFinite(denom) || denom <= 0) return null;
  return clamp01((logK - tuning.logMin) / denom);
};

const probeApplyKappaBlend = (
  settings: {
    phiScale: number;
    warpStrength: number;
    breathAmp: number;
    softening: number;
  },
  blend: number,
  tuning: ReturnType<typeof probeNormalizeKappaTuning>,
) => {
  const t = clamp01(blend);
  settings.phiScale = tuning.phiMin + (tuning.phiMax - tuning.phiMin) * t;
  settings.warpStrength = tuning.warpMin + (tuning.warpMax - tuning.warpMin) * t;
  settings.breathAmp = tuning.breathMin + (tuning.breathMax - tuning.breathMin) * t;
  const lengthBlend = 1 - t;
  settings.softening =
    tuning.softenMin + (tuning.softenMax - tuning.softenMin) * lengthBlend;
};

const probeComputeKappaSettings = (pipeline?: EnergyPipelineState | null) => {
  const kappaDrive = probeComputeKappaDrive(pipeline ?? null);
  const tuning = probeNormalizeKappaTuning();
  const kappaBlend = probeMapKappaToUnit(kappaDrive, tuning);
  const settings = { ...LATTICE_PROBE_DEFAULT_VISUALS };
  if (kappaBlend !== null) {
    probeApplyKappaBlend(settings, kappaBlend, tuning);
  }
  return { settings, kappaBlend, kappaDrive };
};

const probeResolveGammaGeo = (
  pipeline?: EnergyPipelineState | null,
): ProbeSourcedNumber => {
  const direct = probePickSourcedNumber([
    { value: pipeline?.gammaGeo, source: "gammaGeo" },
    {
      value: (pipeline as any)?.ampFactors?.gammaGeo,
      source: "ampFactors.gammaGeo",
      proxy: true,
    },
    { value: (pipeline as any)?.amps?.gammaGeo, source: "amps.gammaGeo", proxy: true },
  ]);
  if (direct) return { ...direct, value: Math.max(1e-6, direct.value) };
  return { value: 1, source: "fallback", proxy: true };
};

const probeResolveGammaVdB = (
  pipeline?: EnergyPipelineState | null,
): ProbeSourcedNumber => {
  const direct = probePickSourcedNumber([
    {
      value: (pipeline as any)?.gammaVanDenBroeck_mass,
      source: "gammaVanDenBroeck_mass",
    },
    { value: pipeline?.gammaVanDenBroeck, source: "gammaVanDenBroeck" },
    {
      value: (pipeline as any)?.gammaVanDenBroeck_vis,
      source: "gammaVanDenBroeck_vis",
      proxy: true,
    },
    { value: (pipeline as any)?.gammaVdB, source: "gammaVdB", proxy: true },
    { value: (pipeline as any)?.gammaVdB_vis, source: "gammaVdB_vis", proxy: true },
    { value: (pipeline as any)?.gamma_vdb, source: "gamma_vdb", proxy: true },
  ]);
  if (direct) return { ...direct, value: Math.max(1, direct.value) };
  return { value: 1, source: "fallback", proxy: true };
};

const probeResolveQSpoiling = (
  pipeline?: EnergyPipelineState | null,
): ProbeSourcedNumber => {
  const direct = probePickSourcedNumber([
    { value: pipeline?.qSpoilingFactor, source: "qSpoilingFactor" },
    { value: (pipeline as any)?.deltaAOverA, source: "deltaAOverA", proxy: true },
    { value: (pipeline as any)?.qSpoil, source: "qSpoil", proxy: true },
    { value: (pipeline as any)?.q, source: "q", proxy: true },
  ]);
  if (direct) return { ...direct, value: Math.max(0, direct.value) };
  return { value: 1, source: "fallback", proxy: true };
};

const probeResolveTSRatio = (
  pipeline?: EnergyPipelineState | null,
): ProbeSourcedNumber => {
  const direct = probePickSourcedNumber([
    { value: pipeline?.TS_ratio, source: "TS_ratio" },
    { value: pipeline?.TS_long, source: "TS_long", proxy: true },
    { value: pipeline?.TS_geom, source: "TS_geom", proxy: true },
    { value: (pipeline as any)?.ts?.ratio, source: "ts.ratio", proxy: true },
    { value: (pipeline as any)?.timeScaleRatio, source: "timeScaleRatio", proxy: true },
  ]);
  if (direct) return { ...direct, value: Math.max(0, direct.value) };
  return { value: Number.NaN, source: "missing", proxy: true };
};

const probeResolveThetaCal = (
  pipeline: EnergyPipelineState | null,
  inputs: {
    gammaGeo: ProbeSourcedNumber;
    qSpoil: ProbeSourcedNumber;
    gammaVdB: ProbeSourcedNumber;
    duty: ProbeSourcedNumber;
  },
): ProbeSourcedNumber => {
  const direct = probePickSourcedNumber([
    { value: (pipeline as any)?.thetaCal, source: "thetaCal" },
    { value: (pipeline as any)?.thetaScaleExpected, source: "thetaScaleExpected" },
    {
      value: (pipeline as any)?.uniformsExplain?.thetaAudit?.results?.thetaCal,
      source: "thetaAudit.thetaCal",
    },
  ]);
  if (direct) return direct;
  const gammaGeoCubed = Math.pow(Math.max(0, inputs.gammaGeo.value), 3);
  const value =
    gammaGeoCubed *
    inputs.qSpoil.value *
    inputs.gammaVdB.value *
    inputs.duty.value;
  const proxy =
    inputs.gammaGeo.proxy ||
    inputs.qSpoil.proxy ||
    inputs.gammaVdB.proxy ||
    inputs.duty.proxy;
  return {
    value: Number.isFinite(value) ? value : Number.NaN,
    source: "computed",
    proxy,
  };
};

const probeResolveGuardrails = (
  pipeline: EnergyPipelineState | null,
  tsRatio: number,
  gammaVdB: number,
): ProbeGuardrails => {
  const strictCongruence = probeStrictCongruenceEnabled(pipeline);
  const qiGuard = (pipeline as any)?.qiGuardrail;
  const qiHasMargin = Number.isFinite(qiGuard?.marginRatio);
  const qiBasePass = qiHasMargin
    ? Number(qiGuard.marginRatio) < 1 &&
      (qiGuard.curvatureEnforced !== true || qiGuard.curvatureOk !== false)
    : null;
  const qiMetricSource = probeQiSourceIsMetric(qiGuard?.rhoSource);
  const fordRomanFlag = pipeline?.fordRomanCompliance;
  let fordRoman: ProbeGuardrailState;
  if (qiBasePass != null) {
    if (strictCongruence) {
      fordRoman = qiBasePass && qiMetricSource ? "ok" : "fail";
    } else {
      fordRoman = qiBasePass
        ? qiMetricSource
          ? "ok"
          : "proxy"
        : "fail";
    }
  } else if (typeof fordRomanFlag === "boolean") {
    fordRoman = strictCongruence
      ? "fail"
      : fordRomanFlag
        ? "ok"
        : "fail";
  } else {
    fordRoman = strictCongruence ? "fail" : "proxy";
  }

  const thetaAuditRaw =
    (pipeline as any)?.uniformsExplain?.thetaAudit ??
    (pipeline as any)?.thetaAudit ??
    (pipeline as any)?.thetaCal;
  const thetaAuditFlag = probeResolveBooleanStatus(
    (thetaAuditRaw as any)?.status ??
      (thetaAuditRaw as any)?.ok ??
      (thetaAuditRaw as any)?.pass ??
      (thetaAuditRaw as any)?.admissible,
  );
  const thetaValue = probeFirstFinite(
    (pipeline as any)?.theta_audit,
    (pipeline as any)?.theta_geom,
    (thetaAuditRaw as any)?.value,
  );
  const thetaBandPass = Number.isFinite(thetaValue)
    ? Math.abs(thetaValue as number) <= LATTICE_PROBE_THETA_MAX
    : thetaAuditFlag === true;
  const thetaMetricDerived = (pipeline as any)?.theta_metric_derived === true;
  const thetaAudit: ProbeGuardrailState = strictCongruence
    ? thetaMetricDerived && thetaBandPass
      ? "ok"
      : "fail"
    : thetaBandPass
      ? thetaMetricDerived
        ? "ok"
        : "proxy"
      : "fail";

  const tsMetricDerived = (pipeline as any)?.tsMetricDerived === true;
  const tsBandPass = Number.isFinite(tsRatio) && tsRatio >= LATTICE_PROBE_TS_RATIO_MIN;
  const tsRatioState: ProbeGuardrailState = Number.isFinite(tsRatio)
    ? strictCongruence
      ? tsMetricDerived && tsBandPass
        ? "ok"
        : "fail"
      : tsBandPass
        ? tsMetricDerived
          ? "ok"
          : "proxy"
        : "fail"
    : "proxy";

  const vdbGuard = pipeline?.gammaVanDenBroeckGuard;
  const vdbDerivativeSupport = (pipeline as any)?.vdb_two_wall_derivative_support === true;
  const vdbRequiresDerivativeSupport = Number.isFinite(gammaVdB) && gammaVdB > 1 + 1e-6;
  let vdbBand: ProbeGuardrailState = "proxy";
  if (
    vdbGuard &&
    Number.isFinite(gammaVdB) &&
    Number.isFinite(vdbGuard.greenBand?.min) &&
    Number.isFinite(vdbGuard.greenBand?.max)
  ) {
    const inBand =
      gammaVdB >= vdbGuard.greenBand.min && gammaVdB <= vdbGuard.greenBand.max;
    const guardPass = vdbGuard.admissible ? vdbGuard.admissible && inBand : inBand;
    const derivativeMissing = vdbRequiresDerivativeSupport && !vdbDerivativeSupport;
    if (strictCongruence) {
      vdbBand = guardPass && !derivativeMissing ? "ok" : "fail";
    } else if (guardPass && derivativeMissing) {
      vdbBand = "proxy";
    } else {
      vdbBand = guardPass ? "ok" : "fail";
    }
  } else if (vdbRequiresDerivativeSupport && !vdbDerivativeSupport) {
    vdbBand = strictCongruence ? "fail" : "proxy";
  }

  const hardFail = fordRoman === "fail" || thetaAudit === "fail";
  const tsPenalty =
    tsRatioState === "fail" && Number.isFinite(tsRatio)
      ? clamp01(tsRatio / LATTICE_PROBE_TS_RATIO_MIN)
      : 1;
  const vdbPenalty = vdbBand === "fail" ? 0.7 : 1;
  const multiplier = hardFail ? 0 : tsPenalty * vdbPenalty;
  const proxy = [fordRoman, thetaAudit, tsRatioState, vdbBand].includes("proxy");
  const hardPass = fordRoman === "ok" && thetaAudit === "ok";
  return {
    fordRoman,
    thetaAudit,
    tsRatio: tsRatioState,
    vdbBand,
    multiplier,
    proxy,
    hardPass,
  };
};

const probeComputeActivation = (pipeline: EnergyPipelineState | null) => {
  const power = probeResolvePowerW(pipeline);
  const duty = probeResolveDutyEffective(pipeline);
  const gammaGeo = probeResolveGammaGeo(pipeline);
  const gammaVdB = probeResolveGammaVdB(pipeline);
  const qSpoil = probeResolveQSpoiling(pipeline);
  const tsRatio = probeResolveTSRatio(pipeline);
  const thetaCal = probeResolveThetaCal(pipeline, {
    gammaGeo,
    qSpoil,
    gammaVdB,
    duty,
  });
  const powerNorm = probeNormalizeLog(power.value, 1e6, 1e12);
  const thetaNorm = probeNormalizeLog(thetaCal.value, 1e8, 1e12);
  const tsNorm = probeNormalizeLog(
    tsRatio.value,
    LATTICE_PROBE_TS_RATIO_MIN,
    LATTICE_PROBE_TS_RATIO_MIN * 1e4,
  );
  const activationBase = probeAverageFinite(powerNorm, thetaNorm, tsNorm);
  const guardrails = probeResolveGuardrails(
    pipeline,
    tsRatio.value,
    gammaVdB.value,
  );
  const activation = clamp01(activationBase * guardrails.multiplier);
  const activationProxy =
    power.proxy ||
    duty.proxy ||
    gammaGeo.proxy ||
    gammaVdB.proxy ||
    qSpoil.proxy ||
    tsRatio.proxy ||
    thetaCal.proxy ||
    guardrails.proxy;
  return {
    activation,
    activationBase,
    activationProxy,
    guardrails,
    power,
    duty,
    gammaGeo,
    gammaVdB,
    qSpoil,
    tsRatio,
    thetaCal,
  };
};

const probeResolveBubbleCenter = (
  pipeline?: EnergyPipelineState | null,
): { value: Vec3; source: string; proxy: boolean } => {
  const candidates = [
    { value: (pipeline as any)?.bubble?.center, source: "bubble.center", proxy: false },
    {
      value: (pipeline as any)?.bubble?.centerMetric,
      source: "bubble.centerMetric",
      proxy: true,
    },
    { value: (pipeline as any)?.bubbleCenter, source: "bubbleCenter", proxy: true },
    { value: (pipeline as any)?.center, source: "center", proxy: true },
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate.value) && candidate.value.length >= 3) {
      const cx = Number(candidate.value[0]);
      const cy = Number(candidate.value[1]);
      const cz = Number(candidate.value[2]);
      if ([cx, cy, cz].every((v) => Number.isFinite(v))) {
        return { value: [cx, cy, cz], source: candidate.source, proxy: candidate.proxy };
      }
    }
    if (candidate.value && typeof candidate.value === "object") {
      const cx = Number((candidate.value as any).x);
      const cy = Number((candidate.value as any).y);
      const cz = Number((candidate.value as any).z);
      if ([cx, cy, cz].every((v) => Number.isFinite(v))) {
        return { value: [cx, cy, cz], source: candidate.source, proxy: candidate.proxy };
      }
    }
  }
  return { value: [0, 0, 0], source: "default", proxy: true };
};

const probeResolveBeta = (
  pipeline?: EnergyPipelineState | null,
): ProbeSourcedNumber => {
  const direct = probePickSourcedNumber([
    { value: (pipeline as any)?.bubble?.beta, source: "bubble.beta" },
    { value: (pipeline as any)?.beta, source: "beta" },
    { value: (pipeline as any)?.shipBeta, source: "shipBeta", proxy: true },
    { value: (pipeline as any)?.beta_avg, source: "beta_avg", proxy: true },
    { value: (pipeline as any)?.vShip, source: "vShip", proxy: true },
  ]);
  if (direct) {
    return {
      ...direct,
      value: Math.max(0, Math.min(LATTICE_PROBE_BETA_NEAR_REST_MAX, direct.value)),
    };
  }
  const mode = String(pipeline?.currentMode ?? "").toLowerCase();
  let base = 0.08;
  switch (mode) {
    case "standby":
    case "taxi":
      base = 0.0;
      break;
    case "nearzero":
      base = 0.01;
      break;
    case "hover":
      base = 0.03;
      break;
    case "cruise":
      base = 0.12;
      break;
    case "emergency":
      base = 0.2;
      break;
    default:
      base = 0.08;
      break;
  }
  const betaTrans = clamp01(toFinite((pipeline as any)?.beta_trans, 1));
  return {
    value: Math.max(0, Math.min(LATTICE_PROBE_BETA_NEAR_REST_MAX, base * betaTrans)),
    source: `mode:${mode || "default"}`,
    proxy: true,
  };
};

const probeResolveBubbleParams = (
  pipeline: EnergyPipelineState | null,
  axes: Vec3,
) => {
  const sigmaCandidate = probePickSourcedNumber([
    { value: (pipeline as any)?.bubble?.sigma, source: "bubble.sigma" },
    { value: (pipeline as any)?.sigma, source: "sigma" },
    { value: (pipeline as any)?.warp?.sigma, source: "warp.sigma", proxy: true },
    {
      value: (pipeline as any)?.warp?.bubble?.sigma,
      source: "warp.bubble.sigma",
      proxy: true,
    },
  ]);
  const sigmaSource = sigmaCandidate?.source ?? "default";
  const sigmaProxy = sigmaCandidate?.proxy ?? true;
  const sigma = Math.max(
    1e-4,
    toFinite(sigmaCandidate?.value, LATTICE_PROBE_DEFAULT_BUBBLE_SIGMA),
  );
  const radiusCandidate = probePickSourcedNumber([
    { value: (pipeline as any)?.bubble?.R, source: "bubble.R" },
    { value: (pipeline as any)?.bubble?.radius, source: "bubble.radius", proxy: true },
    { value: (pipeline as any)?.R, source: "R", proxy: true },
    { value: (pipeline as any)?.radius, source: "radius", proxy: true },
  ]);
  let R = Number.isFinite(radiusCandidate?.value)
    ? Math.max(1, radiusCandidate!.value)
    : Number.NaN;
  let radiusSource = radiusCandidate?.source ?? "geom";
  let radiusProxy = radiusCandidate?.proxy ?? true;
  if (!Number.isFinite(R)) {
    const geom = Math.cbrt(
      Math.max(1e-3, axes[0]) * Math.max(1e-3, axes[1]) * Math.max(1e-3, axes[2]),
    );
    R = Math.max(1, geom);
    radiusSource = "geom";
    radiusProxy = true;
  }
  const beta = probeResolveBeta(pipeline);
  const center = probeResolveBubbleCenter(pipeline);
  return {
    R,
    sigma,
    beta: beta.value,
    center: center.value,
    radiusSource,
    sigmaSource,
    betaSource: beta.source,
    centerSource: center.source,
    radiusProxy,
    sigmaProxy,
    betaProxy: beta.proxy,
    centerProxy: center.proxy,
  };
};

type ProbeBrickSample = {
  dims: [number, number, number];
  data: Float32Array;
  bounds: { min: Vec3; max: Vec3; axes: Vec3 };
};

type ProbeHullFieldSample = {
  sample: ProbeBrickSample;
  mode: "dist" | "mask";
  source: string;
  wallThickness: number;
};

const probeBrickIndex = (x: number, y: number, z: number, nx: number, ny: number) =>
  z * nx * ny + y * nx + x;

const probeToVec3 = (value: unknown): Vec3 | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  const x = Number(value[0]);
  const y = Number(value[1]);
  const z = Number(value[2]);
  if (![x, y, z].every((entry) => Number.isFinite(entry))) return null;
  return [x, y, z];
};

const probeNormalizeBrickDims = (dims: unknown): [number, number, number] | null => {
  if (!Array.isArray(dims) || dims.length < 3) return null;
  const nx = Math.floor(Number(dims[0]));
  const ny = Math.floor(Number(dims[1]));
  const nz = Math.floor(Number(dims[2]));
  if (![nx, ny, nz].every((value) => Number.isFinite(value) && value >= 2)) return null;
  return [nx, ny, nz];
};

const probeResolveBrickBounds = (
  brick: any,
  fallback: { min: Vec3; max: Vec3; axes: Vec3 },
): { min: Vec3; max: Vec3; axes: Vec3 } => {
  const bounds = brick?.bounds ?? brick?.meta?.bounds;
  if (bounds) {
    const min = probeToVec3(bounds.min);
    const max = probeToVec3(bounds.max);
    if (min && max) {
      const minFixed: Vec3 = [
        Math.min(min[0], max[0]),
        Math.min(min[1], max[1]),
        Math.min(min[2], max[2]),
      ];
      const maxFixed: Vec3 = [
        Math.max(min[0], max[0]),
        Math.max(min[1], max[1]),
        Math.max(min[2], max[2]),
      ];
      const axes: Vec3 = [
        Math.max(1e-6, (maxFixed[0] - minFixed[0]) / 2),
        Math.max(1e-6, (maxFixed[1] - minFixed[1]) / 2),
        Math.max(1e-6, (maxFixed[2] - minFixed[2]) / 2),
      ];
      return { min: minFixed, max: maxFixed, axes };
    }
    const center = probeToVec3(bounds.center);
    const extent = probeToVec3(bounds.extent ?? bounds.axes);
    if (center && extent) {
      const axes: Vec3 = [
        Math.max(1e-6, Math.abs(extent[0])),
        Math.max(1e-6, Math.abs(extent[1])),
        Math.max(1e-6, Math.abs(extent[2])),
      ];
      const minFixed: Vec3 = [
        center[0] - axes[0],
        center[1] - axes[1],
        center[2] - axes[2],
      ];
      const maxFixed: Vec3 = [
        center[0] + axes[0],
        center[1] + axes[1],
        center[2] + axes[2],
      ];
      return { min: minFixed, max: maxFixed, axes };
    }
  }
  return fallback;
};

const probeDecodeBase64 = (payload: string): Uint8Array | null => {
  if (!payload) return null;
  try {
    const buf = Buffer.from(payload, "base64");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
};

const probeCoerceFloat32 = (dataSource: unknown): Float32Array | null => {
  if (!dataSource) return null;
  if (dataSource instanceof Float32Array) return dataSource;
  if (dataSource instanceof ArrayBuffer) return new Float32Array(dataSource);
  if (Array.isArray(dataSource)) return new Float32Array(dataSource);
  if (typeof dataSource === "string") {
    const bytes = probeDecodeBase64(dataSource);
    if (!bytes || bytes.byteLength % 4 !== 0) return null;
    const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return new Float32Array(view);
  }
  if (ArrayBuffer.isView(dataSource) && dataSource.buffer instanceof ArrayBuffer) {
    if (dataSource.byteLength % 4 !== 0) return null;
    return new Float32Array(
      dataSource.buffer,
      dataSource.byteOffset,
      dataSource.byteLength / 4,
    );
  }
  return null;
};

const probeBuildBrickSample = (
  brick: any,
  fallbackBounds: { min: Vec3; max: Vec3; axes: Vec3 },
  channel = "alpha",
): ProbeBrickSample | null => {
  if (!brick) return null;
  const dims = probeNormalizeBrickDims(brick.dims);
  if (!dims) return null;
  const total = dims[0] * dims[1] * dims[2];
  if (!Number.isFinite(total) || total <= 0) return null;
  const channelDataRaw =
    brick.channels?.[channel]?.data ??
    brick.extraChannels?.[channel]?.data ??
    brick.channels?.[channel] ??
    brick.extraChannels?.[channel];
  const channelData = probeCoerceFloat32(channelDataRaw);
  if (!channelData || channelData.length < total) return null;
  return {
    dims,
    data: channelData,
    bounds: probeResolveBrickBounds(brick, fallbackBounds),
  };
};

const probeSampleBrickScalar = (
  sample: ProbeBrickSample,
  pos: Vec3,
  outside = 1,
) => {
  const [nx, ny, nz] = sample.dims;
  if (nx < 2 || ny < 2 || nz < 2) return outside;
  const { min, max } = sample.bounds;
  const spanX = max[0] - min[0];
  const spanY = max[1] - min[1];
  const spanZ = max[2] - min[2];
  if (!(spanX > 0 && spanY > 0 && spanZ > 0)) return outside;
  const ux = (pos[0] - min[0]) / spanX;
  const uy = (pos[1] - min[1]) / spanY;
  const uz = (pos[2] - min[2]) / spanZ;
  if (ux < 0 || ux > 1 || uy < 0 || uy > 1 || uz < 0 || uz > 1) return outside;
  const fx = Math.min(Math.max(ux * (nx - 1), 0), nx - 1 - 1e-6);
  const fy = Math.min(Math.max(uy * (ny - 1), 0), ny - 1 - 1e-6);
  const fz = Math.min(Math.max(uz * (nz - 1), 0), nz - 1 - 1e-6);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const z0 = Math.floor(fz);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const z1 = z0 + 1;
  const tx = fx - x0;
  const ty = fy - y0;
  const tz = fz - z0;
  const data = sample.data;
  const i000 = data[probeBrickIndex(x0, y0, z0, nx, ny)] ?? 0;
  const i100 = data[probeBrickIndex(x1, y0, z0, nx, ny)] ?? 0;
  const i010 = data[probeBrickIndex(x0, y1, z0, nx, ny)] ?? 0;
  const i110 = data[probeBrickIndex(x1, y1, z0, nx, ny)] ?? 0;
  const i001 = data[probeBrickIndex(x0, y0, z1, nx, ny)] ?? 0;
  const i101 = data[probeBrickIndex(x1, y0, z1, nx, ny)] ?? 0;
  const i011 = data[probeBrickIndex(x0, y1, z1, nx, ny)] ?? 0;
  const i111 = data[probeBrickIndex(x1, y1, z1, nx, ny)] ?? 0;
  const ix00 = i000 * (1 - tx) + i100 * tx;
  const ix10 = i010 * (1 - tx) + i110 * tx;
  const ix01 = i001 * (1 - tx) + i101 * tx;
  const ix11 = i011 * (1 - tx) + i111 * tx;
  const ixy0 = ix00 * (1 - ty) + ix10 * ty;
  const ixy1 = ix01 * (1 - ty) + ix11 * ty;
  return ixy0 * (1 - tz) + ixy1 * tz;
};

const probeSampleBrickForVerts = (
  verts: Float32Array,
  sample: ProbeBrickSample,
  gridScale: number,
) => {
  const [sx, sy, sz] = sample.bounds.axes;
  const { min, max } = sample.bounds;
  const centerX = (min[0] + max[0]) * 0.5;
  const centerY = (min[1] + max[1]) * 0.5;
  const centerZ = (min[2] + max[2]) * 0.5;
  const out = new Float32Array(verts.length / 3);
  const scaleX = gridScale * sx;
  const scaleY = gridScale * sy;
  const scaleZ = gridScale * sz;
  for (let i = 0; i < out.length; i += 1) {
    const base = i * 3;
    const pos: Vec3 = [
      verts[base] * scaleX + centerX,
      verts[base + 1] * scaleY + centerY,
      verts[base + 2] * scaleZ + centerZ,
    ];
    out[i] = probeSampleBrickScalar(sample, pos, 1);
  }
  return out;
};

const probeBuildClockRateSample = (
  brick: any,
  fallbackBounds: { min: Vec3; max: Vec3; axes: Vec3 },
  mode: "eulerian" | "static",
): ProbeBrickSample | null => {
  if (mode !== "static") {
    return probeBuildBrickSample(brick, fallbackBounds, "alpha");
  }
  const staticSample = probeBuildBrickSample(brick, fallbackBounds, "clockRate_static");
  if (staticSample) return staticSample;
  const gttSample = probeBuildBrickSample(brick, fallbackBounds, "g_tt");
  if (!gttSample) return probeBuildBrickSample(brick, fallbackBounds, "alpha");
  const data = new Float32Array(gttSample.data.length);
  for (let i = 0; i < data.length; i += 1) {
    const gtt = gttSample.data[i];
    const rate = Math.sqrt(Math.max(0, -gtt));
    data[i] = Number.isFinite(rate) ? rate : 0;
  }
  return {
    dims: gttSample.dims,
    data,
    bounds: gttSample.bounds,
  };
};

const probeBuildHullFieldSample = (
  brick: any,
  fallbackBounds: { min: Vec3; max: Vec3; axes: Vec3 },
  wallThickness: number,
): ProbeHullFieldSample | null => {
  const distSample = probeBuildBrickSample(brick, fallbackBounds, "hullDist");
  if (distSample) {
    return { sample: distSample, mode: "dist", source: "hullDist", wallThickness };
  }
  const maskSample = probeBuildBrickSample(brick, fallbackBounds, "hullMask");
  if (maskSample) {
    return { sample: maskSample, mode: "mask", source: "hullMask", wallThickness };
  }
  return null;
};

const probeSampleHullFieldScalar = (
  sample: ProbeBrickSample,
  pos: Vec3,
  mode: "dist" | "mask",
  wallThickness: number,
  outside: number,
) => {
  const raw = probeSampleBrickScalar(sample, pos, outside);
  if (mode === "mask") {
    const mask = clamp01(raw);
    return (0.5 - mask) * 2 * wallThickness;
  }
  return raw;
};

const probeSampleHullFieldForVerts = (
  verts: Float32Array,
  field: ProbeHullFieldSample,
  gridScale: number,
) => {
  const { sample, mode, wallThickness } = field;
  const [sx, sy, sz] = sample.bounds.axes;
  const { min, max } = sample.bounds;
  const centerX = (min[0] + max[0]) * 0.5;
  const centerY = (min[1] + max[1]) * 0.5;
  const centerZ = (min[2] + max[2]) * 0.5;
  const spanX = max[0] - min[0];
  const spanY = max[1] - min[1];
  const spanZ = max[2] - min[2];
  const dx = spanX > 0 ? spanX / Math.max(1, sample.dims[0] - 1) : 1;
  const dy = spanY > 0 ? spanY / Math.max(1, sample.dims[1] - 1) : 1;
  const dz = spanZ > 0 ? spanZ / Math.max(1, sample.dims[2] - 1) : 1;
  const outside = mode === "mask" ? 0 : Math.max(sx, sy, sz);
  const outDist = new Float32Array(verts.length / 3);
  const outGrad = new Float32Array(verts.length);
  const scaleX = gridScale * sx;
  const scaleY = gridScale * sy;
  const scaleZ = gridScale * sz;
  for (let i = 0; i < outDist.length; i += 1) {
    const base = i * 3;
    const pos: Vec3 = [
      verts[base] * scaleX + centerX,
      verts[base + 1] * scaleY + centerY,
      verts[base + 2] * scaleZ + centerZ,
    ];
    const dist = probeSampleHullFieldScalar(sample, pos, mode, wallThickness, outside);
    const dxVal =
      probeSampleHullFieldScalar(sample, [pos[0] + dx, pos[1], pos[2]], mode, wallThickness, outside) -
      probeSampleHullFieldScalar(sample, [pos[0] - dx, pos[1], pos[2]], mode, wallThickness, outside);
    const dyVal =
      probeSampleHullFieldScalar(sample, [pos[0], pos[1] + dy, pos[2]], mode, wallThickness, outside) -
      probeSampleHullFieldScalar(sample, [pos[0], pos[1] - dy, pos[2]], mode, wallThickness, outside);
    const dzVal =
      probeSampleHullFieldScalar(sample, [pos[0], pos[1], pos[2] + dz], mode, wallThickness, outside) -
      probeSampleHullFieldScalar(sample, [pos[0], pos[1], pos[2] - dz], mode, wallThickness, outside);
    const len = Math.hypot(dxVal, dyVal, dzVal);
    outDist[i] = dist;
    outGrad[base] = len > 1e-6 ? dxVal / len : 0;
    outGrad[base + 1] = len > 1e-6 ? dyVal / len : 0;
    outGrad[base + 2] = len > 1e-6 ? dzVal / len : 0;
  }
  return { dist: outDist, grad: outGrad };
};

const probeInterleaveVec3 = (
  x: Float32Array | null,
  y: Float32Array | null,
  z: Float32Array | null,
) => {
  if (!x || !y || !z) return null;
  const len = Math.min(x.length, y.length, z.length);
  const out = new Float32Array(len * 3);
  for (let i = 0; i < len; i += 1) {
    const base = i * 3;
    out[base] = x[i];
    out[base + 1] = y[i];
    out[base + 2] = z[i];
  }
  return out;
};

const probeBuildShearForVerts = (
  verts: Float32Array,
  samples: {
    K_xx: ProbeBrickSample;
    K_yy: ProbeBrickSample;
    K_zz: ProbeBrickSample;
    K_xy: ProbeBrickSample;
    K_xz: ProbeBrickSample;
    K_yz: ProbeBrickSample;
  },
  gridScale: number,
) => {
  const kxx = probeSampleBrickForVerts(verts, samples.K_xx, gridScale);
  const kyy = probeSampleBrickForVerts(verts, samples.K_yy, gridScale);
  const kzz = probeSampleBrickForVerts(verts, samples.K_zz, gridScale);
  const kxy = probeSampleBrickForVerts(verts, samples.K_xy, gridScale);
  const kxz = probeSampleBrickForVerts(verts, samples.K_xz, gridScale);
  const kyz = probeSampleBrickForVerts(verts, samples.K_yz, gridScale);
  const len = Math.min(
    kxx.length,
    kyy.length,
    kzz.length,
    kxy.length,
    kxz.length,
    kyz.length,
  );
  const out = new Float32Array(len * 3);
  for (let i = 0; i < len; i += 1) {
    const base = i * 3;
    const vx = verts[base];
    const vy = verts[base + 1];
    const vz = verts[base + 2];
    const vlen = Math.hypot(vx, vy, vz);
    const nx = vlen > 1e-6 ? vx / vlen : 0;
    const ny = vlen > 1e-6 ? vy / vlen : 0;
    const nz = vlen > 1e-6 ? vz / vlen : 0;
    const sx = kxx[i] * nx + kxy[i] * ny + kxz[i] * nz;
    const sy = kxy[i] * nx + kyy[i] * ny + kyz[i] * nz;
    const sz = kxz[i] * nx + kyz[i] * ny + kzz[i] * nz;
    out[base] = Number.isFinite(sx) ? sx : 0;
    out[base + 1] = Number.isFinite(sy) ? sy : 0;
    out[base + 2] = Number.isFinite(sz) ? sz : 0;
  }
  return out;
};

const probeMakeLatticeNodes = (div: number): Float32Array => {
  const verts: number[] = [];
  const step = 2 / div;
  const min = -1;
  for (let ix = 0; ix <= div; ix += 1) {
    const x = min + ix * step;
    for (let iy = 0; iy <= div; iy += 1) {
      const y = min + iy * step;
      for (let iz = 0; iz <= div; iz += 1) {
        const z = min + iz * step;
        verts.push(x, y, z);
      }
    }
  }
  return new Float32Array(verts);
};

const probeMakeLatticeSegments = (div: number): Float32Array => {
  const verts: number[] = [];
  const step = 2 / div;
  const min = -1;
  for (let iy = 0; iy <= div; iy += 1) {
    const y = min + iy * step;
    for (let iz = 0; iz <= div; iz += 1) {
      const z = min + iz * step;
      for (let ix = 0; ix < div; ix += 1) {
        const x0 = min + ix * step;
        const x1 = min + (ix + 1) * step;
        verts.push(x0, y, z, x1, y, z);
      }
    }
  }
  for (let ix = 0; ix <= div; ix += 1) {
    const x = min + ix * step;
    for (let iz = 0; iz <= div; iz += 1) {
      const z = min + iz * step;
      for (let iy = 0; iy < div; iy += 1) {
        const y0 = min + iy * step;
        const y1 = min + (iy + 1) * step;
        verts.push(x, y0, z, x, y1, z);
      }
    }
  }
  for (let ix = 0; ix <= div; ix += 1) {
    const x = min + ix * step;
    for (let iy = 0; iy <= div; iy += 1) {
      const y = min + iy * step;
      for (let iz = 0; iz < div; iz += 1) {
        const z0 = min + iz * step;
        const z1 = min + (iz + 1) * step;
        verts.push(x, y, z0, x, y, z1);
      }
    }
  }
  return new Float32Array(verts);
};

const probeSafeNormalize = (v: Vec3): Vec3 => {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-6) return [1, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
};

const probeSmoothstep = (edge0: number, edge1: number, x: number) => {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const probeTopHat = (r: number, sigma: number, R: number) => {
  const den = Math.max(1e-6, 2 * Math.tanh(sigma * R));
  return (Math.tanh(sigma * (r + R)) - Math.tanh(sigma * (r - R))) / den;
};

const probeEncodeFloat32 = (payload: Float32Array) =>
  Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength).toString("base64");

const probeSerializeScalar = (payload: Float32Array | null) =>
  payload
    ? { data: probeEncodeFloat32(payload), bytes: payload.byteLength, count: payload.length }
    : null;

const probeSerializeVec3 = (payload: Float32Array | null) =>
  payload
    ? {
        data: probeEncodeFloat32(payload),
        bytes: payload.byteLength,
        count: Math.floor(payload.length / 3),
        itemSize: 3,
      }
    : null;

const probeWarpVerts = (
  verts: Float32Array,
  input: {
    alpha?: Float32Array | null;
    theta?: Float32Array | null;
    hullDist?: Float32Array | null;
    hullDir?: Float32Array | null;
    beta?: Float32Array | null;
    gamma?: Float32Array | null;
    shear?: Float32Array | null;
  },
  settings: {
    gridScale: number;
    worldScale: Vec3;
    bubbleCenter: Vec3;
    bubbleR: number;
    sigma: number;
    betaScalar: number;
    betaCenter: Vec3;
    betaScale: number;
    betaWarpWeight: number;
    geomWarpScale: number;
    phiScale: number;
    alphaMin: number;
    alphaScale: number;
    thetaScale: number;
    softening: number;
    warpStrength: number;
    breathAmp: number;
    breathRate: number;
    metricBlend: number;
    shearStrength: number;
    activation: number;
    hullThickness: number;
    hullBlend: number;
    brickBlend: number;
    driveDir: Vec3;
    time_s: number;
    hullFallback: number;
  },
) => {
  const count = Math.floor(verts.length / 3);
  const out = new Float32Array(verts.length);
  if (count <= 0) return out;
  const alphaArr = input.alpha ?? null;
  const thetaArr = input.theta ?? null;
  const hullDistArr = input.hullDist ?? null;
  const hullDirArr = input.hullDir ?? null;
  const betaArr = input.beta ?? null;
  const gammaArr = input.gamma ?? null;
  const shearArr = input.shear ?? null;
  const gridScale = settings.gridScale;
  const worldScale = settings.worldScale;
  const bubbleCenter = settings.bubbleCenter;
  const sigma = Math.max(1e-4, settings.sigma);
  const R = Math.max(
    1e-4,
    settings.bubbleR * (1 + 0.1 * Math.max(0, settings.softening)),
  );
  const activation = clamp01(settings.activation);
  const betaScalar = Math.max(0, Math.min(0.99, settings.betaScalar));
  const phiScale = settings.phiScale;
  const alphaMin = settings.alphaMin;
  const alphaScale = settings.alphaScale;
  const thetaScale = settings.thetaScale;
  const warpStrength = settings.warpStrength;
  const geomWarpScale = Math.max(0, settings.geomWarpScale);
  const betaScale = Math.max(0, settings.betaScale);
  const betaWarpWeight = Math.max(0, settings.betaWarpWeight);
  const metricBlend = gammaArr ? Math.max(0, settings.metricBlend) : 0;
  const shearStrength = shearArr ? Math.max(0, settings.shearStrength) : 0;
  const hullThickness = Math.max(1e-4, settings.hullThickness);
  const hullBlend = clamp01(settings.hullBlend);
  const brickBlend = clamp01(settings.brickBlend);
  const breathAmp = settings.breathAmp;
  const breathRate = settings.breathRate;
  const time_s = settings.time_s;
  const dir = probeSafeNormalize(settings.driveDir);
  const betaCenter = settings.betaCenter;
  const hullFallback = settings.hullFallback;

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    const px = verts[base] * gridScale;
    const py = verts[base + 1] * gridScale;
    const pz = verts[base + 2] * gridScale;
    const pWorldX = px * worldScale[0];
    const pWorldY = py * worldScale[1];
    const pWorldZ = pz * worldScale[2];
    const relX = pWorldX - bubbleCenter[0];
    const relY = pWorldY - bubbleCenter[1];
    const relZ = pWorldZ - bubbleCenter[2];
    const r = Math.hypot(relX, relY, relZ);
    const f = probeTopHat(r, sigma, R);
    const betaShift = betaScalar * f;
    const alphaAnalytic = Math.sqrt(
      Math.max(alphaMin * alphaMin, 1 - betaShift * betaShift * phiScale),
    );
    const brickAlphaRaw = alphaArr && alphaArr.length > i ? alphaArr[i] : 1;
    const brickAlpha = Math.min(1, Math.max(alphaMin, brickAlphaRaw));
    const alpha = alphaAnalytic * (1 - brickBlend) + brickAlpha * brickBlend;
    const thetaRaw = thetaArr && thetaArr.length > i ? thetaArr[i] : 0;
    const thetaNorm =
      Math.max(-1, Math.min(1, thetaRaw * thetaScale)) * brickBlend;
    const thetaWarp = thetaNorm * alphaScale * activation;

    const radial = probeSafeNormalize([relX, relY, relZ]);
    const thetaVecX =
      radial[0] * thetaWarp * warpStrength * LATTICE_PROBE_THETA_WARP_SCALE;
    const thetaVecY =
      radial[1] * thetaWarp * warpStrength * LATTICE_PROBE_THETA_WARP_SCALE;
    const thetaVecZ =
      radial[2] * thetaWarp * warpStrength * LATTICE_PROBE_THETA_WARP_SCALE;

    const betaBase = base;
    const betaX = betaArr ? betaArr[betaBase] ?? 0 : 0;
    const betaY = betaArr ? betaArr[betaBase + 1] ?? 0 : 0;
    const betaZ = betaArr ? betaArr[betaBase + 2] ?? 0 : 0;
    const betaRelX = (betaX - betaCenter[0]) * betaScale;
    const betaRelY = (betaY - betaCenter[1]) * betaScale;
    const betaRelZ = (betaZ - betaCenter[2]) * betaScale;
    const betaWarpX = betaRelX * betaWarpWeight * activation * warpStrength;
    const betaWarpY = betaRelY * betaWarpWeight * activation * warpStrength;
    const betaWarpZ = betaRelZ * betaWarpWeight * activation * warpStrength;

    let gammaX = gammaArr ? gammaArr[betaBase] ?? 1 : 1;
    let gammaY = gammaArr ? gammaArr[betaBase + 1] ?? 1 : 1;
    let gammaZ = gammaArr ? gammaArr[betaBase + 2] ?? 1 : 1;
    gammaX = Math.max(0, gammaX);
    gammaY = Math.max(0, gammaY);
    gammaZ = Math.max(0, gammaZ);
    let gammaScaleX = Math.sqrt(gammaX);
    let gammaScaleY = Math.sqrt(gammaY);
    let gammaScaleZ = Math.sqrt(gammaZ);
    gammaScaleX = Math.min(1.6, Math.max(0.6, gammaScaleX));
    gammaScaleY = Math.min(1.6, Math.max(0.6, gammaScaleY));
    gammaScaleZ = Math.min(1.6, Math.max(0.6, gammaScaleZ));
    gammaScaleX = 1 + (gammaScaleX - 1) * metricBlend;
    gammaScaleY = 1 + (gammaScaleY - 1) * metricBlend;
    gammaScaleZ = 1 + (gammaScaleZ - 1) * metricBlend;

    const shearX = shearArr ? shearArr[betaBase] ?? 0 : 0;
    const shearY = shearArr ? shearArr[betaBase + 1] ?? 0 : 0;
    const shearZ = shearArr ? shearArr[betaBase + 2] ?? 0 : 0;
    const shearVecX = shearX * shearStrength * activation;
    const shearVecY = shearY * shearStrength * activation;
    const shearVecZ = shearZ * shearStrength * activation;

    const twistX = dir[1] * shearVecZ - dir[2] * shearVecY;
    const twistY = dir[2] * shearVecX - dir[0] * shearVecZ;
    const twistZ = dir[0] * shearVecY - dir[1] * shearVecX;

    const hullDist =
      hullDistArr && hullDistArr.length > i ? hullDistArr[i] : hullFallback;
    const hullBand =
      1 - probeSmoothstep(hullThickness * 0.5, hullThickness, Math.abs(hullDist));
    const hullWeight = hullBand * hullBlend;
    let hullDirX = hullDirArr ? hullDirArr[betaBase] ?? 0 : 0;
    let hullDirY = hullDirArr ? hullDirArr[betaBase + 1] ?? 0 : 0;
    let hullDirZ = hullDirArr ? hullDirArr[betaBase + 2] ?? 0 : 0;
    const hullDirLen = Math.hypot(hullDirX, hullDirY, hullDirZ);
    if (hullDirLen > 1e-4) {
      hullDirX /= hullDirLen;
      hullDirY /= hullDirLen;
      hullDirZ /= hullDirLen;
    } else {
      hullDirX = radial[0];
      hullDirY = radial[1];
      hullDirZ = radial[2];
    }
    const hullSign = hullDist >= 0 ? 1 : -1;
    const hullWarpX =
      hullDirX * hullSign * hullWeight * activation * LATTICE_PROBE_HULL_WARP_SCALE;
    const hullWarpY =
      hullDirY * hullSign * hullWeight * activation * LATTICE_PROBE_HULL_WARP_SCALE;
    const hullWarpZ =
      hullDirZ * hullSign * hullWeight * activation * LATTICE_PROBE_HULL_WARP_SCALE;

    const warpX =
      (betaWarpX + thetaVecX + hullWarpX * warpStrength + shearVecX + twistX) *
      geomWarpScale;
    const warpY =
      (betaWarpY + thetaVecY + hullWarpY * warpStrength + shearVecY + twistY) *
      geomWarpScale;
    const warpZ =
      (betaWarpZ + thetaVecZ + hullWarpZ * warpStrength + shearVecZ + twistZ) *
      geomWarpScale;
    const breath =
      (1 - alpha) *
      breathAmp *
      Math.sin(time_s * breathRate) *
      activation *
      geomWarpScale;

    out[base] = (px + warpX + dir[0] * breath) * gammaScaleX;
    out[base + 1] = (py + warpY + dir[1] * breath) * gammaScaleY;
    out[base + 2] = (pz + warpZ + dir[2] * breath) * gammaScaleZ;
  }

  return out;
};

export async function getLatticeProbe(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? {
      Lx_m: 1007,
      Ly_m: 264,
      Lz_m: 173,
      wallThickness_m: 0.45,
    };
    const bounds = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2] as Vec3,
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2] as Vec3,
    };
    const axes: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];
    const fallbackBounds = { min: bounds.min, max: bounds.max, axes };

    const query = req.method === "GET"
      ? req.query
      : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const gridDivBase = Math.max(
      1,
      Math.floor(parseNumberParam((query as any).gridDiv ?? (query as any).div, LATTICE_PROBE_GRID_DIV)),
    );
    const densityRaw = parseNumberParam((query as any).density ?? (query as any).probeDensity, 1);
    const density = Number.isFinite(densityRaw) ? Math.max(0.1, densityRaw) : 1;
    const maxDiv = Math.max(1, Math.floor(parseNumberParam((query as any).maxDiv, 512)));
    let div = Math.max(1, Math.floor(gridDivBase * density));
    div = Math.min(div, maxDiv);
    const includeLines = parseBooleanParam((query as any).includeLines, true);
    const includeNodes = parseBooleanParam((query as any).includeNodes, true);
    const maxVerts = Math.max(
      1,
      Math.floor(parseNumberParam((query as any).maxVerts, LATTICE_PROBE_MAX_VERTS)),
    );
    const countForDiv = (d: number) => {
      const nodeCount = includeNodes ? Math.pow(d + 1, 3) : 0;
      const lineCount = includeLines ? 6 * d * Math.pow(d + 1, 2) : 0;
      return nodeCount + lineCount;
    };
    const requestedDiv = div;
    let totalVerts = countForDiv(div);
    let clamped = false;
    while (div > 1 && maxVerts > 0 && totalVerts > maxVerts) {
      div = Math.max(1, div - 1);
      totalVerts = countForDiv(div);
      clamped = true;
    }
    const densityApplied = gridDivBase > 0 ? div / gridDivBase : density;
    const gridScale = Math.max(
      1e-3,
      parseNumberParam((query as any).gridScale, LATTICE_PROBE_GRID_SCALE),
    );

    const clockModeRaw =
      typeof (query as any).clockMode === "string" ? (query as any).clockMode : "eulerian";
    const clockMode = clockModeRaw === "static" ? "static" : "eulerian";
    const alphaScale = Math.max(0, parseNumberParam((query as any).alphaScale, 1));
    const betaScale = Math.max(0, parseNumberParam((query as any).betaScale, 1));
    const time_s = parseNumberParam((query as any).time_s, parseNumberParam((query as any).time, 0));

    const warpFieldRaw =
      (state as any)?.warpFieldType ??
      (state as any)?.dynamicConfig?.warpFieldType;
    const warpFieldType =
      typeof warpFieldRaw === "string" && warpFieldRaw.length
        ? warpFieldRaw.toLowerCase()
        : "natario";
    const warpGeometry =
      warpFieldType === "alcubierre"
        ? { geomScale: 1, betaWeight: 1 }
        : warpFieldType === "natario" || warpFieldType === "natario_sdf"
          ? { geomScale: LATTICE_PROBE_NATARIO_GEOM_WARP_SCALE, betaWeight: 0 }
          : { geomScale: 1, betaWeight: 0 };

    const activationState = probeComputeActivation(state);
    const kappaSettings = probeComputeKappaSettings(state);
    const bubbleParams = probeResolveBubbleParams(state, axes);
    const visuals = {
      ...kappaSettings.settings,
      phiScale: parseNumberParam((query as any).phiScale, kappaSettings.settings.phiScale),
      warpStrength: parseNumberParam(
        (query as any).warpStrength,
        kappaSettings.settings.warpStrength,
      ),
      breathAmp: parseNumberParam(
        (query as any).breathAmp,
        kappaSettings.settings.breathAmp,
      ),
      softening: parseNumberParam(
        (query as any).softening,
        kappaSettings.settings.softening,
      ),
    };

    const overrideDriveDir = parseVec3ParamOptional((query as any).driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir) ?? [1, 0, 0];

    const quality = typeof (query as any).quality === "string" ? (query as any).quality : undefined;
    const qualityDims = dimsForQuality(quality);
    const dimsCap = dimsCapForQuality(quality);
    const targetDx = Math.max(
      1e-3,
      parseNumberParam((query as any).targetDx ?? (query as any).target_dx, 5),
    );
    const dimsFromDx: [number, number, number] = [
      Math.max(1, Math.ceil((axes[0] * 2) / targetDx)),
      Math.max(1, Math.ceil((axes[1] * 2) / targetDx)),
      Math.max(1, Math.ceil((axes[2] * 2) / targetDx)),
    ];
    const hasDimsOverride =
      (query as any).dims !== undefined && (query as any).dims !== null;
    const dimsRaw = hasDimsOverride
      ? parseDimsParam((query as any).dims, qualityDims)
      : dimsFromDx;
    const dims = clampDimsToQuality(dimsRaw, dimsCap);

    const time_s_gr = parseNumberParam((query as any).time_s, parseNumberParam((query as any).time, 0));
    const dt_s = parseNumberParam((query as any).dt_s, parseNumberParam((query as any).dt, 0));
    const stepsRaw = Math.max(0, Math.floor(parseNumberParam((query as any).steps, 0)));
    const steps = clampStepsToQuality(stepsRaw, stepsForQuality(quality));
    const iterations = Math.max(
      0,
      Math.floor(parseNumberParam((query as any).iterations, iterationsForQuality(quality))),
    );
    const tolerance = Math.max(0, parseNumberParam((query as any).tolerance, 0));
    const initialIterations = Math.max(
      0,
      Math.floor(parseNumberParam((query as any).initialIterations, iterations)),
    );
    const initialTolerance = Math.max(
      0,
      parseNumberParam((query as any).initialTolerance, tolerance),
    );
    const lapseKappa = Math.max(
      0,
      parseNumberParam((query as any).kappa, parseNumberParam((query as any).lapseKappa, 2)),
    );
    const shiftEta = Math.max(
      0,
      parseNumberParam((query as any).eta, parseNumberParam((query as any).shiftEta, 1)),
    );
    const shiftGamma = Math.max(
      0,
      parseNumberParam((query as any).shiftGamma, 0.75),
    );
    const advect = parseBooleanParam((query as any).advect, true);
    const includeExtra = parseBooleanParam((query as any).includeExtra, false);
    const includeMatter = parseBooleanParam((query as any).includeMatter, includeExtra);
    const includeKij = parseBooleanParam((query as any).includeKij, true) || includeExtra;
    const orderRaw = Math.max(2, Math.floor(parseNumberParam((query as any).order, 2)));
    const order = orderRaw >= 4 ? 4 : 2;
    const boundaryRaw =
      typeof (query as any).boundary === "string"
        ? (query as any).boundary
        : typeof (query as any).stencilBoundary === "string"
          ? (query as any).stencilBoundary
          : undefined;
    const boundary = boundaryRaw === "periodic" ? "periodic" : "clamp";

    const pipelineInputs = resolvePipelineMatterInputs(state);
    const hullWall = state.hull?.wallThickness_m ?? 0.45;
    const dutyFRValue = Math.max(pipelineInputs.dutyFR, 1e-8);
    const qValue = Math.max(pipelineInputs.q, 1e-6);
    const pressureFactor = resolveStressEnergyPressureFactor(state);
    const sourceOptions =
      pressureFactor !== undefined ? { pressureFactor } : undefined;
    const sourceParams: Partial<StressEnergyBrickParams> = {
      bounds,
      hullAxes: axes,
      hullWall,
      dutyFR: dutyFRValue,
      q: qValue,
      gammaGeo: pipelineInputs.gammaGeo,
      gammaVdB: pipelineInputs.gammaVdB,
      zeta: pipelineInputs.zeta,
      phase01: pipelineInputs.phase01,
      driveDir: driveDir ?? undefined,
    };

    const grEnabled = parseBooleanParam((query as any).grEnabled, state.grEnabled === true);
    const geometrySig = buildGrGeometrySignature(
      resolved,
      state,
      typeof state.warpGeometryKind === "string" ? state.warpGeometryKind : null,
    );
    const sourceCacheKey = {
      dutyFR: dutyFRValue,
      q: qValue,
      gammaGeo: pipelineInputs.gammaGeo,
      gammaVdB: pipelineInputs.gammaVdB,
      zeta: pipelineInputs.zeta,
      phase01: pipelineInputs.phase01,
      pressureFactor: pressureFactor ?? null,
      driveDir: driveDir ?? null,
      hullAxes: axes,
      hullWall,
    };
    const cacheKey = JSON.stringify({
      dims,
      bounds,
      time_s: time_s_gr,
      dt_s,
      steps,
      iterations,
      tolerance,
      useInitialData: true,
      initialIterations,
      initialTolerance,
      gauge: {
        lapseKappa,
        shiftEta,
        shiftGamma,
        advect,
      },
      stencils: {
        order,
        boundary,
      },
      includeExtra,
      includeMatter,
      includeKij,
      grEnabled,
      source: sourceCacheKey,
      geometry: geometrySig,
    });

    const errors: string[] = [];
    let grBrick: GrEvolveBrick | null = null;
    if (grEnabled) {
      const cached = readGrBrickCache(grEvolveCache, cacheKey);
      grBrick = cached?.brick ?? null;
      if (!grBrick) {
        const params: Partial<GrEvolveBrickParams> = {
          dims,
          bounds,
          time_s: time_s_gr,
          dt_s,
          steps,
          iterations,
          tolerance,
          useInitialData: true,
          initialIterations,
          initialTolerance,
          gauge: {
            lapseKappa,
            shiftEta,
            shiftGamma,
            advect,
          },
          stencils: {
            order,
            boundary,
          },
          includeExtra,
          includeMatter,
          includeKij,
          sourceParams,
          sourceOptions,
        };
        if (isGrWorkerEnabled()) {
          try {
            grBrick = await runGrEvolveBrickInWorker(params);
          } catch (err) {
            console.warn("[helix-core] lattice probe gr-evolve worker failed:", err);
          }
        }
        if (!grBrick) {
          grBrick = buildGrEvolveBrick(params);
        }
        writeGrBrickCache(grEvolveCache, {
          key: cacheKey,
          createdAt: Date.now(),
          brick: grBrick,
        });
      }
    }

    let lapseBrick: LapseBrick | null = null;
    if (!grBrick) {
      try {
        const geometryKindRaw =
          typeof (query as any).geometryKind === "string"
            ? (query as any).geometryKind
            : state.warpGeometryKind;
        const radialMap = resolveRadialMapForBrick(state, preview, hull, geometryKindRaw);
        const lapseParams: Partial<LapseBrickParams> = {
          dims,
          bounds,
          hullAxes: axes,
          hullWall,
          radialMap: radialMap ?? undefined,
          phase01: pipelineInputs.phase01,
          sigmaSector: parseNumberParam((query as any).sigmaSector, 0.05),
          splitEnabled: parseBooleanParam((query as any).splitEnabled, false),
          splitFrac: parseNumberParam((query as any).splitFrac, 0.6),
          dutyFR: dutyFRValue,
          q: qValue,
          gammaGeo: pipelineInputs.gammaGeo,
          gammaVdB: pipelineInputs.gammaVdB,
          ampBase: parseNumberParam((query as any).ampBase, 0),
          zeta: pipelineInputs.zeta,
          driveDir: driveDir ?? undefined,
          iterations,
          tolerance,
        };
        lapseBrick = buildLapseBrick(lapseParams);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to build lapse brick";
        errors.push(message);
      }
    }

    const activeBrick = grBrick ?? lapseBrick;
    const brickSource = grBrick ? "gr-evolve-brick" : lapseBrick ? "lapse-brick" : "missing";
    const clockRateSample = activeBrick
      ? probeBuildClockRateSample(activeBrick, fallbackBounds, clockMode)
      : null;
    const thetaSample = grBrick
      ? probeBuildBrickSample(grBrick, fallbackBounds, "theta")
      : null;
    const betaSamples = grBrick
      ? (() => {
          const sampleX = probeBuildBrickSample(grBrick, fallbackBounds, "beta_x");
          const sampleY = probeBuildBrickSample(grBrick, fallbackBounds, "beta_y");
          const sampleZ = probeBuildBrickSample(grBrick, fallbackBounds, "beta_z");
          return sampleX && sampleY && sampleZ ? { sampleX, sampleY, sampleZ } : null;
        })()
      : null;
    const gammaSamples = grBrick
      ? (() => {
          const sampleX = probeBuildBrickSample(grBrick, fallbackBounds, "gamma_xx");
          const sampleY = probeBuildBrickSample(grBrick, fallbackBounds, "gamma_yy");
          const sampleZ = probeBuildBrickSample(grBrick, fallbackBounds, "gamma_zz");
          return sampleX && sampleY && sampleZ ? { sampleX, sampleY, sampleZ } : null;
        })()
      : null;
    const kijSamples = grBrick
      ? (() => {
          const K_xx = probeBuildBrickSample(grBrick, fallbackBounds, "K_xx");
          const K_yy = probeBuildBrickSample(grBrick, fallbackBounds, "K_yy");
          const K_zz = probeBuildBrickSample(grBrick, fallbackBounds, "K_zz");
          const K_xy = probeBuildBrickSample(grBrick, fallbackBounds, "K_xy");
          const K_xz = probeBuildBrickSample(grBrick, fallbackBounds, "K_xz");
          const K_yz = probeBuildBrickSample(grBrick, fallbackBounds, "K_yz");
          return K_xx && K_yy && K_zz && K_xy && K_xz && K_yz
            ? { K_xx, K_yy, K_zz, K_xy, K_xz, K_yz }
            : null;
        })()
      : null;

    const lineVerts = includeLines ? probeMakeLatticeSegments(div) : new Float32Array(0);
    const nodeVerts = includeNodes ? probeMakeLatticeNodes(div) : new Float32Array(0);
    const lineCount = Math.floor(lineVerts.length / 3);
    const nodeCount = Math.floor(nodeVerts.length / 3);

    const lineAlpha = includeLines && clockRateSample
      ? probeSampleBrickForVerts(lineVerts, clockRateSample, gridScale)
      : null;
    const nodeAlpha = includeNodes && clockRateSample
      ? probeSampleBrickForVerts(nodeVerts, clockRateSample, gridScale)
      : null;
    const lineTheta = includeLines && thetaSample
      ? probeSampleBrickForVerts(lineVerts, thetaSample, gridScale)
      : null;
    const nodeTheta = includeNodes && thetaSample
      ? probeSampleBrickForVerts(nodeVerts, thetaSample, gridScale)
      : null;
    const lineBeta = includeLines && betaSamples
      ? probeInterleaveVec3(
          probeSampleBrickForVerts(lineVerts, betaSamples.sampleX, gridScale),
          probeSampleBrickForVerts(lineVerts, betaSamples.sampleY, gridScale),
          probeSampleBrickForVerts(lineVerts, betaSamples.sampleZ, gridScale),
        )
      : null;
    const nodeBeta = includeNodes && betaSamples
      ? probeInterleaveVec3(
          probeSampleBrickForVerts(nodeVerts, betaSamples.sampleX, gridScale),
          probeSampleBrickForVerts(nodeVerts, betaSamples.sampleY, gridScale),
          probeSampleBrickForVerts(nodeVerts, betaSamples.sampleZ, gridScale),
        )
      : null;
    const lineGamma = includeLines && gammaSamples
      ? probeInterleaveVec3(
          probeSampleBrickForVerts(lineVerts, gammaSamples.sampleX, gridScale),
          probeSampleBrickForVerts(lineVerts, gammaSamples.sampleY, gridScale),
          probeSampleBrickForVerts(lineVerts, gammaSamples.sampleZ, gridScale),
        )
      : null;
    const nodeGamma = includeNodes && gammaSamples
      ? probeInterleaveVec3(
          probeSampleBrickForVerts(nodeVerts, gammaSamples.sampleX, gridScale),
          probeSampleBrickForVerts(nodeVerts, gammaSamples.sampleY, gridScale),
          probeSampleBrickForVerts(nodeVerts, gammaSamples.sampleZ, gridScale),
        )
      : null;
    const lineShear = includeLines && kijSamples
      ? probeBuildShearForVerts(lineVerts, kijSamples, gridScale)
      : null;
    const nodeShear = includeNodes && kijSamples
      ? probeBuildShearForVerts(nodeVerts, kijSamples, gridScale)
      : null;

    const hullBrickPayload = (state as any)?.hullBrick ?? lapseBrick ?? null;
    const hullField = hullBrickPayload
      ? probeBuildHullFieldSample(hullBrickPayload, fallbackBounds, hullWall)
      : null;
    const latticeBounds = hullField?.sample.bounds ?? fallbackBounds;
    const lineHull = includeLines && hullField
      ? probeSampleHullFieldForVerts(lineVerts, hullField, gridScale)
      : null;
    const nodeHull = includeNodes && hullField
      ? probeSampleHullFieldForVerts(nodeVerts, hullField, gridScale)
      : null;
    const hullFallbackDistance = Math.max(
      latticeBounds.axes[0],
      latticeBounds.axes[1],
      latticeBounds.axes[2],
    ) * 2;
    const defaultLineHullDist = includeLines
      ? new Float32Array(lineCount).fill(hullFallbackDistance)
      : null;
    const defaultNodeHullDist = includeNodes
      ? new Float32Array(nodeCount).fill(hullFallbackDistance)
      : null;
    const defaultLineHullDir = includeLines ? new Float32Array(lineCount * 3) : null;
    const defaultNodeHullDir = includeNodes ? new Float32Array(nodeCount * 3) : null;

    const lineHullDist = lineHull?.dist ?? defaultLineHullDist;
    const lineHullDir = lineHull?.grad ?? defaultLineHullDir;
    const nodeHullDist = nodeHull?.dist ?? defaultNodeHullDist;
    const nodeHullDir = nodeHull?.grad ?? defaultNodeHullDir;

    const betaCenter: Vec3 = betaSamples
      ? [
          probeSampleBrickScalar(betaSamples.sampleX, bubbleParams.center, 0),
          probeSampleBrickScalar(betaSamples.sampleY, bubbleParams.center, 0),
          probeSampleBrickScalar(betaSamples.sampleZ, bubbleParams.center, 0),
        ].map((value) => (Number.isFinite(value) ? value : 0)) as Vec3
      : [0, 0, 0];

    const metricAdapter = (state as any)?.warp?.metricAdapter ?? null;
    const grDiagnostics = grBrick ? buildGrDiagnostics(grBrick, { metricAdapter }) : null;
    const betaMaxAbs = grDiagnostics?.gauge?.betaMaxAbs;
    const betaFromGr =
      Number.isFinite(betaMaxAbs) ? Math.abs(betaMaxAbs as number) : Number.NaN;
    const betaField = Number.isFinite(betaFromGr)
      ? {
          value: Math.min(LATTICE_PROBE_BETA_NEAR_REST_MAX, betaFromGr),
          source: "gr-beta",
          proxy: false,
        }
      : {
          value: bubbleParams.beta,
          source: bubbleParams.betaSource,
          proxy: bubbleParams.betaProxy,
        };
    const betaEffective = betaField.value * activationState.activation * betaScale;

    const thetaChannel = grBrick?.channels?.theta;
    const thetaRange = thetaChannel && Number.isFinite(thetaChannel.min) && Number.isFinite(thetaChannel.max)
      ? {
          min: thetaChannel.min,
          max: thetaChannel.max,
          maxAbs: Math.max(Math.abs(thetaChannel.min), Math.abs(thetaChannel.max)),
        }
      : null;
    const thetaScale = thetaRange && thetaRange.maxAbs > 0 ? 1 / thetaRange.maxAbs : 0;

    const hullThickness = Math.min(
      Math.max(LATTICE_PROBE_HULL_CONTOUR_MIN, hullWall * LATTICE_PROBE_HULL_CONTOUR_SCALE),
      Math.min(latticeBounds.axes[0], latticeBounds.axes[1], latticeBounds.axes[2]) * 0.5,
    );

    const warpSettings = {
      gridScale,
      worldScale: latticeBounds.axes,
      bubbleCenter: bubbleParams.center,
      bubbleR: bubbleParams.R,
      sigma: bubbleParams.sigma,
      betaScalar: betaEffective,
      betaCenter,
      betaScale,
      betaWarpWeight: warpGeometry.betaWeight,
      geomWarpScale: warpGeometry.geomScale,
      phiScale: visuals.phiScale,
      alphaMin: LATTICE_PROBE_ALPHA_MIN,
      alphaScale,
      thetaScale,
      softening: visuals.softening,
      warpStrength: visuals.warpStrength,
      breathAmp: visuals.breathAmp,
      breathRate: LATTICE_PROBE_BREATH_RATE,
      metricBlend: LATTICE_PROBE_METRIC_BLEND,
      shearStrength: LATTICE_PROBE_SHEAR_STRENGTH,
      activation: activationState.activation,
      hullThickness,
      hullBlend: hullField ? 1 : 0,
      brickBlend: activeBrick ? 1 : 0,
      driveDir,
      time_s,
      hullFallback: hullFallbackDistance,
    };

    const lineWarped = includeLines
      ? probeWarpVerts(
          lineVerts,
          {
            alpha: lineAlpha,
            theta: lineTheta,
            hullDist: lineHullDist,
            hullDir: lineHullDir,
            beta: lineBeta,
            gamma: lineGamma,
            shear: lineShear,
          },
          warpSettings,
        )
      : null;
    const nodeWarped = includeNodes
      ? probeWarpVerts(
          nodeVerts,
          {
            alpha: nodeAlpha,
            theta: nodeTheta,
            hullDist: nodeHullDist,
            hullDir: nodeHullDir,
            beta: nodeBeta,
            gamma: nodeGamma,
            shear: nodeShear,
          },
          warpSettings,
        )
      : null;

    const stageRequirements: Array<{ module: string; minStage: MathStageLabel }> = [
      { module: "server/energy-pipeline.ts", minStage: "reduced-order" },
    ];
    if (grBrick) {
      stageRequirements.push(
        { module: "server/gr-evolve-brick.ts", minStage: "diagnostic" },
        { module: "server/stress-energy-brick.ts", minStage: "reduced-order" },
      );
    }
    const gateReasons: string[] = [];
    const gateModules = stageRequirements.map((entry) => {
      const stage = resolveLatticeProbeStage(entry.module);
      const ok = meetsLatticeProbeStage(stage, entry.minStage);
      if (!ok) {
        gateReasons.push(`stage blocked: ${entry.module} (${stage} < ${entry.minStage})`);
      }
      return {
        module: entry.module,
        stage,
        minStage: entry.minStage,
        ok,
      };
    });

    const natarioStats = grBrick?.stats?.stressEnergy?.natario ?? null;
    const alphaRange = (() => {
      const values = nodeAlpha ?? lineAlpha;
      if (!values || values.length === 0) return null;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < values.length; i += 1) {
        const v = values[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
      return { min, max };
    })();

    const spacing_m: Vec3 = [
      (2 * gridScale * latticeBounds.axes[0]) / Math.max(1, div),
      (2 * gridScale * latticeBounds.axes[1]) / Math.max(1, div),
      (2 * gridScale * latticeBounds.axes[2]) / Math.max(1, div),
    ];

    const payload = {
      kind: "lattice-probe",
      version: 1,
      updatedAt: Date.now(),
      grid: {
        div,
        gridDivBase,
        densityRequested: density,
        densityApplied,
        gridScale,
        spacing_m,
        counts: {
          nodes: nodeCount,
          lines: lineCount,
          total: totalVerts,
          maxVerts,
        },
        includeNodes,
        includeLines,
        requestedDiv,
        clamped,
      },
      bounds: latticeBounds,
      geometry: {
        source: resolved.source,
        meshHash: resolved.meshHash ?? null,
        previewUpdatedAt: resolved.previewUpdatedAt ?? null,
        clampReasons: resolved.clampReasons,
        basis: resolved.basis,
      },
      mathGate: {
        allowed: gateReasons.length === 0,
        reasons: gateReasons,
        modules: gateModules,
      },
      sources: {
        brick: brickSource,
        clockMode,
        warpFieldType,
        alphaSource: clockRateSample ? brickSource : "analytic",
        thetaSource: thetaSample ? "gr-evolve-brick" : "missing",
        hullField: hullField?.source ?? "none",
      },
      ranges: {
        alpha: alphaRange,
        theta: thetaRange,
        betaMaxAbs: Number.isFinite(betaMaxAbs) ? betaMaxAbs : null,
      },
      kappa: {
        drive: kappaSettings.kappaDrive,
        blend: kappaSettings.kappaBlend,
      },
      activation: {
        value: activationState.activation,
        base: activationState.activationBase,
        proxy: activationState.activationProxy,
        guardrails: activationState.guardrails,
        power: activationState.power,
        duty: activationState.duty,
        gammaGeo: activationState.gammaGeo,
        gammaVdB: activationState.gammaVdB,
        qSpoil: activationState.qSpoil,
        tsRatio: activationState.tsRatio,
        thetaCal: activationState.thetaCal,
      },
      bubble: {
        R: bubbleParams.R,
        sigma: bubbleParams.sigma,
        beta: betaField.value,
        center: bubbleParams.center,
        sources: {
          radius: bubbleParams.radiusSource,
          sigma: bubbleParams.sigmaSource,
          beta: betaField.source,
          center: bubbleParams.centerSource,
        },
        proxy: {
          radius: bubbleParams.radiusProxy,
          sigma: bubbleParams.sigmaProxy,
          beta: betaField.proxy,
          center: bubbleParams.centerProxy,
        },
      },
      warp: {
        geomScale: warpGeometry.geomScale,
        betaWeight: warpGeometry.betaWeight,
        betaScale,
        betaEffective,
        warpStrength: visuals.warpStrength,
        phiScale: visuals.phiScale,
        breathAmp: visuals.breathAmp,
        softening: visuals.softening,
        alphaMin: LATTICE_PROBE_ALPHA_MIN,
        alphaScale,
        thetaScale,
        thetaWarpScale: LATTICE_PROBE_THETA_WARP_SCALE,
        metricBlend: LATTICE_PROBE_METRIC_BLEND,
        shearStrength: LATTICE_PROBE_SHEAR_STRENGTH,
        hullThickness,
      },
      diagnostics: natarioStats
        ? {
            divBetaMaxPre: natarioStats.divBetaMaxPre ?? natarioStats.divBetaMax,
            divBetaMaxPost: natarioStats.divBetaMaxPost ?? natarioStats.divBetaMax,
            clampScale: natarioStats.clampScale,
          }
        : null,
      nodes: includeNodes
        ? {
            count: nodeCount,
            positions: probeSerializeVec3(nodeVerts),
            warped: probeSerializeVec3(nodeWarped),
            alpha: probeSerializeScalar(nodeAlpha),
            theta: probeSerializeScalar(nodeTheta),
            beta: probeSerializeVec3(nodeBeta),
            gamma: probeSerializeVec3(nodeGamma),
            shear: probeSerializeVec3(nodeShear),
            hullDist: probeSerializeScalar(nodeHullDist),
            hullDir: probeSerializeVec3(nodeHullDir),
          }
        : null,
      lines: includeLines
        ? {
            count: lineCount,
            positions: probeSerializeVec3(lineVerts),
            warped: probeSerializeVec3(lineWarped),
            alpha: probeSerializeScalar(lineAlpha),
            theta: probeSerializeScalar(lineTheta),
            beta: probeSerializeVec3(lineBeta),
            gamma: probeSerializeVec3(lineGamma),
            shear: probeSerializeVec3(lineShear),
            hullDist: probeSerializeScalar(lineHullDist),
            hullDir: probeSerializeVec3(lineHullDir),
          }
        : null,
      errors: errors.length ? errors : undefined,
    };

    res.json(payload);
  } catch (err) {
    console.error("[helix-core] lattice probe error:", err);
    const message = err instanceof Error ? err.message : "Failed to build lattice probe";
    res.status(500).json({ error: "lattice-probe-failed", message });
  }
}

// Get displacement field samples for physics validation
export function getDisplacementField(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const s = getGlobalPipelineState();
    const q = req.query;
    const sectors = q.sectors ? Number(q.sectors) : s.sectorCount;
    const split = q.split ? Number(q.split) : Math.floor(s.sectorCount/2);
    const field = sampleDisplacementField(s, {
      nTheta: q.nTheta ? Number(q.nTheta) : undefined,
      nPhi: q.nPhi ? Number(q.nPhi) : undefined,
      sectors, split,
      wallWidth_m: q.wallWidth_m ? Number(q.wallWidth_m) : undefined,
      shellOffset: q.shellOffset ? Number(q.shellOffset) : undefined,
    });
    res.json({
      count: field.length,
      axes: s.hull,
      w_m: (s.sag_nm ?? 16) * 1e-9,
      rhoMetric: "harmonic",   // ✅ matches viewer/shader conversion
      physics: {
        gammaGeo: s.gammaGeo,
        qSpoiling: s.qSpoilingFactor,
        // ✅ provide the exact field name the client type expects
        sectorStrobing: sectors,
        // (keep extra fields for debugging/compat)
        sectorCount: s.sectorCount,
        concurrentSectors: s.concurrentSectors
      },
      data: {
        length: field.length,
        x: field.x,
        y: field.y,
        z: field.z,
        nx: field.nx,
        ny: field.ny,
        nz: field.nz,
        rho: field.rho,
        bell: field.bell,
        sgn: field.sgn,
        disp: field.disp,
        dA: field.dA,
      }
    });
  } catch (e) {
    console.error("field endpoint error:", e);
    res.status(500).json({ error: "field sampling failed" });
  }
}

// Geometry-aware sampler (ellipsoid | radial | sdf) with optional CSV output
export function getDisplacementFieldGeometry(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const body = req.body ?? {};
    const previewRaw = (body as any)?.preview ?? (body as any)?.previewPayload ?? (body as any)?.hullPreview ?? null;

    // Allow `format=csv` via query or body
    const fmtQuery = typeof req.query?.format === "string" ? (req.query.format as string) : undefined;

    const geometrySchema = warpGeometrySchema.partial().extend({
      format: z.enum(["json", "csv"]).optional(),
      nTheta: z.number().int().positive().optional(),
      nPhi: z.number().int().positive().optional(),
      wallWidth_m: z.number().positive().optional(),
      shellOffset: z.number().optional(),
      sectors: z.number().int().positive().optional(),
      split: z.number().int().nonnegative().optional(),
    });
    const parsed = geometrySchema.parse(body);
    const geometryKind = (parsed as any)?.geometryKind ?? parsed.kind ?? "ellipsoid";

    const radial = parsed.radial ?? {};
    const sdf = parsed.sdf ?? {};

    const radialSamples = Array.isArray(radial.samples)
      ? radial.samples.map((sample) => warpRadialSampleSchema.parse(sample))
      : undefined;
    const sdfSamples = Array.isArray(sdf.samples)
      ? sdf.samples.map((sample) => ({
          p: sample.p as [number, number, number],
          n: sample.n as [number, number, number] | undefined,
          dA: sample.dA,
          signedDistance_m: sample.signedDistance_m,
        }))
      : undefined;

    const sectorsResolved = Math.max(1, Math.floor(parsed.sectors ?? state.sectorCount ?? 1));
    const splitResolved = Number.isFinite(parsed.split as number)
      ? Math.max(0, Math.floor(parsed.split as number))
      : Math.floor(sectorsResolved / 2);

    const resolved = resolveGeometryForSampling(previewRaw, state.hull);
    const hullForSampling = resolved.sampleHull ?? resolved.hull;
    const samplerState: EnergyPipelineState = { ...state, hull: hullForSampling };

    const cacheParams = {
      nTheta: parsed.nTheta ?? radial.nTheta,
      nPhi: parsed.nPhi ?? radial.nPhi,
      sectors: sectorsResolved,
      split: splitResolved,
      wallWidth_m: parsed.wallWidth_m,
      shellOffset: parsed.shellOffset,
      radialSamples,
      sdfSamples,
    };
    const cacheKey = makeGeometryCacheKey({ resolved, geometryKind, params: cacheParams });
    const cached = readGeometryCache(cacheKey);

    const fieldDetached = cached
      ? cached.buffer
      : transformBufferWithBasis(
          detachFieldBuffer(
            sampleDisplacementFieldGeometry(samplerState, {
              geometryKind,
              nTheta: parsed.nTheta,
              nPhi: parsed.nPhi,
              sectors: sectorsResolved,
              split: splitResolved,
              wallWidth_m: parsed.wallWidth_m,
              shellOffset: parsed.shellOffset,
              radial: {
                nTheta: parsed.nTheta,
                nPhi: parsed.nPhi,
                samples: radialSamples,
              },
              sdf: sdfSamples ? { samples: sdfSamples } : undefined,
            }),
          ),
          resolved.basis,
        );

    const responseMeta = cached?.meta ?? {
      geometrySource: resolved.source,
      basisApplied: resolved.basis,
      hullDims: resolved.hull,
      sampleHull: resolved.sampleHull,
      meshHash: resolved.meshHash,
      clampReasons: resolved.clampReasons,
      previewUpdatedAt: resolved.previewUpdatedAt,
    };

    if (!cached) {
      writeGeometryCache({
        createdAt: Date.now(),
        key: cacheKey,
        buffer: fieldDetached,
        meta: responseMeta,
      });
    }

    res.setHeader("X-Geometry-Source", responseMeta.geometrySource);
    if (responseMeta.meshHash) res.setHeader("X-Mesh-Hash", String(responseMeta.meshHash));
    if (responseMeta.previewUpdatedAt) {
      res.setHeader("X-Preview-Updated-At", String(responseMeta.previewUpdatedAt));
    }
    res.setHeader("X-Geometry-Basis", JSON.stringify(responseMeta.basisApplied));

    const format = (parsed.format ?? fmtQuery ?? "json").toLowerCase();
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.send(fieldSamplesToCsv(fieldDetached));
      return;
    }

    res.json({
      count: fieldDetached.length,
      geometryKind,
      geometrySource: responseMeta.geometrySource,
      basisApplied: responseMeta.basisApplied,
      meshHash: responseMeta.meshHash,
      hullDims: responseMeta.hullDims,
      sampleHull: responseMeta.sampleHull,
      clampReasons: responseMeta.clampReasons,
      cache: {
        hit: !!cached,
        key: cacheKey,
        ageMs: cached ? Date.now() - cached.createdAt : 0,
      },
      previewUpdatedAt: responseMeta.previewUpdatedAt ?? null,
      w_m: (state.sag_nm ?? 16) * 1e-9,
      rhoMetric: "harmonic",
      physics: {
        gammaGeo: state.gammaGeo,
        qSpoiling: state.qSpoilingFactor,
        sectorStrobing: sectorsResolved,
        sectorCount: state.sectorCount,
        concurrentSectors: state.concurrentSectors,
      },
      data: {
        length: fieldDetached.length,
        x: fieldDetached.x,
        y: fieldDetached.y,
        z: fieldDetached.z,
        nx: fieldDetached.nx,
        ny: fieldDetached.ny,
        nz: fieldDetached.nz,
        rho: fieldDetached.rho,
        bell: fieldDetached.bell,
        sgn: fieldDetached.sgn,
        disp: fieldDetached.disp,
        dA: fieldDetached.dA,
      },
    });
  } catch (e) {
    console.error("field geometry endpoint error:", e);
    res.status(400).json({ error: "field geometry sampling failed" });
  }
}

const parseNumberParam = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return fallback;
};

const parseBooleanParam = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (["1", "true", "yes", "on"].includes(lowered)) return true;
    if (["0", "false", "no", "off"].includes(lowered)) return false;
  }
  return fallback;
};

const wantsBinaryResponse = (req: Request, query: Record<string, unknown>) => {
  if (parseBooleanParam(query.binary, false)) return true;
  const formatRaw =
    typeof query.format === "string"
      ? query.format
      : typeof query.encoding === "string"
        ? query.encoding
        : undefined;
  if (typeof formatRaw === "string") {
    const format = formatRaw.toLowerCase();
    if (format === "raw" || format === "bin" || format === "binary") return true;
  }
  const accept = req.get("accept")?.toLowerCase() ?? "";
  return accept.includes("application/octet-stream") || accept.includes("application/x-helix-brick");
};

const writeBinaryPayload = (res: Response, header: object, buffers: Array<Buffer | undefined>) => {
  const headerBytes = Buffer.from(JSON.stringify(header));
  const headerLength = headerBytes.length;
  const padding = (4 - (headerLength % 4)) % 4;
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32LE(headerLength, 0);
  res.setHeader("Content-Type", "application/octet-stream");
  res.write(prefix);
  res.write(headerBytes);
  if (padding) {
    res.write(Buffer.alloc(padding));
  }
  for (const buffer of buffers) {
    if (buffer && buffer.byteLength) {
      res.write(buffer);
    }
  }
  res.end();
};

const parseDimsParam = (value: unknown, fallback: [number, number, number]) => {
  if (Array.isArray(value) && value.length === 3) {
    const tuple = value.map((v) => parseNumberParam(v, NaN));
    if (tuple.every((n) => Number.isFinite(n) && n > 0)) return tuple as [number, number, number];
  }
  if (typeof value === "string") {
    const normalized = value.replace(/x/gi, ",");
    const parts = normalized.split(",").map((p) => parseNumberParam(p.trim(), NaN));
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n) && n > 0)) {
      return parts as [number, number, number];
    }
  }
  return fallback;
};

const parseVec3Param = (value: unknown, fallback: Vec3): Vec3 => {
  if (Array.isArray(value) && value.length === 3) {
    const tuple = value.map((v) => parseNumberParam(v, NaN));
    if (tuple.every((n) => Number.isFinite(n))) return tuple as Vec3;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/x/gi, ",");
    const parts = normalized.split(",").map((segment) => parseNumberParam(segment.trim(), NaN));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]] as Vec3;
    }
  }
  return fallback;
};

const parseVec3ParamOptional = (value: unknown): Vec3 | null => {
  if (value === undefined || value === null) return null;
  const sentinel: Vec3 = [Number.NaN, Number.NaN, Number.NaN];
  const parsed = parseVec3Param(value, sentinel);
  return parsed.every((component) => Number.isFinite(component)) ? parsed : null;
};

const normalizeVec3OrNull = (value: Vec3 | null | undefined): Vec3 | null => {
  if (!value) return null;
  const [x, y, z] = value;
  const mag = Math.hypot(x, y, z);
  if (!Number.isFinite(mag) || mag === 0) return null;
  return [x / mag, y / mag, z / mag];
};

const clampVecRange = (vec: Vec3, minVal: number, maxVal: number): [number, number, number] => [
  Math.max(minVal, Math.min(maxVal, vec[0] ?? 0)),
  Math.max(minVal, Math.min(maxVal, vec[1] ?? 0)),
  Math.max(minVal, Math.min(maxVal, vec[2] ?? 0)),
] as [number, number, number];

const DEFAULT_STAMP_CENTER: Vec3 = [0.82, 0.18, 0.72];
const DEFAULT_STAMP_SIZE: Vec3 = [0.05, 0.05, 0.05];

const parseStampBlendParam = (value: unknown): CurvDebugStamp["blend"] => {
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "set" || lowered === "max" || lowered === "add") {
      return lowered as CurvDebugStamp["blend"];
    }
  }
  return undefined;
};

const parseStampShapeParam = (value: unknown): CurvDebugStamp["shape"] => {
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "box" || lowered === "sphere") {
      return lowered as CurvDebugStamp["shape"];
    }
  }
  return undefined;
};

const normalizeCurvatureStampRequest = (input: Record<string, unknown> | null | undefined): CurvDebugStamp | null => {
  if (!input) return null;
  const enabled = parseBooleanParam(input.enabled, true);
  const centerRaw = parseVec3Param(input.center, DEFAULT_STAMP_CENTER);
  const sizeRaw = parseVec3Param(input.size, DEFAULT_STAMP_SIZE);
  const value = parseNumberParam(input.value, 1);
  const blend = parseStampBlendParam(input.blend);
  const shape = parseStampShapeParam(input.shape);
  const stamp: CurvDebugStamp = {
    enabled,
    center: clampVecRange(centerRaw, 0, 1),
    size: clampVecRange(sizeRaw, 1e-3, 1),
    value,
  };
  if (blend) stamp.blend = blend;
  if (shape) stamp.shape = shape;
  return stamp;
};

const dimsForQuality = (quality: string | undefined): [number, number, number] => {
  switch ((quality ?? "").toLowerCase()) {
    case "low":
      return [96, 96, 96];
    case "medium":
      return [128, 128, 128];
    case "high":
      return [160, 160, 160];
    default:
      return [128, 128, 128];
  }
};

const dimsCapForQuality = (quality: string | undefined): [number, number, number] => {
  switch ((quality ?? "").toLowerCase()) {
    case "low":
      return [128, 128, 128];
    case "medium":
      return [256, 256, 256];
    case "high":
      return [1400, 600, 450];
    default:
      return [256, 256, 256];
  }
};

const iterationsForQuality = (quality: string | undefined): number => {
  switch ((quality ?? "").toLowerCase()) {
    case "low":
      return 80;
    case "medium":
      return 140;
    case "high":
      return 220;
    default:
      return 140;
  }
};

const stepsForQuality = (quality: string | undefined): number => {
  switch ((quality ?? "").toLowerCase()) {
    case "low":
      return 16;
    case "medium":
      return 32;
    case "high":
      return 64;
    default:
      return 32;
  }
};

const clampDimsToQuality = (
  dims: [number, number, number],
  maxDims: [number, number, number],
): [number, number, number] => [
  Math.min(dims[0], maxDims[0]),
  Math.min(dims[1], maxDims[1]),
  Math.min(dims[2], maxDims[2]),
];

const clampStepsToQuality = (steps: number, maxSteps: number) =>
  Number.isFinite(maxSteps) ? Math.min(steps, maxSteps) : steps;

type GrBrickCacheEntry<T> = { createdAt: number; key: string; brick: T };

const GR_BRICK_CACHE_TTL_MS = Math.max(
  0,
  parseNumberParam(process.env.GR_BRICK_CACHE_TTL_MS, 4000),
);
const GR_BRICK_CACHE_MAX = Math.max(
  1,
  Math.floor(parseNumberParam(process.env.GR_BRICK_CACHE_MAX, 4)),
);

const grInitialCache = new Map<string, GrBrickCacheEntry<GrInitialBrick>>();
const grEvolveCache = new Map<string, GrBrickCacheEntry<GrEvolveBrick>>();

const readGrBrickCache = <T>(
  cache: Map<string, GrBrickCacheEntry<T>>,
  key: string,
): GrBrickCacheEntry<T> | null => {
  const cached = cache.get(key);
  if (!cached) return null;
  const now = Date.now();
  if (GR_BRICK_CACHE_TTL_MS > 0 && now - cached.createdAt > GR_BRICK_CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  cached.createdAt = now;
  cache.delete(key);
  cache.set(key, cached);
  return cached;
};

const writeGrBrickCache = <T>(
  cache: Map<string, GrBrickCacheEntry<T>>,
  entry: GrBrickCacheEntry<T>,
) => {
  if (cache.has(entry.key)) {
    cache.delete(entry.key);
  }
  while (cache.size >= GR_BRICK_CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
    else break;
  }
  cache.set(entry.key, entry);
};

const resolvePipelineMatterInputs = (state: EnergyPipelineState) => {
  const fallbackHull = { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
  const hull = state.hull ?? fallbackHull;
  const dutyRaw = state.dutyEffective_FR ?? (state as any).dutyEffectiveFR;
  return {
    dutyFR: parseNumberParam(dutyRaw, 0.0025),
    q: parseNumberParam(state.qSpoilingFactor, 1),
    gammaGeo: parseNumberParam(state.gammaGeo, 26),
    gammaVdB: parseNumberParam(state.gammaVanDenBroeck, 1),
    zeta: parseNumberParam(state.zeta, 0.84),
    phase01: parseNumberParam(state.phase01, 0),
    hull: {
      Lx_m: Number.isFinite(hull.Lx_m) ? hull.Lx_m : fallbackHull.Lx_m,
      Ly_m: Number.isFinite(hull.Ly_m) ? hull.Ly_m : fallbackHull.Ly_m,
      Lz_m: Number.isFinite(hull.Lz_m) ? hull.Lz_m : fallbackHull.Lz_m,
      wallThickness_m: Number.isFinite(hull.wallThickness_m)
        ? (hull.wallThickness_m as number)
        : fallbackHull.wallThickness_m,
    },
  };
};

const resolveStressEnergyPressureFactor = (state: EnergyPipelineState) => {
  const stress =
    (state as any)?.warp?.stressEnergyTensor ?? (state as any)?.stressEnergy;
  const t00 = Number(stress?.T00);
  const t11 = Number(stress?.T11);
  if (!Number.isFinite(t00) || !Number.isFinite(t11) || t00 === 0) return undefined;
  return t11 / t00;
};

const buildGrGeometrySignature = (
  resolved: GeometryResolution,
  state: EnergyPipelineState,
  geometryKindRaw?: string | null,
) => ({
  kind: typeof geometryKindRaw === "string" ? geometryKindRaw : null,
  meshHash: resolved.meshHash ?? null,
  previewUpdatedAt: resolved.previewUpdatedAt ?? null,
  warpGeometryAssetId: state.warpGeometryAssetId ?? null,
});

const RADIAL_MAP_DEFAULTS = { nTheta: 72, nPhi: 36, maxSamples: 25000 };

const isArrayLikeView = (view: ArrayBufferView): view is ArrayBufferView & ArrayLike<number> =>
  typeof (view as { length?: unknown }).length === "number";

const toFloat32Array = (value: unknown): Float32Array | null => {
  if (!value) return null;
  if (value instanceof Float32Array) return value;
  if (ArrayBuffer.isView(value)) {
    if (!isArrayLikeView(value)) return null;
    const out = new Float32Array(value.length);
    for (let i = 0; i < value.length; i += 1) {
      out[i] = Number(value[i] ?? 0);
    }
    return out;
  }
  if (Array.isArray(value)) {
    const out = new Float32Array(value.length);
    for (let i = 0; i < value.length; i += 1) {
      out[i] = Number(value[i] ?? 0);
    }
    return out;
  }
  return null;
};

const pickPreviewPositions = (preview: HullPreviewPayload | null | undefined) => {
  if (!preview) return null;
  const candidates = [
    preview.lodCoarse,
    preview.mesh?.coarseLod,
    preview.lodFull,
    preview.mesh?.fullLod,
    ...(preview.lods ?? []),
    ...(preview.mesh?.lods ?? []),
  ];
  for (const lod of candidates) {
    const positionsRaw = lod?.indexedGeometry?.positions;
    const positions = toFloat32Array(positionsRaw);
    if (positions && positions.length >= 6) {
      return {
        positions,
        basis: preview.mesh?.basis ?? preview.basis,
        scale: preview.scale,
        targetDims: preview.targetDims ?? preview.hullMetrics?.dims_m ?? null,
      };
    }
  }
  return null;
};

const buildRadialMapFromPreview = (
  preview: HullPreviewPayload | null | undefined,
  targetDims: { Lx_m: number; Ly_m: number; Lz_m: number } | null,
) => {
  const picked = pickPreviewPositions(preview);
  if (!picked) return null;
  const transformed = applyHullBasisToPositions(picked.positions, {
    basis: picked.basis,
    extraScale: picked.scale,
    targetDims: targetDims ?? picked.targetDims ?? undefined,
  }).positions;
  return buildHullRadialMapFromPositions(transformed, RADIAL_MAP_DEFAULTS);
};

const buildRadialMapFromWarpGeometry = (warpGeometry: any, geometryKind?: string | null) => {
  if (!warpGeometry) return null;
  if (geometryKind === "sdf") {
    const samples = Array.isArray(warpGeometry.sdf?.samples) ? warpGeometry.sdf.samples : null;
    if (!samples || samples.length === 0) return null;
    const coords: number[] = [];
    for (const sample of samples) {
      const p = Array.isArray(sample?.p) ? sample.p : null;
      if (!p || p.length < 3) continue;
      const x = Number(p[0]);
      const y = Number(p[1]);
      const z = Number(p[2]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      coords.push(x, y, z);
    }
    return coords.length ? buildHullRadialMapFromPositions(coords, RADIAL_MAP_DEFAULTS) : null;
  }
  if (geometryKind === "radial") {
    const samples = Array.isArray(warpGeometry.radial?.samples) ? warpGeometry.radial.samples : null;
    if (!samples || samples.length === 0) return null;
    const coords: number[] = [];
    for (const sample of samples) {
      const r = Number(sample?.r);
      if (!Number.isFinite(r) || r <= 0) continue;
      const theta = Number(sample?.theta ?? 0);
      const phi = Number(sample?.phi ?? 0);
      const cosPhi = Math.cos(phi);
      coords.push(Math.cos(theta) * cosPhi * r, Math.sin(phi) * r, Math.sin(theta) * cosPhi * r);
    }
    return coords.length ? buildHullRadialMapFromPositions(coords, RADIAL_MAP_DEFAULTS) : null;
  }
  return null;
};

const resolveRadialMapForBrick = (
  state: any,
  preview: HullPreviewPayload | null | undefined,
  targetDims: { Lx_m: number; Ly_m: number; Lz_m: number } | null,
  geometryKind?: string | null,
) => {
  const kind = geometryKind === "sdf" || geometryKind === "radial" ? geometryKind : "ellipsoid";
  if (kind === "ellipsoid") return null;
  return buildRadialMapFromWarpGeometry(state?.warpGeometry, kind) ?? buildRadialMapFromPreview(preview, targetDims);
};

const wrap01 = (value: number) => {
  const n = value % 1;
  return n < 0 ? n + 1 : n;
};

const azimuth01 = (x: number, z: number) =>
  wrap01((Math.atan2(z, x) / (2 * Math.PI)) + 0.5);

const clampInt = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
};

const resolveRadialMapWithSource = (
  state: any,
  preview: HullPreviewPayload | null | undefined,
  targetDims: { Lx_m: number; Ly_m: number; Lz_m: number } | null,
  geometryKind?: string | null,
) => {
  const kind =
    geometryKind === "sdf" || geometryKind === "radial" ? geometryKind : "ellipsoid";
  if (kind === "ellipsoid") {
    return { radialMap: null, source: "none" as const };
  }
  const fromWarp = buildRadialMapFromWarpGeometry(state?.warpGeometry, kind);
  if (fromWarp) {
    return { radialMap: fromWarp, source: "warp-geometry" as const };
  }
  const fromPreview = buildRadialMapFromPreview(preview, targetDims);
  if (fromPreview) {
    return { radialMap: fromPreview, source: "preview" as const };
  }
  return { radialMap: null, source: "none" as const };
};

type RegionGridConfig = GrRegionStats["grid"];

const resolveRegionGridConfig = (input: {
  hull: { Lx_m: number; Ly_m: number; Lz_m: number };
  strobeHz: number;
  sectorPeriod_s: number;
  targetRegions?: number;
  thetaBins?: number;
  longBins?: number;
  phaseBins?: number;
  radialBins?: number;
  longAxis?: "x" | "y" | "z";
  phase01?: number;
}): RegionGridConfig => {
  const axis = input.longAxis ?? "x";
  const longLengthRaw =
    axis === "y" ? input.hull.Ly_m : axis === "z" ? input.hull.Lz_m : input.hull.Lx_m;
  const longLength = Number.isFinite(longLengthRaw) ? Math.max(0, longLengthRaw) : 0;
  let strobePeriod_s = Number.isFinite(input.sectorPeriod_s) ? input.sectorPeriod_s : NaN;
  let strobeHz = Number.isFinite(input.strobeHz) ? input.strobeHz : NaN;
  if (!(strobePeriod_s > 0)) {
    strobePeriod_s = strobeHz > 0 ? 1 / strobeHz : 1e-3;
  }
  if (!(strobeHz > 0)) {
    strobeHz = strobePeriod_s > 0 ? 1 / strobePeriod_s : 0;
  }
  const lightCrossing_s = longLength > 0 ? longLength / C : 0;
  const autoLongBins = Math.max(1, Math.ceil(lightCrossing_s / Math.max(1e-9, strobePeriod_s)));
  const longBins = clampInt(input.longBins ?? autoLongBins, 1, 512);
  const phaseBins = clampInt(input.phaseBins ?? 8, 1, 256);
  const radialBins = clampInt(input.radialBins ?? 1, 1, 128);
  const targetRegions =
    input.targetRegions && input.targetRegions > 0 ? Math.floor(input.targetRegions) : undefined;
  const autoThetaBins = targetRegions
    ? Math.max(1, Math.ceil(targetRegions / Math.max(1, longBins * phaseBins * radialBins)))
    : 20;
  const thetaBins = clampInt(input.thetaBins ?? autoThetaBins, 1, 1024);
  const totalRegions = thetaBins * longBins * phaseBins * radialBins;
  const phase01 = Number.isFinite(input.phase01 as number) ? wrap01(input.phase01 as number) : undefined;
  const phaseBin =
    phase01 != null ? Math.min(phaseBins - 1, Math.max(0, Math.floor(phase01 * phaseBins))) : undefined;

  return {
    thetaBins,
    longBins,
    phaseBins,
    radialBins,
    totalRegions,
    longAxis: axis,
    targetRegions,
    strobeHz,
    strobePeriod_s,
    lightCrossing_s,
    phase01,
    phaseBin,
  };
};

type RegionAccumulator = {
  neg: number;
  pos: number;
  volume: number;
  voxels: number;
  cx: number;
  cy: number;
  cz: number;
};

const decodeRegionIndices = (id: number, grid: RegionGridConfig) => {
  const theta = id % grid.thetaBins;
  let rem = Math.floor(id / grid.thetaBins);
  const long = rem % grid.longBins;
  rem = Math.floor(rem / grid.longBins);
  const radial = rem % grid.radialBins;
  const phase = Math.floor(rem / grid.radialBins);
  return { theta, long, radial, phase };
};

const buildRegionKey = (indices: { theta: number; long: number; phase: number; radial: number }) =>
  `t${indices.theta}-l${indices.long}-p${indices.phase}-r${indices.radial}`;

const computeRegionStats = (input: {
  dims: [number, number, number];
  bounds: { min: Vec3; max: Vec3 };
  hullAxes: Vec3;
  hullWall: number;
  radialMap: HullRadialMap | null;
  rho: Float32Array;
  detGamma?: Float32Array | null;
  grid: RegionGridConfig;
  maxVoxels: number;
}) => {
  const [nx, ny, nz] = input.dims;
  const dx = (input.bounds.max[0] - input.bounds.min[0]) / Math.max(1, nx);
  const dy = (input.bounds.max[1] - input.bounds.min[1]) / Math.max(1, ny);
  const dz = (input.bounds.max[2] - input.bounds.min[2]) / Math.max(1, nz);
  const voxelSize: Vec3 = [dx, dy, dz];
  const totalVoxels = Math.max(0, nx * ny * nz);
  const target = Number.isFinite(input.maxVoxels) ? Math.max(1, Math.floor(input.maxVoxels)) : totalVoxels;
  const stride = totalVoxels > target ? Math.max(1, Math.floor(Math.cbrt(totalVoxels / target))) : 1;
  const strideScale = stride * stride * stride;
  const shellWidth = Math.max(input.hullWall, 1e-3);
  const axisIndex =
    input.grid.longAxis === "y" ? 1 : input.grid.longAxis === "z" ? 2 : 0;
  const axisMin = input.bounds.min[axisIndex];
  const axisSpan = input.bounds.max[axisIndex] - input.bounds.min[axisIndex];
  const phaseIdx =
    typeof input.grid.phaseBin === "number" && input.grid.phaseBin >= 0
      ? Math.min(input.grid.phaseBins - 1, input.grid.phaseBin)
      : 0;

  const regions: RegionAccumulator[] = Array.from(
    { length: Math.max(1, input.grid.totalRegions) },
    () => ({ neg: 0, pos: 0, volume: 0, voxels: 0, cx: 0, cy: 0, cz: 0 }),
  );

  let negTotal = 0;
  let posTotal = 0;
  let negCx = 0;
  let negCy = 0;
  let negCz = 0;

  let idx = 0;
  for (let z = 0; z < nz; z += stride) {
    const pz = input.bounds.min[2] + (z + 0.5) * dz;
    for (let y = 0; y < ny; y += stride) {
      const py = input.bounds.min[1] + (y + 0.5) * dy;
      for (let x = 0; x < nx; x += stride) {
        const px = input.bounds.min[0] + (x + 0.5) * dx;
        idx = x + nx * (y + ny * z);
        const rho = input.rho[idx] ?? 0;
        if (!Number.isFinite(rho)) continue;
        const detRaw = input.detGamma ? input.detGamma[idx] : 1;
        const det = Number.isFinite(detRaw) && detRaw > 0 ? Math.sqrt(detRaw) : 1;
        const volume = dx * dy * dz * det * strideScale;

        const axisCoord = axisSpan > 0 ? (axisIndex === 0 ? px : axisIndex === 1 ? py : pz) : 0;
        const long01 = axisSpan > 0 ? (axisCoord - axisMin) / axisSpan : 0.5;
        const longIdx = Math.min(
          input.grid.longBins - 1,
          Math.max(0, Math.floor(clamp01(long01) * input.grid.longBins)),
        );

        const theta01 = azimuth01(px, pz);
        const thetaIdx = Math.min(
          input.grid.thetaBins - 1,
          Math.max(0, Math.floor(theta01 * input.grid.thetaBins)),
        );

        let radialIdx = 0;
        if (input.grid.radialBins > 1) {
          const pLen = Math.hypot(px, py, pz);
          const dir: Vec3 =
            pLen > 1e-9 ? ([px / pLen, py / pLen, pz / pLen] as Vec3) : [0, 0, 0];
          const radius = resolveHullRadius(dir, input.hullAxes, input.radialMap);
          const centerDist = pLen - radius;
          const radial01 = clamp01(0.5 + centerDist / Math.max(1e-6, shellWidth * 2));
          radialIdx = Math.min(
            input.grid.radialBins - 1,
            Math.max(0, Math.floor(radial01 * input.grid.radialBins)),
          );
        }

        const regionId =
          (((phaseIdx * input.grid.radialBins + radialIdx) * input.grid.longBins + longIdx) *
            input.grid.thetaBins) +
          thetaIdx;
        const region = regions[regionId];
        if (!region) continue;

        const neg = Math.max(-rho, 0) * volume;
        const pos = Math.max(rho, 0) * volume;
        region.neg += neg;
        region.pos += pos;
        region.volume += volume;
        region.voxels += 1;
        if (neg > 0) {
          region.cx += neg * px;
          region.cy += neg * py;
          region.cz += neg * pz;
          negCx += neg * px;
          negCy += neg * py;
          negCz += neg * pz;
        }
        negTotal += neg;
        posTotal += pos;
      }
    }
  }

  const denom = negTotal + posTotal;
  const negFraction = denom > 0 ? negTotal / denom : 0;
  const negCentroid =
    negTotal > 0 ? ([negCx / negTotal, negCy / negTotal, negCz / negTotal] as Vec3) : null;
  let contractionVector: Vec3 | null = null;
  if (negCentroid) {
    const len = Math.hypot(negCentroid[0], negCentroid[1], negCentroid[2]);
    if (len > 1e-6) {
      contractionVector = [
        negCentroid[0] / len,
        negCentroid[1] / len,
        negCentroid[2] / len,
      ];
    }
  }

  const topRegions = regions
    .map((region, id) => ({ region, id }))
    .filter(({ region }) => region.voxels > 0 && (region.neg > 0 || region.pos > 0))
    .sort((a, b) => b.region.neg - a.region.neg)
    .map(({ region, id }) => {
      const indices = decodeRegionIndices(id, input.grid);
      const negDenom = region.neg + region.pos;
      const centroid =
        region.neg > 0
          ? ([region.cx / region.neg, region.cy / region.neg, region.cz / region.neg] as Vec3)
          : null;
      return {
        id,
        key: buildRegionKey(indices),
        indices,
        voxelCount: region.voxels,
        volume: region.volume,
        negEnergy: region.neg,
        posEnergy: region.pos,
        negFraction: negDenom > 0 ? region.neg / negDenom : 0,
        negShare: negTotal > 0 ? region.neg / negTotal : 0,
        centroid,
      };
    });

  return {
    voxelSize,
    voxelCount: totalVoxels,
    stride,
    summary: {
      negEnergy: negTotal,
      posEnergy: posTotal,
      negFraction,
      contractionVector,
      contractionMagnitude: negFraction,
    },
    topRegions,
  };
};

type InvariantWallMetrics = {
  source: "kretschmann" | "ricci4";
  detected: boolean;
  p98: number;
  threshold: number;
  bandMin: number;
  bandMax: number;
  sampleCount: number;
  voxelCount: number;
  voxelFraction: number;
  center: Vec3 | null;
  radiusMin?: number;
  radiusMax?: number;
  radiusMean?: number;
  thickness?: number;
  wallFraction: number;
  bandFraction: number;
};

const percentileSamples = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const q = clamp01(p);
  const index = Math.floor((sorted.length - 1) * q);
  return sorted[index] ?? 0;
};

const computeInvariantWallMetrics = (input: {
  dims: [number, number, number];
  bounds: { min: Vec3; max: Vec3 };
  values: Float32Array;
  source: "kretschmann" | "ricci4";
  useAbs: boolean;
  wallFraction: number;
  bandFraction: number;
  sampleMax: number;
  maxVoxels: number;
}): InvariantWallMetrics => {
  const [nx, ny, nz] = input.dims;
  const total = Math.max(0, nx * ny * nz);
  const sampleMax = Math.max(1, Math.floor(input.sampleMax));
  const sampleStride = Math.max(1, Math.floor(total / sampleMax));
  const wallFraction = clamp01(input.wallFraction);
  const bandFraction = Math.max(0, clamp01(input.bandFraction));
  const samples: number[] = [];
  const nonZeroSamples: number[] = [];
  for (let i = 0; i < total; i += sampleStride) {
    const raw = input.values[i];
    if (!Number.isFinite(raw)) continue;
    const value = input.useAbs ? Math.abs(raw) : raw;
    samples.push(value);
    if (value > 0) nonZeroSamples.push(value);
  }
  const samplePool =
    nonZeroSamples.length >= 16 ? nonZeroSamples : samples;
  const p98 = percentileSamples(samplePool, 0.98);
  const threshold = p98 * wallFraction;
  const bandMin = threshold > 0 ? threshold * (1 - bandFraction) : 0;
  const bandMax = threshold > 0 ? threshold * (1 + bandFraction) : 0;

  const dx = (input.bounds.max[0] - input.bounds.min[0]) / Math.max(1, nx);
  const dy = (input.bounds.max[1] - input.bounds.min[1]) / Math.max(1, ny);
  const dz = (input.bounds.max[2] - input.bounds.min[2]) / Math.max(1, nz);
  const stride =
    total > input.maxVoxels
      ? Math.max(1, Math.floor(Math.cbrt(total / input.maxVoxels)))
      : 1;
  let sampled = 0;
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  let idx = 0;
  for (let z = 0; z < nz; z += stride) {
    const pz = input.bounds.min[2] + (z + 0.5) * dz;
    for (let y = 0; y < ny; y += stride) {
      const py = input.bounds.min[1] + (y + 0.5) * dy;
      for (let x = 0; x < nx; x += stride) {
        idx = x + nx * (y + ny * z);
        sampled += 1;
        const raw = input.values[idx];
        if (!Number.isFinite(raw)) continue;
        const value = input.useAbs ? Math.abs(raw) : raw;
        if (value < bandMin || value > bandMax) continue;
        count += 1;
        const px = input.bounds.min[0] + (x + 0.5) * dx;
        const py = input.bounds.min[1] + (y + 0.5) * dy;
        sumX += px;
        sumY += py;
        sumZ += pz;
      }
    }
  }

  const center: Vec3 | null =
    count > 0 ? ([sumX / count, sumY / count, sumZ / count] as Vec3) : null;
  let radiusMin = Number.POSITIVE_INFINITY;
  let radiusMax = 0;
  let radiusSum = 0;
  if (center) {
    for (let z = 0; z < nz; z += stride) {
      const pz = input.bounds.min[2] + (z + 0.5) * dz;
      for (let y = 0; y < ny; y += stride) {
        const py = input.bounds.min[1] + (y + 0.5) * dy;
        for (let x = 0; x < nx; x += stride) {
          idx = x + nx * (y + ny * z);
          const raw = input.values[idx];
          if (!Number.isFinite(raw)) continue;
          const value = input.useAbs ? Math.abs(raw) : raw;
          if (value < bandMin || value > bandMax) continue;
          const px = input.bounds.min[0] + (x + 0.5) * dx;
          const r = Math.hypot(px - center[0], py - center[1], pz - center[2]);
          if (r < radiusMin) radiusMin = r;
          if (r > radiusMax) radiusMax = r;
          radiusSum += r;
        }
      }
    }
  }

  const radiusMean = count > 0 ? radiusSum / count : 0;
  const thickness =
    Number.isFinite(radiusMin) && Number.isFinite(radiusMax) && radiusMax >= radiusMin
      ? radiusMax - radiusMin
      : 0;

  return {
    source: input.source,
    detected: count > 0 && threshold > 0,
    p98: Number.isFinite(p98) ? p98 : 0,
    threshold: Number.isFinite(threshold) ? threshold : 0,
    bandMin: Number.isFinite(bandMin) ? bandMin : 0,
    bandMax: Number.isFinite(bandMax) ? bandMax : 0,
    sampleCount: samples.length,
    voxelCount: count,
    voxelFraction: sampled > 0 ? count / sampled : 0,
    center,
    radiusMin: Number.isFinite(radiusMin) ? radiusMin : 0,
    radiusMax: Number.isFinite(radiusMax) ? radiusMax : 0,
    radiusMean: Number.isFinite(radiusMean) ? radiusMean : 0,
    thickness: Number.isFinite(thickness) ? thickness : 0,
    wallFraction,
    bandFraction,
  };
};

export function getCurvatureBrick(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
    const bounds: CurvBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET" ? req.query : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const wantsBinary = wantsBinaryResponse(req, query as Record<string, unknown>);
    const geometryKindRaw = typeof query.geometryKind === "string" ? query.geometryKind : state.warpGeometryKind;
    const radialMap = resolveRadialMapForBrick(state, preview, hull, geometryKindRaw);

    const qualityDims = dimsForQuality(typeof query.quality === "string" ? query.quality : undefined);
    const dims = parseDimsParam(query.dims, qualityDims);
    const phase01Raw = parseNumberParam(
      query.phase01,
      parseNumberParam(state.phase01, 0),
    );
    const phase01 = wrap01(phase01Raw);
    const sigmaSector = parseNumberParam(
      query.sigmaSector,
      parseNumberParam((state as any).sigmaSector, 0.05),
    );
    const splitEnabled = parseBooleanParam(
      query.splitEnabled,
      (state as any).splitEnabled ?? false,
    );
    const splitFrac = parseNumberParam(
      query.splitFrac,
      parseNumberParam((state as any).splitFrac, 0.6),
    );
    const dutyFRState = (state as any).dutyEffectiveFR ?? (state as any).dutyEffective_FR ?? state.dutyCycle;
    const dutyFR = parseNumberParam(query.dutyFR, parseNumberParam(dutyFRState, 0.0025));
    const tauLCDerived = hull ? Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / C : 0.000001;
    const tauLC = Math.max(parseNumberParam(query.tauLC_s, tauLCDerived), 1e-9);
    const modulationHzState = parseNumberParam(state.modulationFreq_GHz, 15) * 1e9;
    const TmDefault = modulationHzState > 0 ? 1 / modulationHzState : 1 / (15e9);
    const Tm = Math.max(parseNumberParam(query.Tm_s, TmDefault), 1e-15);
    const beta0 = parseNumberParam(query.beta0, 1);
    const betaMax = parseNumberParam(query.betaMax, 12);
    const zeta = parseNumberParam(query.zeta, 0.84);
    const q = parseNumberParam(query.q ?? state.qSpoilingFactor, state.qSpoilingFactor ?? 1);
    const gammaGeo = parseNumberParam(query.gammaGeo ?? state.gammaGeo, state.gammaGeo ?? 26);
    const gammaVdB = parseNumberParam(query.gammaVdB ?? state.gammaVanDenBroeck, state.gammaVanDenBroeck ?? 1e11);
    const ampBase = parseNumberParam(query.ampBase, 0);
    const clampQI = parseBooleanParam(query.clampQI, true);
    const edgeWeight = Math.max(0, Math.min(1, parseNumberParam(query.edgeWeight, 0)));
    const edgeSharpness = Math.max(parseNumberParam(query.edgeSharpness, 1.25), 0.1);
    const betaShift = Math.max(-1, Math.min(1, parseNumberParam(query.betaShift, 0)));
    const debugBlockValueRaw = parseNumberParam(query.debugBlockValue, Number.NaN);
    const debugBlockRadius = Math.max(0, Math.min(0.49, parseNumberParam(query.debugBlockRadius, 0)));
    const debugBlockCenterRaw = parseVec3Param(query.debugBlockCenter, [0.5, 0.5, 0.5]);

    const params: Partial<CurvBrickParams> = {
      dims,
      bounds,
      hullAxes: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
      hullWall: state.hull?.wallThickness_m ?? 0.45,
      radialMap: radialMap ?? undefined,
      phase01,
      sigmaSector,
      splitEnabled,
      splitFrac,
      dutyFR: Math.max(dutyFR, 1e-8),
      tauLC_s: tauLC,
      Tm_s: Tm,
      beta0,
      betaMax,
      zeta,
      q,
      gammaGeo,
      gammaVdB,
      ampBase,
      clampQI,
      edgeWeight,
      edgeSharpness,
      betaShift,
    };

    const overrideDriveDir = parseVec3ParamOptional(query.driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);
    if (driveDir) {
      params.driveDir = driveDir;
    }

    if (debugBlockRadius > 0 && Number.isFinite(debugBlockValueRaw)) {
      params.debugBlockRadius = debugBlockRadius;
      params.debugBlockValue = debugBlockValueRaw;
      params.debugBlockCenter = [
        Math.max(0, Math.min(1, debugBlockCenterRaw[0])),
        Math.max(0, Math.min(1, debugBlockCenterRaw[1])),
        Math.max(0, Math.min(1, debugBlockCenterRaw[2])),
      ] as Vec3;
    }

    const brick = buildCurvatureBrick(params);
    if (wantsBinary) {
      const binary = serializeBrickBinary(brick);
      writeBinaryPayload(res, binary.header, [binary.data, binary.qiMargin]);
      return;
    }
    const payload = serializeBrick(brick);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] curvature brick error:", err);
    const message = err instanceof Error ? err.message : "Failed to build curvature brick";
    res.status(500).json({ error: message });
  }
}

export function getStressEnergyBrick(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
    const bounds: StressEnergyBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET" ? req.query : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const wantsBinary = wantsBinaryResponse(req, query as Record<string, unknown>);
    const geometryKindRaw = typeof query.geometryKind === "string" ? query.geometryKind : state.warpGeometryKind;
    const radialMap = resolveRadialMapForBrick(state, preview, hull, geometryKindRaw);
    const qualityDims = dimsForQuality(typeof query.quality === "string" ? query.quality : undefined);
    const dims = parseDimsParam(query.dims, qualityDims);
    const phase01Raw = parseNumberParam(
      query.phase01,
      parseNumberParam(state.phase01, 0),
    );
    const phase01 = wrap01(phase01Raw);
    const sigmaSector = parseNumberParam(
      query.sigmaSector,
      parseNumberParam((state as any).sigmaSector, 0.05),
    );
    const splitEnabled = parseBooleanParam(
      query.splitEnabled,
      (state as any).splitEnabled ?? false,
    );
    const splitFrac = parseNumberParam(
      query.splitFrac,
      parseNumberParam((state as any).splitFrac, 0.6),
    );
    const dutyFRState = (state as any).dutyEffectiveFR ?? (state as any).dutyEffective_FR ?? state.dutyCycle;
    const dutyFR = parseNumberParam(query.dutyFR, parseNumberParam(dutyFRState, 0.0025));
    const q = parseNumberParam(query.q ?? state.qSpoilingFactor, state.qSpoilingFactor ?? 1);
    const gammaGeo = parseNumberParam(query.gammaGeo ?? state.gammaGeo, state.gammaGeo ?? 26);
    const gammaVdB = parseNumberParam(query.gammaVdB ?? state.gammaVanDenBroeck, state.gammaVanDenBroeck ?? 1e5);
    const ampBase = parseNumberParam(query.ampBase, 0);
    const zeta = parseNumberParam(query.zeta, 0.84);
    const overrideDriveDir = parseVec3ParamOptional(query.driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);

    const params: Partial<StressEnergyBrickParams> = {
      dims,
      bounds,
      hullAxes: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
      hullWall: state.hull?.wallThickness_m ?? 0.45,
      radialMap: radialMap ?? undefined,
      phase01,
      sigmaSector,
      splitEnabled,
      splitFrac,
      dutyFR: Math.max(dutyFR, 1e-8),
      q: Math.max(q, 1e-6),
      gammaGeo,
      gammaVdB,
      ampBase,
      zeta,
      driveDir: driveDir ?? undefined,
    };

    const brick = buildStressEnergyBrick(params);
    if (wantsBinary) {
      const binary = serializeStressEnergyBrickBinary(brick);
      writeBinaryPayload(res, binary.header, binary.buffers);
      return;
    }
    const payload = serializeStressEnergyBrick(brick);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] stress-energy brick error:", err);
    const message = err instanceof Error ? err.message : "Failed to build stress-energy brick";
    res.status(500).json({ error: message });
  }
}

export function getCasimirTileSummary(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? {
      Lx_m: 1007,
      Ly_m: 264,
      Lz_m: 173,
      wallThickness_m: 0.45,
    };
    const bounds: StressEnergyBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET"
      ? req.query
      : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const dimsRaw = parseDimsParam(query.dims, [32, 32, 32]);
    const dims = clampDimsToQuality(dimsRaw, [96, 96, 96]);
    const geometryKindRaw =
      typeof query.geometryKind === "string" ? query.geometryKind : state.warpGeometryKind;
    const radialMap = resolveRadialMapForBrick(state, preview, hull, geometryKindRaw);

    const phase01 = wrap01(parseNumberParam(state.phase01, 0));
    const sigmaSector = Math.max(
      0,
      parseNumberParam((state as any).sigmaSector, 0.05),
    );
    const splitEnabled = (state as any).splitEnabled ?? false;
    const splitFrac = clamp01(parseNumberParam((state as any).splitFrac, 0.6));
    const dutyFRState =
      (state as any).dutyEffectiveFR ?? (state as any).dutyEffective_FR ?? state.dutyCycle;
    const dutyFR = parseNumberParam(dutyFRState, 0.0025);
    const q = Math.max(0, parseNumberParam(state.qSpoilingFactor, 1));
    const gammaGeo = Math.max(0, parseNumberParam(state.gammaGeo, 26));
    const gammaVdB = Math.max(0, parseNumberParam(state.gammaVanDenBroeck, 1e5));
    const ampBase = parseNumberParam((state as any).ampBase, 0);
    const zeta = parseNumberParam(state.zeta, 0.84);
    const overrideDriveDir = parseVec3ParamOptional((query as any).driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);

    const params: Partial<StressEnergyBrickParams> = {
      dims,
      bounds,
      hullAxes: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
      hullWall: state.hull?.wallThickness_m ?? 0.45,
      radialMap: radialMap ?? undefined,
      phase01,
      sigmaSector,
      splitEnabled,
      splitFrac,
      dutyFR: Math.max(dutyFR, 1e-8),
      q: Math.max(q, 1e-6),
      gammaGeo,
      gammaVdB,
      ampBase,
      zeta,
      driveDir: driveDir ?? undefined,
    };
    const brick = buildStressEnergyBrick(params);
    const mapping = brick.stats.mapping;
    const rhoAvg =
      mapping && Number.isFinite(mapping.rho_avg) ? mapping.rho_avg : null;
    const divRmsRaw = brick.stats.conservation?.divRms;
    const divRms = Number.isFinite(divRmsRaw) ? (divRmsRaw as number) : 0;
    const dutyEffectiveFR = clamp01(parseNumberParam(dutyFRState, 0));
    const sectorDutyRaw = Number.isFinite(state.dutyBurst)
      ? state.dutyBurst
      : Number.isFinite((state as any).localBurstFrac)
        ? (state as any).localBurstFrac
        : state.dutyCycle;
    const sectorDuty = clamp01(parseNumberParam(sectorDutyRaw, 0));
    const sectorCount = Math.max(
      1,
      Math.floor(Number.isFinite(state.sectorCount) ? state.sectorCount : 1),
    );
    const strobeHz = Math.max(0, Number(state.strobeHz ?? 0));
    const tileArea_cm2 = Number.isFinite(state.tileArea_cm2)
      ? Math.max(0, state.tileArea_cm2 as number)
      : 0;
    const N_tiles = Number.isFinite(state.N_tiles)
      ? Math.max(0, Math.floor(state.N_tiles))
      : 0;
    const qSpoil = Number.isFinite(state.qSpoilingFactor)
      ? Math.max(0, state.qSpoilingFactor as number)
      : 0;
    const voxelSize_m: Vec3 = [
      (bounds.max[0] - bounds.min[0]) / Math.max(1, dims[0]),
      (bounds.max[1] - bounds.min[1]) / Math.max(1, dims[1]),
      (bounds.max[2] - bounds.min[2]) / Math.max(1, dims[2]),
    ];

    const payload = {
      kind: "casimir-tile-summary",
      updatedAt: Date.now(),
      source: {
        brick: "stress-energy-brick",
        proxy: mapping?.proxy ?? true,
      },
      sample: {
        dims,
        bounds,
        voxelSize_m,
      },
      inputs: {
        sectorCount,
        sectorDuty,
        strobeHz,
        phase01,
        splitEnabled,
        splitFrac,
        sigmaSector,
        N_tiles,
        tileArea_cm2,
        gammaGeo,
        gammaVdB,
        qSpoil,
      },
      summary: {
        dutyEffectiveFR,
        rho_avg: rhoAvg,
        T00_min: brick.channels.t00.min,
        T00_max: brick.channels.t00.max,
        netFlux: brick.stats.netFlux,
        divRms,
        strobePhase: brick.stats.strobePhase,
      },
    };

    const parsed = casimirTileSummarySchema.parse(payload);
    res.json(parsed);
  } catch (err) {
    console.error("[helix-core] casimir tile summary error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to build Casimir tile summary";
    res.status(500).json({ error: "casimir-tile-summary-failed", message });
  }
}

export function getLapseBrick(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
    const bounds: LapseBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET" ? req.query : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const wantsBinary = wantsBinaryResponse(req, query as Record<string, unknown>);
    const geometryKindRaw = typeof query.geometryKind === "string" ? query.geometryKind : state.warpGeometryKind;
    const radialMap = resolveRadialMapForBrick(state, preview, hull, geometryKindRaw);

    const quality = typeof query.quality === "string" ? query.quality : undefined;
    const qualityDims = dimsForQuality(quality);
    const dims = parseDimsParam(query.dims, qualityDims);
    const phase01Raw = parseNumberParam(
      query.phase01,
      parseNumberParam(state.phase01, 0),
    );
    const phase01 = wrap01(phase01Raw);
    const sigmaSector = parseNumberParam(
      query.sigmaSector,
      parseNumberParam((state as any).sigmaSector, 0.05),
    );
    const splitEnabled = parseBooleanParam(
      query.splitEnabled,
      (state as any).splitEnabled ?? false,
    );
    const splitFrac = parseNumberParam(
      query.splitFrac,
      parseNumberParam((state as any).splitFrac, 0.6),
    );
    const dutyFRState = (state as any).dutyEffectiveFR ?? (state as any).dutyEffective_FR ?? state.dutyCycle;
    const dutyFR = parseNumberParam(query.dutyFR, parseNumberParam(dutyFRState, 0.0025));
    const q = parseNumberParam(query.q ?? state.qSpoilingFactor, state.qSpoilingFactor ?? 1);
    const gammaGeo = parseNumberParam(query.gammaGeo ?? state.gammaGeo, state.gammaGeo ?? 26);
    const gammaVdB = parseNumberParam(query.gammaVdB ?? state.gammaVanDenBroeck, state.gammaVanDenBroeck ?? 1e5);
    const ampBase = parseNumberParam(query.ampBase, 0);
    const zeta = parseNumberParam(query.zeta, 0.84);
    const iterations = Math.max(0, Math.floor(parseNumberParam(query.iterations, iterationsForQuality(quality))));
    const tolerance = Math.max(0, parseNumberParam(query.tolerance, 0));

    const overrideDriveDir = parseVec3ParamOptional(query.driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);

    const params: Partial<LapseBrickParams> = {
      dims,
      bounds,
      hullAxes: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
      hullWall: state.hull?.wallThickness_m ?? 0.45,
      radialMap: radialMap ?? undefined,
      phase01,
      sigmaSector,
      splitEnabled,
      splitFrac,
      dutyFR: Math.max(dutyFR, 1e-8),
      q: Math.max(q, 1e-6),
      gammaGeo,
      gammaVdB,
      ampBase,
      zeta,
      driveDir: driveDir ?? undefined,
      iterations,
      tolerance,
    };

    const brick = buildLapseBrick(params);
    if (wantsBinary) {
      const binary = serializeLapseBrickBinary(brick);
      writeBinaryPayload(res, binary.header, binary.buffers);
      return;
    }
    const payload = serializeLapseBrick(brick);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] lapse brick error:", err);
    const message = err instanceof Error ? err.message : "Failed to build lapse brick";
    res.status(500).json({ error: message });
  }
}

export function getGrRequest(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };
    const bounds = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2] as Vec3,
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2] as Vec3,
    };

    const query = req.method === "GET"
      ? req.query
      : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const quality = typeof query.quality === "string" ? query.quality : undefined;
    const qualityDims = dimsForQuality(quality);
    const dimsRaw = parseDimsParam(query.dims, qualityDims);
    const dimsCap = dimsCapForQuality(quality);
    const dims = clampDimsToQuality(dimsRaw, dimsCap);

    const inputs = state.grRequest ?? buildGrRequestPayload(state);
    res.json({
      kind: "gr-request",
      grid: { dims, bounds, ...(quality ? { quality } : {}) },
      inputs,
    });
  } catch (err) {
    console.error("[helix-core] gr request error:", err);
    const message = err instanceof Error ? err.message : "Failed to build gr request payload";
    res.status(500).json({ error: message });
  }
}

export async function getGrInitialBrick(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
    const bounds: GrInitialBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET" ? req.query : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const wantsBinary = wantsBinaryResponse(req, query as Record<string, unknown>);
    const geometryKindRaw = typeof query.geometryKind === "string" ? query.geometryKind : state.warpGeometryKind;
    const radialMap = resolveRadialMapForBrick(state, preview, hull, geometryKindRaw);

    const quality = typeof query.quality === "string" ? query.quality : undefined;
    const qualityDims = dimsForQuality(quality);
    const dimsRaw = parseDimsParam(query.dims, qualityDims);
    const dimsCap = dimsCapForQuality(quality);
    const dims = clampDimsToQuality(dimsRaw, dimsCap);
    const phase01 = parseNumberParam(query.phase01, 0);
    const sigmaSector = parseNumberParam(query.sigmaSector, 0.05);
    const splitEnabled = parseBooleanParam(query.splitEnabled, false);
    const splitFrac = parseNumberParam(query.splitFrac, 0.6);
    const dutyFRState =
      (state as any).dutyEffectiveFR ??
      (state as any).dutyEffective_FR ??
      state.dutyCycle;
    const dutyFR = parseNumberParam(query.dutyFR, parseNumberParam(dutyFRState, 0.0025));
    const q = parseNumberParam(query.q ?? state.qSpoilingFactor, state.qSpoilingFactor ?? 1);
    const gammaGeo = parseNumberParam(query.gammaGeo ?? state.gammaGeo, state.gammaGeo ?? 26);
    const gammaVdB = parseNumberParam(
      query.gammaVdB ?? state.gammaVanDenBroeck,
      state.gammaVanDenBroeck ?? 1e5,
    );
    const ampBase = parseNumberParam(query.ampBase, 0);
    const zeta = parseNumberParam(query.zeta, 0.84);
    const iterations = Math.max(
      0,
      Math.floor(parseNumberParam(query.iterations, iterationsForQuality(quality))),
    );
    const tolerance = Math.max(0, parseNumberParam(query.tolerance, 0));
    const includeExtra = parseBooleanParam(query.includeExtra, false);
    const includeMatter = parseBooleanParam(query.includeMatter, includeExtra);
    const includeKij = parseBooleanParam(query.includeKij, includeExtra);

    const overrideDriveDir = parseVec3ParamOptional(query.driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);     
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);    

    const hullAxes: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];       
    const hullWall = state.hull?.wallThickness_m ?? 0.45;
    const dutyFRValue = Math.max(dutyFR, 1e-8);
    const qValue = Math.max(q, 1e-6);
    const pressureFactor = resolveStressEnergyPressureFactor(state);
    const sourceOptions =
      pressureFactor !== undefined ? { pressureFactor } : undefined;

    const sourceParams: Partial<StressEnergyBrickParams> = {
      dims,
      bounds,
      hullAxes,
      hullWall,
      radialMap: radialMap ?? undefined,
      phase01,
      sigmaSector,
      splitEnabled,
      splitFrac,
      dutyFR: dutyFRValue,
      q: qValue,
      gammaGeo,
      gammaVdB,
      ampBase,
      zeta,
      driveDir: driveDir ?? undefined,
    };

    const geometrySig = buildGrGeometrySignature(resolved, state, geometryKindRaw);
    const sourceCacheKey = {
      phase01,
      sigmaSector,
      splitEnabled,
      splitFrac,
      dutyFR: dutyFRValue,
      q: qValue,
      gammaGeo,
      gammaVdB,
      ampBase,
      zeta,
      pressureFactor: pressureFactor ?? null,
      driveDir: driveDir ?? null,
      hullAxes,
      hullWall,
    };
    const cacheKey = JSON.stringify({
      dims,
      bounds,
      iterations,
      tolerance,
      includeExtra,
      includeMatter,
      includeKij,
      source: sourceCacheKey,
      geometry: geometrySig,
    });

    const initialParams: Partial<GrInitialBrickParams> = {
      dims,
      bounds,
      iterations,
      tolerance,
      includeExtra,
      includeMatter,
      includeKij,
      sourceParams,
      sourceOptions,
    };

    const cached = readGrBrickCache(grInitialCache, cacheKey);
    let initialBrick = cached?.brick;
    if (!initialBrick) {
      if (isGrWorkerEnabled()) {
        try {
          initialBrick = await runGrInitialBrickInWorker(initialParams);
        } catch (err) {
          console.warn("[helix-core] gr-initial worker failed:", err);
        }
      }
      if (!initialBrick) {
        initialBrick = buildGrInitialBrick(initialParams);
      }
      writeGrBrickCache(grInitialCache, {
        key: cacheKey,
        createdAt: Date.now(),
        brick: initialBrick,
      });
    }

    if (initialBrick.stats.status === "NOT_CERTIFIED") {
      const fallback = buildLapseBrick({
        ...sourceParams,
        iterations,
        tolerance,
      });
      const fallbackMeta = {
        status: "NOT_CERTIFIED",
        reason: initialBrick.stats.reason ?? "constraint_solve_failed",
        fallback: "gr-initial-brick",
      };
      fallback.meta =
        fallback.meta && typeof fallback.meta === "object"
          ? { ...(fallback.meta as Record<string, unknown>), ...fallbackMeta }
          : fallbackMeta;
      if (wantsBinary) {
        const binary = serializeLapseBrickBinary(fallback);
        writeBinaryPayload(res, binary.header, binary.buffers);
        return;
      }
      const payload = serializeLapseBrick(fallback);
      res.json(payload);
      return;
    }

    if (wantsBinary) {
      const binary = serializeGrInitialBrickBinary(initialBrick);
      writeBinaryPayload(res, binary.header, binary.buffers);
      return;
    }
    const payload = serializeGrInitialBrick(initialBrick);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] gr-initial brick error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to build gr-initial brick";
    res.status(500).json({ error: message });
  }
}

export async function getGrEvolveBrick(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 1173, wallThickness_m: 0.45 };
    const bounds: GrEvolveBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET" ? req.query : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const wantsBinary = wantsBinaryResponse(req, query as Record<string, unknown>);
    const quality = typeof query.quality === "string" ? query.quality : undefined;
    const qualityDims = dimsForQuality(quality);
    const dimsRaw = parseDimsParam(query.dims, qualityDims);
    const dimsCap = dimsCapForQuality(quality);
    const dims = clampDimsToQuality(dimsRaw, dimsCap);
    const time_s = parseNumberParam(query.time_s, parseNumberParam(query.time, 0));
    const dt_s = parseNumberParam(query.dt_s, parseNumberParam(query.dt, 0));
    const stepsRaw = Math.max(0, Math.floor(parseNumberParam(query.steps, 0)));
    const steps = clampStepsToQuality(stepsRaw, stepsForQuality(quality));
    const iterations = Math.max(
      0,
      Math.floor(parseNumberParam(query.iterations, iterationsForQuality(quality))),
    );
    const tolerance = Math.max(0, parseNumberParam(query.tolerance, 0));
    const initialIterations = Math.max(
      0,
      Math.floor(parseNumberParam(query.initialIterations, iterations)),
    );
    const initialTolerance = Math.max(
      0,
      parseNumberParam(query.initialTolerance, tolerance),
    );
    const lapseKappa = Math.max(
      0,
      parseNumberParam(query.kappa, parseNumberParam(query.lapseKappa, 2)),
    );
    const shiftEta = Math.max(
      0,
      parseNumberParam(query.eta, parseNumberParam(query.shiftEta, 1)),
    );
    const shiftGamma = Math.max(
      0,
      parseNumberParam(query.shiftGamma, 0.75),
    );
    const koEps = Math.max(
      0,
      parseNumberParam(query.koEps, parseNumberParam(query.ko_eps, 0)),
    );
    const koTargetsRaw =
      typeof query.koTargets === "string"
        ? query.koTargets
        : typeof query.ko_targets === "string"
          ? query.ko_targets
          : undefined;
    const koTargets = koTargetsRaw === "all" ? "all" : "gauge";
    const shockModeRaw =
      typeof query.shockMode === "string"
        ? query.shockMode
        : typeof query.shock_mode === "string"
          ? query.shock_mode
          : undefined;
    const shockMode =
      shockModeRaw === "diagnostic" || shockModeRaw === "stabilize"
        ? shockModeRaw
        : shockModeRaw === "off"
          ? "off"
          : "off";
    const advectSchemeRaw =
      typeof query.advectScheme === "string"
        ? query.advectScheme
        : typeof query.advect_scheme === "string"
          ? query.advect_scheme
          : undefined;
    const advectScheme = advectSchemeRaw === "upwind1" ? "upwind1" : "centered";
    const advect = parseBooleanParam(query.advect, true);
    const includeExtra = parseBooleanParam(query.includeExtra, false);
    const includeMatter = parseBooleanParam(query.includeMatter, includeExtra);
    const includeKij = parseBooleanParam(query.includeKij, includeExtra);
    const invariantWallFraction = clamp01(
      parseNumberParam(query.invariantWallFraction, 0.25),
    );
    const invariantBandFraction = clamp01(
      parseNumberParam(query.invariantBandFraction, 0.2),
    );
    const invariantSampleMax = Math.max(
      1,
      Math.floor(parseNumberParam(query.invariantSampleMax, 50_000)),
    );
    const invariantPercentile = clamp01(
      parseNumberParam(query.invariantPercentile, 0.98),
    );
    const overrideDriveDir = parseVec3ParamOptional(query.driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);
    const orderRaw = Math.max(2, Math.floor(parseNumberParam(query.order, 2)));
    const order = orderRaw >= 4 ? 4 : 2;
    const boundaryRaw =
      typeof query.boundary === "string"
        ? query.boundary
        : typeof query.stencilBoundary === "string"
          ? query.stencilBoundary
          : undefined;
    const boundary = boundaryRaw === "periodic" ? "periodic" : "clamp";

    const pipelineInputs = resolvePipelineMatterInputs(state);
    const hullAxes: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];
    const hullWall = state.hull?.wallThickness_m ?? 0.45;
    const dutyFRValue = Math.max(pipelineInputs.dutyFR, 1e-8);
    const qValue = Math.max(pipelineInputs.q, 1e-6);
    const pressureFactor = resolveStressEnergyPressureFactor(state);
    const sourceOptions =
      pressureFactor !== undefined ? { pressureFactor } : undefined;
    const sourceParams: Partial<StressEnergyBrickParams> = {
      bounds,
      hullAxes,
      hullWall,
      dutyFR: dutyFRValue,
      q: qValue,
      gammaGeo: pipelineInputs.gammaGeo,
      gammaVdB: pipelineInputs.gammaVdB,
      zeta: pipelineInputs.zeta,
      phase01: pipelineInputs.phase01,
      driveDir: driveDir ?? undefined,
    };
    const sourceCacheKey = {
      dutyFR: dutyFRValue,
      q: qValue,
      gammaGeo: pipelineInputs.gammaGeo,
      gammaVdB: pipelineInputs.gammaVdB,
      zeta: pipelineInputs.zeta,
      phase01: pipelineInputs.phase01,
      pressureFactor: pressureFactor ?? null,
      driveDir: driveDir ?? null,
      hullAxes,
      hullWall,
    };
    const geometrySig = buildGrGeometrySignature(
      resolved,
      state,
      typeof state.warpGeometryKind === "string" ? state.warpGeometryKind : null,
    );

    const params: Partial<GrEvolveBrickParams> = {
      dims,
      bounds,
      time_s,
      dt_s,
      steps,
      iterations,
      tolerance,
      koEps,
      koTargets,
      shockMode,
      advectScheme,
      useInitialData: true,
      initialIterations,
      initialTolerance,
      gauge: {
        lapseKappa,
        shiftEta,
        shiftGamma,
        advect,
      },
      stencils: {
        order,
        boundary,
      },
      includeExtra,
      includeMatter,
      includeKij,
      invariantWallFraction,
      invariantBandFraction,
      invariantSampleMax,
      invariantPercentile,
      sourceParams,
      sourceOptions,
    };

    const cacheKey = JSON.stringify({
      dims,
      bounds,
      time_s,
      dt_s,
      steps,
      iterations,
      tolerance,
      koEps,
      koTargets,
      shockMode,
      advectScheme,
      useInitialData: true,
      initialIterations,
      initialTolerance,
      gauge: {
        lapseKappa,
        shiftEta,
        shiftGamma,
        advect,
      },
      stencils: {
        order,
        boundary,
      },
      includeExtra,
      includeMatter,
      includeKij,
      invariantWallFraction,
      invariantBandFraction,
      invariantSampleMax,
      invariantPercentile,
      grEnabled: state.grEnabled === true,
      source: sourceCacheKey,
      geometry: geometrySig,
    });

    const cached = readGrBrickCache(grEvolveCache, cacheKey);
    let brick = cached?.brick;
    if (!brick) {
      if (isGrWorkerEnabled()) {
        try {
          brick = await runGrEvolveBrickInWorker(params);
        } catch (err) {
          console.warn("[helix-core] gr-evolve worker failed:", err);
        }
      }
      if (!brick) {
        brick = buildGrEvolveBrick(params);
      }
      writeGrBrickCache(grEvolveCache, {
        key: cacheKey,
        createdAt: Date.now(),
        brick,
      });
    }

    if (state.grEnabled === true) {
      const metricAdapter = (state as any)?.warp?.metricAdapter ?? null;
      state.gr = buildGrDiagnostics(brick, { metricAdapter });
    }
    if (wantsBinary) {
      const binary = serializeGrEvolveBrickBinary(brick);
      writeBinaryPayload(res, binary.header, binary.buffers);
      return;
    }
    const payload = serializeGrEvolveBrick(brick);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] gr evolve brick error:", err);
    const message = err instanceof Error ? err.message : "Failed to build GR evolve brick";
    if (message.includes("GR initial data not certified")) {
      res.status(409).json({ error: "gr-initial-not-certified", message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function getGrRegionStats(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? {
      Lx_m: 1007,
      Ly_m: 264,
      Lz_m: 173,
      wallThickness_m: 0.45,
    };
    const bounds: { min: Vec3; max: Vec3 } = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };
    const hullWallThickness =
      "wallThickness_m" in hull && typeof hull.wallThickness_m === "number"
        ? hull.wallThickness_m
        : undefined;

    const query = req.method === "GET"
      ? req.query
      : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const overrideDriveDir = parseVec3ParamOptional((query as any).driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);

    const quality = typeof query.quality === "string" ? query.quality : undefined;
    const qualityDims = dimsForQuality(quality);
    const dimsRaw = parseDimsParam(query.dims, qualityDims);
    const dimsCap = dimsCapForQuality(quality);
    const dims = clampDimsToQuality(dimsRaw, dimsCap);

    const geometryKindRaw =
      typeof query.geometryKind === "string" ? query.geometryKind : state.warpGeometryKind;
    const radialResolved = resolveRadialMapWithSource(state, preview, hull, geometryKindRaw);

    const pipelineInputs = resolvePipelineMatterInputs(state);
    const phase01Raw = num((query as any).phase01);
    const phase01Value = wrap01(
      Number.isFinite(phase01Raw) ? (phase01Raw as number) : pipelineInputs.phase01,
    );
    const targetRegionsRaw = num((query as any).targetRegions);
    const targetRegions =
      Number.isFinite(targetRegionsRaw) && (targetRegionsRaw as number) > 0
        ? Math.floor(targetRegionsRaw as number)
        : Math.max(1, Math.floor(num((state as any)?.sectorCount) ?? 400));
    const thetaBins = num((query as any).thetaBins);
    const longBins = num((query as any).longBins);
    const phaseBins = num((query as any).phaseBins);
    const radialBins = num((query as any).radialBins);
    const longAxisRaw = typeof (query as any).longAxis === "string" ? (query as any).longAxis : undefined;
    const longAxis = longAxisRaw === "y" || longAxisRaw === "z" ? longAxisRaw : "x";

    const strobeHz = num((query as any).strobeHz) ?? num((state as any)?.strobeHz) ?? NaN;
    const sectorPeriodMs =
      num((query as any).sectorPeriod_ms) ??
      num((query as any).sectorPeriodMs) ??
      num((state as any)?.sectorPeriod_ms) ??
      num((state as any)?.lightCrossing?.dwell_ms) ??
      NaN;
    const sectorPeriod_s =
      num((query as any).sectorPeriod_s) ??
      (Number.isFinite(sectorPeriodMs) ? (sectorPeriodMs as number) / 1000 : NaN);

    const grid = resolveRegionGridConfig({
      hull,
      strobeHz: Number.isFinite(strobeHz) ? (strobeHz as number) : NaN,
      sectorPeriod_s: Number.isFinite(sectorPeriod_s) ? (sectorPeriod_s as number) : NaN,
      targetRegions,
      thetaBins: Number.isFinite(thetaBins as number) ? (thetaBins as number) : undefined,
      longBins: Number.isFinite(longBins as number) ? (longBins as number) : undefined,
      phaseBins: Number.isFinite(phaseBins as number) ? (phaseBins as number) : undefined,
      radialBins: Number.isFinite(radialBins as number) ? (radialBins as number) : undefined,
      longAxis,
      phase01: phase01Value,
    });

    const topN = clampInt(num((query as any).topN) ?? 8, 1, 50);
    const maxVoxels = clampInt(num((query as any).maxVoxels) ?? 2_000_000, 1, 100_000_000);

    const sourceRaw = typeof (query as any).source === "string" ? (query as any).source : "auto";
    const source = sourceRaw === "gr" || sourceRaw === "stress" ? sourceRaw : "auto";
    const requireCertified = parseBooleanParam((query as any).requireCertified, false);
    const wallMetricsEnabled = parseBooleanParam((query as any).wallMetrics, true);
    const wallInvariantRaw =
      typeof (query as any).wallInvariant === "string" ? (query as any).wallInvariant : undefined;
    const wallInvariant =
      wallInvariantRaw === "ricci4" ? "ricci4" : "kretschmann";
    const wallFraction = clamp01(parseNumberParam((query as any).wallFraction, 0.25));
    const wallBandFraction = clamp01(parseNumberParam((query as any).wallBandFraction, 0.2));
    const wallSampleMax = Math.max(
      1,
      Math.floor(parseNumberParam((query as any).wallSampleMax, 50_000)),
    );

    let rho: Float32Array | null = null;
    let wallMetrics: InvariantWallMetrics | null = null;
    let detGamma: Float32Array | null = null;
    let sourceBrick: "gr-evolve-brick" | "stress-energy-brick" | "missing" = "missing";
    let proxy = true;
    let certified: boolean | undefined = undefined;
    const notes: string[] = [];

    const hullAxes: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];
    const hullWall = state.hull?.wallThickness_m ?? 0.45;

    if (source !== "stress") {
      try {
        const time_s = parseNumberParam((query as any).time_s, parseNumberParam((query as any).time, 0));
        const dt_s = parseNumberParam((query as any).dt_s, parseNumberParam((query as any).dt, 0));
        const stepsRaw = Math.max(0, Math.floor(parseNumberParam((query as any).steps, 0)));
        const steps = clampStepsToQuality(stepsRaw, stepsForQuality(quality));
        const iterations = Math.max(
          0,
          Math.floor(parseNumberParam((query as any).iterations, iterationsForQuality(quality))),
        );
        const tolerance = Math.max(0, parseNumberParam((query as any).tolerance, 0));
        const initialIterations = Math.max(
          0,
          Math.floor(parseNumberParam((query as any).initialIterations, iterations)),
        );
        const initialTolerance = Math.max(
          0,
          parseNumberParam((query as any).initialTolerance, tolerance),
        );
        const lapseKappa = Math.max(
          0,
          parseNumberParam((query as any).kappa, parseNumberParam((query as any).lapseKappa, 2)),
        );
        const shiftEta = Math.max(
          0,
          parseNumberParam((query as any).eta, parseNumberParam((query as any).shiftEta, 1)),
        );
        const shiftGamma = Math.max(0, parseNumberParam((query as any).shiftGamma, 0.75));
        const koEps = Math.max(
          0,
          parseNumberParam((query as any).koEps, parseNumberParam((query as any).ko_eps, 0)),
        );
        const koTargetsRaw =
          typeof (query as any).koTargets === "string"
            ? (query as any).koTargets
            : typeof (query as any).ko_targets === "string"
              ? (query as any).ko_targets
              : undefined;
        const koTargets = koTargetsRaw === "all" ? "all" : "gauge";
        const shockModeRaw =
          typeof (query as any).shockMode === "string"
            ? (query as any).shockMode
            : typeof (query as any).shock_mode === "string"
              ? (query as any).shock_mode
              : undefined;
        const shockMode =
          shockModeRaw === "diagnostic" || shockModeRaw === "stabilize"
            ? shockModeRaw
            : shockModeRaw === "off"
              ? "off"
              : "off";
        const advectSchemeRaw =
          typeof (query as any).advectScheme === "string"
            ? (query as any).advectScheme
            : typeof (query as any).advect_scheme === "string"
              ? (query as any).advect_scheme
              : undefined;
        const advectScheme = advectSchemeRaw === "upwind1" ? "upwind1" : "centered";
        const advect = parseBooleanParam((query as any).advect, true);
        const orderRaw = Math.max(2, Math.floor(parseNumberParam((query as any).order, 2)));
        const order = orderRaw >= 4 ? 4 : 2;
        const boundaryRaw =
          typeof (query as any).boundary === "string"
            ? (query as any).boundary
            : typeof (query as any).stencilBoundary === "string"
              ? (query as any).stencilBoundary
              : undefined;
        const boundary = boundaryRaw === "periodic" ? "periodic" : "clamp";

        const dutyFRValue = Math.max(pipelineInputs.dutyFR, 1e-8);
        const qValue = Math.max(pipelineInputs.q, 1e-6);
        const pressureFactor = resolveStressEnergyPressureFactor(state);
        const sourceOptions =
          pressureFactor !== undefined ? { pressureFactor } : undefined;
        const sourceParams: Partial<StressEnergyBrickParams> = {
          bounds,
          hullAxes,
          hullWall,
          dutyFR: dutyFRValue,
          q: qValue,
          gammaGeo: pipelineInputs.gammaGeo,
          gammaVdB: pipelineInputs.gammaVdB,
          zeta: pipelineInputs.zeta,
          phase01: phase01Value,
          driveDir: driveDir ?? undefined,
        };
        const sourceCacheKey = {
          dutyFR: dutyFRValue,
          q: qValue,
          gammaGeo: pipelineInputs.gammaGeo,
          gammaVdB: pipelineInputs.gammaVdB,
          zeta: pipelineInputs.zeta,
          phase01: phase01Value,
          pressureFactor: pressureFactor ?? null,
          driveDir: driveDir ?? null,
          hullAxes,
          hullWall,
        };
        const geometrySig = buildGrGeometrySignature(
          resolved,
          state,
          typeof state.warpGeometryKind === "string" ? state.warpGeometryKind : null,
        );

        const params: Partial<GrEvolveBrickParams> = {
          dims,
          bounds,
          time_s,
          dt_s,
          steps,
          iterations,
          tolerance,
          koEps,
          koTargets,
          shockMode,
          advectScheme,
          useInitialData: true,
          initialIterations,
          initialTolerance,
          gauge: {
            lapseKappa,
            shiftEta,
            shiftGamma,
            advect,
          },
          stencils: {
            order,
            boundary,
          },
          includeExtra: wallMetricsEnabled,
          includeMatter: true,
          includeKij: false,
          invariantWallFraction: wallFraction,
          invariantBandFraction: wallBandFraction,
          invariantSampleMax: wallSampleMax,
          invariantPercentile: 0.98,
          sourceParams,
          sourceOptions,
        };

        const cacheKey = JSON.stringify({
          dims,
          bounds,
          time_s,
          dt_s,
          steps,
          iterations,
          tolerance,
          koEps,
          koTargets,
          shockMode,
          advectScheme,
          useInitialData: true,
          initialIterations,
          initialTolerance,
          gauge: {
            lapseKappa,
            shiftEta,
            shiftGamma,
            advect,
          },
          stencils: {
            order,
            boundary,
          },
          includeExtra: wallMetricsEnabled,
          includeMatter: true,
          includeKij: false,
          invariantWallFraction: wallFraction,
          invariantBandFraction: wallBandFraction,
          invariantSampleMax: wallSampleMax,
          invariantPercentile: 0.98,
          grEnabled: state.grEnabled === true,
          source: sourceCacheKey,
          geometry: geometrySig,
        });

        const cached = readGrBrickCache(grEvolveCache, cacheKey);
        let brick = cached?.brick;
        if (!brick) {
          if (isGrWorkerEnabled()) {
            try {
              brick = await runGrEvolveBrickInWorker(params);
            } catch (err) {
              console.warn("[helix-core] gr-region worker failed:", err);
            }
          }
          if (!brick) {
            brick = buildGrEvolveBrick(params);
          }
          writeGrBrickCache(grEvolveCache, {
            key: cacheKey,
            createdAt: Date.now(),
            brick,
          });
        }

        const rhoChannel = brick.channels.rho;
        if (!rhoChannel) {
          throw new Error("GR evolve brick missing rho channel");
        }
        rho = rhoChannel.data;
        detGamma = brick.channels.det_gamma?.data ?? null;
        if (wallMetricsEnabled) {
          const wallChannel =
            wallInvariant === "ricci4"
              ? brick.channels.ricci4 ?? brick.channels.kretschmann
              : brick.channels.kretschmann ?? brick.channels.ricci4;
          if (wallChannel) {
            const source = wallChannel === brick.channels.ricci4 ? "ricci4" : "kretschmann";
            wallMetrics = computeInvariantWallMetrics({
              dims,
              bounds,
              values: wallChannel.data,
              source,
              useAbs: source === "ricci4",
              wallFraction,
              bandFraction: wallBandFraction,
              sampleMax: wallSampleMax,
              maxVoxels,
            });
          }
        }
        sourceBrick = "gr-evolve-brick";
        proxy = false;
        certified = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isNotCertified = message.toLowerCase().includes("not certified");
        notes.push(message);
        if (source === "gr" && requireCertified && isNotCertified) {
          res.status(409).json({ error: "gr-initial-not-certified", message });
          return;
        }
      }
    }

    if (!rho) {
      const sigmaSector = parseNumberParam((query as any).sigmaSector, 0.05);
      const splitEnabled = parseBooleanParam((query as any).splitEnabled, false);
      const splitFrac = parseNumberParam((query as any).splitFrac, 0.6);
      const dutyFRState =
        (state as any).dutyEffectiveFR ?? (state as any).dutyEffective_FR ?? state.dutyCycle;
      const dutyFR = parseNumberParam((query as any).dutyFR, parseNumberParam(dutyFRState, 0.0025));
      const q = parseNumberParam((query as any).q ?? state.qSpoilingFactor, state.qSpoilingFactor ?? 1);
      const gammaGeo = parseNumberParam((query as any).gammaGeo ?? state.gammaGeo, state.gammaGeo ?? 26);
      const gammaVdB = parseNumberParam(
        (query as any).gammaVdB ?? state.gammaVanDenBroeck,
        state.gammaVanDenBroeck ?? 1e5,
      );
      const ampBase = parseNumberParam((query as any).ampBase, 0);
      const zeta = parseNumberParam((query as any).zeta, 0.84);

      const params: Partial<StressEnergyBrickParams> = {
        dims,
        bounds,
        hullAxes,
        hullWall,
        radialMap: radialResolved.radialMap ?? undefined,
        phase01: phase01Value,
        sigmaSector,
        splitEnabled,
        splitFrac,
        dutyFR: Math.max(dutyFR, 1e-8),
        q: Math.max(q, 1e-6),
        gammaGeo,
        gammaVdB,
        ampBase,
        zeta,
        driveDir: driveDir ?? undefined,
      };

      const brick = buildStressEnergyBrick(params);
      rho = brick.channels.t00.data;
      detGamma = null;
      sourceBrick = "stress-energy-brick";
      proxy = true;
    }

    if (!rho) {
      throw new Error("Missing matter field for region stats");
    }

    const stats = computeRegionStats({
      dims,
      bounds,
      hullAxes,
      hullWall,
      radialMap: radialResolved.radialMap ?? null,
      rho,
      detGamma,
      grid,
      maxVoxels,
    });

    const payload: GrRegionStats = {
      kind: "gr-region-stats",
      updatedAt: Date.now(),
      source: {
        brick: sourceBrick,
        proxy,
        certified,
        ...(notes.length ? { notes } : {}),
      },
      geometry: {
        source: resolved.source,
        meshHash: resolved.meshHash ?? null,
        hull: {
          Lx_m: hull.Lx_m,
          Ly_m: hull.Ly_m,
          Lz_m: hull.Lz_m,
          wallThickness_m: hullWallThickness ?? hullWall,
        },
        bounds,
        radialMap: radialResolved.source,
      },
      grid,
      sample: {
        dims,
        voxelSize_m: stats.voxelSize,
        voxelCount: stats.voxelCount,
        ...(stats.stride > 1 ? { stride: stats.stride } : {}),
      },
      summary: {
        ...stats.summary,
        ...(wallMetrics ? { wall: wallMetrics } : {}),
      },
      topRegions: stats.topRegions.slice(0, topN),
    };

    const parsed = grRegionStatsSchema.parse(payload);
    res.json(parsed);
  } catch (err) {
    console.error("[helix-core] gr region stats error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to build GR region stats";
    res.status(500).json({ error: "gr-region-stats-failed", message });
  }
}

export async function getGrConstraintNetwork4d(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const preview = state.geometryPreview?.preview ?? null;
    const resolved = resolveGeometryForSampling(preview, state.hull);
    const hull = resolved.hull ?? state.hull ?? {
      Lx_m: 1007,
      Ly_m: 264,
      Lz_m: 173,
      wallThickness_m: 0.45,
    };
    const bounds = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2] as Vec3,
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2] as Vec3,
    };

    const query = req.method === "GET"
      ? req.query
      : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const body =
      query && typeof query === "object" ? (query as Record<string, unknown>) : {};

    const dimsRaw = parseDimsParam(body.dims, [32, 32, 32]);
    const dims = clampDimsToQuality(dimsRaw, [128, 128, 128]);
    const time_s = parseNumberParam(body.time_s, parseNumberParam(body.time, 0));
    const dt_s = Math.max(0, parseNumberParam(body.dt_s, parseNumberParam(body.dt, 0.01)));
    const stepsRaw = Math.max(0, Math.floor(parseNumberParam(body.steps, 8)));
    const steps = clampStepsToQuality(stepsRaw, 128);
    const initialIterations = Math.max(
      0,
      Math.floor(parseNumberParam(body.initialIterations, 80)),
    );
    const initialTolerance = Math.max(0, parseNumberParam(body.initialTolerance, 0));
    const lapseKappa = Math.max(
      0,
      parseNumberParam(body.kappa, parseNumberParam(body.lapseKappa, 2)),
    );
    const shiftEta = Math.max(
      0,
      parseNumberParam(body.eta, parseNumberParam(body.shiftEta, 1)),
    );
    const shiftGamma = Math.max(0, parseNumberParam(body.shiftGamma, 0.75));
    const advect = parseBooleanParam(body.advect, true);
    const orderRaw = Math.max(2, Math.floor(parseNumberParam(body.order, 2)));
    const order = orderRaw >= 4 ? 4 : 2;
    const boundaryRaw =
      typeof body.boundary === "string"
        ? body.boundary
        : typeof body.stencilBoundary === "string"
          ? body.stencilBoundary
          : undefined;
    const boundary = boundaryRaw === "periodic" ? "periodic" : "clamp";
    const includeSeries = parseBooleanParam(body.includeSeries, true);
    const unitSystem =
      typeof body.unitSystem === "string" && body.unitSystem.toLowerCase() === "geometric"
        ? "geometric"
        : "SI";
    const usePipelineMatter = parseBooleanParam(body.usePipelineMatter, true);

    const thresholdsParsed = grConstraintThresholdSchema
      .partial()
      .safeParse(body.thresholds);
    const policyParsed = grConstraintPolicySchema.partial().safeParse(body.policy);
    const policyBundle = await resolveGrConstraintPolicyBundle({
      thresholds: thresholdsParsed.success ? thresholdsParsed.data : undefined,
      policy: policyParsed.success ? policyParsed.data : undefined,
    });

    const pipelineInputs = resolvePipelineMatterInputs(state);
    const overrideDriveDir = parseVec3ParamOptional(body.driveDir);
    const stateDriveDir = parseVec3ParamOptional((state as any)?.driveDir);
    const driveDir = normalizeVec3OrNull(overrideDriveDir ?? stateDriveDir);
    const hullAxes: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];
    const hullWall = state.hull?.wallThickness_m ?? 0.45;
    const pressureFactor = resolveStressEnergyPressureFactor(state);
    const sourceOptions =
      pressureFactor !== undefined ? { pressureFactor } : undefined;
    const sourceParams: Partial<StressEnergyBrickParams> = {
      bounds,
      hullAxes,
      hullWall,
      dutyFR: pipelineInputs.dutyFR,
      q: pipelineInputs.q,
      gammaGeo: pipelineInputs.gammaGeo,
      gammaVdB: pipelineInputs.gammaVdB,
      zeta: pipelineInputs.zeta,
      phase01: pipelineInputs.phase01,
      driveDir: driveDir ?? undefined,
    };

    const result = runGrConstraintNetwork4d({
      dims,
      bounds,
      time_s,
      dt_s,
      steps,
      unitSystem,
      gauge: {
        lapseKappa,
        shiftEta,
        shiftGamma,
        advect,
      },
      stencils: {
        order,
        boundary,
      },
      thresholds: policyBundle.gate.thresholds,
      policy: policyBundle.gate.policy,
      initialIterations,
      initialTolerance,
      includeSeries,
      usePipelineMatter,
      sourceParams,
      sourceOptions,
    });

    const payload = grConstraintNetworkSchema.parse(result);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] gr constraint network error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to build GR constraint network";
    res.status(500).json({ error: "gr-constraint-network-failed", message });
  }
}

export async function getGrConstraintContract(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const gr = (state as any)?.gr;
    const warpViability = (state as any)?.warpViability;
    const certificate = warpViability?.certificate;
    const integrityOk = warpViability?.integrityOk;
    const certPayload = certificate?.payload;
    const policyBundle = await resolveGrConstraintPolicyBundle();
    type CertConstraint = {
      id: string;
      passed: boolean;
      lhs?: number;
      rhs?: number;
      note?: string;
      details?: string;
    };
    const certConstraints: CertConstraint[] = Array.isArray(certPayload?.constraints)
      ? (certPayload.constraints as CertConstraint[])
      : [];
    const findCertConstraint = (id: string) =>
      certConstraints.find((constraint) => constraint.id === id);
    const firstFinite = (...values: Array<unknown>): number | null => {
      for (const value of values) {
        const num = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(num)) return num;
      }
      return null;
    };

    const zetaValue = firstFinite(
      (state as any)?.zetaRaw,
      (state as any)?.zeta,
      (state as any)?.qiAutoscale?.rawZeta,
      (state as any)?.qiAutoscale?.zeta,
    );
    const qiGuard = (state as any)?.qiGuardrail;
    const qiMarginRatio = firstFinite(qiGuard?.marginRatio, zetaValue);
    const qiHasMargin = qiMarginRatio !== null;
    const qiCurvaturePass =
      qiGuard?.curvatureEnforced === true ? qiGuard?.curvatureOk !== false : true;
    const qiMetricSource = probeQiSourceIsMetric(qiGuard?.rhoSource);
    const qiBandPass =
      qiHasMargin && qiMarginRatio !== null
        ? qiMarginRatio < 1 && qiCurvaturePass
        : null;
    const strictCongruence = probeStrictCongruenceEnabled(state as any);
    const thetaGeom = firstFinite(
      (state as any)?.theta_geom,
      (state as any)?.warp?.metricAdapter?.betaDiagnostics?.thetaMax,
      (state as any)?.warp?.metricAdapter?.betaDiagnostics?.thetaRms,
    );
    const thetaProxy = firstFinite(
      (state as any)?.thetaCal,
      (state as any)?.thetaScaleExpected,
    );
    const thetaMetricDerived =
      (state as any)?.theta_metric_derived === true ||
      (thetaGeom !== null &&
        (state as any)?.warp?.metricAdapter?.betaDiagnostics?.method !== "not-computed");
    const thetaLimit = LATTICE_PROBE_THETA_MAX;
    const thetaBandPass =
      thetaGeom !== null && Number.isFinite(thetaGeom)
        ? Math.abs(thetaGeom) <= thetaLimit
        : false;
    const thetaStatus: "pass" | "fail" | "unknown" = thetaMetricDerived
      ? thetaBandPass
        ? "pass"
        : "fail"
      : strictCongruence
        ? "fail"
        : thetaProxy === null
          ? "unknown"
          : "unknown";
    const tsRatio = firstFinite(
      (state as any)?.TS_ratio,
      (state as any)?.TS_long,
      (state as any)?.TS_geom,
    );
    const tsMetricDerived = (state as any)?.tsMetricDerived === true;
    const gammaVdB = firstFinite(
      (state as any)?.gammaVanDenBroeck,
      (state as any)?.gammaVdB,
    );
    const vdbGuard = (state as any)?.gammaVanDenBroeckGuard;
    const vdbDerivativeSupport = (state as any)?.vdb_two_wall_derivative_support === true;
    const vdbRequiresDerivativeSupport =
      gammaVdB !== null && Number.isFinite(gammaVdB) && gammaVdB > 1 + 1e-6;

    const tsLimit = 1.5;
    const tsBandPass = tsRatio !== null && tsRatio >= tsLimit;

    type GuardrailsState = NonNullable<GrConstraintContract["guardrails"]>;
    const fordRoman: GuardrailsState["fordRoman"] =
      qiBandPass == null
        ? "missing"
        : strictCongruence
          ? qiBandPass && qiMetricSource
            ? "ok"
            : "fail"
          : qiBandPass
            ? qiMetricSource
              ? "ok"
              : "proxy"
            : "fail";
    const tsRatioState: GuardrailsState["tsRatio"] =
      tsRatio === null
        ? "missing"
        : strictCongruence
          ? tsBandPass && tsMetricDerived
            ? "ok"
            : "fail"
          : tsBandPass
            ? tsMetricDerived
              ? "ok"
              : "proxy"
            : "fail";
    let vdbBand: GuardrailsState["vdbBand"] = "missing";
    if (
      vdbGuard &&
      gammaVdB !== null &&
      Number.isFinite(vdbGuard.greenBand?.min) &&
      Number.isFinite(vdbGuard.greenBand?.max)
    ) {
      const inBand =
        gammaVdB >= Number(vdbGuard.greenBand.min) &&
        gammaVdB <= Number(vdbGuard.greenBand.max);
      const guardPass = vdbGuard.admissible ? Boolean(vdbGuard.admissible) && inBand : inBand;
      const derivativeMissing = Boolean(vdbRequiresDerivativeSupport && !vdbDerivativeSupport);
      if (strictCongruence) {
        vdbBand = guardPass && !derivativeMissing ? "ok" : "fail";
      } else if (guardPass && derivativeMissing) {
        vdbBand = "proxy";
      } else {
        vdbBand = guardPass ? "ok" : "fail";
      }
    } else if (vdbRequiresDerivativeSupport && !vdbDerivativeSupport) {
      vdbBand = strictCongruence ? "fail" : "proxy";
    } else if (gammaVdB !== null) {
      vdbBand = "proxy";
    }
    const guardrails: GuardrailsState = {
      fordRoman,
      thetaAudit: thetaMetricDerived
        ? thetaBandPass
          ? "ok"
          : "fail"
        : strictCongruence
          ? "fail"
          : thetaProxy === null
            ? "missing"
            : "proxy",
      tsRatio: tsRatioState,
      vdbBand,
    };

    const constraints: GrConstraintContract["constraints"] = [];
    const notes: string[] = [];
    const gateEval = evaluateGrConstraintGateFromDiagnostics(
      gr?.constraints ?? null,
      {
        thresholds: policyBundle.gate.thresholds,
        policy: policyBundle.gate.policy,
      },
    );
    constraints.push(...gateEval.constraints);
    if (gateEval.notes.length) {
      notes.push(...gateEval.notes);
    }
    const pushConstraint = (entry: GrConstraintContract["constraints"][number]) => {
      constraints.push(entry);
    };

    pushConstraint({
      id: "FordRomanQI",
      severity: "HARD",
      status:
        guardrails.fordRoman === "ok"
          ? "pass"
          : guardrails.fordRoman === "fail"
            ? "fail"
            : "unknown",
      limit: "int_T00_dt >= -K / tau^4",
      ...(qiMarginRatio !== null ? { value: qiMarginRatio } : {}),
      proxy: guardrails.fordRoman === "proxy",
      note:
        qiMarginRatio === null
          ? "Missing zeta/qi metric; cannot evaluate."
          : guardrails.fordRoman === "proxy"
            ? "Proxy: using non-metric rho source."
            : guardrails.fordRoman === "fail" && strictCongruence && !qiMetricSource
              ? "Strict congruence requires metric-derived rho source for FordRomanQI."
              : "Using qiGuardrail margin ratio with source/curvature checks.",
    });
    pushConstraint({
      id: "ThetaAudit",
      severity: "HARD",
      status: thetaStatus,
      limit: "|theta_geom| <= theta_max",
      ...(thetaMetricDerived && thetaGeom !== null
        ? { value: thetaGeom }
        : thetaProxy !== null
          ? { value: thetaProxy }
          : {}),
      proxy: !thetaMetricDerived,
      note:
        thetaMetricDerived
          ? thetaBandPass
            ? `Geometry-derived theta within threshold (|theta_geom| <= ${thetaLimit}).`
            : `Geometry-derived theta exceeded threshold (|theta_geom| > ${thetaLimit}).`
          : strictCongruence
            ? "Strict congruence requires geometry-derived theta_geom; proxy theta is not admissible."
            : thetaProxy === null
              ? "Missing theta_geom/theta proxy; cannot evaluate."
              : "Proxy: using thetaCal/thetaScaleExpected fallback.",
    });
    pushConstraint({
      id: "TS_ratio_min",
      severity: "SOFT",
      status:
        guardrails.tsRatio === "ok"
          ? "pass"
          : guardrails.tsRatio === "fail"
            ? "fail"
            : "unknown",
      limit: ">= 1.5",
      ...(tsRatio !== null ? { value: tsRatio } : {}),
      proxy: guardrails.tsRatio === "proxy",
      ...(tsRatio === null
        ? { note: "Missing TS_ratio; cannot evaluate." }
        : strictCongruence && !tsMetricDerived
          ? { note: "Strict congruence requires metric-derived TS ratio source." }
          : {}),
    });
    pushConstraint({
      id: "VdB_band",
      severity: "SOFT",
      status:
        guardrails.vdbBand === "ok"
          ? "pass"
          : guardrails.vdbBand === "fail"
            ? "fail"
            : "unknown",
      limit: "gamma_VdB in [gamma_min, gamma_max]",
      ...(gammaVdB !== null ? { value: gammaVdB } : {}),
      proxy: guardrails.vdbBand === "proxy",
      note:
        gammaVdB === null
          ? "Missing gamma_VdB; cannot evaluate."
          : guardrails.vdbBand === "proxy"
            ? "Proxy: derivative support unavailable for VdB two-wall check."
            : vdbRequiresDerivativeSupport && !vdbDerivativeSupport
              ? "Derivative support required for gamma_VdB > 1."
              : "Using configured VdB band and derivative support checks.",
    });

    const certAvailable = Boolean(certificate) && integrityOk !== false;
    if (certificate && integrityOk === false) {
      notes.push("Warp viability certificate integrity check failed; treat as NOT_CERTIFIED.");
    }
    if (!certAvailable && policyBundle.certificate.treatMissingCertificateAsNotCertified) {
      notes.push("Warp viability certificate missing; policy requires certification.");
    }
    if (!gr) {
      notes.push("No GR diagnostics attached; run gr-evolve-brick with grEnabled=true.");
    }
    if (certAvailable && certConstraints.length) {
      const applyCertificate = (
        entry: GrConstraintContract["constraints"][number],
      ): GrConstraintContract["constraints"][number] => {
        const cert = findCertConstraint(entry.id);
        if (!cert) return entry;
        const value = Number.isFinite(cert.lhs) ? (cert.lhs as number) : entry.value;
        const note = cert.note ?? cert.details ?? entry.note;
        const status: GrConstraintContract["constraints"][number]["status"] =
          cert.passed ? "pass" : "fail";
        return {
          ...entry,
          status,
          ...(value !== undefined ? { value } : {}),
          proxy: false,
          ...(note ? { note } : {}),
        };
      };
      for (let i = 0; i < constraints.length; i += 1) {
        constraints[i] = applyCertificate(constraints[i]);
      }
      const guardrailById: Record<string, keyof GuardrailsState> = {
        FordRomanQI: "fordRoman",
        ThetaAudit: "thetaAudit",
        TS_ratio_min: "tsRatio",
        VdB_band: "vdbBand",
      };
      for (const [id, key] of Object.entries(guardrailById)) {
        const cert = findCertConstraint(id);
        if (!cert) continue;
        guardrails[key] = cert.passed ? "ok" : "fail";
      }
    }

    if (guardrails.fordRoman === "proxy") {
      notes.push("FordRomanQI uses proxy zeta; not a full QI integral.");
    }
    if (guardrails.thetaAudit === "proxy") {
      notes.push("ThetaAudit uses theta proxy (thetaCal/thetaScaleExpected).");
    }
    if (guardrails.thetaAudit === "fail" && !thetaMetricDerived && strictCongruence) {
      notes.push("ThetaAudit strict mode requires geometry-derived theta_geom.");
    }
    if (guardrails.vdbBand === "proxy") {
      notes.push("VdB band uses gamma_VdB proxy; band not configured.");
    }
    if (gr?.solver?.health?.status === "UNSTABLE") {
      notes.push("GR solver fixups unstable; treat brick as NOT_CERTIFIED.");
    }

    const grid = gr?.grid && gr?.grid?.bounds
      ? {
          dims: gr.grid.dims,
          bounds: {
            min: gr.grid.bounds.min,
            max: gr.grid.bounds.max,
          },
          voxelSize_m: gr.grid.voxelSize_m,
          time_s: gr.grid.time_s,
          dt_s: gr.grid.dt_s,
        }
      : undefined;
    const diagnostics = gr?.constraints
      ? {
          H_rms: gr.constraints.H_constraint?.rms,
          M_rms: gr.constraints.M_constraint?.rms,
          lapseMin: gr.gauge?.lapseMin,
          lapseMax: gr.gauge?.lapseMax,
        betaMaxAbs: gr.gauge?.betaMaxAbs,
        fixups: gr.solver?.fixups,
        solverHealth: gr.solver?.health,
        brickMeta: gr.meta,
      }
    : undefined;
    const perf = gr?.perf
      ? {
          totalMs: gr.perf.totalMs,
          evolveMs: gr.perf.evolveMs,
          brickMs: gr.perf.brickMs,
          voxels: gr.perf.voxels,
          channelCount: gr.perf.channelCount,
          bytesEstimate: gr.perf.bytesEstimate,
          msPerStep: gr.perf.msPerStep,
        }
      : undefined;

    const grSource = gr?.source === "gr-evolve-brick" ? "gr-evolve-brick" : gr ? "pipeline" : "missing";
    const certificateStatus =
      certAvailable ? (certPayload?.status ?? warpViability?.status ?? "NOT_CERTIFIED") : "NOT_CERTIFIED";
    const certificateHash =
      warpViability?.certificateHash ?? certificate?.certificateHash ?? null;
    const certificateId =
      warpViability?.certificateId ?? certificate?.header?.id ?? null;
    const contract: GrConstraintContract = {
      kind: "gr-constraint-contract",
      version: 1,
      updatedAt: Date.now(),
      policy: policyBundle,
      sources: {
        grDiagnostics: grSource,
        certificate: certAvailable ? "physics.warp.viability" : "missing",
        plannerTool: "physics.warp.sector_control.plan",
      },
      ...(grid ? { grid } : {}),
      ...(diagnostics ? { diagnostics } : {}),
      ...(perf ? { perf } : {}),
      gate: gateEval.gate,
      guardrails,
      constraints,
      certificate: {
        status: certificateStatus,
        admissibleStatus: policyBundle.certificate.admissibleStatus,
        hasCertificate: certAvailable,
        certificateHash,
        certificateId,
      },
      notes: notes.length ? notes : undefined,
      proxy: constraints.some((entry) => entry.proxy),
    };

    const parsedContract = grConstraintContractSchema.safeParse(contract);
    if (!parsedContract.success) {
      const issues = parsedContract.error.flatten();
      console.error("[helix-core] gr constraint contract schema error:", issues);
      const fallback: GrConstraintContract = {
        kind: "gr-constraint-contract",
        version: 1,
        updatedAt: Date.now(),
        policy: policyBundle,
        sources: {
          grDiagnostics: gr ? "pipeline" : "missing",
          certificate: certAvailable ? "physics.warp.viability" : "missing",
        plannerTool: "physics.warp.sector_control.plan",
        },
        guardrails,
        constraints,
        certificate: {
          status: certificateStatus,
          admissibleStatus: policyBundle.certificate.admissibleStatus,
          hasCertificate: certAvailable,
          certificateHash,
          certificateId,
        },
        notes: [
          "Contract schema validation failed; returning fallback payload.",
          JSON.stringify(issues),
        ],
        proxy: true,
      };
      res.json(fallback);
      return;
    }
    res.json(parsedContract.data);
  } catch (err) {
    console.error("[helix-core] gr constraint contract error:", err);
    const message = err instanceof Error ? err.message : "Failed to build gr constraint contract";
    const policyBundle = await resolveGrConstraintPolicyBundle().catch(() => null);
    if (policyBundle) {
      const fallback: GrConstraintContract = {
        kind: "gr-constraint-contract",
        version: 1,
        updatedAt: Date.now(),
        policy: policyBundle,
        sources: { grDiagnostics: "missing", certificate: "missing" },
        guardrails: {
          fordRoman: "missing",
          thetaAudit: "missing",
          tsRatio: "missing",
          vdbBand: "missing",
        },
        constraints: [],
        certificate: {
          status: "NOT_CERTIFIED",
          admissibleStatus: policyBundle.certificate.admissibleStatus,
          hasCertificate: false,
          certificateHash: null,
          certificateId: null,
        },
        notes: [message],
        proxy: true,
      };
      res.json(fallback);
      return;
    }
    res.status(500).json({ error: "gr-constraint-contract-failed", message });
  }
}

export async function getGrAssistantReport(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const query = req.method === "GET"
      ? req.query
      : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const body =
      query && typeof query === "object" ? (query as Record<string, unknown>) : {};
    const parsed = grAssistantReportRequestSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({
        error: "invalid-gr-assistant-report",
        details: parsed.error.flatten(),
      });
      return;
    }
    if (!parsed.data.metric && !parsed.data.brick) {
      res.status(400).json({ error: "gr-assistant-missing-input" });
      return;
    }

    const buildErrorReport = (message: string): GrAssistantReportPayload => ({
      source: "error",
      assumptions: {
        coords: ["unknown"],
        signature: "unknown",
        units_internal: "unknown",
      },
      artifacts: [],
      checks: [],
      failed_checks: [],
      passed: false,
      notes: [message],
    });

    let result: {
      report: GrAssistantReportPayload;
      gate?: GrGrounding;
      citations?: string[];
      trace_id?: string;
      training_trace_id?: string;
    };
    try {
      result = (await grAssistantHandler(parsed.data, {})) as {
        report: GrAssistantReportPayload;
        gate?: GrGrounding;
        citations?: string[];
        trace_id?: string;
        training_trace_id?: string;
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to build gr assistant report";
      const payload = grAssistantReportSchema.parse({
        kind: "gr-assistant-report",
        updatedAt: Date.now(),
        report: buildErrorReport(message),
      });
      res.json(payload);
      return;
    }

    const payload = grAssistantReportSchema.parse({
      kind: "gr-assistant-report",
      updatedAt: Date.now(),
      report: result.report,
      gate: result.gate,
      citations: result.citations,
      trace_id: result.trace_id,
      training_trace_id: result.training_trace_id,
    });
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] gr assistant report error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to build gr assistant report";
    const payload = grAssistantReportSchema.parse({
      kind: "gr-assistant-report",
      updatedAt: Date.now(),
      report: {
        source: "error",
        assumptions: {
          coords: ["unknown"],
          signature: "unknown",
          units_internal: "unknown",
        },
        artifacts: [],
        checks: [],
        failed_checks: [],
        passed: false,
        notes: [message],
      },
    });
    res.json(payload);
  }
}

export async function getGrEvaluation(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const query = req.method === "GET"
      ? req.query
      : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const body =
      query && typeof query === "object" ? (query as Record<string, unknown>) : {};
    const warpConfig =
      (body.warpConfig && typeof body.warpConfig === "object"
        ? body.warpConfig
        : body.config && typeof body.config === "object"
          ? body.config
          : {}) as WarpConfig;
    const thresholdsParsed = grConstraintThresholdSchema
      .partial()
      .safeParse(body.thresholds);
    const policyParsed = grConstraintPolicySchema.partial().safeParse(body.policy);
    const useLiveSnapshot = body.useLiveSnapshot === undefined
      ? undefined
      : parseBooleanParam(body.useLiveSnapshot, true);

    const result = await runGrEvaluation({
      diagnostics: (state as any)?.gr ?? null,
      warpConfig,
      thresholds: thresholdsParsed.success ? thresholdsParsed.data : undefined,
      policy: policyParsed.success ? policyParsed.data : undefined,
      useLiveSnapshot,
    });

    state.warpViability = {
      certificate: result.certificate,
      certificateHash: result.certificate.certificateHash,
      certificateId: result.certificate.header?.id ?? null,
      integrityOk: result.integrityOk,
      status: result.certificate.payload?.status ?? "NOT_CERTIFIED",
      constraints: result.certificate.payload?.constraints ?? [],
      snapshot: result.certificate.payload?.snapshot ?? {},
      updatedAt: Date.now(),
    };
    setGlobalPipelineState(state);

    const payload = grEvaluationSchema.parse(result.evaluation);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] gr evaluation error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to evaluate GR constraints";
    res.status(500).json({ error: "gr-evaluation-failed", message });
  }
}
export function postCurvatureBrickDebugStamp(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const body = (req.body && typeof req.body === "object") ? req.body as Record<string, unknown> : null;
  if (!body) {
    res.status(400).json({ error: "invalid-body" });
    return;
  }
  const stamp = normalizeCurvatureStampRequest(body);
  if (!stamp) {
    res.status(400).json({ error: "invalid-stamp" });
    return;
  }
  setCurvatureDebugStamp(stamp);
  res.json({ ok: true, stamp });
}

export function postCurvatureBrickDebugClear(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const previous = getCurvatureDebugStamp();
  clearCurvatureDebugStamp();
  res.json({ ok: true, previous });
}

export function getPhaseBiasTable(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const rows = state.vacuumGapSweepResults ?? [];
    const env = {
      T_K: state.temperature_K,
      Ppump_dBm: (state as any)?.pumpPower_dBm ?? (state as any)?.pump_dBm,
    };
    const entries = reducePhaseCalLogToLookup(rows ?? [], env);
    res.json({ entries });
  } catch (err) {
    console.error("[helix-core] phase bias lookup failed:", err);
    res.status(500).json({ error: "phase-bias-lookup-failed" });
  }
}

export function getSpectrumLog(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    res.json({ snapshots: getSpectrumSnapshots() });
  } catch (err) {
    console.error("[helix-core] spectrum log error:", err);
    res.status(500).json({ error: "spectrum-log-failed" });
  }
}

export async function postSpectrumLog(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  const body = (req.body && typeof req.body === "object") ? req.body as Record<string, unknown> : null;
  if (!body) {
    res.status(400).json({ error: "invalid-body" });
    return;
  }

  if (Array.isArray((body as any).f_Hz) && Array.isArray((body as any).P_dBm)) {
    const parsedFrame = hardwareSpectrumFrameSchema.safeParse(body);
    if (!parsedFrame.success) {
      res.status(400).json({ error: "invalid-spectrum-frame", details: parsedFrame.error.flatten() });
      return;
    }
    const frame = parsedFrame.data as HardwareSpectrumFrame;
    const now = Date.now();

    try {
      await pipeMutex.lock(async () => {
        const current = getGlobalPipelineState();
        const next: EnergyPipelineState = {
          ...current,
          hardwareTruth: {
            ...(current.hardwareTruth ?? {}),
            spectrumFrame: { ...frame, updatedAt: now },
            updatedAt: now,
          },
        };
        const updated = await calculateEnergyPipeline(next);
        setGlobalPipelineState(updated);
      });
    } catch (err) {
      console.error("[helix-core] ingest hardware spectrum frame failed:", err);
      res.status(500).json({ error: "ingest-failed" });
      return;
    }

    hardwareBroadcast?.("spectrum-tuner", {
      type: "spectrum-frame",
      frame,
      ts: now,
    });
    res.status(201).json({ ok: true, points: frame.f_Hz.length });
    return;
  }

  const coerce = (value: unknown) => (typeof value === "number" ? value : Number(value));
  const snapshot: SpectrumSnapshot = {
    d_nm: coerce(body.d_nm),
    m: coerce(body.m),
    Omega_GHz: coerce(body.Omega_GHz),
    phi_deg: coerce(body.phi_deg),
    Nminus: coerce(body.Nminus),
    Nplus: coerce(body.Nplus),
    RBW_Hz: coerce(body.RBW_Hz),
    P_ref_W: body.P_ref_W !== undefined ? coerce(body.P_ref_W) : undefined,
    T_ref_K: body.T_ref_K !== undefined ? coerce(body.T_ref_K) : undefined,
    timestamp: typeof body.timestamp === "string" ? body.timestamp : undefined,
  };

  const required = [
    snapshot.d_nm,
    snapshot.m,
    snapshot.Omega_GHz,
    snapshot.phi_deg,
    snapshot.Nminus,
    snapshot.Nplus,
    snapshot.RBW_Hz,
  ];
  if (required.some((v) => !Number.isFinite(v))) {
    res.status(400).json({ error: "invalid-snapshot" });
    return;
  }

  const stored = postSpectrum(snapshot);
  hardwareBroadcast?.("spectrum-tuner", {
    type: "spectrum-snapshot",
    snapshot,
    ts: Date.now(),
  });
  res.status(201).json(stored);
}

export async function ingestHardwareSweepPoint(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    return res.status(200).end();
  }

  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");

  const body = req.body && typeof req.body === "object" ? req.body : null;
  if (!body) {
    res.status(400).json({ error: "invalid-row", details: null });
    return;
  }

  const parsed = zSweepRow.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid-row", details: parsed.error.flatten() });
    return;
  }

  const row = toVacuumRow(parsed.data);
  const include = applyVacuumSweepGuardrails(row);
  if (!include) {
    res.status(422).json({ ok: false, reason: "guardrails", row });
    return;
  }

  const now = Date.now();
  appendSweepRows([row]);
  const totals = getSweepHistoryTotals();

  try {
    await pipeMutex.lock(async () => {
      const current = getGlobalPipelineState();
      const next: EnergyPipelineState = {
        ...current,
        vacuumGapSweepRowsTotal: totals.total,
        vacuumGapSweepRowsDropped: totals.dropped,
        hardwareTruth: {
          ...(current.hardwareTruth ?? {}),
          lastSweepRow: row,
          totals,
          updatedAt: now,
        },
      };
      const updated = await calculateEnergyPipeline(next);
      setGlobalPipelineState(updated);
    });
  } catch (err) {
    console.error("[helix-core] ingest hardware sweep point failed:", err);
    res.status(500).json({ error: "ingest-failed" });
    return;
  }

  hardwareBroadcast?.("vacuum-gap-sweep", {
    type: "sweep-point",
    row,
    totals,
    ts: now,
  });
  res.status(200).json({ ok: true, totals });
}

function normalizeHardwareSectorStateInput(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...input };
  const aliasMap: Record<string, string> = {
    dwell: "dwell_ms",
    dwellMs: "dwell_ms",
    burst: "burst_ms",
    burstMs: "burst_ms",
    strobe: "strobeHz",
    strobe_hz: "strobeHz",
    sector: "currentSector",
    sectorIdx: "currentSector",
    sectors: "activeSectors",
    sectorCount: "sectorCount",
    sectorsTotal: "sectorCount",
    sectors_total: "sectorCount",
    totalSectors: "sectorCount",
    phase_cont: "phaseCont",
    pump_deg: "pumpPhase_deg",
    tau_lc_ms: "tauLC_ms",
  };

  for (const [alias, canonical] of Object.entries(aliasMap)) {
    if (out[canonical] == null && input[alias] != null) {
      out[canonical] = input[alias];
    }
  }

  const burstUs = pick(
    num((input as any).burst_us),
    num((input as any).burstLength_us),
    num((input as any).burstLengthUs),
  );
  const burstNs = pick(
    num((input as any).burst_ns),
    num((input as any).burstLength_ns),
    num((input as any).burstLengthNs),
  );
  if (!Number.isFinite(num(out.burst_ms)) && Number.isFinite(burstUs)) {
    out.burst_ms = (burstUs as number) / 1000;
  }
  if (!Number.isFinite(num(out.burst_ms)) && Number.isFinite(burstNs)) {
    out.burst_ms = (burstNs as number) / 1e6;
  }

  const dwellUs = pick(
    num((input as any).dwell_us),
    num((input as any).dwellLength_us),
    num((input as any).dwellLengthUs),
  );
  const dwellNs = pick(
    num((input as any).dwell_ns),
    num((input as any).dwellLength_ns),
    num((input as any).dwellLengthNs),
  );
  if (!Number.isFinite(num(out.dwell_ms)) && Number.isFinite(dwellUs)) {
    out.dwell_ms = (dwellUs as number) / 1000;
  }
  if (!Number.isFinite(num(out.dwell_ms)) && Number.isFinite(dwellNs)) {
    out.dwell_ms = (dwellNs as number) / 1e6;
  }

  const tauUs = pick(num((input as any).tauLC_us), num((input as any).tau_lc_us));
  if (!Number.isFinite(num(out.tauLC_ms)) && Number.isFinite(tauUs)) {
    out.tauLC_ms = (tauUs as number) / 1000;
  }

  const setMeasured = (key: string, value: number | undefined) => {
    if (!Number.isFinite(value)) return;
    if (Number.isFinite(num(out[key]))) return;
    out[key] = value;
  };

  const modulationGHz = pick(
    num((input as any).measuredModulationFreqGHz),
    num((input as any).modulationFreqGHz),
    num((input as any).modulationFreq_GHz),
    num((input as any).modulation_freq_ghz),
    num((input as any).mod_freq_ghz),
    num((input as any).drive_freq_ghz),
    num((input as any).driveFreqGHz),
  );
  const modulationHz = pick(
    num((input as any).modulationFreqHz),
    num((input as any).modulationFreq_Hz),
    num((input as any).modulation_freq_hz),
    num((input as any).mod_freq_hz),
    num((input as any).drive_freq_hz),
    num((input as any).driveFreqHz),
  );
  if (Number.isFinite(modulationGHz)) {
    setMeasured("measuredModulationFreqGHz", modulationGHz as number);
  } else if (Number.isFinite(modulationHz)) {
    setMeasured("measuredModulationFreqGHz", (modulationHz as number) / 1e9);
  }

  const pulseGHz = pick(
    num((input as any).measuredPulseFrequencyGHz),
    num((input as any).pulseFrequencyGHz),
    num((input as any).pulseFrequency_GHz),
    num((input as any).pulse_freq_ghz),
    num((input as any).pulseFreqGHz),
  );
  const pulseHz = pick(
    num((input as any).pulseFrequencyHz),
    num((input as any).pulseFrequency_Hz),
    num((input as any).pulse_freq_hz),
    num((input as any).pulseFreqHz),
  );
  if (Number.isFinite(pulseGHz)) {
    setMeasured("measuredPulseFrequencyGHz", pulseGHz as number);
  } else if (Number.isFinite(pulseHz)) {
    setMeasured("measuredPulseFrequencyGHz", (pulseHz as number) / 1e9);
  }

  const cycleUs = pick(
    num((input as any).measuredCycleLengthUs),
    num((input as any).cycleLengthUs),
    num((input as any).cycleLength_us),
    num((input as any).cycle_us),
  );
  const cycleMs = pick(
    num((input as any).cycleLengthMs),
    num((input as any).cycleLength_ms),
    num((input as any).cycle_ms),
  );
  const cycleNs = pick(
    num((input as any).cycleLengthNs),
    num((input as any).cycleLength_ns),
    num((input as any).cycle_ns),
  );
  if (Number.isFinite(cycleUs)) {
    setMeasured("measuredCycleLengthUs", cycleUs as number);
  } else if (Number.isFinite(cycleNs)) {
    setMeasured("measuredCycleLengthUs", (cycleNs as number) / 1e3);
  } else if (Number.isFinite(cycleMs)) {
    setMeasured("measuredCycleLengthUs", (cycleMs as number) * 1000);
  } else if (Number.isFinite(num(out.dwell_ms))) {
    setMeasured("measuredCycleLengthUs", (num(out.dwell_ms) as number) * 1000);
  }

  const burstLengthUs = pick(
    num((input as any).measuredBurstLengthUs),
    num((input as any).burstLengthUs),
    num((input as any).burstLength_us),
    num((input as any).burst_us),
  );
  if (Number.isFinite(burstLengthUs)) {
    setMeasured("measuredBurstLengthUs", burstLengthUs as number);
  } else if (Number.isFinite(burstNs)) {
    setMeasured("measuredBurstLengthUs", (burstNs as number) / 1e3);
  } else if (Number.isFinite(num(out.burst_ms))) {
    setMeasured("measuredBurstLengthUs", (num(out.burst_ms) as number) * 1000);
  }

  const dutyCycle = pick(
    num((input as any).measuredDutyCycle),
    num((input as any).dutyCycle),
    num((input as any).duty_cycle),
    num((input as any).duty),
  );
  if (Number.isFinite(dutyCycle)) {
    setMeasured("measuredDutyCycle", clamp01(dutyCycle as number));
  } else if (
    Number.isFinite(num(out.burst_ms)) &&
    Number.isFinite(num(out.dwell_ms)) &&
    (num(out.dwell_ms) as number) > 0
  ) {
    setMeasured(
      "measuredDutyCycle",
      clamp01((num(out.burst_ms) as number) / (num(out.dwell_ms) as number)),
    );
  }

  const sectorDuty = pick(
    num((input as any).measuredSectorDuty),
    num((input as any).sectorDuty),
    num((input as any).dutyEffectiveFR),
    num((input as any).dutyEffective_FR),
    num((input as any).dutyEffective),
    num((input as any).dutyShip),
  );
  if (Number.isFinite(sectorDuty)) {
    setMeasured("measuredSectorDuty", clamp01(sectorDuty as number));
  }

  const sectorCount = pick(
    num(out.sectorCount),
    num((input as any).measuredSectorCount),
  );
  if (Number.isFinite(sectorCount)) {
    const total = Math.max(1, Math.round(sectorCount as number));
    out.sectorCount = out.sectorCount ?? total;
    setMeasured("measuredSectorCount", total);
  }

  const cavityQ = pick(
    num((input as any).measuredCavityQ),
    num((input as any).cavityQ),
    num((input as any).qCavity),
    num((input as any).q_cavity),
    num((input as any).QL),
    num((input as any).q_loaded),
    num((input as any).Q_loaded),
  );
  if (Number.isFinite(cavityQ)) {
    setMeasured("measuredCavityQ", cavityQ as number);
  }

  const gammaGeo = pick(
    num((input as any).measuredGammaGeo),
    num((input as any).gammaGeo),
    num((input as any).gamma_geo),
  );
  if (Number.isFinite(gammaGeo)) {
    setMeasured("measuredGammaGeo", gammaGeo as number);
  }

  const gammaVdB = pick(
    num((input as any).measuredGammaVanDenBroeck),
    num((input as any).gammaVanDenBroeck),
    num((input as any).gammaVdB),
    num((input as any).gamma_vdb),
    num((input as any).gamma_vdB),
  );
  if (Number.isFinite(gammaVdB)) {
    setMeasured("measuredGammaVanDenBroeck", gammaVdB as number);
  }

  const qSpoil = pick(
    num((input as any).measuredQSpoilingFactor),
    num((input as any).qSpoilingFactor),
    num((input as any).q_spoiling),
    num((input as any).q_spoil),
    num((input as any).qSpoil),
  );
  if (Number.isFinite(qSpoil)) {
    setMeasured("measuredQSpoilingFactor", qSpoil as number);
  }

  const qMechanical = pick(
    num((input as any).measuredQMechanical),
    num((input as any).qMechanical),
    num((input as any).q_mechanical),
    num((input as any).qMech),
  );
  if (Number.isFinite(qMechanical)) {
    setMeasured("measuredQMechanical", qMechanical as number);
  }

  if (out.provenance == null && input.provenance == null) {
    out.provenance = "hardware";
  }

  return out;
}

export async function ingestHardwareSectorState(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    return res.status(200).end();
  }

  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");

  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : null;
  if (!body) {
    res.status(400).json({ error: "invalid-sector-state" });
    return;
  }

  const normalized = normalizeHardwareSectorStateInput(body);
  const parsed = hardwareSectorStateSchema.safeParse(normalized);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid-sector-state", details: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data as HardwareSectorState;
  const now = Date.now();
  const currentState = getGlobalPipelineState();
  const geometryTau_ms = computeTauLcMsFromHull(currentState?.hull ?? null) ?? BASELINE_TAU_LC_MS;
  const geometryMs = Number.isFinite(geometryTau_ms) ? (geometryTau_ms as number) : null;
  const candidateTau_ms = Number(payload.tauLC_ms);
  if (
    Number.isFinite(candidateTau_ms) &&
    candidateTau_ms > 0 &&
    Number.isFinite(geometryMs) &&
    (geometryMs as number) > 0
  ) {
    const drift =
      Math.max(candidateTau_ms, geometryMs as number) /
      Math.max(1e-12, Math.min(candidateTau_ms, geometryMs as number));
    if (drift >= TAU_LC_UNIT_DRIFT_LIMIT) {
      console.warn("[helix-core] rejecting tauLC_ms from hardware", {
        candidate_ms: candidateTau_ms,
        geometry_ms: geometryMs as number,
        limit: TAU_LC_UNIT_DRIFT_LIMIT,
      });
      res.status(422).json({
        error: "tauLC-unit-mismatch",
        expected_ms: geometryMs as number,
        received_ms: candidateTau_ms,
        message: "tauLC_ms differs from hull-derived light-crossing; check ms vs microseconds.",
      });
      return;
    }
  }

  const loadKind: PulseLoadKind =
    payload.load === "midi" ? "midi" : payload.load === "launcher" ? "launcher" : "sector";
  const sensedPeakA = Number(payload.i_peak_A);
  if (Number.isFinite(sensedPeakA)) {
    const limitA = resolvePulseCeiling(loadKind);
    if (limitA != null && sensedPeakA > limitA) {
      return res.status(422).json({
        error: "i_peak_over_limit",
        load: loadKind,
        i_peak_A: sensedPeakA,
        limit_A: limitA,
        message: "Hardware-reported peak current exceeds configured ceiling.",
      });
    }
  }

  let strobeDuty: StrobeDutySummary | null = null;
  try {
    await pipeMutex.lock(async () => {
      const current = getGlobalPipelineState();
      const nextDynamic = {
        ...(current.dynamicConfig ?? {}),
      } as NonNullable<EnergyPipelineState["dynamicConfig"]>;
      const nextAmp = {
        ...((current.ampFactors ?? (current as any).amps ?? {}) as NonNullable<
          EnergyPipelineState["ampFactors"]
        >),
      };
      let hasDynamicMeasured = false;
      let hasAmpMeasured = false;
      const setDynamicMeasured = (key: string, value: number | undefined) => {
        if (!Number.isFinite(value)) return;
        (nextDynamic as Record<string, number>)[key] = value as number;
        hasDynamicMeasured = true;
      };
      const setAmpMeasured = (key: string, value: number | undefined) => {
        if (!Number.isFinite(value)) return;
        (nextAmp as Record<string, number>)[key] = value as number;
        hasAmpMeasured = true;
      };

      setDynamicMeasured(
        "measuredModulationFreqGHz",
        num((payload as any).measuredModulationFreqGHz),
      );
      setDynamicMeasured(
        "measuredPulseFrequencyGHz",
        num((payload as any).measuredPulseFrequencyGHz),
      );
      setDynamicMeasured(
        "measuredBurstLengthUs",
        num((payload as any).measuredBurstLengthUs),
      );
      setDynamicMeasured(
        "measuredCycleLengthUs",
        num((payload as any).measuredCycleLengthUs),
      );
      setDynamicMeasured(
        "measuredDutyCycle",
        num((payload as any).measuredDutyCycle),
      );
      setDynamicMeasured(
        "measuredSectorDuty",
        num((payload as any).measuredSectorDuty),
      );
      setDynamicMeasured(
        "measuredSectorCount",
        num((payload as any).measuredSectorCount),
      );
      setDynamicMeasured(
        "measuredCavityQ",
        num((payload as any).measuredCavityQ),
      );

      setAmpMeasured(
        "measuredGammaGeo",
        num((payload as any).measuredGammaGeo),
      );
      setAmpMeasured(
        "measuredGammaVanDenBroeck",
        num((payload as any).measuredGammaVanDenBroeck),
      );
      setAmpMeasured(
        "measuredQSpoilingFactor",
        num((payload as any).measuredQSpoilingFactor),
      );
      setAmpMeasured(
        "measuredQMechanical",
        num((payload as any).measuredQMechanical),
      );
      setAmpMeasured(
        "measuredCavityQ",
        num((payload as any).measuredCavityQ),
      );

      const payloadTsRaw =
        typeof payload.timestamp === "number" || typeof payload.timestamp === "string"
          ? Number(payload.timestamp)
          : NaN;
      const sampleTs = Number.isFinite(payloadTsRaw) ? payloadTsRaw : now;
      const sectorTotalResolved =
        pick(
          num((payload as any).measuredSectorCount),
          num((payload as any).sectorCount),
          num((current.hardwareTruth as any)?.strobeDuty?.sTotal),
          current.sectorCount,
          PAPER_DUTY.TOTAL_SECTORS,
        ) ?? PAPER_DUTY.TOTAL_SECTORS;
      const sectorTotal = Math.max(1, Math.round(sectorTotalResolved));
      const liveConcurrent = pick(num(payload.activeSectors), num(payload.sectorsConcurrent));
      const sLiveResolved = pick(liveConcurrent, current.activeSectors, current.concurrentSectors, 1) ?? 1;
      const sLive = Math.max(0, sLiveResolved);
      const burstMs = num(payload.burst_ms);
      const dwellMs = num(payload.dwell_ms);
      const measuredDutyCycle = num((payload as any).measuredDutyCycle);
      const dutyLocal = clamp01(
        Number.isFinite(measuredDutyCycle)
          ? (measuredDutyCycle as number)
          : Number.isFinite(burstMs) && Number.isFinite(dwellMs) && (dwellMs as number) > 0
          ? (burstMs as number) / (dwellMs as number)
          : pick(current.dutyBurst, (current as any).localBurstFrac, PAPER_DUTY.BURST_DUTY_LOCAL) ??
              PAPER_DUTY.BURST_DUTY_LOCAL,
      );
      const dutyEffMeasured = clamp01(dutyLocal * (sLive / Math.max(1, sectorTotal)));
      const strobeDutyLocal = recordStrobeDutySample({
        dutyEffective: dutyEffMeasured,
        ts: sampleTs,
        sLive,
        sTotal: sectorTotal,
        source: payload.provenance ?? "hardware",
      });
      strobeDuty = strobeDutyLocal;

      const next: EnergyPipelineState = {
        ...current,
        dutyBurst: dutyLocal,
        localBurstFrac: dutyLocal,
        concurrentSectors: Math.max(0, Math.round(sLive)),
        activeSectors: Math.max(0, Math.round(sLive)),
        sectorCount: sectorTotal,
        dutyEffective_FR: dutyEffMeasured,
        dutyEffectiveFR: dutyEffMeasured as any,
        dynamicConfig: hasDynamicMeasured ? nextDynamic : current.dynamicConfig,
        ampFactors: hasAmpMeasured ? nextAmp : current.ampFactors,
        hardwareTruth: {
          ...(current.hardwareTruth ?? {}),
          sectorState: { ...payload, updatedAt: now },
          strobeDuty: strobeDutyLocal,
          updatedAt: now,
        },
      };
      const updated = await calculateEnergyPipeline(next);
      if (payload.strobeHz != null && Number.isFinite(payload.strobeHz)) {
        updated.strobeHz = payload.strobeHz;
      }
      if (payload.phase01 != null && Number.isFinite(payload.phase01)) {
        const wrapped = ((payload.phase01 % 1) + 1) % 1;
        updated.phase01 = wrapped;
      }
      if (payload.phaseCont != null && Number.isFinite(payload.phaseCont)) {
        if (!updated.hardwareTruth) updated.hardwareTruth = {};
        if (!updated.hardwareTruth.sectorState) updated.hardwareTruth.sectorState = {};
        updated.hardwareTruth.sectorState.phaseCont = payload.phaseCont;
      }
      if (payload.pumpPhase_deg != null && Number.isFinite(payload.pumpPhase_deg)) {
        updated.pumpPhase_deg = payload.pumpPhase_deg;
      }
      if (payload.tauLC_ms != null && Number.isFinite(payload.tauLC_ms)) {
        updated.tauLC_ms = payload.tauLC_ms;
        updated.lightCrossing = {
          ...(updated.lightCrossing ?? {}),
          tauLC_ms: payload.tauLC_ms,
        };
      }
      if (payload.dwell_ms != null && Number.isFinite(payload.dwell_ms) && payload.dwell_ms > 0) {
        updated.sectorPeriod_ms = payload.dwell_ms;
      }
      if (
        payload.burst_ms != null &&
        payload.dwell_ms != null &&
        Number.isFinite(payload.dwell_ms) &&
        payload.dwell_ms > 0
      ) {
        const duty = Math.max(0, Math.min(1, payload.burst_ms / payload.dwell_ms));
        updated.dutyBurst = duty;
        (updated as any).localBurstFrac = duty;
      }
      if (payload.sectorsConcurrent != null && Number.isFinite(payload.sectorsConcurrent)) {
        updated.concurrentSectors = Math.max(0, Math.round(payload.sectorsConcurrent));
      }
      if (payload.activeSectors != null && Number.isFinite(payload.activeSectors)) {
        updated.activeSectors = Math.max(0, Math.round(payload.activeSectors));
      }
      if (updated.hardwareTruth) {
        updated.hardwareTruth.strobeDuty = updated.hardwareTruth.strobeDuty ?? strobeDuty;
      }
      setGlobalPipelineState(updated);
    });
  } catch (err) {
    console.error("[helix-core] ingest hardware sector state failed:", err);
    res.status(500).json({ error: "ingest-failed" });
    return;
  }

  hardwareBroadcast?.("sector-state", {
    type: "sector-state",
    payload,
    duty: strobeDuty ?? undefined,
    ts: now,
  });
  res.status(200).json({ ok: true });
}

export async function ingestHardwareQiSample(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    return res.status(200).end();
  }

  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");

  const body = req.body && typeof req.body === "object" ? req.body : null;
  if (!body) {
    res.status(400).json({ error: "invalid-qi-sample" });
    return;
  }

  const parsed = hardwareQiSampleSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid-qi-sample", details: parsed.error.flatten() });
    return;
  }

  const sample = parsed.data as HardwareQiSample;
  const now = Date.now();

  try {
    await pipeMutex.lock(async () => {
      const current = getGlobalPipelineState();
      const next: EnergyPipelineState = {
        ...current,
        hardwareTruth: {
          ...(current.hardwareTruth ?? {}),
          qiSample: { ...sample, updatedAt: now },
          updatedAt: now,
        },
      };
      const updated = await calculateEnergyPipeline(next);
      setGlobalPipelineState(updated);
    });
  } catch (err) {
    console.error("[helix-core] ingest hardware qi sample failed:", err);
    res.status(500).json({ error: "ingest-failed" });
    return;
  }

  hardwareBroadcast?.("qi-sample", {
    type: "qi-sample",
    payload: sample,
    ts: now,
  });
  res.status(200).json({ ok: true });
}

// NEW: expose exact computeEnergySnapshot result for client verification
export async function getEnergySnapshot(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  try {
    const isPost = req.method === 'POST';
    const body = (isPost && req.body && typeof req.body === 'object') ? req.body : {};
    const sim = (body.sim && typeof body.sim === 'object') ? body.sim : {};

    // allow ?mode=REAL|SHOW to override
    const modeQ = (typeof req.query?.mode === 'string') ? req.query.mode : undefined;
    if (modeQ && !sim.mode) (sim as any).mode = modeQ;

    const snapshot = await computeEnergySnapshot(sim);
    res.status(200).json(snapshot);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[getEnergySnapshot] error:", msg);
    res.status(500).json({ error: "computeEnergySnapshot failed", message: msg });
  }
}

export const VERSION = "helix-core-debug-0";
export function noop() { /* noop for debug */ }
export default { VERSION, noop };



