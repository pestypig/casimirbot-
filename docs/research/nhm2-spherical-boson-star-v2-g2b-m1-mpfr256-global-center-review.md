# NHM2 Spherical Boson-Star v2 G2B-M1 MPFR256 Global-Center Review

Program gate: G2B-M1 — MPFR256 global-center implementation review

Workstream: versioned classical-branch repair review

Capability or component: fixed high-precision multiple-shooting/global-center
solver and convergence diagnostic

Current maturity: fixed-segment multiple-shooting design selected; source and
execution not yet authorized

Target maturity: a fully preregistered, tested, bounded MPFR256 solver proposal
whose one-shot execution can either produce a converged immutable global center
with margin or a precise terminal falsifier

Required frozen inputs: G2-R1 receipt
`86633508a20c79b56d7ed0455102fd1c35f206e521dbda8e3e9d79b85aef243f`;
G2B-A failure record; unchanged Schrödinger-Poisson equations, origin
recurrence, `epsilon=2^-12`, outer radius 32, normalization, tail conditions,
point `x=1/128`, 128-mode projection, and rail `1/10^10`; the original global
center may be read only as a frozen initializer and comparison artifact

Required evidence: exact runtime/library byte admission; MPFR precision and
context restoration; fixed mesh/refinement schedule; fixed nonlinear solve and
damping chronology; independent residual evaluation; cross-refinement
agreement; exact output encoding; exact-rational Hermite check at the frozen
point; source/spec hashes; immutable one-shot receipt; no-retune attestation

Stop/fail criteria: missing runtime identity; numerical method not fully frozen;
reusing a result to change the schedule; nonfinite state; loss of ground-state
sign or monotonicity; Newton or matching failure; refinement disagreement;
residual or boundary margin failure; changed physics, projection, point, or
rail; output collision; any authority promotion

Explicit non-goals: accepting a candidate; weakening `1/10^10`; choosing a
method after observing its result; proof of the later vacuum/no-fold/remainder
duties; branch execution; lamp, physical, propulsion, or transport authority

Downstream gate unlocked: one frozen G2B high-precision center attempt, or a
terminal falsifier showing that the currently justified MPFR construction does
not recover the core duty

Change class: exploratory numerical implementation review; no authority

## Why this is the next justified class

G2-R1 showed that both the original center representation and its 128-mode
projection miss the core rail. G2B-A then showed that the preregistered tighter
SciPy binary64 ladder cannot progress past its first solver-status screen. The
rail and physics are not implicated by either result. The smallest remaining
lead is therefore to reduce numerical conditioning and representation error
with more precision and an independently controlled integration/matching
method.

## Review questions that must close before execution

1. **Formulation.** Decide between fixed-segment multiple shooting and a fixed
   spectral collocation system from conditioning evidence, not a trial result.
   A single outward shot is not presumed stable at radius 32.
2. **Unknowns and matching.** Freeze the exact state, variational equations,
   segment interface unknowns, origin-series injection, and two tail equations.
3. **Discretization.** Freeze all segment boundaries, integration/collocation
   orders, and a finite refinement ladder before running the candidate data.
4. **Nonlinear chronology.** Freeze iteration cap, residual norm, pivot policy,
   damping list, first-acceptable rule, and failure behavior.
5. **Runtime.** Bind gmpy2, MPFR, GMP, Python, source, and dependency bytes;
   restore the MPFR context and fail closed on flags or identity drift.
6. **Convergence.** Require agreement of two independently executed fixed
   refinements and an independent dense residual replay. Passing one nonlinear
   residual is insufficient.
7. **Core-duty margin.** Require the exact-rational cubic-Hermite residual and
   frozen 128-mode core residual to be at most one quarter of `1/10^10` before
   proposing a replacement center.
8. **Receipt completeness.** Persist failures as well as successes, including
   the first failed stage, iteration, refinement, and bounded state summary.

## Formulation decision

Use fixed-segment MPFR256 multiple shooting. The frozen comparison center has
`kappa` binary64 word `3ff2d379a0d0ac66`, approximately
`1.176629665550331`. A single outward transfer over radius 32 therefore carries
the asymptotic scale `exp(kappa*32)`, approximately `2.25e16`. Splitting the
same interval into 16 fixed segments reduces the corresponding per-segment
scale to approximately `10.52`. This is conditioning evidence available before
the successor run and selects multiple shooting without trying candidate
alternatives.

Spectral collocation is not a hidden fallback in this packet. If the frozen
multiple-shooting construction fails, the result is a falsifier and a new
versioned review is required.

## Frozen numerical construction

### State, unknowns, and residual

The state order is exactly `[u,uPrime,V,VPrime]` and the ODE remains:

```text
u'      = uPrime
uPrime' = 2*(V-nu)*u - 2*uPrime/x
V'      = VPrime
VPrime' = u^2 - 2*VPrime/x
```

There are 62 nonlinear unknowns in this order:

```text
[Vc, nu, state_at_segment_1, ..., state_at_segment_15]
```

Segment 0 starts from the unchanged exact-rational origin recurrence evaluated
at `epsilon=2^-12`. Each of 15 interface residual blocks is propagated-left
state minus the next segment's four unknowns. The last propagated state supplies
the unchanged two tail residuals. The residual order is the 15 interface blocks
followed by `[potentialTail, scalarTail]`.

Every segment also integrates the 4-by-4 state transition matrix and the
four-component sensitivity to global `nu`. Origin derivatives with respect to
`Vc` and `nu` come from the exact recurrence. These quantities assemble the
full 62-by-62 Newton matrix without finite differences.

### Mesh and refinement

The immutable output mesh has 8,193 cosine-spaced nodes:

```text
x_i = epsilon + (32-epsilon)*(1-cos(pi*i/8192))/2
```

The 16 shooting segments end at output ordinals `0,512,...,8192`. Two
refinements run independently from the same frozen v1 center initializer:

| Refinement | RK4 substeps per output interval | Total RK4 steps |
| ---------: | -------------------------------: | --------------: |
|          0 |                                4 |          32,768 |
|          1 |                                8 |          65,536 |

All Runge-Kutta stages use MPFR256 round-to-nearest. A refinement result cannot
initialize the other refinement.

### Newton chronology

Each refinement runs at most 12 full Newton iterations. The linear solve uses
scaled partial pivoting with lowest-row-ordinal tie breaking. For every full
step, test damping ordinals exactly
`[1,1/2,1/4,1/8,1/16,1/32,1/64,1/128,1/256]` and accept the first whose maximum
absolute matching residual is strictly lower. If none lowers it, stop. Newton
convergence requires maximum matching residual at most `2^-180`; converged
solutions still undergo every independent replay screen.

### Runtime and context

The implementation must pin gmpy2 `2.3.1`, MPFR `4.2.2`, the gmpy2 extension,
MPFR DLL, GMP DLL, Python executable, proposal, source, and test bytes. It must
use precision 256, round-to-nearest, exponent range `[-1000000,1000000]`, save
and restore the prior context, reject forbidden flags, and disclose that the
Windows gmpy2 path does not establish source/runtime-disjoint replay authority.

### Frozen admission screens

Both refinements must independently satisfy:

```text
maximum matching residual <= 2^-180
maximum boundary residual <= 2^-160
u > 0 and uPrime <= 0 on every output node
V < 0 and VPrime >= 0 on every output node
Vc < nu < 0, mass > 0, kappa > 0, sigma+1 > 0
```

The two refinements must agree at every output state and both parameters within
`2^-40` under the normalized difference `abs(a-b)/(1+abs(a)+abs(b))`.
The Richardson estimate from their fixed 2:1 RK4 step ratio is the same
difference divided by 15 and must be at most `2^-44`. These thresholds are
frozen from fourth-order truncation scaling and the factor-four core-duty
margin, not from an observed successor result.

Only after those checks may the fine result be encoded to binary64 words. The
encoded center must then satisfy, without refitting:

```text
exact-rational cubic-Hermite core residual at x=1/128 <= 1/4 * 10^-10
maximum normalized cubic-Hermite midpoint ODE residual on the encoded output
  mesh <= 1/10^10
```

The runner also computes the frozen 128-mode projected core residual. That
measurement is a downstream representation classifier, not a reason to discard
a center that passes its own Hermite duty:

```text
center fails its own margin
  -> GLOBAL_CENTER_SUCCESSOR_FAILED
center passes, 128-mode projection fails its margin
  -> CENTER_RECOVERED_CODEC_OR_MODE_SUCCESSOR_REQUIRED
center and 128-mode projection both pass their margins
  -> CENTER_AND_FROZEN_PROJECTION_RECOVERED
```

Any upstream numerical screen failure produces a complete immutable
`CALCULATION_FAIL` receipt and terminates the packet. Either center-pass decision
remains calculation-only. The first permits a separately frozen codec/mode-count
review; the second permits a separately frozen G2B proof-center attempt.
