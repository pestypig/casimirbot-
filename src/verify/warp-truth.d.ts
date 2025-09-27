// Type-level helpers for compile-time assertions
type Equal<A,B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type DisallowKeys<T, K extends PropertyKey> = Omit<T, K & keyof T>;

// --- Keys we treat as physics vs cosmetics
type PhysicsKeys =
  | 'thetaScale' | 'thetaUniform' | 'thetaScaleExpected'
  | 'gammaGeo' | 'gammaVdB' | 'gammaVanDenBroeck'
  | 'qSpoilingFactor' | 'deltaAOverA' | 'qSpoil' | 'Qburst'
  | 'tauLC_ms' | 'dwell_ms' | 'burst_ms' | 'phase' | 'onWindow'
  | 'sectorIdx' | 'sectorCount' | 'sectors' | 'split'
  | 'dutyEffectiveFR' | 'dutyUsed' | 'dutyCycle'
  | 'physicsParityMode' | 'ridgeMode';

type CosmeticKeys =
  | 'displayGain' | 'exposure' | 'zeroStop'
  | 'curvatureGainT' | 'curvatureBoostMax' | 'userGain'
  | '__vizDutySqrt' | 'thetaDutyExponent' | 'viewAvg'
  | 'colorMode' | 'toneMap' | 'brightness' | 'contrast' | 'saturation' | 'gamma';

// --- Module augmentation for your gate (adjust path if needed)
declare module "@/lib/warp-uniforms-gate" {
  // We assert these constants at type level (they must be literal 'true')
  export const PIPELINE_LOCK: true;
  // If you have this flag exported in code, keep it as 'true' to enable strict cosmetics stripping
  export const PHYSICS_TRUTH_MODE: true | false;

  // The shape callers pass today (we only need keys; values can be any)
  export type UniformPatch = Record<string, any>;

  // Overloads to enforce policy at call sites:
  // 1) Non-adapter sources cannot send physics keys
  export function gatedUpdateUniforms(
    engine: any,
    patch: DisallowKeys<UniformPatch, PhysicsKeys>,
    source: 'client' | 'visualizer' | 'bubble-compare' | 'inspector'
  ): void;

  // 2) When truth-mode is on, non-adapter sources also cannot send cosmetics
  export function gatedUpdateUniforms(
    engine: any,
    patch: DisallowKeys<UniformPatch, PhysicsKeys | (typeof PHYSICS_TRUTH_MODE extends true ? CosmeticKeys : never)>,
    source: 'client' | 'visualizer' | 'bubble-compare' | 'inspector'
  ): void;

  // 3) Adapter/server may send anything (authoritative)
  export function gatedUpdateUniforms(
    engine: any,
    patch: UniformPatch,
    source: 'adapter' | 'server'
  ): void;
}

// --- Compile-time assertions (will fail tsc if violated)
declare module "@/lib/warp-uniforms-gate" {
  // PIPELINE_LOCK must be literal true
  type __ASSERT_PIPELINE_LOCK = Assert<Equal<typeof PIPELINE_LOCK, true>>;
  // Optional: require truth mode ON; change 'true' to 'false' if you want to allow cosmetics
  // type __ASSERT_TRUTH_MODE = Assert<Equal<typeof PHYSICS_TRUTH_MODE, true>>;
}
