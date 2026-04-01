# NHM2 Source-to-York Bridge Literature Memo

## Purpose

This memo is the concise literature-facing companion to:

- `docs/research/nhm2-source-to-york-bridge-deep-research-pass-2026-03-30.md`
- `docs/research/nhm2-york-time-morphology-literature-stress-test-2026-03-30.md`

Its role is to state, briefly and cleanly, what the literature does and does not support about the NHM2 source-to-York bridge.

## Bottom line

The literature most strongly supports the **diagnostic side** of the bridge:

- Alcubierre-like warp metrics produce a strong signed expansion/contraction pattern under Eulerian 3+1 diagnostics.
- Natario-like warp metrics can be constructed with zero or near-zero Eulerian expansion.
- In the chosen 3+1 lane, `theta = -trK` is a legitimate expansion diagnostic for the hypersurface-normal observer family.

The literature is materially weaker on the **mechanism side** of the bridge:

- high-frequency / short-wavelength averaging literature supports some kinds of effective stress-energy reasoning,
- but it does not directly prove that a strobed negative-energy tile lattice can be replaced by its cycle average in the NHM2 regime,
- and it does not directly give a validated mapping from sectorized duty patterns to a specific York lobe morphology.

So the present repo posture should remain:

> NHM2 is well supported as a diagnostic-local low-expansion York morphology result.
> NHM2 is not yet equally well supported as a mechanism-level proof that its specific strobing-and-homogenization control law causes that morphology.

## What the literature directly supports

1. **York / expansion diagnostic validity**
- The 3+1 literature directly supports using the trace of extrinsic curvature as an Eulerian expansion diagnostic under the declared foliation/observer contract.
- Alcubierre's original warp-drive paper explicitly computes expansion/contraction for Eulerian observers from the 3+1 fields.
- Natario's paper explicitly constructs warp spacetimes with zero Eulerian expansion.

2. **Morphology endpoints**
- Alcubierre is the natural signed-lobe endpoint.
- Natario is the natural low-/zero-expansion endpoint.
- That makes the repo's York family comparison defensible as a morphology classifier.

3. **Cautions on over-claiming**
- Expansion diagnostics are foliation- and observer-dependent.
- Warp-drive feasibility remains strongly constrained by negative-energy and quantum-inequality literature.
- A low-expansion York profile does not imply invariant identity or physical realizability.

## What the literature only indirectly supports

1. **Fast strobing to averaged source**
- Isaacson/Burnett/Green-Wald support the idea that fast structure can yield an effective averaged source in some regimes.
- But those frameworks are not a direct proof for engineered negative-energy strobing of matter sources.

2. **Averaged source to curvature response**
- The literature supports that nonlinear averaging is delicate and may generate correction terms.
- It does not support a generic rule that "solve Einstein with averaged source" is exact for NHM2-style negative-energy control.

3. **Source anisotropy to York morphology**
- General GR links stress-energy, congruence expansion, and curvature evolution.
- But the literature does not provide a general closed-form map from sector strobing and shell allocation to the specific York surface patterns used in the repo proof-pack.

## Current claim boundary implied by the literature

The literature supports this claim:

> Under the declared Eulerian 3+1 York diagnostic, NHM2 is much closer to the Natario low-expansion control than to the Alcubierre signed fore/aft control.

The literature does **not yet** fully support this stronger claim:

> NHM2's specific strobed Casimir support law has been demonstrated to produce that York morphology through a controlled averaging limit.

## What would strengthen the bridge

The literature pass points to four high-value next steps:

1. a multiple-scale derivation for the NHM2 strobe regime,
2. a time-dependent convergence test showing York morphology stabilizes as `TS_ratio -> infinity`,
3. a backreaction/correlation residual audit between averaged-source and solved-geometry paths,
4. a source-to-shift / source-to-`trK` diagnostic exposing why NHM2 lands on the Natario side.

## Source note

For detailed literature reasoning, objections, and theorem-by-theorem caveats, use the full pass:

- `docs/research/nhm2-source-to-york-bridge-deep-research-pass-2026-03-30.md`
