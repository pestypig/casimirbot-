# Shared Observable Contract (Stellar + Fusion)

## Purpose

This contract establishes a machine-independent observable surface for multiple physics lanes:

- shared slot grammar: `G_geometry`, `F_forcing`, `S_state`, `C_closure`, `O_observables`
- explicit axes and time semantics
- uncertainty and quality-mask metadata
- response-model and provenance bindings

The design goal is comparability in measurement space, not a single universal solver.

## Why This Contract Exists

Both lanes map hidden physical state into imperfect measurements:

- stellar/solar: atmosphere + closure assumptions -> synthetic spectra, line windows, and CLV observables
- fusion: plasma + geometry + synthetic diagnostics -> channel and profile observables

The shared contract keeps those outputs structurally comparable while allowing lane-specific closures.

## Research Basis (Claim Support)

1. IMAS Data Dictionary formalizes coordinates and time handling as first-class model semantics, which motivates explicit axis/time fields in shared observables.
Reference: [IMAS coordinates/time](https://imas-data-dictionary.readthedocs.io/en/latest/coordinates.html)

2. IMAS treats error bars as first-class metadata, which motivates uncertainty and quality fields in shared observables.
Reference: [IMAS error bars](https://imas-data-dictionary.readthedocs.io/en/latest/errorbars.html)

3. Fusion validation practice emphasizes comparison in diagnostic measurement space using synthetic diagnostics, not direct hidden-state equality.
Reference: [Terry et al., synthetic diagnostics and validation](https://fusion.gat.com/conferences/ttf/files/preview/Terry_TTFV%26V.pdf)

4. Integrated modeling workflows in fusion use machine-independent data structures with physics applications layered on top.
Reference: [EU-IM integrated modeling + IMAS](https://arxiv.org/abs/2305.09683)

5. Stellar spectroscopy workflows separate atmosphere/state, closure assumptions (opacities/populations), and observables, which maps cleanly to lane slots.
Reference: [Bergemann & Nordlander review](https://arxiv.org/abs/1403.3088)

6. Solar center-to-limb datasets provide explicit angular observables, motivating axis-rich and quality-aware observable contracts.
Reference: [Pietrow et al. CLV dataset](https://arxiv.org/abs/2212.03991)

## Claim Boundary

- `diagnostic` tier only.
- This contract does not certify a specific physical model.
- It standardizes observable semantics so model lanes can be compared and falsified with explicit uncertainty metadata.

## Implementation Notes

- shared contract: `shared/contracts/observable-contract.v1.ts`
- fusion specialization: `shared/contracts/fusion-observable-contract.v1.ts`
- stellar adapter: `sim_core/stellar_observable_contract.ts`
- solar flare specialization + guardrails: `shared/solar-flare-observable.ts`
- cross-scale solar lineage layer: `shared/solar-wave-lineage.ts`
- solar surface-event layer (sunquake-aware): `shared/solar-surface-event-contract.ts`
