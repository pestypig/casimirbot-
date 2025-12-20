import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { z } from "zod";
// Use built-in fetch when available (Node ≥18), fallback to node-fetch
import {
  initializePipelineState,
  calculateEnergyPipeline,
  switchMode,
  updateParameters,
  computeEnergySnapshot,
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
  serializeBrick,
  type CurvBrickParams,
  type Vec3,
  type CurvDebugStamp,
  setCurvatureDebugStamp,
  clearCurvatureDebugStamp,
  getCurvatureDebugStamp,
} from "./curvature-brick";
import {
  buildStressEnergyBrick,
  serializeStressEnergyBrick,
  type StressEnergyBrickParams,
} from "./stress-energy-brick";
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
} from "../shared/schema.js";
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
} from "../shared/schema.js";
import {
  applyHullBasisToDims,
  HULL_BASIS_IDENTITY,
  isIdentityHullBasis,
  resolveHullBasis,
  type HullBasisResolved,
} from "../shared/hull-basis.js";
import { getSpectrumSnapshots, postSpectrum } from "./metrics/spectrum.js";
import type { SpectrumSnapshot } from "./metrics/spectrum.js";
import { slewPump } from "./instruments/pump.js";

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
  beta_trans: z.number().min(0).max(1).optional(),
  powerFillCmd: z.number().min(0).max(1).optional(),
  dynamicConfig: dynamicConfigUpdateSchema.optional(),
  negativeFraction: z.number().min(0).max(1).optional(),
  dutyCycle: z.number().min(0).max(1).optional(),
  localBurstFrac: z.number().min(0).max(1).optional(),
  sectorsConcurrent: z.number().int().min(1).max(10_000).optional(),
  sectorStrobing: z.number().int().min(1).max(10_000).optional(),
  qSpoilingFactor: z.number().min(0).max(10).optional(),
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
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

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
  load_document: z.object({ docId: z.string() })
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
  type PipelineParamInput = Partial<Omit<EnergyPipelineState, "hull" | "warpGeometry">> & {
    hull?: Partial<EnergyPipelineState["hull"]>;
    warpGeometry?: WarpGeometryInput;
  } & Record<string, any>;
  const params: PipelineParamInput = { ...parsed.data };
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
    const newState = await pipeMutex.lock(async () => {
      const curr = getGlobalPipelineState();
      const next = await switchMode(curr, mode as EnergyPipelineState['currentMode']);
      setGlobalPipelineState(next);
      return next;
    });

    // Write calibration for phase diagram integration  
    await writePhaseCalibration({
      tile_area_cm2: newState.tileArea_cm2,
      ship_radius_m: newState.shipRadius_m || 86.5,
      P_target_W: 100e6, // Use fixed target power for now
      M_target_kg: newState.exoticMassTarget_kg || 1400,
      zeta_target: 0.5
    }, 'mode_change');

    publish("warp:reload", { reason: "mode-change", mode, ts: Date.now() });

    res.json({ success: true, mode, state: newState, config: MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS] });
  } catch (error) {
    res.status(400).json({ error: "Failed to switch mode", details: error instanceof Error ? error.message : "Unknown error" });
  }
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

export function getCurvatureBrick(req: Request, res: Response) {
  if (req.method === "OPTIONS") { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const state = getGlobalPipelineState();
    const hull = state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
    const bounds: CurvBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET" ? req.query : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };

    const qualityDims = dimsForQuality(typeof query.quality === "string" ? query.quality : undefined);
    const dims = parseDimsParam(query.dims, qualityDims);
    const phase01 = parseNumberParam(query.phase01, 0);
    const sigmaSector = parseNumberParam(query.sigmaSector, 0.05);
    const splitEnabled = parseBooleanParam(query.splitEnabled, false);
    const splitFrac = parseNumberParam(query.splitFrac, 0.6);
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
    const hull = state.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.45 };
    const bounds: StressEnergyBrickParams["bounds"] = {
      min: [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2],
      max: [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2],
    };

    const query = req.method === "GET" ? req.query : { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const qualityDims = dimsForQuality(typeof query.quality === "string" ? query.quality : undefined);
    const dims = parseDimsParam(query.dims, qualityDims);
    const phase01 = parseNumberParam(query.phase01, 0);
    const sigmaSector = parseNumberParam(query.sigmaSector, 0.05);
    const splitEnabled = parseBooleanParam(query.splitEnabled, false);
    const splitFrac = parseNumberParam(query.splitFrac, 0.6);
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
    const payload = serializeStressEnergyBrick(brick);
    res.json(payload);
  } catch (err) {
    console.error("[helix-core] stress-energy brick error:", err);
    const message = err instanceof Error ? err.message : "Failed to build stress-energy brick";
    res.status(500).json({ error: message });
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

export async function ingestHardwareSectorState(req: Request, res: Response) {
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
    res.status(400).json({ error: "invalid-sector-state" });
    return;
  }

  const parsed = hardwareSectorStateSchema.safeParse(body);
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
      const payloadTsRaw =
        typeof payload.timestamp === "number" || typeof payload.timestamp === "string"
          ? Number(payload.timestamp)
          : NaN;
      const sampleTs = Number.isFinite(payloadTsRaw) ? payloadTsRaw : now;
      const sectorTotalResolved =
        pick(
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
      const dutyLocal = clamp01(
        Number.isFinite(burstMs) && Number.isFinite(dwellMs) && (dwellMs as number) > 0
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
