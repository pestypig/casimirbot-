# NHM2 Full-Loop Audit (2026-04-25)

"This checklist audits the currently selected nhm2_shift_lapse profile against the existing NHM2 full-loop contract using emitted artifact evidence only. Missing or mismatched publication surfaces remain explicit blockers and do not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| contractVersion | nhm2_full_loop_audit/v1 |
| auditId | nhm2_full_loop |
| laneId | nhm2_shift_lapse |
| generatedAt | 2026-04-25T02:11:25.514Z |
| selectedProfileId | stage1_centerline_alpha_0p995_v1 |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit |
| currentClaimTier | diagnostic |
| maximumClaimTier | reduced-order |
| highestPassingClaimTier | null |
| overallState | review |
| blockingReasons | insufficient_provenance, policy_review_required |

## Tier Readiness
| tier | state | satisfiedSections | blockingReasons |
|---|---|---|---|
| diagnostic | review | family_semantics | insufficient_provenance |
| reduced-order | review | family_semantics, strict_signal_readiness, source_closure, observer_audit, uncertainty_perturbation_reproducibility | insufficient_provenance, policy_review_required |
| certified | review | family_semantics, strict_signal_readiness, source_closure, observer_audit, uncertainty_perturbation_reproducibility, certificate_policy_result | insufficient_provenance, policy_review_required |

## Claim Evidence Ledger
| field | value |
|---|---|
| checklistPath | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/research/research-citation-patch-checklist.v1.json |
| validationOk | true |
| hasBlockingEvidence | true |
| validationIssues | none |

| claimId | claimStatus | claimClass | mappingStatus | sourceIds | sourceEvidenceTypes | uncertaintyNote |
|---|---|---|---|---|---|---|
| claim_observed_vs_theoretical_lane_separation | derived | literature_context | mapped | springer_natario_zero_expansion_2024, ligo_technology_reference, casimirbot_repo_clone_6baffda | peer_reviewed, reference_web, repo_clone | null |
| claim_nhm2_secondary_curvature_rendering | measured | not_validated | mapped | casimirbot_repo_clone_6baffda | repo_clone | null |
| claim_future_mechanism_closure_hypothesis | hypothesis | extrapolation_candidate | mapped | casimirbot_repo_clone_6baffda, lentz_2021_breaking_warp_barrier | repo_clone, preprint | Predictive projection only; not validated by present bounded-stack evidence. |
| claim_nhm2_alpha_sweep_clocking_isolation | derived | literature_context | mapped | natario_2001_zero_expansion, gourgoulhon_2007_3plus1, casimirbot_repo_clone_6baffda | peer_reviewed, preprint, repo_clone | null |
| claim_nhm2_exploratory_alpha_not_auto_promoted | measured | not_validated | mapped | casimirbot_repo_clone_6baffda | repo_clone | null |
| claim_nhm2_locked_coordinate_schedule_invariant | derived | literature_context | mapped | casimirbot_repo_clone_6baffda, gourgoulhon_2007_3plus1, alcubierre_1994_warp_drive | repo_clone, preprint, peer_reviewed | null |

## Literature Context (Non-Proof)
These references provide context bounds for non-measured claims. They do not by themselves validate this run.

| claimId | claimClass | literatureRefs |
|---|---|---|
| claim_observed_vs_theoretical_lane_separation | literature_context | springer_natario_zero_expansion_2024 (https://link.springer.com/article/10.1007/s10773-024-05700-0) |
| claim_nhm2_secondary_curvature_rendering | not_validated | none |
| claim_future_mechanism_closure_hypothesis | extrapolation_candidate | lentz_2021_breaking_warp_barrier (https://arxiv.org/abs/2006.07125) |
| claim_nhm2_alpha_sweep_clocking_isolation | literature_context | natario_2001_zero_expansion (https://arxiv.org/abs/gr-qc/0110086); gourgoulhon_2007_3plus1 (https://arxiv.org/abs/gr-qc/0703035) |
| claim_nhm2_exploratory_alpha_not_auto_promoted | not_validated | none |
| claim_nhm2_locked_coordinate_schedule_invariant | literature_context | gourgoulhon_2007_3plus1 (https://arxiv.org/abs/gr-qc/0703035); alcubierre_1994_warp_drive (https://arxiv.org/abs/gr-qc/0009013) |

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
| claim_tier | selected-family bounded transport artifact<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | pass | pass | ok | review | insufficient_provenance |
| lapse_provenance | selected-family transport result contract<br/>selected-family worldline contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | fail | profile_mismatch:stage1_centerline_alpha_0p7000_v1:stage1_centerline_alpha_0p995_v1 | review | insufficient_provenance |
| strict_signal_readiness | published nhm2 strict-signal readiness contract | artifacts/research/full-solve/nhm2-strict-signal-readiness-latest.json | pass | pass | ok | pass | none |
| source_closure | published nhm2 source-closure tensor contract | artifacts/research/full-solve/nhm2-source-closure-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-hull-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-exterior-shell-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-hull-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-exterior-shell-latest.json | pass | pass | ok | pass | none |
| observer_audit | published nhm2 observer audit contract | artifacts/research/full-solve/nhm2-observer-audit-latest.json | pass | pass | ok | pass | none |
| gr_stability_safety | selected-family transport gate evidence<br/>root NHM2 envelope perturbation suite<br/>selected-family envelope perturbation suite<br/>selected-family in-hull proper-acceleration contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-in-hull-proper-acceleration-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-selected-family-timeout-diagnostic-latest.json | pass | fail | profile_mismatch:stage1_centerline_alpha_0p7000_v1:stage1_centerline_alpha_0p995_v1,profile_missing | review | policy_review_required |
| mission_time_outputs | selected-family worldline contract<br/>selected-family cruise-envelope preflight contract<br/>selected-family route-time contract<br/>selected-family mission-time estimator contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-cruise-envelope-preflight-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-route-time-worldline-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-estimator-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | fail | profile_mismatch:stage1_centerline_alpha_0p7000_v1:stage1_centerline_alpha_0p995_v1 | review | insufficient_provenance |
| shift_vs_lapse_decomposition | selected-family shift-vs-lapse decomposition contract<br/>root shift-vs-lapse decomposition contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-vs-lapse-decomposition-latest.json<br/>artifacts/research/full-solve/nhm2-shift-vs-lapse-decomposition-latest.json | pass | fail | profile_mismatch:stage1_centerline_alpha_0p7000_v1:stage1_centerline_alpha_0p995_v1,root_selected_decomposition_checksum_mismatch | review | insufficient_provenance |
| uncertainty_perturbation_reproducibility | root NHM2 envelope perturbation suite<br/>selected-family NHM2 envelope perturbation suite | artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json | pass | pass | ok | pass | none |
| certificate_policy_result | published NHM2 certificate-policy wrapper artifact | artifacts/research/full-solve/nhm2-certificate-policy-latest.json | pass | n/a | ok | pass | none |

