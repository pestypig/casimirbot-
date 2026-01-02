import {
  calculateEnergyPipeline,
  initializePipelineState,
  MODE_CONFIGS,
  PAPER_GEO,
  type EnergyPipelineState,
} from "../server/energy-pipeline";
import type {
  ConstraintResult,
  ConstraintSeverity,
  ViabilityResult,
  ViabilityStatus,
  WarpConfig,
  WarpSolverGuardrails,
  WarpViabilitySnapshot,
} from "../types/warpViability";
import type { PipelineSnapshot } from "../types/pipeline";
import { findWarpConstraint, loadWarpAgentsConfig, resolveConstraintSeverity } from "../modules/physics/warpAgents";

export type { ConstraintResult, ConstraintSeverity, ViabilityResult, ViabilityStatus, WarpConfig };


const CM2_TO_M2 = 1e-4;
const DEFAULT_TS_MIN = 100;
const TS_IDLE_JITTER_MIN = 99.5; // certificate-side buffer for rounding jitter when idle
const DEFAULT_THETA_MAX = 1e12;
const DEFAULT_MASS_TOL = 0.1; // ±10% band
const VDB_MIN = 0;
const VDB_MAX = 1e16;

const parseEnvNumber = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const GR_GUARDRAIL_THRESHOLDS = {
  H_rms: parseEnvNumber(process.env.WARP_GR_H_RMS_MAX, 1e-3),
  M_rms: parseEnvNumber(process.env.WARP_GR_M_RMS_MAX, 1e-3),
  lapseFloor: parseEnvNumber(process.env.WARP_GR_LAPSE_FLOOR_MIN, 0.2),
  betaMaxAbs: parseEnvNumber(process.env.WARP_GR_BETA_MAX_ABS, 1.0),
};

const toNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toFinite = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const clamp01 = (value: number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  return Math.max(0, Math.min(1, value));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const constraint = (
  id: string,
  description: string,
  severity: ConstraintSeverity,
  passed: boolean,
  lhs?: number,
  rhs?: number,
  details?: string,
  note?: string,
): ConstraintResult => {
  const margin = lhs !== undefined && rhs !== undefined ? lhs - rhs : undefined;
  return { id, description, severity, passed, lhs, rhs, margin, details, note };
};

function buildPipelineState(config: WarpConfig): EnergyPipelineState {
  const base = initializePipelineState();
  const radius = toNumber(config.bubbleRadius_m, base.shipRadius_m);
  const wall = config.wallThickness_m ?? base.hull?.wallThickness_m;
  const dutyCycle = clamp01(config.dutyCycle) ?? base.dutyCycle;

  const hull = {
    Lx_m: radius * 2,
    Ly_m: radius * 2,
    Lz_m: radius * 2,
    wallThickness_m: wall,
  };

  // Approximate tile area to honor an explicit tileCount request
  let tileArea_cm2 = base.tileArea_cm2;
  if (Number.isFinite(config.tileCount) && (config.tileCount as number) > 0) {
    const packing = PAPER_GEO.RADIAL_LAYERS * PAPER_GEO.PACKING;
    const sphereArea = 4 * Math.PI * Math.pow(radius, 2); // m^2
    const perTileArea_m2 = sphereArea / Math.max(1, (config.tileCount as number) / packing);
    tileArea_cm2 = Math.max(0.01, perTileArea_m2 / CM2_TO_M2);
  }

  const gammaGeo = toNumber(config.gammaGeoOverride, base.gammaGeo);

  return {
    ...base,
    hull,
    shipRadius_m: radius,
    dutyCycle,
    dutyShip: dutyCycle,
    tileArea_cm2,
    gammaGeo,
    ampFactors: {
      ...(base.ampFactors ?? {}),
      gammaGeo,
    },
  };
}

const extractDutyEffective = (state: EnergyPipelineState): number | undefined => {
  const dEff =
    (state as any).d_eff ??
    state.dutyEffective_FR ??
    (state as any).dutyEffectiveFR ??
    state.dutyShip ??
    state.dutyCycle;
  return typeof dEff === "number" && Number.isFinite(dEff) ? dEff : undefined;
};

const buildGrGuardrails = (
  pipeline: EnergyPipelineState,
  liveSnapshot?: PipelineSnapshot,
): WarpSolverGuardrails => {
  const gr = (liveSnapshot as any)?.gr ?? (pipeline as any)?.gr;
  const H_rms = toFinite(gr?.constraints?.H_constraint?.rms);
  const H_maxAbs = toFinite(gr?.constraints?.H_constraint?.maxAbs);
  const M_rms = toFinite(gr?.constraints?.M_constraint?.rms);
  const M_maxAbs = toFinite(gr?.constraints?.M_constraint?.maxAbs);
  const lapseMin = toFinite(gr?.gauge?.lapseMin);
  const betaMaxAbs = toFinite(gr?.gauge?.betaMaxAbs);

  const missing: string[] = [];
  if (!Number.isFinite(H_rms)) missing.push("H_constraint_rms");
  if (!Number.isFinite(M_rms)) missing.push("M_constraint_rms");
  if (!Number.isFinite(lapseMin)) missing.push("lapse_floor");
  if (!Number.isFinite(betaMaxAbs)) missing.push("beta_max_abs");

  return {
    source: gr ? "pipeline-gr" : "proxy",
    proxy: missing.length > 0,
    ...(missing.length ? { missing } : {}),
    H_constraint: {
      rms: H_rms,
      maxAbs: H_maxAbs,
      threshold: GR_GUARDRAIL_THRESHOLDS.H_rms,
      exceeded: Number.isFinite(H_rms)
        ? (H_rms as number) > GR_GUARDRAIL_THRESHOLDS.H_rms
        : undefined,
    },
    M_constraint: {
      rms: M_rms,
      maxAbs: M_maxAbs,
      threshold: GR_GUARDRAIL_THRESHOLDS.M_rms,
      exceeded: Number.isFinite(M_rms)
        ? (M_rms as number) > GR_GUARDRAIL_THRESHOLDS.M_rms
        : undefined,
    },
    lapse: {
      floor: lapseMin,
      threshold: GR_GUARDRAIL_THRESHOLDS.lapseFloor,
      exceeded: Number.isFinite(lapseMin)
        ? (lapseMin as number) < GR_GUARDRAIL_THRESHOLDS.lapseFloor
        : undefined,
    },
    beta: {
      maxAbs: betaMaxAbs,
      threshold: GR_GUARDRAIL_THRESHOLDS.betaMaxAbs,
      exceeded: Number.isFinite(betaMaxAbs)
        ? (betaMaxAbs as number) > GR_GUARDRAIL_THRESHOLDS.betaMaxAbs
        : undefined,
    },
  };
};

type EvaluateOpts = {
  snapshot?: PipelineSnapshot;
  telemetrySource?: string;
  telemetryHeaders?: Record<string, string | number | undefined>;
};

export async function evaluateWarpViability(
  config: WarpConfig,
  opts: EvaluateOpts = {},
): Promise<ViabilityResult> {
  const liveSnapshot = opts.snapshot;
  const agentsConfig = await loadWarpAgentsConfig().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load WARP_AGENTS.md: ${message}`);
  });

  const applySpec = (
    id: string,
    fallback: { severity: ConstraintSeverity; description: string },
  ): { severity: ConstraintSeverity; description: string } => {
    const spec = findWarpConstraint(agentsConfig, id);
    return {
      severity: resolveConstraintSeverity(agentsConfig, id, fallback.severity),
      description: spec?.description ?? fallback.description,
    };
  };

  const pipelineState = buildPipelineState(config);
  let pipeline = await calculateEnergyPipeline(pipelineState);

  const dutyEffective = extractDutyEffective(pipeline);
  const gammaGeoCubed = Math.pow(pipeline.gammaGeo ?? 0, 3);
  const gammaVdB = (pipeline as any).gammaVanDenBroeck_mass ?? pipeline.gammaVanDenBroeck;
  const qiGuard = (liveSnapshot?.qiGuardrail as any) ?? (pipeline as any).qiGuardrail;
  const modeConfig = MODE_CONFIGS[pipeline.currentMode] as { zeta_max?: number } | undefined;
  const zetaMax = modeConfig?.zeta_max ?? 1;
  const theta = (pipeline as any).thetaCal ?? (pipeline as any).thetaScaleExpected;
  const mTarget = pipeline.exoticMassTarget_kg ?? pipelineState.exoticMassTarget_kg;
  const T00Value =
    (pipeline as any).warp?.stressEnergyTensor?.T00 ??
    (pipeline as any).stressEnergy?.T00 ??
    (pipeline as any).T00_avg;
  const rebuildTsTelemetry = (pipe: any, override?: PipelineSnapshot) => {
    const lc = pipe?.lightCrossing ?? {};
    const liveTs = override?.ts;
    const tauLC_ms_val = Number.isFinite(lc.tauLC_ms)
      ? Number(lc.tauLC_ms)
      : Number.isFinite(pipe?.tauLC_ms)
      ? Number(pipe.tauLC_ms)
      : Number.isFinite(liveTs?.tauLC_ms)
      ? Number(liveTs?.tauLC_ms)
      : undefined;
    const tauPulse_ms_val = Number.isFinite(lc.burst_ms)
      ? Number(lc.burst_ms)
      : Number.isFinite(pipe?.burst_ms)
      ? Number(pipe.burst_ms)
      : Number.isFinite(liveTs?.tauPulse_ns)
      ? Number(liveTs?.tauPulse_ns) / 1e6
      : undefined;
    const tauPulse_ns_val =
      Number.isFinite(tauPulse_ms_val) && tauPulse_ms_val !== undefined
        ? tauPulse_ms_val * 1e6
      : undefined;
    const baseTelemetry = (pipe as any)?.ts ?? {};
    const telemetry = {
      ...baseTelemetry,
      TS_ratio: liveTs?.ratio ?? baseTelemetry?.TS_ratio ?? (pipe as any)?.TS_ratio,
      tauLC_ms: liveTs?.tauLC_ms ?? baseTelemetry?.tauLC_ms ?? tauLC_ms_val,
      tauPulse_ns: liveTs?.tauPulse_ns ?? baseTelemetry?.tauPulse_ns ?? tauPulse_ns_val,
      autoscale: liveTs?.autoscale ?? baseTelemetry?.autoscale ?? (pipe as any)?.tsAutoscale,
    };
    return { telemetry, lc, tauLC_ms: tauLC_ms_val, tauPulse_ms: tauPulse_ms_val };
  };

  const deriveTsParts = (pipe: any, override?: PipelineSnapshot) => {
    const { telemetry, lc, tauLC_ms, tauPulse_ms } = rebuildTsTelemetry(pipe, override);
    const tauLC_s =
      Number.isFinite(telemetry?.tauLC_ms) && (telemetry as any).tauLC_ms > 0
        ? ((telemetry as any).tauLC_ms as number) / 1000
        : Number.isFinite(tauLC_ms) && (tauLC_ms as number) > 0
        ? (tauLC_ms as number) / 1000
        : undefined;
    const tauPulse_s =
      Number.isFinite(telemetry?.tauPulse_ns) && (telemetry as any).tauPulse_ns > 0
      ? ((telemetry as any).tauPulse_ns as number) / 1e9
        : Number.isFinite(tauPulse_ms) && (tauPulse_ms as number) > 0
        ? (tauPulse_ms as number) / 1000
        : undefined;
    const tauLC_ns =
      Number.isFinite((lc as any)?.tauLC_ns) && (lc as any).tauLC_ns > 0
        ? Number((lc as any).tauLC_ns)
        : Number.isFinite(tauLC_ms) && (tauLC_ms as number) > 0
        ? (tauLC_ms as number) * 1e6
        : undefined;
    const tsAutoscale = liveSnapshot?.ts?.autoscale ?? (pipe as any).tsAutoscale ?? (telemetry as any).autoscale;
    const appliedBurst_ns =
      Number.isFinite((tsAutoscale as any)?.appliedBurst_ns) && (tsAutoscale as any).appliedBurst_ns > 0
        ? Number((tsAutoscale as any).appliedBurst_ns)
        : undefined;
    const tsFromRatio = Number.isFinite((telemetry as any)?.TS_ratio)
      ? Number((telemetry as any).TS_ratio)
      : undefined;
    const tsFromTimes =
      Number.isFinite(tauLC_s) && Number.isFinite(tauPulse_s) && (tauPulse_s as number) > 0
        ? (tauLC_s as number) / (tauPulse_s as number)
        : undefined;
    const tsFromApplied =
      Number.isFinite(tauLC_ns) && Number.isFinite(appliedBurst_ns) && (appliedBurst_ns as number) > 0
        ? (tauLC_ns as number) / (appliedBurst_ns as number)
        : undefined;

    const tsOverride = Number.isFinite(liveSnapshot?.ts?.ratio) ? Number(liveSnapshot?.ts?.ratio) : undefined;
    const tsValue = tsOverride ?? tsFromRatio ?? tsFromTimes ?? pipeline.TS_ratio;

    return {
      telemetry,
      lc,
      tauLC_ms,
      tauPulse_ms,
      tauLC_s,
      tauPulse_s,
      tsFromRatio,
      tsFromTimes,
      tsFromApplied,
      tsValue,
      tsAutoscale,
    };
  };

  let tsParts = deriveTsParts(pipeline, liveSnapshot);
  let tsAutoscale = tsParts.tsAutoscale;
  const tsAutoscaleEngagedInitial = Boolean((tsAutoscale as any)?.engaged);
  const tsAutoscaleGatingInitial = (tsAutoscale as any)?.gating ?? "idle";
  const settleWaitMs = Math.max(
    Number.isFinite((pipeline as any).sectorPeriod_ms) ? Number((pipeline as any).sectorPeriod_ms) : 0,
    100,
  );
  let resampleCount = 0;
  while (tsAutoscaleEngagedInitial && (tsAutoscale as any)?.gating === "active" && resampleCount < 2) {
    await sleep(settleWaitMs);
    pipeline = await calculateEnergyPipeline(pipeline);
    tsParts = deriveTsParts(pipeline, liveSnapshot);
    tsAutoscale = tsParts.tsAutoscale;
    resampleCount += 1;
    if ((tsAutoscale as any)?.gating !== "active") break;
  }
  const tsAutoscaleEngaged = Boolean((tsAutoscale as any)?.engaged);
  const tsAutoscaleGating = (tsAutoscale as any)?.gating ?? "idle";
  const tsResolved =
    tsAutoscaleGating === "active"
      ? tsParts.tsFromRatio ?? tsParts.tsFromApplied ?? tsParts.tsFromTimes ?? pipeline.TS_ratio
      : tsParts.tsFromRatio ?? tsParts.tsFromTimes ?? tsParts.tsFromApplied ?? pipeline.TS_ratio;
  const tsOverride = Number.isFinite(liveSnapshot?.ts?.ratio) ? Number(liveSnapshot?.ts?.ratio) : undefined;
  const TS = Number.isFinite(tsOverride)
    ? (tsOverride as number)
    : Number.isFinite(tsResolved)
    ? (tsResolved as number)
    : pipeline.TS_ratio;
  const tsAutoscaleResampled =
    tsAutoscaleEngagedInitial && tsAutoscaleGatingInitial === "active" && resampleCount > 0;
  const tsTelemetry = tsParts.telemetry;
  const lightCrossing = tsParts.lc ?? {};
  const tauPulse_ms = tsParts.tauPulse_ms;
  const grGuardrails = buildGrGuardrails(pipeline, liveSnapshot);

  const snapshot: WarpViabilitySnapshot = {
    bubbleRadius_m: config.bubbleRadius_m ?? pipeline.shipRadius_m,
    wallThickness_m: config.wallThickness_m ?? pipeline.hull?.wallThickness_m,
    targetVelocity_c: config.targetVelocity_c,
    tileCount: pipeline.N_tiles,
    tileArea_cm2: pipeline.tileArea_cm2,
    dutyCycle: pipeline.dutyCycle,
    d_eff: dutyEffective,
    U_static: pipeline.U_static,
    TS_ratio: Number.isFinite(TS) ? TS : pipeline.TS_ratio,
    gamma_geo_cubed: gammaGeoCubed,
    gamma_VdB: gammaVdB,
    gammaGeo: pipeline.gammaGeo,
    M_exotic: pipeline.M_exotic,
    thetaCal: theta,
    zeta: (pipeline as any).zeta,
    qiGuardrail: qiGuard?.marginRatio,
    T00_min: (pipeline as any).T00_min ?? T00Value,
    T00_avg: T00Value,
    sectorPeriod_ms: pipeline.sectorPeriod_ms,
    dwell_ms: Number.isFinite(lightCrossing.dwell_ms) ? Number(lightCrossing.dwell_ms) : undefined,
    burst_ms: Number.isFinite(tauPulse_ms) ? Number(tauPulse_ms) : undefined,
    ts: tsTelemetry,
    grGuardrails,
    telemetrySource: liveSnapshot ? opts.telemetrySource ?? "pipeline-live" : opts.telemetrySource ?? "solver",
    pipelineHeaders: opts.telemetryHeaders,
  };

  const results: ConstraintResult[] = [];

  // Ford–Roman / QI guardrail
  if (qiGuard && Number.isFinite(qiGuard.marginRatio)) {
    const meta = applySpec("FordRomanQI", {
      severity: "HARD",
      description: "Quantum inequality (Ford–Roman) margin < 1.0",
    });
    const passed = qiGuard.marginRatio < 1;
    results.push(
      constraint(
        "FordRomanQI",
        meta.description,
        meta.severity,
        passed,
        qiGuard.marginRatio,
        1,
        `lhs=${qiGuard.lhs_Jm3 ?? "n/a"} bound=${qiGuard.bound_Jm3 ?? "n/a"}`,
      ),
    );
  } else if (pipeline.fordRomanCompliance !== undefined) {
    const meta = applySpec("FordRomanQI", {
      severity: "HARD",
      description: "Quantum inequality (Ford–Roman) margin < 1.0",
    });
    results.push(
      constraint(
        "FordRomanQI",
        meta.description,
        meta.severity,
        Boolean(pipeline.fordRomanCompliance),
        (pipeline as any).zeta,
        zetaMax,
      ),
    );
  }

  // TS ratio ladder
  const tsValue = Number(TS);
  if (Number.isFinite(tsValue)) {
    const meta = applySpec("TS_ratio_min", {
      severity: "SOFT",
      description: "Minimum TS_ratio for stable warp bubble",
    });
    const tsDetail = `TS_ratio=${tsValue} required>=${DEFAULT_TS_MIN}`;
    const idleJitterPass = tsAutoscaleGating === "idle" && tsValue >= TS_IDLE_JITTER_MIN;
    const passed = tsValue >= DEFAULT_TS_MIN || idleJitterPass;
    const noteParts = [];
    if (tsAutoscaleEngaged && tsValue < DEFAULT_TS_MIN) noteParts.push("mitigation:ts_autoscale");
    else if (tsAutoscaleEngaged) noteParts.push("TS_autoscale_active");
    if (idleJitterPass) noteParts.push("idle_jitter_buffer");
    const note = noteParts.length ? noteParts.join(";") : undefined;
    const details = tsAutoscaleEngaged
      ? `${tsDetail}; TS_autoscale_active=true; gating=${tsAutoscaleGating}; resamples=${resampleCount}`
      : tsDetail;
    const tsConstraint = constraint(
      "TS_ratio_min",
      meta.description,
      meta.severity,
      passed,
      tsValue,
      DEFAULT_TS_MIN,
      details,
      note,
    );
    results.push(tsConstraint);
  }

  // Theta calibration band
  if (theta !== undefined) {
    const meta = applySpec("ThetaAudit", {
      severity: "HARD",
      description: "Theta calibration within allowed band",
    });
    results.push(
      constraint(
        "ThetaAudit",
        meta.description,
        meta.severity,
        Math.abs(theta) <= DEFAULT_THETA_MAX,
        Math.abs(theta),
        DEFAULT_THETA_MAX,
        `|thetaCal|=${Math.abs(theta)} max=${DEFAULT_THETA_MAX}`,
      ),
    );
  }

  // Exotic mass budget
  if (pipeline.M_exotic !== undefined) {
    const meta = applySpec("M_exotic_budget", {
      severity: "SOFT",
      description: "Exotic mass within configured budget",
    });
    const limit = Math.abs(mTarget) * (1 + DEFAULT_MASS_TOL);
    results.push(
      constraint(
        "M_exotic_budget",
        meta.description,
        meta.severity,
        Math.abs(pipeline.M_exotic) <= limit,
        Math.abs(pipeline.M_exotic),
        limit,
        `|M_exotic|=${Math.abs(pipeline.M_exotic)} budget=${limit}`,
      ),
    );
  }

  // Van den Broeck compression band
  if (gammaVdB !== undefined) {
    const meta = applySpec("VdB_band", {
      severity: "SOFT",
      description: "Van den Broeck compression factor in configured band",
    });
    const inBand = gammaVdB >= VDB_MIN && gammaVdB <= VDB_MAX;
    results.push(
      constraint(
        "VdB_band",
        meta.description,
        meta.severity,
        inBand,
        gammaVdB,
        VDB_MAX,
        `gamma_VdB=${gammaVdB} band=[${VDB_MIN}, ${VDB_MAX}]`,
      ),
    );
  }

  const anyHardFail = results.some((c) => c.severity === "HARD" && !c.passed);
  const anySoftFail = results.some((c) => c.severity === "SOFT" && !c.passed);
  const status: ViabilityStatus = anyHardFail ? "INADMISSIBLE" : anySoftFail ? "MARGINAL" : "ADMISSIBLE";

  return {
    status,
    constraints: results,
    snapshot,
    mitigation: tsAutoscaleResampled ? ["TS_autoscale_resampled"] : undefined,
    citations: [
      "docs/alcubierre-alignment.md",
      "server/energy-pipeline.ts",
      "modules/dynamic/stress-energy-equations.ts",
      "tests/theory-checks.spec.ts",
    ],
  };
}
