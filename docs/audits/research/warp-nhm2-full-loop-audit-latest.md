# NHM2 Full-Loop Audit (2026-04-08)

"This checklist audits the currently selected nhm2_shift_lapse profile against the existing NHM2 full-loop contract using emitted artifact evidence only. Missing or mismatched publication surfaces remain explicit blockers and do not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| contractVersion | nhm2_full_loop_audit/v1 |
| auditId | nhm2_full_loop |
| laneId | nhm2_shift_lapse |
| generatedAt | 2026-04-08T21:18:55.661Z |
| selectedProfileId | stage1_centerline_alpha_0p995_v1 |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit |
| currentClaimTier | diagnostic |
| maximumClaimTier | reduced-order |
| highestPassingClaimTier | diagnostic |
| overallState | unavailable |
| blockingReasons | strict_signal_missing, source_closure_missing, observer_audit_incomplete, certificate_missing, policy_review_required |

## Tier Readiness
| tier | state | satisfiedSections | blockingReasons |
|---|---|---|---|
| diagnostic | pass | family_semantics, claim_tier, lapse_provenance, mission_time_outputs | none |
| reduced-order | unavailable | family_semantics, claim_tier, lapse_provenance, mission_time_outputs, shift_vs_lapse_decomposition | strict_signal_missing, source_closure_missing, observer_audit_incomplete, policy_review_required |
| certified | unavailable | family_semantics, claim_tier, lapse_provenance, mission_time_outputs, shift_vs_lapse_decomposition | strict_signal_missing, source_closure_missing, observer_audit_incomplete, certificate_missing, policy_review_required |

## Closure Checklist
| section | expected evidence | found artifact/ref | contract parse status | lane/profile match | stale/mismatch status | section state | blocking reasons |
|---|---|---|---|---|---|---|---|
| family_semantics | selected-family transport result contract<br/>docs/nhm2-closed-loop.md<br/>docs/nhm2-audit-checklist.md | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>docs/nhm2-closed-loop.md<br/>docs/nhm2-audit-checklist.md | pass | pass | ok | pass | none |
| claim_tier | selected-family bounded transport artifact<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>MATH_STATUS.md<br/>shared/contracts/warp-proof-surface-manifest.v1.ts | pass | pass | ok | pass | none |
| lapse_provenance | selected-family transport result contract<br/>selected-family worldline contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | pass | ok | pass | none |
| strict_signal_readiness | published nhm2 strict-signal readiness contract | none | missing | n/a | missing_artifact | unavailable | strict_signal_missing |
| source_closure | published nhm2 source-closure tensor contract | none | missing | n/a | missing_artifact | unavailable | source_closure_missing |
| observer_audit | published nhm2 observer audit contract | none | missing | n/a | missing_artifact | unavailable | observer_audit_incomplete |
| gr_stability_safety | selected-family transport gate evidence<br/>root NHM2 envelope perturbation suite<br/>selected-family envelope perturbation suite<br/>selected-family in-hull proper-acceleration contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json<br/>artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-in-hull-proper-acceleration-latest.json | pass | pass | ok | review | policy_review_required |
| mission_time_outputs | selected-family worldline contract<br/>selected-family cruise-envelope preflight contract<br/>selected-family route-time contract<br/>selected-family mission-time estimator contract<br/>selected-family mission-time comparison contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-cruise-envelope-preflight-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-route-time-worldline-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-estimator-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json | pass | pass | ok | pass | none |
| shift_vs_lapse_decomposition | selected-family shift-vs-lapse decomposition contract<br/>root shift-vs-lapse decomposition contract | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-vs-lapse-decomposition-latest.json<br/>artifacts/research/full-solve/nhm2-shift-vs-lapse-decomposition-latest.json | pass | pass | ok | pass | none |
| uncertainty_perturbation_reproducibility | root NHM2 envelope perturbation suite<br/>selected-family NHM2 envelope perturbation suite | artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json<br/>artifacts/research/full-solve/selected-family/nhm2-shift-lapse/envelope/nhm2-envelope-perturbation-suite-latest.json | pass | pass | ok | review | policy_review_required |
| certificate_policy_result | published certificate-adjacent NHM2 policy artifact | none | missing | n/a | ok | unavailable | certificate_missing |

