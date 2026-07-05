# Workstation Notes List Notes

Maturity: `draft`

Owner surface: Workstation Notes panel

Capability id: `workstation-notes.list_notes`

## Purpose

Expose the Workstation Notes note index to provider runtimes as a bounded,
body-redacted read observation. This contract only lists note references. It
does not create, open, append, rename, delete, set active notes, or answer.

## Owner

- Panel: `workstation-notes`
- Action: `list_notes`
- Gateway schema: `helix.workstation_tool_gateway.capability.v1`
- Observation schema: `helix.workstation_notes_list_observation.v1`

## Permission

```txt
permission_profile_required=read
mutating=false
requires_confirmation=false
shell_access=false
code_mutation=false
terminal_eligible=false
assistant_answer=false
raw_content_included=false
post_tool_model_step_required=true
```

## Inputs

Admit only when bounded notes context is supplied by the Ask turn context
snapshot or explicit gateway args:

- `workspace_context.notes_context`
- `notes_state`
- `notes`
- optional `active_note_id`, `active_note_title`, `note_id`, or `title`

The gateway may return note ids, titles, timestamps, tags, active flags, and
source refs. It must omit note body fields.

## Blocked Inputs

Block with `workstation_notes_context_missing` when no bounded notes context is
available.

The following are not admitted by this contract:

- note bodies or rich text as answer authority
- `body`, `content`, `html`, `text`, or `markdown` passthrough
- create, open, append, rename, delete, or set-active actions
- quoted, negated, historical, future, conditional, or screen-visible mentions
  of mutating Workstation Notes actions

## Observation

Schema: `helix.workstation_notes_list_observation.v1`

Required lifecycle fields:

```txt
schema
capability_key
panel_id=workstation-notes
action_id=list_notes
status
blocked_reason
note_count
notes[]
source_refs[]
omitted_body_fields
terminal_eligible=false
assistant_answer=false
raw_content_included=false
post_tool_model_step_required=true
```

Each `notes[]` item is a metadata reference only:

```txt
id?
title?
updated_at?
created_at?
tags?
active
source_ref
terminal_eligible=false
assistant_answer=false
raw_content_included=false
```

## Host Projection

No host mutation is required. The host may project the returned note references
as selectable metadata, but the provider must not infer note bodies or note
state changes from that projection.

## Visible Trace

Expected trace rows:

```txt
runtime selected
workstation notes list request
gateway admission
body-redacted observation packet
model re-entry
terminal authority review
final answer
```

## Negative Admission Cases

These prompts must not admit mutating note actions:

- "Do not create a note; just tell me what actions exist."
- "Before I append to my notes, explain the boundary."
- "`workstation-notes.append_to_note` is on screen."
- "Tomorrow, open the note called Fusion notes."
- "Historically we used create_note here."

A prompt may admit `workstation-notes.list_notes` only when it affirmatively
asks to list or inspect the notes index, or when the exact gateway capability is
called with bounded notes context.

## Tests

Candidate coverage requires:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```

Do not use a broad runtime smoke or all-in-one Node test for this contract.
