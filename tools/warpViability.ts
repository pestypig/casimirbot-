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
  WarpViabilitySnapshot,
} from "../types/warpViability";
import { findWarpConstraint, loadWarpAgentsConfig, resolveConstraintSeverity } from "../modules/physics/warpAgents";

export type { ConstraintResult, ConstraintSeverity, ViabilityResult, ViabilityStatus, WarpConfig };


const CM2_TO_M2 = 1e-4;
const DEFAULT_TS_MIN = 100;
const DEFAULT_THETA_MAX = 1e12;
const DEFAULT_MASS_TOL = 0.1; // ±10% band
const VDB_MIN = 0;
const VDB_MAX = 1e16;

const toNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp01 = (value: number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  return Math.max(0, Math.min(1, value));
};

const constraint = (
  id: string,
  description: string,
  severity: ConstraintSeverity,
  passed: boolean,
  lhs?: number,
  rhs?: number,
  details?: string,
): ConstraintResult => {
  const margin = lhs !== undefined && rhs !== undefined ? lhs - rhs : undefined;
  return { id, description, severity, passed, lhs, rhs, margin, details };
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

export async function evaluateWarpViability(config: WarpConfig): Promise<ViabilityResult> {
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
  const pipeline = await calculateEnergyPipeline(pipelineState);

  const dutyEffective = extractDutyEffective(pipeline);
  const gammaGeoCubed = Math.pow(pipeline.gammaGeo ?? 0, 3);
  const gammaVdB = (pipeline as any).gammaVanDenBroeck_mass ?? pipeline.gammaVanDenBroeck;
  const qiGuard = (pipeline as any).qiGuardrail;
  const modeConfig = MODE_CONFIGS[pipeline.currentMode] as { zeta_max?: number } | undefined;
  const zetaMax = modeConfig?.zeta_max ?? 1;
  const theta = (pipeline as any).thetaCal ?? (pipeline as any).thetaScaleExpected;
  const mTarget = pipeline.exoticMassTarget_kg ?? pipelineState.exoticMassTarget_kg;
  const T00Value =
    (pipeline as any).warp?.stressEnergyTensor?.T00 ??
    (pipeline as any).stressEnergy?.T00 ??
    (pipeline as any).T00_avg;

  const snapshot: WarpViabilitySnapshot = {
    bubbleRadius_m: config.bubbleRadius_m ?? pipeline.shipRadius_m,
    wallThickness_m: config.wallThickness_m ?? pipeline.hull?.wallThickness_m,
    targetVelocity_c: config.targetVelocity_c,
    tileCount: pipeline.N_tiles,
    tileArea_cm2: pipeline.tileArea_cm2,
    dutyCycle: pipeline.dutyCycle,
    d_eff: dutyEffective,
    U_static: pipeline.U_static,
    TS_ratio: pipeline.TS_ratio,
    gamma_geo_cubed: gammaGeoCubed,
    gamma_VdB: gammaVdB,
    gammaGeo: pipeline.gammaGeo,
    M_exotic: pipeline.M_exotic,
    thetaCal: theta,
    zeta: (pipeline as any).zeta,
    qiGuardrail: qiGuard?.marginRatio,
    T00_min: (pipeline as any).T00_min ?? T00Value,
    T00_avg: T00Value,
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
  if (pipeline.TS_ratio !== undefined) {
    const meta = applySpec("TS_ratio_min", {
      severity: "SOFT",
      description: "Minimum TS_ratio for stable warp bubble",
    });
    results.push(
      constraint(
        "TS_ratio_min",
        meta.description,
        meta.severity,
        pipeline.TS_ratio >= DEFAULT_TS_MIN,
        pipeline.TS_ratio,
        DEFAULT_TS_MIN,
        `TS_ratio=${pipeline.TS_ratio} required>=${DEFAULT_TS_MIN}`,
      ),
    );
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
    citations: [
      "docs/alcubierre-alignment.md",
      "server/energy-pipeline.ts",
      "modules/dynamic/stress-energy-equations.ts",
      "tests/theory-checks.spec.ts",
    ],
  };
}
