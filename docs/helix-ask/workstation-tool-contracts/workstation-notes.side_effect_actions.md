# Workstation Notes Side-Effect Actions

Maturity: `draft`

Provider status: `blocked_pending_contract`

## Purpose

Define the provider boundary for Workstation Notes actions that create, open, or
append persistent note state. These are not shared Codex/provider gateway tools
yet. They must remain fail-closed until a host-dispatch receipt and confirmation
path exists.

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
mentions.

## Inputs

A future gateway contract must require explicit affirmative operator intent for
the exact side effect:

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

When graduated, each admitted or blocked request must return a structured
receipt:

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

Receipts may include bounded metadata and refs, but not full note bodies.

## Host Projection

Create, append, and open are host-side effects. The host projection must be
driven by the structured receipt, not by provider final prose. If the host
ignores the projection, the provider answer must still explain only what was
admitted, blocked, or still needs confirmation.

## Visible Trace

Expected trace rows after graduation:

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

Current held-back behavior:

```txt
availability=blocked_pending_contract
permission_class=user_confirmed_side_effect
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
