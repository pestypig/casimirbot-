# NHM2 Strict-Signal Readiness (2026-04-09)

"This checklist records the currently selected nhm2_shift_lapse profile's published strict-signal evidence only. Missing signal publication remains explicit and does not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_strict_signal_readiness |
| schemaVersion | nhm2_strict_signal_readiness/v1 |
| status | pass |
| completeness | complete |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-strict-signal-readiness |
| family.familyId | nhm2_shift_lapse |
| family.familyAuthorityStatus | candidate_authoritative_solve_family |
| family.transportCertificationStatus | bounded_transport_fail_closed_reference_only |
| family.lapseSummary.shiftLapseProfileId | stage1_centerline_alpha_0p995_v1 |
| family.lapseSummary.shiftLapseProfileStage | controlled_tuning_stage_1 |
| family.lapseSummary.shiftLapseProfileLabel | Stage 1 centerline alpha 0.995 |
| family.lapseSummary.alphaCenterline | 0.995 |
| strictModeEnabled | true |
| reasonCodes | none |
| missingSignals | none |
| proxySignals | none |
| promotionSignalReady | true |
| certifiedPromotionReady | true |
| thetaMetricDerived | true |
| tsMetricDerived | true |
| qiMetricDerived | true |
| qiApplicabilityStatus | PASS |

## Signals
| signal | status | metricDerived | provenance | sourcePath | reasonCode | reason | rhoSource | applicabilityStatus | applicabilityReasonCode |
|---|---|---|---|---|---|---|---|---|---|
| theta | pass | true | metric | warp.metricAdapter.betaDiagnostics.thetaMax | null | null | n/a | n/a | n/a |
| ts | pass | true | metric | warp.metricAdapter+clocking | null | null | n/a | n/a | n/a |
| qi | pass | true | metric | warp.metric.T00.nhm2.shift_lapse+warp.metricAdapter+clocking | null | null | warp.metric.T00.nhm2.shift_lapse | PASS | null |

