# NHM2 Shift-Plus-Lapse Implementation Brief

Date: 2026-04-01

## Scope
This patch adds a diagnostics-first generalized NHM2 branch:

- `warp.metric.T00.nhm2.shift_lapse`

It does not replace the current unit-lapse Natario-like baseline.

## Preserved repo policy

- Lane A remains the authoritative proof surface.
- Current NHM2 remains the unit-lapse Natario-like baseline.
- `epsilonTilt` remains a shift/shear proxy, not cabin gravity.
- No route-time compression claim is made in this patch.
- New lapse diagnostics remain secondary companion diagnostics only.

## New branch inputs

The generalized branch accepts:

- `alphaProfileKind`
- `alphaCenterline`
- `alphaGradientVec_m_inv`
- `alphaInteriorSupportKind`
- `alphaWallTaper_m`

Orientation convention remains explicit:

- `x_ship`
- `y_port`
- `z_zenith`

## New solver-facing diagnostic surfaces

The GR brick now exports:

- `alpha_grad_x`
- `alpha_grad_y`
- `alpha_grad_z`
- `eulerian_accel_geom_x`
- `eulerian_accel_geom_y`
- `eulerian_accel_geom_z`
- `eulerian_accel_geom_mag`
- `beta_over_alpha_mag`

These are diagnostic-only companion channels.

## New local cabin observables

The secondary ADM time-dilation layer now reports:

- `centerline_alpha`
- `centerline_dtau_dt`
- `cabin_clock_split_fraction`
- `cabin_clock_split_per_day_s`
- `cabin_clock_split_per_year_s`
- `cabin_gravity_gradient_geom`
- `cabin_gravity_gradient_si`

These are defined from the solved `alpha(x)` field and exported GR brick channels. They are local cabin diagnostics, not null-transport route observables.

## Contract policy

The new companion contract is:

- `configs/adm-gravity-diagnostic-contract.v1.json`

Its role is:

- reference-only
- non-authoritative for readiness
- semantically separate from the York diagnostic contract

## Advisory combined safety block

The viability layer now emits:

- `combinedShiftLapseSafety`
- `betaOverAlphaMax`
- `betaOverAlphaP98`
- `betaOutwardOverAlphaWallMax`
- `betaOutwardOverAlphaWallP98`
- `wallHorizonMargin`

This patch keeps that block advisory-only.

## Calibrated reference policy

The published reduced-order artifact now uses an explicit named scenario:

- `mild_cabin_gravity_reference`

Calibration for that scenario is explicit:

- `targetCabinGravity_si = 0.5 g`
- `targetCabinHeight_m = 2.5`
- `expectedAlphaGradientGeom = g/c^2 ≈ 5.46e-17 1/m`

This is a weak-field reference regime for local cabin-gravity diagnostics only.
It is not a strong centerline-lapse scenario and it is not a route-time compression claim.

Wall-normal combined safety is now sampled on a deterministic ellipsoidal hull-normal grid and reported through:

- `betaOutwardOverAlphaWallMax`
- `betaOutwardOverAlphaWallP98`
- `wallHorizonMargin`

## Mild-reference precision policy

The calibrated mild-reference regime is weak enough that raw float32 GR brick
channels can under-resolve:

- `alpha_grad_*`
- `eulerian_accel_geom_*`
- top-vs-bottom `alpha` deltas near `alpha ~ 1`

The published artifact therefore now distinguishes:

- `rawBrickDiagnostics`
- `analyticCompanionDiagnostics`
- `effectiveDiagnostics`

It also emits:

- `mildLapseFidelityStatus`
- `channelPrecisionPolicy`
- `underResolutionDetected`
- `underResolutionReason`

Policy:

- raw float32 brick summaries remain visible
- analytic lapse-summary companions are allowed for weak-field underflow
- wall-normal `beta_outward/alpha` safety remains brick-derived unless explicitly stated otherwise
- Lane A proof semantics remain unchanged

## Precision-aware comparison companion

The repo now also publishes a comparison companion for:

- the current unit-lapse NHM2 baseline
- the calibrated mild `nhm2_shift_lapse` reference

That companion is diagnostic-only. Its purpose is to compare:

- cabin lapse/gravity observables
- bulk `|beta|/alpha`
- wall-normal `beta_outward/alpha`
- wall horizon margin

without hiding source provenance.

Comparison policy:

- carry `baselinePrecisionContext` and `generalizedPrecisionContext`
- emit per-quantity source kinds
- flag cross-case raw-vs-analytic mismatches explicitly
- keep cabin gravity and wall safety in separate sections
- keep Lane A authoritative and unchanged

## Deferred work

- strong centerline lapse suppression
- any promotion of ADM gravity diagnostics to proof status
- any visualization-first expansion beyond data-surface correctness

## Result

After this patch the repo can say:

- current NHM2 remains the unit-lapse Natario-like baseline
- there is now a separate generalized shift-plus-lapse NHM2 diagnostic branch
- the repo can measure Eulerian lapse-gradient cabin-gravity proxies
- the repo can inspect combined `|beta|/alpha` safety diagnostics
- stronger centerline lapse suppression remains deferred
