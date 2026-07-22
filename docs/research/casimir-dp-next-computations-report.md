# Casimir-DP Gated Computations Stage-1 Report

**Campaign:** `casimir-dp-gated-computations-stage1-v1`  
**Generated:** 2026-07-21T15:16:59.882Z  
**Claim tier:** diagnostic  
**Promotion allowed:** false

## Lifshitz calculation

| Case | Pressure (Pa) | Pressure / ideal T=0 | Matsubara terms | Convergence | Geometry authority |
|---|---:|---:|---:|---|---|
| ideal-parallel-plate-validation-300K-100nm | -13.001258 | 1.000000 | 134 | pass | parallel_plate_exact_for_registered_material_model |
| gold-drude-sphere-plate-pfa-300K-100nm | -5.631390 | 0.433142 | 103 | pass | pfa_reference_only |

- Ideal validation gate: `pass`
- Measured material gate: `not_ready`
- Finite-geometry gate: `not_ready`
- Publication-grade gate: `not_ready`

## Switching and decoherence sidecars

- Switching evidence gate: `not_ready`
- Decoherence evidence gate: `not_ready`
- Total assumed decoherence rate: `2.150000 s^-1`
- Combined standard uncertainty: `0.477624 s^-1`
- Visibility over the acquisition window: `0.806541`

## Rigid-sphere DP convergence

| Requested grid | Used grid | Delta E (J) | Rate (s^-1) | Change from prior | Provenance |
|---:|---|---:|---:|---:|---|
| 12 | 12x12x12 | 2.6549e-41 | 2.5175e-7 | n/a | inferred |
| 14 | 14x14x14 | 1.7919e-41 | 1.6992e-7 | 0.481590 | inferred |
| 16 | 16x16x16 | 1.5267e-41 | 1.4477e-7 | 0.173728 | inferred |

- Numerical convergence gate: `pass`
- Branch provenance gate: `not_ready`
- Selected tau: `6.9074e+6 s`

## Statistical power and dynamics discrimination

- Rate-only shots per setting: `1.0774e+17`
- Total shots: `2.1548e+17`
- Rate-only accessibility: `not_ready`
- Dynamics signature: `blocked`
- Collapse-identifiability gate: `blocked`

## Manifold-response registration

Status: `blocked`. No manifold-response rate is computed.

- missing_renormalized_stress_tensor_prescription
- missing_stress_noise_kernel
- missing_causal_metric_response_kernel
- missing_metric_to_coherence_dynamics
- missing_consistency_and_recovery_proofs
- missing_frozen_parameter_manifest

## Campaign gates

- `equilibrium_lifshitz_validation`: `pass`
- `publication_grade_casimir_solver`: `not_ready`
- `measured_switching_sidecar`: `not_ready`
- `measured_decoherence_budget`: `not_ready`
- `realistic_dp_numerical_convergence`: `pass`
- `realistic_dp_branch_receipts`: `not_ready`
- `statistical_accessibility`: `not_ready`
- `collapse_identifiability`: `blocked`
- `manifold_response_dynamics`: `blocked`

## Claim boundaries

- The new Lifshitz solver is a reduced-order equilibrium planar implementation, not a publication-grade finite-geometry solver.
- The current switching and decoherence sidecars contain design assumptions rather than measured raw artifacts.
- The rigid-sphere DP campaign improves branch geometry but remains an inferred diagnostic model.
- Rate-only power cannot identify objective collapse.
- No tensor-to-metric-to-coherence response is registered or computed.
