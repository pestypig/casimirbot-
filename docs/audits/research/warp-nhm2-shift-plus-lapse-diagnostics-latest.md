# NHM2 Shift-Plus-Lapse Diagnostics

- date: 2026-04-01
- familySourceId: warp.metric.T00.nhm2.shift_lapse
- scenarioId: mild_cabin_gravity_reference
- diagnosticTier: diagnostic
- authoritativeProofSurface: lane_a_eulerian_comoving_theta_minus_trk
- laneAUnchanged: yes

## Reference Calibration

- targetCabinGravity_si: 4.903325
- targetCabinHeight_m: 2.5
- expectedAlphaGradientGeom: 5.4556848360991086e-17
- calibrationNote: Weak-field ADM calibration: partial_i alpha ~= g_i / c^2. This reference targets mild local cabin gravity only and does not imply strong centerline lapse suppression.

## Branch

- warpFieldType: nhm2_shift_lapse
- metricT00Ref: warp.metric.T00.nhm2.shift_lapse
- metricAdapterFamily: nhm2_shift_lapse

## Alpha Profile

- alphaProfileKind: linear_gradient_tapered
- alphaCenterline: 1
- alphaMin: 0.9999999999999952
- alphaMax: 1.0000000000000047
- alphaGradientAxis: z_zenith
- alphaGradientVec_m_inv: [0,0,5.4556848360991086e-17]

## Precision Context

- mildLapseFidelityStatus: mixed_source_prefer_analytic_for_underflow
- channelPrecisionPolicy: mixed_source_prefer_analytic_for_underflow
- preferredCompanionSource: analytic_lapse_summary_companion
- underResolutionDetected: yes
- underResolutionReason: raw brick alpha top-bottom delta is below analytic mild-reference expectation; raw float32 alpha_grad channels under-resolve the calibrated weak-field gradient; raw float32 Eulerian acceleration channels under-resolve the calibrated weak-field acceleration
- rawBrickDeltaAlpha: 0
- analyticExpectedDeltaAlpha: 1.1102230246251565e-16
- brickNumericType: float32
- companionNumericType: float64_analytic
- wallSafetySource: brick_float32_direct

## Effective Companion Diagnostics

- effective alpha_grad_z absMax: 5.4556848360991086e-17
- effective eulerian_accel_geom_mag absMax: 5.4556848360991086e-17
- effective source policy: mixed_source_prefer_analytic_for_underflow

## Cabin Observables

- centerline_alpha: 1
- centerline_dtau_dt: 1
- cabin_clock_split_fraction: 1.3639212090247773e-16
- cabin_clock_split_per_day_s: 1.1784279245974075e-11
- cabin_clock_split_per_year_s: 4.3042079945920315e-9
- cabin_gravity_gradient_geom: 5.4556848360991086e-17
- cabin_gravity_gradient_si: 4.903325
- cabinSampleAxis: z_zenith
- cabinSampleSeparation_m: 2.5
- cabinSamplePolicy: reference_calibrated_symmetric_centerline_z
- cabin details source: analytic_lapse_summary_fallback
- centerlineAlphaSource: gr_evolve_brick_alpha
- topBottomAlphaSource: analytic_lapse_summary_companion
- gravityGradientSource: analytic_lapse_summary_companion

## Wall Safety

- betaOutwardOverAlphaWallMax: 2.2094750204371243e-17
- betaOutwardOverAlphaWallP98: 2.6153488804257315e-18
- wallHorizonMargin: 1
- wallSamplingPolicy: ellipsoidal_surface_interior_offset_grid_v1
- wallNormalModel: ellipsoidal_hull_gradient_approx
- wallSampleCount: 144
- wallRegionDefinition: Sample outward normals on a deterministic ellipsoidal hull grid and evaluate beta.n/alpha one half wall-thickness inside the support wall.
- source: brick_float32_direct

## Combined Shift/Lapse Safety

- status: pass
- betaOverAlphaMax: 2.2094750204371243e-17
- betaOverAlphaP98: 2.2094750204371243e-17
- betaOutwardOverAlphaWallMax: 2.2094750204371243e-17
- betaOutwardOverAlphaWallP98: 2.6153488804257315e-18
- wallHorizonMargin: 1
- note: Combined shift/lapse safety remains advisory-only for this diagnostics-first reference branch.

## Proof Policy

- Diagnostic tier only.
- Lane A remains authoritative and unchanged.
- nhm2_shift_lapse remains reference-only in this patch.
- Cabin gravity and wall-safety diagnostics do not supersede York proof semantics.
- No route-time compression claim is made from these reduced-order lapse diagnostics.
- Stronger centerline lapse suppression remains deferred to a later new-solve patch.
- epsilonTilt remains a shift/shear proxy under the current Natario path.

