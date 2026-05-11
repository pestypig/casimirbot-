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

## Stage 1 Runner Workflow

`ER_EPR_STAGE1_RUNNER` turns normalized candidate/control observables into reproducible JSON and Markdown reports. The runner consumes a plan:

```txt
tests/fixtures/er-epr-stage1/plan.fixture.json
```

and emits:

```txt
reports/er-epr-stage1-report.json
reports/er-epr-stage1-report.md
```

The workflow is:

1. Parse a run plan with candidate runs, control runs, entropy sweep points, StarSim policy, threshold profile, claim IDs, and citations.
2. Evaluate each run through `evaluateErEprSimulation`.
3. Require all null controls before preserving a support verdict.
4. Demote the batch if a control carries signal above the declared threshold.
5. Render bounded report language from machine verdicts, claim IDs, source roles, caveats, and uncertainty notes.

The CLI entrypoint is:

```bash
npm run er-epr:stage1 -- --plan tests/fixtures/er-epr-stage1/plan.fixture.json --out reports/er-epr-stage1-report.json
```

## Fixture-Only Versus Simulated Versus Reproduced

`fixture_only` means the inputs are normalized observables used to test the evaluator, control gates, report schema, and language policy. It is not raw quantum-simulation output and must not be described as a solver reproduction.

`simulated` is reserved for an actual local solver or adapter that emits normalized observables from declared Hamiltonian/model inputs.

`reproduced` is reserved for an independently replayable simulation artifact with enough model, seed, Hamiltonian, environment, and output metadata to reproduce the declared observables.

## Control Suite

Required controls are:

- `disentangled_control`
- `random_state_control`
- `wrong_sign_coupling_control`
- `no_coupling_control`
- `shuffled_hamiltonian_control`
- `random_matrix_control`
- `spin_chain_control`
- `high_entropy_washout_control`
- `starsim_structure_prior_only_control`

Strong model-internal support is impossible unless these controls are present and ordinary controls fail below the declared threshold. High-entropy washout is tracked separately as a QST visibility-demotion check.

## Safe Language Policy

Report language is rendered by `shared/er-epr-safe-language.ts`. It must include:

- claim tier,
- verdict,
- claim IDs,
- caveats,
- source roles,
- uncertainty notes.

It blocks language that would imply real-universe proof, wormhole inventory, stress-energy sourcing, Hubble-driven photon production, CL promotion, or Needle Hull/propulsion evidence.

## What Would Upgrade This Beyond Stage 1

A future Stage 2 candidate requires an actual solver or externally reproducible simulation, not just normalized fixtures. At minimum it needs declared Hamiltonian/model inputs, reproducible seeds, raw-to-normalized observable transforms, out-of-training controls, thermalization/scrambling checks, and artifact integrity metadata sufficient for independent replay.

## Research-backed claim matrix

The Stage 1 lane is claim-hardened through `docs/knowledge/math-claims/er-epr-stage1-simulation.claims.json` and `shared/er-epr-research-claims.ts`. Every verdict returned by `evaluateErEprSimulation` must carry claim IDs, citations, source roles, and uncertainty notes.

ER=EPR is research context, not local wormhole inventory. Ryu-Takayanagi motivates area/entropy proxy bookkeeping only inside holographic contexts. Gao-Jafferis-Wall motivates double-trace traversability in a specific holographic model, not a generic engine. The 2022 Nature processor result is a simulation precedent. The 2025 critique/reply pair makes the interpretation contested and therefore mandates control gates. StarSim astrometry is observational structure prior only.

| Claim ID | What it supports | What it does not support | Primary references | Repo binding |
| --- | --- | --- | --- | --- |
| `er_epr_entangled_black_hole_bridge_context.v1` | ER=EPR context for maximally entangled black-hole states and ER-bridge interpretation. | Generic real-universe wormhole inventory, propulsion, local wormhole density, or CL0-CL4 promotion. | Maldacena and Susskind, `https://arxiv.org/abs/1306.0533` | `overclaim_blocked`, CL-promotion boundary, model context |
| `rt_holographic_entropy_area_proxy.v1` | Holographic area/entropy proxy bookkeeping for `A_info`-style diagnostics. | Arbitrary spacetime geometry equivalence, stress-energy sourcing, or wormhole counts. | Ryu and Takayanagi, `https://arxiv.org/abs/hep-th/0603001` | `dual_model_support_strong`, `model_internal_er_epr_support`, CL-promotion boundary |
| `van_raamsdonk_entanglement_connectivity_context.v1` | Interpretive holographic context where entanglement changes can track connectedness changes. | Engineering control, metric equivalence, or standalone observational proof. | Van Raamsdonk, `https://arxiv.org/abs/1005.3035` | model-context and non-holographic-control boundaries |
| `gjw_double_trace_traversability_model.v1` | Specific two-boundary holographic traversability model with double-trace coupling. | Generic local traversable-wormhole mechanism, propulsion, causality violation, or engine claim. | Gao-Jafferis-Wall, `https://arxiv.org/abs/1608.05687` | correct-sign coupling gate, strong/model-internal support, CL-promotion boundary |
| `syk_processor_simulation_precedent.v1` | 2022 quantum-processor precedent for simulated traversable-wormhole-like dynamics in a sparsified SYK-like toy model. | Real-universe wormhole proof or gravitational phenomenon certification. | Jafferis et al., `https://www.nature.com/articles/s41586-022-05424-3` | strong/model-internal support only with guardrails |
| `small_commuting_model_critique_guardrail.v1` | Guardrail requiring thermalization, scrambling, noncommuting controls, and control-leakage checks. | Blanket validation or dismissal of all toy simulations. | 2025 Matters Arising `https://doi.org/10.1038/s41586-025-08939-7`; 2025 Reply `https://doi.org/10.1038/s41586-025-08995-z` | guardrail claim for support verdicts and control failure verdicts |
| `entropy_stretch_quantum_visibility_demotes_claims.v1` | QST diagnostic demotion: high entropy can mask quantum visibility through `lambda_S = exp(deltaS_eff)`. | Physical mutation of `hbar`, geometry promotion, or stress-energy evidence. | Zurek `https://arxiv.org/abs/quant-ph/0306072`; Schlosshauer `https://arxiv.org/abs/quant-ph/0312059` | entropy-visibility gate and demotion verdicts |
| `starsim_astrometry_structure_prior_only.v1` | StarSim/Gaia-like astrometry as ordinary astrophysical structure prior or null-model context. | Direct ER=EPR evidence, local wormhole map, Hubble-driven photon production, or propulsion. | StarSim `https://arxiv.org/abs/1511.06717`; Gaia astrometry/activity `https://arxiv.org/abs/1802.09943`; Gaia mission `https://arxiv.org/abs/1609.04153` | `proxy_only_structure_prior` and StarSim direct-evidence blocker |

## References

- Maldacena and Susskind, ER=EPR: `https://arxiv.org/abs/1306.0533`
- Ryu-Takayanagi holographic entropy: `https://arxiv.org/abs/hep-th/0603001`
- Van Raamsdonk entanglement/spacetime connectedness: `https://arxiv.org/abs/1005.3035`
- Gao-Jafferis-Wall double-trace traversability: `https://arxiv.org/abs/1608.05687`
- Jafferis et al. quantum processor simulation: `https://www.nature.com/articles/s41586-022-05424-3`
- 2025 Matters Arising critique: `https://doi.org/10.1038/s41586-025-08939-7`
- 2025 reply: `https://doi.org/10.1038/s41586-025-08995-z`
