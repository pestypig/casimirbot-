# internet-search.search_web

Maturity: `draft`

## Purpose

Search external web sources as bounded internet evidence. This capability is
read-only and provider-dependent. It cannot browse the UI, scrape hidden pages,
mutate files, or answer by itself.

## Owner

- Capability id: `internet-search.search_web`
- Panel: `internet-search`
- Action id: `search_web`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `query`

Optional:

- `providers`
- `domains`
- `recency_days`
- `limit`
- `source_target_intent`

Blocked:

- missing query
- query too broad
- quoted, negated, historical, future, or screen-visible tool mentions
- prompt asking what the text `internet-search.search_web` means

## Observation

Required observation fields:

- `schema`: `helix.internet_search_observation.v1`
- `capability_key`: `internet-search.search_web`
- `capability`: `internet-search.search_web`
- `query`
- `providers_considered`
- `providers_called`
- `evidence_refs`
- `results`
- `domains`
- `recency_days`
- `missing_requirements`
- `provider_configuration_missing`, when applicable
- `selected_for_answer`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Provider missing is a warning or missing-evidence rail, not proof that web
evidence was gathered.

## Host Projection

Allowed metadata:

```txt
support_refs
tool_output_refs
```

Future web result panel affordances must use structured result ids, URLs, and
evidence refs.

## Visible Trace

```txt
Tool request: internet-search.search_web
Tool observation: internet search returned bounded web evidence or missing-provider evidence
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- quoted internet capability text does not execute internet search
- negated internet search does not execute internet search
- missing provider reports missing evidence without false proof
- successful search provides source refs before the final answer cites web
  evidence
