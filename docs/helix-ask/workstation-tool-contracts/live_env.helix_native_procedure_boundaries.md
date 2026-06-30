# live_env Helix-Native Procedure Boundaries

Maturity: `draft`

Owner surface: Helix Native live environment

Provider status: Helix-owned or blocked, not shared provider gateway

## Purpose

Define the provider-agent boundary for Helix Native procedure tools that are not
shared with Codex Workstation Mode. These tools can draft, route, apply,
configure, process, project, replay, or record live environment state. They must
stay Helix-owned until a tool-specific provider contract proves permission,
receipt, re-entry, and terminal authority.

## Owner

Helix Native owns these procedures and their state transitions. Codex
Workstation Mode and future provider runtimes must not execute these capability
ids through the shared workstation gateway unless a dedicated manifest entry and
contract are added.

## Inputs

Provider-mode prompts must fail closed for these capability ids. The following
prompt shapes must not execute them:

- quoted tool names
- UI labels or screen-visible names
- documentation or historical references
- negated instructions
- future or conditional plans
- broad requests that only imply a nearby procedure

Graduation requires explicit affirmative operator command admission and bounded
capability-owned arguments.

## Observation

If a specific procedure graduates later, it must return a structured observation
or receipt with:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

The observation must identify the requested procedure, resolved args, source or
target state, permission decision, blocked/no-op reason when applicable, and
safe host projection refs.

## Host Projection

Host projection is blocked for provider agents until a route/product contract
explicitly permits it. Procedure outputs such as mail processing, prompt routing,
profile configuration, visual replay, narrative projection, immersion updates,
voice steering, and stream binding must come from structured receipts, not
provider final prose.

## Visible Trace

If graduated later, the latest-turn stream must show:

```txt
runtime selected
procedure request
permission or confirmation decision
procedure observation or blocked/no-op receipt
model re-entry
final answer
```

Debug export and visible UI must agree for the same turn id. A procedure receipt
is not a final answer.

## Tests

Helix-owned procedure tools:

```txt
live_env.process_live_source_mail
live_env.draft_stage_play_graph
live_env.request_stage_play_checkpoint
live_env.draft_micro_reasoner_preset
live_env.route_micro_reasoner_prompt
live_env.apply_micro_reasoner_preset
live_env.create_micro_reasoner_preset
live_env.update_micro_reasoner_prompt
live_env.configure_visual_observer_profile
live_env.apply_visual_observer_profile
live_env.request_visual_action_replay
live_env.project_live_source_narrative
live_env.update_live_source_immersion_state
live_env.record_live_source_mail_decision
```

Voice stream or steering procedures:

```txt
live_env.record_voice_steering
live_env.narrator_bind_stream
narrator.say
narrator_say
narrator.bind_stream
narrator_bind_stream
```

Current behavior:

```txt
codex_workstation=false
future_provider=false
gateway_manifest=absent
```

Expected classifications:

- `live_env.record_voice_steering` and `narrator.say`: `requires_confirmation_contract`
- narrator stream binding ids: `blocked_pending_contract`
- Helix-owned procedure tools: `helix_native_only`

Required before provider graduation:

- positive affirmative admission for the exact procedure
- quoted/negated/historical/future/screen-visible negative tests
- structured observation or receipt test
- blocked/no-op receipt behavior
- terminal authority test proving procedure receipt is not final answer
- latest-turn/debug-export trace parity
- no final-prose scraping for host projection

Implementation anchors:

- Classification:
  `server/services/helix-ask/provider-agent-capability-contract.ts`
- Live environment adapter:
  `server/services/helix-ask/live-environment-tool-adapter.ts`
- Explicit contracts:
  `server/services/helix-ask/explicit-capability-contract.ts`
- Provider capability tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts`

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/explicit-workstation-gateway.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```
