Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: authenticated classical and quantum control branch
Capability or component: candidate-neutral Gevrey-1 and Borel-realization feasibility for the positive/vacuum formal germs
Current maturity: 23 pre-acknowledgement definition defects are repaired, expanded exact/cross-language audits pass, and the repaired definition has an exact-byte independent acknowledgement; candidate-neutral A4 implementation is eligible but no instantiated proof or execution authority exists
Target maturity: completeness-audited and independently acknowledged candidate-independent theorem/algorithm packet suitable for candidate-neutral C08 implementation
Required frozen inputs: positive scalar recurrence `363818f5...68bf`; vacuum scalar recurrence/state grid `cd98fb11...013c`; flat-carrier split `09ca71e9...5103`; carrier state-jet runtime receipt `ade5e77a...7ba16`; no selected-member ingress
Required evidence: uniform Gevrey bounds on compact strict-kappa boxes; differentiated recurrence bounds through state order two; Borel-plane continuation/singularity analysis or a quantitative extension alternative; directed norm algorithm; independent audit
Stop/fail criteria: assuming Taylor convergence, treating local Borel radius as positive-ray summability, selecting constants from candidate outcome, hiding a Stokes/lateral prescription, omitting state derivatives, or promoting proof authority
Explicit non-goals: loading the `6/5` member, selecting a C08 truncation order, sealing a Borel prescription, executing a continuation sample, implementing the scientific handler, changing frozen equations, or promoting any authority
Downstream gate unlocked: A4 candidate-neutral C08 producer implementation and fixtures only

# S5-A Gevrey/Borel feasibility packet

## Status

`CANDIDATE_NEUTRAL_PREACKNOWLEDGEMENT_COMPLETENESS_REPAIR`

This packet narrows the mathematical lead created by the
[`formal-germ subtraction review`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a-formal-germ-subtraction-definition-review.md).
It is not a proof receipt or selector.

## Exact scalar recurrence structure

After applying only the two frozen parameter identities, coefficient extraction
from either chart has the same leading three-step form:

```text
2*kappa*(n+1)*h_(n+1)
  + c_0(n)*h_n
  + c_1(n)*h_(n-1)
  + c_2(n)*h_(n-2) = 0,
```

where each `c_j(n)` is a degree-at-most-two polynomial in `n` with continuous
rational dependence on chart parameters wherever `kappa>0`. The exact audit
proves

```text
coefficient(h_(n+1)) = 2*kappa*(n+1),
lim_(n->infinity) c_0(n)/n^2 = 1
```

for both charts. Thus an ordinary power-series convergence argument is not
available, while a Gevrey-1 estimate is structurally natural.

## Parameterized Gevrey induction

Let a future compact chart box satisfy `kappa >= kappa_0 > 0`. Before any
selected execution, a generic producer can derive outward constants
`p_0,p_1,p_2 >= 0` satisfying, for all recurrence ordinals in their declared
ranges,

```text
|c_j(n)| <= p_j*(n+1)^2.
```

Suppose the already generated coefficients satisfy

```text
|h_j| <= C*A^j*j!.
```

For `n>=2`, division by the exact positive divisor yields the conservative
induction ratio

```text
p_0/(2*kappa_0*A)
  + p_1/(2*kappa_0*A^2)
  + p_2/(2*kappa_0*A^3).
```

Therefore any outward `A` for which this sum is at most one, together with an
outward `C` covering the finitely checked base coefficients, is a valid scalar
Gevrey-1 witness. This is a parameterized theorem shape, not yet a bound for a
selected box.

The future algorithm must compute the `p_j` from exact coefficient polynomials
and compact box endpoints. It may not estimate them from sampled recurrence
output.

## Metric formal coefficients

The `D` and `S` recurrences contain linear `n*d_(n-1)` or `n*e_(n-1)` terms and
quadratic sources built from `H`, its factored momentum, and geometric-series
coefficients of the displayed `f0` denominators. The elementary convolution
bound

```text
sum_(j=0)^n j!*(n-j)! <= 3*n!
```

shows that products of two sequences bounded by `C*A^n*n!` remain Gevrey-1
after increasing the outward constant. Analytic geometric factors also fit the
same class after requiring `A` to dominate their directed coefficient ratio.

This supplies a feasible induction route for `D,S` and their vacuum analogues,
but the complete constants and base cases are still unbound.

## First and second state derivatives

Differentiating the exact triangular recurrence introduces:

- derivatives of `kappa`, `beta`, `kappa_bar`, and `beta_bar` already provided
  by the v17 carrier-parameter module;
- derivatives of the dependent vacuum `Mbar_infinity` observable;
- additional polynomial factors in `n` and powers of the strict denominator
  margin `1/kappa_0`.

The future proof must run the same majorant induction for value, every directed
first state derivative, and every directed second state derivative. A value-only
Gevrey bound cannot satisfy `Z1` or `Z2`.

## What local Gevrey control proves—and does not prove

From

```text
|h_n| <= C*A^n*n!,
```

the factorially divided Borel series

```text
B_H(t) = sum_(n>=0) h_n*t^n/n!
```

converges at least for `|t|<1/A`. This proves only a local Borel germ.

It does **not** prove:

- analytic continuation along `t in [0,infinity)`;
- absence of a positive-ray Borel singularity;
- an exponential-type bound compatible with every `q,Q <= 1/255`;
- uniqueness of a lateral sum or absence of Stokes ambiguity;
- equality between a Borel sum and the formal part required by the exact
  full-tail residual split.

Those are the next hard obligations.

## Scalar Borel-plane principal structure

Writing the coefficient recurrence as an exponential-generating/Borel equation
shows that the degree-two shifted terms contribute at most `B'`, `B`, and
integrated Borel variables. Only the `h_(n+1)` and unshifted `h_n` terms
contribute `B''`. Their exact coefficient is

```text
t*(t+2*kappa)
```

in each chart. Hence a strict box margin `kappa>=kappa_0>0` excludes a finite
positive-ray zero of the scalar principal coefficient; the nonzero singular
location exposed by this principal part is on the negative ray at
`t=-2*kappa`.

This is encouraging but not yet positive-ray summability. The full first-order
Borel system, its growth at infinity, the metric recurrences, and all state
derivatives still require directed bounds.

The exact derived system is recorded, without a seal or summation authority,
in
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a-universal-scalar-borel-system.v1.json`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a-universal-scalar-borel-system.v1.json).

Both charts reduce to the same system after setting `mu=M` in the positive
chart and `mu=eta*Mbar_infinity` in the vacuum chart. Its large-`t` scalar
characteristic is `(r-2*mu)^2`. The candidate Borel exponential type is thus
`2*mu` with a possible polynomial prefactor. This exactly matches the strict
formal-metric tail margin `1-2*mu*x>0` at `x<=1/255`, but that match is only a
feasibility indicator until a uniform global growth theorem is proved.

The companion metric/source transform is recorded in the unsealed
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a-metric-borel-system.v1.json`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a-metric-borel-system.v1.json).
It derives a common `D,S` operator with denominator `t+2*kappa`, while keeping
the positive and vacuum nonlinear source normalizations distinct. It also
records the required derivative-convolution product rather than incorrectly
using pointwise Borel products.

Complete first/second state differentiation is recorded in the unsealed
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json).
It includes both Hessian mixed orientations, the dependent vacuum mass jets,
and a three-tier exponential budget template that retains a strict final
Laplace margin. None of those global tier bounds is yet proved.

The unsealed
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json)
now defines the tail Lyapunov-witness predicate, explicit value and
coordinate-derivative Laplace-tail formulas through order 12, a lossless
three-parameter jet realization, bounded Taylor/Picard continuation,
derivative-convolution panels, directed finite Laplace moments, composite GL6
Chebyshev projection, fixed selector schedules, hard resource ceilings and
wire fields. The definition is still unsealed and implementation remains
forbidden until an independent acknowledgement binds its exact bytes.

## Next bounded mathematical lead

The exact systems and many bounded identities remain useful, but the
[`pre-acknowledgement completeness review`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-preacknowledgement-completeness-review.md)
found nine missing bindings. The next eligible action is additive definition
repair that must:

1. define the Gevrey producer and exact tail augmented systems;
2. close polynomial growth, Picard and Volterra remainder selectors;
3. bind the truncated weighted coefficient tail, endpoint observable ingress,
   wire compatibility, canonical hashes and failure precedence; and
4. expand both audits before any replacement acknowledgement request.

Acknowledgement would authorize only candidate-neutral C08 implementation and
manufactured/corruption fixtures. It would not prove that a future selected
box actually supplies a Lyapunov witness, fits the resource budget, or passes
C08. Those remain fail-closed scientific outputs of the later one-shot run.
The former acknowledgement request is retained as withdrawn evidence and must
not be used.

## Evidence and authority

- Exact recurrence audit:
  [`scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py`](../../scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py),
  candidate-neutral 46/46 PASS, including exact predecessor hashes, universal
  scalar and chart-parallel metric systems, lossless first/second state jets,
  growth/tail identities, bounded continuation/projection selectors and hard
  resource/authority checks.
- Cross-language definition replay:
  [`scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs`](../../scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs),
  14/14 PASS with independent parent acknowledgement explicitly false.
- Candidate evaluations: `0`.
- Positive candidate samples: `0`.
- Candidate roots, token, authorization and ledgers: absent.
- C08: `partial`.
- Proof and all downstream authorities: false.
