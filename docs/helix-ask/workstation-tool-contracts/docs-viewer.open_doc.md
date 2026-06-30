# docs-viewer.open_doc

Maturity: `draft`

## Purpose

Open or focus a bounded document path in the Docs Viewer as a host-side
affordance. This capability can position the UI, but it does not by itself
prove document content.

## Owner

- Capability id: `docs-viewer.open_doc`
- Panel: `docs-viewer`
- Action id: `open_doc`
- Permission profile: `act`
- Mode: act

## Inputs

Required:

- `path`

Optional:

- `line`
- `anchor`
- `snippet`
- `reason`

Explicit route aliases:

- `docs-viewer.open`
- `docs-viewer.open_doc_by_path`

These aliases are not separate provider gateway tools. They may be admitted
only as aliases that execute the canonical `docs-viewer.open_doc` gateway
receipt, with the requested alias recorded as
`source_target_intent.alias_capability`.

Blocked:

- absolute paths
- paths with `..`
- paths outside allowed docs prefixes
- requests to write, edit, delete, or shell out
- quoted/text-only mentions of `docs-viewer.open_doc`
- quoted, negated, future, or UI-label mentions of docs-viewer open aliases

## Observation

Required receipt fields:

- `schema`: `helix.workstation_ui_action_receipt.v1`
- `capability_key`: `docs-viewer.open_doc`
- `panel_id`: `docs-viewer`
- `action_id`: `open_doc`
- `path`
- optional bounded `line`, `anchor`, or `snippet`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Opening a path is not content evidence. Any answer about document contents must
come from a bounded docs observation, such as `docs.search` or a materialized
current-document excerpt.

## Host Projection

Allowed metadata:

```txt
workstation_actions.kind=open_doc_at_line
doc_path
line
snippet
tool_output_refs
support_refs
```

The host may open/focus the document location when the receipt is valid. It must
not scrape final prose to create the action.

## Visible Trace

```txt
Action request: docs-viewer.open_doc
Action observation: docs-viewer.open_doc observed host-side document receipt
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- valid docs path produces a non-terminal open-doc receipt
- invalid or unsafe paths fail closed
- opening a doc path does not authorize document-content claims
