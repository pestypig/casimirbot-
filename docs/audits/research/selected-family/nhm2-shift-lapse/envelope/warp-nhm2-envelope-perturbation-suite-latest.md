# NHM2 Envelope And Perturbation Suite (2026-04-23)

"This artifact records reproducible NHM2 envelope evidence over the selected nhm2_shift_lapse family. It names perturbation suites, preserves negative outcomes, and does not widen speed, viability, or ETA claims."

## Reproduce
- publicationCommand: `npm run warp:full-solve:nhm2-shift-lapse:publish-envelope-suite`
- family.metricT00Ref: `warp.metric.T00.nhm2.shift_lapse`
- family.shiftLapseProfileId: `stage1_centerline_alpha_0p995_v1`
- referenceTransportResultPath: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json`
- referenceProfileSweepPath: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/sweep/nhm2-shift-lapse-profile-sweep-latest.json`
- referenceBoundarySweepPath: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/nhm2-shift-lapse-boundary-sweep-latest.json`
- deterministicCaseOrder: true
- caseGenerationPolicyId: `nhm2_selected_family_envelope_v1`
- supportingCommands: `npm run warp:full-solve:nhm2-shift-lapse:publish-selected-transport -- --shift-lapse-profile-id stage1_centerline_alpha_0p995_v1`, `npm run warp:full-solve:nhm2-shift-lapse:publish-profile-sweep`, `npm run warp:full-solve:nhm2-shift-lapse:publish-boundary-sweep`
- checksum: `2b30392dba55b986714f7e65ce8df90f435bcd7d5ab6df2132dbfd509f72c6f0`

## Summary
| field | value |
|---|---|
| artifactId | nhm2_envelope_perturbation_suite |
| schemaVersion | nhm2_envelope_perturbation_suite/v1 |
| status | pass |
| completeness | complete |
| suiteCount | 4 |
| caseCount | 114 |
| pass | 114 |
| fail | 0 |
| review | 0 |
| unavailable | 0 |
| worstWallSafetyMargin | 1 |
| tightestSolverHealthClampHeadroom | 0 |

## Resolution Sensitivity

- suiteId: `resolution_sensitivity`
- axis: `resolution`
- referenceCaseId: `resolution_096`
- status: `pass`
- completeness: `complete`
- caseCount: `3`
- worstWallSafetyMargin: `1`
- tightestSolverHealthClampHeadroom: `0.01`
- missionTimeInterpretationStatuses: `bounded_relativistic_differential_detected`
- summary: Deterministic direct-GR brick reruns over the selected family with fixed selectors and varying brick resolution.

| caseId | label | status | completeness | perturbation | transport | lowExpansion | wallSafety | solverHealth | missionTime | wallSafetyMargin | solverClampHeadroom |
|---|---|---|---|---|---|---|---|---|---|---|---|
| resolution_064 | 64^3 coarse brick | pass | complete | 64 x 64 x 64 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0.01 |
| resolution_096 | 96^3 reference brick | pass | complete | 96 x 96 x 96 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0.01 |
| resolution_128 | 128^3 fine brick | pass | complete | 128 x 128 x 128 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0.01 |

## Boundary-Condition Sensitivity

- suiteId: `boundary_condition_sensitivity`
- axis: `boundary_condition`
- referenceCaseId: `boundary_clamp`
- status: `pass`
- completeness: `complete`
- caseCount: `3`
- worstWallSafetyMargin: `1`
- tightestSolverHealthClampHeadroom: `0.01`
- missionTimeInterpretationStatuses: `bounded_relativistic_differential_detected`
- summary: Deterministic direct-GR brick reruns over the selected family with the boundary mode perturbed while keeping the selected profile fixed.

| caseId | label | status | completeness | perturbation | transport | lowExpansion | wallSafety | solverHealth | missionTime | wallSafetyMargin | solverClampHeadroom |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boundary_clamp | Clamp boundary | pass | complete | Clamp | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0.01 |
| boundary_outflow | Outflow boundary | pass | complete | Outflow | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0.01 |
| boundary_sommerfeld | Sommerfeld boundary | pass | complete | Sommerfeld | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0.01 |

## Local Lapse-Profile Perturbations

- suiteId: `local_lapse_profile_perturbations`
- axis: `lapse_profile`
- referenceCaseId: `profile_stage1_centerline_alpha_0p995_v1`
- status: `pass`
- completeness: `complete`
- caseCount: `4`
- worstWallSafetyMargin: `1`
- tightestSolverHealthClampHeadroom: `0`
- missionTimeInterpretationStatuses: `bounded_relativistic_differential_detected`
- summary: Across the tested selected-family bracket, every tested profile remained gate-admitted and the bounded timing differential scales monotonically with the tuned centerline-alpha dial.

| caseId | label | status | completeness | perturbation | transport | lowExpansion | wallSafety | solverHealth | missionTime | wallSafetyMargin | solverClampHeadroom |
|---|---|---|---|---|---|---|---|---|---|---|---|
| profile_stage1_centerline_alpha_0p9975_v1 | Profile stage1_centerline_alpha_0p9975_v1 | pass | complete | stage1_centerline_alpha_0p9975_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| profile_stage1_centerline_alpha_0p995_v1 | Profile stage1_centerline_alpha_0p995_v1 | pass | complete | stage1_centerline_alpha_0p995_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| profile_stage1_centerline_alpha_0p9925_v1 | Profile stage1_centerline_alpha_0p9925_v1 | pass | complete | stage1_centerline_alpha_0p9925_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| profile_stage1_centerline_alpha_0p9900_v1 | Profile stage1_centerline_alpha_0p9900_v1 | pass | complete | stage1_centerline_alpha_0p9900_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |

## Stronger-Boundary Lapse Perturbations

- suiteId: `stronger_boundary_lapse_perturbations`
- axis: `lapse_profile`
- referenceCaseId: `stronger_stage1_centerline_alpha_0p9875_v1`
- status: `pass`
- completeness: `complete`
- caseCount: `104`
- worstWallSafetyMargin: `1`
- tightestSolverHealthClampHeadroom: `0`
- missionTimeInterpretationStatuses: `bounded_relativistic_differential_detected`
- summary: No first-failure boundary was reached within the tested stronger bracket. Through stage1_centerline_alpha_0p7300_v1, every tested stronger-side profile remained gate-admitted, and the bounded timing differential scales monotonic within the passing region. The current predefined exploration stop is stage1_centerline_alpha_0p7300_v1.

| caseId | label | status | completeness | perturbation | transport | lowExpansion | wallSafety | solverHealth | missionTime | wallSafetyMargin | solverClampHeadroom |
|---|---|---|---|---|---|---|---|---|---|---|---|
| stronger_stage1_centerline_alpha_0p9875_v1 | Stronger boundary stage1_centerline_alpha_0p9875_v1 | pass | complete | stage1_centerline_alpha_0p9875_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9850_v1 | Stronger boundary stage1_centerline_alpha_0p9850_v1 | pass | complete | stage1_centerline_alpha_0p9850_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9825_v1 | Stronger boundary stage1_centerline_alpha_0p9825_v1 | pass | complete | stage1_centerline_alpha_0p9825_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9800_v1 | Stronger boundary stage1_centerline_alpha_0p9800_v1 | pass | complete | stage1_centerline_alpha_0p9800_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9775_v1 | Stronger boundary stage1_centerline_alpha_0p9775_v1 | pass | complete | stage1_centerline_alpha_0p9775_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9750_v1 | Stronger boundary stage1_centerline_alpha_0p9750_v1 | pass | complete | stage1_centerline_alpha_0p9750_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9725_v1 | Stronger boundary stage1_centerline_alpha_0p9725_v1 | pass | complete | stage1_centerline_alpha_0p9725_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9700_v1 | Stronger boundary stage1_centerline_alpha_0p9700_v1 | pass | complete | stage1_centerline_alpha_0p9700_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9675_v1 | Stronger boundary stage1_centerline_alpha_0p9675_v1 | pass | complete | stage1_centerline_alpha_0p9675_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9650_v1 | Stronger boundary stage1_centerline_alpha_0p9650_v1 | pass | complete | stage1_centerline_alpha_0p9650_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9625_v1 | Stronger boundary stage1_centerline_alpha_0p9625_v1 | pass | complete | stage1_centerline_alpha_0p9625_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9600_v1 | Stronger boundary stage1_centerline_alpha_0p9600_v1 | pass | complete | stage1_centerline_alpha_0p9600_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9575_v1 | Stronger boundary stage1_centerline_alpha_0p9575_v1 | pass | complete | stage1_centerline_alpha_0p9575_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9550_v1 | Stronger boundary stage1_centerline_alpha_0p9550_v1 | pass | complete | stage1_centerline_alpha_0p9550_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9525_v1 | Stronger boundary stage1_centerline_alpha_0p9525_v1 | pass | complete | stage1_centerline_alpha_0p9525_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9500_v1 | Stronger boundary stage1_centerline_alpha_0p9500_v1 | pass | complete | stage1_centerline_alpha_0p9500_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9475_v1 | Stronger boundary stage1_centerline_alpha_0p9475_v1 | pass | complete | stage1_centerline_alpha_0p9475_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9450_v1 | Stronger boundary stage1_centerline_alpha_0p9450_v1 | pass | complete | stage1_centerline_alpha_0p9450_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9425_v1 | Stronger boundary stage1_centerline_alpha_0p9425_v1 | pass | complete | stage1_centerline_alpha_0p9425_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9400_v1 | Stronger boundary stage1_centerline_alpha_0p9400_v1 | pass | complete | stage1_centerline_alpha_0p9400_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9375_v1 | Stronger boundary stage1_centerline_alpha_0p9375_v1 | pass | complete | stage1_centerline_alpha_0p9375_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9350_v1 | Stronger boundary stage1_centerline_alpha_0p9350_v1 | pass | complete | stage1_centerline_alpha_0p9350_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9325_v1 | Stronger boundary stage1_centerline_alpha_0p9325_v1 | pass | complete | stage1_centerline_alpha_0p9325_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9300_v1 | Stronger boundary stage1_centerline_alpha_0p9300_v1 | pass | complete | stage1_centerline_alpha_0p9300_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9275_v1 | Stronger boundary stage1_centerline_alpha_0p9275_v1 | pass | complete | stage1_centerline_alpha_0p9275_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9250_v1 | Stronger boundary stage1_centerline_alpha_0p9250_v1 | pass | complete | stage1_centerline_alpha_0p9250_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9225_v1 | Stronger boundary stage1_centerline_alpha_0p9225_v1 | pass | complete | stage1_centerline_alpha_0p9225_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9200_v1 | Stronger boundary stage1_centerline_alpha_0p9200_v1 | pass | complete | stage1_centerline_alpha_0p9200_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9175_v1 | Stronger boundary stage1_centerline_alpha_0p9175_v1 | pass | complete | stage1_centerline_alpha_0p9175_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9150_v1 | Stronger boundary stage1_centerline_alpha_0p9150_v1 | pass | complete | stage1_centerline_alpha_0p9150_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9125_v1 | Stronger boundary stage1_centerline_alpha_0p9125_v1 | pass | complete | stage1_centerline_alpha_0p9125_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9100_v1 | Stronger boundary stage1_centerline_alpha_0p9100_v1 | pass | complete | stage1_centerline_alpha_0p9100_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9075_v1 | Stronger boundary stage1_centerline_alpha_0p9075_v1 | pass | complete | stage1_centerline_alpha_0p9075_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9050_v1 | Stronger boundary stage1_centerline_alpha_0p9050_v1 | pass | complete | stage1_centerline_alpha_0p9050_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9025_v1 | Stronger boundary stage1_centerline_alpha_0p9025_v1 | pass | complete | stage1_centerline_alpha_0p9025_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p9000_v1 | Stronger boundary stage1_centerline_alpha_0p9000_v1 | pass | complete | stage1_centerline_alpha_0p9000_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8975_v1 | Stronger boundary stage1_centerline_alpha_0p8975_v1 | pass | complete | stage1_centerline_alpha_0p8975_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8950_v1 | Stronger boundary stage1_centerline_alpha_0p8950_v1 | pass | complete | stage1_centerline_alpha_0p8950_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8925_v1 | Stronger boundary stage1_centerline_alpha_0p8925_v1 | pass | complete | stage1_centerline_alpha_0p8925_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8900_v1 | Stronger boundary stage1_centerline_alpha_0p8900_v1 | pass | complete | stage1_centerline_alpha_0p8900_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8875_v1 | Stronger boundary stage1_centerline_alpha_0p8875_v1 | pass | complete | stage1_centerline_alpha_0p8875_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8850_v1 | Stronger boundary stage1_centerline_alpha_0p8850_v1 | pass | complete | stage1_centerline_alpha_0p8850_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8825_v1 | Stronger boundary stage1_centerline_alpha_0p8825_v1 | pass | complete | stage1_centerline_alpha_0p8825_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8800_v1 | Stronger boundary stage1_centerline_alpha_0p8800_v1 | pass | complete | stage1_centerline_alpha_0p8800_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8775_v1 | Stronger boundary stage1_centerline_alpha_0p8775_v1 | pass | complete | stage1_centerline_alpha_0p8775_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8750_v1 | Stronger boundary stage1_centerline_alpha_0p8750_v1 | pass | complete | stage1_centerline_alpha_0p8750_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8725_v1 | Stronger boundary stage1_centerline_alpha_0p8725_v1 | pass | complete | stage1_centerline_alpha_0p8725_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8700_v1 | Stronger boundary stage1_centerline_alpha_0p8700_v1 | pass | complete | stage1_centerline_alpha_0p8700_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8675_v1 | Stronger boundary stage1_centerline_alpha_0p8675_v1 | pass | complete | stage1_centerline_alpha_0p8675_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8650_v1 | Stronger boundary stage1_centerline_alpha_0p8650_v1 | pass | complete | stage1_centerline_alpha_0p8650_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8625_v1 | Stronger boundary stage1_centerline_alpha_0p8625_v1 | pass | complete | stage1_centerline_alpha_0p8625_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8600_v1 | Stronger boundary stage1_centerline_alpha_0p8600_v1 | pass | complete | stage1_centerline_alpha_0p8600_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8575_v1 | Stronger boundary stage1_centerline_alpha_0p8575_v1 | pass | complete | stage1_centerline_alpha_0p8575_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8550_v1 | Stronger boundary stage1_centerline_alpha_0p8550_v1 | pass | complete | stage1_centerline_alpha_0p8550_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8525_v1 | Stronger boundary stage1_centerline_alpha_0p8525_v1 | pass | complete | stage1_centerline_alpha_0p8525_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8500_v1 | Stronger boundary stage1_centerline_alpha_0p8500_v1 | pass | complete | stage1_centerline_alpha_0p8500_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8475_v1 | Stronger boundary stage1_centerline_alpha_0p8475_v1 | pass | complete | stage1_centerline_alpha_0p8475_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8450_v1 | Stronger boundary stage1_centerline_alpha_0p8450_v1 | pass | complete | stage1_centerline_alpha_0p8450_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8425_v1 | Stronger boundary stage1_centerline_alpha_0p8425_v1 | pass | complete | stage1_centerline_alpha_0p8425_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8400_v1 | Stronger boundary stage1_centerline_alpha_0p8400_v1 | pass | complete | stage1_centerline_alpha_0p8400_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8375_v1 | Stronger boundary stage1_centerline_alpha_0p8375_v1 | pass | complete | stage1_centerline_alpha_0p8375_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8350_v1 | Stronger boundary stage1_centerline_alpha_0p8350_v1 | pass | complete | stage1_centerline_alpha_0p8350_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8325_v1 | Stronger boundary stage1_centerline_alpha_0p8325_v1 | pass | complete | stage1_centerline_alpha_0p8325_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8300_v1 | Stronger boundary stage1_centerline_alpha_0p8300_v1 | pass | complete | stage1_centerline_alpha_0p8300_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8275_v1 | Stronger boundary stage1_centerline_alpha_0p8275_v1 | pass | complete | stage1_centerline_alpha_0p8275_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8250_v1 | Stronger boundary stage1_centerline_alpha_0p8250_v1 | pass | complete | stage1_centerline_alpha_0p8250_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8225_v1 | Stronger boundary stage1_centerline_alpha_0p8225_v1 | pass | complete | stage1_centerline_alpha_0p8225_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8200_v1 | Stronger boundary stage1_centerline_alpha_0p8200_v1 | pass | complete | stage1_centerline_alpha_0p8200_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8175_v1 | Stronger boundary stage1_centerline_alpha_0p8175_v1 | pass | complete | stage1_centerline_alpha_0p8175_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8150_v1 | Stronger boundary stage1_centerline_alpha_0p8150_v1 | pass | complete | stage1_centerline_alpha_0p8150_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8125_v1 | Stronger boundary stage1_centerline_alpha_0p8125_v1 | pass | complete | stage1_centerline_alpha_0p8125_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8100_v1 | Stronger boundary stage1_centerline_alpha_0p8100_v1 | pass | complete | stage1_centerline_alpha_0p8100_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8075_v1 | Stronger boundary stage1_centerline_alpha_0p8075_v1 | pass | complete | stage1_centerline_alpha_0p8075_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8050_v1 | Stronger boundary stage1_centerline_alpha_0p8050_v1 | pass | complete | stage1_centerline_alpha_0p8050_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8025_v1 | Stronger boundary stage1_centerline_alpha_0p8025_v1 | pass | complete | stage1_centerline_alpha_0p8025_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p8000_v1 | Stronger boundary stage1_centerline_alpha_0p8000_v1 | pass | complete | stage1_centerline_alpha_0p8000_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7975_v1 | Stronger boundary stage1_centerline_alpha_0p7975_v1 | pass | complete | stage1_centerline_alpha_0p7975_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7950_v1 | Stronger boundary stage1_centerline_alpha_0p7950_v1 | pass | complete | stage1_centerline_alpha_0p7950_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7925_v1 | Stronger boundary stage1_centerline_alpha_0p7925_v1 | pass | complete | stage1_centerline_alpha_0p7925_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7900_v1 | Stronger boundary stage1_centerline_alpha_0p7900_v1 | pass | complete | stage1_centerline_alpha_0p7900_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7875_v1 | Stronger boundary stage1_centerline_alpha_0p7875_v1 | pass | complete | stage1_centerline_alpha_0p7875_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7850_v1 | Stronger boundary stage1_centerline_alpha_0p7850_v1 | pass | complete | stage1_centerline_alpha_0p7850_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7825_v1 | Stronger boundary stage1_centerline_alpha_0p7825_v1 | pass | complete | stage1_centerline_alpha_0p7825_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7800_v1 | Stronger boundary stage1_centerline_alpha_0p7800_v1 | pass | complete | stage1_centerline_alpha_0p7800_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7775_v1 | Stronger boundary stage1_centerline_alpha_0p7775_v1 | pass | complete | stage1_centerline_alpha_0p7775_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7750_v1 | Stronger boundary stage1_centerline_alpha_0p7750_v1 | pass | complete | stage1_centerline_alpha_0p7750_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7725_v1 | Stronger boundary stage1_centerline_alpha_0p7725_v1 | pass | complete | stage1_centerline_alpha_0p7725_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7700_v1 | Stronger boundary stage1_centerline_alpha_0p7700_v1 | pass | complete | stage1_centerline_alpha_0p7700_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7675_v1 | Stronger boundary stage1_centerline_alpha_0p7675_v1 | pass | complete | stage1_centerline_alpha_0p7675_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7650_v1 | Stronger boundary stage1_centerline_alpha_0p7650_v1 | pass | complete | stage1_centerline_alpha_0p7650_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7625_v1 | Stronger boundary stage1_centerline_alpha_0p7625_v1 | pass | complete | stage1_centerline_alpha_0p7625_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7600_v1 | Stronger boundary stage1_centerline_alpha_0p7600_v1 | pass | complete | stage1_centerline_alpha_0p7600_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7575_v1 | Stronger boundary stage1_centerline_alpha_0p7575_v1 | pass | complete | stage1_centerline_alpha_0p7575_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7550_v1 | Stronger boundary stage1_centerline_alpha_0p7550_v1 | pass | complete | stage1_centerline_alpha_0p7550_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7525_v1 | Stronger boundary stage1_centerline_alpha_0p7525_v1 | pass | complete | stage1_centerline_alpha_0p7525_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7500_v1 | Stronger boundary stage1_centerline_alpha_0p7500_v1 | pass | complete | stage1_centerline_alpha_0p7500_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7475_v1 | Stronger boundary stage1_centerline_alpha_0p7475_v1 | pass | complete | stage1_centerline_alpha_0p7475_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7450_v1 | Stronger boundary stage1_centerline_alpha_0p7450_v1 | pass | complete | stage1_centerline_alpha_0p7450_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7425_v1 | Stronger boundary stage1_centerline_alpha_0p7425_v1 | pass | complete | stage1_centerline_alpha_0p7425_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7400_v1 | Stronger boundary stage1_centerline_alpha_0p7400_v1 | pass | complete | stage1_centerline_alpha_0p7400_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7375_v1 | Stronger boundary stage1_centerline_alpha_0p7375_v1 | pass | complete | stage1_centerline_alpha_0p7375_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7350_v1 | Stronger boundary stage1_centerline_alpha_0p7350_v1 | pass | complete | stage1_centerline_alpha_0p7350_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7325_v1 | Stronger boundary stage1_centerline_alpha_0p7325_v1 | pass | complete | stage1_centerline_alpha_0p7325_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |
| stronger_stage1_centerline_alpha_0p7300_v1 | Stronger boundary stage1_centerline_alpha_0p7300_v1 | pass | complete | stage1_centerline_alpha_0p7300_v1 | bounded_transport_proof_bearing_gate_admitted | pass | pass | CERTIFIED | bounded_relativistic_differential_detected | 1 | 0 |

## Non-Claims
- does not widen speed claims
- does not widen ETA claims
- does not widen viability claims
- negative and incomplete perturbation cases remain first-class evidence

