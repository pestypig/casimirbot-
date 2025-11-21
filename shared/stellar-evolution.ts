export type HRCategoryLiteral = "O" | "B" | "A" | "F" | "G" | "K" | "M";

export type EvolutionPhase =
  | "cloud"
  | "core-collapse"
  | "proto"
  | "preMS"
  | "ZAMS"
  | "MS"
  | "TAMS"
  | "subgiant"
  | "redGiant"
  | "WD";

export interface EvolutionTrackPoint {
  /** log10 Teff [K] */
  logT: number;
  /** log10 L/Lsun */
  logL: number;
  /** evolution phase at this point */
  phase: EvolutionPhase;
  /** spectral class bucket for coloring */
  hrCategory: HRCategoryLiteral;
}

export interface EvolutionRequest {
  /** Gas temperature [K]; required */
  T_K: number;
  /** Hydrogen number density [cm^-3]; required */
  nH_cm3: number;
  /** Stellar mass [Msun]; defaults to 1 */
  mass_Msun?: number;
  /** Metallicity mass fraction Z; defaults ~solar (0.0142) */
  metallicity_Z?: number;
  /** Optional helium mass fraction; default 0.28 */
  Y_He?: number;
  /** Optional epoch in ms for reproducibility */
  epochMs?: number;
}

export interface EvolutionProofs {
  input: Required<Pick<EvolutionRequest, "T_K" | "nH_cm3">> & {
    mass_Msun: number;
    metallicity_Z: number;
    Y_He: number;
  };

  /** Cloud-scale thermodynamics and collapse checks */
  cloud: {
    /** mean molecular weight used */
    mu: number;
    /** sound speed [km/s] */
    cs_kms: number;
    /** mass density [kg/m^3] */
    rho_kg_m3: number;
    /** free-fall time [Myr] */
    t_ff_Myr: number;
    /** Jeans length [pc] */
    jeans_length_pc: number;
    /** Jeans mass [Msun] */
    jeans_mass_Msun: number;
  };

  /** Proto/contracting object energetics (Kelvin–Helmholtz time etc) */
  proto: {
    /** assumed ZAMS R [Rsun] estimate from mass */
    R_Rsun: number;
    /** assumed ZAMS L [Lsun] estimate from mass */
    L_Lsun: number;
    /** Kelvin–Helmholtz timescale [Myr] ~ G M^2 / (R L) */
    t_KH_Myr: number;
  };

  /** Main-sequence scalings */
  mainSequence: {
    /** ZAMS effective temperature [K] from L and R */
    T_eff_K: number;
    /** HR category bucket for coloring */
    hrCategory: HRCategoryLiteral;
    /** lifetime [Gyr]—mass dependent power law */
    lifetime_Gyr: number;
    /** ZAMS luminosity [Lsun] and radius [Rsun] we used */
    L_Lsun: number;
    R_Rsun: number;
  };

  /** Coarse track points (for HR overlay); logT/logL with phase + HR bin */
  track: EvolutionTrackPoint[];

  meta: {
    /** bounds useful for plotting */
    hrBounds: { logT: [number, number]; logL: [number, number] };
    /** note strings suitable for a tooltip/footer */
    notes: string[];
    /** numeric stability guard flag */
    guarded: boolean;
  };
}

export interface EvolutionTrackResponse {
  input: Pick<EvolutionRequest, "mass_Msun" | "metallicity_Z"> & {
    mass_Msun: number;
    metallicity_Z: number;
  };
  track: EvolutionTrackPoint[];
  meta: EvolutionProofs["meta"];
}
