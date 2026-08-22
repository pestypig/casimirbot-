# NHM2 Spherical Boson-Star v2 G2-D Lambda-Zero Closure Proposal

Program gate: G2 — classical branch proof and terminal state

Workstream: lambda-zero limiting-ground-state proof closure

Capability or component: limiting ground state, simple kernel, bifurcation
transversality, and first-tube containment

Current maturity: exact limiting equations and Newtonian proof architecture;
exact origin oracle implemented; no accepted seed or lambda-zero product

Target maturity: one versioned, independently reviewed lambda-zero definition
whose implementation can emit a content-addressed authority-neutral product

Required frozen inputs: final branch-selection policy; desingularized operator;
vacuum proof ABI; Newtonian seed, operation, directed-proof, and directed-proof
operator contracts; G2-D core-tail packing; exact origin oracle

Required evidence: accepted global Schrödinger–Poisson root; spectral kernel;
adjoint pairing; normalized coupled-Jacobian inverse; tangent; exact embedding;
first-tube inclusion; source/runtime/preseal; source-disjoint replay

Stop/fail criteria: ambiguous kernel operator; spectral simplicity substituted
for coupled invertibility; finite diagnostic used as a proof; zero pairing;
failed embedding or first-face inclusion; retry, retune, or authority promotion

Explicit non-goals: executing the Newtonian seed, constructing a positive-
lambda point, proving any later cell, admitting the candidate, lighting a lamp,
or making physical, propulsion, or transport claims

Downstream gate unlocked: first-cell positive-lambda point construction and
uniform radii-polynomial proof

Change class: authority-neutral mathematical definition proposal

## Verdict

The lambda-zero proof is **not uniquely implementable from the current sealed
ABI**. Four required definition fields remain null, and “simple kernel” and
“bifurcation transversality” do not identify one operator or pairing.

The smallest honest successor should freeze the stronger, non-substitutable
four-part package below. This proposal does not fill the ABI fields and does
not authorize execution.

## 1. Limiting ground-state product

The limiting equations are the exact radial Schrödinger–Poisson system

```text
V'' + 2*V'/y = u^2
-(1/2)*(u'' + 2*u'/y) + V*u = nu*u
u(0)=1, u'(0)=V'(0)=0, u(infinity)=V(infinity)=0, nu<0.
```

The accepted product must bind one independently replayed global root from the
frozen Newtonian directed-proof architecture under the exact G2 map

```text
u0 = u
V0 = v0 = -v1
nu0 = nu
m0 = C = integral_0^infinity y^2*u0(y)^2 dy.
```

An N=64 diagnostic, an unproved seed output, the exact origin recurrence by
itself, or a finite exterior truncation is not this product.

The existing exact origin oracle closes only the local recurrence and radius
formula subproblem. Its radius selection remains unavailable until the frozen
directed interval recurrence proves the derivative-envelope base at indices
17 through 34.

## 2. Two distinct linear claims

The successor must not use one “kernel” receipt for two different statements.

### 2.1 Fixed-potential spectral simplicity

On the frozen radial weighted domain, define

```text
L0 h = -(1/2)*(h'' + 2*h'/y) + (V0-nu0)*h.
```

The spectral receipt must prove

```text
kernel(L0) = span{u0}
```

with the regular-origin and decaying-tail boundary conditions. Positivity and
nodelessness of `u0` may be used only after they are authenticated by the same
accepted limiting-ground-state product. The receipt must bind its function
space, domain, normalization, boundary form, and interval Sturm comparison or
equivalent validated spectral method.

### 2.2 Normalized coupled-Jacobian invertibility

Spectral simplicity at fixed `V0` does not prove invertibility of the coupled
Schrödinger–Poisson equations. Define the augmented residual

```text
R(u,V,nu) = (
  -(1/2)*(u''+2*u'/y) + (V-nu)*u,
  V''+2*V'/y-u^2,
  u(0)-1
).
```

Its derivative at the accepted root is

```text
DR0(delta_u,delta_V,delta_nu) = (
  L0*delta_u + u0*delta_V - u0*delta_nu,
  delta_V''+2*delta_V'/y - 2*u0*delta_u,
  delta_u(0)
).
```

The coupled receipt must prove `DR0` is bijective between the exact frozen
Newtonian proof spaces. A directed approximate inverse plus a strict
`norm(I-B*DR0)<1` bound is acceptable. Spectral simplicity alone is not.

## 3. Bifurcation transversality

For the fixed-potential spectral equation, the parameter derivative is

```text
partial_nu R_s = -u0.
```

Using the radial pairing frozen by the successor,

```text
<f,g> = 4*pi*integral_0^infinity y^2*f(y)*g(y) dy,
```

the transversality scalar is

```text
tau = <u0,partial_nu R_s>
    = -4*pi*integral_0^infinity y^2*u0(y)^2 dy < 0.
```

The receipt must enclose `tau` strictly below zero from the same accepted
profile and mass integral. Merely asserting nonzero normalization or using a
finite-difference eigenvalue slope is forbidden.

This spectral transversality does not replace normalized coupled-Jacobian
invertibility. The successor must record both duties and both results.

## 4. Lambda-zero tangent and first-tube containment

The desingularized positive-lambda equations use `s=lambda^2`. The successor
must freeze whether the state coefficients are represented as analytic in `s`
or in `lambda`. The recommended representation is analytic in `s`, while the
extended continuation coordinate retains the frozen orientation

```text
t_lambda = 1.
```

The lambda-zero tangent must be obtained from the differentiated augmented
coupled system, not a finite positive-lambda difference. Every state derivative
that is zero by evenness must be proved zero from the frozen expression graph;
it may not be inserted as an unstated convention.

The first-tube receipt must then bind:

1. the accepted lambda-zero ground-state product and linear receipts;
2. the exact embedding of `u0,V0,nu0,m0` and its tangent into the G2-D packed
   core/tail coordinates;
3. the first cell identity `I_0=[0,2^-15]` and its persisted center bytes;
4. a directed product-norm enclosure of the embedded state and tangent by the
   first selected tube radius;
5. face orientation compatible with `t_lambda=1`;
6. exact source, runtime, preseal, persistence, and replay bindings.

Containment must be checked only after the first-cell uniform bounds select a
radius. A pointwise lambda-zero match or agreement with the first positive
node is insufficient.

## Required successor boundary

The versioned successor should expose four separate definitions and four
separate receipt bindings:

```text
limitingGroundState
fixedPotentialSimpleKernel
normalizedCoupledJacobianInverseAndTransversality
firstTubeContainment
```

It should additionally freeze the exact radial pairing, function spaces,
linear input/output codecs, operation order, interval precision, runtime
closure, and failure precedence. Every receipt remains diagnostic and
authority-neutral. Failure of any one duty terminates G2 without changing the
candidate, radii, cutoff, precision, or definitions.

## Current disposition

No lambda-zero seed, proof, tube, positive-lambda point, candidate, output,
registry, or Casimir execution is authorized by this proposal. Candidate
admission, branch acceptance, Theory Graph, physical, propulsion, and transport
authority remain false/null.
