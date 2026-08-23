# NHM2 spherical boson-star v2 G2B-B4-R5 terminal-Newton diagnosis

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: read-only diagnosis of the persisted B4-R4 N=64 stage-0 endpoint  
Current maturity: preregistered authority-neutral diagnostic  
Target maturity: independently audited mechanism classification and successor decision  
Required frozen inputs: exact B4-R4 preexecution/level/stage/terminal bytes, N=64 grid generator, square-system evaluator, analytic Jacobian, deterministic LU and Newton constants  
Required evidence: source/input closure, exact endpoint replay, ranked residuals, LU diagnostics, all 25 Armijo trials, monotonicity/constraint localization, receipt self hash and independent audit  
Stop/fail criteria: first binding, canonicality, endpoint-replay, linear-solve, trial-reconstruction, persistence or audit mismatch  
Explicit non-goals: invoking continuation/Newton chronology, accepting an update, mutating/retrying B4-R4, changing a threshold/grid/initializer/candidate, or promoting proof/lane/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: preparation of at most one separately versioned successor proposal if and only if the frozen classification supports it

## Semantic and authority boundary

This packet changes no mathematical or runtime authority and does not alter the
B4-R4 receipt semantics. It adds one read-only diagnostic calculation over the
already persisted terminal bytes. The producer may assemble the frozen map and
Jacobian, solve one linearized system, and evaluate the already frozen rejected
trial schedule. It may not call `solve_spherical_radial_compactified_diagnostic`,
`_solve_newton_map`, or the continuation routine; persist or feed back a trial
state; or create a candidate-execution output.

The B4-R4 output root is immutable. The sole B4-R5 output root is:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1/
```

It must be absent before the one permitted diagnostic invocation and may not be
deleted, reused or retried by this packet.

## Frozen reconstruction

The producer must rehash the exact B4-R4 preexecution, stage-state, stage
metadata, level receipt and terminal receipt before importing any numerical
source. It must independently verify both receipt self hashes, the terminal
first-failure code, one attempted level/stage, zero accepted stages, no retry,
no retune, and all false authority locks.

It then performs exactly these operations in admitted Linux binary64:

1. regenerate the frozen N=64 MPFR256 Lobatto grid;
2. unpack `stage-00-state.f64le` as 193 little-endian binary64 values ordered
   `F0[0:64], F1[0:64], varphi[0:64], w`;
3. assemble the frozen square system at target amplitude `2^-16`;
4. require bit equality with the persisted residual, unused-constraint, target,
   `w`, sign and monotonicity summaries before continuing;
5. rank all 193 solved residual rows by descending absolute binary64 value,
   breaking ties by row ordinal, and persist the first 16;
6. rank all 62 unused-constraint rows by the same rule and persist the first 16;
7. solve `J p = -r` once using the frozen deterministic LU and exactly its three
   refinement passes;
8. independently factor the same matrix with the same lowest-row partial-pivot
   rule only to record pivots, maximum original/U magnitude, pivot growth,
   absolute U-diagonal range and matrix infinity norm;
9. record the condition lower-bound proxy
   `||J||_inf * ||p||_inf / ||r||_inf`, explicitly not a condition estimate or
   proof of singularity;
10. reconstruct every trial `x_k=x+2^-k p`, `k=0..24`, in order and classify it
    as `DOMAIN_REJECTED`, `EVALUATION_REJECTED`, `ARMIJO_ACCEPTABLE`,
    `STATE_IDENTICAL`, or `INSUFFICIENT_MERIT_DECREASE` using the unchanged
    domain, L2 merit and `c=2^-12` rule;
11. require zero `ARMIJO_ACCEPTABLE` trials. Any acceptable trial contradicts
    the terminal chronology and stops as `BLOCKED_RECONSTRUCTION_MISMATCH`;
12. persist every adjacent `varphi[i] < varphi[i+1]` violation and the exact
    unused-constraint maximum node.

Row labels are frozen from the square-system ABI: each 64-row field block is
origin derivative, 62 ascending interior PDE rows and infinity value; row 192
is `varphi_origin_minus_target`. Unused rows map ordinal 0..61 to N=64 interior
node 1..62.

## Frozen mechanism triggers

The receipt records all triggered mechanisms; no result-dependent threshold
selection is allowed:

- `EXTREME_LINEAR_SENSITIVITY` iff the condition lower-bound proxy is at least
  `2^40`, pivot growth is at least `2^20`, or the nonzero absolute U-diagonal
  spread is at least `2^40`;
- `BINARY64_TRIAL_STAGNATION` iff any reconstructed trial is bit-identical to
  the endpoint or the final four evaluable trial merits are bit-identical;
- `UNUSED_CONSTRAINT_SEPARATION` iff
  `unused_constraint_linf / solved_residual_linf >= 2^20`;
- `NODAL_MONOTONICITY_DEFECT` iff at least one adjacent `varphi` violation is
  present;
- `NON_DESCENT_NEWTON_DIRECTION` iff `r^T J p >= 0`;
- `ARMIJO_GLOBALIZATION_CONFLICT` iff the direction is strict descent, all 25
  trials are evaluable and none is acceptable or state-identical.

The decision mapping is frozen:

| Trigger set | Decision |
|---|---|
| only `BINARY64_TRIAL_STAGNATION`, with or without `EXTREME_LINEAR_SENSITIVITY` | `PRECISION_SUCCESSOR_PROPOSAL_SUPPORTED` |
| only `ARMIJO_GLOBALIZATION_CONFLICT`, with optional nodal monotonicity | `GLOBALIZATION_SUCCESSOR_PROPOSAL_SUPPORTED` |
| `NON_DESCENT_NEWTON_DIRECTION` or `UNUSED_CONSTRAINT_SEPARATION` | `FORMULATION_OR_DISCRETIZATION_REVIEW_REQUIRED` |
| multiple incompatible mechanism families | `SEPARATE_BENCHMARKS_REQUIRED_BEFORE_SUCCESSOR` |
| none or only nodal monotonicity | `NO_UNIQUE_SUCCESSOR_JUSTIFIED` |

`EXTREME_LINEAR_SENSITIVITY` modifies the evidence for a precision proposal but
cannot alone select a successor. An `EVALUATION_REJECTED` or `DOMAIN_REJECTED`
trial outside the mappings yields `NO_UNIQUE_SUCCESSOR_JUSTIFIED` unless another
explicit trigger controls the decision.

## Output and stop rule

The producer writes exactly one canonical JSON receipt, exclusively and only
after the complete calculation. Its self hash uses domain:

```text
nhm2-spherical-boson-star-v2/g2b-b4-r5-terminal-newton-diagnosis/v1\n
```

`PASS` means only that the diagnosis was reconstructed and classified under
this packet. `BLOCKED` means its evidence could not be authenticated or did not
reproduce B4-R4. Neither outcome changes B4-R4's numerical `FAIL`.

Every receipt must state `b4R4Retried=false`, `continuationInvoked=false`,
`newtonChronologyInvoked=false`, `trialAcceptedOrPersisted=false`,
`noRetune=true`, `candidateAdmission=false`, `vacuumWorkUnlocked=false`, and
all proof, execution, replay, agreement, lane, lamp, Theory Graph, physical,
propulsion and transport authority false.
