Program gate: G2G — Tolman-VII candidate preregistration
Workstream: authenticated classical control branch
Capability or component: two implementation-independent derivations of the frozen geometry
Current maturity: exact definition routes written; no candidate evaluation or proof execution
Target maturity: byte-bound route agreement suitable for independent definition audit
Required frozen inputs: G2F identity at `mu=1`, `M/R=1/5` and the G2G candidate contract
Required evidence: exact route-A/route-B identities, endpoints, junction and falsifiers
Stop/fail criteria: route disagreement, notation collision, hidden scale choice, G2D reuse or numerical fitting
Explicit non-goals: candidate solve, proof receipt, quantum mode computation, backreaction, lanes, lamp or physical claims
Downstream gate unlocked: G2G definition replay only

# G2G Tolman-VII derivations

This packet changes mathematical definitions only. It grants no runtime or
receipt authority. Throughout, `R=r_b>0`, `x=r/R`, `C=M/R=1/5`, the signature
is `(-,+,+,+)`, and

```text
ds^2/R^2 = -A(x) d tau^2 + B(x) dx^2 + x^2 dOmega^2.
```

The symbol `C` is compactness. Neary, Ishak and Lake use a different symbol
`beta_N` for a dimensionless radius and derive `R/M=5/beta_N^2`; their exact
choice `beta_N=1` is therefore the same `C=1/5` member. The two symbols must
never be conflated.

## Route A — primary closed-form solution

Raghoonundun and Hobill define

```text
rho(r) = rho_c [1-mu (r/R)^2].
```

For the natural star `mu=1`, direct integration with `m(0)=0` gives

```text
M = 4 pi rho_c R^3 (1/3-1/5) = 8 pi rho_c R^3/15.
```

Thus `8*pi*R^2*rho_c=15C=3`, and the exact dimensionless matter and mass
functions are

```text
RHO(x) = 3(1-x^2),
u(x)   = m(r)/R = (5x^3-3x^5)/10,
Z(x)   = B(x)^(-1) = 1-2u/x = 1-x^2+3x^4/5.
```

Let

```text
s     = sqrt(3/5),
delta = 1/sqrt(15),
h(x)  = atanh[s x^2/(1+sqrt(Z(x)))],
h1    = h(1),
theta = h-h1.
```

The primary closed form, rewritten so the surface constants are explicit, is

```text
Y(x) = sqrt(A(x)) = s cos(theta)+delta sin(theta).
```

It obeys `Y(1)=s`, `Y'(1)=delta`, and the radial Einstein equation defines

```text
P(x) = 2 Z Y'/(xY) + (Z-1)/x^2
```

with its even analytic origin limit. The equation of state is the single-valued
parametric function `P_EOS(RHO)=P(sqrt(1-RHO/3))` on `0<=RHO<=3`.

## Route B — Einstein/TOV reconstruction

This route starts only from the frozen density, the areal metric ansatz and the
Einstein equations. It does not import route A's mass or lapse formula.

The `tt` equation gives

```text
u'(x)=x^2 RHO(x)/2,  u(0)=0,
```

so exact integration independently yields

```text
u=(5x^3-3x^5)/10,  Z=1-2u/x=1-x^2+3x^4/5.
```

Equality of radial and tangential pressures gives the independent lapse
boundary-value problem

```text
2 Z Y'' + Z'Y' - 2 Z Y'/x + Z'Y/x - 2(Z-1)Y/x^2 = 0,
Y(1)=sqrt(3/5),
Y'(1)=1/sqrt(15).
```

The declared change of variable `theta=h-h1` reduces this problem exactly to
`Y_theta_theta+Y=0`. Its unique solution is therefore the route-A `Y`. The
radial Einstein equation then gives the same `P`, while stress conservation
independently requires

```text
P'=-(RHO+P)(u+x^3 P/2)/[x(x-2u)].
```

Agreement of these two pressure routes is an exact identity duty, not a fitted
residual.

## Exact endpoint and domain duties

At the origin:

```text
RHO=3, RHO'=0, u=0, u/x^3 -> 1/2,
Z=1, Z'=0, Y'=0, P and curvature scalars finite.
```

At the material surface:

```text
RHO=P=0, u=1/5, Z=A=3/5,
Y=sqrt(3/5), Y'=1/sqrt(15).
```

For `x>=1`, both routes bind the same exterior:

```text
A=1-2/(5x), B=A^(-1), u=1/5, RHO=P=0,
```

with `A,B -> 1` at infinity. The surface conditions are precisely the
Israel-Darmois conditions for no singular shell.

The horizon polynomial has an exact global minimum:

```text
Z'(x)=2x(-1+6x^2/5),
x_min^2=5/6,
Z_min=7/12>0.
```

This establishes only the algebraic horizon margin. Positivity of pressure,
causality, energy conditions, radial stability and every quantum duty remain
future certified-proof obligations under the byte-frozen G2G contract.

## Quantum definition boundary

The geometry is paired with one free real, minimally coupled control scalar at
`m_phi R=1`. The state is the positive-frequency static ground state obtained
from the positive Friedrichs extension of the frozen spatial Klein-Gordon
operator. Junker's theorem is used only after global hyperbolicity and operator
positivity are proved. The same state, Hadamard length `ell_H=R`, and zero finite
ambiguity vector bind the later mean RSET and connected noise kernel. The mean
uses the exact `D=4`, `xi_R=0`, `Theta_ab=0` specialization of Décanini and
Folacci equations (32), (61), (70), and (109), including the `2 g_ab v1`
conservation term; it is not an unspecified point-splitting convention.

No RSET, noise value, eigenmode, radial mode or candidate output is computed in
G2G.
