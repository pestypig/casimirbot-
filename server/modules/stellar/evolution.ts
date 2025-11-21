import type {
  EvolutionProofs,
  EvolutionRequest,
  EvolutionTrackPoint,
  HRCategoryLiteral,
} from "@shared/stellar-evolution";

// Physical constants (SI unless noted)
const G = 6.6743e-11; // m^3 kg^-1 s^-2
const kB = 1.380649e-23; // J/K
const mH = 1.6735575e-27; // kg
const Msun = 1.98847e30; // kg
const Lsun = 3.828e26; // W
const Rsun = 6.957e8; // m
const sigmaSB = 5.670374419e-8; // W m^-2 K^-4
const pc_m = 3.085677581491367e16;
const yr_s = 365.25 * 24 * 3600;

const clampFinite = (x: number, fallback: number) => (Number.isFinite(x) ? x : fallback);

function toHRCategory(T_K: number): HRCategoryLiteral {
  if (T_K >= 30000) return "O";
  if (T_K >= 10000) return "B";
  if (T_K >= 7500) return "A";
  if (T_K >= 6000) return "F";
  if (T_K >= 5200) return "G";
  if (T_K >= 3700) return "K";
  return "M";
}

// Mass–luminosity (MS-ish) scalings
const L_from_M = (M_Msun: number) => {
  const M = M_Msun;
  if (M < 0.43) return 0.23 * Math.pow(M, 2.3);
  if (M < 2.0) return Math.pow(M, 4.0);
  if (M < 20.0) return 1.5 * Math.pow(M, 3.5);
  return 3200 * M; // rough, high-mass limit
};

const R_from_M = (M_Msun: number) => {
  const M = M_Msun;
  if (M < 1.0) return Math.pow(M, 0.8);
  if (M < 10.0) return Math.pow(M, 0.57);
  return 1.33 * Math.pow(M, 0.4);
};

const Teff_from_LR = (L_Lsun: number, R_Rsun: number) => {
  const L = L_Lsun * Lsun;
  const R = R_Rsun * Rsun;
  return Math.pow(L / (4 * Math.PI * R * R * sigmaSB), 0.25);
};

const t_KH_Myr = (M_Msun: number, R_Rsun: number, L_Lsun: number) => {
  const M = M_Msun * Msun;
  const R = R_Rsun * Rsun;
  const L = L_Lsun * Lsun;
  const t_s = (G * M * M) / (R * L);
  return t_s / (1e6 * yr_s);
};

const t_MS_Gyr = (M_Msun: number) => {
  const M = M_Msun;
  const t0 = 10; // Gyr at 1 Msun
  const alpha = M < 2 ? 2.5 : 3.5;
  return t0 * Math.pow(M, -alpha);
};

const jeans = (input: Required<Pick<EvolutionRequest, "T_K" | "nH_cm3">> & { Y_He: number; mu?: number }) => {
  const { T_K, nH_cm3, Y_He } = input;
  const mu = input.mu ?? 2.33 - 0.3 * (Y_He - 0.28); // slight tweak with helium fraction
  const cs = Math.sqrt(kB * T_K / (mu * mH)); // m/s
  const nH_m3 = nH_cm3 * 1e6; // cm^-3 -> m^-3
  const rho = mu * mH * nH_m3; // kg/m^3

  const t_ff = Math.sqrt(3 * Math.PI / (32 * G * rho)); // s
  const lambda_J_m = cs * Math.sqrt(Math.PI / (G * rho));
  const M_J_kg = (Math.pow(Math.PI, 2.5) / 6) * Math.pow(cs, 3) / (Math.pow(G, 1.5) * Math.sqrt(rho));

  return {
    mu,
    cs_kms: cs / 1000,
    rho_kg_m3: rho,
    t_ff_Myr: t_ff / (1e6 * yr_s),
    jeans_length_pc: lambda_J_m / pc_m,
    jeans_mass_Msun: M_J_kg / Msun,
  };
};

export function computeProofs(req: EvolutionRequest): EvolutionProofs {
  const mass = clampFinite(req.mass_Msun ?? 1, 1);
  const Z = clampFinite(req.metallicity_Z ?? 0.0142, 0.0142);
  const Y = clampFinite(req.Y_He ?? 0.28, 0.28);

  const cloud = jeans({ T_K: req.T_K, nH_cm3: req.nH_cm3, Y_He: Y });

  const L_Lsun = clampFinite(L_from_M(mass), 1);
  const R_Rsun = clampFinite(R_from_M(mass), 1);
  const T_eff_K = clampFinite(Teff_from_LR(L_Lsun, R_Rsun), 5772);

  const proofs: EvolutionProofs = {
    input: {
      T_K: req.T_K,
      nH_cm3: req.nH_cm3,
      mass_Msun: mass,
      metallicity_Z: Z,
      Y_He: Y,
    },
    cloud,
    proto: {
      R_Rsun,
      L_Lsun,
      t_KH_Myr: clampFinite(t_KH_Myr(mass, R_Rsun, L_Lsun), 30),
    },
    mainSequence: {
      T_eff_K,
      hrCategory: toHRCategory(T_eff_K),
      lifetime_Gyr: clampFinite(t_MS_Gyr(mass), 10),
      L_Lsun,
      R_Rsun,
    },
    track: buildCoarseTrack(mass, L_Lsun, R_Rsun),
    meta: {
      hrBounds: { logT: [3.3, 4.7], logL: [-2, 5] },
      notes: [
        "Scalings: simplified mass–luminosity, mass–radius, Kelvin–Helmholtz, and Jeans relations.",
        "Metallicity dependences neglected in this zeroth-order closure.",
      ],
      guarded: true,
    },
  };

  return proofs;
}

function buildCoarseTrack(M: number, Lz: number, Rz: number): EvolutionTrackPoint[] {
  const Tz = Teff_from_LR(Lz, Rz);
  const logTz = Math.log10(Tz);
  const logLz = Math.log10(Lz);

  const preMS_T = Math.min(4500, Tz * 0.9);
  const preMS_L = Math.max(0.2, Lz * 1.5);

  const fL = M <= 1 ? 1.4 : M <= 2 ? 1.8 : 3.0;
  const Tams_L = Lz * fL;
  const Tams_R = R_from_M(M) * 1.1;
  const Tams_T = Teff_from_LR(Tams_L, Tams_R);

  const avgT = (Tz + Tams_T) / 2;
  const avgL = (Lz + Tams_L) / 2;

  return [
    {
      phase: "preMS",
      logT: Math.log10(preMS_T),
      logL: Math.log10(preMS_L),
      hrCategory: toHRCategory(preMS_T),
    },
    {
      phase: "ZAMS",
      logT: logTz,
      logL: logLz,
      hrCategory: toHRCategory(Tz),
    },
    {
      phase: "MS",
      logT: Math.log10(avgT),
      logL: Math.log10(avgL),
      hrCategory: toHRCategory(avgT),
    },
    {
      phase: "TAMS",
      logT: Math.log10(Tams_T),
      logL: Math.log10(Tams_L),
      hrCategory: toHRCategory(Tams_T),
    },
  ];
}
