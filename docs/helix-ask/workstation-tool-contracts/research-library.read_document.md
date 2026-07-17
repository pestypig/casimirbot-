# research-library.read_document

Status: draft shared provider capability.

## Purpose

Read bounded page text from a signed-in profile's encrypted Research Library. This capability reuses an already extracted paper and performs no network lookup, PDF refetch, Image Lens action, file mutation, or terminal answer generation.

## Owner

- Capability id: `research-library.read_document`
- Panel: `docs-viewer`
- Action id: `read_research_library_document`
- Permission profile: `read`
- Mode: read/observe

## Admission

- Capability id: `research-library.read_document`
- Mode: `read`
- Permission profile: `read`
- Account boundary: an authoritative profile session is required.
- Exact source: require one of `document_id`, `source_url`, or `source_integrity_hash`.
- Negative constraints: a request that forbids `lookup_papers`, refetching, or Image Lens may still admit this capability because it reads private saved evidence only.

## Negative Admission Cases

The capability must not execute when the profile session is missing, the exact
saved source is absent, the user asks only about hypothetical/future saved
evidence, or the saved-document action is itself negated. Negated network and
Image Lens actions remain blocked independently and must not be substituted.

## Inputs

- Exact identity: `document_id`, `source_url`, or `source_integrity_hash`.
- Optional selection: `query`, exact `page_numbers`, contiguous `page_start` / `page_end`, and `max_pages`.
- Optional exact search: `search_term`, `case_sensitive`.

## Observation

- Schema: `helix.research_library_observation.v1`.
- Contains document metadata, bounded `selected_pages`, exact source-text refs, optional match count/page locations, and evidence state.
- May include up to four bounded paper-evidence sidecar summaries and up to 40 equation candidates per sidecar for the selected pages. These expose revision identity and proposal inputs, not the complete encrypted sidecar.
- Full encrypted page content remains in profile storage; only bounded excerpts enter model context.
- `assistant_answer=false`, `terminal_eligible=false`, and a post-tool model step is required.
- `raw_content_included=false`

## Failure reasons

- `profile_session_required`
- `saved_research_source_required`
- `saved_research_referent_ambiguous`
- `saved_research_document_not_found`
- `saved_research_page_evidence_missing`

## Authority boundary

The observation is scholarly evidence, not an answer. It must re-enter the selected runtime, satisfy the scholarly route product contract, and pass terminal authority before visible text is emitted.

## Host Projection

Allowed projection fields are the document summary, bounded `selected_pages`,
exact source-text refs, match counts, match page locations, bounded equation
candidate/revision summaries, and typed failure codes. Complete decrypted page
arrays, context-candidate arrays, and complete sidecars are not projected.

## Visible Trace

```txt
Tool request: research-library.read_document
Tool observation: bounded saved-page evidence or typed exact-source failure
Model re-entry
Final scholarly answer or typed failure
```

## Tests

- exact saved URL resolves only inside the signed-in profile
- no-session and cross-profile reads fail closed
- page selection and exact-term search remain bounded and page-grounded
- comma-separated negation suppresses lookup, refetch, and Image Lens requests
- tool observation remains non-terminal and requires model re-entry
