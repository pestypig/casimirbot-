# Needle Hull Mk1 Mismatch Audit (Option A)

Scope: mismatch-only audit between Needle Hull Mk1 paper values and runtime defaults. This lists only places where runtime claims to use Needle Hull values but the numbers diverge, or where defaults are inconsistent across the stack. Matches are intentionally omitted. These mismatches are informational and can be intentional when the calibrated pipeline diverges from the paper for stability or feasibility.

Primary reference:
- Paper PDF: `attached_assets/83 MW Needle Hull Mark 1 update_1753733381119.pdf`
- Text extraction: `tmp/needle_hull_83mw_1753733381119.txt`

Paper anchors (explicit in the PDF text):
- Hull dimensions: 1007 m x 264 m x 173 m.
- Layer stack: 0.30 m booster, 0.50 m lattice, 0.20 m service shell (total 1.00 m).
- Tile count and size: 1.96 x 10^9 tiles, 5 cm square (25 cm^2).
- Gap: 1 nm.
- Modulation: 15 GHz.
- Cavity Q: about 10^9.
- Van Den Broeck seed: gamma about 10^11.

## Mismatches

### 1) Simulation page defaults do not match the paper

File: `client/src/pages/simulation.tsx`

Paper: 25 cm^2 tile area, ship radius based on 173 m height (radius 86.5 m), Q about 10^9, and duty structure tied to 15 GHz and strobing.

Runtime defaults in this page:
- `tileArea = 5` cm^2.
- `shipRadius = 82.0` m.
- `qFactor = 1.6e6`.
- `duty = 0.002`.

Impact: This UI path does not reflect Needle Hull Mk1 values and will drive a non-paper configuration unless the preset is applied. This is a direct mismatch for any flow that treats these values as Mk1 defaults.

### 2) Default wall thickness is tuned to 15 GHz dwell, not the paper stack

File: `server/energy-pipeline.ts`

Paper: 0.30 m booster + 0.50 m lattice + 0.20 m service shell (total 1.00 m stack) and explicit 0.50 m lattice thickness.

Runtime defaults:
- `DEFAULT_WALL_THICKNESS_M = C / (15 GHz)` which is about 0.02 m.
- `hull.wallThickness_m` defaults to `DEFAULT_WALL_THICKNESS_M` with a comment to override for the 1 m stack.

Impact: The pipeline default does not match the paper thickness; any flow that does not override `hull.wallThickness_m` will not be paper-congruent on wall thickness.

### 3) Inconsistent “ship radius” defaults across UI and pipeline

Files:
- `client/src/pages/home.tsx` sets `shipRadius = 503.5` m (semi-major axis).
- `server/energy-pipeline.ts` sets `shipRadius_m = 86.5` m (semi-minor axis, Lz/2).

Paper: The hull is triaxial (1007 x 264 x 173 m), so both 503.5 m and 86.5 m can be correct if the axis is explicit. However, the same label `shipRadius` is used for different axes, which can cause implicit mismatches in downstream calculations.

Impact: Any logic that assumes `shipRadius` is a single canonical scalar for the hull will be inconsistent across UI and backend unless the axis is made explicit.

## Source gaps that look like mismatches

These are runtime values that are presented as Needle Hull constants but are not explicit in the paper text and should be labeled derived or computed from geometry.

- `client/src/pages/documentation.tsx` lists `A_hull = 5.6 x 10^5 m^2` as a Needle Hull constant. This exact value is not stated in the paper text and should be treated as derived from the ellipsoid, not a paper anchor.

## Recommended next actions

1. Keep calibrated pipeline defaults as the system baseline; relabel UI defaults as non-Mk1 unless explicitly opting into a Mk1 preset.
2. Make the `shipRadius` axis explicit in UI and backend fields to avoid silent mismatches (e.g., `shipRadius_x`, `shipRadius_z`).
3. Keep `DEFAULT_WALL_THICKNESS_M` dwell-based; if a Mk1 preset is offered, route it through an explicit override rather than changing defaults.

## Evidence pointers

Paper text is in `tmp/needle_hull_83mw_1753733381119.txt` lines:
- Hull dimensions and layers: lines 7-13.
- Tile count and size: lines 10-13.
- 15 GHz and Q about 10^9: lines 12-13, 145, 376-381.
- gamma about 10^11: lines 13, 117, 123, 387.

