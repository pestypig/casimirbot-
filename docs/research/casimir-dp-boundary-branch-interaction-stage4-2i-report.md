# Casimir-DP Stage-4.2I boundary-branch interaction and wave-packet-custody report

**Run:** `casimir-dp-boundary-branch-interaction-stage4-2i-v1-20260805T160000000Z`  
**Evidence class:** `synthetic_interaction_diagnostic_and_wavepacket_contract_only`  
**Claim ceiling:** `boundary_branch_nonfactorization_diagnostic_only`  
**Campaign gate:** `pass`  
**Observable bridge edges added:** `0`

## Result at a glance

Stage 4.2I makes the boundary-superposition interaction explicit without changing the frozen Diósi law. It freezes a true identical-branch control and a separated-branch cell under reference and active boundary states, computes their normalized complex cross-ratio, subtracts the registered ordinary-physics interaction, and propagates the full observed/predicted complex covariance. The maintained fixture is synthetic and contains boundary-independent DP only, so its corrected interaction is null within numerical precision.

## Four-cell observable

The frozen order is `reference/control`, `reference/separated`, `active/control`, `active/separated`. With normalized complex coherence `Cbar_beta,q=C_beta,q(t)/C_beta,q(0)`,

```text
R_x = (Cbar_11 Cbar_00)/(Cbar_01 Cbar_10)
I_x = -ln|R_x|
Phi_x = arg(R_x)
R_x,corr = R_x,observed / R_x,H0
```

A nonzero corrected result is a boundary-branch nonfactorization diagnostic. Its first consequence is to challenge the ordinary-physics null or complete-joint-system equivalence; it is not a collapse or Casimir-to-collapse identification.

## Nominal synthetic boundary-independent DP recovery

- DP boundary-exponent difference: `0`; gate `pass`.
- Corrected log-visibility interaction: `1.1102230246251565e-16`.
- Corrected phase interaction: `-9.30252560099439e-19 rad`.
- Maximum absolute interaction z: `3.8511514561668573e-13`.
- Interaction resolved: `false`.
- Factorial/GLS special-case recovery: `pass`, absolute difference `3.469446951953614e-18`.

The raw linear complex contrast is retained as a coverage-safe diagnostic, but multiplicative main effects need not cancel from that additive contrast. The complex cross-ratio is the primary four-cell nonfactorization statistic.

## Wave-packet custody

- Structured packet gate: `pass`.
- Branch-control separation: `0 m`.
- Separated-branch distances: `1.6e-7, 1.6e-7 m`.
- Synthetic center-of-mass packet width: `1e-8 m`.
- Empirical wave-packet authority: `not_ready`.

The physical sphere radius, DP regularization length, and center-of-mass wave-packet width are separate model objects. A future measured packet must provide centers, covariance matrices, overlap, separation uncertainty, hold jitter, momentum difference, preparation fidelity, trajectory provenance, and tomography hashes in both boundary states.

## Adversarial recovery

- `injected_interaction_recovery`: `pass`; empirical authority `false`.
- `low_coherence_raw_complex_fallback`: `pass`; empirical authority `false`.
- `wavepacket_equivalence_failure`: `pass`; empirical authority `false`.
- `nonpositive_covariance_failure`: `pass`; empirical authority `false`.
- `boundary_dependent_dp_rejected`: `pass`; empirical authority `false`.

## Current scientific standing

- `software_contract`: `pass`.
- `synthetic_recovery`: `pass`.
- `branch_control_empirical_authority`: `not_ready`.
- `wavepacket_custody_empirical_authority`: `not_ready`.
- `ordinary_interaction_model_empirical_authority`: `not_ready`.
- `measured_interaction_contrast`: `not_ready`.
- `transfer_kernel`: `not_registered`.
- `measured_evidence`: `not_ready`.
- `collapse_identification`: `blocked`.
- `manifold_dynamics`: `blocked`.
- `physical_viability`: `not_evaluated`.

The software result does not supply a measured branch-control cell, measured wave-packet equivalence, measured ordinary interaction model, measured complex coherence, or a boundary-to-collapse transfer kernel. Standard boundary-independent DP cancels from this interaction statistic and remains a separate mass-separation-hold-time hypothesis.

