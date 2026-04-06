# NHM2 Shift+Lapse Selected-Family Profile Sweep (2026-04-05)

"This artifact records a small robustness sweep around the tuned nhm2_shift_lapse selected-family bounded-transport result. It does not replace canonical baseline latest aliases and does not widen speed, ETA, viability, gravity, or horizon claims."

## Reproduce
- publicationCommand: `npm run warp:full-solve:nhm2-shift-lapse:publish-profile-sweep`
- sweepFamilyId: `stage1_centerline_alpha_bracket_v1`
- sweepDimension: `centerline_alpha`
- sweepProfileIds: `stage1_centerline_alpha_0p9975_v1`, `stage1_centerline_alpha_0p995_v1`, `stage1_centerline_alpha_0p9925_v1`, `stage1_centerline_alpha_0p9900_v1`
- referenceSelectedFamilyResultJson: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json`
- referenceSelectedFamilyResultMd: `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-shift-lapse-transport-result-latest.md`
- canonicalBaselineMetricT00Ref: `warp.metric.T00.natario_sdf.shift`
- canonicalBaselineLatestAliasesChanged: false

## Aggregate Result
- robustnessStatus: `robust_over_tested_bracket`
- scalingStatus: `monotonic`
- firstProfileWithBoundedTimingDifferential: `stage1_centerline_alpha_0p9975_v1`
- strongestProfileKeepingAllGatesPassing: `stage1_centerline_alpha_0p9900_v1`
- firstGateFailure: none in the tested bracket
- robustnessSummary: Across the tested selected-family bracket, every tested profile remained gate-admitted and the bounded timing differential scales monotonically with the tuned centerline-alpha dial.

## Per-Profile Results
| shiftLapseProfileId | transportCertificationStatus | promotionGateStatus | authoritativeLowExpansionStatus | wallSafetyStatus | centerlineAlpha | centerlineDtauDt | missionTimeInterpretationStatus | properMinusCoordinate_seconds | boundedTimingDifferentialDetected |
|---|---|---|---|---|---|---|---|---|---|
| stage1_centerline_alpha_0p9975_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9975 | 0.9975 | bounded_relativistic_differential_detected | -344389.9147929549 | true |
| stage1_centerline_alpha_0p995_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.995 | 0.995 | bounded_relativistic_differential_detected | -688779.8295859098 | true |
| stage1_centerline_alpha_0p9925_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9925 | 0.9925 | bounded_relativistic_differential_detected | -1033169.744378835 | true |
| stage1_centerline_alpha_0p9900_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.99 | 0.99 | bounded_relativistic_differential_detected | -1377559.65917179 | true |

## Non-Claims
- does not replace the canonical baseline latest aliases
- does not certify speed or ETA
- does not widen viability claims
- does not convert wall-safety guardrails into a theorem-level horizon claim
- does not widen source/mechanism authority

