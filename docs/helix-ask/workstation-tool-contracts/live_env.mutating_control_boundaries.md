# live_env Mutating Control Boundaries

Maturity: `draft`

Owner surface: Helix Native live environment

Provider status: blocked from Codex/provider gateway

## Purpose

Define the provider-agent boundary for live-environment controls that mutate
workstation state, source bindings, loop state, interpreter configuration, panel
focus, or field-worker execution. These tools are intentionally not shared
gateway capabilities.

## Owner

Helix Native owns these controls. Codex Workstation Mode and future provider
runtimes must treat them as unavailable until a dedicated permission, receipt,
rollback/no-op, and re-entry contract exists for the specific control.

## Capability IDs

```txt
live_pipeline
live_env.start_agent_goal_session
live_env.change_workstation_preset
live_env.set_visual_preset
live_env.set_audio_preset
live_env.bind_workstation_source
live_env.unbind_workstation_source
live_env.pause_workstation_loop
live_env.resume_workstation_loop
live_env.set_workstation_loop_state
live_env.repair_loop
live_env.repair_workstation_source
live_env.update_live_answer_projection
live_env.focus_process_graph
live_env.configure_route_watch
live_env.configure_live_source_watch_job
live_env.configure_interpreter_profile
live_env.spawn_field_worker
```

## Inputs

Provider-mode input must fail closed for these controls until a control-specific
contract exists. Tool names in quoted text, documentation, UI labels, historical
references, future/conditional plans, or negated instructions must not admit the
control.

Graduation requires:

- explicit operator command admission
- explicit permission profile
- confirmation policy for user-visible or live-state side effects
- bounded args owned by the capability module
- no-op or blocked receipt behavior for invalid/missing state

## Observation

If a control is ever graduated, execution must return a structured receipt
observation with:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

Receipts must identify the requested control, resolved arguments, permission
decision, state before/after summary when safe, blocked/no-op reason when
blocked, and any host projection references.

## Host Projection

Host projection is blocked for provider agents until the route/product contract
explicitly permits it. UI focus changes, loop controls, preset changes, source
binding, repairs, route-watch configuration, and field-worker spawning must come
from structured receipts, never from provider final prose.

## Visible Trace

If graduated later, the latest-turn stream must show:

```txt
runtime selected
control request
permission/confirmation decision
control receipt or blocked/no-op receipt
model re-entry
final answer
```

The visible trace and debug export must agree for the same turn id. A receipt is
not a final answer.

## Tests

Current held-back behavior:

```txt
availability=blocked_pending_contract
permission_class=mutating_control
codex_workstation=false
future_provider=false
gateway_manifest=absent
```

Required tests before any provider graduation:

- affirmative command admission for the specific control
- quoted/negated/historical/future/screen-visible negative admission
- confirmation or permission-denied receipt
- blocked/no-op receipt for invalid state
- terminal authority test proving receipt is not final answer
- latest-turn trace/debug export parity
- no final-prose scraping for host projection

Implementation anchors:

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
