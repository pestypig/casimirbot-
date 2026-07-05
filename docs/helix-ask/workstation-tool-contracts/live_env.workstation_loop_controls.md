# live_env Workstation Loop Controls

Maturity: `draft`

Provider status: `blocked_pending_contract`

## Purpose

Define the provider boundary for the live-environment workstation loop control
family. These controls are operational state changes, not evidence reads. They
remain absent from the Codex/provider gateway until a confirmation, no-op
receipt, and terminal-authority path exists.

## Owner

- Owner surface: Helix Native live environment
- Capability ids:
  - `live_env.pause_workstation_loop`
  - `live_env.resume_workstation_loop`
  - `live_env.set_workstation_loop_state`

Helix Ask owns route admission, permission policy, debug trace identity, and
terminal authority. The live environment owns the actual loop state mutation.
Codex Workstation Mode must not run these controls directly from tool-name text.

## Inputs

A future provider gateway contract must require an explicit affirmative operator
command and bounded state target:

- `live_env.pause_workstation_loop`: target state `paused`
- `live_env.resume_workstation_loop`: target state `running`
- `live_env.set_workstation_loop_state`: explicit `state`, limited to a small
  enum such as `paused`, `running`, or `stopped`

The contract must reject ambiguous wording such as "make it safe" unless route
authority has already selected this exact control with confirmation.

## Observation

When graduated, every admitted, blocked, or no-op request must return a
structured receipt:

```txt
schema=helix.live_environment_control_receipt.v1
capability_key
tool_name
status
permission_decision
requires_confirmation
confirmation_state
requested_state
previous_state?
new_state?
no_op_reason?
blocked_reason?
terminal_eligible=false
assistant_answer=false
raw_content_included=false
post_tool_model_step_required=true
```

The receipt is operational evidence only. It is not a final answer and must be
re-entered into provider reasoning before terminal authority reviews the answer.

## Host Projection

Host loop-state changes must come from structured receipts. Provider final prose
must not be parsed to pause, resume, or set the workstation loop state. If the
host ignores a projection, the final answer may describe the blocked/no-op
status but must not claim the loop changed.

## Visible Trace

Expected trace rows after graduation:

```txt
runtime selected
workstation loop control request
permission or confirmation decision
control receipt or blocked/no-op receipt
model re-entry
terminal authority review
final answer
```

Debug export and latest-turn UI rows must agree on turn id, capability id,
requested state, confirmation state, no-op reason, and terminal blockers.

## Negative Admission Cases

These prompts must not admit loop control:

- "Do not pause the workstation loop; explain what pause would do."
- "Before I resume the loop, list the safety checks."
- "`live_env.pause_workstation_loop` appears in the logs."
- "If we later set the loop state to paused, what should happen?"
- "Historically the operator used resume_workstation_loop."
- "The UI button says pause workstation loop; describe that button."
- "Query loop health, but don't change the loop state."

Mixed intent must split safely: read-only loop-health queries may run their
read gateway tools, while pause/resume/set-state remains blocked until an
affirmative operator command, confirmation policy, and receipt contract are
implemented.

## Tests

Current held-back behavior:

```txt
availability=blocked_pending_contract
permission_class=mutating_control
codex_workstation=false
future_provider=false
gateway_manifest=absent
```

Candidate graduation requires:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/explicit-workstation-gateway.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```

Do not use a broad runtime smoke or all-in-one Node test for this contract.
