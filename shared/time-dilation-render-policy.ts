import type {
  TimeDilationBannerState,
  TimeDilationDataSource,
  TimeDilationNormalization,
  TimeDilationRenderMode,
  TimeDilationRenderPlan,
} from "./schema";

export type EnergyPipelineLike = {
  warpFieldType?: string | null;
  dynamicConfig?: { warpFieldType?: string | null } | null;
};

export type BrickChannelRange = {
  min: number;
  max: number;
};

export type GrEvolveBrickLike = {
  channels?: Record<string, BrickChannelRange | undefined> | null;
  extraChannels?: Record<string, BrickChannelRange | undefined> | null;
} | null;

export type LapseBrickLike = {
  channels?: Record<string, BrickChannelRange | undefined> | null;
  extraChannels?: Record<string, BrickChannelRange | undefined> | null;
} | null;

const ALCUBIERRE_GEOM_WARP_SCALE = 1;
const NATARIO_GEOM_WARP_SCALE = 0.75;
const ALCUBIERRE_BETA_WARP_WEIGHT = 0.85;
const THETA_WARP_SCALE = 0.7;
const BETA_WARP_VIS_TARGET = 0.12;
const BETA_WARP_VIS_MIN = 0.5;
const BETA_WARP_VIS_MAX = 2;
const GAMMA_WARP_VIS_TARGET = 0.3;
const GAMMA_WARP_VIS_MIN = 0.5;
const GAMMA_WARP_VIS_MAX = 2;
const SHEAR_WARP_VIS_TARGET = 0.18;
const SHEAR_WARP_VIS_MIN = 0.5;
const SHEAR_WARP_VIS_MAX = 2;
const WARP_CAP_CELL_MULT = 1.2;
const METRIC_BLEND = 0.45;
const METRIC_BLEND_MAX = 1.5;
const SHEAR_STRENGTH = 0.35;
const SHEAR_STRENGTH_MAX = 2.5;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const resolveWarpMode = (pipeline: EnergyPipelineLike | null): TimeDilationRenderMode => {
  const raw =
    (pipeline as any)?.warpFieldType ??
    (pipeline as any)?.dynamicConfig?.warpFieldType;
  return String(raw).toLowerCase() === "alcubierre" ? "alcubierre" : "natario";
};

const resolveChannelRange = (
  brick: GrEvolveBrickLike | LapseBrickLike | null | undefined,
  key: string,
): { min: number; max: number; maxAbs: number } | null => {
  if (!brick) return null;
  const channel =
    (brick as any)?.channels?.[key] ?? (brick as any)?.extraChannels?.[key];
  if (!channel) return null;
  const min = Number((channel as any).min);
  const max = Number((channel as any).max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max, maxAbs: Math.max(Math.abs(min), Math.abs(max)) };
};

const resolveScaledNormalization = (params: {
  enabled: boolean;
  percentile: number | null | undefined;
  proxy: boolean;
  baseScale: number;
  target: number;
  min: number;
  max: number;
}): TimeDilationNormalization => {
  const baseScale = Math.max(0, params.baseScale);
  if (!params.enabled) {
    return { mode: "off", scale: 0, percentile: null, baseScale };
  }
  if (params.proxy) {
    return { mode: "proxy", scale: baseScale, percentile: null, baseScale };
  }
  if (Number.isFinite(params.percentile) && (params.percentile as number) > 0) {
    const dynamic = clampNumber(
      params.target / (params.percentile as number),
      params.min,
      params.max,
    );
    return {
      mode: "percentile",
      scale: Math.max(0, baseScale * dynamic),
      percentile: params.percentile as number,
      baseScale,
    };
  }
  return { mode: "range", scale: baseScale, percentile: null, baseScale };
};

const resolveThetaNormalization = (params: {
  enabled: boolean;
  proxy: boolean;
  range: { maxAbs: number } | null;
  percentile: number | null | undefined;
}): TimeDilationNormalization => {
  if (!params.enabled) {
    return { mode: "off", scale: 0, percentile: null, baseScale: 0 };
  }
  const maxAbs = params.range?.maxAbs ?? 0;
  if (!Number.isFinite(maxAbs) || maxAbs <= 0) {
    return { mode: "missing", scale: 0, percentile: null, baseScale: 0 };
  }
  const baseScale = Math.max(0, 1 / maxAbs);
  if (params.proxy) {
    return { mode: "proxy", scale: baseScale, percentile: null, baseScale };
  }
  if (Number.isFinite(params.percentile) && (params.percentile as number) > 0) {
    return {
      mode: "percentile",
      scale: Math.max(0, 1 / (params.percentile as number)),
      percentile: params.percentile as number,
      baseScale,
    };
  }
  return { mode: "range", scale: baseScale, percentile: null, baseScale };
};

export type TimeDilationRenderUiToggles = {
  hasHull: boolean;
  wallDetectionAvailable?: boolean;
  wallDetected?: boolean | null;
  wallSource?: "kretschmann" | "ricci4";
  grRequested: boolean;
  grCertified: boolean;
  anyProxy: boolean;
  mathStageOK: boolean;
  cellSize: number;
  solverStatus?: "CERTIFIED" | "UNSTABLE" | "NOT_CERTIFIED";
  exploratoryOverride?: boolean;
  cinematicOverride?: boolean;
  natarioGeometryWarp?: boolean;
  visualTuning: {
    betaScale: number;
    gammaScale: number;
    kijScale: number;
    gammaEnabled: boolean;
    kijEnabled: boolean;
  };
  betaPercentile?: number | null;
  thetaPercentile?: number | null;
  gammaPercentile?: number | null;
  shearPercentile?: number | null;
};

export const computeTimeDilationRenderPlan = (
  pipelineState: EnergyPipelineLike | null,
  grBrick: GrEvolveBrickLike | null | undefined,
  lapseBrick: LapseBrickLike | null | undefined,
  ui: TimeDilationRenderUiToggles,
): TimeDilationRenderPlan => {
  const mode = resolveWarpMode(pipelineState);
  const hasGrBrick = Boolean(grBrick);
  const hasLapseBrick = Boolean(lapseBrick);
  const reasons: string[] = [];
  const solverStatus = ui.solverStatus ?? "NOT_CERTIFIED";
  const overrideUnstable =
    Boolean(ui.exploratoryOverride) && solverStatus !== "CERTIFIED";
  const solverCertified = solverStatus === "CERTIFIED" || overrideUnstable;
  const grCertifiedForViz = ui.grCertified || overrideUnstable;
  const cinematicOverride = Boolean(ui.cinematicOverride);
  const natarioGeometryWarp = Boolean(ui.natarioGeometryWarp);
  const wallDetectionAvailable = Boolean(ui.wallDetectionAvailable);
  const wallDetected = wallDetectionAvailable ? Boolean(ui.wallDetected) : true;
  const effectiveHull = ui.hasHull && (!wallDetectionAvailable || wallDetected);

  if (!ui.hasHull) reasons.push("no hull applied");
  if (ui.hasHull && wallDetectionAvailable && !wallDetected) {
    reasons.push("invariant wall not detected");
  }
  if (!ui.mathStageOK) reasons.push("math stage blocked");
  if (!ui.grRequested) reasons.push("gr disabled");
  if (ui.grRequested && !hasGrBrick) reasons.push("waiting for GR brick");
  if (ui.anyProxy) reasons.push("proxy inputs present");
  if (hasGrBrick && !ui.grCertified) reasons.push("gr not certified");
  if (solverStatus === "UNSTABLE") reasons.push("solver fixups unstable");
  if (solverStatus === "NOT_CERTIFIED") reasons.push("solver not certified");
  if (overrideUnstable) reasons.push("exploratory override enabled");
  if (cinematicOverride) reasons.push("cinematic override enabled");

  let banner: TimeDilationBannerState = "CERTIFIED";
  if (!effectiveHull) {
    banner = "NO_HULL";
  } else if (ui.grRequested && !hasGrBrick) {
    banner = "WAITING_GR";
  } else if (!ui.mathStageOK) {
    banner = "WAITING_GR";
  } else if (ui.grRequested && hasGrBrick && solverStatus !== "CERTIFIED") {
    banner = "UNSTABLE";
  } else if (!ui.grRequested) {
    banner = "FALLBACK";
  } else if (ui.anyProxy || !ui.grCertified) {
    banner = "PROXY";
  }

  const canUseGr = ui.grRequested && hasGrBrick && ui.mathStageOK;
  const grCertified = ui.grCertified && solverCertified;
  const thetaVisible = effectiveHull && canUseGr && grCertifiedForViz && !ui.anyProxy;
  const allowGeometryWarp =
    mode === "alcubierre" ||
    cinematicOverride ||
    (mode === "natario" && natarioGeometryWarp);
  const enableGeometryWarp =
    allowGeometryWarp && effectiveHull && canUseGr && grCertifiedForViz && !ui.anyProxy;
  const cellSize = Number.isFinite(ui.cellSize) ? Math.max(0, ui.cellSize) : 0;
  const warpCap = Math.max(1e-6, cellSize * WARP_CAP_CELL_MULT);

  const sourceForAlpha: TimeDilationDataSource = canUseGr
    ? "gr-brick"
    : hasLapseBrick
      ? "lapse-brick"
      : "analytic-proxy";
  const sourceForClockRate = sourceForAlpha;
  const sourceForTheta: TimeDilationDataSource = thetaVisible ? "gr-brick" : "none";
  const sourceForBeta: TimeDilationDataSource = enableGeometryWarp ? "gr-brick" : "none";

  const geomWarpScale = enableGeometryWarp
    ? mode === "natario"
      ? NATARIO_GEOM_WARP_SCALE
      : ALCUBIERRE_GEOM_WARP_SCALE
    : 0;

  const betaWarpWeight = enableGeometryWarp ? ALCUBIERRE_BETA_WARP_WEIGHT : 0;
  const thetaWarpWeight = enableGeometryWarp ? THETA_WARP_SCALE : 0;

  const betaNorm = resolveScaledNormalization({
    enabled: enableGeometryWarp && sourceForBeta === "gr-brick",
    percentile: ui.betaPercentile,
    proxy: ui.anyProxy,
    baseScale: ui.visualTuning.betaScale,
    target: BETA_WARP_VIS_TARGET,
    min: BETA_WARP_VIS_MIN,
    max: BETA_WARP_VIS_MAX,
  });

  const gammaNorm = resolveScaledNormalization({
    enabled: enableGeometryWarp && ui.visualTuning.gammaEnabled,
    percentile: ui.gammaPercentile,
    proxy: ui.anyProxy,
    baseScale: ui.visualTuning.gammaScale,
    target: GAMMA_WARP_VIS_TARGET,
    min: GAMMA_WARP_VIS_MIN,
    max: GAMMA_WARP_VIS_MAX,
  });

  const shearNorm = resolveScaledNormalization({
    enabled: enableGeometryWarp && ui.visualTuning.kijEnabled,
    percentile: ui.shearPercentile,
    proxy: ui.anyProxy,
    baseScale: ui.visualTuning.kijScale,
    target: SHEAR_WARP_VIS_TARGET,
    min: SHEAR_WARP_VIS_MIN,
    max: SHEAR_WARP_VIS_MAX,
  });

  const thetaRange = resolveChannelRange(grBrick, "theta");
  const thetaNorm = resolveThetaNormalization({
    enabled: sourceForTheta === "gr-brick",
    proxy: ui.anyProxy,
    range: thetaRange,
    percentile: ui.thetaPercentile,
  });

  const metricBlend =
    enableGeometryWarp && ui.visualTuning.gammaEnabled
      ? Math.min(METRIC_BLEND_MAX, METRIC_BLEND * gammaNorm.scale)
      : 0;
  const shearWeight =
    enableGeometryWarp && ui.visualTuning.kijEnabled
      ? Math.min(SHEAR_STRENGTH_MAX, SHEAR_STRENGTH * shearNorm.scale)
      : 0;

  return {
    mode,
    flags: {
      hasHull: effectiveHull,
      hasGrBrick,
      grCertified,
      anyProxy: ui.anyProxy,
      mathStageOK: ui.mathStageOK,
      solverStatus,
      exploratoryOverride: Boolean(ui.exploratoryOverride),
      cinematicOverride,
      ...(mode === "natario" ? { natarioGeometryWarp } : {}),
      ...(wallDetectionAvailable ? { wallDetected } : {}),
      ...(wallDetectionAvailable && ui.wallSource
        ? { wallSource: ui.wallSource }
        : {}),
    },
    sourceForAlpha,
    sourceForBeta,
    sourceForTheta,
    sourceForClockRate,
    enableGeometryWarp,
    geomWarpScale,
    betaWarpWeight,
    thetaWarpWeight,
    shearWeight,
    metricBlend,
    warpCap,
    normalization: {
      beta: betaNorm,
      theta: thetaNorm,
      gamma: gammaNorm,
      shear: shearNorm,
    },
    banner,
    reasons,
  };
};
