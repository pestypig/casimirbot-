# NHM2 Source-Closure Claim Safety

NHM2 source closure is not a prose claim. It is a tensor comparison artifact:

```text
Delta T_ab(region) = T_ab_metric_required(region) - T_ab_tile_effective_counterpart(region)
```

The comparison must be emitted per region, with signed tensor components, residuals, chart, units, profile, region mask, aggregation mode, and normalization basis.

## Same-Basis Requirement

`same_basis` means both tensor sides use the same chart, units, selected profile, region mask, aggregation mode, and normalization basis. If any of those differ or are unknown, the artifact must remain `review` or `fail`.

## Counterpart Requirement

`gr_matter_channel_observation` cannot substitute for `tile_effective_counterpart`. A sampled matter-channel observation can be useful diagnostics, but it is not the same semantic object as the tile-effective stress tensor required by the metric route.

## Regional Closure Requirement

Global scalar agreement cannot override regional residuals. A small global residual can hide hull, wall, or exterior-shell failures, so source-closed language requires controlled regional evidence.

## Tensor Authority Requirement

Diagonal proxy closure is diagnostic only. Source legitimacy, observer robustness, and promotion-sensitive source-to-geometry claims require full tensor evidence or an explicit symmetry authority.

## QEI Requirement

QEI evidence must be worldline-based. A QEI claim has to name the quantum state assumptions, renormalization convention, boundary/cavity model, sampling worldlines, sampling windows, duty-cycle consistency, and light-crossing consistency.

## Literature Boundary

External theory papers are context and guardrails, not NHM2 validation. Holography, Natario zero-expansion geometry, real-observer arguments, traversable-wormhole constructions, and QEI papers can constrain the evidence standard. They do not validate NHM2 source closure, the tile-effective source mechanism, transport, or ambient causality claims.
