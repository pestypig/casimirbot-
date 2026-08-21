# NHM2 Spherical Boson-Star v2 August 28 Numerical Decision Sprint

Status: closed with an authenticated `BLOCKED` decision.

Parent program:
[`nhm2-spherical-boson-star-v2-work-program.md`](./nhm2-spherical-boson-star-v2-work-program.md)

Decision deadline: **August 28, 2026, end of day America/New_York**

Decision outcome: **BLOCKED**

Final decision record:
[`nhm2-spherical-boson-star-v2-august-28-numerical-decision-record.md`](./nhm2-spherical-boson-star-v2-august-28-numerical-decision-record.md)

The decision was issued early on August 21, 2026 because the first ordered
initializer blocker and its upstream production-runtime cause were already
reproducible. The deadline was not used to justify waiting after the evidence
became decisive.

## Purpose

By the deadline, produce one reproducible decision about whether the frozen
classical branch can advance into the full proof program. The required outcome
is exactly one of:

- `GO`: the preregistered first numerical checkpoint passed with authenticated,
  replayable evidence;
- `FAIL`: the checkpoint executed under the frozen policy and a scientific or
  numerical hard gate failed;
- `BLOCKED`: a named missing definition, implementation, runtime, or evidence
  boundary prevented a valid checkpoint from being executed.

This is a decision deadline, not a deadline for an accepted semiclassical
candidate, two complete 68-file lanes, a Theory Graph lamp, or physical
viability.

## Frozen numerical checkpoint

The checkpoint is the first independent full solve in the frozen branch policy:

| Item                     | Frozen value                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Grid                     | N=64                                                                                                                    |
| Initial amplitude        | A=2^-16                                                                                                                 |
| Initializer chronology   | Materialize the frozen lambda=2^-5 initializer/evaluator output, then use it only as the caller initializer for A=2^-16 |
| Solved-row residual gate | normalized L-infinity <= 2^-40                                                                                          |
| Accepted-step gate       | scaled accepted-step L-infinity <= 2^-42 for two consecutive steps                                                      |
| Unused constraint gate   | normalized L-infinity of unused E^x_x <= 2^-28                                                                          |
| Failure behavior         | first hard failure stops the candidate; no alternate grid, initializer, branch, or tolerance                            |

The exact machine-readable authority is
[`shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts`](../../shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts).
If this table and that contract disagree, the contract wins and this sprint must
be corrected before a run.

## Entry conditions

The numerical attempt may begin only when all of these are true:

1. The vacuum-continuation proof ABI defects named below are repaired, resealed
   through an independent preseal acknowledgement, and freshly audited.
2. The exact branch-policy source and semantic bindings are stable.
3. The initializer/evaluator, solver, dependencies, toolchain, executable,
   runtime, command, and input bytes are bound before execution.
4. The attempt has a fresh output location and cannot overwrite or adopt an
   earlier result.
5. No candidate, proof, replay, lamp, or physical authority is granted merely by
   satisfying these entry conditions.

## Vacuum defects closed during the sprint

The vacuum ABI repair resolved:

- an exact `payloadSha256` preimage/domain rule;
- one explicit product-kind ordinal map and an equation binding it to the
  record-self-hash ordinal;
- an exact bounded ordered input-manifest role inventory or an explicit null
  choice/blocker rather than an invented per-cell inventory;
- rejection of unpaired UTF-16 surrogates before canonical hashing;
- hostile/golden tests that prove those rules and preserve all false/null
  readiness and authority locks.

It was independently acknowledged, sealed, and audited before this decision.
The sprint then stopped at the distinct initializer production-runtime blocker.

## Definition of done

The sprint closes only when one decision packet contains:

- exact repository commit and dirty-tree disclosure;
- exact source, dependency, toolchain, executable, runtime, command, and input
  bindings used by the attempt;
- the repaired vacuum ABI seal and its independent audit verdict;
- raw solver output and a bounded receipt for the N=64, A=2^-16 attempt, or the
  exact typed blocker that prevented it;
- every applicable frozen gate value, observed value, and first-failure code;
- an independent replay receipt if a numerical result was produced;
- a no-retune statement covering grids, initializer, tolerances, algorithms,
  and candidate identity;
- focused tests and math validation appropriate to the changed files;
- Casimir adapter verification and certificate integrity only if the completed
  patch falls within the repository verification gate and the required runtime
  is available;
- an explicit statement that candidate admission, joint geometry/state,
  68-file execution, diagnostic lamp, physical viability, propulsion, and
  transport remain false/null.

A planning document, schema seal, unit-test pass, or synthetic fixture by itself
cannot produce `GO`.

## Decision rules

### GO

Issue `GO` only if the exact N=64, A=2^-16 solve ran under the frozen policy,
passed all three numerical gates, retained complete provenance, and was
independently replayed without a material mismatch. `GO` means only “continue
the preregistered classical branch/proof program.” It does not admit a candidate.

### FAIL

Issue `FAIL` when the authenticated attempt ran and the first hard scientific or
numerical gate failed. Preserve the failing bytes and receipt. Do not silently
retune or start another candidate under the same decision packet.

### BLOCKED

Issue `BLOCKED` when a valid attempt cannot run because a required definition,
implementation, runtime, identity, or evidence issuer is absent or invalid.
Name the smallest causal blocker and the exact work packet that would remove it.
Do not report infrastructure absence as evidence against the mathematics.

## Target schedule

| Date      | Target outcome                                                                                   | Stop condition                                                           |
| --------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Aug 20    | Freeze this program/sprint and isolate the active file surface                                   | No ambiguous ownership or silent roadmap drift                           |
| Aug 21    | Repair vacuum ABI hash/input/Unicode defects                                                     | Fresh hostile tests pass; literals remain unpinned until acknowledgement |
| Aug 22    | Independently acknowledge, pin, and audit the repaired ABI; close initializer/evaluator exposure | Exact semantic/plain/size and raw pins match                             |
| Aug 23–24 | Integrate and attempt N=64 at A=2^-16                                                            | First hard failure stops; all raw evidence retained                      |
| Aug 25    | Perform independent replay or classify its exact blocker                                         | No shared primary executable/runtime lineage                             |
| Aug 26    | Draft GO/FAIL/BLOCKED packet from raw evidence                                                   | No claim exceeds observed evidence                                       |
| Aug 27    | Run focused tests, math validation, and applicable verification gates                            | First verification failure repaired or reported honestly                 |
| Aug 28    | Freeze and publish the numerical decision packet                                                 | Exactly one outcome; downstream active gate updated deliberately         |

Dates are planning targets, not permission to weaken an entry condition. If a
target slips, preserve the deadline by issuing an honest `BLOCKED` decision with
the exact causal blocker rather than manufacturing a pass.

## Explicit non-goals before the deadline

- Completing the N=96, N=128, or N=256 branch solves.
- Claiming continuous vacuum connection, no-fold, positivity, or boundary proof
  completion without authenticated proof receipts.
- Producing or accepting a joint semiclassical geometry/Hadamard state.
- Producing the four mean/noise arrays or 63 constraint arrays.
- Publishing either 68-file lane.
- Promoting a registry entry or changing a Theory Graph lamp.
- Re-running the 447-layer Casimir apparatus calculation as a substitute for
  this branch decision.
- Claiming physical viability, propulsion, transport, or an operational warp
  bubble.

## Daily status format

Each update must contain:

```text
Date/time:
Repository commit and dirty-tree disclosure:
Active task:
Frozen inputs checked:
Evidence produced:
First blocker or failure:
Decision state: pending | GO | FAIL | BLOCKED
Authority changes: none (unless separately authorized and verified)
Next bounded task:
```

Long narrative assessments may explain evidence, but they cannot change the
decision state or active gate without updating this packet.

## Final decision record template

```text
Decision: GO | FAIL | BLOCKED
Decision timestamp:
Repository commit:
Candidate identity:
Checkpoint: N=64, A=2^-16
Frozen policy binding:
Vacuum ABI binding and audit:
Solver/runtime/input bindings:
Observed residual:
Observed accepted-step sequence:
Observed unused-constraint norm:
Independent replay:
First failure/blocker:
No-retune attestation:
Tests and verification:
Raw artifact references:
Claims that remain false/null:
Next authorized gate or repair packet:
```
