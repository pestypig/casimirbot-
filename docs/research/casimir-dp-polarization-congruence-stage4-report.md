# Casimir-DP Polarization and Congruence Stage-4 report

**Campaign:** `casimir-dp-polarization-congruence-stage4-v1`  
**Generated:** 2026-07-25T16:59:32.120Z  
**Evidence cutoff:** 2026-07-25  
**Claim ceiling:** `diagnostic`  
**Promotion allowed:** `false`

## Outcome

Stage 4 adds polarization-resolved macroscopic-QED and thermal-radiative/FDT
controls to the Stage-3 ordinary-physics null, then validates tensor,
dimensional, and semantic congruence before producing synthetic predictions.
The software prediction gate is
`pass`. Measured evidence
remains `not_ready`; collapse identification is
`blocked`; manifold dynamics are
`blocked`.

Stage 3 is hash-linked upstream evidence and is not recomputed, edited, promoted, or replaced by Stage 4.

## Immutable authorities

| Role | Path | Expected SHA-256 | Actual SHA-256 | Tracked expected | Tracked actual | Gate |
|---|---|---|---|---|---|---|
| stage4_authority_manifest | `configs/research/casimir-dp-stage4-authorities.v1.json` | `3f26ef115533ef78756fad70f3880f8ea1d1ace43cbc9a0e66d6d0b5e9c2918d` | `3f26ef115533ef78756fad70f3880f8ea1d1ace43cbc9a0e66d6d0b5e9c2918d` | false | false | pass |
| stage3_config | `configs/research/casimir-dp-evidence-map-stage3.v1.json` | `231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2` | `231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2` | false | false | pass |
| stage3_immutable_report_json | `artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-report.json` | `feb799bcf93f1497673d58eac1a98a773ac1e1b0767082104af7b7d6c8e3508b` | `feb799bcf93f1497673d58eac1a98a773ac1e1b0767082104af7b7d6c8e3508b` | false | false | pass |
| stage3_immutable_report_markdown | `artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-report.md` | `41aae6d542a19b6564f88ae7c8e7f2531abf90b08a7d02c11b043e5c691cc23a` | `41aae6d542a19b6564f88ae7c8e7f2531abf90b08a7d02c11b043e5c691cc23a` | false | false | pass |
| stage3_immutable_receipt | `artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-receipt.json` | `5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346` | `5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346` | false | false | pass |
| stage3_downstream_verification_receipt | `docs/research/casimir-dp-evidence-map-stage3-verification-receipt.json` | `2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082` | `2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082` | false | false | pass |

## Software source authorities

**Git HEAD:** `705759a201ee77313919de906c53dc8565de75bc`  
**Worktree state:** `dirty_uncommitted_source_hashes_authoritative`  
**Authority mode:** `content_hashes`

| Role | Path | Expected SHA-256 | Actual SHA-256 | Tracked expected | Tracked actual | Gate |
|---|---|---|---|---|---|---|
| polarization_qed_runtime | `shared/casimir-dp-polarization-qed-control.ts` | `f83659a3ad5854e5530c7ce46d339b85cddbaec82d0966e8e329f400c75b8641` | `f83659a3ad5854e5530c7ce46d339b85cddbaec82d0966e8e329f400c75b8641` | false | false | pass |
| thermal_radiative_runtime | `shared/casimir-dp-radiative-thermal-closure.ts` | `673a2e480cae16288ab13a19badde363231d75db2a2540d5bd28ac59eb6e7006` | `673a2e480cae16288ab13a19badde363231d75db2a2540d5bd28ac59eb6e7006` | false | false | pass |
| thermal_physics_constants | `shared/physics-const.ts` | `6c55518de3f27ce4d71f4ddb19ffd5c9b55bd3bbbc02cdc3c23e10247a7b7ce5` | `6c55518de3f27ce4d71f4ddb19ffd5c9b55bd3bbbc02cdc3c23e10247a7b7ce5` | true | true | pass |
| tensor_congruence_runtime | `shared/casimir-dp-tensor-dimensional-congruence.ts` | `015dc17487ac6f07dcc9260812d3ded0b94ed9d3b4a7b15d01d7d8a658a7b0a4` | `015dc17487ac6f07dcc9260812d3ded0b94ed9d3b4a7b15d01d7d8a658a7b0a4` | false | false | pass |
| stage4_orchestrator | `shared/casimir-dp-polarization-congruence-stage4.ts` | `d70192b175df5dc7efbab9b00d77a957060667bdf06ee8b5628dfe76f01be970` | `d70192b175df5dc7efbab9b00d77a957060667bdf06ee8b5628dfe76f01be970` | false | false | pass |
| stage4_contract | `shared/contracts/casimir-dp-polarization-congruence-stage4.v1.ts` | `0522eb940dd56df1e63c59978f939c7124ac16032fe3e670966fe0615867af3a` | `0522eb940dd56df1e63c59978f939c7124ac16032fe3e670966fe0615867af3a` | false | false | pass |
| stage4_runner | `scripts/research/run-casimir-dp-polarization-congruence-stage4.ts` | `1412eef8310a29149fbbaf89e38b3a9eba570e211060cda438be96d6d3e220ec` | `1412eef8310a29149fbbaf89e38b3a9eba570e211060cda438be96d6d3e220ec` | false | false | pass |

## Runtime fixtures

| Fixture | Path | SHA-256 | Gate |
|---|---|---|---|
| casimir-dp-stage4-polarization.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage4-polarization.synthetic.v1.json` | `f2568478cca512cc93f86f4905bc61a9c9c56e6473f0f73479206f82de6a2a60` | pass |
| casimir-dp-stage4-thermal.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage4-thermal.synthetic.v1.json` | `562552ca24e553b60f024e94153eb5cacd033b575c7f9303352c445ede224812` | pass |
| casimir-dp-stage4-congruence.synthetic.v1.json | `configs/research/fixtures/casimir-dp-stage4-congruence.synthetic.v1.json` | `160ab99dc055e1487c2598db827f432c293b725b4cc1c997c3858eb44e064de0` | pass |

Every fixture is synthetic. Hash closure validates replayability, not an
apparatus measurement.

## Stage-4 order of operations

| # | Stage | Gate |
|---:|---|---|
| 1 | `hash_link_immutable_stage3_authorities` | pass |
| 2 | `freeze_units_frequency_psd_frame_handedness_and_mirror_conventions` | pass |
| 3 | `freeze_polarization_states_randomization_blinding_and_calibration` | not_ready |
| 4 | `validate_jones_stokes_mueller_and_matched_control_sidecars` | diagnostic |
| 5 | `run_polarization_resolved_macroscopic_qed_control` | pass |
| 6 | `run_planck_fdt_and_stefan_boltzmann_thermal_closure` | pass |
| 7 | `run_tensor_dimensional_and_semantic_congruence` | pass |
| 8 | `freeze_helicity_mirror_material_temperature_and_companion_signatures` | pass |
| 9 | `version_expanded_null_unchanged_dp_and_registered_bridge_comparator` | pass |
| 10 | `run_blinded_synthetic_prediction_comparison` | diagnostic |
| 11 | `populate_stage4_outcome_falsifier_and_nonclaim_ledger` | diagnostic |
| 12 | `write_hash_backed_stage4_receipt_report_and_evidence_state` | pass |

## Expanded comparator

`M0_prime = M0_stage3 + M_polarization_resolved_qed + M_thermal_radiative_fdt`

| Model | Role | State | Maximum claim |
|---|---|---|---|
| `M0_prime_ordinary_physics` | expanded_ordinary_physics_null | `synthetic_prediction_available` | ordinary_physics_control_prediction |
| `M_dp_regularized_synthetic_v1` | unchanged_named_dp | `reused_without_mutation` | named_model_comparison_baseline |
| `M_bridge_tensor_noise_v1` | registered_bridge | `blocked_no_registered_numeric_kernel` | schema_congruence_only |

The named DP parameter manifest is
`4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6` and is
`reused_without_mutation`. A bridge is admitted to numeric
comparison: `false`.
Registry congruence is not empirical validation.

## Prediction signature matrix

| Axis | Expanded ordinary null | Unchanged named DP | Registered bridge |
|---|---|---|---|
| `helicity` | Material/scattering response may be helicity dependent only through calibrated reciprocal or nonreciprocal optical response. | No helicity dependence at fixed delta_rho and unchanged branch trajectories. | Only the sign and magnitude frozen by the registered numerical kernel. |
| `active_mirror` | Pseudoscalar optical terms transform with the frozen mirror convention; reciprocal scalar terms are mirror even. | Mirror invariant at fixed delta_rho. | Must predict a preregistered mirror parity and independent companion. |
| `material_and_distance` | Strong dependence through reflection matrices, Green tensors, geometry, loss, and temperature. | No boundary/material dependence at fixed delta_rho. | Must follow the frozen causal stress/noise transfer kernel. |
| `temperature` | Planck occupation, FDT noise, emissivity, detailed balance, heating, and recoil dependence. | No standard thermal boundary term in the unchanged manifest. | Only the preregistered thermal/noise scaling with no double counting. |
| `hold_time_and_echo` | Unitary phase and open-system filter-function response; conditionable terms may refocus. | Frozen master-equation coherence and companion signature. | Frozen kernel-specific line shape, echo behavior, and companion channel. |

## Selected synthetic predictions

- Polarization phase double contrast:
  `0.15098869 rad`
- Polarization coherence-rate double contrast:
  `0 s^-1`
- Planck-to-Stefan-Boltzmann relative error:
  `2.329782e-11`
- Net thermal transfer:
  `9.305269e-5 W`
- Frequency relation:
  `same_dimension_not_connected`

These values are prediction-fixture outputs. They are not measured collapse,
gravity, or manifold signals.

## Prediction playground

Edit a copy of any registered fixture and run the campaign with a copied config
whose fixture hash is updated:

- `polarization_qed`: `configs/research/fixtures/casimir-dp-stage4-polarization.synthetic.v1.json`
- `thermal_radiative`: `configs/research/fixtures/casimir-dp-stage4-thermal.synthetic.v1.json`
- `tensor_congruence`: `configs/research/fixtures/casimir-dp-stage4-congruence.synthetic.v1.json`

The invariant boundary is: Changing a synthetic fixture explores predictions only; it cannot satisfy measured evidence, collapse identification, manifold dynamics, or physical viability.

## Outcome-to-claim map

| Outcome id | What it establishes | What it disfavors | What it does not establish | Maximum claim |
|---|---|---|---|---|
| `integrity_or_convention_failure` | The affected Stage-4 prediction run is invalid. | No physical model. | A polarization anomaly, collapse, gravity, or manifold dynamics. | `invalid_or_exploratory` |
| `ordinary_polarization_qed_closure` | Compatibility with the polarization-resolved ordinary-QED control. | Only registered alternatives predicting a powered excess over that control. | That circular polarization modifies objective collapse or spacetime. | `polarization_resolved_qed_control` |
| `thermal_fdt_closure` | Compatibility with the registered thermal-radiative ordinary-physics lane. | Only powered models requiring an additional thermal-correlated residual. | A vacuum-collapse bridge or a gravitational interpretation of blackbody radiation. | `thermal_radiative_control` |
| `fixed_delta_rho_polarization_null` | An upper bound on preregistered polarization-dependent excess terms. | Only covered bridge kernels that predict a nonzero polarization signature. | That Penrose OR or Diósi-Penrose dynamics never occurs. | `bridge_parameter_region_exclusion` |
| `unexplained_helicity_residual` | A reproducible unexplained optical or boundary-correlated anomaly. | The closed ordinary-QED model in the powered region and unextended DP as its explanation. | Objective collapse, gravitational causation, quantum foam, or manifold dynamics. | `unexplained_anomaly` |
| `registered_bridge_joint_signature` | Replication-contingent support for that specific registered extension. | Registered alternatives that fail the same held-out joint signature. | A generic proof of quantum foam or manifold dynamics. | `specific_bridge_support` |
| `frequency_coincidence_only` | Only dimensional comparability. | Nothing. | A resonance, beat, energy transfer, collapse channel, or causal bridge. | `same_dimension_not_connected` |

Use `not_disfavored_within_powered_region`, not "confirmed."

## Final gates

- `software_and_synthetic_predictions`: `pass`
- `polarization_qed_synthetic_closure`: `pass`
- `thermal_radiative_synthetic_closure`: `pass`
- `synthetic_evidence_boundary`: `pass`
- `synthetic_blinding_contract`: `pass`
- `measured_evidence`: `not_ready`
- `ordinary_physics_closure`: `not_ready`
- `polarization_qed_measured_lane`: `not_ready`
- `thermal_measured_lane`: `not_ready`
- `tensor_dimensional_congruence`: `pass`
- `unchanged_named_dp`: `reused_without_mutation`
- `registered_bridge_numeric_comparison`: `blocked`
- `collapse_identification`: `blocked`
- `manifold_dynamics`: `blocked`
- `physical_viability`: `not_evaluated`
- `publication_claim`: `diagnostic_protocol_only`

## Claim boundaries

- The Stage-4 blinding lane reserves labels for synthetic contract tests only; no custodian receipt, mapping, measured comparison, or unblinding has been created or authorized.
- Two transverse photon polarization degrees of freedom are included through Jones/Stokes states and material scattering response; this does not add a gravitational degree of freedom.
- Circular polarization can expose ordinary reciprocal/nonreciprocal optical systematics. Standard unextended DP remains polarization-blind at fixed delta_rho.
- Planck-to-Stefan-Boltzmann recovery validates thermal-radiative normalization and mode accounting, not a collapse mechanism.
- Equal dimensions among omega_C, E_G/hbar, cavity modes, or modulation rates do not connect them without a sourced transfer kernel.
- A residual first establishes an anomaly after the expanded ordinary-physics null closes; it is not automatically collapse or manifold evidence.
- Synthetic predictions validate code paths and falsifier logic only.
