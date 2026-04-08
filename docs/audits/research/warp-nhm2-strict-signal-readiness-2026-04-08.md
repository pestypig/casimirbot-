# NHM2 Strict-Signal Readiness (2026-04-08)

"This checklist records the currently selected nhm2_shift_lapse profile's published strict-signal evidence only. Missing signal publication remains explicit and does not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_strict_signal_readiness |
| schemaVersion | nhm2_strict_signal_readiness/v1 |
| status | fail |
| completeness | incomplete |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-strict-signal-readiness |
| family.familyId | nhm2_shift_lapse |
| family.familyAuthorityStatus | candidate_authoritative_solve_family |
| family.transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| family.lapseSummary.shiftLapseProfileId | stage1_centerline_alpha_0p995_v1 |
| family.lapseSummary.shiftLapseProfileStage | controlled_tuning_stage_1 |
| family.lapseSummary.shiftLapseProfileLabel | Stage 1 centerline alpha 0.995 |
| family.lapseSummary.alphaCenterline | 0.995 |
| strictModeEnabled | true |
| reasonCodes | strict_signal_missing |
| missingSignals | theta, ts, qi |
| proxySignals | none |
| promotionSignalReady | false |
| certifiedPromotionReady | false |
| thetaMetricDerived | false |
| tsMetricDerived | false |
| qiMetricDerived | false |
| qiApplicabilityStatus | null |

## Signals
| signal | status | metricDerived | provenance | sourcePath | reasonCode | reason | rhoSource | applicabilityStatus | applicabilityReasonCode |
|---|---|---|---|---|---|---|---|---|---|
| theta | unavailable | null | missing | null | strict_signal_missing | No emitted selected-profile artifact currently publishes theta metric-derivation provenance. | n/a | n/a | n/a |
| ts | unavailable | null | missing | null | strict_signal_missing | No emitted selected-profile artifact currently publishes TS metric-derivation provenance. | n/a | n/a | n/a |
| qi | unavailable | null | missing | null | strict_signal_missing | No emitted selected-profile artifact currently publishes QI metric-derivation provenance or applicability status. | null | null | strict_signal_missing |

