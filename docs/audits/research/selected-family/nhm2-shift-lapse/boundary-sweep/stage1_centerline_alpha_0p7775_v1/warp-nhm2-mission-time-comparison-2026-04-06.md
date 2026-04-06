# NHM2 Mission-Time Comparison (2026-04-06)

"This artifact records a bounded NHM2 mission-time comparison on a deterministic committed local-rest target-distance basis. It compares warp coordinate time, warp ship proper time, and a classical no-time-dilation reference without certifying speed, viability, or a route-map ETA surface."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_mission_time_comparison/v1 |
| contractVersion | warp_mission_time_comparison/v1 |
| status | bounded_target_coupled_comparison_ready |
| certified | true |
| sourceMissionTimeEstimatorContractVersion | warp_mission_time_estimator/v1 |
| sourceRouteTimeWorldlineContractVersion | warp_route_time_worldline/v1 |
| sourceCruisePreflightContractVersion | warp_cruise_envelope_preflight/v1 |
| sourceWorldlineContractVersion | warp_worldline_contract/v1 |
| targetDistanceContractVersion | local_rest_target_distance_contract/v1 |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| familyAuthorityStatus | candidate_authoritative_solve_family |
| transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| shiftLapseTransportPromotionGateStatus | pass |
| shiftLapseTransportPromotionGateReason | shift_lapse_transport_promotion_gate_pass |
| shiftLapseAuthoritativeLowExpansionStatus | pass |
| shiftLapseWallSafetyStatus | pass |
| shiftLapseTimingStatus | available |
| shiftLapseCenterlineAlpha | 0.7775 |
| shiftLapseCenterlineDtauDt | 0.7775 |
| chart | comoving_cartesian |
| coordinateMap | bubble-centered coordinates |
| observerFamily | ship_centerline_local_comoving |
| comparisonModelId | nhm2_classical_no_time_dilation_reference |
| comparisonModelMeaning | Compare the certified bounded NHM2 warp mission coordinate time and ship proper time against a classical no-time-dilation reference that uses the exact same target-distance-coupled mission-estimator basis and sets tau=t. This comparison reports only the certified proper-time differential, if any, and does not introduce speed-based relativistic or nonrelativistic semantics. |
| targetId | alpha-cen-a |
| targetName | Alpha Centauri A |
| targetFrame | heliocentric-icrs |
| warpCoordinateTimeEstimate.seconds | 137755965.9171795 |
| warpCoordinateTimeEstimate.years | 4.3652231448899625 |
| warpProperTimeEstimate.seconds | 107105263.50060704 |
| warpProperTimeEstimate.years | 3.3939609951519456 |
| classicalReferenceTimeEstimate.seconds | 137755965.9171795 |
| classicalReferenceTimeEstimate.years | 4.3652231448899625 |
| comparisonMetrics.properMinusCoordinate_seconds | -30650702.41657245 |
| comparisonMetrics.properVsCoordinate_ratio | 0.7774999999999999 |
| comparisonMetrics.properMinusClassical_seconds | -30650702.41657245 |
| comparisonMetrics.properVsClassical_ratio | 0.7774999999999999 |
| comparisonMetrics.coordinateMinusClassical_seconds | 0 |
| comparisonMetrics.coordinateVsClassical_ratio | 1 |
| comparisonMetrics.interpretationStatus | bounded_relativistic_differential_detected |
| comparisonMetrics.differentialToleranceSeconds | 0.0001377559659171795 |
| comparisonReadiness | paired_classical_reference_certified_speed_comparators_deferred |
| deferredComparators | speed_based_nonrelativistic_reference,speed_based_flat_sr_reference,route_map_eta_surface,broad_relativistic_advantage_certification |

## Claim Boundary
- bounded mission-time comparison only
- target-coupled through the certified mission-time estimator basis only
- classical comparator is tau=t on the same certified target-distance schedule only
- not max-speed certified
- not viability-promotion evidence
- not a route-map ETA surface
- not a broad relativistic-advantage certificate

## Falsifier Conditions
- certified_mission_time_estimator_missing
- comparison_readiness_not_granted_by_mission_estimator
- target_distance_contract_provenance_missing
- comparison_time_estimate_nonfinite
- speed_based_comparator_requested_without_certified_speed_semantics

## Non-Claims
- not max-speed certified
- not viability-promotion evidence
- not full route dynamic certified
- not unconstrained ETA for arbitrary targets
- not a speed-based relativistic or nonrelativistic comparator

