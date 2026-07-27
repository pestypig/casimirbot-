# Casimir-DP Stage-3 evidence-map report

**Campaign:** `casimir-dp-evidence-map-stage3-v1`  
**Generated:** 2026-07-25T13:45:44.019Z  
**Evidence cutoff:** 2026-07-25  
**Claim ceiling:** `diagnostic`  
**Promotion allowed:** `false`

## Outcome

The six Stage-3 scientific runtimes and fail-closed orchestrator are runnable
against hash-registered synthetic fixtures. This validates software recovery,
ordering, provenance checks, and maximum-claim logic only. Measured evidence
remains `not_ready`; collapse identification is
`blocked`; manifold dynamics are
`blocked`.

The ordinary-physics baseline is the additive composite
`M0_ordinary_physics` with components
`M_qed_phase`, `M_technical_dephasing`, `M_qed_environmental_decoherence`, `M_ordinary_gravity`.
Penrose OR remains a lifetime envelope unless a generative dynamics is
registered. A bridge is admitted only when the manifold-kernel registry passes
before signatures and held-out comparison are frozen.

## Immutable authorities

| Role | Path | Expected SHA-256 | Actual SHA-256 | Gate |
|---|---|---|---|---|
| stage3_authority_manifest | `configs/research/casimir-dp-stage3-authorities.v1.json` | `6f5a0a903a161bf98cd82e69b48a03288a7a436f737c07b83366efba1dbbcf13` | `6f5a0a903a161bf98cd82e69b48a03288a7a436f737c07b83366efba1dbbcf13` | pass |
| stage2_config | `configs/research/casimir-dp-or-phase-stage2.v1.json` | `b517e8fbf002303258a5269e7f37c6b16d4bc3c45c609072bdb2a9e5184e596d` | `b517e8fbf002303258a5269e7f37c6b16d4bc3c45c609072bdb2a9e5184e596d` | pass |
| stage2_maintained_report | `docs/research/casimir-dp-or-phase-stage2-report.md` | `179e2e1674ca611e6977259c7b154b6e0d8450ef6d969c1ca3b4482e19cc2746` | `179e2e1674ca611e6977259c7b154b6e0d8450ef6d969c1ca3b4482e19cc2746` | pass |
| stage2_immutable_report | `artifacts/research/casimir-dp-or-phase-stage2/casimir-dp-or-phase-stage2-v1-20260723T220236Z/or-phase-stage2-report.json` | `6e1772306598ca37f3407f170d28c5252955747b82ef0610b71ff4c0f9ee7c0c` | `6e1772306598ca37f3407f170d28c5252955747b82ef0610b71ff4c0f9ee7c0c` | pass |
| stage2_immutable_receipt | `artifacts/research/casimir-dp-or-phase-stage2/casimir-dp-or-phase-stage2-v1-20260723T220236Z/or-phase-stage2-receipt.json` | `64f0e1c95307829540d3c01ad7cb7e10b15d510cb31cf8e73f88a8990d2c25ab` | `64f0e1c95307829540d3c01ad7cb7e10b15d510cb31cf8e73f88a8990d2c25ab` | pass |
| experiment_proposal_prefreeze_baseline | `docs/research/casimir-dp-experiment-proposal.md` | `712f0b58b7e2862e1ce2c103c0cbc45d8a9a2a4fee6889e179c5e4d22c63083b` | `e03f1e0fee8deab0f550ae47766eb741d2e081a78d61d536421be4ad65d0b351` | not_ready |
| proposal_closure_config | `configs/research/casimir-dp-proposal-closure.v1.json` | `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | pass |
| proposal_closure_report | `docs/research/casimir-dp-proposal-closure-report.md` | `5385a47b09877dbecd0fca2f508b1533b3a1a0aacd366d3231d361c746c159b1` | `5385a47b09877dbecd0fca2f508b1533b3a1a0aacd366d3231d361c746c159b1` | pass |
| data_readiness_config | `configs/research/casimir-dp-data-readiness.v1.json` | `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | pass |
| data_readiness_report | `docs/research/casimir-dp-data-readiness-report.md` | `3939b2b773c5227046c964325abd54ca21bb164b0f0cf0c6aca84dfbc0235b90` | `3939b2b773c5227046c964325abd54ca21bb164b0f0cf0c6aca84dfbc0235b90` | pass |

## Runtime fixtures

| Fixture | Path | SHA-256 | Gate |
|---|---|---|---|
| casimir-dp-stage3-complex-coherence.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage3-complex-coherence.synthetic.v1.json` | `6ca955e993f94be6d4ddda409d3ff523e68ffee1b01558a0ae3ab4b601b114fa` | pass |
| casimir-dp-stage3-qed-green-noise.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage3-qed-green-noise.synthetic.v1.json` | `49bb2d48b8281ca94dbefc20e336cfb0c3a5835f1a230a7effadc8020c981371` | pass |
| casimir-dp-stage3-dp-companion.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage3-dp-companion.synthetic.v1.json` | `14b32063294220471b65fba5312577cf5da077fe24b4633b41be590a0be72ceb` | pass |
| casimir-dp-stage3-gravity-upper-bound.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage3-gravity-upper-bound.synthetic.v1.json` | `90ee6a91cc5f1924c341ca5120babb1609a94d22189d074b777c16e2ce026bdd` | pass |
| casimir-dp-stage3-model-comparison.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage3-model-comparison.synthetic.v1.json` | `f7243d6b71a61dfc2940b5949229e464b7e18e2e7af4a3e0a78891e3286294ff` | pass |
| casimir-dp-stage3-manifold-registry.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage3-manifold-registry.synthetic.v1.json` | `6211ef6f27fc72f8a2d377ca007a5504540cba2dc1e8d4eb8953e12cbf954f2c` | pass |

Every fixture in this maintained run is synthetic. A passing fixture hash does
not satisfy a measured-data requirement.

## Revised Stage-3 run order

| # | Stage | Gate |
|---:|---|---|
| 1 | `freeze_sources_conventions_models_and_upstream_hashes` | pass |
| 2 | `validate_blind_provenance_randomization_and_control_coverage` | not_ready |
| 3 | `estimate_complex_coherence` | diagnostic |
| 4 | `evaluate_phase_conditioning_path_swap_and_echo` | not_ready |
| 5 | `evaluate_decay_shape_and_time_grid_identifiability` | diagnostic |
| 6 | `validate_material_green_noise_and_technical_sidecars` | not_ready |
| 7 | `predict_qed_phase_noise_heating_and_decoherence` | diagnostic |
| 8 | `validate_named_or_dp_models_and_parameter_manifest` | diagnostic |
| 9 | `predict_dp_coherence_and_applicable_companions` | diagnostic |
| 10 | `validate_complete_apparatus_energy_and_stress_ledger` | diagnostic |
| 11 | `compute_mass_weight_weak_field_and_ordinary_gravity_phase_bounds` | diagnostic |
| 12 | `preflight_manifold_kernel_registry` | diagnostic |
| 13 | `freeze_signatures_likelihoods_priors_criteria_and_falsifiers` | pass |
| 14 | `run_blinded_held_out_joint_model_comparison` | diagnostic |
| 15 | `populate_outcome_to_claim_ledger` | pass |
| 16 | `write_hash_backed_receipt_report_and_evidence_state` | pass |

Registry preflight occurs before model freeze and comparison. A bridge schema is
registered: `true`. A frozen
bridge predictor is included in this comparison:
`false`. Registry status:
`registered`. Registration is empirical validation:
`false`.

## Runtime summary

- Complex coherence evidence class:
  `synthetic_fixture`
- QED Green/noise claim:
  `synthetic_pipeline_validation`
- Named-DP status:
  `diagnostic`
- Complete-apparatus gravity claim:
  `scalar_upper_bound`
- Model comparison status:
  `disfavored`
- Manifold-kernel registry:
  `registered`

| Model | State | Maximum claim |
|---|---|---|
| `M0_ordinary_physics` | `disfavored` | ordinary_physics_closure_or_residual_only |
| `M_dp_regularized_synthetic_v1` | `not_disfavored_within_powered_region` | named_dp_implementation_compatibility_or_exclusion |

## Outcome-to-claim map

| Outcome id | What it establishes | What it disfavors | What it does not establish | Maximum claim |
|---|---|---|---|---|
| `integrity_failure` | The campaign cannot support confirmatory inference. | No physics model; the run is invalid or exploratory. | Any physical null or anomaly. | `invalid_or_exploratory` |
| `reversible_boundary_phase` | A controlled boundary-dependent Hamiltonian/QED phase when the material and Green model closes. | Models predicting a larger irreducible loss in the powered region. | Objective collapse, manifold dynamics, or negative gravitational mass. | `controlled_qed_phase` |
| `conditioned_visibility_recovery` | Conditionable phase noise or dephasing. | A model assigning the removed component to irreducible collapse. | Absence of all environmental decoherence. | `conditionable_dephasing` |
| `ordinary_channel_closure` | Ordinary open-system decoherence within uncertainty. | Intrinsic models predicting a powered minimum excess beyond the closed budget. | A universal exclusion of OR or DP. | `ordinary_decoherence` |
| `powered_null_residual` | An upper bound on preregistered excess terms. | Only the covered DP or bridge parameter region. | That objective collapse never occurs. | `parameter_region_exclusion` |
| `eg_scaling_without_companion` | Compatibility with the tested Penrose lifetime envelope. | A named dynamical-DP parameter set when its companion channel was applicable and powered. | Penrose OR, a unique dynamics, or a spacetime ontology. | `heuristic_compatibility` |
| `named_dp_joint_signature` | Substantive, replication-contingent support for that named dynamical-DP implementation. | Registered alternatives that fail the held-out joint prediction. | Every DP variant, Penrose's broader interpretation, or manifold dynamics. | `named_model_support` |
| `unregistered_boundary_anomaly` | A reproducible unexplained boundary-correlated anomaly after replication. | Unextended OR/DP as the explanation if ordinary channels and branch matching close. | Collapse, a gravitational mechanism, quantum foam, or manifold dynamics. | `unexplained_anomaly` |
| `registered_bridge_joint_signature` | Evidence for that specific registered extension after independent replication. | Registered alternatives that fail the joint held-out prediction. | A generic proof of manifold dynamics. | `specific_bridge_support` |
| `independent_gravity_response` | Ordinary or model-specific gravitational coupling, depending on the registered prediction. | Models predicting no such response in the powered region. | Objective collapse without a separately discriminating coherence channel. | `gravitational_response` |
| `frequency_coincidence` | No physical correspondence by itself. | Nothing. | Resonance, transfer, collapse, or a causal bridge. | `none` |
| `decay_shape_only` | A decay-shape observation requiring model comparison. | Only preregistered line shapes rejected with adequate power. | Objective collapse. | `decay_shape_diagnostic` |

The compatibility state is written
`not_disfavored_within_powered_region`, not "confirmed."

## Final gates

- `software_and_synthetic_diagnostics`: `pass`
- `measured_evidence`: `not_ready`
- `ordinary_decoherence_closure`: `not_ready`
- `collapse_identification`: `blocked`
- `manifold_dynamics`: `blocked`
- `bridge_registration`: `registered_not_validated`
- `model_comparison`: `disfavored`
- `publication_claim`: `diagnostic_protocol_only`

## Claim boundaries

- Synthetic fixtures validate software recovery and fail-closed logic only.
- A residual is an anomaly until ordinary channels, provenance, power, and a registered model jointly close.
- Penrose's lifetime heuristic is not a generative stochastic dynamics.
- A named DP result applies only to its frozen implementation and parameter manifest.
- A scalar Casimir energy or pressure is not a tensor-to-coherence bridge.
- Registry completeness is not empirical validation.
- No Stage-3 output proves objective collapse, quantum foam, or manifold dynamics.
- A null excludes only the preregistered region with demonstrated sensitivity.

## Selected synthetic diagnostics

- QED Ramsey coherence exponent:
  `0.05724371`
- DP parameter manifest:
  `4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6`
- Complete-apparatus ledger:
  `c7ad454e32c437d733f38e9b418afd7dc6511c2353c033a0fb9413a8e3756ec7`

These values are fixture results, not apparatus measurements.
