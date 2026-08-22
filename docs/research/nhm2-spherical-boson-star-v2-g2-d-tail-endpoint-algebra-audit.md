# NHM2 Spherical Boson-Star v2 G2-D Tail Endpoint Algebra Audit

Program gate: G2 — classical branch proof and terminal state
Workstream: exact proof-definition implementation
Capability or component: endpoint scalar cancellation and quotient algebra
Current maturity: read-only gap audit closed by a locally frozen successor;
independent successor audit remains pending
Target maturity: one canonical sparse-ring generator and native quotient input
Required frozen inputs: branch policy, desingularized operator, packing,
finite/infinite audit, Volterra replacement, source-envelope calculus, and the
authority-neutral boundary recurrence
Required evidence: exact chart bridge, canonical ring/monomial order, formal
recurrence through `C_8`, literal zero coefficients through order nine,
preimage/post-substitution hashes, and independent replay
Stop/fail criteria: division by `s`; a chart mismatch at `s=0`; an unstated
algebraic relation; noncanonical symbolic output; or any nonzero order below ten
Explicit non-goals: vacuum proof execution, branch execution, candidate
admission, proof authority, lamps, or physical/propulsion/transport claims
Downstream gate unlocked: native endpoint quotient and 256-ordinal radial cover

This audit changes no runtime or receipt authority. It identifies one missing
mathematical bridge that must be frozen before the endpoint implementation can
be deterministic.

## Verdict

`NO-GO` for implementing the endpoint sparse-ring cancellation directly from
the current calculus text. The physical tail-recurrence wire and the Volterra
endpoint use different, but compatible, charts. The exact conversion and the
canonical symbolic quotient ring are not presently part of either wire.

This is not evidence that the cancellation fails. One exact admissible bridge
fixture passes all eight scalar diagonals. It is evidence that two independent
implementations could currently emit different atom names, normal forms, and
hashes while representing the same mathematics.

## The chart boundary that must not be hidden

The physical branch-tail recurrence uses

```text
(w,kappa,M,C),
kappa^2=1-w^2,
q=M*kappa/2,
sigma=M*(2*w^2-1)/kappa-1,
```

and requires `kappa>0`. Its scalar diagonal is `2*kappa^2*n`.

The Volterra endpoint instead uses the descaled variables

```text
s=lambda^2,
y=lambda*x,
k=sqrt(-2*nu)>0,
w^2=1-s*k^2,
M=lambda*m,
kappa=lambda*k,
z=1/(k*y)=1/(kappa*x).
```

Consequently

```text
q=s*m*k/2,
sigma=m/k-2*s*m*k-1,
kappa^2=s*k^2.
```

The endpoint proof includes `s=0`. Importing the physical recurrence and
dividing its rows or diagonals numerically by `s` is therefore forbidden. The
continuous recurrence must be generated from the descaled row itself.

## Exact descaled scalar row

Write the physical metric functions as

```text
F0=s*V0,
F1=s*V1,
```

where the Schwarzschild endpoint series are

```text
V0=(log(1-q*z)-log(1+q*z))/s,
V1=2*log(1+q*z)/s.
```

Because `q` contains one exact factor of `s`, both series have unique formal
extensions at `s=0`; an implementation may not evaluate them by pointwise
division there.

Divide the complete physical Klein-Gordon row structurally by its common
factor `s` before evaluation. The descaled coefficient equation is

```text
exp(-2*s*V1)*k^2*
  (L_sigma^2(S)
   +(2*z-s*z^2*(dV0/dz+dV1/dz))*L_sigma(S))
+(Q0(s,V0)-k^2*exp(-2*s*V0))*S
=0,

L_sigma(S)=(-1+sigma*z)*S-z^2*dS/dz,
Q0(s,V0)=(exp(-2*s*V0)-1)/s
```

with the exact divided-difference extension at `s=0`. Its scalar diagonal is

```text
2*k^2*n,
```

which remains separated from zero on the endpoint chart because `k>0`.

This row, rather than `physical_row/s` evaluated after substitution, must
generate `C_1,...,C_8` in the endpoint cancellation wire.

## Missing canonical algebra

The source-envelope calculus asks for "ordered analytic-atom identifiers" but
does not enumerate them, freeze their order, or define the algebraic reductions
that relate `nu,w,kappa,M,q,sigma` to `s,m,k`. It also does not identify whether
the physical recurrence wire or the descaled recurrence owns the `s=0`
coefficient preimages. Therefore its requested preimage and post-substitution
hashes are not uniquely reproducible yet.

The smallest exact successor should freeze the Laurent polynomial algebra

```text
R = Q[s,m,k,k^-1]
```

with canonical monomials

```text
(sExponent,mExponent,kExponent),
sExponent>=0,
mExponent>=0,
kExponent in Z,
```

one explicit lexicographic serialization order, reduced rational coefficients,
no zero terms, and no separate aliases for derived quantities. Before formal
series expansion, eliminate every derived name by exactly

```text
nu    -> -k^2/2
w^2   -> 1-s*k^2
M     -> lambda*m only inside the already-descaled row
kappa -> lambda*k only inside the already-descaled row
q     -> s*m*k/2
sigma -> m*k^-1-2*s*m*k-1.
```

No free `lambda`, `nu`, `w`, `M`, `kappa`, `q`, or `sigma` atom remains in the
canonical endpoint coefficient wire. `C` cancels before the normalized scalar
row and likewise is not an endpoint atom.

The successor must additionally freeze:

1. the exact sparse term encoding and signed-`k` exponent encoding;
2. the formal `exp`, `log`, reciprocal, derivative, `Q0`, and `L_sigma`
   coefficient recurrences through raw order 26;
3. metric coefficients through non-emitted order nine in the descaled chart;
4. `C_0=1`, compatibility rows zero and one, then `C_1,...,C_7`, `A_9/B_9`,
   and `C_8` in the existing chronology;
5. the exact raw `S_U` preimage coefficients zero through 26;
6. literal empty canonical polynomials at orders zero through nine;
7. the shifted quotient coefficients zero through sixteen and the graded
   residual order reduction `27 -> 17`;
8. domain-separated hashes for the generator source, recurrence input,
   pre-substitution coefficient wire, post-substitution wire, and quotient.

Until those items are frozen, embedding a CAS-specific expression tree or a
native implementation-specific atom enumeration would be an unreviewed
mathematical choice.

## Exact bridge fixture

The existing authority-neutral physical recurrence was evaluated at

```text
s=9/16,
lambda=3/4,
k=4/5,
nu=-8/25,
w=4/5,
kappa=3/5,
M=1,
m=4/3,
q=3/10,
sigma=-8/15.
```

Exact `Fraction` arithmetic confirms

```text
q=s*m*k/2,
sigma=m/k-2*s*m*k-1,
physical_diagonal/s=2*k^2*n
```

for every `n=1,...,8`. The canonical diagnostic fixture containing the nine
`C_0,...,C_8` values has SHA-256
`75864beaa430a3f1f21481bffb748d04138ca29ef841ac59ca725b0f3992e246`
and 442 UTF-8 bytes. This fixture demonstrates the chart bridge at one
nonzero-`s` point; it does not prove the parameter-general cancellation or
authorize use at `s=0`.

## Next bounded action

The additive successor is now frozen in
[`nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-sparse-algebra-v1.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-sparse-algebra-v1.md),
with a standard-library exact generator and a focused independent-form oracle.
Its three coefficient wires are domain-separated and byte-pinned. The remaining
stop condition is a fresh independent audit before the integrated native result
may enter a proof manifest. Calculation-only native quotient/radial-cover work
may proceed against the frozen bytes, but grants no proof or candidate execution
authority.
