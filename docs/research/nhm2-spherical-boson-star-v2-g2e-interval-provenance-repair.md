Program gate: G2E — candidate-neutral interval/provenance repair
Workstream: authenticated classical proof infrastructure
Capability or component: directed transcendental arithmetic and durable failure provenance
Current maturity: G2D closed on a false-directed-sqrt defect; future execution blocked
Target maturity: independently audited non-candidate arithmetic/provenance contract
Required frozen inputs: G2D-R1 diagnosis, immutable G2D root and no-retry boundary
Required evidence: generic directed-sqrt vectors, source-disjoint replay and bounded error receipt
Stop/fail criteria: any G2D evaluator/root reuse, candidate sampling or discarded failure detail
Explicit non-goals: candidate execution, G2D correction run, admission, G3 or physical claims
Downstream gate unlocked: fresh candidate-family selection and preregistration only

# G2E interval and failure-provenance repair

## Purpose

Repair the reusable proof infrastructure exposed by G2D without rerunning or
reinterpreting G2D. This gate is candidate-neutral.

## Required work

1. Define a directed transcendental primitive contract whose lower and upper
   endpoints are independently checkable by exact postconditions.
2. Implement primary directed square root without relying on the rounding mode
   ignored by `Decimal.sqrt()`.
3. Validate it only on preregistered generic arithmetic vectors, including
   irrational, exact-square, subnormal-range and endpoint-interval cases.
4. Reproduce those vectors in a source/runtime-disjoint MPFR implementation.
5. Require the neutral orchestrator to persist bounded stdout/stderr bytes or
   their exact digest plus truncation metadata before terminal failure sealing.
6. Prove first-failure chronology and exclusive persistence with synthetic
   non-candidate processes.

## Stop boundary

No fluid-star formula, replay grid or occupied G2D output may be evaluated by
this gate. Passing G2E repairs infrastructure only. It does not establish the
G2D candidate, unlock G3 or authorize a new scientific execution.

## Downstream decision

After independent G2E closure, return to fresh candidate-family selection. Any
future candidate must have a new scientific identity, preregistered thresholds,
new exclusive root and separate explicit one-shot authority. The closed G2D
identity is ineligible.
