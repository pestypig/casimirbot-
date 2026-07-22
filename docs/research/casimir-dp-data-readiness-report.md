# Casimir–DP data-readiness report

- Campaign: `casimir-dp-data-readiness-stage1-v1`
- Generated: `2026-07-21T15:36:17.849Z`
- Receipt SHA-256: `9e0f1e8aa01f8ff3e7faf0c070853e0cd4887a191115c51804fa5c71a7c2be5d`
- Claim tier: **diagnostic; promotion blocked**

## Result

The data path is runnable with hash-authenticated synthetic fixtures. The analytic Kramers–Kronig check is `pass` with maximum relative error `7.0692e-7`. This validates the numerical transform, not any material measurement.

Measured optical response: `not_ready`; authenticated measured switching/decoherence pair: `not_ready`; collapse identifiability: `blocked`; manifold dynamics: `blocked`.

## Source-data access ledger

| Dataset | Access status | Repository checksum | Admitted as this study's measurement |
|---|---|---|---|
| pedalino-na-cluster-2025 | open_machine_package | md5:7917961b27676f4e9df3af6d3b01c374 | no |
| tebbenjohanns-cryogenic-levitation-2021 | repository_landing_page | none registered | no |
| donadi-gran-sasso-dp-2021 | open_source_data | none registered | no |
| dejong-superconductor-force-2026 | supplement_only_raw_not_authenticated | none registered | no |
| klimchitskaya-lifshitz-review-2009 | theory_reference_no_dataset | none registered | no |

The source packages are external benchmarks or constraint records. None is relabelled as an apparatus-matched measurement for this study.

## Sidecar gates

Both synthetic fixtures pass artifact-integrity, calibration-reference, observable-identity, covariance-dimension, symmetry, and positive-semidefinite checks. Their `measured_evidence` gates remain `not_ready` by construction.

## Blinded secondary-observable preregistration

Primary: `coherence_decay_rate_s`. Secondary channels: `interferometric_phase_rad`, `coupled_heat_W`, `force_mismatch_N`, `switch_cross_correlation`. Negative controls: `matched_heating`, `detuned_boundary`, `identical_boundary`, `label_permutation`, `switch_disabled`.

Null: After conditioning on measured heating, force mismatch, vibration, electromagnetic pickup, gas, blackbody, readout, and drift covariates, the blinded boundary label has no residual effect on coherence decay or phase.

Alternative: The blinded boundary label leaves a repeatable coherence residual with a preregistered secondary-observable pattern that is not collinear with the measured environmental coupling vector.

| Power case | Paired windows | Multiplicity-adjusted alpha | Authority |
|---|---:|---:|---|
| small-switch-correlation-rho-0p10 | 1,422 | 0.0125 | diagnostic only |
| moderate-switch-correlation-rho-0p20 | 351 | 0.0125 | diagnostic only |

These correlation calculations size contamination/discriminator channels. They do not size or identify objective collapse.

## Required next inputs

- An apparatus-specific measured loss table epsilon''(omega), its calibration records, full covariance or a justified correlation model, and a SHA-256-authenticated raw artifact.
- Hash-authenticated switching and superposition-acquisition sidecars produced in the same blinded campaign, with synchronized clocks and calibration certificates.
- A source-backed DP or Penrose secondary-observable dynamics signature distinct from ordinary decoherence; no such signature is registered here.
- A registered tensor/noise-kernel/causal-response/coherence map before any manifold-response rate is computed.

## Claim boundary

No collapse rate, quantum-foam mechanism, negative-curvature response, or manifold manipulation is inferred from these readiness checks. Publication-grade and promotion gates remain closed.
