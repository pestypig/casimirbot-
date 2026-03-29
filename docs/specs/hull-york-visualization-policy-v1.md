# Hull York Visualization Policy v1

## Purpose

Define strict scientific-lane rules for NHM2 York rendering so the UI cannot overstate expansion signal or mix non-congruent products.

## Policy

1. Raw York views (`york-time-3p1`, `york-surface-3p1`, `york-surface-rho-3p1`, `york-shell-map-3p1`) are same-snapshot proof views and must remain raw-magnitude renderings of certified `theta`.
2. Topology companion view (`york-topology-normalized-3p1`) is inspection-only and must never be labeled as raw York magnitude.
3. Raw York views are fixed-coordinate only; adaptive projection is forbidden.
4. Raw York views must not apply hidden gain (`display_gain` must remain `1`).
5. Parameter-family products are separate deliverables and must not be represented as one simultaneous system in same-snapshot proof views.

## York diagnostics semantics (required)

Raw and display diagnostics are distinct and both must be present for York views.

- Raw extrema (`theta_min_raw`, `theta_max_raw`, `theta_abs_max_raw`) are computed from the actual York scalar array for the selected coordinate slice.
- Display extrema (`theta_min_display`, `theta_max_display`, `theta_abs_max_display`) are computed from display-range policy (`display_range_method`) and may include clipping/normalization choices for legibility.
- `display_range_method` must be serialized so display extrema are reproducible and auditable.
- Strict proxy validation fail-closes when either raw or display diagnostics are missing.

Legacy compatibility fields:

- `theta_min`, `theta_max`, `theta_abs_max` are compatibility aliases mapped to display extrema.
- These legacy aliases must not be interpreted as raw field extrema in scientific reading or downstream tooling.
- Scientific consumers should read raw extrema only from `theta_*_raw`.

## Required scientific wording

- "A near-flat York plot is a legitimate result for low-expansion warp configurations; the renderer must not inject hidden gain or alternate sampling in a way that impersonates a stronger expansion field."

## Coordinate/axis framework

- Warp-bubble York plots are shown on a fixed-time slice with motion along `x`.
- The transverse coordinate is either cylindrical `rho` (`x-rho`) or a fixed Cartesian surrogate (`x-z-midplane`).
- Chosen coordinate mode must be serialized in render metadata and certificate diagnostics.

## Same-snapshot congruence lock

Every York proof view must match the same certified snapshot identity fields:

- `metric_ref_hash`
- `timestamp_ms`
- `chart`
- `observer`
- `theta_definition`
- `kij_sign_convention`
- `unit_system`

## Source framework references

- Alcubierre and Lobo, *Introduction to warp drive spacetime* (motion-axis and fore/aft interpretation): `https://arxiv.org/abs/gr-qc/0009013`
- White (NASA 2011), *Warp Field Mechanics 101* (York surface plotting practice): `https://ntrs.nasa.gov/api/citations/20110015936/downloads/20110015936.pdf`
- White (NASA 2014), Eagleworks deck (York/T00 surface plot usage): `https://ntrs.nasa.gov/api/citations/20140006496/downloads/20140006496.pdf`
- Natario, *Warp Drive with Zero Expansion* (legitimate low-expansion configurations): `https://arxiv.org/abs/gr-qc/0110086`
- Mattingly et al., *Curvature invariants for the Alcubierre warp drive spacetime* (fixed-coordinate auditable comparison discipline): `https://arxiv.org/abs/2010.13693`
