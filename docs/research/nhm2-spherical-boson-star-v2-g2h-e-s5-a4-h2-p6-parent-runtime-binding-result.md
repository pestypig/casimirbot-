Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P6 parent-ledger binding to the exact-equivalent 16-thread selector
Current maturity: candidate-neutral implementation and independent audit `PASS`; long H2 parent execution not run
Target maturity: separately frozen and authorized candidate-neutral H2 parent execution with immutable first-result evidence
Required frozen inputs: P6 packet, exact H2/P2 sources, H2-P3 selector equivalence and H2-P5A-R2 runtime binding
Required evidence: fixed 16-thread call binding, P2 result propagation, bounded manufactured fixture, independent audit, absent protected roots and false authority locks
Stop/fail criteria: thread-count drift, serial fallback, changed selector semantics, fixture failure, full-selector execution without a new packet, candidate ingress, root creation or authority promotion
Explicit non-goals: long H2 parent execution, frozen-candidate evaluation, positive sampling, token/authorization/output-root creation, scientific handler linkage, G3, SI/metric, lanes, lamp, physical viability, propulsion or transport
Downstream gate unlocked: one candidate-neutral H2 parent execution proposal only; no VM or execution authority

# H2-P6 parent runtime-binding result

Status date: August 27, 2026.

Status: **PASS INERT / PARENT RUNTIME BOUND**.

P6 replaces the H2 parent's serial selector call with the already audited
`evaluate_prepared_parallel` path at one compile-time constant of 16 threads.
P2 inherits the same engine and now propagates the bound thread count in its
typed result. No environment variable, command-line option or runtime fallback
can alter that count.

The selector still visits refinement candidates sequentially, evaluates
subpanels in bounded parallel batches, stores them by ordinal and reduces them
serially in ordinal order. Internal FLINT parallelism remains disabled. The
512-bit arithmetic, order-128 inventory, 13 jets, 43 convolution terms,
dyadic schedule, width threshold and first-passing rule are unchanged.

## Evidence

The bounded manufactured P2 fixture compiles in the pinned Arb/FLINT/GMP/MPFR
images and passes **11/11**. It recovers exact `P2(0)=1/4` at origin order 32
and records zero candidate evaluations, zero positive samples, no roots, no
handler linkage and no authority promotion.

The independent P6 audit passes **33/33** at SHA-256
`367a00170252be95d72ce91933e4cf8158438dfa5138bb3c8500f6250c913228`.
The fixture executable SHA-256 is
`d350e3531092b5659056a3a81d171b2888bb8abd713b2fe26d853a24b7915384`.

The first audit output, 32/33, is retained in the task history. Its sole failed
predicate expected a nonexistent loop-variable spelling; inspection confirmed
the actual `offset` loop and `ordinal = batch_begin + offset` reduction. The
predicate was corrected without changing implementation or mathematical
semantics, after which the audit passed 33/33.

Current-head verification passes math **323/323**, the required WARP battery
**18/18 files and 179/179 tests**, and Casimir adapter run `2560`
**PASS/GREEN** with `firstFail=null`, certificate SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. The temporary adapter was stopped afterward.

## Disposition

No long H2 fixture, full selector or frozen candidate ran. P6 closes only the
runtime-linkage gap. The next eligible packet may freeze one candidate-neutral
H2 parent execution using the measured machine class, exact binary and a cost/
runtime ceiling. That execution requires separate explicit authorization.

Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
transport authority remain false.
