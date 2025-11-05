/**
 * TheoryRefs:
 *  - vanden-broeck-1999: gamma_VdB feeds theta, T00 amplification product
 */

/**
 * Stress–Energy (pipeline-true) for Van den Broeck–Natário flow
 * No magic constants; reads γ_geo, Q, q_spoil, γ_VdB, duty from pipeline.
 */

import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';

const G = 6.67430e-11; // m^3 kg^-1 s^-2

/**
 * Pragmatic internal-Q model for Nb3Sn cavities.
 * Replace anchors with measured Rs/Q data when available.
 */
export function Qint_nb3sn(args: {
  T_K: number;
  f_GHz: number;
  roughness_m?: number;
  thickness_m?: number;
  Rres_nOhm?: number;
  Tc_K?: number;
  Qi_anchor?: number;
  f_anchor_GHz?: number;
  T_anchor_K?: number;
}): number {
  const {
    T_K,
    f_GHz,
    roughness_m = 0,
    thickness_m = 200e-9,
    Tc_K = 18,
    Qi_anchor = 3e7,
    f_anchor_GHz = 6,
    T_anchor_K = 2,
  } = args;

  // Effective gap factor in Kelvin (2Δ/kb ≈ 4.2 · Tc; use Δ/kb ≈ 2.1 · Tc)
  const B = 2.1 * Tc_K;
  const T_use = Math.max(T_K, 0.3);
  const tempFactor = Math.exp(B * (1 / T_use - 1 / T_anchor_K)) * (T_anchor_K / T_use);
  const freqFactor = Math.pow(f_anchor_GHz / Math.max(f_GHz, 0.1), 2);

  // Surface roughness penalty: ~0.2 per nm
  const rough_nm = roughness_m * 1e9;
  const roughFactor = Math.max(0.1, Math.min(1.0, 1 - 0.2 * rough_nm));

  // Thickness scaling around 200 nm (~5% per ±100 nm)
  const thicknessFactor = Math.max(
    0.8,
    Math.min(1.2, 1 + 0.05 * ((thickness_m - 200e-9) / 100e-9)),
  );

  let Qi = Qi_anchor * tempFactor * freqFactor * roughFactor * thicknessFactor;
  Qi = Math.max(1e4, Math.min(2e10, Qi));
  return Qi;
}

// ---------- Casimir baseline (volume energy density) ----------
/** ρ₀(a) = −π² ħ c / (720 a⁴)  (J/m³), a in meters */
export function casimirEnergyDensity(a_m: number): number {
  const a = Math.max(1e-12, a_m);
  const hbar_c = PHYSICS_CONSTANTS.HBAR_C; // J·m
  return -(Math.PI ** 2) * hbar_c / (720 * a ** 4);
}

// ---------- Pipeline amplification chain ----------
/**
 * A_inst = (γ_geo)^3 · √(Q/1e9) · γ_VdB · q_spoil  (dimensionless)
 * Notes:
 *  - Accepts aliases { gammaVdB, gammaVanDenBroeck }
 *  - Accepts aliases { deltaAOverA, qSpoilingFactor }
 *  - Defaults match live pipeline: γ_VdB≈1.4e5
 */
export function amplificationFromPipeline({
  gammaGeo = 26,
  cavityQ = 1e9,
  gammaVdB,
  gammaVanDenBroeck = 1.4e5,
  qSpoilingFactor,
  deltaAOverA = 1
}: {
  gammaGeo?: number;
  cavityQ?: number;
  gammaVdB?: number;
  gammaVanDenBroeck?: number;
  qSpoilingFactor?: number;
  deltaAOverA?: number;
}): number {
  const A_geo = Math.max(1, gammaGeo) ** 3;
  const qGain = Math.sqrt(Math.max(1, cavityQ) / 1e9);
  const vdb  = Math.max(1, (gammaVdB ?? gammaVanDenBroeck));
  const qsp  = Math.max(1e-6, (qSpoilingFactor ?? deltaAOverA));
  return A_geo * qGain * vdb * qsp;
}

/** Resolve FR-consistent average duty d_eff */
export function resolveDutyEff({
  dutyCycle,
  sectorStrobing,
  burst_ms,
  dwell_ms,
  dutyEffectiveFR
}: {
  dutyCycle?: number;
  sectorStrobing?: number;
  burst_ms?: number;
  dwell_ms?: number;
  dutyEffectiveFR?: number;
}): number {
  if (Number.isFinite(dutyEffectiveFR)) {
    return clamp01(dutyEffectiveFR as number);
  }
  if (Number.isFinite(burst_ms) && Number.isFinite(dwell_ms) && (dwell_ms as number) > 0) {
    // Treat provided burst/dwell as already ship-wide FR window.
    return clamp01((burst_ms as number) / (dwell_ms as number));
  }
  const d = clamp01(Number(dutyCycle) || 0);
  const S = Math.max(1, Math.floor(Number(sectorStrobing) || 1));
  return clamp01(d / S);
}

const clamp01 = (x: number)=> Math.max(0, Math.min(1, x));

// ---------- Average energy density (used by Tμν and β) ----------
/**
 * ρ_avg = ρ₀(a) · A_inst · d_eff
 * (Use this if you want time-averaged Tμν; for instantaneous, drop d_eff.)
 */
export function enhancedAvgEnergyDensity({
  gap_m,
  gammaGeo,
  cavityQ,
  gammaVdB,
  gammaVanDenBroeck,
  qSpoilingFactor,
  deltaAOverA,
  dutyEff
}: {
  gap_m: number;
  gammaGeo: number;
  cavityQ: number;
  gammaVdB?: number;
  gammaVanDenBroeck?: number;
  qSpoilingFactor?: number;
  deltaAOverA?: number;
  dutyEff: number;
}): { rho_avg: number; rho_inst: number } {
  const rho0 = casimirEnergyDensity(gap_m); // negative
  const A    = amplificationFromPipeline({ gammaGeo, cavityQ, gammaVdB, gammaVanDenBroeck, qSpoilingFactor, deltaAOverA });
  const rho_inst = rho0 * A;                 // instantaneous (no duty)
  const rho_avg  = rho_inst * clamp01(dutyEff);
  return { rho_avg, rho_inst };
}

// ---------- Stress–energy tensor (perfect-fluid proxy, w = −1) ----------
export function stressEnergyFromDensity(rho_J_per_m3: number) {
  // T00 = ρ ; Tij = −ρ δij
  return {
    T00: rho_J_per_m3,
    T11: -rho_J_per_m3,
    T22: -rho_J_per_m3,
    T33: -rho_J_per_m3,
  };
}

// ---------- Natário shift amplitude β ----------
/**
 * β(ρ, R) ≈ √(8πG |ρ| / c²) · R
 * Pass ρ_avg for cycle-averaged β, or ρ_inst for per-burst β.
 * (Do NOT apply √duty inside this; the choice of ρ already encodes it.)
 */
export function natarioShiftFromDensity(rho: number, R_geom_m: number): number {
  const c2 = PHYSICS_CONSTANTS.C * PHYSICS_CONSTANTS.C;
  const pref = Math.sqrt((8 * Math.PI * G * Math.abs(rho)) / c2);
  return pref * Math.max(1e-9, R_geom_m);
}

// ---------- One-shot adapter the pipeline can call ----------
/**
 * Produce time-averaged Tμν and β from the pipeline snapshot.
 * Also returns instantaneous density for diagnostics.
 */
export function toPipelineStressEnergy(p: {
  gap_nm: number;
  gammaGeo: number;
  cavityQ: number;
  gammaVdB?: number;
  gammaVanDenBroeck?: number;
  qSpoilingFactor?: number;
  deltaAOverA?: number;
  dutyCycle?: number;
  sectorStrobing?: number;
  dutyEffectiveFR?: number;
  lightCrossing?: { burst_ms?: number; dwell_ms?: number };
  R_geom_m?: number;               // ~ (abc)^(1/3) in meters
}) {
  const gap_m = Math.max(1e-12, (p.gap_nm ?? 1) * PHYSICS_CONSTANTS.NM_TO_M);
  const d_eff = resolveDutyEff({
    dutyCycle: p.dutyCycle,
    sectorStrobing: p.sectorStrobing,
    dutyEffectiveFR: p.dutyEffectiveFR,
    burst_ms: p.lightCrossing?.burst_ms,
    dwell_ms: p.lightCrossing?.dwell_ms
  });

  const { rho_avg, rho_inst } = enhancedAvgEnergyDensity({
    gap_m,
    gammaGeo: p.gammaGeo ?? 26,
    cavityQ: p.cavityQ ?? 1e9,
    gammaVdB: p.gammaVdB,
    gammaVanDenBroeck: p.gammaVanDenBroeck ?? 1.4e5,
    qSpoilingFactor: p.qSpoilingFactor,
    deltaAOverA: p.deltaAOverA,
    dutyEff: d_eff
  });

  const T = stressEnergyFromDensity(rho_avg);
  const Rg = Math.max(1e-6, p.R_geom_m ?? 1); // defensive floor at 1 µm
  const beta_avg = natarioShiftFromDensity(rho_avg, Rg);

  return { ...T, beta_avg, rho_avg, rho_inst, dutyEff: d_eff };
}
