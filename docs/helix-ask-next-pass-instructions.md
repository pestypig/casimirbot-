# Helix Ask Next Pass Instructions (Codex-Aligned)

Last updated: 2026-04-23  
Status baseline: Pass A and Pass B landed; next execution step is E3 terminal guarantee hardening.

## Purpose
This is the implementation handoff for the next patch pass. It keeps Helix Ask decisions anchored to codex-clone patterns that are already proven in production-style agent loops.

## Codex Clone Methods To Reuse
Use these as behavioral references, not just inspiration:

1. Plan as first-class stream item (before execution):
- `external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs`

2. Request-user-input as formal roundtrip with explicit resolve:
- `external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs`

3. Typed transition and server request error semantics:
- `external/openai-codex/codex-rs/app-server/src/server_request_error.rs`

4. Deterministic lifecycle notifications and turn closure:
- `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs`

## Immediate Next Step: E3 Terminal Guarantee
Implement a hard terminal contract so every turn ends in exactly one typed terminal outcome and never "success with empty answer."

### Scope
Primary file:
- `client/src/components/helix/HelixAskPill.tsx`

Tests:
- `client/src/components/__tests__/helix-ask-pill-ui.spec.tsx`

## Required Behavior Changes
1. Exactly one terminal event per turn:
- Permit only one of:
  - `final_answer`
  - `final_failure` (typed fail id)
- Reject duplicate terminal emission in the same turn.

2. Empty success is invalid:
- Any terminal finalize path with empty/whitespace answer must emit failure:
  - `router_fail_id = RF_EMPTY_TERMINAL`
  - `router_outcome = failed`
- Do not emit "done" with empty text.

3. Pending request blocking invariant:
- If unresolved pending request exists for the same `turn_id`, block terminalization and emit:
  - `router_fail_id = RF_PENDING_REQUEST_NOT_RESOLVED`
  - deterministic suppression event

4. Turn-transition invariant:
- If turn superseded and pending request belongs to previous turn, emit transition cancellation and prevent stale finalize.

5. Planner-before-execute invariant for reasoning turns:
- For reasoning-required turns, assert a plan artifact was emitted before execution/finalization.

## Feature Flags (Rollout Safety)
Keep behavior behind flags for staged rollout and bisect:

1. `HELIX_E1_SINGLE_TURN_CONTRACT`
2. `HELIX_E2_TRANSITION_ERRORS`
3. `HELIX_E3_TERMINAL_GUARANTEE`

Execution rule:
- If E3 flag is off, preserve legacy behavior.
- If E3 flag is on, enforce hard terminal guarantees.

## Acceptance Criteria (Must Pass)
1. No "No final answer returned" with success status in timeline.
2. No duplicate terminal events for same turn id.
3. No terminal event when same-turn pending request remains unresolved.
4. Empty terminal attempts are converted to `RF_EMPTY_TERMINAL`.
5. Same prompt across manual/voice/external/submit yields identical dispatch policy and terminal type.

## Test Matrix To Add/Update
1. Terminal uniqueness:
- one turn -> one terminal notification only.

2. Empty terminal rejection:
- simulated empty reasoning final -> failure with `RF_EMPTY_TERMINAL`.

3. Pending unresolved block:
- unresolved request + finalize attempt -> suppressed finalize + fail id.

4. Turn supersession:
- pending request on old turn + new turn starts -> old pending is canceled and cannot finalize.

5. Cross-lane parity:
- run same intent through manual/voice/external/submit and assert same contract outcome.

## Telemetry Fields Required On Every Terminal
1. `turn_id`
2. `router_state`
3. `router_outcome`
4. `router_fail_id` (nullable only on successful final_answer)
5. `pending_server_requests`
6. `dispatch_policy`

## Why This Matches Codex Methodology
Codex clone keeps turn state explicit and typed:
- structured lifecycle notifications,
- explicit request resolution before turn completion,
- typed errors for transition/failure.

E3 is the Helix equivalent of that same reliability contract: deterministic close semantics with no ambiguous "completed but empty" state.

