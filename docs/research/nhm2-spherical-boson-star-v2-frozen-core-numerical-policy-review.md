# NHM2 Spherical Boson-Star v2 Frozen-Core Numerical-Policy Review

Status: **closed as VERSIONED_PROPOSAL; persisted user goal authorized the
separate G1A implementation and first-result attempt**.

Program gate: **G1-R2 — frozen-core numerical-policy review**

Workstream: frozen N=64 initializer-core failure disposition

Capability or component: scientific review of the preregistered Newton,
precision, tolerance, and line-search policy

Current maturity: the frozen core was executed in two source-disjoint
implementations and both produced the same pre-projection failure, state bytes,
residual bytes, step chronology, and norms; the observation is admitted by a
server-owned opaque capability, but the implementations share MPFR/GMP runtime
lineage and no candidate execution occurred

Target maturity: exactly one reviewed decision:

1. `NO-GO` — retain the current frozen candidate result as terminal and close
   this branch; or
2. `VERSIONED_PROPOSAL` — specify a scientifically justified successor policy,
   with every changed rule and falsifier explicit, for separate user
   authorization before any implementation or run.

Required frozen inputs:

- candidate identity
  `nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1`;
- branch-selection semantic
  `221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa`
  / 41,280 canonical bytes;
- initializer/evaluator semantic
  `2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5`
  / 24,711 canonical bytes;
- first-failure receipt self-hash
  `cb9c36432486b4138ad01b8c8beebaca4eecb480fdd54a9a5f57a5030c4ed0cb`;
- failure `armijo_schedule_exhausted_without_retry`, equation norm
  `6.052214285290347e-11`, scaled step `3.043268818520606e-17`, nine accepted
  updates, and alpha exponents `0,0,0,0,0,1,3,6,8`;
- state SHA-256
  `601af0c0de01be4bb5a2abc0dc743cae57397a50c9406720856ae396c7325e50`;
- residual SHA-256
  `13418bbf6f97925754b7dd999b1e70e2d2495d2efb4993f61ee98cf4be62dc17`.

Required evidence:

1. An analytic/numerical diagnosis separating implementation error,
   conditioning, finite-precision floor, Jacobian defect, line-search policy,
   and genuinely absent solution basin.
2. Exact evidence for every diagnosis. Exploratory calculations must be clearly
   labeled and cannot overwrite or reinterpret the frozen result.
3. If a successor is proposed, an exact list of changed semantics, scientific
   rationale fixed before observing successor results, new version identity,
   entry/stop/failure rules, and an explicit statement that the predecessor
   remains failed.
4. An assessment of whether a genuinely runtime-disjoint replay of the failed
   predecessor adds decision value before any successor work.
5. Independent review and applicable math/WARP/Casimir checks for the proposal.

Stop/fail criteria:

- Any attempt to relabel the diagnostic result as candidate execution or GO.
- Any hidden change to tolerance, precision, line search, initializer, solver,
  grid, candidate identity, or failure precedence.
- Any downstream projection, continuation, tail, payload, candidate, proof,
  lane, replay, or lamp work based on the unavailable projected state.
- Any claim that shared MPFR/GMP lineage is runtime-disjoint replay.
- Any authority promotion beyond the exact evidence.

Explicit non-goals:

- Retrying the failed candidate under modified rules.
- Implementing a successor before explicit user authorization.
- Running N=96, N=128, or N=256.
- Producing a six-payload initializer, branch proof, accepted geometry/state,
  SI/metric inputs, either 68-file lane, replay agreement, or a Theory Graph
  lamp.
- Claiming physical viability, propulsion, transport, launch, or empirical
  authority.

Downstream gate unlocked: either permanent closure of this frozen branch, or a
separately authorized versioned successor attempt. Review alone cannot unlock
G2 or admit a candidate.

## Current review decision

The diagnostic evidence supports a `VERSIONED_PROPOSAL`, not a terminal
`NO-GO`. The exact proposal is
[`nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md`](./nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md).

It preserves the predecessor failure and every candidate/grid/initializer/
tolerance/Armijo/projection rule. Its only proposed numerical changes are
end-to-end MPFR256 core arithmetic and deterministic row/column equilibration.
The persisted user goal separately authorizes exactly one additive N=64
implementation and first-result attempt under
[`nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-attempt.md`](./nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-attempt.md).

## Review rule

The predecessor result is immutable evidence. A versioned successor is a new
scientific hypothesis, not a repair that converts the predecessor to PASS. Its
proposal must be reviewed before its numerical outputs are observed. If the
review cannot identify a principled change with a predeclared falsifier, return
`NO-GO` rather than searching parameter space for a pass.
