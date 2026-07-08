# Workstation Notes Side-Effect Actions

Maturity: `draft`

Provider status:

- `workstation-notes.create_note`: `candidate_host_receipt_bridge`
- `workstation-notes.append_to_note`: `blocked_pending_contract`
- `workstation-notes.open`: `blocked_pending_contract`

## Purpose

Define the provider boundary for Workstation Notes actions that create, open, or
append persistent note state. `workstation-notes.create_note` has a narrow Codex
provider host-dispatch receipt bridge for explicit affirmative create commands.
It is not a shared provider gateway manifest tool yet. Append and open remain
fail-closed until their own host-dispatch receipt and confirmation paths exist.

## Owner

- Panel: `workstation-notes`
- Canonical side-effect capability ids:
  - `workstation-notes.create_note`
  - `workstation-notes.append_to_note`
  - `workstation-notes.open`
- Provider-visible aliases:
  - `workstation-notes.create`
- Current read-only companion:
  - `workstation-notes.list_notes`

Helix Ask owns admission, route authority, and debug trace identity. The
Workstation Notes panel owns the host-side projection and persistent note state.
Codex Workstation Mode must not execute these actions directly from lexical
mentions. For the create-note bridge, Codex receives only a structured
`helix.workstation_ui_action_receipt.v1` and `helix.ask.action_envelope.v1`; the
host applies the panel action and later persistence receipts remain the source
of truth.

## Inputs

A provider or future gateway contract must require explicit affirmative
operator intent for the exact side effect:

- create: title plus optional initial text
- append: note id or active-note target plus bounded append text
- open: note id or title, or an explicit request to focus the notes panel

The gateway must normalize aliases before admission:

```txt
workstation-notes.create -> workstation-notes.create_note
```

`workstation-notes.list_notes` may provide metadata refs for target selection,
but a list observation is not permission to create, open, or append.

## Observation

Each admitted or blocked request must return a structured receipt:

```txt
schema=helix.workstation_notes_action_receipt.v1
capability_key
panel_id=workstation-notes
action_id
status
permission_decision
requires_confirmation
confirmation_state
target_note_id?
target_note_title?
created_note_id?
appended_text_ref?
blocked_reason?
terminal_eligible=false
assistant_answer=false
raw_content_included=false
post_tool_model_step_required=true
```

Receipts may include bounded metadata and refs, but not full note bodies. The
current create-note bridge may carry the initial `body` only inside the
structured host action args so the Notes panel can persist the requested note;
debug receipts use refs instead of echoing full note content.

## Host Projection

Create, append, and open are host-side effects. The host projection must be
driven by the structured receipt, not by provider final prose. If the host
ignores the projection, the provider answer must still explain only what was
admitted, blocked, or still needs confirmation.

For the current `workstation-notes.create_note` bridge, the host must dispatch
the `helix.ask.action_envelope.v1` through the workstation action execution
ledger before any legacy parent action callback. A successful dispatch must
produce `helix.workstation_action_receipt.v1` with
`receipt_kind=note_update_receipt`, `panel_id=workstation-notes`, and
`action_id=create_note`. If that receipt is absent, the Ask turn must not claim
the note was saved.

## Live Acceptance Evidence

The create-note bridge is accepted only when a keyed in-app debug export for an
explicit command such as `make a note for me "hh"` shows all of the following
for the same Ask turn:

```txt
active_turn_id
ask_turn_solver_trace.schema=helix.ask_turn_solver_trace.v1
ask_turn_solver_trace.turn_id matches active_turn_id
ask_turn_solver_trace.completed_solver_path=true
ask_turn_solver_trace.final_arbitration.terminal_artifact_kind=note_update_receipt
action_envelope.schema=helix.ask.action_envelope.v1
action_envelope.workstation_actions[].panel_id=workstation-notes
action_envelope.workstation_actions[].action_id=create_note
workstation_gateway_call_results[].capability_id=workstation-notes.create_note
agent_step_loop.iterations[].chosen_capability=workstation-notes.create_note
workspace_action_client_ack[].action_key=workstation-notes.create_note
workspace_action_client_ack[].turn_id matches active_turn_id
workspace_action_client_ack[].receipt_kind=note_update_receipt
workspace_action_client_ack[].persisted=true
workspace_action_client_ack[].state_observed=true
client_receipt_terminal.receipt_kind=note_update_receipt
client_receipt_terminal.turn_id matches active_turn_id
selected_final_answer equals client_receipt_terminal.text
final_answer_source=client_workstation_receipt
terminal_artifact_kind=note_update_receipt
```

The visible final answer may be brief, for example `Note saved.`, but it must be
derived from the receipt terminal state. Model prose such as "session saved" or
"I created the note" is not proof unless the receipt fields above are present.

The copied debug export can be checked directly. The input may be a raw JSON
export or pasted text containing a fenced/embedded debug export object:

```bash
npm run helix:ask:notes-create:acceptance -- path/to/debug-export.json
npm run helix:ask:notes-create:acceptance -- path/to/attachment-or-artifact-directory
npm run helix:ask:notes-create:acceptance -- --json path/to/debug-export.json
```

On failure the checker prints `found:` rows for lifecycle stages that were
proven and `missing:` rows for the first unproven receipt/terminal stages.
The `diagnosis:` label distinguishes `missing_server_action_admission`,
`missing_solver_trace`, `missing_client_persistence_receipt`, and
`missing_receipt_backed_terminal_authority`.

## Visible Trace

Expected trace rows for the create-note bridge and future graduated actions:

```txt
runtime selected
workstation notes action request
permission or confirmation decision
receipt or blocked/no-op receipt
model re-entry
terminal authority review
final answer
```

Debug export and latest-turn UI rows must agree on the same turn id,
capability id, normalized action id, confirmation state, and blocked/no-op
reason.

## Negative Admission Cases

These prompts must not admit a mutating Notes action:

- "Do not create a note; just explain the notes workflow."
- "Before I append to the current note, list the safety checks."
- "`workstation-notes.append_to_note` appears in this document."
- "If we later open the Fusion note, what should happen?"
- "Historically the route used create_note."
- "The screen says create note; describe what that button does."
- "List my notes, but don't open or edit anything."

Mixed intent must split safely: a read-only list request may run
`workstation-notes.list_notes`, while create/open/append remains blocked until
the prompt contains an affirmative operator command and the confirmation
contract is implemented.

## Tests

Current provider behavior:

```txt
workstation-notes.create_note availability=candidate_host_receipt_bridge
workstation-notes.append_to_note availability=blocked_pending_contract
workstation-notes.open availability=blocked_pending_contract
permission_class=user_confirmed_side_effect
codex_workstation=create_note_host_receipt_bridge_only
future_provider=false
gateway_manifest=absent
```

Candidate graduation requires:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/explicit-workstation-gateway.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/codex-provider-capability-lanes.test.ts --pool=forks -t "projects explicit note creation"
npm run helix:ask:discipline:quick
git diff --check
```

Do not use a broad runtime smoke or all-in-one Node test for this contract.
