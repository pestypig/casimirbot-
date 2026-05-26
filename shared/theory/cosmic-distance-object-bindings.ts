import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type CosmicDistanceObjectBindingInput = {
  objectId?: string;
  label?: string;
  lambda_rest?: number;
  lambda_obs?: number;
  parallax_mas?: number;
  P_days?: number;
  alpha?: number;
  beta?: number;
  m_app?: number;
  M_abs?: number;
  z?: number;
  H0_km_s_Mpc?: number;
  c_km_s?: number;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function definedEntries(values: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined),
  );
}

export function buildCosmicDistanceObjectBindings(
  input: CosmicDistanceObjectBindingInput,
): TheoryCalculatorObjectContextV1 {
  const variableBindings = definedEntries({
    lambda_rest: input.lambda_rest,
    lambda_obs: input.lambda_obs,
    parallax_mas: input.parallax_mas,
    P_days: input.P_days,
    alpha: input.alpha,
    beta: input.beta,
    m_app: input.m_app,
    M_abs: input.M_abs,
    z: input.z,
    H0_km_s_Mpc: input.H0_km_s_Mpc ?? 70,
    c_km_s: input.c_km_s ?? 299792.458,
  });

  return {
    kind: "cosmic_distance_object",
    objectId: input.objectId ?? null,
    label: input.label ?? "Cosmic distance object",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      lambda_rest: input.lambda_rest ?? null,
      lambda_obs: input.lambda_obs ?? null,
      parallax_mas: input.parallax_mas ?? null,
      P_days: input.P_days ?? null,
      alpha: input.alpha ?? null,
      beta: input.beta ?? null,
      m_app: input.m_app ?? null,
      M_abs: input.M_abs ?? null,
      z: input.z ?? null,
      H0_km_s_Mpc: input.H0_km_s_Mpc ?? 70,
      c_km_s: input.c_km_s ?? 299792.458,
    },
    variableBindings,
    units: {
      lambda_rest: "nm",
      lambda_obs: "nm",
      parallax_mas: "mas",
      P_days: "day",
      alpha: "mag",
      beta: "mag",
      m_app: "mag",
      M_abs: "mag",
      z: "1",
      H0_km_s_Mpc: "km/s/Mpc",
      c_km_s: "km/s",
    },
    source: input.source ?? "manual",
    assumptions: [
      "Cosmic distance ladder scalar object context.",
      "Redshift and standard-candle distances require calibration/model context.",
      "Low-z Hubble distance is an approximation when used.",
    ],
    claimBoundaryNotes: [
      "Distance-ladder estimates are calibration/model dependent.",
      "Accordion cosmology context does not imply local expansion for bound systems.",
    ],
  };
}
