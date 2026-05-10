# ER=EPR Stage 1 Simulation

Status: Stage 1 falsifiable model-support scaffold  
Primary contract: `shared/er-epr-simulation.ts`  
Related proxy lane: `shared/quantum-spacetime-congruence.ts`

## Claim Boundary

The ER=EPR simulation lane tests whether a controlled entangled model produces geometry-like observables that are hard to explain by ordinary non-holographic controls. It can support a model-internal statement about a two-sided holographic toy model; it cannot prove real-universe Einstein-Rosen bridges, cannot inventory wormholes, cannot source stress-energy, and cannot promote a Needle Hull or warp claim.

All outputs remain:

```ts
spacetimeCL: "proxy_only";
mayPromoteToCL4: false;
```

## Experiment Shape

The supported model families are:

```ts
"two_sided_SYK"
"JT_gravity_dual"
"tensor_network_ads"
"random_matrix_control"
"spin_chain_control"
```

The first three are treated as holographic/toy-dual candidates. Random-matrix and spin-chain runs are controls. StarSim can enter only as `cosmological_structure_prior`, never as direct ER=EPR evidence.

## Verdicts

```ts
type ErEprSimulationVerdict =
  | "not_tested"
  | "ordinary_control_explains_signal"
  | "proxy_only_structure_prior"
  | "model_internal_er_epr_support"
  | "dual_model_support_strong"
  | "overclaim_blocked";
```

`model_internal_er_epr_support` requires:

- a holographic/toy-dual model family,
- a thermofield-double or partially entangled two-sided state,
- the correct-sign double-trace coupling,
- teleportation, causal ordering, and delay signatures above threshold,
- ordinary teleportation, shuffled-Hamiltonian, disentangled, and wrong-sign controls below threshold,
- operator size-winding, scrambling, and thermalization diagnostics above threshold,
- entropy/area tracking above threshold,
- low enough entropy stretch that quantum visibility has not been washed out.

`dual_model_support_strong` is the same verdict at a higher aggregate threshold. It remains model-internal support only.

## QST Entropy-Stretch Coupling

The simulation imports QST entropy handling instead of redefining it:

```ts
lambda_S = exp(deltaS_eff)
hbar_eff / hbar = 1 / lambda_S
```

The score path uses the QST-derived `quantumVisibility`. Increasing entropy stretch lowers the visibility-adjusted signal and can prevent model-internal support even if raw toy-model observables are high.

## StarSim Boundary

StarSim is useful as an ordinary astrophysical null/background layer:

```ts
starSim.role = "cosmological_structure_prior"
```

It may provide clustering entropy, local density contrast, velocity dispersion, and related structure priors. This lane blocks:

```ts
starSim.role = "direct_er_epr_evidence"
```

Stellar positions, groups, and local-rest-frame structure are gravitational/cosmological context. They are not a direct fusion-tunneling map and not direct evidence for ER=EPR.

## References

- Maldacena and Susskind, ER=EPR: `https://arxiv.org/abs/1306.0533`
- Ryu-Takayanagi holographic entropy: `https://arxiv.org/abs/hep-th/0603001`
- Van Raamsdonk entanglement/spacetime connectedness: `https://arxiv.org/abs/1005.3035`
- Gao-Jafferis-Wall double-trace traversability: `https://arxiv.org/abs/1608.05687`
- Jafferis et al. quantum processor simulation: `https://www.nature.com/articles/s41586-022-05424-3`
- 2025 Matters Arising critique: `https://doi.org/10.1038/s41586-025-08939-7`
- 2025 reply: `https://doi.org/10.1038/s41586-025-08995-z`
