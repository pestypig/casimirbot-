# NHM2 Spherical Boson-Star v2 Lambda-Zero Global-Root Attempt

Program gate: G2 — classical branch proof and terminal state

Workstream: lambda-zero limiting-ground-state proof closure

Capability or component: one bounded approximate global Schrödinger–Poisson
root center for the directed proof program

Current maturity: local exact/directed origin and finite coupled-Jacobian
calculations exist; no accepted global root or authenticated proof product

Target maturity: one immutable calculation receipt containing a bounded global
root center, or one immutable first-failure receipt

Required frozen inputs: lambda-zero definition semantic SHA-256
`bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f`
/ 8,157; Newtonian directed-proof semantic SHA-256
`c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99`
/ 42,778; directed-proof-operator source SHA-256
`084e92c9cb927293a227e076092e7b21f0cce525b92e2a0f35d0ae109e17103a`
/ 54,712; exact and directed origin implementations

Required evidence: exact source/runtime/command bindings frozen before the
attempt; exclusive output creation; complete mesh/state bits; solver status;
ODE and boundary residual replay; no-retune chronology; all authority false

Stop/fail criteria: source or dependency drift; unavailable NumPy/SciPy
runtime; invalid binary64 environment; nonfinite or negative-zero state;
solver exception or nonzero status; node budget exhaustion; failed residual,
boundary, sign, monotonicity, or tail-consistency screen; output collision

Explicit non-goals: treating collocation convergence as a proof; accepting the
ground state; proving the simple kernel, coupled inverse, transversality,
tangent, or first tube; positive-lambda execution; candidate admission; lamp,
physical, propulsion, or transport authority

Downstream gate unlocked: directed global-profile proof-center ingestion only

Change class: authority-neutral numerical preregistration; no result observed

## Decision boundary

This packet freezes one calculation attempt. Its successful outcome is an
approximate center for a later directed proof. It is neither a proof receipt
nor an accepted limiting state. A solver success followed by a directed-proof
failure remains a proof failure. No numerical choice in this packet may be
changed after the attempt begins.

## Frozen equations and variables

The attempted root is the radial Schrödinger–Poisson system

```text
u'' + 2*u'/y = 2*(V-nu)*u
V'' + 2*V'/y = u^2
u(0)=1, u'(0)=V'(0)=0
u(y),V(y) -> 0 as y -> infinity
nu<0.
```

The first-order state is exactly `[u,uPrime,V,VPrime]`; parameters are exactly
`[Vc,nu]`. The finite interval is

```text
epsilon = 2^-12
R = 32
```

The left boundary values and first derivatives are generated from the exact
even origin recurrence through coefficient index 16, converted to binary64
only after the complete rational recurrence is formed for the current
binary64 parameter bits.

At `R`, define

```text
C_R = R^2*VPrime(R)
kappa_R = sqrt(-2*nu)
sigma_R = C_R/kappa_R - 1
```

and impose the two asymptotic boundary rows

```text
VPrime(R) + V(R)/R = 0
uPrime(R) + (kappa_R-sigma_R/R)*u(R) = 0.
```

These are finite-radius approximation rows. The later directed exterior proof
must validate the full analytic tail and may reject this center.

## Frozen collocation attempt

Implementation: `scipy.integrate.solve_bvp` under CPython with NumPy binary64.

Frozen values:

```text
initial mesh: 513 Chebyshev–Lobatto points mapped increasingly to [epsilon,R]
initial Vc: -3/2
initial nu: -1/2
initial u: exp(-y^2/2)
initial uPrime: -y*exp(-y^2/2)
initial V: -3/(2*sqrt(1+y^2))
initial VPrime: 3*y/(2*(1+y^2)^(3/2))
tol: 2^-32
bc_tol: 2^-40
maximum nodes: 16385
maximum nonlinear iterations: the SciPy 1.16.1 solve_bvp implementation default
Jacobian: analytic ODE, parameter, and boundary Jacobians supplied by source
verbose: 0
```

The mesh may adapt only through that frozen solver call and node cap. No second
attempt, altered guess, altered mesh, altered tolerance, alternate algorithm,
precision escalation, or post-result repair is permitted under this packet.

## Frozen post-solve screen

The first failing item in this order terminates the attempt:

1. solver status is exactly zero and success is true;
2. node count is at most 16,385 and every stored value is finite and not
   negative zero;
3. `Vc<nu<0`, `C_R>0`, `kappa_R>0`, and `0<sigma_R+1`;
4. `u>0`, `uPrime<=0`, `V<0`, and `VPrime>=0` at every stored mesh point;
5. the maximum absolute collocation RMS residual is at most `2^-31`;
6. the six boundary residuals are each at most `2^-36` in absolute value;
7. an independent fixed 4,097-point increasing uniform replay, using the
   returned cubic spline and the literal ODE rows, has normalized residual at
   most `2^-24`;
8. the origin recurrence values at epsilon and the two finite-radius tail rows
   reproduce the stored boundary values within `2^-36` absolute error.

The screen is an implementation-integrity filter, not a proof norm.

## Output and chronology

The implementation writes exactly one canonical JSON file by exclusive create.
It stores hexadecimal binary64 words for every mesh coordinate, state value,
parameter, residual, and derived scalar; dependency and runtime versions; the
source/proposal raw hashes and sizes; the exact command; solver counters; the
ordered screen results; and a length-delimited receipt self-hash over the
unsigned root. No pickle, NumPy archive, ambient timestamp, random value,
environment-derived numerical choice, or overwrite is allowed.

The source and test bytes must be finalized, hashed, and recorded in the active
G2 packet before this one attempt is run. The output path must not exist. The
attempt stops after either the first receipt or the first typed failure receipt.

## Authority boundary

Every execution, proof, candidate, acceptance, replay, lamp, physical,
propulsion, and transport authority field is false. A passing receipt may only
be consumed as a proposed center by the separately authenticated directed
global-profile proof. No positive-lambda point, branch cell, or candidate is
created by this packet.
