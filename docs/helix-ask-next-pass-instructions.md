# Helix Ask Next Patch Instructions (E8 Roadmap, Codex-Cited)

Last updated: 2026-06-03

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

## Next Patch Scope (Immediate): Exact Source-Target Contracts

Implement the shared-loop exact source-target contract across the next Helix Ask
tool family instead of adding another route-specific terminal shortcut.

### Classification

Classify this patch as:

- `evidence normalization`
- `evidence re-entry`
- `terminal authority`

If the implementation touches route admission or tool admission while wiring the
contract, also classify those changes separately in the patch notes.

### Objective

For prompts that name an exact source, Helix Ask must prove that source identity
before any synthesis can become visible. A route, retrieval hit, panel receipt,
or classifier result may propose where to look, but the completed solver path is
the only answer authority.

Use this rule of thumb as the implementation guardrail:

```txt
Routes are proposed procedures.
Classifiers are hypotheses.
Receipts are observations.
Only the completed solver path can answer.
```

### Required Contract Fields

Add or standardize an exact-source contract that is linked from
`source_target_intent` and consumed by the observation, coverage, draft, and
terminal authority records:

```txt
source_target_exact_contract
requested_source_kind
requested_source_identity
requested_path
requested_heading
requested_line_range
requested_symbol
requested_note_id
requested_note_title
requested_panel_id
requested_live_source_id
extraction_status
evidence_refs
evidence_hash
required_terms
required_claims
unsupported_terms
unsupported_claims
terminal_allowed
```

The implementation may omit fields that do not apply to the selected source
kind, but every contract must expose the requested identity, extraction status,
evidence refs, evidence hash or stable artifact id, and terminal eligibility.

### Loop Requirements

1. Build the exact-source contract before synthesis.
- Retrieval can rank candidates, but an exact path, heading, symbol, note id,
  or live-source id must be verified deterministically before terminal text is
  allowed.

2. Normalize the exact evidence into `agent_step_observation_packet`.
- Set `assistant_answer=false` and `terminal_eligible=false`.
- Include source identity, status, artifact refs, missing requirements,
  unsupported claims, and suggested next step.

3. Run `goal_satisfaction_evaluation` after the observation.
- A successful lookup is not the same thing as a satisfied user goal.
- Missing, ambiguous, unsupported, or weak-only evidence must produce repair,
  `request_user_input`, or typed failure.

4. Produce `final_answer_draft` only after evidence re-entry.
- Deterministic synthesizers may draft from accepted exact-source evidence when
  the route product contract allows that artifact kind.
- Receipts, live-card projections, route products, and panel-generated text
  remain observations unless the route contract explicitly permits a receipt
  terminal.

5. Let `terminal_answer_authority` and
   `terminal_authority_single_writer` select one visible artifact.
- A stale typed failure, stale continuation, receipt, or panel projection can
  be superseded only by a later terminal candidate that satisfies the exact
  contract and passes the coverage gate.

### Coverage Gate

Add a semantic coverage gate for exact-source terminal drafts:

- requested source identity is preserved
- evidence refs and evidence hash or stable artifact id are present
- requested terms or claims are covered
- invented terms, unsupported claims, and neighboring-source substitutions are
  rejected
- route product contract allows the terminal artifact kind
- terminal presentation is written from the selected artifact only

### First Tool Families

Use repo/docs path-and-heading evidence as the pilot pattern, then extend the
same contract shape to one of these families in the next patch:

- Docs Viewer active document summaries and exact-section questions
- Notes title/id/pronoun resolution before note reading or note updates
- Locate-to-note composition, where locate results become note evidence only
  after contract validation
- Live-source identity prompts that name a specific source id or panel source

Do not mix this patch with broad live-source routing cleanup. If live-source
continuation behavior is touched, run and report the full live-source parity
suite separately.

### Tests

Add focused tests for the selected family:

- positive exact source answer with required terms covered
- weak retrieval candidate rejected until exact identity is verified
- missing exact source emits typed failure or `request_user_input`
- ambiguous source emits typed failure or `request_user_input`
- invented required term or unsupported claim is rejected by coverage
- stale continuation or typed failure is superseded only by a valid exact-source
  terminal artifact
- contextual, negated, future/conditional, historical, quoted/screen-visible,
  and mixed-intent prompts do not admit mutating tools from lexical cues

### Validation

During the edit loop:

```bash
npm run helix:ask:discipline:quick
```

Before handoff, run the applicable focused tests plus:

```bash
npm run helix:ask:discipline
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
```

If the user has started the keyed server, probe `/api/agi/ask/turn` and
`/api/agi/ask/turn/{turnId}/debug-export` to confirm the payload exposes the
contract, observation, coverage gate, final draft, terminal authority selection,
and rejected stale candidates.

For every code or config patch, finish with the Casimir adapter gate and report
the verdict, first fail if any, certificate hash, and integrity status.

### Non-Goals

- Do not implement a private model sampling loop.
- Do not implement a private generic tool runtime.
- Do not add broad retry, approval, sandbox, compaction, subagent, or terminal
  completion machinery owned by Codex.
- Do not allow route classifiers, receipts, live cards, process graphs, or
  client projections to write visible answer fields before terminal authority.
- Do not use lexical shortcut rules without adversarial cue tests.

## Deferred E8.3 Patch Scope

Implement E8.3 completion semantics in `/api/agi/ask/turn` after the exact
source-target contract is established:

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
