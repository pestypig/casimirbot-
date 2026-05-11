import type { TinySykPlan } from "./er-epr-tiny-syk";

export type TinySykControlKind =
  | "correct_sign_candidate"
  | "wrong_sign_control"
  | "no_coupling_control"
  | "disentangled_control"
  | "shuffled_hamiltonian_control"
  | "random_matrix_control"
  | "spin_chain_control"
  | "high_entropy_washout_control";

export type TinySykControlPlan = {
  kind: TinySykControlKind;
  plan: TinySykPlan;
  changedSeed: boolean;
  nonHolographicControl: boolean;
};

export function buildTinySykControlPlans(base: TinySykPlan): TinySykControlPlan[] {
  const controls: TinySykControlPlan[] = [
    {
      kind: "correct_sign_candidate",
      plan: base,
      changedSeed: false,
      nonHolographicControl: false,
    },
  ];
  if (base.controls.includeWrongSign) {
    controls.push({
      kind: "wrong_sign_control",
      plan: {
        ...base,
        model: { ...base.model, coupling: { ...base.model.coupling, sign: "wrong" } },
      },
      changedSeed: false,
      nonHolographicControl: false,
    });
  }
  if (base.controls.includeNoCoupling) {
    controls.push({
      kind: "no_coupling_control",
      plan: {
        ...base,
        model: { ...base.model, coupling: { ...base.model.coupling, sign: "none", mu: 0 } },
      },
      changedSeed: false,
      nonHolographicControl: false,
    });
  }
  if (base.controls.includeDisentangled) {
    controls.push({
      kind: "disentangled_control",
      plan: {
        ...base,
        model: { ...base.model, statePreparation: "disentangled_control" },
      },
      changedSeed: false,
      nonHolographicControl: false,
    });
  }
  if (base.controls.includeShuffledHamiltonian) {
    controls.push({
      kind: "shuffled_hamiltonian_control",
      plan: {
        ...base,
        model: { ...base.model, seed: base.model.seed + 17 },
      },
      changedSeed: true,
      nonHolographicControl: true,
    });
  }
  if (base.controls.includeRandomMatrix) {
    controls.push({
      kind: "random_matrix_control",
      plan: {
        ...base,
        model: { ...base.model, seed: base.model.seed + 31, statePreparation: "random_control" },
      },
      changedSeed: true,
      nonHolographicControl: true,
    });
  }
  if (base.controls.includeSpinChain) {
    controls.push({
      kind: "spin_chain_control",
      plan: {
        ...base,
        model: { ...base.model, seed: base.model.seed + 43, statePreparation: "partially_entangled" },
      },
      changedSeed: true,
      nonHolographicControl: true,
    });
  }
  if (base.entropySweep?.enabled) {
    controls.push({
      kind: "high_entropy_washout_control",
      plan: base,
      changedSeed: false,
      nonHolographicControl: false,
    });
  }
  return controls;
}

export function classifyTinySykControlLeakage(controlScores: number[], leakageThreshold = 0.35): "controls_failed" | "control_leakage" {
  return Math.max(0, ...controlScores) <= leakageThreshold ? "controls_failed" : "control_leakage";
}
