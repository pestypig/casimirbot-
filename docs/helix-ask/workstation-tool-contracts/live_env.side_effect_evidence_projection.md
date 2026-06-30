# live_env Side-Effect Evidence and Projection Tools

Maturity: `draft`

Owner surface: Helix Native live environment

Provider status: held back from Codex/provider gateway

## Purpose

Define the provider-agent boundary for Helix Native tools that produce evidence
or projection receipts while also writing workstation state. This contract keeps
them visible to future tool/panel work without accidentally treating them as
Codex/provider gateway reads.

## Owner

Helix Native owns admission, permission, execution, and receipt semantics for
these tools until a provider gateway contract is explicitly added. Codex
Workstation Mode and future provider runtimes must treat them as unavailable
gateway capabilities.

## Capability IDs

```txt
live_env.read_card
live_env.reflect_stage_play_context
live_env.request_probe
live_env.record_commentary
live_env.evaluate_goal_satisfaction
```

## Inputs

Inputs must be explicit affirmative operator commands when these tools are
eventually graduated. Tool names in quoted text, UI labels, documentation,
negated instructions, historical references, or future plans must remain
blocked.

These capabilities are not passive reads even when their names sound like
inspection or evaluation. Their current adapters can write receipts, interpreted
events, goal-context updates, checkpoints, or Live Answer projection state.

Provider agents must not receive these as shared gateway tools until each one
has an explicit side-effect receipt contract.

## Observation

Current Helix Native observations are evidence-only. They must preserve:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

Current adapter effects:

| Capability | Current side effect |
| --- | --- |
| `live_env.read_card` | Reads Live Answer projection lines and can record a goal-context update plus panel dispatch suggestions. |
| `live_env.reflect_stage_play_context` | Builds Stage Play reflection evidence and can ensure a Live Answer environment and project Live Interpretation lane updates. |
| `live_env.request_probe` | Appends an interpreted event that requests bounded live evidence. |
| `live_env.record_commentary` | Records live-environment commentary. |
| `live_env.evaluate_goal_satisfaction` | Records a goal-context update and can checkpoint an agent goal session. |

## Host Projection

Host projection is blocked for provider agents until a route/product contract
explicitly permits it. Helix Native may still use its existing panel dispatch
and Live Answer projection behavior.

Provider graduation must define:

- host projection metadata, if any
- no-op or blocked receipt behavior for missing permission/state
- projection rows that come from structured receipts, not final prose

## Visible Trace

If graduated later, the latest-turn trace must show:

```txt
runtime selected
tool request
permission or confirmation result
tool receipt or observation
model re-entry
final answer
```

The visible trace and debug export must agree for the same turn id.

## Tests

Before any of these capabilities can be shared with Codex Workstation Mode or a
future provider runtime, the patch must define:

- explicit affirmative command admission
- confirmation or permission policy for the side effect
- structured write receipt or observation packet
- model re-entry after the receipt
- terminal authority rule proving the receipt is not the final answer
- host projection metadata, if any
- no-op or blocked receipt behavior for missing permission/state
- negative quoted, negated, historical, future, and screen-visible prompt tests
- latest-turn and debug-export trace rows for request, receipt, re-entry, and
  final answer

## Authority Rules

- Receipts are observations, not final answers.
- UI/debug rows do not promote these receipts to answer authority.
- Provider final prose must not be parsed to infer these actions.
- Tool names in quoted text, UI labels, documentation, or negated instructions
  must not execute these capabilities.
- A route/product contract must explicitly allow any host projection.

## Expected Held-Back Behavior

Provider gateway listing:

```txt
absent
```

Provider classification:

```txt
availability=requires_confirmation_contract
permission_class=user_confirmed_side_effect
codex_workstation=false
future_provider=false
```

If a provider-mode turn asks for one of these capabilities before a provider
contract exists, Helix should fail closed or route through Helix Native policy.
It must not silently substitute a nearby read-only tool or treat a tool receipt
as a terminal answer.

## Implementation Anchors

- Classification:
  `server/services/helix-ask/provider-agent-capability-contract.ts`
- Gateway registry:
  `server/services/helix-ask/workstation-tool-gateway/registry.ts`
- Live environment adapter:
  `server/services/helix-ask/live-environment-tool-adapter.ts`
- Provider capability tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts`

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/explicit-workstation-gateway.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```
