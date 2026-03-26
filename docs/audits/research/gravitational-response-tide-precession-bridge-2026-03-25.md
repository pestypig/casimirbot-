# Gravitational Response Tide/Precession Bridge Audit (2026-03-25)

## Scope

This audit records the bridge between:
- the thermodynamic equilibrium-tide limit already present in the repo,
- the newly explicit gravitational-response lane for Moon/Sun forcing, dynamic tides, and Earth-orientation response,
- HaloBank's deterministic Sun/Moon geometry lane as a forcing-input source.

Primary tree artifact:
- [physics-gravitational-response-tree.json](docs/knowledge/physics/physics-gravitational-response-tree.json)

## Source basis

- Canadian Tidal Manual index and chapter references:
  - https://psmsl.org/train_and_info/training/reading/canadian_manual.php
  - https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/40935620.pdf
- NASA GSFC, "Nutation and Precession":
  - https://earth.gsfc.nasa.gov/geo/multimedia/nutation-and-precession
- Encyclopaedia Britannica, "precession of the equinoxes":
  - https://www.britannica.com/science/precession-of-the-equinoxes

## Tree + DAG effect

Positive effects:
- `equilibrium tide` stays in the thermodynamic external-potential lane where it belongs.
- `dynamic tide`, `lunisolar tide-generating potential`, `equatorial bulge torque`, `Earth axial precession`, and `Earth nutation` are now explicit definition-level concepts rather than implied by broad overlap.
- The framework now distinguishes:
  - forcing potential,
  - hydrostatic tide limit,
  - dynamic ocean response,
  - rigid-body Earth-orientation torque response.

## HaloBank bridge posture

HaloBank is connected as the deterministic Sun/Moon state and time-scale source for this lane. It is not promoted to a hydrodynamic tide solver or a certified Earth-orientation model by this bridge.

## Residual limits

- These nodes are definition anchors, not executable torque or shallow-water solvers.
- No new equation-backbone entries were introduced in this patch for luni-solar torque or dynamic-tide equations.
- Tidal dissipation, Love numbers, and long-term length-of-day coupling remain follow-on work.
