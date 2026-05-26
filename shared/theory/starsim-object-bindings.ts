import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type StarSimObjectBindingInput = {
  objectId?: string | null;
  label?: string | null;
  spectralType?: string | null;
  objectClass?: string | null;
  luminosity_Lsun?: number | null;
  radius_Rsun?: number | null;
  mass_Msun?: number | null;
  effectiveTemperature_K?: number | null;
  parallax_mas?: number | null;
  properMotionRa_masyr?: number | null;
  properMotionDec_masyr?: number | null;
  radialVelocity_kms?: number | null;
  r90_Rstar?: number | null;
  distance_pc?: number | null;
  gravitationalConstantNormalized?: number | null;
  channelTemperature_K?: number | null;
  channelDensity_g_cm3?: number | null;
  magneticField_T?: number | null;
  spectralLineNm?: number | null;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function putNumber(
  bindings: Record<string, string | number>,
  units: Record<string, string>,
  symbol: string,
  value: number | null | undefined,
  unit: string,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return;
  bindings[symbol] = value;
  units[symbol] = unit;
}

export function buildStarSimObjectBindings(
  input: StarSimObjectBindingInput,
): TheoryCalculatorObjectContextV1 {
  const variableBindings: Record<string, string | number> = {
    T_sun: 5772,
  };
  const units: Record<string, string> = {
    T_sun: "K",
  };

  putNumber(variableBindings, units, "L", input.luminosity_Lsun, "Lsun");
  putNumber(variableBindings, units, "R", input.radius_Rsun, "Rsun");
  putNumber(variableBindings, units, "M", input.mass_Msun, "Msun");
  putNumber(variableBindings, units, "T_eff", input.effectiveTemperature_K, "K");
  putNumber(variableBindings, units, "parallax_mas", input.parallax_mas, "mas");
  putNumber(variableBindings, units, "r90_Rstar", input.r90_Rstar, "Rstar");
  putNumber(variableBindings, units, "distance_pc", input.distance_pc, "pc");
  putNumber(variableBindings, units, "G", input.gravitationalConstantNormalized, "normalized");
  putNumber(variableBindings, units, "T_channel", input.channelTemperature_K, "K");
  putNumber(variableBindings, units, "rho_channel", input.channelDensity_g_cm3, "g/cm^3");
  putNumber(variableBindings, units, "B", input.magneticField_T, "T");
  putNumber(variableBindings, units, "lambda0_nm", input.spectralLineNm, "nm");

  return {
    kind: "starsim_star",
    objectId: input.objectId ?? null,
    label: input.label ?? input.spectralType ?? input.objectClass ?? "StarSim object",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      spectralType: input.spectralType ?? null,
      objectClass: input.objectClass ?? null,
      luminosity_Lsun: input.luminosity_Lsun ?? null,
      radius_Rsun: input.radius_Rsun ?? null,
      mass_Msun: input.mass_Msun ?? null,
      effectiveTemperature_K: input.effectiveTemperature_K ?? null,
      parallax_mas: input.parallax_mas ?? null,
      properMotionRa_masyr: input.properMotionRa_masyr ?? null,
      properMotionDec_masyr: input.properMotionDec_masyr ?? null,
      radialVelocity_kms: input.radialVelocity_kms ?? null,
      r90_Rstar: input.r90_Rstar ?? null,
      distance_pc: input.distance_pc ?? null,
      gravitationalConstantNormalized: input.gravitationalConstantNormalized ?? null,
      channelTemperature_K: input.channelTemperature_K ?? null,
      channelDensity_g_cm3: input.channelDensity_g_cm3 ?? null,
      magneticField_T: input.magneticField_T ?? null,
      spectralLineNm: input.spectralLineNm ?? null,
    },
    variableBindings,
    units,
    source: input.source ?? "helix_ask",
    assumptions: [
      "StarSim Stage 1 reduced-order object context.",
      "Solar-normalized values are used where indicated.",
      "Only explicitly supplied object values are substituted into calculator rows.",
    ],
    claimBoundaryNotes: [
      "StarSim Stage 1 is an astrophysical prior lane, not a full stellar-evolution solve.",
    ],
  };
}
