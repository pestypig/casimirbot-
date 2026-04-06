# NHM2 Warp Worldline Proof (2026-04-06)

"This artifact records a bounded solve-backed NHM2 warp worldline contract for local-comoving transport diagnostics. It does not certify route time, mission time, speed, or viability."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_warp_worldline_proof/v1 |
| contractVersion | warp_worldline_contract/v1 |
| status | bounded_solve_backed |
| certified | true |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| metricT00Ref | warp.metric.T00.nhm2.shift_lapse |
| metricFamily | nhm2_shift_lapse |
| familyAuthorityStatus | candidate_authoritative_solve_family |
| transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| shiftLapseTransportPromotionGateStatus | pass |
| shiftLapseTransportPromotionGateReason | shift_lapse_transport_promotion_gate_pass |
| shiftLapseAuthoritativeLowExpansionStatus | pass |
| shiftLapseWallSafetyStatus | pass |
| shiftLapseTimingStatus | available |
| shiftLapseCenterlineAlpha | 0.865 |
| shiftLapseCenterlineDtauDt | 0.865 |
| chart | comoving_cartesian |
| coordinateMap | bubble-centered coordinates |
| observerFamily | ship_centerline_local_comoving |
| timeCoordinateName | t |
| positionCoordinates | x,y,z |
| validityRegimeId | nhm2_local_comoving_shell_cross |
| representativeSampleId | centerline_center |
| sampleGeometryFamilyId | nhm2_centerline_shell_cross |
| sampleGeometryOrdering | centerline_aft,centerline_center,centerline_fore,shell_aft,shell_fore,shell_port,shell_starboard,shell_dorsal,shell_ventral |
| sampleGeometryCenterlineAxis | 1,0,0 |
| sampleGeometryPortStarboardAxis | 0,1,0 |
| sampleGeometryDorsalVentralAxis | 0,0,1 |
| sampleGeometryCenterlineOffset_m | 251.75 |
| sampleGeometryShellLongitudinalOffset_m | 503.4600276722667 |
| sampleGeometryShellTransverseOffset_m | 131.96002767226668 |
| sampleGeometryShellVerticalOffset_m | 86.46002767226666 |
| sampleGeometryShellClearance_m | 0.039972327733333333 |
| sampleCount | 9 |
| dtau_dt_representative | 0.865 |
| dtau_dt_min | 0.865 |
| dtau_dt_max | 0.865 |
| normalizationResidual_maxAbs | 0 |
| normalizationTolerance | 1e-9 |
| sourceAuditArtifactPath | artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json |
| transportInterpretation | bounded_local_comoving_descriptor_not_speed |
| transportVariationStatus | descriptor_varied_dtau_flat |
| transportInformativenessStatus | descriptor_informative_local_only |
| sampleFamilyAdequacy | adequate_for_bounded_cruise_preflight |
| flatnessInterpretation | The bounded local-comoving family exposes solve-backed local shift variation, but the low-g bounded regime keeps dtau_dt numerically flat. This is informative for bounded transport differentiation only, not for route-time or speed claims. |
| certifiedTransportMeaning | bounded_local_shift_descriptor_gradient_only |
| eligibleNextProducts | bounded_cruise_envelope_preflight |
| nextRequiredUpgrade | route_time_worldline_extension_after_bounded_cruise_preflight |
| certifiedSpeedMeaning | false |

## Samples
| sampleId | sampleRole | sourceModel | transportProvenance | coordinateTime_s | position_m | coordinateVelocity | betaCoord | effectiveTransportVelocityCoord | dtau_dt | normalizationResidual |
|---|---|---|---|---:|---|---|---|---|---:|---:|
| centerline_aft | centerline_aft | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | -251.75,0,0 | 0,0,0 | 0,-1.9546804721038186e-15,0 | 0,-1.9546804721038186e-15,0 | 0.865 | 0 |
| centerline_center | centerline_center | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | 0,0,0 | 0,0,0 | 0,-1.9546804721038186e-15,0 | 0,-1.9546804721038186e-15,0 | 0.865 | 0 |
| centerline_fore | centerline_fore | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | 251.75,0,0 | 0,0,0 | 0,-1.9546804721038186e-15,0 | 0,-1.9546804721038186e-15,0 | 0.865 | 0 |
| shell_aft | shell_aft | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | -503.4600276722667,0,0 | 0,0,0 | 4.859355146973553e-17,-3.620679151750087e-16,0 | 4.859355146973553e-17,-3.620679151750087e-16,0 | 0.865 | 0 |
| shell_fore | shell_fore | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | 503.4600276722667,0,0 | 0,0,0 | -4.8593551469735516e-17,-3.6206791517500797e-16,0 | -4.8593551469735516e-17,-3.6206791517500797e-16,0 | 0.865 | 0 |
| shell_port | shell_port | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | 0,131.96002767226668,0 | 0,0,0 | 0,-5.953350122297911e-16,0 | 0,-5.953350122297911e-16,0 | 0.865 | 0 |
| shell_starboard | shell_starboard | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | 0,-131.96002767226668,0 | 0,0,0 | 0,-5.138899925587988e-16,0 | 0,-5.138899925587988e-16,0 | 0.865 | 0 |
| shell_dorsal | shell_dorsal | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | 0,0,86.46002767226666 | 0,0,0 | 0,-7.398353470421468e-16,-8.144501967099243e-17 | 0,-7.398353470421468e-16,-8.144501967099243e-17 | 0.865 | 0 |
| shell_ventral | shell_ventral | warp_worldline_local_comoving | solve_backed_shift_vector_sample | 0 | 0,0,-86.46002767226666 | 0,0,0 | 0,-7.398353470421502e-16,8.144501967099243e-17 | 0,-7.398353470421502e-16,8.144501967099243e-17 | 0.865 | 0 |

## Geometry
- Deterministic bounded local-comoving shell-cross family: centerline aft-center-fore plus shell-proximal aft/fore/port/starboard/dorsal/ventral probes. Samples are evaluated directly from the solve-backed shift-vector field and remain bounded to local transport inspection only.
- centerlineAxis: `1,0,0`
- portStarboardAxis: `0,1,0`
- dorsalVentralAxis: `0,0,1`
- offsets_m: centerline=`251.75`, shellLongitudinal=`503.4600276722667`, shellTransverse=`131.96002767226668`, shellVertical=`86.46002767226666`, shellClearance=`0.039972327733333333`
- transportInterpretation: The comoving coordinate velocity is fixed to zero by chart choice. Effective transport is represented here only as a solve-backed bounded local shift descriptor. Even when shell-cross variation is present, it is not a certified speed, cruise envelope, or route-time answer.

## Transport Variation
- status: descriptor_varied_dtau_flat
- dtauDtSpread.absolute: 0
- effectiveTransportSpread.maxPairwiseL2: 1.593353723983399e-15
- betaSpread.maxPairwiseL2: 1.593353723983399e-15
- flatWithinTolerance: false
- flatnessReason: shell_cross_samples_reveal_shift_variation_while_dtau_stays_flat_in_bounded_regime
- flatnessInterpretation: The bounded local-comoving family exposes solve-backed local shift variation, but the low-g bounded regime keeps dtau_dt numerically flat. This is informative for bounded transport differentiation only, not for route-time or speed claims.
- certifiedTransportMeaning: bounded_local_shift_descriptor_gradient_only
- eligibleNextProducts: bounded_cruise_envelope_preflight
- nextRequiredUpgrade: route_time_worldline_extension_after_bounded_cruise_preflight

## Claim Boundary
- bounded solve-backed transport contract only
- local-comoving shell-cross sample family only
- not route-time certified
- not mission-time certified
- not max-speed certified
- not viability-promotion evidence

## Falsifier Conditions
- metric_t00_source_not_metric
- metric_contract_status_not_ok
- chart_contract_status_not_ok
- chart_not_comoving_cartesian
- solve_backed_transport_sample_family_missing
- transport_sample_family_not_shell_cross
- shift_lapse_transport_promotion_gate_not_pass
- dtau_dt_nonpositive
- normalization_residual_exceeds_tolerance

## Non-Claims
- not route-time certified
- not mission-time certified
- not max-speed certified
- not full worldline physics closure
- not Lane A proof replacement

