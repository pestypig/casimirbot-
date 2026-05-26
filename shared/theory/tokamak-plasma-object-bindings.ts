import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";

export type TokamakPlasmaObjectBindingInput = {
  objectId?: string;
  label?: string;
  B_T?: number;
  mu0?: number;
  p_B?: number;
  p_Pa?: number;
  n_m3?: number;
  T_eV?: number;
  e_charge?: number;
  P_in?: number;
  P_loss?: number;
  P_net?: number;
  tau_E?: number;
  W_th?: number;
  score?: number;
  threshold?: number;
  precursor_margin?: number;
  core_count?: number;
  edge_count?: number;
  sol_count?: number;
  total_count?: number;
  source?: TheoryCalculatorObjectContextV1["source"];
};

function definedEntries(values: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined),
  );
}

export function buildTokamakPlasmaObjectBindings(
  input: TokamakPlasmaObjectBindingInput,
): TheoryCalculatorObjectContextV1 {
  const variableBindings = definedEntries({
    B_T: input.B_T,
    mu0: input.mu0 ?? 1.25663706212e-6,
    p_B: input.p_B,
    p_Pa: input.p_Pa,
    n_m3: input.n_m3,
    T_eV: input.T_eV,
    e_charge: input.e_charge ?? 1.602176634e-19,
    P_in: input.P_in,
    P_loss: input.P_loss,
    P_net: input.P_net,
    tau_E: input.tau_E,
    W_th: input.W_th,
    score: input.score,
    threshold: input.threshold,
    precursor_margin: input.precursor_margin,
    core_count: input.core_count,
    edge_count: input.edge_count,
    sol_count: input.sol_count,
    total_count: input.total_count,
  });

  return {
    kind: "tokamak_plasma_object",
    objectId: input.objectId ?? null,
    label: input.label ?? "Tokamak plasma object",
    observables: {
      objectId: input.objectId ?? null,
      label: input.label ?? null,
      B_T: input.B_T ?? null,
      p_B: input.p_B ?? null,
      p_Pa: input.p_Pa ?? null,
      n_m3: input.n_m3 ?? null,
      T_eV: input.T_eV ?? null,
      P_in: input.P_in ?? null,
      P_loss: input.P_loss ?? null,
      tau_E: input.tau_E ?? null,
      score: input.score ?? null,
      threshold: input.threshold ?? null,
      core_count: input.core_count ?? null,
      edge_count: input.edge_count ?? null,
      sol_count: input.sol_count ?? null,
      total_count: input.total_count ?? null,
    },
    variableBindings,
    units: {
      B_T: "T",
      mu0: "N/A^2",
      p_B: "Pa",
      p_Pa: "Pa",
      n_m3: "m^-3",
      T_eV: "eV",
      e_charge: "J/eV",
      P_in: "W",
      P_loss: "W",
      P_net: "W",
      tau_E: "s",
      W_th: "J",
      score: "1",
      threshold: "1",
      precursor_margin: "1",
      core_count: "1",
      edge_count: "1",
      sol_count: "1",
      total_count: "1",
    },
    source: input.source ?? "manual",
    assumptions: [
      "Tokamak plasma scalar context.",
      "Scalar rows are reduced diagnostic proxies and do not replace MHD equilibrium, transport, or synthetic diagnostic runtimes.",
      "Runtime rows require tokamak receipts before interpretation.",
    ],
    claimBoundaryNotes: [
      "Tokamak plasma rows are diagnostic/proxy helpers.",
      "Calculator rows do not establish plasma stability, disruption prediction, or control authority.",
    ],
  };
}
