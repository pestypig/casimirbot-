# Needle Hull Casimir Tile Materials (1 nm target, diamond + DLC stack)

This note outlines a mechanically plausible material stack for the 1 nm Casimir tile used in the Needle Hull / Mk.1 "paper" profile and connects it to published stiffness/roughness data. It is the reference to answer: *is a 1 nm, 25 cm^2 cavity mechanically believable if we assume diamond-class stiffness and DLC surfaces?*

The short take: a bare 50 mm Si plate cannot survive a 1 nm gap. A ribbed or tiled plate backed by diamond-class stiffness, with high-sp^3 DLC on top and mm-scale spans, lands in a parameter regime that is defensible for the raw/Mk.1 model. The calibrated/lab profile should stay sober at ~100 nm until such a stack is demonstrated.

---

## 1) Design goal for the Casimir tile

- Working point: gap `a ~ 1 nm`, tile area `A_tile ~ 25 cm^2 = 2.5e-3 m^2`.
- Static Casimir energy per tile: `U_static ~ -1e-3 J` (pipeline reports ~ -1.0e-3 J in raw mode).
- Static pressure: `P_Casimir = (pi^2 hbar c)/(240 a^4) ~ 1e9 Pa` at `a = 1 nm`.
- Effective Young's modulus target: `E_eff ~ 0.5-1.0 TPa`.
- Span scale: a few mm (ribbed or mosaic sub-tiles), not a free 50 mm plate.
- Guard checks: `P_rest(E, t, span) > P_Casimir + P_ES`, plus clearance after roughness and stroke.
- Baseline guard (170 GPa, 50 mm span, 1 mm thickness) rightly kicks the feasible gap to ~96 nm. To argue for 1 nm we need E up, thickness up, and span down.

## 2) Structural backbone: diamond-class stiffness

Published values to anchor the target:

- Single-crystal diamond: Young's modulus ~1.05-1.19 TPa (direction dependent); ideal fracture stress simulations ~100 GPa (defects reduce this).
- Diamond-like phases (nanocrystalline/engineered): simulations and measurements often land at `E >= 1 TPa` with high tensile strength in certain orientations.

Design posture for the raw/Mk.1 guard:

- Core: single-crystal or ultrananocrystalline diamond (or a diamond-like phase) as the load-bearing plate.
- Guard modulus: `E_guard_raw ~ 0.8-1.0 TPa`.
- Plate thickness: `t_guard_raw ~ 2-5 mm` (stiff core, not just a coating).
- Effective span: `span_guard_raw ~ 5-10 mm` by ribbing or a tiled mosaic (span enters as span^4 in restoring pressure).

That combination boosts `P_rest ~ E * t^3 / span^4` by orders of magnitude relative to a 50 mm Si slab.

## 3) Surface + coating: DLC family

Surface needs:

- Sub-nm polishability.
- Controlled internal stress and adhesion to the backbone.
- Survival under GPa-class contact pressures without delamination.
- Compatibility with optional metal/superconducting top layers.

Diamond-like carbon (DLC) is a good fit:

- Typical DLC: hardness 10-30 GPa, modulus 60-200+ GPa; high-sp^3 ta-C variants report `E ~ 700-900 GPa`.
- Doping (Mo, Ti, N, etc.) trades hardness vs stress and adhesion.

Sketch stack:

- Substrate/backbone: diamond or diamond-like plate (mm-thick).
- Interlayer: adhesion/stress-relief layer (Ti, Si, graded carbon).
- Top coating: high-sp^3 DLC/ta-C with `E_coat >= 200 GPa` (up to several hundred GPa), roughness `<= 0.2-0.3 nm RMS`, thickness tens of nm.

In the guard model this is effectively "diamond + DLC skin": stiffness dominated by the diamond, surface physics improved by the DLC/metal skin.

## 4) Casimir / MEMS precedent for ultra-small gaps

- MEMS/NEMS Casimir devices have reached ~10 nm gaps over ~5.6e-9 m^2 areas, with measured Casimir forces ~9e-6 N at ~10 nm. Force density rises rapidly for gaps <30 nm.
- Scaling to a 25 cm^2 tile and 1 nm gap drives load into the GPa regime, exactly what the guard flags.
- Conclusion: sub-10 nm gaps are demonstrated at micro-scale with stiff structures; a 25 cm^2, 1 nm cavity is a scale-up that demands diamond-class stiffness and segmented spans. It remains a design target, not a demonstrated device.

## 5) What to encode in the mechanical guard

Raw/Mk.1 (diamond+DLC stance):

- `E_guard_raw ~ 0.8-1.0 TPa` (`MECH_ELASTIC_MODULUS_RAW_PA` default 9e11).
- `t_guard_raw ~ 2-5 mm` (`MECH_TILE_THICKNESS_RAW_M` default 0.004 m).
- `span_guard_raw ~ 5-10 mm` via `MECH_SPAN_SCALE_RAW` (default 0.2) on a 25 cm^2 tile.
- Safety floor: `MECH_SAFETY_MIN_RAW ~ 3`.

Lab/calibrated (current practice):

- `E_guard_lab ~ 100-200 GPa` (Si/SiC/DLC composites), `span_guard_lab ~ 50 mm`, `t_guard_lab ~ 1 mm`.
- Safety floor: `MECH_SAFETY_MIN_CAL ~ 1`.
- With these, the guard keeps feasible gaps around ~96-100 nm (matches current calibrated behavior).

Roughness/patch posture (both profiles):

- Roughness guard: `~0.2-0.3 nm RMS` (top-end diamond/DLC polish) with 5-sigma clearance.
- Patch voltage: a few x 10 mV with careful grounding and coatings.

UI/guard metric:

- Expose `Lambda_mech = P_rest / (P_Casimir + P_ES)`.
  - `Lambda_mech >> 1` -> plenty of mechanical margin.
  - `Lambda_mech ~ 1` -> just sufficient.
  - `Lambda_mech < 1` -> mechanically overwhelmed.
- Lab profile: Lambda_mech ~ 1 at ~100 nm (achievable near term).
- Raw/Mk.1: Lambda_mech ~ 1 at 1 nm, assuming diamond-backed tiles with mm spans and TPa-class stiffness; consistent with diamond/high-sp^3 DLC literature, but ahead of current MEMS practice.

## 6) GR / QI story alignment

- Casimir side: `U_static ~ -1e-3 J/tile` at 1 nm is consistent with ideal parallel-plate expression for 25 cm^2.
- Mechanical side: stiffness/span choices align with diamond + high-sp^3 DLC reports (`E ~ 0.5-1 TPa` backbone, DLC up to a few hundred GPa). Explicitly marked as extrapolated hardware.
- GR proxy: Phoenix uses `kappa_drive ~ (8*pi*G/c^5) * (P/A) * d_eff * G_geom`; the above `U_static` feeds the ladder that shows ~80-90 MW in the GR ladder UI.
- QI: Ford-Roman window (zeta ~ 0.02) stays below its bound at current duty/geometry; mechanics, not QI, limit the 1 nm target.

## 7) How to reference this doc in UI / papers

- GR ladder appendix: "Material feasibility for the 1 nm tile is discussed in needle-hull-materials.md (diamond + DLC stack, E ~ 1 TPa, mm-scale spans)."
- Mechanical guard panel: "Raw/Mk.1 assumes diamond-class stiffness; see needle-hull-materials.md for references and design targets."
- Papers/talks: "We model each cavity as a diamond-backed plate with a high-sp^3 DLC top layer; material parameters are consistent with reported E ~ 1 TPa for diamond and E ~ 0.2-0.8 TPa for DLC-type coatings. See needle-hull-materials.md for references."

These notes keep the raw/Mk.1 stance explicit (diamond+DLC, mm spans, TPa-class stiffness) while keeping calibrated mode conservative at ~100 nm.
