# helix_ask.inspect_capability_catalog

Maturity: `draft`

## Purpose

Read the current governed workstation capability manifest so an agent can
explain which document, scientific-evidence, calculator, theory, runtime, and
presentation workflows are actually available. The catalog is source-agnostic:
it applies to every admitted conformed document or evidence packet rather than
to one paper.

## Owner

- Capability id: `helix_ask.inspect_capability_catalog`
- Panel: agent access
- Action id: `inspect_capability_catalog`
- Permission profile: `observe`
- Mode: observe

Helix owns capability admission, account policy, evidence identity, and
terminal eligibility. The runtime owns post-observation reasoning and answer
composition.

## Inputs

Optional:

- `query`
- `source_target_intent`

Blocked:

- quoted, historical, future, conditional, or negated capability requests
  must not admit unrelated mutating tools
- a catalog request must not execute any capability listed in the catalog
- client-visible panel labels or stale catalog projections must not substitute
  for a current gateway observation

## Observation

Required observation fields:

- `schema`: `helix.capability_catalog_observation.v1`
- `capability_key`: `helix_ask.inspect_capability_catalog`
- `manifest_version`
- `available_capability_count`
- `capability_families`
- bounded `capabilities`
- `unavailable_capabilities`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

The observation is evidence for a later `capability_help_summary`; it is not
answer authority by itself.

## Host Projection

The host may show the catalog count, family prefixes, exact capability ids, and
availability reasons. It must not project a capability as executed merely
because it is listed.

## Visible Trace

```txt
Tool request: helix_ask.inspect_capability_catalog
Gateway admission
Capability catalog observation
Current-turn evidence re-entry
Capability-help summary or actionable typed failure
```

Text and voice projections must preserve the same availability and certainty.

## Tests

Required stable tests:

- listing exposes the exact read-only manifest
- calling returns a nonterminal current-turn observation packet
- the user account policy admits catalog inspection
- the provider classification reports `shared_gateway_now`
- catalog evidence re-enters before `capability_help_summary`
- active document or image context cannot hijack a capability-help request
- negative admission cases do not execute catalog members
