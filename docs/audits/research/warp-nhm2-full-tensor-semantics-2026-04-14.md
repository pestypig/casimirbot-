# NHM2 Same-Chart Full-Tensor Semantics Spec (3+1 Target) - 2026-04-14

## Decision
This memo defines the *admissible target semantics* for a future NHM2 metric-required same-chart full-tensor emitter in `comoving_cartesian`.

This patch is documentation-only. It does **not** claim the current producer (`modules/warp/natario-warp.ts`) can emit these families yet.

## Scope
The goal is to make "legitimate full-tensor same-chart semantics" concrete and implementable:
- define same-chart matter variables (`E`, `J_i`, `S_ij`) in an accepted 3+1 grammar
- define what this repo means by "metric-required observer tensor components" (`T00`, `T0i`, `Tij`)
- define reconstruction to coordinate-basis `T_{mu nu}` in the *same chart*
- define a stop condition: when the current reduced-order producer does not carry enough geometric information to emit `T0i` or off-diagonal `Tij` honestly

## Conventions (Must Be Explicit In Any Future Patch)
These conventions must be pinned in code/contracts before admission:
- Spacetime signature: `(-,+,+,+)`
- Units:
  - "geom" quantities are in geometric units (per repo conventions)
  - SI stress/energy density uses `GEOM_TO_SI_STRESS` where applicable
- Tensor symmetry: `T_{mu nu} = T_{nu mu}`
- Chart: `comoving_cartesian` (bubble-centered)
  - coordinate interpretation: `t' = t`, `x' = x - x_s(t)` (and similarly for `y,z` if applicable)
- Foliation: the `t = const` hypersurfaces of the `comoving_cartesian` chart

## 3+1 Definitions (Same Chart, Same Observer Family)
Let the 3+1 fields for the chosen foliation be:
- lapse `alpha`
- shift `beta^i`
- spatial metric `gamma_{ij}`
- Eulerian unit normal `n^mu` to the `t = const` slices

With signature `(-,+,+,+)`, in ADM-adapted coordinates:
- `n_mu = (-alpha, 0, 0, 0)`
- `n^0 = 1/alpha`
- `n^i = -beta^i/alpha`

Define the spatial projector:
- `gamma^mu{}_nu = delta^mu{}_nu + n^mu n_nu`

Define the *same-chart projections* of the single stress-energy tensor `T_{mu nu}`:
- Energy density (Eulerian): `E = T_{mu nu} n^mu n^nu`
- Momentum density (Eulerian): `J_i = - T_{mu nu} n^mu gamma^nu{}_i`
- Spatial stress (Eulerian): `S_{ij} = T_{mu nu} gamma^mu{}_i gamma^nu{}_j`

These three families (`E`, `J_i`, `S_{ij}`) are the accepted "same chart, same observer family" grammar. A future "full-tensor" emitter must define them in `comoving_cartesian` without proxy substitution or mixed-chart inference.

## Repo Meaning Of `T00`, `T0i`, `Tij` On The Metric-Required Lane
In this repo, the NHM2 "metric-required observer tensor" components are intended to be *Eulerian (projected) components* tied to the `t = const` foliation, not consumer-invented coordinate components.

Target meaning (metric-required lane):
- `T00` means `E` (Eulerian energy density)
- `T0i` means `J_i` (Eulerian momentum density / energy flux)
- `Tij` means `S_{ij}` (Eulerian spatial stress), including off-diagonal shear terms

When the spatial metric is Euclidean on the slices (Natario-style setups often use `gamma_{ij} ~ delta_{ij}`), the coordinate axes can be used as the spatial basis for `(i,j)` *only if* that assumption is explicitly admitted by the chart contract and the produced values are proven to be projections on that same slice family.

## Reconstruction To Coordinate-Basis `T_{mu nu}` (Same Chart)
If downstream consumers need the coordinate-basis tensor `T_{mu nu}` in the *same* `comoving_cartesian` chart, the reconstruction from projected quantities is:

1. Extend `J_i` and `S_{ij}` to spacetime objects orthogonal to `n`:
- `J_mu = gamma_mu{}^i J_i` so `J_0 = beta^i J_i`, `J_i = J_i`
- `S_{mu nu} = gamma_mu{}^i gamma_nu{}^j S_{ij}` so:
  - `S_{00} = beta^i beta^j S_{ij}`
  - `S_{0i} = beta^j S_{ij}`
  - `S_{ij} = S_{ij}`

2. Reconstruct:
- `T_{mu nu} = E n_mu n_nu + n_mu J_nu + n_nu J_mu + S_{mu nu}`

In ADM-adapted coordinates, this yields explicit component formulas:
- `T_{ij} = S_{ij}`
- `T_{0i} = -alpha J_i + beta^j S_{ij}`
- `T_{00} = alpha^2 E - 2 alpha beta^i J_i + beta^i beta^j S_{ij}`

This reconstruction is only admissible if `E`, `J_i`, and `S_{ij}` are all defined as projections of the *same* underlying same-chart tensor, not stitched from diagonal-only placeholders.

## Stop Condition (When Emission Is Not Yet Legitimate)
The current reduced-order producer (`modules/warp/natario-warp.ts`) computes:
- a diagonal-only emitted shape (`T00`, `T11`, `T22`, `T33`)
- based on first spatial derivatives of the shift field (an extrinsic-curvature-like `K_ij` surrogate)

Under accepted 3+1 semantics:
- `E` can be computed from the Hamiltonian constraint *only if* the required geometric terms are admitted (e.g., `R + K^2 - K_ij K^ij = 16 pi E` with explicit sign/unit conventions and any `R` assumptions stated).
- `J_i` is tied to the momentum constraint and generally requires spatial derivatives of `K_ij` (and the correct covariant derivative `D_j` for `gamma_{ij}`), not just `K_ij` itself.
- `S_{ij}` enters the `K_ij` evolution equation and generally requires time-derivative information (or an equivalent full Einstein-tensor evaluation), not just diagonal placeholder pressures.

Therefore, **stop** and keep `metric_t0i_missing` / `metric_tij_off_diagonal_missing` in force unless the producer can prove one of:
- `existing_internal_quantity_not_serialized` (a real same-chart `J_i` and `S_ij` already exists upstream and is merely not emitted), or
- `derivable_same_chart_from_existing_state` (the producer already carries the necessary additional derivatives/fields to compute `J_i` and `S_ij` as same-chart projections), or
- `requires_new_model_term` (explicitly acknowledged, with no attempt to fake emission from diagonal-only proxies)

If none of the above are proven, any emission or consumer-side "zero fill" is not a semantics closure and must remain classified as incomplete.

## Minimum Producer-Owned Fields For Future Admission (Informal Checklist)
A future admitted full-tensor emission path must, at minimum, clearly own one coherent basis of computation:
- ADM constraint route:
  - admitted `alpha`, `beta^i`, `gamma_{ij}`, and consistent `D_i`
  - admitted `K_ij` and enough spatial derivative structure to compute `J_i`
  - enough time-derivative structure (or equivalent) to compute `S_{ij}`
- Full Einstein-tensor route:
  - admitted same-chart `g_{mu nu}` (and the derivative order required by the method) sufficient to compute `G_{mu nu}`
  - then define `T_{mu nu} = (1/8pi) G_{mu nu}` (plus unit conversions), and project to `E`, `J_i`, `S_{ij}`

Which route is chosen is a producer decision, but the emitted semantics must match the definitions in this memo.

## Non-Goals
- no consumer-side inference of `T0i` or off-diagonal `Tij`
- no proxy substitution from tile-effective lanes
- no completeness claim until `E`, `J_i`, `S_{ij}` are admitted and emitted as same-chart families

