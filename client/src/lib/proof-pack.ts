import { apiRequest } from "@/lib/queryClient";
import type { ProofPack, ProofValue } from "@shared/schema";
import type { EnergyPipelineState } from "@/hooks/use-energy-pipeline";

export const PROOF_PACK_STAGE_REQUIREMENTS = [
  { module: "shared/curvature-proxy.ts", minStage: "reduced-order" },
  { module: "client/src/physics/curvature.ts", minStage: "reduced-order" },
  { module: "client/src/lib/warp-proof-math.ts", minStage: "reduced-order" },
  { module: "server/helix-proof-pack.ts", minStage: "reduced-order" },
] as const;

export async function fetchProofPack(signal?: AbortSignal): Promise<ProofPack> {
  const res = await apiRequest("GET", "/api/helix/pipeline/proofs", undefined, signal);
  const json = await res.json();
  if (!json || json.kind !== "proof-pack") {
    throw new Error("Invalid proof-pack payload");
  }
  return json as ProofPack;
}

export const getProofValue = (
  pack: ProofPack | null | undefined,
  key: string,
): ProofValue | undefined => pack?.values?.[key];

export const readProofNumber = (
  pack: ProofPack | null | undefined,
  key: string,
): number | null => {
  const value = pack?.values?.[key]?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const readProofBoolean = (
  pack: ProofPack | null | undefined,
  key: string,
): boolean | null => {
  const value = pack?.values?.[key]?.value;
  return typeof value === "boolean" ? value : null;
};

export const readProofString = (
  pack: ProofPack | null | undefined,
  key: string,
): string | null => {
  const value = pack?.values?.[key]?.value;
  return typeof value === "string" ? value : null;
};

export const mapProofPackToPipeline = (
  pack: ProofPack | null | undefined,
): Partial<EnergyPipelineState> | null => {
  if (!pack) return null;
  const hull = {
    Lx_m: readProofNumber(pack, "hull_Lx_m") ?? undefined,
    Ly_m: readProofNumber(pack, "hull_Ly_m") ?? undefined,
    Lz_m: readProofNumber(pack, "hull_Lz_m") ?? undefined,
    wallThickness_m: readProofNumber(pack, "hull_wall_m") ?? undefined,
  };
  const mechanical = {
    requestedGap_nm: readProofNumber(pack, "mechanical_gap_req_nm") ?? undefined,
    constrainedGap_nm: readProofNumber(pack, "mechanical_gap_eff_nm") ?? undefined,
    mechSafetyFactor: readProofNumber(pack, "mechanical_safety_factor") ?? undefined,
    safetyFactorMin: readProofNumber(pack, "mechanical_safety_min") ?? undefined,
    loadPressure_Pa: readProofNumber(pack, "mechanical_load_pressure_Pa") ?? undefined,
    sigmaAllow_Pa: readProofNumber(pack, "mechanical_sigma_allow_Pa") ?? undefined,
    casimirPressure_Pa: readProofNumber(pack, "mechanical_casimir_pressure_Pa") ?? undefined,
    electrostaticPressure_Pa: readProofNumber(pack, "mechanical_electrostatic_pressure_Pa") ?? undefined,
    restoringPressure_Pa: readProofNumber(pack, "mechanical_restoring_pressure_Pa") ?? undefined,
    margin_Pa: readProofNumber(pack, "mechanical_margin_Pa") ?? undefined,
    maxStroke_pm: readProofNumber(pack, "mechanical_max_stroke_pm") ?? undefined,
    strokeFeasible: readProofBoolean(pack, "mechanical_stroke_feasible") ?? undefined,
    feasible: readProofBoolean(pack, "mechanical_feasible") ?? undefined,
    safetyFeasible: readProofBoolean(pack, "mechanical_safety_feasible") ?? undefined,
  };
  const gammaVanDenBroeckGuard = {
    limit: readProofNumber(pack, "vdb_limit") ?? undefined,
    pocketRadius_m: readProofNumber(pack, "vdb_pocket_radius_m") ?? undefined,
    pocketThickness_m: readProofNumber(pack, "vdb_pocket_thickness_m") ?? undefined,
    planckMargin: readProofNumber(pack, "vdb_planck_margin") ?? undefined,
    admissible: readProofBoolean(pack, "vdb_admissible") ?? undefined,
    reason: readProofString(pack, "vdb_reason") ?? undefined,
    requested: readProofNumber(pack, "gamma_vdb_requested") ?? undefined,
  };
  const gammaChain = {
    geo_cubed: readProofNumber(pack, "gamma_geo_cubed") ?? undefined,
    qGain: readProofNumber(pack, "q_gain") ?? undefined,
    pocketCompression: readProofNumber(pack, "gamma_vdb") ?? undefined,
    dutyEffective: readProofNumber(pack, "duty_effective") ?? undefined,
    qSpoiling: readProofNumber(pack, "q_spoil") ?? undefined,
    note: readProofString(pack, "gamma_chain_note") ?? undefined,
  };
  const bubble = {
    R: readProofNumber(pack, "bubble_R_m") ?? undefined,
    sigma: readProofNumber(pack, "bubble_sigma") ?? undefined,
    beta: readProofNumber(pack, "bubble_beta") ?? undefined,
  };
  return {
    P_avg_W: readProofNumber(pack, "power_avg_W") ?? undefined,
    P_avg: readProofNumber(pack, "power_avg_MW") ?? undefined,
    dutyEffectiveFR: readProofNumber(pack, "duty_effective") ?? undefined,
    dutyEffective_FR: readProofNumber(pack, "duty_effective") ?? undefined,
    dutyBurst: readProofNumber(pack, "duty_burst") ?? undefined,
    gammaGeo: readProofNumber(pack, "gamma_geo") ?? undefined,
    gammaVanDenBroeck: readProofNumber(pack, "gamma_vdb") ?? undefined,
    qCavity: readProofNumber(pack, "q_cavity") ?? undefined,
    qSpoilingFactor: readProofNumber(pack, "q_spoil") ?? undefined,
    U_static: readProofNumber(pack, "U_static_J") ?? undefined,
    U_geo: readProofNumber(pack, "U_geo_J") ?? undefined,
    U_Q: readProofNumber(pack, "U_Q_J") ?? undefined,
    U_cycle: readProofNumber(pack, "U_cycle_J") ?? undefined,
    U_static_total: readProofNumber(pack, "U_static_total_J") ?? undefined,
    M_exotic: readProofNumber(pack, "M_exotic_kg") ?? undefined,
    M_exotic_raw: readProofNumber(pack, "M_exotic_raw_kg") ?? undefined,
    massCalibration: readProofNumber(pack, "mass_calibration") ?? undefined,
    rho_static: readProofNumber(pack, "rho_static_J_m3") ?? undefined,
    rho_inst: readProofNumber(pack, "rho_inst_J_m3") ?? undefined,
    rho_avg: readProofNumber(pack, "rho_avg_J_m3") ?? undefined,
    TS_ratio: readProofNumber(pack, "ts_ratio") ?? undefined,
    zeta: readProofNumber(pack, "zeta") ?? undefined,
    fordRomanCompliance: readProofBoolean(pack, "ford_roman_ok") ?? undefined,
    natarioConstraint: readProofBoolean(pack, "natario_ok") ?? undefined,
    hullArea_m2: readProofNumber(pack, "hull_area_m2") ?? undefined,
    tileArea_cm2: readProofNumber(pack, "tile_area_cm2") ?? undefined,
    N_tiles: readProofNumber(pack, "tile_count") ?? undefined,
    hull,
    bubble,
    mechanical,
    gammaVanDenBroeckGuard,
    gammaChain,
  };
};

export const mergeProofPackIntoPipeline = (
  pack: ProofPack | null | undefined,
  pipeline: EnergyPipelineState | null | undefined,
): EnergyPipelineState | null => {
  if (!pipeline) return null;
  const mapped = mapProofPackToPipeline(pack);
  return mapped ? ({ ...pipeline, ...mapped } as EnergyPipelineState) : pipeline;
};
