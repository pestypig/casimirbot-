# NHM2 Mission-Time Estimator (2026-04-06)

"This artifact records a bounded NHM2 mission-time estimator over a deterministic committed local-rest target-distance contract. It does not certify max speed, viability, unconstrained ETA, or a full route dynamic."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_mission_time_estimator/v1 |
| contractVersion | warp_mission_time_estimator/v1 |
| status | bounded_target_coupled_estimate_ready |
| certified | true |
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
| shiftLapseCenterlineAlpha | 0.8625 |
| shiftLapseCenterlineDtauDt | 0.8625 |
| chart | comoving_cartesian |
| coordinateMap | bubble-centered coordinates |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_bounded_target_coupled_mission_estimator |
| estimatorModelId | nhm2_repeated_local_probe_segment_estimator |
| estimatorModelMeaning | Repeat the certified bounded NHM2 local probe route-time segment over the deterministic committed local-rest target distance. This is a bounded translational repetition law over the certified local route-time schedule, not a full route dynamic or a speed proof. |
| targetId | alpha-cen-a |
| targetName | Alpha Centauri A |
| targetFrame | heliocentric-icrs |
| targetDistance.meters | 41298199626475464 |
| targetDistance.parsecs | 1.338383500408207 |
| targetDistance.lightYears | 4.365218089591392 |
| targetDistance.epochMs | 1763696773601 |
| targetDistance.snapshotPath | server/_generated/local-rest_epoch-1763696773601_r-200pc_012fd60ec17881cc.json |
| routeParameterMeaning | Normalized bounded route progress lambda in [0,1] along the certified local longitudinal probe segment from shell_aft to shell_fore in the fixed comoving Cartesian chart. |
| coordinateTimeEstimate.seconds | 137755965.9171795 |
| coordinateTimeEstimate.years | 4.3652231448899625 |
| properTimeEstimate.seconds | 118814520.60356732 |
| properTimeEstimate.years | 3.765004962467593 |
| routeTimeStatus | bounded_local_segment_certified |
| sourceWorldlineStatus | bounded_solve_backed |
| sourceCruisePreflightStatus | bounded_preflight_ready |
| sourceRouteTimeWorldlineStatus | bounded_route_time_ready |
| comparisonReadiness | ready_for_paired_relativistic_vs_nonrelativistic_comparison |
| nextEligibleProducts | relativistic_vs_nonrelativistic_comparison,cruise_envelope_semantics_upgrade |

## Estimator Assumptions
- The certified bounded local probe route-time schedule is translationally repeated over the target distance without introducing new route dynamics.
- Target distance is fixed by the deterministic committed local-rest epoch snapshot in the heliocentric-icrs frame.
- No braking phase, cruise-envelope widening, target gravity capture, or catalog-specific control law is added in this estimator.
- Coordinate and proper time are reported separately from the same repeated bounded route-time basis.

## Claim Boundary
- bounded mission-time estimator only
- target-coupled through a committed local-rest target-distance contract only
- derived from repeated bounded local probe route-time schedule, not a full route dynamic
- not max-speed certified
- not viability-promotion evidence
- not relativistic-advantage certified

## Falsifier Conditions
- certified_route_time_worldline_missing
- certified_cruise_preflight_missing
- certified_warp_worldline_missing
- target_distance_contract_missing_or_noncommitted
- route_time_progress_span_nonpositive
- coordinate_or_proper_time_estimate_nonfinite
- unsupported_target_id

## Non-Claims
- not max-speed certified
- not viability-promotion evidence
- not full route dynamic certified
- not unconstrained ETA for arbitrary targets
- not relativistic-advantage certified

