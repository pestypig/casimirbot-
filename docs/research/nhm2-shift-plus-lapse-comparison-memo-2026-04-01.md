# NHM2 Shift-Plus-Lapse Comparison Memo

This companion compares the current promoted unit-lapse NHM2 baseline against the calibrated mild nhm2_shift_lapse reference branch.

It is a diagnostic comparison companion only:

- Lane A remains authoritative and unchanged.
- warp.metric.T00.nhm2.shift_lapse remains reference_only.
- Cabin gravity and wall safety are presented side by side but remain separate diagnostic families.
- No route-time-compression claim is made.

## What The Generalized Branch Adds

- a nontrivial lapse profile alpha(x)
- explicit cabin clock-split and gravity-gradient diagnostics
- the ability to compare local lapse observables against wall-normal beta_outward/alpha safety without overloading York proof semantics

## What Remains Unchanged

- the unit-lapse NHM2 baseline branch
- Lane A proof semantics
- the requirement to keep wall safety brick-derived in this comparison

## Precision Limits

The mild generalized branch remains weak enough that some cabin-gravity quantities are published from the analytic lapse-summary companion rather than raw float32 brick channels.

- precisionComparisonStatus: mixed_source_comparison_explicit
- mismatchedQuantityIds: alphaGradientVec_m_inv, cabin_clock_split_fraction, cabin_clock_split_per_day_s, cabin_gravity_gradient_geom, cabin_gravity_gradient_si
- wallSafetySourceParity: brick-aligned

Wall safety remains brick-derived in both cases. The source mismatches are confined to mild-reference lapse/cabin observables where the generalized branch intentionally prefers analytic companion reporting under float32 under-resolution.
The nested baseline direct-pipeline cabin block is now normalized so unresolved gravity gradients are labeled unresolved rather than analytic fallback.

## Deferred Work

- stronger centerline lapse suppression
- any proof-promotion of the generalized branch
- any field-render or OptiX presentation companion for shift-plus-lapse diagnostics

- comparisonStatus: available
- baselineBranchStatus: unit_lapse_baseline_unchanged
- generalizedBranchStatus: reference_only_mild_shift_plus_lapse
- precisionComparisonStatus: mixed_source_comparison_explicit
- recommendedNextAction: If a later visualization companion is added, keep per-quantity raw-vs-analytic badges visible and do not collapse cabin gravity and wall safety into one score.
