# NHM2 Route-Time Worldline (2026-04-05)

"This artifact records a bounded NHM2 route-time worldline extension over a certified local probe segment. It does not certify mission time, target ETA, max speed, relativistic advantage, or viability."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_route_time_worldline/v1 |
| contractVersion | warp_route_time_worldline/v1 |
| status | bounded_route_time_ready |
| certified | true |
| sourceWorldlineContractVersion | warp_worldline_contract/v1 |
| sourceCruisePreflightContractVersion | warp_cruise_envelope_preflight/v1 |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| familyAuthorityStatus | candidate_authoritative_solve_family |
| transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| shiftLapseTransportPromotionGateStatus | pass |
| shiftLapseTransportPromotionGateReason | shift_lapse_transport_promotion_gate_pass |
| shiftLapseAuthoritativeLowExpansionStatus | pass |
| shiftLapseWallSafetyStatus | pass |
| shiftLapseTimingStatus | available |
| shiftLapseCenterlineAlpha | 0.9275 |
| shiftLapseCenterlineDtauDt | 0.9275 |
| chart | comoving_cartesian |
| coordinateMap | bubble-centered coordinates |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_bounded_route_time_local_probe |
| routeModelId | nhm2_bounded_local_probe_lambda |
| routeModelMeaning | Deterministic bounded route-time progression across the certified shell-aft to shell-fore local probe segment in the comoving Cartesian chart. Coordinate time is parameterized by the local light-crossing horizon of that bounded segment; no target distance or ship speed is inferred. |
| routeParameterName | lambda |
| routeParameterMeaning | Normalized bounded route progress lambda in [0,1] along the certified local longitudinal probe segment from shell_aft to shell_fore in the fixed comoving Cartesian chart. |
| sourceSampleGeometryFamilyId | nhm2_centerline_shell_cross |
| progressionSampleCount | 5 |
| representativeProgressionSampleId | centerline_center |
| coordinateTimeSummary.start | 0 |
| coordinateTimeSummary.end | 0.0000033587237719787246 |
| coordinateTimeSummary.span | 0.0000033587237719787246 |
| properTimeSummary.start | 0 |
| properTimeSummary.end | 0.0000031152162985102673 |
| properTimeSummary.span | 0.0000031152162985102673 |
| descriptorScheduleSummary.representative | 1.9546804721038186e-15 |
| descriptorScheduleSummary.min | 3.6531425984160347e-16 |
| descriptorScheduleSummary.max | 1.9546804721038186e-15 |
| descriptorScheduleSummary.spread | 1.5893662122622152e-15 |
| transportVariationStatus | descriptor_varied_dtau_flat |
| transportInformativenessStatus | descriptor_informative_local_only |
| sampleFamilyAdequacy | adequate_for_bounded_cruise_preflight |
| routeTimeStatus | bounded_local_segment_certified |
| nextEligibleProducts | mission_time_estimator |

## Route Progress Meaning
- Bounded longitudinal local probe progress only. The progression coordinate is a deterministic normalized parameter over certified local transport support and does not represent target distance, cruise speed, or mission completion fraction.

## Progression Samples
| index | sourceSampleId | lambda | coordinateTime_s | coordinateTimeIncrement_s | properTimeIncrement_s | cumulativeProperTime_s | boundedProgressCoordinate_m | localDescriptorValue | dtau_dt | normalizationResidual |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | shell_aft | 0 | 0 | 0 | 0 | 0 | 0 | 3.653142598416042e-16 | 0.9275 | 0 |
| 1 | centerline_aft | 0.2499801511909902 | 8.396142763280144e-7 | 8.396142763280144e-7 | 7.787422412942334e-7 | 7.787422412942334e-7 | 251.71002767226668 | 1.9546804721038186e-15 | 0.9275 | 0 |
| 2 | centerline_center | 0.5 | 0.0000016793618859893623 | 8.397476096613479e-7 | 7.788659079609002e-7 | 0.0000015576081492551335 | 503.4600276722667 | 1.9546804721038186e-15 | 0.9275 | 0 |
| 3 | centerline_fore | 0.7500198488090098 | 0.00000251910949565071 | 8.397476096613479e-7 | 7.788659079609002e-7 | 0.000002336474057216034 | 755.2100276722667 | 1.9546804721038186e-15 | 0.9275 | 0 |
| 4 | shell_fore | 1 | 0.0000033587237719787246 | 8.396142763280144e-7 | 7.787422412942334e-7 | 0.0000031152162985102673 | 1006.9200553445334 | 3.6531425984160347e-16 | 0.9275 | 0 |

## Claim Boundary
- bounded route-time worldline over a local probe segment only
- coordinate-time schedule is a local light-crossing parameterization, not a target ETA
- not mission-time certified
- not max-speed certified
- not relativistic-advantage certified
- not viability-promotion evidence

## Falsifier Conditions
- certified_warp_worldline_missing
- certified_cruise_preflight_missing
- source_surface_mismatch_between_worldline_and_preflight
- chart_or_observer_mismatch_between_worldline_and_preflight
- route_progression_samples_missing_or_out_of_order
- route_progression_coordinate_time_nonmonotone
- route_progression_proper_time_nonmonotone
- route_progression_normalization_residual_exceeds_tolerance

## Non-Claims
- not mission-time certified
- not max-speed certified
- not route ETA to a real target
- not relativistic-advantage certified
- not viability-promotion evidence

