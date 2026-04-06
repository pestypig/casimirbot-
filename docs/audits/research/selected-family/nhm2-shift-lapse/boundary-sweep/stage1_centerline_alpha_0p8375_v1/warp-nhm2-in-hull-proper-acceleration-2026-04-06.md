# NHM2 In-Hull Proper Acceleration (2026-04-06)

"This artifact records a bounded NHM2 in-hull proper-acceleration profile for a declared Eulerian cabin observer family. It is solve-backed and no-fallback in certified mode, but it is not a curvature-gravity or comfort/safety certificate."

## Summary
| field | value |
|---|---|
| artifactType | nhm2_in_hull_proper_acceleration/v1 |
| contractVersion | warp_in_hull_proper_acceleration/v1 |
| status | bounded_in_hull_profile_certified |
| certified | true |
| sourceSurface | nhm2_metric_in_hull_proper_acceleration_profile |
| familyAuthorityStatus | candidate_authoritative_solve_family |
| transportCertificationStatus | bounded_transport_proof_bearing_gate_admitted |
| shiftLapseTransportPromotionGateStatus | pass |
| shiftLapseTransportPromotionGateReason | shift_lapse_transport_promotion_gate_pass |
| shiftLapseAuthoritativeLowExpansionStatus | pass |
| shiftLapseWallSafetyStatus | pass |
| shiftLapseTimingStatus | available |
| shiftLapseCenterlineAlpha | 0.8375 |
| shiftLapseCenterlineDtauDt | 0.8375 |
| chart | comoving_cartesian |
| coordinateMap | bubble-centered coordinates |
| observerFamily | eulerian_comoving_cabin |
| accelerationQuantityId | experienced_proper_acceleration_magnitude |
| accelerationQuantityMeaning | Proper-acceleration magnitude experienced by Eulerian observers fixed to bounded cabin sample points in the comoving Cartesian chart. The solve-backed quantity is taken directly from brick-resolved eulerian_accel_geom_i = partial_i alpha / alpha and converted to SI via c^2. This is observer-defined experienced acceleration, not curvature gravity. |
| accelerationUnits | m/s^2 |
| sampleCount | 7 |
| representative_mps2 | 0 |
| representative_g | 0 |
| min_mps2 | 0 |
| max_mps2 | 0 |
| spread_mps2 | 0 |
| resolutionAdequacy | adequate_direct_brick_profile |
| fallbackUsed | false |

## Sampling Geometry
| field | value |
|---|---|
| familyId | nhm2_cabin_cross |
| description | Deterministic bounded cabin-cross sample family in the comoving Cartesian chart: center, fore, aft, port, starboard, dorsal, and ventral interior points. This family is for observer-defined experienced proper acceleration only. |
| coordinateFrame | comoving_cartesian |
| representativeSampleId | cabin_center |

## Sample Profile
| sampleId | position_m | properAccelerationGeomMagnitude_per_m | properAccelerationMagnitude_mps2 | properAccelerationMagnitude_g |
|---|---|---:|---:|---:|
| cabin_center | 0, 0, 0 | 0 | 0 | 0 |
| cabin_fore | 125.875, 0, 0 | 0 | 0 | 0 |
| cabin_aft | -125.875, 0, 0 | 0 | 0 | 0 |
| cabin_port | 0, 33, 0 | 0 | 0 | 0 |
| cabin_starboard | 0, -33, 0 | 0 | 0 | 0 |
| cabin_dorsal | 0, 0, 21.625 | 0 | 0 | 0 |
| cabin_ventral | 0, 0, -21.625 | 0 | 0 | 0 |

## Resolution Adequacy
| field | value |
|---|---|
| criterionId | direct_gr_evolve_brick_no_fallback_v1 |
| criterionMeaning | Certified mode samples direct gr-evolve brick Eulerian-acceleration channels only. A zero profile is certifiable only when the whole sampled brick reports zero acceleration/gradient extrema and the solve path exposes no declared lapse-profile companion. Otherwise a certified profile requires direct nonzero brick acceleration support; unresolved zero channels fail closed. |
| brickDims | 128,128,128 |
| voxelSize_m | 7.8671875,2.0625,1.3515625 |
| wholeBrickAccelerationAbsMax_per_m | 0.08670031279325485 |
| wholeBrickGradientAbsMax_per_m | 0.060115616768598557 |
| allSampleMagnitudesZero | true |
| expectedZeroProfileByModel | false |
| note | Direct gr-evolve brick sampling resolves a nonzero interior Eulerian proper-acceleration profile on the bounded cabin-cross family without analytic fallback. |

## Claim Boundary
- bounded in-hull observer-defined proper acceleration only
- experienced acceleration for Eulerian cabin observers only
- not a curvature-gravity certificate
- not a comfort or safety certification by itself

## Falsifier Conditions
- metric_t00_source_not_metric
- metric_contract_status_not_ok
- chart_contract_status_not_ok
- shift_lapse_transport_promotion_gate_not_pass
- brick_status_not_certified
- brick_solver_status_not_certified
- direct_gr_evolve_brick_channels_missing
- under_resolved_direct_brick_profile
- analytic_fallback_requested_for_certified_mode

## Non-Claims
- not curvature-gravity certified
- not comfort-certified
- not safety-certified
- not viability-promotion evidence
- not source-mechanism promotion

