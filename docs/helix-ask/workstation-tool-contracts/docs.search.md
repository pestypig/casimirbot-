# docs.search

Maturity: `draft`

## Purpose

Search bounded workspace documentation for evidence. This capability provides
snippets, paths, and evidence refs; it does not open a document or answer from a
path alone.

## Owner

- Capability id: `docs.search`
- Panel: `docs-viewer`
- Action id: `search_docs`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `query`

Optional:

- `paths`
- `max_hits`

Blocked:

- missing query
- broad query with no searchable terms
- prompt asking about the phrase `docs.search` as text only
- future/conditional wording such as "if we search docs later"

## Observation

Required observation fields:

- `schema`: docs search observation schema from the gateway
- `capability_key`: `docs.search`
- `panel_id`: `docs-viewer`
- `action_id`: `search_docs`
- `query`
- `hits` or equivalent bounded evidence list
- `evidence_refs`
- `missing_requirements`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

For current-document prompts, a retained document path may support admission,
but content claims require a materialized docs observation packet with a bounded
excerpt or snippet. A path alone is not document evidence.

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

The action may open or focus a document location only when structured docs
evidence includes that path/line/snippet.

## Visible Trace

```txt
Tool request: docs.search
Tool observation: docs.search returned bounded document evidence
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- focused docs-viewer plus "this document" materializes a docs observation
- no docs observation means no document-content answer
- final prose cannot create open-doc action metadata
- docs+repo compound executes only requested capabilities unless another
  capability is required by an explicit route contract
