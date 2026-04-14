# NHM2 Observer Readiness Memo (2026-04-11)

## Decision
The NHM2 tile-WEC remediation lane remains paused. The active technical workstream is `observer_completeness_and_authority`, and the next parallel readiness lane is certificate/policy availability.

## Observer State
- `status = fail`
- `observerBlockingAssessmentStatus = same_surface_violation_confirmed`
- `observerRemediationSequenceStatus = metric_then_tile_proxy`
- `observerTileDiminishingReturnStatus = likely_stop_territory`
- `observerMetricPrimaryDriver = wec`
- `observerTilePrimaryDriver = wec`
- `tileEffective.blockingDependencyStatus = dec_downstream_of_wec`

## Mixed Blocker Assessment
The current observer fail is mixed, not purely a single emitted-surface story.

Metric-required completeness:
- `observerMetricCompletenessStatus = incomplete_missing_inputs`
- Missing inputs: `metric_t0i_missing`, `metric_tij_off_diagonal_missing`
- Published note: `Metric-required observer audit remains diagonal-only because T0i flux terms and off-diagonal spatial shear terms were not supplied; missing inputs: metric_t0i_missing, metric_tij_off_diagonal_missing`

Tile-effective authority:
- `observerTileAuthorityStatus = proxy_limited`
- `fluxHandling = voxel_flux_field`
- `shearHandling = not_modeled_in_proxy`
- Published note: `Tile-effective observer audit remains proxy-limited: fluxHandling=voxel_flux_field, shearHandling=not_modeled_in_proxy.`

Lead readiness routing:
- `observerLeadReadinessWorkstream = observer_completeness_and_authority`
- Published reason: `Observer fail remains mixed: same-surface negativity is real, metric-required coverage still misses T0i/off-diagonal inputs, and tile-effective authority remains proxy-limited. Certificate/policy readiness remains a separate parallel full-loop lane.`

## Stable Physics Values
These readiness annotations do not change the current observer numbers:
- `metric WEC = -57110812.99010783`
- `metric DEC = -114221625.98021565`
- `tile WEC = -42531360768`
- `tile DEC = -85062721536`

## Source Closure Position
Source closure is not the lead blocker on current repo policy.
- `schemaVersion = nhm2_source_closure/v2`
- `status = review`
- `residualNorms.relLInf = 4.6143808140791624e-10`
- Regional direct `T00` remains observation-only through the published region-comparison contract notes and does not define same-basis promotion authority.

## Full-Loop Position
- `sections.observer_audit.state = fail`
- `sections.certificate_policy_result.state = unavailable`
- `sections.certificate_policy_result.reasons = ["certificate_missing"]`
- `overallState = fail`
- `currentClaimTier = diagnostic`
- `highestPassingClaimTier = diagnostic`

## Active Workstreams
1. `observer_completeness_and_authority`
2. `certificate_policy_readiness`
3. read-only observer reassessment before any further remediation re-entry

## Non-Goals
- No restart of routine tile-local WEC patching.
- No reopening of regional direct `T00` as a promotion-grade same-basis authority surface.
- No claim-tier widening from this memo.