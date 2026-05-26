import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type CasimirCavityObjectBindingInput = {
  objectId?: string;
  label?: string;
  a?: number;
  A_tile?: number;
  hbar_c?: number;
  c?: number;
  pi?: number;
  E_area?: number;
  E_tile?: number;
  absE_tile?: number;
  N_tiles?: number;
  U_static?: number;
  absU_static?: number;
  gammaGeo?: number;
  Q_L?: number;
  gamma_VdB?: number;
  d_eff?: number;
  E_out?: number;
  L?: number;
  n?: number;
  h?: number;
  f_n?: number;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function definedEntries(values: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined),
  );
}

export function buildCasimirCavityObjectBindings(
  input: CasimirCavityObjectBindingInput,
): TheoryCalculatorObjectContextV1 {
  const variableBindings = definedEntries({
    pi: input.pi ?? Math.PI,
    hbar_c: input.hbar_c ?? 3.16152677e-26,
    h: input.h ?? 6.62607015e-34,
    c: input.c ?? 299792458,
    a: input.a,
    A_tile: input.A_tile,
    E_area: input.E_area,
    E_tile: input.E_tile,
    absE_tile: input.absE_tile,
    N_tiles: input.N_tiles,
    U_static: input.U_static,
    absU_static: input.absU_static,
    gammaGeo: input.gammaGeo,
    Q_L: input.Q_L,
    gamma_VdB: input.gamma_VdB,
    d_eff: input.d_eff,
    E_out: input.E_out,
    L: input.L,
    n: input.n,
    f_n: input.f_n,
  });

  return {
    kind: "casimir_cavity_object",
    objectId: input.objectId ?? null,
    label: input.label ?? "Casimir cavity object",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      a: input.a ?? null,
      A_tile: input.A_tile ?? null,
      E_area: input.E_area ?? null,
      E_tile: input.E_tile ?? null,
      N_tiles: input.N_tiles ?? null,
      U_static: input.U_static ?? null,
      gammaGeo: input.gammaGeo ?? null,
      Q_L: input.Q_L ?? null,
      gamma_VdB: input.gamma_VdB ?? null,
      d_eff: input.d_eff ?? null,
      L: input.L ?? null,
      n: input.n ?? null,
      f_n: input.f_n ?? null,
    },
    variableBindings,
    units: {
      pi: "1",
      hbar_c: "J*m",
      h: "J*s",
      c: "m/s",
      a: "m",
      A_tile: "m^2",
      E_area: "J/m^2",
      E_tile: "J",
      absE_tile: "J",
      N_tiles: "1",
      U_static: "J",
      absU_static: "J",
      gammaGeo: "1",
      Q_L: "1",
      gamma_VdB: "1",
      d_eff: "1",
      E_out: "J",
      L: "m",
      n: "1",
      f_n: "Hz",
    },
    source: input.source ?? "manual",
    assumptions: [
      "Casimir cavity scalar context.",
      "Parallel-plate rows assume idealized perfect-conductor, zero-temperature geometry unless a material/runtime receipt says otherwise.",
      "Amplification rows are diagnostic/proxy rows and must stay separated from physical confirmation language.",
    ],
    claimBoundaryNotes: [
      "Casimir cavity rows are source-context and diagnostic helpers.",
      "Cavity calculations do not establish propulsion, NHM2 validation, or mechanism confirmation.",
    ],
  };
}
