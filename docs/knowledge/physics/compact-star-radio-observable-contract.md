# Compact-Star Radio Observable Contract

This document defines the compact-star observable lane as a shared-contract specialization rather than a new backbone. The lane tracks pulsar/compact-star observables and limit probes with explicit claim-tier and provenance guardrails.

## Contract Intent

- keep observables in measurement space (`pulse_profile`, `dynamic_spectrum`, `polarization_profile`, `timing_solution`, `limit_envelope`)
- keep closure assumptions explicit (`death_line_model_ref`, `pair_cascade_model_ref`, `vacuum_gap_model_ref`, `diffraction_screen_model_ref`, EOS refs)
- force hypothesis-grade semantics for unresolved matter/composition explanations

## Research Basis

- Long-period pulsar bridge behavior against classic death-line expectations: [arXiv:2503.07936](https://arxiv.org/abs/2503.07936)
- Zebra-band interpretation as magnetospheric diffraction/interference transfer physics: [PRL 133, 205201](https://link.aps.org/doi/10.1103/PhysRevLett.133.205201)
- Strangeon matter remains a proposed compact-star hypothesis class: [arXiv:1904.11153](https://arxiv.org/pdf/1904.11153)

## Claim Boundary

- `diagnostic` tier only for phase 1 compact-star lane semantics.
