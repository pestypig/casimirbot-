export interface SolarGlobeState {
  /**
   * Core hydrogen fraction (0-1). Higher values imply stronger fusion potential.
   */
  coreH_frac: number;
  /**
   * Normalized luminosity where 1 == L☉. We generally clamp to ±3% around nominal.
   */
  luminosity: number;
  /**
   * Small entropy drift term that nudges the visual radius (roughly [-0.05, 0.1]).
   */
  entropyDrift: number;
  /**
   * Radius used by the UI renderer in scene units. Usually [0.97, 1.03] * R0.
   */
  radius_ui: number;
}

export interface SolarGlobeCmd {
  /**
   * Hydrogen mass being injected per simulated second (kg).
   */
  injectH_kg: number;
  /**
   * Mixing efficiency knob (0-1). Higher means stronger entropy recovery.
   */
  kMix: number;
  /**
   * Optional autopilot that nudges kMix to keep luminosity tightly centered.
   */
  autoStabilize: boolean;
}

export const SOLAR_GLOBE_DEFAULT_STATE: SolarGlobeState = {
  coreH_frac: 0.62,
  luminosity: 1,
  entropyDrift: 0.004,
  radius_ui: 1,
};

export const SOLAR_GLOBE_DEFAULT_CMD: SolarGlobeCmd = {
  injectH_kg: 0,
  kMix: 0.42,
  autoStabilize: true,
};
