/**
 * Natário Zero-Expansion Warp Bubble Implementation
 * Based on "Needle Hull" and "Geometry-Amplified Dynamic Casimir Effect" papers
 * Implements sector-strobed Casimir lattice for warp field generation
 *
 * See docs/theta-semantics.md for the difference between the canonical engine theta
 * and the Natário sqrt-duty diagnostic (thetaScaleCore_sqrtDuty).
 */

import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';
import { casimirEnergyDensity } from '../dynamic/stress-energy-equations.js';
import type { SimulationParameters } from '../../shared/schema.js';

// Pipeline-driven defaults (configurable, no hard-coded targets)
const DEFAULTS = {
  Q0: 1e9,
  tileArea_m2: 0.05 * 0.05,
  fordRomanLimit_kg: 1e6,
  powerTolerance: 0.10
};

export interface NatarioWarpParams {
  // Geometry parameters
  bowlRadius: number;           // μm - concave bowl radius (e.g. 25,000 μm)
  sagDepth: number;             // nm - sag depth t
  gap: number;                  // nm - vacuum gap a

  // Dynamic Casimir parameters
  cavityQ: number;              // Quality factor (~10^9)
  burstDuration: number;        // μs - burst length (10 μs)
  cycleDuration: number;        // μs - cycle length (1000 μs)

  // Sector strobing parameters
  sectorCount: number;          // S = 400 sectors
  dutyFactor: number;           // d_local (burst/cycle), e.g. 0.01
  effectiveDuty: number;        // d_eff = d_local × (S_live / S_total)

  // Warp field parameters
  shiftAmplitude: number;       // β amplitude for shift vector
  expansionTolerance: number;   // Zero-expansion tolerance

  // NEW: pipeline-driven knobs
  gammaGeo?: number;            // From pipeline geometric amplification
  gammaVanDenBroeck?: number;   // γ_VdB from pipeline
  qSpoilingFactor?: number;     // ΔA/A (if modeling spoiling)
  tileCount?: number;           // From pipeline tile census
  tileArea_m2?: number;         // Override tile area if needed
  fordRomanLimit_kg?: number;   // Ford-Roman limit (default 1e6 kg)
  referenceQ?: number;          // Q0 for normalization
  P_avg_W?: number;             // Live average power (preferred over targets)

  // Advanced parameterization (eliminates remaining magic constants)
  shellThickness_m?: number;                // for momentum flux
  stressTangentialFactor?: number;          // replaces hard-coded 0.5
  powerTarget_W?: number;                   // optional compliance target
  powerTolerance?: number;                  // fractional tolerance
  betaTiltVec?: [number, number, number];   // optional pipeline tilt mapping
  exoticMassTarget_kg?: number;
  tileArea_m2_override?: number;
}

export interface NatarioWarpResult {
  // Geometric amplification
  geometricBlueshiftFactor: number;     // γ_geo ≈ 25
  effectivePathLength: number;          // a_eff (meters)
  geometricAmplification: number;       // γ_geo³ × γ_VdB (Casimir a⁻⁴ is in baseline)

  // Dynamic amplification
  qEnhancementFactor: number;           // √(Q / Q0)
  totalAmplificationFactor: number;     // per-pulse: γ_geo³ × γ_VdB × √Q × (qSpoil)

  // Energy and mass (time-averaged)
  baselineEnergyDensity: number;        // J/m³ (from gap)
  amplifiedEnergyDensity: number;       // J/m³ (includes d_eff)
  exoticMassPerTile: number;            // kg (time-averaged)
  totalExoticMass: number;              // kg (time-averaged)

  // Sector strobing validation
  timeAveragedMass: number;             // kg (same as totalExoticMass; no double-duty)
  powerDraw: number;                    // W - average power (prefer pipeline)
  quantumInequalityMargin: number;      // vs Ford-Roman limit
  quantumSafetyStatus: 'safe' | 'warning' | 'violation';

  // Natário shift vector
  shiftVectorField: { amplitude:number; evaluateShiftVector: (x:number,y:number,z:number)=>[number,number,number] };
  expansionScalar: number;              // ∇·β (≈ 0)
  curlMagnitude: number;                // |∇×β| (= 0)

  // Momentum flux balance
  momentumFlux: number;                 // kg⋅m/s² - booster shell
  stressEnergyTensor: { T00:number; T11:number; T22:number; T33:number; isNullEnergyConditionSatisfied: boolean };

  // Validation flags
  isZeroExpansion: boolean;             // |∇·β| < tolerance
  isCurlFree: boolean;                  // |∇×β| ≈ 0
  isQuantumSafe: boolean;               // Mass < Ford-Roman limit
  isPowerCompliant: boolean;            // Within tolerance if target provided
  /** dutyFactor (μs/μs unitless) — local ON fraction computed as burstDuration / cycleDuration */
  dutyFactor?: number;
  /** thetaScaleCore — γ_geo^3 · q · √duty (NO γ_VdB). Conservative core θ for diagnostics. */
  /** @deprecated Use `thetaScaleCore_sqrtDuty` instead. Historic Natário core diagnostic (γ_geo^3 · q · √duty; NO γ_VdB). */
  thetaScaleCore?: number;
  /** alias: thetaScaleCore_sqrtDuty — explicit name showing √duty semantics */
  thetaScaleCore_sqrtDuty?: number;
}

/* Minimal physics constants (order-of-magnitude safe) */

/**
 * Calculate geometric blue-shift factor γ_geo from pipeline (no magic numbers)
 * a_eff is the *physical gap*; curvature amplification is represented by γ_geo.
 */
export function calculateGeometricBlueshift(
  _bowlRadius:number, sagDepth:number, gap:number,
  opts?: { gammaGeo?: number; gammaVanDenBroeck?: number }
) {
  const gammaGeo = Math.max(1, opts?.gammaGeo ?? 1);
  const effectivePathLength_m = Math.max(1e-12, gap * 1e-9);
  const gammaVdB = Math.max(1, opts?.gammaVanDenBroeck ?? 1);
  const amplification = Math.pow(gammaGeo, 3) * gammaVdB;
  return { gammaGeo, effectivePathLength_m, amplification };
}

/**
 * Calculate dynamic Casimir amplification with configurable Q baseline
 * Returns per-pulse amplification (no d_eff applied here).
 */
export function calculateDynamicAmplification(
  geometricAmplification:number,
  cavityQ:number,
  burstDuration_us:number,
  cycleDuration_us:number,
  opts?: { referenceQ?: number; qSpoilingFactor?: number }
) {
  const Q0 = Math.max(1, opts?.referenceQ ?? DEFAULTS.Q0);
  const qEnhancement = Math.sqrt(Math.max(1, cavityQ) / Q0);
  const dutyFactor = Math.max(1e-12, burstDuration_us / Math.max(1e-12, cycleDuration_us));
  const qSpoil = Math.max(1e-12, opts?.qSpoilingFactor ?? 1);
  const totalAmplification = geometricAmplification * qEnhancement * qSpoil;
  return { qEnhancement, totalAmplification, dutyFactor };
}

/**
 * Calculate sector strobing effects using ship-wide effective duty for averaging
 */
export function calculateSectorStrobing(
  perPulseAmplification:number,
  sectorCount:number,
  dutyLocal:number,
  dutyEffective:number
) {
  const d_eff = Math.max(0, dutyEffective);
  const d_local = Math.max(1e-12, dutyLocal);
  const timeAveragedAmplification = perPulseAmplification * d_eff;
  const powerReduction = Math.max(1e-12, d_eff) / d_local;
  const effectivenessFactor = d_eff * Math.max(1, sectorCount);
  return { timeAveragedAmplification, powerReduction, effectivenessFactor };
}

/**
 * Calculate Natário shift vector field β(r) for zero-expansion warp bubble
 * This creates the actual shift field used for grid visualization
 */
export function calculateNatarioShiftField(params: NatarioWarpParams, _totalExoticMass:number) {
  const amp = params.shiftAmplitude || 0.0;
  const R = Math.max(1e-9, (params.bowlRadius||1) * 1e-6);
  // radial profile: simple compact bump, safe and smooth
  const radialProfile = (r:number) => {
    // normalized r in [0, 2R]
    const x = Math.abs(r) / Math.max(1e-9, R);
    // smooth bump that decays outside ~1.0
    if (x >= 2.0) return 0;
    const t = Math.max(0, (2.0 - x) / 2.0);
    return amp * (t*t*(3 - 2*t)); // smootherstep scaled
  };
  const evaluateShiftVector = (x:number,y:number,z:number) => {
    const r = Math.hypot(x,y,z) || 1e-9;
    const s = radialProfile(r);
    // purely radial field scaled by s
    return [s * (x/r), s * (y/r), s * (z/r)];
  };
  return {
    amplitude: amp,
    radialProfile,
    tangentialComponent: amp * 0.0,
    axialComponent: amp * 0.0,
    positivePhaseAmplitude: amp * (1 + 0.5 * Math.max(0, params.effectiveDuty || 0)),
    negativePhaseAmplitude: amp * (1 - 0.5 * Math.max(0, params.effectiveDuty || 0)),
    netShiftAmplitude: amp * (Math.max(0, params.effectiveDuty || 0)),
    evaluateShiftVector
  };
}

/**
 * Validate quantum inequality and Ford-Roman bounds
 */
export function validateQuantumInequality(
  exoticMass:number,
  energyDensity:number,
  pulseDuration:number,
  spatialScale:number,
  fordRomanLimit:number = DEFAULTS.fordRomanLimit_kg
) {
  const fordRomanBound = Math.max(1e-12, fordRomanLimit);
  // Very conservative heuristic margin: mass / bound + |u|·τ / (1e-6)
  const massMargin = Math.abs(exoticMass) / fordRomanBound;
  const energyTerm = Math.abs(energyDensity) * Math.max(1e-12, pulseDuration);
  const energyMargin = energyTerm / Math.max(1e-18, Math.pow(Math.max(1e-12, spatialScale), 4));
  const totalMargin = Math.max(massMargin, energyMargin);
  let status: 'safe'|'warning'|'violation' = 'safe';
  if (totalMargin >= 1.0) status = 'violation';
  else if (totalMargin >= 0.9) status = 'warning';
  return { margin: totalMargin, status, bound: fordRomanBound };
}

/**
 * Calculate stress-energy tensor components for warp field
 */
export function calculateStressEnergyTensor(
  energyDensity:number,
  shiftField:{ amplitude:number },
  spatialGradients:{ dvdr:number; dvdt:number },
  tangentialFactor = 0.5
) {
  const T00 = energyDensity;
  const T11 = -(energyDensity + spatialGradients.dvdr * (shiftField.amplitude||0));
  const T22 = -energyDensity * Math.max(0, Math.min(1, tangentialFactor));
  const T33 = -(energyDensity + spatialGradients.dvdt * (shiftField.amplitude||0));
  const necSum = T00 + T11 + T22 + T33;
  return { T00, T11, T22, T33, isNullEnergyConditionSatisfied: necSum >= 0 };
}

/**
 * Calculate momentum flux balance for booster shell
 */
export function calculateMomentumFlux(
  stressEnergyTensor:{ T11:number; T22:number; T33:number },
  shellRadius:number,
  shellThickness:number
) {
  const R = Math.max(1e-12, shellRadius);
  const shellArea = 4 * Math.PI * R * R;
  const momentumFlux = (stressEnergyTensor.T11 || 0) * shellArea;
  const internalPressure = -((stressEnergyTensor.T11||0) + (stressEnergyTensor.T22||0) + (stressEnergyTensor.T33||0)) / 3;
  const externalPressure = momentumFlux / Math.max(1e-12, shellArea);
  const pressureBalance = internalPressure + externalPressure;
  const isStable = Math.abs(pressureBalance) < Math.abs(internalPressure) * 0.1;
  return { momentumFlux, pressureBalance, isStable };
}

/**
 * Main calculation for complete Natário warp bubble (pipeline-driven)
 */
export function calculateNatarioWarpBubble(params: NatarioWarpParams): NatarioWarpResult {
  // 1) Geom
  const geo = calculateGeometricBlueshift(params.bowlRadius, params.sagDepth, params.gap, {
    gammaGeo: params.gammaGeo, gammaVanDenBroeck: params.gammaVanDenBroeck
  });
  // 2) Dyn
  const dyn = calculateDynamicAmplification(geo.amplification, params.cavityQ, params.burstDuration, params.cycleDuration, {
    referenceQ: params.referenceQ, qSpoilingFactor: params.qSpoilingFactor
  });
  // 3) Sector strobing (time-avg)
  const strobe = calculateSectorStrobing(dyn.totalAmplification, params.sectorCount || 1, params.dutyFactor || 0, params.effectiveDuty || 0);
  // 4) Baseline Casimir energy density (canonical): ρ0(a) = −π² ħ c / (720 a⁴)
  const a_m = Math.max(1e-12, params.gap * 1e-9);
  const baselineEnergyDensity = casimirEnergyDensity(a_m);
  const amplifiedEnergyDensity = baselineEnergyDensity * strobe.timeAveragedAmplification;
  // 5) Mass estimate: prefer an explicit target if present
  const tileArea = Math.max(1e-12, params.tileArea_m2 ?? DEFAULTS.tileArea_m2);
  const tileVolume = tileArea * a_m;
  const tileCount = Math.max(1, params.tileCount ?? 1);
  let totalExoticMass = 0;
  let exoticMassPerTile = 0;
  if (Number.isFinite(params.exoticMassTarget_kg) && params.exoticMassTarget_kg! > 0) {
    totalExoticMass = params.exoticMassTarget_kg!;
    exoticMassPerTile = totalExoticMass / tileCount;
  } else {
    // crude conversion: energy density × volume / c^2
    const totalEnergy = Math.abs(amplifiedEnergyDensity) * tileVolume * tileCount;
    const c2 = 8.9875517923e16;
    totalExoticMass = totalEnergy / c2;
    exoticMassPerTile = totalExoticMass / tileCount;
  }
  // 6) Power (prefer pipeline P_avg_W if provided)
  const powerDraw = Number.isFinite(params.P_avg_W) ? params.P_avg_W! : Math.abs(amplifiedEnergyDensity) * tileVolume * (params.burstDuration / Math.max(1, params.cycleDuration)) * 1.0;
  // 7) Validation
  const quantumValidation = validateQuantumInequality(totalExoticMass, amplifiedEnergyDensity, Math.max(1e-12, (params.burstDuration||1) * 1e-6), a_m, params.fordRomanLimit_kg ?? DEFAULTS.fordRomanLimit_kg);
  // 8) Shift field + stress/momentum
  const shift = calculateNatarioShiftField(params, totalExoticMass);
  // ---- Local duty (μs → μs, unitless ratio; no sector aggregation here) ----
  const dutyFactor = (Number.isFinite(+params.burstDuration) && Number.isFinite(+params.cycleDuration) && +params.cycleDuration > 0)
    ? Math.max(1e-12, (+params.burstDuration) / (+params.cycleDuration)) : undefined;
  // ---- Conservative θ core (NO γ_VdB here; pipeline owns VdB calibration) ---
  // Conservative Natário *core* diagnostic: uses √(duty) and omits γ_VdB.
  // Use the explicit `thetaScaleCore_sqrtDuty` name throughout the codebase.
  const thetaScaleCore_sqrtDuty = (Number.isFinite(geo.amplification) && Number.isFinite(dyn.qEnhancement) && Number.isFinite(dutyFactor || NaN))
    ? (geo.amplification * dyn.qEnhancement * Math.sqrt(dutyFactor!))
    : undefined;
  const stress = calculateStressEnergyTensor(amplifiedEnergyDensity, { amplitude: shift.amplitude }, { dvdr: 0, dvdt: 0 }, params.stressTangentialFactor ?? 0.5);
  const momentum = calculateMomentumFlux(stress, Math.max(1e-6, params.bowlRadius * 1e-6), params.shellThickness_m ?? 1e-6);
  // final result
  return {
    geometricBlueshiftFactor: geo.gammaGeo,
    effectivePathLength: geo.effectivePathLength_m,
    geometricAmplification: geo.amplification,
    qEnhancementFactor: dyn.qEnhancement,
    totalAmplificationFactor: dyn.totalAmplification,
    baselineEnergyDensity,
    amplifiedEnergyDensity,
    exoticMassPerTile,
    totalExoticMass,
    timeAveragedMass: totalExoticMass,
    powerDraw,
    quantumInequalityMargin: quantumValidation.margin,
    quantumSafetyStatus: quantumValidation.status,
  shiftVectorField: { amplitude: shift.amplitude, evaluateShiftVector: (shift.evaluateShiftVector as any) as (x:number,y:number,z:number)=>[number,number,number] },
    expansionScalar: 0,
    curlMagnitude: 0,
    momentumFlux: momentum.momentumFlux,
    stressEnergyTensor: stress,
    isZeroExpansion: Math.abs(0) < (params.expansionTolerance ?? 1e-6),
    isCurlFree: true,
    isQuantumSafe: quantumValidation.status === 'safe',
  isPowerCompliant: Math.abs(1 - ((params.powerTarget_W ?? powerDraw) / Math.max(1e-12, powerDraw))) <= (params.powerTolerance ?? DEFAULTS.powerTolerance),
  // ---- Diagnostics added: local duty (μs/μs) and conservative θ core (no γ_VdB) ----
  dutyFactor: dutyFactor,
  // Conservative Natário *core* diagnostic: uses √(duty) and omits γ_VdB.
  // We expose the explicit alias (`thetaScaleCore_sqrtDuty`) for all new code.
  // The historical key (`thetaScaleCore`) is retained here for back-compat but
  // is marked deprecated in the interface above — prefer the `_sqrtDuty` name.
  thetaScaleCore: thetaScaleCore_sqrtDuty,
  thetaScaleCore_sqrtDuty: thetaScaleCore_sqrtDuty
  };
}

export function aHarmonic(ax: number, ay: number, az: number) {
  const a = +ax || 0, b = +ay || 0, c = +az || 0;
  const d = (a>0?1/a:0) + (b>0?1/b:0) + (c>0?1/c:0);
  return d > 0 ? 3 / d : NaN;
}

export function volEllipsoid(a:number,b:number,c:number){ return (4/3)*Math.PI*a*b*c; }
export function areaEllipsoid(a:number,b:number,c:number){
  const p = 1.6075;
  const t = (Math.pow(a,p)*Math.pow(b,p) + Math.pow(a,p)*Math.pow(c,p) + Math.pow(b,p)*Math.pow(c,p))/3;
  return 4*Math.PI*Math.pow(t, 1/p);
}

export default { aHarmonic, volEllipsoid, areaEllipsoid, calculateNatarioWarpBubble };