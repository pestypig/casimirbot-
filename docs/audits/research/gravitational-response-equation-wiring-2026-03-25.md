# Gravitational Response Equation Wiring Audit

Date: 2026-03-25

## Scope

This audit records the equation/falsifier wiring added for the terrestrial gravitational-response lane and the HaloBank Earth-orientation proxy bridge.

## Source Basis

- NASA GSFC, "Nutation and Precession"
  - https://earth.gsfc.nasa.gov/geo/multimedia/nutation-and-precession
  - Used for the claim that Sun and Moon act on Earth's equatorial bulge and that precession and nutation are distinct downstream responses.
- Canadian Tidal Manual
  - https://psmsl.org/train_and_info/training/reading/canadian_manual.php
  - https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/40935620.pdf
  - Used for tide-generating-potential semantics and the distinction between equilibrium tide and the full dynamic tide problem.
- Tatum, Celestial Mechanics, "Precession"
  - https://phys.libretexts.org/Bookshelves/Astronomy__Cosmology/Celestial_Mechanics_%28Tatum%29/06%3A_The_Celestial_Sphere/6.07%3A_Precession
  - Used as a supporting reference for the torque-driven precession framing.

## Equation Wiring Added

- `tide_generating_potential_quadrupole`
  - Canonicalizes the lunisolar tide-generating-potential lane.
- `angular_momentum_torque_balance`
  - Canonicalizes the torque-to-orientation response lane.

These equations are now attached to:

- `physics-gravitational-response-lunisolar-tide-potential-definition`
- `physics-gravitational-response-dynamic-tide-definition`
- `physics-gravitational-response-equatorial-bulge-torque-definition`
- `physics-gravitational-response-earth-axial-precession-definition`
- `physics-gravitational-response-earth-nutation-definition`
- `physics-gravitational-response-equation-residual`

## HaloBank Runtime Bridge

Added `earth_orientation_precession_nutation_proxy` as a diagnostic HaloBank module.

Protocol posture:

- HaloBank provides deterministic Sun/Moon forcing geometry and time-scale inputs.
- The runtime converts those inputs into explicitly labeled tide-weight and torque proxies.
- The runtime does not claim a certified IAU precession-nutation series.

Result contract:

- forcing ratio diagnostics
- mean torque proxy diagnostics
- precession-driver proxy
- nutation-driver variability proxy
- deterministic threshold/falsifier gate

## DAG + Tree Effect

The gravitational-response lane is no longer definition-only. It now has:

- canonical equation refs
- claim ids
- residual/falsifier wiring
- an executable HaloBank bridge node that terminates at diagnostic maturity

This is the correct maturity boundary. The lane is stronger than a concept catalog, but it is not yet a certified Earth-orientation solver.

## Separation From Self-Gravitating Body Shape

The "potato moon" question belongs to a separate lane:

- self-gravity
- hydrostatic equilibrium
- internal pressure / material strength
- shape transition from irregular body to hydrostatic figure

That branch should not be merged into the Earth-orientation torque lane. The correct relation is:

- shared parent: gravitational response under self-gravity and external gravity
- separate descendants:
  - lunisolar forcing -> tides / torque / precession / nutation
  - self-gravity + internal pressure -> hydrostatic equilibrium shape / non-spherical small-body regime

## Remaining Gap

The Earth-orientation module is still a proxy lane. If a certified lane is needed later, it should be built separately against explicit Earth-orientation standards and series data rather than stretching this proxy past its maturity ceiling.
