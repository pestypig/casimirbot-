# Helix Ask Agent Action Policy (D18)

This document defines the minimal controller mapping from gate outcomes to the next
best action in the Helix Ask agent loop. The policy is intentionally conservative:
no repo-attributed claim is emitted without proof pointers.

## Action selection (gate outcome -> next action)

| Gate outcome / signal | Next action | Notes |
| --- | --- | --- |
| Missing slot evidence (slot/doc coverage failed) | expand_heading_aliases | Seed slots from doc headings; improves lexical overlap. |
| Missing slot evidence persists | slot_local_retry | Retry retrieval with slot-local hints and must-include files. |
| Missing slot evidence persists + repo expected | retrieve_code_first | Switch allowlist to code surfaces for symbol-heavy slots. |
| Multi-slot prompt detected | switch_report_mode | Decompose into per-slot blocks with global intent header. |
| Ambiguity high (no dominant cluster) | ask_slot_clarify | Ask a slot-local clarification with proof targets. |
| Evidence sufficient + coverage ok | render_scientific_micro_report | Render grounded summary + grounded-only connections. |
| Budget exhausted or max steps | render_scientific_micro_report | Stop loop; return best grounded scaffold + next evidence. |

## Stop conditions

Stop the loop when any condition is met:
- proof_density_sufficient
- only_missing_slots_need_user
- budget_exhausted
- max_steps
- action_budget_exhausted

## Per-action budgets

- Each action has a soft time budget (HELIX_ASK_AGENT_ACTION_BUDGET_MS).
- The agent loop also has a global budget (HELIX_ASK_AGENT_LOOP_BUDGET_MS).
- Budget overruns are recorded in debug payloads and can trigger early stop.

## Required output contract

When evidence is partial or missing, responses must still be scientific:
- Confirmed (grounded claims only)
- Reasoned connections (grounded-only)
- Hypotheses (only if enabled)
- Next evidence (concrete file/section/symbol targets)

## Voice and mission-callout contract (Dot mode)

Voice output is an action channel, not a style channel. Any voice layer that
uses Helix Ask state must follow these rules:

- Certainty parity: voice certainty must never exceed text certainty.
- Evidence parity: voice claims attributed to repo/system state require the same
  proof posture as text claims.
- Salience-first: call out only meaningful state transitions, failures, or
  operator-required actions.
- Deterministic fail language: emit stable failure labels when available
  (for replay and operator trust).

### Callout classes
- `progress`: stage transition updates (low frequency).
- `risk`: warnings and degraded states (always eligible to speak).
- `action`: explicit next action required from operator.
- `debrief`: short run summary after completion or abort.

### Always-call conditions
- circuit breaker entered
- fallback mode entered
- verification/arbiter fail with typed reason
- missing evidence for high-stakes claim
- timeout or cancellation with unresolved critical objectives

### Suppress conditions
- duplicate event text within cooldown window
- low-information updates without state change
- repeated progress updates in the same stage unless severity increased

### Policy note
When voice is unavailable, the same callout payload must be renderable as text
without changing policy semantics.


## Context sensing and no-covert policy rails (Wave-3A)

- Tier 1 sensing/capture is strictly opt-in and user-started per session.
- Tier 1 requires an always-visible active-state indicator and explicit stop control.
- No hidden, background, or implicit auto-capture flows are permitted.
- Voice callouts may consume context events only while session state is `active`.
- If session state is `idle|requesting|stopping|error`, non-critical context callouts are suppressed.


## Evolution governance compatibility (v1, additive)

For governance wave endpoints under `/api/evolution`:
- Do not modify existing Helix Ask action policy behavior; governance is report-first and additive.
- When policy or contract surfaces are touched, emit deterministic hard-fail taxonomy IDs in envelopes.
- Preserve evidence-first posture: governance outputs must include deterministic artifact refs and replay-safe fail reasons.
- Casimir remains mandatory baseline; governance outcomes may not override Casimir FAIL.
