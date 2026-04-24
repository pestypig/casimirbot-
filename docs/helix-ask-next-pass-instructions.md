# Helix Ask Next Patch Instructions (E8 Roadmap, Codex-Cited)

Last updated: 2026-04-24

## Objective
Patch Helix Ask so each turn behaves like codex-style agent loops: explicit plan artifact first, deterministic execution lifecycle, typed pending-input roundtrip, and one valid terminal outcome.

## Codex Clone Claims (Cited)
Use these as implementation contracts:

1. Plan is first-class and streamed before turn completion.
- Plan deltas and plan items are asserted in tests:
  - `item/plan/delta`, `item/completed`, `turn/completed`
  - [`external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs:196`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs:196)
  - [`external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs:203`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs:203)
  - [`external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs:210`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs:210)

2. `request_user_input` is a formal server request/resolve protocol.
- Turn emits `ToolRequestUserInput`, then `serverRequest/resolved`, then `turn/completed`.
  - [`external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:83`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:83)
  - [`external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:109`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:109)
  - [`external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:120`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:120)

3. Turn-transition failures are typed, not ad-hoc strings.
- `reason = "turnTransition"` detection contract:
  - [`external/openai-codex/codex-rs/app-server/src/server_request_error.rs:3`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/src/server_request_error.rs:3)
  - [`external/openai-codex/codex-rs/app-server/src/server_request_error.rs:5`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/src/server_request_error.rs:5)

4. Lifecycle is deterministic: started/completed notifications + turn closure.
- Turn start/complete and pending-request abort behavior:
  - [`external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:274`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:274)
  - [`external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:298`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:298)
  - [`external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:552`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:552)
  - [`external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:983`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:983)
  - [`external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:1956`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:1956)

## Roadmap
1. **E8.1 Planner-before-route (critical)**
- Move planner contract generation to turn intake in `/api/agi/ask/turn`.
- Freeze `dispatch_policy` at turn start.
- Route execution from planner policy, not regex heuristics.
- Keep deterministic fallback if planner fails.

2. **E8.2 Capability-grounded planner**
- Planner must choose only valid actions from panel capabilities.
- Add action candidates from `panelCapabilities` as planner input.
- For navigation (`go to docs`), planner maps to canonical workspace action.

3. **E8.3 Multi-step plan execution**
- Support ordered plan items (`workspace -> reasoning`, `workspace -> workspace`).
- Enforce item lifecycle events (`started/completed/failed/suppressed`) per step.

4. **E8.4 First-class `request_user_input` protocol**
- Pending requests become typed server artifacts with `request_id`, `turn_id`, `required_fields`.
- Next turn resolves pending first; no new plan until resolved/canceled.

5. **E8.5 Strong turn terminal contract**
- Exactly one terminal event per turn.
- Success requires non-empty assistant text.
- Empty/invalid model output auto-converts to typed failure or deterministic fallback text.

6. **E8.6 Cross-lane unification**
- Manual/voice/external/submit all use same `/ask/turn` state machine.
- Same input => same planner policy => same terminal behavior.

7. **E8.7 Evidence-gated reasoning finalization**
- For verify/compare/synthesis, require evidence refs before final answer.
- If evidence missing: emit `needs_retrieval` plan item, not confident prose.

8. **E8.8 Observability + CI invariants**
- Runtime assertions:
  - no execute before plan
  - no item completed without item started
  - exactly one terminal per turn
  - no unresolved pending request at completion
- CI fixtures for known failures (`go to docs`, destructive confirm roundtrip, hello fast-path).

## Suggested Rollout Order
1. E8.1 planner-before-route + policy freeze
2. E8.2 capability-grounded dispatch
3. E8.4 request_user_input protocol hardening
4. E8.3 multi-step execution
5. E8.5 terminal guarantees hard enforcement
6. E8.6 lane parity
7. E8.7 evidence gates
8. E8.8 invariant gates in CI

## Next Patch Scope (Immediate)
Implement E8.3 completion semantics in `/api/agi/ask/turn`:

1. Execute full `plan_items` order for hybrid turns, not first-step-only behavior.
- Current gap is from single-step suppression in execution trace logic:
  - [`server/routes/agi.plan.ts:21151`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/routes/agi.plan.ts:21151)
  - [`server/routes/agi.plan.ts:21169`](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/routes/agi.plan.ts:21169)

2. Keep workspace-first for `dispatch:act`, then execute reasoning step when planned.
- Final response must be the reasoning terminal output when reasoning step is present.

3. Emit step lifecycle transitions deterministically (`planned -> started -> completed` or `failed/suppressed`) per step.

4. Preserve one-terminal contract for the whole turn.
- No intermediate pseudo-terminal for workspace step if reasoning step remains.

## Acceptance Criteria For Immediate Patch
1. `compare this doc with my notes and tell me differences` produces:
- `plan_items`: workspace then reasoning
- lifecycle events for both steps
- final terminal answer from reasoning step (non-empty)

2. `open docs and then explain key claim` follows same two-step completion.

3. Existing fast workspace prompts (`open notes`, `go to docs`) remain single-step workspace terminals.

4. No regression in pending-input confirm/clarify flows.
