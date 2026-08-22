# NHM2 Spherical Boson-Star v2 G2-D Point-Solver Closure Audit

Program gate: G2 — classical branch proof and terminal state

Workstream: finite proof-center point-solver implementation

Capability or component: one fixed-parameter 773-coordinate core/tail point solve

Current maturity: exact core residual ordering and exact finite Green operator;
no closed numerical tail center, point-Newton algorithm, or authenticated point
instance

Target maturity: one uniquely specified MPFR256 point solver that can generate
the 33 serial node observations consumed by the parameter-center DCT-I

Required frozen inputs: final branch policy; desingularized operator; core-tail
packing proposal; core finite/infinite audit; Volterra tail proposal; source
envelope calculus; exact DCT-I definition; degree 255; precision 256

Required evidence: a noncircular core/tail center construction, exact state and
residual codecs, deterministic Newton/linear-solve/failure chronology, lambda
zero predecessor, runtime/preseal bindings, and source-disjoint replay

Stop/fail criteria: using a finite tail truncation as the proved tail; choosing
a tail midpoint or iteration after seeing a result; transplanting the fixed
N=64 v3 solver without a versioned definition; retry, retune, or authority
promotion

Explicit non-goals: executing a point, constructing a parameter cell, proving
a vacuum tube, admitting a candidate, lighting a lamp, or making physical,
propulsion, or transport claims

Downstream gate unlocked: a versioned point-solver/tail-center definition and
then its calculation-only implementation

Change class: authority-neutral mathematical and implementation audit

## Verdict

The fixed-parameter core residual is sufficiently determined to implement its
exact finite Green operators, but the complete point solve is **not yet a
closed algorithm**. Execution is `BLOCKED` at
`approximateTailCenterAndPointNewtonChronologyUndefined`.

This is not evidence against the candidate. It is a causal definition gap
between the already-frozen core and tail proof architectures.

## What is closed at one parameter point

At one fixed `lambda`, the retained point state has exactly

```text
3*256 + 5 = 773
```

MPFR256 center coefficients in family order

```text
core_AH, core_AV1, core_AU, a, b, nu, m, c.
```

The matching residual family order is

```text
core_AH  - J_1[R_H]/q
core_AV1 - J_2[R_V1]/q
core_AU  - J_2[R_U]/q
join_H
join_V1
join_U
join_V1_eta
join_U_eta.
```

The core source expressions, shifted-Chebyshev basis, exact
Chebyshev-to-power conversion, exact `J_1/q` and `J_2/q` multipliers, and
power-to-Chebyshev recurrence are frozen. The authority-neutral exact reference

```text
tools/nhm2-spherical-boson-star-v2-branch-proof/core_green_operator_exact.py
```

now implements both Green operators through degree 512. Its focused suite
checks every shifted-Chebyshev column through 512, exact differential recovery,
the physical degree-255 route, bounded ingress, deterministic digests, and all
false authority locks.

That closes the finite Green subproblem. It does not close the five joins.

## The core/tail center is circular as currently written

The core Newton residual needs five tail joins at each parameter point. The
Volterra proposal defines the exact tail fixed point

```text
X_star = Phi(X_star; lambda,nu,m,c)
```

and proves it in a ball around the canonical proof center `X_bar=0`. It also
forbids treating a finite asymptotic truncation as the tail instance.

The directed tail source assembler, however, requires an already-constructed
degree-32 parameter center for `nu,m,c` over the whole cell. That parameter
center is produced only after the 33 point solves complete. The point solves in
turn need the five tail joins. Therefore the present dependency is

```text
33 point solves
  -> parameter-center DCT-I
  -> uniform tail fixed-point enclosure and joins
  -> joins required by those same point solves.
```

No existing contract breaks this cycle.

The following possible shortcuts are inequivalent and are not authorized:

- using `X_bar=0` or the finite `P_8` jet as though it were the tail;
- choosing the midpoint of a future join enclosure;
- iterating `Phi` on an unstated finite radial representation;
- importing the binary64 asymptotic diagnostic;
- promoting a sampled or truncated tail integration to the Volterra proof
  instance.

## The point-Newton chronology is also not frozen

The packing proposal fixes serial lambda order, the previous same-cell point as
the only predictor, and first failure without retry. It does not fix:

- the finite tail-center representation used during the approximate solve;
- the point-state and point-residual canonical byte codecs;
- initial state construction for the lambda-zero point;
- Newton residual and step norms and their stopping thresholds;
- row/column scaling, linear solver, pivot order, and singularity rule;
- line-search or damping chronology and maximum iteration counts;
- how a tail-center failure precedes or follows a core Newton failure;
- cleanup, persistence, and replay chronology.

The corrected v3 N=64 solver cannot fill those fields implicitly. It has a
different 129-word frozen-core state, a different operator, a fixed N=64 input,
and proposal-specific equilibration and pivot chronology. Reusing its choices
would be a new versioned numerical policy, not an implementation detail.

## Causal predecessor discovered during implementation audit

The positive-lambda point solver is not the immediate active implementation
gate. Cell zero first requires a separately certified lambda-zero limiting
ground state, simple kernel, bifurcation transversality, and containment by the
first positive-lambda tube. The vacuum ABI still records all four definitions
and the lambda-zero product as null.

The Newtonian directed-proof operator successor already freezes the exact
origin recurrence, representative, inverse, and radii formulas. The new
authority-neutral reference

```text
tools/nhm2-spherical-boson-star-v2-branch-proof/
  newtonian_lambda_zero_origin_exact.py
```

implements that finite rational subproblem. It generates the order-16 origin
representative, evaluates the finite defect at indices 17 through 33, computes
exact `Y`, `Z0`, and `Z1`, evaluates all 61 preregistered radii, and checks the
fixed derivative-envelope propagation inequality. It deliberately does not
select a proof radius because the required interval-recurrence envelope base
at indices 17 through 34 is not derivable from the exact center alone.

This closes one lambda-zero operator component, not the lambda-zero product.
The exterior global-root proof, the directed MPFR replay, the simple-kernel and
transversality proofs, and first-tube containment remain absent. Those duties
are causally prior to the noncircular positive-lambda successor below.

## Downstream required noncircular successor

The later definition must freeze one **approximate-center-only tail algorithm**
that is distinct from, but later enclosed by, the Volterra proof. It must:

1. use a fixed finite representation and fixed MPFR256 operation order;
2. start from an input-independent preregistered center at lambda zero and only
   the previous physical-lambda point thereafter;
3. solve the core and numerical tail center jointly or in a deterministic
   nested order with one explicit first-failure precedence;
4. emit five center joins plus the sixth Bianchi audit value;
5. retain the complete numerical tail state so replay can recompute every join;
6. make no claim that the approximate tail center is the validated Volterra
   fixed point;
7. allow the later uniform Volterra proof to enclose the numerical center and
   all join differences without changing the center after observation.

The same successor must freeze the 773-record point-state and residual codecs
and the exact Newton/linear-solve chronology. Only after that definition is
independently reviewed may an implementation run synthetic fixtures. A real
point execution still additionally requires the lambda-zero proof instance,
server-owned runtime/preseal, exclusive persistence, and source-disjoint replay.

## Current disposition

No point solve, parameter cell, proof, candidate, output, registry, or Casimir
execution is authorized by this audit. All candidate admission, branch
acceptance, Theory Graph, physical, propulsion, and transport authority remains
false/null.
