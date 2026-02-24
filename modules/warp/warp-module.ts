/**
 * TheoryRefs:
 *  - vanden-broeck-1999: input normalization + clamps for gamma_VdB
 */

/**
 * Warp Bubble Casimir Module
 * Integrates Natário zero-expansion warp bubble calculations with the module system
 */

import type { CasimirModule } from '../core/module-registry.js';
import type { SimulationParameters } from '../../shared/schema.js';
import { calculateNatarioWarpBubble, type NatarioWarpParams, type NatarioWarpResult } from './natario-warp.js';

const DEBUG_WARP =
  typeof process !== 'undefined' &&
  typeof process.env?.HELIX_DEBUG === 'string' &&
  process.env.HELIX_DEBUG.includes('warp');
const debugLog = (...args: unknown[]) => {
  if (DEBUG_WARP) console.log(...args);
};
const debugWarn = (...args: unknown[]) => {
  if (DEBUG_WARP) console.warn(...args);
};
const logError = (...args: unknown[]) => {
  if (DEBUG_WARP) {
    console.error(...args);
  } else {
    console.warn(...args);
  }
};

const toFiniteVec3 = (value: unknown): [number, number, number] | undefined => {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const x = Number(value[0]);
  const y = Number(value[1]);
  const z = Number(value[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return undefined;
  return [x, y, z];
};

const normalizeVec3 = (
  value: [number, number, number],
  fallback: [number, number, number],
): [number, number, number] => {
  const mag = Math.hypot(value[0], value[1], value[2]);
  if (!Number.isFinite(mag) || mag <= 1e-12) return fallback;
  return [value[0] / mag, value[1] / mag, value[2] / mag];
};

export interface WarpBubbleResult extends NatarioWarpResult {
  // Module-specific additions
  moduleVersion: string;
  calculationTime: number;
  validationSummary: {
    geometryValid: boolean;
    amplificationValid: boolean;
    quantumSafe: boolean;
    warpFieldStable: boolean;
    overallStatus: 'optimal' | 'acceptable' | 'warning' | 'failure';
  };
}

/**
 * Resolve effective duty from pipeline parameters (no double division)
 */
export function resolveDutyEff(params: SimulationParameters): number {
  debugLog('[WarpModule] resolveDutyEff input params:', {
    dynamicConfig: params.dynamicConfig,
    dutyEffectiveFR: (params as any).dutyEffectiveFR,
    dutyShip: (params as any).dutyShip,
    dutyEff: (params as any).dutyEff
  });

  const dyn = params.dynamicConfig;
  const S_total = Math.max(1, Math.floor(dyn?.sectorCount ?? 1));
  
  debugLog('[WarpModule] Sector count:', S_total);

  // 1) Prefer authoritative FR duty if present (server/pipeline)
  const frFromPipeline =
    (params as any).dutyEffectiveFR ??
    (params as any).dutyShip ??
    (params as any).dutyEff;
  
  debugLog('[WarpModule] FR from pipeline:', frFromPipeline);
  
  if (Number.isFinite(+frFromPipeline) && +frFromPipeline > 0) {
    const result = Math.max(1e-12, Math.min(1, +frFromPipeline));
    debugLog('[WarpModule] Using pipeline FR duty:', result);
    return result;
  }

  // 2) If burst/dwell provided, infer local duty and convert to FR with sector count
  const burst = dyn?.burstLengthUs;
  const dwell = dyn?.cycleLengthUs;
  
  debugLog('[WarpModule] Burst/dwell timing:', { burst, dwell });
  
  if (Number.isFinite(burst) && Number.isFinite(dwell) && (dwell as number) > 0) {
    const d_local = Math.max(0, Math.min(1, (burst as number) / (dwell as number)));
    debugLog('[WarpModule] Calculated local duty:', d_local);
    
    // If a sectorDuty is provided and already ≤ local, assume it's FR and don't divide again
    if (dyn && Number.isFinite(dyn.sectorDuty) && (dyn.sectorDuty as number) <= d_local && (dyn.sectorDuty as number) > 0) {
      const result = Math.max(1e-12, Math.min(1, dyn.sectorDuty as number));
      debugLog('[WarpModule] Using provided sectorDuty as FR:', result);
      return result;
    }
    const result = Math.max(1e-12, Math.min(1, d_local / S_total));
    debugLog('[WarpModule] Converting local to FR duty:', result, '(', d_local, '/', S_total, ')');
    return result;
  }

  // 3) Fall back to sectorDuty:
  // Use standard physical default of 2.5e-5 (matching MODE_POLICY hover mode)
  const dProvided = (dyn && Number.isFinite(dyn.sectorDuty) && (dyn.sectorDuty as number) > 0) ? (dyn.sectorDuty as number) : 2.5e-5;
  debugLog('[WarpModule] Fallback sectorDuty:', dProvided);
  
  // More physically reasonable threshold: if duty < 1/S_total, likely already FR
  const localThreshold = 1.0 / S_total;
  if (S_total > 1 && dProvided < localThreshold * 0.1) {
    debugLog('[WarpModule] Treating small duty as already FR (< 10% of local threshold):', dProvided);
    return Math.max(1e-12, Math.min(1, dProvided));
  }
  
  const result = Math.max(1e-12, Math.min(1, dProvided / S_total));
  debugLog('[WarpModule] Treating as local duty, converting to FR:', result);
  return result;
}

/**
 * Convert simulation parameters to Natário warp parameters (pipeline-true)
 */
function convertToWarpParams(params: SimulationParameters): NatarioWarpParams {
  debugLog('[WarpModule] convertToWarpParams input:', params);
  
  const dyn = params.dynamicConfig;
  debugLog('[WarpModule] Dynamic config:', dyn);

  // Prefer pipeline hull if present; else fallback to Needle Hull with validated dimensions
  const MIN_HULL_SEMI_AXIS_M = 1e-3; // keep hull strictly positive but allow centimeter-scale rigs
  const clampAxis = (value: number | undefined) =>
    Math.max(MIN_HULL_SEMI_AXIS_M, Math.abs(value ?? MIN_HULL_SEMI_AXIS_M));

  const rawHull = (params as any).hull;
  const hull = (() => {
    if (rawHull) {
      if (
        Number.isFinite(rawHull.a) &&
        Number.isFinite(rawHull.b) &&
        Number.isFinite(rawHull.c)
      ) {
        return {
          a: clampAxis(rawHull.a),
          b: clampAxis(rawHull.b),
          c: clampAxis(rawHull.c),
        };
      }
      if (
        Number.isFinite(rawHull.Lx_m) &&
        Number.isFinite(rawHull.Ly_m) &&
        Number.isFinite(rawHull.Lz_m)
      ) {
        return {
          a: clampAxis(rawHull.Lx_m / 2),
          b: clampAxis(rawHull.Ly_m / 2),
          c: clampAxis(rawHull.Lz_m / 2),
        };
      }
    }
    const radiusUm = Number((params as any).radius);
    if (Number.isFinite(radiusUm) && radiusUm > 0) {
      const r_m = clampAxis(radiusUm * 1e-6); // radius arrives in μm
      return { a: r_m, b: r_m, c: r_m };
    }
    return { a: 503.5, b: 132.0, c: 86.5 }; // meters (semi-axes) - validated Needle Hull defaults
  })();
  const hullWallThickness_m =
    rawHull && Number.isFinite(rawHull.wallThickness_m)
      ? Math.max(1e-9, Number(rawHull.wallThickness_m))
      : undefined;
  const R_geom_m = Math.cbrt(hull.a * hull.b * hull.c); // meters
  const R_geom_um = R_geom_m * 1e6;                     // Natário expects µm
  
  debugLog('[WarpModule] Hull geometry:', { hull, R_geom_m, R_geom_um });

  // Geometry-aware warp controls
  const warpFieldType = dyn?.warpFieldType ?? (params as any).warpFieldType ?? 'natario';
  const warpGeometry = (params as any).warpGeometry ?? dyn?.warpGeometry ?? null;
  const warpGeometryKind = (params as any).warpGeometryKind ?? (dyn as any)?.warpGeometryKind ?? (warpGeometry as any)?.kind;
  const warpGeometryAssetId = (params as any).warpGeometryAssetId ?? (warpGeometry as any)?.assetId;
  const warpGridResolution = (params as any).warpGridResolution ?? (warpGeometry as any)?.resolution;
  const warpDriveDirection = (warpGeometry as any)?.driveDirection ?? (params as any).warpDriveDirection;
  const bubble = (params as any).bubble ?? {};
  const bubbleRadius_m = Number.isFinite(bubble.R)
    ? Number(bubble.R)
    : Number.isFinite((params as any).R)
      ? Number((params as any).R)
      : undefined;
  const bubbleSigma = Number.isFinite(bubble.sigma)
    ? Number(bubble.sigma)
    : Number.isFinite((params as any).sigma)
      ? Number((params as any).sigma)
      : undefined;
  const bubbleBeta = Number.isFinite(bubble.beta)
    ? Number(bubble.beta)
    : Number.isFinite((params as any).beta)
      ? Number((params as any).beta)
      : undefined;
  const epsilonTiltRaw = Number(
    (dyn as any)?.epsilonTilt ?? (params as any).epsilonTilt,
  );
  const epsilonTilt = Number.isFinite(epsilonTiltRaw)
    ? Math.max(0, Math.min(5e-7, epsilonTiltRaw))
    : undefined;
  const gTargetRaw = Number((dyn as any)?.gTarget ?? (params as any).gTarget);
  const gTarget = Number.isFinite(gTargetRaw) ? Math.max(0, gTargetRaw) : undefined;
  const betaTiltVec = normalizeVec3(
    toFiniteVec3((dyn as any)?.betaTiltVec ?? (params as any).betaTiltVec) ?? [0, -1, 0],
    [0, -1, 0],
  );

  // Sector counts / duty
  const sectorCount = Math.max(1, Math.floor(dyn?.sectorCount ?? 1));
  const d_eff = resolveDutyEff(params);
  
  debugLog('[WarpModule] Sector/duty resolution:', { sectorCount, d_eff });

  // Pipeline seeds (thread through untouched if provided)
  const ampFactors = (params as any).ampFactors ?? (params as any).amps ?? {};
  debugLog('[WarpModule] Amp factors:', ampFactors);
  
  // Amplification factors with validated ranges
  const gammaGeo = (() => {
    const val = Number.isFinite(+ampFactors.gammaGeo) ? +ampFactors.gammaGeo : 
                (Number.isFinite(+(params as any).gammaGeo) ? +(params as any).gammaGeo : 26);
    return Math.max(1, Math.min(1000, val)); // Clamp to reasonable physics range
  })();
  
  const gammaVanDenBroeck = (() => {
    const val = Number.isFinite(+ampFactors.gammaVanDenBroeck) ? +ampFactors.gammaVanDenBroeck :
               (Number.isFinite(+(params as any).gammaVanDenBroeck) ? +(params as any).gammaVanDenBroeck : 38.3);
    return Math.max(0.1, Math.min(1e6, val)); // Allow wide range but prevent extreme values
  })();
  
  const qSpoilingFactor = (() => {
    const val = Number.isFinite(+ampFactors.qSpoilingFactor) ? +ampFactors.qSpoilingFactor :
               (Number.isFinite(+(dyn as any).qSpoilingFactor) ? +(dyn as any).qSpoilingFactor :
               (Number.isFinite(+(params as any).qSpoilingFactor) ? +(params as any).qSpoilingFactor : 1.0));
    return Math.max(0.001, Math.min(1000, val)); // Physical bounds for Q spoiling
  })();
    
  debugLog('[WarpModule] Amplification factors:', {
    gammaGeo,
    gammaVanDenBroeck,
    qSpoilingFactor
  });

  // Tile census / area and live power from pipeline with validation
  const tileCount = (() => {
    const val = Number.isFinite(+(params as any).N_tiles) ? +(params as any).N_tiles : undefined;
    return val ? Math.max(1, Math.floor(val)) : undefined; // Ensure positive integer
  })();
  
  const tileArea_m2 = (() => {
    if (Number.isFinite(+(params as any).tileArea_cm2)) {
      const val = (+(params as any).tileArea_cm2) * 1e-4;
      return Math.max(1e-6, Math.min(1, val)); // 1 μm² to 1 m² reasonable range
    }
    if (Number.isFinite(+(params as any).tileArea_m2)) {
      const val = +(params as any).tileArea_m2;
      return Math.max(1e-6, Math.min(1, val));
    }
    return undefined;
  })();
  
  const P_avg_W = (() => {
    if (Number.isFinite(+(params as any).P_avg_W)) {
      const val = +(params as any).P_avg_W;
      return Math.max(0, val); // Non-negative power
    }
    if (Number.isFinite(+(params as any).P_avg)) {
      const val = +(params as any).P_avg * 1e6;
      return Math.max(0, val);
    }
    // Calculate fallback power from basic physics if tiles and energy are available
    if (tileCount && Number.isFinite(tileCount) && Number.isFinite(d_eff) && d_eff > 0) {
      const baselinePowerPerTile = 1e-12; // Reasonable baseline power per tile (1 pW)
      const totalPower = baselinePowerPerTile * tileCount * d_eff;
      debugLog('[WarpModule] Calculated fallback power:', totalPower, 'W from', tileCount, 'tiles with duty', d_eff);
      return totalPower;
    }
    return undefined;
  })();
    
  debugLog('[WarpModule] Tile and power data:', {
    tileCount,
    tileArea_m2,
    P_avg_W,
    tileArea_cm2: (params as any).tileArea_cm2,
    P_avg: (params as any).P_avg
  });

  const dutyFactor = ((): number => {
    // Prefer burst timing for local duty calculation if available
    if (dyn && Number.isFinite(dyn.burstLengthUs) && Number.isFinite(dyn.cycleLengthUs) && (dyn.cycleLengthUs as number) > 0) {
      const localDuty = Math.max(0, Math.min(1, (dyn.burstLengthUs as number) / (dyn.cycleLengthUs as number)));
      debugLog('[WarpModule] Calculated local duty from timing:', localDuty);
      return localDuty;
    }
    // Fallback to provided sectorDuty, but validate it's reasonable
    if (dyn && Number.isFinite(dyn.sectorDuty)) {
      const duty = Math.max(1e-6, Math.min(0.5, dyn.sectorDuty as number)); // Clamp to reasonable range
      debugLog('[WarpModule] Using clamped sectorDuty:', duty);
      return duty;
    }
    return 0.01; // Standard 1% duty default
  })();
  
  debugLog('[WarpModule] Duty factor calculation:', dutyFactor);

  // **CRITICAL FIX**: Pass through calibrated pipeline mass to avoid independent calculation
  const exoticMassTarget_kg = Number.isFinite(+(params as any).exoticMassTarget_kg)
    ? +(params as any).exoticMassTarget_kg
    : undefined;
  const invariantMass_kg = Number.isFinite(+(params as any).invariantMass_kg)
    ? +(params as any).invariantMass_kg
    : undefined;
  const allowMassOverride = (params as any).allowMassOverride === true;
  const massMode = (params as any).massMode;
  
  debugLog('[WarpModule] Exotic mass target from pipeline:', exoticMassTarget_kg);
  debugLog('[WarpModule] Invariant mass from pipeline:', invariantMass_kg);
  debugLog('[WarpModule] Mass override guard:', { allowMassOverride, massMode });

  const finalParams = {
    // Geometry (Natário warp currently expects µm & nm)
    bowlRadius: R_geom_um,                              // µm
    sagDepth: params.sagDepth ?? 16,                    // nm
    gap: params.gap ?? 1,                               // nm

    // Dynamics (from pipeline)
    cavityQ: dyn?.cavityQ ?? 1e9,
    burstDuration: dyn?.burstLengthUs ?? 10,             // µs
    cycleDuration: dyn?.cycleLengthUs ?? 1000,           // µs

    // Strobing (pipeline values only)
    sectorCount,
    dutyFactor,
    effectiveDuty: d_eff,                               // ship-wide FR duty (0..1)

    // Warp-field microscopic stroke
    shiftAmplitude: (dyn?.strokeAmplitudePm ?? 50) * 1e-12, // pm → m

    // Tolerance
    expansionTolerance: dyn?.expansionTolerance ?? 1e-12,
    warpFieldType,
    warpGeometry: warpGeometry ?? null,
    warpGeometryKind,
    warpGeometryAssetId,
    warpGridResolution: Number.isFinite(+warpGridResolution) ? +warpGridResolution : undefined,
    warpDriveDirection: Array.isArray(warpDriveDirection) ? (warpDriveDirection as [number, number, number]) : undefined,
    hullAxes: hull,
    hullWallThickness_m,
    bubbleRadius_m,
    bubbleSigma,
    bubbleBeta,
    gTarget,
    epsilonTilt,
    betaTiltVec,

    // --- Pipeline seeds (threaded through) ---
    gammaGeo,
    gammaVanDenBroeck,
    qSpoilingFactor,
    tileCount,
    tileArea_m2,
    P_avg_W,
    referenceQ: 1e9,
    // **Pass calibrated pipeline mass instead of calculating independently**   
    exoticMassTarget_kg,
    invariantMass_kg,
    allowMassOverride,
    massMode,
    // Optional knobs (left undefined unless you want to enforce targets)
    // powerTarget_W: MODE_POLICY[...]?.P_target_W, // not available here
    // powerTolerance: 0.10,
  };
  
  debugLog('[WarpModule] Final warp parameters:', finalParams);
  return finalParams;
}

/**
 * Validate warp bubble calculation results using pipeline inputs (not fixed "paper" bands)
 */
function validateWarpResults(result: NatarioWarpResult, params: SimulationParameters): WarpBubbleResult['validationSummary'] {
  debugLog('[WarpModule] Validating warp results:', {
    inputParams: params,
    warpResult: result
  });

  const fieldType =
    (params.dynamicConfig as any)?.warpFieldType ??
    (params as any).warpFieldType ??
    "natario";
  const expectsZeroExpansion =
    fieldType === "natario" ||
    fieldType === "natario_sdf" ||
    fieldType === "irrotational";

  const ampFactors = (params as any).ampFactors ?? (params as any).amps ?? {};
  const γ_geo = ampFactors?.gammaGeo ?? 26;
  const γ_vdb = ampFactors?.gammaVanDenBroeck ?? 3.83e1;
  const Q      = params.dynamicConfig?.cavityQ ?? 1e9;

  debugLog('[WarpModule] Validation parameters:', { γ_geo, γ_vdb, Q });
  debugLog('[WarpModule] Warp field expectations:', { fieldType, expectsZeroExpansion });

  // More reasonable validation bands based on physics
  const geomMin = 0.1 * γ_geo;  // Allow 90% deviation below
  const geomMax = 10.0 * γ_geo;  // Allow 10x above for edge cases

  const qEnhMin = 0; // nonnegative
  // More lenient amplification bounds based on actual physics scaling
  const baseAmp = Math.pow(γ_geo, 2) * Math.sqrt(Q / 1e9) * Math.max(0.1, γ_vdb / 1000); 
  const ampMin  = baseAmp * 1e-3;  // Very conservative lower bound
  const ampMax  = baseAmp * 1e12;  // Allow very high amplification

  debugLog('[WarpModule] Validation bounds:', {
    geometry: { min: geomMin, max: geomMax, actual: result.geometricBlueshiftFactor },
    amplification: { min: ampMin, max: ampMax, actual: result.totalAmplificationFactor },
    qEnhancement: { min: qEnhMin, actual: result.qEnhancementFactor }
  });

  const geometryValid = (result.geometricBlueshiftFactor > geomMin) && 
                       (result.geometricBlueshiftFactor < geomMax) && 
                       Number.isFinite(result.effectivePathLength);
  
  const amplificationValid = (result.totalAmplificationFactor > ampMin) && 
                            (result.totalAmplificationFactor < ampMax) && 
                            (result.qEnhancementFactor >= qEnhMin) && 
                            Number.isFinite(result.totalAmplificationFactor);

  const quantumSafe = !!result.isQuantumSafe && result.quantumSafetyStatus !== 'violation';
  const warpFieldStable = expectsZeroExpansion
    ? !!result.isZeroExpansion &&
      !!result.isCurlFree &&
      !!result.stressEnergyTensor?.isNullEnergyConditionSatisfied
    : !!result.stressEnergyTensor?.isNullEnergyConditionSatisfied;

  debugLog('[WarpModule] Validation checks:', {
    geometryValid,
    amplificationValid, 
    quantumSafe,
    warpFieldStable,
    detailedChecks: {
      isZeroExpansion: result.isZeroExpansion,
      isCurlFree: result.isCurlFree,
      nullEnergyCondition: result.stressEnergyTensor?.isNullEnergyConditionSatisfied,
      quantumSafetyStatus: result.quantumSafetyStatus
    }
  });

  const overallStatus =
    geometryValid && amplificationValid && quantumSafe && warpFieldStable ? 'optimal' :
    geometryValid && amplificationValid && quantumSafe                       ? 'acceptable' :
    geometryValid && quantumSafe                                             ? 'warning' : 'failure';

  debugLog('[WarpModule] Overall validation status:', overallStatus);
  
  return { geometryValid, amplificationValid, quantumSafe, warpFieldStable, overallStatus };
}

/**
 * Warp Bubble Module Definition
 */
export const warpBubbleModule: CasimirModule = {
  name: 'warp',
  version: '1.0.0',
  description: 'Natário zero-expansion warp bubble with sector-strobed Casimir lattice',
  dependencies: ['static', 'dynamic'], // Requires both static and dynamic calculations

  async initialize(): Promise<boolean> {
    // Validate physics constants and dependencies
    debugLog('Initializing Warp Bubble module...');
    return true;
  },

  async calculate(params: SimulationParameters): Promise<WarpBubbleResult> {
    const startTime = Date.now();
    debugLog('[WarpModule] Starting calculation with params:', params);

    try {
      // Validate input parameters first
      if (!params) {
        throw new Error('No simulation parameters provided');
      }

      if (!params.dynamicConfig) {
        debugWarn('[WarpModule] No dynamicConfig found, using defaults');
      }

      // Convert simulation parameters to warp parameters
      const warpParams = convertToWarpParams(params);
      debugLog('[WarpModule] Converted warp parameters:', warpParams);
      const warpFieldType = warpParams.warpFieldType ?? 'natario';
      debugLog('[WarpModule] warpFieldType selected:', warpFieldType);

      // Validate critical warp parameters
      if (!Number.isFinite(warpParams.bowlRadius) || warpParams.bowlRadius <= 0) {
        throw new Error(`Invalid bowl radius: ${warpParams.bowlRadius}`);
      }
          if (!Number.isFinite((warpParams as any).effectiveDuty) || (warpParams as any).effectiveDuty <= 0) {
            throw new Error(`Invalid effective duty: ${(warpParams as any).effectiveDuty}`);
          }

          if (!Number.isFinite((warpParams as any).gammaGeo) || (warpParams as any).gammaGeo <= 0) {
            throw new Error(`Invalid gamma geometric: ${(warpParams as any).gammaGeo}`);
          }

      // Perform Natário warp bubble calculations
      let warpResult: NatarioWarpResult;
      if (
        warpFieldType === 'natario' ||
        warpFieldType === 'natario_sdf' ||
        warpFieldType === 'irrotational' ||
        warpFieldType === 'alcubierre'
      ) {
        warpResult = calculateNatarioWarpBubble(warpParams);
      } else {
        debugWarn(`[WarpModule] Unsupported warpFieldType "${warpFieldType}", falling back to Natário solver`);
        warpResult = calculateNatarioWarpBubble({ ...warpParams, warpFieldType: 'natario' });
      }
      debugLog('[WarpModule] Warp calculation result:', warpResult);

      // Validate critical results
      if (!Number.isFinite(warpResult.totalAmplificationFactor)) {
        logError('[WarpModule] Invalid amplification factor result');
        throw new Error('Calculation produced invalid amplification factor');
      }

      // Validate results
      const validationSummary = validateWarpResults(warpResult, params);
      debugLog('[WarpModule] Validation summary:', validationSummary);

      const calculationTime = Date.now() - startTime;
      debugLog('[WarpModule] Calculation completed in', calculationTime, 'ms');

      // Add debug information for shift vector field
      // Provide a small runtime-safe interface for shiftVectorField so consumers can rely on these keys
      interface ShiftVectorField {
        amplitude?: number;
        radialProfile?: (r: number) => number;
        tangentialComponent?: (x: number, y: number, z: number) => number;
        axialComponent?: (x: number, y: number, z: number) => number;
        netShiftAmplitude?: number;
        evaluateShiftVector?: (x: number, y: number, z: number) => [number, number, number];
      }

      if (warpResult.shiftVectorField) {
        const sv = warpResult.shiftVectorField as ShiftVectorField;
        debugLog('[WarpModule] Shift vector field validation:', {
          amplitude: Number.isFinite(sv?.amplitude) ? sv!.amplitude : undefined,
          hasRadialProfile: typeof sv?.radialProfile === 'function',
          tangentialComponent: typeof sv?.tangentialComponent === 'function' ? 'fn' : undefined,
          axialComponent: typeof sv?.axialComponent === 'function' ? 'fn' : undefined,
          netShiftAmplitude: Number.isFinite(sv?.netShiftAmplitude) ? sv!.netShiftAmplitude : undefined
        });
      }

      const finalResult = {
        ...warpResult,
        moduleVersion: '1.0.0',
        calculationTime,
        validationSummary
      };
      
      debugLog('[WarpModule] Final result keys:', Object.keys(finalResult));
      return finalResult;

    } catch (error) {
      logError('[WarpModule] Calculation failed:', error);
      logError('[WarpModule] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Warp bubble calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default warpBubbleModule;
