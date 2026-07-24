# Casimir-DP OR/phase Stage-2 report

**Campaign:** `casimir-dp-or-phase-stage2-v1`<br>
**Generated:** 2026-07-23T22:02:36.903Z<br>
**Claim tier:** `diagnostic`<br>
**Promotion allowed:** `false`

## Outcome

The operational QED phase/interference lane and the weak-field DP numerical-audit lane are runnable. Measured phase/coherence evidence remains `not_ready`; collapse identification is `blocked`; manifold dynamics are `blocked`. No manifold-response rate is computed.

## Penrose notation crosswalk

- Penrose 1996: `E_Delta`
- Penrose 2014: `E_G`
- Repository: `Delta_E_G_repo(ell)` / field `deltaE_J`
- Proposal particle mass: `3.88772e-18 kg`
- Compton frequency: `5.27328e+32 Hz`
- DP characteristic frequency: `1.21449e-6 Hz`
- Crosswalk: `conceptual_weak_field_correspondence_not_numerical_identity_across_conventions`
- Compton/cavity bridge: `blocked`

## DP algebra, branch, and invariance audit

- Pairwise energy: `8.04731e-40 J`
- Potential-form energy: `8.04731e-40 J`
- Potential equivalence relative error: `6.08151e-16`
- Potential equivalence gate: `pass`
- Component-identity relative error: `1.74316e-12`
- Component-identity gate: `pass`
- Mass-conservation gate: `pass`
- Branch-symmetry gate: `pass`
- Boundary-containment gate: `pass`
- Stage-1/proposal input compatibility: `not_ready`
- Stage-1 authority transfer: `not_ready`
- Upstream Stage-1 spatial convergence: `not_ready`
- Branch provenance: `not_ready`
- Proposal-branch provenance: `not_ready`
- Proposal-specific experimental bounds: `not_ready`
- Fixed-branch boundary null: `pass`
- Fixed-branch boundary-rate difference: `0 s^-1`
- Generic signed-stress adapter bridge: `not_admitted`

### Cross-campaign input identity

| Field | Stage-1 value | Proposal value | Exact match |
|---|---:|---:|---|
| mass_kg | 1.00000e-18 | 3.88772e-18 | false |
| radius_m | 5.00000e-8 | 7.50000e-8 | false |
| branch_separation_m | 2.00000e-8 | 2.00000e-8 | true |
| ell_m | 2.00000e-9 | 2.00000e-9 | true |

Stage-1 convergence, provenance, and bounds are contextual only because the frozen mass/radius input differs from the proposal sphere.

### Proposal-specific resolution sweep

| Grid dimension | Min voxel (m) | Delta E (J) | Rate (s^-1) | Change from prior | Max mass error |
|---:|---:|---:|---:|---:|---:|
| 12 | 2.66667e-8 | 1.93741e-39 | 1.83715e-5 | n/a | 0.03016082 |
| 14 | 2.28571e-8 | 1.16367e-39 | 1.10345e-5 | 0.66491388 | 0.02715744 |
| 16 | 2.00000e-8 | 8.04731e-40 | 7.63088e-6 | 0.44603667 | 0.03217286 |

- Sampling gate: `pass`
- Convergence gate: `not_ready`
- Relative tolerance: `0.10000000`

### Branch-perturbation sensitivity

| Separation offset (m) | Separation (m) | Min voxel (m) | Sampled mass A (kg) | Sampled mass B (kg) | Delta E (J) | Rate (s^-1) | Relative rate change |
|---:|---:|---:|---:|---:|---:|---:|---:|
| -1.00000e-9 | 1.90000e-8 | 2.00000e-8 | 4.01280e-18 | 4.01280e-18 | 8.04731e-40 | 7.63088e-6 | 0 |
| 0 | 2.00000e-8 | 2.00000e-8 | 4.01280e-18 | 4.01280e-18 | 8.04731e-40 | 7.63088e-6 | 0 |
| 1.00000e-9 | 2.10000e-8 | 2.00000e-8 | 4.01280e-18 | 4.01280e-18 | 8.04731e-40 | 7.63088e-6 | 0 |

- Frozen-grid identity gate: `pass`
- Sampled-mass stability gate: `pass`
- Spatial-resolution gate: `not_ready`
- Physical-sensitivity gate: `not_ready`
- Interpretation: No physical separation derivative is admitted: the frozen-grid perturbation remains below spatial resolution or fails sampled-mass stability.

## Ordinary phase, visibility, and interference

- Boundary phase contrast: `0 rad`
- Visibility at the registered observation time: `0.80654144`
- Maximum differential-force noise: `5.27286e-27 N`
- Measured evidence gate: `not_ready`
- Uncertainty model: `not_registered`

| Analysis phase (rad) | P(+) | P(-) |
|---:|---:|---:|
| 0 | 0.90327072 | 0.09672928 |
| 1.57079633 | 0.50000000 | 0.50000000 |
| 3.14159265 | 0.09672928 | 0.90327072 |
| 4.71238898 | 0.50000000 | 0.50000000 |

The boundary has a controlled state, not a phase with which the particle becomes "in phase." These ports measure the material-branch action phase and visibility.

## Ambient-gravity phase control

- Fully vertical phase: `7.23052e+8 rad`
- Maximum boundary-correlated vertical projection: `2.76605e-18 m`
- Maximum small-angle tilt: `1.38303e-10 rad`
- Measured control gate: `not_ready`

This is an ordinary unitary gravitational phase control, not an OR rate.

## Three-lane plausibility ledger

No numerical plausibility score is produced.

| Lane | Theory authority | Computability | Evidence gate | Permitted claim |
|---|---|---|---|---|
| qed_open_system_baseline | established_reference | computable | not_ready | Ordinary boundary-conditioned phase and coherence diagnostic with measured status stated. |
| or_dp_branch_instability | sourced_conjecture | diagnostic_only | not_ready | Penrose-motivated, regularized weak-field branch-instability diagnostic. |
| boundary_conditioned_spacetime_bridge | unregistered | blocked | blocked | A preregistered extension question with explicit missing dynamics. |

## Bridge gate

Status: `blocked`

- missing: `model_id`
- missing: `source_ref`
- missing: `renormalized_stress_tensor_prescription`
- missing: `stress_noise_kernel_prescription`
- missing: `causal_metric_response_kernel`
- missing: `gauge_and_coordinate_contract`
- missing: `metric_to_coherence_dynamics`
- missing: `consistency_or_complete_positivity_proof`
- missing: `standard_qed_and_dp_recovery_limit`
- missing: `frozen_parameter_manifest`

Required preregistered falsifiers:

- matched-heating control removes the apparent boundary residual
- sham switching or label permutation reproduces the apparent residual
- registered gap, material, or branch-separation scaling fails on held-out data
- ordinary QED, electrostatic, mechanical, thermal, readout, or gravity phase closes the residual
- the secondary phase and correlation signature follows the calibrated switching transfer model

## Final gates

- `software_and_algebraic_diagnostics`: `pass`
- `stage1_spatial_convergence`: `not_ready`
- `stage2_proposal_spatial_convergence`: `not_ready`
- `stage2_proposal_branch_provenance`: `not_ready`
- `stage2_proposal_experimental_bounds`: `not_ready`
- `perturbation_sensitivity`: `not_ready`
- `measured_qed_phase_and_coherence`: `not_ready`
- `ordinary_decoherence_closure`: `not_ready`
- `collapse_identification`: `blocked`
- `manifold_dynamics`: `blocked`
- `publication_claim`: `diagnostic_protocol_only`

## Claim boundaries

- Penrose OR supplies conceptual motivation and an order-of-magnitude timescale conjecture; it does not supply the Casimir boundary coupling.
- The repository Delta E_G is a grid- and Plummer-regularized weak-field diagnostic, not a covariant superposition of geometries.
- Ambient gravity and QED boundary forces produce ordinary unitary phase controls, not an OR collapse rate.
- Positive and negative regions of Delta rho are signed branch differences, not negative mass or Casimir vacuum energy.
- The generic signed stress-to-DP adapter is not admitted as a Casimir-to-OR bridge because it omits the required tensor dynamics and observable transfer.
- Constructive or destructive interference diagnoses phase and visibility; it does not by itself diagnose objective collapse.
- Gravitational-wave observations establish classical metric dynamics, not quantum geometry superposition or OR.
- This experiment has no biological Orch OR observable and cannot validate Orch OR, microtubules, or consciousness claims.
