# HaloBank Atlas + Equation Backbone Gap Closure Audit (2026-03-24)

## Scope

This audit records two structural gap closures for the HaloBank solar Tree + DAG lane:

1. Atlas now indexes quoted TS/JSON path literals that point at `docs/knowledge/halobank-solar-proof-tree.json`.
2. The canonical equation backbone now defines the previously ad hoc ids used by the solar route:
   - `periodicity_commensurability`
   - `line_of_sight_occultation_geometry`

## Atlas fix

Cause:
- `scripts/repo-atlas-build.ts` used a generic path regex that only matched path references followed by whitespace or a small set of punctuation.
- Quoted string literals in TS arrays, such as `"docs/knowledge/halobank-solar-proof-tree.json",`, were not matched.

Patch:
- Expanded the generic path-reference regex to accept quoted string literal boundaries and comma/colon/semicolon terminators.
- Added a regression test in `tests/repo-atlas.spec.ts` proving Atlas can now resolve the HaloBank proof tree from a quoted TS path literal.

## Equation backbone additions

Added canonical diagnostic equations to `configs/physics-equation-backbone.v1.json`:

1. `periodicity_commensurability`
   - Expression: `abs(N_a * P_a - N_b * P_b) <= epsilon_t`
   - Use in repo: recurrence / cycle commensurability lane, including Saros-style month matching.

2. `line_of_sight_occultation_geometry`
   - Expression: `theta_sep <= theta_occulter + theta_target`
   - Use in repo: apparent-geometry contact / overlap semantics for occultation and transit lanes.

## Source catalog

1. NASA eclipse catalog / Saros overview
   - https://eclipse.gsfc.nasa.gov/LEsaros/LEsaros003.html
   - Use in repo: validates the recurrence/commensurability framing for Saros-style cycle matching.

2. NAIF SPICE geometry / occultation semantics
   - https://naif.jpl.nasa.gov/naif/documentation.html
   - Use in repo: validates apparent line-of-sight occultation as angular-geometry overlap between observed figures.

## DAG + tree effect

- The HaloBank solar route no longer emits equation ids that are absent from the canonical backbone.
- Atlas retrieval can now resolve the HaloBank proof tree through quoted TS path literals, which removes the earlier indexing blind spot.

## Residual note

These additions close structural gaps. They do not change the maturity posture of the affected solar modules, which remains diagnostic.
