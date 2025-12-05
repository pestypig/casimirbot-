import {
  calculateEnergyPipeline,
  initializePipelineState,
  type EnergyPipelineState,
} from "../server/energy-pipeline";

export type PipelineParams = Partial<EnergyPipelineState>;

export interface PipelineSnapshot {
  U_static?: number;
  TS_ratio?: number;
  gamma_geo_cubed?: number;
  d_eff?: number;
  gamma_VdB?: number;
  gammaGeo?: number;
  M_exotic?: number;
  thetaCal?: number;
  T00?: number;
  [key: string]: unknown;
}

export interface ValidatedSnapshot {
  snapshot: PipelineSnapshot;
  citations: {
    U_static: string[];
    TS_ratio: string[];
    gamma_geo_cubed: string[];
    d_eff: string[];
    gamma_VdB: string[];
    M_exotic: string[];
    thetaCal: string[];
    T00: string[];
  };
}

export async function runPhysicsValidation(
  params: PipelineParams = {},
): Promise<ValidatedSnapshot> {
  const baseState = initializePipelineState();
  const state: EnergyPipelineState = { ...baseState, ...params };

  const result = await calculateEnergyPipeline(state);

  const dutyEffective = (result as any).d_eff
    ?? result.dutyEffective_FR
    ?? result.dutyShip
    ?? result.dutyCycle;

  const snapshot: PipelineSnapshot = {
    U_static: result.U_static,
    TS_ratio: result.TS_ratio,
    gamma_geo_cubed: Math.pow(result.gammaGeo ?? 0, 3),
    d_eff: dutyEffective,
    gamma_VdB: result.gammaVanDenBroeck,
    gammaGeo: result.gammaGeo,
    M_exotic: result.M_exotic,
    thetaCal: (result as any).thetaCal,
    T00:
      (result as any).warp?.stressEnergyTensor?.T00
      ?? (result as any).stressEnergy?.T00
      ?? (result as any).T00_avg,
  };

  const citations = {
    U_static: [
      "docs/casimir-tile-mechanism.md",
      "modules/sim_core/static-casimir.ts",
      "tests/test_static.py",
    ],
    TS_ratio: [
      "server/energy-pipeline.ts (TS_ratio ladder)",
      "warp-web/js/physics-core.js (ledger math)",
    ],
    gamma_geo_cubed: [
      "docs/alcubierre-alignment.md (geo gamma ladder)",
      "server/energy-pipeline.ts (gamma_geo ladder)",
    ],
    d_eff: [
      "docs/alcubierre-alignment.md (Van den Broeck thickness)",
      "modules/warp/warp-module.ts",
    ],
    gamma_VdB: [
      "docs/alcubierre-alignment.md (VdB section)",
      "tests/theory-checks.spec.ts",
    ],
    M_exotic: [
      "modules/dynamic/stress-energy-equations.ts (T00 -> mass)",
      "tests/test_stress_energy_equations.py",
    ],
    thetaCal: [
      "docs/alcubierre-alignment.md (theta audit)",
      "server/energy-pipeline.ts (thetaCal)",
    ],
    T00: [
      "modules/dynamic/stress-energy-equations.ts",
      "tests/stress-energy-brick.spec.ts",
    ],
  };

  return { snapshot, citations };
}
