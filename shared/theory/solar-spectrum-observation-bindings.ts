import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type SolarSpectrumObservationBindingInput = {
  objectId?: string;
  label?: string;
  lambda?: number;
  lambda0?: number;
  lambda_obs?: number;
  T?: number;
  R?: number;
  sigma?: number;
  b?: number;
  B?: number;
  g_eff?: number;
  h?: number;
  c?: number;
  mu_B?: number;
  delta_nu?: number;
  P_rad?: number;
  delta_t?: number;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function definedEntries(values: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined),
  );
}

function computeDopplerZ(input: SolarSpectrumObservationBindingInput): number | undefined {
  if (input.lambda0 === undefined || input.lambda_obs === undefined || input.lambda0 === 0) return undefined;
  return (input.lambda_obs - input.lambda0) / input.lambda0;
}

export function buildSolarSpectrumObservationBindings(
  input: SolarSpectrumObservationBindingInput,
): TheoryCalculatorObjectContextV1 {
  const z = computeDopplerZ(input);
  const variableBindings = definedEntries({
    h: input.h ?? 6.62607015e-34,
    c: input.c ?? 299792458,
    b: input.b ?? 2.897771955e-3,
    sigma: input.sigma ?? 5.670374419e-8,
    mu_B: input.mu_B ?? 9.2740100783e-24,
    lambda: input.lambda,
    lambda0: input.lambda0,
    lambda_obs: input.lambda_obs,
    T: input.T,
    R: input.R,
    B: input.B,
    g_eff: input.g_eff,
    delta_nu: input.delta_nu,
    P_rad: input.P_rad,
    delta_t: input.delta_t,
    z,
  });

  return {
    kind: "solar_spectrum_observation",
    objectId: input.objectId ?? null,
    label: input.label ?? "Solar spectrum observation",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      lambda: input.lambda ?? null,
      lambda0: input.lambda0 ?? null,
      lambda_obs: input.lambda_obs ?? null,
      T: input.T ?? null,
      R: input.R ?? null,
      B: input.B ?? null,
      g_eff: input.g_eff ?? null,
      delta_nu: input.delta_nu ?? null,
      P_rad: input.P_rad ?? null,
      delta_t: input.delta_t ?? null,
      z: z ?? null,
    },
    variableBindings,
    units: {
      h: "J*s",
      c: "m/s",
      b: "m*K",
      sigma: "W m^-2 K^-4",
      mu_B: "J/T",
      lambda: "m",
      lambda0: "m",
      lambda_obs: "m",
      T: "K",
      R: "m",
      B: "T",
      g_eff: "1",
      delta_nu: "Hz",
      P_rad: "W",
      delta_t: "s",
      z: "1",
    },
    source: input.source ?? "manual",
    assumptions: [
      "Solar spectrum scalar observation context.",
      "Doppler and Zeeman rows are observational proxies unless backed by a calibrated observation receipt.",
      "Blackbody rows are idealized and do not replace solar atmosphere or radiative-transfer modeling.",
    ],
    claimBoundaryNotes: [
      "Solar spectrum rows are observational/inference helpers.",
      "Line identification, calibration, and bandpass context are required before physical interpretation.",
    ],
  };
}
