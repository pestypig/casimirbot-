import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type GalacticDynamicsObjectBindingInput = {
  objectId?: string;
  label?: string;
  dx_pc?: number;
  dy_pc?: number;
  dz_pc?: number;
  dvx_kms?: number;
  dvy_kms?: number;
  dvz_kms?: number;
  distance_pc?: number;
  relativeVelocity_kms?: number;
  structureWeight?: number;
  G?: number;
  M_enc?: number;
  r_kpc?: number;
  v_rot?: number;
  v_obs?: number;
  v_model?: number;
  velocity_residual?: number;
  residual_sum_sq?: number;
  N_points?: number;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function definedEntries(values: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined),
  );
}

export function buildGalacticDynamicsObjectBindings(
  input: GalacticDynamicsObjectBindingInput,
): TheoryCalculatorObjectContextV1 {
  const variableBindings = definedEntries({
    dx_pc: input.dx_pc,
    dy_pc: input.dy_pc,
    dz_pc: input.dz_pc,
    dvx_kms: input.dvx_kms,
    dvy_kms: input.dvy_kms,
    dvz_kms: input.dvz_kms,
    distance_pc: input.distance_pc,
    relativeVelocity_kms: input.relativeVelocity_kms,
    structureWeight: input.structureWeight,
    G: input.G ?? 4.30091e-6,
    M_enc: input.M_enc,
    r_kpc: input.r_kpc,
    v_rot: input.v_rot,
    v_obs: input.v_obs,
    v_model: input.v_model,
    velocity_residual: input.velocity_residual,
    residual_sum_sq: input.residual_sum_sq,
    N_points: input.N_points,
  });

  return {
    kind: "galactic_dynamics_object",
    objectId: input.objectId ?? null,
    label: input.label ?? "Galactic dynamics object",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      dx_pc: input.dx_pc ?? null,
      dy_pc: input.dy_pc ?? null,
      dz_pc: input.dz_pc ?? null,
      dvx_kms: input.dvx_kms ?? null,
      dvy_kms: input.dvy_kms ?? null,
      dvz_kms: input.dvz_kms ?? null,
      distance_pc: input.distance_pc ?? null,
      relativeVelocity_kms: input.relativeVelocity_kms ?? null,
      M_enc: input.M_enc ?? null,
      r_kpc: input.r_kpc ?? null,
      v_rot: input.v_rot ?? null,
      v_obs: input.v_obs ?? null,
      v_model: input.v_model ?? null,
      residual_sum_sq: input.residual_sum_sq ?? null,
      N_points: input.N_points ?? null,
    },
    variableBindings,
    units: {
      dx_pc: "pc",
      dy_pc: "pc",
      dz_pc: "pc",
      distance_pc: "pc",
      dvx_kms: "km/s",
      dvy_kms: "km/s",
      dvz_kms: "km/s",
      relativeVelocity_kms: "km/s",
      structureWeight: "1",
      G: "kpc (km/s)^2 Msun^-1",
      M_enc: "Msun",
      r_kpc: "kpc",
      v_rot: "km/s",
      v_obs: "km/s",
      v_model: "km/s",
      velocity_residual: "km/s",
      residual_sum_sq: "(km/s)^2",
      N_points: "1",
    },
    source: input.source ?? "manual",
    assumptions: [
      "Galactic dynamics scalar context.",
      "Scalar rows are null-model helpers and do not select a physics winner.",
      "Bound galactic systems require local dynamics context rather than local Hubble-flow interpretation.",
    ],
    claimBoundaryNotes: [
      "Galactic rows are null-model and diagnostic helpers.",
      "Calculator rows do not provide ER/EPR evidence or CL promotion.",
    ],
  };
}
