# NHM2 Spherical Boson-Star v2 G2-D Core–Tail Packing Proposal

Program gate: **G2 — classical branch proof and terminal state**

Workstream: exact vacuum/no-fold/continuum proof definitions

Capability or component: packed Banach-space unknown, spatial/parameter maps,
analytic tail factorization, and core–tail join

Current maturity: exact unsealed proposal; the three core rows now have one
fixed regular Green-operator realization and the core finite/infinite audit is
fixed by the linked successor, while the same-space infinite tail Taylor
realization is rejected by the linked analyticity audit

Target maturity: an independently reviewed, index-zero definition that can fill
the vacuum ABI packing, basis, codec, norm, tail-factorization, and join choices

Required frozen inputs: the exact pins in the sibling
[`nhm2-spherical-boson-star-v2-g2-d-desingularized-operator-proposal.md`](./nhm2-spherical-boson-star-v2-g2-d-desingularized-operator-proposal.md),
including the final branch BVP, branch-selection policy, vacuum ABI, and
λ-continuous operator

Required evidence: exact endpoint/derivative identities, product-space algebra
proof, uniform core/tail overlap, validated tail-synthesis majorant, complete
core finite/infinite Fredholm count, and independent semantic review before
sealing

Stop/fail criteria: uncovered radial domain; `k<1` anywhere in a certified
tube; nonanalytic or nonfinite tail factor; unknown/residual index mismatch;
result-derived component weights; adaptive join, degree, precision, or
truncation; or treating this proposal as proof execution

Explicit non-goals: approximate inverse, radii bounds, proof runtime/issuer,
candidate execution, terminal state, downstream geometry/state, SI/metric
inputs, 68-file lanes, lamp promotion, physical viability, propulsion, or
transport

Downstream gate unlocked: derivation of the weighted Volterra/remainder tail
replacement; this proposal alone unlocks no implementation or execution

Change class: authority-neutral mathematical preregistration proposal

## Decision boundary

This proposal chooses a representation compatible with the already frozen
`y∈[0,64]`, degree-255 spatial, degree-32 parameter, `chi=17/16`, and analytic
tail policies. It does not yet assert that the resulting differential/tau
operator has index zero. The final row replacement and finite/infinite split
remain the next proof obligation.

No semantic seal or execution authority is assigned here.

## Coordinates and derived scalars

For every parameter cell use the sibling proposal's

```text
s = lambda^2
k = sqrt(-2*nu) > 0
w = sqrt(1 + 2*s*nu) > 0.
```

Core coordinate and affine Chebyshev coordinate:

```text
q = (y/64)^2 in [0,1]
t_core = 2*q - 1.
```

Tail coordinate and affine Chebyshev coordinate:

```text
eta = 64/y in [0,1]
t_tail = 2*eta - 1.
```

The parameter cell is the already frozen
`I_cell=[cell*2^-15,(cell+1)*2^-15]`. Define

```text
lambda_mid = (lambda_left + lambda_right)/2
lambda_half_width = 2^-16
t_lambda = (lambda - lambda_mid)/lambda_half_width in [-1,1].
```

Every square root uses the positive branch and directed enclosure. Every tube
must prove `nu<0` and `1+2*s*nu>0` before evaluating `k` or `w`.

## Exact unknown blocks

The block order is

```text
0 core_AH(q,lambda)
1 core_AV1(q,lambda)
2 core_AU(q,lambda)
3 a(lambda)
4 b(lambda)
5 nu(lambda)
6 m(lambda)
7 c(lambda).
```

The five scalar blocks are parameter functions with no spatial index. The tail
transseries is a deterministic derived synthesis from `(lambda,nu,m,c)`, not a
second set of Newton unknowns. Treating any tail coefficient as an independent
shooting parameter is forbidden.

Physical scaled fields on the core are

```text
H(q,lambda)  = a(lambda) + q*core_AH(q,lambda)
V1(q,lambda) = b(lambda) + q*core_AV1(q,lambda)
U(q,lambda)  = 1 + q*core_AU(q,lambda)

v0(y,lambda) = H(q,lambda) - V1(q,lambda)
v1(y,lambda) = V1(q,lambda)
u(y,lambda)  = U(q,lambda).
```

Here `H=v0+v1`. This coordinate diagonalizes the regular radial principal
parts: `v1''+2*v1'/y` and `H''+H'/y`. The three center derivative conditions
and `U(0)=1` are identities of the representation; `a=H(0)` and `b=V1(0)`
remain solved parameter functions.

Analyticity in `q` enforces the three even-center derivative conditions without
pointwise division by `y`.

Each core function belongs to an infinite tensor-product Chebyshev space:

```text
F(t_space,t_lambda)
  = sum_(j=0)^infinity sum_(n=0)^infinity
    F[n,j]*T_n(t_space)*T_j(t_lambda).
```

The frozen finite center retains `n=0,...,255` and `j=0,...,32`. Higher spatial
or parameter modes may not be discarded from norm bounds. Each of
`a,b,nu,m,c` likewise has an infinite parameter sequence whose finite center
retains `j=0,...,32`. The frozen parameter degree 32 is the
approximate-polynomial degree, not permission to erase nonlinear
parameter-product modes above 32.

## Analytic tail factorization

**Audit disposition:** the physical Schwarzschild and flat-factor formulas in
this section remain useful, but the infinite sector/Taylor realization is
rejected by
[`nhm2-spherical-boson-star-v2-g2-d-tail-analyticity-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-analyticity-audit.md).
The universal operator contains an unbounded `eta^4*K''` action on the declared
same-space `chi` norm, and the frozen scalar recurrence is a generic
irregular-singular asymptotic series. The displayed infinite sums and sector
norm below are retained only as failed derivation evidence and must not be
implemented, sealed, or used for a radii bound. The replacement must retain the
finite asymptotic jet and flat factors in a bounded weighted Volterra/remainder
space.

The raw metric contains an exponentially flat scalar-sourced correction and is
not analytic at `eta=0`. Factoring only one flat exponential is still
insufficient: nonlinear products leave higher powers of that factor, so a
single quotient is generally smooth but nonanalytic. It therefore may not be
placed directly in the `chi`-weighted Chebyshev space. Use the exact flat
transseries factorization below.

First define

```text
r = s*m*eta/128

v0_S = (log(1-r)-log(1+r))/s
v1_S = 2*log(1+r)/s
h_S  = v0_S+v1_S = log(1-r^2)/s.
```

At `s=0`, use the unique continuous extensions

```text
v0_S = -m*eta/64
v1_S =  m*eta/64
h_S  = 0.
```

The logarithms must be evaluated through directed `log1p`/divided-difference
extensions; a pointwise `0/0` quotient is forbidden. These are the exact
Schwarzschild algebraic metric tails because
`r=q_coulomb*z=s*m*eta/128`.

Define

```text
sigma = m*(1 + 4*s*nu)/k - 1

B(eta) = exp(-64*k*(1/eta - 1))*eta^(-sigma), eta>0
B(0) = +0
E(eta) = B(eta)^2

d(lambda) = c(lambda)*exp(-64*k)*64^sigma
zeta(eta,lambda) = d(lambda)^2*E(eta,lambda)

H_1,H_2,... = derived metric-sum sectors
V_1,V_2,... = derived v1 sectors
U_0,U_1,... = derived scalar sectors

U_0(eta,lambda) = 1 + eta*tail_AU(eta,lambda)

h(y,lambda)  = h_S(eta,lambda)
               + sum_(ell=1)^infinity zeta(eta,lambda)^ell*H_ell(eta,lambda)
v1(y,lambda) = v1_S(eta,lambda)
               + sum_(ell=1)^infinity zeta(eta,lambda)^ell*V_ell(eta,lambda)
v0(y,lambda) = h(y,lambda)-v1(y,lambda)
u(y,lambda)  = d(lambda)*B(eta,lambda)
               *sum_(ell=0)^infinity zeta(eta,lambda)^ell*U_ell(eta,lambda).
```

For fixed `(lambda,nu,m,c)`, the sector equations below determine these
coefficients recursively from `eta=0`. Their convergent sums define one
validated tail synthesis map

```text
Tail(lambda,nu,m,c)
  -> [h(1),v1(1),u(1),v1_eta(1),u_eta(1),h_eta_check(1)].
```

Only the first five outputs are Newton join data. The final output is the
derived Bianchi check. The map must be enclosed uniformly over the parameter
tube before it may be used; a finite asymptotic truncation is not a tail
instance.

The `B` and `E` extensions at `eta=0` are flat positive-zero extensions. A
directed implementation must bound them using `t=-log(eta)` rather than
evaluate `1/eta`, `log(eta)`, or a product of zero and infinity at the
endpoint. Every fixed-sector coefficient `H_ell`, `V_ell`, and `U_ell` is
analytic in `eta`. The derived tail uses a Taylor–Chebyshev tensor basis,
distinct from the core's Chebyshev–Chebyshev Newton basis:

```text
F_ell(eta,t_lambda)
  = sum_(j=0)^infinity sum_(n=0)^infinity
    F_ell[n,j]*eta^n*T_j(t_lambda)

norm_chi(F_ell)
  = sum_(j=0)^infinity sum_(n=0)^infinity
    abs(F_ell[n,j])*chi^(n+j).
```

This choice is forced by the lower-triangular asymptotic recurrence and makes
evaluation at `eta=1` bounded by the coefficient norm. The raw flat products
and their infinite sums do not individually claim endpoint analyticity.

This sector structure is closed under the frozen nonlinearities: metric
products and `u^2` add powers of `zeta`, while the scalar equation is linear in
`u` and its metric coefficients add powers of `zeta`. Radial differentiation
preserves each sector because `d` is constant in `eta` and

```text
d(zeta^ell)/deta = ell*(128*k/eta^2-2*sigma/eta)*zeta^ell
d(d*B*zeta^ell)/deta
  = (2*ell+1)*(64*k/eta^2-sigma/eta)*d*B*zeta^ell.
```

The apparent negative powers are cancelled by the exact radial factor
`d/dy=-(eta^2/64)*d/deta`. The future tail operator must extract residuals
sector by sector; evaluating a raw flat function with a geometric Chebyshev
tail and calling it analytic is forbidden.

The separate tail-synthesis proof norm uses literal unit weight:

```text
norm_tail_metric = sum_(ell=1)^infinity norm_chi(H_ell)
                 + sum_(ell=1)^infinity norm_chi(V_ell)
norm_tail_scalar = sum_(ell=0)^infinity norm_chi(U_ell).
```

This is an `ell1` convolution algebra in the sector index. It certifies the
derived tail map but is not an additional component of the Newton unknown
norm. No candidate-derived transseries weight is introduced: physical
smallness is carried explicitly by `zeta`, whose join value is `d^2`. Every
tube must prove a directed convergence condition for its own enclosed `d`; no
universal smallness threshold is assumed here.

The explicit scalar block must satisfy `m>0`; the base then gives
`v0~-m/y`, `v1~m/y`, and `h=O(y^-2)`. For positive λ the frozen ADM
coefficient is `M=lambda*m`.

For positive λ the frozen physical tail amplitude is

```text
C = lambda^(sigma+2)*c > 0.
```

This follows from `varphi=lambda^2*u`, `x=y/lambda`, and the frozen
`x^sigma` tail factor. The correction normalization `C_0=1` is therefore a
definition of `c`, not an additional rescaling freedom. A directed
implementation must evaluate the positive real power through
`exp((sigma+2)*log(lambda))` with outward rounding. Require
`c>0` throughout every positive-λ tube.

At λ=0, this same `y`-scaled factor remains well-defined because `k>0`; the
physical `z=(kappa*x)^-1` chart remains excluded exactly as required by the
branch policy.

## Exact core–tail join

The join is fixed at `y=64`, equivalently `q=eta=1`. Values satisfy

```text
h_S(1) + sum_(ell>=1) d^(2*ell)*H_ell(1) = H(1)
v1_S(1) + sum_(ell>=1) d^(2*ell)*V_ell(1) = V1(1)
d*sum_(ell>=0) d^(2*ell)*U_ell(1) = U(1).
```

The coordinate derivatives are

```text
d/dy = (y/2048)*d/dq                         on the core
d/dy = -(eta^2/64)*d/deta                    on the tail
d2/dy2 = (1/2048)*d/dq + (q/1024)*d2/dq2    on the core
d2/dy2 = (eta^4/4096)*d2/deta2
          + (eta^3/2048)*d/deta              on the tail.
```

The two independent first-derivative join rows are exactly

```text
v1_S_eta(1)
 + sum_(ell>=1) [
     d^(2*ell)*(
       ell*(128*k-2*sigma)*V_ell(1) + V_ell_eta(1)
     )
   ] = -2*V1_q(1)

d*sum_(ell>=0) [
  d^(2*ell)*(
    (2*ell+1)*(64*k-sigma)*U_ell(1) + U_ell_eta(1)
  )
] = -2*U_q(1).
```

No interpolation, tolerance, or one-sided value is permitted in a join row.
These five equalities are coefficient-evaluation identities under directed
outward rounding.

The remaining derivative identity

```text
h_S_eta(1)
 + sum_(ell>=1) [
     d^(2*ell)*(
       ell*(128*k-2*sigma)*H_ell(1) + H_ell_eta(1)
     )
   ] = -2*H_q(1)
```

is not an independent shooting row. Both pieces solve the three frozen rows;
regularity/asymptotic factorization set their propagated `G_x` constants to
zero. Once `h,v1,u,v1',u'` match, the algebraic equation `G_x=0` fixes the same
`h'` on each side. The proof must derive the displayed identity from Bianchi
propagation and then check it independently. It may not delete the check or
replace one of the five independent joins with a sampled tolerance.

This gives the exact shooting count: three regular-core parameter functions
`(a,b,nu)`, two asymptotic parameter functions `(m,c)`, and five independent
join residual functions. The sixth derivative match is a theorem, not a sixth
shooting condition.

The equivalent physical differential-order ledger is:

```text
three second-order physical fields                  6 conditions
frequency eigenvalue nu                            +1 condition
origin evenness for H,V1,U                          3 conditions
origin normalization U(0)=1                       +1 condition
asymptotic decay of H,V1,U                         +3 conditions
total                                               7 = 6+1.
```

The domain decomposition exposes the same count as three core shooting
coordinates `(a,b,nu)`, two tail coordinates `(m,c)`, and five independent
joins. The tail recurrence synthesizes the decaying manifold and does not add
unknown coordinates. Thus the representation has the correct formal Fredholm
count before any finite truncation.

## Formal unknown/residual block bijection

The unknown block order is the eight-block order above. The corresponding
residual block order is

```text
0 core_H_fixed_green_residual
1 core_V1_fixed_green_residual
2 core_U_fixed_green_residual
3 join_H_value
4 join_V1_value
5 join_U_value
6 join_V1_first_derivative
7 join_U_first_derivative.
```

Blocks `0,1,2` are tensor-product spatial/parameter sequences. Blocks
`3,...,7` are parameter sequences. The tail sector equations belong to the
derived synthesis proof, not the Newton residual vector. The derived `H`
derivative join and the unused `G_x` continuum residual are audit outputs, not
extra Newton rows.

## Fixed regular Green realization on the core

The core is no longer permitted to choose between an integrated and a tau
realization. Write `H=v0+v1`, `V1=v1`, `U=u`, and define

```text
E0 = exp(-2*s*(H-V1))
w2 = 1 + 2*s*nu

R_V1 = -(1/2)*(
           s*(V1_y)^2
         + exp(2*s*(2*V1-H))*w2*U^2
         + s*(U_y)^2
         + exp(2*s*V1)*U^2)

R_H = -s*(H_y-V1_y)^2
      + exp(2*s*(2*V1-H))*w2*U^2
      - s*(U_y)^2
      - exp(2*s*V1)*U^2

R_U = -s*H_y*U_y
      - exp(2*s*V1)*(Q0(s,H-V1)+2*nu*E0)*U.
```

Direct division of the frozen uncancelled rows by their positive exponential
prefactors gives exactly

```text
V1_yy + 2*V1_y/y = R_V1
H_yy  +   H_y/y  = R_H
U_yy  + 2*U_y/y  = R_U.
```

This rearrangement defines only the regular principal inverse. Residual replay
must still reconstruct the sibling proposal's original uncancelled term
ledger; it may not normalize or certify a simplified row.

For `p` equal to one or two, define the unique regular radial Green operator

```text
J_p[R](y) = integral_(t=0)^y t^(-p)
              integral_(r=0)^t r^p*R(r) dr dt.
```

The endpoint is the analytic even extension of the integral, never a
pointwise evaluation of `t^(-p)` at zero. The three core residual blocks are
fixed as

```text
core_AH  - J_1[R_H]/q  = 0
core_AV1 - J_2[R_V1]/q = 0
core_AU  - J_2[R_U]/q  = 0,
```

where `q=y^2/4096`. The quotients have removable zeroes because each Green
integral is `O(y^2)=O(q)`. This construction enforces the center rows by
representation and does not delete a low differential residual coordinate.

An exact coefficient implementation must agree with this independent
power-series oracle. If `R(q)=sum_(n>=0) R_n*q^n`, then

```text
(J_1[R]/q)_n = 1024*R_n/(n+1)^2
(J_2[R]/q)_n = 2048*R_n/((n+1)*(2*n+3)).
```

The multipliers follow from the exact coordinate identities

```text
d2/dy2 + (1/y)*d/dy = (1/1024)*(d/dq + q*d2/dq2)
d2/dy2 + (2/y)*d/dy = (1/2048)*(3*d/dq + 2*q*d2/dq2).
```

The implementation may apply `J_p` directly to Chebyshev coefficients or use
an exact Chebyshev-to-power conversion for the finite polynomial center. This
proposal fixes the latter path. For `n>0`, use the exact shifted-Chebyshev
identity

```text
T_n(2*q-1) = sum_(r=0)^n c[n,r]*q^r

c[n,r] = (-1)^(n-r)*2^(2*r)*n/(n+r)*binomial(n+r,2*r),
c[0,0] = 1.
```

Accumulate input modes in increasing `n`, then increasing `r`, apply the
displayed `J_1/q` or `J_2/q` rational multiplier to each monomial coefficient,
and convert `q^r` back in increasing `r` by the exact recurrence

```text
Q_0 = T_0
Q_(r+1) = ((T_0+T_1)/2)*Q_r,
```

using `T_a*T_b=(T_(a+b)+T_(abs(a-b)))/2` with duplicate output modes summed in
increasing ordinal order. No floating transform or alternate conversion is
allowed. Both this finite path and a separate exact power-series oracle must
agree before proof execution. The infinite spatial and parameter tails still
require directed operator-norm bounds. Because the Green operators are
injective on regular functions with the represented center data, a zero of
these fixed-point residuals is equivalent to a zero of the three raw core
differential rows.

No corresponding tail inverse is frozen yet. Applying a generic Chebyshev tau
rule to the summed flat functions rather than extracting their analytic
transseries sectors would silently assume the very endpoint analyticity that
the proof must establish.

## Exact factored-tail sector equations

Let

```text
D_p[f] = f_yy + p*f_y/y, p in {1,2}.
```

For a factor `rho` with

```text
d(log(rho))/deta = alpha/eta^2 + beta/eta,
```

direct substitution of `d/dy=-(eta^2/64)*d/deta` gives the endpoint-regular
identity

```text
D_p[rho*K]/rho = P_(p,alpha,beta)[K]

P_(p,alpha,beta)[K] =
    (eta^4/4096)*K_eta_eta
  + (alpha*eta^2/2048
     +(2*beta+2-p)*eta^3/4096)*K_eta
  + (alpha^2
     +alpha*(2*beta-p)*eta
     +beta*(beta+1-p)*eta^2)*K/4096.
```

Thus the metric sector `zeta^ell*K`, `ell>=1`, uses

```text
alpha = 128*ell*k
beta  = -2*ell*sigma,
```

and the scalar sector `d*B*zeta^ell*K`, `ell>=0`, uses

```text
alpha = 64*(2*ell+1)*k
beta  = -(2*ell+1)*sigma.
```

There is no negative power of `eta` in `P`. Its endpoint radial diagonals are
`4*ell^2*k^2` for each metric sector and
`(2*ell+1)^2*k^2` before the scalar potential contribution. The asymptotic
scalar potential is `2*nu=-k^2`, so sectors `ell>=1` have nonzero net scalar
diagonal `4*ell*(ell+1)*k^2`. Sector `ell=0` is the deliberately resonant
leading tail: the constant term cancels, the frozen Coulomb choice of `sigma`
cancels the compatibility row, and its coefficient recurrence must reproduce
the exact nonzero diagonal `2*k^2*n` for every correction order `n>=1`.

Define formal sector extraction `Coeff_zeta[ell]` after substituting

```text
h  = h_S  + sum_(r>=1) zeta^r*H_r
v1 = v1_S + sum_(r>=1) zeta^r*V_r
u  = d*B*sum_(r>=0) zeta^r*U_r.
```

All exponentials and `Q0` are expanded only as exact analytic compositions in
the formal `zeta` variable; spatial and parameter coefficients remain directed
objects. The three tail residual families are uniquely

```text
F_H[ell]  = Coeff_zeta[ell](D_1[h]  - R_H),  ell>=1
F_V1[ell] = Coeff_zeta[ell](D_2[v1] - R_V1), ell>=1

F_U[ell]  = Coeff_zeta[ell](
                (d*B)^(-1)*(D_2[u] - R_U)
              ),                                  ell>=0.
```

`h_S,v1_S` solve the exact vacuum metric equations, so sector zero of the two
metric residuals vanishes identically. The displayed `P` operator defines
each differentiated sector without ever forming `B^(-1)` or `E^(-1)` at
`eta=0`; those symbols in the scalar extraction are formal factor cancellation
only. A runtime must implement the sector algebra directly.

This definition is closed and triangular by sector ordinal: the residual at
ordinal `ell` depends on derived sectors of ordinal at most `ell`. Within each
sector the endpoint coefficient recurrence is lower triangular in the Taylor
degree. It therefore defines one deterministic synthesis order. What remains
unproved is convergence in the displayed sector norm, analytic parameter
dependence over each tube, uniqueness of the decaying tail, and directed
evaluation of the six boundary-map outputs at `eta=1`.

## Uniform overlap predicate

The vacuum proof core ends at `y=64`. The frozen tail-majorant chart begins at

```text
kappa*x = k*y >= 64.
```

Therefore the two fixed domains cover without a gap only if

```text
k(lambda) >= 1
```

throughout every certified tube. This is a derived domain-compatibility gate,
not a tunable threshold. Each tube must record a directed lower bound
`k_lower>=1`. Failure stops the candidate; moving the join, subdividing a cell,
changing precision, or weakening the tail domain is forbidden.

The previously frozen λ=0 approximation has
`nu≈-0.6922286849263555`, hence `k≈1.1766`; this is useful pre-run design
evidence only. It is not the required uniform proof.

## Parameter polynomial chronology

For each cell use the exact 33 Chebyshev–Lobatto parameter nodes

```text
t_j = cos(j*pi/32), j=0,...,32
lambda_j = lambda_mid + 2^-16*t_j.
```

Canonical node serialization is increasing physical λ, namely source node
ordinals `j=32,31,...,0`. The first cell's left endpoint is supplied only by
the separately certified λ=0 ground-state/tangent instance. Later cells start
from the exact persisted right-face approximation of the preceding cell.

Within a cell, approximate point solves proceed in increasing λ. The previous
same-cell node may be a numerical predictor; no state from another grid,
alternate cell, changed degree, or changed precision may be used. Failure at
one node stops construction without retry. After all 33 nodes return, apply
one fixed DCT-I in exact ordinal order to create the degree-32 parameter
coefficients. Proof acceptance comes only from the subsequent uniform interval
argument, never from the node solves.

## Coefficient norm and component weights

Set `chi=17/16`. For a core function block or one fixed tail sector `F`,
define

```text
norm(F) = sum_(j=0)^infinity sum_(n=0)^infinity
          abs(F[n,j])*chi^(n+j).
```

For each scalar block `S` in `[a,b,nu,m,c]`, define

```text
norm(S) = sum_(j=0)^infinity abs(S[j])*chi^j.
```

The Newton product-space norm is the literal sum of the three core block norms
and the five scalar block norms in coordinate order. Every component weight is
exactly one. The separate tail-synthesis proof uses the unit-sector norm above.
No equilibration derived from a candidate result is allowed.

The Chebyshev product identity

```text
T_a*T_b = (T_(a+b) + T_(abs(a-b)))/2
```

and `chi^abs(a-b)<=chi^(a+b)` make each spatial/parameter coefficient space a
Banach algebra and make the tensor-product norm submultiplicative. The Newton
proof must record directed convolution tails in both indices. In the separate
tail synthesis, ordinary `ell1` convolution gives the same property in the
transseries sector index, and all three tail indices must be bounded.
Degree-32 parameter or sector overflow may not be silently truncated.

## Canonical coefficient codec

The finite approximate Newton payload retains only the three core function
blocks and five scalar parameter blocks. Its order is:

1. core function block ordinal `0,...,2`;
2. parameter mode `j=0,...,32`;
3. spatial mode `n=0,...,255`;
4. scalar block ordinal `[a,b,nu,m,c]`;
5. scalar parameter mode `j=0,...,32`.

Every coefficient is one canonical MPFR256 dyadic record with exact keys
`sign,mantissaHex,exponent2,precisionBits,direction`. Mantissas are odd except
for canonical positive zero; hexadecimal is lowercase with no leading zero;
`precisionBits=256`; approximate centers use `C`, lower endpoints `L`, and
upper endpoints `U`. The payload has exactly
`3*33*256+5*33=25,509` records before manifest metadata.

Core spatial tails `n>=256`, parameter tails `j>=33`, and their overlap are
separate bounded Newton-tail records and are never encoded as 25,509 implicit
zeros. The derived tail synthesis has its own content-addressed sector/majorant
receipt; its coefficients are not smuggled into the Newton payload.

## Bianchi/constraint propagation requirement

For the mixed residuals of the frozen rows, KG conservation and the contracted
Bianchi identity give

```text
dE_x/dx
 + F0'*(E_x-E_t)
 + 2*(F1'+1/x)*(E_x-E_theta) = 0.
```

After desingularization and conversion to `y`, solved-row zeros imply

```text
dG_x/dy + (s*v0' + 2*s*v1' + 2/y)*G_x = 0
y^2*exp(s*(v0+2*v1))*G_x = constant.
```

Regular even core data force that constant to zero. A future proof must verify
this identity from the exact expression tree and use it to establish that a
zero of the three solved rows has `G_x=0`; it may not rely only on sampled
constraint replay. The independent continuum replay remains required as a
separate numerical gate.

## Core split successor, rejected tail realization, and exact next blocker

The exact core coefficient-space closure is now recorded in
[`nhm2-spherical-boson-star-v2-g2-d-core-finite-infinite-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-core-finite-infinite-audit.md).
It fixes the Hardy factorization of both Green operators, conservative
`n^-2` omitted-mode bounds, the four disjoint two-index projections, the exact
square residual ordering, and an injective finite-plus-identity proof
preconditioner. It also proves how a fixed-point zero recovers the raw solved
rows. That successor remains authority-neutral and authorizes no run.

The tail analyticity counter-audit is
[`nhm2-spherical-boson-star-v2-g2-d-tail-analyticity-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-analyticity-audit.md).
It rejects the same-space infinite Taylor sectors before implementation and
requires a finite `C_0,...,C_8` asymptotic jet plus weighted remainder/Volterra
proof instead. The physical flat factors and five-join count remain unchanged.

The five-parameter/five-join shooting count removes the earlier boundary-index
ambiguity, and the fixed core Green operators remove all three core tau-row
choices. The next proposal must replace the rejected tail synthesis and
specify:

- the exact finite asymptotic jet through `C_8`, including `C_0=1`, the
  compatibility rows, scalar diagonals, and `A_9/B_9` scratch chronology;
- one bounded weighted Volterra/remainder operator proving existence,
  uniqueness, and parameter analyticity over the entire tail and every
  parameter tube;
- directed algorithms and error bounds for the five Newton join outputs and
  the sixth derived `H_eta` check;
- exact directed convolution/overflow bounds connecting the certified core
  tube to the tail parameter tube.

Until those calculations are explicit and independently checked, this
proposal remains unsealed and G2-D is `BLOCKED` at
`tailWeightedVolterraRemainderRepresentationAndDirectedJoinDefinition`. That is
not evidence of a candidate failure.
