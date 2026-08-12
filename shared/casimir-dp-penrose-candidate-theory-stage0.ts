// math-stage: exploratory

import type {
  CasimirDpPenroseCandidateTheoryStage0Config,
  PenroseTheoryRequirement,
} from "./contracts/casimir-dp-penrose-candidate-theory-stage0.v1";

/**
 * This file defines the Stage-0 theory object. It deliberately contains no
 * collapse calculator. The adjacent diagnostic preflight checks whether a
 * candidate definition is complete enough to become input to a future,
 * separately registered calculator.
 */

export const PENROSE_RELATIONAL_CANDIDATE_FORMAL_RELATIONS = {
  branch_state:
    "B_r=(M_r,g^(r)_munu,omega_r,<T^(r)_munu>_ren,X_r), r in {A,B}",
  branch_source_difference:
    "Delta_br T_munu(b)=T^A_munu(b)-T^B_munu(b)",
  newtonian_incompatibility:
    "E_I^N=(G/2) int d3x d3y Delta rho_R0(x) Delta rho_R0(y)/|x-y|",
  penrose_lifetime_notation: "tau_OR ~ hbar/E_I",
  complex_coherence:
    "Cbar_AB=exp[i(Phi_ordinary+Phi_geometry)] exp[-chi_env] F_candidate(t), with F_candidate blocked until dynamics is registered",
} as const;

export const PENROSE_CANDIDATE_REQUIRED_NONBRIDGES = [
  "compton_frequency_to_cavity_mode",
  "casimir_pressure_or_energy_to_E_G",
  "negative_casimir_energy_to_negative_mass",
  "virtual_particle_annihilation_to_collapse_clock",
  "gravitational_wave_existence_to_quantum_geometry_interference",
  "superconductivity_higgs_bec_to_collapse_source",
  "nhm2_force_amplification_proxy_import",
  "mean_semiclassical_metric_to_nonunitary_reduction",
  "stochastic_gravity_decoherence_to_single_outcome",
] as const;

export type PenroseCandidateObligation = {
  code: string;
  path: string;
  label: string;
  requirement: PenroseTheoryRequirement;
};

export function enumeratePenroseCandidateObligations(
  config: CasimirDpPenroseCandidateTheoryStage0Config,
): PenroseCandidateObligation[] {
  return [
    {
      code: "PCT_BRANCH_STATE_CONTRACT_MISSING",
      path: "theory_definition.branch_state_contract",
      label: "two branch matter-geometry states and their complete sources",
      requirement: config.theory_definition.branch_state_contract,
    },
    {
      code: "PCT_BRANCH_CORRESPONDENCE_MISSING",
      path: "theory_definition.branch_correspondence",
      label: "relational point identification, gauge, and branch correspondence",
      requirement: config.theory_definition.branch_correspondence,
    },
    {
      code: "PCT_INVARIANT_INCOMPATIBILITY_FUNCTIONAL_MISSING",
      path: "theory_definition.invariant_incompatibility_functional",
      label: "a coordinate-independent incompatibility functional with energy units",
      requirement: config.theory_definition.invariant_incompatibility_functional,
    },
    {
      code: "PCT_EQUIVALENCE_RECOVERY_MISSING",
      path: "theory_definition.equivalence_principle_recovery",
      label: "local Hamiltonian/free-fall equivalence recovery",
      requirement: config.theory_definition.equivalence_principle_recovery,
    },
    {
      code: "PCT_REDUCTION_DYNAMICS_MISSING",
      path: "dynamics.reduction_law",
      label: "a generative reduction law rather than a lifetime slogan",
      requirement: config.dynamics.reduction_law,
    },
    {
      code: "PCT_LIFETIME_DISTRIBUTION_MISSING",
      path: "dynamics.lifetime_distribution",
      label: "a survival or hazard law",
      requirement: config.dynamics.lifetime_distribution,
    },
    {
      code: "PCT_STOCHASTIC_UNRAVELLING_MISSING",
      path: "dynamics.stochastic_unravelling",
      label: "a physical trajectory or outcome law",
      requirement: config.dynamics.stochastic_unravelling,
    },
    {
      code: "PCT_PROBABILITY_LAW_MISSING",
      path: "dynamics.born_probability_law",
      label: "Born probabilities",
      requirement: config.dynamics.born_probability_law,
    },
    {
      code: "PCT_NORMALIZATION_CONTRACT_MISSING",
      path: "dynamics.normalization_contract",
      label: "normalization or trace preservation",
      requirement: config.dynamics.normalization_contract,
    },
    {
      code: "PCT_CAUSALITY_OR_NO_SIGNALLING_MISSING",
      path: "consistency.causal_support_and_no_signalling",
      label: "causal support and no-superluminal-signalling",
      requirement: config.consistency.causal_support_and_no_signalling,
    },
    {
      code: "PCT_ENERGY_MOMENTUM_BALANCE_MISSING",
      path: "consistency.energy_momentum_balance",
      label: "energy-momentum balance",
      requirement: config.consistency.energy_momentum_balance,
    },
    {
      code: "PCT_GAUGE_ROBUSTNESS_MISSING",
      path: "consistency.gauge_and_diffeomorphism_robustness",
      label: "gauge and diffeomorphism robustness",
      requirement: config.consistency.gauge_and_diffeomorphism_robustness,
    },
    {
      code: "PCT_VACUUM_STABILITY_MISSING",
      path: "consistency.vacuum_stability_or_hadamard_contract",
      label: "vacuum stability or a Hadamard-state contract",
      requirement: config.consistency.vacuum_stability_or_hadamard_contract,
    },
    {
      code: "PCT_COHERENCE_PROJECTION_MISSING",
      path: "observable_contract.complex_coherence_projection",
      label: "a map into measured complex coherence",
      requirement: config.observable_contract.complex_coherence_projection,
    },
    {
      code: "PCT_COMPANION_OR_JUSTIFIED_NULL_MISSING",
      path: "observable_contract.companion_prediction_or_justified_null",
      label: "an independent companion prediction or sourced justified null",
      requirement:
        config.observable_contract.companion_prediction_or_justified_null,
    },
  ];
}
