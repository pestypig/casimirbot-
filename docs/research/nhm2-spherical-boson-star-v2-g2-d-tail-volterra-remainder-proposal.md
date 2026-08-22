# NHM2 Spherical Boson-Star v2 G2-D Tail Volterra/Remainder Proposal

Program gate: G2 — classical branch proof and terminal state

Workstream: exact proof-definition successor

Capability or component: bounded half-line tail synthesis from the frozen
finite asymptotic jet, exact Volterra kernels, and directed core-join outputs

Current maturity: exact unsealed replacement architecture; physical kernels,
norm domain, directed kernel constants, canonical internal contraction, and
implicit tail-join derivative ledger are fixed; one unsealed normalized
nonlinear source-envelope calculus is preregistered, while its independent
audit and source implementation are absent

Target maturity: one bounded, independently reviewed tail fixed-point operator
that proves existence, local uniqueness, parameter analyticity, and all six
directed join outputs uniformly on every vacuum cell tube

Required frozen inputs: the active G2 packet; final branch-selection tail
policy; boundary recurrence and its `C_0,...,C_8,A_9,B_9` chronology; the
desingularized solved rows; the core packing and finite/infinite audit; the tail
analyticity counter-audit; `chi=17/16`; the fixed join `y=64`; and the vacuum
ABI radii `2^-80,...,2^-8`

Required evidence: exact equivalence to all three solved rows, bounded weighted
radial and parameter norms, directed kernel constants, strict radii inequalities
on the frozen schedule, finite-jet compatibility, uniform singularity
separation, and directed value/derivative joins

Stop/fail criteria: a nonintegrable kernel; a nonpositive decay or denominator
margin; a residual or derivative not bounded by the declared graph norm; a
finite jet inconsistent with the Volterra equation; failure of the canonical
internal contraction; any fallback to the rejected infinite Taylor sectors; or
any post-observation split, norm, truncation, precision, or radius change

Explicit non-goals: candidate or proof execution, adaptive cell subdivision,
tail-series summation, terminal-state issuance, downstream geometry/state,
SI/metric execution, either 68-file lane, a Theory Graph lamp, physical
viability, propulsion, or transport

Downstream gate unlocked: derivation of the normalized nonlinear
source-envelope calculus and exact assembler input manifest; this proposal
alone authorizes no proof or branch execution

Change class: authority-neutral mathematical preregistration

## Decision boundary

This proposal replaces only the rejected radial Taylor realization. It does not
change the frozen physical equations, branch, asymptotic normalization, core
join, parameter cells, radii schedule, or failure rules.

The tail is derived from `(lambda,nu,m,c)` and is not an additional Newton
unknown. The proof program must solve this tail subproblem inside each directed
parameter tube before it may evaluate the five independent joins and the sixth
derived `H_eta` check.

No semantic seal or execution authority is assigned here.

## Coordinates and retained physical factors

Use the already-fixed quantities

```text
s = lambda^2
k = sqrt(-2*nu) > 0
w = sqrt(1+2*s*nu) > 0
y in [64,infinity)
eta = 64/y
z = 1/(k*y) = eta/(64*k)

sigma = m*(1+4*s*nu)/k - 1
b(y) = -k + sigma/y

B(y) = exp(-k*(y-64))*(y/64)^sigma
d = c*exp(-64*k)*64^sigma
E(y) = B(y)^2.
```

Then `d*B=c*exp(-k*y)*y^sigma` exactly. Retain the exact Schwarzschild metric
tails from the packing proposal:

```text
r = s*m/(2*y)
v0_S = (log(1-r)-log(1+r))/s
v1_S = 2*log(1+r)/s
h_S = v0_S+v1_S.
```

At `s=0`, use the already-fixed continuous extensions. Every parameter tube
must prove the real and complex-domain denominator margins required by its
function-valued parameter norm before any kernel evaluation.

## Finite scalar jet and functional remainder

Let the boundary recurrence derive, in its frozen chronology,

```text
P_8(z) = sum_(n=0)^8 C_n*z^n,
C_0 = 1,
```

with metric coefficients emitted through `A_8,B_8`, non-emitted scratch
`A_9,B_9` bound before `C_8`, and all KG compatibility/diagonal rows exact.

The scalar field is

```text
U(y) = d*B(y)*F(y)
F(y) = P_8(z(y)) + Delta_U(y).
```

Do not define `Delta_U` by an infinite asymptotic series. It is a function
obtained from the Volterra fixed point below and must satisfy the frozen graph
envelope

```text
norm_U_rem = max_(j=0,1,2)
  sup_(0<z<=1/(64*k_lower))
    abs(d^j Delta_U/dz^j)/h_j(z),

h_0(z) = z^9/(1-z)
h_1(z) = z^8*(9-8*z)/(1-z)^2
h_2(z) = z^7*(72-126*z+56*z^2)/(1-z)^3.
```

The ratios use their unique continuous zero limits. A verifier may not divide
pointwise by zero. A nonpositive `1-z` margin is a hard domain failure.

## Exact normalized scalar equation

For the solved core/tail fields define

```text
H = h_S + Delta_H
V1 = v1_S + Delta_V1
E0 = exp(-2*s*(H-V1))

A_scalar(y) = 2/y + s*H_y
V_scalar(y) = exp(2*s*V1)
  *(Q0(s,H-V1) + 2*nu*E0).
```

The exact solved scalar row is

```text
U_yy + A_scalar*U_y + V_scalar*U = 0.
```

Substituting `U=d*B*F` gives

```text
F_yy + (-2*k + P_tilde)*F_y + Q_tilde*F = 0,

P_tilde = (2*sigma+2)/y + s*H_y
Q_tilde = b_y + b^2 + A_scalar*b + V_scalar.
```

The frozen definition of `sigma` cancels the nonintegrable `1/y` term in
`Q_tilde`; this cancellation must be checked symbolically and by directed
coefficient enclosure in every parameter tube.

Set `G=F_y`. The boundary conditions are

```text
F(infinity)=1
G(infinity)=0.
```

The exact scalar Volterra map is

```text
G(y) = integral_(t=y)^infinity exp(-2*k*(t-y))
         *(P_tilde(t)*G(t) + Q_tilde(t)*F(t)) dt

F(y) = 1 - integral_(t=y)^infinity G(t) dt.
```

Differentiating these equations recovers the normalized scalar ODE and both
conditions at infinity. No growing homogeneous mode is admitted.

## Exact metric half-line Green kernels

Let `R_H,R_V1` be the exact solved-row right sides in the packing proposal and
let `R_H^S,R_V1^S` be those same expressions evaluated at
`H=h_S,V1=v1_S,U=0`. The algebraic Schwarzschild tails satisfy their vacuum
rows exactly. Define

```text
Delta_R_H = R_H - R_H^S
Delta_R_V1 = R_V1 - R_V1^S.
```

For a source `R` on `[64,infinity)`, define

```text
G_1_infinity[R](y)
  = integral_(t=y)^infinity t*log(t/y)*R(t) dt

G_2_infinity[R](y)
  = integral_(t=y)^infinity (t^2/y-t)*R(t) dt.
```

Their exact derivatives are

```text
d/dy G_p_infinity[R](y)
  = -y^(-p)*integral_(t=y)^infinity t^p*R(t) dt,

d^2/dy^2 G_p_infinity[R](y)
  = p*y^(-p-1)*integral_(t=y)^infinity t^p*R(t) dt + R(y).
```

Consequently

```text
(d^2/dy^2 + p/y*d/dy)G_p_infinity[R] = R
```

with zero value and derivative at infinity. The metric fixed-point rows are

```text
Delta_H = G_1_infinity[Delta_R_H]
Delta_V1 = G_2_infinity[Delta_R_V1].
```

The kernels are part of the definition. Alternate finite cutoffs, numerical
boundary conditions, or integrated constants are forbidden.

## Weighted radial graph norm

The radial proof space is not a Taylor coefficient space. Define positive
flat-factor envelopes

```text
W_0(y) = E(y)
W_1(y) = E(y)*(2*k + 2*abs(sigma)/y)
W_2(y) = E(y)*(
           (2*k + 2*abs(sigma)/y)^2
           + 2*abs(sigma)/y^2).
```

For each metric correction use

```text
norm_E2(Delta)
  = max_(j=0,1,2) sup_(y>=64)
      abs(d^j Delta/dy^j)/(d^2*W_j(y)).
```

The complete radial norm is

```text
norm_radial(Delta_H,Delta_V1,F,G)
  = norm_E2(Delta_H)
    + norm_E2(Delta_V1)
    + norm_U_rem.
```

`F` and `G` are linked by `G=F_y`; they are not counted twice. The proof must
show that every multiplication, exponential divided difference, derivative,
and all three Volterra kernels are bounded in this graph norm on the declared
tube. The displayed `W_j` are conservative absolute envelopes; they are not
candidate-fitted component weights.

## Function-valued parameter algebra

For one frozen parameter cell, expand only the parameter dependence:

```text
X(y,t_lambda) = sum_(j>=0) X_j(y)*T_j(t_lambda)

norm_tail_parameter(X)
  = sum_(j>=0) norm_radial(X_j)*chi^j.
```

This retains the `chi=17/16` Banach algebra in the parameter index while using
the bounded radial graph norm in `y`. Parameter multiplication uses exact
Chebyshev convolution. Modes `j>=33` are explicit directed tails, never zeros.

Before using this norm, every cell must prove that `k,w,sigma,d`, the
Schwarzschild denominators, exponential divided differences, and all
coefficient functions extend without a singularity to the Bernstein ellipse
required by `chi`. Real-axis separation alone is insufficient.

## Closed directed metric-kernel constants

For one directed parameter tube define

```text
k_min = inf k > 0
sigma_abs_max = sup abs(sigma)
alpha = 2*k_min - sigma_abs_max/32.
```

Require `alpha>0`. For `t>=y>=64`,

```text
E(t)/E(y)
  = exp(-2*k*(t-y))*(t/y)^(2*sigma)
 <= exp(-alpha*(t-y)),
```

because `log(t/y)<= (t-y)/64`. A nonpositive `alpha` is a hard tail-domain
failure; it may not be repaired by a finite outer cutoff.

For a metric source define

```text
norm_E0(R) = sup_(y>=64) abs(R(y))/(d^2*E(y)).
```

The exact Green kernels and the positive exponential envelope give the
following closed constants:

```text
C_10 = alpha^-2 + 1/(32*alpha^3)
C_11 = (alpha^-1 + 1/(64*alpha^2))/(2*k_min)
C_12 = (1 + 1/(64*alpha) + 1/(4096*alpha^2))
       /(4*k_min^2)

C_20 = C_10
C_21 = (alpha^-1 + 1/(32*alpha^2) + 1/(2048*alpha^3))
       /(2*k_min)
C_22 = (1 + 1/(32*alpha) + 1/(1024*alpha^2)
          + 1/(65536*alpha^3))
       /(4*k_min^2)

C_G1 = max(C_10,C_11,C_12)
C_G2 = max(C_20,C_21,C_22).
```

They certify

```text
norm_E2(G_1_infinity[R]) <= C_G1*norm_E0(R)
norm_E2(G_2_infinity[R]) <= C_G2*norm_E0(R).
```

The value estimates use

```text
t*log(t/y) <= (t-y)+(t-y)^2/64
t^2/y-t    = (t-y)+(t-y)^2/y
             <= (t-y)+(t-y)^2/64.
```

The derivative and second-derivative constants follow from the exact formulas
already fixed above and the lower envelopes

```text
W_1/E >= 2*k_min
W_2/E >= 4*k_min^2.
```

Every arithmetic operation in these constants is directed outward. They may be
made sharper only by a new versioned preregistration, never after a cell result.

## Closed scalar reference-inverse constant

For a scalar forcing define

```text
norm_S10(S) = max(
  sup_(0<z<=z_max) abs(S(z))/z^10,
  sup_(0<z<=z_max) abs(dS/dz)/z^9),

z_max = 1/(64*k_min) <= 1/64.
```

Let `K_0` be the exact inverse of

```text
Delta_yy - 2*k*Delta_y = S,
Delta(infinity)=Delta_y(infinity)=0:

K_0[S](y) = integral_(t=y)^infinity
  (1-exp(-2*k*(t-y)))/(2*k)*S(t) dt.
```

In the `z` coordinate,

```text
K_0[S](z) = 1/(2*k^2)*integral_(xi=0)^z
  (1-exp(-2*(1/xi-1/z)))*S(xi)/xi^2 dxi.
```

For `0<xi<=z`,

```text
exp(-2*(1/xi-1/z)) <= exp(-2*(z-xi)/z^2).
```

Using this bound once and then integrating by parts once for the second
derivative gives, with `C=norm_S10(S)`,

```text
abs(K_0[S])       <= C*z^9/(18*k^2)
abs(dK_0[S]/dz)  <= C*z^8/(2*k^2)
abs(d2K_0[S]/dz2)<= 3*C*z^7/(2*k^2).
```

On `z<=1/64`, the frozen envelopes satisfy

```text
h_0(z) >= z^9
h_1(z) >= 8*z^8
h_2(z) >= 70*z^7.
```

Therefore the fixed scalar inverse constant is

```text
norm_U_rem(K_0[S]) <= C_K0*norm_S10(S)
C_K0 = 1/(16*k_min^2).
```

The second-derivative estimate uses the exact identity

```text
S(z)-2*integral_0^z exp(-2*(1/xi-1/z))*S(xi)/xi^2 dxi
  = integral_0^z exp(-2*(1/xi-1/z))*S'(xi) dxi.
```

Thus the cancellation needed to retain the `z^7` order is part of the proof;
an implementation may not separately absolute-bound the two left-hand terms.

## Error-coordinate fixed point and identity preconditioner

Use only three independent tail error coordinates:

```text
X = [Delta_H,Delta_V1,Delta_U].
```

Set

```text
F = P_8 + Delta_U
G = dF/dy.
```

Define the exact scalar reference forcing

```text
S_U(X)
  = -P_tilde*G - Q_tilde*F
    -(d2P_8/dy2 - 2*k*dP_8/dy).
```

The ordered fixed-point map is

```text
Phi(X) = [
  G_1_infinity[Delta_R_H(X)],
  G_2_infinity[Delta_R_V1(X)],
  K_0[S_U(X)]
].
```

This is algebraically equivalent to the four-entry display above, but it does
not count `F` and `G` twice. The tail residual is

```text
F_tail(X) = X-Phi(X).
```

Fix

```text
A_tail = I.
```

It is exactly injective. No finite approximate inverse, fitted diagonal, or
tail LU factorization is permitted.

## Canonical internal tail contraction

The center is `X_bar=0`, with `F=P_8` and `G=dP_8/dy`. The tail is a derived
subproblem, not one of the eight Newton coordinate families. Its internal
radius must therefore not be conflated with the vacuum ABI's 73 candidate
radii.

Fix the tail proof cap

```text
R_tail_cap = 2^-8
```

in the radial/function-valued parameter norm. On the entire cap and the entire
largest admissible four-parameter input tube, compute

```text
Y_tail = outward_upper(norm(Phi(0)))
L_tail = outward_upper(
  sup_(norm(X)<=R_tail_cap) operator_norm(D_X Phi(X)))
M_tail = outward_upper(
  sup_(norm(X)<=R_tail_cap) operator_norm(D_X^2 Phi(X))).
```

Require `L_tail<1`. Define the sole allowed internal radius by

```text
R_tail = nextUp_MPFR256(Y_tail/(1-L_tail)).
```

Then require, in order,

```text
0 < R_tail <= R_tail_cap
Y_tail + L_tail*R_tail < R_tail.
```

Failure of any predicate stops the cell. There is no scan, alternate radius,
adaptive cap, or retry. Since the same `L_tail` bounds the complete cap, the
fixed point is unique throughout that cap. `M_tail` is retained for implicit
first/second derivative bounds; it is not a candidate radius coefficient.

The identity operator is the internal fixed-point preconditioner. Its defect is
exactly zero, but that zero is not the full vacuum proof's `Z0`.

## Implicit tail-map derivatives for the full operator

Let `p=(lambda,nu,m,c)` denote the four tail inputs and let

```text
L_X = I-D_X Phi(X_star,p).
```

The contraction proves

```text
operator_norm(L_X^-1) <= 1/(1-L_tail).
```

The exact first derivative is

```text
D_p X_star = L_X^-1*D_p Phi.
```

For directions `p1,p2`, the exact symmetric second derivative is

```text
D_p^2 X_star[p1,p2]
 = L_X^-1*(
     D_p^2 Phi[p1,p2]
     + D_(pX)Phi[p1,D_p X_star[p2]]
     + D_(Xp)Phi[D_p X_star[p1],p2]
     + D_X^2 Phi[D_p X_star[p1],D_p X_star[p2]]).
```

The six join evaluations and their first/second derivatives are bounded from
this same fixed point and the same inverse bound. They feed the complete
eight-family Newton derivative and second-derivative ledgers. A sampled or
separately integrated join derivative is forbidden.

Only after eliminating the tail this way may the full vacuum proof form its
global `Y,Z0,Z1,Z2`. The full `Z0` comes from the finite-plus-identity core
preconditioner in the core finite/infinite audit; `Z1` and `Z2` include the
implicit tail-join derivatives above.

## Nonlinear source-envelope calculus still required

The closed Green constants do not by themselves bound the nonlinear source
DAG. Before an assembler may be implemented, one successor must freeze the
directed rules that convert the exact expressions

```text
Delta_R_H, Delta_R_V1, S_U
```

into `norm_E0` and `norm_S10` bounds on the complete radial/parameter tube.
That successor must provide, without sampled suprema:

1. the range-plus-weighted-norm representation used for every radial factor;
2. exact multiplier constants for Schwarzschild factors acting on an
   `E`-weighted metric correction;
3. exact product constants for two `E`-weighted corrections, including the
   `d^2*E` factor that remains after division by the source weight;
4. exact bounds for `F=P_8+Delta_U`, `F_y`, and the physical combinations
   `U/(d*B)=F` and `U_y/(d*B)=b*F+F_y`;
5. a cancellation-preserving `z^10` bound, and its `z` derivative, for the
   finite-jet scalar defect
   `P_8_yy-2*k*P_8_y+P_tilde*P_8_y+Q_tilde*P_8`;
6. explicit flat-exponential-versus-power constants for every metric-tail term
   entering `norm_S10`;
7. exact first/second perturbation rules in the three tail coordinates and all
   four parameter directions;
8. exact Chebyshev-convolution and `j>=33` parameter-tail accounting; and
9. one bounded canonical input manifest naming every primitive enclosure,
   denominator margin, coefficient wire, and ledger ordinal.

For reference, if `f` and `g` are metric corrections with
`norm_E2(f)<=R`, `norm_E2(g)<=S`, then the displayed weights imply the coarse
but valid product estimate

```text
norm_E2(f*g) <= 4*d_max^2*R*S,
```

because `E<=1` under the already-required decay margin and
`W_1^2/W_2<=1`. This observation is not a substitute for the complete source
calculus: derivative-only source products, analytic compositions, the scalar
finite-jet cancellation, parameter tails, and mixed metric/scalar terms still
need their own ordered bounds.

Until these rules are frozen, code could choose inequivalent constants while
claiming to implement the same proposal. Such code would be a new scientific
choice, not an implementation of this document.

The first exact preregistration of those rules is
[`nhm2-spherical-boson-star-v2-g2-d-tail-source-envelope-calculus.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-source-envelope-calculus.md).
It fixes a projected degree-32 parameter model, a graded endpoint-cap model,
one 256-piece compactified radial cover, order-512 analytic compositions,
factored source identities, structural order-ten scalar cancellation, abstract
graph-ball injection, and the canonical manifest/ledger. It remains unsealed
and unaudited; this proposal does not yet adopt it as proof evidence.

## Fixed nonlinear automatic-differentiation ledger

The bound assembler must evaluate the exact source DAGs for
`Delta_R_H,Delta_R_V1,S_U` with second-order forward automatic differentiation
in the ordered coordinates `[Delta_H,Delta_V1,Delta_U]`. Finite differences,
complex-step sampling, or a separately simplified source expression are
forbidden.

The primitive ledger is exactly:

```text
0 constant_or_frozen_parameter
1 coordinate_or_radial_derivative
2 add_or_subtract
3 multiply
4 reciprocal_with_directed_nonzero_margin
5 exp
6 sqrt_positive_branch
7 Q0_divided_difference_with_s_zero_extension
8 compose_with_G1_infinity
9 compose_with_G2_infinity
10 compose_with_K0.
```

For algebra elements `a,b` and perturbations `h,h1,h2`, use

```text
D(a*b)[h] = Da[h]*b + a*Db[h]
D2(a*b)[h1,h2]
  = D2a[h1,h2]*b + Da[h1]*Db[h2] + Da[h2]*Db[h1]
    + a*D2b[h1,h2]

D(exp(a))[h] = exp(a)*Da[h]
D2(exp(a))[h1,h2]
  = exp(a)*(D2a[h1,h2]+Da[h1]*Da[h2])

D(a^-1)[h] = -a^-2*Da[h]
D2(a^-1)[h1,h2]
  = 2*a^-3*Da[h1]*Da[h2]-a^-2*D2a[h1,h2].
```

The positive square root and `Q0` derivatives use their exact frozen analytic
divided-difference extensions and directed denominator margins. Each primitive
emits value, first-derivative, and symmetric second-derivative bounds before the
next ordinal is evaluated. The three kernel primitives apply only the closed
constants `C_G1,C_G2,C_K0` above.

The tail receipt must retain ordered per-node contributions to
`Y_tail,L_tail,M_tail` and to the implicit first/second join derivatives. The
full proof receipt separately retains the complete `Y,Z0,Z1,Z2` contribution
ledger after tail elimination. A term may contribute to exactly one ledger
position at each derivative order; omission and double counting are both hard
failures.

## Deterministic fixed-point center and error coordinates

The no-retune center is

```text
Delta_H_bar = 0
Delta_V1_bar = 0
F_bar = P_8(z)
G_bar = d/dy P_8(z(y)).
```

All four are evaluated from the frozen parameter-tube enclosures and finite
recurrence. No candidate-derived tail truncation, fitted decay rate, finite
outer boundary, or alternate homogeneous mode is permitted.

The tail fixed-point operator is the same three-coordinate map fixed above:

```text
Phi_tail(X) = [
  G_1_infinity[Delta_R_H],
  G_2_infinity[Delta_R_V1],
  K_0[-P_tilde*G-Q_tilde*F-(P_8_yy-2*k*P_8_y)]
].
```

Here `F=P_8+Delta_U` and `G=dF/dy`; neither is an additional independent
coordinate. The proof works in error coordinates around the displayed center
and must also verify that its unique fixed point obeys the frozen finite-jet
compatibility through `C_8`.

## Full-proof radii boundary after tail elimination

The tail proof does not select a vacuum radius. After the canonical internal
tail contraction and implicit derivative bounds pass, the complete core-plus-
join proof assembles its global `Y,Z0,Z1,Z2` in the eight-family norm and
evaluates every frozen radius

```text
r in [2^-80,2^-79,...,2^-8]
```

in that order, with

```text
existence:   Y+(Z0+Z1-1)*r+Z2*r^2 < 0
contraction: Z0+Z1+2*Z2*r < 1.
```

Select only the first strict pass after evaluating and retaining all 73
results. If none passes, stop the candidate. Subdivision, truncation increase,
precision escalation, or an alternate norm is forbidden.

## Directed join extraction

At `y=64`, equivalently `eta=1`, the tail proof emits in order

```text
H(64)
V1(64)
U(64)
V1_eta(1) = -64*V1_y(64)
U_eta(1) = -64*U_y(64)
H_eta_check(1) = -64*H_y(64).
```

The first five are the Newton joins. The last is the derived Bianchi check and
must agree with the propagated unused constraint enclosure. Every central value
and lower/upper endpoint is computed from the same certified tail ball; sampled
point values or a separate unconstrained integration are forbidden.

## Exact next blocker

The physical half-line kernels, finite-jet remainder, radial graph norm,
parameter algebra, closed kernel constants, canonical internal contraction,
and implicit join-derivative ledger are now fixed. The next bounded work item
is

```text
tailSourceEnvelopeCalculusIndependentAuditAndDirectedAssemblerSource
```

It must audit the linked calculus against the nine rules above. Only after a
CLEAR audit may `tailVolterraDirectedBoundAssemblerSourceAndIndependentAudit`
claim to implement the frozen DAG with directed MPFR256/interval operations,
bind exact source/dependency/toolchain/runtime bytes, and pass analytic fixtures
and hostile margin/ledger tests. Until both successors pass, this proposal
remains unsealed and no proof or branch run is authorized.
