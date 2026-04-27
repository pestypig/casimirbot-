# Compact-Star Limit Observables (Phase 1)

## Scope

Phase 1 adds a compact-star/pulsar limit-observable extension on top of the existing shared observable contract. This patch is contract-first and diagnostic-only:

- no new solver
- no promotion to certified matter claims
- explicit limit probes, evidence refs, and provenance-carrying observables

## Why This Lane Exists

The compact-star lane is a boundary-stress lane for the shared architecture:

- micro side: pair cascades, vacuum-gap potential, EOS hypotheses
- macro side: pulse profiles, dynamic spectra, polarization, timing
- bridge: explicit hypothesis records with claim-tier and evidence constraints

## Slot Mapping

- `G_geometry`: compactness, polar-cap geometry, line of sight, magnetosphere geometry, surface topography
- `F_forcing`: gap electric field, particle injection, spin-down forcing, burst/glitch trigger
- `S_state`: period, period derivative, magnetic field proxy, plasma profile, matter hypothesis refs
- `C_closure`: death-line classifier, vacuum-gap closure, pair-cascade closure, diffraction transfer, mountain enhancement, EOS closure
- `O_observables`: pulse/dynamic/polarization/timing products plus limit-envelope diagnostics

## Guardrails

- `strangeon_star_candidate` stays below `certified` in phase 1.
- `pulsar_death_line` probes require `period_s` and `period_dot`, or an explicit substitute state reference.
- zebra-band features must be stored as `spectrogram` or `channel_series`.
- matter hypotheses must include supporting or contradicting observable refs.

## Research Anchors

- Long-period bridge case and death-line tension: [arXiv:2503.07936](https://arxiv.org/abs/2503.07936)
- Surface-mountain sparking hypothesis: [arXiv:2506.12305](https://arxiv.org/abs/2506.12305)
- Crab zebra bands as diffraction/interference transfer structure: [PRL 133, 205201](https://link.aps.org/doi/10.1103/PhysRevLett.133.205201)
- Strangeon matter as unresolved compact-star hypothesis space: [arXiv:1904.11153](https://arxiv.org/pdf/1904.11153)

## Claim Boundary

- Tier: `diagnostic`
- Interpretation posture: evidence-bounded hypothesis records
- This lane is designed to test representational integrity and falsifiability, not to settle EOS or emission-mechanism disputes.
