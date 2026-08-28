Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P3 deterministic ordinal-preserving subpanel parallelism
Current maturity: local 1/2-thread implementation and exact-equivalence PASS; 4/8/16-thread replay and scaling remain pending
Target maturity: H2-P3/P4 cloud closure across 1/2/4/8/16 vCPUs, followed by a bounded successor-runtime decision
Required frozen inputs: checkpoint ABI `6fbf6cdb...911ca`, repaired Borel-growth definition `7dd4d30a...94737`, state-jet definition `75eff013...ffc`, 512-bit Arb arithmetic, order 128, 13 jets, 43 elementary convolutions per subpanel, dyadic refinement candidates `2^0..2^16`, original ordinal reduction, first-passing selection, and every authority lock
Required evidence: exact `arb_equal` replay across declared thread counts, identical counters/failure/coverage, deterministic repeats, bounded scaling, runtime identities, independent audit, and current math/WARP/Casimir verification
Stop/fail criteria: any numerical, counter, chronology, schedule, width-rule or authority mismatch; a non-thread-safe runtime; selected-member ingress; root/token/authorization creation; or mutation of either preserved H2 execution
Explicit non-goals: parallel refinement candidates, changing the frozen mathematics, frozen-member execution, scientific authorization, C08 completion, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: a separately authorized candidate-neutral 4/8/16-vCPU cloud replay may complete H2-P3 and measure H2-P4; no scientific run is unlocked

# H2-P3 deterministic parallel local result

Status date: August 27, 2026.

## Verdict

The local H2-P3 implementation passes its bounded 1/2-thread gate. Independent
subpanels execute in bounded batches, publish only into ordinal-indexed slots,
and are reduced serially in the exact v1 order. Refinement candidates remain
sequential. The implementation caps live panel outputs at the declared thread
count and disables nested FLINT parallelism.

The full H2-P3 row is not closed. Its canonical exit evidence requires exact
1/2/4/8/16-thread replay. The current machine established only 1 and 2 threads;
4/8/16 remain a separately authorized cloud action. H2-P4 scaling is likewise
pending.

No candidate was loaded or evaluated. No positive sample, candidate root,
token, authorization, scientific handler or authority promotion exists. Both
preserved serial H2 executions were left unchanged.

## Exact evidence

| Evidence | Identity or result |
| --- | --- |
| Immutable evidence root | `artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p3-deterministic-parallel-v3-20260827` |
| Receipt | `854da16e1f26cb70629bfb4e19a82b20538d2e91a10bd6d5874ab6f18e57c8c2` |
| Evidence manifest | `2ecc4b1a6073754f4776ad060fcef332af5fe9bd4b99e1b82bbfaf1aac405653` |
| Independent audit | `579170b486f8fdf9b48909458cc981989f3a123480bcbc3b8d042242e6880834`, 21/21 PASS |
| Selector fixture | two byte-identical 31/31 PASS runs |
| Order-128 equivalence | serial 1-thread versus 2-thread `arb_equal` for every endpoint, coefficient, remainder and margin; exact vectors and result fields |
| Two-thread replay | two complete semantic replays agree exactly |
| Selector image | `sha256:644df0e4c0d1c4f1200f6ca9463ff86eae747d6346add194ff76206f23d4ce10` |
| Calibration image | `sha256:eb604bd36f0fe0b82cef3e88c5675aa24a9553ed8f856686191fb2354118ed32` |
| Selector executable | `0d39ff805bfc098e03368154edf1df9caf53358695d4acd5b53687600f1ad2e9` |
| Calibration executable | `672d3721f7b8b9f8ed1ba0964fa812cfdd7a379320556e02062f89f66918aaba` |

The pinned builder exposes `FLINT_USES_PTHREAD=1` and thread-local FLINT
storage. The actual two-thread fixtures pass under that runtime. This follows
FLINT's documented condition that Arb threading requires thread-safe MPFR and
FLINT builds, plus worker-local cache cleanup.

## Local performance

The immutable exponent-0/1/2 calibration measured seven cumulative order-128
subpanels:

| Run | Parallel-only candidate time | Aggregate speedup |
| --- | ---: | ---: |
| 1 thread | 14.295 s | 1.00x |
| 2 threads, replay A | 8.658 s | 1.651x |
| 2 threads, replay B | 11.424 s | 1.251x |

The four-panel exponent-2 row measured 8.342 seconds at one thread, 4.512
seconds in replay A and 6.411 seconds in replay B. This is positive local
scaling but also enough timing variance that a 16-vCPU forecast must not be
promoted from the local result. H2-P4 must measure the actual cloud curve.

## Current-head verification

- H2-P3 fixture: 31/31 PASS twice.
- Independent evidence audit: 21/21 PASS.
- Existing H2 profile-equivalence tests: 4/4 PASS.
- Legacy selector and H2-ledger Docker definitions: build PASS; the quick
  selector fixture is 31/31 PASS; the long H2 ledger was not launched.
- Math-stage validation: 323 entries, PASS.
- Required WARP suite: 18 files and 179/179 tests, PASS.
- Casimir adapter run `2538`: `PASS/GREEN`, no first failure or deltas;
  certificate `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These gates validate only the candidate-neutral implementation state. They do
not establish an H2 proof, a boson-star result, an NHM2 result, or physical
authority.

## Exact resume point

Freeze a bounded H2-P4 cloud packet that uploads only the candidate-neutral P3
sources and pinned Docker definitions to a new temporary 16-vCPU VM. After a
separate explicit authorization, run exact 1/2/4/8/16-thread replay and bounded
scaling, preserve all output, and stop the VM. Any numerical mismatch returns
to the serial prepared successor. A scaling shortfall preserves P3 numerical
equivalence but cannot claim the turnaround target is reachable.
