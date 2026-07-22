# Helix Ask Canonical Turn Lifecycle

Status: canonical runtime and authority contract.

This contract defines one event-driven lifecycle for Helix Ask turns. It keeps
Codex runtime facts separate from Helix route, evidence, goal, and terminal
authority. Snapshot objects remain compatibility projections; they are not the
source of truth when a verified lifecycle event log is present.

## Lifecycle Sequence

The normal tool-backed provider cycle is:

```txt
turn.started
-> route.proposed
-> route.committed | route.rejected
-> capability.proposed
-> capability.admitted | capability.rejected
-> tool.call.started
-> tool.call.completed | tool.call.failed | tool.call.rejected
-> observation.reentered
-> agent.message.completed
-> runtime.turn.completed | runtime.turn.failed
-> terminal.eligibility.checked
-> turn.completed | turn.failed | turn.needs_input
```

Events are append-only, ordered, current-turn scoped facts. Stored reductions
and integrity summaries are always recomputed from the events before use.

## Scope

`codex_native_provider_cycle` proves what happened inside one Codex provider
cycle. It may prove tool execution, transport-level observation re-entry, later
model reasoning, a final provider message, and provider-cycle completion. It
does not grant the final Helix answer.

`helix_ask_turn` represents the outer Helix turn. Only this scope may describe
global continuation and turn completion after route, evidence, goal, and
terminal checks have run.

Provider completion is therefore necessary runtime evidence, not global
terminal authority.

## Authority Matrix

| Question | Canonical authority | Insufficient by itself |
| --- | --- | --- |
| Was a route committed? | `route.committed` event plus Helix route contract | Classifier hint or proposed route |
| Was a capability admitted? | `capability.admitted` event from Helix policy | Tool name in user text |
| Did a tool finish? | Matching `tool.call.completed` event | Requested call or UI receipt |
| Did the observation reach Codex? | `observation.reentered` caused by the tool completion | Observation packet existing in a ledger |
| Did Codex reason after evidence? | A later `agent.message.completed` event | `solver_completed` snapshot flag |
| Did the provider cycle finish? | Ordered `runtime.turn.completed` and `turn.completed` events | Process exit or answer text |
| Is evidence admissible for the answer? | Helix evidence identity, provenance, and re-entry gates | Runtime completion |
| Is the goal satisfied? | Helix goal-satisfaction evaluation | Successful tool call |
| May text become visible? | Helix route authority and terminal single writer | Provider terminal candidate |

## Runtime Initiative And Helix Admission

Codex may choose among three distinct action surfaces. They must not be
collapsed into one boolean:

1. `capability_proposal` exposes capability IDs that Codex may propose on an
   initial decision. A proposal is not admission. Helix still validates the
   capability, arguments, permissions, source identity, route, and account
   policy before execution.
2. `next_admissible_affordances` contains concrete current-turn actions or lane
   requests already admitted by Helix. Codex must preserve their capability and
   argument identity when selecting one.
3. A bounded recovery proposal is available only after a retryable observation
   when no concrete recovery affordance exists. Helix independently admits it
   and it must preserve the failed attempt's source and goal boundaries.

The initial state may allow both `act` and `answer`: Codex decides whether a
tool materially advances the goal. After an attempt, the generic proposal
surface closes. Continued action then requires a concrete affordance or the
bounded recovery rule. This preserves runtime initiative without allowing an
open-ended adapter-owned tool loop.

## Runtime Boundary Adoption

A verified lifecycle may replace stale legacy projections only for factual
runtime questions. Runtime-boundary adoption requires all of the following:

1. The event log passes recomputed integrity checks for the current turn.
2. The route has a committed identifier.
3. The called capability appears in the admitted capability set.
4. The call completed successfully and its response re-entered Codex.
5. At least one exact observation reference resolves to a current-turn ledger
   artifact whose evidence kind matches the called capability.
6. A later agent message and runtime completion are recorded in order.

These facts may repair stale mirrors such as `solver_completed: false` or a
legacy solver-continuation observation. They may not bypass:

- an active `agent_continuation_state` requiring `act`, `retry`, or user input;
- source identity, provenance, or evidence-selection failures;
- a capability-to-observation mismatch;
- incomplete compound subgoals;
- goal satisfaction;
- route-product restrictions;
- terminal eligibility or single-writer selection.

## Integrity Invariants

The verifier rejects a lifecycle when:

- event sequence numbers or turn IDs are invalid;
- event IDs are duplicated;
- a declared causation event is absent or does not precede its effect;
- an observation re-enters without a settled tool call;
- a tool starts without a prior `capability.admitted` event;
- a tool settles without a prior start, changes capability identity, or settles
  more than once;
- a successful completion has no observation reference;
- completion and re-entry observation-reference sets differ;
- a completed tool result never re-enters before completion;
- the final agent message precedes the latest re-entry;
- runtime completion does not follow the final agent message;
- outer turn completion does not follow runtime completion;
- terminal events conflict or occur more than once.

Failed, blocked, and rejected calls may be observed by Codex for recovery, but
only successful completed calls with matching current-turn evidence can satisfy
the selected-capability observation gate.

## Compatibility Projections

Legacy fields remain readable while callers migrate, including
`agent_runtime_loop`, `agent_step_decision`, `provider_reasoning_reentry`,
`provider_terminal_authority_bridge`, and `solver_continuation_observation`.
They are projections of lifecycle or policy state. When a verified event log
contradicts one of their factual runtime booleans, the event log wins for that
boolean and the debug export records the projection mismatch.

Policy projections do not lose authority. Route contracts, evidence gates,
goal satisfaction, active continuation state, and terminal single-writer output
remain Helix-owned.

Receipt and observation language is also exact:

- `receipts_reentered` and `observation_reentry_refs` mean that a verified
  transport-level `observation.reentered` event exists for those exact refs.
- Selected evidence or a ledger entry does not prove runtime re-entry.
- A route-approved self-terminal control receipt may be terminal without a
  second model pass. It is listed separately as `self_terminal_receipt_refs`;
  it must never be relabeled as runtime re-entry.
- When no verified lifecycle exists, compatibility projections may be exposed
  for diagnostics, but must identify their authority as
  `compatibility_projection` rather than runtime fact.

## Debug Contract

Every applicable Ask debug export exposes:

- `turn_lifecycle` with scope, events, recomputed reduction, and integrity;
- `turn_lifecycle_projection_audit` for contradictory legacy mirrors;
- `ask_turn_solver_trace.runtime_lifecycle_facts` for the facts used by gates;
- `terminal_boundary_eligibility.runtime_lifecycle` for exact supported
  capability and observation references;
- the independent route, evidence, goal, continuation, and terminal decisions.

This makes a failure attributable to one lifecycle stage instead of a generic
adapter failure.

## Verification

Deterministic verification must cover:

- ordered success, failure, blocked, and needs-input lifecycles;
- missing or reordered events;
- stale legacy completion and continuation mirrors;
- active continuation that must remain blocking;
- capability and observation mismatch;
- route and terminal denial despite provider completion;
- stream and non-stream terminal parity.

Keyed-server acceptance then uses natural user prompts across the workstation
workflow. Each run must retain prompt, final answer or typed failure, lifecycle
events, selected evidence references, terminal decision, and debug export.
