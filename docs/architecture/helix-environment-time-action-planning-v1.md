# Helix Environment Time and Action Planning v1

Status: architecture contract; ET0–ET5 shared contract, deterministic ledger,
Minecraft compatibility compiler, affordance delta and feedback/interruption
surfaces are deterministically verified. ET6–ET8 remain ordered acceptance work.

Current status and dependency order remain governed only by
`docs/helix-environment-harness-work-program-v1.md`. Runtime ownership remains
governed by `helix-environment-agent-reasoning-v1.md`, and Minecraft execution
by `helix-minecraft-dual-plane-adapter-v1.md`.

## Outcome

CasimirBot should let a reasoning runtime pursue an environment goal without a
model round trip between every low-level action, while letting unexpected
events and new user intent interrupt execution quickly.

The portable abstraction is **environment time**: a bounded, identity-bound
sequence of observable states, admitted affordances, scheduled actions,
interruptions and checkpoints. Minecraft is the capacity reference because its
20 Hz loop exposes the strongest current timing, concurrency and safety
requirements. It does not define the shared contract.

```text
user intent or environment event
  -> Runtime Codex chooses or revises a short semantic objective
  -> Helix validates an exact finite temporal action plan
  -> the adapter compiles admitted semantic actions to native operations
  -> the resident executor advances the plan at environment cadence
  -> local safety, manual input or revocation may pre-empt immediately
  -> compact material deltas and checkpoints re-enter Runtime Codex
  -> Codex extends, replaces, cancels or completes the plan
  -> Helix applies route-product and terminal authority once
```

Codex is the conductor. Helix is the identity, admission, provenance and
terminal-policy boundary. The adapter is a deterministic compiler and sensor.
The resident executor is bounded real-time machinery, not another planner.

## Why this is not a key macro API

Keybinding macros and tool-assisted movement show that compiled input can run
more smoothly than one remote call per input. We retain precise ordering,
limited concurrency, resource ownership, tick-addressed segments and replay
analysis. We exclude arbitrary code, unbounded loops, raw host input, shell,
credentials, model calls and private strategy. Timing alone is insufficient in
a nondeterministic environment: each segment also has current-state
preconditions, completion criteria, abort guards, authority and release rules.

## Three-clock model

Every adapter projects three clocks that must not be collapsed:

1. **Environment clock** — Minecraft tick, media frame, simulation step, market
   sequence or document revision; authoritative for local ordering.
2. **Monotonic host clock** — elapsed deadlines, latency and watchdogs; a wall
   clock change cannot extend a lease or hide a stall.
3. **Audit clock** — UTC correlation and retention, never precise execution
   authority.

Each observation/effect binds a producer epoch and monotonic sequence. An epoch
change invalidates unexecuted plan material and requires a fresh authoritative
snapshot before mutation. An adapter without native ticks declares its
smallest truthful ordered unit and resolution.

## Temporal action plan

A provider-neutral `environment.temporal_action_plan.v1` envelope contains:

- plan/hash, goal/revision, environment/source/subject/epoch/authority identity;
- starting observation and affordance-frontier revisions;
- clock type/resolution, monotonic deadline and maximum horizon;
- a finite acyclic graph of action, checkpoint, branch and terminal nodes;
- semantic lanes and exclusive resources;
- earliest/latest start and maximum-duration windows;
- whitelisted preconditions, completion conditions and abort guards;
- effect ceilings, required postconditions and checkpoint policy; and
- schema, compiler, adapter and resident-executor versions.

Nodes reference semantic actions already in the adapter catalog. The adapter
compiles them to native mechanics. Changing semantic action, identity,
condition, authority, effect ceiling or postcondition changes the plan hash.
Delivery-only identifiers do not. Bounded repetition is allowed only through a
typed operation with a maximum count or deadline. Branches select pre-admitted
nodes; only Runtime Codex may author a semantically new plan.

## Receding-horizon execution

Long goals are not one long open-loop macro. Codex supplies a short rolling
window: long enough to cover ordinary model latency, short enough to remain
observable and interruptible.

- **Committed window:** admitted nodes that may execute.
- **Decision watermark:** latest safe extension point without a stall.
- **Stop watermark:** point at which the executor stabilizes and releases
  control if no valid extension arrives.

An extension binds the prior plan, latest settled checkpoint and unchanged
identity/authority. It appends only after the committed boundary. Replacement
cancels incompatible unexecuted nodes and cannot reinterpret performed effects.
At runway exhaustion, the controller performs only an admitted stabilization,
then stops. It never improvises.

## Lanes and resources

Adapters declare semantic lanes/resources rather than exposing raw device
channels as portable capabilities. Examples: locomotion, view, interaction,
main hand, off hand, inventory screen, transaction review and document
mutation. Compatible lanes may run together; conflicting resources serialize
through the accepted arbiter. Safety and cancellation outrank normal work.
Every terminal path releases resources and records unexecuted cancellations.

## Progressive affordance frontier

Instead of exhaustive environment dumps, adapters derive a compact
`environment.affordance_frontier.v1`. For each semantic capability it reports:

- `available_now`, `conditional`, `blocked` or `unknown`;
- capability/version, subject, state revision and expiry;
- required authority and held resources;
- stable reasons and missing observations;
- bounded parameters or opaque target identities; and
- optional read-only probes that can resolve an `unknown`.

The frontier says what is possible, not what is strategically best. It cannot
choose goals, grant authority or write answers. Deltas include newly available,
newly blocked, materially changed and expired affordances. Unchanged frames are
coalesced. Codex can investigate a relevant object, route, hazard or opportunity
without loading the entire world or catalog into every turn.

## Interrupt and user-feedback model

Interrupt priority is:

1. Emergency Stop, revocation and identity/epoch loss;
2. manual takeover and local hard-safety invariants;
3. explicit cancellation or finalized steering that invalidates the objective;
4. failed postconditions, critical hazards and lost affordances;
5. runway low watermark and normal checkpoints; and
6. informational changes that may be coalesced.

The first two pre-empt locally without a model call. Explicit cancellation uses
its own authority-reducing path. Finalized user steering is advisory input to
the bound task, never action authority. New action still requires a Codex plan
and Helix admission.

Interrupt evidence records detection/pre-emption clocks, affected nodes and
resources, performed effects, released controls, resulting checkpoint and the
required next decision. It is an observation, not an answer.

Measure feedback as separate spans:

- manual input -> local release;
- finalized text/voice -> bound-task availability;
- pickup -> acknowledgement;
- steering arbitration -> plan pause/cancel;
- required observation -> replacement proposal;
- proposal -> admission -> first native execution unit; and
- final observation -> synchronized text/API/voice.

Speech capture/finalization is separate from post-finalization steering.

## Environment families

| Family | Native time | Typical plan | Resident duty |
| --- | --- | --- | --- |
| Embodied real-time | ticks/frames | motion, view, interaction, checkpoints | cadence, collision/safety, release |
| Event-stream | provider sequence + deadline | observe, evaluate, simulated or separately approved effect | dedupe, gaps, deadline, kill switch |
| Transactional application | revision/state transition | read, edit, verify, commit | stale rejection, bounded retry, postcondition |
| Scientific/simulation | step + artifact revision | configure, advance, measure, checkpoint | deterministic stepping, ceilings, integrity |

Acceptance never transfers automatically between families. Portable schema is
not portable authority.

## Minecraft capacity profile

Minecraft compiles the shared plan into existing `survival_tas` and
`native_fabric_concurrent` mechanisms. Initial ranges are hypotheses to test:

- nominal cadence: 20 ticks/second;
- ordinary committed window: 10–60 ticks;
- decision watermark: measured p95 delivery latency plus stabilization reserve;
- preserve the existing 4 ms p95 adapter-computation budget;
- hard safety/manual release by the next executable client tick;
- material local transition to compact evidence target within five ticks; and
- zero duplicate effects across retry, reconnect and extension.

Test walk/view concurrency, navigation, interaction, resource contention,
chunk loading, collision, damage, target loss, screens, lag, manual input,
steering, restart and revocation. Record tick p50/p95/p99, missed deadlines,
continuous-control ratio, stalled ticks, queue depth, extension lead time,
replans, unnecessary replans, evidence bytes/tokens, coalescing ratio, effects
and release latency.

The useful capacity is not the largest queue. It is the longest horizon that
improves continuous progress without increasing stale execution, interruption
latency or evidence debt.

## Canonical lifecycle

```text
intent + checkpoint
-> Codex plan proposal
-> Helix identity/tool/effect admission
-> adapter compilation and resident execution
-> checkpoint/deviation/interrupt evidence
-> exact re-entry
-> Codex extension, repair, cancel or grounded candidate
-> route product -> terminal single writer -> text/API/voice
```

A plan receipt proves only its measured actions. It does not prove the durable
goal complete. Adapter, scheduler, frontier, monitor and steering projections
cannot author terminal prose.

## Build and acceptance ladder

1. **ET0:** clocks, schemas, hashes and adversarial fixtures.
2. **ET1:** shared validator, lifecycle ledger, idempotency and fail-closed
   epoch/authority handling.
3. **ET2:** Minecraft compatibility compiler over existing engines, with
   differential equivalence and no behavior change.
4. **ET3:** append/replace watermarks, stabilization and exact cancellation.
5. **ET4:** bounded affordance snapshot, material deltas and interest probes.
6. **ET5:** feedback/pre-emption correlation without steering execution
   authority.
7. **ET6:** Minecraft controlled and unknown-world capacity qualification.
8. **ET7:** second-adapter conformance with its own native clock and authority.
9. **ET8:** installed multi-surface acceptance with three rolling cycles,
   changed-affordance replan, local intervention, user steering, reconnect,
   zero duplicate effects, revocation and terminal presentation parity.

Every stage starts with deterministic fixtures. ET2–ET6 use the unchanged
natural prompt in the reference-Codex/keyed-Helix two-pass method. Failed runs
remain provenance.

## Non-goals

- no second model loop or adapter-authored strategy;
- no arbitrary macro/code language, raw host input or unbounded queue;
- no automatic action synthesis after a stall;
- no raw tick stream or secrets in model context;
- no implicit authority from plans, speech or harness startup;
- no receipt/frontier/scheduler terminal authority;
- no Minecraft acceptance promoted to another environment; and
- no capacity claim before measured percentile evidence.
