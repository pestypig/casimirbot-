# NHM2 Cruise Envelope Preflight (2026-04-06)

"This artifact records a bounded NHM2 cruise-envelope preflight over the certified local-comoving shell-cross worldline family. It does not certify max speed, route time, mission time, relativistic advantage, or viability."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_cruise_envelope_preflight/v1 |
| contractVersion | warp_cruise_envelope_preflight/v1 |
| status | bounded_preflight_ready |
| certified | true |
| sourceWorldlineContractVersion | warp_worldline_contract/v1 |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| familyAuthorityStatus | candidate_authoritative_solve_family |
| transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| shiftLapseTransportPromotionGateStatus | pass |
| shiftLapseTransportPromotionGateReason | shift_lapse_transport_promotion_gate_pass |
| shiftLapseAuthoritativeLowExpansionStatus | pass |
| shiftLapseWallSafetyStatus | pass |
| shiftLapseTimingStatus | available |
| shiftLapseCenterlineAlpha | 0.75 |
| shiftLapseCenterlineDtauDt | 0.75 |
| chart | comoving_cartesian |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_bounded_cruise_preflight |
| sourceSampleGeometryFamilyId | nhm2_centerline_shell_cross |
| preflightQuantityId | bounded_local_transport_descriptor_norm |
| preflightQuantityMeaning | Dimensionless norm ||beta_eff|| of the certified local-comoving effective transport descriptor across the shell-cross family. This is fixed-chart local descriptor support only, not a ship speed. |
| preflightQuantityUnits | dimensionless |
| candidateCount | 10 |
| admissibleCount | 9 |
| rejectedCount | 1 |
| boundedCruisePreflightBand.min | 3.6531425984160347e-16 |
| boundedCruisePreflightBand.max | 1.9546804721038186e-15 |
| routeTimeStatus | deferred |
| sampleFamilyAdequacy | adequate_for_bounded_cruise_preflight |
| transportVariationStatus | descriptor_varied_dtau_flat |
| transportInformativenessStatus | descriptor_informative_local_only |
| certifiedTransportMeaning | bounded_local_shift_descriptor_gradient_only |
| eligibleNextProducts | route_time_worldline_extension |
| nextRequiredUpgrade | route_time_worldline_extension |

## Descriptor Summary
- representative: 1.9546804721038186e-15
- minAdmissible: 3.6531425984160347e-16
- maxAdmissible: 1.9546804721038186e-15
- spread: 1.5893662122622152e-15
- flatnessInterpretation: The bounded local-comoving family exposes solve-backed local shift variation, but the low-g bounded regime keeps dtau_dt numerically flat. This is informative for bounded transport differentiation only, not for route-time or speed claims.

## Gate Reasons
- certified_warp_worldline_present
- worldline_transport_informativeness_sufficient_for_bounded_preflight
- worldline_sample_family_adequate_for_bounded_cruise_preflight
- dtau_dt_positive_across_worldline_family
- normalization_residual_within_worldline_tolerance
- route_time_and_mission_time_remain_deferred

## Candidates
| candidateId | class | sourceSampleId | quantity | admissible | gateReasons | note |
|---|---|---|---|---|---|---|
| sample_centerline_aft | observed_shell_cross_sample | centerline_aft | 1.9546804721038186e-15 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_centerline_center | observed_shell_cross_sample | centerline_center | 1.9546804721038186e-15 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_centerline_fore | observed_shell_cross_sample | centerline_fore | 1.9546804721038186e-15 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_shell_aft | observed_shell_cross_sample | shell_aft | 3.653142598416042e-16 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_shell_fore | observed_shell_cross_sample | shell_fore | 3.6531425984160347e-16 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_shell_port | observed_shell_cross_sample | shell_port | 5.953350122297911e-16 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_shell_starboard | observed_shell_cross_sample | shell_starboard | 5.138899925587988e-16 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_shell_dorsal | observed_shell_cross_sample | shell_dorsal | 7.443047977557191e-16 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| sample_shell_ventral | observed_shell_cross_sample | shell_ventral | 7.443047977557227e-16 | true | certified_warp_worldline_present,worldline_sample_family_adequate_for_bounded_cruise_preflight,candidate_within_certified_shell_cross_support,route_time_still_deferred | Observed local-comoving shell-cross descriptor support from a certified solve-backed worldline sample. This is a bounded transport descriptor only, not a speed. |
| probe_above_certified_support | above_certified_support_probe | null | 3.5480341960872178e-15 | false | candidate_exceeds_certified_local_descriptor_support,route_time_extension_required_for_broader_transport_claims | Intentional above-support probe used to keep the bounded preflight fail-closed above current certified local shell-cross evidence. |

## Claim Boundary
- bounded cruise-envelope preflight only
- fixed-chart local-comoving descriptor support only
- not a speed certificate
- not a route-time worldline
- not a mission-time estimator
- not viability-promotion evidence

## Falsifier Conditions
- certified_warp_worldline_missing
- worldline_transport_informativeness_insufficient
- worldline_sample_family_not_adequate_for_bounded_cruise_preflight
- route_time_certified_flag_set_true
- candidate_exceeds_certified_local_descriptor_support

## Non-Claims
- not max-speed certified
- not route-time certified
- not mission-time certified
- not relativistic-advantage certified
- not viability-promotion evidence

