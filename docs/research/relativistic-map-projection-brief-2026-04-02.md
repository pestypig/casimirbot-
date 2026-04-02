# Relativistic Map Projection Brief

- date: 2026-04-02
- status: diagnostic
- owner: codex

## Scope

This patch adds two relativistic map projections to the TREE+DAG and Helix route surfaces:

- an instantaneous comoving ship-view map
- a Sun-centered accessibility map

## Boundary

These are projection products, not warp-field products.

- The instantaneous ship-view map is a `ship_comoving` projection under a declared control law.
- The Sun-centered accessibility map is `outer_reference_only`.
- Neither projection is a Lane A proof surface.
- Neither projection implies ADM equivalence, metric equivalence, or bubble-geometry identity.

## Control Model In This Patch

The implemented control model is flat special relativity with a declared constant proper-acceleration flip-burn profile.

- Radius remapping uses onboard proper time under that control law.
- Instantaneous ship-view remapping contracts only the component parallel to motion.

## Deferred Work

A true warp-derived accessibility map remains deferred.

That future branch must be computed from an actual warp worldline contract, not from the flat-SR proxy. Until then, any route-time warp map must fail closed as unavailable.
