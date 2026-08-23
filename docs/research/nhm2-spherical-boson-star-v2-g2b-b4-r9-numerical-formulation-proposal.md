# NHM2 spherical-boson-star v2 G2B-B4-R9 numerical formulation proposal

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: single R8-backed equilibrated four-grid formulation proposal  
Current maturity: preregistered proposal with authority-neutral primitive validation  
Target maturity: complete formulation eligible for separate implementation/preexecution review, never candidate execution  
Required frozen inputs: B4-R1/R3 initializer identity, immutable B4-R4 through B4-R8 evidence, frozen branch policy and admitted Linux runtime  
Required evidence: exact sole delta, stable prefix operator, scale-free constraint convergence, chronology/output/receipt contracts, independent proposal audit  
Stop/fail criteria: binding drift, nonunique lever, endpoint ambiguity, data-selected rail, unstable prefix, incomplete receipt/runtime identity, or any candidate evaluation  
Explicit non-goals: candidate materialization, correction/Newton/continuation/Armijo execution, retry, retune, proof, geometry/state, lane, replay, lamp, physical, propulsion or transport authority  
Downstream gate unlocked: preparation of one B4-R10 implementation and preexecution packet; execution remains separately unauthorized

## Decision and sole authorized delta

B4-R8 uniquely supports one proposal class. B4-R9 therefore freezes exactly
the following additive formulation over immutable B4-R4:

1. Preserve the continuum rows `Et_t`, `Etheta_theta`, and `KGbar`, the unused
   `Ex_x` role, compactification, Lobatto nodes, boundary rows, amplitude
   schedule, independent-full-solve policy, direct frequency coordinate,
   Newton limits, raw Armijo merit, convergence thresholds, and existing field
   cross-grid evaluator byte-for-byte.
2. At every Newton update, equilibrate only the linear correction system by a
   deterministic power-of-two row pass followed by a deterministic power-of-
   two column pass. Recover the raw-coordinate direction before domain,
   step-size, or Armijo evaluation.
3. At every returned stage state, add the B4-R8 dimensionless constraint charge
   and propagation-defect monitor. Only final target-stage monitors from four
   completed independent grids participate in the new cross-grid gate.

No node may be excised. No residual row, unknown, coordinate, threshold,
initializer, grid, predictor, merit, backtracking range, or continuation stage
may change. This proposal does not authorize an invocation.

## Frozen linear equilibration

For raw Jacobian `J` and residual `r`, define for each row in ascending order

```text
R_i = 1                              if max_j |J_ij| = 0,
R_i = 2^(-e_i)                       otherwise,
frexp(max_j |J_ij|) = (m_i,e_i),     1/2 <= m_i < 1.
```

After forming `J_R=R J` and `r_R=R r`, define the same way for each column

```text
C_j = 1                              if max_i |(J_R)_ij| = 0,
C_j = 2^(-f_j)                       otherwise.
```

The unchanged deterministic partial-pivot LU solves

```text
(R J C) y = -R r,
Delta = C y.
```

All scales are exact binary64 powers of two. Maxima scan ascending indices;
row scales precede column scales; scales are recomputed fresh at every raw
Jacobian and never applied to state variables, residual acceptance thresholds,
or the Armijo merit. A zero row or column remains a linear-solve failure under
the unchanged LU; scale `1` does not conceal it.

## Frequency and globalization semantics

The coordinate remains direct binary64 `w` with strict domain `0<w<1`. R6's
coordinate trigger was false, and R8 authorized no coordinate change.
Logistic, rapidity, `kappa`, projection, clipping, reflection, trust-region,
pseudo-arclength, or boundary-fraction transformations are forbidden.

The unchanged Newton/globalization chronology is:

```text
maximum updates = 48
raw residual Linf threshold = 2^-40
raw scaled-step Linf threshold = 2^-42
consecutive passes = 2
raw L2 Armijo c = 2^-12
alpha order = 2^0,2^-1,...,2^-24
```

Each trial is formed in raw coordinates from `Delta`; a trial outside `0<w<1`
is rejected before residual evaluation. Exhausting the fixed schedule is the
terminal stage failure. There is no extension, retry, fallback, altered merit,
or reuse of the failed endpoint.

## Constraint charge and propagation-defect monitor

For each finite interior node, re-evaluate the frozen point residuals from the
returned binary64 state and differentiation rows in MPFR512 round-to-nearest:

```text
A = Et_t, B = Ex_x, C = Etheta_theta, K = KGbar,
W = x^2 exp(F0+2F1),
q = W B,
S = F0' A + 2(F1'+1/x) C - 2 varphi' K,
g(rho) = W S / (1-rho)^2.
```

Every binary64 input word is lifted exactly. Each interior `q` and `g` is
rounded once to binary64 RNDN after its MPFR512 point graph. Endpoint values
are analytic boundary-class values, never polynomial endpoint evaluations:

```text
q(0)=0, q(1)=0, g(0)=0, g(1)=0.
```

The origin values follow even regularity. The infinity source value binds the
frozen exponentially flat scalar tail and vacuum metric relation
`F0_(1/x)+F1_(1/x)=0`; failure of that tail-interface contract is terminal
before monitor acceptance.

### Stable interpolatory prefix

For the exact binary64 Lobatto words `rho_j` and source words `g_j`, construct
the shifted-Chebyshev matrix

```text
V_jk = T_k(2 rho_j - 1),  k=0,...,N-1.
```

Lift all words to MPFR512 under the admitted MPFR 4.2.1 runtime. Solve `V a=g`
by unpivoted Householder QR in ascending column/row order, choosing the
Householder sign positive when its leading entry is nonnegative. Accumulate
every inner product in ascending index order, back-substitute from `N-1` to
zero, and fail on a zero/nonfinite norm or diagonal. This is stable for the
well-conditioned shifted-Chebyshev basis and exactly represents the unique
interpolant required by R8; a monomial Vandermonde solve is forbidden.

Evaluate

```text
I_N(rho_j) = sum_k a_k integral_0^rho_j T_k(2 sigma-1) dsigma
```

using the analytic Chebyshev antiderivatives and recurrence in MPFR512, then
round the final prefix once to binary64 RNDN. Define `delta_j=q_j-I_N(rho_j)`
in MPFR512 from the rounded `q_j` and prefix words, with one final RNDN. The
reference primitive is
`g2b_b4_r9_formulation_proposal.py`; a later executor must reproduce its
synthetic wires before it may read an initializer.

### Norms and scale-free acceptance

For each returned stage, persist the little-endian binary64 `q`, `g`, prefix,
and `delta` profiles and their SHA-256 hashes. Report for `q` and `delta`:

```text
nodal Linf,
sqrt(sum_j ClenshawCurtisWeight_j * value_j^2),
origin and infinity words.
```

Weights are the frozen positive `[0,1]` B4-R8 weights. MPFR512 accumulates the
weighted square sum and square root before one RNDN output.

After all four target stages and the unchanged field cross-grid gate pass,
project the coarser `q` and `delta` profiles to each adjacent finer grid with
the already frozen barycentric projection. For each profile, compute the fine-
grid difference Linf and fine-grid Clenshaw–Curtis L2. This yields three pair
errors for each of four metrics. The new gate passes iff:

- each `q` and `delta` level Linf/L2 sequence from 64/96/128/256 strictly
  decreases at every step, allowing equality only when both values are exact
  positive zero; and
- each adjacent-pair error sequence `64_to_96`, `96_to_128`, `128_to_256`
  obeys the same strict-contraction-or-zero-plateau rule.

This is a scale-free Cauchy/refinement condition. It contains no absolute
constraint threshold and no value chosen from B4-R4. It is deliberately
fail-closed: four grids give bounded numerical convergence evidence, not a
continuum proof.

## Frozen four-grid chronology

The node order is exactly `64,96,128,256`; each grid materializes the unchanged
caller initializer independently. A coarser state may never predict, seed,
interpolate, or correct a finer solve. Within each grid the exact seven target
amplitudes are `2^-16,...,2^-10`; stage zero uses the caller predictor and each
later stage uses only the preceding accepted same-grid state.

For each stage: assemble raw rows/Jacobian, equilibrate the correction system,
run the unchanged Newton/Armijo chronology once, persist its returned state and
raw diagnostics, compute/persist the authority-neutral constraint monitor, and
accept or stop. The first failed stage is terminal. Field and constraint cross-
grid gates run only after all 28 stages complete; field comparison runs first,
then the new constraint gate. First failure stops all later duties.

## Runtime, source, input and output identity

The only eligible runtime lineage is the admitted offline Linux image
`sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1`
with `--network none`, CPython 3.12.11, gmpy2 2.2.1, GMP 6.3.0, MPFR 4.2.1,
MPC 1.3.1, glibc 2.36, round-to-nearest, `PYTHONHASHSEED=0`, and
`PYTHONDONTWRITEBYTECODE=1`. The existing runtime manifest and loaded-object
hashes remain mandatory.

The authority-neutral proposal source binds 27 immutable policy, initializer,
runtime, source, and B4-R4 through B4-R8 evidence files by path, size, and
SHA-256. A future B4-R10 executor may import the proposal primitives and wrap
the immutable B4-R4 runner only through the exact deltas above. Its source,
tests, packet, command, and execution token must be byte-pinned by a separate
preexecution checkpoint before execution authority can be considered.

The future exclusive root is frozen now as:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1/
```

It is absent during R9. B4-R10 must fail before creation on any file/symlink
collision. Once created under a later authorization, it may never be deleted,
reused, renamed into place, or retried.

## Output inventory and receipt schema

A later authorized executor must preserve the B4-R4 exclusive-write/readback/
fsync behavior and use this ordered inventory:

```text
preexecution-binding.json
level-{64,96,128,256}/initializer-state.f64le
level-N/stage-00..06-state.f64le
level-N/stage-00..06.json
level-N/stage-00..06-{q,g,prefix,delta}.f64le
level-N/stage-00..06-constraint-monitor.json
level-N/level-receipt.json
cross-grid-receipt.json
constraint-cross-grid-receipt.json
terminal-receipt.json
```

First-failure inventories contain only chronologically reached files plus the
terminal receipt. Every JSON file is canonical ASCII JSON with no NaN/Inf and
every receipt binds relative path, bytes, raw SHA-256, and readback identity.

The preexecution receipt must bind proposal/implementation/test/checkpoint
hashes, all 27 frozen dependencies, image/runtime/loaded objects, exact command,
level/amplitude order, output-root absence, and all locks. Each stage receipt
binds raw Newton diagnostics, row/column scale hashes, recovered-direction
identity, state and four profile bindings, norm words, endpoint/tail checks,
and `candidateAuthority=false`. Level receipts bind seven ordered stages.

The terminal receipt must contain status `PASS|FAIL`, a typed decision and
first failure, exact attempted/completed counts, all level bindings, both
cross-grid bindings or null, `noRetry=true`, `noRetune=true`,
`coarseGridPredictorAllowed=false`, `candidateAdmission=false`, and all
authority locks false. Even a bounded four-grid `PASS` unlocks only the next
ordered mathematical proof duty; it is not candidate admission or proof.

## Independent audit and stop rules

R9's independent tests must rehash all frozen bindings, prove the future root
absent, inspect the proposal source for candidate-runner imports and filesystem
writes, verify algebraic equivalence of power-of-two scaling, reproduce exact
constant/quadratic prefix integrals on nonstandard nodes, and exercise pass and
fail cases of the threshold-free contraction rule.

A later execution requires a source-disjoint audit that independently reopens
every output, reconstructs all scale vectors and monitor profiles, repeats the
field and constraint cross-grid decisions, confirms chronology and mutation
locks, and rehashes the terminal receipt. Any missing identity, nonfinite
quantity, tail-interface failure, QR rank failure, output collision, stage
failure, field gate failure, or constraint contraction failure is terminal.
There is no retry or alternate proposal under this candidate identity.

## Authority boundary

R9 may conclude only `FORMULATION_PROPOSAL_FROZEN`. It cannot set execution
readiness. No candidate state was evaluated or materialized, and no correction,
Newton, continuation, or Armijo path ran. Candidate, vacuum, proof, execution,
replay, lane, pair-agreement, lamp, Theory Graph, joint geometry/state,
physical, propulsion, and transport authority remain false.

