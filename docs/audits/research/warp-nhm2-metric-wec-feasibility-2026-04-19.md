# NHM2 Metric WEC Feasibility (2026-04-19)

"This artifact localizes the NHM2 metric-required WEC blocker across a selected local centerline-alpha neighborhood. It does not widen claim tier, route ETA, viability, gravity, or tile-lane authority."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_metric_wec_feasibility/v1 |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-metric-wec-feasibility |
| selectedProfileId | stage1_centerline_alpha_0p995_v1 |
| chartRef | comoving_cartesian |
| semanticsRef | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md |
| researchBasisRef | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| baselineObserverAuditRef | artifacts/research/full-solve/nhm2-observer-audit-latest.json |
| baselineFullLoopAuditRef | artifacts/research/full-solve/nhm2-full-loop-audit-latest.json |
| testedProfileCount | 16 |
| bestMetricWecProfileId | stage1_centerline_alpha_0p995_v1 |
| bestMetricWecEulerianMin | 0 |
| bestMetricWecGapToZero | 0 |
| bestMetricWecRobustProfileId | stage1_centerline_alpha_0p995_v1 |
| bestMetricWecRobustMin | 0 |
| bestMetricWecRobustGapToZero | 0 |
| bestMetricWecStatus | pass |
| allProfilesMetricWecFail | false |
| feasibilityStatus | candidate_found_needs_followup |
| diagnosisClass | wec_nonnegative_candidate_found |
| semanticConsistencyStatus | pass |
| semanticConsistencyNote | Closure-path semantic checks are consistent across all tested profiles. |
| invarianceStatus | pass |
| invarianceNote | Closure-path invariance checks (including independent cross-check and convergence gates when applicable) are consistent across tested profiles. |
| recommendedPatchClass | einstein_semantic_closure_patch |
| recommendedPatchRationale | Profile-level closure-path evidence converges on einstein_semantic_closure_patch. |
| nextTechnicalAction | rerun selected-profile observer/full-loop publication for the candidate profile and keep claim tier diagnostic until all policy gates remain satisfied. |

## Per-Profile Metric WEC Localization
| shiftLapseProfileId | centerlineAlpha | observerStatus | metricWecStatus | metricWecEulerianMin | metricWecRobustMin | metricDecStatus | metricDecEulerianMin | metricDecRobustMin | tileWecStatus | tileWecEulerianMin | tileWecRobustMin | metricPrimaryBlockingMode | tilePrimaryBlockingMode | supportFieldRouteAdmission | fullEinsteinTensorRouteAdmission | independentCrossCheck | closurePathSelected | supportFieldInterpretation | closurePathSemanticConsistency | closurePathInvariance | recommendedPatchClass | supportFieldRouteNotAdmitted |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| stage1_centerline_alpha_0p995_v1 | 0.995 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9975_v1 | 0.9975 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9925_v1 | 0.9925 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9900_v1 | 0.99 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9875_v1 | 0.9875 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9850_v1 | 0.985 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9825_v1 | 0.9825 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9800_v1 | 0.98 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9775_v1 | 0.9775 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9750_v1 | 0.975 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9725_v1 | 0.9725 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9700_v1 | 0.97 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9675_v1 | 0.9675 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9650_v1 | 0.965 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9625_v1 | 0.9625 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |
| stage1_centerline_alpha_0p9600_v1 | 0.96 | fail | pass | 0 | 0 | fail | 0 | -58267450.989558905 | fail | -43392729088 | -43392729088 | robust_only | eulerian_native | fail | pass | pass | full_einstein_tensor | non_blocking | pass | pass | einstein_semantic_closure_patch | yes |

## Citation Basis
- docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md
- docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md
- https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf
- https://arxiv.org/abs/gr-qc/0110086
- https://arxiv.org/abs/gr-qc/0703035
- https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html
- https://arxiv.org/abs/2404.03095
- https://arxiv.org/abs/2602.18023

## Non-Claims
- does not change observer-condition formulas
- does not change source physics or pressure proxies
- does not widen claim tier
- does not reopen tile-local remediation
- does not change certificate policy

