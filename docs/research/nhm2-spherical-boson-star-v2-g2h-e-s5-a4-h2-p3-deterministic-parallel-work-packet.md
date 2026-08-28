Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P3 deterministic ordinal-preserving subpanel parallelism
Current maturity: H2-P2 prepared-moment exact-equivalence and local-performance PASS; subpanels remain serial
Target maturity: additive bounded-thread prepared selector/calibration path with exact serial equivalence and deterministic first-failure chronology
Required frozen inputs: checkpoint ABI `6fbf6cdb...911ca`, repaired Borel-growth definition `7dd4d30a...94737`, state-jet definition `75eff013...ffc`, 512-bit Arb arithmetic, order 128, 13 jets, 43 elementary convolutions per subpanel, dyadic refinement candidates `2^0..2^16`, original ordinal reduction, first-passing selection, v1 serial oracle entrypoints, and every authority lock
Required evidence: thread-safe runtime check, manufactured valid/invalid equivalence, order-128 `arb_equal` panel and accumulated outputs, identical counters/failure details/coverage, deterministic repeated 1/2-thread replay, bounded local scaling, source/image/executable identities, independent evidence audit, regressions, and current math/WARP/Casimir verification
Stop/fail criteria: any changed Arb value, addition order, coverage order, counter, failure detail, first-failure ordinal, candidate schedule, width decision or authority lock; a non-thread-safe runtime; changed equation/precision/moment formula; selected-member ingress; positive sampling; candidate root/token/authorization creation; or mutation of either preserved H2 execution
Explicit non-goals: parallel refinement candidates, unordered/tree reduction, changing the selector schedule or width rail, candidate evaluation, scientific authorization, cloud execution, C08 completion, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: H2-P4 bounded 1/2/4/8/16-vCPU scaling calibration only after exact H2-P3 equivalence passes

# H2-P3 deterministic parallel work packet

Status date: August 27, 2026.

## Change classification

This work changes implementation scheduling only. It does not change
mathematical semantics, runtime authority, receipt semantics, candidate
identity, execution authority, proof maturity, or claim authority.

## Frozen concurrency contract

1. Refinement candidates remain sequential in the existing dyadic order.
2. Within one candidate, independent subpanels may be evaluated concurrently.
3. Each worker receives only read-only ledger/input views and owns every Arb
   temporary and output it mutates.
4. Work is issued in bounded ordinal batches containing at most the declared
   thread count. The implementation never materializes all 65,536 outputs.
5. Workers publish results into slots indexed by the frozen subpanel ordinal.
6. After each batch joins, one serial reducer consumes slots strictly by
   increasing ordinal and performs coefficient/remainder additions in exactly
   the v1 order.
7. The serial reducer alone appends coverage, updates counters, selects the
   first failure, evaluates the width rule, and chooses the first passing
   refinement candidate.
8. Work completed speculatively after an earlier ordinal failure is discarded
   and cannot affect counters, receipts, failure precedence, or output.
9. FLINT internal parallelism remains one thread. Every explicit worker calls
   `flint_cleanup()` after destroying its local Arb objects; process cleanup
   remains outside the numerical result.

The official FLINT thread-safety contract requires both MPFR and FLINT to be
built in thread-safe mode and cautions that threaded Arb is minimally tested.
The pinned image must therefore compile and run an actual concurrent
manufactured fixture; a build assumption alone is insufficient.

## Equivalence sequence

1. Preserve the existing v1 serial selector and H2-P2 prepared entrypoint as
   callable oracles.
2. Compare one-thread successor output with the serial prepared path.
3. Compare two-thread output with the one-thread successor using `arb_equal`
   for every coefficient, remainder, margin and endpoint plus exact vector and
   result-field equality.
4. Exercise deterministic replay, invalid input, worker/predecessor failure,
   nonfinite accumulation, and explicit thread-resource rejection.
5. Run a bounded order-128 calibration at one and two threads and compare all
   non-timing NDJSON fields.
6. Preserve raw output and build identities, then independently audit them.

The first mismatch preserves this attempt as FAIL evidence. It cannot be
repaired by changing arithmetic, changing reduction order, suppressing a field,
or weakening equality.

## Cloud boundary

H2-P3 performs local one/two-thread proof-of-equivalence only. H2-P4 may use a
new temporary 16-vCPU Google Compute Engine VM only under a separate bounded
authorization naming machine class, storage, cost boundary, uploaded
candidate-neutral sources, command, timeout, evidence root, and stop action.
Neither existing serial H2 execution may be changed.
