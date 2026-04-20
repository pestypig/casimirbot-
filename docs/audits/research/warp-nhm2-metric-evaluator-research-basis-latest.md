# NHM2 Metric Evaluator Research Basis (Geometry-First NHM2 Route) - 2026-04-17

## Scope
This memo defines the research basis for the NHM2 model-term routes used on the
metric-required lane, with `einstein_tensor_geometry_fd4_v1` as the preferred
geometry-first route and `adm_quasi_stationary_recovery_v1` retained only as a
legacy fallback.

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

6. Natario zero-expansion context for quasi-stationary shift-first closure:
- The route uses Natario-style shift-driven construction on a comoving chart and
  keeps model-term admission conservative until semantic closure is proven.

Primary source:
- Natario, *Warp Drive With Zero Expansion*: https://arxiv.org/abs/gr-qc/0110086

7. Numerical-relativity convergence methodology for uncertainty controls:
- Finite-difference claims should include explicit convergence diagnostics and
  Richardson-style step-consistency checks before promoting conclusions.

Primary sources:
- High-order NR stability/discretization review:
  https://arxiv.org/abs/gr-qc/0507004
- Richardson-extrapolated waveform evidence in full GR simulations:
  https://arxiv.org/abs/1306.6052

## Route Assumptions Used In This Patch
The current producer emits a geometry-first same-chart flux/shear route where
available, with conservative non-admission until closure checks pass:
- preferred route id: `einstein_tensor_geometry_fd4_v1`
- fallback route id: `adm_quasi_stationary_recovery_v1`
- same-chart `comoving_cartesian` lane
- reduced-order finite-difference derivatives on the shift field
- geometry-first Einstein-tensor cross-check diagnostics are mandatory
- no claim that emitted `T0i` / off-diagonal `Tij` are promotion-grade yet

## Route Selection Rule
Producer route selection must follow:
1. Use `einstein_tensor_geometry_fd4_v1` when finite same-chart geometry
   derivatives are available for the sample.
2. Fall back to `adm_quasi_stationary_recovery_v1` only when geometry-first
   evaluation is not finite at the sample.
3. Keep `modelTermAdmission = experimental_not_admitted` until semantic closure
   checks (metadata/chart/finiteness/symmetry/convergence/cross-check/citations)
   pass under policy.

## Semantic-Closure Path Decision Rule
Semantic closure now uses an explicit route-decision policy between:
- `adm_complete`
- `full_einstein_tensor`

Decision priority:
1. If ADM is admitted and Einstein is not, choose `adm_complete`.
2. If Einstein is admitted and ADM is not, choose `full_einstein_tensor`.
3. If both are admitted, follow route metadata hint (default Einstein-first unless
   metadata explicitly points to ADM).
4. If neither is admitted, use metadata + independent cross-check evidence.

Current NHM2 decision posture is documented in:
- `docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md`

## Einstein Cross-Check Gate (Current Status)
For scientific-admission safety, independent cross-check evidence is now tied to
an explicit geometry-first Einstein-tensor route contract, not inferred from
finite-difference triplet consistency alone.

Current status on the NHM2 producer lane:
- Einstein cross-check route id target: `einstein_tensor_geometry_fd4_v1`
- independent comparator route id: `einstein_tensor_geometry_fd2_independent_v1`
- emitted status: `available` (diagnostic-only geometry-first cross-check family)
- admission status: `pass` only when the reference route is independent and
  comparable to the selected Einstein route
- admission consequence: observer model-term semantic evidence remains
  `do_not_admit` until route residuals/convergence and semantic-admission checks
  satisfy promotion policy

This keeps the producer/consumer boundary aligned with the cited methodology:
compute stress-energy from geometry first, then perform observer analysis.

## Independent Cross-Check Comparability Rule
For the `full_einstein_tensor` closure path, residual thresholds are only
interpretable when the reference route is materially comparable to the selected
Einstein geometry-first route. The retained ADM fallback route
(`adm_quasi_stationary_recovery_v1`) is a legacy recovery evaluator with
different closure assumptions, so Einstein-vs-legacy-ADM residual gaps are
treated as **non-comparable evidence**, not as threshold failures.

Admission consequence:
- when the selected route is Einstein, use an Einstein-family independent
  reference route (FD2 vs FD4) so `checks.independentCrossCheck` resolves to a
  true `pass`/`fail` outcome on commensurate evidence;
- treat Einstein-vs-legacy-ADM comparisons as non-comparable and therefore not
  eligible to satisfy independent cross-check admission.

Research anchors for this policy:
- 3+1 decomposition and constraint/evolution roles (Gourgoulhon):
  https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf
- Einstein Toolkit producer-owned tensor contract:
  https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html
- Geometry-first warp analysis workflows:
  https://arxiv.org/abs/2404.03095
  https://arxiv.org/abs/2404.10855
  https://arxiv.org/abs/2602.18023

## Finite-Difference Convergence Escalation Rule
Finite-difference convergence for emitted `T0i` and off-diagonal `Tij` should
prefer direct route-local `h/h2/h4` evidence. If route-local comparisons are
suppressed by the numerical significance floor, convergence may be resolved from
the commensurate Einstein evaluator-closure sweep only when all of the following
hold:
- closure route is Einstein-family and chart-consistent (`comoving_cartesian`);
- coarse/refined (and when available super-refined) residual sweeps have finite
  comparable samples;
- residuals satisfy threshold and monotonic non-worsening under refinement.

If these conditions are not met, convergence remains `unknown` (or `fail` when
threshold/monotonic checks fail). This keeps convergence admission aligned with
numerical-relativity practice rather than inferring closure from missing signal.

Research anchors:
- High-order finite-difference stability/convergence in numerical relativity:
  https://arxiv.org/abs/gr-qc/0507004
- Richardson-style convergence usage in full GR waveforms:
  https://arxiv.org/abs/1306.6052

## Full-Einstein Admission Split (Evidence vs Policy)
For observer-semantic closure bookkeeping, treat two gates separately:
- **Evidence gate**: Einstein-route structural checks pass (metadata/chart/finiteness/
  symmetry/convergence/independent cross-check/citation coverage + control cases).
- **Policy gate**: producer-declared `modelTermAdmission` is explicitly `admitted`.

Patch intent for blocker localization:
- clear `full_einstein_tensor_route_not_admitted` when evidence gate passes on
  commensurate Einstein-family diagnostics;
- record both producer and effective admissions explicitly:
  - `routeAdmissionRaw` from producer declaration,
  - `routeAdmissionEffective` from semantic evidence gates,
  - `routeAdmissionPromotionBasis` for promotion traceability.

This separation keeps scientific claims conservative while avoiding false blocker
localization on the evidence lane.

## Contract-Level Safety Rule
Any claim above diagnostic requires replacing `experimental_not_admitted` with
an admitted route and publishing evidence that:
- same-chart semantics are closed,
- observer lane admission is closed,
- and full-loop gates remain integrity-aligned.
