Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R10 equilibrated four-grid implementation/preexecution
Current maturity: implemented, source-disjoint preexecution audit pending
Target maturity: authenticated execution-ready implementation with no execution
Required frozen inputs: B4-R1/R3, B4-R4 through B4-R9, admitted runtime and policy
Required evidence: exact implementation delta, receipts, absent root, tests and audit
Stop/fail criteria: any source/input/runtime/command/output or authority mismatch
Explicit non-goals: candidate execution, retry, retune, proof/lane/replay/lamp authority
Downstream gate unlocked: one separately authorized R10 execution checkpoint only

# NHM2 spherical-boson-star v2 G2B-B4-R10 implementation/preexecution

## Purpose

This packet implements the sole numerical proposal frozen by B4-R9. It closes
the code and identity prerequisites for a later one-shot execution but does not
authorize or perform that execution. The exclusive output root remains absent,
and no initializer, grid, Newton correction, continuation stage, or Armijo trial
is read, generated, or evaluated by the preexecution path.

## Preserved mathematical problem

The successor preserves the existing compactification, Lobatto grids, boundary
rows, direct binary64 frequency coordinate with strict `0<w<1`, continuum rows
`Et_t,Etheta_theta,KGbar`, unused `Ex_x` constraint, independent per-level
initializer, amplitude order `2^-16,...,2^-10`, 48-update bound, 25 Armijo
exponents, raw L2 merit, residual and scaled-step thresholds, consecutive-pass
count, field cross-grid gate, first-failure chronology, and no-retry/no-retune
rules.

The only correction-map delta is the R9 power-of-two equilibration:

```text
(R J C) y = -R r
Delta = C y
```

Rows are scaled first and columns second. Every nonunit scale is an exact power
of two freshly derived from the current raw Jacobian. The recovered `Delta` is
used in the unchanged raw-coordinate domain and Armijo chronology. Each update
records hashes for the raw and equilibrated systems, both scale vectors, scaled
direction, and recovered direction.

## Constraint monitor

After each returned stage, the implementation lifts the state and
differentiation words exactly to MPFR512 and recomputes the R9 point graph:

```text
q = x^2 exp(F0+2F1) Ex_x
g = x^2 exp(F0+2F1)
    [F0' Et_t + 2(F1'+1/x) Etheta_theta - 2 varphi' KGbar]
    /(1-rho)^2
```

The origin and infinity values are analytic positive zero. The infinity state
must remain in the frozen vacuum-tail boundary class before monitor acceptance.
The shifted-Chebyshev MPFR512 Householder-QR primitive frozen by R9 produces the
interpolatory prefix, and `delta=q-prefix` is formed from the rounded profile
words in MPFR512. Nodal Linf and positive Clenshaw-Curtis L2 values are emitted
for `q` and `delta`.

After the unchanged field gate passes, the constraint gate projects adjacent
profiles with the frozen barycentric operation and requires strict contraction,
allowing equality only for exact-zero plateaus, in all four level-norm streams
and all four adjacent-pair-error streams. No absolute constraint threshold is
implemented.

## Exclusive inventory and chronology

The future root is exactly:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1/
```

Execution fails before creation on any file or symlink collision. If a later
authorization reaches execution, files are written exclusively, fsynced, read
back and hashed in this order:

```text
preexecution-binding.json
level-{64,96,128,256}/initializer-state.f64le
level-N/stage-00..06-state.f64le
level-N/stage-00..06-{q,g,prefix,delta}.f64le
level-N/stage-00..06-constraint-monitor.json
level-N/stage-00..06.json
level-N/level-receipt.json
cross-grid-receipt.json
constraint-cross-grid-receipt.json
terminal-receipt.json
```

First failure emits only the chronologically reached prefix and the terminal
receipt. The field receipt precedes the constraint receipt. A PASS merely
unlocks the next mathematical proof duty; it cannot admit a candidate.

## Preexecution identity

The implementation imports B4-R9's authority-neutral primitives and verifies
all 27 frozen dependencies before execution. The separate checkpoint binds the
implementation, focused tests, independent audit, this packet, exact offline
Docker command, fixed token, admitted image digest, and absent output root.

The eligible runtime remains offline Linux x86_64 with CPython 3.12.11, gmpy2
2.2.1, GMP 6.3.0, MPFR 4.2.1, MPC 1.3.1, glibc 2.36,
`PYTHONHASHSEED=0`, and `PYTHONDONTWRITEBYTECODE=1`. Host tests establish
definition behavior only; the admitted Linux run is required for execution.

## Required no-execution evidence

The focused test suite checks inert import, analytic endpoint words, the
MPFR monitor on a synthetic zero definition wire, tail fail-closure,
threshold-free pass/fail behavior, and the read-only preexecution entrypoint.
The independent audit does not import the implementation. It parses and hashes
the source, proves the output root absent, verifies the guarded sole execution
entrypoint, reimplements power-of-two equilibration, checks the exact numerical
delta literals, and rehashes the checkpoint inventory.

Neither suite may call `execute_once`, materialize an initializer, generate a
grid, invoke Newton/continuation/Armijo, or create the future root.

## Stop and authority state

Any binding drift, checkpoint mismatch, live-runtime mismatch, output
collision, nonfinite scale/profile, linear failure, exhausted Armijo schedule,
tail-interface failure, QR failure, incomplete stage, field-gate failure,
constraint-contraction failure, persistence mismatch, or unexpected exception
is terminal. There is no retry, retune, alternate initializer, alternate grid,
or second output root under this candidate identity.

Candidate admission, vacuum connection, proof, execution, replay, lane, pair
agreement, diagnostic lamp, Theory Graph, accepted joint geometry/state,
physical viability, propulsion, and transport authority remain false.
