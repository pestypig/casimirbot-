# scholarly-research.fetch_full_text

Maturity: `draft`

## Purpose

Fetch accessible scholarly paper full text from a structured paper result or
explicit source URL, then return bounded compact text chunks. This capability is
an evidence observation only; it cannot answer, solve, or infer values by itself.

## Owner

- Capability id: `scholarly-research.fetch_full_text`
- Panel: `scholarly-research`
- Action id: `fetch_full_text`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- a `paper`, `papers` plus `paper_result_id`, or `source_url`

Optional:

- `query`
- `max_pages`
- `max_chunks`
- `source_target_intent`

Blocked:

- missing paper/source
- inaccessible full text
- source is not PDF, HTML, or text
- extraction returns no bounded text chunks

## Observation

Required observation fields:

- `schema`: `helix.scholarly_full_text_observation.v1`
- `capability_key`: `scholarly-research.fetch_full_text`
- `source_url`
- `source_kind`
- `pages_parsed`
- `page_text_refs`
- `selected_chunks`
- `visual_candidates`
- `missing_requirements`
- `selected_for_answer`
- `context_policy=compact_context_pack_only`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

## Typed Affordances

Consumes:

- `source_ref`

Produces:

- `source_ref`
- `text_evidence`
- `citation_evidence`

## Host Projection

Allowed metadata:

```txt
support_refs
tool_output_refs
selected_chunks
page_text_refs
visual_candidates
```

Raw full text is not projected as answer content. UI/debug surfaces may show
bounded snippets and artifact refs only.

## Visible Trace

```txt
Tool request: scholarly-research.fetch_full_text
Tool observation: bounded full-text chunks or typed missing-full-text diagnostic
Model re-entry
Next tool, final answer, or typed failure
```

## Tests

- accessible HTML/text/PDF source returns bounded chunks and source refs
- missing paper/source fails closed
- no chunk output remains non-terminal and model re-entry is required
