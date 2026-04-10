# NHM2 Full-Loop Audit (2026-04-10)

"This checklist audits the currently selected nhm2_shift_lapse profile against the existing NHM2 full-loop contract using emitted artifact evidence only. Missing or mismatched publication surfaces remain explicit blockers and do not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| contractVersion | nhm2_full_loop_audit/v1 |
| auditId | nhm2_full_loop |
| laneId | nhm2_shift_lapse |
| generatedAt | 2026-04-10T06:06:58.602Z |
| selectedProfileId | stage1_centerline_alpha_0p995_v1 |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit |
| currentClaimTier | diagnostic |
| maximumClaimTier | reduced-order |
| highestPassingClaimTier | diagnostic |
| overallState | fail |
| blockingReasons | observer_blocking_violation, certificate_missing, policy_review_required |

## Tier Readiness
| tier | state | satisfiedSections | blockingReasons |
|---|---|---|---|
| diagnostic | pass | family_semantics, claim_tier, lapse_provenance, mission_time_outputs | none |
| reduced-order | fail | family_semantics, claim_tier, lapse_provenance, strict_signal_readiness, mission_time_outputs, shift_vs_lapse_decomposition | observer_blocking_violation, policy_review_required |
| certified | fail | family_semantics, claim_tier, lapse_provenance, strict_signal_readiness, mission_time_outputs, shift_vs_lapse_decomposition | observer_blocking_violation, certificate_missing, policy_review_required |

## Observer Audit Summary
| field | value |
|---|---|
| state | fail |
| reasons | observer_blocking_violation, policy_review_required |
| observerBlockingAssessmentStatus | same_surface_violation_confirmed |
| observerPromotionBlockingSurface | both |
| observerPromotionBlockingCondition | mixed |
| observerMetricPrimaryDriver | wec |
| observerTilePrimaryDriver | wec |
| observerPrimaryDriverAgreement | aligned |
| observerPrimaryDriverNote | metric_required first localizes to WEC (eulerian_native) at metric_required.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. tile_effective first localizes to WEC (eulerian_native) at tile_effective.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. NEC/SEC remain secondary search-driven failures on the tile-effective surface. |
| observerMetricFirstInspectionTarget | metric_required.conditions.wec |
| observerTileFirstInspectionTarget | tile_effective.conditions.wec |
| observerSharedRootDriverStatus | shared_root_driver_confirmed |
| observerSharedRootDriverNote | metric_required and tile_effective both trace back to the same negative-energy-density root driver; downstream DEC/secondary co-failures should be remediated through the emitted WEC surface first. |
| observerSharedUpstreamDriverStatus | surface_specific_upstream_refs |
| observerSharedUpstreamDriverNote | metric_required traces upstream to warp.metric.T00.nhm2.shift_lapse, while tile_effective traces upstream to gr.matter.stressEnergy.tensorSampledSummaries.global.nhm2_shift_lapse.diagonal_proxy; they share the same negative-energy root class but not the same emitted upstream driver. |
| observerWecPropagationStatus | tile_proxy_independent |
| observerWecPropagationNote | 50% metric-side WEC probe relaxes metric_required WEC/DEC but leaves the tile_effective proxy effectively unchanged, so the tile proxy remains a separate remediation lane. |
| observerRemediationSequenceStatus | metric_then_tile_proxy |
| observerBlockingAssessmentNote | metric_required and tile_effective tensors emit concrete failing mixed WEC and DEC conditions with missedViolationFraction=0 and non-positive maxRobustMinusEulerian. Policy review remains required because surrogate-model limitations are still present. |
| metric.wecMinOverAllTimelike | -57110812.99010783 |
| metric.necMinOverAllNull | 0 |
| metric.decStatus | fail |
| metric.secStatus | pass |
| tile.wecMinOverAllTimelike | -0.11480523685564506 |
| tile.necMinOverAllNull | -0.05740261842782253 |
| tile.decStatus | fail |
| tile.secStatus | fail |

## Closure Checklist
| section | expected evidence | found artifact/ref | contract parse status | lane/profile match | stale/mismatch status | section state | blocking reasons |
|---|---|---|---|---|---|---|---|
| family_semantics | selected-family transport result contract<br/>docs/nhm2-closed-loop.md<br/>docs/nhm2-audit-checklist.md | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>docs/nhm2-closed-loop.md<br/>docs/nhm2-audit-checklist.md | pass | pass | ok | pass | none |
| claim_tier | selected-family bounded transport artifact<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | pass | pass | ok | pass | none |
| lapse_provenance | selected-family transport result contract<br/>selected-family worldline contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | pass | ok | pass | none |
| strict_signal_readiness | published nhm2 strict-signal readiness contract | artifacts/research/full-solve/nhm2-strict-signal-readiness-latest.json | pass | pass | ok | pass | none |
| source_closure | published nhm2 source-closure tensor contract | artifacts/research/full-solve/nhm2-source-closure-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-hull-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-exterior-shell-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-hull-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-exterior-shell-latest.json | pass | pass | ok | review | policy_review_required |
| observer_audit | published nhm2 observer audit contract | artifacts/research/full-solve/nhm2-observer-audit-latest.json | pass | pass | ok | fail | observer_blocking_violation, policy_review_required |
| gr_stability_safety | selected-family transport gate evidence<br/>root NHM2 envelope perturbation suite<br/>selected-family envelope perturbation suite<br/>selected-family in-hull proper-acceleration contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-in-hull-proper-acceleration-latest.json | pass | pass | ok | review | policy_review_required |
| mission_time_outputs | selected-family worldline contract<br/>selected-family cruise-envelope preflight contract<br/>selected-family route-time contract<br/>selected-family mission-time estimator contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-cruise-envelope-preflight-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-route-time-worldline-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-estimator-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | pass | ok | pass | none |
| shift_vs_lapse_decomposition | selected-family shift-vs-lapse decomposition contract<br/>root shift-vs-lapse decomposition contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-vs-lapse-decomposition-latest.json<br/>artifacts/research/full-solve/nhm2-shift-vs-lapse-decomposition-latest.json | pass | pass | ok | pass | none |
| uncertainty_perturbation_reproducibility | root NHM2 envelope perturbation suite<br/>selected-family NHM2 envelope perturbation suite | artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json | pass | pass | ok | review | policy_review_required |
| certificate_policy_result | published certificate-adjacent NHM2 policy artifact | none | missing | n/a | ok | unavailable | certificate_missing |

