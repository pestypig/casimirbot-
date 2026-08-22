# NHM2 Spherical Boson-Star v2 G2-D Tail Source-Envelope Calculus

Program gate: G2 — classical branch proof and terminal state

Workstream: exact proof-definition successor

Capability or component: normalized nonlinear source bounds and the canonical
input/output manifest for the directed Volterra tail assembler

Current maturity: exact unsealed preregistration; no assembler source,
authenticated runtime, proof receipt, or candidate execution exists

Target maturity: one independently audited calculus that maps the frozen
degree-32 parameter center, the largest allowed input tube, and the frozen
finite scalar jet to directed `Y_tail,L_tail,M_tail` and implicit join bounds
without sampled suprema or post-result choices

Required frozen inputs: the active G2 packet; branch-selection semantic
SHA-256 `221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa`
/ 41,280 canonical bytes and raw SHA-256
`d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82`
/ 44,912 bytes; the repaired vacuum ABI; the G2-D desingularized operator,
core/tail packing, finite/infinite audit, tail-analyticity audit, and Volterra
replacement; `chi=17/16`; parameter degree 32; join `y=64`; finite jet
`C_0,...,C_8`; and largest frozen proof radius `2^-8`

Required evidence: exact projected-model algebra; directed analytic-series
remainders; exact factored metric/scalar source DAGs; cancellation of scalar
orders zero through nine on the endpoint cap; complete three-coordinate and
four-parameter first/second derivative ledgers; exact `j>=33` accounting; and
golden plus hostile independent tests

Stop/fail criteria: a projected remainder omitted or counted twice; failure of
an analytic convergence margin; a nonpositive physical denominator; an
uncancelled scalar coefficient below order ten; an unbounded endpoint-cap
term; an input not named by the canonical manifest; a changed subdivision,
series order, norm, or ledger after observing a result; or any attempt to treat
this definition as proof execution

Explicit non-goals: solving a vacuum cell, selecting one of the 73 global
radii, changing the frozen candidate, implementing the full core proof,
issuing a terminal state, downstream geometry/state, SI/metric execution,
either 68-file lane, a Theory Graph lamp, physical viability, propulsion, or
transport

Downstream gate unlocked: authority-neutral directed assembler source plus
focused and independent mathematical audits; this document alone authorizes no
proof or branch execution

Change class: authority-neutral mathematical preregistration

## Decision boundary

This successor fills only the nonlinear source-envelope gap identified by the
Volterra proposal. It does not change the physical equations, finite jet,
parameter cells, core packing, global proof radii, or first-failure rules.

Every bound below is evaluated with MPFR256 outward rounding. Exact integer and
dyadic bookkeeping may use arbitrary-precision integers/rationals, but each
transcendental endpoint and each final comparison is an MPFR256 directed
operation with forbidden flags checked immediately.

## Generic projected Banach model

For a coefficient Banach algebra `A`, define

```text
Model_N^omega(A) = (p_0,...,p_N; epsilon)
```

to mean

```text
x = sum_(j=0)^N p_j*basis_j + R,
norm_omega(R) <= epsilon,
epsilon >= 0.
```

There are exactly two instantiations:

```text
parameter model: N=32, basis_j=T_j(t_lambda), omega_j=chi^j,
                 chi=17/16
endpoint raw model: N=26, basis_j=t^j, t=256*eta in [0,1], omega_j=1
endpoint quotient model: N=16 after the exact order-ten shift.
```

No third degree, weight, or basis is permitted.

The endpoint-cap model additionally records `vanishingOrder` for its residual:

```text
R=t^vanishingOrder*R_hat, sup_(0<=t<=1) abs(R_hat)<=epsilon.
```

Every primitive raw-cap input has `vanishingOrder>=27`. A dropped polynomial
mode has its actual ordinal, so the projected product remainder also has
`vanishingOrder>=27`. Addition takes the minimum order; multiplication adds
orders for residual-residual terms and uses the exact polynomial order for
mixed terms. The endpoint analytic center is the exact `t=0` value, never an
interval midpoint, so its nonconstant argument has order at least one and an
analytic-series tail after ordinal 512 preserves an order of at least 513.
This graded remainder is mandatory; an ungraded norm ball cannot certify a
division by `t^10`.

For a polynomial `p`, write

```text
poly_norm(p) = sum_j norm_A(p_j)*omega_j.
```

Addition is coefficientwise and adds the two error bounds. Multiplication first
forms the exact finite basis product, retains ordinals `0,...,N`, and records
the discarded polynomial norm as `drop(p*q)`. Its sole error rule is

```text
epsilon_product
  = drop(p*q)
    + poly_norm(p)*epsilon_q
    + poly_norm(q)*epsilon_p
    + epsilon_p*epsilon_q.
```

For the parameter model use exactly

```text
T_a*T_b = (T_(a+b)+T_(abs(a-b)))/2.
```

For the endpoint-cap model use `t^a*t^b=t^(a+b)`. A discarded mode is never
zero and may alias into retained parameter modes in a later multiplication;
the single residual ball above accounts for that possibility. When a retained
coefficient enclosure is needed, the residual ball contributes the directed
interval

```text
[-epsilon/omega_j,+epsilon/omega_j]
```

exactly once to ordinal `j`.

## Fixed analytic functional calculus

The analytic-series cutoff is frozen at

```text
K_analytic = 512.
```

For a parameter model `x`, choose the exact dyadic/rational midpoint `c` of its
constant-coefficient enclosure. Set `h=x-c`, `q=norm(h)`. Powers are formed
only by the projected multiplication rule above and are accumulated in
increasing ordinal.

For a nested endpoint model, the `t=0` coefficient is itself a parameter model.
Analytic composition first evaluates the analytic primitive on that parameter
model, then obtains cap coefficients `0,...,26` from the exact formal Taylor
recurrences in `t`. For example:

```text
exp:        n*y_n = sum_(k=1)^n k*x_k*y_(n-k)
reciprocal: y_0=x_0^-1,
            y_n=-y_0*sum_(k=1)^n x_k*y_(n-k)
sqrt:       y_0=sqrt_positive(x_0),
            y_n=(x_n-sum_(k=1)^(n-1)y_k*y_(n-k))/(2*y_0)
log:        form x'/x by the reciprocal recurrence, then integrate in t.
```

`phi1` cap coefficients use its exact derivative identity

```text
phi1^(r)(x_0)=integral_(u=0)^1 u^r*exp(u*x_0) du
              =sum_(n=0)^infinity x_0^n/(n!*(n+r+1))
```

evaluated by the displayed order-512 parameter-model series with its directed
factorial majorant; no numerical quadrature in `u` is permitted. The cap
remainder is bounded by the corresponding majorant on the whole cap model and
retains order at least 27. Directly truncating a global power series in `x(t)`
and labeling its tail `O(t^27)` is forbidden.

More precisely, write the nested cap argument as `x=x_0+h`, where `h` has
`t`-order at least one, and set `q_t=norm(h)`. The cap composition retains
orders zero through 26. Its order-27 remainder is exactly bounded by

```text
exp:        norm(exp(x_0))*exp(q_t)*q_t^27/27!

reciprocal: B=x_0^-1*h, require norm(B)<1
            norm(x_0^-1)*norm(B)^27/(1-norm(B))

sqrt:       B=x_0^-1*h, require norm(B)<1 and positive branch margin
            norm(sqrt(x_0))*norm(B)^27/(1-norm(B))

log:        B=x_0^-1*h, require norm(B)<1 and positive branch margin
            norm(B)^27/(27*(1-norm(B)))

phi1:       exp(norm(x_0)+q_t)*q_t^27/28!.
```

All norms on the right are outward parameter-model norm bounds. Contributions
from an input residual already carrying order 27 are propagated by the same
projected-product rule and added once. These formulas, not an unspecified
analytic remainder, establish the graded cap residual.

The following are the only analytic primitives:

```text
exp(x)
reciprocal(x)
sqrt_positive(x)
log_positive(x)
log1p(x) = log_positive(1+x)
phi1(x) = sum_(n=0)^infinity x^n/(n+1)!
Q0(s,v) = -2*v*phi1(-2*s*v).
```

Their convergence gates and analytic-tail bounds are:

```text
exp:
  remainder <= exp(c+q)*q^(K+1)/(K+1)!

reciprocal:
  require abs(c)>q
  r=q/abs(c)
  remainder <= abs(c)^-1*r^(K+1)/(1-r)

sqrt_positive:
  require c>q and c>0
  r=q/c
  remainder <= sqrt(c)*r^(K+1)/(1-r)

log_positive:
  require c>q and c>0
  r=q/c
  remainder <= r^(K+1)/((K+1)*(1-r))

phi1:
  remainder <= exp(q)*q^(K+1)/(K+2)!.
```

`sqrt_positive` uses the increasing binomial series coefficients
`binomial(1/2,n)` with their exact signs. `log_positive` uses
`log(c)+sum_(n=1)^K (-1)^(n+1)*(h/c)^n/n`. All factorials and binomial
coefficients are exact. The displayed remainders are added outward to the
model error and retained in the primitive ledger. Failure of a convergence
gate is terminal for the cell; series order may not be increased.

The Neumann/binomial margins also prove the required complex-domain
nonvanishing on the represented Banach ball. A separate sampled complex
ellipse check is neither required nor accepted as a replacement.

## Fixed radial cover

Use

```text
eta = 64/y in [0,1].
```

The radial cover is exactly

```text
endpoint cap: eta in [0,2^-8]
regular cells: eta in [i/256,(i+1)/256], i=1,...,255.
```

The endpoint cap is evaluated first with the raw `Model_26^1` and then, after
structural order-ten cancellation, with the quotient `Model_16^1`, both in
`t=256*eta`. Every regular cell is evaluated directly with interval `eta`;
cells are traversed in increasing `i`. There is no adaptive subdivision,
retry, or sampled maximum.

On regular cells use

```text
y=64/eta,
d/dy=-(eta^2/64)*d/deta.
```

The endpoint cap may not form `1/eta`. Schwarzschild factors, `z`, `b`, and all
finite-jet terms are expanded in the cap model. The flat factor is bounded from
its exact logarithm

```text
log(B)=-64*k*(1/eta-1)-sigma*log(eta)
```

using the already-required decay margin and the flat-moment formula below. The
zero endpoint is the unique positive-zero flat extension. A derivative maximum
may not be assumed to occur at `eta=2^-8` without the same moment calculation.

## Exact factored source coordinates

Never divide a raw interval by the vanishing flat factor. Write

```text
D = d^2*E,
Delta_H  = D*h_hat,
Delta_V1 = D*v_hat,
U        = d*B*F,
F        = P_8+Delta_U,
b        = -k+sigma/y.
```

The arbitrary radial fixed-point ball is injected by its graph envelopes, not
by sampled functions. For `0<=R<=R_tail_cap`, define

```text
a1 = 2*k+2*abs(sigma)/y
a2 = a1^2+2*abs(sigma)/y^2

abs(h_hat) <= R
abs(h_hat_y+2*b*h_hat) <= R*a1
abs(h_hat_yy+4*b*h_hat_y+(2*b_y+4*b^2)*h_hat) <= R*a2
```

and the identical three bounds for `v_hat`. For the scalar coordinate use

```text
abs(Delta_U) <= R*h_0(z)
abs(dDelta_U/dz) <= R*h_1(z)
abs(d2Delta_U/dz2) <= R*h_2(z).
```

At every radial-cover ordinal these become symmetric directed intervals about
zero. First-coordinate jets inject the corresponding unit envelopes; second
coordinate jets start at exact zero. The source DAG then generates all mixed
terms. Treating one unknown direction as a sampled radial profile is forbidden.
The center evaluation uses `R=0`; the derivative suprema use the complete
`R_tail_cap=2^-8` ball.

Then use exactly

```text
Delta_H_y  = D*(h_hat_y+2*b*h_hat)
Delta_V1_y = D*(v_hat_y+2*b*v_hat)
U_y/(d*B)  = F_y+b*F.
```

Let

```text
H  = h_S+D*h_hat,
V1 = v1_S+D*v_hat,
Hy = h_S_y+D*(h_hat_y+2*b*h_hat),
V1y= v1_S_y+D*(v_hat_y+2*b*v_hat),
w2 = 1+2*s*nu.
```

The normalized metric sources are evaluated directly, not by subtracting two
wide raw intervals:

```text
Delta_R_V1/D = -1/2 * (
    s*(2*v1_S_y*(v_hat_y+2*b*v_hat)
       +D*(v_hat_y+2*b*v_hat)^2)
  + exp(2*s*(2*V1-H))*w2*F^2
  + s*(F_y+b*F)^2
  + exp(2*s*V1)*F^2)

Delta_R_H/D =
   -s*(2*(h_S_y-v1_S_y)
          *((h_hat_y-v_hat_y)+2*b*(h_hat-v_hat))
       +D*((h_hat_y-v_hat_y)+2*b*(h_hat-v_hat))^2)
   +exp(2*s*(2*V1-H))*w2*F^2
   -s*(F_y+b*F)^2
   -exp(2*s*V1)*F^2.
```

These are algebraic identities with the vacuum metric rows already removed.
Every product and analytic composition uses the projected model rules above.

For the scalar source use the exact definitions

```text
E0       = exp(-2*s*(H-V1))
A_scalar = 2/y+s*Hy
V_scalar = exp(2*s*V1)*(Q0(s,H-V1)+2*nu*E0)
P_tilde  = (2*sigma+2)/y+s*Hy
Q_tilde  = -sigma/y^2+b^2+A_scalar*b+V_scalar

S_U = -P_tilde*F_y-Q_tilde*F-(P_8_yy-2*k*P_8_y).
```

The assembler evaluates `S_U` as one expression tree. It may not separately
absolute-bound the displayed summands before the finite-jet cancellation is
established.

## Scalar order-ten cancellation and endpoint cap

On the endpoint cap, expand the complete `S_U` expression as an exact formal
coefficient DAG through raw order 26. Each coefficient is represented before
rounding as one canonical sparse rational polynomial in ordered analytic-atom
identifiers. Atom identifiers cover only parameter-model values of the frozen
analytic primitives and recurrence inputs; monomials use sorted atom/exponent
pairs, like terms are merged with exact rational arithmetic, and zero
coefficients are removed.

Apply only the frozen recurrence substitutions in their exact chronology:

```text
A_1,B_1
A_n,B_n for n=2,...,8
KG z^0 and z^1 compatibility
C_n from z^(n+1) for n=1,...,7
non-emitted A_9,B_9 scratch binding
C_8 from z^9.
```

After substitution and canonical sparse-ring normalization, require
coefficient DAGs `t^0,...,t^9` to be the literal empty zero polynomial. Bind
the ordered preimages and post-substitution hashes in the receipt. This
structural check, not interval overlap with zero, establishes the finite-jet
cancellation.

Construct the quotient DAG

```text
S_U = z^10*R_U10
```

by shifting raw ordinals `10,...,26` to quotient ordinals `0,...,16` and
reducing the graded raw remainder order by ten. Only then evaluate the quotient
DAG with directed parameter models. A generic symbolic simplifier, numerical
subtraction of wide intervals, or an assertion that an interval merely
contains zero is forbidden.

After the check, define

```text
Z10_value = sup abs(S_U)/z^10
Z10_derivative = sup abs(dS_U/dz)/z^9.
```

For the cap model, division by `z^10` also multiplies by the directed parameter
model `(16384*k)^10`; the resulting quotient has degree 16 and residual
`vanishingOrder>=17`. The derivative quotient is obtained by differentiating
the already-factored identity `S_U=z^10*R_U10`, not by differentiating the raw
canceling summands:

```text
(dS_U/dz)/z^9 = 10*R_U10+z*dR_U10/dz.
```

Flat channels use the closed exponential-versus-power maximum

```text
M(p,r) = sup_(y>=64) y^p*abs(d*B(y))^r.
```

For `r>0`, set

```text
power = p+r*sigma_abs_max
y_star = max(64,power/(r*k_min))
M(p,r) <= d_abs_max^r
          *(y_star/64)^(r*sigma_abs_max)
          *y_star^p*exp(-r*k_min*(y_star-64)).
```

Require `k_min>0`. The same formula, with each exact differentiated logarithmic
factor expanded into powers of `1/y`, bounds the first `z` derivative. Every
use records `(p,r,power,y_star,bound)` in the ledger.

On regular cells `z` is separated from zero, so the complete expression and
its exact `z` derivative are divided interval-wise by `z^10` and `z^9`.
The final `norm_S10` is the outward maximum over the endpoint cap followed by
regular-cell ordinals 1 through 255.

## Three-coordinate and four-parameter differentiation

Use second-order forward jets over the ordered coordinates

```text
tail coordinates: [h_hat,v_hat,Delta_U]
tail inputs: [lambda,nu,m,c].
```

Each primitive contains one value, seven first derivatives, and the 28
symmetric second derivatives in lexicographic `(left,right)` order with
`left<=right`. Products, reciprocal, exponential, positive square root,
`log_positive`, `phi1`, and `Q0` use exact analytic differentiation of the same
projected model node. A derivative may not be obtained from finite differences
or from a separately simplified expression.

For each radial-cover ordinal the assembler emits contributions to:

```text
Y_tail: value norm of Phi(0)
L_tail: three-by-three D_X Phi column ledger
M_tail: three output by six symmetric D_X^2 Phi ledger
D_p Phi, D_p^2 Phi, D_(pX) Phi, D_(Xp) Phi
```

The Green constants `C_G1,C_G2,C_K0` are applied only after the normalized
source maxima are complete. The induced `l1` operator norms are

```text
L_tail = max_input_column sum_output abs_upper(D_X Phi)
M_tail = max_(input_pair) sum_output abs_upper(D_X^2 Phi).
```

Implicit join derivatives then use exactly the inverse bound
`1/(1-L_tail)` from the Volterra proposal.

## Parameter-mode overflow accounting

Every parameter operation uses the degree-32 projected model. The ordered
overflow ledger for one node is

```text
finite_product_modes_33_through_64
left_polynomial_times_right_residual
right_polynomial_times_left_residual
residual_times_residual
analytic_series_tail_if_any.
```

The sum becomes the node's one correlated residual ball. It is never silently
assigned only to modes `j>=33`; later products may alias it into a retained
mode. When one retained coefficient is queried, the valid marginal enclosure
is `epsilon/chi^j`, but the proof may not distribute the same ball to retained
coefficients and also add it to a tail norm in the same inequality. The ball
keeps one correlation identifier until a final projection or norm consumes it.
Receipt validation rejects a correlation identifier consumed twice at one
derivative order.

## Canonical assembler input manifest

The canonical input root has this exact order:

```text
contractVersion
cellOrdinal
frozenBinding
parameterCenter
largestInputTube
finiteScalarJet
sourceLedger
runtimeExpectation
```

`frozenBinding` contains exact raw SHA-256/size pairs, in dependency order, for
the branch policy, vacuum ABI, desingularized operator proposal, core/tail
packing proposal, finite/infinite audit, tail-analyticity audit, Volterra
proposal, this calculus, and the boundary-remainder coefficient wire.

`parameterCenter` contains 33 directed coefficient enclosures plus one
residual norm for each of `[nu,m,c]`; `lambda` is the exact affine cell map and
is not caller supplied. `largestInputTube` is exactly `2^-8` in each applicable
weighted family and includes the tail-coordinate cap `2^-8`; a smaller
observed tube may not replace it. `finiteScalarJet` contains `C_0,...,C_8`,
`A_9,B_9`, their coefficient wires, and the exact recurrence-row ledger.

`sourceLedger` fixes the primitive ordinals from the Volterra proposal and the
factored source expressions above. `runtimeExpectation` names MPFR 4.2.2,
precision 256, exponent range, rounding modes, required symbols, source,
dependency, toolchain, executable, and loaded-runtime identities. Missing
authenticated runtime fields block proof issuance but do not change the
mathematics.

No path, provider, executable, candidate output, or receipt is accepted from an
untrusted public caller. A server-owned future issuer resolves the manifest and
passes exact admitted bytes to the assembler.

## Canonical output and failure order

The output ledger order is:

```text
frozen input binding
runtime observation
radial-cover observations 0 through 255
source-node value/first/second contributions
parameter-overflow contributions
Y_tail
L_tail
M_tail
R_tail
internal contraction predicates
implicit input derivatives
six directed joins
cleanup and persistence observations
false/null authority locks
```

The first failure order is:

```text
input/schema/binding
runtime identity/context
physical domain margin
analytic-series convergence
finite-jet cancellation
radial source bound
parameter overflow/ledger
L_tail<1
R_tail range
strict self-map inequality
implicit derivative
join extraction
cleanup/persistence.
```

No later result is computed after a failure. All assembler outputs remain
authority-neutral observations. Candidate admission, proof completion,
terminal-state readiness, replay agreement, every lamp, physical viability,
propulsion, and transport remain false/null.

## Exact next blocker

The first calculation-only reference kernel is
`tools/nhm2-spherical-boson-star-v2-branch-proof/tail_volterra_directed_bound_assembler.py`.
It implements pinned MPFR256 interval primitives, the degree-32 projected
Chebyshev algebra, the order-512 real analytic primitives, and the closed Green
constants. Its focused synthetic suite passes, and one complete order-512
nonconstant exponential contains its independent directed oracle. That single
operation took 96.19 seconds on the current workstation, before radial cells,
jets, or source nodes. Therefore it is frozen as a calculation oracle, not the
production path for 1024 vacuum cells.

This calculus remains unsealed and has not received an independent
mathematical or implementation audit. The next bounded item is

```text
tailSourceEnvelopeCalculusIndependentAuditAndNativeDirectedAssemblerSource
```

The audit must check the factored source identities, projected-model remainder
rules, endpoint cancellation, flat moment formula, derivative ledger, and
manifest completeness. The production source must use direct native MPFR/GMP
operations and compare against the reference oracle; the Python timing result
may not be hidden by calling it production-feasible. No proof or branch
execution is authorized by this document.

The first native calculation base is now
`tools/nhm2-spherical-boson-star-v2-branch-proof/tail_volterra_directed_bound_assembler_native.cpp`.
It attaches only to an already-loaded MPFR 4.2.2 module, configures and restores
the MPFR exponent/flag context under one process-local lock, and implements the
same degree-32 projected algebra, order-512 `exp`, reciprocal, positive `log`,
positive square root, `phi1`, `Q0`, and closed Green constants. Its focused
x64 MSVC `/W4 /WX` build/run test encloses independent 256-bit fixtures for all
six primitives and exact rational fixtures for all four kernel outputs. One
single-exp observation completed in approximately 0.70 seconds on this
workstation versus 96.19 seconds for the Python reference; that comparison is
diagnostic timing, not a frozen performance guarantee.

The native base now also implements the complete seven-coordinate,
28-Hessian-slot forward jet and evaluates all three factored source expressions
through the same projected-model operations. An exact-symbolic oracle encloses
each source value, first derivative, and second derivative. Its first full
source-DAG probe exposed a caller-stack overflow; the repair moved every jet to
deep-copy-owned heap storage rather than increasing a test stack.

The native base now consumes the deterministic 3,053-term endpoint quotient
table and encloses both its exact bridge value and its full endpoint-cap Horner
evaluation. It also traverses all 255 regular radial cells in fixed order and
encloses an independently replayed value-source fixture on every cell. This is
not yet the assembler named above: complete seven-coordinate/four-parameter
derivative assembly over the cover, the canonical input manifest, and
proof-runtime/persistence issuance remain absent. Its output remains one
calculation-only canary with every proof, candidate, lamp, and physical
authority false. The exact next code boundary is therefore

```text
nativeDerivativeRadialCoverBeforeManifestIssuance
```

The parameter/source chart required by that boundary is frozen in
[`nhm2-spherical-boson-star-v2-g2-d-tail-parameter-source-chart-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-parameter-source-chart-audit.md).
It fixes the `[lambda,nu,m,c]` derivation order, removable `s=0` logarithmic
divided differences, exact regular-cell Schwarzschild inputs, scalar-jet
consumption, and endpoint overlap rule. The current native derivative traversal
is still synthetic over the complete cover and therefore keeps
`parameterCoordinateRelationsFrozen=false`. A separate one-point canary now
composes the physical `[lambda,nu,m,c]` chart, both removable logarithmic
primitives, the 516-term scalar jet, its physical derivatives, and the full
source DAG; independent symbolic/exact-rational checks pass in the 14/14 native
suite. That one point is not the required all-cover parameter-model proof.

A pre-implementation endpoint audit is recorded in
[`nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-algebra-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-algebra-audit.md).
It finds that this calculus does not yet enumerate the canonical atom order or
the algebraic reductions connecting the physical `(w,kappa,M)` recurrence to
the descaled `(s,nu,m,k)` endpoint at `s=0`. The current physical recurrence
cannot be divided numerically by `s` because it excludes `kappa=0`. Therefore
the immediate prerequisite was the audit's canonical Laurent-ring and descaled
recurrence successor. That successor is now locally frozen in
[`nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-sparse-algebra-v1.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-sparse-algebra-v1.md).
It pins the scalar jet, raw source, and order-ten quotient wires and passes its
10/10 focused exact suite, including deterministic regeneration of the native
3,053-term table. Calculation-only native integration may now proceed
against those exact bytes; proof-manifest issuance remains fail-closed until a
fresh independent audit confirms the successor and integrated mathematics.
