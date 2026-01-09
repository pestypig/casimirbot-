export type GammaBandConfig = {
  lowHz: number;
  highHz: number;
};

export const DEFAULT_GAMMA_BAND: GammaBandConfig = Object.freeze({
  lowHz: 30,
  highHz: 90,
});

export const EQUILIBRIUM_R_STAR = 3;
export const EQUILIBRIUM_DISPERSION_MAX = 0.4;
export const EQUILIBRIUM_HOLD_MS = 100;
