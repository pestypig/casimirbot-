# NHM2 Cruise Envelope (2026-04-06)

"This artifact records a certified bounded NHM2 cruise envelope over a fixed-chart descriptor band. It strengthens preflight by route-time and mission consistency while remaining explicitly non-speed, non-ETA, and non-viability."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_cruise_envelope/v1 |
| contractVersion | warp_cruise_envelope/v1 |
| status | bounded_cruise_envelope_certified |
| certified | true |
| sourcePreflightContractVersion | warp_cruise_envelope_preflight/v1 |
| sourceRouteTimeWorldlineContractVersion | warp_route_time_worldline/v1 |
| sourceMissionTimeEstimatorContractVersion | warp_mission_time_estimator/v1 |
| sourceMissionTimeComparisonContractVersion | warp_mission_time_comparison/v1 |
| sourceWorldlineContractVersion | warp_worldline_contract/v1 |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| familyAuthorityStatus | candidate_authoritative_solve_family |
| transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| shiftLapseTransportPromotionGateStatus | pass |
| shiftLapseTransportPromotionGateReason | shift_lapse_transport_promotion_gate_pass |
| shiftLapseAuthoritativeLowExpansionStatus | pass |
| shiftLapseWallSafetyStatus | pass |
| shiftLapseTimingStatus | available |
| shiftLapseCenterlineAlpha | 0.845 |
| shiftLapseCenterlineDtauDt | 0.845 |
| chart | comoving_cartesian |
| coordinateMap | bubble-centered coordinates |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_bounded_cruise_descriptor_envelope |
| cruiseEnvelopeModelId | nhm2_route_consistent_descriptor_band |
| cruiseEnvelopeModelMeaning | Certify the bounded fixed-chart cruise-control descriptor envelope over ||beta_eff|| by requiring that the admissible descriptor band remains within the certified preflight support, is exercised by the certified bounded route-time worldline, and stays consistent with the certified bounded mission-time estimator and bounded mission-time comparison. This is a descriptor envelope only, not a max-speed certificate. |
| envelopeQuantityId | bounded_local_transport_descriptor_norm |
| envelopeQuantityMeaning | Dimensionless norm ||beta_eff|| of the certified local-comoving effective transport descriptor, now elevated from preflight support to a route-time and mission-consistent bounded cruise envelope without introducing a speed mapping. |
| envelopeQuantityUnits | dimensionless |
| targetId | alpha-cen-a |
| targetName | Alpha Centauri A |
| targetFrame | heliocentric-icrs |
| sourcePreflightStatus | bounded_preflight_ready |
| sourceRouteTimeWorldlineStatus | bounded_route_time_ready |
| sourceMissionTimeEstimatorStatus | bounded_target_coupled_estimate_ready |
| sourceMissionTimeComparisonStatus | bounded_target_coupled_comparison_ready |
| admissibleBand.min | 3.6531425984160347e-16 |
| admissibleBand.max | 1.9546804721038186e-15 |
| admissibleBand.units | dimensionless |
| representativeValue | 1.9546804721038186e-15 |
| comparisonConsistencyStatus | consistent_with_bounded_relativistic_differential |
| comparisonInterpretationStatus | bounded_relativistic_differential_detected |
| routeTimeStatus | bounded_local_segment_certified |
| missionTimeStatus | bounded_target_coupled_estimate_ready |

## Comparison Consistency Note
The current bounded comparison shows a certified proper-time differential on the same target-distance basis, but the cruise envelope still remains a bounded descriptor envelope rather than a speed or advantage certificate.

## Admissibility Reasons
- certified_cruise_preflight_present
- certified_route_time_worldline_present
- certified_mission_time_estimator_present
- certified_mission_time_comparison_present
- route_time_exercised_band_matches_preflight_extrema_in_current_solve
- descriptor_band_within_certified_preflight_support
- comparison_differential_reported_honestly_and_kept_bounded
- route_map_eta_and_speed_semantics_remain_deferred

## Rejection Reasons
- missing_certified_cruise_preflight
- missing_certified_route_time_worldline
- missing_certified_mission_time_estimator
- missing_certified_mission_time_comparison
- descriptor_band_outside_certified_preflight_support
- target_consistency_mismatch_between_mission_estimator_and_comparison
- speed_or_eta_semantics_requested_without_dedicated_contract

## Claim Boundary
- certified bounded cruise-envelope semantics only
- fixed-chart local-comoving descriptor envelope only
- not a scalar vmax certificate
- not a route-map ETA contract
- not a viability-promotion evidence surface
- not an unconstrained relativistic-advantage certificate

## Falsifier Conditions
- certified_prerequisite_contract_missing
- descriptor_band_outside_certified_preflight_support
- target_or_time_consistency_mismatch_across_transport_chain
- route_map_eta_or_speed_semantics_requested_without_dedicated_contract
- comparison_consistency_not_preserved

## Non-Claims
- not max-speed certified
- not viability-promotion evidence
- not a route-map ETA surface
- not unconstrained relativistic advantage certified
- not full route dynamic certified

