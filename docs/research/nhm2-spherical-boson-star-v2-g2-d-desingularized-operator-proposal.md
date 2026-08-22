# NHM2 Spherical Boson-Star v2 G2-D Desingularized Operator Proposal

Program gate: **G2 — classical branch proof and terminal state**

Workstream: exact vacuum/no-fold/continuum proof definitions

Capability or component: desingularized Einstein–Klein–Gordon operator and
parameter-derivative observables

Current maturity: exact derivation proposal; unsealed, unimplemented, and not
execution-authorizing

Target maturity: an independently reviewed definition that can fill only the
`desingularizedOperatorGDefinition` and
`desingularizedOperatorGSourceBinding` choices in a later versioned G2-D
contract

Required frozen inputs: branch BVP semantic SHA-256
`ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557`
/ 13,847 canonical bytes and raw SHA-256
`4df37db5f8b01bda9b0c02eaef2fb661abd67e71fbe99ede51aa3238348cfcab`
/ 28,619 bytes; branch-selection raw SHA-256
`d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82`
/ 44,912 bytes; vacuum-ABI raw SHA-256
`44c6392b56fe31a193e83e298effdd3dcc0b67c7cc684a45558a2ca2e48a8a81`
/ 46,152 bytes

Required evidence: independent symbolic substitution into the frozen
cancellation-free rows, λ=0 continuity, exact boundary conversion, and a later
directed-interval implementation that evaluates the same expression tree

Stop/fail criteria: disagreement with any frozen BVP row; division by λ at
λ=0; an unspecified branch for `w`; silent cancellation or reassociation of a
frozen row; or treating this proposal as a proof receipt

Explicit non-goals: Banach-space packing, core-tail representation, radii
polynomials, interval Newton, λ=0 ground-state proof, candidate execution,
terminal-state issuance, candidate admission, downstream geometry/state,
diagnostic lamp, physical viability, propulsion, or transport

Downstream gate unlocked: independent review of the first two G2-D definition
choices; this proposal alone unlocks no implementation or execution

Change class: authority-neutral mathematical preregistration proposal

## Status and decision boundary

This document derives one exact continuous operator from mathematics already
frozen in the branch BVP. It does not choose the still-open coefficient-space,
packing, tail, inverse, proof-runtime, or receipt definitions. The exact first
remaining scientific choice after this operator is accepted is the packed
Banach-space/core-tail formulation.

No expected semantic hash is assigned here. Independent review must precede a
versioned contract and seal checkpoint.

## Frozen substitutions

Let

```text
lambda in [0,2^-5]
s = lambda^2
y = lambda*x
varphi(x) = s*u(y)
F0(x) = s*v0(y)
F1(x) = s*v1(y)
w^2 = 1 + 2*s*nu
M = lambda*m
```

The positive frequency branch is mandatory:

```text
w = sqrt(1 + 2*s*nu) > 0.
```

For `lambda>0`, divide each frozen solved residual by `lambda^4=s^2`.
Primes below mean `d/dy`, not `d/dx`. Define

```text
E0 = exp(-2*s*v0)
E1 = exp(-2*s*v1)
phi1(z) = expm1(z)/z when z != 0, and phi1(0) = 1
Q0(s,v0) = -2*v0*phi1(-2*s*v0).
```

Thus `Q0=(exp(-2*s*v0)-1)/s` for `s>0`, with the unique continuous
extension `Q0(0,v0)=-2*v0`. An implementation must evaluate `Q0` through a
directed, cancellation-safe `expm1`/`phi1` enclosure; it may not form a
pointwise `0/0` quotient.

## Exact desingularized solved operator

The solved row order remains exactly
`[einstein_Et_t, einstein_Etheta_theta, klein_gordon]`. Define
`G(z,lambda)=[G_t,G_theta,G_KG]`, where

```text
G_t =
  E1*(2*v1'' + s*(v1')^2 + 4*v1'/y)
  + E0*(1 + 2*s*nu)*u^2
  + s*E1*(u')^2
  + u^2

G_theta =
  E1*(s*(v0')^2 + v0'' + v1'' + (v0' + v1')/y)
  - E0*(1 + 2*s*nu)*u^2
  + s*E1*(u')^2
  + u^2

G_KG =
  E1*(u'' + 2*u'/y + s*(v0' + v1')*u')
  + (Q0(s,v0) + 2*nu*E0)*u.
```

At the regular center, `v1'/y`, `(v0'+v1')/y`, and `u'/y` are evaluated
only through their even-series limits. Pointwise division by `y=0` is
forbidden.

The unused constraint is retained for proof replay, not solved:

```text
G_x =
  E1*(s*(2*v0'*v1' + (v1')^2) + 2*(v0' + v1')/y)
  - E0*(1 + 2*s*nu)*u^2
  - s*E1*(u')^2
  + u^2.
```

These expressions preserve the frozen uncancelled Einstein, stress, and box
term groupings. A later evaluator must also retain the original row-term
ledger so normalized residual replay uses the frozen denominator rule rather
than a simplified expression.

## Lambda-zero extension

Direct substitution `s=0`, `E0=E1=1`, and `Q0=-2*v0` gives

```text
G_t(0) = 2*v1'' + 4*v1'/y + 2*u^2

G_theta(0) = v0'' + v1'' + (v0' + v1')/y

G_KG(0) = u'' + 2*u'/y + 2*(nu - v0)*u

G_x(0) = 2*(v0' + v1')/y.
```

This is the limiting Newtonian boundary-value operator induced by the frozen
relativistic rows. It does not itself prove the required ground-state
existence, simple kernel, transversality, or first-tube containment.

The scaled boundary conditions are

```text
u(0) = 1
v0'(0) = v1'(0) = u'(0) = 0
v0(y), v1(y), u(y) -> 0 as y -> infinity
1 + 2*s*nu > 0.
```

At `lambda=0`, the positive-frequency limit is `w=1`. The value of `nu(0)`
is an eigenvalue of the limiting ground-state problem, not a value that may be
inferred from the finite N=64 diagnostic.

## Exact Schrödinger–Poisson reduction at lambda zero

The unused constraint is part of the limiting proof. At `lambda=0`, `G_x=0`
and asymptotic flatness imply

```text
v0'(y) + v1'(y) = 0
v0(y) + v1(y) = 0.
```

Set `V=v0=-v1`. Then `G_t=0` and `G_KG=0` become exactly

```text
V'' + 2*V'/y = u^2
-(1/2)*(u'' + 2*u'/y) + V*u = nu*u
```

with

```text
u(0)=1
u'(0)=V'(0)=0
u(y),V(y)->0 as y->infinity
nu<0.
```

The frozen spherical Newtonian directed-proof definition is therefore relevant
design evidence under the exact map `u0=u`, `V0=V`, and `nu0=nu`. Its current
semantic SHA-256 is
`c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99`
/ 42,778 canonical bytes and its raw source SHA-256 is
`0b51f6df4cf6ded8c0008e4392f5e08f8752a30259d0deba829edf7689707853`
/ 61,403 bytes.

This map can define the limiting profile expected by G2-D, subject to an exact
source pin and independent review. It does **not** turn that predecessor into a
G2 proof receipt: G2 must still execute/authenticate the ground-state proof in
its own source/runtime closure and separately prove the linearized simple
kernel, bifurcation transversality, and first-tube containment.

## Exact tangent-observable conversions

The frozen tangent normalization is `t_lambda=1`. When a validated tangent
provides `nu_lambda` and `m_lambda`, the no-fold observables are

```text
dw/dA = (nu + (lambda/2)*nu_lambda)/w,  lambda > 0
lim_(lambda->0+) dw/dA = nu(0)

dM/dlambda = m + lambda*m_lambda.
```

The first identity follows from `A=lambda^2` and
`w=sqrt(1+2*lambda^2*nu(lambda))`. The second follows from `M=lambda*m`.
The λ=0 frequency-orientation value therefore depends on the separately
certified limiting solution and tangent; it may not be obtained by dividing a
finite-λ difference by `A` after the run.

## Required independent checks before contract sealing

1. Substitute the scaling into each frozen uncancelled BVP term and verify that
   every term is divisible by `s^2` for `s>0`.
2. Verify the three solved rows and unused constraint above without algebraic
   cancellation across the frozen `G`, `T`, and box term groups.
3. Verify the `phi1` continuous extension and its partial derivatives through
   the order required by `D_zG` and `partial_lambda_G`.
4. Verify the even-origin limits and boundary conversion.
5. Verify the exact Schrödinger–Poisson reduction, including use of the unused
   constraint and the asymptotic integration constant.
6. Verify the two tangent-observable identities, including the λ=0 analytic
   limit.
7. Freeze a canonical expression tree and source binding before any directed
   interval implementation.

## Remaining first blocker

The operator alone does not determine one validated numerical proof. The next
proposal must uniquely define, together:

- the exact unknown vector and whether `m` and the scalar tail amplitude are
  coordinates or derived functionals;
- the core and analytic-tail unknowns, join equations, boundary/tau rows, and
  index order;
- the spatial and parameter Chebyshev maps and coefficient serialization;
- the `chi=17/16` weighted product-space norm and component weights;
- the finite/infinite split and tail preconditioner.

Until those choices are frozen and independently reviewed, G2-D remains
`BLOCKED` at `unknownVectorZPackingDefinition`. That is a definition blocker,
not numerical evidence against the candidate.
