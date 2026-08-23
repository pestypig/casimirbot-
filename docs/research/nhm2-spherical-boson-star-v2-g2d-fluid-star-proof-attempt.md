Program gate: G2D — fresh replacement-candidate proof attempt
Workstream: authenticated classical control branch
Capability or component: sub-Buchdahl constant-density fluid-star proof packet
Current maturity: exact candidate definition sealed; evaluator implementation checkpoint pending
Target maturity: independently audited one-shot classical proof implementation
Required frozen inputs: G2C selection result and all closed G2B evidence
Required evidence: sealed manifest, no-execution audit, exact model, identities, intervals, disjoint replay and immutable chronology
Stop/fail criteria: any unfrozen parameter, surface ambiguity, hard-rail failure or circular seal
Explicit non-goals: quantum-state acceptance, 68-file lanes, lamp, physical/propulsion/transport claim
Downstream gate unlocked: G3 only after an authenticated G2D classical `PASS`

# G2D sub-Buchdahl fluid-star classical proof attempt

G2C selected the family in
[`nhm2-spherical-boson-star-v2-g2c-selection-result.md`](./nhm2-spherical-boson-star-v2-g2c-selection-result.md).
This packet is the sole active handoff. The exact definition is frozen by
[`nhm2-spherical-boson-star-v2-g2d-fluid-star-preregistration.v1.json`](./nhm2-spherical-boson-star-v2-g2d-fluid-star-preregistration.v1.json).
It authorizes preregistration guards and a later separately reviewed
implementation, not candidate evaluation or execution.

## Frozen classical member

The sole member uses dimensionless areal-radius units `G=c=R=1` and exact
compactness `chi=2M/R=1/4`, hence `M=1/8`. No physical radius, mass, density or
apparatus scale is assigned. This is a known-physics classical control geometry,
not an NHM2 hull solution or a physical star proposal.

For `x=r/R`, the interior is the exact constant-density Schwarzschild solution:

```text
A(x)       = sqrt(1-x^2/4)
f_in(x)    = 1-x^2/4
alpha_in   = (3 sqrt(3)/2-A)/2
m_in(x)    = x^3/8
rhoHat     = 3/4
pHat(x)    = (3/4)(A-sqrt(3)/2)/(3 sqrt(3)/2-A)
```

where `rhoHat=8 pi G R^2 rho/c^2` and
`pHat=8 pi G R^2 p/c^4`. The exterior is Schwarzschild:

```text
f_out(x)   = 1-1/(4x)
alpha_out  = sqrt(f_out)
m_out      = 1/8
rhoHat     = pHat = 0
```

The surface `x=1` is an exact interface. The exterior is separately compactified
by `y=1-1/x`. No global spectral smoothness or derivative stencil is allowed to
cross the density discontinuity.

## Ordered proof and falsification contract

The terminal duty order is parameter/domain, origin, interior Einstein/TOV,
matter rails, surface matching, exterior vacuum, infinity, interval replay and
independent agreement. Exact analytic identities are primary. Uniform rational
open-domain grids at `N=64,96,128,256` may only replay pointwise identities.

The hard rails include `f>=3/4`, `alpha>=3/4`, `chi<8/9` with exact margin
`23/36`, `0<=pHat<=3/32`, exact Darmois matching with no thin shell, and
directed residual intervals that contain zero with width no greater than
`2^-180`. A finite curvature jump at the material surface is expected and is
not misreported as smoothness.

The primary evaluator contract is standard-library CPython on Windows using
exact integers/Fractions and 220-digit directed Decimal enclosures. The
independent contract is C17 plus GMP/MPFR at 768 bits in an offline Linux
container. They may share the frozen mathematical manifest, but not candidate
evaluator source, language runtime, interval library or OS runtime lineage.

Any first failure is terminal. Retry, retune, alternate roots and post-result
threshold changes are forbidden. The exclusive future root is:

```text
artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1
```

It must remain absent throughout preregistration.

## Required preregistration sequence

1. Freeze one exact rational compactness and one dimensionless scale convention.
2. Freeze the interior Schwarzschild solution, exterior Schwarzschild solution,
   pressure/density definitions, time normalization, and surface matching map.
3. Freeze the origin, interior, interface, exterior, infinity, and no-horizon
   proof duties in their terminal order.
4. Freeze independent exact-symbolic and interval-numeric evaluators, including
   source and runtime disjointness.
5. Freeze grids used only for sampled residual/replay checks; analytic identities
   remain primary and may not be replaced by grid agreement.
6. Freeze all thresholds, resource ceilings, exclusive output root, receipt
   schema, command/token derivation boundary, and first-failure behavior. The
   exact command and token remain null until a later checkpoint can bind both
   evaluator source hashes and admitted runtime manifests.
7. Complete a no-execution audit and current-tree verification before requesting
   any one-shot authority.

## Candidate-data boundary

No candidate evaluator may run and no numerical metric sample, solver output or
new output root may be inspected before this definition and its no-execution
audit are sealed. The exact symbolic values written above are definitions, not
observed results. The family selection and sealed member are not proofs and do
not admit a candidate.

## Current authority boundary

The manifest is a definition seal, not a proof receipt. The candidate evaluator
source paths, runtime admission, exact command and execution token do not yet
exist. G2D therefore remains active after this preregistration step. A later
implementation/preexecution packet must bind those identities and pass an
independent no-execution audit before the user may separately authorize one
one-shot proof execution.

## Downstream quantum boundary

G2D proves only the classical control geometry. The scalar Hadamard state,
renormalized mean stress, connected fluctuations/noise, backreaction, complete
exterior, two independent 68-file lanes, and replay belong to later gates. The
known absence of a same-family noise result and the incomplete self-consistent
exterior remain explicit G3 risks.
