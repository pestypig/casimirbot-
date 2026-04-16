# NHM2 Metric Evaluator Research Basis (ADM Quasi-Stationary Route) - 2026-04-16

## Scope
This memo defines the research basis for the model-term route
`adm_quasi_stationary_recovery_v1` used by the NHM2 same-chart metric tensor
emitter on the metric-required lane.

Status for this route in code is intentionally conservative:
- `modelTermAdmission = experimental_not_admitted`
- observer admission remains blocked on `resolve_metric_tensor_semantics`

This memo is a citation anchor for why the route exists, not a claim that the
route is already scientifically validated for promotion.

## Cited Foundations
1. 3+1 projection grammar (Eulerian decomposition):
- `E = T_{mu nu} n^mu n^nu`
- `J_i = -T_{mu nu} n^mu gamma^nu{}_i`
- `S_ij = T_{mu nu} gamma^mu{}_i gamma^nu{}_j`

Primary source:
- Gourgoulhon, *3+1 Formalism and Bases of Numerical Relativity*:
  - https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf
  - arXiv mirror: https://arxiv.org/abs/gr-qc/0703035

2. Momentum-constraint role for `J_i`:
- `D_j K^j_i - D_i K = 8 pi J_i` (sign/units depend on conventions).

Primary source:
- Same as above (Gourgoulhon 3+1 formalism).

3. `S_ij` enters the `K_ij` evolution equation:
- Spatial stress closure requires evolution-grade information, not diagonal-only
  pressure placeholders.

Primary source:
- Same as above (Gourgoulhon 3+1 formalism).

4. Producer-owned stress tensor interfaces in mature NR tooling:
- Einstein Toolkit `TmunuBase` exposes producer-owned tensor components rather
  than consumer-side fabricated channels.

Primary source:
- https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html

5. Geometry-first warp analysis precedent:
- Warp Factory computes stress-energy from metric/Einstein equations, then
  evaluates energy conditions.
- Observer-robust warp analysis work similarly computes stress-energy from ADM
  metric data first, then evaluates observer conditions.

Primary sources:
- Warp Factory paper: https://arxiv.org/abs/2404.03095
- Warp Factory foundational manuscript: https://arxiv.org/abs/2404.10855
- Observer-robust ADM/AD paper: https://arxiv.org/abs/2602.18023

## Route Assumptions Used In This Patch
The current route is a reduced-order quasi-stationary closure and is explicitly
not yet admitted:
- same-chart `comoving_cartesian` lane
- reduced-order finite-difference derivatives on the shift field
- quasi-stationary approximation on the `K_ij` evolution skeleton
- no claim of full Einstein-tensor closure
- no claim that emitted `T0i` / off-diagonal `Tij` are promotion-grade yet

## Contract-Level Safety Rule
Any claim above diagnostic requires replacing `experimental_not_admitted` with
an admitted route and publishing evidence that:
- same-chart semantics are closed,
- observer lane admission is closed,
- and full-loop gates remain integrity-aligned.