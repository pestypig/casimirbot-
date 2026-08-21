# NHM2 Spherical Boson-Star v2 August 28 Numerical Decision Record

Decision: **BLOCKED, with independently reproduced frozen-core numerical FAIL evidence**

Decision timestamp: **2026-08-21T10:00:39-04:00**

Repository base commit: `4f9bbf5333a51255ef819cb319391e4bf183cf9f`

Dirty-tree disclosure: this decision was made in a shared dirty worktree. Exact
evidence is bound to the file and payload hashes below rather than inferred from
repository HEAD. Unrelated Helix, Minecraft, environment-harness, report, and
local build changes were neither used as scientific evidence nor modified for
this decision.

Candidate identity:
`nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1`

Requested checkpoint: `N=64, A=2^-16`

Reached boundary: frozen N=64 analytic initializer and core Newton solve,
before endpoint projection, continuation, tail construction, six-payload
materialization, candidate numeric admission, or scientific execution.

## Decision basis

The original fixed-native-arena prerequisite has been implemented far enough
to execute the exact frozen N=64 spectral graph, analytic L0 initializer, core
residual/Jacobian, three-step MPFR256 residual refinement, and Armijo schedule.
The older typed blocker
`core_level_fixed_native_arena_abi_unavailable` is therefore historical and is
not the current first failure.

Two independent implementations—the frozen Python graph and the new retained
native lease—produce the same bit-level state, residual, accepted-step
chronology, and terminal failure:

```text
armijo_schedule_exhausted_without_retry
```

The exact frozen outcome is:

- nine accepted updates;
- accepted alpha exponents `0,0,0,0,0,1,3,6,8`;
- 52 trial evaluations and 10 dense solves;
- preserved equation `L_inf = 6.052214285290347e-11`;
- required equation gate `2^-40` (approximately `9.094947017729282e-13`);
- last accepted scaled step `3.043268818520606e-17`;
- current state raw f64le SHA-256
  `601af0c0de01be4bb5a2abc0dc743cae57397a50c9406720856ae396c7325e50`;
- current residual raw f64le SHA-256
  `13418bbf6f97925754b7dd999b1e70e2d2495d2efb4993f61ee98cf4be62dc17`.

This is strong numerical first-failure evidence for the frozen core graph, but
it is not yet a fully authenticated candidate execution. The production
source/dependency/toolchain/executable/command/preseal closure and six-payload
issuer remain absent, and the diagnostic path deliberately records
`candidateNumericReadPerformed:false` and
`productionRuntimeReady:false`. The honest decision is therefore **BLOCKED**,
not candidate-level FAIL and not GO.

No downstream implementation can manufacture the projected core state after
this terminal failure. Continuation, tail Newton, join-barrier payloads, the
six-payload initializer, and the requested candidate checkpoint are causally
unreachable under the current frozen graph.

## Frozen bindings

| Artifact                            | Binding                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| Branch-selection policy source      | `d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82` / 44,912 bytes           |
| Branch-selection semantic           | `221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa` / 41,280 canonical bytes |
| Initializer/evaluator source        | `05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4` / 60,627 bytes           |
| Initializer/evaluator semantic      | `2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5` / 24,711 canonical bytes |
| Repaired vacuum ABI source          | `44c6392b56fe31a193e83e298effdd3dcc0b67c7cc684a45558a2ca2e48a8a81` / 46,152 bytes           |
| Repaired vacuum ABI spec            | `a4b8cd8b268b313c1349aca282dc7301344b3d434d8932fcb15472e830f4b2d7` / 23,189 bytes           |
| Repaired vacuum ABI semantic        | `2fb589d024463ec1e656a2b180b9fdfcd61713e474666afdc217c49f1bd03251` / 29,628 canonical bytes |
| Repaired vacuum ABI plain canonical | `4af8b689f175a418cacf252f260aa513407bcdba6161cd6497ec17932b17c732`                          |
| Native retained-lease source        | `282271256ff58ffa08f85b46fdfdb228295aa7d0f6131b51a60a0470af4f9853` / 159,743 bytes          |
| Native retained-lease spec          | `96cf01ecbca4ee87bce15f0d7db71b281b3fadf9471edbe82c621b7685827553` / 34,884 bytes           |
| Frozen binary64 environment source  | `8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4` / 14,980 bytes           |

The repaired vacuum ABI previously received an exact-byte independent `CLEAR`
audit. Its payload preimage/domain, product-kind ordinal equation, explicit
null input inventory, bounded canonical ingress, and unpaired-surrogate
rejection match the sealed definition.

## Observations and replay

- Frozen core numerical result: **FAIL** at
  `armijo_schedule_exhausted_without_retry`.
- Independent reproduction: **exact match** between Python and native graphs
  for the failure, chronology, norms, and state/residual bytes.
- Candidate-level execution: **not reached**.
- Candidate-level replay: **not applicable** because no authenticated
  candidate input or output was issued.
- Current production blocker: authenticated
  source/dependency/toolchain/executable/command/preseal and six-payload issuer
  closure remain absent.
- Causal numerical blocker: the frozen core graph terminates before projection.

## No-retune attestation

No candidate identity, grid, amplitude, initializer rule, tolerance, numerical
algorithm, line search, failure precedence, branch, or fallback changed after
the result was observed. No alternate precision, tolerance, initializer,
runtime rule, grid, or solver was attempted. Changing any of those would be a
new versioned scientific policy, not a repair of this frozen checkpoint.

## Verification

- Focused retained-lease test: **PASS_DIAGNOSTIC_ONLY**.
- Math report generation: **PASS**.
- Math registry validation: **PASS**, 318 entries.
- Required WARP suite: **179/179 PASS** across 18 files.
- Casimir adapter: **PASS / GREEN**, run `2420`.
- Adapter trace:
  `adapter:a61653bd-eea0-4f0d-87fc-84952f85de01`.
- Certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- Certificate integrity: **true**.
- Training-trace export: `artifacts/training-trace.jsonl`.

Casimir PASS establishes current repository constraint-pack integrity. It does
not turn the diagnostic core result into an authenticated candidate run and
does not override the numerical first failure.

## Self-correcting disposition

The feedback loop now stops downstream work and preserves the first failure.
The smallest honest next action is an authority-neutral failure-authentication
closure: bind the two exact reproductions, runtime/toolchain/executable/command
identity, frozen inputs, and no-retune attestation into one replayable decision
receipt. It may not change the frozen numerical graph.

If the August 28 objective still requires a GO after that receipt is complete,
the only scientifically honest route is a separately proposed and reviewed
versioned successor policy. That proposal must state exactly which numerical
rule changes and why; it cannot be silently substituted into this checkpoint.
Until such a policy is authorized, the exact deadline outcome remains
**FAIL/BLOCKED**, with the current candidate and all downstream authority
locked.

## Claims and authority

Candidate admission, branch acceptance, continuous-vacuum proof, joint
geometry/state acceptance, SI/metric-input execution, either 68-file lane,
replay agreement, Theory Graph lamps, physical viability, propulsion, transport,
launch, and empirical authority all remain false/null.

## Active packet

Only
[`nhm2-spherical-boson-star-v2-initializer-production-runtime-repair.md`](./nhm2-spherical-boson-star-v2-initializer-production-runtime-repair.md)
remains active, narrowed to authenticating and preserving the frozen first
failure. Downstream continuation or candidate work is not authorized.
