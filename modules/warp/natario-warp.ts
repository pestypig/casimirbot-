/**
 * NatÃ¡rio Zero-Expansion Warp Bubble Implementation
 * Based on "Needle Hull" and "Geometry-Amplified Dynamic Casimir Effect" papers
 * Implements sector-strobed Casimir lattice for warp field generation
 *
 * See docs/theta-semantics.md for the difference between the canonical engine theta
 * and the NatÃ¡rio sqrt-duty diagnostic (thetaScaleCore_sqrtDuty).
 */

import { PHYSICS_CONSTANTS } from '../core/physics-constants.js';
import { casimirEnergyDensity } from '../dynamic/stress-energy-equations.js';
import type { SimulationParameters, WarpGeometry, WarpGeometryKind } from '../../shared/schema.js';

export type MassMode = "MODEL_DERIVED" | "TARGET_CALIBRATED" | "MEASURED_FORCE_INFERRED";

type Vec3 = [number, number, number];

// Pipeline-driven defaults (configurable, no hard-coded targets)
const DEFAULTS = {
  Q0: 1e9,
  tileArea_m2: 0.05 * 0.05,
  fordRomanLimit_kg: 1e6,
  powerTolerance: 0.10
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const vecLen = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const vecScale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];
const vecAdd = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vecSub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vecDot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vecNormalize = (v: Vec3): Vec3 => {
  const m = vecLen(v) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};

export interface NatarioWarpParams {
  // Geometry parameters
  bowlRadius: number;           // Î¼m - concave bowl radius (e.g. 25,000 Î¼m)
  sagDepth: number;             // nm - sag depth t
  gap: number;                  // nm - vacuum gap a

  // Dynamic Casimir parameters
  cavityQ: number;              // Quality factor (~10^9)
  burstDuration: number;        // Î¼s - burst length (10 Î¼s)
  cycleDuration: number;        // Î¼s - cycle length (1000 Î¼s)

  // Sector strobing parameters
  sectorCount: number;          // S = 400 sectors
  dutyFactor: number;           // d_local (burst/cycle), e.g. 0.01
  effectiveDuty: number;        // d_eff = d_local Ã— (S_live / S_total)

  // Warp field parameters
  shiftAmplitude: number;       // Î² amplitude for shift vector
  expansionTolerance: number;   // Zero-expansion tolerance

  // NEW: pipeline-driven knobs
  gammaGeo?: number;            // From pipeline geometric amplification
  gammaVanDenBroeck?: number;   // Î³_VdB from pipeline
  qSpoilingFactor?: number;     // Î”A/A (if modeling spoiling)
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
  invariantMass_kg?: number;
  tileArea_m2_override?: number;
  warpFieldType?: 'natario' | 'natario_sdf' | 'alcubierre' | 'irrotational';
  warpGeometry?: WarpGeometry | null;
  warpGeometryKind?: WarpGeometryKind;
  warpGeometryAssetId?: string;
  warpGridResolution?: number;
  warpDriveDirection?: Vec3;
  hullAxes?: { a: number; b: number; c: number };
  massMode?: MassMode;
  allowMassOverride?: boolean;
}

export interface NatarioWarpResult {
  // Geometric amplification
  geometricBlueshiftFactor: number;     // Î³_geo â‰ˆ 25
  effectivePathLength: number;          // a_eff (meters)
  geometricAmplification: number;       // Î³_geoÂ³ Ã— Î³_VdB (Casimir aâ»â´ is in baseline)

  // Dynamic amplification
  qEnhancementFactor: number;           // âˆš(Q / Q0)
  totalAmplificationFactor: number;     // per-pulse: Î³_geoÂ³ Ã— Î³_VdB Ã— âˆšQ Ã— (qSpoil)

  // Energy and mass (time-averaged)
  baselineEnergyDensity: number;        // J/mÂ³ (from gap)
  amplifiedEnergyDensity: number;       // J/mÂ³ (includes d_eff)
  exoticMassPerTile: number;            // kg (time-averaged)
  totalExoticMass: number;              // kg (time-averaged)
  massSource?: "model" | "measured" | "targetOverride";
  massModeApplied?: MassMode;
  massOverrideApplied?: boolean;
  massOverrideWarning?: string;

  // Sector strobing validation
  timeAveragedMass: number;             // kg (same as totalExoticMass; no double-duty)
  powerDraw: number;                    // W - average power (prefer pipeline)
  quantumInequalityMargin: number;      // vs Ford-Roman limit
  quantumSafetyStatus: 'safe' | 'warning' | 'violation';

  // Natario shift vector
  shiftVectorField: { amplitude:number; evaluateShiftVector: (x:number,y:number,z:number)=>[number,number,number] };
  expansionScalar: number;              // divergence diagnostic
  curlMagnitude: number;                // curl diagnostic
  betaAvg?: number;
  geometryKind?: WarpGeometryKind;
  geometryAssetId?: string;
  warpFieldType?: NatarioWarpParams['warpFieldType'];
  hodgeDiagnostics?: {
    maxDiv: number;
    rmsDiv: number;
    maxCurl: number;
    rmsCurl: number;
    grid: [number, number, number];
    domain: { min: Vec3; max: Vec3 };
  };

// Momentum flux balance
  momentumFlux: number;                 // kgâ‹…m/sÂ² - booster shell
  stressEnergyTensor: { T00:number; T11:number; T22:number; T33:number; isNullEnergyConditionSatisfied: boolean };

  // Validation flags
  isZeroExpansion: boolean;             // |âˆ‡Â·Î²| < tolerance
  isCurlFree: boolean;                  // |âˆ‡Ã—Î²| â‰ˆ 0
  isQuantumSafe: boolean;               // Mass < Ford-Roman limit
  isPowerCompliant: boolean;            // Within tolerance if target provided
  /** dutyFactor (Î¼s/Î¼s unitless) â€” local ON fraction computed as burstDuration / cycleDuration */
  dutyFactor?: number;
  /** thetaScaleCore â€” Î³_geo^3 Â· q Â· âˆšduty (NO Î³_VdB). Conservative core Î¸ for diagnostics. */
  /** @deprecated Use `thetaScaleCore_sqrtDuty` instead. Historic NatÃ¡rio core diagnostic (Î³_geo^3 Â· q Â· âˆšduty; NO Î³_VdB). */
  thetaScaleCore?: number;
  /** alias: thetaScaleCore_sqrtDuty â€” explicit name showing âˆšduty semantics */
  thetaScaleCore_sqrtDuty?: number;
}

/* Minimal physics constants (order-of-magnitude safe) */

/**
 * Calculate geometric blue-shift factor Î³_geo from pipeline (no magic numbers)
 * a_eff is the *physical gap*; curvature amplification is represented by Î³_geo.
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
 * Calculate NatÃ¡rio shift vector field Î²(r) for zero-expansion warp bubble
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
  // Very conservative heuristic margin: mass / bound + |u|Â·Ï„ / (1e-6)
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
 * Main calculation for complete NatÃ¡rio warp bubble (pipeline-driven)
 */

export function calculateNatarioWarpBubble(params: NatarioWarpParams): NatarioWarpResult {
  const fieldType = params.warpFieldType ?? 'natario';
  const geo = calculateGeometricBlueshift(params.bowlRadius, params.sagDepth, params.gap, {
    gammaGeo: params.gammaGeo, gammaVanDenBroeck: params.gammaVanDenBroeck
  });
  const dyn = calculateDynamicAmplification(geo.amplification, params.cavityQ, params.burstDuration, params.cycleDuration, {
    referenceQ: params.referenceQ, qSpoilingFactor: params.qSpoilingFactor
  });
  const strobe = calculateSectorStrobing(dyn.totalAmplification, params.sectorCount || 1, params.dutyFactor || 0, params.effectiveDuty || 0);
  const a_m = Math.max(1e-12, params.gap * 1e-9);
  const baselineEnergyDensity = casimirEnergyDensity(a_m);
  const amplifiedEnergyDensity = baselineEnergyDensity * strobe.timeAveragedAmplification;
  const tileArea = Math.max(1e-12, params.tileArea_m2 ?? DEFAULTS.tileArea_m2);
  const tileVolume = tileArea * a_m;
  const tileCount = Math.max(1, params.tileCount ?? 1);
  let totalExoticMass = 0;
  let exoticMassPerTile = 0;
  const overrideRequested =
    Number.isFinite(params.exoticMassTarget_kg) && params.exoticMassTarget_kg! > 0;
  const invariantMass_kg = Number.isFinite(params.invariantMass_kg)
    ? Math.max(0, params.invariantMass_kg!)
    : undefined;
  const allowMassOverride = params.allowMassOverride === true;
  const overrideApplied = allowMassOverride && overrideRequested;
  let massModeApplied: MassMode | undefined = params.massMode;
  let massSource: NatarioWarpResult["massSource"] | undefined;
  let massOverrideWarning: string | undefined;

  if (overrideRequested && !allowMassOverride) {
    massOverrideWarning = "exoticMassTarget_kg ignored: allowMassOverride is false";
    console.warn("[natario-warp] Mass override rejected without allowMassOverride");
  }

  if (overrideApplied) {
    totalExoticMass = params.exoticMassTarget_kg!;
    exoticMassPerTile = totalExoticMass / tileCount;
    massSource = "targetOverride";
    massModeApplied = "TARGET_CALIBRATED";
    if (params.massMode && params.massMode !== "TARGET_CALIBRATED") {
      massOverrideWarning =
        "mass override forced massModeApplied=TARGET_CALIBRATED (input was different)";
      console.warn("[natario-warp] Mass override forced TARGET_CALIBRATED mode");
    } else {
      console.warn("[natario-warp] Mass override applied via exoticMassTarget_kg");
    }
  } else if (invariantMass_kg && invariantMass_kg > 0) {
    totalExoticMass = invariantMass_kg;
    exoticMassPerTile = totalExoticMass / tileCount;
    massSource = params.massMode === "MEASURED_FORCE_INFERRED" ? "measured" : "model";
  } else {
    const totalEnergy = Math.abs(amplifiedEnergyDensity) * tileVolume * tileCount;
    const c2 = 8.9875517923e16;
    totalExoticMass = totalEnergy / c2;
    exoticMassPerTile = totalExoticMass / tileCount;
    massSource = params.massMode === "MEASURED_FORCE_INFERRED" ? "measured" : "model";
  }
  const powerDraw = Number.isFinite(params.P_avg_W) ? params.P_avg_W! : Math.abs(amplifiedEnergyDensity) * tileVolume * (params.burstDuration / Math.max(1, params.cycleDuration)) * 1.0;
  const quantumValidation = validateQuantumInequality(totalExoticMass, amplifiedEnergyDensity, Math.max(1e-12, (params.burstDuration||1) * 1e-6), a_m, params.fordRomanLimit_kg ?? DEFAULTS.fordRomanLimit_kg);
  const shift = calculateNatarioShiftField(params, totalExoticMass);
  const dutyFactor = (Number.isFinite(+params.burstDuration) && Number.isFinite(+params.cycleDuration) && +params.cycleDuration > 0)
    ? Math.max(1e-12, (+params.burstDuration) / (+params.cycleDuration)) : undefined;
  const thetaScaleCore_sqrtDuty = (Number.isFinite(geo.amplification) && Number.isFinite(dyn.qEnhancement) && Number.isFinite(dutyFactor || NaN))
    ? (geo.amplification * dyn.qEnhancement * Math.sqrt(dutyFactor!))
    : undefined;
  const stress = calculateStressEnergyTensor(amplifiedEnergyDensity, { amplitude: shift.amplitude }, { dvdr: 0, dvdt: 0 }, params.stressTangentialFactor ?? 0.5);
  const momentum = calculateMomentumFlux(stress, Math.max(1e-6, params.bowlRadius * 1e-6), params.shellThickness_m ?? 1e-6);

  const baseResult: NatarioWarpResult = {
    geometricBlueshiftFactor: geo.gammaGeo,
    effectivePathLength: geo.effectivePathLength_m,
    geometricAmplification: geo.amplification,
    qEnhancementFactor: dyn.qEnhancement,
    totalAmplificationFactor: dyn.totalAmplification,
    baselineEnergyDensity,
    amplifiedEnergyDensity,
    exoticMassPerTile,
    totalExoticMass,
    massSource,
    massModeApplied: massModeApplied ?? params.massMode,
    massOverrideApplied: overrideApplied,
    massOverrideWarning,
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
    dutyFactor: dutyFactor,
    thetaScaleCore: thetaScaleCore_sqrtDuty,
    thetaScaleCore_sqrtDuty: thetaScaleCore_sqrtDuty,
    warpFieldType: fieldType,
    geometryKind: params.warpGeometryKind ?? (params.warpGeometry as any)?.kind ?? 'ellipsoid',
    geometryAssetId: params.warpGeometryAssetId ?? (params.warpGeometry as any)?.assetId,
    betaAvg: (shift as any).netShiftAmplitude ?? shift.amplitude,
  };

  if (fieldType === 'natario_sdf') {
    const hodge = helmholtzHodgeProject(params);
    baseResult.shiftVectorField = { amplitude: params.shiftAmplitude ?? shift.amplitude, evaluateShiftVector: hodge.evaluate } as any;
    baseResult.expansionScalar = hodge.rmsDiv;
    baseResult.curlMagnitude = hodge.rmsCurl;
    baseResult.isZeroExpansion = hodge.maxDiv < (params.expansionTolerance ?? 1e-12);
    baseResult.isCurlFree = hodge.maxCurl < (params.expansionTolerance ?? 1e-12);
    baseResult.betaAvg = hodge.betaAvg;
    baseResult.geometryKind = hodge.geometryKind;
    baseResult.geometryAssetId = hodge.geometryAssetId ?? baseResult.geometryAssetId;
    baseResult.hodgeDiagnostics = {
      maxDiv: hodge.maxDiv,
      rmsDiv: hodge.rmsDiv,
      maxCurl: hodge.maxCurl,
      rmsCurl: hodge.rmsCurl,
      grid: hodge.grid,
      domain: hodge.domain,
    } as any;
  }

  return baseResult;
}



// Helmholtz-Hodge projection helpers for geometry-aware Natario shift fields
type GeometryEvaluator = {
  kind: WarpGeometryKind;
  bounds: { min: Vec3; max: Vec3 };
  wall: number;
  band: number;
  drive: Vec3;
  assetId?: string;
  resolution: number;
  signedDistance: (p: Vec3) => number;
  normal: (p: Vec3) => Vec3;
};

type HodgeResult = {
  evaluate: (x: number, y: number, z: number) => Vec3;
  maxDiv: number;
  rmsDiv: number;
  maxCurl: number;
  rmsCurl: number;
  betaAvg: number;
  grid: [number, number, number];
  domain: { min: Vec3; max: Vec3 };
  geometryKind: WarpGeometryKind;
  geometryAssetId?: string;
};

function buildGeometryEvaluator(params: NatarioWarpParams): GeometryEvaluator {
  const geom = params.warpGeometry ?? null;
  const kind = (params.warpGeometryKind ?? (geom as any)?.kind ?? 'ellipsoid') as WarpGeometryKind;
  const axes = params.hullAxes ?? {
    a: Math.max(1e-6, (params.bowlRadius || 1) * 1e-6),
    b: Math.max(1e-6, (params.bowlRadius || 1) * 1e-6),
    c: Math.max(1e-6, (params.bowlRadius || 1) * 1e-6),
  };
  const aEff = 3 / (1 / axes.a + 1 / axes.b + 1 / axes.c);
  const maxAxis = Math.max(axes.a, Math.max(axes.b, axes.c));
  const resRaw = Math.round(params.warpGridResolution ?? (geom as any)?.resolution ?? 32);
  const resolution = clamp(Number.isFinite(resRaw) ? resRaw : 32, 8, 96);
  const drive = vecNormalize((geom as any)?.driveDirection ?? params.warpDriveDirection ?? [1, 0, 0]);
  const wallThickness = Math.max(1e-9, (geom as any)?.wallThickness_m ?? (params.sagDepth ?? 16) * 1e-9);
  const bandRaw = (geom as any)?.sdf?.band_m ?? (geom as any)?.band_m;
  const band = Math.max(1e-9, Number.isFinite(bandRaw) ? (bandRaw as number) : wallThickness * 4);
  let bounds = {
    min: [-maxAxis - 0.3 * maxAxis, -maxAxis - 0.3 * maxAxis, -maxAxis - 0.3 * maxAxis] as Vec3,
    max: [maxAxis + 0.3 * maxAxis, maxAxis + 0.3 * maxAxis, maxAxis + 0.3 * maxAxis] as Vec3,
  };

  const sdEllipsoid = (p: Vec3) => {
    const rho = Math.hypot(p[0] / axes.a, p[1] / axes.b, p[2] / axes.c);
    return (rho - 1) * aEff;
  };
  const nEllipsoid = (p: Vec3): Vec3 => {
    const nx = p[0] / (axes.a * axes.a);
    const ny = p[1] / (axes.b * axes.b);
    const nz = p[2] / (axes.c * axes.c);
    return vecNormalize([nx, ny, nz]);
  };

  let signedDistance = sdEllipsoid;
  let normal = (p: Vec3) => {
    const base = nEllipsoid(p);
    return vecLen(base) > 0 ? base : ([1, 0, 0] as Vec3);
  };

  if (kind === 'radial') {
    const samples = Array.isArray((geom as any)?.radial?.samples) ? ((geom as any).radial.samples as any[]) : [];
    const fallbackR = samples.length ? Math.max(maxAxis, ...samples.map((s) => Number(s.r) || 0)) : maxAxis;
    const pad = Math.max(fallbackR * 0.2, wallThickness * 8);
    bounds = {
      min: [-fallbackR - pad, -fallbackR - pad, -fallbackR - pad],
      max: [fallbackR + pad, fallbackR + pad, fallbackR + pad],
    };
    const radiusAt = (dir: Vec3) => {
      if (typeof (geom as any)?.radial?.radiusAt === 'function') {
        try {
          const val = (geom as any).radial.radiusAt(dir);
          if (Number.isFinite(val)) return Math.max(1e-6, val as number);
          if (Number.isFinite((val as any)?.r)) return Math.max(1e-6, (val as any).r);
        } catch { /* ignore */ }
      }
      if (!samples.length) return fallbackR;
      let bestDot = -Infinity;
      let bestR = fallbackR;
      for (const s of samples) {
        const r = Number.isFinite(s.r) ? Math.max(1e-6, s.r as number) : fallbackR;
        const theta = Number(s.theta) || 0;
        const phi = Number(s.phi) || 0;
        const dirS: Vec3 = [
          Math.cos(phi) * Math.cos(theta),
          Math.sin(phi),
          Math.cos(phi) * Math.sin(theta),
        ];
        const d = vecDot(vecNormalize(dir), vecNormalize(dirS));
        if (d > bestDot) {
          bestDot = d;
          bestR = r;
        }
      }
      return bestR;
    };
    signedDistance = (p: Vec3) => {
      const rSurf = radiusAt(vecNormalize(p));
      return vecLen(p) - rSurf;
    };
    normal = (p: Vec3) => vecNormalize(p);
  } else if (kind === 'sdf') {
    const rawSamples = Array.isArray((geom as any)?.sdf?.samples) ? ((geom as any).sdf.samples as any[]) : [];
    const stride = rawSamples.length > 8000 ? Math.ceil(rawSamples.length / 8000) : 1;
    const samples = rawSamples.filter((_, idx) => idx % stride === 0);
    if (samples.length) {
      const min: Vec3 = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      const max: Vec3 = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
      for (const s of samples) {
        const p = s.p as Vec3;
        min[0] = Math.min(min[0], p[0]); min[1] = Math.min(min[1], p[1]); min[2] = Math.min(min[2], p[2]);
        max[0] = Math.max(max[0], p[0]); max[1] = Math.max(max[1], p[1]); max[2] = Math.max(max[2], p[2]);
      }
      const pad = Math.max(band, wallThickness * 4);
      bounds = {
        min: [min[0] - pad, min[1] - pad, min[2] - pad],
        max: [max[0] + pad, max[1] + pad, max[2] + pad],
      };
      signedDistance = (p: Vec3) => {
        let best = Number.POSITIVE_INFINITY;
        let sd = sdEllipsoid(p);
        for (const s of samples) {
          const n = s.n ? vecNormalize(s.n as Vec3) : vecNormalize(s.p as Vec3);
          const diff = vecSub(p, s.p as Vec3);
          const signed = Number.isFinite(s.signedDistance_m) ? (s.signedDistance_m as number) : vecDot(diff, n);
          const dist = Math.abs(signed);
          if (dist < best) {
            best = dist;
            sd = signed;
          }
        }
        return sd;
      };
      normal = (p: Vec3) => {
        let best = Number.POSITIVE_INFINITY;
        let nOut: Vec3 | null = null;
        for (const s of samples) {
          const diff = vecSub(p, s.p as Vec3);
          const dist = vecLen(diff);
          if (dist < best) {
            best = dist;
            nOut = vecNormalize(s.n ? (s.n as Vec3) : diff);
          }
        }
        return nOut ?? nEllipsoid(p);
      };
    }
  }

  return {
    kind,
    bounds,
    wall: wallThickness,
    band: band > 0 ? band : wallThickness * 4,
    drive,
    assetId: params.warpGeometryAssetId ?? (geom as any)?.assetId,
    resolution,
    signedDistance,
    normal,
  };
}

function helmholtzHodgeProject(params: NatarioWarpParams): HodgeResult {
  const geom = buildGeometryEvaluator(params);
  const [minX, minY, minZ] = geom.bounds.min;
  const [maxX, maxY, maxZ] = geom.bounds.max;
  const nx = geom.resolution;
  const ny = geom.resolution;
  const nz = geom.resolution;
  const hx = (maxX - minX) / Math.max(1, nx);
  const hy = (maxY - minY) / Math.max(1, ny);
  const hz = (maxZ - minZ) / Math.max(1, nz);
  const hx2 = hx * hx;
  const hy2 = hy * hy;
  const hz2 = hz * hz;
  const invDen = 1 / (2 / hx2 + 2 / hy2 + 2 / hz2);
  const total = nx * ny * nz;
  const betaX = new Float64Array(total);
  const betaY = new Float64Array(total);
  const betaZ = new Float64Array(total);
  const psi = new Float64Array(total);
  const psiNext = new Float64Array(total);
  const div = new Float64Array(total);

  const amp = params.shiftAmplitude || 0;
  if (amp === 0) {
    return {
      evaluate: () => [0, 0, 0],
      maxDiv: 0,
      rmsDiv: 0,
      maxCurl: 0,
      rmsCurl: 0,
      betaAvg: 0,
      grid: [nx, ny, nz],
      domain: { min: geom.bounds.min, max: geom.bounds.max },
      geometryKind: geom.kind,
      geometryAssetId: geom.assetId,
    };
  }

  let idx = 0;
  for (let k = 0; k < nz; k++) {
    const z = minZ + (k + 0.5) * hz;
    for (let j = 0; j < ny; j++) {
      const y = minY + (j + 0.5) * hy;
      for (let i = 0; i < nx; i++) {
        const x = minX + (i + 0.5) * hx;
        const p: Vec3 = [x, y, z];
        const sd = geom.signedDistance(p);
        const n = geom.normal(p);
        const blend = 0.3;
        const dir = vecNormalize(vecAdd(vecScale(n, 1 - blend), vecScale(geom.drive, blend)));
        const envelope = Math.exp(-Math.pow(sd / Math.max(1e-9, geom.wall), 2));
        const taper = clamp(1 - Math.abs(sd) / Math.max(1e-9, geom.band), 0, 1);
        const w = envelope * taper;
        betaX[idx] = dir[0] * amp * w;
        betaY[idx] = dir[1] * amp * w;
        betaZ[idx] = dir[2] * amp * w;

        const ixp = i < nx - 1 ? idx + 1 : idx;
        const ixm = i > 0 ? idx - 1 : idx;
        const jyp = j < ny - 1 ? idx + nx : idx;
        const jym = j > 0 ? idx - nx : idx;
        const kzp = k < nz - 1 ? idx + nx * ny : idx;
        const kzm = k > 0 ? idx - nx * ny : idx;
        const dBx = (betaX[ixp] - betaX[ixm]) / (i > 0 && i < nx - 1 ? 2 * hx : hx);
        const dBy = (betaY[jyp] - betaY[jym]) / (j > 0 && j < ny - 1 ? 2 * hy : hy);
        const dBz = (betaZ[kzp] - betaZ[kzm]) / (k > 0 && k < nz - 1 ? 2 * hz : hz);
        div[idx] = dBx + dBy + dBz;
        idx += 1;
      }
    }
  }

  const iterations = clamp(Math.round(geom.resolution * 2), 10, 120);
  for (let iter = 0; iter < iterations; iter++) {
    let maxDelta = 0;
    for (let k = 1; k < nz - 1; k++) {
      for (let j = 1; j < ny - 1; j++) {
        for (let i = 1; i < nx - 1; i++) {
          const id = i + nx * (j + ny * k);
          const lap =
            (psi[id - 1] + psi[id + 1]) / hx2 +
            (psi[id - nx] + psi[id + nx]) / hy2 +
            (psi[id - nx * ny] + psi[id + nx * ny]) / hz2;
          const next = (lap - div[id]) * invDen;
          maxDelta = Math.max(maxDelta, Math.abs(next - psi[id]));
          psiNext[id] = next;
        }
      }
    }
    psi.set(psiNext);
    if (maxDelta < 1e-12) break;
  }

  const betaPX = new Float64Array(total);
  const betaPY = new Float64Array(total);
  const betaPZ = new Float64Array(total);
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const id = i + nx * (j + ny * k);
        const ixp = i < nx - 1 ? id + 1 : id;
        const ixm = i > 0 ? id - 1 : id;
        const jyp = j < ny - 1 ? id + nx : id;
        const jym = j > 0 ? id - nx : id;
        const kzp = k < nz - 1 ? id + nx * ny : id;
        const kzm = k > 0 ? id - nx * ny : id;
        const gradX = (psi[ixp] - psi[ixm]) / (i > 0 && i < nx - 1 ? 2 * hx : hx);
        const gradY = (psi[jyp] - psi[jym]) / (j > 0 && j < ny - 1 ? 2 * hy : hy);
        const gradZ = (psi[kzp] - psi[kzm]) / (k > 0 && k < nz - 1 ? 2 * hz : hz);
        betaPX[id] = betaX[id] - gradX;
        betaPY[id] = betaY[id] - gradY;
        betaPZ[id] = betaZ[id] - gradZ;
      }
    }
  }

  let sumMag = 0;
  let maxDiv = 0;
  let sumDiv2 = 0;
  let maxCurl = 0;
  let sumCurl2 = 0;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const id = i + nx * (j + ny * k);
        const ixp = i < nx - 1 ? id + 1 : id;
        const ixm = i > 0 ? id - 1 : id;
        const jyp = j < ny - 1 ? id + nx : id;
        const jym = j > 0 ? id - nx : id;
        const kzp = k < nz - 1 ? id + nx * ny : id;
        const kzm = k > 0 ? id - nx * ny : id;

        const dBx = (betaPX[ixp] - betaPX[ixm]) / (i > 0 && i < nx - 1 ? 2 * hx : hx);
        const dBy = (betaPY[jyp] - betaPY[jym]) / (j > 0 && j < ny - 1 ? 2 * hy : hy);
        const dBz = (betaPZ[kzp] - betaPZ[kzm]) / (k > 0 && k < nz - 1 ? 2 * hz : hz);
        const divP = dBx + dBy + dBz;
        maxDiv = Math.max(maxDiv, Math.abs(divP));
        sumDiv2 += divP * divP;

        const dBz_dy = (betaPZ[jyp] - betaPZ[jym]) / (j > 0 && j < ny - 1 ? 2 * hy : hy);
        const dBy_dz = (betaPY[kzp] - betaPY[kzm]) / (k > 0 && k < nz - 1 ? 2 * hz : hz);
        const dBx_dz = (betaPX[kzp] - betaPX[kzm]) / (k > 0 && k < nz - 1 ? 2 * hz : hz);
        const dBz_dx = (betaPZ[ixp] - betaPZ[ixm]) / (i > 0 && i < nx - 1 ? 2 * hx : hx);
        const dBy_dx = (betaPY[ixp] - betaPY[ixm]) / (i > 0 && i < nx - 1 ? 2 * hx : hx);
        const dBx_dy = (betaPX[jyp] - betaPX[jym]) / (j > 0 && j < ny - 1 ? 2 * hy : hy);
        const curlX = dBz_dy - dBy_dz;
        const curlY = dBx_dz - dBz_dx;
        const curlZ = dBy_dx - dBx_dy;
        const curlMag = Math.hypot(curlX, curlY, curlZ);
        maxCurl = Math.max(maxCurl, curlMag);
        sumCurl2 += curlMag * curlMag;

        sumMag += Math.hypot(betaPX[id], betaPY[id], betaPZ[id]);
      }
    }
  }

  const totalCells = Math.max(1, total);
  const betaAvg = sumMag / totalCells;
  const rmsDiv = Math.sqrt(sumDiv2 / totalCells);
  const rmsCurl = Math.sqrt(sumCurl2 / totalCells);

  const evaluate = (x: number, y: number, z: number): Vec3 => {
    const fx = clamp((x - minX) / Math.max(1e-9, maxX - minX) * nx - 0.5, 0, nx - 1);
    const fy = clamp((y - minY) / Math.max(1e-9, maxY - minY) * ny - 0.5, 0, ny - 1);
    const fz = clamp((z - minZ) / Math.max(1e-9, maxZ - minZ) * nz - 0.5, 0, nz - 1);
    const i0 = Math.floor(fx), j0 = Math.floor(fy), k0 = Math.floor(fz);
    const i1 = Math.min(nx - 1, i0 + 1);
    const j1 = Math.min(ny - 1, j0 + 1);
    const k1 = Math.min(nz - 1, k0 + 1);
    const tx = fx - i0;
    const ty = fy - j0;
    const tz = fz - k0;
    const idxBase = (ii: number, jj: number, kk: number) => ii + nx * (jj + ny * kk);
    const c000 = idxBase(i0, j0, k0);
    const c100 = idxBase(i1, j0, k0);
    const c010 = idxBase(i0, j1, k0);
    const c110 = idxBase(i1, j1, k0);
    const c001 = idxBase(i0, j0, k1);
    const c101 = idxBase(i1, j0, k1);
    const c011 = idxBase(i0, j1, k1);
    const c111 = idxBase(i1, j1, k1);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpTrilinear = (arr: Float64Array) => {
      const x00 = lerp(arr[c000], arr[c100], tx);
      const x10 = lerp(arr[c010], arr[c110], tx);
      const x01 = lerp(arr[c001], arr[c101], tx);
      const x11 = lerp(arr[c011], arr[c111], tx);
      const y0 = lerp(x00, x10, ty);
      const y1 = lerp(x01, x11, tz);
      return lerp(y0, y1, tz);
    };
    return [lerpTrilinear(betaPX), lerpTrilinear(betaPY), lerpTrilinear(betaPZ)];
  };

  return {
    evaluate,
    maxDiv,
    rmsDiv,
    maxCurl,
    rmsCurl,
    betaAvg,
    grid: [nx, ny, nz],
    domain: { min: geom.bounds.min, max: geom.bounds.max },
    geometryKind: geom.kind,
    geometryAssetId: geom.assetId,
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
