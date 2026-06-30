# workstation.active_context

Maturity: `draft`

## Purpose

Read the bounded active workstation context for the current Ask turn. This
capability tells a provider which panel/group context Helix has observed; it
does not grant permission to mutate panel state or answer from unstated panel
content.

## Owner

- Capability id: `workstation.active_context`
- Panel: workstation shell
- Action id: `active_context`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Optional:

- `active_context`
- `panels`
- `focus`
- `doc`
- `reason`

Blocked:

- requests to open, close, focus, or mutate panels through this read capability
- treating a path, panel id, or focus value as content evidence
- quoted or historical mentions of `workstation.active_context`

## Observation

Required observation fields:

- `schema`: `helix.workstation_active_context_observation.v1`
- `capability_key`: `workstation.active_context`
- bounded active panel/group fields
- open panel ids when available
- retained doc path when available
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

A retained path or active panel value is routing context only. A provider must
use a source-specific observation, such as docs search/open evidence, before
answering content claims.

## Host Projection

Allowed metadata:

```txt
support_refs
tool_output_refs
```

The UI may show the context observation in the trace. It must not open/focus
panels as a side effect of this read observation.

## Visible Trace

```txt
Tool request: workstation.active_context
Tool observation: workstation.active_context observed bounded workstation context
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- active context is visible as a non-terminal observation
- retained docs context does not become document-content authority by itself
- final prose cannot create active-context rows or panel actions
