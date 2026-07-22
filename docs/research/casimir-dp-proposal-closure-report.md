# Casimir-DP proposal-closure report

- Proposal: `casimir-dp-transverse-branch-pilot-v1`
- Generated: `2026-07-21T16:53:12.590Z`
- Config SHA-256: `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba`
- Receipt SHA-256: `aae5cf37e01df022509bc9f997287719eafd5670c6156fdd626d24ce94dbb4c0`
- Proposal package: `pass`
- Commissioning entry: `conditional_pass`

## Frozen architecture

The proposal uses a silica nanoparticle of nominal mass `3.8877e-18 kg` at `5.00e-6 m` from one electrically tunable 2D boundary. The `2.00e-8 m` superposition is transverse to the surface normal. Boundary states are randomized and held static during each coherent evolution, with at least `10 s` settling between state changes and acquisition.

This corrects the earlier symmetric-normal-force concept: the normal Casimir-Polder force is monitored as a common-mode nuisance, while lateral inhomogeneity and phase are measured explicitly. A cofabricated reference resonator must establish the gate-state force contrast before a coherence campaign starts.

## Reference scale and feasibility warning

The literature-anchored retarded silica/silicon reference gives $C_4=3.2062e-49\,\mathrm{J\,m^4}$, $U_{CP}=-5.1300e-28\,\mathrm{J}$, and normal force $F_{CP}=-4.1040e-22\,\mathrm{N}$ at the nominal distance. These are reference values, not the tunable 2D boundary contrast.

Holding shot-to-shot phase noise below `0.1 rad` corresponds to differential-force noise below `5.2729e-27 N` over the frozen branch separation and observation time. For one elementary charge this is equivalent to only `3.2911e-8 V/m`; charge neutrality, shielding, field reversal, and direct phase-nuisance measurement are therefore hard commissioning requirements.

## Gate ledger

| Gate | Status |
|---|---|
| proposal_package | pass |
| commissioning_entry | conditional_pass |
| measured_optical_and_surface_response | not_ready |
| measured_switching_and_decoherence_evidence | not_ready |
| finite_geometry_boundary_contrast | not_ready |
| collapse_identification | blocked |
| manifold_dynamics | blocked |
| publication_claim | diagnostic_protocol_only |

The package can enter commissioning, but it is not a validated experiment or a physical-mechanism result.

## Machine-validated preregistration contracts

| Contract | Status |
|---|---|
| signal | pass |
| finite_geometry_and_material | pass |
| calibration | pass |
| synchronization | pass |
| blinding | pass |
| covariance | pass |
| statistical_decision | pass |
| systematics_transfer | pass |
| commissioning | pass |

The signal definition, finite-geometry/material receipt set, calibration chain, synchronized acquisition, blinding custody, covariance estimator, and statistical decision rules are first-class configuration objects. Their cross-field invariants must pass before `proposal_package` can pass.

## Systematics transfer matrix

| Family | Sensor/channel | Negative control | Threshold | Current evidence |
|---|---|---|---:|---|
| particle_charge_and_stray_electric_field | charge-step monitor and three-axis compensation electrodes | electric-field reversal with boundary state held fixed | 0 e | design_target |
| surface_patch_potential | Kelvin-probe surface map and particle force-gradient channel | translated particle trajectory over a reference surface sector | 0.05 1 | design_target |
| gate_leakage_and_electromagnetic_pickup | gate current, local electric-field pickup, and RF spectrum channels | identical electrical pulse with no boundary-state transition | 0.05 1 | design_target |
| boundary_switching_heat | cofabricated thermometer and particle effective-temperature estimator | matched-heating pulse without boundary transition | 0.001 K | design_target |
| mechanical_vibration_and_acoustic_coupling | three-axis seismometer and chip interferometric displacement | mechanical injection with boundary state fixed | 1e-10 m | design_target |
| optical_recoil_and_readout_backaction | laser power, photon-count, and out-of-loop motion channels | matched optical exposure with static boundary label | 0.01 s^-1 | literature_model |
| trap_alignment_and_state_expansion_noise | potential-center estimator and shot-to-shot displacement record | state-expansion sequence with boundary held fixed | 1e-9 m | design_target |
| gas_collisions | calibrated ion gauge and fitted gas-damping channel | pressure-elevated coherence sequence | 1e-9 mbar | design_target |
| blackbody_exchange | shield and particle thermometry with spectral-emissivity model | matched radiative heating at fixed boundary state | 0.01 K | literature_model |
| casimir_polder_force_and_surface_gradient | cofabricated nanomechanical force calibrator and particle trap-frequency shift | non-tunable reference surface and far-distance baseline | 0.05 1 | literature_model |
| lateral_surface_inhomogeneity | lateral phase map across the full superposition footprint | orthogonal branch orientation and translated surface sector | 0.1 rad | design_target |
| analysis_drift_and_label_leakage | blind-state classifier audit and time-indexed nuisance matrix | random label permutation preserving block structure | 0.55 1 | design_target |

Coverage: `pass`; measured transfer functions: `not_ready`.

## Commissioning dependency ladder

| Stage | Objective | Depends on | Claim ceiling |
|---|---|---|---|
| C0-material-and-surface-receipts | Measure both boundary states, surface topography, patches, loss response, temperature dependence, and device geometry before force or coherence inference. | none | instrument_only |
| C1-force-calibrator | Establish a repeatable gate-dependent boundary-force contrast independently of the superposition sensor. | C0-material-and-surface-receipts | instrument_only |
| C2-classical-particle-transfer-functions | Commission stable particle operation from 10 to 4 micrometres and measure every switching-to-sensor transfer function. | C1-force-calibrator | systematics_only |
| C3-coherence-pilot | Demonstrate transverse state preparation and quantify phase/decoherence repeatability before using boundary labels. | C2-classical-particle-transfer-functions | systematics_only |
| C4-blinded-boundary-pilot | Run 400 paired windows to validate the blinded acquisition, covariance, exclusion, and nuisance-reentry pipeline. | C3-coherence-pilot | coherence_residual |
| C5-main-registered-run | Acquire at least 1600 paired windows under the frozen protocol and classify the result using the registered decision table. | C4-blinded-boundary-pilot | model_comparison |

Dependency order: `pass`; hardware completion: `not_ready`.

## Model separation

| Role | Model | Status | Predicted observables | Claim ceiling |
|---|---|---|---|---|
| ordinary_decoherence | ordinary-open-system-budget-v1 | registered | coherence_decay_rate_s^-1, phase_rad, coupled_heat_W, switch_cross_correlation | Environmental explanation or upper bound. |
| casimir_open_system | measured-casimir-polder-open-system-v1 | diagnostic_only | normal_force_N, trap_frequency_shift_Hz, phase_rad | Standard electromagnetic boundary response after measured material and geometry receipts. |
| dp_rate_only | rigid-sphere-dp-rate-v1 | diagnostic_only | coherence_decay_rate_s^-1 | Rate comparison only; not collapse identification. |
| collapse_dynamics | dp-penrose-secondary-dynamics-unregistered | blocked | none | No collapse identification until a source-backed non-collinear secondary signature is registered. |
| manifold_response | boundary-conditioned-manifold-response-unregistered | blocked | none | No manifold claim until stress/noise, causal metric response, gauge, and coherence dynamics are registered. |

## Registered outcome language

| Outcome | Permitted statement | Forbidden statement |
|---|---|---|
| integrity_failure | The campaign is invalid or incomplete and must be repeated after correction. | Any physical null, residual, collapse, or manifold conclusion. |
| null_consistent | Upper bounds on boundary-conditioned coherence and phase residuals under the registered apparatus conditions. | Objective collapse or manifold response is disproved universally. |
| environment_explained_residual | A quantified ordinary coupling explains the observed boundary correlation. | Evidence for objective collapse, quantum foam, or gravitational manifolds. |
| unexplained_residual | An unexplained boundary-conditioned residual requiring independent replication and expanded systematics. | Detection of DP collapse, Penrose reduction, quantum foam, or manifold manipulation. |
| model_discriminating_residual | Evidence favoring the named registered model within its tested parameter domain. | Universal proof of objective collapse or controllable spacetime manipulation. |

## Remaining blockers

- `integrated_cryogenic_near_surface_quantum_superposition_not_demonstrated`
- `apparatus_specific_gate_state_optical_response_not_measured`
- `finite_geometry_gate_dependent_casimir_polder_contrast_not_validated`
- `measured_systematics_transfer_functions_not_acquired`
- `source_backed_collapse_secondary_signature_missing`
- `tensor_noise_metric_coherence_manifold_dynamics_missing`

## Non-claims

- The proposal does not assume that Casimir force equals DP gravitational self-energy.
- The proposal does not treat negative renormalized energy density as scalar negative curvature.
- A software certificate does not validate an experimental mechanism.
- A boundary-correlated coherence residual is not automatically objective collapse.
- A null result constrains only the registered apparatus and parameter domain.
- No manifold-response rate is computed without a registered causal dynamics model.
