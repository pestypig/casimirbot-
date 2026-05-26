import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type Nhm2DiagnosticObjectBindingInput = {
  objectId?: string;
  label?: string;
  t_shift?: number;
  delta_t_lapse?: number;
  E?: number;
  V?: number;
  rho?: number;
  E_cycle?: number;
  T_cycle?: number;
  P_avg?: number;
  source_required?: number;
  source_available?: number;
  R_source?: number;
  qei_bound?: number;
  qei_sample?: number;
  qei_margin?: number;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function definedEntries(values: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined),
  );
}

export function buildNhm2DiagnosticObjectBindings(
  input: Nhm2DiagnosticObjectBindingInput,
): TheoryCalculatorObjectContextV1 {
  const variableBindings = definedEntries({
    t_shift: input.t_shift,
    delta_t_lapse: input.delta_t_lapse,
    E: input.E,
    V: input.V,
    rho: input.rho,
    E_cycle: input.E_cycle,
    T_cycle: input.T_cycle,
    P_avg: input.P_avg,
    source_required: input.source_required,
    source_available: input.source_available,
    R_source: input.R_source,
    qei_bound: input.qei_bound,
    qei_sample: input.qei_sample,
    qei_margin: input.qei_margin,
  });

  return {
    kind: "nhm2_diagnostic_object",
    objectId: input.objectId ?? null,
    label: input.label ?? "NHM2 diagnostic object",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      t_shift: input.t_shift ?? null,
      delta_t_lapse: input.delta_t_lapse ?? null,
      E: input.E ?? null,
      V: input.V ?? null,
      rho: input.rho ?? null,
      E_cycle: input.E_cycle ?? null,
      T_cycle: input.T_cycle ?? null,
      P_avg: input.P_avg ?? null,
      source_required: input.source_required ?? null,
      source_available: input.source_available ?? null,
      R_source: input.R_source ?? null,
      qei_bound: input.qei_bound ?? null,
      qei_sample: input.qei_sample ?? null,
      qei_margin: input.qei_margin ?? null,
    },
    variableBindings,
    units: {
      t_shift: "s",
      delta_t_lapse: "s",
      E: "J",
      V: "m^3",
      rho: "J/m^3",
      E_cycle: "J",
      T_cycle: "s",
      P_avg: "W",
      source_required: "J/m^3",
      source_available: "J/m^3",
      R_source: "J/m^3",
      qei_bound: "J/m^3",
      qei_sample: "J/m^3",
      qei_margin: "J/m^3",
    },
    source: input.source ?? "manual",
    assumptions: [
      "NHM2 diagnostic scalar context.",
      "Scalar rows are proxies and do not solve tensor GR field equations.",
      "Reference and gate rows remain context unless a separate runtime receipt is attached.",
    ],
    claimBoundaryNotes: [
      "NHM2 diagnostic rows do not validate NHM2 or confirm a physical mechanism.",
      "GR tensor references and scalar calculator rows must remain separated.",
    ],
  };
}
