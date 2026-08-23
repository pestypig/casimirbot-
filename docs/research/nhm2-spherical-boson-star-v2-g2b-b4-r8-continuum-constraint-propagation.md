# NHM2 spherical-boson-star v2 G2B-B4-R8 continuum constraint propagation

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: continuum radial-constraint identity and norm definition  
Current maturity: authority-neutral theoretical definition under independent symbolic review  
Target maturity: authenticated continuum definition and single-proposal-preparation decision  
Required frozen inputs: B4-R4 residual equations, frozen isotropic metric/sign conventions, B4-R7 terminal finding  
Required evidence: exact Bianchi/Klein–Gordon derivation, endpoint analysis, fixed dimensionless norm/quadrature, two independent symbolic routes and analytic fields  
Stop/fail criteria: any sign ambiguity, nonregular endpoint, dimensional mismatch, symbolic counterexample, data-selected threshold, or nonunique evidence-backed proposal class  
Explicit non-goals: candidate evaluation, correction/Newton/continuation solve, retry, retune, proof execution, geometry/state, lane, replay, lamp, physical, propulsion or transport authority  
Downstream gate unlocked: preparation of at most one separately versioned numerical formulation proposal, never execution

## Frozen conventions

The dimensionless radial coordinate is `x=m r` with scalar mass normalized to
one, and

```text
ds^2 = -exp(2 F0) dt^2 + exp(2 F1) (dx^2 + x^2 dOmega^2),
Phi(t,x) = phi(x) exp(-i omega t).
```

Write the mixed residuals

```text
A = E^t_t       = G^t_t       - T^t_t,
B = E^x_x       = G^x_x       - T^x_x,
C = E^theta_theta = G^theta_theta - T^theta_theta,
K = Box Phi / exp(-i omega t) - phi.
```

These names bind exactly the point kernel used by B4-R4 through B4-R7. The
square system solves `A`, `C`, and `K`; `B` is the unused equation.

## Exact continuum identity

For a diagonal mixed tensor in the frozen metric, direct Christoffel
contraction gives

```text
nabla_mu E^mu_x = B' + F0' (B-A) + 2 (F1' + 1/x) (B-C).
```

The scalar stress tensor independently gives

```text
nabla_mu T^mu_x = 2 phi' K.
```

The contracted Bianchi identity `nabla_mu G^mu_x=0` therefore fixes, with no
free sign or normalization,

```text
B' + F0' (B-A) + 2 (F1' + 1/x) (B-C) + 2 phi' K = 0.       (1)
```

Define the integrating factor and radial-constraint charge

```text
W(x) = x^2 exp(F0 + 2 F1),
q(x) = W(x) B(x),
S(x) = F0' A + 2 (F1' + 1/x) C - 2 phi' K.
```

Equation (1) is exactly

```text
q'(x) = W(x) S(x).                                        (2)
```

Thus, if the three solved equations vanish and the regular-origin condition
holds, `q` is the zero constant and hence `B=0` for every `x>0`. A raw
pointwise `B` ratio close to the origin is not the continuum propagation norm.

## Endpoint behavior

Regular spherical fields have even origin expansions
`F0=f00+O(x^2)`, `F1=f10+O(x^2)`, and `phi=p0+O(x^2)`. Their first derivatives
are `O(x)` and the four residuals are bounded when the regular limits replace
the displayed `1/x` terms. Consequently `W=exp(f00+2 f10)x^2+O(x^4)` and
`q=O(x^2)`, so the uniquely regular charge boundary value is `q(0)=0`.

At compactified infinity `rho=x/(1+x) -> 1`, asymptotic flatness requires
`F0,F1 -> 0`, the bound scalar and its derivatives to vanish, and the unused
Einstein residual to satisfy `B=o(x^-2)`. The authenticated endpoint condition
is therefore `q(1):=lim(x->infinity) q(x)=0`. A nonzero finite charge constant
would imply a forbidden `B~constant/x^2` tail; divergence or a nonexistent
limit is an endpoint failure rather than a value to clip.

## Dimensionless continuum norms and fixed quadrature

Because `x` is mass-normalized and each Einstein residual has inverse-
dimensionless-radius squared units, `q=x^2 exp(F0+2F1)B` is dimensionless. Under
`x=rho/(1-rho)`, define

```text
I(rho) = integral_0^rho [W S](x(sigma)) / (1-sigma)^2 dsigma,
delta(rho) = q(rho) - q(0) - I(rho).
```

The continuum reporting tuple is frozen as

```text
( ||q||_infinity, ||q||_L2[0,1],
  ||delta||_infinity, ||delta||_L2[0,1], |q(0)|, |q(1)| ).
```

`q` measures unused-constraint magnitude in the propagation variable;
`delta` separately measures violation of the Bianchi/Klein–Gordon propagation
identity. Neither may be substituted for the other.

On an `N`-point ascending Chebyshev–Lobatto `rho` grid, the only admitted nodal
estimators are the maximum absolute nodal value and the positive
Clenshaw–Curtis weighted square sum on `[0,1]`. The cosine-series weights are
fixed by `g2b_b4_r8_constraint_propagation_definition.py`. Endpoint values must
come from authenticated analytic limits, never floating-point evaluation of
`x=rho/(1-rho)` at `rho=1`. For the nodal propagation defect, let `P_(N-1)` be
the unique degree-at-most-`N-1` polynomial interpolating the transformed source
`[W S](x(rho))/(1-rho)^2` at all Lobatto nodes, including authenticated endpoint
limits. The frozen discrete prefix is

```text
I_N(rho_j) = integral_0^rho_j P_(N-1)(sigma) dsigma.
```

Any later implementation may choose a stable integration-matrix realization,
but it must reproduce this interpolatory integral contract; changing the
polynomial, nodes, endpoint limits, or weights requires a new definition.

No absolute acceptance threshold is defined here. A later proposal must
preregister refinement/convergence or rigorous-enclosure rules against these
continuum quantities. It may not derive a rail from B4-R4 endpoint values.

## Assumptions and degeneracies

The identity assumes twice-differentiable metric/scalar fields in the frozen
static spherical ansatz, the stated mixed-index residual convention, the
contracted Bianchi identity, and the same Klein–Gordon normalization used by
the residual kernel. `W` vanishes at the origin, so `B=q/W` is not an endpoint
evaluation; regularity supplies the charge limit instead. Where `phi'=0`, the
local propagation equation cannot diagnose `K` from the unused constraint.
Nonzero `A`, `C`, and `K` may also cancel in `S`, and a zero `delta` proves only
that the residuals obey their differential identity—not that any field
equation vanishes. Conversely, `q=0` alone does not distinguish errors among
the three solved rows. This is why the charge and propagation-defect norms are
reported together and never promoted as separate proof receipts.

## Independent verification and falsifiers

The targeted test source contains three source-distinct checks:

1. exact expansion of the frozen `A,B,C,K` point formulas reduces (1) to zero;
2. a fresh four-coordinate Christoffel construction derives the diagonal
   mixed-tensor divergence coefficients, while an independent scalar-stress
   expansion derives the `2 phi' K` term;
3. even polynomial analytic fields at exact rational radii reduce the complete
   identity to zero.

The definition is falsified by any nonzero symbolic remainder, failure of
positive unit-sum quadrature weights, a nonzero regular-origin charge, failure
of the asymptotic charge limit, dimensional inconsistency, or a counterexample
within the stated differentiability and endpoint assumptions. Coordinate or
matter models outside the frozen ansatz require a new definition version.

## Proposal-preparation decision

This definition removes the R7 ambiguity in only one evidence-backed way:

- preserve the current `A,C,K` continuum equation selection;
- retain the already demonstrated power-of-two row/column equilibration as the
  sole conditioning intervention;
- replace raw first-node `B` localization as a decision quantity with the
  preregistered `q` and `delta` norm tuple and regular endpoint limits.

Therefore, after independent verification passes, preparation of **at most one**
separately versioned formulation proposal is supported. It may combine those
three fixed elements, but it may not excise a node, alter the continuum
equations, select a new threshold from B4-R4, run a candidate, or claim that a
passing solve is likely. Proposal preparation is not execution authority.
