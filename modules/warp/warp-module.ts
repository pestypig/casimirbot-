/**
 * Warp Bubble Casimir Module
 * Integrates Natário zero-expansion warp bubble calculations with the module system
 */

import type { CasimirModule } from '../core/module-registry.js';
import type { SimulationParameters } from '../../shared/schema.js';
import { calculateNatarioWarpBubble, type NatarioWarpParams, type NatarioWarpResult } from './natario-warp.js';

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
 * Resolve effective duty from pipeline parameters
 */
function resolveDutyEff(params: SimulationParameters): number {
  const S = Math.max(1, Math.floor(params.dynamicConfig?.sectorCount ?? 1));
  // Prefer FR duty if burst/dwell are provided
  const burst = params.dynamicConfig?.burstLengthUs;
  const dwell = params.dynamicConfig?.cycleLengthUs;
  if (Number.isFinite(burst) && Number.isFinite(dwell) && (dwell as number) > 0) {
    return Math.max(0, Math.min(1, (burst as number) / (dwell as number) / S));
  }
  const d = Math.max(0, Math.min(1, params.dynamicConfig?.sectorDuty ?? 0.14));
  return Math.max(0, Math.min(1, d / S));
}

/**
 * Convert simulation parameters to Natário warp parameters (pipeline-true)
 */
function convertToWarpParams(params: SimulationParameters): NatarioWarpParams {
  const dyn = params.dynamicConfig ?? ({} as NonNullable<SimulationParameters["dynamicConfig"]>);
  // Use default hull dimensions for Needle Hull geometry
  const hull = { a: 503.5, b: 132.0, c: 86.5 }; // meters
  const R_geom_m = Math.cbrt(hull.a * hull.b * hull.c);                   // meters
  const R_geom_um = R_geom_m * 1e6;                                       // Natário file expects µm

  // Single source of truth
  const sectorCount = Math.max(1, Math.floor(dyn.sectorCount ?? 1));
  const d_eff = resolveDutyEff(params);

  return {
    // Geometry (Natário warp currently expects µm & nm)
    bowlRadius: R_geom_um,                                // µm
    sagDepth: params.sagDepth ?? 16,                      // nm
    gap: params.gap ?? 1,                                 // nm

    // Dynamics (from pipeline)
    cavityQ: dyn.cavityQ ?? 1e9,
    burstDuration: dyn.burstLengthUs ?? 10,               // µs
    cycleDuration: dyn.cycleLengthUs ?? 1000,            // µs

    // Strobing (pipeline values only)
    sectorCount,
    dutyFactor: dyn.sectorDuty ?? 0.14,                   // local burst duty (0..1), before sector division
    effectiveDuty: d_eff,                                 // ship-wide FR duty (0..1)

    // Warp-field microscopic stroke
    shiftAmplitude: (dyn.strokeAmplitudePm ?? 50) * 1e-12, // pm → m

    // Tight but configurable tolerance
    expansionTolerance: dyn.expansionTolerance ?? 1e-12,
  };
}

/**
 * Validate warp bubble calculation results using pipeline inputs (not fixed "paper" bands)
 */
function validateWarpResults(result: NatarioWarpResult, params: SimulationParameters): WarpBubbleResult['validationSummary'] {
  const γ_geo = (params as any).amps?.gammaGeo ?? 26;
  const γ_vdb = (params as any).amps?.gammaVanDenBroeck ?? 3.83e1;
  const Q      = params.dynamicConfig?.cavityQ ?? 1e9;

  // "Sane" bands scale with inputs
  const geomMin = 0.5 * γ_geo;
  const geomMax = 2.0 * γ_geo;

  const qEnhMin = 0; // nonnegative
  const ampMin  = Math.pow(γ_geo, 3) * Math.sqrt(Q / 1e9) * Math.max(1, γ_vdb) * 1e-6; // allow very small d_eff
  const ampMax  = ampMin * 1e9; // prevent NaN/Inf explosions

  const geometryValid = (result.geometricBlueshiftFactor > geomMin) && (result.geometricBlueshiftFactor < geomMax) && Number.isFinite(result.effectivePathLength);
  const amplificationValid = (result.totalAmplificationFactor > ampMin) && (result.totalAmplificationFactor < ampMax) && (result.qEnhancementFactor >= qEnhMin) && Number.isFinite(result.totalAmplificationFactor);

  const quantumSafe = !!result.isQuantumSafe && result.quantumSafetyStatus !== 'violation';
  const warpFieldStable = !!result.isZeroExpansion && !!result.isCurlFree && !!result.stressEnergyTensor?.isNullEnergyConditionSatisfied;

  const overallStatus =
    geometryValid && amplificationValid && quantumSafe && warpFieldStable ? 'optimal' :
    geometryValid && amplificationValid && quantumSafe                       ? 'acceptable' :
    geometryValid && quantumSafe                                             ? 'warning' : 'failure';

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
    console.log('Initializing Warp Bubble module...');
    return true;
  },
  
  async calculate(params: SimulationParameters): Promise<WarpBubbleResult> {
    const startTime = Date.now();
    
    try {
      // Convert simulation parameters to warp parameters
      const warpParams = convertToWarpParams(params);
      
      // Perform Natário warp bubble calculations
      const warpResult = calculateNatarioWarpBubble(warpParams);
      
      // Validate results
      const validationSummary = validateWarpResults(warpResult, params);
      
      const calculationTime = Date.now() - startTime;
      
      return {
        ...warpResult,
        moduleVersion: '1.0.0',
        calculationTime,
        validationSummary
      };
      
    } catch (error) {
      throw new Error(`Warp bubble calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default warpBubbleModule;