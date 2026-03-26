# Planetary Figure Diagnostic Source Check

Date: 2026-03-25

## Purpose

This audit records the source basis for the executable `planetary_figure_diagnostic` lane added on top of the existing self-gravity and gravitational-response proxies.

## Theory Used

- `q = omega^2 a^3 / (G M)` as the low-order rotational parameter.
- `J2` as the quadrupole gravity coefficient of oblateness.
- `H = J2 / (C/(M a^2))` as the diagnostic bridge from shape to orientation.
- `f_diag ~= (3/2) J2 + q/2` as a low-order figure-closure proxy.
- `k2_eff ~= (3/2) / (1 + 19 mu_eff / (2 rho g a))` as an inferred low-order effective Love-number proxy.

Inference note:
- The `k2_eff` and `f_diag` formulas are used as diagnostic low-order closure approximations, not as certified geodesy products.
- The implementation keeps them explicitly below IERS-grade maturity.

## Source Basis

1. NASA GSFC / NSSDC Earth Fact Sheet
   - https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
   - Used for Earth reference values: equatorial radius, flattening context, and normalized moment-of-inertia context.

2. NASA GSFC / NSSDC Mercury Fact Sheet
   - https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html
   - Used for Mercury mass, radius, and slow-rotation context in the comparison profile.

3. Verma and Margot, "Mercury's gravity, tides, and spin from MESSENGER radio science data"
   - https://arxiv.org/abs/1608.01360
   - Used for the pinned Mercury falsifier target: `k2 = 0.464 +- 0.023` and the degree-2 gravity coefficients, with `J2` inferred from the reported normalized `C20`.

4. Goossens et al., Mercury tides and interior constraints review
   - https://ntrs.nasa.gov/api/citations/20220012959/downloads/Goossens.tidal.STI.pdf
   - Used for Mercury interior-constraint framing and the distinction between comparison-grade proxy closure and Mercury interior certification.

5. Gomes, Folonier, and Ferraz-Mello, "Rotation and figure evolution in the creep tide theory. A new approach and application to Mercury"
   - https://arxiv.org/abs/1910.12990
   - Used for the explicit caution that measured MESSENGER flattenings are 2-3 orders of magnitude larger than simple tidal-theory flattenings, which supports using Mercury as a hard falsifier for the low-order closure.

6. NASA GSFC / NSSDC Mars Fact Sheet
   - https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
   - Used for Mars mass/radius/rotation inputs in the supported solid-body calibration profile.

7. Konopliv et al., Mars gravity and tidal Love number
   - https://doi.org/10.1029/2020GL090568
   - Used for Mars reference `J2` and `k2` values in the solid-body calibration profile.

8. NASA GSFC, "Nutation and Precession"
   - https://earth.gsfc.nasa.gov/geo/multimedia/nutation-and-precession
   - Used for Moon/Sun torque on the equatorial bulge and the precession/nutation orientation split.

9. Tatum, "Precession"
   - https://phys.libretexts.org/Bookshelves/Astronomy__Cosmology/Celestial_Mechanics_%28Tatum%29/06%3A_The_Celestial_Sphere/6.07%3A_Precession
   - Used for dynamical ellipticity semantics and precession geometry.

10. IERS Conventions (2010), Technical Note 36
   - https://www.iers.org/IERS/EN/Publications/TechnicalNotes/tn36
   - Used for maturity boundary: diagnostic proxy outputs must remain distinct from certified Earth-orientation/geodesy products.

11. Wahl, Hubbard, and Militzer, "The Concentric Maclaurin Spheroid method with tides and a rotational enhancement of Saturn's tidal response"
   - https://doi.org/10.1016/j.icarus.2016.09.011
   - Used for the coupled rotational+tide response framing and figure-response semantics.

## Result

- The repo now has an explicit profile-calibrated low-order figure diagnostic over `q`, `J2`, `H`, `k2`, and flattening.
- Earth remains the paired-perturber reference profile.
- Mercury is now the primary non-Earth executable congruence surface because the same body is already exercised by the Mercury precession lane.
- Inference from the current implementation: once pinned to the Verma-Margot MESSENGER gravity/tide target, the low-order proxy fails on `J2` closure. That failure is useful and expected; it means Mercury is now operating as a real falsifier rather than a permissive comparison profile.
- Mars remains a secondary static solid-body calibration retained for cross-checking the figure closure away from the Mercury precession problem.
- The lane stays diagnostic.
- It does not claim certified figure, geodesy, or IERS orientation products.
