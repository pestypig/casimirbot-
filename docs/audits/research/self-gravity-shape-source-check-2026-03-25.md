# Self-Gravity Shape Source Check

Date: 2026-03-25

## Scope

This audit records the source-backed self-gravity-shape lane and its separation from the external-gravity response lane and the stellar-structure lane.

## Source Base Used

- Lineweaver and Norman, "The Potato Radius: a Lower Minimum Size for Dwarf Planets."
  - https://arxiv.org/abs/1004.1091
- Park et al., "A partially differentiated interior for (1) Ceres deduced from its gravity field and shape."
  - https://www.nature.com/articles/nature18955
- Wahl, Hubbard, and Militzer, "The Concentric Maclaurin Spheroid method with tides and a rotational enhancement of Saturn's tidal response."
  - https://militzer.berkeley.edu/papers/Wahl_Saturn_submitted_to_Icarus.pdf
- NASA Technical Report 19730016688, "Hydrostatic figure of the earth: Theory and results."
  - https://ntrs.nasa.gov/citations/19730016688
- NASA Technical Report 19880067580, "Internal structure and shape of Mimas."
  - https://ntrs.nasa.gov/citations/19880067580
- NASA NSSDC, Saturnian Satellite Fact Sheet.
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html
- Rambaux et al., "The rotation of Mimas."
  - https://doi.org/10.1051/0004-6361/201117558
- Thomas et al., "Hyperion's sponge-like appearance."
  - https://pubmed.ncbi.nlm.nih.gov/17611535/
- NASA Science, Hyperion.
  - https://science.nasa.gov/saturn/moons/hyperion/
- ANU Research School of Astronomy and Astrophysics, "Pluto and the potatoes."
  - https://rsaa.anu.edu.au/news-events/news/pluto-and-potatoes

## Source-Backed Node Checks

1. `self-gravity`
- local anchor: `docs/knowledge/physics/self-gravity.md`
- review result: correct as the load term for the lane; it is not the same thing as pressure support or tidal forcing.

2. `internal-pressure`
- local anchor: `docs/knowledge/physics/internal-pressure.md`
- review result: correct as the support term in hydrostatic balance; the same concept is reused later in stellar structure.

3. `material-strength`
- local anchor: `docs/knowledge/physics/material-strength.md`
- review result: correct as the threshold term that preserves irregular shapes.

4. `hydrostatic-equilibrium-shape`
- local anchor: `docs/knowledge/physics/hydrostatic-equilibrium-shape.md`
- review result: correct as the rounded equilibrium figure of a self-gravitating body.

5. `rotational-flattening`
- local anchor: `docs/knowledge/physics/rotational-flattening.md`
- review result: correct as the centrifugal flattening descendant of hydrostatic balance.

6. `tidal-bulge-response`
- local anchor: `docs/knowledge/physics/tidal-bulge-response.md`
- review result: correct as the external-tide descendant and the bridge into the gravitational-response lane.

7. `potato-radius-transition`
- local anchor: `docs/knowledge/physics/potato-radius-transition.md`
- review result: correct as the approximate rounding threshold where self-gravity overcomes yield strength.
- Saturn-moon exemplars now sharpen that threshold:
  - Mimas is a near-threshold icy moon whose figure deviates slightly from exact hydrostatic shape.
  - Hyperion is an irregular, low-density counterexample that stays clearly below a rounded equilibrium figure.

## DAG + Tree Effect

Positive effects:
- the self-gravity-shape lane is now a first-class sibling to the gravitational-response lane rather than a vague note in the architecture doc
- the lane separates self-gravity rounding from external-tide deformation
- the same framework now makes room for the stellar branch without conflating planetary shape physics with burning and nucleosynthesis

Current limits:
- the lane is definition-and-claim backed, but not yet wired into shared binding scripts or the GPT packet
- no shared equation-backbone ids were edited in this patch set
- the lane still needs the shared integration edits that would make these nodes first-class packet targets
- Saturn-moon potato-shape exemplars now have explicit synthetic state support in HaloBank, so Mimas and Hyperion can run as executable diagnostic profiles while remaining clearly labeled as non-kernel synthetic orbits.

## Protocol Note

For Tree + DAG protocol purposes:
- `self-gravity` and `internal-pressure` are support/load primitives
- `material-strength` and `potato-radius-transition` are threshold primitives
- `hydrostatic-equilibrium-shape` is the rounded equilibrium outcome
- `rotational-flattening` and `tidal-bulge-response` are separate descendants, with the latter bridging to the external-gravity lane
