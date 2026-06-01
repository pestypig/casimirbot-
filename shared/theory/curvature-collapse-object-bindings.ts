import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type CurvatureCollapseObjectBindingInput = {
  objectId?: string;
  label?: string;
  rho_kg_m3?: number;
  power_W?: number;
  area_m2?: number;
  powerFlux_W_m2?: number;
  d_eff?: number;
  gain?: number;
  kappa_body?: number;
  kappa_drive?: number;
  tau_ms?: number;
  dt_ms?: number;
  r_c_m?: number;
  c?: number;
  L_present?: number;
  observed?: number;
  bound?: number;
  sigma?: number;
  E_J?: number;
  f_Hz?: number;
  T_s?: number;
  omega_rad_s?: number;
  deltaE_G_J?: number;
  tau_DP_s?: number;
  tau_DP_ms?: number;
  Gamma_DP_Hz?: number;
  G?: number;
  h?: number;
  hbar?: number;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function definedEntries(values: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined),
  );
}

export function buildCurvatureCollapseObjectBindings(
  input: CurvatureCollapseObjectBindingInput,
): TheoryCalculatorObjectContextV1 {
  const variableBindings = definedEntries({
    rho_kg_m3: input.rho_kg_m3,
    power_W: input.power_W,
    area_m2: input.area_m2,
    powerFlux_W_m2: input.powerFlux_W_m2,
    d_eff: input.d_eff ?? 1,
    gain: input.gain ?? 1,
    kappa_body: input.kappa_body,
    kappa_drive: input.kappa_drive,
    tau_ms: input.tau_ms,
    dt_ms: input.dt_ms,
    r_c_m: input.r_c_m,
    c: input.c ?? 299792458,
    L_present: input.L_present,
    observed: input.observed,
    bound: input.bound,
    sigma: input.sigma,
    E_J: input.E_J,
    f_Hz: input.f_Hz,
    T_s: input.T_s,
    omega_rad_s: input.omega_rad_s,
    deltaE_G_J: input.deltaE_G_J,
    tau_DP_s: input.tau_DP_s,
    tau_DP_ms: input.tau_DP_ms,
    Gamma_DP_Hz: input.Gamma_DP_Hz,
    G: input.G ?? 6.6743e-11,
    h: input.h ?? 6.62607015e-34,
    hbar: input.hbar ?? 1.054571817e-34,
  });

  return {
    kind: "curvature_collapse_object",
    objectId: input.objectId ?? null,
    label: input.label ?? "Curvature / collapse object",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      rho_kg_m3: input.rho_kg_m3 ?? null,
      power_W: input.power_W ?? null,
      area_m2: input.area_m2 ?? null,
      powerFlux_W_m2: input.powerFlux_W_m2 ?? null,
      d_eff: input.d_eff ?? null,
      gain: input.gain ?? null,
      kappa_body: input.kappa_body ?? null,
      kappa_drive: input.kappa_drive ?? null,
      tau_ms: input.tau_ms ?? null,
      dt_ms: input.dt_ms ?? null,
      r_c_m: input.r_c_m ?? null,
      L_present: input.L_present ?? null,
      observed: input.observed ?? null,
      bound: input.bound ?? null,
      sigma: input.sigma ?? null,
      E_J: input.E_J ?? null,
      f_Hz: input.f_Hz ?? null,
      T_s: input.T_s ?? null,
      omega_rad_s: input.omega_rad_s ?? null,
      deltaE_G_J: input.deltaE_G_J ?? null,
      tau_DP_s: input.tau_DP_s ?? null,
      tau_DP_ms: input.tau_DP_ms ?? null,
      Gamma_DP_Hz: input.Gamma_DP_Hz ?? null,
    },
    variableBindings,
    units: {
      rho_kg_m3: "kg/m^3",
      power_W: "W",
      area_m2: "m^2",
      powerFlux_W_m2: "W/m^2",
      d_eff: "1",
      gain: "1",
      kappa_body: "m^-2",
      kappa_drive: "m^-2",
      tau_ms: "ms",
      dt_ms: "ms",
      r_c_m: "m",
      c: "m/s",
      L_present: "m",
      observed: "varies",
      bound: "varies",
      sigma: "varies",
      E_J: "J",
      f_Hz: "Hz",
      T_s: "s",
      omega_rad_s: "rad/s",
      deltaE_G_J: "J",
      tau_DP_s: "s",
      tau_DP_ms: "ms",
      Gamma_DP_Hz: "Hz",
      G: "m^3 kg^-1 s^-2",
      h: "J s",
      hbar: "J s",
    },
    source: input.source ?? "manual",
    assumptions: [
      "Curvature/collapse rows are diagnostic calculator helpers.",
      "Collapse benchmark rows model commit/selection cadence, not literal objective-collapse physics.",
      "Objective-collapse rows are exploratory model-comparison helpers, not established collapse physics.",
      "Runtime and certificate interpretation require backend receipts.",
    ],
    claimBoundaryNotes: [
      "Curvature/collapse loadouts are benchmark diagnostics.",
      "Diosi-Penrose timescale rows require explicit mass-density branch evidence and experimental-bound context.",
      "Calculator rows do not certify curvature gravity, signal behavior, or mechanism claims.",
    ],
  };
}
