# NHM2 Shift-Plus-Lapse Comparison Companion

- date: 2026-04-01
- comparisonId: nhm2_unit_lapse_vs_mild_shift_plus_lapse
- scenarioId: mild_cabin_gravity_reference
- LaneAStatus: unchanged
- baselineMetricSource: warp.metric.T00.natario_sdf.shift
- generalizedMetricSource: warp.metric.T00.nhm2.shift_lapse
- comparisonPrecisionPolicy: nhm2_shift_plus_lapse_comparison_precision_v1

## Precision Context

- baselinePrecisionContext: {"brickNumericType":"float32","companionNumericType":"none","mildLapseFidelityStatus":"brick_float32_direct","channelPrecisionPolicy":"brick_float32_direct","underResolutionDetected":false,"preferredCompanionSource":"brick_float32_direct","wallSafetySource":"brick_float32_direct"}
- generalizedPrecisionContext: {"brickNumericType":"float32","companionNumericType":"float64_analytic","mildLapseFidelityStatus":"mixed_source_prefer_analytic_for_underflow","channelPrecisionPolicy":"mixed_source_prefer_analytic_for_underflow","underResolutionDetected":true,"preferredCompanionSource":"analytic_lapse_summary_companion","wallSafetySource":"brick_float32_direct"}
- provenanceWarningsCount: 5
- nestedProvenanceNormalization: baseline directPipeline cabin observables now use unresolved_gravity_gradient when no analytic companion value is present.

## Cabin Gravity Comparison

| quantity | baseline | generalized | delta | units | baseline source | generalized source | mismatch |
| --- | --- | --- | --- | --- | --- | --- | --- |
| alphaCenterline | 1 | 1 | 0 | dimensionless | brick_float32_direct | brick_float32_direct | no |
| alphaGradientVec_m_inv | [0, 0, 0] | [0, 0, 5.4556848360991086e-17] | [0, 0, 5.4556848360991086e-17] | 1/m | brick_float32_direct | analytic_lapse_summary_companion | yes |
| centerline_dtau_dt | 1 | 1 | 0 | dimensionless | brick_float32_direct | brick_float32_direct | no |
| cabin_clock_split_fraction | 0 | 1.3639212090247773e-16 | 1.3639212090247773e-16 | dimensionless | brick_float32_direct | analytic_lapse_summary_companion | yes |
| cabin_clock_split_per_day_s | 0 | 1.1784279245974075e-11 | 1.1784279245974075e-11 | s/day | brick_float32_direct | analytic_lapse_summary_companion | yes |
| cabin_gravity_gradient_geom | 0 | 5.4556848360991086e-17 | 5.4556848360991086e-17 | 1/m | brick_float32_direct | analytic_lapse_summary_companion | yes |
| cabin_gravity_gradient_si | 0 | 4.903325 | 4.903325 | m/s^2 | brick_float32_direct | analytic_lapse_summary_companion | yes |

## Wall Safety Comparison

| quantity | baseline | generalized | delta | units | baseline source | generalized source | mismatch |
| --- | --- | --- | --- | --- | --- | --- | --- |
| betaOverAlphaMax | 0 | 2.2094750204371243e-17 | 2.2094750204371243e-17 | dimensionless | brick_float32_direct | brick_float32_direct | no |
| betaOutwardOverAlphaWallMax | 0 | 2.2094750204371243e-17 | 2.2094750204371243e-17 | dimensionless | brick_float32_direct | brick_float32_direct | no |
| wallHorizonMargin | 1 | 1 | 0 | dimensionless | brick_float32_direct | brick_float32_direct | no |

## Proof Policy Comparison

- authoritativeProofSurface: lane_a_eulerian_comoving_theta_minus_trk
- baselineBranchStatus: unit_lapse_baseline_unchanged
- generalizedBranchStatus: candidate_authoritative_family_transport_gate_controlled_not_claimed_here
- baselineFamilyAuthorityStatus: canonical_bounded_baseline_solve_family
- generalizedFamilyAuthorityStatus: candidate_authoritative_solve_family
- baselineTransportCertificationStatus: bounded_transport_proof_bearing_baseline
- generalizedTransportCertificationStatus: bounded_transport_fail_closed_reference_only
- note: This comparison companion does not supersede York proof semantics. It compares a candidate authoritative solve family in provenance/model-selection against the current bounded baseline while treating proof-bearing bounded transport admission for the generalized family as separately controlled by the authoritative shift-lapse transport-promotion gate, not claimed by this comparison surface.

## Provenance Warnings

- alphaGradientVec_m_inv: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_clock_split_fraction: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_clock_split_per_day_s: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_gravity_gradient_geom: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_gravity_gradient_si: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)

## Comparison Summary

- comparisonStatus: available
- crossCaseSourceMismatchCount: 5
- wallSafetySourceParity: yes
- cabinGravityUsesAnalyticCompanion: yes
- proofHierarchyUnchanged: yes
