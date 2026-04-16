# NHM2 Full-Loop Audit (2026-04-16)

"This checklist audits the currently selected nhm2_shift_lapse profile against the existing NHM2 full-loop contract using emitted artifact evidence only. Missing or mismatched publication surfaces remain explicit blockers and do not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| contractVersion | nhm2_full_loop_audit/v1 |
| auditId | nhm2_full_loop |
| laneId | nhm2_shift_lapse |
| generatedAt | 2026-04-16T17:40:26.470Z |
| selectedProfileId | stage1_centerline_alpha_0p995_v1 |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit |
| currentClaimTier | diagnostic |
| maximumClaimTier | reduced-order |
| highestPassingClaimTier | diagnostic |
| overallState | fail |
| blockingReasons | observer_blocking_violation, policy_review_required |

## Tier Readiness
| tier | state | satisfiedSections | blockingReasons |
|---|---|---|---|
| diagnostic | pass | family_semantics, claim_tier, lapse_provenance, mission_time_outputs | none |
| reduced-order | fail | family_semantics, claim_tier, lapse_provenance, strict_signal_readiness, mission_time_outputs, shift_vs_lapse_decomposition | observer_blocking_violation, policy_review_required |
| certified | fail | family_semantics, claim_tier, lapse_provenance, strict_signal_readiness, mission_time_outputs, shift_vs_lapse_decomposition, certificate_policy_result | observer_blocking_violation, policy_review_required |

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
| observerPrimaryDriverNote | metric_required first localizes to WEC (eulerian_native) at metric_required.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. tile_effective first localizes to WEC (eulerian_native) at tile_effective.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. |
| observerMetricFirstInspectionTarget | metric_required.conditions.wec |
| observerTileFirstInspectionTarget | tile_effective.conditions.wec |
| observerSharedRootDriverStatus | shared_root_driver_confirmed |
| observerSharedRootDriverNote | metric_required and tile_effective both trace back to the same negative-energy-density root driver; downstream DEC/secondary co-failures should be remediated through the emitted WEC surface first. |
| observerSharedUpstreamDriverStatus | surface_specific_upstream_refs |
| observerSharedUpstreamDriverNote | metric_required traces upstream to warp.metric.T00.nhm2.shift_lapse, while tile_effective traces upstream to gr.matter.stressEnergy.tensorSampledSummaries.global.nhm2_shift_lapse.diagonal_proxy; they share the same negative-energy root class but not the same emitted upstream driver. |
| observerWecPropagationStatus | tile_proxy_independent |
| observerWecPropagationNote | 50% metric-side WEC probe relaxes metric_required WEC/DEC but leaves the tile_effective proxy effectively unchanged, so the tile proxy remains a separate remediation lane. |
| observerRemediationSequenceStatus | metric_then_tile_proxy |
| observerTileDiminishingReturnStatus | likely_stop_territory |
| observerTileDiminishingReturnNote | April 11, 2026 exception-only reassessment found no admissible new aft-local single-contributor mechanism distinct from the retired shell-bias path, the support-width branch, and the failed shell-taper family with a credible >=2% lift path. Residual tile WEC remains the primary blocker and the tile remediation lane stays in likely stop territory under the hard 2% rule. |
| observerMetricCompletenessStatus | incomplete_missing_inputs |
| observerMetricCompletenessNote | Metric-required observer audit remains diagonal-only because T0i flux terms and off-diagonal spatial shear terms were not supplied; missing inputs: metric_t0i_missing, metric_tij_off_diagonal_missing |
| observerMetricCoverageBlockerStatus | producer_not_emitted |
| observerMetricCoverageBlockerNote | Metric-required observer completeness remains blocked at producer emission: current runtime emits diagonal-only stress and lacks admitted same-chart routes required for J_i/T0i and off-diagonal S_ij/Tij closure. |
| observerMetricFirstMissingStage | semantic_contract |
| observerMetricEmissionAdmissionStatus | not_admitted |
| observerMetricEmissionAdmissionNote | Admission failed: current evidence localizes both missing families to a model-term/evaluator gap rather than a wiring-only gap. |
| observerMetricT0iAdmissionStatus | requires_new_model_term |
| observerMetricT0iAdmissionNote | Current producer remains diagonal-only and does not expose an admitted momentum-constraint-grade route (D_j K^j_i - D_i K) or full Einstein-tensor route for same-chart J_i/T0i. |
| observerMetricOffDiagonalTijAdmissionStatus | requires_new_model_term |
| observerMetricOffDiagonalTijAdmissionNote | Current producer does not expose an admitted stress/evolution route (time-derivative or K_ij evolution) or full Einstein-tensor route for same-chart off-diagonal S_ij/Tij. |
| observerTileAuthorityStatus | proxy_limited |
| observerTileAuthorityNote | Tile-effective observer audit remains proxy-limited: fluxHandling=voxel_flux_field, shearHandling=not_modeled_in_proxy. |
| observerLeadReadinessWorkstream | observer_completeness_and_authority |
| observerLeadReadinessReason | Observer fail remains mixed: same-surface negativity is real, metric-required coverage still misses T0i/off-diagonal inputs, and tile-effective authority remains proxy-limited. Certificate/policy readiness remains a separate parallel full-loop lane. |
| observerNextTechnicalAction | resolve_metric_tensor_semantics |
| observerBlockingAssessmentNote | metric_required and tile_effective tensors emit concrete failing mixed WEC and DEC conditions with missedViolationFraction=0 and non-positive maxRobustMinusEulerian. Policy review remains required because surrogate-model limitations are still present. |
| metric.wecMinOverAllTimelike | -57110812.99010783 |
| metric.necMinOverAllNull | 0 |
| metric.decStatus | fail |
| metric.secStatus | pass |
| tile.wecMinOverAllTimelike | -42531360768 |
| tile.necMinOverAllNull | 0 |
| tile.decStatus | fail |
| tile.secStatus | pass |

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
| certificate_policy_result | published NHM2 certificate-policy wrapper artifact | artifacts/research/full-solve/nhm2-certificate-policy-latest.json | pass | n/a | ok | pass | none |

