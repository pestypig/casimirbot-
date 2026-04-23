# NHM2 Full-Loop Audit (2026-04-23)

"This checklist audits the currently selected nhm2_shift_lapse profile against the existing NHM2 full-loop contract using emitted artifact evidence only. Missing or mismatched publication surfaces remain explicit blockers and do not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| contractVersion | nhm2_full_loop_audit/v1 |
| auditId | nhm2_full_loop |
| laneId | nhm2_shift_lapse |
| generatedAt | 2026-04-23T03:45:47.383Z |
| selectedProfileId | stage1_centerline_alpha_0p995_v1 |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit |
| currentClaimTier | diagnostic |
| maximumClaimTier | reduced-order |
| highestPassingClaimTier | reduced-order |
| overallState | pass |
| blockingReasons | none |

## Tier Readiness
| tier | state | satisfiedSections | blockingReasons |
|---|---|---|---|
| diagnostic | pass | family_semantics, claim_tier, lapse_provenance, mission_time_outputs | none |
| reduced-order | pass | family_semantics, claim_tier, lapse_provenance, strict_signal_readiness, source_closure, observer_audit, gr_stability_safety, mission_time_outputs, shift_vs_lapse_decomposition, uncertainty_perturbation_reproducibility | none |
| certified | pass | family_semantics, claim_tier, lapse_provenance, strict_signal_readiness, source_closure, observer_audit, gr_stability_safety, mission_time_outputs, shift_vs_lapse_decomposition, uncertainty_perturbation_reproducibility, certificate_policy_result | none |

## Observer Audit Summary
| field | value |
|---|---|
| state | pass |
| reasons | none |
| observerBlockingAssessmentStatus | unknown |
| observerPromotionBlockingSurface | unknown |
| observerPromotionBlockingCondition | unknown |
| observerMetricPrimaryDriver | unknown |
| observerTilePrimaryDriver | unknown |
| observerPrimaryDriverAgreement | unknown |
| observerPrimaryDriverNote | null |
| observerMetricFirstInspectionTarget | null |
| observerTileFirstInspectionTarget | null |
| observerSharedRootDriverStatus | unknown |
| observerSharedRootDriverNote | null |
| observerSharedUpstreamDriverStatus | unknown |
| observerSharedUpstreamDriverNote | null |
| observerWecPropagationStatus | unknown |
| observerWecPropagationNote | null |
| observerRemediationSequenceStatus | unknown |
| observerTileDiminishingReturnStatus | likely_stop_territory |
| observerTileDiminishingReturnNote | April 11, 2026 exception-only reassessment found no admissible new aft-local single-contributor mechanism distinct from the retired shell-bias path, the support-width branch, and the failed shell-taper family with a credible >=2% lift path. Residual tile WEC remains the primary blocker and the tile remediation lane stays in likely stop territory under the hard 2% rule. |
| observerMetricCompletenessStatus | complete |
| observerMetricCompletenessNote | Metric-required observer audit has no declared missing observer inputs. |
| observerMetricCoverageBlockerStatus | unknown |
| observerMetricCoverageBlockerNote | Metric-required same-chart full tensor families are emitted and selected-route semantic blockers are cleared for the active Einstein-path closure. |
| observerMetricFirstMissingStage | unknown |
| observerMetricEmissionAdmissionStatus | admitted |
| observerMetricEmissionAdmissionNote | Admission is accepted on the selected same-chart full-tensor route; ADM support-field-route gaps remain tracked as non-blocking diagnostics for this closure path. |
| observerMetricT00AdmissionStatus | derivable_same_chart_from_existing_state |
| observerMetricT00RouteId | einstein_tensor_geometry_fd4_v1 |
| observerMetricT00ComparabilityStatus | pass |
| observerMetricT00AdmissionNote | Metric-required observer rho/T00 is admitted via the Einstein-route policy bridge: full_einstein_tensor closure, comparable T00 residuals, independent cross-check, finite-difference convergence, and citation coverage all pass. |
| observerMetricT0iAdmissionStatus | derivable_same_chart_from_existing_state |
| observerMetricT0iAdmissionNote | Same-chart T0i is derivable from currently admitted producer state without introducing a new physics term. |
| observerMetricOffDiagonalTijAdmissionStatus | derivable_same_chart_from_existing_state |
| observerMetricOffDiagonalTijAdmissionNote | Same-chart off-diagonal Tij is derivable from currently admitted producer state without introducing a new physics term. |
| observerTileAuthorityStatus | full_tensor_authority |
| observerTileAuthorityNote | Tile-effective observer authority is admitted via the same-chart Einstein projection route with pass-level route admission, full-tensor component coverage, comparability, and citation checks. |
| observerLeadReadinessWorkstream | observer_completeness_and_authority |
| observerLeadReadinessReason | Observer completeness and tile authority are admitted on the selected route; certificate/policy readiness remains the parallel full-loop lane. |
| observerNextTechnicalAction | targeted_dec_physics_remediation |
| observerBlockingAssessmentNote | Observer blocking assessment could not be resolved from current runtime evidence. |
| metric.wecMinOverAllTimelike | 29133725.494779453 |
| metric.necMinOverAllNull | 61581412.26459007 |
| metric.decStatus | pass |
| metric.secStatus | pass |
| tile.wecMinOverAllTimelike | 29133725.494779453 |
| tile.necMinOverAllNull | 61581412.26459007 |
| tile.decStatus | pass |
| tile.secStatus | pass |

## Closure Checklist
| section | expected evidence | found artifact/ref | contract parse status | lane/profile match | stale/mismatch status | section state | blocking reasons |
|---|---|---|---|---|---|---|---|
| family_semantics | selected-family transport result contract<br/>docs/nhm2-closed-loop.md<br/>docs/nhm2-audit-checklist.md | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>docs/nhm2-closed-loop.md<br/>docs/nhm2-audit-checklist.md | pass | pass | ok | pass | none |
| claim_tier | selected-family bounded transport artifact<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | pass | pass | ok | pass | none |
| lapse_provenance | selected-family transport result contract<br/>selected-family worldline contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | pass | ok | pass | none |
| strict_signal_readiness | published nhm2 strict-signal readiness contract | artifacts/research/full-solve/nhm2-strict-signal-readiness-latest.json | pass | pass | ok | pass | none |
| source_closure | published nhm2 source-closure tensor contract | artifacts/research/full-solve/nhm2-source-closure-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-hull-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-exterior-shell-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-hull-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-exterior-shell-latest.json | pass | pass | ok | pass | none |
| observer_audit | published nhm2 observer audit contract | artifacts/research/full-solve/nhm2-observer-audit-latest.json | pass | pass | ok | pass | none |
| gr_stability_safety | selected-family transport gate evidence<br/>root NHM2 envelope perturbation suite<br/>selected-family envelope perturbation suite<br/>selected-family in-hull proper-acceleration contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-in-hull-proper-acceleration-latest.json | pass | pass | ok | pass | none |
| mission_time_outputs | selected-family worldline contract<br/>selected-family cruise-envelope preflight contract<br/>selected-family route-time contract<br/>selected-family mission-time estimator contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-cruise-envelope-preflight-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-route-time-worldline-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-estimator-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | pass | ok | pass | none |
| shift_vs_lapse_decomposition | selected-family shift-vs-lapse decomposition contract<br/>root shift-vs-lapse decomposition contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-vs-lapse-decomposition-latest.json<br/>artifacts/research/full-solve/nhm2-shift-vs-lapse-decomposition-latest.json | pass | pass | ok | pass | none |
| uncertainty_perturbation_reproducibility | root NHM2 envelope perturbation suite<br/>selected-family NHM2 envelope perturbation suite | artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json | pass | pass | ok | pass | none |
| certificate_policy_result | published NHM2 certificate-policy wrapper artifact | artifacts/research/full-solve/nhm2-certificate-policy-latest.json | pass | n/a | ok | pass | none |

