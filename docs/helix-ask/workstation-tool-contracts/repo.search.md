# repo.search

Maturity: `draft`

## Purpose

Search bounded repository paths for implementation evidence. This is read-only
repo evidence, not shell access and not file mutation.

## Owner

- Capability id: `repo.search`
- Panel: `repo-evidence`
- Action id: `search`
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
- mutation or shell requests
- quoted/historical mentions of `repo.search`
- prompt asking what the tool name means rather than requesting a repo search

## Observation

Required observation fields:

- `schema`: repo search observation schema from the gateway
- `capability_key`: `repo.search`
- `panel_id`: `repo-evidence`
- `action_id`: `search`
- `query`
- `hits`
- `evidence_refs`
- `fallback_used` or equivalent backend note when applicable
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Search backend fallback, such as node fallback when ripgrep is unavailable, must
be reported as bounded evidence scope, not hidden.

## Host Projection

Allowed metadata:

```txt
workstation_actions.kind=open_repo_file
path
line
tool_output_refs
support_refs
```

Open-file affordances must come from structured repo hits, not from final prose.

## Visible Trace

```txt
Tool request: repo.search
Tool observation: repo.search returned bounded repo evidence
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- repo.search returns non-terminal evidence
- missing query blocks with a typed observation/failure
- docs+repo compound does not auto-admit theory reflection
- UI/debug and final answer cite the same turn id and evidence refs
