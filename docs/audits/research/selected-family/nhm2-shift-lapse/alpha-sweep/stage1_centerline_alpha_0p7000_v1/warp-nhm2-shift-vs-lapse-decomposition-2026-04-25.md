# NHM2 Shift-vs-Lapse Decomposition (2026-04-25)

"This artifact decomposes the bounded NHM2 mission-time result for one selected shift+lapse profile into fixed shift-family transport time, lapse-dial clock-rate contribution, and residual remainder. The lapse term is an approximate projection from the metric-derived centerline lapse dial; any unexplained drift is preserved in the residual."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_shift_vs_lapse_decomposition |
| schemaVersion | nhm2_shift_vs_lapse_decomposition/v1 |
| status | pass |
| completeness | complete |
| profile.familyId | nhm2_shift_lapse |
| profile.shiftLapseProfileId | stage1_centerline_alpha_0p7000_v1 |
| profile.shiftLapseProfileStage | controlled_tuning_stage_1 |
| sourceArtifacts.missionTimeComparison | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-mission-time-comparison-latest.json |
| sourceArtifacts.worldline | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-warp-worldline-proof-latest.json |
| method.decompositionModelId | fixed_shift_transport_plus_centerline_lapse_projection |
| method.approximationStatus | approximate |
| method.residualToleranceSeconds | 0.0001377559659171795 |
| lapseDial.centerlineAlpha | 0.7 |
| lapseDial.centerlineDtauDt | 0.7 |
| lapseDial.projectionSource | centerline_dtau_dt |
| lapseDial.projectionRatio | 0.7 |
| timing.interpretationStatus | bounded_relativistic_differential_detected |
| timing.warpCoordinateTimeSeconds | 137755965.9171795 |
| timing.warpProperTimeSeconds | 96429176.14202563 |
| timing.classicalReferenceTimeSeconds | 137755965.9171795 |
| timing.reportedProperMinusCoordinateSeconds | -41326789.77515386 |
| timing.reportedProperVsCoordinateRatio | 0.7 |
| decomposition.fixedShiftFamilyTransportContributionSeconds | 137755965.9171795 |
| decomposition.lapseProfileClockRateContributionSeconds | -41326789.77515385 |
| decomposition.residualUnexplainedContributionSeconds | -1.4901161193847656e-8 |
| decomposition.reconstructedProperTimeSeconds | 96429176.14202565 |
| decomposition.totalMissionTimeDifferentialSeconds | -41326789.77515386 |
| decomposition.lapseDialTrackedFraction | 0.9999999999999998 |

## Method Note
The fixed shift-family transport contribution is the bounded warp coordinate transport time. The lapse contribution is projected from the metric-derived centerline lapse dial, and any nonuniform or off-center clocking drift remains in the residual term.

## Reason Codes
- none

