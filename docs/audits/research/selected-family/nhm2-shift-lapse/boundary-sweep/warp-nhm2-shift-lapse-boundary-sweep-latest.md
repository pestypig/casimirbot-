# NHM2 Shift+Lapse Stronger-Side Boundary Sweep (2026-04-06)

"This artifact records a small stronger-side boundary sweep beyond the locally robust nhm2_shift_lapse selected-family bracket. It does not replace canonical baseline latest aliases and does not widen speed, ETA, viability, gravity, or horizon claims."

## Reproduce
- publicationCommand: `npm run warp:full-solve:nhm2-shift-lapse:publish-boundary-sweep`
- referenceSelectedFamilyResultJson: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json`
- referenceSelectedFamilyResultMd: `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-shift-lapse-transport-result-latest.md`
- localRobustnessSweepJson: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/sweep/nhm2-shift-lapse-profile-sweep-latest.json`
- localRobustnessSweepMd: `docs/audits/research/selected-family/nhm2-shift-lapse/sweep/warp-nhm2-shift-lapse-profile-sweep-latest.md`
- boundaryProfileIds: `stage1_centerline_alpha_0p9875_v1`, `stage1_centerline_alpha_0p9850_v1`, `stage1_centerline_alpha_0p9825_v1`, `stage1_centerline_alpha_0p9800_v1`, `stage1_centerline_alpha_0p9775_v1`, `stage1_centerline_alpha_0p9750_v1`, `stage1_centerline_alpha_0p9725_v1`, `stage1_centerline_alpha_0p9700_v1`, `stage1_centerline_alpha_0p9675_v1`, `stage1_centerline_alpha_0p9650_v1`, `stage1_centerline_alpha_0p9625_v1`, `stage1_centerline_alpha_0p9600_v1`, `stage1_centerline_alpha_0p9575_v1`, `stage1_centerline_alpha_0p9550_v1`, `stage1_centerline_alpha_0p9525_v1`, `stage1_centerline_alpha_0p9500_v1`, `stage1_centerline_alpha_0p9475_v1`, `stage1_centerline_alpha_0p9450_v1`, `stage1_centerline_alpha_0p9425_v1`, `stage1_centerline_alpha_0p9400_v1`, `stage1_centerline_alpha_0p9375_v1`, `stage1_centerline_alpha_0p9350_v1`, `stage1_centerline_alpha_0p9325_v1`, `stage1_centerline_alpha_0p9300_v1`, `stage1_centerline_alpha_0p9275_v1`, `stage1_centerline_alpha_0p9250_v1`, `stage1_centerline_alpha_0p9225_v1`, `stage1_centerline_alpha_0p9200_v1`, `stage1_centerline_alpha_0p9175_v1`, `stage1_centerline_alpha_0p9150_v1`, `stage1_centerline_alpha_0p9125_v1`, `stage1_centerline_alpha_0p9100_v1`, `stage1_centerline_alpha_0p9075_v1`, `stage1_centerline_alpha_0p9050_v1`, `stage1_centerline_alpha_0p9025_v1`, `stage1_centerline_alpha_0p9000_v1`, `stage1_centerline_alpha_0p8975_v1`, `stage1_centerline_alpha_0p8950_v1`, `stage1_centerline_alpha_0p8925_v1`, `stage1_centerline_alpha_0p8900_v1`, `stage1_centerline_alpha_0p8875_v1`, `stage1_centerline_alpha_0p8850_v1`, `stage1_centerline_alpha_0p8825_v1`, `stage1_centerline_alpha_0p8800_v1`, `stage1_centerline_alpha_0p8775_v1`, `stage1_centerline_alpha_0p8750_v1`, `stage1_centerline_alpha_0p8725_v1`, `stage1_centerline_alpha_0p8700_v1`, `stage1_centerline_alpha_0p8675_v1`, `stage1_centerline_alpha_0p8650_v1`, `stage1_centerline_alpha_0p8625_v1`, `stage1_centerline_alpha_0p8600_v1`, `stage1_centerline_alpha_0p8575_v1`, `stage1_centerline_alpha_0p8550_v1`, `stage1_centerline_alpha_0p8525_v1`, `stage1_centerline_alpha_0p8500_v1`, `stage1_centerline_alpha_0p8475_v1`, `stage1_centerline_alpha_0p8450_v1`, `stage1_centerline_alpha_0p8425_v1`, `stage1_centerline_alpha_0p8400_v1`, `stage1_centerline_alpha_0p8375_v1`, `stage1_centerline_alpha_0p8350_v1`, `stage1_centerline_alpha_0p8325_v1`, `stage1_centerline_alpha_0p8300_v1`, `stage1_centerline_alpha_0p8275_v1`, `stage1_centerline_alpha_0p8250_v1`, `stage1_centerline_alpha_0p8225_v1`, `stage1_centerline_alpha_0p8200_v1`, `stage1_centerline_alpha_0p8175_v1`, `stage1_centerline_alpha_0p8150_v1`, `stage1_centerline_alpha_0p8125_v1`, `stage1_centerline_alpha_0p8100_v1`, `stage1_centerline_alpha_0p8075_v1`, `stage1_centerline_alpha_0p8050_v1`, `stage1_centerline_alpha_0p8025_v1`, `stage1_centerline_alpha_0p8000_v1`, `stage1_centerline_alpha_0p7975_v1`, `stage1_centerline_alpha_0p7950_v1`, `stage1_centerline_alpha_0p7925_v1`, `stage1_centerline_alpha_0p7900_v1`, `stage1_centerline_alpha_0p7875_v1`, `stage1_centerline_alpha_0p7850_v1`, `stage1_centerline_alpha_0p7825_v1`, `stage1_centerline_alpha_0p7800_v1`, `stage1_centerline_alpha_0p7775_v1`, `stage1_centerline_alpha_0p7750_v1`, `stage1_centerline_alpha_0p7725_v1`, `stage1_centerline_alpha_0p7700_v1`, `stage1_centerline_alpha_0p7675_v1`, `stage1_centerline_alpha_0p7650_v1`, `stage1_centerline_alpha_0p7625_v1`, `stage1_centerline_alpha_0p7600_v1`
- testedStrongerBracketStopProfileId: `stage1_centerline_alpha_0p7600_v1`
- testedStrongerBracketStopCenterlineAlpha: `0.76`
- canonicalBaselineMetricT00Ref: `warp.metric.T00.natario_sdf.shift`
- canonicalBaselineLatestAliasesChanged: false

## Boundary Result
- strongestProfileKeepingAllGatesPassing: `stage1_centerline_alpha_0p7600_v1`
- firstGateFailure: `null`
- firstFailedGate: `null`
- firstGateFailureReason: `null`
- failureBoundaryStatus: `no_failure_reached_within_tested_stronger_bracket`
- scalingStatusWithinPassingRegion: `monotonic`
- marginFromReferenceProfile: No first-failure boundary was reached within the tested stronger bracket. Relative to stage1_centerline_alpha_0p995_v1, the tested stronger-side passing margin extends through stage1_centerline_alpha_0p7600_v1.
- marginFromStrongestPassingProfile: No first-failure boundary was reached beyond stage1_centerline_alpha_0p7600_v1 within the tested stronger bracket.
- boundarySummary: No first-failure boundary was reached within the tested stronger bracket. Through stage1_centerline_alpha_0p7600_v1, every tested stronger-side profile remained gate-admitted, and the bounded timing differential scales monotonic within the passing region. The current predefined exploration stop is stage1_centerline_alpha_0p7600_v1.

## Trend Summary
- timingDifferentialTrend: `growing_monotonically_within_tested_bracket`
- lowExpansionUsageTrend: `flat_within_tested_bracket`
- wallSafetyUsageTrend: `flat_within_tested_bracket`
- lowExpansionHeadroomTrend: `flat_within_tested_bracket`
- wallSafetyHeadroomTrend: `flat_within_tested_bracket`
- mostLikelyFirstFailureGate: `unresolved_within_tested_bracket`
- effectVsHeadroomInterpretation: The bounded timing differential grows monotonically within the tested stronger-side bracket while low-expansion threshold usage remains flat and wall-safety threshold usage remains flat within the tested bracket. Raw headroom signals remain flat within the tested bracket.

## Threshold Usage Summary
- lowExpansionDivergenceUsage (divergenceRms/divergenceTolerance): `0`
- lowExpansionThetaKUsage (thetaKResidualAbs/thetaKTolerance): `0`
- lowExpansionWorstUsage: `0`
- lowExpansionWorstMargin: `0.001`
- wallSafetyBetaUsage (max(betaOverAlphaMax, betaOutwardOverAlphaWallMax)): `2.9072040107399763e-17`
- wallSafetyBetaMargin: `1`
- wallSafetyHorizonMargin: `1`
- wallSafetyWorstUsage: `2.9072040107399763e-17`
- wallSafetyWorstMargin: `1`

## Per-Profile Results
| shiftLapseProfileId | transportCertificationStatus | promotionGateStatus | authoritativeLowExpansionStatus | wallSafetyStatus | centerlineAlpha | centerlineDtauDt | missionTimeInterpretationStatus | properMinusCoordinate_seconds | boundedTimingDifferentialDetected |
|---|---|---|---|---|---|---|---|---|---|
| stage1_centerline_alpha_0p9875_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9875 | 0.9875 | bounded_relativistic_differential_detected | -1721949.5739647448 | true |
| stage1_centerline_alpha_0p9850_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.985 | 0.985 | bounded_relativistic_differential_detected | -2066339.4887576997 | true |
| stage1_centerline_alpha_0p9825_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9825 | 0.9825 | bounded_relativistic_differential_detected | -2410729.4035506546 | true |
| stage1_centerline_alpha_0p9800_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.98 | 0.98 | bounded_relativistic_differential_detected | -2755119.3183436096 | true |
| stage1_centerline_alpha_0p9775_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9775 | 0.9775 | bounded_relativistic_differential_detected | -3099509.2331365347 | true |
| stage1_centerline_alpha_0p9750_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.975 | 0.975 | bounded_relativistic_differential_detected | -3443899.1479294896 | true |
| stage1_centerline_alpha_0p9725_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9725 | 0.9725 | bounded_relativistic_differential_detected | -3788289.0627224296 | true |
| stage1_centerline_alpha_0p9700_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.97 | 0.97 | bounded_relativistic_differential_detected | -4132678.9775153697 | true |
| stage1_centerline_alpha_0p9675_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9675 | 0.9675 | bounded_relativistic_differential_detected | -4477068.892308325 | true |
| stage1_centerline_alpha_0p9650_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.965 | 0.965 | bounded_relativistic_differential_detected | -4821458.807101294 | true |
| stage1_centerline_alpha_0p9625_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9625 | 0.9625 | bounded_relativistic_differential_detected | -5165848.721894249 | true |
| stage1_centerline_alpha_0p9600_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.96 | 0.96 | bounded_relativistic_differential_detected | -5510238.636687174 | true |
| stage1_centerline_alpha_0p9575_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9575 | 0.9575 | bounded_relativistic_differential_detected | -5854628.551480129 | true |
| stage1_centerline_alpha_0p9550_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.955 | 0.955 | bounded_relativistic_differential_detected | -6199018.466273084 | true |
| stage1_centerline_alpha_0p9525_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9525 | 0.9525 | bounded_relativistic_differential_detected | -6543408.381066024 | true |
| stage1_centerline_alpha_0p9500_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.95 | 0.95 | bounded_relativistic_differential_detected | -6887798.295858979 | true |
| stage1_centerline_alpha_0p9475_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9475 | 0.9475 | bounded_relativistic_differential_detected | -7232188.210651889 | true |
| stage1_centerline_alpha_0p9450_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.945 | 0.945 | bounded_relativistic_differential_detected | -7576578.125444874 | true |
| stage1_centerline_alpha_0p9425_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9425 | 0.9425 | bounded_relativistic_differential_detected | -7920968.040237829 | true |
| stage1_centerline_alpha_0p9400_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.94 | 0.94 | bounded_relativistic_differential_detected | -8265357.955030784 | true |
| stage1_centerline_alpha_0p9375_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9375 | 0.9375 | bounded_relativistic_differential_detected | -8609747.86982371 | true |
| stage1_centerline_alpha_0p9350_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.935 | 0.935 | bounded_relativistic_differential_detected | -8954137.784616664 | true |
| stage1_centerline_alpha_0p9325_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9325 | 0.9325 | bounded_relativistic_differential_detected | -9298527.699409634 | true |
| stage1_centerline_alpha_0p9300_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.93 | 0.93 | bounded_relativistic_differential_detected | -9642917.614202559 | true |
| stage1_centerline_alpha_0p9275_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9275 | 0.9275 | bounded_relativistic_differential_detected | -9987307.528995499 | true |
| stage1_centerline_alpha_0p9250_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.925 | 0.925 | bounded_relativistic_differential_detected | -10331697.443788469 | true |
| stage1_centerline_alpha_0p9225_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9225 | 0.9225 | bounded_relativistic_differential_detected | -10676087.358581409 | true |
| stage1_centerline_alpha_0p9200_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.92 | 0.92 | bounded_relativistic_differential_detected | -11020477.273374364 | true |
| stage1_centerline_alpha_0p9175_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9175 | 0.9175 | bounded_relativistic_differential_detected | -11364867.188167304 | true |
| stage1_centerline_alpha_0p9150_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.915 | 0.915 | bounded_relativistic_differential_detected | -11709257.102960229 | true |
| stage1_centerline_alpha_0p9125_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9125 | 0.9125 | bounded_relativistic_differential_detected | -12053647.017753214 | true |
| stage1_centerline_alpha_0p9100_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.91 | 0.91 | bounded_relativistic_differential_detected | -12398036.932546169 | true |
| stage1_centerline_alpha_0p9075_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9075 | 0.9075 | bounded_relativistic_differential_detected | -12742426.847339094 | true |
| stage1_centerline_alpha_0p9050_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.905 | 0.905 | bounded_relativistic_differential_detected | -13086816.762132049 | true |
| stage1_centerline_alpha_0p9025_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9025 | 0.9025 | bounded_relativistic_differential_detected | -13431206.676925004 | true |
| stage1_centerline_alpha_0p9000_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.9 | 0.9 | bounded_relativistic_differential_detected | -13775596.591717929 | true |
| stage1_centerline_alpha_0p8975_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8975 | 0.8975 | bounded_relativistic_differential_detected | -14119986.506510898 | true |
| stage1_centerline_alpha_0p8950_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.895 | 0.895 | bounded_relativistic_differential_detected | -14464376.421303853 | true |
| stage1_centerline_alpha_0p8925_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8925 | 0.8925 | bounded_relativistic_differential_detected | -14808766.336096808 | true |
| stage1_centerline_alpha_0p8900_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.89 | 0.89 | bounded_relativistic_differential_detected | -15153156.250889748 | true |
| stage1_centerline_alpha_0p8875_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8875 | 0.8875 | bounded_relativistic_differential_detected | -15497546.165682703 | true |
| stage1_centerline_alpha_0p8850_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.885 | 0.885 | bounded_relativistic_differential_detected | -15841936.080475628 | true |
| stage1_centerline_alpha_0p8825_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8825 | 0.8825 | bounded_relativistic_differential_detected | -16186325.995268583 | true |
| stage1_centerline_alpha_0p8800_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.88 | 0.88 | bounded_relativistic_differential_detected | -16530715.910061538 | true |
| stage1_centerline_alpha_0p8775_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8775 | 0.8775 | bounded_relativistic_differential_detected | -16875105.824854508 | true |
| stage1_centerline_alpha_0p8750_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.875 | 0.875 | bounded_relativistic_differential_detected | -17219495.739647433 | true |
| stage1_centerline_alpha_0p8725_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8725 | 0.8725 | bounded_relativistic_differential_detected | -17563885.654440388 | true |
| stage1_centerline_alpha_0p8700_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.87 | 0.87 | bounded_relativistic_differential_detected | -17908275.569233313 | true |
| stage1_centerline_alpha_0p8675_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8675 | 0.8675 | bounded_relativistic_differential_detected | -18252665.484026268 | true |
| stage1_centerline_alpha_0p8650_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.865 | 0.865 | bounded_relativistic_differential_detected | -18597055.398819238 | true |
| stage1_centerline_alpha_0p8625_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8625 | 0.8625 | bounded_relativistic_differential_detected | -18941445.313612178 | true |
| stage1_centerline_alpha_0p8600_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.86 | 0.86 | bounded_relativistic_differential_detected | -19285835.228405133 | true |
| stage1_centerline_alpha_0p8575_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8575 | 0.8575 | bounded_relativistic_differential_detected | -19630225.143198073 | true |
| stage1_centerline_alpha_0p8550_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.855 | 0.855 | bounded_relativistic_differential_detected | -19974615.057991028 | true |
| stage1_centerline_alpha_0p8525_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8525 | 0.8525 | bounded_relativistic_differential_detected | -20319004.972783968 | true |
| stage1_centerline_alpha_0p8500_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.85 | 0.85 | bounded_relativistic_differential_detected | -20663394.887576923 | true |
| stage1_centerline_alpha_0p8475_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8475 | 0.8475 | bounded_relativistic_differential_detected | -21007784.802369863 | true |
| stage1_centerline_alpha_0p8450_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.845 | 0.845 | bounded_relativistic_differential_detected | -21352174.717162848 | true |
| stage1_centerline_alpha_0p8425_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8425 | 0.8425 | bounded_relativistic_differential_detected | -21696564.631955773 | true |
| stage1_centerline_alpha_0p8400_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.84 | 0.84 | bounded_relativistic_differential_detected | -22040954.546748728 | true |
| stage1_centerline_alpha_0p8375_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8375 | 0.8375 | bounded_relativistic_differential_detected | -22385344.461541653 | true |
| stage1_centerline_alpha_0p8350_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.835 | 0.835 | bounded_relativistic_differential_detected | -22729734.376334623 | true |
| stage1_centerline_alpha_0p8325_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8325 | 0.8325 | bounded_relativistic_differential_detected | -23074124.291127577 | true |
| stage1_centerline_alpha_0p8300_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.83 | 0.83 | bounded_relativistic_differential_detected | -23418514.205920532 | true |
| stage1_centerline_alpha_0p8275_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8275 | 0.8275 | bounded_relativistic_differential_detected | -23762904.120713443 | true |
| stage1_centerline_alpha_0p8250_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.825 | 0.825 | bounded_relativistic_differential_detected | -24107294.035506412 | true |
| stage1_centerline_alpha_0p8225_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8225 | 0.8225 | bounded_relativistic_differential_detected | -24451683.950299352 | true |
| stage1_centerline_alpha_0p8200_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.82 | 0.82 | bounded_relativistic_differential_detected | -24796073.865092322 | true |
| stage1_centerline_alpha_0p8175_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8175 | 0.8175 | bounded_relativistic_differential_detected | -25140463.779885262 | true |
| stage1_centerline_alpha_0p8150_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.815 | 0.815 | bounded_relativistic_differential_detected | -25484853.694678232 | true |
| stage1_centerline_alpha_0p8125_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8125 | 0.8125 | bounded_relativistic_differential_detected | -25829243.609471157 | true |
| stage1_centerline_alpha_0p8100_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.81 | 0.81 | bounded_relativistic_differential_detected | -26173633.524264097 | true |
| stage1_centerline_alpha_0p8075_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8075 | 0.8075 | bounded_relativistic_differential_detected | -26518023.439057067 | true |
| stage1_centerline_alpha_0p8050_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.805 | 0.805 | bounded_relativistic_differential_detected | -26862413.353849992 | true |
| stage1_centerline_alpha_0p8025_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8025 | 0.8025 | bounded_relativistic_differential_detected | -27206803.268642947 | true |
| stage1_centerline_alpha_0p8000_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.8 | 0.8 | bounded_relativistic_differential_detected | -27551193.183435917 | true |
| stage1_centerline_alpha_0p7975_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7975 | 0.7975 | bounded_relativistic_differential_detected | -27895583.098228857 | true |
| stage1_centerline_alpha_0p7950_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.795 | 0.795 | bounded_relativistic_differential_detected | -28239973.01302181 | true |
| stage1_centerline_alpha_0p7925_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7925 | 0.7925 | bounded_relativistic_differential_detected | -28584362.927814752 | true |
| stage1_centerline_alpha_0p7900_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.79 | 0.79 | bounded_relativistic_differential_detected | -28928752.842607692 | true |
| stage1_centerline_alpha_0p7875_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7875 | 0.7875 | bounded_relativistic_differential_detected | -29273142.757400647 | true |
| stage1_centerline_alpha_0p7850_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.785 | 0.785 | bounded_relativistic_differential_detected | -29617532.672193572 | true |
| stage1_centerline_alpha_0p7825_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7825 | 0.7825 | bounded_relativistic_differential_detected | -29961922.58698654 | true |
| stage1_centerline_alpha_0p7800_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.78 | 0.78 | bounded_relativistic_differential_detected | -30306312.501779497 | true |
| stage1_centerline_alpha_0p7775_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7775 | 0.7775 | bounded_relativistic_differential_detected | -30650702.41657245 | true |
| stage1_centerline_alpha_0p7750_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.775 | 0.775 | bounded_relativistic_differential_detected | -30995092.33136539 | true |
| stage1_centerline_alpha_0p7725_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7725 | 0.7725 | bounded_relativistic_differential_detected | -31339482.24615833 | true |
| stage1_centerline_alpha_0p7700_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.77 | 0.77 | bounded_relativistic_differential_detected | -31683872.160951287 | true |
| stage1_centerline_alpha_0p7675_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7675 | 0.7675 | bounded_relativistic_differential_detected | -32028262.075744227 | true |
| stage1_centerline_alpha_0p7650_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.765 | 0.765 | bounded_relativistic_differential_detected | -32372651.990537167 | true |
| stage1_centerline_alpha_0p7625_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.7625 | 0.7625 | bounded_relativistic_differential_detected | -32717041.90533015 | true |
| stage1_centerline_alpha_0p7600_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | pass | 0.76 | 0.76 | bounded_relativistic_differential_detected | -33061431.820123076 | true |

## Headroom Indicators
| shiftLapseProfileId | divergenceRms | divergenceTolerance | thetaKResidualAbs | thetaKTolerance | betaOutwardOverAlphaWallMax | wallHorizonMargin |
|---|---|---|---|---|---|---|
| stage1_centerline_alpha_0p9875_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9850_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9825_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9800_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9775_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9750_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9725_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9700_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9675_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9650_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9625_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9600_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9575_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9550_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9525_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9500_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9475_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9450_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9425_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9400_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9375_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9350_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9325_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9300_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9275_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9250_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9225_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9200_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9175_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9150_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9125_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9100_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9075_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9050_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9025_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p9000_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8975_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8950_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8925_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8900_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8875_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8850_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8825_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8800_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8775_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8750_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8725_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8700_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8675_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8650_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8625_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8600_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8575_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8550_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8525_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8500_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8475_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8450_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8425_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8400_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8375_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8350_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8325_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8300_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8275_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8250_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8225_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8200_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8175_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8150_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8125_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8100_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8075_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8050_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8025_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p8000_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7975_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7950_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7925_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7900_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7875_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7850_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7825_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7800_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7775_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7750_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7725_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7700_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7675_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7650_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7625_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |
| stage1_centerline_alpha_0p7600_v1 | 0 | 0.001 | 0 | 0.001 | 2.2094750204371243e-17 | 1 |

## Non-Claims
- does not replace the canonical baseline latest aliases
- does not certify speed or ETA
- does not widen viability claims
- does not convert wall-safety guardrails into a theorem-level horizon claim
- does not widen source/mechanism authority

