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

## Codex Reference Parity

The ignored local Codex reference checkout provides the behavioral oracle for
the provider-owned portion of this lifecycle. In
`external/openai-codex-compare/codex-rs/core/src/session/turn.rs`, a requested
function call is executed and its output is recorded for the next sampling
request. The turn continues while the sampling result requires follow-up and
is considered complete only when the model returns an assistant message with
no remaining tool request. `tasks/regular.rs` then reports that last agent
message as the turn result.

Helix parity therefore requires all of the following:

1. A tool result, including a rejected or failed result, is an observation for
   Codex; it is not an adapter-authored answer.
2. A recoverable admission, evidence, or quality rejection re-enters Codex as
   a typed observation while continuation budget remains.
3. Helix may fail closed immediately only for an unrecoverable permission,
   identity, provenance, or evidence-integrity boundary, and the terminal
   typed failure must retain the exact gate and stable reason codes.
4. A deterministic rail may validate, admit, normalize, and select terminal
   eligibility. It may not add an unrequested goal, reinterpret a successful
   observation as non-execution, or compose competing prose after Codex has
   authored an authorized candidate.
5. Provider candidate text and current-turn support refs are immutable across
   route-product materialization, the terminal single writer, and presentation.

This is semantic parity, not a second implementation of Codex's sampler,
approval system, tool runtime, retry loop, compaction, or terminal machinery.

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

An explicit operator bound such as “run exactly one command and do not use any
other tool” is materialized before semantic itinerary expansion. Its exclusive
capability allowlist and requested cardinality constrain extraction, admission,
provider continuation, execution, and the differential audit. Structure-aware
helpers remain available for ordinary semantic requests, but cannot be added
behind an exact operator boundary.

A request to retrieve, cite, quote, explain, or return command text or syntax
has `execution_intent=none`. An action-shaped token inside that documentation
request, such as “give the exact command form,” is not permission to materialize
the game's `give` action or any other mutating capability. Prompt interpretation
must preserve this distinction through compound planning and tool admission.

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

## Differential Lifecycle Audit

Factual runtime completion is necessary but does not by itself prove that the
same Codex result reached the user. For every applicable provider turn, the
diagnostic differential audit follows one identity-preserving chain:

```txt
prompt
-> admitted capability executions
-> normalized observation refs
-> verified observation re-entry
-> Codex final message hash
-> authorized provider candidate ref/hash/support refs
-> route-product materialization ref/hash/support refs
-> terminal single-writer ref/hash/support refs
-> visible final hash
```

The audit reports the first divergent stage as `evidence_reentry`,
`followup_reasoning`, `terminal_materialization`, `terminal_authority`, or
`presentation`. It does not export raw model text, reconstruct reasoning, or
grant terminal authority. Text continuity uses SHA-256 values; evidence
continuity uses current-turn artifact refs. This makes a narrow downstream
substitution observable without creating another answer-writing agent.

### First-divergence diagnostic method

Use the same method for a synthetic regression, a keyed API turn, and a UI
turn. Do not start from the visible failure text and guess backward.

1. Capture the immutable current-turn lifecycle and verify its sequence,
   causation, route, admitted capability, settled call, and exact observation
   re-entry refs. Treat mutable summary booleans only as projections.
2. Record the post-observation Codex message hash, provider candidate ref, and
   support refs. Never place raw credentials or hidden reasoning in the audit.
3. At route-product materialization, terminal single-writer selection, and
   presentation, compare the candidate ref, text hash, and support refs with
   the immediately preceding stage.
4. Stop at the first mismatch. Later failures are consequences and must not be
   reported as independent model failures.
5. Classify the mismatch as either an adapter projection contradiction or an
   explicit hard boundary. The debug record must name the gate and stable
   reason codes that made the distinction.
6. For a recoverable contradiction, append a typed rejection observation and
   return control to Codex while continuation budget remains. For an
   unrecoverable identity, permission, provenance, freshness, integrity,
   scientific-quality, or route denial, fail closed without composing a
   substitute answer.
7. Reproduce the first divergence with a focused synthetic fixture, then rerun
   the original natural prompt through the real keyed route. A repair is not
   accepted when only the synthetic projection passes.

A typed rejection observation must identify `failure_class`, `gate`, stable
`reason_codes`, `recoverable`, `retryability`, `terminal_eligible`, and the
relevant current-turn evidence refs. This gives Codex enough structured state
to retry or explain the block without allowing deterministic adapter prose to
become a competing answer.

Observation transport and evidentiary success are separate invariants. A
blocked or failed tool call may still produce a typed observation that is
normalized and re-entered into the next Codex step. In that case
`provider_reasoning_reentry.observation_reentered=true` and the canonical
lifecycle records `observation.reentered` for the exact settled refs, while
`evidence_reentered` may remain false because the observation cannot support a
success claim. No projection may turn “blocked observation re-entered” into
“no observation was executed,” and no terminal rail may turn transport
re-entry into proof that the requested world action succeeded.

The differential audit therefore treats re-entry as an identity-preserving
cross-projection invariant, not a vote among booleans. For every exact
observation ref it compares:

1. the settled gateway observation packet;
2. the capability-lane `lane_reentered` event;
3. `provider_reasoning_reentry.reentered_observation_refs`;
4. the canonical `observation.reentered` lifecycle event; and
5. the terminal writer's selected support refs when an answer is authorized.

A lane event that records re-entry while the provider bridge and canonical
lifecycle both omit it is still a contradiction even though those two stale
projections agree with each other. The audit reports
`capability_lane_reentry_disagrees_with_provider` and/or
`capability_lane_reentry_disagrees_with_runtime` at the first
`evidence_reentry` divergence. This diagnostic never upgrades the observation
to successful evidence and never grants terminal authority.

Scientific-evidence gates have the same boundary. They preserve measured
values, units, uncertainty, provenance, and claim-support refs, but they do not
author explanatory prose. An evidence-quality shortfall that can be repaired
by an admitted calculation, retrieval, measurement, or clarification is a
recoverable rejection observation for Codex. Only evidence-integrity or
provenance violations, or an exhausted bounded repair path, may terminalize
directly with the exact scientific gate and reason codes.

The lifecycle differential reports the first case as
`scientific_evidence_disposition=repair_pending`, not `failed_closed`. Its
terminal rejection observation carries `gate`, `reason_codes`, and
`evidence_refs` into the next Codex sampling step. `failed_closed` is reserved
for a non-retryable hard boundary or a bounded repair path whose hard budget is
actually exhausted.

Two dispositions must remain distinct:

- `adapter_projection_contradiction` means a later rail changed, dropped, or
  replaced an otherwise authorized runtime result. This is an implementation
  defect and must not be explained as model failure.
- `hard_evidence_boundary` or `hard_policy_boundary` means Helix rejected the
  candidate under an explicit provenance, scientific-quality, permission, or
  route-product contract. A typed failure with the gate's stable reason codes
  is a successful fail-closed outcome, not a lifecycle contradiction.

An evidence gate may constrain what Codex can claim, but it must not silently
compose a competing answer. If a rejection is retryable and continuation
budget remains, the typed rejection observation must re-enter Codex so the
runtime can revise, gather more evidence, or return an actionable bounded
failure. Terminalizing a recoverable rejection before that re-entry is itself
an audit mismatch.

Attempt history and current blockers are separate projections. A failed
`read`, `observe`, or `verify` attempt with
`current_turn_reentry_ineligible` remains in the immutable provenance record,
but it no longer blocks terminal authority when a strictly later attempt of
the same capability produces a successful current-turn observation. The later
observation must still normalize, re-enter provider reasoning, and support the
provider candidate. This exception never applies to `act` attempts, a
different capability, reverse/stale ordering, or a failure with no later
successful observation. In those cases Helix remains fail closed.

Supersession changes only which attempts are effective blockers. It does not
delete the failed attempt, fabricate success, select answer text, or permit a
deterministic rail to replace Codex's post-observation answer.

A `record_only` admission can have different policy meanings and is not by
itself proof that execution is forbidden. The bounded terminal-failure reason
`source_or_capability_terminal_failure_requires_runtime_loop_record` is the
strict case: it may retain lifecycle and debug evidence but must not issue a
tool call, synthesize a tool observation, retry, or change the settled failure.
The differential audit reports
`record_only_admission_executed_runtime_steps` at `tool_execution` if a
`runtime_tool_call` or `runtime_tool_observation` appears under that reason.
Other record-only reasons retain their existing Codex-owned procedural
behavior and are judged by their own route and continuation contracts.

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
- `turn_lifecycle_differential_audit` and the same audit nested under
  `terminal_authority_single_writer.integrity.lifecycle_differential_audit`
  for end-to-end candidate, evidence, writer, and visible-output continuity;
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
- authorized candidate loss, text substitution, and support-ref loss at each
  downstream stage;
- scientific/evidence-quality failures that fail closed with their exact
  reason codes, plus adversarial attempts to bypass those gates;
- recoverable terminal rejection re-entry while budget remains;
- stream and non-stream terminal parity.

Keyed-server acceptance then uses natural user prompts across the workstation
workflow. Each run must retain prompt, final answer or typed failure, lifecycle
events, selected evidence references, terminal decision, and debug export.
