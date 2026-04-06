# NHM2 Shift+Lapse Selected-Family Transport Result (2026-04-06)

"This artifact records the current live nhm2_shift_lapse selected-family bounded-transport publication result. It does not replace the canonical baseline latest aliases and does not widen speed, ETA, viability, gravity, or horizon claims."

## Reproduce
- publicationCommand: `npm run warp:full-solve:nhm2-shift-lapse:publish-selected-transport -- --shift-lapse-profile-id stage1_centerline_alpha_0p8550_v1`
- selectedArtifactRoot: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1`
- selectedAuditRoot: `docs/audits/research/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1`
- shiftLapseProfileId: `stage1_centerline_alpha_0p8550_v1`
- shiftLapseProfileStage: `controlled_tuning_stage_1`
- shiftLapseProfileNote: Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8550 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.
- canonicalBaselineMetricT00Ref: `warp.metric.T00.natario_sdf.shift`
- canonicalBaselineLatestAliasesChanged: false

## Measured Result
| field | value |
|---|---|
| artifactType | nhm2_shift_lapse_transport_result/v1 |
| selectedFamily.warpFieldType | nhm2_shift_lapse |
| selectedFamily.metricT00Ref | warp.metric.T00.nhm2.shift_lapse |
| selectedFamily.metricT00Source | metric |
| selectedFamily.shiftLapseProfileId | stage1_centerline_alpha_0p8550_v1 |
| selectedFamily.shiftLapseProfileStage | controlled_tuning_stage_1 |
| transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| promotionGateStatus | pass |
| promotionGateReason | shift_lapse_transport_promotion_gate_pass |
| authoritativeLowExpansionStatus | pass |
| authoritativeLowExpansionSource | gr_evolve_brick |
| wallSafetyStatus | pass |
| wallSafetyReason | wall_safety_guardrail_ok |
| centerlineAlpha | 0.855 |
| centerlineDtauDt | 0.855 |
| missionTimeInterpretationStatus | bounded_relativistic_differential_detected |
| properMinusCoordinate_seconds | -19974615.057991028 |
| properMinusClassical_seconds | -19974615.057991028 |
| boundedTimingDifferentialDetected | true |
| measuredResultSummary | The current live nhm2_shift_lapse selected-family bounded-transport bundle for profile stage1_centerline_alpha_0p8550_v1 detects a bounded timing differential. This remains a bounded contract result only and does not imply broader travel-advantage or viability claims. |

## Selected Bundle Paths
| artifact | latestJsonPath |
|---|---|
| worldline | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1/nhm2-warp-worldline-proof-latest.json |
| cruiseEnvelopePreflight | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1/nhm2-cruise-envelope-preflight-latest.json |
| routeTimeWorldline | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1/nhm2-route-time-worldline-latest.json |
| missionTimeEstimator | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1/nhm2-mission-time-estimator-latest.json |
| missionTimeComparison | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1/nhm2-mission-time-comparison-latest.json |
| cruiseEnvelope | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1/nhm2-cruise-envelope-latest.json |
| inHullProperAcceleration | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8550_v1/nhm2-in-hull-proper-acceleration-latest.json |

## Non-Claims
- does not replace the canonical baseline latest aliases
- does not certify speed or ETA
- does not widen viability claims
- does not convert wall-safety guardrails into a theorem-level horizon claim
- does not widen source/mechanism authority

