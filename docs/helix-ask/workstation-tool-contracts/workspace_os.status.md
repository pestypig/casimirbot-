# workspace_os.status

Maturity: `draft`

## Purpose

Read bounded workstation/runtime status as observation-only context. This
capability is useful for diagnosing available gateway surfaces and runtime state,
but it cannot answer content questions by itself.

## Owner

- Capability id: `workspace_os.status`
- Panel: workstation/system
- Action id: `status`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Optional:

- `scope`
- `reason`

Blocked:

- requests that imply shell execution
- requests that ask for filesystem mutation
- contextual mentions of status tools without an affirmative status request

## Observation

Required observation fields:

- `schema`: `helix.workspace_os.status.v1`
- `capability_key`: `workspace_os.status`
- `status`
- bounded status fields supplied by the gateway
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

## Host Projection

Allowed metadata:

```txt
workstation_actions.kind=inspect_workstation_receipt
receipt_ref
tool_output_refs
support_refs
```

The UI may show status rows in the trace. Status rows are not answer authority.

## Visible Trace

```txt
Tool request: workspace_os.status
Tool observation: workspace_os.status observed bounded workstation status
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- status call returns non-terminal observation
- shell/file mutation requests are not admitted through this capability
- status receipt cannot satisfy a content answer unless the route contract
  explicitly asks for status
